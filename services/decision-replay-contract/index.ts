import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  DecisionReplayArtifactRef,
  DecisionReplayAuditRefs,
  DecisionReplayCertificationRefs,
  DecisionReplayConstitutionalRefs,
  DecisionReplayContractFoundation,
  DecisionReplayExecutionGuard,
  DecisionReplayFailure,
  DecisionReplayGovernanceRefs,
  DecisionReplayInputs,
  DecisionReplayLineageRefs,
  DecisionReplayMode,
  DecisionReplayOutputs,
  DecisionReplayRecord,
  DecisionReplayState,
  DecisionReplayValidationResult,
} from "@/types/decision-replay-contract";

const CONTRACT_VERSION = "decision-replay-contract/v1" as const;
const SCHEMA_VERSION = "decision-replay-schema/v1" as const;
const ENGINE_VERSION = "decision-replay-engine/v1" as const;
const VALIDATION_RULES_VERSION = "decision-replay-validation-rules/v1" as const;
const NOW = "2026-07-05T01:10:00.000Z";

export const DECISION_REPLAY_STATES: readonly DecisionReplayState[] = Object.freeze(["CREATED", "VALIDATED", "READY_FOR_REPLAY", "REPLAY_RUNNING", "REPLAY_COMPLETED", "REPLAY_FAILED", "DIVERGENCE_DETECTED", "INTEGRITY_FAILURE", "CERTIFIED", "REJECTED", "ARCHIVED"]);
export const DECISION_REPLAY_TERMINAL_STATES: readonly DecisionReplayState[] = Object.freeze(["REPLAY_COMPLETED", "REPLAY_FAILED", "DIVERGENCE_DETECTED", "INTEGRITY_FAILURE", "CERTIFIED", "REJECTED", "ARCHIVED"]);
export const DECISION_REPLAY_MODES: readonly DecisionReplayMode[] = Object.freeze(["FULL_REPLAY", "AUDIT_REPLAY", "CERTIFICATION_REPLAY", "DIFF_REPLAY", "FORENSIC_REPLAY"]);

type DecisionReplayScenario =
  | "BASELINE"
  | "MISSING_REPLAY_ID"
  | "MISSING_ORCHESTRATION_ID"
  | "MISSING_MISSION_ID"
  | "MISSING_TENANT_ID"
  | "MISSING_VERSION"
  | "MISSING_TIMESTAMP"
  | "MISSING_STATE"
  | "UNKNOWN_STATE"
  | "UNSUPPORTED_VERSION"
  | "MISSING_INPUTS"
  | "MISSING_LINEAGE"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "CROSS_TENANT"
  | "CROSS_ORCHESTRATION"
  | "MALFORMED_HASH"
  | "HASH_MISMATCH"
  | "OUTPUT_MUTATION"
  | "ORIGINAL_MUTATION_ATTEMPT"
  | "VALIDATION_SKIPPED";

type BuildInput = Readonly<{
  scenario?: DecisionReplayScenario;
  replay_state?: DecisionReplayState;
  replay_mode?: DecisionReplayMode;
  replay_outputs?: DecisionReplayOutputs | null;
}>;

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

function replayHashSource(record: Omit<DecisionReplayRecord, "integrity_hash"> | DecisionReplayRecord): object {
  return {
    replay_id: record.replay_id,
    orchestration_id: record.orchestration_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    replay_version: record.replay_version,
    schema_version: record.schema_version,
    validation_rules_version: record.validation_rules_version,
    replay_inputs: record.replay_inputs,
    lineage_refs: record.lineage_refs,
    governance_refs: record.governance_refs,
    constitutional_refs: record.constitutional_refs,
    replay_state: record.replay_state,
  };
}

export function computeDecisionReplayIntegrityHash(record: Omit<DecisionReplayRecord, "integrity_hash"> | DecisionReplayRecord): string {
  return hash(replayHashSource(record));
}

function ref(name: string, tenant_id: string, orchestration_id: string): DecisionReplayArtifactRef {
  return Object.freeze({
    ref_id: name ? `${name}_${orchestration_id}` : "",
    tenant_id,
    orchestration_id,
    lineage_ref: name ? `lineage_${name}_${orchestration_id}` : "",
    immutable: true,
  });
}

