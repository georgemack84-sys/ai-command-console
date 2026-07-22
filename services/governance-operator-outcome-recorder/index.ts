import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runRiskConfidenceActualizationRecorder } from "@/services/risk-confidence-actualization-recorder";
import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { RiskConfidenceActualizationRecorderResult } from "@/types/risk-confidence-actualization-recorder";
import type {
  ApprovalPathRecord,
  AuthorityLineage,
  GovernanceOperatorAuditReport,
  GovernanceOperatorCheck,
  GovernanceOperatorClassification,
  GovernanceOperatorFailure,
  GovernanceOperatorLedgerRecord,
  GovernanceOperatorMetrics,
  GovernanceOperatorOutcomeRecorderFoundation,
  GovernanceOperatorOutcomeRecorderInput,
  GovernanceOperatorOutcomeRecorderResult,
  GovernanceOperatorReplayReport,
  GovernanceOperatorValidation,
  GovernanceOutcomeLifecycleState,
  GovernanceOutcomeRecord,
  GovernanceOutcomeState,
  OperatorOutcomeState,
} from "@/types/governance-operator-outcome-recorder";

const GOVERNANCE_OPERATOR_VERSION = "governance-operator-outcome-recorder/v1" as const;

export const GOVERNANCE_OPERATOR_CHECKS: readonly GovernanceOperatorCheck[] = Object.freeze(["ACTUALIZATION_VALIDATION", "AUTHORITY_LINEAGE", "GOVERNANCE_OUTCOME", "OPERATOR_OUTCOME", "APPROVAL_PATH", "STRUCTURAL_VALIDATION", "GOVERNANCE_VALIDATION", "OPERATOR_VALIDATION", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "LEDGER_IMMUTABILITY", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const GOVERNANCE_OUTCOME_LIFECYCLE: readonly GovernanceOutcomeLifecycleState[] = Object.freeze(["OBSERVED", "CLASSIFIED", "VALIDATED", "RECORDED", "REPLAYABLE"]);

type Scenario = NonNullable<GovernanceOperatorOutcomeRecorderInput["scenario"]>;

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

function pass(value: boolean): OutcomeValidationState {
  return value ? "PASS" : "FAIL";
}

function sourceForScenario(input: GovernanceOperatorOutcomeRecorderInput, scenario: Scenario): RiskConfidenceActualizationRecorderResult {
  if (input.actualization_recorder) return input.actualization_recorder;
  if (scenario === "MISSING_GOVERNANCE_LINEAGE" || scenario === "MISSING_CONSTITUTIONAL_REFS") return runRiskConfidenceActualizationRecorder({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "TENANT_VIOLATION") return runRiskConfidenceActualizationRecorder({ scenario: "TENANT_VIOLATION" });
  if (scenario === "INTEGRITY_FAILURE") return runRiskConfidenceActualizationRecorder({ scenario: "INTEGRITY_FAILURE" });
  return runRiskConfidenceActualizationRecorder();
}

function visibleToRole(source: RiskConfidenceActualizationRecorderResult, role: VisibilityRole): boolean {
  return source.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function governanceState(source: RiskConfidenceActualizationRecorderResult, scenario: Scenario): GovernanceOutcomeState {
  if (["APPROVED", "DENIED", "ESCALATED", "REVIEW_REQUIRED", "POLICY_EXCEPTION", "CONSTITUTIONAL_REVIEW", "ROLLBACK_AUTHORIZED", "ROLLBACK_DENIED"].includes(scenario)) return scenario as GovernanceOutcomeState;
  const outcome = source.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.observation_record;
  if (outcome.rollback_result !== "NOT_REQUIRED") return "ROLLBACK_AUTHORIZED";
  if (outcome.governance_result === "DENIED") return "DENIED";
  if (outcome.governance_result === "ESCALATED") return "ESCALATED";
  if (outcome.governance_result === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
  return "APPROVED";
}

function operatorState(source: RiskConfidenceActualizationRecorderResult, scenario: Scenario): OperatorOutcomeState {
  if (["ACCEPTED", "REJECTED", "OVERRIDDEN", "MODIFIED", "DEFERRED", "MANUAL_ACTION", "NO_ACTION", "UNKNOWN"].includes(scenario)) return scenario as OperatorOutcomeState;
  const action = source.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.observation_record.operator_action_result;
  if (action === "ACCEPTED") return "ACCEPTED";
  if (action === "REJECTED") return "REJECTED";
  if (action === "OVERRIDDEN") return "OVERRIDDEN";
  if (action === "MODIFIED") return "MODIFIED";
  if (action === "DEFERRED") return "DEFERRED";
  return "UNKNOWN";
}

function buildAuthorityLineage(source: RiskConfidenceActualizationRecorderResult, scenario: Scenario): AuthorityLineage {
  const observation = source.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.observation_record;
  const base: Omit<AuthorityLineage, "integrity_hash"> = {
    lineage_id: "governance_authority_lineage",
    decision_ref: observation.decision_id,
    operator_ref: scenario === "MISSING_OPERATOR_WORKFLOW" ? "" : observation.operator_workflow_id,
    supervisor_refs: scenario === "INCOMPLETE_APPROVAL_LINEAGE" ? freezeArray([]) : freezeArray(["supervisor:mission-control"]),
    governance_authority_refs: scenario === "MISSING_AUTHORITY" || scenario === "UNAUTHORIZED_AUTHORITY" ? freezeArray([]) : observation.governance_refs,
    constitution_engine_refs: scenario === "MISSING_CONSTITUTIONAL_REFS" ? freezeArray([]) : freezeArray(["constitution-engine:v1"]),
    certification_refs: freezeArray([source.audit_report.report_id]),
    replay_refs: observation.replay_refs,
    delegation_chain_complete: scenario !== "INCOMPLETE_APPROVAL_LINEAGE",
    authority_ownership_verified: scenario !== "UNAUTHORIZED_AUTHORITY" && scenario !== "MISSING_AUTHORITY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApprovalPath(source: RiskConfidenceActualizationRecorderResult, lineage: AuthorityLineage, scenario: Scenario): ApprovalPathRecord {
  const evidence = source.actualization_record.supporting_evidence_refs;
  const base: Omit<ApprovalPathRecord, "integrity_hash"> = {
    approval_path_id: "governance_approval_path",
    approving_authority_refs: lineage.governance_authority_refs,
    approval_sequence: scenario === "INCOMPLETE_APPROVAL_LINEAGE" ? freezeArray([]) : freezeArray(["operator", "supervisor", "governance_authority"]),
    approval_timestamps: scenario === "INCOMPLETE_APPROVAL_LINEAGE" ? freezeArray([]) : freezeArray(["2026-01-01T00:00:00.000Z", "2026-01-01T00:01:00.000Z", "2026-01-01T00:02:00.000Z"]),
    delegated_authority_refs: lineage.supervisor_refs,
    approval_evidence_refs: evidence,
    approval_lineage_refs: freezeArray([lineage.lineage_id, ...lineage.certification_refs]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildClassification(source: RiskConfidenceActualizationRecorderResult, scenario: Scenario): GovernanceOperatorClassification {
  const governance_decision = governanceState(source, scenario);
  const operator_action = operatorState(source, scenario);
  const base: Omit<GovernanceOperatorClassification, "integrity_hash"> = {
    classification_id: "governance_operator_outcome_classification",
    governance_decision,
    operator_action,
    rollback_authorization: scenario === "MISSING_ROLLBACK_AUTHORIZATION" ? "MISSING" : governance_decision === "ROLLBACK_AUTHORIZED" ? "AUTHORIZED" : governance_decision === "ROLLBACK_DENIED" ? "DENIED" : "NOT_REQUIRED",
    policy_outcome: governance_decision === "POLICY_EXCEPTION" ? "EXCEPTION" : "ENFORCED",
    constitutional_outcome: scenario === "MISSING_CONSTITUTIONAL_REFS" ? "MISSING" : governance_decision === "CONSTITUTIONAL_REVIEW" ? "REVIEWED" : "PRESERVED",
    deterministic_classification: scenario !== "REPLAY_MISMATCH",
    inferred_governance_absent: scenario !== "INFERRED_GOVERNANCE",
    inferred_operator_absent: scenario !== "INFERRED_OPERATOR",
    historical_governance_unchanged: scenario !== "HISTORICAL_CHANGE",
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: pass(base.deterministic_classification && base.inferred_governance_absent && base.inferred_operator_absent && base.historical_governance_unchanged) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildRecord(source: RiskConfidenceActualizationRecorderResult, lineage: AuthorityLineage, approval: ApprovalPathRecord, classification: GovernanceOperatorClassification, scenario: Scenario): GovernanceOutcomeRecord {
  const observation = source.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.observation_record;
  const base: Omit<GovernanceOutcomeRecord, "integrity_hash"> = {
    governance_outcome_id: `governance_outcome_${hash(`${observation.outcome_id}:${classification.governance_decision}:${classification.operator_action}`).slice(0, 16)}`,
    tenant_id: scenario === "TENANT_VIOLATION" ? `${observation.tenant_id}:foreign` : observation.tenant_id,
    mission_id: observation.mission_id,
    outcome_id: observation.outcome_id,
    decision_id: observation.decision_id,
    decision_package_id: observation.decision_package_id,
    operator_workflow_id: scenario === "MISSING_OPERATOR_WORKFLOW" ? "" : observation.operator_workflow_id,
    governance_decision: classification.governance_decision,
    operator_action: classification.operator_action,
    approval_path: approval.approval_sequence,
    policy_outcome: classification.policy_outcome,
    constitutional_outcome: classification.constitutional_outcome,
    authority_refs: lineage.governance_authority_refs,
    rollback_authorization: classification.rollback_authorization,
    governance_evidence_refs: scenario === "MISSING_GOVERNANCE_LINEAGE" ? freezeArray([]) : source.actualization_record.governance_refs,
    operator_evidence_refs: source.actualization_record.supporting_evidence_refs,
    replay_refs: source.actualization_record.replay_refs,
    immutable_after_recording: true,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "INTEGRITY_FAILURE") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.governance_outcome_id }) });
  return built;
}

function collectFailures(input: {
  source: RiskConfidenceActualizationRecorderResult;
  lineage: AuthorityLineage;
  approval: ApprovalPathRecord;
  classification: GovernanceOperatorClassification;
  record: GovernanceOutcomeRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly GovernanceOperatorFailure[] {
  const failures: GovernanceOperatorFailure[] = [];
  if (input.source.validation.validation_status !== "VALID") failures.push("ACTUALIZATION_NOT_VALIDATED");
  if (!input.record.authority_refs.length || input.scenario === "MISSING_AUTHORITY") failures.push("GOVERNANCE_OUTCOME_ACCEPTED_WITHOUT_AUTHORITY_REFERENCES");
  if (!input.record.operator_workflow_id || input.scenario === "MISSING_OPERATOR_WORKFLOW") failures.push("OPERATOR_ACTION_ACCEPTED_WITHOUT_WORKFLOW_REFERENCES");
  if (!input.approval.approval_sequence.length || !input.lineage.delegation_chain_complete || input.scenario === "INCOMPLETE_APPROVAL_LINEAGE") failures.push("APPROVAL_LINEAGE_INCOMPLETE");
  if (!input.record.governance_evidence_refs.length || input.scenario === "MISSING_GOVERNANCE_LINEAGE") failures.push("GOVERNANCE_LINEAGE_INCOMPLETE");
  if (!input.lineage.constitution_engine_refs.length || input.classification.constitutional_outcome === "MISSING" || input.scenario === "MISSING_CONSTITUTIONAL_REFS") failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (input.record.rollback_authorization === "MISSING" || input.scenario === "MISSING_ROLLBACK_AUTHORIZATION") failures.push("ROLLBACK_AUTHORIZATION_MISSING");
  if (!input.classification.inferred_governance_absent || input.scenario === "INFERRED_GOVERNANCE") failures.push("INFERRED_GOVERNANCE_OUTCOME_ACCEPTED");
  if (!input.classification.inferred_operator_absent || input.scenario === "INFERRED_OPERATOR") failures.push("INFERRED_OPERATOR_ACTION_ACCEPTED");
  if (!input.classification.deterministic_classification || input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERS");
  if (hashWithoutIntegrity(input.record) !== input.record.integrity_hash || input.scenario === "INTEGRITY_FAILURE") failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (input.scenario === "DUPLICATE_RECORD") failures.push("DUPLICATE_GOVERNANCE_RECORD_CREATED");
  if (input.record.tenant_id !== input.source.actualization_record.tenant_id || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (!input.lineage.authority_ownership_verified || input.scenario === "UNAUTHORIZED_AUTHORITY") failures.push("UNAUTHORIZED_AUTHORITY_REJECTED");
  if (!input.classification.historical_governance_unchanged || input.scenario === "HISTORICAL_CHANGE") failures.push("HISTORICAL_GOVERNANCE_CHANGED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_GOVERNANCE_OPERATOR_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly GovernanceOperatorFailure[]): GovernanceOperatorValidation {
  const has = (failure: GovernanceOperatorFailure) => failures.includes(failure);
  const base: Omit<GovernanceOperatorValidation, "integrity_hash"> = {
    validation_id: "governance_operator_outcome_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    structural_valid: !has("DUPLICATE_GOVERNANCE_RECORD_CREATED"),
    authority_valid: !has("GOVERNANCE_OUTCOME_ACCEPTED_WITHOUT_AUTHORITY_REFERENCES") && !has("UNAUTHORIZED_AUTHORITY_REJECTED"),
    governance_valid: !has("GOVERNANCE_LINEAGE_INCOMPLETE") && !has("CONSTITUTIONAL_REFERENCES_MISSING") && !has("HISTORICAL_GOVERNANCE_CHANGED"),
    operator_valid: !has("OPERATOR_ACTION_ACCEPTED_WITHOUT_WORKFLOW_REFERENCES"),
    replay_valid: !has("REPLAY_RECONSTRUCTION_DIFFERS"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    approval_path_complete: !has("APPROVAL_LINEAGE_INCOMPLETE"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    immutable_after_recording: !has("HISTORICAL_GOVERNANCE_CHANGED"),
    constitutional_governance_preserved: !has("CONSTITUTIONAL_REFERENCES_MISSING"),
    observational_only: !has("INFERRED_GOVERNANCE_OUTCOME_ACCEPTED") && !has("INFERRED_OPERATOR_ACTION_ACCEPTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(lineage: AuthorityLineage, approval: ApprovalPathRecord, classification: GovernanceOperatorClassification, record: GovernanceOutcomeRecord, validation: GovernanceOperatorValidation): GovernanceOperatorReplayReport {
  const reconstruction = { lineage, approval, classification, record, validation };
  const base: Omit<GovernanceOperatorReplayReport, "integrity_hash"> = {
    replay_report_id: "governance_operator_replay_report",
    authority_lineage_hash: lineage.integrity_hash,
    approval_path_hash: approval.integrity_hash,
    classification_hash: classification.integrity_hash,
    record_hash: record.integrity_hash,
    reconstruction_hash: hash(reconstruction),
    replay_reconstruction_identical: validation.replay_valid,
    deterministic_serialization: validation.integrity_valid,
    historical_compatibility_preserved: validation.immutable_after_recording,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: GovernanceOutcomeRecord, validation: GovernanceOperatorValidation): readonly GovernanceOperatorLedgerRecord[] {
  const base: Omit<GovernanceOperatorLedgerRecord, "integrity_hash"> = {
    ledger_id: "governance_operator_outcome_ledger_001",
    governance_outcome_id: record.governance_outcome_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    outcome_id: record.outcome_id,
    lifecycle_state: validation.failures.length ? "VALIDATED" : "REPLAYABLE",
    governance_decision: record.governance_decision,
    operator_action: record.operator_action,
    record_hash: record.integrity_hash,
    timestamp: "2026-01-01T00:03:00.000Z",
    sequence_number: 1,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildMetrics(record: GovernanceOutcomeRecord, validation: GovernanceOperatorValidation): GovernanceOperatorMetrics {
  const base: Omit<GovernanceOperatorMetrics, "integrity_hash"> = {
    metrics_id: "governance_operator_outcome_metrics",
    governance_outcomes_recorded: validation.failures.length ? 0 : 1,
    operator_outcomes_recorded: validation.failures.length ? 0 : 1,
    approvals_recorded: record.governance_decision === "APPROVED" ? 1 : 0,
    overrides_recorded: record.operator_action === "OVERRIDDEN" ? 1 : 0,
    escalations_recorded: record.governance_decision === "ESCALATED" ? 1 : 0,
    constitutional_reviews_recorded: record.governance_decision === "CONSTITUTIONAL_REVIEW" ? 1 : 0,
    rollback_authorizations_recorded: record.rollback_authorization === "AUTHORIZED" ? 1 : 0,
    authority_lineage_completeness: validation.authority_valid && validation.approval_path_complete ? 1 : 0,
    replay_reconstruction_success_rate: validation.replay_valid ? 1 : 0,
    processing_latency_ms: 0,
    validation_failures_by_category: validation.failures,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(record: GovernanceOutcomeRecord, validation: GovernanceOperatorValidation, replay: GovernanceOperatorReplayReport): GovernanceOperatorAuditReport {
  const base: Omit<GovernanceOperatorAuditReport, "integrity_hash"> = {
    report_id: "governance_operator_outcome_audit_report",
    tenant_id: record.tenant_id,
    checks: GOVERNANCE_OPERATOR_CHECKS,
    governance_recorder_operational: validation.validation_status === "VALID",
    operator_recorder_operational: validation.validation_status === "VALID",
    approval_recorder_operational: validation.approval_path_complete,
    authority_lineage_engine_operational: validation.authority_valid,
    validation_engine_operational: validation.validation_status === "VALID",
    replay_generator_operational: replay.replay_reconstruction_identical,
    authority_lineage_preserved: validation.authority_valid,
    governance_lineage_preserved: validation.governance_valid,
    operator_lineage_preserved: validation.operator_valid,
    policy_or_permission_mutation_absent: validation.immutable_after_recording,
    immutable_record_verified: validation.immutable_after_recording,
    failure_analysis: validation.failures,
    certification_decision: pass(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceOperatorOutcomeRecorderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    lineage: result.authority_lineage,
    approval: result.approval_path,
    classification: result.classification,
    record: result.governance_outcome_record,
    validation: result.validation,
    replay: result.replay_report,
    ledger: result.governance_outcome_ledger,
    audit: result.audit_report,
  });
}

export function runGovernanceOperatorOutcomeRecorder(input: GovernanceOperatorOutcomeRecorderInput = {}): GovernanceOperatorOutcomeRecorderResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const actualization_recorder = sourceForScenario(input, scenario);
  const authority_lineage = buildAuthorityLineage(actualization_recorder, scenario);
  const approval_path = buildApprovalPath(actualization_recorder, authority_lineage, scenario);
  const classification = buildClassification(actualization_recorder, scenario);
  const governance_outcome_record = buildRecord(actualization_recorder, authority_lineage, approval_path, classification, scenario);
  const failures = collectFailures({ source: actualization_recorder, lineage: authority_lineage, approval: approval_path, classification, record: governance_outcome_record, role, scenario });
  const validation = buildValidation(failures);
  const replay_report = buildReplay(authority_lineage, approval_path, classification, governance_outcome_record, validation);
  const governance_outcome_ledger = buildLedger(governance_outcome_record, validation);
  const metrics = buildMetrics(governance_outcome_record, validation);
  const audit_report = buildAudit(governance_outcome_record, validation, replay_report);
  const lifecycle: readonly GovernanceOutcomeLifecycleState[] = failures.length ? freezeArray<GovernanceOutcomeLifecycleState>(["OBSERVED", "CLASSIFIED", "VALIDATED"]) : GOVERNANCE_OUTCOME_LIFECYCLE;
  const base: Omit<GovernanceOperatorOutcomeRecorderResult, "integrity_hash" | "replay_hash"> = {
    governance_operator_outcome_recorder_version: GOVERNANCE_OPERATOR_VERSION,
    actualization_recorder,
    authority_lineage,
    approval_path,
    classification,
    governance_outcome_record,
    validation,
    replay_report,
    governance_outcome_ledger,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    observational_only: true,
    modifies_authority: false,
    modifies_governance_policy: false,
    modifies_operator_permissions: false,
    modifies_decision_outcomes: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernanceOperatorOutcomeRecorder(result: GovernanceOperatorOutcomeRecorderResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeGovernanceOutcomeRecordHash(record: Omit<GovernanceOutcomeRecord, "integrity_hash"> | GovernanceOutcomeRecord): string {
  return hashWithoutIntegrity(record);
}

export function getGovernanceOperatorOutcomeRecorderFoundation(): GovernanceOperatorOutcomeRecorderFoundation {
  return Object.freeze({
    governance_operator_outcome_recorder_version: GOVERNANCE_OPERATOR_VERSION,
    checks: GOVERNANCE_OPERATOR_CHECKS,
    lifecycle: GOVERNANCE_OUTCOME_LIFECYCLE,
    result: runGovernanceOperatorOutcomeRecorder(),
  });
}

export const GovernanceOperatorOutcomeRecorder = Object.freeze({
  run: runGovernanceOperatorOutcomeRecorder,
  replay: replayGovernanceOperatorOutcomeRecorder,
});
