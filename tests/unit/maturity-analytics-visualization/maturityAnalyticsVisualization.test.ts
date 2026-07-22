import { describe, expect, it } from "vitest";
import {
  buildMaturityAnalyticsObservabilitySurface,
  buildMaturityAnalyticsVisualization,
  getMaturityAnalytics,
  getMaturityAnalyticsVisualizationBundle,
  listMaturityDashboards,
  listMaturityVisualizationRegistry,
  listMaturityVisualizationReports,
  validateMaturityAnalyticsVisualization,
} from "@/services/maturity-analytics-visualization";
import type { MaturityAnalyticsFailure, MaturityAnalyticsScenario } from "@/types/maturity-analytics-visualization";

describe("maturity analytics visualization", () => {
  it("publishes deterministic advisory-only analytics bundle", () => {
    const bundle = getMaturityAnalyticsVisualizationBundle();

    expect(bundle.doctrine.engine_version).toBe("maturity-analytics-visualization/v8ALT.11.9");
    expect(bundle.doctrine.final_state).toBe("MATURITY_ANALYTICS_VISUALIZATION_READY");
    expect(bundle.repository.final_state).toBe("MATURITY_ANALYTICS_VISUALIZATION_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.maturity_change_authorized).toBe(false);
    expect(bundle.repository.certification_approval_authorized).toBe(false);
    expect(bundle.repository.runtime_change_authorized).toBe(false);
    expect(bundle.repository.governance_change_authorized).toBe(false);
  });

  it("builds dashboards, analytics, registry, and reports from ledger evidence", () => {
    const repository = buildMaturityAnalyticsVisualization();

    expect(repository.registry).toHaveLength(8);
    expect(repository.dashboards).toHaveLength(8);
    expect(repository.reports).toHaveLength(5);
    expect(repository.analytics.domain_count).toBe(10);
    expect(repository.analytics.maturity_score).toBe(92);
    expect(repository.analytics.readiness_score).toBe(90);
    expect(repository.dashboards.every((dashboard) => dashboard.evidence_references.length > 0 && dashboard.replay_reference)).toBe(true);
    expect(repository.failures).toEqual([]);
  });

  it("keeps domain heatmaps canonical and runtime represented in existing domains", () => {
    const domains = buildMaturityAnalyticsVisualization().analytics.domain_heatmap.map((entry) => entry.domain);

    expect(domains).toContain("EXECUTION_INTELLIGENCE");
    expect(domains).toContain("RESILIENCE");
    expect(domains).toContain("VISIBILITY");
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(domains).toHaveLength(10);
  });

  it("keeps analytics deterministic and exposes slices", () => {
    const first = buildMaturityAnalyticsVisualization();
    const second = buildMaturityAnalyticsVisualization();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.analytics.integrity_hash).toBe(first.analytics.integrity_hash);
    expect(listMaturityDashboards()).toHaveLength(8);
    expect(getMaturityAnalytics().domain_heatmap).toHaveLength(10);
    expect(listMaturityVisualizationReports()).toHaveLength(5);
    expect(listMaturityVisualizationRegistry()).toHaveLength(8);
  });

  it.each([
    ["DASHBOARD_REPLAY_MISMATCH", "DASHBOARD_REPLAY_MISMATCHED"],
    ["VISUALIZATION_EVIDENCE_MISMATCH", "VISUALIZATION_EVIDENCE_MISMATCHED"],
    ["INCONSISTENT_HISTORICAL_TIMELINE", "HISTORICAL_TIMELINE_INCONSISTENT"],
    ["INCORRECT_DOMAIN_HEATMAP_VALUES", "DOMAIN_HEATMAP_VALUES_INCORRECT"],
    ["READINESS_FINDINGS_OMITTED", "READINESS_DASHBOARD_FINDINGS_OMITTED"],
    ["CERTIFICATION_STATUS_OMITTED", "CERTIFICATION_DASHBOARD_STATUS_OMITTED"],
    ["MISSING_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["INCOMPLETE_REPLAY_REFERENCES", "REPLAY_REFERENCES_INCOMPLETE"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_ANALYTICS", "HIDDEN_ANALYTICS_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [MaturityAnalyticsScenario, MaturityAnalyticsFailure][])("invalidates %s", (scenario, failure) => {
    const repository = buildMaturityAnalyticsVisualization({ scenario });
    const validation = validateMaturityAnalyticsVisualization(repository);

    expect(repository.final_state).toBe("MATURITY_ANALYTICS_VISUALIZATION_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.runtime_change_authorized).toBe(false);
    expect(repository.certification_approval_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "DASHBOARD_REPLAY_MISMATCH" })).dashboard_replay_verified).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "VISUALIZATION_EVIDENCE_MISMATCH" })).visualization_evidence_consistent).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "INCONSISTENT_HISTORICAL_TIMELINE" })).historical_timeline_consistent).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "INCORRECT_DOMAIN_HEATMAP_VALUES" })).domain_heatmap_correct).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "READINESS_FINDINGS_OMITTED" })).readiness_findings_present).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "CERTIFICATION_STATUS_OMITTED" })).certification_status_present).toBe(false);
    expect(validateMaturityAnalyticsVisualization(buildMaturityAnalyticsVisualization({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without runtime authority", () => {
    const surface = buildMaturityAnalyticsObservabilitySurface(buildMaturityAnalyticsVisualization({ scenario: "HIDDEN_ANALYTICS" }));

    expect(surface.final_state).toBe("MATURITY_ANALYTICS_VISUALIZATION_FAILED");
    expect(surface.dashboard_count).toBe(8);
    expect(surface.registry_count).toBe(8);
    expect(surface.report_count).toBe(5);
    expect(surface.domain_count).toBe(10);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.runtime_change_authorized).toBe(false);
  });
});
