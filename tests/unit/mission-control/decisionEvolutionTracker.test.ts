import { describe, expect, it } from "vitest";
import {
  buildTruthDecisionContractRequest,
  buildTruthDecisionEvolutionRequest,
  buildTruthDecisionRecorderRequest,
  sealTruthDecisionContract,
  sealTruthDecisionEvolutionTracker,
  sealTruthDecisionRecorder,
} from "@/services/mission-control";

function baseDecision(overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionContract({
    request: buildTruthDecisionContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T19:00:00.000Z",
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
      authority_timestamp: "2026-06-22T18:59:00.000Z",
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

function baseRecorder(decision = baseDecision(), overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionRecorder({
    request: buildTruthDecisionRecorderRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T19:01:00.000Z",
    }),
    decision,
    recordType: "ACCEPTED_RECOMMENDATION",
    decisionContent: {
      decision_id: decision.decision.decision_id,
      authority: decision.decision.authority_binding.decision_authority,
    },
    acceptedRecommendationId: "recommendation-alpha",
    lineage: {
      source_recommendation_id: "recommendation-alpha",
      influenced_by_operator_id: "operator-123",
    },
    relationships: [{
      target_id: "recommendation-alpha",
      relationship_type: "ACCEPTS",
      relationship_rationale: "This decision accepts the recommendation.",
    }],
    knownRecommendationIds: ["recommendation-alpha"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

function baseEvolutionInput(overrides: Record<string, unknown> = {}) {
  const decision = baseDecision();
  const recordedDecision = baseRecorder(decision);

  return {
    request: buildTruthDecisionEvolutionRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T19:02:00.000Z",
    }),
    decision,
    recordedDecision,
    evolutionType: "REVISION_CREATED" as const,
    revisionType: "MINOR_REVISION" as const,
    previousVersion: "decision/v1",
    currentVersion: "decision/v2",
    versionNumber: 2,
    evolutionReason: "New evidence required a small rationale and confidence update.",
    changeSet: {
      before_state: {
        confidence_score: 0.91,
        decision_summary: "Approve the constrained governance action.",
      },
      after_state: {
        confidence_score: 0.93,
        decision_summary: "Approve the constrained governance action with updated evidence.",
      },
      changed_fields: ["confidence_score", "decision_summary"],
      change_rationale: "Additional evidence increased confidence.",
    },
    impactAssessment: {
      impact_state: "MEDIUM",
      impact_rationale: "The update affects confidence and replay context but not authority scope.",
      evidence_impact: ["evidence-alpha"],
      governance_impact: ["policy-alpha"],
      authority_impact: ["operator-123"],
      confidence_impact: ["confidence:0.93"],
      state_impact: ["VALIDATED"],
      operator_impact: ["operator-review"],
      replay_impact: ["replay-alpha"],
    },
    lineage: {
      source_recommendation_id: "recommendation-alpha",
      parent_decision_id: decision.decision.decision_id,
      influenced_by_operator_id: "operator-123",
    },
    priorVersionNumbers: [1],
    knownDecisionIds: [decision.decision.decision_id, "decision-next"],
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("decisionEvolutionTracker", () => {
  it("tracks decision evolution deterministically", () => {
    const first = sealTruthDecisionEvolutionTracker(baseEvolutionInput());
    const second = sealTruthDecisionEvolutionTracker(baseEvolutionInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("VERSION_ORDERING_VALID");
  });

  it("fails when change history is missing", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      missingChangeHistoryDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("CHANGE_HISTORY_MISSING");
  });

  it("fails unknown revision types", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      unknownRevisionTypeDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("REVISION_TYPE_INVALID");
  });

  it("fails duplicate versions", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      priorVersionNumbers: [1, 2],
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("VERSION_DUPLICATE");
  });

  it("fails broken and orphaned lineage", () => {
    const broken = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      brokenLineageDetected: true,
    }));
    const orphaned = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      orphanedRevisionDetected: true,
    }));

    expect(broken.validation.reasonCodes).toContain("LINEAGE_BROKEN");
    expect(orphaned.validation.reasonCodes).toContain("LINEAGE_ORPHANED");
  });

  it("fails when impact rationale is missing", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      missingImpactRationaleDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("IMPACT_RATIONALE_MISSING");
  });

  it("tracks supersession and fails when replacement is missing", () => {
    const valid = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      evolutionType: "SUPERSESSION_RECORDED",
      revisionType: "MAJOR_REVISION",
      supersededByDecisionId: "decision-next",
      supersedesDecisionId: "decision-prev",
    }));
    const invalid = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      evolutionType: "SUPERSESSION_RECORDED",
      revisionType: "MAJOR_REVISION",
      missingReplacementDecisionDetected: true,
    }));

    expect(valid.certification).toBe("PASS");
    expect(valid.version.version_state).toBe("SUPERSEDED");
    expect(invalid.validation.reasonCodes).toContain("SUPERSESSION_TARGET_MISSING");
  });

  it("fails replay mismatch", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      replayMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
  });

  it("fails cross-tenant version access", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      crossTenantVersionAccessDetected: true,
      crossTenantLineageTraversalDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("fails partial evolution commits", () => {
    const result = sealTruthDecisionEvolutionTracker(baseEvolutionInput({
      partialEvolutionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.ledgerEntry.transaction_status).toBe("NOT_STARTED");
  });
});