function buildInputs(tenant_id: string, orchestration_id: string, scenario: DecisionReplayScenario): DecisionReplayInputs {
  const missing = scenario === "MISSING_INPUTS";
  return Object.freeze({
    input_candidate_refs: freezeArray(missing ? [] : [ref("candidate_input", tenant_id, orchestration_id)]),
    normalized_candidate_refs: freezeArray([ref("normalized_candidate", tenant_id, orchestration_id)]),
    decision_context_refs: freezeArray([ref("decision_context", tenant_id, orchestration_id)]),
    dependency_graph_ref: ref("dependency_graph", tenant_id, orchestration_id),
    priority_score_refs: freezeArray([ref("priority_score", tenant_id, orchestration_id)]),
    conflict_classification_refs: freezeArray([ref("conflict_classification", tenant_id, orchestration_id)]),
    governance_outcome_refs: freezeArray([ref("governance_outcome", tenant_id, orchestration_id)]),
    decision_package_refs: freezeArray([ref("decision_package", tenant_id, orchestration_id)]),
    operator_action_refs: freezeArray([ref("operator_action", tenant_id, orchestration_id)]),
    final_decision_state_ref: ref("final_decision_state", tenant_id, orchestration_id),
  });
}

function buildLineage(tenant_id: string, orchestration_id: string, scenario: DecisionReplayScenario): DecisionReplayLineageRefs {
  const missing = scenario === "MISSING_LINEAGE";
  return Object.freeze({
    orchestration_lineage_ref: missing ? ref("", tenant_id, orchestration_id) : ref("orchestration_lineage", tenant_id, orchestration_id),
    candidate_lineage_refs: freezeArray(missing ? [] : [ref("candidate_lineage", tenant_id, orchestration_id)]),
    context_lineage_refs: freezeArray([ref("context_lineage", tenant_id, orchestration_id)]),
    dependency_graph_lineage_ref: ref("dependency_graph_lineage", tenant_id, orchestration_id),
    priority_lineage_refs: freezeArray([ref("priority_lineage", tenant_id, orchestration_id)]),
    conflict_lineage_refs: freezeArray([ref("conflict_lineage", tenant_id, orchestration_id)]),
    governance_lineage_refs: freezeArray([ref("governance_lineage", tenant_id, orchestration_id)]),
    package_lineage_refs: freezeArray([ref("package_lineage", tenant_id, orchestration_id)]),
    operator_workflow_lineage_ref: ref("operator_workflow_lineage", tenant_id, orchestration_id),
    final_state_lineage_ref: ref("final_state_lineage", tenant_id, orchestration_id),
  });
}

function buildGovernance(tenant_id: string, orchestration_id: string, scenario: DecisionReplayScenario): DecisionReplayGovernanceRefs {
  const empty = scenario === "MISSING_GOVERNANCE" ? "" : "governance_policy";
  return Object.freeze({
    policy_ref: ref(empty, tenant_id, orchestration_id),
    authority_ref: ref("authority", tenant_id, orchestration_id),
    approval_ref: ref("approval", tenant_id, orchestration_id),
    governance_outcome_ref: ref("governance_outcome", tenant_id, orchestration_id),
  });
}

function buildConstitutional(tenant_id: string, orchestration_id: string, scenario: DecisionReplayScenario): DecisionReplayConstitutionalRefs {
  const empty = scenario === "MISSING_CONSTITUTIONAL" ? "" : "constitution";
  return Object.freeze({
    constitution_ref: ref(empty, tenant_id, orchestration_id),
    constitutional_validation_ref: ref("constitutional_validation", tenant_id, orchestration_id),
  });
}

function buildAudit(tenant_id: string, orchestration_id: string): DecisionReplayAuditRefs {
  return Object.freeze({
    audit_ref: ref("audit", tenant_id, orchestration_id),
    audit_ledger_ref: ref("audit_ledger", tenant_id, orchestration_id),
  });
}

