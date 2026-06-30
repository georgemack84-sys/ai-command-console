import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthReplayAuditPolicy,
  TruthReplayCertificationState,
  TruthReplayContract,
  TruthReplayContractErrorCode,
  TruthReplayContractEventName,
  TruthReplayContractStorageRecord,
  TruthReplayContractType,
  TruthReplayContractValidationResult,
  TruthReplayDeterministicRequirements,
  TruthReplayExecutionAuthority,
  TruthReplayExpectedResult,
  TruthReplayFailurePolicy,
  TruthReplayLifecycleState,
  TruthReplayLifecycleTransitionValidation,
  TruthReplayOutputPolicy,
  TruthReplayRequesterType,
  TruthReplayTargetType,
  TruthReplayValidationIssue,
} from "./types";

export const TRUTH_REPLAY_DOCTRINE = Object.freeze({
  reconstructionOnly: true,
  executionAuthority: "NONE" as TruthReplayExecutionAuthority,
  sourceTruthMutationAllowed: false,
  tenantScopeRequired: true,
  governanceContextRequired: true,
  evidenceLineagePreserved: true,
  failClosedWhenDeterminismImpossible: true,
});

export const TRUTH_REPLAY_CONTRACT_EVENTS: Readonly<Record<TruthReplayContractEventName, TruthReplayContractEventName>> = Object.freeze({
  REPLAY_CONTRACT_CREATED: "REPLAY_CONTRACT_CREATED",
  REPLAY_CONTRACT_VALIDATED: "REPLAY_CONTRACT_VALIDATED",
  REPLAY_CONTRACT_REJECTED: "REPLAY_CONTRACT_REJECTED",
  REPLAY_SCOPE_VERIFIED: "REPLAY_SCOPE_VERIFIED",
  REPLAY_SOURCE_BOUND: "REPLAY_SOURCE_BOUND",
  REPLAY_GOVERNANCE_BOUND: "REPLAY_GOVERNANCE_BOUND",
  REPLAY_AUTHORITY_VERIFIED: "REPLAY_AUTHORITY_VERIFIED",
  REPLAY_DETERMINISM_VERIFIED: "REPLAY_DETERMINISM_VERIFIED",
  REPLAY_READY: "REPLAY_READY",
  REPLAY_FAILED_CONTRACT_VALIDATION: "REPLAY_FAILED_CONTRACT_VALIDATION",
});

const REPLAY_TYPES = new Set<TruthReplayContractType>([
  "TRUTH_RECORD_REPLAY",
  "EVENT_REPLAY",
  "EVIDENCE_REPLAY",
  "RECOMMENDATION_REPLAY",
  "GOVERNANCE_REPLAY",
  "LINEAGE_REPLAY",
  "MISSION_REPLAY",
  "FULL_CONTEXT_REPLAY",
]);

const TARGET_TYPES = new Set<TruthReplayTargetType>([
  "TRUTH_RECORD",
  "EVENT",
  "EVIDENCE_CHAIN",
  "RECOMMENDATION",
  "GOVERNANCE_DECISION",
  "LINEAGE_GRAPH",
  "MISSION_HISTORY",
]);

const REQUESTER_TYPES = new Set<TruthReplayRequesterType>(["OPERATOR", "SYSTEM", "AUDITOR", "CERTIFICATION_SUITE"]);
const CERTIFICATION_STATES = new Set<TruthReplayCertificationState>([
  "UNCERTIFIED",
  "CONTRACT_VALIDATED",
  "REPLAYABLE",
  "REPLAY_MATCHED",
  "REPLAY_MISMATCHED",
  "REPLAY_FAILED",
  "CERTIFIED",
]);
const LIFECYCLE_STATES = new Set<TruthReplayLifecycleState>([
  "REQUESTED",
  "VALIDATED",
  "REJECTED",
  "READY",
  "RUNNING",
  "COMPLETED",
  "MISMATCH",
  "FAILED",
  "ESCALATED",
  "CERTIFIED",
  "ARCHIVED",
]);
const COMPATIBLE_TARGETS: Readonly<Record<TruthReplayContractType, readonly TruthReplayTargetType[]>> = Object.freeze({
  TRUTH_RECORD_REPLAY: ["TRUTH_RECORD"],
  EVENT_REPLAY: ["EVENT"],
  EVIDENCE_REPLAY: ["EVIDENCE_CHAIN"],
  RECOMMENDATION_REPLAY: ["RECOMMENDATION"],
  GOVERNANCE_REPLAY: ["GOVERNANCE_DECISION"],
  LINEAGE_REPLAY: ["LINEAGE_GRAPH"],
  MISSION_REPLAY: ["MISSION_HISTORY"],
  FULL_CONTEXT_REPLAY: ["TRUTH_RECORD", "EVENT", "EVIDENCE_CHAIN", "RECOMMENDATION", "GOVERNANCE_DECISION", "LINEAGE_GRAPH", "MISSION_HISTORY"],
});

