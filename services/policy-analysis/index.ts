import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceFoundationCertificationGate } from "@/services/governance-intelligence";
import type {
  PolicyAnalysisDoctrine,
  PolicyAnalysisFailureReason,
  PolicyAnalysisObservabilitySurface,
  PolicyAnalysisPolicyType,
  PolicyAnalysisRecord,
  PolicyAnalysisReplayResult,
  PolicyAnalysisState,
  PolicyAnalysisValidationFailure,
  PolicyAnalysisValidationResult,
} from "@/types/policy-analysis";

const NOW = "2026-06-25T04:00:00.000Z";
export const POLICY_ANALYSIS_POLICY_TYPES = [
  "GOVERNANCE_POLICY",
  "SECURITY_POLICY",
  "RUNTIME_POLICY",
  "AUTHORITY_POLICY",
  "COMPLIANCE_POLICY",
  "RISK_POLICY",
  "CERTIFICATION_POLICY",
  "TENANT_POLICY",
  "MISSION_POLICY",
  "RECOVERY_POLICY",
  "VISIBILITY_POLICY",
  "SIMULATION_POLICY",
] as const;
export const POLICY_ANALYSIS_STATES = ["CREATED", "VALIDATED", "REPLAYABLE", "RESTRICTED", "SUPERSEDED", "INVALID", "ARCHIVED"] as const;

const ALLOWED_POLICY_ANALYSIS_TRANSITIONS: Readonly<Record<PolicyAnalysisState, readonly PolicyAnalysisState[]>> = Object.freeze({
  CREATED: Object.freeze(["VALIDATED", "INVALID"] as const),
  VALIDATED: Object.freeze(["REPLAYABLE", "INVALID"] as const),
  REPLAYABLE: Object.freeze(["RESTRICTED", "SUPERSEDED", "ARCHIVED"] as const),
  RESTRICTED: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  INVALID: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezePolicyAnalysis(record: PolicyAnalysisRecord): PolicyAnalysisRecord {
  return Object.freeze({
    ...record,
    authority_scope: Object.freeze({ ...record.authority_scope }),
    governance_scope: Object.freeze({ ...record.governance_scope }),
    constraints: Object.freeze(record.constraints.map((item) => Object.freeze({ ...item }))),
    exceptions: Object.freeze(record.exceptions.map((item) => Object.freeze({ ...item }))),
    permissions: Object.freeze(record.permissions.map((item) => Object.freeze({ ...item }))),
    prohibitions: Object.freeze(record.prohibitions.map((item) => Object.freeze({ ...item }))),
    enforcement_boundaries: Object.freeze({
      ...record.enforcement_boundaries,
      included_systems: Object.freeze([...record.enforcement_boundaries.included_systems]),
      excluded_systems: Object.freeze([...record.enforcement_boundaries.excluded_systems]),
      included_actions: Object.freeze([...record.enforcement_boundaries.included_actions]),
      excluded_actions: Object.freeze([...record.enforcement_boundaries.excluded_actions]),
      blocked_actions: Object.freeze([...record.enforcement_boundaries.blocked_actions]),
      non_enforceable_domains: Object.freeze([...record.enforcement_boundaries.non_enforceable_domains]),
      fail_closed_conditions: Object.freeze([...record.enforcement_boundaries.fail_closed_conditions]),
    }),
    source_truth_records: Object.freeze(record.source_truth_records.map((item) => Object.freeze({
      ...item,
      evidence_refs: Object.freeze([...item.evidence_refs]),
      lineage_refs: Object.freeze([...item.lineage_refs]),
      replay_refs: Object.freeze([...item.replay_refs]),
    }))),
    lineage_refs: Object.freeze({
      ...record.lineage_refs,
      child_policy_ids: Object.freeze([...record.lineage_refs.child_policy_ids]),
      inherited_policy_ids: Object.freeze([...record.lineage_refs.inherited_policy_ids]),
      related_policy_ids: Object.freeze([...record.lineage_refs.related_policy_ids]),
      dependency_refs: Object.freeze([...record.lineage_refs.dependency_refs]),
    }),
    replay_refs: Object.freeze({ ...record.replay_refs }),
    inheritance: Object.freeze({
      ...record.inheritance,
      inherits_from: Object.freeze([...record.inheritance.inherits_from]),
      inherited_constraints: Object.freeze([...record.inheritance.inherited_constraints]),
      inherited_exceptions: Object.freeze([...record.inheritance.inherited_exceptions]),
      inheritance_limits: Object.freeze([...record.inheritance.inheritance_limits]),
    }),
    supersession: Object.freeze({
      ...record.supersession,
      supersedes: Object.freeze([...record.supersession.supersedes]),
    }),
  });
}

export function buildPolicyAnalysisDoctrine(): PolicyAnalysisDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "replayable", "tenant-scoped", "versioned", "auditable", "lineage-preserving", "truth-ledger-compatible", "governance-safe", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["policy analysis without contract", "policy interpretation without tenant", "policy interpretation without authority", "policy analysis without truth references", "policy analysis without replay references", "cross-tenant policy leakage", "identifier mutation", "silent lineage repair", "hidden exceptions", "unscoped permissions", "autonomous policy enforcement", "autonomous policy modification"]),
    supported_policy_types: Object.freeze([...POLICY_ANALYSIS_POLICY_TYPES]),
    allowed_state_transitions: ALLOWED_POLICY_ANALYSIS_TRANSITIONS,
  });
}

