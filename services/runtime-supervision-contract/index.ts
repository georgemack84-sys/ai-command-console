import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildExecutionAssuranceRecord, computeExecutionAssuranceIntegrityHash, validateExecutionAssuranceRecord } from "@/services/execution-assurance-contract";
import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";
import type {
  RuntimeConfidenceModel,
  RuntimeInterventionAuthority,
  RuntimeMonitoringPolicies,
  RuntimeSupervisionContract,
  RuntimeSupervisionContractFramework,
  RuntimeSupervisionEvidence,
  RuntimeSupervisionFailureReason,
  RuntimeSupervisionLifecycleState,
  RuntimeSupervisionObservabilitySurface,
  RuntimeSupervisionReplayReferences,
  RuntimeSupervisionReplayResult,
  RuntimeSupervisionScenario,
  RuntimeSupervisionScope,
  RuntimeSupervisionValidationResult,
} from "@/types/runtime-supervision-contract";

type ContractDraft = Omit<RuntimeSupervisionContract, "integrity_hash">;

const NOW = "2026-06-29T22:30:00.000Z";
const SUPERVISION_VERSION = "runtime-supervision-contract/v8E.A" as const;
const LIFECYCLE: readonly RuntimeSupervisionLifecycleState[] = Object.freeze(["DRAFT", "VALIDATING", "ACTIVE", "SUSPENDED", "SUPERSEDED", "ARCHIVED", "INVALID"]);
const VALID_TRANSITIONS: Readonly<Record<RuntimeSupervisionLifecycleState, readonly RuntimeSupervisionLifecycleState[]>> = Object.freeze({
  DRAFT: ["VALIDATING"],
  VALIDATING: ["ACTIVE", "INVALID"],
  ACTIVE: ["SUSPENDED", "SUPERSEDED"],
  SUSPENDED: ["ACTIVE"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
  INVALID: ["ARCHIVED"],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function evidenceHashSource(evidence: Omit<RuntimeSupervisionEvidence, "integrity_hash"> | RuntimeSupervisionEvidence) {
  return {
    evidence_id: evidence.evidence_id,
    supervision_id: evidence.supervision_id,
    execution_id: evidence.execution_id,
    mission_id: evidence.mission_id,
    tenant_id: evidence.tenant_id,
    observed_state: evidence.observed_state,
    detected_risks: evidence.detected_risks,
    detected_policy_violations: evidence.detected_policy_violations,
    detected_constitutional_violations: evidence.detected_constitutional_violations,
    confidence_score: evidence.confidence_score,
    recommendation_validity: evidence.recommendation_validity,
    monitoring_snapshot: evidence.monitoring_snapshot,
    source_events: evidence.source_events,
    governance_references: evidence.governance_references,
    policy_references: evidence.policy_references,
    constitution_references: evidence.constitution_references,
    timestamp: evidence.timestamp,
    lineage_reference: evidence.lineage_reference,
    replay_reference: evidence.replay_reference,
  };
}

export function computeRuntimeSupervisionEvidenceHash(evidence: Omit<RuntimeSupervisionEvidence, "integrity_hash"> | RuntimeSupervisionEvidence): string {
  return hashValue("runtime-supervision-evidence", evidenceHashSource(evidence));
}

function contractHashSource(contract: ContractDraft | RuntimeSupervisionContract) {
  return {
    supervision_id: contract.supervision_id,
    execution_id: contract.execution_id,
    mission_id: contract.mission_id,
    tenant_id: contract.tenant_id,
    supervision_version: contract.supervision_version,
    lifecycle_state: contract.lifecycle_state,
    created_at: contract.created_at,
    created_by: contract.created_by,
    lineage_reference: contract.lineage_reference,
    replay_reference: contract.replay_reference,
    monitored_execution: contract.monitored_execution,
    supervision_scope: contract.supervision_scope,
    monitoring_policies: contract.monitoring_policies,
    intervention_authority: contract.intervention_authority,
    confidence_model: contract.confidence_model,
    evidence_requirements: contract.evidence_requirements,
    supervision_evidence_hash: contract.supervision_evidence.integrity_hash,
    replay_references: contract.replay_references,
    source_assurance_hash: contract.source_execution_assurance.integrity_hash,
  };
}

export function computeRuntimeSupervisionIntegrityHash(contract: ContractDraft | RuntimeSupervisionContract): string {
  return hashValue("runtime-supervision-contract", contractHashSource(contract));
}

function scope(scenario: RuntimeSupervisionScenario): RuntimeSupervisionScope {
  const enabled = scenario !== "SCOPE_AMBIGUOUS";
  return Object.freeze({
    execution_monitoring: enabled,
    drift_monitoring: enabled,
    policy_monitoring: enabled,
    constitutional_monitoring: enabled,
    execution_health_monitoring: enabled,
    runtime_confidence_monitoring: enabled,
    recommendation_validity_monitoring: enabled,
    dependency_monitoring: enabled,
    intervention_recommendation: enabled,
    pause_recommendation: enabled,
    rollback_recommendation: enabled,
    restrictions: freezeArray(scenario === "HIDDEN_STATE_ALLOWED" ? ["no direct execution control", "no autonomous intervention"] : ["no direct execution control", "no autonomous intervention", "no policy modification", "no constitutional modification", "no authority escalation", "no cross-tenant supervision", "no hidden observation channels"]),
  });
}

function policies(scenario: RuntimeSupervisionScenario): RuntimeMonitoringPolicies {
  const missing = scenario === "POLICIES_MISSING";
  return Object.freeze({
    execution_policy_refs: freezeArray(missing ? [] : ["policy:execution-progress", "policy:dependency-health", "policy:state-transition"]),
    governance_policy_refs: freezeArray(missing ? [] : ["policy:governance-bypass", "policy:approval-required"]),
    constitutional_policy_refs: freezeArray(missing ? [] : ["constitution:operator-supremacy", "constitution:tenant-isolation"]),
    confidence_policy_refs: freezeArray(missing ? [] : ["policy:confidence-degradation", "policy:evidence-uncertainty"]),
    recommendation_policy_refs: freezeArray(missing ? [] : ["policy:recommendation-freshness", "policy:recommendation-consistency"]),
    monitoring_rules: freezeArray(missing ? [] : ["drift", "policy", "constitutional", "health", "confidence", "recommendation-validity"]),
  });
}

function authority(scenario: RuntimeSupervisionScenario): RuntimeInterventionAuthority {
  return Object.freeze({
    allowed_recommendations: freezeArray(["recommend_operator_review", "recommend_governance_review", "recommend_pause", "recommend_checkpoint", "recommend_retry", "recommend_rollback", "recommend_escalation", "recommend_termination"]),
    prohibited_actions: freezeArray(scenario === "EXECUTION_CONTROL_GRANTED" ? ["modify_policy", "modify_constitution"] : ["execute_task", "pause_execution_directly", "rollback_execution_directly", "terminate_execution_directly", "modify_policy", "modify_constitution", "change_authority", "bypass_operator", "hide_supervision_state"]),
    operator_required: scenario !== "AUTONOMOUS_INTERVENTION_ALLOWED",
    advisory_only: scenario !== "EXECUTION_CONTROL_GRANTED" && scenario !== "AUTONOMOUS_INTERVENTION_ALLOWED",
  });
}

function confidenceModel(scenario: RuntimeSupervisionScenario): RuntimeConfidenceModel {
  const missing = scenario === "CONFIDENCE_MODEL_MISSING";
  return Object.freeze({
    confidence_score: missing ? 0 : 0.94,
    confidence_level: missing ? "VERY_LOW" as const : "HIGH" as const,
    confidence_inputs: freezeArray(missing ? [] : ["execution health", "policy certainty", "constitutional certainty", "evidence completeness", "recommendation validity", "drift severity", "dependency stability", "historical reliability", "replay consistency"]),
    confidence_degradation: missing ? 1 : 0.03,
    confidence_trend: missing ? "DEGRADING" as const : "STABLE" as const,
    confidence_reason: missing ? "" : "Approved execution is observable, tenant-scoped, replayable, and governed.",
    confidence_threshold_breached: missing,
    degradation_thresholds: freezeArray(missing ? [] : [0.75, 0.55, 0.35]),
    escalation_thresholds: freezeArray(missing ? [] : [0.55, 0.35]),
    timestamp: NOW,
  });
}

function buildEvidence(supervisionId: string, record: ExecutionAssuranceRecord, scenario: RuntimeSupervisionScenario): RuntimeSupervisionEvidence {
  const source = {
    evidence_id: id("RSE", "runtime-supervision-evidence-id", supervisionId),
    supervision_id: supervisionId,
    execution_id: record.execution_id,
    mission_id: record.mission_id,
    tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_beta" : record.tenant_id,
    observed_state: record.execution_state,
    detected_risks: freezeArray<string>([]),
    detected_policy_violations: freezeArray<string>([]),
    detected_constitutional_violations: freezeArray<string>([]),
    confidence_score: scenario === "CONFIDENCE_MODEL_MISSING" ? 0 : 0.94,
    recommendation_validity: "VALID" as const,
    monitoring_snapshot: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : ["execution_state", "governance_status", "policy_status", "authority_status", "confidence_status"]),
    source_events: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : [record.integrity_hash, record.evidence_reference]),
    governance_references: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : [record.governance_metadata.governance_version]),
    policy_references: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : [record.governance_metadata.policy_version]),
    constitution_references: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : [record.governance_metadata.constitution_version]),
    timestamp: NOW,
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : record.lineage_reference,
    replay_reference: scenario === "REPLAY_MISSING" ? "" : record.replay_reference,
  };
  return Object.freeze({ ...source, integrity_hash: computeRuntimeSupervisionEvidenceHash(source) });
}