const LIFECYCLE_TRANSITIONS: Readonly<Record<TruthReplayLifecycleState, readonly TruthReplayLifecycleState[]>> = Object.freeze({
  REQUESTED: ["VALIDATED", "REJECTED"],
  VALIDATED: ["READY"],
  REJECTED: [],
  READY: ["RUNNING"],
  RUNNING: ["COMPLETED", "MISMATCH", "FAILED"],
  COMPLETED: ["CERTIFIED"],
  MISMATCH: ["ESCALATED"],
  FAILED: [],
  ESCALATED: [],
  CERTIFIED: ["ARCHIVED"],
  ARCHIVED: [],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function values(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function issue(
  code: TruthReplayContractErrorCode,
  message: string,
  path: string,
  severity: TruthReplayValidationIssue["severity"] = "ERROR",
): TruthReplayValidationIssue {
  return Object.freeze({ code, message, path, severity });
}

function addIssue(
  collection: TruthReplayValidationIssue[],
  code: TruthReplayContractErrorCode,
  message: string,
  path: string,
  severity: TruthReplayValidationIssue["severity"] = "ERROR",
): void {
  collection.push(issue(code, message, path, severity));
}

function contractHashPayload(contract: TruthReplayContract): Record<string, unknown> {
  return {
    replay_id: contract.replay_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    replay_type: contract.replay_type,
    replay_scope: contract.replay_scope,
    replay_target: contract.replay_target,
    source_truth_record_ids: contract.source_truth_record_ids,
    source_event_ids: contract.source_event_ids,
    source_evidence_refs: contract.source_evidence_refs,
    source_lineage_refs: contract.source_lineage_refs,
    source_policy_refs: contract.source_policy_refs,
    source_replay_refs: contract.source_replay_refs,
    replay_ordering: contract.replay_ordering,
    governance_context: contract.governance_context,
    authority_context: contract.authority_context,
    deterministic_requirements: contract.deterministic_requirements,
    failure_policy: contract.failure_policy,
    output_policy: contract.output_policy,
    audit_policy: contract.audit_policy,
  };
}

export function hashTruthReplayInput(contract: TruthReplayContract): string {
  return hashValue("mission-control-replay-input-hash", {
    source_truth_record_ids: contract.source_truth_record_ids,
    source_event_ids: contract.source_event_ids,
    source_evidence_refs: contract.source_evidence_refs,
    source_lineage_refs: contract.source_lineage_refs,
    source_policy_refs: contract.source_policy_refs,
    source_replay_refs: contract.source_replay_refs,
    replay_window: contract.replay_window,
  });
}

export function hashTruthReplayContract(contract: TruthReplayContract): string {
  return hashValue("mission-control-replay-contract-hash", contractHashPayload(contract));
}

export function normalizeTruthReplayContract(contract: TruthReplayContract): TruthReplayContract {
  const inputHash = contract.input_integrity.input_hash ?? hashTruthReplayInput(contract);
  const withoutContractHash: TruthReplayContract = Object.freeze({
    ...contract,
    input_integrity: Object.freeze({
      ...contract.input_integrity,
      input_hash: inputHash,
    }),
  });
  return Object.freeze({
    ...withoutContractHash,
    contract_hash: hashTruthReplayContract(withoutContractHash),
  });
}

export function createDefaultTruthReplayContractFixture(overrides: Partial<TruthReplayContract> = {}): TruthReplayContract {
  const contract: TruthReplayContract = Object.freeze({
    replay_id: "replay_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    replay_type: "RECOMMENDATION_REPLAY",
    replay_scope: Object.freeze({
      scope_type: "MISSION",
      allowed_record_types: Object.freeze(["RECOMMENDATION", "RISK", "CONFIDENCE", "GOVERNANCE"]),
      allowed_event_types: Object.freeze(["RECOMMENDATION_CREATED", "GOVERNANCE_DECISION_RECORDED"]),
      allowed_tenant_ids: Object.freeze(["tenant_alpha"]),
      allowed_mission_ids: Object.freeze(["mission_truth_001"]),
      redaction_required: false,
    }),
    replay_target: Object.freeze({
      target_type: "RECOMMENDATION",
      target_ids: Object.freeze(["rec_001"]),
    }),
    requested_by: Object.freeze({
      requester_id: "operator_001",
      requester_type: "OPERATOR",
    }),
    requested_at: "2026-06-24T00:00:00.000Z",
    source_truth_record_ids: Object.freeze(["truth_001", "truth_002"]),
    source_evidence_refs: Object.freeze(["evidence_001"]),
    source_lineage_refs: Object.freeze(["lineage_001"]),
    source_policy_refs: Object.freeze(["policy_snapshot_001"]),
    replay_ordering: Object.freeze({
      ordering_strategy: "LEDGER_SEQUENCE",
      tie_breaker: "TRUTH_RECORD_ID",
      require_total_order: true,
    }),
    governance_context: Object.freeze({
      policy_snapshot_id: "policy_snapshot_001",
      constitution_version: "constitution_v1",
      governance_ruleset_id: "governance_ruleset_001",
      governance_decision_ids: Object.freeze(["gov_decision_001"]),
      enforce_original_policy_context: true,
      fail_on_policy_missing: true,
      fail_on_governance_mismatch: true,
    }),
    authority_context: Object.freeze({
      requester_id: "operator_001",
      requester_type: "OPERATOR",
      authority_scope: Object.freeze(["READ_REPLAY", "CREATE_REPLAY_AUDIT"]),
      execution_authority: "NONE",
      read_authority_verified: true,
      write_authority_verified: true,
      allowed_writes: "REPLAY_AUDIT_ONLY",
      authority_expansion_allowed: false,
    }),
    input_integrity: Object.freeze({
      required_truth_records_present: true,
      required_evidence_present: true,
      required_lineage_present: true,
      required_policy_present: true,
      input_hash: "stable_input_hash_001",
    }),
    deterministic_requirements: Object.freeze({
      deterministic_serialization: true,
      deterministic_ordering_required: true,
      deterministic_hashing_required: true,
      random_seed_allowed: false,
      wall_clock_time_allowed: false,
      external_network_allowed: false,
      uncontrolled_tool_use_allowed: false,
      canonical_hash_algorithm: "SHA256",
      canonical_serialization: "STABLE_JSON",
    }),
    expected_result: Object.freeze({
      expected_output_hash: "expected_hash_001",
      mismatch_policy: "FAIL",
    }),
    failure_policy: Object.freeze({
      fail_on_missing_truth_record: true,
      fail_on_missing_evidence: true,
      fail_on_missing_lineage: true,
      fail_on_missing_policy: true,
      fail_on_hash_mismatch: true,
      fail_on_authority_violation: true,
      fail_on_tenant_violation: true,
      fail_on_governance_violation: true,
      allow_partial_replay: false,
      partial_replay_requires_escalation: true,
    }),
    output_policy: Object.freeze({
      output_type: "REPLAY_RESULT",
      write_to_ledger: true,
      mutate_source_records: false,
      include_evidence_refs: true,
      include_lineage_refs: true,
      include_governance_refs: true,
      include_hashes: true,
      include_failure_reason: true,
    }),
    audit_policy: Object.freeze({
      audit_required: true,
      audit_record_type: "REPLAY_AUDIT",
      include_requester: true,
      include_scope: true,
      include_inputs: true,
      include_outputs: true,
      include_hashes: true,
      include_failures: true,
      include_governance_context: true,
      include_authority_context: true,
    }),
    lifecycle_state: "REQUESTED",
    certification_state: "UNCERTIFIED",
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  });
  return normalizeTruthReplayContract(contract);
}

function validateTarget(contract: Record<string, unknown>, errors: TruthReplayValidationIssue[]): void {
  const target = contract.replay_target;
  if (!isRecord(target)) {
    addIssue(errors, "REPLAY_TARGET_MISSING", "Replay target is required.", "replay_target");
    return;
  }
  if (!TARGET_TYPES.has(target.target_type as TruthReplayTargetType) || values(target.target_ids).length === 0) {
    addIssue(errors, "REPLAY_TARGET_INVALID", "Replay target type and target IDs must be valid.", "replay_target");
    return;
  }
  if (REPLAY_TYPES.has(contract.replay_type as TruthReplayContractType)) {
    const allowedTargets = COMPATIBLE_TARGETS[contract.replay_type as TruthReplayContractType];
    if (!allowedTargets.includes(target.target_type as TruthReplayTargetType)) {
      addIssue(errors, "REPLAY_TYPE_TARGET_INCOMPATIBLE", "Replay type is not compatible with replay target.", "replay_target.target_type");
    }
  }
}

function validateScope(contract: Record<string, unknown>, errors: TruthReplayValidationIssue[]): void {
  const scope = contract.replay_scope;
  if (!isRecord(scope)) {
    addIssue(errors, "REPLAY_SCOPE_MISSING", "Replay scope is required.", "replay_scope");
    return;
  }
  const tenantId = text(contract.tenant_id);
  const allowedTenants = values(scope.allowed_tenant_ids);
  if (allowedTenants.length === 0 || !allowedTenants.includes(tenantId)) {
    addIssue(errors, "TENANT_SCOPE_VIOLATION", "Replay tenant must be explicitly included in allowed tenant scope.", "replay_scope.allowed_tenant_ids");
  }
  const missionId = text(contract.mission_id);
  const allowedMissions = values(scope.allowed_mission_ids);
  if ((contract.replay_type === "MISSION_REPLAY" || scope.scope_type === "MISSION") && !missionId && allowedMissions.length === 0) {
    addIssue(errors, "MISSION_ID_MISSING", "Mission replay scope requires a mission identity.", "mission_id");
  }
  if (missionId && allowedMissions.length > 0 && !allowedMissions.includes(missionId)) {
    addIssue(errors, "MISSION_SCOPE_VIOLATION", "Mission identity must be inside replay mission scope.", "replay_scope.allowed_mission_ids");
  }
  if (values(scope.restricted_fields).length > 0 && scope.redaction_required !== true) {
    addIssue(errors, "REPLAY_SCOPE_MISSING", "Restricted fields require redaction.", "replay_scope.redaction_required");
  }
}

function validateOrdering(ordering: unknown, errors: TruthReplayValidationIssue[]): void {
  if (!isRecord(ordering) || !ordering.ordering_strategy || !ordering.tie_breaker || ordering.require_total_order !== true) {
    addIssue(errors, "NON_DETERMINISTIC_ORDERING", "Replay requires deterministic total ordering and a stable tie breaker.", "replay_ordering");
  }
}

function validateGovernance(contract: Record<string, unknown>, errors: TruthReplayValidationIssue[]): void {
  const governance = contract.governance_context;
  const policyRefs = values(contract.source_policy_refs);
  if (!isRecord(governance)) {
    addIssue(errors, "GOVERNANCE_CONTEXT_REQUIRED_MISSING", "Replay governance context is required.", "governance_context");
    return;
  }
  const requiresGovernance = ["GOVERNANCE_REPLAY", "RECOMMENDATION_REPLAY", "FULL_CONTEXT_REPLAY"].includes(String(contract.replay_type));
  const hasPolicyContext = !!text(governance.policy_snapshot_id) || !!text(governance.governance_ruleset_id);
  if (requiresGovernance && !hasPolicyContext) {
    addIssue(errors, "GOVERNANCE_CONTEXT_REQUIRED_MISSING", "Replay type requires policy snapshot or governance ruleset.", "governance_context");
  }
  if (governance.enforce_original_policy_context === true && !text(governance.policy_snapshot_id)) {
    addIssue(errors, "POLICY_SNAPSHOT_REQUIRED_MISSING", "Original policy context enforcement requires a policy snapshot.", "governance_context.policy_snapshot_id");
  }
  if (governance.fail_on_policy_missing === true && !hasPolicyContext && policyRefs.length === 0) {
    addIssue(errors, "GOVERNANCE_CONTEXT_REQUIRED_MISSING", "Policy-missing failure mode requires policy refs or context.", "source_policy_refs");
  }
  if (governance.fail_on_governance_mismatch === true && governance.governance_mismatch_detected === true) {
    addIssue(errors, "GOVERNANCE_BYPASS_DETECTED", "Governance mismatch detected under fail-closed policy.", "governance_context.governance_mismatch_detected");
  }
}

function validateAuthority(authority: unknown, errors: TruthReplayValidationIssue[]): void {
  if (!isRecord(authority)) {
    addIssue(errors, "AUTHORITY_CONTEXT_INVALID", "Replay authority context is required.", "authority_context");
    return;
  }
  if (authority.execution_authority !== "NONE") {
    addIssue(errors, "EXECUTION_AUTHORITY_DETECTED", "Replay contracts cannot grant execution authority.", "authority_context.execution_authority");
  }
  if (authority.authority_expansion_allowed !== false) {
    addIssue(errors, "AUTHORITY_EXPANSION_DETECTED", "Replay contracts cannot expand authority.", "authority_context.authority_expansion_allowed");
  }
  if (authority.read_authority_verified !== true) {
    addIssue(errors, "READ_AUTHORITY_UNVERIFIED", "Replay read authority must be verified.", "authority_context.read_authority_verified");
  }
  if (authority.allowed_writes !== "NONE" && authority.allowed_writes !== "REPLAY_AUDIT_ONLY") {
    addIssue(errors, "SOURCE_MUTATION_ATTEMPTED", "Replay writes are limited to none or audit-only.", "authority_context.allowed_writes");
  }
  if (authority.allowed_writes === "REPLAY_AUDIT_ONLY" && authority.write_authority_verified !== true) {
    addIssue(errors, "WRITE_AUTHORITY_UNVERIFIED", "Audit-only writes require verified write authority.", "authority_context.write_authority_verified");
  }
}

function validateInputIntegrity(
  contract: Record<string, unknown>,
  errors: TruthReplayValidationIssue[],
  warnings: TruthReplayValidationIssue[],
): void {
  const integrity = contract.input_integrity;
  if (!isRecord(integrity)) {
    addIssue(errors, "INPUT_HASH_MISSING", "Replay input integrity block is required.", "input_integrity");
    return;
  }
  const replayType = String(contract.replay_type);
  const sourceTruthRecords = values(contract.source_truth_record_ids);
  if (sourceTruthRecords.length === 0 || integrity.required_truth_records_present !== true) {
    addIssue(errors, "SOURCE_TRUTH_RECORDS_MISSING", "Replay requires bound source truth records.", "source_truth_record_ids");
  }
  const requiresEvidence = ["EVIDENCE_REPLAY", "RECOMMENDATION_REPLAY", "GOVERNANCE_REPLAY", "FULL_CONTEXT_REPLAY"].includes(replayType);
  if (requiresEvidence && (values(contract.source_evidence_refs).length === 0 || integrity.required_evidence_present !== true)) {
    addIssue(errors, "EVIDENCE_REQUIRED_MISSING", "Replay type requires evidence references.", "source_evidence_refs");
  }
  const requiresLineage = ["LINEAGE_REPLAY", "RECOMMENDATION_REPLAY", "GOVERNANCE_REPLAY", "MISSION_REPLAY", "FULL_CONTEXT_REPLAY"].includes(replayType);
  if (requiresLineage && (values(contract.source_lineage_refs).length === 0 || integrity.required_lineage_present !== true)) {
    addIssue(errors, "LINEAGE_REQUIRED_MISSING", "Replay type requires lineage references.", "source_lineage_refs");
  }
  const requiresPolicy = ["GOVERNANCE_REPLAY", "RECOMMENDATION_REPLAY", "FULL_CONTEXT_REPLAY"].includes(replayType);
  if (requiresPolicy && (values(contract.source_policy_refs).length === 0 || integrity.required_policy_present !== true)) {
    addIssue(errors, "GOVERNANCE_CONTEXT_REQUIRED_MISSING", "Replay type requires policy references.", "source_policy_refs");
  }
  if (text(integrity.input_hash).length === 0) {
    addIssue(warnings, "INPUT_HASH_MISSING", "Replay input hash was generated by the replay contract validator.", "input_integrity.input_hash", "WARNING");
  }
  if (integrity.input_hash_mismatch_detected === true) addIssue(errors, "INPUT_HASH_MISMATCH", "Replay input hash mismatch detected.", "input_integrity.input_hash");
  if (values(integrity.missing_inputs).length > 0) addIssue(errors, "MISSING_INPUT_DETECTED", "Replay input set contains missing inputs.", "input_integrity.missing_inputs");
  if (values(integrity.corrupted_inputs).length > 0) addIssue(errors, "CORRUPTED_INPUT_DETECTED", "Replay input set contains corrupted inputs.", "input_integrity.corrupted_inputs");
  if (values(integrity.superseded_inputs).length > 0 && integrity.superseded_inputs_authorized !== true) {
    addIssue(errors, "SUPERSEDED_INPUT_UNAUTHORIZED", "Superseded replay inputs require explicit authorization.", "input_integrity.superseded_inputs");
  }
}

function validateDeterminism(requirements: unknown, errors: TruthReplayValidationIssue[]): void {
  if (!isRecord(requirements)) {
    addIssue(errors, "DETERMINISTIC_REQUIREMENTS_INVALID", "Deterministic replay requirements are required.", "deterministic_requirements");
    return;
  }
  const deterministic = requirements as Partial<TruthReplayDeterministicRequirements>;
  if (deterministic.deterministic_serialization !== true || deterministic.deterministic_ordering_required !== true || deterministic.deterministic_hashing_required !== true) {
    addIssue(errors, "DETERMINISTIC_REQUIREMENTS_INVALID", "Replay requires deterministic serialization, ordering, and hashing.", "deterministic_requirements");
  }
  if (deterministic.wall_clock_time_allowed !== false) addIssue(errors, "WALL_CLOCK_DEPENDENCY_DETECTED", "Replay contract cannot depend on wall-clock time.", "deterministic_requirements.wall_clock_time_allowed");
  if (deterministic.random_seed_allowed !== false) addIssue(errors, "RANDOM_DEPENDENCY_DETECTED", "Replay contract cannot depend on uncontrolled randomness.", "deterministic_requirements.random_seed_allowed");
  if (deterministic.external_network_allowed !== false) addIssue(errors, "NETWORK_DEPENDENCY_DETECTED", "Replay contract cannot require external network access.", "deterministic_requirements.external_network_allowed");
  if (deterministic.uncontrolled_tool_use_allowed !== false) addIssue(errors, "UNCONTROLLED_TOOL_USE_DETECTED", "Replay contract cannot require uncontrolled tool use.", "deterministic_requirements.uncontrolled_tool_use_allowed");
  if (deterministic.canonical_hash_algorithm !== "SHA256" || deterministic.canonical_serialization !== "STABLE_JSON") {
    addIssue(errors, "DETERMINISTIC_REQUIREMENTS_INVALID", "Replay hashing must use SHA256 over stable JSON.", "deterministic_requirements");
  }
}

function validateExpectedResult(expected: unknown, errors: TruthReplayValidationIssue[]): void {
  if (expected === undefined) return;
  if (!isRecord(expected)) {
    addIssue(errors, "EXPECTED_RESULT_INVALID", "Expected result must be an object.", "expected_result");
    return;
  }
  const result = expected as Partial<TruthReplayExpectedResult>;
  if (result.expected_output_hash !== undefined && text(result.expected_output_hash).length === 0) {
    addIssue(errors, "EXPECTED_RESULT_INVALID", "Expected output hash must be a non-empty stable hash.", "expected_result.expected_output_hash");
  }
  if (!["FAIL", "FLAG", "ESCALATE"].includes(String(result.mismatch_policy))) {
    addIssue(errors, "MISMATCH_POLICY_INVALID", "Expected-result mismatch policy must be valid.", "expected_result.mismatch_policy");
  }
}

function validateFailurePolicy(policy: unknown, errors: TruthReplayValidationIssue[], escalations: TruthReplayValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "FAILURE_POLICY_INVALID", "Replay failure policy is required.", "failure_policy");
    return;
  }
  const failure = policy as Partial<TruthReplayFailurePolicy>;
  if (failure.fail_on_authority_violation !== true || failure.fail_on_tenant_violation !== true || failure.fail_on_governance_violation !== true) {
    addIssue(errors, "FAILURE_POLICY_INVALID", "Authority, tenant, and governance violations must fail closed.", "failure_policy");
  }
  if (failure.allow_partial_replay === true && failure.partial_replay_requires_escalation !== true) {
    addIssue(errors, "PARTIAL_REPLAY_REQUIRES_ESCALATION", "Partial replay requires escalation.", "failure_policy.partial_replay_requires_escalation");
  }
  if (failure.allow_partial_replay === true && failure.partial_replay_requires_escalation === true) {
    escalations.push(issue("PARTIAL_REPLAY_REQUIRES_ESCALATION", "Partial replay is allowed only with escalation.", "failure_policy.allow_partial_replay", "ESCALATION"));
  }
}

function validateOutputPolicy(policy: unknown, errors: TruthReplayValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Replay output policy is required.", "output_policy");
    return;
  }
  const output = policy as Partial<TruthReplayOutputPolicy>;
  if (!["REPLAY_RESULT", "REPLAY_MISMATCH", "REPLAY_FAILURE", "REPLAY_CERTIFICATION_RESULT"].includes(String(output.output_type))) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Replay output type must be valid.", "output_policy.output_type");
  }
  if (output.mutate_source_records !== false) {
    addIssue(errors, "SOURCE_MUTATION_ATTEMPTED", "Replay output cannot mutate source records.", "output_policy.mutate_source_records");
  }
  if (output.include_hashes !== true) addIssue(errors, "OUTPUT_POLICY_INVALID", "Replay output must include hashes.", "output_policy.include_hashes");
  if (["REPLAY_MISMATCH", "REPLAY_FAILURE"].includes(String(output.output_type)) && output.include_failure_reason !== true) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Replay failure and mismatch outputs must include failure reasons.", "output_policy.include_failure_reason");
  }
}

