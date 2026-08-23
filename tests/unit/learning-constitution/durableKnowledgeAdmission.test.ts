import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeAdmissionService,
} from "@/services/learning-constitution";
import type {
  ConflictDetectionResult,
  DurableKnowledgeCandidate,
  InformationClassificationResult,
  KnowledgeAdmissionRequest,
  KnowledgeAuditLedger,
  KnowledgeRepository,
  KnowledgeScopeReference,
  KnowledgeScopeResolutionResult,
  KnowledgeValidationResult,
  LearningDecisionResult,
} from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001",
  sourceId: "interaction-001",
  sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001",
  observedAt: "2026-08-20T12:00:00.000Z",
};

const projectAlpha = { type: "PROJECT", id: "project-alpha" } as const;
const projectBeta = { type: "PROJECT", id: "project-beta" } as const;

const candidate = (
  candidateId = "candidate-001",
  overrides: Partial<DurableKnowledgeCandidate> = {},
): DurableKnowledgeCandidate => ({
  candidateId,
  content: "Project Alpha uses PostgreSQL.",
  classification: "PROJECT_DECISION",
  provenance,
  ...overrides,
});

const classification = (
  value: InformationClassificationResult["classification"] = "PROJECT_DECISION",
): InformationClassificationResult => ({
  classification: value,
  confidence: 0.9,
  status: "CLASSIFIED",
  proposedDurability: "DURABLE_CANDIDATE",
  requiresValidation: true,
  provenance,
  reasoningMetadata: {
    rationaleCode: "TEST_CLASSIFICATION",
    matchedSignals: [],
    classifierId: "test-classifier",
    classifierVersion: "1.0.0",
  },
  relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] },
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const scopeResolution = (
  scope: KnowledgeScopeReference = projectAlpha,
): KnowledgeScopeResolutionResult => ({
  scope,
  confidence: 1,
  status: "RESOLVED",
  source: "EXPLICIT",
  provenance,
  reasoningMetadata: {
    rationaleCode: "TEST_SCOPE",
    matchedScopeIds: [`${scope.type}:${scope.id}`],
    resolverId: "test-resolver",
    resolverVersion: "1.0.0",
  },
  requiresClarification: false,
  promotionRequested: false,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
});

const conflictDetection = (candidateId = "candidate-001"): ConflictDetectionResult => ({
  candidateId,
  existingKnowledgeId: "knowledge-001",
  relationship: "UNRELATED",
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
});

