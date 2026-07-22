import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateGovernanceAwareRiskAdaptation } from "@/services/governance-aware-risk-adaptation";
import { analyzeRiskAdaptationLedger } from "@/services/risk-adaptation-ledger";
import { runRiskAdaptationSimulation } from "@/services/risk-adaptation-simulation";
import { analyzeRiskDrift } from "@/services/risk-drift-detector";
import { analyzeRiskPatternIntelligence } from "@/services/risk-pattern-intelligence";
import { analyzeRiskSeverityRecalibration } from "@/services/risk-severity-recalibrator";
import type {
  RiskAdaptationDashboardApiSurface,
  RiskAdaptationDashboardFailure,
  RiskAdaptationDashboardFoundation,
  RiskAdaptationDashboardInput,
  RiskAdaptationDashboardKind,
  RiskAdaptationDashboardLedger,
  RiskAdaptationDashboardMetrics,
  RiskAdaptationDashboardRecord,
  RiskAdaptationDashboardResult,
  RiskAdaptationDashboardValidation,
  RiskAdaptationDashboardView,
  RiskAdaptationExecutiveReport,
} from "@/types/risk-adaptation-dashboards";

const RISK_ADAPTATION_DASHBOARDS_VERSION = "risk-adaptation-dashboards/v1" as const;
const UPDATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskAdaptationDashboardInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): RiskAdaptationDashboardApiSurface {
  const base: Omit<RiskAdaptationDashboardApiSurface, "integrity_hash"> = {
    api_id: "risk_adaptation_dashboards_api",
    retrieve_overview: "POST /risk-adaptation-dashboards/overview",
    retrieve_drift: "POST /risk-adaptation-dashboards/drift",
    retrieve_calibration: "POST /risk-adaptation-dashboards/calibration",
    retrieve_patterns: "POST /risk-adaptation-dashboards/patterns",
    retrieve_governance: "POST /risk-adaptation-dashboards/governance",
    retrieve_simulation: "POST /risk-adaptation-dashboards/simulation",
    retrieve_replay: "POST /risk-adaptation-dashboards/replay",
    retrieve_tenant: "POST /risk-adaptation-dashboards/tenant",
    retrieve_executive: "POST /risk-adaptation-dashboards/executive",
    retrieve_validation: "POST /risk-adaptation-dashboards/validation",
    replay_dashboards: "POST /risk-adaptation-dashboards/replay-analysis",
    retrieve_contract: "GET /risk-adaptation-dashboards/contract",
    update_supported: false,
    delete_supported: false,
    write_supported: false,
    operational_mutation_supported: false,
    cross_tenant_visibility_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function kindForScenario(scenario: Scenario): RiskAdaptationDashboardKind {
  const map: Partial<Record<Scenario, RiskAdaptationDashboardKind>> = {
    OVERVIEW: "OVERVIEW",
    DRIFT: "RISK_DRIFT",
    CALIBRATION: "SEVERITY_CALIBRATION",
    PATTERN: "RISK_PATTERN",
    GOVERNANCE: "GOVERNANCE",
    SIMULATION: "SIMULATION",
    REPLAY: "REPLAY",
    TENANT: "TENANT",
    EXECUTIVE: "EXECUTIVE_REPORTING",
  };
  return map[scenario] ?? "OVERVIEW";
}

function metrics(seed: number): RiskAdaptationDashboardMetrics {
  return Object.freeze({
    total_proposals: 12,
    approval_rate: 0.67,
    average_review_duration_hours: 18,
    simulation_completion_rate: 0.92,
    certification_readiness: 0.78,
    adaptation_health_score: seed,
    prediction_accuracy_improvement: seed - 0.5,
    calibration_quality: seed - 0.04,
    drift_stability: seed - 0.08,
    pattern_confidence: seed - 0.02,
  });
}

function buildRecord(input: RiskAdaptationDashboardInput, refs: { adaptationId: string; ledgerRef: string; driftRef: string; severityRef: string; patternRef: string; governanceRef: string; simulationRef: string }): RiskAdaptationDashboardRecord {
  const scenario = input.scenario ?? "BASELINE";
  const kind = kindForScenario(scenario);
  const baseMetrics = scenario === "MISSING_METRICS" ? metrics(0) : metrics(0.86);
  const base: Omit<RiskAdaptationDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: `risk_adaptation_dashboard_${hash(`${scenario}:${kind}:${refs.adaptationId}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    adaptation_id: scenario === "MISSING_SOURCE" ? "" : refs.adaptationId,
    dashboard_kind: kind,
    proposal_status: kind === "GOVERNANCE" ? "PENDING_REVIEW" : "ACTIVE",
    risk_domain: "MISSION_RISK",
    adaptation_category: "risk_adaptation_visibility",
    governance_status: scenario === "MISSING_GOVERNANCE" ? "" : "visible",
    simulation_status: "complete",
    operator_status: "operator_visible",
    certification_status: "certification_readiness_visible",
    accuracy_metrics: baseMetrics,
    calibration_metrics: baseMetrics,
    drift_metrics: baseMetrics,
    pattern_metrics: baseMetrics,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([refs.ledgerRef, refs.simulationRef]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["risk_dashboard_lineage_ref_1"]),
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([refs.driftRef, refs.severityRef, refs.patternRef, refs.governanceRef]),
    last_updated: UPDATED_AT,
    read_only: true,
    mutates_operational_data: false,
    mutates_historical_records: false,
    suppresses_constitutional_findings: false,
    suppresses_governance_history: false,
    overrides_operator_authority: false,
    displays_unauthorized_tenant_data: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.dashboard_record_id }) });
  if (scenario === "OPERATIONAL_MUTATION") return Object.freeze({ ...record, mutates_operational_data: true as false });
  if (scenario === "HISTORICAL_MUTATION") return Object.freeze({ ...record, mutates_historical_records: true as false });
  if (scenario === "CONSTITUTIONAL_SUPPRESSION") return Object.freeze({ ...record, suppresses_constitutional_findings: true as false });
  if (scenario === "GOVERNANCE_SUPPRESSION") return Object.freeze({ ...record, suppresses_governance_history: true as false });
  if (scenario === "OPERATOR_OVERRIDE") return Object.freeze({ ...record, overrides_operator_authority: true as false });
  if (scenario === "UNAUTHORIZED_TENANT") return Object.freeze({ ...record, displays_unauthorized_tenant_data: true as false });
  if (scenario === "WRITE_ACCESS") return Object.freeze({ ...record, read_only: false as true });
  return record;
}

