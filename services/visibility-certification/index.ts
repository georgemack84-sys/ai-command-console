import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  assertIntegrityViewerActionBlocked,
  buildIntegrityStatusDetail,
  buildIntegrityStatusViewerContract,
  buildIntegrityStatusViewerView,
} from "@/services/integrity-viewer";
import {
  assertLedgerExplorerActionBlocked,
  buildLedgerExplorerContract,
  buildLedgerExplorerDetail,
  buildLedgerExplorerView,
} from "@/services/ledger-explorer";
import {
  assertReplayViewerActionBlocked,
  buildReplayViewerContract,
  buildReplayViewerDetail,
  buildReplayViewerView,
} from "@/services/replay-viewer";
import {
  assertTruthDashboardActionBlocked,
  buildTruthDashboardContract,
  buildTruthDashboardRecordDetail,
  buildTruthDashboardView,
} from "@/services/truth-dashboard";
import type {
  SurfaceCertificationResult,
  VisibilityCapability,
  VisibilityCertificationAuditEvent,
  VisibilityCertificationGateContract,
  VisibilityCertificationLedgerEntry,
  VisibilityCertificationRemediation,
  VisibilityCertificationReport,
  VisibilityCertificationResult,
  VisibilityCertificationState,
  VisibilityCertificationTarget,
  VisibilityCertificationView,
  VisibilityDeterminismCheck,
  VisibilityGateState,
  VisibilitySeverity,
  VisibilitySurface,
} from "@/types/visibility-certification";

