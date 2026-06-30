import { describe, expect, it } from "vitest";
import {
  buildDriftHealthDashboardSurface,
  buildDriftHealthPackage,
  computeDriftHealthEvidenceHash,
  computeDriftIntelligenceHash,
  computeHealthAssessmentHash,
  computeSupervisionAlertHash,
  getDriftHealthFramework,
} from "@/services/drift-health-intelligence";
import type { DriftHealthFailureReason, DriftHealthScenario } from "@/types/drift-health-intelligence";

describe("Mission Control Phase 8E.C Drift & Health Intelligence", () => {
  it("publishes drift and health doctrine, states, severity, and health levels", () => {
    const framework = getDriftHealthFramework();

    expect(framework.doctrine.engine_version).toBe("drift-health-intelligence/v8E.C");
    expect(framework.doctrine.principles).toContain("advisory-only-analysis");
    expect(framework.doctrine.principles).toContain("no-hidden-analysis");
    expect(framework.doctrine.states).toContain("DRIFT_DETECTED");
    expect(framework.doctrine.severity_levels).toEqual(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(framework.doctrine.runtime_health_levels).toEqual(["OPTIMAL", "HEALTHY", "STABLE", "DEGRADED", "HIGH_RISK", "CRITICAL"]);
  });

  it("builds a stable baseline analysis package without adaptive behavior", () => {
    const pkg = buildDriftHealthPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("drift-health-intelligence/v8E.C");
    expect(pkg.analysis_state).toBe("STABLE");
    expect(pkg.drift_intelligence.severity).toBe("NONE");
    expect(pkg.health_assessment.runtime_health).toBe("OPTIMAL");
    expect(pkg.supervision_alert.recommended_action).toBe("CONTINUE_MONITORING");
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.execution_modified).toBe(false);
    expect(pkg.governance_modified).toBe(false);
    expect(pkg.adaptive_behavior_triggered).toBe(false);
    expect(pkg.hidden_analysis_used).toBe(false);
  });

  it("produces deterministic hashes, evidence, and replay reconstruction", () => {
    const first = buildDriftHealthPackage();
    const second = buildDriftHealthPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeDriftIntelligenceHash(first.drift_intelligence)).toBe(first.drift_intelligence.integrity_hash);
    expect(computeHealthAssessmentHash(first.health_assessment)).toBe(first.health_assessment.integrity_hash);
    expect(computeSupervisionAlertHash(first.supervision_alert)).toBe(first.supervision_alert.integrity_hash);
    expect(computeDriftHealthEvidenceHash(first.drift_evidence)).toBe(first.drift_evidence.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["Observation Received", "Normalization", "Baseline Comparison", "Drift Detection", "Severity Assessment", "Health Evaluation", "Trend Projection", "Alert Generation", "Evidence Recording"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["WORKFLOW_DEVIATION", "WORKFLOW_DEVIATION_MISSED"],
    ["CHECKPOINT_VIOLATION", "CHECKPOINT_VIOLATION_MISSED"],
    ["ORDERING_VIOLATION", "ORDERING_DRIFT_MISSED"],
    ["UNAUTHORIZED_STATE_TRANSITION", "EXECUTION_DRIFT_NOT_DETECTED"],
    ["POLICY_DRIFT", "GOVERNANCE_DRIFT_NOT_IDENTIFIED"],
    ["AUTHORITY_DRIFT", "AUTHORITY_DRIFT_NOT_RECOGNIZED"],
    ["CONSTITUTIONAL_DRIFT", "CONSTITUTIONAL_DRIFT_NOT_DETECTED"],
    ["CONFIDENCE_DEGRADATION", "CONFIDENCE_DEGRADATION_NOT_MEASURED"],
    ["EVIDENCE_DETERIORATION", "EVIDENCE_DETERIORATION_NOT_IDENTIFIED"],
    ["HEALTH_DEGRADATION", "HEALTH_DEGRADATION_NOT_ASSESSED"],
    ["RETRY_STORM", "RETRY_STORM_MISSED"],
    ["DEPENDENCY_FAILURE", "DEPENDENCY_FAILURE_MISSED"],
    ["SEVERITY_NONDETERMINISTIC", "SEVERITY_SCORING_NONDETERMINISTIC"],
    ["TREND_REPLAY_FAILED", "TREND_ANALYSIS_NOT_REPRODUCIBLE"],
    ["ALERT_INCOMPLETE", "SUPERVISION_ALERT_INCOMPLETE"],
    ["EVIDENCE_INCOMPLETE", "DRIFT_EVIDENCE_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["HIDDEN_ANALYSIS", "HIDDEN_ANALYTICAL_STATE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [DriftHealthScenario, DriftHealthFailureReason][])("rejects scenario %s", (scenario, reason) => {
    const pkg = buildDriftHealthPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.validation.ready_for_supervision_alerting).toBe(false);
    expect(pkg.replay.validation_state).toBe("FAIL");
  });

  it("projects dashboard state for critical drift", () => {
    const dashboard = buildDriftHealthDashboardSurface(buildDriftHealthPackage({ scenario: "CONSTITUTIONAL_DRIFT" }));

    expect(dashboard.validation_state).toBe("FAIL");
    expect(dashboard.severity).toBe("CRITICAL");
    expect(dashboard.runtime_health).toBe("CRITICAL");
    expect(dashboard.recommended_action).toBe("RECOMMEND_ESCALATION");
    expect(dashboard.integrity_status).toBe("VALID");
  });
});
