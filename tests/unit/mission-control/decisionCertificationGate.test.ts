import { describe, expect, it } from "vitest";
import {
  buildTruthDecisionCertificationRequest,
  buildTruthDecisionContractRequest,
  buildTruthDecisionEvolutionRequest,
  buildTruthDecisionRecorderRequest,
  buildTruthDecisionReplayBinderCertificationRequest,
  buildTruthDecisionReplayRequest,
  sealTruthDecisionCertificationGate,
  sealTruthDecisionContract,
  sealTruthDecisionEvolutionTracker,
  sealTruthDecisionRecorder,
  sealTruthDecisionReplayBinder,
  sealTruthDecisionReplayBinderCertificationGate,
} from "@/services/mission-control";

function baseDecision(overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionContract({
    request: buildTruthDecisionContractRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T13:00:00.000Z",
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
      authority_timestamp: "2026-06-24T12:59:00.000Z",
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
      now: "2026-06-24T13:01:00.000Z",
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

function baseEvolution(decision = baseDecision(), recordedDecision = baseRecorder(decision), overrides: Record<string, unknown> = {}) {
  return sealTruthDecisionEvolutionTracker({
    request: buildTruthDecisionEvolutionRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T13:02:00.000Z",
    }),
    decision,
    recordedDecision,
    evolutionType: "REVISION_CREATED",
    revisionType: "MINOR_REVISION",
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
  });
}

function baseCertificationInput(overrides: Record<string, unknown> = {}) {
  const decisionContract = baseDecision();
  const decisionRecorder = baseRecorder(decisionContract);
  const decisionEvolution = baseEvolution(decisionContract, decisionRecorder);
  const decisionReplayBinder = sealTruthDecisionReplayBinder({
    request: buildTruthDecisionReplayRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T13:03:00.000Z",
    }),
    decision: decisionContract,
    recordedDecision: decisionRecorder,
    evolution: decisionEvolution,
    decisionObjectives: ["Protect governance integrity."],
    environment: {
      runtime_conditions: ["runtime-stable"],
      mission_state: ["mission:mission-alpha"],
      tenant_state: ["tenant:tenant-alpha"],
      risk_state: ["risk-reviewed"],
      escalation_state: ["no-escalation-open"],
      certification_state: ["decision-certifiable"],
    },
    knownEvidenceIds: ["evidence-alpha"],
    accessTenantId: "tenant-alpha",
  });
  const decisionReplayCertification = sealTruthDecisionReplayBinderCertificationGate({
    request: buildTruthDecisionReplayBinderCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T13:04:00.000Z",
    }),
    replayBinder: decisionReplayBinder,
    certificationAuthority: "mission-control-certifier",
    certificationReason: "Validate decision replay binder readiness.",
    accessTenantId: "tenant-alpha",
  });

  return {
    request: buildTruthDecisionCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T13:05:00.000Z",
    }),
    decisionContract,
    decisionRecorder,
    decisionEvolution,
    decisionReplayBinder,
    decisionReplayCertification,
    certificationAuthority: "mission-control-certifier",
    certificationReason: "Validate complete decision layer readiness.",
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("decisionCertificationGate", () => {
  it("certifies the complete decision layer deterministically", () => {
    const first = sealTruthDecisionCertificationGate(baseCertificationInput());
    const second = sealTruthDecisionCertificationGate(baseCertificationInput());

    expect(first).toEqual(second);
    expect(first.certification.certification_state).toBe("PASS");
    expect(first.completionGate).toBe("DECISION_LAYER_CERTIFIED");
    expect(first.replay.replayResult).toBe("REPRODUCED");
    expect(first.validation.reasonCodes).toContain("DECISION_CONTRACT_CERTIFIED");
    expect(first.validation.reasonCodes).toContain("DECISION_REPLAY_CERTIFIED");
  });

  it("allows a conditional pass for approved observability and reporting gaps", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    }));

    expect(result.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(result.completionGate).toBe("DECISION_LAYER_CONDITIONAL");
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails duplicate decision identity evidence", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      duplicateDecisionIdentityDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.decisionContractCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6F.1 Decision Contract");
  });

  it("fails accepted recommendation loss", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      acceptedRecommendationLostDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.decisionRecorderCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6F.2 Decision Recorder");
  });

  it("fails broken decision lineage", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      brokenDecisionLineageDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.decisionEvolutionCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("6F.3 Decision Evolution Tracker");
  });

  it("fails authority mismatch and expansion", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      authorityMismatchDetected: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.authorityIntegrityCertified).toBe(false);
    expect(result.visibility.authority_status).toBe("FAIL");
  });

  it("fails confidence corruption", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      confidenceCorruptionDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.confidenceIntegrityCertified).toBe(false);
    expect(result.visibility.confidence_status).toBe("FAIL");
  });

  it("fails governance bypass", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      governanceBypassDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.governanceComplianceCertified).toBe(false);
    expect(result.visibility.governance_status).toBe("FAIL");
  });

  it("fails replay mismatch", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      replayMismatchDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.replayPreservationCertified).toBe(false);
    expect(result.replay.replayResult).toBe("MISMATCH");
  });

  it("fails cross-tenant access", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      crossTenantAccessDetected: true,
      crossTenantReplayAccessDetected: true,
      crossTenantVisibilityDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.tenantIsolationCertified).toBe(false);
    expect(result.visibility.tenant_status).toBe("FAIL");
  });

  it("fails hidden certification failure visibility", () => {
    const result = sealTruthDecisionCertificationGate(baseCertificationInput({
      hiddenCertificationFailureDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.operatorVisibilityCertified).toBe(false);
    expect(result.visibility.visibility_status).toBe("FAIL");
  });
});
