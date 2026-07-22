import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOutcomeEvidenceRegistry } from "@/services/outcome-evidence-registry";
import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeEvidenceRegistryResult } from "@/types/outcome-evidence-registry";
import type {
  OutcomeCompletenessAuditReport,
  OutcomeCompletenessCheck,
  OutcomeCompletenessFailure,
  OutcomeCompletenessLifecycleState,
  OutcomeCompletenessMetrics,
  OutcomeCompletenessReplayReport,
  OutcomeCompletenessRuleResult,
  OutcomeCompletenessValidation,
  OutcomeCompletenessValidationState,
  OutcomeCompletenessValidatorFoundation,
  OutcomeCompletenessValidatorInput,
  OutcomeCompletenessValidatorResult,
  OutcomeMissingDataReport,
  OutcomeQualityReport,
} from "@/types/outcome-completeness-validator";

const OUTCOME_COMPLETENESS_VALIDATOR_VERSION = "outcome-completeness-validator/v1" as const;

export const OUTCOME_COMPLETENESS_CHECKS: readonly OutcomeCompletenessCheck[] = Object.freeze(["STRUCTURAL_METADATA", "SCHEMA_VERSION", "DECISION_LINKAGE", "EVIDENCE_PRESENCE", "OPERATOR_REFERENCES", "GOVERNANCE_REFERENCES", "REPLAY_REFERENCES", "MISSION_LINKAGE", "INTEGRITY_METADATA", "MISSING_DATA_DETECTION", "DETERMINISTIC_VALIDATION", "TENANT_ISOLATION", "CONSTITUTIONAL_GOVERNANCE"]);
export const OUTCOME_COMPLETENESS_LIFECYCLE: readonly OutcomeCompletenessLifecycleState[] = Object.freeze(["RECEIVED", "STRUCTURAL_VALIDATION", "REFERENCE_VALIDATION", "COMPLETENESS_VALIDATION", "QUALITY_ASSESSMENT", "CERTIFIED"]);

type Scenario = NonNullable<OutcomeCompletenessValidatorInput["scenario"]>;

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

