import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeSupersessionService,
} from "@/services/learning-constitution";
import type {
  ConflictDetectionResult,
  DurableKnowledgeRecord,
  KnowledgeLifecycleRepository,
  KnowledgeSupersessionRequest,
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
  content: "Project Alpha uses PostgreSQL.",
  classification: "PROJECT_DECISION",
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

const correction = (overrides: Partial<DurableKnowledgeRecord> = {}) => record(
  "knowledge-correction",
  "candidate-correction",
  {
    content: "Project Alpha uses PostgreSQL 16.",
    classification: "CORRECTION",
    lineage: {
      candidateId: "candidate-correction",
      observationId: provenance.observationId,
      classificationRationaleCode: "TEST_CLASSIFICATION",
      scopeRationaleCode: "TEST_SCOPE",
      conflictRelationship: "CORRECTS",
      validationOutcome: "VALID",
      decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
    },
    ...overrides,
  },
);

const conflict = (overrides: Partial<ConflictDetectionResult> = {}): ConflictDetectionResult => ({
  candidateId: "candidate-correction",
  existingKnowledgeId: "knowledge-prior",
  relationship: "CORRECTS",
  correctionTargetKnowledgeId: "knowledge-prior",
  confidence: 1,
  status: "ASSESSED",
  scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" },
  provenance: { candidate: provenance, existingKnowledge: provenance },
  reasoningMetadata: {
    rationaleCode: "TEST_CONFLICT",
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

const request = (overrides: Partial<KnowledgeSupersessionRequest> = {}): KnowledgeSupersessionRequest => ({
  priorKnowledgeId: "knowledge-prior",
  replacementKnowledgeId: "knowledge-correction",
  reason: "Verified correction from the operator.",
  conflictDetection: conflict(),
  ...overrides,
});

const seed = async (repository: InMemoryKnowledgeRepository, replacement = correction()) => {
  await repository.create(record("knowledge-prior", "candidate-prior"));
  await repository.create(replacement);
};

describe("knowledge supersession", () => {
  it("preserves prior history, keeps the correction active, and emits an audit event", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await seed(repository);
    const service = new KnowledgeSupersessionService({
      repository,
      auditLedger: ledger,
      now: () => "2026-08-20T13:00:00.000Z",
    });

    const result = await service.supersede(request());

    expect(result).toMatchObject({
      status: "SUPERSEDED",
      reasonCode: "KNOWLEDGE_SUPERSEDED",
      created: true,
      persistenceEffect: "UPDATED",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
      priorRecord: { knowledgeId: "knowledge-prior", lifecycleState: "SUPERSEDED" },
      replacementRecord: { knowledgeId: "knowledge-correction", lifecycleState: "ACTIVE" },
      relationship: { priorKnowledgeId: "knowledge-prior", replacementKnowledgeId: "knowledge-correction" },
      auditEvent: { eventType: "KNOWLEDGE_SUPERSEDED" },
    });
    expect((await repository.getById("knowledge-prior"))?.content).toBe("Project Alpha uses PostgreSQL.");
    expect(await ledger.findByKnowledgeId("knowledge-prior")).toHaveLength(1);
    expect(await ledger.findByKnowledgeId("knowledge-correction")).toHaveLength(1);
  });

  it("is idempotent by replacement record and does not duplicate audit history", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await seed(repository);
    const service = new KnowledgeSupersessionService({ repository, auditLedger: ledger });

    await service.supersede(request());
    const replay = await service.supersede(request());

    expect(replay).toMatchObject({
      status: "SUPERSEDED",
      reasonCode: "IDEMPOTENT_REPLAY",
      created: false,
      idempotentReplay: true,
      persistenceEffect: "NONE",
    });
    expect(await ledger.findByKnowledgeId("knowledge-prior")).toHaveLength(1);
  });

  it.each([
    ["requires an admitted correction", correction({ classification: "PROJECT_DECISION" }), request(), "REPLACEMENT_NOT_CORRECTION"],
    ["requires compatible scope", correction({ scope: betaScope }), request(), "SCOPE_INCOMPATIBLE"],
    ["requires conflict linkage", correction(), request({ conflictDetection: conflict({ correctionTargetKnowledgeId: "other" }) }), "CORRECTION_REFERENCE_MISMATCH"],
    ["requires correction lineage", correction({ lineage: { ...correction().lineage, conflictRelationship: "CONTRADICTS" } }), request(), "LINEAGE_INCONSISTENT"],
    ["requires versioned prior knowledge", correction(), request(), "LINEAGE_INCONSISTENT"],
    ["rejects authority effects", correction(), request({
      conflictDetection: conflict({ authorityEffect: "PROPOSED" as never }),
    }), "AUTHORITY_EFFECT_VIOLATION"],
  ])("%s", async (description, replacement, invalidRequest, reasonCode) => {
    const repository = new InMemoryKnowledgeRepository();
    await seed(repository, replacement);
    if (description === "requires versioned prior knowledge") {
      await repository.create(record("knowledge-prior-unversioned", "candidate-prior-unversioned", {
        policyVersion: "",
      }));
    }
    const result = await new KnowledgeSupersessionService({
      repository,
      auditLedger: new InMemoryKnowledgeAuditLedger(),
    }).supersede(description === "requires versioned prior knowledge"
      ? request({ priorKnowledgeId: "knowledge-prior-unversioned", conflictDetection: conflict({
        existingKnowledgeId: "knowledge-prior-unversioned",
        correctionTargetKnowledgeId: "knowledge-prior-unversioned",
      }) })
      : invalidRequest);

    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
    expect((await repository.getById("knowledge-prior"))?.lifecycleState).toBe("ACTIVE");
  });

  it("fails closed when the lifecycle transition cannot persist", async () => {
    const backingRepository = new InMemoryKnowledgeRepository();
    await seed(backingRepository);
    const failingRepository: KnowledgeLifecycleRepository = {
      create: (value) => backingRepository.create(value),
      getById: (id) => backingRepository.getById(id),
      findByCandidateId: (id) => backingRepository.findByCandidateId(id),
      findSupersessionByReplacementId: (id) => backingRepository.findSupersessionByReplacementId(id),
      supersede: async () => { throw new Error("simulated persistence failure"); },
      registerException: (transition) => backingRepository.registerException(transition),
      findExceptionByKnowledgeId: (id) => backingRepository.findExceptionByKnowledgeId(id),
      transitionLifecycle: (transition) => backingRepository.transitionLifecycle(transition),
    };

    const result = await new KnowledgeSupersessionService({
      repository: failingRepository,
      auditLedger: new InMemoryKnowledgeAuditLedger(),
    }).supersede(request());

    expect(result).toMatchObject({ status: "PERSISTENCE_FAILED", persistenceEffect: "NONE" });
    expect((await backingRepository.getById("knowledge-prior"))?.lifecycleState).toBe("ACTIVE");
  });
});
