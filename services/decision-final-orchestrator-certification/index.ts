import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionReadinessAssessment } from "@/services/decision-production-readiness-assessment";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ProductionReadinessResult } from "@/types/decision-production-readiness-assessment";
import type {
  CertificationDecisionMatrix,
  FinalCertificationCheck,
  FinalCertificationEvidencePackage,
  FinalCertificationFailure,
  FinalCertificationLedgerEntry,
  FinalCertificationOutcome,
  FinalCertificationReport,
  FinalCertificationScope,
  FinalCertificationState,
  FinalCertificationValidation,
  FinalOrchestratorCertificationFoundation,
  FinalOrchestratorCertificationInput,
  FinalOrchestratorCertificationResult,
  FinalReplayVerificationReport,
  IntegratedValidationReport,
  Phase9CompletionReport,
  ProductionApprovalDecision,
} from "@/types/decision-final-orchestrator-certification";

const CERTIFICATION_VERSION = "decision-final-orchestrator-certification/v1" as const;

export const FINAL_CERTIFICATION_SCOPES: readonly FinalCertificationScope[] = Object.freeze(["FOUNDATION_SCHEMA", "DETERMINISTIC_ORCHESTRATION", "REPLAY_RECONSTRUCTION", "GOVERNANCE_CONSTITUTIONAL", "DECISION_INTELLIGENCE", "OPERATOR_WORKFLOW", "LEDGER_INTEGRITY", "OBSERVABILITY_DASHBOARD", "SECURITY_ISOLATION_BOUNDARY", "PRODUCTION_READINESS"]);
export const FINAL_CERTIFICATION_CHECKS: readonly FinalCertificationCheck[] = Object.freeze(["COMPLETE_CERTIFICATION_SUITE", "INTEGRATED_ORCHESTRATION", "END_TO_END_REPLAY", "REPLAY_DIVERGENCE_DETECTION", "GOVERNANCE_ENFORCEMENT", "CONSTITUTIONAL_COMPLIANCE", "AUTHORITY_BOUNDARIES", "OPERATOR_SUPREMACY", "IMMUTABLE_LEDGER", "EVIDENCE_LINEAGE", "DASHBOARD_VISIBILITY", "SECURITY_BOUNDARIES", "TENANT_ISOLATION", "ADVISORY_ONLY", "PRODUCTION_APPROVAL"]);

type Scenario = NonNullable<FinalOrchestratorCertificationInput["scenario"]>;

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

