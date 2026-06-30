import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthExpectedIntegrityState,
  TruthIntegrityContract,
  TruthIntegrityContractEventName,
  TruthIntegrityContractStorageRecord,
  TruthIntegrityContractValidationResult,
  TruthIntegrityFailureCode,
  TruthIntegrityLifecycleState,
  TruthIntegrityResultState,
  TruthIntegrityScopeType,
  TruthIntegrityTargetType,
  TruthIntegrityType,
  TruthIntegrityValidationIssue,
  TruthReplayDeterminismGateState,
} from "./types";

export const TRUTH_INTEGRITY_CONTRACT_EVENTS: Readonly<Record<TruthIntegrityContractEventName, TruthIntegrityContractEventName>> = Object.freeze({
  INTEGRITY_CONTRACT_CREATED: "INTEGRITY_CONTRACT_CREATED",
  INTEGRITY_CONTRACT_VALIDATED: "INTEGRITY_CONTRACT_VALIDATED",
  INTEGRITY_CONTRACT_REJECTED: "INTEGRITY_CONTRACT_REJECTED",
  INTEGRITY_TARGET_BOUND: "INTEGRITY_TARGET_BOUND",
  INTEGRITY_SCOPE_VERIFIED: "INTEGRITY_SCOPE_VERIFIED",
  INTEGRITY_SOURCES_BOUND: "INTEGRITY_SOURCES_BOUND",
  INTEGRITY_HASH_REQUIREMENTS_BOUND: "INTEGRITY_HASH_REQUIREMENTS_BOUND",
  INTEGRITY_SCHEMA_REQUIREMENTS_BOUND: "INTEGRITY_SCHEMA_REQUIREMENTS_BOUND",
  INTEGRITY_GOVERNANCE_BOUND: "INTEGRITY_GOVERNANCE_BOUND",
  INTEGRITY_AUTHORITY_VERIFIED: "INTEGRITY_AUTHORITY_VERIFIED",
  INTEGRITY_EVIDENCE_CONTEXT_BOUND: "INTEGRITY_EVIDENCE_CONTEXT_BOUND",
  INTEGRITY_LINEAGE_CONTEXT_BOUND: "INTEGRITY_LINEAGE_CONTEXT_BOUND",
  INTEGRITY_REPLAY_CONTEXT_BOUND: "INTEGRITY_REPLAY_CONTEXT_BOUND",
  INTEGRITY_READY: "INTEGRITY_READY",
  INTEGRITY_CONTRACT_VALIDATION_FAILED: "INTEGRITY_CONTRACT_VALIDATION_FAILED",
});

export const TRUTH_INTEGRITY_RESULT_PRECEDENCE: Readonly<Record<TruthIntegrityResultState, number>> = Object.freeze({
  VERIFIED: 0,
  MISMATCH: 1,
  INCOMPLETE: 2,
  CORRUPTED: 3,
  UNAUTHORIZED: 4,
  INVALID: 5,
});

const INTEGRITY_TYPES = new Set<TruthIntegrityType>([
  "TRUTH_RECORD_INTEGRITY",
  "EVENT_INTEGRITY",
  "EVIDENCE_INTEGRITY",
  "LINEAGE_INTEGRITY",
  "GOVERNANCE_INTEGRITY",
  "RECOMMENDATION_INTEGRITY",
  "RISK_INTEGRITY",
  "CONFIDENCE_INTEGRITY",
  "REPLAY_CONTRACT_INTEGRITY",
  "REPLAY_INPUT_BUNDLE_INTEGRITY",
  "REPLAY_STATE_PACKAGE_INTEGRITY",
  "REPLAY_OUTPUT_VERIFICATION_INTEGRITY",
  "REPLAY_DETERMINISM_GATE_INTEGRITY",
  "SCHEMA_INTEGRITY",
  "MISSION_INTEGRITY",
  "FULL_CONTEXT_INTEGRITY",
]);

const SCOPE_TYPES = new Set<TruthIntegrityScopeType>(["RECORD", "EVENT", "CHAIN", "GRAPH", "MISSION", "REPLAY", "TENANT", "FULL_CONTEXT"]);
const TARGET_TYPES = new Set<TruthIntegrityTargetType>([
  "TRUTH_RECORD",
  "EVENT",
  "EVIDENCE",
  "EVIDENCE_CHAIN",
  "LINEAGE_GRAPH",
  "GOVERNANCE_DECISION",
  "POLICY_SNAPSHOT",
  "RECOMMENDATION",
  "RISK_RECORD",
  "CONFIDENCE_RECORD",
  "REPLAY_CONTRACT",
  "REPLAY_INPUT_BUNDLE",
  "REPLAY_STATE_PACKAGE",
  "REPLAY_OUTPUT_VERIFICATION",
  "REPLAY_DETERMINISM_GATE",
  "SCHEMA",
  "MISSION",
  "FULL_CONTEXT",
]);
const REQUESTER_TYPES = new Set(["OPERATOR", "SYSTEM", "AUDITOR", "CERTIFICATION_SUITE", "GOVERNANCE_ENGINE"]);
const RESULT_STATES = new Set<TruthIntegrityResultState>(["VERIFIED", "MISMATCH", "INCOMPLETE", "CORRUPTED", "UNAUTHORIZED", "INVALID"]);
const LIFECYCLE_STATES = new Set<TruthIntegrityLifecycleState>(["REQUESTED", "VALIDATED", "REJECTED", "READY", "ARCHIVED"]);
const CERTIFICATION_STATES = new Set(["UNCERTIFIED", "CONTRACT_VALIDATED", "INTEGRITY_READY", "CONTRACT_REJECTED"]);
const GATE_STATES = new Set<TruthReplayDeterminismGateState>(["REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID"]);

