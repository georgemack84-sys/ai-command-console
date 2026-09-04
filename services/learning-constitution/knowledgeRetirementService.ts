import type {
  KnowledgeAuditLedger,
  KnowledgeLifecycleChangedAuditEvent,
  KnowledgeLifecycleRepository,
  KnowledgeRetirementReasonCode,
  KnowledgeRetirementRequest,
  KnowledgeRetirementResult,
  KnowledgeRetirementService as KnowledgeRetirementServiceContract,
} from "../../types/learning-constitution/durableKnowledge";

export const KNOWLEDGE_RETIREMENT_SERVICE_ID = "phase-0-knowledge-retirement-service";

type RetirementDependencies = Readonly<{
  repository: KnowledgeLifecycleRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
  createAuditEventId?: (knowledgeId: string, state: "ARCHIVED" | "QUARANTINED") => string;
}>;

const result = (
  status: KnowledgeRetirementResult["status"],
  reasonCode: KnowledgeRetirementReasonCode,
  values: Pick<KnowledgeRetirementResult, "priorRecord" | "updatedRecord" | "auditEvent" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeRetirementResult => ({
  status,
  reasonCode,
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const rejected = (reasonCode: KnowledgeRetirementReasonCode): KnowledgeRetirementResult =>
  result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });

export class KnowledgeRetirementService implements KnowledgeRetirementServiceContract {
  private readonly inFlightTransitions = new Map<string, Promise<KnowledgeRetirementResult>>();
  private readonly now: () => string;
  private readonly createAuditEventId: (knowledgeId: string, state: "ARCHIVED" | "QUARANTINED") => string;

  constructor(private readonly dependencies: RetirementDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createAuditEventId = dependencies.createAuditEventId ?? ((id, state) => `audit:${state.toLowerCase()}:${id}`);
  }

  async transition(request: KnowledgeRetirementRequest): Promise<KnowledgeRetirementResult> {
    const key = `${request.knowledgeId}:${request.targetLifecycleState}`;
    const inFlight = this.inFlightTransitions.get(key);
    if (inFlight) return inFlight;
    const operation = this.transitionOnce(request);
    this.inFlightTransitions.set(key, operation);
    try {
      return await operation;
    } finally {
      this.inFlightTransitions.delete(key);
    }
  }

  private async transitionOnce(request: KnowledgeRetirementRequest): Promise<KnowledgeRetirementResult> {
    const record = await this.dependencies.repository.getById(request.knowledgeId);
    if (!record) return rejected("KNOWLEDGE_NOT_FOUND");
    if (!request.reason.trim()) return rejected("RETIREMENT_REASON_MISSING");
    if (!record.policyVersion || !record.constitutionVersion || !record.lineage.candidateId) {
      return rejected("LINEAGE_INCONSISTENT");
    }
    if (record.lifecycleState === request.targetLifecycleState) {
      return result("TRANSITIONED", "IDEMPOTENT_REPLAY", {
        priorRecord: record,
        updatedRecord: record,
        created: false,
        idempotentReplay: true,
        persistenceEffect: "NONE",
      });
    }
    if (record.lifecycleState !== "ACTIVE") return rejected("KNOWLEDGE_NOT_ACTIVE");

    const occurredAt = this.now();
    const eventType = request.targetLifecycleState === "ARCHIVED"
      ? "KNOWLEDGE_ARCHIVED" as const
      : "KNOWLEDGE_QUARANTINED" as const;
    try {
      const transition = await this.dependencies.repository.transitionLifecycle({
        knowledgeId: record.knowledgeId,
        newLifecycleState: request.targetLifecycleState,
      });
      const auditEvent: KnowledgeLifecycleChangedAuditEvent = {
        eventId: this.createAuditEventId(record.knowledgeId, request.targetLifecycleState),
        eventType,
        knowledgeId: record.knowledgeId,
        priorLifecycleState: "ACTIVE",
        newLifecycleState: request.targetLifecycleState,
        reason: request.reason.trim(),
        occurredAt,
        policyVersion: record.policyVersion,
        constitutionVersion: record.constitutionVersion,
        provenance: record.provenance,
      };
      const emittedAuditEvent = await this.dependencies.auditLedger.append(auditEvent);
      return result("TRANSITIONED", eventType, {
        priorRecord: transition.priorRecord,
        updatedRecord: transition.updatedRecord,
        auditEvent: emittedAuditEvent,
        created: true,
        idempotentReplay: false,
        persistenceEffect: "UPDATED",
      });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", {
        created: false,
        idempotentReplay: false,
        persistenceEffect: "NONE",
      });
    }
  }
}