function buildCertification(tenant_id: string, orchestration_id: string): DecisionReplayCertificationRefs {
  return Object.freeze({
    certification_ref: ref("certification", tenant_id, orchestration_id),
    certification_evidence_ref: ref("certification_evidence", tenant_id, orchestration_id),
  });
}

function buildOutputs(tenant_id: string, orchestration_id: string, immutable: true = true): DecisionReplayOutputs {
  const suffix = `${tenant_id}_${orchestration_id}`;
  return Object.freeze({
    reconstructed_candidate_set: freezeArray([`candidate_set_${suffix}`]),
    reconstructed_context_set: freezeArray([`context_set_${suffix}`]),
    reconstructed_dependency_graph: `dependency_graph_${suffix}`,
    reconstructed_priority_order: freezeArray([`priority_order_${suffix}`]),
    reconstructed_conflict_set: freezeArray([`conflict_set_${suffix}`]),
    reconstructed_governance_outcomes: freezeArray([`governance_outcome_${suffix}`]),
    reconstructed_decision_packages: freezeArray([`decision_package_${suffix}`]),
    reconstructed_operator_workflow: `operator_workflow_${suffix}`,
    reconstructed_final_decision_state: `final_decision_state_${suffix}`,
    replay_match_status: "MATCH",
    replay_diff_refs: freezeArray([]),
    integrity_verification_ref: `integrity_verification_${suffix}`,
    audit_report_ref: `audit_report_${suffix}`,
    immutable,
  });
}

function allRefs(value: unknown): DecisionReplayArtifactRef[] {
  if (!value || typeof value !== "object") return [];
  if ("ref_id" in value && "tenant_id" in value && "orchestration_id" in value) return [value as DecisionReplayArtifactRef];
  if (Array.isArray(value)) return value.flatMap((item) => allRefs(item));
  return Object.values(value as Record<string, unknown>).flatMap((item) => allRefs(item));
}

function refsPresent(value: unknown): boolean {
  const refs = allRefs(value);
  return refs.length > 0 && refs.every((entry) => Boolean(entry.ref_id && entry.tenant_id && entry.orchestration_id && entry.lineage_ref && entry.immutable));
}

function refsMatchBoundary(value: unknown, tenant_id: string, orchestration_id: string): { tenant: boolean; orchestration: boolean } {
  const refs = allRefs(value);
  return {
    tenant: refs.every((entry) => entry.tenant_id === tenant_id),
    orchestration: refs.every((entry) => entry.orchestration_id === orchestration_id),
  };
}

function inputsComplete(inputs: DecisionReplayInputs): boolean {
  return inputs.input_candidate_refs.length > 0
    && inputs.normalized_candidate_refs.length > 0
    && inputs.decision_context_refs.length > 0
    && Boolean(inputs.dependency_graph_ref.ref_id)
    && inputs.priority_score_refs.length > 0
    && inputs.conflict_classification_refs.length > 0
    && inputs.governance_outcome_refs.length > 0
    && inputs.decision_package_refs.length > 0
    && inputs.operator_action_refs.length > 0
    && Boolean(inputs.final_decision_state_ref.ref_id)
    && refsPresent(inputs);
}

function lineageComplete(lineage: DecisionReplayLineageRefs): boolean {
  return Boolean(lineage.orchestration_lineage_ref.ref_id)
    && lineage.candidate_lineage_refs.length > 0
    && lineage.context_lineage_refs.length > 0
    && Boolean(lineage.dependency_graph_lineage_ref.ref_id)
    && lineage.priority_lineage_refs.length > 0
    && lineage.conflict_lineage_refs.length > 0
    && lineage.governance_lineage_refs.length > 0
    && lineage.package_lineage_refs.length > 0
    && Boolean(lineage.operator_workflow_lineage_ref.ref_id)
    && Boolean(lineage.final_state_lineage_ref.ref_id)
    && refsPresent(lineage);
}

function governanceComplete(governance: DecisionReplayGovernanceRefs): boolean {
  return Boolean(governance.policy_ref.ref_id && governance.authority_ref.ref_id && governance.approval_ref.ref_id && governance.governance_outcome_ref.ref_id)
    && refsPresent(governance);
}

