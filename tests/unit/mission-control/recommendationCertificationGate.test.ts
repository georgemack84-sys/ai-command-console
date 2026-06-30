import { describe, expect, it } from "vitest";
import {
  buildTruthRecommendationCertificationRequest,
  buildTruthRecommendationContractRequest,
  buildTruthRecommendationRecorderRequest,
  buildTruthRecommendationReconstructionRequest,
  sealTruthRecommendationCertificationGate,
  sealTruthRecommendationContract,
  sealTruthRecommendationRecorder,
  sealTruthRecommendationReconstruction,
} from "@/services/mission-control";
import type { TruthRecommendationEvolutionCertificationEvidence } from "@/services/mission-control";

function baseRecommendation(overrides: Record<string, unknown> = {}) {
  return sealTruthRecommendationContract({
    request: buildTruthRecommendationContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T16:00:00.000Z",
    }),
    missionId: "mission-alpha",
    recommendationType: "OPERATIONAL",
    recommendationCategory: "OPERATIONS",
    recommendationState: "VALIDATED",
    recommendationPayload: {
      recommendation_rationale: "Operational evidence supports a manual recommendation path.",
      recommendation_summary: "Review the operational anomaly.",
      recommendation_reasoning: [
        "Runtime and evidence signals are aligned.",
      ],
      recommendation_assumptions: ["Operators can intervene."],
      recommendation_constraints: ["No autonomous execution."],
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
      confidence_score: 0.92,
      confidence_state: "HIGH",
      confidence_rationale: "Evidence and event history remain aligned.",
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
      now: "2026-06-22T16:01:00.000Z",
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
      now: "2026-06-22T16:02:00.000Z",
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

function baseEvolution(): TruthRecommendationEvolutionCertificationEvidence {
  return {
    certification: "PASS",
    replayResult: "REPRODUCED",
    lineagePreserved: true,
    versionManagementValid: true,
    supersessionManagementValid: true,
    impactAnalysisValid: true,
    tenantScoped: true,
    visibilityOperational: true,
    governanceCompliant: true,
    confidencePreserved: true,
    advisoryOnly: true,
    deterministic: true,
  };
}

function baseCertificationInput(overrides: Record<string, unknown> = {}) {
  const recommendationContract = baseRecommendation();
  const recommendationRecorder = sealTruthRecommendationRecorder(baseRecorderInput(recommendationContract));
  const recommendationReconstruction = sealTruthRecommendationReconstruction(baseReconstructionInput());

  return {
    request: buildTruthRecommendationCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T16:03:00.000Z",
    }),
    recommendationContract,
    recommendationRecorder,
    recommendationEvolution: baseEvolution(),
    recommendationReconstruction,
    certificationAuthority: "mission-control-certifier",
    certificationReason: "Validate complete recommendation layer readiness.",
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("recommendationCertificationGate", () => {
  it("certifies the recommendation layer deterministically", () => {
    const first = sealTruthRecommendationCertificationGate(baseCertificationInput());
    const second = sealTruthRecommendationCertificationGate(baseCertificationInput());

    expect(first).toEqual(second);
    expect(first.certification.certification_state).toBe("PASS");
    expect(first.completionGate).toBe("RECOMMENDATION_LAYER_CERTIFIED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("DECISION_ENGINE_PASS");
  });

  it("allows a conditional pass for observability and reporting gaps with remediation", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    }));

    expect(result.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(result.completionGate).toBe("RECOMMENDATION_LAYER_CONDITIONAL");
    expect(result.validation.reasonCodes).toContain("DECISION_ENGINE_CONDITIONAL");
  });

  it("fails on duplicate recommendation identity evidence", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      duplicateRecommendationIdentityDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.recommendationContractCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6E.1 Recommendation Contract");
  });

  it("fails on broken evolution lineage", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      brokenEvolutionLineageDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.recommendationEvolutionCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6E.3 Recommendation Evolution Tracker");
  });

  it("fails on incomplete reconstruction bundle", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      incompleteReconstructionBundleDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.recommendationReconstructionCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6E.4 Recommendation Reconstruction Engine");
  });

  it("fails on confidence corruption", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      confidenceCorruptionDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.confidenceCertified).toBe(false);
    expect(result.visibility.confidence_status).toBe("FAIL");
  });

  it("fails on governance bypass and execution authority detection", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      governanceBypassDetected: true,
      executionAuthorityDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.governanceCertified).toBe(false);
    expect(result.validation.advisoryOnlyCertified).toBe(false);
    expect(result.visibility.governance_status).toBe("FAIL");
  });

  it("fails on replay mismatch", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      replayMismatchDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.visibility.replay_status).toBe("MISMATCH");
  });

  it("fails on cross-tenant access", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      crossTenantAccessDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.tenantIsolationCertified).toBe(false);
    expect(result.visibility.tenant_status).toBe("FAIL");
  });

  it("fails when operator visibility is hidden", () => {
    const result = sealTruthRecommendationCertificationGate(baseCertificationInput({
      hiddenCertificationFailureDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.visibilityCertified).toBe(false);
    expect(result.visibility.visibility_status).toBe("FAIL");
  });
});
