import { describe, expect, it } from "vitest";
import {
  ARBITRATION_DASHBOARDS,
  ARBITRATION_TREND_REPORTS,
  analyzeArbitrationTrends,
  collectArbitrationMetrics,
  generateArbitrationDashboards,
  generateArbitrationTrendReports,
  getArbitrationObservabilityAnalyticsFoundation,
  replayArbitrationObservabilityAnalytics,
  runArbitrationObservabilityAnalytics,
  writeArbitrationAnalyticsLedger,
} from "@/services/decision-arbitration-observability-analytics";
import { computeConflictLedgerEntryHash, writeConflictLedger } from "@/services/decision-conflict-ledger";
import { enforceConstitutionAndGovernance } from "@/services/decision-constitutional-governance-enforcement";

describe("Mission Control Phase 9.6.9 Arbitration Observability & Analytics", () => {
  it("publishes the analytics foundation with deterministic dashboards and reports", () => {
    const foundation = getArbitrationObservabilityAnalyticsFoundation();

    expect(foundation.analytics_version).toBe("arbitration-observability-analytics/v1");
    expect(foundation.dashboards).toEqual(ARBITRATION_DASHBOARDS);
    expect(foundation.trend_reports).toEqual(ARBITRATION_TREND_REPORTS);
    expect(foundation.result.analytics_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("collects conflict, resolution, escalation, governance, replay, and certification metrics from immutable records", () => {
    const metrics = collectArbitrationMetrics();

    expect(metrics.conflict_frequency).toBeGreaterThan(0);
    expect(metrics.conflict_density).toBeGreaterThan(0);
    expect(metrics.conflicts_by_tenant.tenant_alpha).toBeGreaterThan(0);
    expect(metrics.outcomes_by_type.RESOLVED + metrics.outcomes_by_type.ESCALATE_TO_GOVERNANCE + metrics.outcomes_by_type.REQUIRE_CERTIFICATION).toBeGreaterThan(0);
    expect(metrics.escalations_by_destination.Governance + metrics.escalations_by_destination.Certification + metrics.escalations_by_destination.Operator).toBeGreaterThanOrEqual(0);
    expect(metrics.certification_requests).toBeGreaterThan(0);
    expect(metrics.replay_validations).toBe(5);
    expect(metrics.integrity_failures).toBe(0);
  });

  it("generates all required dashboards and trend reports", () => {
    const metrics = collectArbitrationMetrics();
    const dashboards = generateArbitrationDashboards(metrics);
    const reports = generateArbitrationTrendReports(metrics);

    expect(dashboards.map((dashboard) => dashboard.dashboard_name)).toEqual(ARBITRATION_DASHBOARDS);
    expect(reports.map((report) => report.report_type)).toEqual(ARBITRATION_TREND_REPORTS);
    expect(dashboards.find((dashboard) => dashboard.dashboard_name === "Conflict Categories")?.metrics.Constitutional).toBeGreaterThan(0);
    expect(reports.every((report) => report.reporting_period === "deterministic-ledger-window")).toBe(true);
  });

  it("produces deterministic trend points and append-only analytics ledger evidence", () => {
    const metrics = collectArbitrationMetrics();
    const trends = analyzeArbitrationTrends(metrics);
    const dashboards = generateArbitrationDashboards(metrics);
    const reports = generateArbitrationTrendReports(metrics);
    const ledger = writeArbitrationAnalyticsLedger(metrics, dashboards, trends, reports);

    expect(trends.map((trend) => trend.direction)).toEqual(["UNCHANGED", "UNCHANGED", "UNCHANGED", "UNCHANGED", "UNCHANGED"]);
    expect(ledger).toHaveLength(reports.length);
    expect(ledger.every((record) => record.advisory_only)).toBe(true);
    expect(ledger.every((record) => record.dashboard_refs.length === dashboards.length)).toBe(true);
  });

  it("fails closed for unauthorized observability access and replay mismatches", () => {
    const valid = runArbitrationObservabilityAnalytics();

    expect(runArbitrationObservabilityAnalytics({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_OBSERVABILITY_ACCESS");
    expect(runArbitrationObservabilityAnalytics({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_CORRUPTION");
  });

  it("fails closed when source ledgers omit governance or constitutional context", () => {
    const ledger = writeConflictLedger();
    const noGovernance = ledger.entries.map((entry, index) => index === 0 ? { ...entry, governance_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, governance_refs: [] }) } : entry);
    const noConstitution = ledger.entries.map((entry, index) => index === 0 ? { ...entry, constitutional_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, constitutional_refs: [] }) } : entry);

    expect(runArbitrationObservabilityAnalytics({ ledger_result: { ...ledger, entries: noGovernance }, enforcement_result: enforceConstitutionAndGovernance({ entries: noGovernance }) }).failures).toContain("MISSING_GOVERNANCE_CONTEXT");
    expect(runArbitrationObservabilityAnalytics({ ledger_result: { ...ledger, entries: noConstitution }, enforcement_result: enforceConstitutionAndGovernance({ entries: noConstitution }) }).failures).toContain("MISSING_CONSTITUTIONAL_CONTEXT");
  });

  it("detects tenant isolation breaches and integrity failures as analytics blockers", () => {
    const ledger = writeConflictLedger();
    const tenantLeak = ledger.entries.map((entry, index) => index === 0 ? { ...entry, evidence_refs: ["evidence_tenant_beta_leak"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: ["evidence_tenant_beta_leak"] }) } : entry);
    const tampered = ledger.entries.map((entry, index) => index === 0 ? { ...entry, source_component: "tampered" } : entry);

    expect(runArbitrationObservabilityAnalytics({ ledger_result: { ...ledger, entries: tenantLeak }, enforcement_result: enforceConstitutionAndGovernance({ entries: tenantLeak }) }).failures).toContain("TENANT_ISOLATION_BREACH");
    expect(runArbitrationObservabilityAnalytics({ ledger_result: { ...ledger, entries: tampered }, enforcement_result: enforceConstitutionAndGovernance({ entries: tampered }) }).failures).toContain("REPLAY_CORRUPTION");
  });

  it("replays analytics collections, dashboards, reports, and ledger records deterministically", () => {
    const result = runArbitrationObservabilityAnalytics();
    const replay = replayArbitrationObservabilityAnalytics(result);
    const tampered = replayArbitrationObservabilityAnalytics({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.collection_ref).toBe(result.metrics.collection_id);
    expect(replay.dashboard_refs).toEqual(result.dashboards.map((dashboard) => dashboard.dashboard_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });
});
