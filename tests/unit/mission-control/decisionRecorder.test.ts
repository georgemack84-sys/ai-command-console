import { describe, expect, it } from "vitest";
import {
  buildTruthDecisionContractRequest,
  buildTruthDecisionRecorderRequest,
  sealTruthDecisionContract,
  sealTruthDecisionRecorder,
} from "@/services/mission-control";

function baseDecision(overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionContract({
    request: buildTruthDecisionContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T18:00:00.000Z",
    }),
    missionId: "mission-alpha",
    decisionType: "APPROVAL",
    decisionCategory: "GOVERNANCE",
    decisionState: "VALIDATED",
    decisionPayload: {
      decision_rationale: "Governance review approved the evidence-backed action.",
      decision_summary: "Approve the constrained governance action.",
      decision_reasoning: ["Supporting evidence is verified and authority is traceable."],
      decision_assumptions: ["Operator review remains available."],
      decision_constraints: ["No unauthorized authority expansion."],
    },
    governanceBinding: {
      governance_policy_ids: ["policy-alpha"],
      governance_constraints: ["manual-approval-required"],
      authority_scope: "GOVERNANCE_APPROVAL",
      approval_requirements: ["operator-review"],
      governance_references: ["governance-alpha"],
    },
    authorityBinding: {
      decision_authority: "operator-123",
      authority_type: "OPERATOR",
      authority_scope: "GOVERNANCE_APPROVAL",
      authority_timestamp: "2026-06-22T17:59:00.000Z",
      authority_evidence: ["authority-evidence-alpha"],
    },
    confidenceBinding: {
      confidence_score: 0.91,
      confidence_state: "HIGH",
      confidence_rationale: "Evidence, governance review, and authority history align.",
      confidence_evidence: ["evidence-alpha"],
    },
    supportingEvidenceIds: ["evidence-alpha"],
    supportingTruthRecordIds: ["truth-alpha"],
    supportingEventIds: ["event-alpha"],
    supportingRecommendationIds: ["recommendation-alpha"],
    supportingGraphReferences: ["graph-alpha"],
    replayReferenceIds: ["replay-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseRecorderInput(decision = baseDecision(), overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthDecisionRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T18:01:00.000Z",
    }),
    decision,
    recordType: "ACCEPTED_RECOMMENDATION" as const,
    decisionContent: {
      decision_id: decision.decision.decision_id,
      authority: decision.decision.authority_binding.decision_authority,
    },
    acceptedRecommendationId: "recommendation-alpha",
    acceptanceRationale: "Accepted after governance review.",
    lineage: {
      source_recommendation_id: "recommendation-alpha",
      influenced_by_operator_id: "operator-123",
    },
    relationships: [{
      target_id: "recommendation-alpha",
      relationship_type: "ACCEPTS" as const,
      relationship_rationale: "This decision accepts the recommendation.",
    }],
    knownRecommendationIds: ["recommendation-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("decisionRecorder", () => {
  it("records an accepted recommendation deterministically", () => {
    const first = sealTruthDecisionRecorder(baseRecorderInput());
    const second = sealTruthDecisionRecorder(baseRecorderInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.classification).toBe("ACCEPTED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("fails when accepted recommendation is missing", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      missingAcceptedRecommendationDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("ACCEPTED_RECOMMENDATION_MISSING");
  });

  it("records a rejected recommendation", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      recordType: "REJECTED_RECOMMENDATION",
      classification: "REJECTED",
      rejectionRationale: "Recommendation did not satisfy approval criteria.",
      alternativeSelectedId: "recommendation-beta",
      relationships: [{
        target_id: "recommendation-alpha",
        relationship_type: "REJECTS",
        relationship_rationale: "This decision rejects the recommendation.",
      }],
    }));

    expect(result.certification).toBe("PASS");
    expect(result.classification).toBe("REJECTED");
  });

  it("fails when rejection rationale is missing", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      recordType: "REJECTED_RECOMMENDATION",
      classification: "REJECTED",
      missingRejectionRationaleDetected: true,
      alternativeSelectedId: "recommendation-beta",
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("REJECTION_RATIONALE_MISSING");
  });

  it("records an operator action", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      recordType: "OPERATOR_ACTION",
      classification: "OPERATOR_INITIATED",
      operatorId: "operator-123",
      operatorAction: "OVERRIDE_ACTION",
      lineage: {
        influenced_by_operator_id: "operator-123",
      },
      relationships: [{
        target_id: "decision-parent",
        relationship_type: "OVERRIDES",
        relationship_rationale: "Operator override recorded.",
      }],
    }));

    expect(result.certification).toBe("PASS");
    expect(result.classification).toBe("OPERATOR_INITIATED");
  });

  it("fails when operator identity is missing", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      recordType: "OPERATOR_ACTION",
      classification: "OPERATOR_INITIATED",
      operatorAction: "REVIEW_ACTION",
      missingOperatorIdentityDetected: true,
      lineage: {
        influenced_by_operator_id: "operator-123",
      },
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("OPERATOR_IDENTITY_MISSING");
  });

  it("fails unknown and multiple classifications", () => {
    const unknown = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      classification: "ACCEPTED",
      unknownClassificationDetected: true,
    }));
    const multiple = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      multipleClassificationsDetected: true,
    }));

    expect(unknown.validation.reasonCodes).toContain("CLASSIFICATION_INVALID");
    expect(multiple.validation.reasonCodes).toContain("CLASSIFICATION_MULTIPLE");
  });

  it("fails broken and orphaned lineage", () => {
    const broken = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      brokenLineageChainDetected: true,
    }));
    const orphaned = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      orphanedDecisionDetected: true,
    }));

    expect(broken.validation.reasonCodes).toContain("LINEAGE_BROKEN");
    expect(orphaned.validation.reasonCodes).toContain("LINEAGE_ORPHANED");
  });

  it("prevents partial record commits", () => {
    const result = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      partialRecordDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.ledgerEntry.transaction_status).toBe("NOT_STARTED");
  });

  it("fails replay mismatch and cross-tenant access", () => {
    const replayMismatch = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      replayMismatchDetected: true,
    }));
    const crossTenant = sealTruthDecisionRecorder(baseRecorderInput(undefined, {
      crossTenantDecisionAccessDetected: true,
      crossTenantLineageTraversalDetected: true,
    }));

    expect(replayMismatch.replay.replayResult).toBe("MISMATCH");
    expect(crossTenant.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });
});
