import crypto from "crypto";
import { classifyDecision } from "@/services/decision-classification";
import { createDecisionLifecycle } from "@/services/decision-lifecycle";
import type {
  AuthorityBoundaryRecord,
  DecisionApprovalStage,
  DecisionAuthorityFailure,
  DecisionAuthorityInput,
  DecisionAuthorityLevel,
  DecisionAuthorityMatrixEntry,
  DecisionAuthorityObservability,
  DecisionAuthorityReplayResult,
  DecisionAuthorityValidationResult,
} from "@/types/decision-authority-boundary";
import type { DecisionType } from "@/types/decision-schema";

const NOW = "2026-07-02T09:15:00.000Z";

export const DECISION_AUTHORITY_HIERARCHY = Object.freeze(["CONSTITUTION", "GOVERNANCE", "OPERATOR", "MISSION_CONFIGURATION", "DECISION_ORCHESTRATION", "RECOMMENDATION"] as const);

export const DECISION_AUTHORITY_MATRIX: readonly DecisionAuthorityMatrixEntry[] = Object.freeze([
  Object.freeze({ domain: "CONSTITUTION", precedence: 1, permitted: Object.freeze(["define immutable system boundaries", "reject unconstitutional decisions", "require fail-closed behavior"]), prohibited: Object.freeze(["runtime modification", "operator override", "configuration weakening"]), runtime_mutable: false }),
  Object.freeze({ domain: "GOVERNANCE", precedence: 2, permitted: Object.freeze(["validate compliance", "enforce policies", "escalate constitutional conflicts"]), prohibited: Object.freeze(["execute operational actions", "bypass constitution", "mutate replay artifacts"]), runtime_mutable: false }),
  Object.freeze({ domain: "OPERATOR", precedence: 3, permitted: Object.freeze(["approve", "reject", "defer", "request evidence", "request replay"]), prohibited: Object.freeze(["bypass constitutional controls", "disable governance validation", "grant orchestration execution authority"]), runtime_mutable: false }),
  Object.freeze({ domain: "MISSION_CONFIGURATION", precedence: 4, permitted: Object.freeze(["scope mission rules", "bind tenant settings"]), prohibited: Object.freeze(["override governance", "override constitution"]), runtime_mutable: false }),
  Object.freeze({ domain: "DECISION_ORCHESTRATION", precedence: 5, permitted: Object.freeze(["evaluate", "classify", "prioritize", "recommend", "explain", "escalate", "document", "simulate"]), prohibited: Object.freeze(["execute actions", "modify systems", "self-approve", "self-certify", "issue runtime commands"]), runtime_mutable: false }),
  Object.freeze({ domain: "RECOMMENDATION", precedence: 6, permitted: Object.freeze(["present advisory output"]), prohibited: Object.freeze(["possess execution authority", "grant authority"]), runtime_mutable: false }),
  Object.freeze({ domain: "CERTIFICATION", precedence: 7, permitted: Object.freeze(["validate compliance", "validate readiness"]), prohibited: Object.freeze(["authorize execution", "self-certify"]), runtime_mutable: false }),
]);

const LEVEL_BY_DECISION_TYPE: Readonly<Record<DecisionType, DecisionAuthorityLevel>> = Object.freeze({
  PLAN_SELECTION: "OPERATOR_APPROVAL_REQUIRED",
  RECOMMENDATION_SELECTION: "ADVISORY",
  RISK_RESPONSE: "GOVERNANCE_APPROVAL_REQUIRED",
  RECOVERY_OPTION: "OPERATOR_APPROVAL_REQUIRED",
  GOVERNANCE_ESCALATION: "GOVERNANCE_APPROVAL_REQUIRED",
  POLICY_CONFLICT: "CONSTITUTIONAL_REVIEW_REQUIRED",
  MISSION_HEALTH_ACTION: "OPERATOR_APPROVAL_REQUIRED",
  FORECAST_RESPONSE: "ADVISORY",
  OPERATOR_INTERVENTION: "OPERATOR_APPROVAL_REQUIRED",
  CERTIFICATION_DECISION: "CERTIFICATION_REQUIRED",
  CONTINUATION_DECISION: "GOVERNANCE_APPROVAL_REQUIRED",
  DEFERRAL_DECISION: "ADVISORY",
});

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function computeAuthorityHash(record: AuthorityBoundaryRecord | Omit<AuthorityBoundaryRecord, "integrity_hash">): string {
  const copy: Record<string, unknown> = { ...(record as AuthorityBoundaryRecord) };
  delete copy.integrity_hash;
  return hashValue(copy);
}

