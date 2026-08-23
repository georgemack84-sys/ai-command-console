import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeExceptionRegistrationService,
} from "@/services/learning-constitution";
import type {
  ConflictDetectionResult,
  DurableKnowledgeRecord,
  KnowledgeExceptionRegistrationRequest,
  KnowledgeLifecycleRepository,
} from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001",
  sourceId: "interaction-001",
  sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001",
  observedAt: "2026-08-20T12:00:00.000Z",
};
const alphaScope = { type: "PROJECT", id: "project-alpha" } as const;
const betaScope = { type: "PROJECT", id: "project-beta" } as const;

const record = (
  knowledgeId: string,
  candidateId: string,
  overrides: Partial<DurableKnowledgeRecord> = {},
): DurableKnowledgeRecord => ({
  knowledgeId,
  candidateId,
  content: "Deploy changes after peer review.",
  classification: "PROCEDURE",
  scope: alphaScope,
  lifecycleState: "ACTIVE",
  createdAt: "2026-08-20T12:00:00.000Z",
  effectiveFrom: "2026-08-20T12:00:00.000Z",
  provenance,
  lineage: {
    candidateId,
    observationId: provenance.observationId,
    classificationRationaleCode: "TEST_CLASSIFICATION",
    scopeRationaleCode: "TEST_SCOPE",
    conflictRelationship: "UNRELATED",
    validationOutcome: "VALID",
    decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
  },
  policyVersion: "1.0.0",
  constitutionVersion: "1.0.0",
  ...overrides,
});

const exception = (overrides: Partial<DurableKnowledgeRecord> = {}) => record(
  "knowledge-exception",
  "candidate-exception",
  {
    content: "Emergency production remediation may proceed before peer review.",
    classification: "EXCEPTION",
    lineage: {
      candidateId: "candidate-exception",
      observationId: provenance.observationId,
      classificationRationaleCode: "TEST_CLASSIFICATION",
      scopeRationaleCode: "TEST_SCOPE",
      conflictRelationship: "CREATES_EXCEPTION",
      validationOutcome: "VALID",
      decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
    },
    ...overrides,
  },
);

const conflict = (overrides: Partial<ConflictDetectionResult> = {}): ConflictDetectionResult => ({
  candidateId: "candidate-exception",
  existingKnowledgeId: "knowledge-base",
  relationship: "CREATES_EXCEPTION",
  exceptionTargetKnowledgeId: "knowledge-base",
  confidence: 1,
  status: "ASSESSED",
  scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" },
  provenance: { candidate: provenance, existingKnowledge: provenance },
  reasoningMetadata: {
    rationaleCode: "TEST_EXCEPTION_CONFLICT",
    matchedFields: [],
    detectorId: "test-detector",
    detectorVersion: "1.0.0",
  },
  requiresValidation: false,
  requiresClarification: false,
  requiresApproval: false,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  ...overrides,
});

const request = (
  overrides: Partial<KnowledgeExceptionRegistrationRequest> = {},
): KnowledgeExceptionRegistrationRequest => ({
  baseKnowledgeId: "knowledge-base",
  exceptionKnowledgeId: "knowledge-exception",
  applicabilityCondition: "Only during a verified production incident.",
  reason: "Emergency remediation requires a documented exception.",
  conflictDetection: conflict(),
  ...overrides,
});

const seed = async (repository: InMemoryKnowledgeRepository, exceptionRecord = exception()) => {
  await repository.create(record("knowledge-base", "candidate-base"));
  await repository.create(exceptionRecord);
};

describe("knowledge exception registration", () => {
  it("registers an auditable condition while both knowledge records remain active", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await seed(repository);

    const result = await new KnowledgeExceptionRegistrationService({
      repository,
      auditLedger: ledger,
      now: () => "2026-08-20T14:00:00.000Z",
    }).register(request());

    expect(result).toMatchObject({
      status: "REGISTERED",
      reasonCode: "KNOWLEDGE_EXCEPTION_REGISTERED",
      created: true,
      persistenceEffect: "CREATED",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
      baseRecord: { lifecycleState: "ACTIVE" },
      exceptionRecord: { lifecycleState: "ACTIVE" },
      relationship: { applicabilityCondition: "Only during a verified production incident." },
      auditEvent: { eventType: "KNOWLEDGE_EXCEPTION_REGISTERED" },
    });
    expect(await ledger.findByKnowledgeId("knowledge-base")).toHaveLength(1);
    expect(await ledger.findByKnowledgeId("knowledge-exception")).toHaveLength(1);
  });

  it("is idempotent by exception knowledge ID and does not duplicate its audit event", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await seed(repository);
    const service = new KnowledgeExceptionRegistrationService({ repository, auditLedger: ledger });

    await service.register(request());
    const replay = await service.register(request());

    expect(replay).toMatchObject({ status: "REGISTERED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(await ledger.findByKnowledgeId("knowledge-base")).toHaveLength(1);
  });

  it.each([
    ["requires exception classification", exception({ classification: "PROCEDURE" }), request(), "EXCEPTION_NOT_CLASSIFIED"],
    ["requires a condition", exception(), request({ applicabilityCondition: "  " }), "APPLICABILITY_CONDITION_MISSING"],
    ["requires compatible scope", exception({ scope: betaScope }), request(), "SCOPE_INCOMPATIBLE"],
    ["requires explicit conflict linkage", exception(), request({ conflictDetection: conflict({ exceptionTargetKnowledgeId: "other" }) }), "EXCEPTION_REFERENCE_MISMATCH"],
    ["requires exception lineage", exception({ lineage: { ...exception().lineage, conflictRelationship: "QUALIFIES" } }), request(), "LINEAGE_INCONSISTENT"],
  ])("%s", async (_description, exceptionRecord, invalidRequest, reasonCode) => {
    const repository = new InMemoryKnowledgeRepository();
    await seed(repository, exceptionRecord);
    const result = await new KnowledgeExceptionRegistrationService({
      repository,
      auditLedger: new InMemoryKnowledgeAuditLedger(),
    }).register(invalidRequest);

    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
    expect((await repository.getById("knowledge-base"))?.lifecycleState).toBe("ACTIVE");
  });

  it("fails closed when registration cannot persist", async () => {
    const backingRepository = new InMemoryKnowledgeRepository();
    await seed(backingRepository);
    const failingRepository: KnowledgeLifecycleRepository = {
      create: (value) => backingRepository.create(value),
      getById: (id) => backingRepository.getById(id),
      findByCandidateId: (id) => backingRepository.findByCandidateId(id),
      supersede: (transition) => backingRepository.supersede(transition),
      findSupersessionByReplacementId: (id) => backingRepository.findSupersessionByReplacementId(id),
      registerException: async () => { throw new Error("simulated persistence failure"); },
      findExceptionByKnowledgeId: (id) => backingRepository.findExceptionByKnowledgeId(id),
      transitionLifecycle: (transition) => backingRepository.transitionLifecycle(transition),
    };

    const result = await new KnowledgeExceptionRegistrationService({
      repository: failingRepository,
      auditLedger: new InMemoryKnowledgeAuditLedger(),
    }).register(request());

    expect(result).toMatchObject({ status: "PERSISTENCE_FAILED", persistenceEffect: "NONE" });
    expect(await backingRepository.findExceptionByKnowledgeId("knowledge-exception")).toBeUndefined();
  });
});
