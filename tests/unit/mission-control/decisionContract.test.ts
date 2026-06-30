import { describe, expect, it } from "vitest";
import {
  buildTruthDecisionContractRequest,
  sealTruthDecisionContract,
} from "@/services/mission-control";

function baseDecision(overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionContract({
    request: buildTruthDecisionContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-22T17:00:00.000Z",
    }),
    missionId: "mission-alpha",
    decisionType: "APPROVAL",
    decisionCategory: "GOVERNANCE",
    decisionState: "VALIDATED",
    decisionPayload: {
      decision_rationale: "Governance review approved the evidence-backed action.",
      decision_summary: "Approve the constrained governance action.",
      decision_reasoning: [
        "Supporting evidence is verified and authority is traceable.",
      ],
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
      authority_timestamp: "2026-06-22T16:59:00.000Z",
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

describe("decisionContract", () => {
  it("seals a valid decision deterministically", () => {
    const first = baseDecision();
    const second = baseDecision();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("DECISION_ID_UNIQUE");
  });

  it("fails duplicate identity", () => {
    const valid = baseDecision();
    const duplicate = baseDecision({
      priorDecisionIds: [valid.decision.decision_id],
    });

    expect(duplicate.certification).toBe("FAIL");
    expect(duplicate.validation.reasonCodes).toContain("DECISION_ID_DUPLICATE");
  });

  it("fails unknown decision type", () => {
    const invalid = baseDecision({
      decisionType: "APPROVAL",
      deprecatedDecisionTypeDetected: true,
    });

    expect(invalid.certification).toBe("FAIL");
    expect(invalid.validation.reasonCodes).toContain("DECISION_TYPE_DEPRECATED");
  });

  it("fails category mismatch", () => {
    const mismatch = baseDecision({
      decisionCategory: "SECURITY",
    });

    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.validation.reasonCodes).toContain("DECISION_CATEGORY_MISMATCH");
  });

  it("fails missing rationale", () => {
    const missing = baseDecision({
      missingRationaleDetected: true,
    });

    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.reasonCodes).toContain("RATIONALE_MISSING");
  });

  it("fails missing supporting evidence", () => {
    const missing = baseDecision({
      missingSupportingEvidenceDetected: true,
    });

    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.reasonCodes).toContain("SUPPORTING_EVIDENCE_MISSING");
  });

  it("fails authority scope violations and unknown authority", () => {
    const invalid = baseDecision({
      authorityScopeViolationDetected: true,
      unknownAuthorityDetected: true,
    });

    expect(invalid.certification).toBe("FAIL");
    expect(invalid.validation.reasonCodes).toContain("AUTHORITY_SCOPE_VIOLATION");
    expect(invalid.validation.reasonCodes).toContain("AUTHORITY_TYPE_INVALID");
  });

  it("fails confidence corruption", () => {
    const invalid = baseDecision({
      confidenceCorruptionDetected: true,
    });

    expect(invalid.certification).toBe("FAIL");
    expect(invalid.validation.reasonCodes).toContain("CONFIDENCE_RATIONALE_MISSING");
  });

  it("fails invalid state transitions", () => {
    const invalid = baseDecision({
      priorState: "ARCHIVED",
      decisionState: "ACTIVE",
    });

    expect(invalid.certification).toBe("FAIL");
    expect(invalid.validation.reasonCodes).toContain("STATE_TRANSITION_INVALID");
  });

  it("fails replay mismatch", () => {
    const mismatch = baseDecision({
      replayMismatchDetected: true,
    });

    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
  });
});