const COMPATIBLE_TARGETS: Readonly<Record<TruthIntegrityType, readonly TruthIntegrityTargetType[]>> = Object.freeze({
  TRUTH_RECORD_INTEGRITY: ["TRUTH_RECORD"],
  EVENT_INTEGRITY: ["EVENT"],
  EVIDENCE_INTEGRITY: ["EVIDENCE", "EVIDENCE_CHAIN"],
  LINEAGE_INTEGRITY: ["LINEAGE_GRAPH"],
  GOVERNANCE_INTEGRITY: ["GOVERNANCE_DECISION", "POLICY_SNAPSHOT"],
  RECOMMENDATION_INTEGRITY: ["RECOMMENDATION"],
  RISK_INTEGRITY: ["RISK_RECORD"],
  CONFIDENCE_INTEGRITY: ["CONFIDENCE_RECORD"],
  REPLAY_CONTRACT_INTEGRITY: ["REPLAY_CONTRACT"],
  REPLAY_INPUT_BUNDLE_INTEGRITY: ["REPLAY_INPUT_BUNDLE"],
  REPLAY_STATE_PACKAGE_INTEGRITY: ["REPLAY_STATE_PACKAGE"],
  REPLAY_OUTPUT_VERIFICATION_INTEGRITY: ["REPLAY_OUTPUT_VERIFICATION"],
  REPLAY_DETERMINISM_GATE_INTEGRITY: ["REPLAY_DETERMINISM_GATE"],
  SCHEMA_INTEGRITY: ["SCHEMA"],
  MISSION_INTEGRITY: ["MISSION"],
  FULL_CONTEXT_INTEGRITY: ["FULL_CONTEXT"],
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function values(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function hasAnySource(sourceRefs: unknown): boolean {
  if (!isRecord(sourceRefs)) return false;
  return Object.values(sourceRefs).some((value) => values(value).length > 0);
}

function issue(
  code: TruthIntegrityFailureCode,
  message: string,
  path: string,
  severity: TruthIntegrityValidationIssue["severity"] = "ERROR",
): TruthIntegrityValidationIssue {
  return Object.freeze({ code, message, path, severity });
}

function addIssue(
  collection: TruthIntegrityValidationIssue[],
  code: TruthIntegrityFailureCode,
  message: string,
  path: string,
  severity: TruthIntegrityValidationIssue["severity"] = "ERROR",
): void {
  collection.push(issue(code, message, path, severity));
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function contractHashPayload(contract: TruthIntegrityContract): Record<string, unknown> {
  return {
    integrity_contract_id: contract.integrity_contract_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    integrity_type: contract.integrity_type,
    integrity_scope: contract.integrity_scope,
    integrity_target: contract.integrity_target,
    requested_by: contract.requested_by,
    requested_at: contract.requested_at,
    source_refs: contract.source_refs,
    expected_integrity: contract.expected_integrity,
    observed_integrity: contract.observed_integrity,
    hash_requirements: contract.hash_requirements,
    schema_requirements: contract.schema_requirements,
    governance_context: contract.governance_context,
    authority_context: contract.authority_context,
    evidence_context: contract.evidence_context,
    lineage_context: contract.lineage_context,
    replay_context: contract.replay_context,
    failure_policy: contract.failure_policy,
    output_policy: contract.output_policy,
    audit_policy: contract.audit_policy,
  };
}

export function hashTruthIntegrityContract(contract: TruthIntegrityContract): string {
  return hashValue("mission-control-integrity-contract-hash", contractHashPayload(contract));
}

export function normalizeTruthIntegrityContract(contract: TruthIntegrityContract): TruthIntegrityContract {
  const withoutHash = Object.freeze({ ...contract, contract_hash: undefined });
  return Object.freeze({
    ...contract,
    contract_hash: hashTruthIntegrityContract(withoutHash),
  });
}

export function createDefaultTruthIntegrityContractFixture(overrides: Partial<TruthIntegrityContract> = {}): TruthIntegrityContract {
  const contract: TruthIntegrityContract = Object.freeze({
    integrity_contract_id: "integrity_contract_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    integrity_type: "FULL_CONTEXT_INTEGRITY",
    integrity_scope: Object.freeze({
      scope_type: "FULL_CONTEXT",
      allowed_tenant_ids: Object.freeze(["tenant_alpha"]),
      allowed_mission_ids: Object.freeze(["mission_truth_001"]),
      allowed_target_types: Object.freeze(["FULL_CONTEXT"]),
      allowed_record_types: Object.freeze(["RECOMMENDATION", "RISK", "CONFIDENCE", "GOVERNANCE"]),
      allowed_event_types: Object.freeze(["RECOMMENDATION_CREATED", "GOVERNANCE_DECISION_RECORDED"]),
      include_evidence: true,
      include_lineage: true,
      include_governance: true,
      include_replay_artifacts: true,
      include_schema_context: true,
      redaction_required: false,
    }) as TruthIntegrityContract["integrity_scope"],
    integrity_target: Object.freeze({
      target_type: "FULL_CONTEXT",
      target_ids: Object.freeze(["full_context_001"]),
      target_description: "Full recommendation decision context",
    }),
    requested_by: Object.freeze({
      requester_id: "operator_001",
      requester_type: "OPERATOR",
      requester_reason: "certification",
    }),
    requested_at: "2026-06-24T00:00:00.000Z",
    source_refs: Object.freeze({
      truth_record_ids: Object.freeze(["truth_001", "truth_002"]),
      event_ids: Object.freeze(["event_001"]),
      evidence_refs: Object.freeze(["evidence_001"]),
      lineage_refs: Object.freeze(["lineage_001"]),
      governance_refs: Object.freeze(["gov_decision_001"]),
      policy_refs: Object.freeze(["policy_snapshot_001"]),
      recommendation_refs: Object.freeze(["rec_001"]),
      risk_refs: Object.freeze(["risk_001"]),
      confidence_refs: Object.freeze(["confidence_001"]),
      replay_refs: Object.freeze(["replay_contract_001", "input_bundle_001", "state_package_001", "output_verification_001", "gate_001"]),
      schema_refs: Object.freeze(["schema_integrity_v1"]),
    }),
    expected_integrity: Object.freeze({
      expected_hashes: Object.freeze([
        Object.freeze({ ref: "full_context_001", hash: "full_context_hash_001", algorithm: "SHA256" as const, canonical_serialization: "STABLE_JSON" as const }),
      ]),
      expected_schema_versions: Object.freeze([
        Object.freeze({ schema_ref: "schema_integrity_v1", schema_version: "integrity_contract/v1", schema_hash: "schema_hash_001" }),
      ]),
      expected_tenant_id: "tenant_alpha",
      expected_mission_id: "mission_truth_001",
      expected_governance_refs: Object.freeze(["gov_decision_001"]),
      expected_evidence_refs: Object.freeze(["evidence_001"]),
      expected_lineage_refs: Object.freeze(["lineage_001"]),
      expected_replay_refs: Object.freeze(["replay_contract_001", "input_bundle_001", "state_package_001", "output_verification_001", "gate_001"]),
      expected_record_count: 2,
      expected_event_count: 1,
      expected_evidence_count: 1,
      expected_lineage_edge_count: 1,
      expected_integrity_result: "VERIFIED",
    }),
    hash_requirements: Object.freeze({
      required_hash_algorithm: "SHA256",
      canonical_serialization: "STABLE_JSON",
      expected_hash_required: true,
      observed_hash_required: false,
      hash_chain_required: true,
      fail_on_hash_mismatch: true,
      unsupported_hash_algorithm_detected: false,
      unstable_serialization_allowed: false,
    }),
    schema_requirements: Object.freeze({
      schema_version_required: true,
      schema_hash_required: true,
      expected_schema_versions: Object.freeze(["integrity_contract/v1"]),
      schema_mismatch_policy: "FAIL",
      allow_silent_schema_substitution: false,
      allow_deprecated_schema: false,
    }),
    governance_context: Object.freeze({
      policy_snapshot_id: "policy_snapshot_001",
      constitution_version: "constitution_v1",
      governance_ruleset_id: "governance_ruleset_001",
      governance_decision_refs: Object.freeze(["gov_decision_001"]),
      restriction_refs: Object.freeze(["restriction_001"]),
      escalation_refs: Object.freeze([]),
      historical_policy_required: true,
      current_policy_substitution_allowed: false,
      governance_bypass_allowed: false,
      fail_on_governance_mismatch: true,
    }),
    authority_context: Object.freeze({
      requester_id: "operator_001",
      requester_type: "OPERATOR",
      execution_authority: "NONE",
      read_authority_verified: true,
      tenant_authority_verified: true,
      mission_authority_verified: true,
      write_authority_verified: true,
      allowed_writes: "INTEGRITY_AUDIT_ONLY",
      authority_expansion_allowed: false,
      source_mutation_allowed: false,
    }),
    evidence_context: Object.freeze({
      required_evidence_refs: Object.freeze(["evidence_001"]),
      supporting_evidence_refs: Object.freeze(["evidence_001"]),
      conflicting_evidence_refs: Object.freeze([]),
      evidence_hashes_required: true,
      relationship_policy_required: true,
    }),
    lineage_context: Object.freeze({
      required_lineage_refs: Object.freeze(["lineage_001"]),
      causal_chain_required: true,
      supersession_required: true,
      cross_tenant_lineage_fail_policy: true,
    }),
    replay_context: Object.freeze({
      replay_refs: Object.freeze(["replay_contract_001", "input_bundle_001", "state_package_001", "output_verification_001", "gate_001"]),
      replay_hash_chain_required: true,
      provenance_mismatch_policy: "FAIL",
      required_gate_state: "REPRODUCED",
    }),
    failure_policy: Object.freeze({
      fail_on_missing_source: true,
      fail_on_hash_mismatch: true,
      fail_on_schema_mismatch: true,
      fail_on_governance_mismatch: true,
      fail_on_authority_violation: true,
      fail_on_tenant_violation: true,
      allow_partial_integrity_check: false,
      partial_check_requires_escalation: true,
    }),
    output_policy: Object.freeze({
      output_type: "INTEGRITY_RESULT",
      write_to_ledger: true,
      mutate_source_records: false,
      include_expected_hashes: true,
      include_observed_hashes: true,
      include_failure_reasons: true,
      include_governance_context: true,
      include_authority_context: true,
    }),
    audit_policy: Object.freeze({
      audit_required: true,
      audit_record_type: "INTEGRITY_AUDIT",
      include_requester: true,
      include_scope: true,
      include_target: true,
      include_sources: true,
      include_expected_integrity: true,
      include_observed_integrity: true,
      include_hashes: true,
      include_schemas: true,
      include_governance_context: true,
      include_authority_context: true,
      include_failures: true,
    }),
    lifecycle_state: "REQUESTED",
    certification_state: "UNCERTIFIED",
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  });
  return normalizeTruthIntegrityContract(contract);
}

function validateTarget(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const target = contract.integrity_target;
  if (!isRecord(target)) {
    addIssue(errors, "INTEGRITY_TARGET_MISSING", "Integrity target is required.", "integrity_target");
    return;
  }
  if (!TARGET_TYPES.has(target.target_type as TruthIntegrityTargetType) || values(target.target_ids).length === 0) {
    addIssue(errors, "INTEGRITY_TARGET_INVALID", "Integrity target type and target IDs must be valid.", "integrity_target");
    return;
  }
  if (INTEGRITY_TYPES.has(contract.integrity_type as TruthIntegrityType)) {
    const allowedTargets = COMPATIBLE_TARGETS[contract.integrity_type as TruthIntegrityType];
    if (!allowedTargets.includes(target.target_type as TruthIntegrityTargetType)) {
      addIssue(errors, "INTEGRITY_TYPE_TARGET_INCOMPATIBLE", "Integrity type is not compatible with target type.", "integrity_target.target_type");
    }
  }
}

function validateScope(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const scope = contract.integrity_scope;
  if (!isRecord(scope) || !SCOPE_TYPES.has(scope.scope_type as TruthIntegrityScopeType)) {
    addIssue(errors, "INTEGRITY_SCOPE_MISSING", "Integrity scope is required.", "integrity_scope");
    return;
  }
  const tenantId = text(contract.tenant_id);
  const allowedTenants = values(scope.allowed_tenant_ids);
  if (allowedTenants.length === 0 || !allowedTenants.includes(tenantId)) {
    addIssue(errors, "TENANT_SCOPE_VIOLATION", "Integrity tenant must be explicitly allowed.", "integrity_scope.allowed_tenant_ids");
  }
  const missionId = text(contract.mission_id);
  const allowedMissions = values(scope.allowed_mission_ids);
  if ((scope.scope_type === "MISSION" || contract.integrity_type === "MISSION_INTEGRITY") && (!missionId || allowedMissions.length === 0)) {
    addIssue(errors, "MISSION_ID_MISSING", "Mission-scoped integrity requires a mission identity and mission scope.", "mission_id");
  }
  if (missionId && allowedMissions.length > 0 && !allowedMissions.includes(missionId)) {
    addIssue(errors, "MISSION_SCOPE_VIOLATION", "Mission identity must be inside integrity mission scope.", "integrity_scope.allowed_mission_ids");
  }
  const target = isRecord(contract.integrity_target) ? contract.integrity_target.target_type : undefined;
  if (target && !values(scope.allowed_target_types).includes(String(target))) {
    addIssue(errors, "INTEGRITY_TARGET_INVALID", "Integrity target must be allowed by scope.", "integrity_scope.allowed_target_types");
  }
  if (values(scope.restricted_fields).length > 0 && scope.redaction_required !== true) {
    addIssue(errors, "REDACTION_REQUIRED", "Restricted fields require redaction.", "integrity_scope.redaction_required");
  }
  if (String(contract.integrity_type).startsWith("REPLAY_") && scope.scope_type !== "REPLAY" && scope.include_replay_artifacts !== true) {
    addIssue(errors, "INTEGRITY_SCOPE_MISSING", "Replay integrity requires replay scope or included replay artifacts.", "integrity_scope.scope_type");
  }
}

function requiredSourceKeys(type: string): readonly (keyof TruthIntegrityContract["source_refs"])[] {
  if (type === "TRUTH_RECORD_INTEGRITY") return ["truth_record_ids"];
  if (type === "EVENT_INTEGRITY") return ["event_ids"];
  if (type === "EVIDENCE_INTEGRITY") return ["evidence_refs"];
  if (type === "LINEAGE_INTEGRITY") return ["lineage_refs"];
  if (type === "GOVERNANCE_INTEGRITY") return ["governance_refs", "policy_refs"];
  if (type === "RECOMMENDATION_INTEGRITY") return ["recommendation_refs"];
  if (type === "RISK_INTEGRITY") return ["risk_refs"];
  if (type === "CONFIDENCE_INTEGRITY") return ["confidence_refs"];
  if (type.startsWith("REPLAY_")) return ["replay_refs"];
  if (type === "SCHEMA_INTEGRITY") return ["schema_refs"];
  return [];
}

function validateSources(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const sourceRefs = contract.source_refs;
  if (!isRecord(sourceRefs) || !hasAnySource(sourceRefs)) {
    addIssue(errors, "SOURCE_REFS_MISSING", "Integrity source references are required.", "source_refs");
    return;
  }
  for (const key of requiredSourceKeys(String(contract.integrity_type))) {
    if (values(sourceRefs[key]).length === 0) {
      addIssue(errors, "SOURCE_REFS_MISSING", `Integrity type requires ${key}.`, `source_refs.${key}`);
    }
  }
}

function validateExpected(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const expected = contract.expected_integrity;
  if (!isRecord(expected)) {
    addIssue(errors, "EXPECTED_INTEGRITY_MISSING", "Expected integrity state is required.", "expected_integrity");
    return;
  }
  if (!text(expected.expected_tenant_id)) addIssue(errors, "EXPECTED_TENANT_MISSING", "Expected tenant is required.", "expected_integrity.expected_tenant_id");
  if (text(expected.expected_tenant_id) && expected.expected_tenant_id !== contract.tenant_id) {
    addIssue(errors, "TENANT_SCOPE_VIOLATION", "Expected tenant must match contract tenant.", "expected_integrity.expected_tenant_id");
  }
  if (contract.mission_id && expected.expected_mission_id !== contract.mission_id) {
    addIssue(errors, "MISSION_SCOPE_VIOLATION", "Expected mission must match contract mission.", "expected_integrity.expected_mission_id");
  }
  if (!RESULT_STATES.has(expected.expected_integrity_result as TruthIntegrityResultState)) {
    addIssue(errors, "EXPECTED_STATE_INVALID", "Expected integrity result state must be valid.", "expected_integrity.expected_integrity_result");
  }
  const hashRequirements = contract.hash_requirements;
  if (isRecord(hashRequirements) && hashRequirements.expected_hash_required === true && arrayLength(expected.expected_hashes) === 0) {
    addIssue(errors, "EXPECTED_HASH_MISSING", "Expected hashes are required.", "expected_integrity.expected_hashes");
  }
  const schemaRequirements = contract.schema_requirements;
  if (isRecord(schemaRequirements) && schemaRequirements.schema_version_required === true && arrayLength(expected.expected_schema_versions) === 0) {
    addIssue(errors, "EXPECTED_SCHEMA_VERSION_MISSING", "Expected schema versions are required.", "expected_integrity.expected_schema_versions");
  }
}

function validateObserved(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const observed = contract.observed_integrity;
  if (!isRecord(observed)) return;
  if (text(observed.observed_tenant_id) && observed.observed_tenant_id !== contract.tenant_id) {
    addIssue(errors, "OBSERVED_TENANT_MISMATCH", "Observed tenant must match contract tenant.", "observed_integrity.observed_tenant_id");
  }
  if (contract.mission_id && text(observed.observed_mission_id) && observed.observed_mission_id !== contract.mission_id) {
    addIssue(errors, "OBSERVED_MISSION_MISMATCH", "Observed mission must match contract mission.", "observed_integrity.observed_mission_id");
  }
}

function validateHashRequirements(requirements: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(requirements)) {
    addIssue(errors, "HASH_REQUIREMENTS_INVALID", "Integrity hash requirements are required.", "hash_requirements");
    return;
  }
  if (requirements.required_hash_algorithm !== "SHA256") addIssue(errors, "UNSUPPORTED_HASH_ALGORITHM", "Integrity hashing must use SHA256.", "hash_requirements.required_hash_algorithm");
  if (requirements.unsupported_hash_algorithm_detected === true) addIssue(errors, "UNSUPPORTED_HASH_ALGORITHM", "Unsupported hash algorithm was detected.", "hash_requirements.unsupported_hash_algorithm_detected");
  if (requirements.canonical_serialization !== "STABLE_JSON") addIssue(errors, "HASH_REQUIREMENTS_INVALID", "Integrity hashing must use stable JSON.", "hash_requirements.canonical_serialization");
  if (requirements.unstable_serialization_allowed === true) addIssue(errors, "UNSTABLE_SERIALIZATION_ALLOWED", "Unstable serialization cannot be allowed.", "hash_requirements.unstable_serialization_allowed");
  if (requirements.fail_on_hash_mismatch !== true) addIssue(errors, "HASH_REQUIREMENTS_INVALID", "Hash mismatches must fail closed.", "hash_requirements.fail_on_hash_mismatch");
}

function validateSchemaRequirements(requirements: unknown, expected: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(requirements)) {
    addIssue(errors, "SCHEMA_REQUIREMENTS_INVALID", "Integrity schema requirements are required.", "schema_requirements");
    return;
  }
  if (requirements.schema_version_required === true && values(requirements.expected_schema_versions).length === 0) {
    addIssue(errors, "EXPECTED_SCHEMA_VERSION_MISSING", "Required schema versions must be declared.", "schema_requirements.expected_schema_versions");
  }
  if (requirements.schema_hash_required === true && isRecord(expected)) {
    const versions = Array.isArray(expected.expected_schema_versions) ? expected.expected_schema_versions : [];
    if (versions.length === 0 || versions.some((version) => !isRecord(version) || !text(version.schema_hash))) {
      addIssue(errors, "SCHEMA_REQUIREMENTS_INVALID", "Schema hashes are required.", "expected_integrity.expected_schema_versions");
    }
  }
  if (requirements.schema_mismatch_policy !== "FAIL" && requirements.schema_mismatch_policy !== "ESCALATE") {
    addIssue(errors, "SCHEMA_REQUIREMENTS_INVALID", "Schema mismatch policy must be present.", "schema_requirements.schema_mismatch_policy");
  }
  if (requirements.allow_silent_schema_substitution === true) {
    addIssue(errors, "SCHEMA_SUBSTITUTION_ALLOWED", "Silent schema substitution is forbidden.", "schema_requirements.allow_silent_schema_substitution");
  }
}

function validateGovernance(governance: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(governance)) {
    addIssue(errors, "GOVERNANCE_CONTEXT_MISSING", "Integrity governance context is required.", "governance_context");
    return;
  }
  if (governance.historical_policy_required === true && !text(governance.policy_snapshot_id)) {
    addIssue(errors, "POLICY_SNAPSHOT_MISSING", "Historical policy enforcement requires a policy snapshot.", "governance_context.policy_snapshot_id");
  }
  if (governance.current_policy_substitution_allowed === true) {
    addIssue(errors, "CURRENT_POLICY_SUBSTITUTION_ALLOWED", "Current policy substitution is forbidden.", "governance_context.current_policy_substitution_allowed");
  }
  if (governance.governance_bypass_allowed === true) addIssue(errors, "GOVERNANCE_BYPASS_ALLOWED", "Governance bypass is forbidden.", "governance_context.governance_bypass_allowed");
  if (governance.fail_on_governance_mismatch !== true) addIssue(errors, "GOVERNANCE_CONTEXT_MISSING", "Governance mismatch must fail closed.", "governance_context.fail_on_governance_mismatch");
}

function validateAuthority(authority: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(authority)) {
    addIssue(errors, "AUTHORITY_CONTEXT_INVALID", "Integrity authority context is required.", "authority_context");
    return;
  }
  if (authority.execution_authority !== "NONE") addIssue(errors, "EXECUTION_AUTHORITY_DETECTED", "Integrity checks cannot grant execution authority.", "authority_context.execution_authority");
  if (authority.read_authority_verified !== true || authority.tenant_authority_verified !== true || authority.mission_authority_verified !== true) {
    addIssue(errors, "READ_AUTHORITY_UNVERIFIED", "Integrity read, tenant, and mission authority must be verified.", "authority_context");
  }
  if (authority.authority_expansion_allowed !== false) addIssue(errors, "AUTHORITY_EXPANSION_DETECTED", "Integrity checks cannot expand authority.", "authority_context.authority_expansion_allowed");
  if (authority.source_mutation_allowed !== false) addIssue(errors, "SOURCE_MUTATION_ATTEMPTED", "Integrity checks cannot mutate sources.", "authority_context.source_mutation_allowed");
  if (authority.allowed_writes !== "NONE" && authority.allowed_writes !== "INTEGRITY_AUDIT_ONLY") {
    addIssue(errors, "UNAUTHORIZED_WRITE_ATTEMPTED", "Integrity writes are limited to none or audit-only.", "authority_context.allowed_writes");
  }
  if (authority.allowed_writes === "INTEGRITY_AUDIT_ONLY" && authority.write_authority_verified !== true) {
    addIssue(errors, "UNAUTHORIZED_WRITE_ATTEMPTED", "Audit-only writes require verified write authority.", "authority_context.write_authority_verified");
  }
}

