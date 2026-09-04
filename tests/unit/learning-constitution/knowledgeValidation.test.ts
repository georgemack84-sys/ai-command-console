import { describe, expect, it } from "vitest";

import { ConservativeKnowledgeValidator } from "@/services/learning-constitution";
import type {
  ConflictDetectionResult,
  InformationClassificationResult,
  KnowledgeEvidence,
  KnowledgeScopeResolutionResult,
  KnowledgeValidationRequest,
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
  value: InformationClassificationResult["classification"] = "FACT",
  overrides: Partial<InformationClassificationResult> = {},
): InformationClassificationResult => ({
  classification: value,
  confidence: value ? 0.9 : 0,
  status: value ? "CLASSIFIED" : "AMBIGUOUS",
  proposedDurability: value ? "DURABLE_CANDIDATE" : "NONE",
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
  ...overrides,
});

const scopeResolution = (
  scope: KnowledgeScopeResolutionResult["scope"] = projectScope,
  overrides: Partial<KnowledgeScopeResolutionResult> = {},
): KnowledgeScopeResolutionResult => ({
  scope,
  confidence: 1,
  status: "RESOLVED",
  source: "EXPLICIT",
  provenance,
  reasoningMetadata: {
    rationaleCode: "TEST_SCOPE",
    matchedScopeIds: [scope ? `${scope.type}:${"id" in scope ? scope.id ?? "" : ""}` : ""],
    resolverId: "test-resolver",
    resolverVersion: "1.0.0",
  },
  requiresClarification: false,
  promotionRequested: false,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  ...overrides,
});

const conflictDetection = (
  overrides: Partial<ConflictDetectionResult> = {},
): ConflictDetectionResult => ({
  candidateId: "candidate-001",
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
  ...overrides,
});

const evidence = (
  type: KnowledgeEvidence["type"],
  supportsCandidate = true,
): KnowledgeEvidence => ({
  evidenceId: `evidence-${type.toLocaleLowerCase()}`,
  type,
  sourceReference: "source-001",
  observedAt: "2026-08-20T12:00:00.000Z",
  provenance,
  supportsCandidate,
});

const request = (
  overrides: Partial<KnowledgeValidationRequest> = {},
): KnowledgeValidationRequest => ({
  candidateId: "candidate-001",
  classification: classification(),
  scopeResolution: scopeResolution(),
  conflictDetection: conflictDetection(),
  provenance,
  evidence: [],
  ...overrides,
});

const validator = new ConservativeKnowledgeValidator();

