import { describe, expect, it } from "vitest";
import { getTrustDriftDetectionBundle, replayTrustDriftDetection, runTrustDriftDetection, validateTrustDriftDetection } from "@/services/trust-drift-detection";
import type { TrustDriftFailure } from "@/types/trust-drift-detection";

const FAILURE_MATRIX: readonly TrustDriftFailure[] = [
  "P5_13_MONITORING_INVALID",
  "TRUST_DRIFT_ENGINE_MISSING",
  "ALIGNMENT_DRIFT_ANALYZER_MISSING",
  "CONFIDENCE_DEGRADATION_ANALYZER_MISSING",
  "TRUST_DEGRADATION_ANALYZER_MISSING",
  "DRIFT_CLASSIFICATION_MISSING",
  "DRIFT_SEVERITY_ENGINE_MISSING",
  "HISTORICAL_TREND_ANALYZER_MISSING",
  "ROOT_CAUSE_ANALYSIS_MISSING",
  "DRIFT_ALERT_ENGINE_MISSING",
  "DRIFT_EVIDENCE_REGISTRY_MISSING",
  "GOVERNANCE_INTEGRATION_MISSING",
  "HISTORICAL_BASELINE_MISSING",
  "CURRENT_STATE_MISSING",
  "DRIFT_INDICATORS_MISSING",
  "DRIFT_SEVERITY_NONDETERMINISTIC",
  "DRIFT_DETECTION_NONDETERMINISTIC",
  "DRIFT_REPLAY_FAILED",
  "DRIFT_EVIDENCE_MISSING",
  "DRIFT_EVIDENCE_UNVERIFIABLE",
  "DRIFT_REPORT_MISSING",
  "DRIFT_ALERTS_MISSING",
  "DRIFT_EXPLANATION_INCOMPLETE",
  "GOVERNANCE_ESCALATION_RULES_MISSING",
  "TRACEABILITY_INCOMPLETE",
  "TRUST_STANDING_RECALCULATED",
  "TRUST_STANDING_MODIFIED",
  "TRUST_DECISION_ISSUED",
  "TRUST_MONITORING_DASHBOARD_EXECUTED",
  "GOVERNANCE_REVIEW_EXECUTED",
  "SAFETY_QUALIFICATION_EXECUTED",
  "TENANT_ISOLATION_VIOLATED",
];

describe("P5.14 Trust Drift Detection", () => {
  it("publishes drift doctrine without owning trust decisions or standing changes", () => {
    const bundle = getTrustDriftDetectionBundle();

    expect(bundle.doctrine.version).toBe("trust-drift-detection/v5.14");
    expect(bundle.doctrine.owns_trust_drift).toBe(true);
    expect(bundle.doctrine.owns_alignment_drift).toBe(true);
    expect(bundle.doctrine.owns_confidence_degradation).toBe(true);
    expect(bundle.doctrine.owns_trust_degradation).toBe(true);
    expect(bundle.doctrine.recalculates_trust_standing).toBe(false);
    expect(bundle.doctrine.performs_monitoring_dashboards).toBe(false);
    expect(bundle.doctrine.executes_governance_reviews).toBe(false);
    expect(bundle.doctrine.qualifies_safety).toBe(false);
    expect(bundle.doctrine.issues_trust_decisions).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic drift records, classification, severity, reports, and alerts", () => {
    const first = runTrustDriftDetection();
    const second = runTrustDriftDetection();

    expect(first.phase_identifier).toBe("TrustDriftDetection");
    expect(first.monitoring_ref).toBe("trust-continuous-monitoring/v5.13");
    expect(first.classification.categories).toHaveLength(7);
    expect(first.classification.indicators.length).toBeGreaterThan(0);
    expect(first.classification.deterministic).toBe(true);
    expect(first.severity.severity).toBe("MODERATE");
    expect(first.severity.deterministic_thresholds).toBe(true);
    expect(first.trends.methods).toHaveLength(9);
    expect(first.trends.replay_comparison).toBe(true);
    expect(first.evidence.verifiable).toBe(true);
    expect(first.evidence.lineage_refs.length).toBeGreaterThan(0);
    expect(first.record.drift_state).toBe("DRIFT_DETECTED");
    expect(first.record.root_cause_analysis.length).toBeGreaterThan(0);
    expect(first.report.explanation.length).toBeGreaterThan(0);
    expect(first.alerts.length).toBe(1);
    expect(first.boundary.trust_standing_modified).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustDriftDetection(first).valid).toBe(true);
    expect(replayTrustDriftDetection(first)).toBe(true);
  });

  it("passes only when all drift detection exit criteria are satisfied", () => {
    const result = runTrustDriftDetection();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.trust_drift_detection_operational).toBe(true);
    expect(result.certification.alignment_drift_detection_operational).toBe(true);
    expect(result.certification.confidence_degradation_operational).toBe(true);
    expect(result.certification.trust_degradation_operational).toBe(true);
    expect(result.certification.classification_complete).toBe(true);
    expect(result.certification.severity_deterministic).toBe(true);
    expect(result.certification.trend_analysis_operational).toBe(true);
    expect(result.certification.replay_validation_succeeds).toBe(true);
    expect(result.certification.explainability_complete).toBe(true);
    expect(result.certification.governance_escalation_rules_implemented).toBe(true);
    expect(result.certification.alerts_generated_deterministically).toBe(true);
    expect(result.certification.outputs_traceable).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails drift certification for %s", (failure) => {
    const result = runTrustDriftDetection({ scenario: failure });
    const validation = validateTrustDriftDetection(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without drift readiness", () => {
    const result = runTrustDriftDetection({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustDriftDetection(result).valid).toBe(false);
  });

  it("requires verifiable evidence for detected drift", () => {
    const result = runTrustDriftDetection({ scenario: "DRIFT_EVIDENCE_UNVERIFIABLE" });

    expect(result.evidence.verifiable).toBe(false);
    expect(result.record.supporting_evidence).toHaveLength(0);
    expect(result.certification.outputs_traceable).toBe(false);
    expect(result.certification.failures).toContain("DRIFT_EVIDENCE_UNVERIFIABLE");
  });

  it("detects forbidden trust standing and governance side effects", () => {
    const standing = runTrustDriftDetection({ scenario: "TRUST_STANDING_MODIFIED" });
    const governance = runTrustDriftDetection({ scenario: "GOVERNANCE_REVIEW_EXECUTED" });

    expect(standing.boundary.trust_standing_modified).toBe(true);
    expect(standing.certification.boundary_respected).toBe(false);
    expect(governance.boundary.governance_review_executed).toBe(true);
    expect(governance.certification.boundary_respected).toBe(false);
  });
});