export function buildRuntimeSupervisionContract(input: { scenario?: RuntimeSupervisionScenario; sourceExecutionAssurance?: ExecutionAssuranceRecord; created_by?: string } = {}): RuntimeSupervisionContract {
  const scenario = input.scenario ?? "BASELINE";
  const source_execution_assurance = input.sourceExecutionAssurance ?? buildExecutionAssuranceRecord();
  const supervision_id = scenario === "MISSING_IDENTITY" ? "" : id("RSC", "runtime-supervision-id", { execution: source_execution_assurance.execution_id, version: SUPERVISION_VERSION });
  const execution_id = scenario === "MISSING_EXECUTION" ? "" : source_execution_assurance.execution_id;
  const tenant_id = scenario === "TENANT_MISMATCH" ? "tenant_beta" : source_execution_assurance.tenant_id;
  const evidence = buildEvidence(supervision_id || "missing-supervision", source_execution_assurance, scenario);
  const replay_reference = scenario === "REPLAY_MISSING" ? "" : `replay:${supervision_id}`;
  const lineage_reference = scenario === "LINEAGE_MISSING" ? "" : `lineage:${source_execution_assurance.assurance_id}:${supervision_id}`;
  const replay_references: RuntimeSupervisionReplayReferences = Object.freeze({
    replay_reference,
    replay_session_id: replay_reference ? `session:${supervision_id}` : "",
    replay_input_hash: hashValue("runtime-supervision-replay-input", { execution_id, evidence: evidence.integrity_hash }),
    replay_output_hash: hashValue("runtime-supervision-replay-output", { supervision_id, state: "ACTIVE" }),
    decision_hash: hashValue("runtime-supervision-decision", { supervision_id, advisory: true }),
    supervision_event_hash: hashValue("runtime-supervision-event", { supervision_id, timestamp: NOW }),
    evidence_hash: evidence.integrity_hash,
    lineage_reference,
    input_hash: hashValue("runtime-supervision-input", source_execution_assurance.integrity_hash),
    contract_hash: hashValue("runtime-supervision-contract-reference", supervision_id),
  });
  const base: ContractDraft = {
    supervision_id,
    execution_id,
    mission_id: source_execution_assurance.mission_id,
    tenant_id,
    supervision_version: SUPERVISION_VERSION,
    lifecycle_state: scenario === "INVALID_TRANSITION" ? "ARCHIVED" : "ACTIVE",
    created_at: NOW,
    created_by: input.created_by ?? "operator:mission-control",
    lineage_reference,
    replay_reference,
    monitored_execution: Object.freeze({
      execution_id,
      plan_id: `plan:${source_execution_assurance.workflow_id}`,
      orchestration_id: source_execution_assurance.workflow_id,
      delegation_plan_id: source_execution_assurance.lineage_metadata.delegation_reference,
      mission_id: source_execution_assurance.mission_id,
      tenant_id,
      execution_state: source_execution_assurance.execution_state,
      execution_start_time: source_execution_assurance.created_at,
      approved_authority: source_execution_assurance.governance_metadata.authority_scope,
      governance_reference: source_execution_assurance.governance_metadata.governance_version,
      policy_reference: source_execution_assurance.governance_metadata.policy_version,
      constitution_reference: source_execution_assurance.governance_metadata.constitution_version,
    }),
    supervision_scope: scope(scenario),
    monitoring_policies: policies(scenario),
    intervention_authority: authority(scenario),
    confidence_model: confidenceModel(scenario),
    evidence_requirements: Object.freeze({
      required_evidence_types: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : ["state", "risk", "policy", "constitutional", "confidence", "recommendation", "source-event"]),
      source_event_requirements: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : ["execution-event", "governance-event", "policy-event", "authority-event"]),
      truth_ledger_required: scenario !== "TRUTH_LEDGER_NOT_REQUIRED",
      lineage_required: true,
      replay_required: true,
      integrity_required: true,
    }),
    supervision_evidence: evidence,
    replay_references,
    source_execution_assurance,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-runtime-supervision-contract" : computeRuntimeSupervisionIntegrityHash(base) });
}

