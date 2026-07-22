import { describe, expect, it } from "vitest";

import {
  certifyOperatorVisibility,
  getOperatorVisibilityContract,
  replayOperatorVisibilityCertification,
  validateOperatorVisibilityCertification,
} from "../../../services/operator-visibility-certification";
import type { OperatorVisibilityFailure, OperatorVisibilityScenario } from "../../../types/operator-visibility-certification";

const failureScenarios: ReadonlyArray<readonly [OperatorVisibilityScenario, OperatorVisibilityFailure]> = [
  ["HIDDEN_BEHAVIOR", "HIDDEN_ADAPTIVE_BEHAVIOR"],
  ["HIDDEN_PROPOSAL", "HIDDEN_PROPOSAL_GENERATION"],
  ["HIDDEN_SIMULATION", "HIDDEN_SIMULATION_EXECUTION"],
  ["UNDISCLOSED_DRIFT", "UNDISCLOSED_DRIFT_EVENT"],
  ["HIDDEN_GOVERNANCE", "HIDDEN_GOVERNANCE_DECISION"],
  ["UNEXPLAINED_CONFIDENCE", "UNEXPLAINED_CONFIDENCE_ADJUSTMENT"],
  ["UNEXPLAINED_RISK", "UNEXPLAINED_RISK_ADJUSTMENT"],
  ["HIDDEN_MEMORY", "HIDDEN_ADAPTIVE_MEMORY_USAGE"],
  ["DASHBOARD_OMISSION", "DASHBOARD_OMISSION"],
  ["INCOMPLETE_EXPLAINABILITY", "INCOMPLETE_EXPLAINABILITY"],
  ["MISSING_EVIDENCE_REFS", "MISSING_EVIDENCE_REFERENCES"],
  ["MISSING_REPLAY_REFS", "MISSING_REPLAY_REFERENCES"],
  ["INCOMPLETE_GOVERNANCE_LINEAGE", "INCOMPLETE_GOVERNANCE_LINEAGE"],
  ["TENANT_VISIBILITY_BREACH", "TENANT_VISIBILITY_BREACH"],
  ["UNAUTHORIZED_DISCLOSURE", "UNAUTHORIZED_INFORMATION_DISCLOSURE"],
  ["DASHBOARD_RENDERING_INCONSISTENT", "INCONSISTENT_DASHBOARD_RENDERING"],
  ["STALE_DASHBOARD_STATE", "STALE_DASHBOARD_STATE"],
  ["INCOMPLETE_AUDIT_VISIBILITY", "INCOMPLETE_AUDIT_VISIBILITY"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("operator visibility certification", () => {
  it("publishes the operator visibility doctrine", () => {
    const contract = getOperatorVisibilityContract();

    expect(contract.doctrine.version).toBe("operator-visibility-certification/v10.15.7");
    expect(contract.doctrine.complete_visibility_required).toBe(true);
    expect(contract.doctrine.hidden_behavior_prohibited).toBe(true);
    expect(contract.doctrine.explainability_required).toBe(true);
    expect(contract.doctrine.replay_navigation_required).toBe(true);
    expect(contract.doctrine.tenant_safe_visibility_required).toBe(true);
    expect(contract.doctrine.role_based_visibility_required).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies operator visibility deterministically", () => {
    const first = certifyOperatorVisibility();
    const second = certifyOperatorVisibility();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.visible).toBe(true);
    expect(first.explainable).toBe(true);
    expect(first.replayable).toBe(true);
    expect(first.tenant_safe).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateOperatorVisibilityCertification(first).valid).toBe(true);
    expect(replayOperatorVisibilityCertification(first)).toBe(true);
  });

  it("validates every visibility domain", () => {
    const result = certifyOperatorVisibility();

    expect(result.proposal_visibility.generation_visible).toBe(true);
    expect(result.simulation_visibility.assumptions_visible).toBe(true);
    expect(result.drift_visibility.classification_severity_evidence_visible).toBe(true);
    expect(result.governance_visibility.constitutional_reviews_visible).toBe(true);
    expect(result.confidence_risk_visibility.confidence_rationale_complete).toBe(true);
    expect(result.confidence_risk_visibility.risk_rationale_complete).toBe(true);
    expect(result.memory_visibility.tenant_isolated).toBe(true);
    expect(result.dashboard_visibility.reflects_certified_ledger_state).toBe(true);
    expect(result.explainability_visibility.evidence_refs_available).toBe(true);
    expect(result.visibility_restriction.role_based_visibility_enforced).toBe(true);
  });

  it("emits complete visibility and transparency reports", () => {
    const result = certifyOperatorVisibility();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.dashboard_validation).toBe("PASS");
    expect(result.transparency_report.end_to_end_visibility_coverage).toBe("PASS");
    expect(result.transparency_report.evidence_inspection_capability).toBe(true);
    expect(result.transparency_report.replay_navigation_support).toBe(true);
    expect(result.transparency_report.operator_awareness_score).toBe(1);
    expect(result.validation_tests).toHaveLength(25);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyOperatorVisibility({ scenario });
    const validation = validateOperatorVisibilityCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayOperatorVisibilityCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyOperatorVisibility();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        hidden_behavior_detected: true,
      },
    };

    expect(validateOperatorVisibilityCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayOperatorVisibilityCertification(tampered)).toBe(false);
  });
});
