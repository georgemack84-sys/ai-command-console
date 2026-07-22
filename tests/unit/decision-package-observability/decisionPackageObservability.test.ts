import { describe, expect, it } from "vitest";
import { commitDecisionPackageLedger } from "@/services/decision-package-ledger";
import {
  DECISION_PACKAGE_OBSERVABILITY_STATES,
  computeCompletenessMetricsHash,
  computeDecisionPackageObservabilityRecordHash,
  computeExplainabilityMetricsHash,
  computeGenerationAnalyticsRecordHash,
  computeOperatorVisibilityReportHash,
  createDecisionPackageObservabilityRecord,
  createOperatorVisibilityReport,
  getDecisionPackageObservabilityFoundation,
  measureCompleteness,
  measureExplainability,
  measureGenerationAnalytics,
  observeDecisionPackage,
  replayDecisionPackageObservability,
} from "@/services/decision-package-observability";

describe("Mission Control Phase 9.8.11 Decision Package Observability & Explainability", () => {
  it("publishes the decision package observability foundation", () => {
    const foundation = getDecisionPackageObservabilityFoundation();

    expect(foundation.observability_version).toBe("decision-package-observability/v1");
    expect(foundation.observability_states).toEqual(DECISION_PACKAGE_OBSERVABILITY_STATES);
    expect(foundation.result.observability_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic metrics without modifying the ledger package", () => {
    const first = observeDecisionPackage();
    const second = observeDecisionPackage();

    expect(first).toEqual(second);
    expect(first.ledger_result.immutable_package.package_payload).toEqual(first.ledger_result.reference_result.package);
    expect(first.record.completeness_score).toBe(1);
    expect(first.record.explainability_score).toBeGreaterThan(0);
    expect(first.record.replay_availability).toBe(true);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.observability_ledger).toHaveLength(1);
  });

  it("creates completeness, explainability, analytics, visibility, dashboard, and scorecard views", () => {
    const result = observeDecisionPackage();

    expect(result.completeness_metrics.missing_sections).toEqual([]);
    expect(result.explainability_metrics.rationale_present).toBe(true);
    expect(result.generation_analytics.total_generation_latency).toBe(0);
    expect(result.operator_visibility_report.usability_assessment).toBe("READY");
    expect(result.dashboard.executive_view.length).toBeGreaterThan(0);
    expect(result.dashboard.engineering_view.length).toBeGreaterThan(0);
    expect(result.dashboard.governance_view.length).toBeGreaterThan(0);
    expect(result.dashboard.operator_view.length).toBeGreaterThan(0);
    expect(result.scorecard.overall_score).toBeGreaterThan(0);
  });

  it("fails closed when completeness, explainability, visibility, replay, analytics, replay refs, or lineage refs are missing", () => {
    const ledger = commitDecisionPackageLedger();
    const completeness = measureCompleteness(ledger);
    const explainability = measureExplainability(ledger);
    const analytics = measureGenerationAnalytics(ledger);
    const visibility = createOperatorVisibilityReport(ledger);
    const record = createDecisionPackageObservabilityRecord(ledger, completeness, explainability, analytics, visibility);

    expect(observeDecisionPackage({ completeness_metrics: { ...completeness, completed_sections: [], integrity_hash: computeCompletenessMetricsHash({ ...completeness, completed_sections: [] }) } }).failures).toContain("COMPLETENESS_METRICS_MISSING");
    expect(observeDecisionPackage({ explainability_metrics: { ...explainability, explainability_score: 0, integrity_hash: computeExplainabilityMetricsHash({ ...explainability, explainability_score: 0 }) } }).failures).toContain("EXPLAINABILITY_METRICS_UNAVAILABLE");
    expect(observeDecisionPackage({ operator_visibility_report: { ...visibility, visibility_summary: "", integrity_hash: computeOperatorVisibilityReportHash({ ...visibility, visibility_summary: "" }) } }).failures).toContain("OPERATOR_VISIBILITY_REPORT_MISSING");
    expect(observeDecisionPackage({ record: { ...record, replay_availability: false, integrity_hash: computeDecisionPackageObservabilityRecordHash({ ...record, replay_availability: false }) } }).failures).toContain("REPLAY_AVAILABILITY_UNVERIFIED");
    expect(observeDecisionPackage({ generation_analytics: { ...analytics, total_generation_latency: -1, integrity_hash: computeGenerationAnalyticsRecordHash({ ...analytics, total_generation_latency: -1 }) } }).failures).toContain("ANALYTICS_INCOMPLETE");
    expect(observeDecisionPackage({ record: { ...record, replay_ref: "", integrity_hash: computeDecisionPackageObservabilityRecordHash({ ...record, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(observeDecisionPackage({ record: { ...record, lineage_ref: "", integrity_hash: computeDecisionPackageObservabilityRecordHash({ ...record, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
  });

  it("rejects invalid ledger, unauthorized access, replay divergence, tenant mismatch, advisory violation, and tampering", () => {
    const valid = observeDecisionPackage();
    const badLedger = { ...valid.ledger_result, ledger_status: "FAIL" as const };

    expect(observeDecisionPackage({ ledger_result: badLedger }).failures).toContain("LEDGER_INVALID");
    expect(observeDecisionPackage({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_OBSERVABILITY_ACCESS");
    expect(observeDecisionPackage({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(observeDecisionPackage({ record: { ...valid.record, tenant_id: "tenant_beta", integrity_hash: computeDecisionPackageObservabilityRecordHash({ ...valid.record, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(observeDecisionPackage({ record: { ...valid.record, advisory_only: false as true, integrity_hash: computeDecisionPackageObservabilityRecordHash({ ...valid.record, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(observeDecisionPackage({ record: { ...valid.record, completeness_score: 0.25 } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("replays observability reports deterministically", () => {
    const result = observeDecisionPackage();
    const replay = replayDecisionPackageObservability(result);
    const tampered = replayDecisionPackageObservability({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.observability_id).toBe(result.record.observability_id);
    expect(replay.completeness_score).toBe(result.record.completeness_score);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
