import type {
  KnowledgeAuditLedger,
  KnowledgeLifecycleRepository,
  KnowledgeSupersededAuditEvent,
  KnowledgeSupersession,
  KnowledgeSupersessionReasonCode,
  KnowledgeSupersessionRequest,
  KnowledgeSupersessionResult,
  KnowledgeSupersessionService as KnowledgeSupersessionServiceContract,
} from "../../types/learning-constitution/durableKnowledge";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

export const KNOWLEDGE_SUPERSESSION_SERVICE_ID = "phase-0-knowledge-supersession-service";

type SupersessionDependencies = Readonly<{
  repository: KnowledgeLifecycleRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
  createSupersessionId?: (replacementKnowledgeId: string) => string;
  createAuditEventId?: (supersessionId: string) => string;
}>;

const result = (
  status: KnowledgeSupersessionResult["status"],
  reasonCode: KnowledgeSupersessionReasonCode,
  values: Pick<KnowledgeSupersessionResult, "priorRecord" | "replacementRecord" | "relationship" | "auditEvent" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeSupersessionResult => ({
  status,
  reasonCode,
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const rejected = (reasonCode: KnowledgeSupersessionReasonCode): KnowledgeSupersessionResult =>
  result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });

export class KnowledgeSupersessionService implements KnowledgeSupersessionServiceContract {
  private readonly inFlightSupersessions = new Map<string, Promise<KnowledgeSupersessionResult>>();
  private readonly now: () => string;
  private readonly createSupersessionId: (replacementKnowledgeId: string) => string;
  private readonly createAuditEventId: (supersessionId: string) => string;

  constructor(private readonly dependencies: SupersessionDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createSupersessionId = dependencies.createSupersessionId ?? ((id) => `supersession:${id}`);
    this.createAuditEventId = dependencies.createAuditEventId ?? ((id) => `audit:${id}`);
  }

  async supersede(request: KnowledgeSupersessionRequest): Promise<KnowledgeSupersessionResult> {
    const existingOperation = this.inFlightSupersessions.get(request.replacementKnowledgeId);
    if (existingOperation) return existingOperation;

    const operation = this.supersedeOnce(request);
    this.inFlightSupersessions.set(request.replacementKnowledgeId, operation);
    try {
      return await operation;
    } finally {
      this.inFlightSupersessions.delete(request.replacementKnowledgeId);
    }
  }

  private async supersedeOnce(request: KnowledgeSupersessionRequest): Promise<KnowledgeSupersessionResult> {
    const prior = await this.dependencies.repository.getById(request.priorKnowledgeId);
    if (!prior) return rejected("PRIOR_KNOWLEDGE_NOT_FOUND");
    const replacement = await this.dependencies.repository.getById(request.replacementKnowledgeId);
    if (!replacement) return rejected("REPLACEMENT_KNOWLEDGE_NOT_FOUND");

    const existing = await this.dependencies.repository.findSupersessionByReplacementId(request.replacementKnowledgeId);
    if (existing) {
      if (existing.priorKnowledgeId !== request.priorKnowledgeId) {
        return rejected("CORRECTION_REFERENCE_MISMATCH");
      }
      return result("SUPERSEDED", "IDEMPOTENT_REPLAY", {
        priorRecord: prior,
        replacementRecord: replacement,
        relationship: existing,
        created: false,
        idempotentReplay: true,
        persistenceEffect: "NONE",
      });
    }

    if (prior.lifecycleState !== "ACTIVE") return rejected("PRIOR_KNOWLEDGE_NOT_ACTIVE");
    if (replacement.lifecycleState !== "ACTIVE") return rejected("REPLACEMENT_KNOWLEDGE_NOT_ACTIVE");
    if (replacement.classification !== "CORRECTION") return rejected("REPLACEMENT_NOT_CORRECTION");
    if (
      request.conflictDetection.candidateId !== replacement.candidateId ||
      request.conflictDetection.existingKnowledgeId !== prior.knowledgeId ||
      request.conflictDetection.relationship !== "CORRECTS" ||
      request.conflictDetection.correctionTargetKnowledgeId !== prior.knowledgeId
    ) {
      return rejected("CORRECTION_REFERENCE_MISMATCH");
    }
    if (request.conflictDetection.authorityEffect !== "UNCHANGED") {
      return rejected("AUTHORITY_EFFECT_VIOLATION");
    }
    if (evaluateScopeCompatibility(prior.scope, replacement.scope).outcome !== "COMPATIBLE") {
      return rejected("SCOPE_INCOMPATIBLE");
    }
    if (
      replacement.lineage.conflictRelationship !== "CORRECTS" ||
      replacement.lineage.decisionReasonCode !== "ACCEPTED_FOR_ADMISSION" ||
      !prior.policyVersion ||
      !prior.constitutionVersion ||
      !replacement.policyVersion ||
      !replacement.constitutionVersion
    ) {
      return rejected("LINEAGE_INCONSISTENT");
    }

    const now = this.now();
    const relationship: KnowledgeSupersession = {
      supersessionId: this.createSupersessionId(replacement.knowledgeId),
      priorKnowledgeId: prior.knowledgeId,
      replacementKnowledgeId: replacement.knowledgeId,
      reason: request.reason,
      occurredAt: now,
      provenance: replacement.provenance,
      policyVersion: replacement.policyVersion,
      constitutionVersion: replacement.constitutionVersion,
    };

    try {
      const transition = await this.dependencies.repository.supersede({
        priorKnowledgeId: prior.knowledgeId,
        replacementKnowledgeId: replacement.knowledgeId,
        relationship,
      });
      const auditEvent: KnowledgeSupersededAuditEvent = {
        eventId: this.createAuditEventId(relationship.supersessionId),
        eventType: "KNOWLEDGE_SUPERSEDED",
        supersessionId: relationship.supersessionId,
        priorKnowledgeId: transition.priorRecord.knowledgeId,
        replacementKnowledgeId: transition.replacementRecord.knowledgeId,
        occurredAt: now,
        policyVersion: relationship.policyVersion,
        constitutionVersion: relationship.constitutionVersion,
        provenance: relationship.provenance,
      };
      const emittedAuditEvent = await this.dependencies.auditLedger.append(auditEvent);
      return result("SUPERSEDED", "KNOWLEDGE_SUPERSEDED", {
        priorRecord: transition.priorRecord,
        replacementRecord: transition.replacementRecord,
        relationship: transition.relationship,
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
