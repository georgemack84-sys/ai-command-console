import { describe, expect, it } from "vitest";
import {
  buildRecoveryInterventionDashboardSurface,
  buildRecoveryInterventionPackage,
  computeRecoveryRecommendationHash,
  getRecoveryInterventionFramework,
} from "@/services/recovery-intervention-intelligence";
import type { RecoveryInterventionScenario, RecoveryRecommendedAction } from "@/types/recovery-intervention-intelligence";

describe("Mission Control Phase 8E.4 Recovery & Intervention Intelligence", () => {
  it("publishes deterministic doctrine, state machine, actions, and priorities", () => {
    const framework = getRecoveryInterventionFramework();

    expect(framework.doctrine.engine_version).toBe("recovery-intervention-intelligence/v8E.4");
    expect(framework.doctrine.principles).toContain("advisory-only-intelligence");
    expect(framework.doctrine.principles).toContain("operator-approval-mandatory");
    expect(framework.doctrine.states).toContain("AWAITING_GOVERNANCE");
    expect(framework.doctrine.actions).toEqual(["CONTINUE", "RETRY", "PAUSE", "ROLLBACK", "ALTERNATE_PLAN", "ESCALATE", "TERMINATE"]);
    expect(framework.doctrine.priorities).toEqual(["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW", "P5_INFORMATIONAL"]);
  });

  it("recommends continue for a healthy baseline without executing recovery", () => {
    const pkg = buildRecoveryInterventionPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("recovery-intervention-intelligence/v8E.4");
    expect(pkg.pipeline_state).toBe("CONTINUE");
    expect(pkg.recommendation.recommended_action).toBe("CONTINUE");
    expect(pkg.recommendation.operator_required).toBe(false);
    expect(pkg.recommendation.recovery_confidence).toBe("VERY_HIGH");
    expect(pkg.recommendation.intervention_priority).toBe("P5_INFORMATIONAL");
    expect(pkg.validation.ready_for_certification).toBe(true);
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.recovery_executed).toBe(false);
    expect(pkg.workflow_modified).toBe(false);
    expect(pkg.approval_granted).toBe(false);
    expect(pkg.authority_modified).toBe(false);
    expect(pkg.governance_bypassed).toBe(false);
  });

  it("produces deterministic recommendation hashes and replay reconstruction", () => {
    const first = buildRecoveryInterventionPackage();
    const second = buildRecoveryInterventionPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeRecoveryRecommendationHash(first.recommendation)).toBe(first.recommendation.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["INITIALIZING", "COLLECTING_EVIDENCE", "ANALYZING_FAILURE", "EVALUATING_OPTIONS", "ESTIMATING_CONFIDENCE", "PRIORITIZING_INTERVENTION", "GENERATING_RECOMMENDATION", "AWAITING_GOVERNANCE"]);
    expect(first.replay.reconstructed_action).toBe("CONTINUE");
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["TRANSIENT_FAILURE", "RETRY"],
    ["MISSING_APPROVAL", "PAUSE"],
    ["DEPENDENCY_UNAVAILABLE", "PAUSE"],
    ["CHECKPOINT_AVAILABLE", "ROLLBACK"],
    ["ALTERNATE_PLAN_AVAILABLE", "ALTERNATE_PLAN"],
    ["GOVERNANCE_CONFLICT", "ESCALATE"],
    ["AUTHORITY_AMBIGUITY", "TERMINATE"],
    ["EXECUTION_DEADLOCK", "ESCALATE"],
    ["CONFIDENCE_COLLAPSE", "ESCALATE"],
    ["UNRECOVERABLE_CORRUPTION", "TERMINATE"],
    ["REPLAY_IMPOSSIBLE", "TERMINATE"],
    ["CONSTITUTIONAL_VIOLATION", "TERMINATE"],
  ] as readonly [RecoveryInterventionScenario, RecoveryRecommendedAction][])("recommends %s as %s", (scenario, action) => {
    const pkg = buildRecoveryInterventionPackage({ scenario });

    expect(pkg.recommendation.recommended_action).toBe(action);
    expect(pkg.recommendation.operator_required).toBe(action !== "CONTINUE");
    expect(pkg.option_assessments).toHaveLength(7);
    expect(pkg.explainability.supporting_evidence.length).toBeGreaterThan(1);
    expect(pkg.recovery_executed).toBe(false);
    expect(pkg.approval_granted).toBe(false);
  });

  it("rejects rollback when checkpoint evidence is corrupted", () => {
    const pkg = buildRecoveryInterventionPackage({ scenario: "CHECKPOINT_CORRUPTED" });
    const rollback = pkg.option_assessments.find((item) => item.action === "ROLLBACK");

    expect(rollback?.eligible).toBe(false);
    expect(rollback?.rejection_reasons).toContain("CHECKPOINT_CORRUPTED");
    expect(pkg.recommendation.recommended_action).not.toBe("ROLLBACK");
  });

  it("fails closed when evidence is insufficient", () => {
    const pkg = buildRecoveryInterventionPackage({ scenario: "INSUFFICIENT_EVIDENCE" });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.evidence_complete).toBe(false);
    expect(pkg.validation.failures).toContain("INSUFFICIENT_EVIDENCE");
    expect(pkg.recommendation.recovery_confidence).toBe("INSUFFICIENT");
  });

  it("detects tampered recommendation evidence", () => {
    const pkg = buildRecoveryInterventionPackage({ scenario: "HASH_MISMATCH" });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.integrity_verified).toBe(false);
    expect(pkg.validation.failures).toContain("INTEGRITY_HASH_MISMATCH");
    expect(pkg.recommendation.recommended_action).toBe("TERMINATE");
  });

  it("projects dashboard state for operator review", () => {
    const dashboard = buildRecoveryInterventionDashboardSurface(buildRecoveryInterventionPackage({ scenario: "GOVERNANCE_CONFLICT" }));

    expect(dashboard.recommended_action).toBe("ESCALATE");
    expect(dashboard.operator_required).toBe(true);
    expect(dashboard.intervention_priority).toBe("P2_HIGH");
    expect(dashboard.integrity_status).toBe("VALID");
  });
});
