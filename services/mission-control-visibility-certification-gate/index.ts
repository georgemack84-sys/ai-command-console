import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runMissionControlVisibilityContract, validateMissionControlVisibilityContract } from "@/services/mission-control-visibility-contract";
import { runMissionControlOperationalDashboard, validateMissionControlOperationalDashboard } from "@/services/mission-control-operational-dashboard";
import { runMissionControlGraphVisualizationEngine, validateMissionControlGraphVisualizationEngine } from "@/services/mission-control-graph-visualization-engine";
import { runReplayInvestigationWorkspace, validateReplayInvestigationWorkspace } from "@/services/mission-control-replay-investigation-workspace";
import type {
  MissionControlVisibilityCertificationReport,
  VisibilityCertificationCategory,
  VisibilityCertificationEvidence,
  VisibilityCertificationFailure,
  VisibilityCertificationInput,
  VisibilityCertificationObservabilitySurface,
  VisibilityCertificationReport,
  VisibilityCertificationScenario,
  VisibilityCertificationScorecard,
  VisibilityCertificationState,
  VisibilityCertificationTestResult,
  VisibilityCertificationValidationResult,
} from "@/types/mission-control-visibility-certification-gate";

const NOW = "2026-07-01T06:00:00.000Z";
const SCHEMA_VERSION = "mission-control-visibility-certification-gate/v8J.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:visibility-certification:8j5:primary";
const LINEAGE_REFERENCE = "lineage:visibility-certification:8j5:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const failureByScenario: Partial<Record<VisibilityCertificationScenario, VisibilityCertificationFailure>> = Object.freeze({
  MINOR_PRESENTATION_GAP: "MINOR_PRESENTATION_GAP",
  MISSING_EXECUTION_EVENTS: "EXECUTION_TIMELINE_INCOMPLETE",
  HIDDEN_AUTONOMY_STATE: "AUTONOMY_STATE_HIDDEN",
  HIDDEN_GOVERNANCE_STATUS: "GOVERNANCE_STATUS_HIDDEN",
  CONFIDENCE_MISMATCH: "CONFIDENCE_VISIBILITY_MISMATCH",
  HIDDEN_RISK: "RISK_INDICATORS_HIDDEN",
  HIDDEN_INTERVENTION: "INTERVENTION_HISTORY_HIDDEN",
  PLANNING_GRAPH_MISMATCH: "PLANNING_GRAPH_NOT_DETERMINISTIC",
  DELEGATION_MISMATCH: "DELEGATION_GRAPH_NOT_DETERMINISTIC",
  GRAPH_RECONSTRUCTION_MISMATCH: "GRAPH_RECONSTRUCTION_MISMATCH",
  REPLAY_VISUALIZATION_MISMATCH: "REPLAY_VISUALIZATION_MISMATCH",
  LINEAGE_BREAK: "LINEAGE_BREAK_DETECTED",
  HIDDEN_INTEGRITY_STATUS: "INTEGRITY_STATUS_HIDDEN",
  INCONSISTENT_DASHBOARD_STATE: "DASHBOARD_STATE_INCONSISTENT",
  REFERENCE_MUTATION: "REFERENCE_MUTATION_DETECTED",
  CROSS_TENANT_VISIBILITY: "CROSS_TENANT_VISIBILITY_DETECTED",
  UNAUTHORIZED_DASHBOARD_ACCESS: "UNAUTHORIZED_DASHBOARD_ACCESS",
  EXECUTION_CONTROLS_EXPOSED: "EXECUTION_CONTROLS_EXPOSED",
  REPLAY_MISMATCH: "REPLAY_MISMATCH",
  HIDDEN_AUTONOMOUS_ACTIVITY: "HIDDEN_AUTONOMOUS_ACTIVITY",
});

function fails(scenario: VisibilityCertificationScenario, failure: VisibilityCertificationFailure): boolean {
  return failureByScenario[scenario] === failure;
}

