import { runAuthorityGovernanceBinding } from "@/services/authority-governance-binding";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AuthorityGovernanceBindingResult } from "@/types/authority-governance-binding";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AdaptiveLineageContract,
  AdaptiveReplayCertificationReport,
  AdaptiveReplayCheck,
  AdaptiveReplayFailure,
  AdaptiveReplayMetadata,
  AdaptiveReplayRecord,
  AdaptiveReplayTraceabilityFoundation,
  AdaptiveReplayTraceabilityInput,
  AdaptiveReplayTraceabilityResult,
  AdaptiveReplayType,
  AdaptiveReplayValidation,
  AdaptiveReplayValidationState,
  AdaptiveReplayVerification,
  AdaptiveTraceabilityLedgerRecord,
} from "@/types/adaptive-replay-traceability-contract";

const REPLAY_CONTRACT_VERSION = "adaptive-replay-traceability-contract/v1" as const;

export const ADAPTIVE_REPLAY_CHECKS: readonly AdaptiveReplayCheck[] = Object.freeze(["AUTHORITY_BINDING", "REPLAY_METADATA", "INPUT_LINEAGE", "PROCESSING_LINEAGE", "OUTPUT_LINEAGE", "EVIDENCE_TRACEABILITY", "SIMULATION_TRACEABILITY", "GOVERNANCE_TRACEABILITY", "OPERATOR_TRACEABILITY", "CERTIFICATION_TRACEABILITY", "DETERMINISTIC_RECONSTRUCTION", "INTEGRITY_VERIFICATION", "LEDGER_IMMUTABILITY"]);
export const ADAPTIVE_REPLAY_TYPES: readonly AdaptiveReplayType[] = Object.freeze(["HISTORICAL_REPLAY", "PROPOSAL_REPLAY", "SIMULATION_REPLAY", "GOVERNANCE_REPLAY", "CERTIFICATION_REPLAY", "OPERATOR_DECISION_REPLAY", "ROLLBACK_REPLAY", "FULL_LIFECYCLE_REPLAY"]);

type Scenario = NonNullable<AdaptiveReplayTraceabilityInput["scenario"]>;

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

function state(pass: boolean): AdaptiveReplayValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AuthorityGovernanceBindingResult) {
  return {
    tenant_id: source.binding.tenant_id,
    mission_scope: source.binding.mission_scope,
    adaptation_id: source.adaptation_state.state_record.adaptation_id,
    proposal_id: source.adaptation_state.state_record.proposal_id,
  };
}