function validateEvidenceAndLineage(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const scope = isRecord(contract.integrity_scope) ? contract.integrity_scope : {};
  const needsEvidence = contract.integrity_type === "EVIDENCE_INTEGRITY" || scope.include_evidence === true;
  if (needsEvidence) {
    const evidence = contract.evidence_context;
    if (!isRecord(evidence) || values(evidence.required_evidence_refs).length === 0 || evidence.evidence_hashes_required !== true || evidence.relationship_policy_required !== true) {
      addIssue(errors, "EVIDENCE_CONTEXT_MISSING", "Required evidence context, hashes, and relationship policy must be present.", "evidence_context");
    }
  }
  const needsLineage = contract.integrity_type === "LINEAGE_INTEGRITY" || scope.include_lineage === true;
  if (needsLineage) {
    const lineage = contract.lineage_context;
    if (!isRecord(lineage) || values(lineage.required_lineage_refs).length === 0 || lineage.causal_chain_required !== true || lineage.cross_tenant_lineage_fail_policy !== true) {
      addIssue(errors, "LINEAGE_CONTEXT_MISSING", "Required lineage context, causal chain, and cross-tenant fail policy must be present.", "lineage_context");
    }
  }
}

function validateReplay(contract: Record<string, unknown>, errors: TruthIntegrityValidationIssue[]): void {
  const scope = isRecord(contract.integrity_scope) ? contract.integrity_scope : {};
  const needsReplay = String(contract.integrity_type).startsWith("REPLAY_") || scope.include_replay_artifacts === true;
  if (!needsReplay) return;
  const replay = contract.replay_context;
  if (!isRecord(replay) || values(replay.replay_refs).length === 0) {
    addIssue(errors, "REPLAY_CONTEXT_MISSING", "Replay integrity context is required.", "replay_context");
    return;
  }
  if (replay.replay_hash_chain_required !== true) addIssue(errors, "REPLAY_HASH_CHAIN_MISSING", "Replay hash chain must be required.", "replay_context.replay_hash_chain_required");
  if (replay.provenance_mismatch_policy !== "FAIL" && replay.provenance_mismatch_policy !== "ESCALATE") {
    addIssue(errors, "REPLAY_PROVENANCE_POLICY_MISSING", "Replay provenance mismatch policy is required.", "replay_context.provenance_mismatch_policy");
  }
  if (replay.required_gate_state !== undefined && !GATE_STATES.has(replay.required_gate_state as TruthReplayDeterminismGateState)) {
    addIssue(errors, "REPLAY_GATE_STATE_INVALID", "Replay gate state requirement must be valid.", "replay_context.required_gate_state");
  }
}