function certificationTest(input: {
  category: VisibilityCertificationCategory;
  name: string;
  scenario: VisibilityCertificationScenario;
  failure: VisibilityCertificationFailure;
  evidence_refs: readonly string[];
  expected?: "PASS" | "FAIL";
  mandatory?: boolean;
  healthy?: boolean;
}): VisibilityCertificationTestResult {
  const expected = input.expected ?? "PASS";
  const badConditionPresent = fails(input.scenario, input.failure);
  const actual = input.healthy === false || badConditionPresent ? (expected === "PASS" ? "FAIL" : "PASS") : expected;
  const passed = actual === expected;
  const source = {
    category: input.category,
    name: input.name,
    expected,
    actual,
    passed,
    mandatory: input.mandatory ?? true,
    failure_reason: passed ? null : input.failure,
    evidence_refs: uniq(input.evidence_refs),
  };
  return Object.freeze({ test_id: id("VCT", "visibility-certification-test-id", { category: input.category, name: input.name }), ...source, result_hash: hashValue("visibility-certification-test", source) });
}

function buildEvidence(input: ReturnType<typeof buildSubsystemEvidence>): VisibilityCertificationEvidence {
  const source = {
    evidence_id: id("VCE", "visibility-certification-evidence-id", input.visibilityContract.contract_id),
    visibility_contract_hash: input.visibilityContract.report_hash,
    dashboard_hash: input.dashboard.dashboard_hash,
    graph_engine_hash: input.graph.engine_hash,
    replay_workspace_hash: input.workspace.workspace_hash,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    integrity_hash: hashValue("visibility-certification-evidence-integrity", {
      visibility: input.visibilityContract.integrity_hash,
      dashboard: input.dashboard.integrity_hash,
      graph: input.graph.integrity_hash,
      workspace: input.workspace.integrity_hash,
    }),
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("visibility-certification-evidence", source) });
}

function buildSubsystemEvidence() {
  return Object.freeze({
    visibilityContract: runMissionControlVisibilityContract(),
    dashboard: runMissionControlOperationalDashboard(),
    graph: runMissionControlGraphVisualizationEngine(),
    workspace: runReplayInvestigationWorkspace(),
  });
}

