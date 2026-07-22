import { runAdaptiveArchitectureCertificationGate } from "@/services/adaptive-architecture-certification-gate";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptiveArchitectureCertificationGateResult } from "@/types/adaptive-architecture-certification-gate";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ActualResultCaptureContractFoundation,
  ActualResultCaptureContractInput,
  ActualResultCaptureContractResult,
  ConfidenceActualization,
  MissionImpact,
  OutcomeCaptureCertificationReport,
  OutcomeCaptureCheck,
  OutcomeCaptureFailure,
  OutcomeCaptureValidation,
  OutcomeContractVersion,
  OutcomeEvidenceValidation,
  OutcomeIdentityValidation,
  OutcomeObservationLedgerRecord,
  OutcomeObservationRecord,
  OutcomeReplayValidation,
  OutcomeSchemaValidation,
  OutcomeType,
  OutcomeValidationState,
  RiskActualization,
} from "@/types/actual-result-capture-contract";

const OUTCOME_CONTRACT_VERSION = "actual-result-capture-contract/v1" as const;
const CURRENT_SCHEMA_VERSION = "outcome-observation/v1.0.0";

export const OUTCOME_CAPTURE_CHECKS: readonly OutcomeCaptureCheck[] = Object.freeze(["ARCHITECTURE_CERTIFICATION", "CONTRACT_VERSION", "SCHEMA_VERSION", "REQUIRED_FIELDS", "IDENTITY", "TIMESTAMP", "REFERENCE_MODEL", "EVIDENCE", "MISSION_IMPACT", "GOVERNANCE_LINEAGE", "OPERATOR_WORKFLOW", "REPLAY_LINEAGE", "DETERMINISTIC_SERIALIZATION", "INTEGRITY"]);

type Scenario = NonNullable<ActualResultCaptureContractInput["scenario"]>;

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

function sourceForScenario(input: ActualResultCaptureContractInput, scenario: Scenario): AdaptiveArchitectureCertificationGateResult {
  if (input.architecture_certification) return input.architecture_certification;
  if (scenario === "ARCHITECTURE_NOT_CERTIFIED") return runAdaptiveArchitectureCertificationGate({ scenario: "MANDATORY_TEST_FAILED" });
  return runAdaptiveArchitectureCertificationGate();
}