function validateFailurePolicy(policy: unknown, errors: TruthIntegrityValidationIssue[], escalations: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "FAILURE_POLICY_INVALID", "Integrity failure policy is required.", "failure_policy");
    return;
  }
  if (policy.fail_on_missing_source !== true || policy.fail_on_hash_mismatch !== true || policy.fail_on_schema_mismatch !== true || policy.fail_on_governance_mismatch !== true || policy.fail_on_authority_violation !== true || policy.fail_on_tenant_violation !== true) {
    addIssue(errors, "FAILURE_POLICY_INVALID", "Integrity failure policy must fail closed for missing source, hash, schema, governance, authority, and tenant violations.", "failure_policy");
  }
  if (policy.allow_partial_integrity_check === true && policy.partial_check_requires_escalation !== true) {
    addIssue(errors, "PARTIAL_INTEGRITY_REQUIRES_ESCALATION", "Partial integrity checks require escalation.", "failure_policy.partial_check_requires_escalation");
  }
  if (policy.allow_partial_integrity_check === true && policy.partial_check_requires_escalation === true) {
    escalations.push(issue("PARTIAL_INTEGRITY_REQUIRES_ESCALATION", "Partial integrity check is allowed only with escalation.", "failure_policy.allow_partial_integrity_check", "ESCALATION"));
  }
}