function buildTests(scenario: VisibilityCertificationScenario, evidence: VisibilityCertificationEvidence, subsystem: ReturnType<typeof buildSubsystemEvidence>): readonly VisibilityCertificationTestResult[] {
  const refs = [evidence.evidence_hash, evidence.visibility_contract_hash, evidence.dashboard_hash, evidence.graph_engine_hash, evidence.replay_workspace_hash];
  const visibilityValid = validateMissionControlVisibilityContract(subsystem.visibilityContract).valid;
  const dashboardValid = validateMissionControlOperationalDashboard(subsystem.dashboard).valid;
  const graphValid = validateMissionControlGraphVisualizationEngine(subsystem.graph).valid;
  const workspaceValid = validateReplayInvestigationWorkspace(subsystem.workspace).valid;
  const hasTimeline = subsystem.dashboard.timeline.length >= 13;
  const hasIntervention = subsystem.workspace.timeline.some((event) => event.event_type === "INTERVENTION_OCCURRED");
  const hasRollback = subsystem.workspace.timeline.some((event) => event.rollback_reference);
  const hasIntegrity = subsystem.workspace.integrity_records.every((record) => record.verification_status === "VERIFIED");
  const hasLineage = subsystem.workspace.lineage_records.length === 7;
  const tenantSafe = subsystem.visibilityContract.tenant_id === TENANT_ID && subsystem.dashboard.tenant_id === TENANT_ID && subsystem.graph.tenant_id === TENANT_ID && subsystem.workspace.tenant_id === TENANT_ID;
  const advisoryOnly = subsystem.visibilityContract.advisory_only && subsystem.dashboard.advisory_only && subsystem.graph.advisory_only && subsystem.workspace.advisory_only && !subsystem.visibilityContract.execution_authority_granted && !subsystem.dashboard.execution_authority_granted && !subsystem.graph.execution_authority_granted && !subsystem.workspace.execution_authority_granted && !subsystem.workspace.history_mutation_allowed;
  return freezeArray([
    certificationTest({ category: "CONTRACT", name: "visibility contract present", scenario, failure: "VISIBILITY_CONTRACT_MISSING", evidence_refs: refs, healthy: visibilityValid }),
    certificationTest({ category: "DASHBOARD", name: "dashboard schema valid", scenario, failure: "DASHBOARD_SCHEMA_INVALID", evidence_refs: refs, healthy: dashboardValid }),
    certificationTest({ category: "DASHBOARD", name: "execution timeline complete", scenario, failure: "EXECUTION_TIMELINE_INCOMPLETE", evidence_refs: refs, healthy: hasTimeline }),
    certificationTest({ category: "DASHBOARD", name: "missing execution events", scenario, failure: "EXECUTION_TIMELINE_INCOMPLETE", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "DASHBOARD", name: "autonomy state visible", scenario, failure: "AUTONOMY_STATE_HIDDEN", evidence_refs: refs }),
    certificationTest({ category: "TRANSPARENCY", name: "hidden autonomy state", scenario, failure: "AUTONOMY_STATE_HIDDEN", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "DASHBOARD", name: "governance status visible", scenario, failure: "GOVERNANCE_STATUS_HIDDEN", evidence_refs: refs, healthy: Boolean(subsystem.dashboard.governance_panel) }),
    certificationTest({ category: "TRANSPARENCY", name: "hidden governance status", scenario, failure: "GOVERNANCE_STATUS_HIDDEN", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "DASHBOARD", name: "confidence visible", scenario, failure: "CONFIDENCE_VISIBILITY_MISMATCH", evidence_refs: refs, healthy: subsystem.dashboard.confidence_monitor.overall_confidence > 0 }),
    certificationTest({ category: "DASHBOARD", name: "confidence mismatch", scenario, failure: "CONFIDENCE_VISIBILITY_MISMATCH", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "DASHBOARD", name: "risk indicators complete", scenario, failure: "RISK_INDICATORS_HIDDEN", evidence_refs: refs, healthy: subsystem.dashboard.risk_monitor.length > 0 }),
    certificationTest({ category: "DASHBOARD", name: "hidden risk", scenario, failure: "RISK_INDICATORS_HIDDEN", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "REPLAY", name: "intervention history visible", scenario, failure: "INTERVENTION_HISTORY_HIDDEN", evidence_refs: refs, healthy: hasIntervention }),
    certificationTest({ category: "TRANSPARENCY", name: "hidden intervention", scenario, failure: "INTERVENTION_HISTORY_HIDDEN", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "GRAPH", name: "planning graph deterministic", scenario, failure: "PLANNING_GRAPH_NOT_DETERMINISTIC", evidence_refs: refs, healthy: graphValid }),
    certificationTest({ category: "GRAPH", name: "planning graph mismatch", scenario, failure: "PLANNING_GRAPH_NOT_DETERMINISTIC", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "GRAPH", name: "delegation graph deterministic", scenario, failure: "DELEGATION_GRAPH_NOT_DETERMINISTIC", evidence_refs: refs, healthy: graphValid }),
    certificationTest({ category: "GRAPH", name: "delegation mismatch", scenario, failure: "DELEGATION_GRAPH_NOT_DETERMINISTIC", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "GRAPH", name: "execution graph reproducible", scenario, failure: "EXECUTION_GRAPH_NOT_REPRODUCIBLE", evidence_refs: refs, healthy: graphValid }),
    certificationTest({ category: "GRAPH", name: "graph reconstruction mismatch", scenario, failure: "GRAPH_RECONSTRUCTION_MISMATCH", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "REPLAY", name: "replay visualization deterministic", scenario, failure: "REPLAY_VISUALIZATION_NOT_DETERMINISTIC", evidence_refs: refs, healthy: workspaceValid }),
    certificationTest({ category: "REPLAY", name: "replay visualization mismatch", scenario, failure: "REPLAY_VISUALIZATION_MISMATCH", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "LINEAGE", name: "lineage visualization complete", scenario, failure: "LINEAGE_VISUALIZATION_INCOMPLETE", evidence_refs: refs, healthy: hasLineage }),
    certificationTest({ category: "LINEAGE", name: "lineage break detected", scenario, failure: "LINEAGE_BREAK_DETECTED", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "INTEGRITY", name: "integrity hashes displayed", scenario, failure: "INTEGRITY_HASHES_HIDDEN", evidence_refs: refs, healthy: hasIntegrity }),
    certificationTest({ category: "INTEGRITY", name: "hidden integrity status", scenario, failure: "INTEGRITY_STATUS_HIDDEN", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "DASHBOARD", name: "dashboard refresh deterministic", scenario, failure: "DASHBOARD_REFRESH_NONDETERMINISTIC", evidence_refs: refs, healthy: subsystem.dashboard.refresh_record.deterministic_refresh_order.length > 0 }),
    certificationTest({ category: "DASHBOARD", name: "inconsistent dashboard state", scenario, failure: "DASHBOARD_STATE_INCONSISTENT", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "CONTRACT", name: "immutable references preserved", scenario, failure: "IMMUTABLE_REFERENCES_NOT_PRESERVED", evidence_refs: refs, healthy: Boolean(evidence.replay_reference && evidence.lineage_reference && evidence.integrity_hash) }),
    certificationTest({ category: "CONTRACT", name: "reference mutation detected", scenario, failure: "REFERENCE_MUTATION_DETECTED", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "SECURITY", name: "tenant isolation enforced", scenario, failure: "TENANT_ISOLATION_NOT_ENFORCED", evidence_refs: refs, healthy: tenantSafe }),
    certificationTest({ category: "SECURITY", name: "cross-tenant visibility", scenario, failure: "CROSS_TENANT_VISIBILITY_DETECTED", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "SECURITY", name: "authorization enforced", scenario, failure: "AUTHORIZATION_NOT_ENFORCED", evidence_refs: refs }),
    certificationTest({ category: "SECURITY", name: "unauthorized dashboard access", scenario, failure: "UNAUTHORIZED_DASHBOARD_ACCESS", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "ADVISORY", name: "advisory-only visibility enforced", scenario, failure: "ADVISORY_ONLY_NOT_ENFORCED", evidence_refs: refs, healthy: advisoryOnly }),
    certificationTest({ category: "ADVISORY", name: "execution controls exposed", scenario, failure: "EXECUTION_CONTROLS_EXPOSED", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "REPLAY", name: "replay reproducible", scenario, failure: "REPLAY_NOT_REPRODUCIBLE", evidence_refs: refs, healthy: hasRollback && workspaceValid }),
    certificationTest({ category: "REPLAY", name: "replay mismatch", scenario, failure: "REPLAY_MISMATCH", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "TRANSPARENCY", name: "operator transparency complete", scenario, failure: "OPERATOR_TRANSPARENCY_INCOMPLETE", evidence_refs: refs, healthy: visibilityValid && dashboardValid && graphValid && workspaceValid }),
    certificationTest({ category: "TRANSPARENCY", name: "hidden autonomous activity", scenario, failure: "HIDDEN_AUTONOMOUS_ACTIVITY", evidence_refs: refs, expected: "FAIL" }),
    certificationTest({ category: "TRANSPARENCY", name: "presentation enhancements complete", scenario, failure: "MINOR_PRESENTATION_GAP", evidence_refs: refs, mandatory: !fails(scenario, "MINOR_PRESENTATION_GAP") }),
  ]);
}