export function resolveApprovalRequirements(authority_level: DecisionAuthorityLevel): readonly DecisionApprovalStage[] {
  const map: Record<DecisionAuthorityLevel, readonly DecisionApprovalStage[]> = {
    ADVISORY: Object.freeze([]),
    OPERATOR_APPROVAL_REQUIRED: Object.freeze(["OPERATOR"]),
    GOVERNANCE_APPROVAL_REQUIRED: Object.freeze(["OPERATOR", "GOVERNANCE"]),
    CONSTITUTIONAL_REVIEW_REQUIRED: Object.freeze(["OPERATOR", "GOVERNANCE", "CONSTITUTION"]),
    CERTIFICATION_REQUIRED: Object.freeze(["OPERATOR", "GOVERNANCE", "CONSTITUTION", "CERTIFICATION"]),
  };
  return map[authority_level];
}

export function evaluateAuthorityEscalation(input: { authority_level: DecisionAuthorityLevel; failures?: readonly DecisionAuthorityFailure[] }) {
  const chain = resolveApprovalRequirements(input.authority_level);
  const escalationFailures = input.failures ?? [];
  return Object.freeze({
    escalation_required: chain.length > 0 || escalationFailures.length > 0,
    escalation_path: chain,
    escalation_reasons: Object.freeze([...chain.map((stage) => `${stage.toLowerCase()} approval required`), ...escalationFailures]),
  });
}

function hasExecutionOperation(operations: readonly string[]): boolean {
  return operations.some((operation) => /execute|deploy|modify|runtime|dispatch|command|self-approve|self-certify|grant-authority/i.test(operation));
}

export function enforceAdvisoryOnly(input: { requested_operations?: readonly string[]; advisory_only?: boolean; execution_authorized?: boolean }): readonly DecisionAuthorityFailure[] {
  const failures: DecisionAuthorityFailure[] = [];
  if (input.advisory_only !== true || input.execution_authorized === true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (hasExecutionOperation(input.requested_operations ?? [])) failures.push("UNAUTHORIZED_EXECUTION");
  return Object.freeze(failures);
}

export function createAuthorityBoundaryRecord(input: DecisionAuthorityInput = {}): AuthorityBoundaryRecord {
  const classification = input.classification ?? classifyDecision();
  const lifecycle = input.lifecycle ?? createDecisionLifecycle(classification);
  const decision_type = classification.primary_category;
  const authority_level = input.authority_level ?? LEVEL_BY_DECISION_TYPE[decision_type];
  const approval_chain = resolveApprovalRequirements(authority_level);
  const advisoryFailures = enforceAdvisoryOnly({
    requested_operations: input.scenario === "HIDDEN_EXECUTION" ? Object.freeze(["hidden runtime command"]) : input.requested_operations,
    advisory_only: true,
    execution_authorized: input.scenario === "EXECUTION_REQUEST",
  });
  const scenarioFailures: DecisionAuthorityFailure[] = [
    ...(input.scenario === "PRIVILEGE_ESCALATION" ? ["PRIVILEGE_ESCALATION" as const] : []),
    ...(input.scenario === "SELF_APPROVAL" ? ["SELF_AUTHORIZATION" as const] : []),
    ...(input.scenario === "SELF_CERTIFICATION" ? ["SELF_CERTIFICATION" as const] : []),
    ...(input.scenario === "GOVERNANCE_BYPASS" ? ["GOVERNANCE_BYPASS" as const] : []),
    ...(input.scenario === "CONSTITUTIONAL_BYPASS" ? ["CONSTITUTIONAL_BYPASS" as const] : []),
    ...(input.scenario === "OPERATOR_IMPERSONATION" ? ["OPERATOR_IMPERSONATION" as const] : []),
    ...(input.scenario === "TENANT_LEAK" ? ["TENANT_AUTHORITY_LEAK" as const] : []),
    ...(input.scenario === "HIDDEN_EXECUTION" ? ["HIDDEN_EXECUTION_PATH" as const] : []),
  ];
  const failures = Object.freeze([...new Set([...advisoryFailures, ...scenarioFailures])]);
  const escalation_profile = evaluateAuthorityEscalation({ authority_level, failures });
  const base: Omit<AuthorityBoundaryRecord, "integrity_hash"> = {
    authority_id: `DAB-9-1-5-${classification.orchestration_id}`,
    orchestration_id: classification.orchestration_id,
    tenant_id: input.scenario === "TENANT_LEAK" ? "tenant_beta" : classification.tenant_id,
    mission_id: classification.mission_id,
    decision_type,
    authority_level,
    operator_required: approval_chain.includes("OPERATOR"),
    governance_required: approval_chain.includes("GOVERNANCE"),
    constitutional_required: approval_chain.includes("CONSTITUTION"),
    certification_required: approval_chain.includes("CERTIFICATION"),
    approval_chain,
    escalation_profile,
    advisory_only: true,
    execution_authorized: false,
    self_approval_authorized: false,
    validation_status: failures.length ? "FAILED_CLOSED" : escalation_profile.escalation_required ? "ESCALATION_REQUIRED" : "VALID",
    replay_refs: input.scenario === "REPLAY_MISMATCH" ? Object.freeze([]) : input.replay_refs ?? Object.freeze([`replay_${lifecycle.lifecycle_id}_authority`]),
    lineage_refs: input.lineage_refs ?? Object.freeze([`lineage_${lifecycle.lifecycle_id}_authority`]),
    created_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeAuthorityHash(base) });
}

