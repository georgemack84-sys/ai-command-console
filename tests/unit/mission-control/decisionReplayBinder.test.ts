import { describe, expect, it } from "vitest";
import {
  buildTruthDecisionContractRequest,
  buildTruthDecisionEvolutionRequest,
  buildTruthDecisionRecorderRequest,
  buildTruthDecisionReplayBinderCertificationRequest,
  buildTruthDecisionReplayRequest,
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
      now: "2026-06-24T12:00:00.000Z",
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
      authority_timestamp: "2026-06-24T11:59:00.000Z",
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
      now: "2026-06-24T12:01:00.000Z",
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
      now: "2026-06-24T12:02:00.000Z",
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

function baseReplayInput(overrides: Record<string, unknown> = {}) {
  const decision = baseDecision();
  const recordedDecision = baseRecorder(decision);
  const evolution = baseEvolution(decision, recordedDecision);

  return {
    request: buildTruthDecisionReplayRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T12:03:00.000Z",
    }),
    decision,
    recordedDecision,
    evolution,
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
    ...overrides,
  };
}

function baseCertificationInput(overrides: Record<string, unknown> = {}) {
  return {
    request: buildTruthDecisionReplayBinderCertificationRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T12:04:00.000Z",
    }),
    replayBinder: sealTruthDecisionReplayBinder(baseReplayInput()),
    certificationAuthority: "mission-control-certifier",
    certificationReason: "Validate Phase 6F.4 decision replay binder readiness.",
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("decisionReplayBinder", () => {
  it("reconstructs a decision deterministically", () => {
    const first = sealTruthDecisionReplayBinder(baseReplayInput());
    const second = sealTruthDecisionReplayBinder(baseReplayInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.replayResult.replayResult).toBe("REPRODUCED");
    expect(first.replayResult.verificationState).toBe("MATCH");
  });

  it("fails missing context", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      missingContextComponentDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("DECISION_CONTEXT_MISSING");
  });

  it("fails evidence mismatch", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      evidenceMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("EVIDENCE_MISMATCH");
  });

  it("fails governance mismatch", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      policyMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("GOVERNANCE_MISMATCH");
  });

  it("fails authority mismatch", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      authorityMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.replayResult.verificationState).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("AUTHORITY_MISMATCH");
  });

  it("fails confidence mismatch", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      confidenceMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("CONFIDENCE_MISMATCH");
  });

  it("fails environment mismatch", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      environmentMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("ENVIRONMENT_MISMATCH");
  });

  it("fails incomplete bundle", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      incompleteBundleDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("BUNDLE_INCOMPLETE");
  });

  it("fails decision mismatch verification", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      decisionMismatchDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.replayResult.verificationState).toBe("MISMATCH");
  });

  it("fails cross-tenant replay access", () => {
    const result = sealTruthDecisionReplayBinder(baseReplayInput({
      crossTenantReplayDetected: true,
      crossTenantContextAccessDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("TENANT_ISOLATION_FAILED");
  });

  it("certifies the decision replay binder deterministically", () => {
    const first = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput());
    const second = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput());

    expect(first).toEqual(second);
    expect(first.certification.certification_state).toBe("PASS");
    expect(first.completionGate).toBe("DECISION_REPLAY_BINDER_CERTIFIED");
    expect(first.validation.reasonCodes).toContain("EXACT_RECONSTRUCTION_CERTIFIED");
    expect(first.validation.reasonCodes).toContain("FAIL_CLOSED_CERTIFIED");
    expect(first.visibility.certified_components).toContain("Replay Verification Engine");
  });

  it("allows a conditional pass for non-critical observability and reporting gaps", () => {
    const result = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationPlanExists: true,
      governanceApproved: true,
    }));

    expect(result.certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(result.completionGate).toBe("DECISION_REPLAY_BINDER_CONDITIONAL");
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
    expect(result.visibility.failed_components).toContain("Replay Observability");
  });

  it("fails the certification gate when exact reconstruction is unavailable", () => {
    const replayBinder = sealTruthDecisionReplayBinder(baseReplayInput({
      decisionMismatchDetected: true,
    }));
    const result = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput({
      replayBinder,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.completionGate).toBe("DECISION_REPLAY_BINDER_FAILED");
    expect(result.validation.exactReconstructionCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("Exact Decision Reconstruction");
  });

  it("fails the certification gate on replay ledger mutation evidence", () => {
    const result = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput({
      replayLedgerMutationDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.ledgerCertified).toBe(false);
    expect(result.visibility.failed_components).toContain("Replay Ledger");
  });

  it("fails closed when certification is asked to expose control behavior", () => {
    const result = sealTruthDecisionReplayBinderCertificationGate(baseCertificationInput({
      executionRequested: true,
      approvalRequested: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification.certification_state).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.approvalAllowed).toBe(false);
  });
});
