import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecoveryApprovalState,
  RecoveryCategory,
  RecoveryContract,
  RecoveryContractFailure,
  RecoveryContractInput,
  RecoveryContractObservabilitySurface,
  RecoveryContractScenario,
  RecoveryContractValidationResult,
  RecoveryFailureCategory,
  RecoveryFailureType,
  RecoveryIntegrityStatus,
  RecoveryLifecycleState,
  RecoveryLifecycleTransitionResult,
  RecoveryRecord,
  RecoveryReplayResult,
  RecoveryRiskLevel,
  RecoveryValidationStatus,
} from "@/types/recovery-contract";

const NOW = "2026-07-03T12:00:00.000Z";
const VERSION = "recovery-contract/v8ALT.2.1" as const;
const REPLAY_VERSION = "recovery-replay/v8ALT.2.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:recovery-contract:primary";
const WORKFLOW_ID = "workflow:autonomous-recovery-intelligence";
const PLAN_ID = "plan:controlled-autonomy-recovery";

const lifecycleStates: readonly RecoveryLifecycleState[] = Object.freeze(["CREATED", "FAILURE_DETECTED", "ANALYZING", "RECOVERY_GENERATED", "VALIDATING", "RECOMMENDING", "AWAITING_OPERATOR_APPROVAL", "APPROVED", "REJECTED", "READY", "CLOSED"]);
const failureCategories: readonly RecoveryFailureCategory[] = Object.freeze(["EXECUTION", "PLANNING", "DEPENDENCY", "ORCHESTRATION", "SUPERVISION", "INTEGRITY"]);
const failureTypes: readonly RecoveryFailureType[] = Object.freeze([
  "execution timeout",
  "execution interruption",
  "execution deadlock",
  "execution sequencing failure",
  "invalid plan",
  "incomplete plan",
  "dependency omission",
  "planning conflict",
  "missing dependency",
  "circular dependency",
  "dependency unavailable",
  "dependency mismatch",
  "scheduling conflict",
  "workflow interruption",
  "coordination failure",
  "checkpoint failure",
  "monitoring interruption",
  "supervision drift",
  "policy detection failure",
  "visibility degradation",
  "hash mismatch",
  "replay mismatch",
  "lineage corruption",
  "audit inconsistency",
]);
const recoveryCategories: readonly RecoveryCategory[] = Object.freeze(["CONTINUE", "CHECKPOINT_RESTORE", "RETRY", "RESTART", "ROLLBACK", "ALTERNATIVE_PATH", "PARTIAL_RECOVERY", "ESCALATE", "TERMINATE", "MANUAL_INTERVENTION"]);
const approvalStates: readonly RecoveryApprovalState[] = Object.freeze(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED"]);
const transitionPairs: readonly [RecoveryLifecycleState, RecoveryLifecycleState][] = Object.freeze([
  ["CREATED", "FAILURE_DETECTED"],
  ["FAILURE_DETECTED", "ANALYZING"],
  ["ANALYZING", "RECOVERY_GENERATED"],
  ["RECOVERY_GENERATED", "VALIDATING"],
  ["VALIDATING", "RECOMMENDING"],
  ["RECOMMENDING", "AWAITING_OPERATOR_APPROVAL"],
  ["AWAITING_OPERATOR_APPROVAL", "APPROVED"],
  ["AWAITING_OPERATOR_APPROVAL", "REJECTED"],
  ["APPROVED", "READY"],
  ["REJECTED", "CLOSED"],
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailures(scenario: RecoveryContractScenario): readonly RecoveryContractFailure[] {
  const map: Partial<Record<RecoveryContractScenario, RecoveryContractFailure>> = {
    MISSING_IDENTITY: "IDENTITY_MISSING",
    INVALID_TRANSITION: "LIFECYCLE_TRANSITION_INVALID",
    INVALID_FAILURE_CLASSIFICATION: "FAILURE_CLASSIFICATION_INVALID",
    INVALID_RECOVERY_CLASSIFICATION: "RECOVERY_CLASSIFICATION_INVALID",
    INCOMPLETE_RECOMMENDATION: "RECOMMENDATION_SCHEMA_INVALID",
    AUTHORITY_INVALID: "AUTHORITY_INVALID",
    GOVERNANCE_BYPASS: "GOVERNANCE_INVALID",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_INVALID",
    APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    LINEAGE_BROKEN: "LINEAGE_INVALID",
    INTEGRITY_MISSING: "INTEGRITY_INVALID",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_DETECTED",
    HIDDEN_RECOVERY_LOGIC: "HIDDEN_RECOVERY_LOGIC_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function authorityStatus(failures: readonly RecoveryContractFailure[]): RecoveryValidationStatus {
  return failures.some((failure) => ["AUTHORITY_INVALID", "TENANT_ISOLATION_INVALID", "AUTHORITY_ESCALATION_DETECTED"].includes(failure)) ? "INVALID" : "VALID";
}

function governanceStatus(failures: readonly RecoveryContractFailure[]) {
  return failures.includes("GOVERNANCE_INVALID") || failures.includes("POLICY_MUTATION_DETECTED") ? "BLOCKED" as const : "COMPLIANT" as const;
}

function constitutionalStatus(failures: readonly RecoveryContractFailure[]) {
  return failures.includes("CONSTITUTIONAL_INVALID") ? "VIOLATION" as const : "COMPLIANT" as const;
}

function approvalStateFor(input: RecoveryContractInput, failures: readonly RecoveryContractFailure[]): RecoveryApprovalState {
  if (input.approval_state) return input.approval_state;
  if (failures.includes("OPERATOR_APPROVAL_MISSING")) return "PENDING";
  if (failures.includes("GOVERNANCE_INVALID") || failures.includes("CONSTITUTIONAL_INVALID") || failures.includes("AUTHORITY_INVALID")) return "REJECTED";
  return "APPROVED";
}

function lifecycleStateFor(input: RecoveryContractInput, approval_state: RecoveryApprovalState, failures: readonly RecoveryContractFailure[]): RecoveryLifecycleState {
  if (input.lifecycle_state) return input.lifecycle_state;
  if (failures.includes("LIFECYCLE_TRANSITION_INVALID")) return "CREATED";
  if (approval_state === "APPROVED" && failures.length === 0) return "READY";
  if (approval_state === "REJECTED") return "CLOSED";
  return "AWAITING_OPERATOR_APPROVAL";
}

function recoveryRiskFor(failures: readonly RecoveryContractFailure[]): RecoveryRiskLevel {
  if (failures.some((failure) => ["AUTONOMOUS_EXECUTION_DETECTED", "AUTHORITY_ESCALATION_DETECTED", "TENANT_ISOLATION_INVALID"].includes(failure))) return "CRITICAL";
  if (failures.some((failure) => ["GOVERNANCE_INVALID", "CONSTITUTIONAL_INVALID", "INTEGRITY_INVALID", "REPLAY_INVALID"].includes(failure))) return "HIGH";
  if (failures.length > 0) return "MEDIUM";
  return "LOW";
}

export function validateRecoveryLifecycleTransition(from: RecoveryLifecycleState, to: RecoveryLifecycleState): RecoveryLifecycleTransitionResult {
  const valid = transitionPairs.some(([source, target]) => source === from && target === to);
  const source = { from, to, valid, failure: valid ? null : "LIFECYCLE_TRANSITION_INVALID" as const };
  return Object.freeze({ ...source, transition_hash: hashValue("recovery-lifecycle-transition", source) });
}

function lifecycleTransitionCatalog(): readonly RecoveryLifecycleTransitionResult[] {
  return freezeArray(transitionPairs.map(([from, to]) => validateRecoveryLifecycleTransition(from, to)));
}

export function computeRecoveryRecordHash(record: Omit<RecoveryRecord, "record_hash"> | RecoveryRecord): string {
  const { record_hash: _hash, ...source } = record as RecoveryRecord;
  return hashValue("recovery-contract-record", source);
}

export function createRecoveryRecord(input: RecoveryContractInput = {}): RecoveryRecord {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenant_id = scenario === "MISSING_IDENTITY" ? "" : scenario === "TENANT_ISOLATION_FAILURE" ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const mission_id = scenario === "MISSING_IDENTITY" ? "" : input.mission_id ?? MISSION_ID;
  const execution_id = scenario === "MISSING_IDENTITY" ? "" : input.execution_id ?? EXECUTION_ID;
  const workflow_id = scenario === "MISSING_IDENTITY" ? "" : input.workflow_id ?? WORKFLOW_ID;
  const plan_id = scenario === "MISSING_IDENTITY" ? "" : input.plan_id ?? PLAN_ID;
  const recovery_type = input.recovery_type ?? "CHECKPOINT_RESTORE";
  const recommendation_type = scenario === "INVALID_RECOVERY_CLASSIFICATION" ? "RESTART" : recovery_type;
  const recovery_id = id("RCV", "recovery-id", { tenant_id, mission_id, execution_id, workflow_id, plan_id, recovery_type });
  const integrity_hash = failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-identity-integrity", { recovery_id, tenant_id, mission_id, execution_id, workflow_id, plan_id });
  const approval_state = approvalStateFor(input, failures);
  const lifecycle_state = lifecycleStateFor(input, approval_state, failures);
  const failure_category: RecoveryFailureCategory = failures.includes("FAILURE_CLASSIFICATION_INVALID") ? "INTEGRITY" : "EXECUTION";
  const failure_type: RecoveryFailureType = failures.includes("FAILURE_CLASSIFICATION_INVALID") ? "audit inconsistency" : "execution timeout";
  const authority_validation = authorityStatus(failures);
  const replay_checksum = failures.includes("REPLAY_INVALID") ? "mismatch" : hashValue("recovery-replay-checksum", { recovery_id, execution_id, failure_type, recovery_type, approval_state });
  const lineage_reference = failures.includes("LINEAGE_INVALID") ? "" : id("RCL", "recovery-lineage", { recovery_id, execution_id, plan_id });
  const recommendationIntegrity = failures.includes("RECOMMENDATION_SCHEMA_INVALID") || failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-recommendation-integrity", { recovery_id, recovery_type, authority_validation, approval_state });
  const recommendationBase = {
    recommendation_id: id("RCR", "recovery-recommendation-id", { recovery_id, recovery_type }),
    recovery_id,
    recommendation_type,
    summary: failures.includes("RECOMMENDATION_SCHEMA_INVALID") ? "" : "Restore the last verified checkpoint after operator approval.",
    root_cause: "Execution timeout exceeded the deterministic recovery threshold.",
    expected_outcome: "Mission state is returned to a verified checkpoint without autonomous execution.",
    recovery_steps: failures.includes("RECOMMENDATION_SCHEMA_INVALID")
      ? freezeArray<string>([])
      : freezeArray(["Freeze current execution context", "Verify checkpoint integrity", "Request explicit operator approval", "Prepare checkpoint restore package"]),
    estimated_duration: "PT15M",
    confidence_score: failures.length ? 0.62 : 0.94,
    recovery_risk: recoveryRiskFor(failures),
    governance_validation: governanceStatus(failures) === "COMPLIANT" ? "VALID" as const : "INVALID" as const,
    constitutional_validation: constitutionalStatus(failures) === "COMPLIANT" ? "VALID" as const : "INVALID" as const,
    authority_validation,
    replay_reference: `replay:${recovery_id}`,
    lineage_reference,
    integrity_hash: recommendationIntegrity,
    approval_status: approval_state,
  };
  const recommendation = Object.freeze({ ...recommendationBase, recommendation_hash: hashValue("recovery-recommendation", recommendationBase) });
  const authorityBase = {
    operator_authority: authority_validation,
    governance_authority: authority_validation,
    constitutional_authority: failures.includes("CONSTITUTIONAL_INVALID") ? "INVALID" as const : "VALID" as const,
    execution_permissions: authority_validation,
    tenant_ownership: failures.includes("TENANT_ISOLATION_INVALID") ? "INVALID" as const : "VALID" as const,
    recovery_authorization: authority_validation,
    mission_authorization: authority_validation,
    authority_reference: `authority:${tenant_id}:${mission_id}`,
  };
  const approvalBase = {
    approval_state,
    required: true as const,
    operator_id: approval_state === "APPROVED" || approval_state === "REJECTED" ? "operator:recovery-control" : null,
    reviewed_timestamp: approval_state === "APPROVED" || approval_state === "REJECTED" ? NOW : null,
    approval_reference: `approval:${recovery_id}`,
  };
  const replayBase = {
    replay_reference: `replay:${recovery_id}`,
    replay_version: REPLAY_VERSION,
    execution_snapshot: hashValue("recovery-execution-snapshot", { execution_id, lifecycle_state }),
    failure_snapshot: hashValue("recovery-failure-snapshot", { failure_category, failure_type }),
    recovery_snapshot: hashValue("recovery-snapshot", { recovery_type, recommendation: recommendation.recommendation_hash }),
    replay_checksum,
    deterministic_signature: replay_checksum === "mismatch" ? "" : hashValue("recovery-deterministic-signature", { recovery_id, replay_checksum }),
    replay_timestamp: NOW,
  };
  const governanceBase = {
    governance_status: governanceStatus(failures),
    governing_policy: failures.includes("POLICY_MUTATION_DETECTED") ? "" : "policy:autonomous-recovery-advisory-only",
    constitutional_reference: failures.includes("CONSTITUTIONAL_INVALID") ? "" : "constitution:operator-supremacy",
    authority_reference: authorityBase.authority_reference,
    policy_validation: failures.includes("POLICY_MUTATION_DETECTED") || failures.includes("GOVERNANCE_INVALID") ? "INVALID" as const : "VALID" as const,
    compliance_status: constitutionalStatus(failures),
    governance_decision: failures.length ? "ESCALATE" as const : "ALLOW_RECOMMENDATION" as const,
    governance_timestamp: NOW,
  };
  const lineageBase = {
    lineage_reference,
    parent_execution: execution_id,
    originating_plan: plan_id,
    originating_failure: `failure:${recovery_id}`,
    recovery_chain: freezeArray([recovery_id]),
    recommendation_chain: freezeArray([recommendation.recommendation_id]),
    mission_reference: mission_id,
    tenant_reference: tenant_id,
  };
  const integrityBase = {
    integrity_hash,
    previous_hash: hashValue("recovery-previous-hash", { tenant_id, mission_id }),
    chain_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-chain-hash", { recovery_id, previous: tenant_id, recommendation: recommendation.recommendation_hash }),
    verification_status: failures.includes("INTEGRITY_INVALID") ? "FAILED" as RecoveryIntegrityStatus : "VERIFIED" as RecoveryIntegrityStatus,
    immutable_timestamp: NOW,
    signature_reference: failures.includes("INTEGRITY_INVALID") ? "" : `signature:${recovery_id}`,
  };
  const base = {
    identity: Object.freeze({
      recovery_id,
      mission_id,
      execution_id,
      workflow_id,
      plan_id,
      tenant_id,
      recovery_version: VERSION,
      recovery_type,
      created_timestamp: NOW,
      integrity_hash,
    }),
    lifecycle_state,
    failure_classification: Object.freeze({
      classification_id: id("RCF", "recovery-failure-classification", { recovery_id, failure_category, failure_type }),
      recovery_id,
      failure_category,
      failure_type,
      severity: recoveryRiskFor(failures),
      root_cause: "Runtime exceeded the allowed execution window.",
      detected_timestamp: NOW,
      evidence_reference: failures.includes("FAILURE_CLASSIFICATION_INVALID") ? "" : `evidence:${recovery_id}:failure`,
      classification_hash: hashValue("recovery-failure-classification", { recovery_id, failure_category, failure_type }),
    }),
    recommendation,
    authority_validation: Object.freeze({ ...authorityBase, authority_hash: hashValue("recovery-authority-validation", authorityBase) }),
    approval_workflow: Object.freeze({ ...approvalBase, approval_hash: hashValue("recovery-approval-workflow", approvalBase) }),
    replay_metadata: Object.freeze({ ...replayBase, replay_hash: hashValue("recovery-replay-metadata", replayBase) }),
    governance_metadata: Object.freeze({ ...governanceBase, governance_hash: hashValue("recovery-governance-metadata", governanceBase) }),
    lineage_metadata: Object.freeze({ ...lineageBase, lineage_hash: hashValue("recovery-lineage-metadata", lineageBase) }),
    integrity_metadata: Object.freeze(integrityBase),
    advisory_only: true as const,
    autonomous_execution_authorized: scenario === "AUTONOMOUS_EXECUTION_ATTEMPT",
    rollback_authorized: false,
    restart_authorized: false,
    policy_modified: scenario === "POLICY_MUTATION_ATTEMPT",
    authority_escalated: scenario === "AUTHORITY_ESCALATION_ATTEMPT",
    hidden_recovery_logic: scenario === "HIDDEN_RECOVERY_LOGIC",
  };
  return Object.freeze({ ...base, record_hash: computeRecoveryRecordHash(base as Omit<RecoveryRecord, "record_hash">) });
}

export function validateRecoveryContract(record?: RecoveryRecord): RecoveryContractValidationResult {
  if (!record) {
    const failures = freezeArray<RecoveryContractFailure>(["IDENTITY_MISSING"]);
    const source = { recovery_id: null, valid: false, identity_valid: false, lifecycle_valid: false, failure_classification_valid: false, recovery_classification_valid: false, recommendation_valid: false, authority_valid: false, governance_valid: false, constitutional_valid: false, operator_approval_enforced: false, replay_valid: false, lineage_valid: false, integrity_valid: false, tenant_isolated: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("recovery-contract-validation", source) });
  }
  const identity_valid = Boolean(record.identity.recovery_id && record.identity.mission_id && record.identity.execution_id && record.identity.workflow_id && record.identity.plan_id && record.identity.tenant_id && record.identity.integrity_hash);
  const lifecycle_valid = lifecycleStates.includes(record.lifecycle_state)
    && (record.approval_workflow.approval_state !== "APPROVED" || record.lifecycle_state === "READY" || record.lifecycle_state === "APPROVED")
    && (record.approval_workflow.approval_state !== "REJECTED" || record.lifecycle_state === "CLOSED" || record.lifecycle_state === "REJECTED")
    && (record.approval_workflow.approval_state !== "PENDING" || record.lifecycle_state === "AWAITING_OPERATOR_APPROVAL");
  const failure_classification_valid = failureCategories.includes(record.failure_classification.failure_category) && failureTypes.includes(record.failure_classification.failure_type) && Boolean(record.failure_classification.evidence_reference);
  const recovery_classification_valid = recoveryCategories.includes(record.identity.recovery_type) && recoveryCategories.includes(record.recommendation.recommendation_type) && record.identity.recovery_type === record.recommendation.recommendation_type;
  const recommendation_valid = Boolean(record.recommendation.recommendation_id && record.recommendation.summary && record.recommendation.root_cause && record.recommendation.expected_outcome && record.recommendation.recovery_steps.length && record.recommendation.integrity_hash && record.recommendation.replay_reference && record.recommendation.lineage_reference);
  const authority_values = Object.values(record.authority_validation).filter((value): value is RecoveryValidationStatus => value === "VALID" || value === "INVALID" || value === "MISSING");
  const authority_valid = authority_values.length >= 7 && authority_values.every((value) => value === "VALID") && record.recommendation.authority_validation === "VALID" && !record.authority_escalated;
  const governance_valid = record.governance_metadata.governance_status === "COMPLIANT" && record.governance_metadata.policy_validation === "VALID" && Boolean(record.governance_metadata.governing_policy) && !record.policy_modified;
  const constitutional_valid = record.governance_metadata.compliance_status === "COMPLIANT" && record.recommendation.constitutional_validation === "VALID" && Boolean(record.governance_metadata.constitutional_reference);
  const operator_approval_enforced = record.approval_workflow.required && approvalStates.includes(record.approval_workflow.approval_state) && record.recommendation.approval_status === record.approval_workflow.approval_state && record.approval_workflow.approval_state !== "PENDING";
  const replay_valid = record.replay_metadata.replay_checksum !== "mismatch" && Boolean(record.replay_metadata.deterministic_signature && record.replay_metadata.execution_snapshot && record.replay_metadata.failure_snapshot && record.replay_metadata.recovery_snapshot);
  const lineage_valid = Boolean(record.lineage_metadata.lineage_reference && record.lineage_metadata.parent_execution && record.lineage_metadata.originating_plan && record.lineage_metadata.recovery_chain.includes(record.identity.recovery_id));
  const integrity_valid = Boolean(record.integrity_metadata.integrity_hash && record.integrity_metadata.chain_hash && record.integrity_metadata.signature_reference) && record.integrity_metadata.verification_status === "VERIFIED";
  const tenant_isolated = record.identity.tenant_id === TENANT_ID || record.identity.tenant_id.startsWith("tenant:");
  const advisory_only = record.advisory_only && !record.autonomous_execution_authorized && !record.rollback_authorized && !record.restart_authorized && !record.hidden_recovery_logic;
  const immutable_hash_valid = computeRecoveryRecordHash(record) === record.record_hash;
  const failures = unique([
    ...(!identity_valid ? ["IDENTITY_MISSING" as const] : []),
    ...(!lifecycle_valid ? ["LIFECYCLE_TRANSITION_INVALID" as const] : []),
    ...(!failure_classification_valid ? ["FAILURE_CLASSIFICATION_INVALID" as const] : []),
    ...(!recovery_classification_valid ? ["RECOVERY_CLASSIFICATION_INVALID" as const] : []),
    ...(!recommendation_valid ? ["RECOMMENDATION_SCHEMA_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!operator_approval_enforced ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!lineage_valid ? ["LINEAGE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(record.autonomous_execution_authorized || record.rollback_authorized || record.restart_authorized ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(record.policy_modified ? ["POLICY_MUTATION_DETECTED" as const] : []),
    ...(record.authority_escalated ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(record.hidden_recovery_logic ? ["HIDDEN_RECOVERY_LOGIC_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { recovery_id: record.identity.recovery_id, valid, identity_valid, lifecycle_valid, failure_classification_valid, recovery_classification_valid, recommendation_valid, authority_valid, governance_valid, constitutional_valid, operator_approval_enforced, replay_valid, lineage_valid, integrity_valid, tenant_isolated, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-contract-validation", source) });
}

export function replayRecoveryContract(record = createRecoveryRecord()): RecoveryReplayResult {
  const reconstructed_hash = computeRecoveryRecordHash(record);
  const deterministic = reconstructed_hash === record.record_hash && record.replay_metadata.replay_checksum !== "mismatch" && Boolean(record.replay_metadata.deterministic_signature);
  const source = {
    replay_reference: record.replay_metadata.replay_reference,
    recovery_id: record.identity.recovery_id,
    deterministic,
    reconstructed_state: record.lifecycle_state,
    reconstructed_hash,
    original_hash: record.record_hash,
    replay_checksum: record.replay_metadata.replay_checksum,
  };
  return Object.freeze({ ...source, replay_result_hash: hashValue("recovery-contract-replay-result", source) });
}

export function buildRecoveryContractObservabilitySurface(record = createRecoveryRecord()): RecoveryContractObservabilitySurface {
  const validation = validateRecoveryContract(record);
  return Object.freeze({
    recovery_id: record.identity.recovery_id,
    lifecycle_state: record.lifecycle_state,
    failure_category: record.failure_classification.failure_category,
    failure_type: record.failure_classification.failure_type,
    recommendation_type: record.recommendation.recommendation_type,
    approval_state: record.approval_workflow.approval_state,
    governance_status: record.governance_metadata.governance_status,
    constitutional_status: record.governance_metadata.compliance_status,
    authority_valid: validation.authority_valid,
    replay_valid: validation.replay_valid,
    integrity_status: record.integrity_metadata.verification_status,
    tenant_id: record.identity.tenant_id,
    advisory_only: true,
    record_hash: record.record_hash,
  });
}

export function getRecoveryContract(): RecoveryContract {
  const recovery = createRecoveryRecord();
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      principles: freezeArray(["immutable", "deterministic", "replayable", "governance-first", "constitutional-compliance", "operator-supremacy", "tenant-isolated", "append-only", "advisory-only", "fail-closed"]),
      lifecycle_states: lifecycleStates,
      failure_categories: failureCategories,
      failure_types: failureTypes,
      recovery_categories: recoveryCategories,
      approval_states: approvalStates,
      advisory_only: true,
      operator_approval_required: true,
    }),
    lifecycle_transitions: lifecycleTransitionCatalog(),
    recovery,
    validation: validateRecoveryContract(recovery),
    replay: replayRecoveryContract(recovery),
    observability: buildRecoveryContractObservabilitySurface(recovery),
  });
}
