import { describe, expect, it } from "vitest";
import {
  buildTruthRecommendationContractRequest,
  buildTruthRecommendationRecorderRequest,
  buildTruthRecommendationReconstructionRequest,
  sealTruthRecommendationContract,
  sealTruthRecommendationRecorder,
  sealTruthRecommendationReconstruction,
} from "@/services/mission-control";

function baseRecommendation(overrides: Record<string, unknown> = {}) {
  return sealTruthRecommendationContract({
    request: buildTruthRecommendationContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T15:00:00.000Z",
    }),
    missionId: "mission-alpha",
    recommendationType: "OPERATIONAL",
    recommendationCategory: "OPERATIONS",
    recommendationState: "VALIDATED",
    recommendationPayload: {
      recommendation_rationale: "Operational evidence supports a manual review path.",
      recommendation_summary: "Review the operational anomaly.",
      recommendation_reasoning: [
        "Runtime and evidence signals are aligned.",
      ],
      recommendation_assumptions: ["Operators can intervene."],
      recommendation_constraints: ["No automatic execution."],
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
      confidence_score: 0.84,
      confidence_state: "HIGH",
      confidence_rationale: "Evidence and event history align.",
      confidence_evidence: ["evidence-alpha"],
    },
    replayReferenceIds: ["replay-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRecorderInput(recommendation = baseRecommendation(), overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthRecommendationRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T15:01:00.000Z",
    }),
    recommendation,
    recordType: "RECOMMENDATION" as const,
    recommendationContent: {
      recommendation_id: recommendation.recommendation.recommendation_id,
      confidence_score: recommendation.recommendation.confidence_binding.confidence_score,
    },
    relationships: [{
      target_recommendation_id: recommendation.recommendation.recommendation_id,
      relationship_type: "SUPPORTS" as const,
      relationship_rationale: "Supports recommendation decision context.",
    }],
    knownRecommendationIds: [recommendation.recommendation.recommendation_id],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