function validateAuditPolicy(policy: unknown, errors: TruthReplayValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "AUDIT_POLICY_INVALID", "Replay audit policy is required.", "audit_policy");
    return;
  }
  const audit = policy as Partial<TruthReplayAuditPolicy>;
  const valid = audit.audit_required === true
    && audit.audit_record_type === "REPLAY_AUDIT"
    && audit.include_requester === true
    && audit.include_scope === true
    && audit.include_inputs === true
    && audit.include_outputs === true
    && audit.include_hashes === true
    && audit.include_governance_context === true
    && audit.include_authority_context === true;
  if (!valid) addIssue(errors, "AUDIT_POLICY_INVALID", "Replay audit policy must preserve requester, scope, inputs, outputs, hashes, governance, and authority.", "audit_policy");
}

export function validateTruthReplayContract(contract: unknown, checkedAt?: string): TruthReplayContractValidationResult {
  const errors: TruthReplayValidationIssue[] = [];
  const warnings: TruthReplayValidationIssue[] = [];
  const escalations: TruthReplayValidationIssue[] = [];

  if (!isRecord(contract)) {
    addIssue(errors, "REPLAY_CONTRACT_MISSING", "Replay contract is required.", "contract");
    return Object.freeze({ state: "INVALID", errors, warnings, escalation_reasons: escalations, checked_at: checkedAt });
  }

  if (!text(contract.replay_id)) addIssue(errors, "REPLAY_ID_MISSING", "Replay identity is required.", "replay_id");
  if (!text(contract.tenant_id)) addIssue(errors, "TENANT_ID_MISSING", "Tenant identity is required.", "tenant_id");
  if (!REPLAY_TYPES.has(contract.replay_type as TruthReplayContractType)) addIssue(errors, "REPLAY_TYPE_INVALID", "Replay type must be supported.", "replay_type");

  const requester = contract.requested_by;
  if (!isRecord(requester) || !text(requester.requester_id) || !REQUESTER_TYPES.has(requester.requester_type as TruthReplayRequesterType)) {
    addIssue(errors, "REQUESTER_INVALID", "Replay requester identity and type are required.", "requested_by");
  }

  validateTarget(contract, errors);
  validateScope(contract, errors);
  validateOrdering(contract.replay_ordering, errors);
  validateGovernance(contract, errors);
  validateAuthority(contract.authority_context, errors);
  validateInputIntegrity(contract, errors, warnings);
  validateDeterminism(contract.deterministic_requirements, errors);
  validateExpectedResult(contract.expected_result, errors);
  validateFailurePolicy(contract.failure_policy, errors, escalations);
  validateOutputPolicy(contract.output_policy, errors);
  validateAuditPolicy(contract.audit_policy, errors);

  if (!LIFECYCLE_STATES.has(contract.lifecycle_state as TruthReplayLifecycleState)) {
    addIssue(errors, "LIFECYCLE_STATE_INVALID", "Replay lifecycle state must be valid.", "lifecycle_state");
  }
  if (!CERTIFICATION_STATES.has(contract.certification_state as TruthReplayCertificationState)) {
    addIssue(errors, "CERTIFICATION_STATE_INVALID", "Replay certification state must be valid.", "certification_state");
  }

  let normalized: TruthReplayContract | undefined;
  let generatedHash: string | undefined;
  if (errors.length === 0) {
    normalized = normalizeTruthReplayContract(contract as TruthReplayContract);
    generatedHash = normalized.contract_hash;
    if (text(contract.contract_hash).length > 0 && contract.contract_hash !== generatedHash) {
      addIssue(errors, "CONTRACT_HASH_MISMATCH", "Replay contract hash does not match canonical contract.", "contract_hash");
      normalized = undefined;
    }
  }

  const state = errors.length > 0 ? "INVALID" : escalations.length > 0 ? "ESCALATION_REQUIRED" : "VALID";
  return Object.freeze({
    state,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    escalation_reasons: Object.freeze(escalations),
    normalized_contract: normalized,
    contract_hash: errors.length === 0 ? generatedHash : undefined,
    checked_at: checkedAt,
  });
}