function visibleToRole(source: AuthorityGovernanceBindingResult, role: VisibilityRole): boolean {
  return source.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildRecord(source: AuthorityGovernanceBindingResult, input: AdaptiveReplayTraceabilityInput, scenario: Scenario): AdaptiveReplayRecord {
  const c = ctx(source);
  const base: Omit<AdaptiveReplayRecord, "integrity_hash"> = {
    replay_id: scenario === "MISSING_REPLAY_ID" ? "" : "adaptive_replay_traceability_001",
    replay_version: "10.0.6",
    adaptation_id: c.adaptation_id,
    proposal_id: c.proposal_id,
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    replay_type: input.replay_type ?? "FULL_LIFECYCLE_REPLAY",
    input_lineage_refs: scenario === "MISSING_INPUT_LINEAGE" ? freezeArray([]) : freezeArray(["observation:adaptive-quality", "evidence:recommendation-history", source.adaptation_state.learning_permission.request.request_id]),
    output_lineage_refs: scenario === "MISSING_OUTPUT_LINEAGE" ? freezeArray([]) : freezeArray(["recommendation:quality-adjustment", "confidence:calibration-summary"]),
    evidence_refs: scenario === "MISSING_EVIDENCE" || scenario === "EVIDENCE_SUBSTITUTION" ? freezeArray([]) : freezeArray([source.adaptation_state.learning_permission.registry.registry_id, source.authority_decision.decision_id]),
    simulation_refs: scenario === "MISSING_SIMULATION" || scenario === "SIMULATION_OMISSION" ? freezeArray([]) : freezeArray(["simulation:counterfactual:quality", source.adaptation_state.replay_model.replay_model_id]),
    governance_refs: scenario === "MISSING_GOVERNANCE" || scenario === "GOVERNANCE_OMISSION" ? freezeArray([]) : source.binding.governance_policy_refs,
    operator_refs: scenario === "MISSING_OPERATOR" || scenario === "OPERATOR_OMISSION" ? freezeArray([]) : freezeArray(["operator:adaptive-review", ...source.adaptation_state.transition_request.operator_refs]),
    certification_refs: scenario === "MISSING_CERTIFICATION" || scenario === "CERTIFICATION_OMISSION" ? freezeArray([]) : source.binding.certification_refs,
    replay_steps: scenario === "MISSING_REPLAY_STEPS" || scenario === "REPLAY_BYPASS" ? freezeArray([]) : freezeArray(["metadata-lookup", "lineage-reconstruction", "evidence-reconstruction", "simulation-reconstruction", "governance-reconstruction", "recommendation-reconstruction", "integrity-verification"]),
    replay_result: scenario === "REPLAY_RESULT_MISMATCH" ? "DIVERGED" : "MATCH",
    deterministic_verified: scenario !== "DETERMINISM_MISMATCH" && scenario !== "REPLAY_BYPASS",
    created_at: "2026-07-05T10:01:00.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" || scenario === "HISTORICAL_MUTATION") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.replay_id }) });
  return built;
}

