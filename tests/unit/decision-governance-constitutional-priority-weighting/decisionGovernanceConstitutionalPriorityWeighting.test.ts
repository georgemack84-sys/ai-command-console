import { describe, expect, it } from "vitest";
import {
  buildGovernanceConstitutionalPriorityObservability,
  getGovernanceConstitutionalPriorityWeightingEngine,
  replayGovernanceConstitutionalPriorityWeighting,
  weightGovernanceAndConstitutionalPriority,
} from "@/services/decision-governance-constitutional-priority-weighting";

describe("Mission Control Phase 9.5.4 Governance & Constitutional Priority Weighting", () => {
  it("weights governance and constitutional priority deterministically with replayable evidence", () => {
    const first = weightGovernanceAndConstitutionalPriority();
    const second = weightGovernanceAndConstitutionalPriority();

    expect(first).toEqual(second);
    expect(first.prioritization_status).toBe("PASS");
    expect(first.governance_assessment.composite_governance_score).toBeGreaterThan(0);
    expect(first.governance_assessment.governance_priority_level).not.toBe("NONE");
    expect(first.explanation.governance_rationale).toContain(first.governance_assessment.governance_priority_level);
    expect(first.ledger_record.governance_assessment_ref).toBe(first.governance_assessment.assessment_id);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_input.governance_score).toBe(first.governance_assessment.composite_governance_score);
    expect(first.priority_input.operator_score).toBe(first.ledger_record.operator_score);
    expect(first.advisoryOnly).toBe(true);
  });

  it("elevates constitutional violations and governance conflicts for immediate review", () => {
    const result = weightGovernanceAndConstitutionalPriority({
      governance_weight: 95,
      constitutional_severity: 98,
      policy_violation_score: 96,
      certification_blocker_score: 90,
      compliance_score: 90,
      regulatory_exposure_score: 88,
      governance_refs: ["mandatory_policy_violation_gov_204"],
      constitutional_refs: ["constitutional_violation_safeguard"],
      certification_refs: ["certification_failed_dependency"],
      compliance_refs: ["compliance_failure_audit"],
      regulatory_refs: ["regulatory_external_oversight_reporting"],
    });

    expect(result.governance_assessment.governance_priority_level).toBe("CRITICAL");
    expect(result.governance_assessment.constitutional_severity_level).toBe("CRITICAL");
    expect(result.governance_assessment.escalation_status).toBe("IMMEDIATE_GOVERNANCE_REVIEW");
    expect(result.ledger_record.priority_adjustment).toBe(20);
    expect(result.priority_input.governance_score).toBeGreaterThanOrEqual(90);
  });

  it("routes authority conflicts to operator review while preserving advisory-only behavior", () => {
    const result = weightGovernanceAndConstitutionalPriority({
      authority_conflict_score: 85,
      authority_conflict_type: "OPERATOR_BOUNDARY",
      authority_refs: ["authority_operator_boundary_overlap"],
      constitutional_severity: 30,
      policy_violation_score: 20,
      certification_blocker_score: 20,
      compliance_score: 40,
      regulatory_exposure_score: 30,
    });

    expect(result.authority_assessment.operator_review_required).toBe(true);
    expect(result.authority_assessment.conflict_type).toBe("OPERATOR_BOUNDARY");
    expect(result.governance_assessment.escalation_status).toBe("OPERATOR_REVIEW");
    expect(result.ledger_record.operator_score).toBe(90);
    expect(result.priority_input.advisory_only).toBe(true);
  });

  it("fails closed for missing refs, invalid compliance inputs, tenant leakage, hidden weighting, and replay mismatch", () => {
    const noGovernance = weightGovernanceAndConstitutionalPriority({ governance_refs: [] });
    const noConstitutional = weightGovernanceAndConstitutionalPriority({ constitutional_refs: [] });
    const noAuthority = weightGovernanceAndConstitutionalPriority({ authority_refs: [] });
    const noCertification = weightGovernanceAndConstitutionalPriority({ certification_verified: false, certification_refs: [] });
    const invalidCompliance = weightGovernanceAndConstitutionalPriority({ compliance_score: 101 });
    const noReplay = weightGovernanceAndConstitutionalPriority({ replay_refs: [] });
    const tenantLeak = weightGovernanceAndConstitutionalPriority({ governance_refs: ["governance_tenant_beta_leak"] });
    const hidden = weightGovernanceAndConstitutionalPriority({ hidden_weighting_refs: ["hidden"] });
    const base = weightGovernanceAndConstitutionalPriority();
    const replayMismatch = weightGovernanceAndConstitutionalPriority({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noConstitutional.failures).toContain("CONSTITUTIONAL_REFERENCES_MISSING");
    expect(noAuthority.failures).toContain("AUTHORITY_METADATA_INCOMPLETE");
    expect(noCertification.failures).toContain("CERTIFICATION_STATUS_UNVERIFIED");
    expect(invalidCompliance.failures).toContain("COMPLIANCE_INPUTS_INVALID");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_GOVERNANCE_DATA_DETECTED");
    expect(hidden.failures).toContain("HIDDEN_GOVERNANCE_WEIGHTING_DETECTED");
    expect(replayMismatch.failures).toContain("GOVERNANCE_REPLAY_MISMATCH");
  });

  it("replays governance priority artifacts and reports observability", () => {
    const valid = weightGovernanceAndConstitutionalPriority();
    const invalid = weightGovernanceAndConstitutionalPriority({ governance_refs: [] });
    const authorityReview = weightGovernanceAndConstitutionalPriority({
      authority_conflict_score: 90,
      authority_conflict_type: "UNAUTHORIZED_AUTHORITY",
    });
    const replay = replayGovernanceConstitutionalPriorityWeighting(valid);
    const engine = getGovernanceConstitutionalPriorityWeightingEngine();
    const metrics = buildGovernanceConstitutionalPriorityObservability([valid, invalid, authorityReview]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("governance-constitutional-priority-weighting-engine/v1");
    expect(metrics.evaluations).toBe(3);
    expect(metrics.pass_count).toBe(2);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.governance_failures).toBe(1);
    expect(metrics.operator_review_required).toBe(1);
    expect(metrics.average_governance_score).toBeGreaterThan(0);
    expect(metrics.average_operator_score).toBeGreaterThan(0);
  });
});