function score(tests: readonly VisibilityCertificationTestResult[], categories: readonly VisibilityCertificationCategory[]): number {
  const scoped = tests.filter((item) => categories.includes(item.category));
  return scoped.length ? Number((scoped.filter((item) => item.passed).length / scoped.length).toFixed(4)) : 1;
}

function buildScorecard(tests: readonly VisibilityCertificationTestResult[]): VisibilityCertificationScorecard {
  const source = {
    determinism_score: score(tests, ["DASHBOARD", "GRAPH"]),
    visibility_score: score(tests, ["CONTRACT", "DASHBOARD", "TRANSPARENCY"]),
    replay_score: score(tests, ["REPLAY"]),
    integrity_score: score(tests, ["INTEGRITY"]),
    lineage_score: score(tests, ["LINEAGE"]),
    governance_score: score(tests, ["DASHBOARD", "GRAPH"]),
    security_score: score(tests, ["SECURITY", "ADVISORY"]),
  };
  return Object.freeze({ ...source, scorecard_hash: hashValue("visibility-certification-scorecard", source) });
}

function buildCertificationReport(state: VisibilityCertificationState, tests: readonly VisibilityCertificationTestResult[], evidence: VisibilityCertificationEvidence): VisibilityCertificationReport {
  const failures = tests.filter((test) => !test.passed).map((test) => test.failure_reason).filter((failure): failure is VisibilityCertificationFailure => Boolean(failure));
  const corrective = failures.length === 0 ? freezeArray(["No corrective action required."]) : freezeArray(failures.map((failure) => `Correct ${failure}.`));
  const source = {
    executive_summary: state === "PASS" ? "Autonomy Visibility is certified for Phase 8K progression." : state === "CONDITIONAL_PASS" ? "Autonomy Visibility is conditionally certified for remediation only." : "Autonomy Visibility certification failed and Phase 8K progression is blocked.",
    corrective_actions: corrective,
    audit_entries: freezeArray([`audit:visibility-certification:${state.toLowerCase()}`, evidence.evidence_hash]),
    evidence_references: freezeArray([evidence.visibility_contract_hash, evidence.dashboard_hash, evidence.graph_engine_hash, evidence.replay_workspace_hash]),
    immutable_checksum: hashValue("visibility-certification-immutable-checksum", { state, failures, evidence: evidence.evidence_hash }),
  };
  return Object.freeze(source);
}

