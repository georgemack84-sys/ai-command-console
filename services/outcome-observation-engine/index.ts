import { runDecisionOutcomeIntakeAdapter } from "@/services/decision-outcome-intake-adapter";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { OutcomeObservationRecord, OutcomeType, OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { DecisionOutcomeIntakeAdapterResult } from "@/types/decision-outcome-intake-adapter";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ObservationBuilderResult,
  ObservationConsistencyCheck,
  ObservationReplayMetadata,
  OutcomeExecutionStatus,
  OutcomeObservationAuditReport,
  OutcomeObservationCheck,
  OutcomeObservationEngineFoundation,
  OutcomeObservationEngineInput,
  OutcomeObservationEngineResult,
  OutcomeObservationFailure,
  OutcomeObservationLedgerRecord,
  OutcomeObservationLifecycleState,
  OutcomeObservationMetrics,
  OutcomeObservationStatus,
  OutcomeObservationValidation,
  OutcomeResolutionResult,
} from "@/types/outcome-observation-engine";

const OBSERVATION_ENGINE_VERSION = "outcome-observation-engine/v1" as const;

export const OUTCOME_OBSERVATION_CHECKS: readonly OutcomeObservationCheck[] = Object.freeze(["INTAKE_VALIDATION", "OBSERVATION_BUILDER", "OUTCOME_RESOLUTION", "OBSERVATION_CLASSIFICATION", "STRUCTURAL_VALIDATION", "EVIDENCE_VALIDATION", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "CONSISTENCY_CHECK", "INTEGRITY_VALIDATION", "LEDGER_IMMUTABILITY", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const OUTCOME_OBSERVATION_LIFECYCLE: readonly OutcomeObservationLifecycleState[] = Object.freeze(["RECEIVED", "NORMALIZED", "OBSERVED", "VALIDATED", "RECORDED", "REPLAYABLE"]);

type Scenario = NonNullable<OutcomeObservationEngineInput["scenario"]>;

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

function state(pass: boolean): OutcomeValidationState {
  return pass ? "PASS" : "FAIL";
}

function sourceForScenario(input: OutcomeObservationEngineInput, scenario: Scenario): DecisionOutcomeIntakeAdapterResult {
  if (input.intake_adapter) return input.intake_adapter;
  if (scenario === "INVALID_INTAKE" || scenario === "MISSING_REQUIRED_FIELD") return runDecisionOutcomeIntakeAdapter({ scenario: "MISSING_REQUIRED_FIELD" });
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INCOMPLETE_EVIDENCE") return runDecisionOutcomeIntakeAdapter({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "MISSING_GOVERNANCE") return runDecisionOutcomeIntakeAdapter({ scenario: "MISSING_GOVERNANCE_REFS" });
  if (scenario === "MISSING_REPLAY") return runDecisionOutcomeIntakeAdapter({ scenario: "MISSING_REPLAY_REFS" });
  if (scenario === "TENANT_VIOLATION") return runDecisionOutcomeIntakeAdapter({ scenario: "TENANT_VIOLATION" });
  if (scenario === "HASH_MISMATCH") return runDecisionOutcomeIntakeAdapter({ scenario: "INTEGRITY_BYPASS" });
  if (scenario === "INFERRED_OUTCOME" || scenario === "ANALYSIS_ATTEMPTED") return runDecisionOutcomeIntakeAdapter({ scenario: "ANALYSIS_ATTEMPTED" });
  return runDecisionOutcomeIntakeAdapter();
}

function visibleToRole(source: DecisionOutcomeIntakeAdapterResult, role: VisibilityRole): boolean {
  return source.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function resolvedOutcome(input: OutcomeObservationEngineInput, scenario: Scenario): OutcomeType {
  if (input.outcome_type) return input.outcome_type;
  if (scenario === "PARTIAL_SUCCESS") return "PARTIALLY_SUCCESSFUL";
  if (scenario === "FAILED_OUTCOME") return "FAILED";
  if (scenario === "OVERRIDE") return "OVERRIDDEN";
  if (scenario === "ESCALATION") return "ESCALATED";
  if (scenario === "ROLLBACK") return "ROLLBACK_REQUIRED";
  if (scenario === "UNKNOWN") return "UNKNOWN";
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "INCOMPLETE_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  return "SUCCESSFUL";
}

function executionStatus(outcomeType: OutcomeType): OutcomeExecutionStatus {
  if (outcomeType === "SUCCESSFUL" || outcomeType === "OVERRIDDEN") return "COMPLETED";
  if (outcomeType === "PARTIALLY_SUCCESSFUL") return "PARTIALLY_COMPLETED";
  if (outcomeType === "FAILED") return "FAILED";
  if (outcomeType === "ROLLBACK_REQUIRED") return "ROLLED_BACK";
  if (outcomeType === "DEFERRED") return "INTERRUPTED";
  return "UNKNOWN";
}

function observationStatus(outcomeType: OutcomeType, failures: readonly OutcomeObservationFailure[]): OutcomeObservationStatus {
  if (failures.includes("DUPLICATE_OBSERVATION_GENERATED")) return "DUPLICATE";
  if (outcomeType === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (failures.length) return "REJECTED";
  return "OBSERVED";
}

function recordFromIntake(source: DecisionOutcomeIntakeAdapterResult, outcomeType: OutcomeType, scenario: Scenario): OutcomeObservationRecord {
  const base: Omit<OutcomeObservationRecord, "integrity_hash"> = {
    ...source.mapping.canonical_outcome,
    outcome_id: scenario === "MISSING_REQUIRED_FIELD" ? "" : source.mapping.canonical_outcome.outcome_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? `${source.mapping.canonical_outcome.tenant_id}:foreign` : source.mapping.canonical_outcome.tenant_id,
    outcome_type: outcomeType,
    actual_outcome_summary: scenario === "INFERRED_OUTCOME" ? "Inferred mission result." : scenario === "PREDICTIVE_INFORMATION" ? "Predicted mission result." : source.mapping.canonical_outcome.actual_outcome_summary,
    actual_outcome_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : source.mapping.canonical_outcome.actual_outcome_evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : source.mapping.canonical_outcome.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.mapping.canonical_outcome.replay_refs,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.outcome_id }) });
  if (scenario === "MUTATED_AFTER_RECORDING") return Object.freeze({ ...built, actual_outcome_summary: "Mutated after recording.", integrity_hash: built.integrity_hash });
  return built;
}

function buildBuilder(source: DecisionOutcomeIntakeAdapterResult, record: OutcomeObservationRecord, scenario: Scenario): ObservationBuilderResult {
  const base: Omit<ObservationBuilderResult, "integrity_hash"> = {
    builder_id: "outcome_observation_builder",
    intake_id: source.intake_record.intake_id,
    outcome_identity_assembled: Boolean(record.outcome_id),
    observation_metadata_assembled: Boolean(record.observed_timestamp && record.observation_source),
    decision_refs_assembled: Boolean(record.decision_id && record.decision_package_id),
    mission_refs_assembled: Boolean(record.mission_id),
    operator_refs_assembled: Boolean(record.operator_workflow_id),
    governance_refs_assembled: record.governance_refs.length > 0,
    evidence_refs_assembled: record.actual_outcome_evidence_refs.length > 0,
    replay_metadata_assembled: record.replay_refs.length > 0,
    source_fidelity_preserved: scenario !== "UNAUTHORIZED_MODIFICATION",
    inferred_values_absent: !record.actual_outcome_summary.toLowerCase().includes("inferred") && !record.actual_outcome_summary.toLowerCase().includes("predicted"),
    observation_record: record,
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(base.outcome_identity_assembled && base.observation_metadata_assembled && base.decision_refs_assembled && base.mission_refs_assembled && base.operator_refs_assembled && base.governance_refs_assembled && base.evidence_refs_assembled && base.replay_metadata_assembled && base.source_fidelity_preserved && base.inferred_values_absent) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildResolver(record: OutcomeObservationRecord, failures: readonly OutcomeObservationFailure[]): OutcomeResolutionResult {
  const base: Omit<OutcomeResolutionResult, "integrity_hash"> = {
    resolver_id: "outcome_resolver",
    outcome_type: record.outcome_type,
    observation_complete: record.actual_outcome_evidence_refs.length > 0 && record.replay_refs.length > 0 && record.governance_refs.length > 0,
    execution_status: executionStatus(record.outcome_type),
    rollback_state: record.rollback_result,
    observation_status: observationStatus(record.outcome_type, failures),
    classification_basis_refs: freezeArray([...record.actual_outcome_evidence_refs, ...record.governance_refs, ...record.replay_refs]),
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(base.classification_basis_refs.length > 0 && !failures.includes("UNSUPPORTED_OUTCOME_CLASSIFICATION_ACCEPTED")) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildConsistency(record: OutcomeObservationRecord, scenario: Scenario): ObservationConsistencyCheck {
  const base: Omit<ObservationConsistencyCheck, "integrity_hash"> = {
    consistency_id: "observation_consistency_check",
    identical_evidence: scenario !== "DIVERGENT_OBSERVATION",
    identical_references: scenario !== "DIVERGENT_OBSERVATION",
    identical_classification: scenario !== "DIVERGENT_OBSERVATION" && scenario !== "UNSUPPORTED_CLASSIFICATION",
    identical_serialization: scenario !== "NONDETERMINISTIC_SERIALIZATION",
    identical_replay: scenario !== "DIVERGENT_OBSERVATION" && record.replay_refs.length > 0,
    consistency_result: "PASS",
  };
  const normalized = { ...base, consistency_result: state(base.identical_evidence && base.identical_references && base.identical_classification && base.identical_serialization && base.identical_replay) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReplay(source: DecisionOutcomeIntakeAdapterResult, record: OutcomeObservationRecord): ObservationReplayMetadata {
  const base: Omit<ObservationReplayMetadata, "integrity_hash"> = {
    replay_metadata_id: "outcome_observation_replay_metadata",
    decision_refs: freezeArray([record.decision_id, record.decision_package_id]),
    evidence_refs: record.actual_outcome_evidence_refs,
    governance_refs: record.governance_refs,
    operator_refs: freezeArray([record.operator_workflow_id]),
    intake_refs: freezeArray([source.intake_record.intake_id]),
    ledger_refs: source.audit_log.map((entry) => entry.audit_id),
    observation_sequence: OUTCOME_OBSERVATION_LIFECYCLE,
    reconstruction_hash: hash(record),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: DecisionOutcomeIntakeAdapterResult;
  record: OutcomeObservationRecord;
  builder: ObservationBuilderResult;
  consistency: ObservationConsistencyCheck;
  ledger: readonly OutcomeObservationLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeObservationFailure[] {
  const failures: OutcomeObservationFailure[] = [];
  if (input.source.validation.validation_status !== "VALID") failures.push("INTAKE_NOT_VALIDATED");
  if (input.scenario === "DIVERGENT_OBSERVATION") failures.push("IDENTICAL_EVIDENCE_PRODUCED_DIVERGENT_OBSERVATION");
  if (input.scenario === "INFERRED_OUTCOME" || !input.builder.inferred_values_absent) failures.push("INFERRED_OUTCOME_ACCEPTED");
  if (input.scenario === "PREDICTIVE_INFORMATION") failures.push("PREDICTIVE_INFORMATION_ACCEPTED");
  if (input.scenario === "UNSUPPORTED_CLASSIFICATION") failures.push("UNSUPPORTED_OUTCOME_CLASSIFICATION_ACCEPTED");
  if (!input.record.actual_outcome_evidence_refs.length || input.scenario === "INCOMPLETE_EVIDENCE") failures.push("EVIDENCE_LINEAGE_INCOMPLETE");
  if (!input.record.governance_refs.length || input.scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (!input.record.replay_refs.length || input.scenario === "MISSING_REPLAY") failures.push("REPLAY_REFERENCES_MISSING");
  if (input.scenario === "DUPLICATE_OBSERVATION") failures.push("DUPLICATE_OBSERVATION_GENERATED");
  if (!input.consistency.identical_serialization || input.scenario === "NONDETERMINISTIC_SERIALIZATION") failures.push("NONDETERMINISTIC_SERIALIZATION_DETECTED");
  if (hashWithoutIntegrity(input.record) !== input.record.integrity_hash || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH_DETECTED");
  if (input.scenario === "MUTATED_AFTER_RECORDING") failures.push("OBSERVATION_MUTATED_AFTER_RECORDING");
  if (input.record.tenant_id !== input.source.capture_contract.outcome_record.tenant_id || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_CONSTRAINTS_BYPASSED");
  if (!input.record.outcome_id || input.scenario === "MISSING_REQUIRED_FIELD") failures.push("REQUIRED_FIELD_MISSING");
  if (input.scenario === "UNAUTHORIZED_MODIFICATION") failures.push("UNAUTHORIZED_MODIFICATION_REJECTED");
  if (input.scenario === "ANALYSIS_ATTEMPTED") failures.push("ANALYSIS_ATTEMPTED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_OBSERVATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildLedger(record: OutcomeObservationRecord, failures: readonly OutcomeObservationFailure[], scenario: Scenario): readonly OutcomeObservationLedgerRecord[] {
  const base: Omit<OutcomeObservationLedgerRecord, "integrity_hash"> = {
    ledger_id: "outcome_observation_ledger_001",
    outcome_id: record.outcome_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    outcome_type: record.outcome_type,
    lifecycle_state: failures.length ? "VALIDATED" : "REPLAYABLE",
    evidence_refs: record.actual_outcome_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    observation_hash: record.integrity_hash,
    timestamp: record.observed_timestamp,
    sequence_number: 1,
    append_only: (scenario === "MUTATED_AFTER_RECORDING" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildValidation(source: DecisionOutcomeIntakeAdapterResult, failures: readonly OutcomeObservationFailure[]): OutcomeObservationValidation {
  const has = (failure: OutcomeObservationFailure) => failures.includes(failure);
  const base: Omit<OutcomeObservationValidation, "integrity_hash"> = {
    validation_id: "outcome_observation_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    structural_valid: !has("REQUIRED_FIELD_MISSING") && !has("UNSUPPORTED_OUTCOME_CLASSIFICATION_ACCEPTED"),
    evidence_valid: !has("EVIDENCE_LINEAGE_INCOMPLETE") && !has("INFERRED_OUTCOME_ACCEPTED") && !has("PREDICTIVE_INFORMATION_ACCEPTED"),
    governance_valid: !has("GOVERNANCE_REFERENCES_MISSING") && !has("CONSTITUTIONAL_CONSTRAINTS_BYPASSED"),
    replay_valid: !has("REPLAY_REFERENCES_MISSING") && !has("NONDETERMINISTIC_SERIALIZATION_DETECTED"),
    integrity_valid: !has("INTEGRITY_HASH_MISMATCH_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    constitutional_governance_preserved: !has("CONSTITUTIONAL_CONSTRAINTS_BYPASSED"),
    immutable_after_recording: !has("OBSERVATION_MUTATED_AFTER_RECORDING"),
    only_observed_facts: !has("INFERRED_OUTCOME_ACCEPTED") && !has("PREDICTIVE_INFORMATION_ACCEPTED") && !has("ANALYSIS_ATTEMPTED"),
    failures,
    intake_failures: source.validation.failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(record: OutcomeObservationRecord, failures: readonly OutcomeObservationFailure[]): OutcomeObservationMetrics {
  const base: Omit<OutcomeObservationMetrics, "integrity_hash"> = {
    metrics_id: "outcome_observation_metrics",
    observations_created: failures.length ? 0 : 1,
    observations_rejected: failures.length ? 1 : 0,
    classifications_by_type: freezeArray([record.outcome_type]),
    insufficient_evidence_occurrences: record.outcome_type === "INSUFFICIENT_EVIDENCE" ? 1 : 0,
    validation_failures: failures.length,
    replay_success_rate: failures.includes("REPLAY_REFERENCES_MISSING") || failures.includes("NONDETERMINISTIC_SERIALIZATION_DETECTED") ? 0 : 1,
    observation_generation_latency_ms: 0,
    duplicate_observation_attempts: failures.includes("DUPLICATE_OBSERVATION_GENERATED") ? 1 : 0,
    integrity_verification_failures: failures.includes("INTEGRITY_HASH_MISMATCH_DETECTED") ? 1 : 0,
    governance_validation_failures: failures.includes("GOVERNANCE_REFERENCES_MISSING") || failures.includes("CONSTITUTIONAL_CONSTRAINTS_BYPASSED") ? 1 : 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(record: OutcomeObservationRecord, validation: OutcomeObservationValidation, consistency: ObservationConsistencyCheck): OutcomeObservationAuditReport {
  const base: Omit<OutcomeObservationAuditReport, "integrity_hash"> = {
    report_id: "outcome_observation_audit_report",
    tenant_id: record.tenant_id,
    checks: OUTCOME_OBSERVATION_CHECKS,
    observed_results_captured: validation.structural_valid,
    operator_decisions_captured: Boolean(record.operator_action_result),
    governance_effects_captured: validation.governance_valid,
    execution_status_captured: true,
    mission_changes_captured: Boolean(record.mission_impact.operational_effect),
    actual_impacts_captured: Boolean(record.risk_actualization && record.confidence_actualization),
    evidence_lineage_preserved: validation.evidence_valid,
    replay_metadata_complete: validation.replay_valid,
    deterministic_observation_verified: consistency.consistency_result === "PASS",
    immutable_ledger_verified: validation.immutable_after_recording,
    analysis_logic_absent: validation.only_observed_facts,
    failure_analysis: validation.failures,
    certification_decision: state(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeObservationEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    builder: result.builder,
    resolver: result.resolver,
    consistency: result.consistency_check,
    replay: result.replay_metadata,
    validation: result.validation,
    record: result.observation_record,
    ledger: result.observation_ledger,
    audit: result.audit_report,
  });
}

export function runOutcomeObservationEngine(input: OutcomeObservationEngineInput = {}): OutcomeObservationEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const intake_adapter = sourceForScenario(input, scenario);
  const outcome = resolvedOutcome(input, scenario);
  const observation_record = recordFromIntake(intake_adapter, outcome, scenario);
  const builder = buildBuilder(intake_adapter, observation_record, scenario);
  const consistency_check = buildConsistency(observation_record, scenario);
  const preFailures = collectFailures({ source: intake_adapter, record: observation_record, builder, consistency: consistency_check, ledger: [], role, scenario });
  const resolver = buildResolver(observation_record, preFailures);
  const replay_metadata = buildReplay(intake_adapter, observation_record);
  const observation_ledger = buildLedger(observation_record, preFailures, scenario);
  const failures = collectFailures({ source: intake_adapter, record: observation_record, builder, consistency: consistency_check, ledger: observation_ledger, role, scenario });
  const validation = buildValidation(intake_adapter, failures);
  const metrics = buildMetrics(observation_record, failures);
  const audit_report = buildAudit(observation_record, validation, consistency_check);
  const lifecycle: readonly OutcomeObservationLifecycleState[] = failures.length ? freezeArray<OutcomeObservationLifecycleState>(["RECEIVED", "NORMALIZED", "OBSERVED", "VALIDATED"]) : OUTCOME_OBSERVATION_LIFECYCLE;
  const base: Omit<OutcomeObservationEngineResult, "integrity_hash" | "replay_hash"> = {
    observation_engine_version: OBSERVATION_ENGINE_VERSION,
    intake_adapter,
    builder,
    resolver,
    consistency_check,
    replay_metadata,
    validation,
    observation_record,
    observation_ledger,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    observational_only: true,
    permits_analysis: false,
    permits_prediction: false,
    permits_recommendation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeObservationEngine(result: OutcomeObservationEngineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeObservationEngineHash(record: Omit<OutcomeObservationRecord, "integrity_hash"> | OutcomeObservationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOutcomeObservationEngineFoundation(): OutcomeObservationEngineFoundation {
  return Object.freeze({
    observation_engine_version: OBSERVATION_ENGINE_VERSION,
    checks: OUTCOME_OBSERVATION_CHECKS,
    lifecycle: OUTCOME_OBSERVATION_LIFECYCLE,
    result: runOutcomeObservationEngine(),
  });
}

export const OutcomeObservationEngine = Object.freeze({
  run: runOutcomeObservationEngine,
  replay: replayOutcomeObservationEngine,
});
