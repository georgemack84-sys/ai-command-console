import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDeterministicOrchestrationCertification } from "@/services/decision-deterministic-orchestration-certification";
import type { DeterministicOrchestrationCertificationResult } from "@/types/decision-deterministic-orchestration-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ReplayCertificationEvidencePackage,
  ReplayCertificationLedgerEntry,
  ReplayDivergenceReport,
  ReplayIntegrityValidation,
  ReplayLineageValidation,
  ReplayReconstructionCertificationFailure,
  ReplayReconstructionCertificationFoundation,
  ReplayReconstructionCertificationInput,
  ReplayReconstructionCertificationResult,
  ReplayReconstructionCertificationValidation,
  ReplayReconstructionCheck,
  ReplayReconstructionReport,
  ReplayReconstructionSnapshot,
  ReplayReconstructionStage,
} from "@/types/decision-replay-reconstruction-certification";

const CERTIFICATION_VERSION = "decision-replay-reconstruction-certification/v1" as const;

export const REPLAY_RECONSTRUCTION_STAGES: readonly ReplayReconstructionStage[] = Object.freeze(["INPUT_REPLAY", "CONTEXT_REPLAY", "DEPENDENCY_REPLAY", "CONFLICT_REPLAY", "PRIORITY_REPLAY", "GOVERNANCE_REPLAY", "OPERATOR_REPLAY", "FINAL_DECISION_REPLAY"]);
export const REPLAY_RECONSTRUCTION_CHECKS: readonly ReplayReconstructionCheck[] = Object.freeze(["RECONSTRUCTION_COMPLETENESS", "REPLAY_FIDELITY", "DIVERGENCE_DETECTION", "LINEAGE_VALIDATION", "INTEGRITY_VALIDATION", "GOVERNANCE_REPLAY", "OPERATOR_REPLAY", "TENANT_ISOLATION"]);

type Scenario = NonNullable<ReplayReconstructionCertificationInput["scenario"]>;

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

function ctx(source: DeterministicOrchestrationCertificationResult) {
  return {
    tenant_id: source.determinism_report.tenant_id,
    mission_id: source.determinism_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: DeterministicOrchestrationCertificationResult, role: VisibilityRole): boolean {
  return source.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildSnapshot(source: DeterministicOrchestrationCertificationResult, scenario: Scenario, replay_source: "ORIGINAL" | "RECONSTRUCTED"): ReplayReconstructionSnapshot {
  const c = ctx(source);
  const execution = source.executions[0];
  const varied = replay_source === "RECONSTRUCTED";
  const maybe = <T>(normal: T, replacement: T, variation: Scenario): T => scenario === variation && varied ? replacement : normal;
  const input_refs = freezeArray(maybe(execution.candidate_order, execution.candidate_order.slice(0, 2), "MISSING_REPLAY_RECORDS"));
  const context_refs = freezeArray(maybe(execution.context_refs, [...execution.context_refs, "context:replay:drift"], "CONTEXT_MISMATCH"));
  const dependency_refs = freezeArray(maybe([...execution.graph_node_order, ...execution.graph_edge_order], ["node:alpha", "edge:alpha->unknown"], "DEPENDENCY_MISMATCH"));
  const conflict_refs = freezeArray(maybe(execution.conflict_resolution_order, ["conflict:manual-review", "arbitration:changed"], "CONFLICT_MISMATCH"));
  const priority_refs = freezeArray(maybe(execution.priority_order, [...execution.priority_order].reverse(), "PRIORITY_MISMATCH"));
  const governance_refs = freezeArray(maybe(["policy:certified", "governance:pass", "compliance:pass"], ["policy:certified", "governance:changed", "compliance:pass"], "GOVERNANCE_MISMATCH"));
  const constitutional_refs = freezeArray(maybe(["constitutional:validated", "constitutional:no-violation"], ["constitutional:missing"], "CONSTITUTIONAL_MISMATCH"));
  const authority_refs = freezeArray(maybe(["authority:operator-visible", "approval:required-none"], ["authority:unknown"], "AUTHORITY_MISMATCH"));
  const operator_refs = freezeArray(maybe(["operator:approval-history:none", "operator:workflow:reviewed"], ["operator:override:unexpected"], "OPERATOR_MISMATCH"));
  const final_decision_refs = freezeArray(maybe(["recommendation:alpha", "alternative:bravo", "rejected:charlie"], ["recommendation:bravo", "alternative:alpha", "rejected:charlie"], "FINAL_RECOMMENDATION_MISMATCH"));
  const decision_package_refs = freezeArray(maybe(execution.decision_package_refs, [...execution.decision_package_refs, "package:replay:unexpected"], "PACKAGE_MISMATCH"));
  const ledger_refs = freezeArray(maybe(source.determinism_ledger.map((entry) => entry.ledger_entry_id), [], "MISSING_LEDGER_REFERENCES"));
  const certification_refs = freezeArray(maybe([source.determinism_report.report_id, source.replay_hash], [], "MISSING_EVIDENCE"));
  const replay_metadata_refs = freezeArray(maybe([source.replay_hash, execution.output_hash, execution.fingerprint.replay_fingerprint], [], "MISSING_REPLAY_RECORDS"));
  const stage_order = freezeArray(maybe(REPLAY_RECONSTRUCTION_STAGES, REPLAY_RECONSTRUCTION_STAGES.slice(0, -2), "INCOMPLETE_RECONSTRUCTION"));
  const tenant_id = scenario === "CROSS_TENANT" && varied ? `${c.tenant_id}_foreign` : c.tenant_id;
  const reconstruction_hash = scenario === "REPLAY_MISMATCH" && varied ? hash({ replayMismatch: execution.output_hash }) : hash({ input_refs, context_refs, dependency_refs, conflict_refs, priority_refs, governance_refs, constitutional_refs, authority_refs, operator_refs, final_decision_refs, decision_package_refs, ledger_refs, certification_refs, replay_metadata_refs, stage_order, tenant_id });
  const base: Omit<ReplayReconstructionSnapshot, "integrity_hash"> = {
    snapshot_id: `replay_reconstruction_${replay_source.toLowerCase()}`,
    tenant_id,
    mission_id: c.mission_id,
    replay_source,
    input_refs,
    context_refs,
    dependency_refs,
    conflict_refs,
    priority_refs,
    governance_refs,
    constitutional_refs,
    authority_refs,
    operator_refs,
    final_decision_refs,
    decision_package_refs,
    ledger_refs,
    certification_refs,
    replay_metadata_refs,
    stage_order,
    reconstruction_hash,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && varied) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.snapshot_id }) });
  return built;
}