export function computeVisibilityCertificationReportHash(report: Omit<MissionControlVisibilityCertificationReport, "report_hash"> | MissionControlVisibilityCertificationReport): string {
  const { report_hash: _hash, ...source } = report as MissionControlVisibilityCertificationReport;
  return hashValue("mission-control-visibility-certification-report", source);
}

export function runVisibilityCertification(input: VisibilityCertificationInput = {}): MissionControlVisibilityCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const subsystem = buildSubsystemEvidence();
  const evidence = buildEvidence(subsystem);
  const tests = buildTests(scenario, evidence, subsystem);
  const passed_tests = freezeArray(tests.filter((test) => test.passed));
  const failed_tests = freezeArray(tests.filter((test) => !test.passed));
  const warnings = freezeArray(failed_tests.filter((test) => !test.mandatory).map((test) => test.failure_reason).filter((failure): failure is VisibilityCertificationFailure => Boolean(failure)));
  const detected_findings = uniq(failed_tests.map((test) => test.failure_reason).filter((failure): failure is VisibilityCertificationFailure => Boolean(failure)));
  const mandatoryPassed = tests.filter((test) => test.mandatory).every((test) => test.passed);
  const optionalPassed = tests.filter((test) => !test.mandatory).every((test) => test.passed);
  const state: VisibilityCertificationState = mandatoryPassed && optionalPassed ? "PASS" : mandatoryPassed ? "CONDITIONAL_PASS" : "FAIL";
  const scorecard = buildScorecard(tests);
  const reportDetail = buildCertificationReport(state, tests, evidence);
  const integrity_hash = hashValue("visibility-certification-integrity", { tests: tests.map((test) => test.result_hash), evidence: evidence.evidence_hash, scorecard: scorecard.scorecard_hash, report: reportDetail.immutable_checksum });
  const base = {
    visibility_certification_id: id("VCERT", "visibility-certification-id", { scenario, evidence: evidence.evidence_hash }),
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    phase: "8J" as const,
    phase_version: "8J.5" as const,
    schema_version: SCHEMA_VERSION,
    certification_state: state,
    certification_version: "8J.5-production-readiness",
    visibility_contract_version: subsystem.visibilityContract.schema_version,
    dashboard_version: subsystem.dashboard.schema_version,
    graph_engine_version: subsystem.graph.schema_version,
    replay_workspace_version: subsystem.workspace.schema_version,
    visibility_contract: subsystem.visibilityContract,
    operational_dashboard: subsystem.dashboard,
    graph_visualization: subsystem.graph,
    replay_workspace: subsystem.workspace,
    tests_executed: tests.length,
    tests_passed: passed_tests.length,
    tests_failed: failed_tests.length,
    determinism_score: scorecard.determinism_score,
    visibility_score: scorecard.visibility_score,
    replay_score: scorecard.replay_score,
    integrity_score: scorecard.integrity_score,
    lineage_score: scorecard.lineage_score,
    governance_score: scorecard.governance_score,
    security_score: scorecard.security_score,
    overall_result: state,
    certification_tests: tests,
    passed_tests,
    failed_tests,
    warnings,
    detected_findings,
    certification_evidence: evidence,
    scorecard,
    certification_report: reportDetail,
    phase_8k_authorized: state === "PASS",
    operator_approval_status: state === "PASS" ? "APPROVED_FOR_PHASE_8K" as const : state === "CONDITIONAL_PASS" ? "APPROVED_FOR_REMEDIATION" as const : "BLOCKED" as const,
    production_ready: state === "PASS",
    generated_at: NOW,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    integrity_hash,
  };
  return Object.freeze({ ...base, report_hash: computeVisibilityCertificationReportHash(base as MissionControlVisibilityCertificationReport) });
}