function buildViews(record: RiskAdaptationDashboardRecord): readonly RiskAdaptationDashboardView[] {
  const kinds: RiskAdaptationDashboardKind[] = ["OVERVIEW", "RISK_DRIFT", "SEVERITY_CALIBRATION", "RISK_PATTERN", "GOVERNANCE", "SIMULATION", "REPLAY", "TENANT", "EXECUTIVE_REPORTING"];
  return freezeArray(kinds.map((kind) => {
    const base: Omit<RiskAdaptationDashboardView, "integrity_hash"> = {
      view_id: `risk_dashboard_view_${kind.toLowerCase()}_${hash(record.dashboard_record_id).slice(0, 8)}`,
      dashboard_kind: kind,
      title: kind.replaceAll("_", " "),
      summary: `${kind} dashboard generated from immutable risk adaptation history.`,
      visible_record_refs: freezeArray([record.dashboard_record_id]),
      key_metrics: record.accuracy_metrics,
      replay_refs: record.replay_refs,
      evidence_refs: record.evidence_refs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildReport(record: RiskAdaptationDashboardRecord): RiskAdaptationExecutiveReport {
  const base: Omit<RiskAdaptationExecutiveReport, "integrity_hash"> = {
    report_id: `risk_dashboard_executive_report_${hash(record.dashboard_record_id).slice(0, 14)}`,
    executive_summary: "Risk adaptation history is visible, deterministic, and read-only.",
    governance_summary: record.governance_status || "governance data unavailable",
    calibration_improvement_summary: `Prediction accuracy improvement ${record.accuracy_metrics.prediction_accuracy_improvement}.`,
    trend_analysis_summary: `Drift stability ${record.drift_metrics.drift_stability}.`,
    simulation_effectiveness_summary: `Simulation completion ${record.accuracy_metrics.simulation_completion_rate}.`,
    certification_readiness_summary: `Certification readiness ${record.accuracy_metrics.certification_readiness}.`,
    operational_health_summary: `Adaptation health ${record.accuracy_metrics.adaptation_health_score}.`,
    replay_refs: record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: RiskAdaptationDashboardRecord, views: readonly RiskAdaptationDashboardView[], report: RiskAdaptationExecutiveReport): RiskAdaptationDashboardLedger {
  const kinds: RiskAdaptationDashboardKind[] = ["OVERVIEW", "RISK_DRIFT", "SEVERITY_CALIBRATION", "RISK_PATTERN", "GOVERNANCE", "SIMULATION", "REPLAY", "TENANT", "EXECUTIVE_REPORTING"];
  const dashboard_index = kinds.reduce((index, kind) => ({ ...index, [kind]: freezeArray(views.filter((view) => view.dashboard_kind === kind).map((view) => view.view_id)) }), {} as Record<RiskAdaptationDashboardKind, readonly string[]>);
  const base: Omit<RiskAdaptationDashboardLedger, "integrity_hash"> = {
    ledger_id: `risk_adaptation_dashboard_ledger_${hash(record.dashboard_record_id).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    dashboard_record_refs: freezeArray([record.dashboard_record_id]),
    view_refs: views.map((view) => view.view_id),
    report_refs: freezeArray([report.report_id]),
    dashboard_index: Object.freeze(dashboard_index),
    read_only: true,
    append_only: true,
    immutable: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: RiskAdaptationDashboardRecord, views: readonly RiskAdaptationDashboardView[], report: RiskAdaptationExecutiveReport, ledger: RiskAdaptationDashboardLedger, scenario: Scenario): readonly RiskAdaptationDashboardFailure[] {
  const failures: RiskAdaptationDashboardFailure[] = [];
  if (scenario === "MISSING_SOURCE" || !record.adaptation_id) failures.push("SOURCE_DATA_MISSING");
  if (scenario === "MISSING_METRICS" || record.accuracy_metrics.adaptation_health_score <= 0) failures.push("DETERMINISTIC_METRICS_MISSING");
  if (scenario === "MISSING_EVIDENCE" || record.evidence_refs.length === 0) failures.push("EVIDENCE_ATTRIBUTION_MISSING");
  if (scenario === "MISSING_REPLAY" || record.replay_refs.length === 0 || report.replay_refs.length === 0) failures.push("REPLAY_LINKAGE_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || record.governance_status.length === 0) failures.push("GOVERNANCE_COMPLIANCE_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL") failures.push("CONSTITUTIONAL_COMPLIANCE_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== ledger.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "BROKEN_LINEAGE" || record.lineage_refs.length === 0) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash || views.some((view) => hashWithoutIntegrity(view) !== view.integrity_hash) || hashWithoutIntegrity(report) !== report.integrity_hash || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (record.displays_unauthorized_tenant_data) failures.push("UNAUTHORIZED_TENANT_VISIBILITY");
  if (record.mutates_operational_data) failures.push("OPERATIONAL_DATA_MUTATION_DETECTED");
  if (record.mutates_historical_records) failures.push("HISTORICAL_RECORD_MUTATION_DETECTED");
  if (record.suppresses_constitutional_findings) failures.push("CONSTITUTIONAL_FINDING_SUPPRESSION_DETECTED");
  if (record.suppresses_governance_history) failures.push("GOVERNANCE_HISTORY_SUPPRESSION_DETECTED");
  if (record.overrides_operator_authority) failures.push("OPERATOR_AUTHORITY_OVERRIDE_DETECTED");
  if (!record.read_only || !ledger.read_only) failures.push("DASHBOARD_WRITE_ACCESS_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_DASHBOARD_METRICS");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly RiskAdaptationDashboardFailure[]): RiskAdaptationDashboardValidation["state"] {
  if (failures.includes("REPLAY_LINKAGE_MISSING") || failures.includes("REPLAY_DIVERGENCE_DETECTED")) return "PENDING_REPLAY";
  if (failures.includes("OPERATIONAL_DATA_MUTATION_DETECTED") || failures.includes("HISTORICAL_RECORD_MUTATION_DETECTED") || failures.includes("DASHBOARD_WRITE_ACCESS_DETECTED") || failures.includes("UNAUTHORIZED_TENANT_VISIBILITY")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RiskAdaptationDashboardRecord, views: readonly RiskAdaptationDashboardView[], report: RiskAdaptationExecutiveReport, ledger: RiskAdaptationDashboardLedger, failures: readonly RiskAdaptationDashboardFailure[]): RiskAdaptationDashboardValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && views.every((view) => hashWithoutIntegrity(view) === view.integrity_hash) && hashWithoutIntegrity(report) === report.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<RiskAdaptationDashboardValidation, "integrity_hash"> = {
    validation_id: "risk_adaptation_dashboard_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    source_data_complete: !failures.includes("SOURCE_DATA_MISSING"),
    deterministic_metrics_complete: !failures.includes("DETERMINISTIC_METRICS_MISSING"),
    evidence_attribution_complete: !failures.includes("EVIDENCE_ATTRIBUTION_MISSING"),
    replay_linkage_complete: !failures.includes("REPLAY_LINKAGE_MISSING") && !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    governance_complete: !failures.includes("GOVERNANCE_COMPLIANCE_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_COMPLIANCE_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("UNAUTHORIZED_TENANT_VISIBILITY"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    read_only: record.read_only && ledger.read_only,
    no_operational_mutation: !failures.includes("OPERATIONAL_DATA_MUTATION_DETECTED"),
    no_historical_mutation: !failures.includes("HISTORICAL_RECORD_MUTATION_DETECTED"),
    no_constitutional_suppression: !failures.includes("CONSTITUTIONAL_FINDING_SUPPRESSION_DETECTED"),
    no_governance_suppression: !failures.includes("GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"),
    no_operator_override: !failures.includes("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"),
    no_unauthorized_tenant_visibility: !failures.includes("UNAUTHORIZED_TENANT_VISIBILITY"),
    deterministic: !failures.includes("NONDETERMINISTIC_DASHBOARD_METRICS"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskAdaptationDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({ records: result.records, views: result.views, executive_report: result.executive_report, ledger: result.ledger, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskAdaptationDashboardResult, "integrity_hash">): string {
  return hash({
    risk_adaptation_dashboards_version: result.risk_adaptation_dashboards_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    view_hashes: result.views.map((view) => view.integrity_hash),
    report_hash: result.executive_report.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function generateRiskAdaptationDashboards(input: RiskAdaptationDashboardInput = {}): RiskAdaptationDashboardResult {
  const ledger = input.ledger_result ?? analyzeRiskAdaptationLedger();
  const drift = input.drift_result ?? analyzeRiskDrift({ scenario: "SEVERITY" });
  const severity = input.severity_result ?? analyzeRiskSeverityRecalibration();
  const pattern = input.pattern_result ?? analyzeRiskPatternIntelligence();
  const governance = input.governance_result ?? evaluateGovernanceAwareRiskAdaptation();
  const simulation = input.simulation_result ?? runRiskAdaptationSimulation();
  const refs = {
    adaptationId: ledger.entries[0]?.adaptation_id ?? "risk_adaptation_missing",
    ledgerRef: ledger.entries[0]?.ledger_entry_id ?? "risk_ledger_missing",
    driftRef: drift.records[0]?.risk_drift_id ?? "risk_drift_missing",
    severityRef: severity.records[0]?.recalibration_id ?? "risk_severity_missing",
    patternRef: pattern.patterns[0]?.risk_pattern_id ?? "risk_pattern_missing",
    governanceRef: governance.records[0]?.governance_review_id ?? "governance_missing",
    simulationRef: simulation.records[0]?.simulation_id ?? "simulation_missing",
  };
  const api_surface = buildApiSurface();
  const record = buildRecord(input, refs);
  const records = freezeArray([record]);
  const views = buildViews(record);
  const executive_report = buildReport(record);
  const dashboardLedger = buildLedger(record, views, executive_report);
  const failures = collectFailures(record, views, executive_report, dashboardLedger, input.scenario ?? "BASELINE");
  const validation = buildValidation(record, views, executive_report, dashboardLedger, failures);
  const base: Omit<RiskAdaptationDashboardResult, "integrity_hash" | "replay_hash"> = {
    risk_adaptation_dashboards_version: RISK_ADAPTATION_DASHBOARDS_VERSION,
    api_surface,
    records,
    views,
    executive_report,
    ledger: dashboardLedger,
    validation,
    deterministic: true,
    replayable: true,
    evidence_backed: validation.evidence_attribution_complete,
    tenant_isolated: validation.tenant_isolated,
    read_only: true,
    mutates_operational_data: false,
    mutates_historical_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskAdaptationDashboards(result: RiskAdaptationDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskAdaptationDashboardFoundation(): RiskAdaptationDashboardFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_adaptation_dashboards_version: RISK_ADAPTATION_DASHBOARDS_VERSION,
    api_surface,
    result: generateRiskAdaptationDashboards(),
  });
}

export const RiskAdaptationDashboards = Object.freeze({
  generate: generateRiskAdaptationDashboards,
  replay: replayRiskAdaptationDashboards,
});
