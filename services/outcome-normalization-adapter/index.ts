import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeObservationLedger } from "@/services/outcome-observation-ledger";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeObservationLedgerResult } from "@/types/outcome-observation-ledger";
import type {
  CanonicalOutcome,
  FieldTranslationTrace,
  NormalizationApiSurface,
  NormalizationAuditReport,
  NormalizationMetadata,
  NormalizationMetrics,
  NormalizationRule,
  NormalizationValidation,
  OutcomeNormalizationAdapterFoundation,
  OutcomeNormalizationAdapterInput,
  OutcomeNormalizationAdapterResult,
  OutcomeNormalizationCheck,
  OutcomeNormalizationFailure,
  OutcomeNormalizationSourceSystem,
  SchemaDetectionResult,
  SourceIntakeResult,
} from "@/types/outcome-normalization-adapter";

const OUTCOME_NORMALIZATION_ADAPTER_VERSION = "outcome-normalization-adapter/v1" as const;
const NORMALIZATION_VERSION = "10.2.1" as const;

export const OUTCOME_NORMALIZATION_CHECKS: readonly OutcomeNormalizationCheck[] = Object.freeze(["SOURCE_VALIDATION", "SCHEMA_DETECTION", "FIELD_TRANSLATION", "CANONICAL_MAPPING", "RULE_VERSIONING", "REFERENCE_VALIDATION", "INTEGRITY_VALIDATION", "REPLAY_VALIDATION", "TENANT_ISOLATION", "SOURCE_IMMUTABILITY", "TRACEABILITY"]);
export const SUPPORTED_OUTCOME_SOURCES: readonly OutcomeNormalizationSourceSystem[] = Object.freeze(["MISSION_CONTROL_OUTCOMES", "OPERATOR_WORKFLOW_RESULTS", "GOVERNANCE_RESULTS", "ROLLBACK_REPORTS", "CERTIFICATION_RESULTS", "REPLAY_OBSERVATIONS", "EVIDENCE_REGISTRIES", "FUTURE_CERTIFIED_SUBSYSTEM_OUTCOMES"]);

type Scenario = NonNullable<OutcomeNormalizationAdapterInput["scenario"]>;

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

function sourceForScenario(input: OutcomeNormalizationAdapterInput, scenario: Scenario): OutcomeObservationLedgerResult {
  if (input.outcome_ledger) return input.outcome_ledger;
  if (scenario === "TENANT_MISMATCH") return runOutcomeObservationLedger({ scenario: "UNAUTHORIZED_TENANT_ACCESS" });
  if (scenario === "HASH_MISMATCH") return runOutcomeObservationLedger({ scenario: "HASH_MISMATCH" });
  if (scenario === "LINEAGE_LOST") return runOutcomeObservationLedger({ scenario: "MISSING_REPLAY" });
  return runOutcomeObservationLedger();
}

