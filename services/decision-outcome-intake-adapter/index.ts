import { runActualResultCaptureContract } from "@/services/actual-result-capture-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { ActualResultCaptureContractResult, OutcomeObservationRecord, OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  DecisionOutcomeIntakeAdapterFoundation,
  DecisionOutcomeIntakeAdapterInput,
  DecisionOutcomeIntakeAdapterResult,
  OutcomeDuplicateDetection,
  OutcomeIntakeAuditLogRecord,
  OutcomeIntakeCertificationReport,
  OutcomeIntakeCheck,
  OutcomeIntakeFailure,
  OutcomeIntakeMetrics,
  OutcomeIntakeRecord,
  OutcomeIntakeRoute,
  OutcomeIntakeSourceType,
  OutcomeIntakeValidation,
  OutcomeMappingResult,
  OutcomePayloadRouting,
  OutcomeSourceNormalization,
  OutcomeSourceRegistry,
  OutcomeSourceRegistryEntry,
} from "@/types/decision-outcome-intake-adapter";

const INTAKE_ADAPTER_VERSION = "decision-outcome-intake-adapter/v1" as const;

export const OUTCOME_INTAKE_CHECKS: readonly OutcomeIntakeCheck[] = Object.freeze(["SOURCE_REGISTRY", "SOURCE_NORMALIZATION", "CANONICAL_MAPPING", "STRUCTURAL_VALIDATION", "GOVERNANCE_VALIDATION", "EVIDENCE_VALIDATION", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "DUPLICATE_DETECTION", "PAYLOAD_ROUTING", "TENANT_ISOLATION", "REPLAY_DETERMINISM"]);
export const OUTCOME_INTAKE_SOURCE_TYPES: readonly OutcomeIntakeSourceType[] = Object.freeze(["OPERATOR_WORKFLOW", "EXECUTION_ENGINE", "GOVERNANCE_ENGINE", "ROLLBACK_ENGINE", "MISSION_SYSTEM", "SIMULATION_ENGINE"]);

type Scenario = NonNullable<DecisionOutcomeIntakeAdapterInput["scenario"]>;

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

function sourceForScenario(input: DecisionOutcomeIntakeAdapterInput, scenario: Scenario): ActualResultCaptureContractResult {
  if (input.capture_contract) return input.capture_contract;
  if (scenario === "MISSING_REQUIRED_FIELD") return runActualResultCaptureContract({ scenario: "MISSING_REQUIRED_FIELD" });
  if (scenario === "INVALID_TIMESTAMP" || scenario === "TIMESTAMP_MODIFIED") return runActualResultCaptureContract({ scenario: "INVALID_TIMESTAMP" });
  if (scenario === "UNSUPPORTED_SCHEMA_VERSION" || scenario === "MALFORMED_SCHEMA") return runActualResultCaptureContract({ scenario: "UNSUPPORTED_SCHEMA_VERSION" });
  if (scenario === "MISSING_EVIDENCE" || scenario === "EVIDENCE_ALTERED") return runActualResultCaptureContract({ scenario: "MISSING_EVIDENCE" });
  if (scenario === "MISSING_REPLAY_REFS" || scenario === "REPLAY_REMOVED") return runActualResultCaptureContract({ scenario: "MISSING_REPLAY_REFS" });
  if (scenario === "MISSING_GOVERNANCE_REFS" || scenario === "GOVERNANCE_LOST") return runActualResultCaptureContract({ scenario: "MISSING_GOVERNANCE_REFS" });
  if (scenario === "INTEGRITY_BYPASS") return runActualResultCaptureContract({ scenario: "HASH_MISMATCH" });
  if (scenario === "ANALYSIS_ATTEMPTED") return runActualResultCaptureContract({ scenario: "INFERRED_OUTCOME" });
  return runActualResultCaptureContract();
}