export function validateTruthReplayLifecycleTransition(
  from_state: TruthReplayLifecycleState,
  to_state: TruthReplayLifecycleState,
): TruthReplayLifecycleTransitionValidation {
  const valid = LIFECYCLE_TRANSITIONS[from_state]?.includes(to_state) === true;
  return Object.freeze({
    valid,
    from_state,
    to_state,
    error: valid ? undefined : issue(
      "INVALID_LIFECYCLE_TRANSITION",
      `Replay lifecycle transition ${from_state} -> ${to_state} is not allowed.`,
      "lifecycle_state",
    ),
  });
}

export function toTruthReplayContractStorageRecord(contract: TruthReplayContract): TruthReplayContractStorageRecord {
  const normalized = normalizeTruthReplayContract(contract);
  return Object.freeze({
    replay_id: normalized.replay_id,
    tenant_id: normalized.tenant_id,
    mission_id: normalized.mission_id,
    replay_type: normalized.replay_type,
    replay_scope_json: canonicalizeConfidenceToString(normalized.replay_scope),
    replay_target_json: canonicalizeConfidenceToString(normalized.replay_target),
    source_truth_record_ids_json: canonicalizeConfidenceToString(normalized.source_truth_record_ids),
    source_event_ids_json: normalized.source_event_ids ? canonicalizeConfidenceToString(normalized.source_event_ids) : undefined,
    source_evidence_refs_json: normalized.source_evidence_refs ? canonicalizeConfidenceToString(normalized.source_evidence_refs) : undefined,
    source_lineage_refs_json: normalized.source_lineage_refs ? canonicalizeConfidenceToString(normalized.source_lineage_refs) : undefined,
    source_policy_refs_json: normalized.source_policy_refs ? canonicalizeConfidenceToString(normalized.source_policy_refs) : undefined,
    governance_context_json: canonicalizeConfidenceToString(normalized.governance_context),
    authority_context_json: canonicalizeConfidenceToString(normalized.authority_context),
    input_integrity_json: canonicalizeConfidenceToString(normalized.input_integrity),
    deterministic_requirements_json: canonicalizeConfidenceToString(normalized.deterministic_requirements),
    expected_result_json: normalized.expected_result ? canonicalizeConfidenceToString(normalized.expected_result) : undefined,
    failure_policy_json: canonicalizeConfidenceToString(normalized.failure_policy),
    output_policy_json: canonicalizeConfidenceToString(normalized.output_policy),
    audit_policy_json: canonicalizeConfidenceToString(normalized.audit_policy),
    lifecycle_state: normalized.lifecycle_state,
    certification_state: normalized.certification_state,
    contract_hash: normalized.contract_hash ?? hashTruthReplayContract(normalized),
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  });
}