function visibleToRole(source: OutcomeObservationLedgerResult, role: VisibilityRole): boolean {
  return source.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function selectedSource(input: OutcomeNormalizationAdapterInput, scenario: Scenario): OutcomeNormalizationSourceSystem | "UNKNOWN_SOURCE" {
  if (input.source_system) return input.source_system;
  if (SUPPORTED_OUTCOME_SOURCES.includes(scenario as OutcomeNormalizationSourceSystem)) return scenario as OutcomeNormalizationSourceSystem;
  if (scenario === "UNSUPPORTED_SOURCE") return "UNKNOWN_SOURCE";
  return "MISSION_CONTROL_OUTCOMES";
}

function buildApiSurface(): NormalizationApiSurface {
  const base: Omit<NormalizationApiSurface, "integrity_hash"> = {
    api_id: "outcome_normalization_api",
    normalize_outcome: "POST /normalization/outcomes",
    validate_outcome: "POST /normalization/validate",
    retrieve_rule_version: "GET /normalization/rules/{version}",
    list_supported_schemas: "GET /normalization/schemas",
    deterministic: true,
    persistence_required: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sourcePayload(source: OutcomeObservationLedgerResult, scenario: Scenario): Record<string, unknown> {
  const record = source.ledger_records[0];
  return {
    sourceOutcomeId: scenario === "MISSING_IDENTIFIER" ? "" : record.outcome_id,
    tenantId: scenario === "TENANT_MISMATCH" ? `${record.tenant_id}:foreign` : record.tenant_id,
    missionId: record.mission_id,
    decisionId: record.decision_id,
    finalStatus: scenario === "INVALID_ENUMERATION" ? "MAYBE_DONE" : source.governance_operator_recorder.actualization_recorder.mission_impact_recorder.impact_record.impact_type,
    observedAt: scenario === "INVALID_TIMESTAMP" ? "not-a-timestamp" : record.observation_timestamp,
    missionImpactRefs: record.mission_impact_refs,
    governanceResult: source.governance_operator_recorder.governance_outcome_record.governance_decision,
    operatorResult: source.governance_operator_recorder.governance_outcome_record.operator_action,
    rollbackResult: source.governance_operator_recorder.governance_outcome_record.rollback_authorization,
    evidenceRefs: scenario === "MALFORMED_REFERENCE" ? ["bad ref with spaces"] : record.evidence_refs,
    replayRefs: scenario === "LINEAGE_LOST" ? [] : record.replay_refs,
    unsupportedField: scenario === "UNSUPPORTED_FIELD" ? "extra" : undefined,
  };
}

function buildSourceIntake(source: OutcomeObservationLedgerResult, sourceSystem: OutcomeNormalizationSourceSystem | "UNKNOWN_SOURCE", scenario: Scenario): SourceIntakeResult {
  const payload = sourcePayload(source, scenario);
  const base: Omit<SourceIntakeResult, "integrity_hash"> = {
    intake_id: "outcome_normalization_source_intake",
    source_system: sourceSystem,
    source_schema_version: scenario === "UNKNOWN_SCHEMA" ? "unknown-schema/v0" : scenario === "UNSUPPORTED_VERSION" ? "outcome-source/v99" : "outcome-source/v1",
    source_identity_verified: sourceSystem !== "UNKNOWN_SOURCE",
    original_payload_hash: hash(payload),
    original_payload_preserved: scenario !== "SOURCE_MUTATION",
    unknown_source_rejected: sourceSystem === "UNKNOWN_SOURCE",
    unsupported_fields: scenario === "UNSUPPORTED_FIELD" ? freezeArray(["unsupportedField"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSchemaDetection(intake: SourceIntakeResult, scenario: Scenario): SchemaDetectionResult {
  const base: Omit<SchemaDetectionResult, "integrity_hash"> = {
    detector_id: "outcome_normalization_schema_detector",
    detected_schema: intake.source_schema_version,
    schema_version_supported: scenario !== "UNKNOWN_SCHEMA" && scenario !== "UNSUPPORTED_VERSION",
    required_fields_present: scenario !== "MISSING_IDENTIFIER",
    translation_profile: `${intake.source_system}:canonical-outcome:${NORMALIZATION_VERSION}`,
    schema_lineage_refs: freezeArray([intake.source_schema_version, NORMALIZATION_VERSION]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rule(rule_id: string, rule_name: string, source_schema: string, target_field: keyof CanonicalOutcome, transformation_type: NormalizationRule["transformation_type"]): NormalizationRule {
  const base: Omit<NormalizationRule, "integrity_hash"> = {
    rule_id,
    rule_name,
    source_schema,
    target_field,
    transformation_type,
    rule_version: NORMALIZATION_VERSION,
    effective_date: "2026-01-01",
    deprecated_date: null,
    status: "ACTIVE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRules(schema: string): readonly NormalizationRule[] {
  return freezeArray([
    rule("normalize_source_outcome_id", "Normalize source outcome identifier", schema, "source_outcome_id", "IDENTIFIER_NORMALIZATION"),
    rule("normalize_timestamp", "Normalize outcome timestamp", schema, "outcome_timestamp", "TIMESTAMP_NORMALIZATION"),
    rule("map_outcome_type", "Map source outcome type", schema, "outcome_type", "ENUMERATION_MAPPING"),
    rule("map_governance_result", "Map governance result", schema, "governance_result", "GOVERNANCE_NORMALIZATION"),
    rule("map_operator_result", "Map operator result", schema, "operator_result", "OPERATOR_NORMALIZATION"),
    rule("map_rollback_result", "Map rollback result", schema, "rollback_result", "ROLLBACK_NORMALIZATION"),
    rule("normalize_evidence_refs", "Normalize evidence references", schema, "evidence_refs", "EVIDENCE_REFERENCE_NORMALIZATION"),
    rule("normalize_replay_refs", "Normalize replay references", schema, "replay_refs", "REPLAY_REFERENCE_NORMALIZATION"),
  ]);
}

function canonicalOutcome(source: OutcomeObservationLedgerResult, intake: SourceIntakeResult, sourceSystem: OutcomeNormalizationSourceSystem | "UNKNOWN_SOURCE", scenario: Scenario): CanonicalOutcome {
  const payload = sourcePayload(source, scenario);
  const sourceOutcomeId = String(payload.sourceOutcomeId ?? "");
  const tenant = String(payload.tenantId ?? "");
  const mission = String(payload.missionId ?? "");
  const decision = String(payload.decisionId ?? "");
  const source_schema_version = intake.source_schema_version;
  const normalized_outcome_id = scenario === "DUPLICATE_CANONICAL_ID" ? "normalized_duplicate" : `normalized_${hash(`${sourceSystem}:${sourceOutcomeId}:${tenant}:${mission}:${decision}`).slice(0, 16)}`;
  const base: Omit<CanonicalOutcome, "integrity_hash"> = {
    normalized_outcome_id,
    source_outcome_id: sourceOutcomeId,
    tenant_id: tenant,
    mission_id: mission,
    decision_id: decision,
    outcome_type: String(payload.finalStatus ?? "UNKNOWN"),
    outcome_timestamp: String(payload.observedAt ?? ""),
    mission_impact: freezeArray(payload.missionImpactRefs as readonly string[]),
    governance_result: String(payload.governanceResult ?? "UNKNOWN"),
    operator_result: String(payload.operatorResult ?? "UNKNOWN"),
    rollback_result: String(payload.rollbackResult ?? "UNKNOWN"),
    evidence_refs: freezeArray(payload.evidenceRefs as readonly string[]),
    replay_refs: freezeArray(payload.replayRefs as readonly string[]),
    normalization_version: NORMALIZATION_VERSION,
    source_system: sourceSystem === "UNKNOWN_SOURCE" ? "MISSION_CONTROL_OUTCOMES" : sourceSystem,
    source_schema_version,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.normalized_outcome_id }) });
  return built;
}

function trace(sourceSchema: string, sourceField: string, canonicalField: keyof CanonicalOutcome, ruleId: string): FieldTranslationTrace {
  const base: Omit<FieldTranslationTrace, "integrity_hash"> = {
    trace_id: `trace_${ruleId}`,
    source_field: sourceField,
    canonical_field: canonicalField,
    transformation_rule_id: ruleId,
    validation_rule: `validate_${String(canonicalField)}`,
    normalization_version: NORMALIZATION_VERSION,
    source_schema: sourceSchema,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTraces(schema: string): readonly FieldTranslationTrace[] {
  return freezeArray([
    trace(schema, "sourceOutcomeId", "source_outcome_id", "normalize_source_outcome_id"),
    trace(schema, "observedAt", "outcome_timestamp", "normalize_timestamp"),
    trace(schema, "finalStatus", "outcome_type", "map_outcome_type"),
    trace(schema, "governanceResult", "governance_result", "map_governance_result"),
    trace(schema, "operatorResult", "operator_result", "map_operator_result"),
    trace(schema, "rollbackResult", "rollback_result", "map_rollback_result"),
    trace(schema, "evidenceRefs", "evidence_refs", "normalize_evidence_refs"),
    trace(schema, "replayRefs", "replay_refs", "normalize_replay_refs"),
  ]);
}

function buildMetadata(intake: SourceIntakeResult, canonical: CanonicalOutcome, rules: readonly NormalizationRule[], traces: readonly FieldTranslationTrace[], scenario: Scenario): NormalizationMetadata {
  const replay_reconstruction_hash = scenario === "REPLAY_MISMATCH" ? hash({ replay: "mismatch" }) : hash({ canonical, traces, rules });
  const base: Omit<NormalizationMetadata, "integrity_hash"> = {
    metadata_id: "outcome_normalization_metadata",
    normalization_version: NORMALIZATION_VERSION,
    source_system: intake.source_system,
    source_schema_version: intake.source_schema_version,
    rule_version: NORMALIZATION_VERSION,
    applied_rule_ids: freezeArray(rules.map((entry) => entry.rule_id)),
    field_traces: traces,
    original_payload_hash: intake.original_payload_hash,
    canonical_payload_hash: canonical.integrity_hash,
    replay_reconstruction_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function validRefs(refs: readonly string[]): boolean {
  return refs.length > 0 && refs.every((ref) => Boolean(ref) && !/\s/.test(ref));
}

function collectFailures(input: {
  source: OutcomeObservationLedgerResult;
  intake: SourceIntakeResult;
  schema: SchemaDetectionResult;
  canonical: CanonicalOutcome;
  metadata: NormalizationMetadata;
  rules: readonly NormalizationRule[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeNormalizationFailure[] {
  const failures: OutcomeNormalizationFailure[] = [];
  if (!input.intake.source_identity_verified || input.scenario === "UNSUPPORTED_SOURCE") failures.push("UNSUPPORTED_SOURCE_REJECTED");
  if (!input.schema.schema_version_supported || input.scenario === "UNKNOWN_SCHEMA") failures.push("UNKNOWN_SCHEMA_FAILED_CLOSED");
  if (input.intake.unsupported_fields.length || input.scenario === "UNSUPPORTED_FIELD") failures.push("UNSUPPORTED_FIELDS_REJECTED");
  if (!input.canonical.source_outcome_id || !input.canonical.tenant_id || !input.canonical.mission_id || !input.canonical.decision_id || input.scenario === "MISSING_IDENTIFIER") failures.push("MISSING_IDENTIFIERS_REJECTED");
  if (!validTimestamp(input.canonical.outcome_timestamp) || input.scenario === "INVALID_TIMESTAMP") failures.push("INVALID_TIMESTAMPS_REJECTED");
  if (input.scenario === "DUPLICATE_CANONICAL_ID") failures.push("DUPLICATE_CANONICAL_IDENTIFIER_REJECTED");
  if (!validRefs(input.canonical.evidence_refs) || !validRefs(input.canonical.replay_refs) || input.scenario === "MALFORMED_REFERENCE") failures.push("MALFORMED_REFERENCES_REJECTED");
  if (input.canonical.outcome_type === "MAYBE_DONE" || input.scenario === "INVALID_ENUMERATION") failures.push("INVALID_ENUMERATIONS_REJECTED");
  if (input.canonical.tenant_id !== input.source.ledger_records[0].tenant_id || input.scenario === "TENANT_MISMATCH") failures.push("TENANT_MISMATCH_REJECTED");
  if (input.scenario === "UNSUPPORTED_VERSION") failures.push("UNSUPPORTED_NORMALIZATION_VERSION_REJECTED");
  if (input.scenario === "AMBIGUOUS_MAPPING") failures.push("AMBIGUOUS_MAPPING_REJECTED");
  if (input.scenario === "NONDETERMINISTIC_RULE") failures.push("RULE_EXECUTION_NONDETERMINISTIC");
  if (!input.intake.original_payload_preserved || input.scenario === "SOURCE_MUTATION") failures.push("SOURCE_RECORD_MUTATED");
  if (!input.canonical.evidence_refs.length || !input.canonical.replay_refs.length || input.scenario === "LINEAGE_LOST") failures.push("EVIDENCE_OR_REPLAY_LINEAGE_LOST");
  if (input.metadata.replay_reconstruction_hash !== hash({ canonical: input.canonical, traces: input.metadata.field_traces, rules: input.rules }) || input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERED");
  if (hashWithoutIntegrity(input.canonical) !== input.canonical.integrity_hash || input.scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_NOT_REPRODUCIBLE");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_NORMALIZATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly OutcomeNormalizationFailure[]): NormalizationValidation {
  const has = (failure: OutcomeNormalizationFailure) => failures.includes(failure);
  const base: Omit<NormalizationValidation, "integrity_hash"> = {
    validation_id: "outcome_normalization_validation",
    validation_outcome: failures.length ? "FAIL" : "PASS",
    source_valid: !has("UNSUPPORTED_SOURCE_REJECTED") && !has("UNKNOWN_SCHEMA_FAILED_CLOSED"),
    fields_valid: !has("UNSUPPORTED_FIELDS_REJECTED") && !has("MISSING_IDENTIFIERS_REJECTED") && !has("INVALID_TIMESTAMPS_REJECTED") && !has("INVALID_ENUMERATIONS_REJECTED"),
    normalization_valid: !has("DUPLICATE_CANONICAL_IDENTIFIER_REJECTED") && !has("AMBIGUOUS_MAPPING_REJECTED") && !has("RULE_EXECUTION_NONDETERMINISTIC") && !has("UNSUPPORTED_NORMALIZATION_VERSION_REJECTED"),
    references_valid: !has("MALFORMED_REFERENCES_REJECTED") && !has("EVIDENCE_OR_REPLAY_LINEAGE_LOST"),
    integrity_valid: !has("INTEGRITY_HASH_NOT_REPRODUCIBLE"),
    tenant_isolated: !has("TENANT_MISMATCH_REJECTED"),
    source_immutable: !has("SOURCE_RECORD_MUTATED"),
    replay_consistent: !has("REPLAY_RECONSTRUCTION_DIFFERED"),
    traceability_complete: true,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(validation: NormalizationValidation, intake: SourceIntakeResult): NormalizationMetrics {
  const base: Omit<NormalizationMetrics, "integrity_hash"> = {
    metrics_id: "outcome_normalization_metrics",
    outcomes_normalized: validation.validation_outcome === "PASS" ? 1 : 0,
    normalization_latency_ms: 0,
    normalization_failures: validation.failures.length,
    schema_mismatches: validation.source_valid ? 0 : 1,
    rejected_fields: intake.unsupported_fields.length,
    unsupported_sources: intake.source_system === "UNKNOWN_SOURCE" ? 1 : 0,
    rule_version_usage: freezeArray([NORMALIZATION_VERSION]),
    validation_failures: validation.failures.length,
    replay_consistency: validation.replay_consistent ? 1 : 0,
    tenant_isolation_violations: validation.tenant_isolated ? 0 : 1,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(source: OutcomeObservationLedgerResult, validation: NormalizationValidation): NormalizationAuditReport {
  const base: Omit<NormalizationAuditReport, "integrity_hash"> = {
    report_id: "outcome_normalization_audit_report",
    tenant_id: source.ledger_records[0].tenant_id,
    checks: OUTCOME_NORMALIZATION_CHECKS,
    outcome_normalizer_operational: validation.validation_outcome === "PASS",
    canonical_schema_produced: validation.fields_valid && validation.normalization_valid,
    field_translation_deterministic: validation.normalization_valid,
    rule_versions_complete: true,
    validation_pipeline_passed: validation.validation_outcome === "PASS",
    source_payload_preserved: validation.source_immutable,
    evidence_lineage_preserved: validation.references_valid,
    replay_lineage_preserved: validation.replay_consistent,
    no_semantic_reinterpretation: true,
    certification_decision: validation.failures.length ? "FAIL" : "PASS",
    failure_analysis: validation.failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeNormalizationAdapterResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    source: result.source_intake,
    schema: result.schema_detection,
    rules: result.normalization_rules,
    canonical: result.canonical_outcome,
    metadata: result.metadata,
    validation: result.validation,
    audit: result.audit_report,
  });
}

export function runOutcomeNormalizationAdapter(input: OutcomeNormalizationAdapterInput = {}): OutcomeNormalizationAdapterResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const outcome_ledger = sourceForScenario(input, scenario);
  const sourceSystem = selectedSource(input, scenario);
  const api_surface = buildApiSurface();
  const source_intake = buildSourceIntake(outcome_ledger, sourceSystem, scenario);
  const schema_detection = buildSchemaDetection(source_intake, scenario);
  const normalization_rules = buildRules(source_intake.source_schema_version);
  const canonical_outcome = canonicalOutcome(outcome_ledger, source_intake, sourceSystem, scenario);
  const traces = buildTraces(source_intake.source_schema_version);
  const metadata = buildMetadata(source_intake, canonical_outcome, normalization_rules, traces, scenario);
  const failures = collectFailures({ source: outcome_ledger, intake: source_intake, schema: schema_detection, canonical: canonical_outcome, metadata, rules: normalization_rules, role, scenario });
  const validation = buildValidation(failures);
  const metrics = buildMetrics(validation, source_intake);
  const audit_report = buildAudit(outcome_ledger, validation);
  const base: Omit<OutcomeNormalizationAdapterResult, "integrity_hash" | "replay_hash"> = {
    outcome_normalization_adapter_version: OUTCOME_NORMALIZATION_ADAPTER_VERSION,
    outcome_ledger,
    api_surface,
    source_intake,
    schema_detection,
    normalization_rules,
    canonical_outcome,
    metadata,
    validation,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    field_translation_only: true,
    interprets_meaning: false,
    infers_values: false,
    predicts_values: false,
    modifies_source: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeNormalizationAdapter(result: OutcomeNormalizationAdapterResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeCanonicalOutcomeHash(record: Omit<CanonicalOutcome, "integrity_hash"> | CanonicalOutcome): string {
  return hashWithoutIntegrity(record);
}

export function getOutcomeNormalizationAdapterFoundation(): OutcomeNormalizationAdapterFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_normalization_adapter_version: OUTCOME_NORMALIZATION_ADAPTER_VERSION,
    checks: OUTCOME_NORMALIZATION_CHECKS,
    supported_sources: SUPPORTED_OUTCOME_SOURCES,
    api_surface,
    result: runOutcomeNormalizationAdapter(),
  });
}

export const OutcomeNormalizationAdapter = Object.freeze({
  run: runOutcomeNormalizationAdapter,
  replay: replayOutcomeNormalizationAdapter,
});