function constitutionalComplete(constitutional: DecisionReplayConstitutionalRefs): boolean {
  return Boolean(constitutional.constitution_ref.ref_id && constitutional.constitutional_validation_ref.ref_id)
    && refsPresent(constitutional);
}

export function createDecisionReplayRecord(input: BuildInput = {}): DecisionReplayRecord {
  const scenario = input.scenario ?? "BASELINE";
  const canonicalTenant = "tenant_mission_control";
  const canonicalOrchestration = "orchestration_decision_phase_9_10_1";
  const tenant_id = scenario === "MISSING_TENANT_ID" ? "" : canonicalTenant;
  const orchestration_id = scenario === "MISSING_ORCHESTRATION_ID" ? "" : canonicalOrchestration;
  const referenceTenant = scenario === "CROSS_TENANT" ? "tenant_other" : canonicalTenant;
  const referenceOrchestration = scenario === "CROSS_ORCHESTRATION" ? "orchestration_other" : canonicalOrchestration;
  const state = scenario === "MISSING_STATE" ? "" as DecisionReplayState : scenario === "UNKNOWN_STATE" ? "UNKNOWN" as DecisionReplayState : input.replay_state ?? "READY_FOR_REPLAY";
  const base: Omit<DecisionReplayRecord, "integrity_hash"> = {
    replay_id: scenario === "MISSING_REPLAY_ID" ? "" : "replay_decision_phase_9_10_1",
    orchestration_id,
    mission_id: scenario === "MISSING_MISSION_ID" ? "" : "mission_control_phase_9",
    tenant_id,
    replay_version: scenario === "MISSING_VERSION" ? "" as typeof CONTRACT_VERSION : scenario === "UNSUPPORTED_VERSION" ? "decision-replay-contract/v999" as typeof CONTRACT_VERSION : CONTRACT_VERSION,
    schema_version: scenario === "UNSUPPORTED_VERSION" ? "decision-replay-schema/v999" as typeof SCHEMA_VERSION : SCHEMA_VERSION,
    replay_engine_version: scenario === "UNSUPPORTED_VERSION" ? "decision-replay-engine/v999" as typeof ENGINE_VERSION : ENGINE_VERSION,
    validation_rules_version: scenario === "UNSUPPORTED_VERSION" ? "decision-replay-validation-rules/v999" as typeof VALIDATION_RULES_VERSION : VALIDATION_RULES_VERSION,
    replay_timestamp: scenario === "MISSING_TIMESTAMP" ? "" : NOW,
    replay_requested_by: "operator:mission-control",
    replay_reason: "Phase 9.10.1 canonical replay contract validation",
    replay_mode: input.replay_mode ?? "CERTIFICATION_REPLAY",
    replay_state: state,
    replay_inputs: buildInputs(referenceTenant, referenceOrchestration, scenario),
    replay_outputs: input.replay_outputs ?? (scenario === "OUTPUT_MUTATION" || state === "REPLAY_COMPLETED" ? buildOutputs(referenceTenant, referenceOrchestration, scenario === "OUTPUT_MUTATION" ? false as true : true) : null),
    lineage_refs: buildLineage(referenceTenant, referenceOrchestration, scenario),
    governance_refs: buildGovernance(referenceTenant, referenceOrchestration, scenario),
    constitutional_refs: buildConstitutional(referenceTenant, referenceOrchestration, scenario),
    audit_refs: buildAudit(referenceTenant, referenceOrchestration),
    certification_refs: buildCertification(referenceTenant, referenceOrchestration),
    validation_status: scenario === "VALIDATION_SKIPPED" ? "NOT_VALIDATED" : "VALID",
    certification_status: "NOT_CERTIFIED",
  };
  const record = Object.freeze({ ...base, integrity_hash: computeDecisionReplayIntegrityHash(base) });
  if (scenario === "MALFORMED_HASH") return Object.freeze({ ...record, integrity_hash: "not-a-sha256" });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.replay_id }) });
  return record;
}