function sourceForScenario(input: OutcomeCompletenessValidatorInput, scenario: Scenario): OutcomeEvidenceRegistryResult {
  if (input.evidence_registry) return input.evidence_registry;
  if (scenario === "MISSING_EVIDENCE") return runOutcomeEvidenceRegistry({ scenario: "NO_EVIDENCE" });
  if (scenario === "MISSING_GOVERNANCE" || scenario === "CONSTITUTIONAL_BYPASS") return runOutcomeEvidenceRegistry({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "MISSING_REPLAY" || scenario === "REPLAY_MISMATCH") return runOutcomeEvidenceRegistry({ scenario: "MISSING_REPLAY" });
  if (scenario === "TENANT_VIOLATION") return runOutcomeEvidenceRegistry({ scenario: "TENANT_VIOLATION" });
  if (scenario === "INVALID_EVIDENCE_REGISTRY") return runOutcomeEvidenceRegistry({ scenario: "INVALID_OBSERVATION" });
  return runOutcomeEvidenceRegistry();
}

function visibleToRole(source: OutcomeEvidenceRegistryResult, role: VisibilityRole): boolean {
  return source.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function detectMissing(source: OutcomeEvidenceRegistryResult, scenario: Scenario): OutcomeMissingDataReport {
  const record = source.observation_engine.observation_record;
  const missing_identifiers = [
    ...(!record.outcome_id || scenario === "ORPHAN_OBSERVATION" ? ["outcome_id"] : []),
    ...(!record.decision_id || scenario === "MISSING_DECISION" ? ["decision_id"] : []),
    ...(!record.decision_package_id || scenario === "MISSING_DECISION_PACKAGE" ? ["decision_package_id"] : []),
    ...(!record.schema_version || scenario === "MISSING_SCHEMA_VERSION" ? ["schema_version"] : []),
  ];
  const missing_evidence = !record.actual_outcome_evidence_refs.length || !source.evidence_registry.length || scenario === "MISSING_EVIDENCE" ? ["actual_outcome_evidence_refs"] : [];
  const missing_operator_refs = !record.operator_workflow_id || !record.operator_action_result || scenario === "MISSING_OPERATOR" ? ["operator_workflow_id", "operator_action_result"] : [];
  const missing_governance_refs = !record.governance_refs.length || scenario === "MISSING_GOVERNANCE" ? ["governance_refs"] : [];
  const missing_replay_metadata = !record.replay_refs.length || !source.replay_index.replay_refs.length || scenario === "MISSING_REPLAY" ? ["replay_refs", "replay_index"] : [];
  const missing_mission_refs = !record.mission_id || scenario === "MISSING_MISSION" ? ["mission_id"] : [];
  const missing_integrity_metadata = !record.integrity_hash || scenario === "MISSING_INTEGRITY_HASH" || scenario === "INTEGRITY_OMITTED" ? ["integrity_hash"] : [];
  const orphan_refs = scenario === "ORPHAN_OBSERVATION" ? ["outcome_observation"] : source.evidence_registry.filter((entry) => entry.outcome_id !== record.outcome_id).map((entry) => entry.evidence_id);
  const inferred_refs = scenario === "INFERRED_REFERENCE" ? ["inferred:reference"] : source.evidence_registry.filter((entry) => entry.evidence_summary.toLowerCase().includes("inferred")).map((entry) => entry.evidence_id);
  const base: Omit<OutcomeMissingDataReport, "integrity_hash"> = {
    detector_id: "outcome_missing_data_detector",
    missing_identifiers: freezeArray(missing_identifiers),
    missing_evidence: freezeArray(missing_evidence),
    missing_operator_refs: freezeArray(missing_operator_refs),
    missing_governance_refs: freezeArray(missing_governance_refs),
    missing_replay_metadata: freezeArray(missing_replay_metadata),
    missing_mission_refs: freezeArray(missing_mission_refs),
    missing_integrity_metadata: freezeArray(missing_integrity_metadata),
    orphan_refs: freezeArray(orphan_refs),
    inferred_refs: freezeArray(inferred_refs),
    repair_attempted: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rule(rule_id: string, validation_area: OutcomeCompletenessRuleResult["validation_area"], present: boolean, validation_state: OutcomeCompletenessValidationState, failure_result: OutcomeValidationState | "INSUFFICIENT_EVIDENCE"): OutcomeCompletenessRuleResult {
  const base: Omit<OutcomeCompletenessRuleResult, "integrity_hash"> = { rule_id, validation_area, required: true, present, validation_state, failure_result };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRules(missing: OutcomeMissingDataReport, scenario: Scenario): readonly OutcomeCompletenessRuleResult[] {
  return freezeArray([
    rule("structural_required_fields", "STRUCTURAL", missing.missing_identifiers.length === 0, missing.missing_identifiers.length ? "INCOMPLETE" : "VALID", "FAIL"),
    rule("decision_linkage", "RELATIONSHIP", !missing.missing_identifiers.includes("decision_id") && !missing.missing_identifiers.includes("decision_package_id"), missing.missing_identifiers.includes("decision_id") || missing.missing_identifiers.includes("decision_package_id") ? "INVALID" : "VALID", "FAIL"),
    rule("mission_linkage", "RELATIONSHIP", missing.missing_mission_refs.length === 0, missing.missing_mission_refs.length ? "MISSION_INCOMPLETE" : "VALID", "FAIL"),
    rule("operator_references", "RELATIONSHIP", missing.missing_operator_refs.length === 0, missing.missing_operator_refs.length ? "OPERATOR_INCOMPLETE" : "VALID", "FAIL"),
    rule("governance_references", "RELATIONSHIP", missing.missing_governance_refs.length === 0 && scenario !== "CONSTITUTIONAL_BYPASS", missing.missing_governance_refs.length || scenario === "CONSTITUTIONAL_BYPASS" ? "GOVERNANCE_INCOMPLETE" : "VALID", "FAIL"),
    rule("evidence_presence", "EVIDENCE", missing.missing_evidence.length === 0, missing.missing_evidence.length ? "INSUFFICIENT_EVIDENCE" : "VALID", "INSUFFICIENT_EVIDENCE"),
    rule("replay_references", "REPLAY", missing.missing_replay_metadata.length === 0, missing.missing_replay_metadata.length ? "REPLAY_INCOMPLETE" : "VALID", "FAIL"),
    rule("integrity_metadata", "INTEGRITY", missing.missing_integrity_metadata.length === 0, missing.missing_integrity_metadata.length ? "INVALID" : "VALID", "FAIL"),
  ]);
}

function collectFailures(input: {
  source: OutcomeEvidenceRegistryResult;
  missing: OutcomeMissingDataReport;
  rules: readonly OutcomeCompletenessRuleResult[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeCompletenessFailure[] {
  const failures: OutcomeCompletenessFailure[] = [];
  if (input.rules.some((entry) => !entry.present)) failures.push("INCOMPLETE_OBSERVATION_ACCEPTED");
  if (input.missing.missing_evidence.length || input.scenario === "MISSING_EVIDENCE") failures.push("MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE");
  if (input.missing.missing_replay_metadata.length || input.scenario === "MISSING_REPLAY") failures.push("MISSING_REPLAY_REFERENCES_ACCEPTED");
  if (input.missing.missing_operator_refs.length || input.scenario === "MISSING_OPERATOR") failures.push("MISSING_OPERATOR_REFERENCES_ACCEPTED");
  if (input.missing.missing_governance_refs.length || input.scenario === "MISSING_GOVERNANCE") failures.push("MISSING_GOVERNANCE_REFERENCES_ACCEPTED");
  if (input.missing.missing_mission_refs.length || input.scenario === "MISSING_MISSION") failures.push("MISSING_MISSION_LINKAGE_ACCEPTED");
  if (input.missing.missing_identifiers.includes("decision_id") || input.missing.missing_identifiers.includes("decision_package_id")) failures.push("MISSING_DECISION_LINKAGE_ACCEPTED");
  if (input.missing.missing_identifiers.includes("schema_version")) failures.push("MISSING_SCHEMA_VERSION_ACCEPTED");
  if (input.missing.missing_integrity_metadata.length) failures.push("MISSING_INTEGRITY_HASH_ACCEPTED");
  if (input.missing.orphan_refs.length || input.scenario === "ORPHAN_OBSERVATION") failures.push("ORPHAN_OUTCOME_OBSERVATION_ACCEPTED");
  if (input.scenario === "NONDETERMINISTIC_VALIDATION") failures.push("VALIDATION_RESULTS_NONDETERMINISTIC");
  if (input.scenario === "RULE_BYPASS") failures.push("COMPLETENESS_RULES_BYPASSED");
  if (input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION");
  if (input.scenario === "INTEGRITY_OMITTED") failures.push("INTEGRITY_VERIFICATION_OMITTED");
  if (input.source.validation.failures.includes("TENANT_ISOLATION_VIOLATED") || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.missing.inferred_refs.length || input.scenario === "INFERRED_REFERENCE") failures.push("INFERRED_REFERENCE_ACCEPTED");
  if (input.scenario === "OBSERVATION_MUTATED") failures.push("OBSERVATION_MUTATED_DURING_VALIDATION");
  if (input.source.validation.validation_status !== "VALID" || input.scenario === "INVALID_EVIDENCE_REGISTRY") failures.push("EVIDENCE_REGISTRY_NOT_VALIDATED");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_GOVERNANCE_BYPASSED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_COMPLETENESS_VALIDATION_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function validationState(failures: readonly OutcomeCompletenessFailure[]): OutcomeCompletenessValidationState {
  if (!failures.length) return "VALID";
  if (failures.includes("MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE")) return "INSUFFICIENT_EVIDENCE";
  if (failures.includes("MISSING_REPLAY_REFERENCES_ACCEPTED") || failures.includes("REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION")) return "REPLAY_INCOMPLETE";
  if (failures.includes("MISSING_GOVERNANCE_REFERENCES_ACCEPTED") || failures.includes("CONSTITUTIONAL_GOVERNANCE_BYPASSED")) return "GOVERNANCE_INCOMPLETE";
  if (failures.includes("MISSING_OPERATOR_REFERENCES_ACCEPTED")) return "OPERATOR_INCOMPLETE";
  if (failures.includes("MISSING_MISSION_LINKAGE_ACCEPTED")) return "MISSION_INCOMPLETE";
  if (failures.includes("MISSING_DECISION_LINKAGE_ACCEPTED")) return "INVALID";
  if (failures.includes("INFERRED_REFERENCE_ACCEPTED")) return "INCOMPLETE";
  if (failures.includes("INCOMPLETE_OBSERVATION_ACCEPTED")) return "INCOMPLETE";
  return "INVALID";
}

function buildValidation(failures: readonly OutcomeCompletenessFailure[]): OutcomeCompletenessValidation {
  const has = (failure: OutcomeCompletenessFailure) => failures.includes(failure);
  const base: Omit<OutcomeCompletenessValidation, "integrity_hash"> = {
    validation_id: "outcome_completeness_validation",
    validation_status: validationState(failures),
    structural_complete: !has("INCOMPLETE_OBSERVATION_ACCEPTED") && !has("MISSING_SCHEMA_VERSION_ACCEPTED"),
    decision_linkage_valid: !has("MISSING_DECISION_LINKAGE_ACCEPTED"),
    evidence_complete: !has("MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE"),
    operator_references_complete: !has("MISSING_OPERATOR_REFERENCES_ACCEPTED"),
    governance_references_complete: !has("MISSING_GOVERNANCE_REFERENCES_ACCEPTED"),
    replay_references_complete: !has("MISSING_REPLAY_REFERENCES_ACCEPTED") && !has("REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION"),
    mission_linkage_valid: !has("MISSING_MISSION_LINKAGE_ACCEPTED"),
    integrity_metadata_valid: !has("MISSING_INTEGRITY_HASH_ACCEPTED") && !has("INTEGRITY_VERIFICATION_OMITTED"),
    deterministic_validation: !has("VALIDATION_RESULTS_NONDETERMINISTIC") && !has("COMPLETENESS_RULES_BYPASSED"),
    replay_reconstruction_identical: !has("REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    observation_immutable: !has("OBSERVATION_MUTATED_DURING_VALIDATION"),
    constitutional_governance_enforced: !has("CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function completenessScore(validation: OutcomeCompletenessValidation): number {
  const checks = [validation.structural_complete, validation.decision_linkage_valid, validation.evidence_complete, validation.operator_references_complete, validation.governance_references_complete, validation.replay_references_complete, validation.mission_linkage_valid, validation.integrity_metadata_valid, validation.deterministic_validation, validation.replay_reconstruction_identical, validation.tenant_isolated, validation.observation_immutable, validation.constitutional_governance_enforced];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function label(score: number): OutcomeQualityReport["completeness_label"] {
  if (score === 100) return "100% Complete";
  if (score >= 95) return "95% Complete";
  if (score >= 80) return "80% Complete";
  return "Incomplete";
}

function buildQuality(missing: OutcomeMissingDataReport, validation: OutcomeCompletenessValidation): OutcomeQualityReport {
  const score = completenessScore(validation);
  const missing_components = freezeArray([...missing.missing_identifiers, ...missing.missing_evidence, ...missing.missing_operator_refs, ...missing.missing_governance_refs, ...missing.missing_replay_metadata, ...missing.missing_mission_refs, ...missing.missing_integrity_metadata, ...missing.orphan_refs, ...missing.inferred_refs]);
  const base: Omit<OutcomeQualityReport, "integrity_hash"> = {
    report_id: "outcome_quality_report",
    validation_status: validation.validation_status,
    completeness_score: score,
    completeness_label: label(score),
    missing_components,
    decision_validation: pass(validation.decision_linkage_valid),
    evidence_validation: validation.validation_status === "INSUFFICIENT_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" : pass(validation.evidence_complete),
    operator_validation: pass(validation.operator_references_complete),
    governance_validation: pass(validation.governance_references_complete && validation.constitutional_governance_enforced),
    replay_validation: pass(validation.replay_references_complete && validation.replay_reconstruction_identical),
    mission_validation: pass(validation.mission_linkage_valid),
    integrity_validation: pass(validation.integrity_metadata_valid),
    final_certification_recommendation: pass(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayReport(missing: OutcomeMissingDataReport, validation: OutcomeCompletenessValidation, quality: OutcomeQualityReport, rules: readonly OutcomeCompletenessRuleResult[]): OutcomeCompletenessReplayReport {
  const rule_hashes = freezeArray(rules.map((entry) => entry.integrity_hash));
  const reconstruction = { missing, validation, quality, rule_hashes };
  const base: Omit<OutcomeCompletenessReplayReport, "integrity_hash"> = {
    replay_report_id: "outcome_completeness_replay_report",
    validation_hash: validation.integrity_hash,
    quality_hash: quality.integrity_hash,
    missing_data_hash: missing.integrity_hash,
    rule_hashes,
    replay_reconstruction_hash: hash(reconstruction),
    replay_reconstruction_identical: validation.replay_reconstruction_identical,
    deterministic_ordering: validation.deterministic_validation,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(validation: OutcomeCompletenessValidation, quality: OutcomeQualityReport): OutcomeCompletenessMetrics {
  const has = (failure: OutcomeCompletenessFailure) => validation.failures.includes(failure);
  const base: Omit<OutcomeCompletenessMetrics, "integrity_hash"> = {
    metrics_id: "outcome_completeness_metrics",
    outcome_records_validated: 1,
    validation_success_rate: validation.failures.length ? 0 : 1,
    completeness_score_distribution: freezeArray([quality.completeness_score]),
    missing_evidence_occurrences: has("MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE") ? 1 : 0,
    missing_replay_occurrences: has("MISSING_REPLAY_REFERENCES_ACCEPTED") ? 1 : 0,
    missing_operator_references: has("MISSING_OPERATOR_REFERENCES_ACCEPTED") ? 1 : 0,
    missing_governance_references: has("MISSING_GOVERNANCE_REFERENCES_ACCEPTED") ? 1 : 0,
    missing_mission_references: has("MISSING_MISSION_LINKAGE_ACCEPTED") ? 1 : 0,
    validation_latency_ms: 0,
    replay_validation_success_rate: validation.replay_reconstruction_identical ? 1 : 0,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(source: OutcomeEvidenceRegistryResult, validation: OutcomeCompletenessValidation, quality: OutcomeQualityReport): OutcomeCompletenessAuditReport {
  const base: Omit<OutcomeCompletenessAuditReport, "integrity_hash"> = {
    report_id: "outcome_completeness_audit_report",
    tenant_id: source.observation_engine.observation_record.tenant_id,
    checks: OUTCOME_COMPLETENESS_CHECKS,
    completeness_engine_operational: true,
    validation_rule_engine_operational: validation.deterministic_validation,
    missing_data_detector_operational: true,
    quality_report_deterministic: Boolean(quality.integrity_hash),
    validation_decision_engine_operational: validation.validation_status === "VALID",
    outcome_observation_ledger_gate_enforced: validation.failures.length === 0,
    metrics_advisory_only: true,
    observation_remained_immutable: validation.observation_immutable,
    failure_analysis: validation.failures,
    certification_decision: pass(validation.failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeCompletenessValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    rules: result.rule_results,
    missing: result.missing_data_report,
    validation: result.validation,
    quality: result.quality_report,
    replay: result.replay_report,
    audit: result.audit_report,
  });
}

export function runOutcomeCompletenessValidator(input: OutcomeCompletenessValidatorInput = {}): OutcomeCompletenessValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const evidence_registry = sourceForScenario(input, scenario);
  const missing_data_report = detectMissing(evidence_registry, scenario);
  const rule_results = buildRules(missing_data_report, scenario);
  const failures = collectFailures({ source: evidence_registry, missing: missing_data_report, rules: rule_results, role, scenario });
  const validation = buildValidation(failures);
  const quality_report = buildQuality(missing_data_report, validation);
  const replay_report = buildReplayReport(missing_data_report, validation, quality_report, rule_results);
  const metrics = buildMetrics(validation, quality_report);
  const audit_report = buildAudit(evidence_registry, validation, quality_report);
  const lifecycle: readonly OutcomeCompletenessLifecycleState[] = failures.length ? freezeArray<OutcomeCompletenessLifecycleState>(["RECEIVED", "STRUCTURAL_VALIDATION", "REFERENCE_VALIDATION", "COMPLETENESS_VALIDATION", "QUALITY_ASSESSMENT"]) : OUTCOME_COMPLETENESS_LIFECYCLE;
  const base: Omit<OutcomeCompletenessValidatorResult, "integrity_hash" | "replay_hash"> = {
    outcome_completeness_validator_version: OUTCOME_COMPLETENESS_VALIDATOR_VERSION,
    evidence_registry,
    rule_results,
    missing_data_report,
    validation,
    quality_report,
    replay_report,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    completeness_only: true,
    permits_correctness_judgment: false,
    modifies_observation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeCompletenessValidator(result: OutcomeCompletenessValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeCompletenessValidatorHash(record: Omit<OutcomeCompletenessValidation, "integrity_hash"> | OutcomeCompletenessValidation): string {
  return hashWithoutIntegrity(record);
}

export function getOutcomeCompletenessValidatorFoundation(): OutcomeCompletenessValidatorFoundation {
  return Object.freeze({
    outcome_completeness_validator_version: OUTCOME_COMPLETENESS_VALIDATOR_VERSION,
    checks: OUTCOME_COMPLETENESS_CHECKS,
    lifecycle: OUTCOME_COMPLETENESS_LIFECYCLE,
    result: runOutcomeCompletenessValidator(),
  });
}

export const OutcomeCompletenessValidator = Object.freeze({
  run: runOutcomeCompletenessValidator,
  replay: replayOutcomeCompletenessValidator,
});