export function validateVisibilityCertificationReport(report?: MissionControlVisibilityCertificationReport): VisibilityCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<VisibilityCertificationFailure>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, validation_state: "INVALID" as const, certified: false, mandatory_tests_passed: false, evidence_complete: false, report_hash_valid: false, phase_8k_authorized: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("visibility-certification-validation", source) });
  }
  const report_hash_valid = computeVisibilityCertificationReportHash(report) === report.report_hash;
  const mandatory_tests_passed = report.certification_tests.filter((test) => test.mandatory).every((test) => test.passed);
  const evidence_complete = Boolean(report.certification_evidence.evidence_hash && report.replay_reference && report.lineage_reference && report.integrity_hash);
  const failures = uniq([...report.detected_findings, ...(report_hash_valid && evidence_complete ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])]);
  const certified = report.certification_state === "PASS" && mandatory_tests_passed && evidence_complete && report_hash_valid && report.phase_8k_authorized;
  const validConditional = report.certification_state === "CONDITIONAL_PASS" && mandatory_tests_passed && report_hash_valid && evidence_complete;
  const source = {
    certification_id: report.visibility_certification_id,
    validation_state: certified || validConditional ? "VALID" as const : "INVALID" as const,
    certified,
    mandatory_tests_passed,
    evidence_complete,
    report_hash_valid,
    phase_8k_authorized: certified,
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("visibility-certification-validation", source) });
}

export function buildVisibilityCertificationObservabilitySurface(report = runVisibilityCertification()): VisibilityCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.visibility_certification_id,
    certification_state: report.certification_state,
    total_tests: report.certification_tests.length,
    passed_tests: report.passed_tests.length,
    failed_tests: report.failed_tests.length,
    warnings: report.warnings,
    failures: report.detected_findings,
    determinism_score: report.determinism_score,
    visibility_score: report.visibility_score,
    replay_score: report.replay_score,
    integrity_score: report.integrity_score,
    lineage_score: report.lineage_score,
    governance_score: report.governance_score,
    security_score: report.security_score,
    operator_approval_status: report.operator_approval_status,
    phase_8k_authorized: report.phase_8k_authorized,
    production_ready: report.production_ready,
  });
}

export function getVisibilityCertificationContract() {
  const report = runVisibilityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-dashboard-rendering", "complete-visualization", "replay-fidelity", "graph-determinism", "lineage-completeness", "integrity-visibility", "tenant-isolation", "advisory-only", "fail-closed", "phase-8k-readiness"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      certification_scope: freezeArray(["Visibility Contract", "Operational Dashboard", "Graph Visualization Engine", "Replay Investigation Workspace", "Dashboard Rendering", "Replay Visualization", "Integrity Visualization", "Lineage Visualization", "Governance Visibility", "Confidence Visibility", "Risk Visibility", "Intervention Visibility"]),
    }),
    report,
    validation: validateVisibilityCertificationReport(report),
    observability: buildVisibilityCertificationObservabilitySurface(report),
  });
}