function validateOutputPolicy(policy: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Integrity output policy is required.", "output_policy");
    return;
  }
  if (!["INTEGRITY_RESULT", "INTEGRITY_FAILURE", "INTEGRITY_AUDIT"].includes(String(policy.output_type))) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Integrity output type must be valid.", "output_policy.output_type");
  }
  if (policy.mutate_source_records !== false) addIssue(errors, "SOURCE_MUTATION_ATTEMPTED", "Integrity output cannot mutate source records.", "output_policy.mutate_source_records");
  if (policy.include_expected_hashes !== true || policy.include_failure_reasons !== true || policy.include_governance_context !== true || policy.include_authority_context !== true) {
    addIssue(errors, "OUTPUT_POLICY_INVALID", "Integrity output must include hashes, failures, governance, and authority context.", "output_policy");
  }
}

function validateAuditPolicy(policy: unknown, errors: TruthIntegrityValidationIssue[]): void {
  if (!isRecord(policy)) {
    addIssue(errors, "AUDIT_POLICY_INVALID", "Integrity audit policy is required.", "audit_policy");
    return;
  }
  const required = [
    policy.audit_required,
    policy.audit_record_type === "INTEGRITY_AUDIT",
    policy.include_requester,
    policy.include_scope,
    policy.include_target,
    policy.include_sources,
    policy.include_expected_integrity,
    policy.include_hashes,
    policy.include_schemas,
    policy.include_governance_context,
    policy.include_authority_context,
    policy.include_failures,
  ];
  if (!required.every(Boolean)) addIssue(errors, "AUDIT_POLICY_INVALID", "Integrity audit must include requester, scope, target, sources, expected state, hashes, schemas, governance, authority, and failures.", "audit_policy");
}