function validHash(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function uniqueFailures(failures: readonly DecisionReplayFailure[]): readonly DecisionReplayFailure[] {
  return freezeArray([...new Set(failures)]);
}

export function validateDecisionReplayContract(record?: DecisionReplayRecord | null): DecisionReplayValidationResult {
  if (!record) {
    const base: Omit<DecisionReplayValidationResult, "integrity_hash"> = {
      validation_id: "decision_replay_validation_missing",
      replay_id: "",
      validation_status: "BLOCKED",
      ready_for_replay: false,
      schema_valid: false,
      versions_supported: false,
      tenant_boundary_valid: false,
      lineage_complete: false,
      governance_refs_present: false,
      constitutional_refs_present: false,
      replay_inputs_complete: false,
      integrity_hash_reproducible: false,
      replay_state_valid: false,
      replay_outputs_valid: false,
      failures: freezeArray(["REPLAY_CONTRACT_MISSING"]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }
  const failures: DecisionReplayFailure[] = [];
  if (!record.replay_id) failures.push("REPLAY_ID_MISSING");
  if (!record.orchestration_id) failures.push("ORCHESTRATION_ID_MISSING");
  if (!record.mission_id) failures.push("MISSION_ID_MISSING");
  if (!record.tenant_id) failures.push("TENANT_ID_MISSING");
  if (!record.replay_version) failures.push("REPLAY_VERSION_MISSING");
  if (!record.replay_timestamp) failures.push("REPLAY_TIMESTAMP_MISSING");
  if (!record.replay_state) failures.push("REPLAY_STATE_MISSING");
  if (!record.replay_inputs) failures.push("REPLAY_INPUTS_MISSING");
  if (!record.lineage_refs) failures.push("LINEAGE_REFS_MISSING");
  if (!record.integrity_hash) failures.push("INTEGRITY_HASH_MISSING");
  if (record.replay_version !== CONTRACT_VERSION) failures.push("UNSUPPORTED_CONTRACT_VERSION");
  if (record.schema_version !== SCHEMA_VERSION) failures.push("UNSUPPORTED_SCHEMA_VERSION");
  if (record.replay_engine_version !== ENGINE_VERSION) failures.push("UNSUPPORTED_ENGINE_VERSION");
  if (record.validation_rules_version !== VALIDATION_RULES_VERSION) failures.push("UNSUPPORTED_VALIDATION_RULE_VERSION");
  if (!DECISION_REPLAY_STATES.includes(record.replay_state)) failures.push("UNKNOWN_REPLAY_STATE");
  if (!inputsComplete(record.replay_inputs)) failures.push("MISSING_INPUT_REFS");
  if (!lineageComplete(record.lineage_refs)) failures.push("LINEAGE_REFS_MISSING");
  if (!governanceComplete(record.governance_refs)) failures.push("MISSING_GOVERNANCE_REFS");
  if (!constitutionalComplete(record.constitutional_refs)) failures.push("MISSING_CONSTITUTIONAL_REFS");
  const boundary = refsMatchBoundary({ inputs: record.replay_inputs, lineage: record.lineage_refs, governance: record.governance_refs, constitutional: record.constitutional_refs, audit: record.audit_refs, certification: record.certification_refs }, record.tenant_id, record.orchestration_id);
  if (!boundary.tenant) failures.push("CROSS_TENANT_REFS");
  if (!boundary.orchestration) failures.push("CROSS_ORCHESTRATION_REFS");
  if (!validHash(record.integrity_hash)) failures.push("MALFORMED_HASH");
  if (validHash(record.integrity_hash) && computeDecisionReplayIntegrityHash(record) !== record.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!DECISION_REPLAY_TERMINAL_STATES.includes(record.replay_state) && record.replay_outputs !== null) failures.push("REPLAY_OUTPUT_MUTATION");
  if (record.replay_outputs && !record.replay_outputs.immutable) failures.push("REPLAY_OUTPUT_MUTATION");
  if (record.validation_status === "NOT_VALIDATED") failures.push("REPLAY_VALIDATION_SKIPPED");
  if (record.replay_reason.includes("mutate-original")) failures.push("ORIGINAL_ORCHESTRATION_MUTATION_ATTEMPT");
  const finalFailures = uniqueFailures(failures);
  const versions_supported = !finalFailures.some((failure) => failure.startsWith("UNSUPPORTED"));
  const integrity_hash_reproducible = !finalFailures.includes("MALFORMED_HASH") && !finalFailures.includes("INTEGRITY_HASH_MISMATCH") && !finalFailures.includes("INTEGRITY_HASH_MISSING");
  const validation_status = finalFailures.includes("MALFORMED_HASH") || finalFailures.includes("INTEGRITY_HASH_MISMATCH") ? "INTEGRITY_FAILURE" : finalFailures.length ? "INVALID" : "VALID";
  const base: Omit<DecisionReplayValidationResult, "integrity_hash"> = {
    validation_id: `decision_replay_validation_${record.replay_id || "missing"}`,
    replay_id: record.replay_id,
    validation_status,
    ready_for_replay: finalFailures.length === 0 && record.replay_state === "READY_FOR_REPLAY",
    schema_valid: finalFailures.length === 0,
    versions_supported,
    tenant_boundary_valid: !finalFailures.includes("CROSS_TENANT_REFS") && !finalFailures.includes("CROSS_ORCHESTRATION_REFS"),
    lineage_complete: !finalFailures.includes("LINEAGE_REFS_MISSING"),
    governance_refs_present: !finalFailures.includes("MISSING_GOVERNANCE_REFS"),
    constitutional_refs_present: !finalFailures.includes("MISSING_CONSTITUTIONAL_REFS"),
    replay_inputs_complete: !finalFailures.includes("MISSING_INPUT_REFS") && !finalFailures.includes("REPLAY_INPUTS_MISSING"),
    integrity_hash_reproducible,
    replay_state_valid: !finalFailures.includes("UNKNOWN_REPLAY_STATE") && !finalFailures.includes("REPLAY_STATE_MISSING"),
    replay_outputs_valid: !finalFailures.includes("REPLAY_OUTPUT_MUTATION"),
    failures: finalFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function guardDecisionReplayExecution(record?: DecisionReplayRecord | null, validation = validateDecisionReplayContract(record)): DecisionReplayExecutionGuard {
  const blocked = validation.ready_for_replay ? null : validation.failures[0] ?? "REPLAY_OUTSIDE_CONTRACT";
  const base: Omit<DecisionReplayExecutionGuard, "integrity_hash"> = {
    guard_id: `decision_replay_guard_${validation.replay_id || "missing"}`,
    replay_id: validation.replay_id,
    execution_allowed: validation.ready_for_replay,
    blocked_reason: blocked,
    advisory_only: true,
    mutates_original_orchestration: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function freezeDecisionReplayMetadata(record: DecisionReplayRecord): DecisionReplayRecord {
  return Object.freeze({
    ...record,
    replay_inputs: Object.freeze(record.replay_inputs),
    replay_outputs: record.replay_outputs ? Object.freeze(record.replay_outputs) : null,
    lineage_refs: Object.freeze(record.lineage_refs),
    governance_refs: Object.freeze(record.governance_refs),
    constitutional_refs: Object.freeze(record.constitutional_refs),
  });
}

export function getDecisionReplayContractFoundation(): DecisionReplayContractFoundation {
  const record = createDecisionReplayRecord();
  const validation = validateDecisionReplayContract(record);
  return Object.freeze({
    contract_version: CONTRACT_VERSION,
    supported_schema_versions: Object.freeze([SCHEMA_VERSION]),
    supported_engine_versions: Object.freeze([ENGINE_VERSION]),
    supported_validation_rule_versions: Object.freeze([VALIDATION_RULES_VERSION]),
    replay_states: DECISION_REPLAY_STATES,
    terminal_states: DECISION_REPLAY_TERMINAL_STATES,
    replay_modes: DECISION_REPLAY_MODES,
    record,
    validation,
    guard: guardDecisionReplayExecution(record, validation),
  });
}

export const DecisionReplayContract = Object.freeze({
  create: createDecisionReplayRecord,
  validate: validateDecisionReplayContract,
  guard: guardDecisionReplayExecution,
});