function visibleToRole(source: ActualResultCaptureContractResult, role: VisibilityRole): boolean {
  return source.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function registryEntry(sourceType: OutcomeIntakeSourceType, tenant: string, scenario: Scenario): OutcomeSourceRegistryEntry {
  const base: Omit<OutcomeSourceRegistryEntry, "integrity_hash"> = {
    source_id: `source:${sourceType.toLowerCase()}`,
    source_name: sourceType.replace(/_/g, " ").toLowerCase(),
    source_type: sourceType,
    supported_schema_versions: scenario === "UNSUPPORTED_SCHEMA_VERSION" ? freezeArray([]) : freezeArray(["outcome-intake/v1"]),
    trust_level: sourceType === "MISSION_SYSTEM" ? "EXTERNAL_CERTIFIED" : "INTERNAL_CERTIFIED",
    tenant_scope: freezeArray([tenant]),
    enabled: scenario !== "UNAUTHORIZED_SOURCE",
    certification_status: scenario === "UNAUTHORIZED_SOURCE" ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(source: ActualResultCaptureContractResult, scenario: Scenario): OutcomeSourceRegistry {
  const tenant = source.outcome_record.tenant_id;
  const entries = scenario === "UNSUPPORTED_SOURCE"
    ? OUTCOME_INTAKE_SOURCE_TYPES.filter((type) => type !== "MISSION_SYSTEM").map((type) => registryEntry(type, tenant, scenario))
    : OUTCOME_INTAKE_SOURCE_TYPES.map((type) => registryEntry(type, tenant, scenario));
  const base: Omit<OutcomeSourceRegistry, "integrity_hash"> = {
    registry_id: "outcome_source_registry",
    entries: freezeArray(entries),
    default_schema_version: "outcome-intake/v1",
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sourceType(input: DecisionOutcomeIntakeAdapterInput, scenario: Scenario): OutcomeIntakeSourceType {
  if (scenario === "UNSUPPORTED_SOURCE") return "MISSION_SYSTEM";
  return input.source_type ?? "OPERATOR_WORKFLOW";
}

function sourceSystem(type: OutcomeIntakeSourceType, scenario: Scenario): string {
  if (scenario === "UNAUTHORIZED_SOURCE") return "external:unregistered";
  return `mission-control:${type.toLowerCase()}`;
}

function buildIntakeRecord(source: ActualResultCaptureContractResult, input: DecisionOutcomeIntakeAdapterInput, scenario: Scenario): OutcomeIntakeRecord {
  const record = source.outcome_record;
  const type = sourceType(input, scenario);
  const evidence = scenario === "EVIDENCE_ALTERED" ? freezeArray(["evidence:altered"]) : record.actual_outcome_evidence_refs;
  const replay = scenario === "REPLAY_REMOVED" ? freezeArray([]) : record.replay_refs;
  const governance = scenario === "GOVERNANCE_LOST" ? freezeArray([]) : record.governance_refs;
  const normalizedPayload = Object.freeze({
    outcome_type: record.outcome_type,
    actual_outcome_summary: record.actual_outcome_summary,
    governance_result: record.governance_result,
    operator_action_result: record.operator_action_result,
    rollback_result: record.rollback_result,
  });
  const base: Omit<OutcomeIntakeRecord, "integrity_hash"> = {
    intake_id: scenario === "MISSING_REQUIRED_FIELD" ? "" : "outcome_intake_001",
    source_type: type,
    source_system: sourceSystem(type, scenario),
    source_record_id: scenario === "INVALID_IDENTIFIER" ? "" : "source_record_001",
    tenant_id: scenario === "TENANT_VIOLATION" ? `${record.tenant_id}:foreign` : record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    event_timestamp: scenario === "TIMESTAMP_MODIFIED" ? "2026/07/05 10:01:55" : record.observed_timestamp,
    received_timestamp: "2026-07-05T10:02:00.000Z",
    payload_version: scenario === "MALFORMED_SCHEMA" ? "malformed" : "outcome-intake/v1",
    normalized_payload: scenario === "INVALID_PAYLOAD" ? Object.freeze({}) : normalizedPayload,
    evidence_refs: evidence,
    governance_refs: governance,
    replay_refs: replay,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "INTEGRITY_BYPASS") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.intake_id }) });
  return built;
}

function isIsoUtc(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}

function buildNormalization(intake: OutcomeIntakeRecord, source: ActualResultCaptureContractResult, scenario: Scenario): OutcomeSourceNormalization {
  const evidencePreserved = intake.evidence_refs.length === source.outcome_record.actual_outcome_evidence_refs.length && scenario !== "EVIDENCE_ALTERED";
  const replayPreserved = intake.replay_refs.length === source.outcome_record.replay_refs.length && scenario !== "REPLAY_REMOVED";
  const base: Omit<OutcomeSourceNormalization, "integrity_hash"> = {
    normalization_id: "outcome_source_normalization",
    source_type: intake.source_type,
    field_names_normalized: scenario !== "NORMALIZATION_INCONSISTENT",
    timestamps_normalized: isIsoUtc(intake.event_timestamp),
    identifiers_normalized: Boolean(intake.source_record_id && intake.tenant_id && intake.mission_id && intake.decision_id),
    enumerations_normalized: Boolean(intake.normalized_payload.outcome_type),
    references_normalized: intake.evidence_refs.length > 0 && intake.replay_refs.length > 0 && intake.governance_refs.length > 0,
    evidence_preserved: evidencePreserved,
    replay_preserved: replayPreserved,
    source_specific_semantics_removed: scenario !== "NORMALIZATION_INCONSISTENT",
    normalized_output_hash: hash(intake.normalized_payload),
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(Object.entries(base).every(([key, value]) => key === "normalization_id" || key === "source_type" || key === "normalized_output_hash" || key === "validation_result" || value === true)) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function mapCanonical(source: ActualResultCaptureContractResult, intake: OutcomeIntakeRecord): OutcomeObservationRecord {
  const base: Omit<OutcomeObservationRecord, "integrity_hash"> = {
    ...source.outcome_record,
    tenant_id: intake.tenant_id,
    mission_id: intake.mission_id,
    decision_id: intake.decision_id,
    observed_timestamp: intake.event_timestamp,
    observation_source: intake.source_system,
    actual_outcome_evidence_refs: intake.evidence_refs,
    replay_refs: intake.replay_refs,
    governance_refs: intake.governance_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMapping(source: ActualResultCaptureContractResult, intake: OutcomeIntakeRecord, scenario: Scenario): OutcomeMappingResult {
  const canonical = mapCanonical(source, intake);
  const base: Omit<OutcomeMappingResult, "integrity_hash"> = {
    mapping_id: "outcome_mapping",
    mission_refs_resolved: Boolean(intake.mission_id),
    decision_refs_resolved: Boolean(intake.decision_id),
    operator_refs_resolved: Boolean(canonical.operator_workflow_id),
    governance_refs_resolved: intake.governance_refs.length > 0,
    evidence_refs_resolved: intake.evidence_refs.length > 0,
    replay_refs_resolved: intake.replay_refs.length > 0,
    mandatory_contract_fields_populated: scenario !== "MISSING_REQUIRED_FIELD" && Boolean(canonical.outcome_id && canonical.tenant_id && canonical.mission_id && canonical.decision_id),
    canonical_outcome: canonical,
    validation_result: "PASS",
  };
  const normalized = { ...base, validation_result: state(base.mission_refs_resolved && base.decision_refs_resolved && base.operator_refs_resolved && base.governance_refs_resolved && base.evidence_refs_resolved && base.replay_refs_resolved && base.mandatory_contract_fields_populated) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildDuplicate(intake: OutcomeIntakeRecord, scenario: Scenario): OutcomeDuplicateDetection {
  const duplicate = scenario === "IDENTICAL_DUPLICATE" || scenario === "CONFLICTING_DUPLICATE" || scenario === "NONDETERMINISTIC_DUPLICATE";
  const base: Omit<OutcomeDuplicateDetection, "integrity_hash"> = {
    detection_id: "outcome_duplicate_detection",
    duplicate_key: hash({
      tenant_id: intake.tenant_id,
      mission_id: intake.mission_id,
      decision_id: intake.decision_id,
      source_type: intake.source_type,
      source_record_id: intake.source_record_id,
      event_timestamp: intake.event_timestamp,
      integrity_hash: intake.integrity_hash,
    }),
    duplicate_detected: duplicate,
    identical_payload: scenario === "IDENTICAL_DUPLICATE",
    conflicting_payload: scenario === "CONFLICTING_DUPLICATE" || scenario === "NONDETERMINISTIC_DUPLICATE",
    deterministic_action: scenario === "IDENTICAL_DUPLICATE" ? "IGNORE_DUPLICATE" : scenario === "CONFLICTING_DUPLICATE" || scenario === "NONDETERMINISTIC_DUPLICATE" ? "REJECT_CONFLICT" : "ACCEPT",
    escalated: scenario === "CONFLICTING_DUPLICATE" || scenario === "NONDETERMINISTIC_DUPLICATE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: ActualResultCaptureContractResult;
  registry: OutcomeSourceRegistry;
  intake: OutcomeIntakeRecord;
  normalization: OutcomeSourceNormalization;
  mapping: OutcomeMappingResult;
  duplicate: OutcomeDuplicateDetection;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeIntakeFailure[] {
  const failures: OutcomeIntakeFailure[] = [];
  const registered = input.registry.entries.find((entry) => entry.source_type === input.intake.source_type);
  if (!registered || input.scenario === "UNSUPPORTED_SOURCE") failures.push("UNSUPPORTED_SOURCE_ACCEPTED");
  if (!Object.keys(input.intake.normalized_payload).length || input.scenario === "INVALID_PAYLOAD") failures.push("INVALID_PAYLOAD_ACCEPTED");
  if (input.intake.payload_version !== input.registry.default_schema_version || input.scenario === "MALFORMED_SCHEMA") failures.push("MALFORMED_SCHEMA_ACCEPTED");
  if (!registered?.enabled || registered.certification_status !== "PASS" || input.scenario === "UNAUTHORIZED_SOURCE") failures.push("UNAUTHORIZED_SOURCE_ACCEPTED");
  if (input.scenario === "NONDETERMINISTIC_DUPLICATE") failures.push("DUPLICATE_HANDLING_NONDETERMINISTIC");
  if (!input.normalization.evidence_preserved || input.scenario === "EVIDENCE_ALTERED") failures.push("EVIDENCE_REFERENCES_ALTERED");
  if (!input.mapping.governance_refs_resolved || input.scenario === "GOVERNANCE_LOST") failures.push("GOVERNANCE_METADATA_LOST");
  if (!input.normalization.replay_preserved || input.scenario === "REPLAY_REMOVED") failures.push("REPLAY_REFERENCES_REMOVED");
  if (!input.normalization.timestamps_normalized || input.scenario === "TIMESTAMP_MODIFIED") failures.push("TIMESTAMP_MODIFIED_INCORRECTLY");
  if (input.normalization.validation_result !== "PASS" || input.scenario === "NORMALIZATION_INCONSISTENT") failures.push("NORMALIZATION_INCONSISTENT");
  if (input.intake.tenant_id !== input.source.outcome_record.tenant_id || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_BOUNDARY_VIOLATED");
  if (input.duplicate.conflicting_payload) failures.push("CONFLICTING_PAYLOADS_MERGED");
  if (hashWithoutIntegrity(input.intake) !== input.intake.integrity_hash || input.scenario === "INTEGRITY_BYPASS") failures.push("INTEGRITY_VERIFICATION_BYPASSED");
  if (!input.intake.intake_id || !input.mapping.mandatory_contract_fields_populated || input.scenario === "MISSING_REQUIRED_FIELD") failures.push("MISSING_REQUIRED_FIELD");
  if (!input.intake.source_record_id || input.scenario === "INVALID_IDENTIFIER") failures.push("INVALID_IDENTIFIER");
  if (!isIsoUtc(input.intake.event_timestamp) || input.scenario === "INVALID_TIMESTAMP") failures.push("INVALID_TIMESTAMP");
  if (!registered?.supported_schema_versions.includes(input.intake.payload_version) || input.scenario === "UNSUPPORTED_SCHEMA_VERSION") failures.push("UNSUPPORTED_SCHEMA_VERSION");
  if (!input.intake.evidence_refs.length || input.scenario === "MISSING_EVIDENCE") failures.push("MISSING_EVIDENCE");
  if (!input.intake.replay_refs.length || input.scenario === "MISSING_REPLAY_REFS") failures.push("MISSING_REPLAY_REFERENCES");
  if (!input.intake.governance_refs.length || input.scenario === "MISSING_GOVERNANCE_REFS") failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILED") failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "ANALYSIS_ATTEMPTED") failures.push("ANALYSIS_ATTEMPTED");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_INTAKE_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly OutcomeIntakeFailure[], duplicate: OutcomeDuplicateDetection): OutcomeIntakeValidation {
  const has = (failure: OutcomeIntakeFailure) => failures.includes(failure);
  const base: Omit<OutcomeIntakeValidation, "integrity_hash"> = {
    validation_id: "outcome_intake_validation",
    validation_status: duplicate.identical_payload && !failures.length ? "DUPLICATE" : failures.length ? "BLOCKED" : "VALID",
    source_supported: !has("UNSUPPORTED_SOURCE_ACCEPTED"),
    source_authorized: !has("UNAUTHORIZED_SOURCE_ACCEPTED"),
    schema_valid: !has("MALFORMED_SCHEMA_ACCEPTED") && !has("UNSUPPORTED_SCHEMA_VERSION"),
    identifiers_valid: !has("INVALID_IDENTIFIER") && !has("MISSING_REQUIRED_FIELD"),
    timestamps_valid: !has("INVALID_TIMESTAMP") && !has("TIMESTAMP_MODIFIED_INCORRECTLY"),
    tenant_isolated: !has("TENANT_BOUNDARY_VIOLATED"),
    evidence_valid: !has("MISSING_EVIDENCE") && !has("EVIDENCE_REFERENCES_ALTERED"),
    governance_valid: !has("MISSING_GOVERNANCE_REFERENCES") && !has("GOVERNANCE_METADATA_LOST"),
    replay_valid: !has("MISSING_REPLAY_REFERENCES") && !has("REPLAY_REFERENCES_REMOVED") && !has("REPLAY_RECONSTRUCTION_FAILED"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_BYPASSED"),
    duplicate_handled_deterministically: !has("DUPLICATE_HANDLING_NONDETERMINISTIC") && !has("CONFLICTING_PAYLOADS_MERGED"),
    canonical_mapping_valid: !has("INVALID_PAYLOAD_ACCEPTED") && !has("MISSING_REQUIRED_FIELD"),
    analysis_absent: !has("ANALYSIS_ATTEMPTED"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function routeFor(validation: OutcomeIntakeValidation, duplicate: OutcomeDuplicateDetection, failures: readonly OutcomeIntakeFailure[]): OutcomeIntakeRoute {
  if (failures.includes("UNAUTHORIZED_SOURCE_ACCEPTED")) return "GOVERNANCE_ALERT";
  if (duplicate.duplicate_detected && !duplicate.conflicting_payload) return "DUPLICATE_LEDGER";
  if (validation.validation_status === "VALID") return "OUTCOME_OBSERVATION_ENGINE";
  return "VALIDATION_REPORT";
}

function buildRouting(validation: OutcomeIntakeValidation, duplicate: OutcomeDuplicateDetection, failures: readonly OutcomeIntakeFailure[]): OutcomePayloadRouting {
  const route = routeFor(validation, duplicate, failures);
  const base: Omit<OutcomePayloadRouting, "integrity_hash"> = {
    routing_id: "outcome_payload_routing",
    route,
    routed_to_observation_engine: route === "OUTCOME_OBSERVATION_ENGINE",
    routed_to_validation_report: route === "VALIDATION_REPORT",
    routed_to_duplicate_ledger: route === "DUPLICATE_LEDGER",
    routed_to_governance_alert: route === "GOVERNANCE_ALERT",
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(intake: OutcomeIntakeRecord, routing: OutcomePayloadRouting, validation: OutcomeIntakeValidation): readonly OutcomeIntakeAuditLogRecord[] {
  const base: Omit<OutcomeIntakeAuditLogRecord, "integrity_hash"> = {
    audit_id: "outcome_intake_audit_001",
    intake_id: intake.intake_id,
    source_type: intake.source_type,
    route: routing.route,
    validation_status: validation.validation_status,
    failures: validation.failures,
    evidence_refs: intake.evidence_refs,
    governance_refs: intake.governance_refs,
    replay_refs: intake.replay_refs,
    timestamp: intake.received_timestamp,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildMetrics(validation: OutcomeIntakeValidation, duplicate: OutcomeDuplicateDetection, sourceTypeValue: OutcomeIntakeSourceType): OutcomeIntakeMetrics {
  const base: Omit<OutcomeIntakeMetrics, "integrity_hash"> = {
    metrics_id: "outcome_intake_metrics",
    total_payloads_received: 1,
    payloads_normalized: validation.validation_status === "VALID" || validation.validation_status === "DUPLICATE" ? 1 : 0,
    payloads_rejected: validation.validation_status === "BLOCKED" ? 1 : 0,
    duplicate_submissions_detected: duplicate.duplicate_detected ? 1 : 0,
    unauthorized_source_attempts: validation.failures.includes("UNAUTHORIZED_SOURCE_ACCEPTED") ? 1 : 0,
    validation_failures: validation.failures.length,
    normalization_latency_ms: 0,
    supported_source_utilization: freezeArray([sourceTypeValue]),
    replay_consistency_rate: validation.replay_valid ? 1 : 0,
    integrity_verification_failures: validation.failures.includes("INTEGRITY_VERIFICATION_BYPASSED") ? 1 : 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: ActualResultCaptureContractResult, validation: OutcomeIntakeValidation): OutcomeIntakeCertificationReport {
  const has = (failure: OutcomeIntakeFailure) => validation.failures.includes(failure);
  const base: Omit<OutcomeIntakeCertificationReport, "integrity_hash"> = {
    report_id: "decision_outcome_intake_adapter_certification_report",
    tenant_id: source.outcome_record.tenant_id,
    checks: OUTCOME_INTAKE_CHECKS,
    source_normalizer_operational: !has("NORMALIZATION_INCONSISTENT"),
    mapping_engine_operational: validation.canonical_mapping_valid,
    validation_layer_enforced: validation.validation_status !== "VALID" || validation.failures.length === 0,
    duplicate_detection_deterministic: validation.duplicate_handled_deterministically,
    invalid_payloads_rejected: !has("INVALID_PAYLOAD_ACCEPTED") && !has("MALFORMED_SCHEMA_ACCEPTED"),
    unauthorized_sources_rejected: !has("UNAUTHORIZED_SOURCE_ACCEPTED"),
    evidence_lineage_preserved: validation.evidence_valid,
    governance_lineage_preserved: validation.governance_valid,
    replay_references_preserved: validation.replay_valid,
    tenant_isolation_maintained: validation.tenant_isolated,
    replay_reconstructs_identically: !has("REPLAY_RECONSTRUCTION_FAILED"),
    analysis_logic_absent: validation.analysis_absent,
    failure_analysis: validation.failures,
    certification_decision: state(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DecisionOutcomeIntakeAdapterResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.source_registry,
    intake: result.intake_record,
    normalization: result.normalization,
    mapping: result.mapping,
    duplicate: result.duplicate_detection,
    validation: result.validation,
    routing: result.routing,
    audit: result.audit_log,
    metrics: result.metrics,
    report: result.certification_report,
  });
}

export function runDecisionOutcomeIntakeAdapter(input: DecisionOutcomeIntakeAdapterInput = {}): DecisionOutcomeIntakeAdapterResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const capture_contract = sourceForScenario(input, scenario);
  const source_registry = buildRegistry(capture_contract, scenario);
  const intake_record = buildIntakeRecord(capture_contract, input, scenario);
  const normalization = buildNormalization(intake_record, capture_contract, scenario);
  const mapping = buildMapping(capture_contract, intake_record, scenario);
  const duplicate_detection = buildDuplicate(intake_record, scenario);
  const failures = collectFailures({ source: capture_contract, registry: source_registry, intake: intake_record, normalization, mapping, duplicate: duplicate_detection, role, scenario });
  const validation = buildValidation(failures, duplicate_detection);
  const routing = buildRouting(validation, duplicate_detection, failures);
  const audit_log = buildAudit(intake_record, routing, validation);
  const metrics = buildMetrics(validation, duplicate_detection, intake_record.source_type);
  const certification_report = buildReport(capture_contract, validation);
  const base: Omit<DecisionOutcomeIntakeAdapterResult, "integrity_hash" | "replay_hash"> = {
    intake_adapter_version: INTAKE_ADAPTER_VERSION,
    capture_contract,
    source_registry,
    intake_record,
    normalization,
    mapping,
    duplicate_detection,
    validation,
    routing,
    audit_log,
    metrics,
    certification_report,
    deterministic: true,
    replayable: true,
    structural_only: true,
    permits_analysis: false,
    permits_learning: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionOutcomeIntakeAdapter(result: DecisionOutcomeIntakeAdapterResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeIntakeHash(record: Omit<OutcomeIntakeRecord, "integrity_hash"> | OutcomeIntakeRecord): string {
  return hashWithoutIntegrity(record);
}

export function getDecisionOutcomeIntakeAdapterFoundation(): DecisionOutcomeIntakeAdapterFoundation {
  return Object.freeze({
    intake_adapter_version: INTAKE_ADAPTER_VERSION,
    checks: OUTCOME_INTAKE_CHECKS,
    supported_sources: OUTCOME_INTAKE_SOURCE_TYPES,
    result: runDecisionOutcomeIntakeAdapter(),
  });
}

export const DecisionOutcomeIntakeAdapter = Object.freeze({
  run: runDecisionOutcomeIntakeAdapter,
  replay: replayDecisionOutcomeIntakeAdapter,
});
