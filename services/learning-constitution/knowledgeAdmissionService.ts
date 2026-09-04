import type {
  DurableKnowledgeRecord,
  KnowledgeAdmittedAuditEvent,
  KnowledgeAdmissionReasonCode,
  KnowledgeAdmissionRequest,
  KnowledgeAdmissionResult,
  KnowledgeAdmissionService as KnowledgeAdmissionServiceContract,
  KnowledgeAuditLedger,
  KnowledgeRepository,
} from "../../types/learning-constitution/durableKnowledge";

export const KNOWLEDGE_ADMISSION_SERVICE_ID = "phase-0-knowledge-admission-service";

type AdmissionDependencies = Readonly<{
  repository: KnowledgeRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
  createKnowledgeId?: (candidateId: string) => string;
  createAuditEventId?: (knowledgeId: string) => string;
}>;

const sameProvenance = (
  left: KnowledgeAdmissionRequest["candidate"]["provenance"],
  right: KnowledgeAdmissionRequest["candidate"]["provenance"],
): boolean =>
  left.observationId === right.observationId &&
  left.sourceId === right.sourceId &&
  left.sourceType === right.sourceType &&
  left.originatingActorId === right.originatingActorId &&
  left.observedAt === right.observedAt;

const result = (
  status: KnowledgeAdmissionResult["status"],
  reasonCode: KnowledgeAdmissionReasonCode,
  values: Pick<KnowledgeAdmissionResult, "knowledgeRecord" | "auditEvent" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeAdmissionResult => ({
  status,
  reasonCode,
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const rejection = (
  reasonCode: KnowledgeAdmissionReasonCode,
): KnowledgeAdmissionResult => result("REJECTED", reasonCode, {
  created: false,
  idempotentReplay: false,
  persistenceEffect: "NONE",
});

const verifyAdmission = (
  request: KnowledgeAdmissionRequest,
): KnowledgeAdmissionReasonCode | undefined => {
  if (request.decision.disposition !== "ACCEPT") return "DECISION_NOT_ACCEPTED";
  if (!request.decision.durableAdmissionEligible) return "ADMISSION_NOT_ELIGIBLE";
  if (request.scopeResolution.status !== "RESOLVED" || !request.scopeResolution.scope) {
    return "SCOPE_UNRESOLVED";
  }
  if (!request.decision.policyVersion) return "POLICY_VERSION_MISSING";
  if (!request.decision.constitutionVersion) return "CONSTITUTION_VERSION_MISSING";
  if (
    request.classification.authorityEffect !== "UNCHANGED" ||
    request.scopeResolution.authorityEffect !== "UNCHANGED" ||
    request.conflictDetection.authorityEffect !== "UNCHANGED" ||
    request.validation.authorityEffect !== "UNCHANGED" ||
    request.decision.authorityEffect !== "UNCHANGED" ||
    request.classification.executionPermissionGranted ||
    request.validation.executionPermissionGranted ||
    request.decision.executionPermissionGranted
  ) {
    return "AUTHORITY_EFFECT_VIOLATION";
  }
  if (
    request.candidate.candidateId !== request.decision.candidateId ||
    request.candidate.candidateId !== request.validation.candidateId ||
    request.candidate.candidateId !== request.conflictDetection.candidateId ||
    request.candidate.classification !== request.classification.classification ||
    !sameProvenance(request.candidate.provenance, request.classification.provenance) ||
    !sameProvenance(request.candidate.provenance, request.scopeResolution.provenance) ||
    !sameProvenance(request.candidate.provenance, request.validation.provenance) ||
    !sameProvenance(request.candidate.provenance, request.decision.provenance)
  ) {
    return "LINEAGE_INCONSISTENT";
  }

  return undefined;
};

export class KnowledgeAdmissionService implements KnowledgeAdmissionServiceContract {
  private readonly inFlightAdmissions = new Map<string, Promise<KnowledgeAdmissionResult>>();
  private readonly now: () => string;
  private readonly createKnowledgeId: (candidateId: string) => string;
  private readonly createAuditEventId: (knowledgeId: string) => string;

  constructor(private readonly dependencies: AdmissionDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createKnowledgeId = dependencies.createKnowledgeId ?? ((candidateId) => `knowledge:${candidateId}`);
    this.createAuditEventId = dependencies.createAuditEventId ?? ((knowledgeId) => `audit:${knowledgeId}`);
  }

  async admit(request: KnowledgeAdmissionRequest): Promise<KnowledgeAdmissionResult> {
    const existingOperation = this.inFlightAdmissions.get(request.candidate.candidateId);
    if (existingOperation) return existingOperation;

    const operation = this.admitOnce(request);
    this.inFlightAdmissions.set(request.candidate.candidateId, operation);
    try {
      return await operation;
    } finally {
      this.inFlightAdmissions.delete(request.candidate.candidateId);
    }
  }

  private async admitOnce(request: KnowledgeAdmissionRequest): Promise<KnowledgeAdmissionResult> {
    const verificationFailure = verifyAdmission(request);
    if (verificationFailure) return rejection(verificationFailure);

    const existing = await this.dependencies.repository.findByCandidateId(request.candidate.candidateId);
    if (existing) {
      return result("ADMITTED", "IDEMPOTENT_REPLAY", {
        knowledgeRecord: existing,
        created: false,
        idempotentReplay: true,
        persistenceEffect: "NONE",
      });
    }

    const now = this.now();
    const record: DurableKnowledgeRecord = {
      knowledgeId: this.createKnowledgeId(request.candidate.candidateId),
      candidateId: request.candidate.candidateId,
      content: request.candidate.content,
      classification: request.candidate.classification,
      scope: request.scopeResolution.scope!,
      lifecycleState: "ACTIVE",
      createdAt: now,
      effectiveFrom: now,
      provenance: request.candidate.provenance,
      lineage: {
        candidateId: request.candidate.candidateId,
        observationId: request.candidate.provenance.observationId,
        classificationRationaleCode: request.classification.reasoningMetadata.rationaleCode,
        scopeRationaleCode: request.scopeResolution.reasoningMetadata.rationaleCode,
        conflictRelationship: request.conflictDetection.relationship,
        validationOutcome: request.validation.outcome,
        decisionReasonCode: request.decision.reasonCode,
      },
      policyVersion: request.decision.policyVersion,
      constitutionVersion: request.decision.constitutionVersion,
    };

    try {
      const persisted = await this.dependencies.repository.create(record);
      const auditEvent: KnowledgeAdmittedAuditEvent = {
        eventId: this.createAuditEventId(persisted.knowledgeId),
        eventType: "KNOWLEDGE_ADMITTED",
        knowledgeId: persisted.knowledgeId,
        candidateId: persisted.candidateId,
        occurredAt: now,
        decisionReasonCode: request.decision.reasonCode,
        policyVersion: persisted.policyVersion,
        constitutionVersion: persisted.constitutionVersion,
        provenance: persisted.provenance,
      };
      const emittedAuditEvent = await this.dependencies.auditLedger.append(auditEvent);
      return result("ADMITTED", "KNOWLEDGE_ADMITTED", {
        knowledgeRecord: persisted,
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
