import { describe, expect, it } from "vitest";

import { ConservativeLearningDecisionEngine } from "@/services/learning-constitution";
import type {
  ApprovalContext,
  ConflictDetectionResult,
  InformationClassificationResult,
  KnowledgeScopeResolutionResult,
  KnowledgeValidationResult,
  LearningDecisionPolicyContext,
  LearningDecisionRequest,
} from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001",
  sourceId: "interaction-001",
  sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001",
  observedAt: "2026-08-20T12:00:00.000Z",
};

const projectScope = { type: "PROJECT", id: "project-alpha" } as const;
const userScope = { type: "USER", id: "operator-001" } as const;

const classification = (
  value: InformationClassificationResult["classification"] = "PREFERENCE",
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
  scope: KnowledgeScopeResolutionResult["scope"] = userScope,
): KnowledgeScopeResolutionResult => ({
  scope,
  confidence: 1,
  status: "RESOLVED",
  source: "EXPLICIT",
  provenance,
  reasoningMetadata: {
    rationaleCode: "TEST_SCOPE",
    matchedScopeIds: [scope?.type ?? ""],
    resolverId: "test-resolver",
    resolverVersion: "1.0.0",
  },
  requiresClarification: false,
  promotionRequested: false,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
});

const conflictDetection = (
  candidateId = "candidate-001",
): ConflictDetectionResult => ({
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

const validation = (
  outcome: KnowledgeValidationResult["outcome"] = "VALID",
  candidateId = "candidate-001",
): KnowledgeValidationResult => ({
  candidateId,
  outcome,
  reasonCode: "VALIDATED",
  applicableRules: [],
  evidenceIds: [],
  provenance,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const approval = (overrides: Partial<ApprovalContext> = {}): ApprovalContext => ({
  approvalRequired: false,
  status: "NOT_REQUIRED",
  ...overrides,
});

const policy = (
  overrides: Partial<LearningDecisionPolicyContext> = {},
): LearningDecisionPolicyContext => ({
  policyVersion: "1.0.0",
  constitutionVersion: "1.0.0",
  ...overrides,
});

const request = (overrides: Partial<LearningDecisionRequest> = {}): LearningDecisionRequest => ({
  candidateId: "candidate-001",
  classification: classification(),
  scopeResolution: scopeResolution(),
  conflictDetection: conflictDetection(),
  validation: validation(),
  provenance,
  approval: approval(),
  policy: policy(),
  ...overrides,
});

const engine = new ConservativeLearningDecisionEngine();

describe("conservative learning decisions", () => {
  it("accepts a valid candidate only as eligible for later durable admission", async () => {
    const result = await engine.decide(request());

    expect(result).toMatchObject({
      disposition: "ACCEPT",
      reasonCode: "ACCEPTED_FOR_ADMISSION",
      durableAdmissionEligible: true,
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
    });
  });

  it("requires pending approval for a project decision", async () => {
    const result = await engine.decide(
      request({
        classification: classification("PROJECT_DECISION"),
        scopeResolution: scopeResolution(projectScope),
        validation: validation("REQUIRES_APPROVAL"),
        approval: approval({ approvalRequired: true, status: "PENDING" }),
      }),
    );

    expect(result).toMatchObject({ disposition: "REQUIRE_APPROVAL", reasonCode: "APPROVAL_PENDING" });
  });

  it("accepts a scoped project approval without persisting the candidate", async () => {
    const result = await engine.decide(
      request({
        classification: classification("PROJECT_DECISION"),
        scopeResolution: scopeResolution(projectScope),
        validation: validation("REQUIRES_APPROVAL"),
        approval: approval({
          approvalRequired: true,
          status: "APPROVED",
          approvalId: "approval-001",
          approvedBy: "operator-001",
          approvedAt: "2026-08-20T12:00:00.000Z",
          approvalScope: projectScope,
        }),
      }),
    );

    expect(result).toMatchObject({
      disposition: "ACCEPT",
      durableAdmissionEligible: true,
      persistenceEffect: "NONE",
    });
  });

  it.each(["REJECTED", "EXPIRED"] as const)(
    "rejects a %s approval",
    async (status) => {
      const result = await engine.decide(
        request({
          validation: validation("REQUIRES_APPROVAL"),
          approval: approval({ approvalRequired: true, status }),
        }),
      );

      expect(result.disposition).toBe("REJECT");
    },
  );

  it.each(["REQUIRES_EVIDENCE", "REQUIRES_CLARIFICATION"] as const)(
    "returns REQUIRE_VALIDATION when validation returns %s",
    async (outcome) => {
      const result = await engine.decide(request({ validation: validation(outcome) }));

      expect(result).toMatchObject({
        disposition: "REQUIRE_VALIDATION",
        reasonCode: "VALIDATION_REQUIRES_COMPLETION",
      });
    },
  );

  it("returns conflict and quarantine decisions without resolving either state", async () => {
    const conflict = await engine.decide(
      request({ validation: validation("CONFLICT_REVIEW_REQUIRED") }),
    );
    const quarantined = await engine.decide(
      request({ validation: validation("QUARANTINED") }),
    );

    expect(conflict.disposition).toBe("CONFLICT");
    expect(quarantined.disposition).toBe("QUARANTINE");
  });

  it("rejects invalid validation results", async () => {
    const result = await engine.decide(request({ validation: validation("INVALID") }));

    expect(result).toMatchObject({ disposition: "REJECT", reasonCode: "VALIDATION_REJECTED" });
  });

  it("defers when upstream identities or policy context are inconsistent", async () => {
    const mismatched = await engine.decide(
      request({ validation: validation("VALID", "candidate-other") }),
    );
    const missingPolicy = await engine.decide(
      request({ policy: policy({ policyVersion: "" }) }),
    );

    expect(mismatched.reasonCode).toBe("UPSTREAM_RESULT_INCONSISTENT");
    expect(missingPolicy.reasonCode).toBe("POLICY_CONTEXT_INCOMPLETE");
  });

  it.each([
    ["constitutionalMutationRequested", "CONSTITUTIONAL_MUTATION_PROHIBITED"],
    ["authorityMutationRequested", "AUTHORITY_MUTATION_PROHIBITED"],
    ["automaticConversationLearningRequested", "AUTOMATIC_CONVERSATION_LEARNING_PROHIBITED"],
    ["unknownScopePromotionRequested", "UNKNOWN_SCOPE_PROMOTION_PROHIBITED"],
    ["silentConflictResolutionRequested", "SILENT_CONFLICT_RESOLUTION_PROHIBITED"],
    ["procedureExecutionPermissionRequested", "PROCEDURE_PERMISSION_ESCALATION_PROHIBITED"],
    ["agentGeneratedEvidenceSelfValidated", "AGENT_EVIDENCE_SELF_VALIDATION_PROHIBITED"],
  ] as const)("rejects policy guardrail %s", async (flag, reasonCode) => {
    const result = await engine.decide(request({ policy: policy({ [flag]: true }) }));

    expect(result).toMatchObject({ disposition: "REJECT", reasonCode });
  });

  it("defers an approved decision whose approval scope is incompatible", async () => {
    const result = await engine.decide(
      request({
        validation: validation("REQUIRES_APPROVAL"),
        approval: approval({
          approvalRequired: true,
          status: "APPROVED",
          approvalId: "approval-001",
          approvedBy: "operator-001",
          approvedAt: "2026-08-20T12:00:00.000Z",
          approvalScope: projectScope,
        }),
      }),
    );

    expect(result).toMatchObject({ disposition: "DEFER", reasonCode: "APPROVAL_SCOPE_INCOMPATIBLE" });
  });

  it("never grants execution permission or changes authority", async () => {
    const result = await engine.decide(request());

    expect(result).toMatchObject({
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
      persistenceEffect: "NONE",
    });
  });
});