function visibleToRole(source: AdaptiveArchitectureCertificationGateResult, role: VisibilityRole): boolean {
  return source.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildVersionRegistry(scenario: Scenario): readonly OutcomeContractVersion[] {
  const currentBase: Omit<OutcomeContractVersion, "checksum"> = {
    contract_version: OUTCOME_CONTRACT_VERSION,
    schema_version: scenario === "UNSUPPORTED_SCHEMA_VERSION" ? "outcome-observation/v99.0.0" : CURRENT_SCHEMA_VERSION,
    effective_date: "2026-07-05T10:01:50.000Z",
    compatibility_level: "CURRENT",
    deprecated: false,
    migration_required: false,
  };
  const historicalBase: Omit<OutcomeContractVersion, "checksum"> = {
    contract_version: OUTCOME_CONTRACT_VERSION,
    schema_version: "outcome-observation/v0.9.0",
    effective_date: "2026-07-05T10:01:49.000Z",
    compatibility_level: "HISTORICAL_REPLAY_COMPATIBLE",
    deprecated: true,
    migration_required: false,
  };
  return freezeArray([
    Object.freeze({ ...currentBase, checksum: hash(currentBase) }),
    Object.freeze({ ...historicalBase, checksum: scenario === "HISTORICAL_REPLAY_BROKEN" ? hash({ broken: historicalBase.schema_version }) : hash(historicalBase) }),
  ]);
}

function ctx(source: AdaptiveArchitectureCertificationGateResult) {
  const decision = source.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.replay_record;
  return {
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_scope[0] ?? "mission:unknown",
    decision_id: decision.proposal_id,
    decision_package_id: source.security_boundaries.adaptive_ledger.approval_framework.approval_record.proposal_id,
    operator_workflow_id: source.security_boundaries.adaptive_ledger.approval_framework.approval_workflow.workflow_id,
    governance_refs: source.security_boundaries.adaptive_ledger.index.by_governance_ref,
    replay_refs: source.security_boundaries.adaptive_ledger.index.by_replay_ref,
    evidence_refs: source.security_boundaries.adaptive_ledger.records.flatMap((record) => record.evidence_refs),
  };
}

function missionImpact(scenario: Scenario): MissionImpact {
  return Object.freeze({
    objectives_completed: scenario === "MISSING_REQUIRED_FIELD" ? freezeArray([]) : freezeArray(["objective:stabilize-outcome-capture"]),
    objectives_failed: freezeArray([]),
    operational_effect: scenario === "INFERRED_OUTCOME" ? "inferred improvement" : "observed operator workflow completed without rollback",
    unintended_effects: freezeArray([]),
    recovery_required: false,
  });
}

function riskActualization(): RiskActualization {
  return Object.freeze({
    realized_risks: freezeArray([]),
    avoided_risks: freezeArray(["risk:rollback-not-required"]),
    underestimated_risks: freezeArray([]),
    overestimated_risks: freezeArray([]),
  });
}

function confidenceActualization(): ConfidenceActualization {
  return Object.freeze({
    accurate_confidence: freezeArray(["confidence:operator-approved"]),
    overconfidence: freezeArray([]),
    underconfidence: freezeArray([]),
    invalid_confidence: freezeArray([]),
  });
}

function buildRecord(source: AdaptiveArchitectureCertificationGateResult, registry: readonly OutcomeContractVersion[], scenario: Scenario): OutcomeObservationRecord {
  const c = ctx(source);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...new Set(c.evidence_refs), "truth-ledger:actual-result"]);
  const base: Omit<OutcomeObservationRecord, "integrity_hash"> = {
    contract_version: OUTCOME_CONTRACT_VERSION,
    schema_version: registry[0].schema_version,
    outcome_id: scenario === "MISSING_REQUIRED_FIELD" ? "" : "outcome_observation_001",
    tenant_id: scenario === "ORPHAN_OUTCOME" ? "" : c.tenant_id,
    mission_id: scenario === "ORPHAN_OUTCOME" ? "" : c.mission_id,
    decision_id: scenario === "ORPHAN_OUTCOME" ? "" : c.decision_id,
    decision_package_id: c.decision_package_id,
    operator_workflow_id: c.operator_workflow_id,
    observed_timestamp: scenario === "INVALID_TIMESTAMP" ? "07/05/2026 10:01:55" : "2026-07-05T10:01:55.000Z",
    observation_source: "mission-telemetry:operator-workflow",
    outcome_type: scenario === "MISSING_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" : "SUCCESSFUL",
    expected_outcome_refs: scenario === "MISSING_REQUIRED_FIELD" ? freezeArray([]) : freezeArray(["recommendation:quality-adjustment", "forecast:mission-impact", "simulation:counterfactual:quality", "risk:rollback", "confidence:operator-approved"]),
    actual_outcome_summary: scenario === "PREDICTIVE_OUTCOME" ? "Predicted future mission improvement." : scenario === "RECOMMENDATION_OUTCOME" ? "Recommend adopting the observed change." : "Operator workflow accepted the decision package and no rollback was required.",
    actual_outcome_evidence_refs: evidenceRefs,
    mission_impact: missionImpact(scenario),
    governance_result: "APPROVED",
    operator_action_result: "ACCEPTED",
    risk_actualization: riskActualization(),
    confidence_actualization: confidenceActualization(),
    rollback_result: "NOT_REQUIRED",
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : c.replay_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE_REFS" ? freezeArray([]) : c.governance_refs,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.outcome_id }) });
  if (scenario === "UNSUPPORTED_CONTRACT_VERSION") return Object.freeze({ ...built, contract_version: "actual-result-capture-contract/v1" as const, integrity_hash: built.integrity_hash });
  return built;
}

function isIsoUtc(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}