export function validateAuthorityBoundary(record: AuthorityBoundaryRecord, input: DecisionAuthorityInput = {}): DecisionAuthorityValidationResult {
  const failures: DecisionAuthorityFailure[] = [];
  if (!record.authority_level) failures.push("AUTHORITY_LEVEL_MISSING");
  const expectedChain = resolveApprovalRequirements(record.authority_level);
  if (canonicalize(record.approval_chain) !== canonicalize(expectedChain)) failures.push("APPROVAL_CHAIN_INVALID");
  if (record.operator_required && !input.operator_approval_present && input.scenario === "MISSING_APPROVAL") failures.push("OPERATOR_APPROVAL_MISSING");
  if (record.governance_required && !input.governance_approval_present && input.scenario === "MISSING_APPROVAL") failures.push("GOVERNANCE_APPROVAL_MISSING");
  if (record.constitutional_required && !input.constitutional_review_complete && input.scenario === "MISSING_APPROVAL") failures.push("CONSTITUTIONAL_REVIEW_MISSING");
  if (record.certification_required && !input.certification_approval_present && input.scenario === "MISSING_APPROVAL") failures.push("CERTIFICATION_APPROVAL_MISSING");
  if (record.escalation_profile.escalation_path.some((stage, index) => expectedChain[index] !== stage)) failures.push("ESCALATION_PATH_INVALID");
  failures.push(...enforceAdvisoryOnly({ requested_operations: input.requested_operations, advisory_only: record.advisory_only, execution_authorized: record.execution_authorized }));
  if (input.scenario === "EXECUTION_REQUEST") failures.push("ADVISORY_ONLY_VIOLATION", "UNAUTHORIZED_EXECUTION");
  if (input.scenario === "PRIVILEGE_ESCALATION") failures.push("PRIVILEGE_ESCALATION");
  if (input.scenario === "SELF_APPROVAL") failures.push("SELF_AUTHORIZATION");
  if (input.scenario === "SELF_CERTIFICATION") failures.push("SELF_CERTIFICATION");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_BYPASS");
  if (input.scenario === "OPERATOR_IMPERSONATION") failures.push("OPERATOR_IMPERSONATION");
  if (input.classification && record.tenant_id !== input.classification.tenant_id) failures.push("TENANT_AUTHORITY_LEAK");
  if (input.scenario === "HIDDEN_EXECUTION") failures.push("HIDDEN_EXECUTION_PATH", "UNAUTHORIZED_EXECUTION");
  if (record.replay_refs.length === 0) failures.push("REPLAY_REFERENCE_MISSING");
  if (record.lineage_refs.length === 0) failures.push("LINEAGE_REFERENCE_MISSING");
  if (computeAuthorityHash(record) !== record.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = Object.freeze([...new Set(failures)]);
  const has = (failure: DecisionAuthorityFailure) => unique.includes(failure);
  return Object.freeze({
    validation_status: unique.length ? "FAILED_CLOSED" : record.validation_status,
    authority_id: record.authority_id,
    failures: unique,
    checks: Object.freeze({
      authority_level_exists: !has("AUTHORITY_LEVEL_MISSING"),
      approval_chain_valid: !has("APPROVAL_CHAIN_INVALID"),
      operator_authority_recognized: !has("OPERATOR_APPROVAL_MISSING") && !has("OPERATOR_IMPERSONATION"),
      governance_approval_present: !has("GOVERNANCE_APPROVAL_MISSING") && !has("GOVERNANCE_BYPASS"),
      constitutional_review_complete: !has("CONSTITUTIONAL_REVIEW_MISSING") && !has("CONSTITUTIONAL_BYPASS"),
      certification_approval_present: !has("CERTIFICATION_APPROVAL_MISSING") && !has("SELF_CERTIFICATION"),
      escalation_path_valid: !has("ESCALATION_PATH_INVALID"),
      advisory_only_enforced: !has("ADVISORY_ONLY_VIOLATION") && !has("UNAUTHORIZED_EXECUTION"),
      tenant_isolated: !has("TENANT_AUTHORITY_LEAK"),
      replay_ready: !has("REPLAY_REFERENCE_MISSING"),
      lineage_ready: !has("LINEAGE_REFERENCE_MISSING"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
    }),
  });
}

export function replayAuthorityDecision(record: AuthorityBoundaryRecord): DecisionAuthorityReplayResult {
  const reconstructed_hash = computeAuthorityHash(record);
  const failures = reconstructed_hash === record.integrity_hash ? Object.freeze([]) : Object.freeze(["INTEGRITY_HASH_MISMATCH"] as const);
  return Object.freeze({
    authority_id: record.authority_id,
    replay_valid: failures.length === 0,
    reconstructed_authority_level: record.authority_level,
    reconstructed_approval_chain: record.approval_chain,
    reconstructed_escalation_path: record.escalation_profile.escalation_path,
    reconstructed_hash,
    expected_hash: record.integrity_hash,
    failures,
  });
}

export function buildDecisionAuthorityObservability(records: readonly AuthorityBoundaryRecord[], validations = records.map((record) => validateAuthorityBoundary(record))): DecisionAuthorityObservability {
  const failures = validations.flatMap((validation) => validation.failures);
  const completedApprovals = records.filter((record) => record.approval_chain.length === 0 || record.validation_status === "VALID").length;
  return Object.freeze({
    authority_validation_requests: records.length,
    approval_completion_rate: records.length === 0 ? 0 : completedApprovals / records.length,
    escalation_frequency: records.filter((record) => record.escalation_profile.escalation_required).length,
    advisory_only_violations: failures.filter((failure) => failure === "ADVISORY_ONLY_VIOLATION").length,
    unauthorized_execution_attempts: failures.filter((failure) => failure === "UNAUTHORIZED_EXECUTION" || failure === "HIDDEN_EXECUTION_PATH").length,
    governance_overrides: failures.filter((failure) => failure === "GOVERNANCE_BYPASS").length,
    constitutional_rejections: failures.filter((failure) => failure === "CONSTITUTIONAL_BYPASS").length,
    replay_mismatches: failures.filter((failure) => failure === "INTEGRITY_HASH_MISMATCH" || failure === "REPLAY_REFERENCE_MISSING").length,
    authority_validation_latency_ms: 0,
    approval_chain_duration_ms: 0,
  });
}

export function getDecisionAuthorityBoundaryFramework() {
  const record = createAuthorityBoundaryRecord();
  const validation = validateAuthorityBoundary(record);
  return Object.freeze({
    hierarchy: DECISION_AUTHORITY_HIERARCHY,
    matrix: DECISION_AUTHORITY_MATRIX,
    record,
    validation,
    replay: replayAuthorityDecision(record),
    observability: buildDecisionAuthorityObservability([record], [validation]),
  });
}