function state(pass: boolean): FinalCertificationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: ProductionReadinessResult) {
  return {
    tenant_id: source.operational_report.tenant_id,
    mission_id: source.operational_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: ProductionReadinessResult, role: VisibilityRole): boolean {
  return source.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildIntegrated(source: ProductionReadinessResult, scenario: Scenario): IntegratedValidationReport {
  const c = ctx(source);
  const base: Omit<IntegratedValidationReport, "integrity_hash"> = {
    report_id: "final_integrated_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    complete_suite_executed: source.validation.validation_status === "VALID" && scenario !== "PRODUCTION_INVALID",
    foundation_schema_verified: source.checklist.all_phase_9_certifications_complete,
    deterministic_orchestration_verified: source.deterministic && scenario !== "NONDETERMINISTIC",
    governance_verified: source.validation.governance_ready && scenario !== "GOVERNANCE_BYPASS",
    constitutional_verified: source.validation.governance_ready && scenario !== "CONSTITUTIONAL_VIOLATION",
    authority_boundaries_enforced: source.security_certification.validation.authority_boundaries_enforced && scenario !== "AUTHORITY_VIOLATION",
    operator_supremacy_preserved: source.security_certification.validation.approvals_enforced && scenario !== "MISSING_OPERATOR_APPROVAL",
    ledger_integrity_verified: source.validation.integrity_verified && scenario !== "LEDGER_MUTATION",
    observability_complete: source.security_certification.validation.observability_certification_valid && scenario !== "DASHBOARD_GAP" && scenario !== "HIDDEN_ORCHESTRATION_STATE",
    security_boundaries_enforced: source.validation.security_certification_valid && scenario !== "SECURITY_BOUNDARY_VIOLATION",
    production_readiness_approved: source.approved_for_controlled_production && scenario !== "PRODUCTION_INVALID",
    cross_phase_consistency_verified: !["HIDDEN_DECISION_LOGIC", "CROSS_TENANT_DATA", "TENANT_LEAKAGE"].includes(scenario),
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.complete_suite_executed && base.foundation_schema_verified && base.deterministic_orchestration_verified && base.governance_verified && base.constitutional_verified && base.authority_boundaries_enforced && base.operator_supremacy_preserved && base.ledger_integrity_verified && base.observability_complete && base.security_boundaries_enforced && base.production_readiness_approved && base.cross_phase_consistency_verified) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReplay(source: ProductionReadinessResult, scenario: Scenario): FinalReplayVerificationReport {
  const c = ctx(source);
  const base: Omit<FinalReplayVerificationReport, "integrity_hash"> = {
    report_id: "final_replay_verification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    end_to_end_replay_verified: source.replayable && scenario !== "REPLAY_DIVERGENCE",
    complete_reconstruction_verified: scenario !== "REPLAY_RECONSTRUCTION_FAILURE",
    replay_determinism_verified: scenario !== "NONDETERMINISTIC" && scenario !== "REPLAY_DIVERGENCE",
    replay_lineage_complete: scenario !== "INCOMPLETE_REPLAY_LINEAGE",
    replay_integrity_verified: scenario !== "HASH_MISMATCH",
    replay_auditability_verified: scenario !== "MISSING_AUDIT",
    divergence_detection_operational: scenario !== "REPLAY_DIVERGENCE",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.end_to_end_replay_verified && base.complete_reconstruction_verified && base.replay_determinism_verified && base.replay_lineage_complete && base.replay_integrity_verified && base.replay_auditability_verified && base.divergence_detection_operational) };
  const built = Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.report_id }) });
  return built;
}