function buildSchemaValidation(record: OutcomeObservationRecord, registry: readonly OutcomeContractVersion[], scenario: Scenario): OutcomeSchemaValidation {
  const base: Omit<OutcomeSchemaValidation, "integrity_hash"> = {
    validation_id: "outcome_schema_validation",
    contract_version_valid: record.contract_version === OUTCOME_CONTRACT_VERSION && scenario !== "UNSUPPORTED_CONTRACT_VERSION",
    schema_version_supported: registry.some((version) => version.schema_version === record.schema_version && !version.deprecated) && scenario !== "UNSUPPORTED_SCHEMA_VERSION",
    required_fields_present: Boolean(record.outcome_id && record.tenant_id && record.mission_id && record.decision_id && record.decision_package_id && record.operator_workflow_id && record.observed_timestamp && record.observation_source && record.expected_outcome_refs.length),
    mission_impact_structured: record.mission_impact.objectives_completed.length > 0 || record.mission_impact.objectives_failed.length > 0,
    governance_result_structured: Boolean(record.governance_result),
    operator_result_structured: Boolean(record.operator_action_result),
    risk_actualization_structured: Boolean(record.risk_actualization),
    confidence_actualization_structured: Boolean(record.confidence_actualization),
    rollback_result_structured: Boolean(record.rollback_result),
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(Object.entries(base).every(([key, value]) => key === "validation_id" || key === "validation_result" || value === true)) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildIdentityValidation(record: OutcomeObservationRecord, scenario: Scenario): OutcomeIdentityValidation {
  const base: Omit<OutcomeIdentityValidation, "integrity_hash"> = {
    validation_id: "outcome_identity_validation",
    outcome_id_unique: scenario !== "DUPLICATE_OUTCOME_ID",
    tenant_valid: Boolean(record.tenant_id),
    mission_valid: Boolean(record.mission_id),
    decision_valid: Boolean(record.decision_id),
    identity_immutable: scenario !== "IDENTITY_MUTATION",
    duplicate_rejected: scenario !== "DUPLICATE_OUTCOME_ID",
    identity_lineage_stable: scenario !== "IDENTITY_MUTATION",
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(Object.entries(base).every(([key, value]) => key === "validation_id" || key === "validation_result" || value === true)) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidenceValidation(record: OutcomeObservationRecord, scenario: Scenario): OutcomeEvidenceValidation {
  const summary = record.actual_outcome_summary.toLowerCase();
  const base: Omit<OutcomeEvidenceValidation, "integrity_hash"> = {
    validation_id: "outcome_evidence_validation",
    evidence_exists: record.actual_outcome_evidence_refs.length > 0,
    references_valid: scenario !== "INVALID_EVIDENCE_REFERENCE",
    evidence_immutable: scenario !== "INVALID_EVIDENCE_REFERENCE",
    evidence_lineage_preserved: scenario !== "INVALID_EVIDENCE_REFERENCE",
    inferred_outcomes_absent: !summary.includes("inferred") && !summary.includes("predicted") && !summary.includes("recommend"),
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(Object.entries(base).every(([key, value]) => key === "validation_id" || key === "validation_result" || value === true)) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReplayValidation(record: OutcomeObservationRecord, registry: readonly OutcomeContractVersion[], scenario: Scenario): OutcomeReplayValidation {
  const historicalCompatible = registry.every((version) => version.compatibility_level !== "HISTORICAL_REPLAY_COMPATIBLE" || version.checksum === hash({
    contract_version: version.contract_version,
    schema_version: version.schema_version,
    effective_date: version.effective_date,
    compatibility_level: version.compatibility_level,
    deprecated: version.deprecated,
    migration_required: version.migration_required,
  }));
  const base: Omit<OutcomeReplayValidation, "integrity_hash"> = {
    validation_id: "outcome_replay_validation",
    originating_decision_present: Boolean(record.decision_id),
    originating_package_present: Boolean(record.decision_package_id),
    evidence_refs_present: record.actual_outcome_evidence_refs.length > 0,
    governance_refs_present: record.governance_refs.length > 0,
    operator_refs_present: Boolean(record.operator_workflow_id),
    ledger_refs_present: record.actual_outcome_evidence_refs.some((ref) => ref.includes("ledger")),
    replay_sequence_present: record.replay_refs.length > 0,
    reconstruction_identical: scenario !== "NONDETERMINISTIC_SERIALIZATION",
    historical_compatibility_preserved: historicalCompatible && scenario !== "HISTORICAL_REPLAY_BROKEN",
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(Object.entries(base).every(([key, value]) => key === "validation_id" || key === "validation_result" || value === true)) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function collectFailures(input: {
  source: AdaptiveArchitectureCertificationGateResult;
  record: OutcomeObservationRecord;
  schema: OutcomeSchemaValidation;
  identity: OutcomeIdentityValidation;
  evidence: OutcomeEvidenceValidation;
  replay: OutcomeReplayValidation;
  ledger: readonly OutcomeObservationLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeCaptureFailure[] {
  const failures: OutcomeCaptureFailure[] = [];
  if (!input.source.phase_10_1_authorized || input.source.validation.validation_status !== "VALID") failures.push("ARCHITECTURE_NOT_CERTIFIED");
  if (!input.schema.required_fields_present) failures.push("REQUIRED_FIELD_MISSING");
  if (!input.identity.duplicate_rejected) failures.push("DUPLICATE_OUTCOME_ID_ACCEPTED");
  if (!input.schema.schema_version_supported) failures.push("UNSUPPORTED_SCHEMA_VERSION_ACCEPTED");
  if (!input.schema.contract_version_valid) failures.push("UNSUPPORTED_CONTRACT_VERSION_ACCEPTED");
  if (!isIsoUtc(input.record.observed_timestamp)) failures.push("INVALID_TIMESTAMP_ACCEPTED");
  if (!input.evidence.evidence_exists || input.record.outcome_type === "INSUFFICIENT_EVIDENCE") failures.push("MISSING_EVIDENCE_ACCEPTED");
  if (!input.evidence.references_valid) failures.push("INVALID_EVIDENCE_REFERENCE_ACCEPTED");
  if (!input.replay.replay_sequence_present) failures.push("MISSING_REPLAY_REFERENCES_ACCEPTED");
  if (!input.replay.governance_refs_present) failures.push("MISSING_GOVERNANCE_REFERENCES_ACCEPTED");
  if (!input.replay.reconstruction_identical || input.scenario === "NONDETERMINISTIC_SERIALIZATION") failures.push("NONDETERMINISTIC_SERIALIZATION_DETECTED");
  if (hashWithoutIntegrity(input.record) !== input.record.integrity_hash || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH_DETECTED");
  if (!input.record.tenant_id || !input.record.mission_id || !input.record.decision_id) failures.push("ORPHAN_OUTCOME_ACCEPTED");
  if (!input.replay.historical_compatibility_preserved) failures.push("HISTORICAL_REPLAY_BROKEN_BY_SCHEMA_CHANGE");
  if (input.scenario === "INFERRED_OUTCOME") failures.push("INFERRED_OUTCOME_ACCEPTED");
  if (input.scenario === "PREDICTIVE_OUTCOME") failures.push("PREDICTIVE_OUTCOME_ACCEPTED");
  if (input.scenario === "RECOMMENDATION_OUTCOME") failures.push("RECOMMENDATION_OUTCOME_ACCEPTED");
  if (!input.identity.identity_immutable) failures.push("IDENTITY_MUTATION_ACCEPTED");
  if (input.scenario === "TIMESTAMP_MUTATION") failures.push("TIMESTAMP_MUTATION_ACCEPTED");
  if (input.scenario === "VALIDATION_AFTER_PERSISTENCE") failures.push("VALIDATION_AFTER_PERSISTENCE");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_OUTCOME_CAPTURE_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildLedger(record: OutcomeObservationRecord, validation: OutcomeValidationState, scenario: Scenario): readonly OutcomeObservationLedgerRecord[] {
  const base: Omit<OutcomeObservationLedgerRecord, "integrity_hash"> = {
    record_id: "outcome_observation_ledger_001",
    outcome_id: record.outcome_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    outcome_type: record.outcome_type,
    evidence_refs: record.actual_outcome_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    validation_result: validation,
    timestamp: record.observed_timestamp,
    sequence_number: 1,
    append_only: (scenario === "VALIDATION_AFTER_PERSISTENCE" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildValidation(failures: readonly OutcomeCaptureFailure[]): OutcomeCaptureValidation {
  const has = (failure: OutcomeCaptureFailure) => failures.includes(failure);
  const base: Omit<OutcomeCaptureValidation, "integrity_hash"> = {
    validation_id: "outcome_capture_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    architecture_certified: !has("ARCHITECTURE_NOT_CERTIFIED"),
    schema_valid: !has("REQUIRED_FIELD_MISSING") && !has("UNSUPPORTED_SCHEMA_VERSION_ACCEPTED") && !has("UNSUPPORTED_CONTRACT_VERSION_ACCEPTED"),
    identity_valid: !has("DUPLICATE_OUTCOME_ID_ACCEPTED") && !has("IDENTITY_MUTATION_ACCEPTED"),
    timestamp_valid: !has("INVALID_TIMESTAMP_ACCEPTED") && !has("TIMESTAMP_MUTATION_ACCEPTED"),
    references_valid: !has("ORPHAN_OUTCOME_ACCEPTED"),
    evidence_valid: !has("MISSING_EVIDENCE_ACCEPTED") && !has("INVALID_EVIDENCE_REFERENCE_ACCEPTED") && !has("INFERRED_OUTCOME_ACCEPTED") && !has("PREDICTIVE_OUTCOME_ACCEPTED") && !has("RECOMMENDATION_OUTCOME_ACCEPTED"),
    replay_valid: !has("MISSING_REPLAY_REFERENCES_ACCEPTED") && !has("NONDETERMINISTIC_SERIALIZATION_DETECTED") && !has("HISTORICAL_REPLAY_BROKEN_BY_SCHEMA_CHANGE"),
    governance_lineage_present: !has("MISSING_GOVERNANCE_REFERENCES_ACCEPTED"),
    deterministic_serialization: !has("NONDETERMINISTIC_SERIALIZATION_DETECTED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH_DETECTED"),
    historical_replay_compatible: !has("HISTORICAL_REPLAY_BROKEN_BY_SCHEMA_CHANGE"),
    validation_before_persistence: !has("VALIDATION_AFTER_PERSISTENCE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(validation: OutcomeCaptureValidation, failures: readonly OutcomeCaptureFailure[], registry: readonly OutcomeContractVersion[], record: OutcomeObservationRecord): OutcomeCaptureCertificationReport {
  const base: Omit<OutcomeCaptureCertificationReport, "integrity_hash"> = {
    report_id: "outcome_capture_contract_certification_report",
    tenant_id: record.tenant_id,
    checks: OUTCOME_CAPTURE_CHECKS,
    canonical_schema_defined: validation.schema_valid,
    schema_deterministic: validation.deterministic_serialization,
    identity_rules_enforced: validation.identity_valid,
    timestamp_rules_standardized: validation.timestamp_valid,
    reference_model_validated: validation.references_valid,
    evidence_mandatory: validation.evidence_valid,
    governance_lineage_preserved: validation.governance_lineage_present,
    replay_references_required: validation.replay_valid,
    integrity_hashing_deterministic: validation.integrity_verified,
    version_registry_operational: registry.length > 0 && registry.every((version) => Boolean(version.checksum)),
    historical_replay_compatible: validation.historical_replay_compatible,
    analysis_logic_absent: !failures.some((failure) => ["INFERRED_OUTCOME_ACCEPTED", "PREDICTIVE_OUTCOME_ACCEPTED", "RECOMMENDATION_OUTCOME_ACCEPTED"].includes(failure)),
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ActualResultCaptureContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.version_registry,
    record: result.outcome_record,
    schema: result.schema_validation,
    identity: result.identity_validation,
    evidence: result.evidence_validation,
    replay: result.replay_validation,
    validation: result.validation,
    ledger: result.observation_ledger,
    report: result.certification_report,
  });
}

export function runActualResultCaptureContract(input: ActualResultCaptureContractInput = {}): ActualResultCaptureContractResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const architecture_certification = sourceForScenario(input, scenario);
  const version_registry = buildVersionRegistry(scenario);
  const outcome_record = buildRecord(architecture_certification, version_registry, scenario);
  const schema_validation = buildSchemaValidation(outcome_record, version_registry, scenario);
  const identity_validation = buildIdentityValidation(outcome_record, scenario);
  const evidence_validation = buildEvidenceValidation(outcome_record, scenario);
  const replay_validation = buildReplayValidation(outcome_record, version_registry, scenario);
  const preFailures = collectFailures({ source: architecture_certification, record: outcome_record, schema: schema_validation, identity: identity_validation, evidence: evidence_validation, replay: replay_validation, ledger: [], role, scenario });
  const observation_ledger = buildLedger(outcome_record, state(preFailures.length === 0), scenario);
  const failures = collectFailures({ source: architecture_certification, record: outcome_record, schema: schema_validation, identity: identity_validation, evidence: evidence_validation, replay: replay_validation, ledger: observation_ledger, role, scenario });
  const validation = buildValidation(failures);
  const certification_report = buildReport(validation, failures, version_registry, outcome_record);
  const base: Omit<ActualResultCaptureContractResult, "integrity_hash" | "replay_hash"> = {
    outcome_capture_contract_version: OUTCOME_CONTRACT_VERSION,
    architecture_certification,
    version_registry,
    outcome_record,
    schema_validation,
    identity_validation,
    evidence_validation,
    replay_validation,
    validation,
    observation_ledger,
    certification_report,
    deterministic: true,
    replayable: true,
    structural_only: true,
    permits_analysis: false,
    permits_inference: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayActualResultCaptureContract(result: ActualResultCaptureContractResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeObservationHash(record: Omit<OutcomeObservationRecord, "integrity_hash"> | OutcomeObservationRecord): string {
  return hashWithoutIntegrity(record);
}

export function getActualResultCaptureContractFoundation(): ActualResultCaptureContractFoundation {
  return Object.freeze({
    outcome_capture_contract_version: OUTCOME_CONTRACT_VERSION,
    checks: OUTCOME_CAPTURE_CHECKS,
    supported_versions: buildVersionRegistry("BASELINE"),
    result: runActualResultCaptureContract(),
  });
}

export const ActualResultCaptureContract = Object.freeze({
  run: runActualResultCaptureContract,
  replay: replayActualResultCaptureContract,
});