function validLifecycle(state: RuntimeSupervisionLifecycleState) {
  return state === "ACTIVE" || VALID_TRANSITIONS.VALIDATING.includes(state);
}

export function validateRuntimeSupervisionContract(contract?: RuntimeSupervisionContract, context: { registry?: readonly RuntimeSupervisionContract[] } = {}): RuntimeSupervisionValidationResult {
  if (!contract) {
    const failures = freezeArray<RuntimeSupervisionFailureReason>(["SUPERVISION_ID_MISSING"]);
    const source = { supervision_id: null, validation_state: "FAIL" as const, failures };
    return Object.freeze({
      validation_id: id("RSV", "runtime-supervision-validation-id", source),
      supervision_id: null,
      validation_state: "FAIL",
      failures,
      identity_valid: false,
      monitored_execution_valid: false,
      tenant_aligned: false,
      scope_valid: false,
      policies_valid: false,
      advisory_only: false,
      confidence_model_valid: false,
      evidence_complete: false,
      replay_ready: false,
      lineage_complete: false,
      truth_ledger_required: false,
      hidden_state_prohibited: false,
      autonomous_intervention_prohibited: false,
      integrity_verified: false,
      ready_for_runtime_supervision: false,
      validation_hash: hashValue("runtime-supervision-validation", source),
    });
  }
  const failures: RuntimeSupervisionFailureReason[] = [];
  const assuranceValidation = validateExecutionAssuranceRecord(contract.source_execution_assurance);
  if (!contract.supervision_id) failures.push("SUPERVISION_ID_MISSING");
  if (!contract.execution_id || !contract.monitored_execution.execution_id || !assuranceValidation.ready_for_runtime_assurance) failures.push("EXECUTION_ID_INVALID");
  if (!contract.mission_id || contract.monitored_execution.mission_id !== contract.mission_id) failures.push("MISSION_ID_INVALID");
  if (!contract.tenant_id || contract.monitored_execution.tenant_id !== contract.tenant_id) failures.push("TENANT_ID_INVALID");
  if (contract.tenant_id !== contract.source_execution_assurance.tenant_id || contract.supervision_evidence.tenant_id !== contract.tenant_id) failures.push("TENANT_ALIGNMENT_MISSING");
  if (!Object.entries(contract.supervision_scope).filter(([key]) => key !== "restrictions").every(([, value]) => value === true)) failures.push("SUPERVISION_SCOPE_AMBIGUOUS");
  if (contract.intervention_authority.prohibited_actions.length < 9) failures.push("PROHIBITED_ACTIONS_MISSING");
  if (!contract.intervention_authority.advisory_only) failures.push("INTERVENTION_AUTHORITY_NOT_ADVISORY");
  if (!contract.monitoring_policies.monitoring_rules.length || !contract.monitoring_policies.execution_policy_refs.length || !contract.monitoring_policies.governance_policy_refs.length || !contract.monitoring_policies.constitutional_policy_refs.length) failures.push("MONITORING_POLICIES_MISSING");
  if (!contract.confidence_model.confidence_inputs.length || !contract.confidence_model.confidence_reason) failures.push("CONFIDENCE_MODEL_MISSING");
  if (!contract.evidence_requirements.required_evidence_types.length || !contract.evidence_requirements.source_event_requirements.length || !contract.supervision_evidence.source_events.length || !contract.supervision_evidence.monitoring_snapshot.length) failures.push("EVIDENCE_REQUIREMENTS_INCOMPLETE");
  if (!contract.replay_reference || !contract.replay_references.replay_reference || !contract.supervision_evidence.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
  if (!contract.lineage_reference || !contract.replay_references.lineage_reference || !contract.supervision_evidence.lineage_reference) failures.push("LINEAGE_REFERENCE_MISSING");
  if (!contract.evidence_requirements.truth_ledger_required) failures.push("TRUTH_LEDGER_NOT_REQUIRED");
  if (!contract.supervision_scope.restrictions.includes("no hidden observation channels") || contract.intervention_authority.prohibited_actions.includes("hide_supervision_state") === false) failures.push("HIDDEN_STATE_ALLOWED");
  if (!contract.intervention_authority.operator_required || contract.intervention_authority.prohibited_actions.includes("execute_task") === false) failures.push("AUTONOMOUS_INTERVENTION_ALLOWED");
  if (!validLifecycle(contract.lifecycle_state)) failures.push("INVALID_LIFECYCLE_TRANSITION");
  if (computeRuntimeSupervisionEvidenceHash(contract.supervision_evidence) !== contract.supervision_evidence.integrity_hash || computeRuntimeSupervisionIntegrityHash(contract) !== contract.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const registry = context.registry ?? [contract];
  if (registry.filter((item) => item.supervision_id === contract.supervision_id).length > 1) failures.push("SUPERVISION_ID_DUPLICATE");
  const uniqueFailures = unique(failures);
  const has = (failure: RuntimeSupervisionFailureReason) => uniqueFailures.includes(failure);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { supervision_id: contract.supervision_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("RSV", "runtime-supervision-validation-id", source),
    supervision_id: contract.supervision_id || null,
    validation_state,
    failures: uniqueFailures,
    identity_valid: !has("SUPERVISION_ID_MISSING") && !has("SUPERVISION_ID_DUPLICATE"),
    monitored_execution_valid: !has("EXECUTION_ID_INVALID") && !has("MISSION_ID_INVALID"),
    tenant_aligned: !has("TENANT_ALIGNMENT_MISSING") && !has("TENANT_ID_INVALID"),
    scope_valid: !has("SUPERVISION_SCOPE_AMBIGUOUS") && !has("PROHIBITED_ACTIONS_MISSING"),
    policies_valid: !has("MONITORING_POLICIES_MISSING"),
    advisory_only: !has("INTERVENTION_AUTHORITY_NOT_ADVISORY"),
    confidence_model_valid: !has("CONFIDENCE_MODEL_MISSING"),
    evidence_complete: !has("EVIDENCE_REQUIREMENTS_INCOMPLETE"),
    replay_ready: !has("REPLAY_REFERENCE_MISSING"),
    lineage_complete: !has("LINEAGE_REFERENCE_MISSING"),
    truth_ledger_required: !has("TRUTH_LEDGER_NOT_REQUIRED"),
    hidden_state_prohibited: !has("HIDDEN_STATE_ALLOWED"),
    autonomous_intervention_prohibited: !has("AUTONOMOUS_INTERVENTION_ALLOWED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_runtime_supervision: validation_state === "PASS",
    validation_hash: hashValue("runtime-supervision-validation", source),
  });
}

export function replayRuntimeSupervisionContract(contract: RuntimeSupervisionContract): RuntimeSupervisionReplayResult {
  const validation = validateRuntimeSupervisionContract(contract);
  const source = {
    replay_id: id("RSR", "runtime-supervision-replay-id", contract.supervision_id),
    supervision_id: contract.supervision_id,
    reconstructed_lifecycle: freezeArray(["DRAFT", "VALIDATING", contract.lifecycle_state] as RuntimeSupervisionLifecycleState[]),
    reconstructed_scope: freezeArray(contract.supervision_scope.restrictions),
    reconstructed_confidence_level: contract.confidence_model.confidence_level,
    reconstructed_evidence_hash: contract.supervision_evidence.integrity_hash,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-supervision-replay", source) });
}

export function buildRuntimeSupervisionObservabilitySurface(contract = buildRuntimeSupervisionContract()): RuntimeSupervisionObservabilitySurface {
  const validation = validateRuntimeSupervisionContract(contract);
  return Object.freeze({
    supervision_id: contract.supervision_id,
    execution_id: contract.execution_id,
    lifecycle_state: contract.lifecycle_state,
    confidence_level: contract.confidence_model.confidence_level,
    validation_state: validation.validation_state,
    failure_reasons: validation.failures,
    operator_required: contract.intervention_authority.operator_required,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_status: validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getRuntimeSupervisionContractFramework(): RuntimeSupervisionContractFramework {
  const contract = buildRuntimeSupervisionContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["advisory-only", "immutable-contract", "tenant-scoped", "operator-authority-preserved", "deterministic-auditability", "complete-evidence", "mandatory-replay", "mandatory-lineage", "truth-ledger-required", "no-hidden-state", "no-autonomous-intervention"]),
      supervision_version: SUPERVISION_VERSION,
      lifecycle_states: freezeArray(LIFECYCLE),
      confidence_levels: freezeArray(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"] as const),
    }),
    contract,
    validation: validateRuntimeSupervisionContract(contract),
    replay: replayRuntimeSupervisionContract(contract),
    observability: buildRuntimeSupervisionObservabilitySurface(contract),
  });
}