const validation = (candidateId = "candidate-001"): KnowledgeValidationResult => ({
  candidateId,
  outcome: "VALID",
  reasonCode: "VALIDATED",
  applicableRules: [],
  evidenceIds: [],
  provenance,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const decision = (candidateId = "candidate-001"): LearningDecisionResult => ({
  candidateId,
  disposition: "ACCEPT",
  reasonCode: "ACCEPTED_FOR_ADMISSION",
  decisionStatus: "FINAL",
  policyVersion: "1.0.0",
  constitutionVersion: "1.0.0",
  provenance,
  durableAdmissionEligible: true,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const request = (overrides: Partial<KnowledgeAdmissionRequest> = {}): KnowledgeAdmissionRequest => ({
  candidate: candidate(),
  classification: classification(),
  scopeResolution: scopeResolution(),
  conflictDetection: conflictDetection(),
  validation: validation(),
  decision: decision(),
  ...overrides,
});

const createService = (
  repository: KnowledgeRepository = new InMemoryKnowledgeRepository(),
  auditLedger: KnowledgeAuditLedger = new InMemoryKnowledgeAuditLedger(),
) => new KnowledgeAdmissionService({
  repository,
  auditLedger,
  now: () => "2026-08-20T12:00:00.000Z",
});

describe("durable knowledge admission", () => {
  it("creates one active record and one audit event after an ACCEPT decision", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    const result = await createService(repository, ledger).admit(request());

    expect(result).toMatchObject({
      status: "ADMITTED",
      reasonCode: "KNOWLEDGE_ADMITTED",
      created: true,
      idempotentReplay: false,
      persistenceEffect: "CREATED",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
      knowledgeRecord: {
        candidateId: "candidate-001",
        lifecycleState: "ACTIVE",
        scope: projectAlpha,
      },
    });
    expect(result.auditEvent?.eventType).toBe("KNOWLEDGE_ADMITTED");
    expect(await ledger.findByKnowledgeId(result.knowledgeRecord!.knowledgeId)).toHaveLength(1);
  });

  it("does not persist a non-accepted decision", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const result = await createService(repository).admit(
      request({ decision: { ...decision(), disposition: "REQUIRE_APPROVAL", durableAdmissionEligible: false } }),
    );

    expect(result).toMatchObject({ status: "REJECTED", reasonCode: "DECISION_NOT_ACCEPTED" });
    expect(await repository.findByCandidateId("candidate-001")).toBeUndefined();
  });

  it("fails closed on incomplete scope, lineage, and version information", async () => {
    const unresolvedScope = await createService().admit(
      request({ scopeResolution: { ...scopeResolution(), scope: undefined, status: "UNRESOLVED" } }),
    );
    const inconsistentLineage = await createService().admit(
      request({ validation: validation("candidate-other") }),
    );
    const missingVersion = await createService().admit(
      request({ decision: { ...decision(), policyVersion: "" } }),
    );

    expect(unresolvedScope.reasonCode).toBe("SCOPE_UNRESOLVED");
    expect(inconsistentLineage.reasonCode).toBe("LINEAGE_INCONSISTENT");
    expect(missingVersion.reasonCode).toBe("POLICY_VERSION_MISSING");
  });

  it("is idempotent by candidate ID and does not emit a duplicate audit event", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    const service = createService(repository, ledger);

    const first = await service.admit(request());
    const replay = await service.admit(request());

    expect(replay).toMatchObject({
      status: "ADMITTED",
      reasonCode: "IDEMPOTENT_REPLAY",
      created: false,
      idempotentReplay: true,
      persistenceEffect: "NONE",
    });
    expect(replay.knowledgeRecord?.knowledgeId).toBe(first.knowledgeRecord?.knowledgeId);
    expect(await ledger.findByKnowledgeId(first.knowledgeRecord!.knowledgeId)).toHaveLength(1);
  });

  it("does not claim learning or emit audit events when persistence fails", async () => {
    const failingRepository: KnowledgeRepository = {
      create: async () => {
        throw new Error("simulated persistence failure");
      },
      getById: async () => undefined,
      findByCandidateId: async () => undefined,
    };
    const ledger = new InMemoryKnowledgeAuditLedger();
    const result = await createService(failingRepository, ledger).admit(request());

    expect(result).toMatchObject({
      status: "PERSISTENCE_FAILED",
      reasonCode: "PERSISTENCE_FAILED",
      persistenceEffect: "NONE",
    });
    expect(await ledger.findByKnowledgeId("knowledge:candidate-001")).toHaveLength(0);
  });

  it("keeps a learned procedure non-executable after admission", async () => {
    const procedureRequest = request({
      candidate: candidate("candidate-procedure", {
        content: "Procedure: deploy the application.",
        classification: "PROCEDURE",
      }),
      classification: classification("PROCEDURE"),
      conflictDetection: conflictDetection("candidate-procedure"),
      validation: validation("candidate-procedure"),
      decision: decision("candidate-procedure"),
    });
    const result = await createService().admit(procedureRequest);

    expect(result).toMatchObject({
      status: "ADMITTED",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });

  it("keeps records in different project scopes independent", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const service = createService(repository);
    const alpha = await service.admit(request());
    const beta = await service.admit(
      request({
        candidate: candidate("candidate-002", {
          content: "Project Beta uses SQLite.",
        }),
        scopeResolution: scopeResolution(projectBeta),
        conflictDetection: conflictDetection("candidate-002"),
        validation: validation("candidate-002"),
        decision: decision("candidate-002"),
      }),
    );

    expect(alpha.knowledgeRecord?.scope).toEqual(projectAlpha);
    expect(beta.knowledgeRecord?.scope).toEqual(projectBeta);
    expect(alpha.knowledgeRecord?.knowledgeId).not.toBe(beta.knowledgeRecord?.knowledgeId);
  });
});