function baseReconstructionInput(overrides: Record<string, unknown> = {}) {
  const recommendation = baseRecommendation();
  const acceptedRecord = sealTruthRecommendationRecorder(baseRecorderInput(recommendation));
  const alternativeRecommendation = baseRecommendation({
    recommendationId: "alt-recommendation",
    recommendationPayload: {
      recommendation_rationale: "Alternative path retained for review.",
      recommendation_summary: "Alternative operational response.",
      recommendation_reasoning: ["Alternative evidence branch."],
    },
  });
  const rejectedRecommendation = baseRecommendation({
    recommendationId: "rej-recommendation",
    recommendationPayload: {
      recommendation_rationale: "Rejected due to lower confidence.",
      recommendation_summary: "Rejected path.",
      recommendation_reasoning: ["Confidence was insufficient."],
    },
  });
  const alternativeRecord = sealTruthRecommendationRecorder(baseRecorderInput(alternativeRecommendation, {
    recordType: "ALTERNATIVE",
    classification: "ALTERNATIVE",
    alternativeRecommendationId: recommendation.recommendation.recommendation_id,
    lineage: {
      origin_recommendation_id: recommendation.recommendation.recommendation_id,
      parent_recommendation_id: recommendation.recommendation.recommendation_id,
    },
    relationships: [{
      target_recommendation_id: recommendation.recommendation.recommendation_id,
      relationship_type: "ALTERNATIVE_TO",
      relationship_rationale: "Alternative recommendation path.",
    }],
    knownRecommendationIds: [
      recommendation.recommendation.recommendation_id,
      alternativeRecommendation.recommendation.recommendation_id,
    ],
  }));
  const rejectedRecord = sealTruthRecommendationRecorder(baseRecorderInput(rejectedRecommendation, {
    recordType: "REJECTED_OPTION",
    classification: "REJECTED",
    rejectionRationale: "Confidence did not meet threshold.",
    rejectionEvidenceIds: ["evidence-alpha"],
    lineage: {
      origin_recommendation_id: recommendation.recommendation.recommendation_id,
      parent_recommendation_id: recommendation.recommendation.recommendation_id,
    },
    relationships: [{
      target_recommendation_id: recommendation.recommendation.recommendation_id,
      relationship_type: "REJECTED_FROM",
      relationship_rationale: "Rejected from the accepted path.",
    }],
    knownRecommendationIds: [
      recommendation.recommendation.recommendation_id,
      rejectedRecommendation.recommendation.recommendation_id,
    ],
  }));

  return {
    request: buildTruthRecommendationReconstructionRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T15:02:00.000Z",
    }),
    recommendation,
    acceptedRecord,
    alternativeRecords: [alternativeRecord],
    rejectedRecords: [rejectedRecord],
    recommendationObjectives: ["Protect runtime stability."],
    environment: {
      runtime_conditions: ["runtime-stable"],
      mission_conditions: ["mission:mission-alpha"],
      tenant_conditions: ["tenant:tenant-alpha"],
      risk_conditions: ["risk-reviewed"],
      escalation_conditions: ["no-escalation-required"],
      certification_conditions: ["recommendation-certified"],
    },
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("recommendationReconstructionEngine", () => {
  it("reconstructs full context deterministically", () => {
    const first = sealTruthRecommendationReconstruction(baseReconstructionInput());
    const second = sealTruthRecommendationReconstruction(baseReconstructionInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("BUNDLE_COMPLETE");
  });

  it("fails missing context and incomplete context", () => {
    const missing = sealTruthRecommendationReconstruction(baseReconstructionInput({
      missingContextComponentDetected: true,
    }));
    const incomplete = sealTruthRecommendationReconstruction(baseReconstructionInput({
      incompleteContextDetected: true,
    }));

    expect(missing.validation.reasonCodes).toContain("RECOMMENDATION_CONTEXT_MISSING");
    expect(incomplete.validation.reasonCodes).toContain("RECOMMENDATION_CONTEXT_INCOMPLETE");
  });

  it("fails evidence and governance mismatches", () => {
    const evidenceMismatch = sealTruthRecommendationReconstruction(baseReconstructionInput({
      evidenceMismatchDetected: true,
    }));
    const policyMismatch = sealTruthRecommendationReconstruction(baseReconstructionInput({
      policyMismatchDetected: true,
    }));

    expect(evidenceMismatch.validation.reasonCodes).toContain("EVIDENCE_MISMATCH");
    expect(policyMismatch.validation.reasonCodes).toContain("GOVERNANCE_MISMATCH");
  });

  it("fails confidence mismatch and missing alternatives", () => {
    const confidenceMismatch = sealTruthRecommendationReconstruction(baseReconstructionInput({
      confidenceMismatchDetected: true,
    }));
    const missingAlternative = sealTruthRecommendationReconstruction(baseReconstructionInput({
      missingAlternativeDetected: true,
    }));

    expect(confidenceMismatch.validation.reasonCodes).toContain("CONFIDENCE_MISMATCH");
    expect(missingAlternative.validation.reasonCodes).toContain("ALTERNATIVES_MISSING");
  });

  it("fails environment mismatch and missing environment state", () => {
    const envMismatch = sealTruthRecommendationReconstruction(baseReconstructionInput({
      environmentMismatchDetected: true,
    }));
    const envMissing = sealTruthRecommendationReconstruction(baseReconstructionInput({
      missingEnvironmentStateDetected: true,
    }));

    expect(envMismatch.validation.reasonCodes).toContain("ENVIRONMENT_MISMATCH");
    expect(envMissing.validation.reasonCodes).toContain("ENVIRONMENT_MISSING");
  });

  it("fails context assembly and incomplete bundle", () => {
    const assemblyFailure = sealTruthRecommendationReconstruction(baseReconstructionInput({
      contextAssemblyFailureDetected: true,
    }));
    const incompleteBundle = sealTruthRecommendationReconstruction(baseReconstructionInput({
      incompleteBundleDetected: true,
    }));

    expect(assemblyFailure.validation.reasonCodes).toContain("BUNDLE_ASSEMBLY_FAILED");
    expect(incompleteBundle.validation.reasonCodes).toContain("BUNDLE_INCOMPLETE");
  });

  it("detects replay mismatch", () => {
    const mismatch = sealTruthRecommendationReconstruction(baseReconstructionInput({
      replayMismatchDetected: true,
    }));

    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.certification).toBe("FAIL");
  });

  it("blocks cross-tenant reconstruction and cross-tenant context access", () => {
    const result = sealTruthRecommendationReconstruction(baseReconstructionInput({
      crossTenantReconstructionDetected: true,
      crossTenantContextAccessDetected: true,
    }));

    expect(result.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(result.reconstruction.reconstruction_state).toBe("REJECTED");
  });
});