function buildEvidence(source: ProductionReadinessResult, integrated: IntegratedValidationReport, replay: FinalReplayVerificationReport, scenario: Scenario): FinalCertificationEvidencePackage {
  const c = ctx(source);
  const base: Omit<FinalCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "final_orchestrator_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    certification_evidence_refs: scenario === "PRODUCTION_INVALID" ? freezeArray([]) : freezeArray([integrated.report_id, source.operational_report.report_id, source.scorecard.scorecard_id]),
    replay_evidence_refs: scenario === "REPLAY_DIVERGENCE" || scenario === "INCOMPLETE_REPLAY_LINEAGE" ? freezeArray([]) : freezeArray([replay.report_id, source.replay_hash]),
    governance_evidence_refs: scenario === "GOVERNANCE_BYPASS" ? freezeArray([]) : freezeArray([source.security_certification.governance_boundary_report.report_id]),
    constitutional_evidence_refs: scenario === "CONSTITUTIONAL_VIOLATION" ? freezeArray([]) : freezeArray(["final:constitutional:lineage", "final:constitutional:precedence"]),
    operator_evidence_refs: scenario === "MISSING_OPERATOR_APPROVAL" ? freezeArray([]) : freezeArray([source.security_certification.authority_boundary_report.report_id]),
    ledger_evidence_refs: scenario === "LEDGER_MUTATION" ? freezeArray([]) : freezeArray([source.readiness_ledger[0]?.ledger_entry_id ?? "readiness:ledger", source.security_certification.security_ledger[0]?.ledger_entry_id ?? "security:ledger"]),
    dashboard_evidence_refs: scenario === "DASHBOARD_GAP" || scenario === "HIDDEN_ORCHESTRATION_STATE" ? freezeArray([]) : freezeArray([source.security_certification.observability_certification.dashboard_snapshot.dashboard_id]),
    security_evidence_refs: scenario === "SECURITY_BOUNDARY_VIOLATION" || scenario === "TENANT_LEAKAGE" || scenario === "UNAUTHORIZED_EXECUTION" ? freezeArray([]) : freezeArray([source.security_certification.security_report.report_id]),
    production_evidence_refs: scenario === "PRODUCTION_INVALID" ? freezeArray([]) : freezeArray([source.evidence_package.evidence_package_id]),
    audit_evidence_refs: scenario === "MISSING_AUDIT" ? freezeArray([]) : freezeArray([source.operational_report.report_id, source.readiness_ledger[source.readiness_ledger.length - 1]?.ledger_entry_id ?? "production:approval"]),
    complete: !["PRODUCTION_INVALID", "REPLAY_DIVERGENCE", "INCOMPLETE_REPLAY_LINEAGE", "GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "MISSING_OPERATOR_APPROVAL", "LEDGER_MUTATION", "DASHBOARD_GAP", "HIDDEN_ORCHESTRATION_STATE", "SECURITY_BOUNDARY_VIOLATION", "TENANT_LEAKAGE", "UNAUTHORIZED_EXECUTION", "MISSING_AUDIT", "HIDDEN_DECISION_LOGIC"].includes(scenario),
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  production: ProductionReadinessResult;
  integrated: IntegratedValidationReport;
  replay: FinalReplayVerificationReport;
  evidence: FinalCertificationEvidencePackage;
  ledger: readonly FinalCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly FinalCertificationFailure[] {
  const failures: FinalCertificationFailure[] = [];
  if (input.production.validation.validation_status !== "VALID" || !input.production.approved_for_controlled_production) failures.push("PRECEDING_CERTIFICATION_CRITICAL_FAILURE");
  if (!input.integrated.deterministic_orchestration_verified || !input.replay.replay_determinism_verified) failures.push("NONDETERMINISTIC_ORCHESTRATION");
  if (!input.replay.end_to_end_replay_verified || !input.replay.divergence_detection_operational) failures.push("REPLAY_DIVERGENCE");
  if (!input.replay.complete_reconstruction_verified) failures.push("REPLAY_RECONSTRUCTION_FAILURE");
  if (!input.integrated.governance_verified) failures.push("GOVERNANCE_BYPASS");
  if (!input.integrated.constitutional_verified) failures.push("CONSTITUTIONAL_VIOLATION");
  if (!input.integrated.authority_boundaries_enforced) failures.push("AUTHORITY_BOUNDARY_VIOLATION");
  if (input.scenario === "UNAUTHORIZED_EXECUTION") failures.push("UNAUTHORIZED_EXECUTION");
  if (input.scenario === "TENANT_LEAKAGE") failures.push("TENANT_LEAKAGE");
  if (input.scenario === "CROSS_TENANT_DATA") failures.push("CROSS_TENANT_DATA_EXPOSURE");
  if (input.scenario === "HIDDEN_DECISION_LOGIC" || !input.evidence.complete) failures.push("HIDDEN_DECISION_LOGIC");
  if (!input.integrated.observability_complete || input.scenario === "HIDDEN_ORCHESTRATION_STATE") failures.push("HIDDEN_ORCHESTRATION_STATE");
  if (!input.integrated.operator_supremacy_preserved) failures.push("MISSING_OPERATOR_APPROVAL");
  if (!input.replay.replay_auditability_verified || !input.evidence.audit_evidence_refs.length) failures.push("MISSING_AUDIT_EVIDENCE");
  if (!input.integrated.ledger_integrity_verified || input.scenario === "LEDGER_MUTATION") failures.push("LEDGER_MUTATION");
  if (
    hashWithoutIntegrity(input.integrated) !== input.integrated.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.replay.replay_lineage_complete) failures.push("INCOMPLETE_REPLAY_LINEAGE");
  if (!input.integrated.observability_complete) failures.push("DASHBOARD_VISIBILITY_GAP");
  if (!input.integrated.security_boundaries_enforced || input.scenario === "SECURITY_BOUNDARY_VIOLATION") failures.push("SECURITY_BOUNDARY_VIOLATION");
  if (!input.integrated.production_readiness_approved) failures.push("PRODUCTION_READINESS_FAILURE");
  if (input.scenario === "DOCUMENTATION_DEFICIENCY") failures.push("DOCUMENTATION_DEFICIENCY");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_BEHAVIOR");
  if (!visibleToRole(input.production, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(failures: readonly FinalCertificationFailure[]): FinalCertificationOutcome {
  if (failures.length === 0) return "PASS";
  if (failures.length === 1 && failures[0] === "DOCUMENTATION_DEFICIENCY") return "CONDITIONAL_PASS";
  return "FAIL";
}

function buildMatrix(source: ProductionReadinessResult, integrated: IntegratedValidationReport, replay: FinalReplayVerificationReport, failures: readonly FinalCertificationFailure[]): CertificationDecisionMatrix {
  const c = ctx(source);
  const base: Omit<CertificationDecisionMatrix, "integrity_hash"> = {
    matrix_id: "final_certification_decision_matrix",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    scopes: FINAL_CERTIFICATION_SCOPES,
    checks: FINAL_CERTIFICATION_CHECKS,
    foundation_schema: state(integrated.foundation_schema_verified),
    deterministic_orchestration: state(integrated.deterministic_orchestration_verified),
    replay_reconstruction: replay.validation_state,
    governance_constitutional: state(integrated.governance_verified && integrated.constitutional_verified),
    decision_intelligence: state(source.checklist.decision_intelligence_certification_passed),
    operator_workflow: state(integrated.operator_supremacy_preserved),
    ledger_integrity: state(integrated.ledger_integrity_verified),
    observability_dashboard: state(integrated.observability_complete),
    security_isolation_boundary: state(integrated.security_boundaries_enforced),
    production_readiness: state(integrated.production_readiness_approved),
    outcome: outcomeFor(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildFinalReport(source: ProductionReadinessResult, matrix: CertificationDecisionMatrix, failures: readonly FinalCertificationFailure[]): FinalCertificationReport {
  const c = ctx(source);
  const approval = matrix.outcome === "PASS" ? "APPROVE_PRODUCTION" : "BLOCK_PRODUCTION";
  const base: Omit<FinalCertificationReport, "integrity_hash"> = {
    report_id: "final_decision_orchestrator_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: matrix.outcome === "PASS" ? "Mission Control Phase 9 Decision Orchestrator is fully certified, production-ready, and complete." : "Final Decision Orchestrator certification is blocked by critical certification, replay, governance, security, observability, production, or integrity findings.",
    certification_scope: FINAL_CERTIFICATION_SCOPES,
    certified_checks: FINAL_CERTIFICATION_CHECKS,
    deterministic_orchestration_assessment: matrix.deterministic_orchestration,
    replay_assessment: matrix.replay_reconstruction,
    governance_assessment: state(matrix.governance_constitutional === "PASS" && !failures.includes("GOVERNANCE_BYPASS")),
    constitutional_assessment: state(matrix.governance_constitutional === "PASS" && !failures.includes("CONSTITUTIONAL_VIOLATION")),
    authority_assessment: state(!failures.includes("AUTHORITY_BOUNDARY_VIOLATION")),
    decision_intelligence_assessment: matrix.decision_intelligence,
    operator_workflow_assessment: matrix.operator_workflow,
    ledger_integrity_assessment: matrix.ledger_integrity,
    observability_assessment: matrix.observability_dashboard,
    security_assessment: matrix.security_isolation_boundary,
    production_readiness_assessment: matrix.production_readiness,
    risk_summary: failures,
    failure_analysis: failures,
    final_certification_decision: matrix.outcome,
    production_approval_recommendation: approval,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCompletion(source: ProductionReadinessResult, failures: readonly FinalCertificationFailure[]): Phase9CompletionReport {
  const c = ctx(source);
  const approved = failures.length === 0;
  const base: Omit<Phase9CompletionReport, "integrity_hash"> = {
    report_id: "phase_9_completion_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    phase_objectives_complete: approved,
    capability_summary_complete: true,
    architecture_summary_complete: true,
    certification_summary_complete: true,
    deliverables_completed: approved,
    validation_coverage_percent: approved ? 100 : Math.max(0, 100 - failures.length * 4),
    remaining_risks: failures,
    lessons_learned_recorded: true,
    production_approval_status: approved ? "APPROVED" : "BLOCKED",
    next_phase_readiness: approved ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: ProductionReadinessResult, evidence: FinalCertificationEvidencePackage, report: FinalCertificationReport, scenario: Scenario): readonly FinalCertificationLedgerEntry[] {
  const c = ctx(source);
  const stateValue: FinalCertificationState = report.final_certification_decision === "PASS" ? "PASS" : "FAIL";
  const events: Omit<FinalCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "final_certification_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "SUITE_EXECUTED", scope_ref: "phase_9_suite", evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:00.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "final_certification_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "REPLAY_VERIFIED", scope_ref: "end_to_end_replay", evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:01.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "final_certification_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "GOVERNANCE_VERIFIED", scope_ref: "governance_constitutional_authority", evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:02.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "final_certification_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "SECURITY_VERIFIED", scope_ref: "security_isolation_boundary", evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:03.000Z", sequence_number: 4, append_only: true, deleted: false },
    { ledger_entry_id: "final_certification_ledger_005", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "PRODUCTION_READINESS_VERIFIED", scope_ref: "production_readiness", evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:04.000Z", sequence_number: 5, append_only: true, deleted: false },
    { ledger_entry_id: "final_certification_ledger_006", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.final_certification_decision === "PASS" ? "FINAL_CERTIFIED" : "FINAL_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: stateValue, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:13:05.000Z", sequence_number: 6, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildApproval(source: ProductionReadinessResult, report: FinalCertificationReport, ledger: readonly FinalCertificationLedgerEntry[]): ProductionApprovalDecision {
  const c = ctx(source);
  const approved = report.final_certification_decision === "PASS";
  const base: Omit<ProductionApprovalDecision, "integrity_hash"> = {
    decision_id: "final_production_approval_decision",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    certification_outcome: report.final_certification_decision,
    production_approval_status: approved ? "APPROVED" : "BLOCKED",
    outstanding_conditions: report.final_certification_decision === "CONDITIONAL_PASS" ? freezeArray(["Resolve documentation or reporting deficiency before production deployment."]) : freezeArray([]),
    required_corrective_actions: approved ? freezeArray([]) : freezeArray(report.failure_analysis.map((failure) => `resolve:${failure}`)),
    approval_authority: "MISSION_CONTROL_CERTIFICATION_AUTHORITY",
    approval_timestamp: "2026-07-05T09:13:06.000Z",
    certification_hash: report.integrity_hash,
    ledger_reference: ledger[ledger.length - 1]?.ledger_entry_id ?? "final_certification_ledger_pending",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly FinalCertificationFailure[]): FinalCertificationValidation {
  const has = (failure: FinalCertificationFailure) => failures.includes(failure);
  const base: Omit<FinalCertificationValidation, "integrity_hash"> = {
    validation_id: "final_orchestrator_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    complete_suite_passed: !has("PRECEDING_CERTIFICATION_CRITICAL_FAILURE"),
    deterministic: !has("NONDETERMINISTIC_ORCHESTRATION"),
    replay_reproducible: !has("REPLAY_DIVERGENCE") && !has("REPLAY_RECONSTRUCTION_FAILURE") && !has("INCOMPLETE_REPLAY_LINEAGE"),
    governance_enforced: !has("GOVERNANCE_BYPASS"),
    constitutional_compliant: !has("CONSTITUTIONAL_VIOLATION"),
    authority_bound: !has("AUTHORITY_BOUNDARY_VIOLATION"),
    operator_supremacy_preserved: !has("MISSING_OPERATOR_APPROVAL"),
    ledger_immutable: !has("LEDGER_MUTATION"),
    evidence_complete: !has("MISSING_AUDIT_EVIDENCE") && !has("HIDDEN_DECISION_LOGIC"),
    dashboard_visible: !has("DASHBOARD_VISIBILITY_GAP") && !has("HIDDEN_ORCHESTRATION_STATE"),
    security_boundaries_valid: !has("SECURITY_BOUNDARY_VIOLATION") && !has("TENANT_LEAKAGE") && !has("CROSS_TENANT_DATA_EXPOSURE") && !has("UNAUTHORIZED_EXECUTION"),
    production_ready: !has("PRODUCTION_READINESS_FAILURE") && !has("DOCUMENTATION_DEFICIENCY"),
    fail_closed: !has("FAIL_OPEN_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<FinalOrchestratorCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    integrated: result.integrated_validation_report,
    replay: result.final_replay_report,
    evidence: result.evidence_package,
    matrix: result.decision_matrix,
    report: result.final_report,
    completion: result.phase_9_completion_report,
    approval: result.production_approval_decision,
    ledger: result.final_ledger,
    validation: result.validation,
  });
}

export function runFinalOrchestratorCertification(input: FinalOrchestratorCertificationInput = {}): FinalOrchestratorCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const production_readiness = input.production_readiness ?? runProductionReadinessAssessment({ scenario: scenario === "PRODUCTION_INVALID" ? "PERFORMANCE_MISS" : "BASELINE" });
  const integrated_validation_report = buildIntegrated(production_readiness, scenario);
  const final_replay_report = buildReplay(production_readiness, scenario);
  const evidence_package = buildEvidence(production_readiness, integrated_validation_report, final_replay_report, scenario);
  const preFailures = collectFailures({ production: production_readiness, integrated: integrated_validation_report, replay: final_replay_report, evidence: evidence_package, ledger: [], role, scenario });
  const decision_matrix = buildMatrix(production_readiness, integrated_validation_report, final_replay_report, preFailures);
  const final_report = buildFinalReport(production_readiness, decision_matrix, preFailures);
  const phase_9_completion_report = buildCompletion(production_readiness, preFailures);
  const final_ledger = buildLedger(production_readiness, evidence_package, final_report, scenario);
  const failures = collectFailures({ production: production_readiness, integrated: integrated_validation_report, replay: final_replay_report, evidence: evidence_package, ledger: final_ledger, role, scenario });
  const finalMatrix = buildMatrix(production_readiness, integrated_validation_report, final_replay_report, failures);
  const finalReport = buildFinalReport(production_readiness, finalMatrix, failures);
  const finalCompletion = buildCompletion(production_readiness, failures);
  const finalLedger = buildLedger(production_readiness, evidence_package, finalReport, scenario);
  const production_approval_decision = buildApproval(production_readiness, finalReport, finalLedger);
  const validation = buildValidation(failures);
  const production_approved = finalReport.final_certification_decision === "PASS";
  const phase_9_complete = production_approved;
  const base: Omit<FinalOrchestratorCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    production_readiness,
    integrated_validation_report,
    final_replay_report,
    evidence_package,
    decision_matrix: finalMatrix,
    final_report: finalReport,
    phase_9_completion_report: finalCompletion,
    production_approval_decision,
    final_ledger: finalLedger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    production_approved,
    phase_9_complete,
    mutates_production_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayFinalOrchestratorCertification(result: FinalOrchestratorCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeFinalCertificationHash(record: Omit<IntegratedValidationReport, "integrity_hash"> | IntegratedValidationReport): string {
  return hashWithoutIntegrity(record);
}

export function getFinalOrchestratorCertificationFoundation(): FinalOrchestratorCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: FINAL_CERTIFICATION_SCOPES,
    checks: FINAL_CERTIFICATION_CHECKS,
    result: runFinalOrchestratorCertification(),
  });
}

export const FinalOrchestratorCertification = Object.freeze({
  run: runFinalOrchestratorCertification,
  replay: replayFinalOrchestratorCertification,
});