describe("conservative knowledge validation", () => {
  it("requires clarification when classification is unresolved", async () => {
    const result = await validator.validate(
      request({
        classification: classification("FACT", {
          classification: undefined,
          confidence: 0,
          status: "AMBIGUOUS",
          proposedDurability: "NONE",
        }),
      }),
    );

    expect(result).toMatchObject({
      outcome: "REQUIRES_CLARIFICATION",
      reasonCode: "CLASSIFICATION_UNRESOLVED",
    });
  });

  it("requires clarification when scope is unresolved", async () => {
    const result = await validator.validate(
      request({
        scopeResolution: scopeResolution(undefined, {
          status: "UNRESOLVED",
          requiresClarification: true,
        }),
      }),
    );

    expect(result.reasonCode).toBe("SCOPE_UNRESOLVED");
  });

  it("quarantines candidates with incomplete provenance", async () => {
    const result = await validator.validate(
      request({ provenance: { ...provenance, sourceId: "" } }),
    );

    expect(result).toMatchObject({ outcome: "QUARANTINED", reasonCode: "PROVENANCE_INCOMPLETE" });
  });

  it.each(["UNCERTAIN", "CONTRADICTS"] as const)(
    "requires conflict review for %s conflict results",
    async (relationship) => {
      const result = await validator.validate(
        request({
          conflictDetection: conflictDetection({
            relationship,
            status: relationship === "UNCERTAIN" ? "UNCERTAIN" : "ASSESSED",
          }),
        }),
      );

      expect(result).toMatchObject({
        outcome: "CONFLICT_REVIEW_REQUIRED",
        reasonCode: "CONFLICT_REVIEW_REQUIRED",
      });
    },
  );

  it("validates an attributed preference in User scope", async () => {
    const result = await validator.validate(
      request({
        classification: classification("PREFERENCE"),
        scopeResolution: scopeResolution(userScope),
      }),
    );

    expect(result).toMatchObject({ outcome: "VALID", reasonCode: "VALIDATED" });
  });

  it("requires attribution evidence when a preference is not in User scope", async () => {
    const result = await validator.validate(
      request({ classification: classification("PREFERENCE") }),
    );

    expect(result.reasonCode).toBe("PREFERENCE_REQUIRES_USER_ATTRIBUTION");
  });

  it("requires independent evidence for facts", async () => {
    const absent = await validator.validate(request());
    const agentOnly = await validator.validate(
      request({ evidence: [evidence("AGENT_OUTPUT")] }),
    );
    const sourced = await validator.validate(
      request({ evidence: [evidence("EXTERNAL_SOURCE")] }),
    );

    expect(absent.reasonCode).toBe("FACT_REQUIRES_INDEPENDENT_EVIDENCE");
    expect(agentOnly.reasonCode).toBe("FACT_REQUIRES_INDEPENDENT_EVIDENCE");
    expect(sourced).toMatchObject({ outcome: "VALID", reasonCode: "VALIDATED" });
  });

  it("requires approval for a project decision in Project scope", async () => {
    const result = await validator.validate(
      request({ classification: classification("PROJECT_DECISION") }),
    );

    expect(result).toMatchObject({
      outcome: "REQUIRES_APPROVAL",
      reasonCode: "PROJECT_DECISION_REQUIRES_APPROVAL",
    });
  });

  it("rejects a project decision that is not in Project scope", async () => {
    const result = await validator.validate(
      request({
        classification: classification("PROJECT_DECISION"),
        scopeResolution: scopeResolution(userScope),
      }),
    );

    expect(result).toMatchObject({
      outcome: "INVALID",
      reasonCode: "PROJECT_DECISION_REQUIRES_PROJECT_SCOPE",
    });
  });

  it("requires validated target references before correction and exception approval", async () => {
    const correctionWithoutTarget = await validator.validate(
      request({ classification: classification("CORRECTION") }),
    );
    const correctionWithTarget = await validator.validate(
      request({
        classification: classification("CORRECTION"),
        conflictDetection: conflictDetection({ correctionTargetKnowledgeId: "knowledge-001" }),
      }),
    );
    const exceptionWithTarget = await validator.validate(
      request({
        classification: classification("EXCEPTION"),
        conflictDetection: conflictDetection({ exceptionTargetKnowledgeId: "rule-001" }),
      }),
    );

    expect(correctionWithoutTarget.reasonCode).toBe("CORRECTION_TARGET_REQUIRED");
    expect(correctionWithTarget.reasonCode).toBe("CORRECTION_REQUIRES_APPROVAL");
    expect(exceptionWithTarget.reasonCode).toBe("EXCEPTION_REQUIRES_APPROVAL");
  });

  it("requires authority verification before an authoritative rule can proceed", async () => {
    const unverified = await validator.validate(
      request({ classification: classification("AUTHORITATIVE_RULE") }),
    );
    const verified = await validator.validate(
      request({
        classification: classification("AUTHORITATIVE_RULE"),
        authorityVerified: true,
      }),
    );

    expect(unverified.reasonCode).toBe("AUTHORITATIVE_RULE_REQUIRES_AUTHORITY_VERIFICATION");
    expect(verified.reasonCode).toBe("AUTHORITATIVE_RULE_REQUIRES_APPROVAL");
  });

  it("keeps procedures non-executable even when they are ready for approval", async () => {
    const result = await validator.validate(
      request({ classification: classification("PROCEDURE") }),
    );

    expect(result).toMatchObject({
      outcome: "REQUIRES_APPROVAL",
      reasonCode: "PROCEDURE_REQUIRES_APPROVAL",
      executionPermissionGranted: false,
    });
  });

  it("rejects conversation as a durable-learning candidate", async () => {
    const result = await validator.validate(
      request({ classification: classification("CONVERSATION") }),
    );

    expect(result).toMatchObject({ outcome: "INVALID", reasonCode: "NON_DURABLE_CLASSIFICATION" });
  });

  it("never persists, approves, or changes authority", async () => {
    const result = await validator.validate(
      request({ evidence: [evidence("DOCUMENT")] }),
    );

    expect(result).toMatchObject({
      outcome: "VALID",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    });
  });
});