export function canonicalizePolicyAnalysis(record: Omit<PolicyAnalysisRecord, "analysis_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computePolicyAnalysisHash(record: Omit<PolicyAnalysisRecord, "analysis_hash"> | PolicyAnalysisRecord): string {
  const { analysis_hash: _analysisHash, ...source } = record as PolicyAnalysisRecord;
  return hashConfidenceValue("policy-analysis-contract", canonicalizePolicyAnalysis(source));
}

export function buildPolicyAnalysisRecord(input: Partial<PolicyAnalysisRecord> = {}): PolicyAnalysisRecord {
  const foundation = runGovernanceFoundationCertificationGate();
  const sourceWithoutHash: Omit<PolicyAnalysisRecord, "analysis_hash"> = {
    schema_version: "policy-analysis-contract/v7B.1",
    policy_analysis_id: input.policy_analysis_id ?? "pa_tenant_alpha_policy_runtime_000145",
    policy_id: input.policy_id ?? "policy_runtime_network_access",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    policy_version: input.policy_version ?? "v1.4.2",
    policy_name: input.policy_name ?? "Runtime Network Access Policy",
    policy_type: input.policy_type ?? "RUNTIME_POLICY",
    authority_scope: input.authority_scope ?? {
      governing_authority: "Constitution Engine",
      approval_authority: "Governance Control Layer",
      review_authority: "Operator",
      escalation_authority: "Governance Escalation Engine",
      operator_authority_required: true,
    },
    governance_scope: input.governance_scope ?? {
      tenant_scope: input.tenant_id ?? "tenant_alpha",
      mission_scope: "mission_query_layer",
      system_scope: "Mission Control",
      runtime_scope: "advisory_runtime",
      risk_scope: "medium_or_above",
      certification_scope: "required",
      decision_scope: "advisory_decision_support",
      visibility_scope: "operator_visible",
    },
    constraints: input.constraints ?? [
      { constraint_id: "constraint_tenant_match", category: "tenant", rule: "tenant must match", required: true, truth_reference: "truth_policy_7b1_001" },
      { constraint_id: "constraint_advisory_only", category: "authority", rule: "recommendation must remain advisory-only", required: true, truth_reference: "truth_policy_7b1_002" },
    ],
    exceptions: input.exceptions ?? [
      { exception_id: "exception_operator_review", condition: "operator-only visibility required", allowed_behavior: "restrict display to operator", authority_required: "Operator", expiration_rule: "expires_on_policy_revision", truth_reference: "truth_policy_exception_7b1_001", replay_reference: "replay_policy_exception_7b1_001" },
    ],
    permissions: input.permissions ?? [
      { permission_id: "permission_truth_read", behavior: "read approved Truth Ledger records", scope: "tenant_alpha", authority_ref: "Constitution Engine" },
      { permission_id: "permission_policy_lineage", behavior: "analyze policy lineage", scope: "tenant_alpha", authority_ref: "Governance Control Layer" },
    ],
    prohibitions: input.prohibitions ?? [
      { prohibition_id: "prohibition_execute", behavior: "execute runtime action", scope: "all", fail_closed: true },
      { prohibition_id: "prohibition_mutate", behavior: "modify policy autonomously", scope: "all", fail_closed: true },
      { prohibition_id: "prohibition_cross_tenant", behavior: "access cross-tenant truth records", scope: "all", fail_closed: true },
    ],
    enforcement_boundaries: input.enforcement_boundaries ?? {
      included_systems: ["Mission Control", "Truth Ledger"],
      excluded_systems: ["external execution systems"],
      included_actions: ["analyze", "explain", "correlate"],
      excluded_actions: ["execute", "approve", "mutate"],
      runtime_boundary: "advisory_only",
      operator_boundary: "operator_supremacy_preserved",
      governance_boundary: "constitution_supremacy_preserved",
      tenant_boundary: "tenant_scoped",
      max_authority: "advisory",
      blocked_actions: ["execute", "approve", "mutate", "bypass_governance"],
      non_enforceable_domains: ["external execution systems"],
      operator_override_rules: "operator supremacy preserved",
      fail_closed_conditions: ["missing truth", "missing replay", "tenant mismatch", "unknown policy type"],
    },
    source_truth_records: input.source_truth_records ?? [
      { truth_record_id: "truth_policy_7b1_001", event_type: "POLICY_CREATED", event_source: "Truth Ledger", tenant_id: input.tenant_id ?? "tenant_alpha", mission_id: "mission_query_layer", lifecycle_state: "CERTIFIED", evidence_refs: ["evidence_policy_7b1_001"], lineage_refs: ["lineage_policy_7b1_root"], replay_refs: ["replay_policy_7b1_001"], integrity_hash: foundation.certification_hash, created_timestamp: NOW },
    ],
    lineage_refs: input.lineage_refs ?? {
      parent_policy_id: null,
      child_policy_ids: [],
      superseded_policy_id: null,
      superseding_policy_id: null,
      inherited_policy_ids: [],
      related_policy_ids: ["policy_runtime_authority_boundary"],
      dependency_refs: ["dependency_truth_ledger"],
      lineage_hash: hashValue("policy-analysis-lineage", { policy_id: input.policy_id ?? "policy_runtime_network_access", tenant_id: input.tenant_id ?? "tenant_alpha" }),
    },
    replay_refs: input.replay_refs ?? {
      input_snapshot_ref: "policy_analysis_input_snapshot_7b1",
      policy_snapshot_ref: "policy_snapshot_v1_4_2",
      truth_snapshot_ref: "truth_snapshot_policy_7b1",
      analysis_algorithm_version: "policy-analysis-contract/v7B.1",
      state_snapshot_ref: "policy_analysis_state_created",
      output_hash: "pending",
      replay_timestamp: NOW,
    },
    inheritance: input.inheritance ?? {
      inherits_from: [],
      inheritance_mode: "NONE",
      inherited_constraints: [],
      inherited_exceptions: [],
      inheritance_limits: ["no circular inheritance"],
    },
    supersession: input.supersession ?? {
      supersedes: [],
      superseded_by: null,
      supersession_reason: null,
      effective_timestamp: NOW,
      historical_validity: "retained",
    },
    created_timestamp: input.created_timestamp ?? NOW,
    analysis_state: input.analysis_state ?? "CREATED",
  };
  const outputHash = hashValue("policy-analysis-output", { policy_analysis_id: sourceWithoutHash.policy_analysis_id, policy_id: sourceWithoutHash.policy_id, policy_version: sourceWithoutHash.policy_version, constraints: sourceWithoutHash.constraints, exceptions: sourceWithoutHash.exceptions });
  const withReplayOutput = {
    ...sourceWithoutHash,
    replay_refs: input.replay_refs ?? { ...sourceWithoutHash.replay_refs, output_hash: outputHash },
  };
  return freezePolicyAnalysis({ ...withReplayOutput, analysis_hash: input.analysis_hash ?? computePolicyAnalysisHash(withReplayOutput) });
}