export function validateTruthIntegrityContract(contract: unknown, checkedAt?: string): TruthIntegrityContractValidationResult {
  const errors: TruthIntegrityValidationIssue[] = [];
  const warnings: TruthIntegrityValidationIssue[] = [];
  const escalations: TruthIntegrityValidationIssue[] = [];

  if (!isRecord(contract)) {
    addIssue(errors, "INTEGRITY_CONTRACT_MISSING", "Integrity contract is required.", "contract");
    return Object.freeze({ state: "INVALID", errors, warnings, escalation_reasons: escalations, checked_at: checkedAt });
  }

  if (!text(contract.integrity_contract_id)) addIssue(errors, "INTEGRITY_CONTRACT_ID_MISSING", "Integrity contract identity is required.", "integrity_contract_id");
  if (!text(contract.tenant_id)) addIssue(errors, "TENANT_ID_MISSING", "Tenant identity is required.", "tenant_id");
  if (!INTEGRITY_TYPES.has(contract.integrity_type as TruthIntegrityType)) addIssue(errors, "INTEGRITY_TYPE_INVALID", "Integrity type must be supported.", "integrity_type");
  const requester = contract.requested_by;
  if (!isRecord(requester) || !text(requester.requester_id) || !REQUESTER_TYPES.has(requester.requester_type as string)) {
    addIssue(errors, "REQUESTER_INVALID", "Integrity requester identity and type are required.", "requested_by");
  }

  validateTarget(contract, errors);
  validateScope(contract, errors);
  validateSources(contract, errors);
  validateExpected(contract, errors);
  validateObserved(contract, errors);
  validateHashRequirements(contract.hash_requirements, errors);
  validateSchemaRequirements(contract.schema_requirements, contract.expected_integrity, errors);
  validateGovernance(contract.governance_context, errors);
  validateAuthority(contract.authority_context, errors);
  validateEvidenceAndLineage(contract, errors);
  validateReplay(contract, errors);
  validateFailurePolicy(contract.failure_policy, errors, escalations);
  validateOutputPolicy(contract.output_policy, errors);
  validateAuditPolicy(contract.audit_policy, errors);

  if (!LIFECYCLE_STATES.has(contract.lifecycle_state as TruthIntegrityLifecycleState)) addIssue(errors, "LIFECYCLE_STATE_INVALID", "Integrity lifecycle state must be valid.", "lifecycle_state");
  if (!CERTIFICATION_STATES.has(contract.certification_state as string)) addIssue(errors, "CERTIFICATION_STATE_INVALID", "Integrity certification state must be valid.", "certification_state");

  let normalized: TruthIntegrityContract | undefined;
  let generatedHash: string | undefined;
  if (errors.length === 0) {
    normalized = normalizeTruthIntegrityContract(contract as TruthIntegrityContract);
    generatedHash = normalized.contract_hash;
    if (text(contract.contract_hash).length > 0 && contract.contract_hash !== generatedHash) {
      addIssue(errors, "CONTRACT_HASH_MISMATCH", "Integrity contract hash does not match canonical contract.", "contract_hash");
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

export function getTruthIntegrityDominantResultState(states: readonly TruthIntegrityResultState[]): TruthIntegrityResultState {
  return states.reduce<TruthIntegrityResultState>((dominant, state) => (
    TRUTH_INTEGRITY_RESULT_PRECEDENCE[state] > TRUTH_INTEGRITY_RESULT_PRECEDENCE[dominant] ? state : dominant
  ), "VERIFIED");
}

export function validateTruthIntegrityLifecycleTransition(
  from_state: TruthIntegrityLifecycleState,
  to_state: TruthIntegrityLifecycleState,
): Readonly<{ valid: boolean; from_state: TruthIntegrityLifecycleState; to_state: TruthIntegrityLifecycleState; error?: TruthIntegrityValidationIssue }> {
  const transitions: Readonly<Record<TruthIntegrityLifecycleState, readonly TruthIntegrityLifecycleState[]>> = Object.freeze({
    REQUESTED: ["VALIDATED", "REJECTED"],
    VALIDATED: ["READY"],
    REJECTED: ["ARCHIVED"],
    READY: ["ARCHIVED"],
    ARCHIVED: [],
  });
  const valid = transitions[from_state]?.includes(to_state) === true;
  return Object.freeze({
    valid,
    from_state,
    to_state,
    error: valid ? undefined : issue("LIFECYCLE_STATE_INVALID", `Integrity lifecycle transition ${from_state} -> ${to_state} is not allowed.`, "lifecycle_state"),
  });
}

export function toTruthIntegrityContractStorageRecord(contract: TruthIntegrityContract): TruthIntegrityContractStorageRecord {
  const normalized = normalizeTruthIntegrityContract(contract);
  return Object.freeze({
    integrity_contract_id: normalized.integrity_contract_id,
    tenant_id: normalized.tenant_id,
    mission_id: normalized.mission_id,
    integrity_type: normalized.integrity_type,
    integrity_scope_json: canonicalizeConfidenceToString(normalized.integrity_scope),
    integrity_target_json: canonicalizeConfidenceToString(normalized.integrity_target),
    requested_by_json: canonicalizeConfidenceToString(normalized.requested_by),
    requested_at: normalized.requested_at,
    source_refs_json: canonicalizeConfidenceToString(normalized.source_refs),
    expected_integrity_json: canonicalizeConfidenceToString(normalized.expected_integrity),
    observed_integrity_json: normalized.observed_integrity ? canonicalizeConfidenceToString(normalized.observed_integrity) : undefined,
    hash_requirements_json: canonicalizeConfidenceToString(normalized.hash_requirements),
    schema_requirements_json: canonicalizeConfidenceToString(normalized.schema_requirements),
    governance_context_json: canonicalizeConfidenceToString(normalized.governance_context),
    authority_context_json: canonicalizeConfidenceToString(normalized.authority_context),
    evidence_context_json: normalized.evidence_context ? canonicalizeConfidenceToString(normalized.evidence_context) : undefined,
    lineage_context_json: normalized.lineage_context ? canonicalizeConfidenceToString(normalized.lineage_context) : undefined,
    replay_context_json: normalized.replay_context ? canonicalizeConfidenceToString(normalized.replay_context) : undefined,
    failure_policy_json: canonicalizeConfidenceToString(normalized.failure_policy),
    output_policy_json: canonicalizeConfidenceToString(normalized.output_policy),
    audit_policy_json: canonicalizeConfidenceToString(normalized.audit_policy),
    lifecycle_state: normalized.lifecycle_state,
    certification_state: normalized.certification_state,
    contract_hash: normalized.contract_hash ?? hashTruthIntegrityContract(normalized),
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  });
}

export function createExpectedTruthIntegrityState(overrides: Partial<TruthExpectedIntegrityState> = {}): TruthExpectedIntegrityState {
  return Object.freeze({
    expected_hashes: Object.freeze([{ ref: "target_001", hash: "target_hash_001", algorithm: "SHA256" as const, canonical_serialization: "STABLE_JSON" as const }]),
    expected_schema_versions: Object.freeze([{ schema_ref: "schema_integrity_v1", schema_version: "integrity_contract/v1", schema_hash: "schema_hash_001" }]),
    expected_tenant_id: "tenant_alpha",
    expected_mission_id: "mission_truth_001",
    expected_integrity_result: "VERIFIED",
    ...overrides,
  });
}
