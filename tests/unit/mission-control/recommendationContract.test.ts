import { describe, expect, it } from "vitest";
import {
  buildTruthRecommendationContractRequest,
  sealTruthRecommendationContract,
} from "@/services/mission-control";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthRecommendationContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T13:00:00.000Z",
    }),
    missionId: "mission-alpha",
    recommendationType: "OPERATIONAL" as const,
    recommendationCategory: "OPERATIONS" as const,
    recommendationState: "VALIDATED" as const,
    recommendationPayload: {
      recommendation_rationale: "Evidence indicates a degraded subsystem should be reviewed.",
      recommendation_summary: "Review subsystem degradation.",
      recommendation_reasoning: [
        "Runtime health degraded across two checks.",
        "Evidence graph shows recurring support for operator review.",
      ],
      recommendation_assumptions: ["Operator intervention remains available."],
      recommendation_constraints: ["Do not execute automatically."],
    },
    supportingEvidenceIds: ["evidence-alpha"],
    supportingTruthRecordIds: ["truth-alpha"],
    supportingEventIds: ["event-alpha"],
    supportingGraphReferences: ["graph-alpha"],
    governanceBinding: {
      governance_policy_ids: ["policy-alpha"],
      governance_constraints: ["operator-approval-required"],
      authority_scope: "ADVISORY_ONLY",
      approval_requirements: ["operator-review"],
      governance_references: ["governance-alpha"],
    },
    confidenceBinding: {
      confidence_score: 0.82,
      confidence_state: "HIGH" as const,
      confidence_rationale: "Multiple evidence sources align on the recommendation.",
      confidence_evidence: ["evidence-alpha"],
    },
    replayReferenceIds: ["replay-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("recommendationContract", () => {
  it("passes a valid recommendation contract deterministically", () => {
    const first = sealTruthRecommendationContract(baseInput());
    const second = sealTruthRecommendationContract(baseInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("ADVISORY_ONLY_ENFORCED");
  });

  it("fails duplicate identity and identity mutation", () => {
    const duplicate = sealTruthRecommendationContract(baseInput({
      recommendationId: "recommendation-duplicate",
      priorRecommendationIds: ["recommendation-duplicate"],
    }));
    const mutated = sealTruthRecommendationContract(baseInput({
      identityMutated: true,
    }));

    expect(duplicate.validation.reasonCodes).toContain("RECOMMENDATION_ID_DUPLICATE");
    expect(mutated.validation.reasonCodes).toContain("RECOMMENDATION_ID_MUTATED");
  });

  it("fails unknown recommendation type and deprecated recommendation type", () => {
    const badType = sealTruthRecommendationContract(baseInput({
      recommendationType: "BAD_TYPE" as never,
    }));
    const deprecatedType = sealTruthRecommendationContract(baseInput({
      deprecatedRecommendationTypeDetected: true,
    }));

    expect(badType.validation.reasonCodes).toContain("RECOMMENDATION_TYPE_INVALID");
    expect(deprecatedType.validation.reasonCodes).toContain("RECOMMENDATION_TYPE_DEPRECATED");
  });

  it("fails category mismatch and multiple categories", () => {
    const badCategory = sealTruthRecommendationContract(baseInput({
      recommendationCategory: "TRUTH",
      typeCategoryMatches: false,
    }));
    const multipleCategories = sealTruthRecommendationContract(baseInput({
      multipleCategoriesDetected: true,
    }));

    expect(badCategory.validation.reasonCodes).toContain("RECOMMENDATION_CATEGORY_MISMATCH");
    expect(multipleCategories.validation.reasonCodes).toContain("RECOMMENDATION_CATEGORY_MULTIPLE");
  });

  it("fails missing rationale, empty reasoning, and missing supporting evidence", () => {
    const missingRationale = sealTruthRecommendationContract(baseInput({
      missingRationaleDetected: true,
      recommendationPayload: {
        recommendation_rationale: "",
        recommendation_summary: "",
        recommendation_reasoning: ["reason retained"],
      },
    }));
    const emptyReasoning = sealTruthRecommendationContract(baseInput({
      emptyReasoningDetected: true,
      recommendationPayload: {
        recommendation_rationale: "Rationale present",
        recommendation_summary: "Summary present",
        recommendation_reasoning: [],
      },
    }));
    const missingEvidence = sealTruthRecommendationContract(baseInput({
      supportingEvidenceIds: [],
      missingSupportingEvidenceDetected: true,
    }));

    expect(missingRationale.validation.reasonCodes).toContain("RATIONALE_MISSING");
    expect(emptyReasoning.validation.reasonCodes).toContain("REASONING_MISSING");
    expect(missingEvidence.validation.reasonCodes).toContain("SUPPORTING_EVIDENCE_MISSING");
  });

  it("fails governance binding issues and authority scope violations", () => {
    const missingGovernance = sealTruthRecommendationContract(baseInput({
      missingGovernanceBindingDetected: true,
      governanceBinding: {
        governance_policy_ids: [],
        governance_constraints: [],
        authority_scope: "",
        approval_requirements: [],
        governance_references: [],
      },
    }));
    const authorityViolation = sealTruthRecommendationContract(baseInput({
      authorityScopeViolationDetected: true,
      governanceBinding: {
        governance_policy_ids: ["policy-alpha"],
        governance_constraints: ["approval-required"],
        authority_scope: "EXECUTE_AND_APPROVE",
        approval_requirements: ["operator-review"],
        governance_references: ["governance-alpha"],
      },
    }));

    expect(missingGovernance.validation.reasonCodes).toContain("GOVERNANCE_BINDING_MISSING");
    expect(authorityViolation.validation.reasonCodes).toContain("AUTHORITY_SCOPE_VIOLATION");
    expect(authorityViolation.validation.reasonCodes).toContain("EXECUTION_AUTHORITY_DETECTED");
  });

  it("fails confidence corruption and missing confidence score", () => {
    const missingScore = sealTruthRecommendationContract(baseInput({
      missingConfidenceScoreDetected: true,
      confidenceBinding: {
        confidence_score: Number.NaN,
        confidence_state: "HIGH",
        confidence_rationale: "Supported",
        confidence_evidence: ["evidence-alpha"],
      },
    }));
    const unsupportedState = sealTruthRecommendationContract(baseInput({
      unsupportedConfidenceStateDetected: true,
      confidenceBinding: {
        confidence_score: 0.7,
        confidence_state: "IMPOSSIBLE" as never,
        confidence_rationale: "Supported",
        confidence_evidence: ["evidence-alpha"],
      },
    }));

    expect(missingScore.validation.reasonCodes).toContain("CONFIDENCE_SCORE_MISSING");
    expect(unsupportedState.validation.reasonCodes).toContain("CONFIDENCE_STATE_INVALID");
  });

  it("fails invalid state transition and replay mismatch", () => {
    const badTransition = sealTruthRecommendationContract(baseInput({
      priorState: "ARCHIVED",
      recommendationState: "ACTIVE",
      invalidStateTransitionDetected: true,
    }));
    const replayMismatch = sealTruthRecommendationContract(baseInput({
      replayMismatchDetected: true,
    }));

    expect(badTransition.validation.reasonCodes).toContain("STATE_TRANSITION_INVALID");
    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks execution, approval, ranking, prioritization, scoring, resource allocation, and authority expansion", () => {
    expect(sealTruthRecommendationContract(baseInput({ executionRequested: true })).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealTruthRecommendationContract(baseInput({ approvalRequested: true })).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealTruthRecommendationContract(baseInput({ rankingRequested: true })).validation.reasonCodes).toContain("RANKING_DETECTED");
    expect(sealTruthRecommendationContract(baseInput({ prioritizationRequested: true })).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealTruthRecommendationContract(baseInput({ scoringRequested: true })).validation.reasonCodes).toContain("SCORING_DETECTED");
    expect(sealTruthRecommendationContract(baseInput({ resourceAllocationRequested: true })).validation.reasonCodes).toContain("RESOURCE_ALLOCATION_DETECTED");
    expect(sealTruthRecommendationContract(baseInput({ authorityExpansionDetected: true })).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