const NOW = "2026-06-24T16:30:00.000Z";
const ALL_SURFACES: readonly VisibilitySurface[] = ["TRUTH_DASHBOARD", "REPLAY_VIEWER", "LEDGER_EXPLORER", "INTEGRITY_STATUS_VIEWER"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function target(input: {
  surface: VisibilitySurface;
  capability: VisibilityCapability;
  pass: boolean;
  evidence: readonly string[];
  required?: boolean;
  warning?: boolean;
  failure?: string;
}): VisibilityCertificationTarget {
  const state = input.pass ? "PASS" : input.warning ? "WARN" : "FAIL";
  return Object.freeze({
    target_id: `${input.surface}_${input.capability}`,
    surface: input.surface,
    capability: input.capability,
    required: input.required ?? true,
    certification_state: state,
    evidence_refs: Object.freeze([...input.evidence]),
    failure_refs: Object.freeze(input.pass ? [] : [input.failure ?? `${input.surface}:${input.capability}`]),
  });
}

export function buildVisibilityCertificationGateContract(input: Readonly<{
  certification_gate_id?: string;
  tenant_id?: string;
  certification_run_id?: string;
  operator_id?: string;
  surfaces?: readonly VisibilitySurface[];
  mission_ids?: readonly string[];
}> = {}): VisibilityCertificationGateContract {
  return Object.freeze({
    certification_gate_id: input.certification_gate_id ?? "visibility_certification_gate_6k5",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    certification_run_id: input.certification_run_id ?? "visibility_cert_run_6k5_000001",
    operator_id: input.operator_id ?? "operator_console",
    scope: Object.freeze({
      surfaces: Object.freeze([...(input.surfaces ?? ALL_SURFACES)]),
      mission_ids: Object.freeze([...(input.mission_ids ?? ["mission_query_layer"])]),
    }),
    required_capabilities: Object.freeze({
      recommendations_visible: true,
      decisions_visible: true,
      evidence_visible: true,
      lineage_visible: true,
      replay_visible: true,
      ledger_navigation_visible: true,
      integrity_visible: true,
      governance_visible: true,
      audit_visible: true,
    }),
    governance_requirements: Object.freeze({
      tenant_isolation_required: true,
      operator_access_required: true,
      restricted_records_controlled: true,
      read_only_required: true,
      mutation_blocked: true,
      approval_blocked: true,
      execution_blocked: true,
      repair_blocked: true,
      governance_override_blocked: true,
      fail_closed_required: true,
    }),
    determinism_requirements: Object.freeze({
      query_results_deterministic: true,
      rendering_order_stable: true,
      filtering_deterministic: true,
      redaction_deterministic: true,
      certification_replayable: true,
    }),
    certification_states: Object.freeze({ allowed_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }),
  });
}

export function certifyTruthDashboard(contract: VisibilityCertificationGateContract): SurfaceCertificationResult {
  const view = buildTruthDashboardView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" });
  const detail = view.selected_record;
  const restricted = buildTruthDashboardRecordDetail(buildTruthDashboardContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "truth_rec_003");
  const crossTenant = buildTruthDashboardRecordDetail(buildTruthDashboardContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  const blockers = [
    () => assertTruthDashboardActionBlocked("MUTATE_RECORD"),
    () => assertTruthDashboardActionBlocked("APPROVE_RECOMMENDATION"),
    () => assertTruthDashboardActionBlocked("EXECUTE_DECISION"),
    () => assertTruthDashboardActionBlocked("MODIFY_EVIDENCE"),
    () => assertTruthDashboardActionBlocked("REWRITE_LINEAGE"),
    () => assertTruthDashboardActionBlocked("OVERRIDE_GOVERNANCE"),
  ];
  return surface("TRUTH_DASHBOARD", [
    target({ surface: "TRUTH_DASHBOARD", capability: "RECOMMENDATION_DISPLAY", pass: Boolean(detail.recommendation), evidence: ["truth-dashboard:recommendation"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "DECISION_DISPLAY", pass: view.records.some((record) => record.event_type === "DECISION"), evidence: ["truth-dashboard:decision"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "EVIDENCE_DISPLAY", pass: Boolean(detail.evidence) || view.records.some((record) => record.evidence_refs.length > 0), evidence: ["truth-dashboard:evidence"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "LINEAGE_DISPLAY", pass: Boolean(detail.lineage), evidence: ["truth-dashboard:lineage"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "REPLAY_DISPLAY", pass: detail.replay_links.length > 0, evidence: ["truth-dashboard:replay"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "INTEGRITY_DISPLAY", pass: detail.integrity_indicators.length > 0, evidence: ["truth-dashboard:integrity"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "GOVERNANCE_DISPLAY", pass: view.contract.governance.mutation_blocked, evidence: ["truth-dashboard:governance"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "AUDIT_LOGGING", pass: view.audit_events.length > 0, evidence: view.audit_events.map((event) => event.audit_event_id) }),
    target({ surface: "TRUTH_DASHBOARD", capability: "REDACTION", pass: restricted.access_result === "REDACTED", evidence: ["truth-dashboard:redaction"] }),
    target({ surface: "TRUTH_DASHBOARD", capability: "FAIL_CLOSED", pass: crossTenant.access_result === "FAILED_CLOSED" && allThrow(blockers), evidence: ["truth-dashboard:fail-closed", "truth-dashboard:read-only"] }),
  ]);
}

export function certifyReplayViewer(contract: VisibilityCertificationGateContract): SurfaceCertificationResult {
  const view = buildReplayViewerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" });
  const detail = view.selected_replay;
  const restricted = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "replay_restricted_bundle");
  const crossTenant = buildReplayViewerDetail(buildReplayViewerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "replay_beta");
  const blockers = [
    () => assertReplayViewerActionBlocked("MUTATE_REPLAY"),
    () => assertReplayViewerActionBlocked("MUTATE_TRUTH_RECORD"),
    () => assertReplayViewerActionBlocked("MODIFY_EVIDENCE"),
    () => assertReplayViewerActionBlocked("REWRITE_LINEAGE"),
    () => assertReplayViewerActionBlocked("OVERRIDE_GOVERNANCE"),
    () => assertReplayViewerActionBlocked("APPROVE_RECOMMENDATION"),
    () => assertReplayViewerActionBlocked("EXECUTE_DECISION"),
  ];
  return surface("REPLAY_VIEWER", [
    target({ surface: "REPLAY_VIEWER", capability: "REPLAY_DISPLAY", pass: Boolean(detail.summary.replay_id), evidence: ["replay-viewer:summary"] }),
    target({ surface: "REPLAY_VIEWER", capability: "EVIDENCE_DISPLAY", pass: detail.evidence_refs.length > 0, evidence: ["replay-viewer:evidence"] }),
    target({ surface: "REPLAY_VIEWER", capability: "LINEAGE_DISPLAY", pass: detail.lineage_refs.length > 0, evidence: ["replay-viewer:lineage"] }),
    target({ surface: "REPLAY_VIEWER", capability: "GOVERNANCE_DISPLAY", pass: detail.governance_refs.length > 0, evidence: ["replay-viewer:governance"] }),
    target({ surface: "REPLAY_VIEWER", capability: "INTEGRITY_DISPLAY", pass: Boolean(detail.summary.integrity_state), evidence: ["replay-viewer:integrity"] }),
    target({ surface: "REPLAY_VIEWER", capability: "AUDIT_LOGGING", pass: view.audit_events.length > 0, evidence: view.audit_events.map((event) => event.audit_event_id) }),
    target({ surface: "REPLAY_VIEWER", capability: "REDACTION", pass: restricted.access_result === "REDACTED", evidence: ["replay-viewer:redaction"] }),
    target({ surface: "REPLAY_VIEWER", capability: "FAIL_CLOSED", pass: crossTenant.access_result === "FAILED_CLOSED" && allThrow(blockers), evidence: ["replay-viewer:fail-closed", "replay-viewer:read-only"] }),
  ]);
}

export function certifyLedgerExplorer(contract: VisibilityCertificationGateContract): SurfaceCertificationResult {
  const view = buildLedgerExplorerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" });
  const detail = view.selected_record;
  const restricted = buildLedgerExplorerDetail(buildLedgerExplorerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "truth_rec_003");
  const crossTenant = buildLedgerExplorerDetail(buildLedgerExplorerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  const blockers = [
    () => assertLedgerExplorerActionBlocked("CREATE_RECORD"),
    () => assertLedgerExplorerActionBlocked("EDIT_RECORD"),
    () => assertLedgerExplorerActionBlocked("MODIFY_EVIDENCE"),
    () => assertLedgerExplorerActionBlocked("REWRITE_LINEAGE"),
    () => assertLedgerExplorerActionBlocked("APPROVE_RECOMMENDATION"),
    () => assertLedgerExplorerActionBlocked("EXECUTE_DECISION"),
    () => assertLedgerExplorerActionBlocked("OVERRIDE_GOVERNANCE"),
    () => assertLedgerExplorerActionBlocked("REPAIR_HASH_CHAIN"),
  ];
  return surface("LEDGER_EXPLORER", [
    target({ surface: "LEDGER_EXPLORER", capability: "LEDGER_NAVIGATION", pass: view.records.length > 0 && detail.timeline.length > 0 && detail.graph.nodes.length > 0, evidence: ["ledger-explorer:navigation"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "EVIDENCE_DISPLAY", pass: detail.evidence.length > 0, evidence: ["ledger-explorer:evidence"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "GOVERNANCE_DISPLAY", pass: detail.governance.length > 0, evidence: ["ledger-explorer:governance"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "REPLAY_DISPLAY", pass: detail.replay_refs.length > 0, evidence: ["ledger-explorer:replay"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "INTEGRITY_DISPLAY", pass: Boolean(detail.integrity), evidence: ["ledger-explorer:integrity"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "AUDIT_LOGGING", pass: view.audit_events.length > 0, evidence: view.audit_events.map((event) => event.audit_event_id) }),
    target({ surface: "LEDGER_EXPLORER", capability: "REDACTION", pass: restricted.access_result === "REDACTED", evidence: ["ledger-explorer:redaction"] }),
    target({ surface: "LEDGER_EXPLORER", capability: "FAIL_CLOSED", pass: crossTenant.access_result === "FAILED_CLOSED" && allThrow(blockers), evidence: ["ledger-explorer:fail-closed", "ledger-explorer:read-only"] }),
  ]);
}

export function certifyIntegrityViewer(contract: VisibilityCertificationGateContract): SurfaceCertificationResult {
  const view = buildIntegrityStatusViewerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" });
  const detail = view.selected_record;
  const restricted = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "evidence_restricted_bundle");
  const crossTenant = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "truth_rec_beta");
  const corrupted = buildIntegrityStatusDetail(buildIntegrityStatusViewerContract({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_ids: contract.scope.mission_ids, access_level: "RESTRICTED_READ" }), "evidence_restricted_bundle");
  const blockers = [
    () => assertIntegrityViewerActionBlocked("REPAIR_HASH"),
    () => assertIntegrityViewerActionBlocked("RECALCULATE_HASH"),
    () => assertIntegrityViewerActionBlocked("SUPPRESS_TAMPER_WARNING"),
    () => assertIntegrityViewerActionBlocked("MARK_CORRUPTED_VALID"),
    () => assertIntegrityViewerActionBlocked("OVERRIDE_CERTIFICATION"),
    () => assertIntegrityViewerActionBlocked("OVERRIDE_GOVERNANCE"),
    () => assertIntegrityViewerActionBlocked("MUTATE_EVIDENCE"),
  ];
  return surface("INTEGRITY_STATUS_VIEWER", [
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "INTEGRITY_DISPLAY", pass: view.records.length > 0 && Boolean(detail.record_integrity), evidence: ["integrity-viewer:records"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "HASH_CHAIN_DISPLAY", pass: Boolean(detail.hash_chain), evidence: ["integrity-viewer:hash-chain"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "TAMPER_DISPLAY", pass: Boolean(corrupted.tamper_detection.alerts.length), evidence: ["integrity-viewer:tamper"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "VERIFICATION_DISPLAY", pass: Boolean(detail.verification_result), evidence: ["integrity-viewer:verification"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "CERTIFICATION_DISPLAY", pass: Boolean(detail.certification_gate), evidence: ["integrity-viewer:certification"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "GOVERNANCE_DISPLAY", pass: corrupted.certification_gate.trusted_interpretation_allowed === false, evidence: ["integrity-viewer:trusted-interpretation-block"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "AUDIT_LOGGING", pass: view.audit_events.length > 0, evidence: view.audit_events.map((event) => event.audit_event_id) }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "REDACTION", pass: restricted.access_result === "REDACTED", evidence: ["integrity-viewer:redaction"] }),
    target({ surface: "INTEGRITY_STATUS_VIEWER", capability: "FAIL_CLOSED", pass: crossTenant.access_result === "FAILED_CLOSED" && allThrow(blockers), evidence: ["integrity-viewer:fail-closed", "integrity-viewer:read-only"] }),
  ]);
}

function allThrow(checks: readonly (() => never)[]): boolean {
  return checks.every((check) => {
    try {
      check();
      return false;
    } catch {
      return true;
    }
  });
}

function surface(surfaceName: VisibilitySurface, targets: readonly VisibilityCertificationTarget[]): SurfaceCertificationResult {
  const failures = targets.filter((item) => item.certification_state === "FAIL" || item.certification_state === "BLOCKED");
  const warnings = targets.filter((item) => item.certification_state === "WARN");
  const state: VisibilityCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  return Object.freeze({
    surface: surfaceName,
    state,
    required_targets: targets.filter((item) => item.required).length,
    passed_targets: targets.filter((item) => item.certification_state === "PASS").length,
    warning_targets: warnings.length,
    failed_targets: failures.length,
    targets: Object.freeze([...targets]),
    evidence_refs: unique(targets.flatMap((item) => item.evidence_refs)),
    failure_refs: unique(failures.flatMap((item) => item.failure_refs)),
    warning_refs: unique(warnings.flatMap((item) => item.failure_refs)),
  });
}

export function runVisibilityDeterminismChecks(contract: VisibilityCertificationGateContract): readonly VisibilityDeterminismCheck[] {
  const snapshots = [
    ["TRUTH_DASHBOARD", () => buildTruthDashboardView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" }).records.map((item) => item.truth_record_id)],
    ["REPLAY_VIEWER", () => buildReplayViewerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" }).records.map((item) => `${item.replay_id}:${item.replay_state}`)],
    ["LEDGER_EXPLORER", () => buildLedgerExplorerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" }).selected_record.timeline.map((item) => item.truth_record_id)],
    ["INTEGRITY_STATUS_VIEWER", () => buildIntegrityStatusViewerView({ tenant_id: contract.tenant_id, operator_id: contract.operator_id ?? "operator_console", mission_id: contract.scope.mission_ids?.[0], access_level: "RESTRICTED_READ" }).selected_record.warnings],
  ] as const;
  return Object.freeze(snapshots.map(([surfaceName, read]) => {
    const first = read();
    const second = read();
    const firstHash = hashValue("visibility-certification-determinism-first", first);
    const secondHash = hashValue("visibility-certification-determinism-second", second);
    const match = JSON.stringify(first) === JSON.stringify(second);
    return Object.freeze({
      check_id: `determinism_${surfaceName}`,
      surface: surfaceName,
      query_ref: `${contract.certification_run_id}:${surfaceName}`,
      first_result_hash: firstHash,
      second_result_hash: secondHash,
      result_match: match,
      ordering_match: match,
      redaction_match: match,
      warning_match: match,
      certification_result: match ? "PASS" : "FAIL",
    });
  }));
}

export function runVisibilityCertification(contract: VisibilityCertificationGateContract = buildVisibilityCertificationGateContract()): VisibilityCertificationResult {
  if (!contract.tenant_id || !contract.operator_id) return failClosedResult(contract);
  const surfaceResults = Object.freeze([
    contract.scope.surfaces.includes("TRUTH_DASHBOARD") ? certifyTruthDashboard(contract) : undefined,
    contract.scope.surfaces.includes("REPLAY_VIEWER") ? certifyReplayViewer(contract) : undefined,
    contract.scope.surfaces.includes("LEDGER_EXPLORER") ? certifyLedgerExplorer(contract) : undefined,
    contract.scope.surfaces.includes("INTEGRITY_STATUS_VIEWER") ? certifyIntegrityViewer(contract) : undefined,
  ].filter(Boolean) as SurfaceCertificationResult[]);
  const determinismChecks = runVisibilityDeterminismChecks(contract);
  const targets = Object.freeze(surfaceResults.flatMap((item) => item.targets));
  const failures = Object.freeze(targets.filter((item) => item.certification_state === "FAIL" || item.certification_state === "BLOCKED"));
  const warnings = Object.freeze([
    ...targets.filter((item) => item.certification_state === "WARN"),
    ...determinismChecks.filter((item) => item.certification_result !== "PASS").map((item) => target({ surface: item.surface === "CROSS_SURFACE" ? "TRUTH_DASHBOARD" : item.surface, capability: "FAIL_CLOSED", pass: false, warning: true, evidence: [item.check_id], failure: item.query_ref })),
  ]);
  const certificationState: VisibilityCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const gateState: VisibilityGateState = certificationState === "PASS" ? "PASSED" : certificationState === "CONDITIONAL_PASS" ? "CONDITIONAL_PASSED" : "FAILED";
  const remediation = buildRemediation(contract, failures, warnings);
  const evidenceRefs = unique([...surfaceResults.flatMap((item) => item.evidence_refs), ...determinismChecks.map((item) => item.check_id)]);
  const auditEvents = Object.freeze([
    createVisibilityCertificationAuditEvent({ contract, event_type: "VISIBILITY_CERTIFICATION_RUN_STARTED" }),
    createVisibilityCertificationAuditEvent({ contract, event_type: "VISIBILITY_CERTIFICATION_RESULT_VIEWED", target_ref: certificationState }),
  ]);
  const report = buildReport(contract, surfaceResults, determinismChecks, failures, warnings, remediation, evidenceRefs, auditEvents.map((item) => item.audit_event_id));
  const ledgerEntry = buildLedgerEntry(contract, certificationState, report.report_id, evidenceRefs, auditEvents.map((item) => item.audit_event_id));
  return Object.freeze({
    certification_run_id: contract.certification_run_id,
    certification_state: certificationState,
    gate_state: gateState,
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id ?? "operator_console",
    generated_at: NOW,
    surface_results: surfaceResults,
    targets,
    determinism_checks: determinismChecks,
    failures,
    warnings,
    remediation,
    report,
    ledger_entry: ledgerEntry,
    evidence_refs: evidenceRefs,
    audit_events: auditEvents,
    readOnly: true,
    mutationAllowed: false,
    approvalAllowed: false,
    executionAllowed: false,
    repairAllowed: false,
    governanceOverrideAllowed: false,
  });
}

function failClosedResult(contract: VisibilityCertificationGateContract): VisibilityCertificationResult {
  const failedTarget = target({ surface: "TRUTH_DASHBOARD", capability: "FAIL_CLOSED", pass: false, evidence: ["visibility-certification:missing-access-context"], failure: "missing tenant or operator context" });
  const remediation = buildRemediation(contract, [failedTarget], []);
  const auditEvents = Object.freeze([createVisibilityCertificationAuditEvent({ contract, event_type: "VISIBILITY_CERTIFICATION_RUN_STARTED", target_ref: "FAIL_CLOSED" })]);
  const report = buildReport(contract, [], [], [failedTarget], [], remediation, failedTarget.evidence_refs, auditEvents.map((item) => item.audit_event_id));
  return Object.freeze({
    certification_run_id: contract.certification_run_id,
    certification_state: "FAIL",
    gate_state: "FAIL_CLOSED",
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id ?? "",
    generated_at: NOW,
    surface_results: Object.freeze([]),
    targets: Object.freeze([failedTarget]),
    determinism_checks: Object.freeze([]),
    failures: Object.freeze([failedTarget]),
    warnings: Object.freeze([]),
    remediation,
    report,
    ledger_entry: buildLedgerEntry(contract, "FAIL", report.report_id, failedTarget.evidence_refs, auditEvents.map((item) => item.audit_event_id)),
    evidence_refs: failedTarget.evidence_refs,
    audit_events: auditEvents,
    readOnly: true,
    mutationAllowed: false,
    approvalAllowed: false,
    executionAllowed: false,
    repairAllowed: false,
    governanceOverrideAllowed: false,
  });
}

function buildRemediation(contract: VisibilityCertificationGateContract, failures: readonly VisibilityCertificationTarget[], warnings: readonly VisibilityCertificationTarget[]): readonly VisibilityCertificationRemediation[] {
  const toRemediation = (item: VisibilityCertificationTarget, severity: VisibilitySeverity): VisibilityCertificationRemediation => Object.freeze({
    remediation_id: hashValue("visibility-certification-remediation", { run: contract.certification_run_id, target: item.target_id }),
    certification_run_id: contract.certification_run_id,
    tenant_id: contract.tenant_id,
    failed_check: item.target_id,
    severity,
    affected_surface: item.surface,
    issue_summary: `${item.surface} did not satisfy ${item.capability}.`,
    required_fix: item.capability === "REDACTION" ? "FIX_REDACTION" : item.capability === "AUDIT_LOGGING" ? "ADD_AUDIT_EVENT" : item.capability === "FAIL_CLOSED" ? "FIX_FAIL_CLOSED_BEHAVIOR" : item.capability === "INTEGRITY_DISPLAY" || item.capability === "HASH_CHAIN_DISPLAY" ? "BLOCK_TRUSTED_INTERPRETATION" : "ADD_MISSING_DISPLAY",
    certification_blocking: severity === "CRITICAL" || severity === "HIGH",
  });
  return Object.freeze([
    ...failures.map((item) => toRemediation(item, item.capability === "FAIL_CLOSED" || item.capability === "REDACTION" ? "CRITICAL" : "HIGH")),
    ...warnings.map((item) => toRemediation(item, "MEDIUM")),
  ]);
}

function buildReport(
  contract: VisibilityCertificationGateContract,
  surfaceResults: readonly SurfaceCertificationResult[],
  determinismChecks: readonly VisibilityDeterminismCheck[],
  failures: readonly VisibilityCertificationTarget[],
  warnings: readonly VisibilityCertificationTarget[],
  remediation: readonly VisibilityCertificationRemediation[],
  evidenceRefs: readonly string[],
  auditRefs: readonly string[],
): VisibilityCertificationReport {
  return Object.freeze({
    report_id: hashValue("visibility-certification-report", { run: contract.certification_run_id, evidenceRefs }),
    certification_run_id: contract.certification_run_id,
    tenant_id: contract.tenant_id,
    generated_at: NOW,
    summary: failures.length ? "Phase 6K visibility certification failed." : warnings.length ? "Phase 6K visibility certification conditionally passed." : "Phase 6K visibility certification passed.",
    surface_results: Object.freeze([...surfaceResults]),
    determinism_checks: Object.freeze([...determinismChecks]),
    failures: Object.freeze([...failures]),
    warnings: Object.freeze([...warnings]),
    remediation: Object.freeze([...remediation]),
    evidence_refs: Object.freeze([...evidenceRefs]),
    audit_refs: Object.freeze([...auditRefs]),
  });
}

function buildLedgerEntry(contract: VisibilityCertificationGateContract, state: VisibilityCertificationState, reportRef: string, evidenceRefs: readonly string[], auditRefs: readonly string[]): VisibilityCertificationLedgerEntry {
  return Object.freeze({
    ledger_entry_id: hashValue("visibility-certification-ledger-entry", { run: contract.certification_run_id, state, reportRef }),
    certification_run_id: contract.certification_run_id,
    tenant_id: contract.tenant_id,
    certification_state: state,
    report_ref: reportRef,
    evidence_refs: Object.freeze([...evidenceRefs]),
    audit_refs: Object.freeze([...auditRefs]),
    appendOnly: true,
    mutationAllowed: false,
  });
}

export function createVisibilityCertificationAuditEvent(input: Readonly<{
  contract: VisibilityCertificationGateContract;
  event_type: VisibilityCertificationAuditEvent["event_type"];
  target_ref?: string;
  timestamp?: string;
}>): VisibilityCertificationAuditEvent {
  return Object.freeze({
    audit_event_id: hashValue("visibility-certification-audit-event", { run: input.contract.certification_run_id, event_type: input.event_type, target_ref: input.target_ref, timestamp: input.timestamp ?? NOW }),
    certification_gate_id: input.contract.certification_gate_id,
    certification_run_id: input.contract.certification_run_id,
    tenant_id: input.contract.tenant_id,
    operator_id: input.contract.operator_id ?? "operator_console",
    event_type: input.event_type,
    target_ref: input.target_ref,
    timestamp: input.timestamp ?? NOW,
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function buildVisibilityCertificationView(input: Parameters<typeof buildVisibilityCertificationGateContract>[0] = {}): VisibilityCertificationView {
  const contract = buildVisibilityCertificationGateContract(input);
  const result = runVisibilityCertification(contract);
  return Object.freeze({
    contract,
    result,
    guardrails: Object.freeze([
      "certifies 6K visibility only",
      "no truth mutation",
      "no replay mutation",
      "no approval",
      "no execution",
      "no hash repair",
      "no certification override",
      "no governance override",
      "tenant isolation",
      "operator access verification",
      "deterministic certification",
      "fail-closed behavior",
    ]),
    generated_at: NOW,
  });
}