function validationFailure(reason: PolicyAnalysisFailureReason, field_path: string, message: string): PolicyAnalysisValidationFailure {
  return Object.freeze({
    failure_id: hashValue("policy-analysis-validation-failure", { reason, field_path, message }),
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

export function validatePolicyAnalysisRecord(record: Partial<PolicyAnalysisRecord> | undefined, context: { original_record?: PolicyAnalysisRecord } = {}): PolicyAnalysisValidationResult {
  const failures: PolicyAnalysisValidationFailure[] = [];
  if (runGovernanceFoundationCertificationGate().certification_state === "FAIL") failures.push(validationFailure("FOUNDATION_NOT_CERTIFIED", "foundation", "Governance Intelligence foundation is not certified"));
  if (!record) failures.push(validationFailure("POLICY_ANALYSIS_ID_MISSING", "policy_analysis_id", "PolicyAnalysis contract missing"));
  if (!record?.policy_analysis_id) failures.push(validationFailure("POLICY_ANALYSIS_ID_MISSING", "policy_analysis_id", "missing policy_analysis_id"));
  if (!record?.policy_id) failures.push(validationFailure("POLICY_ID_MISSING", "policy_id", "missing policy_id"));
  if (!record?.tenant_id) failures.push(validationFailure("TENANT_ID_MISSING", "tenant_id", "missing tenant_id"));
  if (!record?.policy_version) failures.push(validationFailure("POLICY_VERSION_MISSING", "policy_version", "missing policy_version"));
  if (!record?.policy_name) failures.push(validationFailure("POLICY_NAME_MISSING", "policy_name", "missing policy_name"));
  if (!record?.policy_type || !(POLICY_ANALYSIS_POLICY_TYPES as readonly string[]).includes(record.policy_type)) failures.push(validationFailure("UNKNOWN_POLICY_TYPE", "policy_type", "unknown policy_type"));
  if (!record?.authority_scope) failures.push(validationFailure("AUTHORITY_SCOPE_MISSING", "authority_scope", "missing authority_scope"));
  if (!record?.governance_scope) failures.push(validationFailure("GOVERNANCE_SCOPE_MISSING", "governance_scope", "missing governance_scope"));
  if (!record?.constraints || record.constraints.length === 0) failures.push(validationFailure("CONSTRAINTS_MISSING", "constraints", "missing constraints"));
  if (!record?.enforcement_boundaries) failures.push(validationFailure("ENFORCEMENT_BOUNDARIES_MISSING", "enforcement_boundaries", "missing enforcement_boundaries"));
  if (!record?.source_truth_records || record.source_truth_records.length === 0) failures.push(validationFailure("SOURCE_TRUTH_RECORDS_MISSING", "source_truth_records", "missing source Truth Ledger records"));
  if (!record?.lineage_refs) failures.push(validationFailure("LINEAGE_REFS_MISSING", "lineage_refs", "missing lineage refs"));
  if (!record?.replay_refs) failures.push(validationFailure("REPLAY_REFS_MISSING", "replay_refs", "missing replay refs"));
  if (!record?.analysis_state || !(POLICY_ANALYSIS_STATES as readonly string[]).includes(record.analysis_state)) failures.push(validationFailure("INVALID_ANALYSIS_STATE", "analysis_state", "invalid analysis_state"));

  if (record?.authority_scope && (!record.authority_scope.governing_authority || !record.authority_scope.approval_authority || !record.authority_scope.review_authority || !record.authority_scope.escalation_authority)) failures.push(validationFailure("AUTHORITY_SCOPE_MISSING", "authority_scope", "authority scope incomplete"));
  if (record?.governance_scope) {
    if (record.governance_scope.tenant_scope !== record.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "governance_scope.tenant_scope", "governance scope tenant mismatch"));
    if (!record.governance_scope.system_scope || !record.governance_scope.runtime_scope || !record.governance_scope.decision_scope || !record.governance_scope.visibility_scope) failures.push(validationFailure("GOVERNANCE_SCOPE_MISSING", "governance_scope", "governance scope incomplete"));
  }
  for (const exception of record?.exceptions ?? []) {
    if (!exception.exception_id || !exception.condition || !exception.allowed_behavior || !exception.authority_required || !exception.expiration_rule || !exception.truth_reference || !exception.replay_reference) failures.push(validationFailure("EXCEPTION_INVALID", "exceptions", "exception is not explicit and replayable"));
    if (exception.exception_id.includes("hidden")) failures.push(validationFailure("EXCEPTION_INVALID", "exceptions", "hidden exception detected"));
  }
  for (const permission of record?.permissions ?? []) {
    if (!permission.scope || !permission.authority_ref) failures.push(validationFailure("PERMISSION_UNSCOPED", "permissions", "permission is unscoped"));
  }
  for (const prohibition of record?.prohibitions ?? []) {
    if (!prohibition.scope) failures.push(validationFailure("PROHIBITION_UNSCOPED", "prohibitions", "prohibition is unscoped"));
  }
  if (record?.permissions?.some((permission) => record.prohibitions?.some((prohibition) => prohibition.behavior === permission.behavior))) failures.push(validationFailure("PROHIBITION_BYPASS_DETECTED", "permissions", "permission conflicts with prohibition"));
  if (record?.enforcement_boundaries) {
    if (record.enforcement_boundaries.runtime_boundary !== "advisory_only" || !record.enforcement_boundaries.blocked_actions.includes("execute") || record.enforcement_boundaries.max_authority !== "advisory") failures.push(validationFailure("ENFORCEMENT_LIMITS_MISSING", "enforcement_boundaries", "enforcement limits missing"));
  }
  for (const truth of record?.source_truth_records ?? []) {
    if (truth.tenant_id !== record?.tenant_id) failures.push(validationFailure("TRUTH_TENANT_MISMATCH", "source_truth_records", "truth record tenant mismatch"));
  }
  if (record?.lineage_refs?.lineage_hash === "broken_lineage" || record?.lineage_refs?.dependency_refs.includes("broken_lineage")) failures.push(validationFailure("LINEAGE_BREAK_DETECTED", "lineage_refs", "lineage break detected"));
  if (record?.inheritance && record.inheritance.inherits_from.includes(record.policy_id ?? "")) failures.push(validationFailure("CIRCULAR_INHERITANCE", "inheritance.inherits_from", "circular inheritance detected"));
  if (record?.replay_refs) {
    if (!record.replay_refs.input_snapshot_ref || !record.replay_refs.policy_snapshot_ref || !record.replay_refs.truth_snapshot_ref || !record.replay_refs.analysis_algorithm_version || !record.replay_refs.state_snapshot_ref || !record.replay_refs.output_hash) failures.push(validationFailure("REPLAY_REFS_MISSING", "replay_refs", "replay refs incomplete"));
    if (record.replay_refs.output_hash === "mismatch") failures.push(validationFailure("REPLAY_OUTPUT_MISMATCH", "replay_refs.output_hash", "replay output mismatch"));
  }
  if (context.original_record) {
    if (context.original_record.policy_analysis_id !== record?.policy_analysis_id || context.original_record.policy_id !== record?.policy_id || context.original_record.tenant_id !== record?.tenant_id) failures.push(validationFailure("IDENTIFIER_MUTATION", "identity", "identifier mutation detected"));
  }
  if (record?.analysis_hash && computePolicyAnalysisHash(record as PolicyAnalysisRecord) !== record.analysis_hash) failures.push(validationFailure("REPLAY_OUTPUT_MISMATCH", "analysis_hash", "analysis hash mismatch"));

  return Object.freeze({
    validation_id: hashValue("policy-analysis-validation", { id: record?.policy_analysis_id, failures: failures.map((failure) => failure.failure_id) }),
    policy_analysis_id: record?.policy_analysis_id,
    validation_state: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    policy_analysis_hash: failures.length ? undefined : record?.analysis_hash,
    deterministic: true,
    replayable: Boolean(record?.replay_refs && failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "REPLAY_OUTPUT_MISMATCH")),
    tenant_scoped: failures.every((failure) => !["TENANT_ID_MISSING", "TENANT_MISMATCH", "TRUTH_TENANT_MISMATCH"].includes(failure.reason)),
    advisory_only: true,
  });
}

export function transitionPolicyAnalysisState(record: PolicyAnalysisRecord, to_state: PolicyAnalysisState): PolicyAnalysisValidationResult {
  const allowed = ALLOWED_POLICY_ANALYSIS_TRANSITIONS[record.analysis_state]?.includes(to_state);
  if (!allowed) {
    return Object.freeze({
      validation_id: hashValue("policy-analysis-state-transition", { id: record.policy_analysis_id, from: record.analysis_state, to_state }),
      policy_analysis_id: record.policy_analysis_id,
      validation_state: "FAIL",
      failures: Object.freeze([validationFailure("INVALID_STATE_TRANSITION", "analysis_state", `${record.analysis_state} to ${to_state} blocked`)]),
      deterministic: true,
      replayable: false,
      tenant_scoped: true,
      advisory_only: true,
    });
  }
  const { analysis_hash: _previousHash, ...recordWithoutHash } = record;
  return validatePolicyAnalysisRecord(buildPolicyAnalysisRecord({ ...recordWithoutHash, analysis_state: to_state }));
}

export function replayPolicyAnalysis(record: PolicyAnalysisRecord): PolicyAnalysisReplayResult {
  const reconstructedHash = computePolicyAnalysisHash(record);
  const validation = validatePolicyAnalysisRecord(record);
  const mismatch = reconstructedHash !== record.analysis_hash || record.replay_refs.output_hash === "mismatch";
  return Object.freeze({
    replay_id: hashValue("policy-analysis-replay", { id: record.policy_analysis_id, reconstructedHash }),
    policy_analysis_id: record.policy_analysis_id,
    validation_state: validation.validation_state === "PASS" && !mismatch ? "PASS" : "FAIL",
    failure_reason: mismatch ? "REPLAY_OUTPUT_MISMATCH" : validation.failures[0]?.reason ?? null,
    reconstructed_hash: reconstructedHash,
    expected_hash: record.analysis_hash,
    final_state: record.analysis_state,
  });
}

export function buildPolicyAnalysisObservabilitySurface(record: PolicyAnalysisRecord): PolicyAnalysisObservabilitySurface {
  const validation = validatePolicyAnalysisRecord(record);
  return Object.freeze({
    policy_analysis_id: record.policy_analysis_id,
    policy_id: record.policy_id,
    policy_version: record.policy_version,
    policy_type: record.policy_type,
    governing_authority: record.authority_scope.governing_authority,
    applicable_scope: record.governance_scope,
    constraints: record.constraints,
    exceptions: record.exceptions,
    permissions: record.permissions,
    prohibitions: record.prohibitions,
    enforcement_boundaries: record.enforcement_boundaries,
    source_truth_records: record.source_truth_records,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    analysis_state: record.analysis_state,
    validation_failures: validation.failures,
  });
}