function buildMetadata(source: AuthorityGovernanceBindingResult, record: AdaptiveReplayRecord, scenario: Scenario): AdaptiveReplayMetadata {
  const base: Omit<AdaptiveReplayMetadata, "integrity_hash"> = {
    metadata_id: "adaptive_replay_metadata",
    replay_id: record.replay_id,
    proposal_id: record.proposal_id,
    component_versions: scenario === "HIDDEN_PROCESSING" ? freezeArray([]) : freezeArray([source.binding_version, source.adaptation_state.state_machine_version, source.adaptation_state.learning_permission.registry_version]),
    adaptive_capability: source.adaptation_state.learning_permission.request.requested_capability,
    execution_timestamps: freezeArray([record.created_at, source.binding.created_at]),
    lifecycle_state: source.adaptation_state.transition_result.current_state,
    replay_environment: "deterministic-adaptive-replay",
    deterministic_verification: record.deterministic_verified,
    append_only: (scenario === "HISTORICAL_MUTATION" ? false : true) as true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(record: AdaptiveReplayRecord, scenario: Scenario): AdaptiveLineageContract {
  const base: Omit<AdaptiveLineageContract, "integrity_hash"> = {
    lineage_id: "adaptive_lineage_contract",
    replay_id: record.replay_id,
    input_lineage: record.input_lineage_refs,
    processing_lineage: scenario === "MISSING_PROCESSING_LINEAGE" || scenario === "HIDDEN_PROCESSING" ? freezeArray([]) : freezeArray(["analysis-engine", "adaptive-capability", "scoring-model", "simulation-engine", "governance-validation", "operator-review", "certification"]),
    output_lineage: record.output_lineage_refs,
    every_output_has_input: record.input_lineage_refs.length > 0 && record.output_lineage_refs.length > 0,
    reasoning_path_complete: scenario !== "UNDOCUMENTED_REASONING" && scenario !== "HIDDEN_PROCESSING",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildVerification(record: AdaptiveReplayRecord, lineage: AdaptiveLineageContract, scenario: Scenario): AdaptiveReplayVerification {
  const base: Omit<AdaptiveReplayVerification, "integrity_hash"> = {
    verification_id: "adaptive_replay_verification",
    replay_id: record.replay_id,
    identical_inputs: record.input_lineage_refs.length > 0,
    identical_evidence: record.evidence_refs.length > 0 && scenario !== "EVIDENCE_SUBSTITUTION",
    identical_processing_sequence: lineage.processing_lineage.length > 0,
    identical_governance_decisions: record.governance_refs.length > 0,
    identical_simulation_outcomes: record.simulation_refs.length > 0,
    identical_recommendations: record.output_lineage_refs.length > 0 && scenario !== "REPLAY_RESULT_MISMATCH",
    identical_integrity_hashes: scenario !== "HASH_MISMATCH" && scenario !== "HISTORICAL_MUTATION",
    verification_result: "PASS",
  };
  const normalized = { ...base, verification_result: state(base.identical_inputs && base.identical_evidence && base.identical_processing_sequence && base.identical_governance_decisions && base.identical_simulation_outcomes && base.identical_recommendations && base.identical_integrity_hashes && record.replay_result === "MATCH" && record.deterministic_verified) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function collectFailures(input: {
  authority: AuthorityGovernanceBindingResult;
  record: AdaptiveReplayRecord;
  metadata: AdaptiveReplayMetadata;
  lineage: AdaptiveLineageContract;
  verification: AdaptiveReplayVerification;
  ledger: readonly AdaptiveTraceabilityLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveReplayFailure[] {
  const failures: AdaptiveReplayFailure[] = [];
  if (input.authority.validation.validation_status !== "VALID" || !input.authority.authority_granted) failures.push("AUTHORITY_BINDING_INVALID");
  if (!input.record.replay_id) failures.push("REPLAY_IDENTIFIER_MISSING");
  if (!input.record.input_lineage_refs.length || !input.lineage.input_lineage.length) failures.push("INPUT_LINEAGE_INCOMPLETE");
  if (!input.record.output_lineage_refs.length || !input.lineage.output_lineage.length) failures.push("OUTPUT_LINEAGE_INCOMPLETE");
  if (!input.lineage.processing_lineage.length) failures.push("PROCESSING_LINEAGE_INCOMPLETE");
  if (!input.record.evidence_refs.length) failures.push("EVIDENCE_REFERENCES_MISSING");
  if (!input.record.simulation_refs.length) failures.push("SIMULATION_REFERENCES_MISSING");
  if (!input.record.governance_refs.length) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (!input.record.operator_refs.length) failures.push("OPERATOR_REFERENCES_MISSING");
  if (!input.record.certification_refs.length) failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (!input.record.replay_steps.length) failures.push("REPLAY_STEPS_MISSING");
  if (!input.record.deterministic_verified || !input.verification.verification_result || input.scenario === "DETERMINISM_MISMATCH") failures.push("DETERMINISTIC_RECONSTRUCTION_DIFFERED");
  if (input.record.replay_result !== "MATCH" || input.verification.verification_result !== "PASS") failures.push("REPLAY_RESULT_MISMATCH");
  if (
    hashWithoutIntegrity(input.record) !== input.record.integrity_hash
    || hashWithoutIntegrity(input.metadata) !== input.metadata.integrity_hash
    || hashWithoutIntegrity(input.lineage) !== input.lineage.integrity_hash
    || hashWithoutIntegrity(input.verification) !== input.verification.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "HIDDEN_PROCESSING") failures.push("HIDDEN_ADAPTIVE_PROCESSING");
  if (!input.lineage.reasoning_path_complete) failures.push("UNDOCUMENTED_REASONING");
  if (input.scenario === "REPLAY_BYPASS") failures.push("REPLAY_BYPASS");
  if (input.scenario === "EVIDENCE_SUBSTITUTION") failures.push("EVIDENCE_SUBSTITUTION");
  if (input.scenario === "SIMULATION_OMISSION") failures.push("SIMULATION_OMISSION");
  if (input.scenario === "GOVERNANCE_OMISSION") failures.push("GOVERNANCE_OMISSION");
  if (input.scenario === "OPERATOR_OMISSION") failures.push("OPERATOR_OMISSION");
  if (input.scenario === "CERTIFICATION_OMISSION") failures.push("CERTIFICATION_OMISSION");
  if (!input.metadata.append_only || input.scenario === "HISTORICAL_MUTATION") failures.push("HISTORICAL_RECORD_MUTATION");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted) || input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_REPLAY_BEHAVIOR");
  if (!visibleToRole(input.authority, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(record: AdaptiveReplayRecord, verification: AdaptiveReplayVerification, failures: readonly AdaptiveReplayFailure[], ledger: readonly AdaptiveTraceabilityLedgerRecord[]): AdaptiveReplayCertificationReport {
  const has = (failure: AdaptiveReplayFailure) => failures.includes(failure);
  const base: Omit<AdaptiveReplayCertificationReport, "integrity_hash"> = {
    report_id: "adaptive_replay_traceability_certification_report",
    tenant_id: record.tenant_id,
    checks: ADAPTIVE_REPLAY_CHECKS,
    metadata_complete: !has("REPLAY_IDENTIFIER_MISSING") && !has("HIDDEN_ADAPTIVE_PROCESSING"),
    lineage_complete: !has("INPUT_LINEAGE_INCOMPLETE") && !has("PROCESSING_LINEAGE_INCOMPLETE") && !has("OUTPUT_LINEAGE_INCOMPLETE"),
    evidence_complete: !has("EVIDENCE_REFERENCES_MISSING") && !has("EVIDENCE_SUBSTITUTION"),
    simulation_complete: !has("SIMULATION_REFERENCES_MISSING") && !has("SIMULATION_OMISSION"),
    governance_complete: !has("GOVERNANCE_REFERENCES_MISSING") && !has("GOVERNANCE_OMISSION"),
    operator_complete: !has("OPERATOR_REFERENCES_MISSING") && !has("OPERATOR_OMISSION"),
    certification_complete: !has("CERTIFICATION_REFERENCES_MISSING") && !has("CERTIFICATION_OMISSION"),
    deterministic_replay_verified: verification.verification_result === "PASS" && !has("DETERMINISTIC_RECONSTRUCTION_DIFFERED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ledger_immutable: ledger.every((entry) => entry.append_only && !entry.deleted) && !has("HISTORICAL_RECORD_MUTATION"),
    audit_ready: failures.length === 0,
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(record: AdaptiveReplayRecord, lineage: AdaptiveLineageContract, verification: AdaptiveReplayVerification, scenario: Scenario): readonly AdaptiveTraceabilityLedgerRecord[] {
  const event: Omit<AdaptiveTraceabilityLedgerRecord, "integrity_hash"> = {
    record_id: "adaptive_traceability_ledger_001",
    replay_id: record.replay_id,
    proposal_id: record.proposal_id,
    tenant_id: record.tenant_id,
    mission_scope: record.mission_scope,
    replay_type: record.replay_type,
    validation_result: verification.verification_result,
    lineage_refs: freezeArray([lineage.lineage_id, ...lineage.input_lineage, ...lineage.processing_lineage, ...lineage.output_lineage]),
    evidence_refs: record.evidence_refs,
    simulation_refs: record.simulation_refs,
    governance_refs: record.governance_refs,
    certification_refs: record.certification_refs,
    deterministic_status: record.deterministic_verified,
    event_timestamp: record.created_at,
    sequence_number: 1,
    append_only: (scenario === "FAIL_OPEN" || scenario === "HISTORICAL_MUTATION" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildValidation(failures: readonly AdaptiveReplayFailure[]): AdaptiveReplayValidation {
  const has = (failure: AdaptiveReplayFailure) => failures.includes(failure);
  const base: Omit<AdaptiveReplayValidation, "integrity_hash"> = {
    validation_id: "adaptive_replay_traceability_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    authority_binding_valid: !has("AUTHORITY_BINDING_INVALID"),
    replay_identifier_present: !has("REPLAY_IDENTIFIER_MISSING"),
    input_lineage_complete: !has("INPUT_LINEAGE_INCOMPLETE"),
    processing_lineage_complete: !has("PROCESSING_LINEAGE_INCOMPLETE") && !has("HIDDEN_ADAPTIVE_PROCESSING"),
    output_lineage_complete: !has("OUTPUT_LINEAGE_INCOMPLETE"),
    evidence_complete: !has("EVIDENCE_REFERENCES_MISSING") && !has("EVIDENCE_SUBSTITUTION"),
    simulation_complete: !has("SIMULATION_REFERENCES_MISSING") && !has("SIMULATION_OMISSION"),
    governance_complete: !has("GOVERNANCE_REFERENCES_MISSING") && !has("GOVERNANCE_OMISSION"),
    operator_complete: !has("OPERATOR_REFERENCES_MISSING") && !has("OPERATOR_OMISSION"),
    certification_complete: !has("CERTIFICATION_REFERENCES_MISSING") && !has("CERTIFICATION_OMISSION"),
    deterministic_reconstruction: !has("DETERMINISTIC_RECONSTRUCTION_DIFFERED") && !has("REPLAY_RESULT_MISMATCH"),
    replay_steps_reproducible: !has("REPLAY_STEPS_MISSING") && !has("REPLAY_BYPASS"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ledger_immutable: !has("HISTORICAL_RECORD_MUTATION") && !has("FAIL_OPEN_REPLAY_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveReplayTraceabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    record: result.replay_record,
    metadata: result.metadata,
    lineage: result.lineage_contract,
    verification: result.verification,
    report: result.certification_report,
    ledger: result.traceability_ledger,
    validation: result.validation,
  });
}

export function runAdaptiveReplayTraceabilityContract(input: AdaptiveReplayTraceabilityInput = {}): AdaptiveReplayTraceabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const authority_binding = input.authority_binding ?? runAuthorityGovernanceBinding({ scenario: scenario === "AUTHORITY_INVALID" ? "MISSING_REPLAY" : "BASELINE" });
  const replay_record = buildRecord(authority_binding, input, scenario);
  const metadata = buildMetadata(authority_binding, replay_record, scenario);
  const lineage_contract = buildLineage(replay_record, scenario);
  const verification = buildVerification(replay_record, lineage_contract, scenario);
  const preFailures = collectFailures({ authority: authority_binding, record: replay_record, metadata, lineage: lineage_contract, verification, ledger: [], role, scenario });
  const traceability_ledger = buildLedger(replay_record, lineage_contract, verification, scenario);
  const failures = collectFailures({ authority: authority_binding, record: replay_record, metadata, lineage: lineage_contract, verification, ledger: traceability_ledger, role, scenario });
  const certification_report = buildReport(replay_record, verification, failures.length === preFailures.length ? failures : failures, traceability_ledger);
  const validation = buildValidation(failures);
  const base: Omit<AdaptiveReplayTraceabilityResult, "integrity_hash" | "replay_hash"> = {
    replay_contract_version: REPLAY_CONTRACT_VERSION,
    authority_binding,
    replay_record,
    metadata,
    lineage_contract,
    verification,
    certification_report,
    traceability_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    traceability_complete: failures.length === 0,
    permits_execution: false,
    mutates_history: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveReplayTraceabilityContract(result: AdaptiveReplayTraceabilityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveReplayHash(record: Omit<AdaptiveReplayRecord, "integrity_hash"> | AdaptiveReplayRecord): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveReplayTraceabilityFoundation(): AdaptiveReplayTraceabilityFoundation {
  return Object.freeze({
    replay_contract_version: REPLAY_CONTRACT_VERSION,
    checks: ADAPTIVE_REPLAY_CHECKS,
    replay_types: ADAPTIVE_REPLAY_TYPES,
    result: runAdaptiveReplayTraceabilityContract(),
  });
}

export const AdaptiveReplayTraceabilityContract = Object.freeze({
  run: runAdaptiveReplayTraceabilityContract,
  replay: replayAdaptiveReplayTraceabilityContract,
});
