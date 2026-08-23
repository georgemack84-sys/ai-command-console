import type {
  KnowledgeAuditLedger,
  KnowledgeException,
  KnowledgeExceptionRegisteredAuditEvent,
  KnowledgeExceptionRegistrationReasonCode,
  KnowledgeExceptionRegistrationRequest,
  KnowledgeExceptionRegistrationService as KnowledgeExceptionRegistrationServiceContract,
  KnowledgeExceptionRegistrationServiceResult,
  KnowledgeLifecycleRepository,
} from "../../types/learning-constitution/durableKnowledge";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

export const KNOWLEDGE_EXCEPTION_REGISTRATION_SERVICE_ID = "phase-0-knowledge-exception-registration-service";

type ExceptionRegistrationDependencies = Readonly<{
  repository: KnowledgeLifecycleRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
  createExceptionId?: (exceptionKnowledgeId: string) => string;
  createAuditEventId?: (exceptionId: string) => string;
}>;

const result = (
  status: KnowledgeExceptionRegistrationServiceResult["status"],
  reasonCode: KnowledgeExceptionRegistrationReasonCode,
  values: Pick<KnowledgeExceptionRegistrationServiceResult, "baseRecord" | "exceptionRecord" | "relationship" | "auditEvent" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeExceptionRegistrationServiceResult => ({
  status,
  reasonCode,
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const rejected = (
  reasonCode: KnowledgeExceptionRegistrationReasonCode,
): KnowledgeExceptionRegistrationServiceResult => result("REJECTED", reasonCode, {
  created: false,
  idempotentReplay: false,
  persistenceEffect: "NONE",
});

export class KnowledgeExceptionRegistrationService implements KnowledgeExceptionRegistrationServiceContract {
  private readonly inFlightRegistrations = new Map<string, Promise<KnowledgeExceptionRegistrationServiceResult>>();
  private readonly now: () => string;
  private readonly createExceptionId: (exceptionKnowledgeId: string) => string;
  private readonly createAuditEventId: (exceptionId: string) => string;

  constructor(private readonly dependencies: ExceptionRegistrationDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createExceptionId = dependencies.createExceptionId ?? ((id) => `exception:${id}`);
    this.createAuditEventId = dependencies.createAuditEventId ?? ((id) => `audit:${id}`);
  }

  async register(
    request: KnowledgeExceptionRegistrationRequest,
  ): Promise<KnowledgeExceptionRegistrationServiceResult> {
    const inFlight = this.inFlightRegistrations.get(request.exceptionKnowledgeId);
    if (inFlight) return inFlight;

    const operation = this.registerOnce(request);
    this.inFlightRegistrations.set(request.exceptionKnowledgeId, operation);
    try {
      return await operation;
    } finally {
      this.inFlightRegistrations.delete(request.exceptionKnowledgeId);
    }
  }

  private async registerOnce(
    request: KnowledgeExceptionRegistrationRequest,
  ): Promise<KnowledgeExceptionRegistrationServiceResult> {
    const base = await this.dependencies.repository.getById(request.baseKnowledgeId);
    if (!base) return rejected("BASE_KNOWLEDGE_NOT_FOUND");
    const exception = await this.dependencies.repository.getById(request.exceptionKnowledgeId);
    if (!exception) return rejected("EXCEPTION_KNOWLEDGE_NOT_FOUND");

    const existing = await this.dependencies.repository.findExceptionByKnowledgeId(request.exceptionKnowledgeId);
    if (existing) {
      if (existing.baseKnowledgeId !== request.baseKnowledgeId) return rejected("EXCEPTION_REFERENCE_MISMATCH");
      return result("REGISTERED", "IDEMPOTENT_REPLAY", {
        baseRecord: base,
        exceptionRecord: exception,
        relationship: existing,
        created: false,
        idempotentReplay: true,
        persistenceEffect: "NONE",
      });
    }

    if (base.lifecycleState !== "ACTIVE") return rejected("BASE_KNOWLEDGE_NOT_ACTIVE");
    if (exception.lifecycleState !== "ACTIVE") return rejected("EXCEPTION_KNOWLEDGE_NOT_ACTIVE");
    if (exception.classification !== "EXCEPTION") return rejected("EXCEPTION_NOT_CLASSIFIED");
    if (!request.applicabilityCondition.trim()) return rejected("APPLICABILITY_CONDITION_MISSING");
    if (
      request.conflictDetection.candidateId !== exception.candidateId ||
      request.conflictDetection.existingKnowledgeId !== base.knowledgeId ||
      request.conflictDetection.relationship !== "CREATES_EXCEPTION" ||
      request.conflictDetection.exceptionTargetKnowledgeId !== base.knowledgeId
    ) return rejected("EXCEPTION_REFERENCE_MISMATCH");
    if (request.conflictDetection.authorityEffect !== "UNCHANGED") {
      return rejected("AUTHORITY_EFFECT_VIOLATION");
    }
    if (evaluateScopeCompatibility(base.scope, exception.scope).outcome !== "COMPATIBLE") {
      return rejected("SCOPE_INCOMPATIBLE");
    }
    if (
      exception.lineage.conflictRelationship !== "CREATES_EXCEPTION" ||
      exception.lineage.decisionReasonCode !== "ACCEPTED_FOR_ADMISSION" ||
      !base.policyVersion ||
      !base.constitutionVersion ||
      !exception.policyVersion ||
      !exception.constitutionVersion
    ) return rejected("LINEAGE_INCONSISTENT");

    const occurredAt = this.now();
    const relationship: KnowledgeException = {
      exceptionId: this.createExceptionId(exception.knowledgeId),
      baseKnowledgeId: base.knowledgeId,
      exceptionKnowledgeId: exception.knowledgeId,
      applicabilityCondition: request.applicabilityCondition.trim(),
      reason: request.reason,
      occurredAt,
      provenance: exception.provenance,
      policyVersion: exception.policyVersion,
      constitutionVersion: exception.constitutionVersion,
    };

    try {
      const registration = await this.dependencies.repository.registerException({
        baseKnowledgeId: base.knowledgeId,
        exceptionKnowledgeId: exception.knowledgeId,
        relationship,
      });
      const auditEvent: KnowledgeExceptionRegisteredAuditEvent = {
        eventId: this.createAuditEventId(relationship.exceptionId),
        eventType: "KNOWLEDGE_EXCEPTION_REGISTERED",
        exceptionId: relationship.exceptionId,
        baseKnowledgeId: registration.baseRecord.knowledgeId,
        exceptionKnowledgeId: registration.exceptionRecord.knowledgeId,
        occurredAt,
        policyVersion: relationship.policyVersion,
        constitutionVersion: relationship.constitutionVersion,
        provenance: relationship.provenance,
      };
      const emittedAuditEvent = await this.dependencies.auditLedger.append(auditEvent);
      return result("REGISTERED", "KNOWLEDGE_EXCEPTION_REGISTERED", {
        baseRecord: registration.baseRecord,
        exceptionRecord: registration.exceptionRecord,
        relationship: registration.relationship,
        auditEvent: emittedAuditEvent,
        created: true,
        idempotentReplay: false,
        persistenceEffect: "CREATED",
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
