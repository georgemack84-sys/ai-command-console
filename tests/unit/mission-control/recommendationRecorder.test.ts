import { describe, expect, it } from "vitest";
import {
  buildTruthRecommendationContractRequest,
  buildTruthRecommendationRecorderRequest,
  sealTruthRecommendationContract,
  sealTruthRecommendationRecorder,
} from "@/services/mission-control";

function baseRecommendation(overrides: Record<string, unknown> = {}) {
  return sealTruthRecommendationContract({
    request: buildTruthRecommendationContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T14:00:00.000Z",
    }),
    missionId: "mission-alpha",
    recommendationType: "OPERATIONAL",
    recommendationCategory: "OPERATIONS",
    recommendationState: "VALIDATED",
    recommendationPayload: {
      recommendation_rationale: "Evidence indicates a review is needed.",
      recommendation_summary: "Review the affected subsystem.",
      recommendation_reasoning: [
        "Two evidence sources support operator review.",
      ],
      recommendation_assumptions: ["Operator remains available."],
      recommendation_constraints: ["No automatic execution."],
    },
    supportingEvidenceIds: ["evidence-alpha"],
    supportingTruthRecordIds: ["truth-alpha"],
    supportingEventIds: ["event-alpha"],
    supportingGraphReferences: ["graph-alpha"],
    governanceBinding: {
      governance_policy_ids: ["policy-alpha"],
      governance_constraints: ["approval-required"],
      authority_scope: "ADVISORY_ONLY",
      approval_requirements: ["operator-review"],
      governance_references: ["governance-alpha"],
    },
    confidenceBinding: {
      confidence_score: 0.81,
      confidence_state: "HIGH",
      confidence_rationale: "Evidence sources align.",
      confidence_evidence: ["evidence-alpha"],
    },
    replayReferenceIds: ["replay-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRecorderInput(overrides: Record<string, unknown> = {}) {
  const recommendation = baseRecommendation();
  return {
    request: buildTruthRecommendationRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T14:01:00.000Z",
    }),
    recommendation,
    recordType: "RECOMMENDATION" as const,
    recommendationContent: {
      recommendation_id: recommendation.recommendation.recommendation_id,
      mission_id: recommendation.recommendation.mission_id,
      confidence_score: recommendation.recommendation.confidence_binding.confidence_score,
    },
    relationships: [{
      target_recommendation_id: recommendation.recommendation.recommendation_id,
      relationship_type: "SUPPORTS" as const,
      relationship_rationale: "Primary recommendation supports operator decision-making.",
    }],
    knownRecommendationIds: [recommendation.recommendation.recommendation_id],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("recommendationRecorder", () => {
  it("records primary recommendations, alternatives, and rejected options", () => {
    const primary = sealTruthRecommendationRecorder(baseRecorderInput());
    const recommendationId = primary.recommendation.recommendation.recommendation_id;
    const alternative = sealTruthRecommendationRecorder(baseRecorderInput({
      recordType: "ALTERNATIVE",
      alternativeRecommendationId: recommendationId,
      classification: "ALTERNATIVE",
      lineage: {
        origin_recommendation_id: recommendationId,
        parent_recommendation_id: recommendationId,
      },
      relationships: [{
        target_recommendation_id: recommendationId,
        relationship_type: "ALTERNATIVE_TO",
        relationship_rationale: "Alternative branch considered during evaluation.",
      }],
    }));
    const rejected = sealTruthRecommendationRecorder(baseRecorderInput({
      recordType: "REJECTED_OPTION",
      classification: "REJECTED",
      rejectionRationale: "Lower confidence than selected recommendation.",
      rejectionEvidenceIds: ["evidence-alpha"],
      lineage: {
        origin_recommendation_id: recommendationId,
        parent_recommendation_id: recommendationId,
      },
      relationships: [{
        target_recommendation_id: recommendationId,
        relationship_type: "REJECTED_FROM",
        relationship_rationale: "Option rejected from primary recommendation path.",
      }],
    }));

    expect(primary.record.record_state).toBe("RECORDED");
    expect(alternative.record.record_state).toBe("RECORDED");
    expect(rejected.record.record_state).toBe("RECORDED");
  });

  it("fails missing recommendation content", () => {
    const result = sealTruthRecommendationRecorder(baseRecorderInput({
      recommendationContent: {},
      missingRecommendationContentDetected: true,
    }));

    expect(result.validation.reasonCodes).toContain("RECOMMENDATION_CONTENT_MISSING");
    expect(result.certification).toBe("FAIL");
  });

  it("fails unlinked alternatives", () => {
    const result = sealTruthRecommendationRecorder(baseRecorderInput({
      recordType: "ALTERNATIVE",
      classification: "ALTERNATIVE",
      unlinkedAlternativeDetected: true,
      alternativeRecommendationId: "missing-recommendation",
      lineage: {
        origin_recommendation_id: baseRecorderInput().recommendation.recommendation.recommendation_id,
        parent_recommendation_id: "missing-recommendation",
      },
    }));

    expect(result.validation.reasonCodes).toContain("ALTERNATIVE_UNLINKED");
  });

  it("fails missing rejection rationale and missing rejection evidence", () => {
    const missingRationale = sealTruthRecommendationRecorder(baseRecorderInput({
      recordType: "REJECTED_OPTION",
      classification: "REJECTED",
      missingRejectionRationaleDetected: true,
      rejectionRationale: "",
      rejectionEvidenceIds: ["evidence-alpha"],
      lineage: {
        origin_recommendation_id: baseRecorderInput().recommendation.recommendation.recommendation_id,
        parent_recommendation_id: baseRecorderInput().recommendation.recommendation.recommendation_id,
      },
    }));
    const missingEvidence = sealTruthRecommendationRecorder(baseRecorderInput({
      recordType: "REJECTED_OPTION",
      classification: "REJECTED",
      rejectionRationale: "Unsupported path.",
      missingRejectionEvidenceDetected: true,
      rejectionEvidenceIds: [],
      lineage: {
        origin_recommendation_id: baseRecorderInput().recommendation.recommendation.recommendation_id,
        parent_recommendation_id: baseRecorderInput().recommendation.recommendation.recommendation_id,
      },
    }));

    expect(missingRationale.validation.reasonCodes).toContain("REJECTION_RATIONALE_MISSING");
    expect(missingEvidence.validation.reasonCodes).toContain("REJECTION_EVIDENCE_MISSING");
  });

  it("fails unknown or multiple classifications", () => {
    const unknown = sealTruthRecommendationRecorder(baseRecorderInput({
      unknownClassificationDetected: true,
      classification: "PRIMARY",
    }));
    const multiple = sealTruthRecommendationRecorder(baseRecorderInput({
      multipleClassificationsDetected: true,
      classification: "PRIMARY",
    }));

    expect(unknown.validation.reasonCodes).toContain("CLASSIFICATION_INVALID");
    expect(multiple.validation.reasonCodes).toContain("CLASSIFICATION_MULTIPLE");
  });

  it("preserves lineage and fails broken or orphaned lineage", () => {
    const valid = sealTruthRecommendationRecorder(baseRecorderInput());
    const broken = sealTruthRecommendationRecorder(baseRecorderInput({
      brokenLineageChainDetected: true,
    }));
    const orphaned = sealTruthRecommendationRecorder(baseRecorderInput({
      orphanedRecommendationDetected: true,
    }));

    expect(valid.validation.reasonCodes).toContain("LINEAGE_VALID");
    expect(broken.validation.reasonCodes).toContain("LINEAGE_BROKEN");
    expect(orphaned.validation.reasonCodes).toContain("LINEAGE_ORPHANED");
  });

  it("protects transactions and prevents partial recording", () => {
    const committed = sealTruthRecommendationRecorder(baseRecorderInput());
    const partial = sealTruthRecommendationRecorder(baseRecorderInput({
      partialRecordDetected: true,
    }));

    expect(committed.ledgerEntry.transaction_status).toBe("COMMITTED");
    expect(partial.ledgerEntry.transaction_status).toBe("NOT_STARTED");
    expect(partial.validation.reasonCodes).toContain("PARTIAL_RECORD_DETECTED");
  });

  it("reproduces replay and detects replay mismatches", () => {
    const reproduced = sealTruthRecommendationRecorder(baseRecorderInput());
    const mismatch = sealTruthRecommendationRecorder(baseRecorderInput({
      replayMismatchDetected: true,
    }));

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });

  it("blocks cross-tenant recommendation access and lineage traversal", () => {
    const result = sealTruthRecommendationRecorder(baseRecorderInput({
      crossTenantRecommendationAccessDetected: true,
      crossTenantLineageTraversalDetected: true,
    }));

    expect(result.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
    expect(result.record.record_state).toBe("REJECTED");
  });
});