function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  return serializeDecisionCanonically(a) === serializeDecisionCanonically(b);
}

function buildDivergenceReport(source: DeterministicOrchestrationCertificationResult, original: ReplayReconstructionSnapshot, replay: ReplayReconstructionSnapshot, scenario: Scenario): ReplayDivergenceReport {
  const c = ctx(source);
  const divergences: ReplayReconstructionCertificationFailure[] = [];
  const input_match = arraysEqual(original.input_refs, replay.input_refs);
  const context_match = arraysEqual(original.context_refs, replay.context_refs);
  const dependency_match = arraysEqual(original.dependency_refs, replay.dependency_refs);
  const conflict_match = arraysEqual(original.conflict_refs, replay.conflict_refs);
  const priority_match = arraysEqual(original.priority_refs, replay.priority_refs);
  const governance_match = arraysEqual(original.governance_refs, replay.governance_refs);
  const constitutional_match = arraysEqual(original.constitutional_refs, replay.constitutional_refs);
  const authority_match = arraysEqual(original.authority_refs, replay.authority_refs);
  const operator_match = arraysEqual(original.operator_refs, replay.operator_refs);
  const final_decision_match = arraysEqual(original.final_decision_refs, replay.final_decision_refs);
  const package_match = arraysEqual(original.decision_package_refs, replay.decision_package_refs);
  const ledger_match = arraysEqual(original.ledger_refs, replay.ledger_refs);
  if (original.reconstruction_hash !== replay.reconstruction_hash) divergences.push("REPLAY_MISMATCH");
  if (!input_match || !replay.replay_metadata_refs.length) divergences.push("MISSING_REPLAY_RECORDS");
  if (!ledger_match || !replay.ledger_refs.length) divergences.push("MISSING_LEDGER_REFERENCES");
  if (!arraysEqual(original.stage_order, replay.stage_order)) divergences.push("INCOMPLETE_RECONSTRUCTION");
  if (!context_match) divergences.push("CONTEXT_REPLAY_MISMATCH");
  if (!dependency_match) divergences.push("DEPENDENCY_GRAPH_MISMATCH");
  if (!conflict_match) divergences.push("CONFLICT_REPLAY_MISMATCH");
  if (!priority_match) divergences.push("PRIORITY_REPLAY_MISMATCH");
  if (!governance_match) divergences.push("GOVERNANCE_REPLAY_MISMATCH");
  if (!constitutional_match) divergences.push("CONSTITUTIONAL_REPLAY_MISMATCH");
  if (!authority_match) divergences.push("AUTHORITY_REPLAY_MISMATCH");
  if (!operator_match) divergences.push("OPERATOR_REPLAY_MISMATCH");
  if (!final_decision_match) divergences.push("FINAL_RECOMMENDATION_MISMATCH");
  if (!package_match) divergences.push("DECISION_PACKAGE_MISMATCH");
  if (original.tenant_id !== replay.tenant_id) divergences.push("CROSS_TENANT_REPLAY_CONTAMINATION");
  if (scenario === "UNDETECTED_DIVERGENCE") divergences.push("UNDETECTED_REPLAY_DIVERGENCE");
  const detected = scenario !== "UNDETECTED_DIVERGENCE";
  const severity = divergences.length ? (detected ? "CRITICAL" : "MAJOR") : "NONE";
  const base: Omit<ReplayDivergenceReport, "integrity_hash"> = {
    divergence_report_id: "replay_reconstruction_divergence_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    original_snapshot_id: original.snapshot_id,
    replay_snapshot_id: replay.snapshot_id,
    input_match,
    context_match,
    dependency_match,
    conflict_match,
    priority_match,
    governance_match,
    constitutional_match,
    authority_match,
    operator_match,
    final_decision_match,
    package_match,
    ledger_match,
    severity,
    detected,
    divergences: freezeArray([...new Set(divergences)]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(source: DeterministicOrchestrationCertificationResult, replay: ReplayReconstructionSnapshot, scenario: Scenario): ReplayLineageValidation {
  const c = ctx(source);
  const broken = scenario === "LINEAGE_BROKEN";
  const base: Omit<ReplayLineageValidation, "integrity_hash"> = {
    lineage_validation_id: "replay_reconstruction_lineage_validation",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    parent_child_relationships_complete: !broken,
    dependency_lineage_complete: !broken && replay.dependency_refs.length > 0,
    decision_lineage_complete: !broken && replay.final_decision_refs.length > 0,
    evidence_lineage_complete: !broken && replay.certification_refs.length > 0,
    governance_lineage_complete: !broken && replay.governance_refs.length > 0,
    operator_lineage_complete: !broken && replay.operator_refs.length > 0,
    certification_lineage_complete: !broken && replay.certification_refs.length > 0,
    validation_state: broken ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrity(source: DeterministicOrchestrationCertificationResult, original: ReplayReconstructionSnapshot, replay: ReplayReconstructionSnapshot, lineage: ReplayLineageValidation, scenario: Scenario): ReplayIntegrityValidation {
  const c = ctx(source);
  const snapshotValid = hashWithoutIntegrity(original) === original.integrity_hash && hashWithoutIntegrity(replay) === replay.integrity_hash;
  const base: Omit<ReplayIntegrityValidation, "integrity_hash"> = {
    integrity_validation_id: "replay_reconstruction_integrity_validation",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    replay_hashes_reproduced: original.reconstruction_hash === replay.reconstruction_hash && scenario !== "REPLAY_MISMATCH",
    immutable_ledger_refs_valid: replay.ledger_refs.length > 0 && scenario !== "MISSING_LEDGER_REFERENCES",
    signatures_valid: scenario !== "HASH_MISMATCH",
    lineage_integrity_valid: lineage.validation_state === "PASS",
    snapshot_integrity_valid: snapshotValid,
    certification_refs_valid: replay.certification_refs.length > 0 && scenario !== "MISSING_EVIDENCE",
    validation_state: snapshotValid && lineage.validation_state === "PASS" && replay.ledger_refs.length > 0 && replay.certification_refs.length > 0 && scenario !== "REPLAY_MISMATCH" ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(source: DeterministicOrchestrationCertificationResult, original: ReplayReconstructionSnapshot, replay: ReplayReconstructionSnapshot, divergence: ReplayDivergenceReport, lineage: ReplayLineageValidation, integrity: ReplayIntegrityValidation, scenario: Scenario): ReplayCertificationEvidencePackage {
  const c = ctx(source);
  const base: Omit<ReplayCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "replay_reconstruction_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    reconstruction_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([original.snapshot_id, replay.snapshot_id]),
    replay_evidence_refs: scenario === "MISSING_REPLAY_RECORDS" ? freezeArray([]) : freezeArray([source.replay_hash, ...replay.replay_metadata_refs]),
    divergence_evidence_refs: freezeArray([divergence.divergence_report_id]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray([integrity.integrity_validation_id, original.integrity_hash, replay.integrity_hash]),
    lineage_evidence_refs: scenario === "LINEAGE_BROKEN" ? freezeArray([]) : freezeArray([lineage.lineage_validation_id]),
    complete: scenario !== "MISSING_EVIDENCE" && scenario !== "MISSING_REPLAY_RECORDS",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: DeterministicOrchestrationCertificationResult, divergence: ReplayDivergenceReport, lineage: ReplayLineageValidation, integrity: ReplayIntegrityValidation, failures: readonly ReplayReconstructionCertificationFailure[]): ReplayReconstructionReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<ReplayReconstructionReport, "integrity_hash"> = {
    report_id: "replay_reconstruction_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Replay reconstructs the complete orchestration lifecycle from immutable records." : "Replay reconstruction certification is blocked by lifecycle replay or evidence failures.",
    replay_scope: REPLAY_RECONSTRUCTION_STAGES,
    certified_checks: REPLAY_RECONSTRUCTION_CHECKS,
    reconstruction_results: divergence.divergences.length ? "FAIL" : "PASS",
    replay_test_results: divergence.severity === "NONE" ? "PASS" : "FAIL",
    context_reconstruction: divergence.context_match ? "PASS" : "FAIL",
    dependency_reconstruction: divergence.dependency_match ? "PASS" : "FAIL",
    conflict_reconstruction: divergence.conflict_match ? "PASS" : "FAIL",
    priority_reconstruction: divergence.priority_match ? "PASS" : "FAIL",
    governance_reconstruction: divergence.governance_match && divergence.constitutional_match && divergence.authority_match ? "PASS" : "FAIL",
    operator_reconstruction: divergence.operator_match ? "PASS" : "FAIL",
    final_decision_reconstruction: divergence.final_decision_match && divergence.package_match ? "PASS" : "FAIL",
    divergence_analysis: divergence.severity,
    integrity_verification: integrity.validation_state === "PASS" && lineage.validation_state === "PASS" ? "PASS" : "FAIL",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: DeterministicOrchestrationCertificationResult, evidence: ReplayCertificationEvidencePackage, report: ReplayReconstructionReport, scenario: Scenario): readonly ReplayCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<ReplayCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "replay_reconstruction_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "REPLAY_RECONSTRUCTED", scope_ref: "complete_orchestration_lifecycle", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:10.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "replay_reconstruction_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "REPLAY_COMPARED", scope_ref: "original_vs_replay", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:11.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "replay_reconstruction_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "LINEAGE_VALIDATED", scope_ref: "replay_lineage", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:12.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "replay_reconstruction_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "REPLAY_CERTIFIED" : "REPLAY_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:13.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function collectFailures(input: {
  deterministic: DeterministicOrchestrationCertificationResult;
  divergence: ReplayDivergenceReport;
  lineage: ReplayLineageValidation;
  integrity: ReplayIntegrityValidation;
  evidence: ReplayCertificationEvidencePackage;
  ledger: readonly ReplayCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ReplayReconstructionCertificationFailure[] {
  const failures: ReplayReconstructionCertificationFailure[] = [];
  if (input.deterministic.validation.validation_status !== "VALID" || input.deterministic.determinism_report.certification_decision !== "PASS") failures.push("DETERMINISTIC_ORCHESTRATION_CERTIFICATION_INVALID");
  failures.push(...input.divergence.divergences);
  if (input.lineage.validation_state !== "PASS") failures.push("REPLAY_LINEAGE_BROKEN");
  if (input.integrity.validation_state !== "PASS") failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.evidence.complete || !input.evidence.reconstruction_evidence_refs.length || !input.evidence.integrity_evidence_refs.length) failures.push("MISSING_CERTIFICATION_EVIDENCE");
  if (input.scenario === "HIDDEN_REPLAY_LOGIC") failures.push("HIDDEN_REPLAY_LOGIC");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_REPLAY_BEHAVIOR");
  if (!visibleToRole(input.deterministic, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly ReplayReconstructionCertificationFailure[]): ReplayReconstructionCertificationValidation {
  const has = (failure: ReplayReconstructionCertificationFailure) => failures.includes(failure);
  const base: Omit<ReplayReconstructionCertificationValidation, "integrity_hash"> = {
    validation_id: "replay_reconstruction_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    deterministic_certification_valid: !has("DETERMINISTIC_ORCHESTRATION_CERTIFICATION_INVALID"),
    replay_reconstructed: !has("REPLAY_MISMATCH"),
    replay_records_complete: !has("MISSING_REPLAY_RECORDS"),
    ledger_references_complete: !has("MISSING_LEDGER_REFERENCES"),
    context_replay_valid: !has("CONTEXT_REPLAY_MISMATCH"),
    dependency_replay_valid: !has("DEPENDENCY_GRAPH_MISMATCH"),
    conflict_replay_valid: !has("CONFLICT_REPLAY_MISMATCH"),
    priority_replay_valid: !has("PRIORITY_REPLAY_MISMATCH"),
    governance_replay_valid: !has("GOVERNANCE_REPLAY_MISMATCH"),
    constitutional_replay_valid: !has("CONSTITUTIONAL_REPLAY_MISMATCH"),
    authority_replay_valid: !has("AUTHORITY_REPLAY_MISMATCH"),
    operator_replay_valid: !has("OPERATOR_REPLAY_MISMATCH"),
    final_recommendation_replay_valid: !has("FINAL_RECOMMENDATION_MISMATCH"),
    decision_package_replay_valid: !has("DECISION_PACKAGE_MISMATCH"),
    lineage_complete: !has("REPLAY_LINEAGE_BROKEN"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    certification_evidence_complete: !has("MISSING_CERTIFICATION_EVIDENCE"),
    hidden_replay_logic_absent: !has("HIDDEN_REPLAY_LOGIC"),
    divergence_detection_valid: !has("UNDETECTED_REPLAY_DIVERGENCE"),
    tenant_isolated: !has("CROSS_TENANT_REPLAY_CONTAMINATION"),
    fail_closed: !has("FAIL_OPEN_REPLAY_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ReplayReconstructionCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    original: result.original_snapshot,
    replay: result.replay_snapshot,
    divergence: result.divergence_report,
    lineage: result.lineage_validation,
    integrity: result.integrity_validation,
    evidence: result.evidence_package,
    report: result.reconstruction_report,
    ledger: result.replay_ledger,
    validation: result.validation,
  });
}

export function runReplayReconstructionCertification(input: ReplayReconstructionCertificationInput = {}): ReplayReconstructionCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const deterministic_certification = input.deterministic_certification ?? runDeterministicOrchestrationCertification({ scenario: scenario === "DETERMINISM_INVALID" ? "REPLAY_DIVERGENCE" : "BASELINE" });
  const original_snapshot = buildSnapshot(deterministic_certification, scenario, "ORIGINAL");
  const replay_snapshot = buildSnapshot(deterministic_certification, scenario, "RECONSTRUCTED");
  const divergence_report = buildDivergenceReport(deterministic_certification, original_snapshot, replay_snapshot, scenario);
  const lineage_validation = buildLineage(deterministic_certification, replay_snapshot, scenario);
  const integrity_validation = buildIntegrity(deterministic_certification, original_snapshot, replay_snapshot, lineage_validation, scenario);
  const evidence_package = buildEvidence(deterministic_certification, original_snapshot, replay_snapshot, divergence_report, lineage_validation, integrity_validation, scenario);
  const preFailures = collectFailures({ deterministic: deterministic_certification, divergence: divergence_report, lineage: lineage_validation, integrity: integrity_validation, evidence: evidence_package, ledger: [], role, scenario });
  const reconstruction_report = buildReport(deterministic_certification, divergence_report, lineage_validation, integrity_validation, preFailures);
  const replay_ledger = buildLedger(deterministic_certification, evidence_package, reconstruction_report, scenario);
  const failures = collectFailures({ deterministic: deterministic_certification, divergence: divergence_report, lineage: lineage_validation, integrity: integrity_validation, evidence: evidence_package, ledger: replay_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<ReplayReconstructionCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    deterministic_certification,
    original_snapshot,
    replay_snapshot,
    divergence_report,
    lineage_validation,
    integrity_validation,
    evidence_package,
    reconstruction_report,
    replay_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_replay_records: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayReplayReconstructionCertification(result: ReplayReconstructionCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeReplayReconstructionSnapshotHash(record: Omit<ReplayReconstructionSnapshot, "integrity_hash"> | ReplayReconstructionSnapshot): string {
  return hashWithoutIntegrity(record);
}

export function getReplayReconstructionCertificationFoundation(): ReplayReconstructionCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    stages: REPLAY_RECONSTRUCTION_STAGES,
    checks: REPLAY_RECONSTRUCTION_CHECKS,
    result: runReplayReconstructionCertification(),
  });
}

export const ReplayReconstructionCertification = Object.freeze({
  run: runReplayReconstructionCertification,
  replay: replayReplayReconstructionCertification,
});
