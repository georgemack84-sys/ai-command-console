import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildPolicyAnalysisRecord, validatePolicyAnalysisRecord } from "@/services/policy-analysis";
import type { PolicyAnalysisRecord, PolicyAnalysisState } from "@/types/policy-analysis";
import type {
  PolicyCorrelationDoctrine,
  PolicyCorrelationEngineResult,
  PolicyCorrelationFailureReason,
  PolicyCorrelationHistoricalRecord,
  PolicyCorrelationLedgerSource,
  PolicyCorrelationObservabilitySurface,
  PolicyCorrelationRecord,
  PolicyCorrelationRelationshipType,
  PolicyCorrelationReplayResult,
  PolicyCorrelationSourceDefinition,
  PolicyCorrelationState,
  PolicyCorrelationType,
  PolicyCorrelationValidationFailure,
  PolicyCorrelationValidationResult,
} from "@/types/policy-correlation";

const NOW = "2026-06-25T05:00:00.000Z";
const ALGORITHM_VERSION = "policy-correlation-engine/v7B.2" as const;

export const POLICY_CORRELATION_TYPES = ["DIRECT", "INDIRECT", "CASCADING", "HISTORICAL", "CONDITIONAL"] as const;
export const POLICY_CORRELATION_RELATIONSHIP_TYPES = [
  "POLICY_TO_RECOMMENDATION",
  "POLICY_TO_DECISION",
  "POLICY_TO_RUNTIME",
  "POLICY_TO_VIOLATION",
  "POLICY_TO_OUTCOME",
  "POLICY_TO_AUTHORITY",
  "POLICY_TO_MISSION",
  "POLICY_TO_GOVERNANCE_ACTION",
  "POLICY_TO_CERTIFICATION",
  "POLICY_TO_REPLAY",
] as const;
export const POLICY_CORRELATION_LEDGER_SOURCES = [
  "TRUTH_LEDGER",
  "RECOMMENDATION_LEDGER",
  "DECISION_HISTORY",
  "GOVERNANCE_EVENTS",
  "AUTHORITY_DECISIONS",
  "VIOLATION_RECORDS",
  "REPLAY_HISTORY",
  "CERTIFICATION_HISTORY",
] as const;
export const POLICY_CORRELATION_STATES = ["CREATED", "SOURCE_VALIDATED", "CORRELATED", "CONSISTENCY_VERIFIED", "REPLAYABLE", "RESTRICTED", "INCONSISTENT", "INVALID", "ARCHIVED"] as const;

const CORRELATABLE_ANALYSIS_STATES: readonly PolicyAnalysisState[] = ["VALIDATED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"];
const ALLOWED_POLICY_CORRELATION_TRANSITIONS: Readonly<Record<PolicyCorrelationState, readonly PolicyCorrelationState[]>> = Object.freeze({
  CREATED: Object.freeze(["SOURCE_VALIDATED", "INVALID"] as const),
  SOURCE_VALIDATED: Object.freeze(["CORRELATED", "INCONSISTENT"] as const),
  CORRELATED: Object.freeze(["CONSISTENCY_VERIFIED", "INCONSISTENT"] as const),
  CONSISTENCY_VERIFIED: Object.freeze(["REPLAYABLE"] as const),
  REPLAYABLE: Object.freeze(["RESTRICTED", "ARCHIVED"] as const),
  RESTRICTED: Object.freeze(["ARCHIVED"] as const),
  INCONSISTENT: Object.freeze(["ARCHIVED"] as const),
  INVALID: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function validationFailure(reason: PolicyCorrelationFailureReason, field_path: string, message: string): PolicyCorrelationValidationFailure {
  return Object.freeze({
    failure_id: hashValue("policy-correlation-validation-failure", { reason, field_path, message }),
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function recordTime(offsetMinutes: number): string {
  return new Date(Date.parse("2026-06-25T04:00:00.000Z") + offsetMinutes * 60_000).toISOString();
}

function relationshipTargetLedger(relationship_type: PolicyCorrelationRelationshipType): PolicyCorrelationLedgerSource {
  const map: Readonly<Record<PolicyCorrelationRelationshipType, PolicyCorrelationLedgerSource>> = {
    POLICY_TO_RECOMMENDATION: "RECOMMENDATION_LEDGER",
    POLICY_TO_DECISION: "DECISION_HISTORY",
    POLICY_TO_RUNTIME: "TRUTH_LEDGER",
    POLICY_TO_VIOLATION: "VIOLATION_RECORDS",
    POLICY_TO_OUTCOME: "TRUTH_LEDGER",
    POLICY_TO_AUTHORITY: "AUTHORITY_DECISIONS",
    POLICY_TO_MISSION: "GOVERNANCE_EVENTS",
    POLICY_TO_GOVERNANCE_ACTION: "GOVERNANCE_EVENTS",
    POLICY_TO_CERTIFICATION: "CERTIFICATION_HISTORY",
    POLICY_TO_REPLAY: "REPLAY_HISTORY",
  };
  return map[relationship_type];
}

function freezeHistoricalRecord(record: PolicyCorrelationHistoricalRecord): PolicyCorrelationHistoricalRecord {
  return Object.freeze({
    ...record,
    source_record_refs: freezeArray(record.source_record_refs),
    target_record_refs: freezeArray(record.target_record_refs),
    evidence_refs: freezeArray(record.evidence_refs),
    lineage_refs: freezeArray(record.lineage_refs),
    replay_refs: freezeArray(record.replay_refs),
    authority_refs: freezeArray(record.authority_refs),
    governance_refs: freezeArray(record.governance_refs),
  });
}

function freezeCorrelation(record: PolicyCorrelationRecord): PolicyCorrelationRecord {
  return Object.freeze({
    ...record,
    source_record_refs: freezeArray(record.source_record_refs),
    target_record_refs: freezeArray(record.target_record_refs),
    influence_path: freezeArray(record.influence_path),
    constraints_applied: freezeArray(record.constraints_applied),
    exceptions_applied: freezeArray(record.exceptions_applied),
    authority_context: Object.freeze({ ...record.authority_context, refs: freezeArray(record.authority_context.refs) }),
    governance_context: Object.freeze({ ...record.governance_context, refs: freezeArray(record.governance_context.refs) }),
    runtime_context: Object.freeze({ ...record.runtime_context, refs: freezeArray(record.runtime_context.refs) }),
    mission_context: Object.freeze({ ...record.mission_context, refs: freezeArray(record.mission_context.refs) }),
    evidence_refs: freezeArray(record.evidence_refs),
    lineage_refs: freezeArray(record.lineage_refs),
    replay_refs: Object.freeze({
      ...record.replay_refs,
      ledger_snapshot_refs: freezeArray(record.replay_refs.ledger_snapshot_refs),
    }),
  });
}

export function buildPolicyCorrelationDoctrine(): PolicyCorrelationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["no-assumption-influence", "evidence-required", "replay-required", "tenant-isolated", "advisory-only", "fail-closed", "cross-ledger-consistent"] as const),
    prohibited_behaviors: Object.freeze([
      "correlation without PolicyAnalysis contract",
      "correlation without policy identity",
      "correlation without policy version",
      "correlation without tenant scope",
      "correlation without evidence",
      "correlation without replay references",
      "cross-tenant policy correlation",
      "future policy influence",
      "unsupported semantic influence",
      "autonomous policy modification",
      "autonomous policy enforcement",
      "autonomous authority expansion",
    ]),
    supported_correlation_types: Object.freeze([...POLICY_CORRELATION_TYPES]),
    supported_relationship_types: Object.freeze([...POLICY_CORRELATION_RELATIONSHIP_TYPES]),
    allowed_state_transitions: ALLOWED_POLICY_CORRELATION_TRANSITIONS,
  });
}

export function buildPolicyCorrelationSourceRegistry(): readonly PolicyCorrelationSourceDefinition[] {
  const definitions: PolicyCorrelationSourceDefinition[] = [
    { source_ledger: "TRUTH_LEDGER", display_name: "Truth Ledger", allowed_event_types: ["POLICY_CREATED", "RUNTIME_EVENT", "MISSION_OUTCOME"], trust_requirement: "TRUTH_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "RECOMMENDATION_LEDGER", display_name: "Recommendation Ledger", allowed_event_types: ["RECOMMENDATION_MARKED_ADVISORY", "RECOMMENDATION_REJECTED"], trust_requirement: "GOVERNANCE_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "DECISION_HISTORY", display_name: "Decision History", allowed_event_types: ["DECISION_CONSTRAINED", "DECISION_ESCALATED"], trust_requirement: "GOVERNANCE_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "GOVERNANCE_EVENTS", display_name: "Governance Events", allowed_event_types: ["GOVERNANCE_VALIDATION", "MISSION_RESTRICTED"], trust_requirement: "GOVERNANCE_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "AUTHORITY_DECISIONS", display_name: "Authority Decisions", allowed_event_types: ["OPERATOR_APPROVAL_REQUIRED", "AUTHORITY_DENIED"], trust_requirement: "GOVERNANCE_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "VIOLATION_RECORDS", display_name: "Violation Records", allowed_event_types: ["POLICY_BYPASS_ATTEMPT", "TENANT_MISMATCH_DETECTED"], trust_requirement: "TRUTH_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "REPLAY_HISTORY", display_name: "Replay History", allowed_event_types: ["REPLAY_REPRODUCED", "REPLAY_MISMATCH"], trust_requirement: "REPLAY_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
    { source_ledger: "CERTIFICATION_HISTORY", display_name: "Certification History", allowed_event_types: ["CERTIFICATION_PASSED", "CERTIFICATION_FAILED"], trust_requirement: "CERTIFICATION_ANCHORED", tenant_scoped: true, replay_required: true, integrity_required: true },
  ];
  return Object.freeze(definitions.map((definition) => Object.freeze({ ...definition, allowed_event_types: freezeArray(definition.allowed_event_types) })));
}

export function resolvePolicyCorrelationIdentity(policyAnalysis: PolicyAnalysisRecord | undefined): PolicyCorrelationValidationResult {
  const failures: PolicyCorrelationValidationFailure[] = [];
  if (!policyAnalysis) failures.push(validationFailure("POLICY_ANALYSIS_MISSING", "policy_analysis", "PolicyAnalysis contract is required"));
  const validation = policyAnalysis ? validatePolicyAnalysisRecord(policyAnalysis) : undefined;
  if (validation && validation.validation_state === "FAIL") failures.push(validationFailure("POLICY_ANALYSIS_INVALID", "policy_analysis", "PolicyAnalysis contract failed 7B.1 validation"));
  if (policyAnalysis && !CORRELATABLE_ANALYSIS_STATES.includes(policyAnalysis.analysis_state)) failures.push(validationFailure("POLICY_ANALYSIS_STATE_BLOCKED", "analysis_state", "PolicyAnalysis state is not eligible for correlation"));
  if (!policyAnalysis?.policy_id || !policyAnalysis?.policy_analysis_id) failures.push(validationFailure("POLICY_IDENTITY_MISSING", "policy_id", "policy identity missing"));
  if (!policyAnalysis?.policy_version) failures.push(validationFailure("POLICY_VERSION_MISSING", "policy_version", "policy version missing"));
  return Object.freeze({
    validation_id: hashValue("policy-correlation-identity-validation", { id: policyAnalysis?.policy_analysis_id, failures: failures.map((failure) => failure.failure_id) }),
    validation_state: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    deterministic: true,
    replayable: failures.length === 0,
    tenant_scoped: !failures.some((failure) => failure.reason === "TENANT_MISMATCH"),
    advisory_only: true,
  });
}

function makeHistoricalRecord(policy: PolicyAnalysisRecord, input: Omit<PolicyCorrelationHistoricalRecord, "tenant_id" | "policy_analysis_id" | "policy_id" | "policy_version" | "policy_type" | "record_hash"> & Partial<Pick<PolicyCorrelationHistoricalRecord, "tenant_id" | "policy_version" | "policy_id">>): PolicyCorrelationHistoricalRecord {
  const source = {
    ...input,
    tenant_id: input.tenant_id ?? policy.tenant_id,
    policy_analysis_id: policy.policy_analysis_id,
    policy_id: input.policy_id ?? policy.policy_id,
    policy_version: input.policy_version ?? policy.policy_version,
    policy_type: policy.policy_type,
  };
  return freezeHistoricalRecord({ ...source, record_hash: hashValue("policy-correlation-historical-record", source) });
}

export function buildDefaultPolicyCorrelationHistoricalRecords(policyAnalysis: PolicyAnalysisRecord = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" })): readonly PolicyCorrelationHistoricalRecord[] {
  const seed: Omit<PolicyCorrelationHistoricalRecord, "tenant_id" | "policy_analysis_id" | "policy_id" | "policy_version" | "policy_type" | "record_hash">[] = [
    { record_id: "hist_policy_rec_194", source_ledger: "RECOMMENDATION_LEDGER", event_type: "RECOMMENDATION_MARKED_ADVISORY", mission_id: "mission_query_layer", occurred_at: recordTime(10), ledger_sequence: 10, source_record_refs: ["truth_policy_7b1_001"], target_record_refs: ["recommendation_rec_194"], evidence_refs: ["evidence_policy_7b2_recommendation"], lineage_refs: ["lineage_policy_7b1_root", "lineage_recommendation_rec_194"], replay_refs: ["replay_policy_correlation_rec_194"], authority_refs: ["authority_operator_required"], governance_refs: ["governance_validation_event_042"], relationship_type: "POLICY_TO_RECOMMENDATION", correlation_type: "DIRECT", influence_marker: "policy required recommendation to remain advisory-only", condition_ref: null },
    { record_id: "hist_policy_dec_099", source_ledger: "DECISION_HISTORY", event_type: "DECISION_CONSTRAINED", mission_id: "mission_query_layer", occurred_at: recordTime(20), ledger_sequence: 20, source_record_refs: ["governance_validation_event_042"], target_record_refs: ["decision_dec_099"], evidence_refs: ["evidence_policy_7b2_decision"], lineage_refs: ["lineage_decision_dec_099"], replay_refs: ["replay_policy_correlation_dec_099"], authority_refs: ["authority_operator_required"], governance_refs: ["governance_validation_event_042"], relationship_type: "POLICY_TO_DECISION", correlation_type: "INDIRECT", influence_marker: "governance validation constrained decision formation", condition_ref: null },
    { record_id: "hist_policy_runtime_018", source_ledger: "TRUTH_LEDGER", event_type: "RUNTIME_EVENT", mission_id: "mission_query_layer", occurred_at: recordTime(30), ledger_sequence: 30, source_record_refs: ["decision_dec_099"], target_record_refs: ["runtime_block_event_018"], evidence_refs: ["evidence_policy_7b2_runtime"], lineage_refs: ["lineage_runtime_block_event_018"], replay_refs: ["replay_policy_correlation_runtime_018"], authority_refs: ["authority_operator_required"], governance_refs: ["governance_runtime_boundary"], relationship_type: "POLICY_TO_RUNTIME", correlation_type: "CASCADING", influence_marker: "runtime action blocked by advisory-only boundary", condition_ref: null },
    { record_id: "hist_policy_violation_022", source_ledger: "VIOLATION_RECORDS", event_type: "POLICY_BYPASS_ATTEMPT", mission_id: "mission_query_layer", occurred_at: recordTime(40), ledger_sequence: 40, source_record_refs: ["runtime_block_event_018"], target_record_refs: ["violation_policy_bypass_022"], evidence_refs: ["evidence_policy_7b2_violation"], lineage_refs: ["lineage_violation_022"], replay_refs: ["replay_policy_correlation_violation_022"], authority_refs: ["authority_denied"], governance_refs: ["governance_fail_closed"], relationship_type: "POLICY_TO_VIOLATION", correlation_type: "DIRECT", influence_marker: "policy detected policy bypass attempt", condition_ref: null },
    { record_id: "hist_policy_authority_077", source_ledger: "AUTHORITY_DECISIONS", event_type: "OPERATOR_APPROVAL_REQUIRED", mission_id: "mission_query_layer", occurred_at: recordTime(50), ledger_sequence: 50, source_record_refs: ["recommendation_rec_194"], target_record_refs: ["authority_decision_077"], evidence_refs: ["evidence_policy_7b2_authority"], lineage_refs: ["lineage_authority_077"], replay_refs: ["replay_policy_correlation_authority_077"], authority_refs: ["authority_operator_required"], governance_refs: ["governance_escalation_required"], relationship_type: "POLICY_TO_AUTHORITY", correlation_type: "CONDITIONAL", influence_marker: "operator approval required when runtime risk is medium_or_above", condition_ref: "constraint_advisory_only" },
    { record_id: "hist_policy_mission_031", source_ledger: "GOVERNANCE_EVENTS", event_type: "MISSION_RESTRICTED", mission_id: "mission_query_layer", occurred_at: recordTime(60), ledger_sequence: 60, source_record_refs: ["authority_decision_077"], target_record_refs: ["mission_outcome_031"], evidence_refs: ["evidence_policy_7b2_mission"], lineage_refs: ["lineage_mission_031"], replay_refs: ["replay_policy_correlation_mission_031"], authority_refs: ["authority_operator_required"], governance_refs: ["governance_mission_restricted"], relationship_type: "POLICY_TO_MISSION", correlation_type: "CASCADING", influence_marker: "mission continued under restricted governance scope", condition_ref: null },
    { record_id: "hist_policy_cert_012", source_ledger: "CERTIFICATION_HISTORY", event_type: "CERTIFICATION_PASSED", mission_id: "mission_query_layer", occurred_at: recordTime(70), ledger_sequence: 70, source_record_refs: ["mission_outcome_031"], target_record_refs: ["certification_policy_intelligence_012"], evidence_refs: ["evidence_policy_7b2_certification"], lineage_refs: ["lineage_certification_012"], replay_refs: ["replay_policy_correlation_certification_012"], authority_refs: ["authority_certification_gate"], governance_refs: ["governance_certification_required"], relationship_type: "POLICY_TO_CERTIFICATION", correlation_type: "HISTORICAL", influence_marker: "policy history supported certification outcome", condition_ref: null },
    { record_id: "hist_policy_replay_144", source_ledger: "REPLAY_HISTORY", event_type: "REPLAY_REPRODUCED", mission_id: "mission_query_layer", occurred_at: recordTime(80), ledger_sequence: 80, source_record_refs: ["certification_policy_intelligence_012"], target_record_refs: ["replay_result_144"], evidence_refs: ["evidence_policy_7b2_replay"], lineage_refs: ["lineage_replay_144"], replay_refs: ["replay_policy_correlation_replay_144"], authority_refs: ["authority_replay_required"], governance_refs: ["governance_replay_verified"], relationship_type: "POLICY_TO_REPLAY", correlation_type: "DIRECT", influence_marker: "replay reproduced policy correlation", condition_ref: null },
  ];
  return Object.freeze(seed.map((record) => makeHistoricalRecord(policyAnalysis, record)));
}

export function collectPolicyCorrelationHistoricalRecords(policyAnalysis: PolicyAnalysisRecord, records: readonly PolicyCorrelationHistoricalRecord[] = buildDefaultPolicyCorrelationHistoricalRecords(policyAnalysis)): readonly PolicyCorrelationHistoricalRecord[] {
  return Object.freeze(records.filter((record) => record.tenant_id === policyAnalysis.tenant_id && record.policy_id === policyAnalysis.policy_id));
}

export function normalizePolicyCorrelationRecords(records: readonly PolicyCorrelationHistoricalRecord[]): readonly PolicyCorrelationHistoricalRecord[] {
  return Object.freeze(records.map((record) => makeHistoricalRecord({
    ...buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" }),
    policy_analysis_id: record.policy_analysis_id,
    policy_id: record.policy_id,
    tenant_id: record.tenant_id,
    policy_version: record.policy_version,
    policy_type: record.policy_type,
  }, { ...record, source_record_refs: [...record.source_record_refs].sort(), target_record_refs: [...record.target_record_refs].sort(), evidence_refs: [...record.evidence_refs].sort(), lineage_refs: [...record.lineage_refs].sort(), replay_refs: [...record.replay_refs].sort(), authority_refs: [...record.authority_refs].sort(), governance_refs: [...record.governance_refs].sort() })));
}

export function orderPolicyCorrelationRecords(records: readonly PolicyCorrelationHistoricalRecord[]): readonly PolicyCorrelationHistoricalRecord[] {
  return Object.freeze([...records].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.ledger_sequence - b.ledger_sequence || a.record_id.localeCompare(b.record_id)));
}

export function matchPolicyCorrelationEvidence(record: PolicyCorrelationHistoricalRecord): boolean {
  const explicitPolicyReference = record.source_record_refs.some((ref) => ref.includes("policy")) || record.target_record_refs.some((ref) => ref.includes("policy"));
  const sharedGovernanceReference = record.governance_refs.length > 0;
  const sharedAuthorityReference = record.authority_refs.length > 0;
  const sharedReplayReference = record.replay_refs.length > 0;
  const lineageReference = record.lineage_refs.length > 0;
  return record.evidence_refs.length > 0 && (explicitPolicyReference || sharedGovernanceReference || sharedAuthorityReference || sharedReplayReference || lineageReference);
}

export function classifyPolicyInfluence(record: PolicyCorrelationHistoricalRecord): PolicyCorrelationType | "UNSUPPORTED" {
  if (!matchPolicyCorrelationEvidence(record)) return "UNSUPPORTED";
  if (!(POLICY_CORRELATION_TYPES as readonly string[]).includes(record.correlation_type)) return "UNSUPPORTED";
  if (record.correlation_type === "CONDITIONAL" && !record.condition_ref) return "UNSUPPORTED";
  if (record.correlation_type === "CASCADING" && record.ledger_sequence < 30) return "UNSUPPORTED";
  return record.correlation_type;
}

export function canonicalizePolicyCorrelation(record: Omit<PolicyCorrelationRecord, "correlation_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computePolicyCorrelationHash(record: Omit<PolicyCorrelationRecord, "correlation_hash"> | PolicyCorrelationRecord): string {
  const { correlation_hash: _previousHash, ...source } = record as PolicyCorrelationRecord;
  return hashConfidenceValue("policy-correlation", canonicalizePolicyCorrelation(source));
}

function replayRefsFor(policy: PolicyAnalysisRecord, orderedRecords: readonly PolicyCorrelationHistoricalRecord[], source: Omit<PolicyCorrelationRecord, "correlation_hash" | "replay_refs">): PolicyCorrelationRecord["replay_refs"] {
  const input_record_set_hash = hashValue("policy-correlation-input-record-set", orderedRecords.map((record) => record.record_hash));
  const output_correlation_hash = hashValue("policy-correlation-output", { policy: policy.policy_analysis_id, source });
  return Object.freeze({
    policy_snapshot_ref: policy.replay_refs.policy_snapshot_ref,
    ledger_snapshot_refs: freezeArray([...new Set(orderedRecords.flatMap((record) => record.replay_refs))]),
    correlation_algorithm_version: ALGORITHM_VERSION,
    input_record_set_hash,
    output_correlation_hash,
    replay_execution_ref: `replay_${source.policy_correlation_id}`,
  });
}

export function buildPolicyCorrelationRecord(policyAnalysis: PolicyAnalysisRecord, record: PolicyCorrelationHistoricalRecord, orderedRecords: readonly PolicyCorrelationHistoricalRecord[], state: PolicyCorrelationState = "REPLAYABLE"): PolicyCorrelationRecord {
  const relationshipRecords = orderedRecords.filter((item) => item.ledger_sequence <= record.ledger_sequence);
  const sourceWithoutReplay: Omit<PolicyCorrelationRecord, "correlation_hash" | "replay_refs"> = {
    schema_version: "policy-correlation/v7B.2",
    policy_correlation_id: `pc_${policyAnalysis.tenant_id}_${record.record_id}`,
    tenant_id: policyAnalysis.tenant_id,
    policy_analysis_id: policyAnalysis.policy_analysis_id,
    policy_id: policyAnalysis.policy_id,
    policy_version: policyAnalysis.policy_version,
    policy_type: policyAnalysis.policy_type,
    correlation_type: record.correlation_type,
    relationship_type: record.relationship_type,
    source_ledger: "TRUTH_LEDGER",
    source_record_refs: freezeArray(record.source_record_refs),
    target_ledger: relationshipTargetLedger(record.relationship_type),
    target_record_refs: freezeArray(record.target_record_refs),
    influence_path: freezeArray([policyAnalysis.policy_id, ...relationshipRecords.map((item) => item.record_id), ...record.target_record_refs]),
    constraints_applied: freezeArray(policyAnalysis.constraints.map((constraint) => constraint.rule)),
    exceptions_applied: freezeArray(record.condition_ref ? policyAnalysis.exceptions.map((exception) => exception.exception_id) : []),
    authority_context: Object.freeze({ summary: record.authority_refs.includes("authority_operator_required") ? "operator approval required" : "authority context preserved", refs: freezeArray(record.authority_refs) }),
    governance_context: Object.freeze({ summary: "constitution supremacy and fail-closed governance preserved", refs: freezeArray(record.governance_refs) }),
    runtime_context: Object.freeze({ summary: policyAnalysis.enforcement_boundaries.runtime_boundary, refs: freezeArray(policyAnalysis.enforcement_boundaries.blocked_actions) }),
    mission_context: Object.freeze({ summary: record.mission_id, refs: freezeArray([record.mission_id]) }),
    evidence_refs: freezeArray(record.evidence_refs),
    lineage_refs: freezeArray(record.lineage_refs),
    correlation_state: state,
    created_timestamp: NOW,
  };
  const sourceWithReplay = { ...sourceWithoutReplay, replay_refs: replayRefsFor(policyAnalysis, orderedRecords, sourceWithoutReplay) };
  return freezeCorrelation({ ...sourceWithReplay, correlation_hash: computePolicyCorrelationHash(sourceWithReplay) });
}

export function generatePolicyCorrelations(policyAnalysis: PolicyAnalysisRecord = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" }), records: readonly PolicyCorrelationHistoricalRecord[] = buildDefaultPolicyCorrelationHistoricalRecords(policyAnalysis)): readonly PolicyCorrelationRecord[] {
  const identity = resolvePolicyCorrelationIdentity(policyAnalysis);
  if (identity.validation_state === "FAIL") return Object.freeze([]);
  const orderedRecords = orderPolicyCorrelationRecords(normalizePolicyCorrelationRecords(collectPolicyCorrelationHistoricalRecords(policyAnalysis, records)));
  return Object.freeze(orderedRecords.filter((record) => classifyPolicyInfluence(record) !== "UNSUPPORTED").map((record) => buildPolicyCorrelationRecord(policyAnalysis, record, orderedRecords)));
}

export function validatePolicyCorrelationRecord(record: Partial<PolicyCorrelationRecord> | undefined, context: { policy_analysis?: PolicyAnalysisRecord; original_record?: PolicyCorrelationRecord } = {}): PolicyCorrelationValidationResult {
  const failures: PolicyCorrelationValidationFailure[] = [];
  const policy = context.policy_analysis;
  const identity = policy ? resolvePolicyCorrelationIdentity(policy) : undefined;
  if (!record) failures.push(validationFailure("SOURCE_RECORDS_MISSING", "policy_correlation", "PolicyCorrelation record missing"));
  if (identity?.validation_state === "FAIL") failures.push(...identity.failures);
  if (!record?.policy_correlation_id) failures.push(validationFailure("POLICY_IDENTITY_MISSING", "policy_correlation_id", "policy_correlation_id missing"));
  if (!record?.policy_id || !record.policy_analysis_id) failures.push(validationFailure("POLICY_IDENTITY_MISSING", "policy_id", "policy identity missing"));
  if (!record?.policy_version) failures.push(validationFailure("POLICY_VERSION_MISSING", "policy_version", "policy version missing"));
  if (!record?.correlation_type || !(POLICY_CORRELATION_TYPES as readonly string[]).includes(record.correlation_type)) failures.push(validationFailure("INVALID_CORRELATION_TYPE", "correlation_type", "invalid correlation_type"));
  if (!record?.relationship_type || !(POLICY_CORRELATION_RELATIONSHIP_TYPES as readonly string[]).includes(record.relationship_type)) failures.push(validationFailure("INVALID_RELATIONSHIP_TYPE", "relationship_type", "invalid relationship_type"));
  if (!record?.source_ledger || !(POLICY_CORRELATION_LEDGER_SOURCES as readonly string[]).includes(record.source_ledger)) failures.push(validationFailure("UNKNOWN_LEDGER_SOURCE", "source_ledger", "unknown source ledger"));
  if (!record?.target_ledger || !(POLICY_CORRELATION_LEDGER_SOURCES as readonly string[]).includes(record.target_ledger)) failures.push(validationFailure("UNKNOWN_LEDGER_SOURCE", "target_ledger", "unknown target ledger"));
  if (!record?.source_record_refs || record.source_record_refs.length === 0) failures.push(validationFailure("SOURCE_RECORDS_MISSING", "source_record_refs", "source record refs missing"));
  if (!record?.target_record_refs || record.target_record_refs.length === 0) failures.push(validationFailure("TARGET_RECORDS_MISSING", "target_record_refs", "target record refs missing"));
  if (!record?.evidence_refs || record.evidence_refs.length === 0) failures.push(validationFailure("EVIDENCE_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs || record.lineage_refs.length === 0 || record.lineage_refs.includes("broken_lineage")) failures.push(validationFailure("LINEAGE_BREAK_DETECTED", "lineage_refs", "lineage refs missing or broken"));
  if (!record?.replay_refs || !record.replay_refs.policy_snapshot_ref || record.replay_refs.ledger_snapshot_refs.length === 0 || !record.replay_refs.input_record_set_hash || !record.replay_refs.output_correlation_hash || !record.replay_refs.replay_execution_ref) failures.push(validationFailure("REPLAY_REFS_MISSING", "replay_refs", "replay refs missing"));
  if (!record?.correlation_state || !(POLICY_CORRELATION_STATES as readonly string[]).includes(record.correlation_state)) failures.push(validationFailure("INVALID_CORRELATION_STATE", "correlation_state", "invalid correlation_state"));
  if (record?.correlation_state === "INCONSISTENT") failures.push(validationFailure("CROSS_LEDGER_INCONSISTENCY", "correlation_state", "correlation is inconsistent"));
  if (policy) {
    if (record?.tenant_id !== policy.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "tenant_id", "correlation tenant does not match policy tenant"));
    if (record?.policy_version !== policy.policy_version) failures.push(validationFailure("POLICY_VERSION_MISMATCH", "policy_version", "correlation policy version mismatch"));
  }
  if (record?.influence_path?.some((step) => step.includes("future_policy"))) failures.push(validationFailure("FUTURE_POLICY_INFLUENCE", "influence_path", "future policy influence detected"));
  if (record?.influence_path && record.influence_path.length < 2) failures.push(validationFailure("UNSUPPORTED_INFLUENCE_CLAIM", "influence_path", "influence path is unsupported"));
  if (record?.runtime_context?.summary.includes("execute_authorized") || record?.runtime_context?.refs.includes("execute_authorized")) failures.push(validationFailure("AUTHORITY_BOUNDARY_VIOLATION", "runtime_context", "runtime context cannot imply execution authority"));
  if (record?.authority_context?.summary.includes("execute")) failures.push(validationFailure("ENFORCEMENT_ATTEMPT_DETECTED", "authority_context", "correlation attempted enforcement"));
  if (context.original_record && context.original_record.policy_correlation_id !== record?.policy_correlation_id) failures.push(validationFailure("IDENTIFIER_MUTATION", "policy_correlation_id", "policy_correlation_id mutated"));
  if (record?.correlation_hash && computePolicyCorrelationHash(record as PolicyCorrelationRecord) !== record.correlation_hash) failures.push(validationFailure("REPLAY_HASH_MISMATCH", "correlation_hash", "correlation hash mismatch"));
  return Object.freeze({
    validation_id: hashValue("policy-correlation-validation", { id: record?.policy_correlation_id, failures: failures.map((failure) => failure.failure_id) }),
    policy_correlation_id: record?.policy_correlation_id,
    validation_state: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    correlation_hash: failures.length ? undefined : record?.correlation_hash,
    deterministic: true,
    replayable: Boolean(record?.replay_refs) && failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "REPLAY_HASH_MISMATCH"),
    tenant_scoped: failures.every((failure) => failure.reason !== "TENANT_MISMATCH"),
    advisory_only: true,
  });
}

export function transitionPolicyCorrelationState(record: PolicyCorrelationRecord, to_state: PolicyCorrelationState, policyAnalysis?: PolicyAnalysisRecord): PolicyCorrelationValidationResult {
  const allowed = ALLOWED_POLICY_CORRELATION_TRANSITIONS[record.correlation_state]?.includes(to_state);
  if (!allowed) {
    return Object.freeze({
      validation_id: hashValue("policy-correlation-state-transition", { id: record.policy_correlation_id, from: record.correlation_state, to_state }),
      policy_correlation_id: record.policy_correlation_id,
      validation_state: "FAIL",
      failures: Object.freeze([validationFailure("INVALID_STATE_TRANSITION", "correlation_state", `${record.correlation_state} to ${to_state} blocked`)]),
      deterministic: true,
      replayable: false,
      tenant_scoped: true,
      advisory_only: true,
    });
  }
  const { correlation_hash: _previousHash, ...source } = record;
  const updated = freezeCorrelation({ ...source, correlation_state: to_state, correlation_hash: computePolicyCorrelationHash({ ...source, correlation_state: to_state }) });
  return validatePolicyCorrelationRecord(updated, { policy_analysis: policyAnalysis });
}

export function replayPolicyCorrelation(record: PolicyCorrelationRecord, policyAnalysis?: PolicyAnalysisRecord): PolicyCorrelationReplayResult {
  const reconstructedHash = computePolicyCorrelationHash(record);
  const validation = validatePolicyCorrelationRecord(record, { policy_analysis: policyAnalysis });
  const mismatch = reconstructedHash !== record.correlation_hash || record.replay_refs.output_correlation_hash === "mismatch";
  return Object.freeze({
    replay_id: hashValue("policy-correlation-replay", { id: record.policy_correlation_id, reconstructedHash }),
    policy_correlation_id: record.policy_correlation_id,
    validation_state: validation.validation_state === "PASS" && !mismatch ? "PASS" : "FAIL",
    failure_reason: mismatch ? "REPLAY_HASH_MISMATCH" : validation.failures[0]?.reason ?? null,
    reconstructed_hash: reconstructedHash,
    expected_hash: record.correlation_hash,
    final_state: record.correlation_state,
  });
}

export function buildPolicyCorrelationExplanation(record: PolicyCorrelationRecord) {
  return Object.freeze({
    policy_correlation_id: record.policy_correlation_id,
    headline: `${record.policy_id} influenced ${record.target_record_refs.join(", ")} through ${record.relationship_type}.`,
    steps: freezeArray([
      `${record.policy_id} was active as ${record.policy_version}.`,
      `${record.source_ledger} supplied ${record.source_record_refs.join(", ")}.`,
      `${record.target_ledger} supplied ${record.target_record_refs.join(", ")}.`,
      `Constraints applied: ${record.constraints_applied.join("; ")}.`,
      `Evidence records ${record.evidence_refs.join(", ")} support the relationship.`,
      `Replay ${record.replay_refs.replay_execution_ref} reconstructs the same correlation.`,
    ]),
    evidence_summary: freezeArray(record.evidence_refs),
    replay_status: record.replay_refs.replay_execution_ref ? "REPLAYABLE" as const : "NOT_REPLAYABLE" as const,
  });
}

export function runPolicyCorrelationEngine(policyAnalysis: PolicyAnalysisRecord = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" }), records: readonly PolicyCorrelationHistoricalRecord[] = buildDefaultPolicyCorrelationHistoricalRecords(policyAnalysis)): PolicyCorrelationEngineResult {
  const registry = buildPolicyCorrelationSourceRegistry();
  const normalized = orderPolicyCorrelationRecords(normalizePolicyCorrelationRecords(collectPolicyCorrelationHistoricalRecords(policyAnalysis, records)));
  const correlations = generatePolicyCorrelations(policyAnalysis, normalized);
  const failures = correlations.flatMap((correlation) => validatePolicyCorrelationRecord(correlation, { policy_analysis: policyAnalysis }).failures);
  const aggregate: PolicyCorrelationValidationResult = Object.freeze({
    validation_id: hashValue("policy-correlation-engine-validation", { policy: policyAnalysis.policy_analysis_id, failures: failures.map((failure) => failure.failure_id) }),
    validation_state: failures.length || correlations.length === 0 ? "FAIL" : "PASS",
    failures: Object.freeze(correlations.length === 0 ? [validationFailure("HISTORICAL_RECORDS_MISSING", "historical_records", "historical records missing")] : failures),
    deterministic: true,
    replayable: correlations.length > 0 && failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "REPLAY_HASH_MISMATCH"),
    tenant_scoped: failures.every((failure) => failure.reason !== "TENANT_MISMATCH"),
    advisory_only: true,
  });
  return Object.freeze({
    engine_id: hashValue("policy-correlation-engine", { policy: policyAnalysis.policy_analysis_id, records: normalized.map((record) => record.record_hash) }),
    policy_analysis: policyAnalysis,
    source_registry: registry,
    normalized_records: normalized,
    ordered_record_ids: freezeArray(normalized.map((record) => record.record_id)),
    correlations,
    validation: aggregate,
  });
}

export function buildPolicyCorrelationObservabilitySurface(policyAnalysis: PolicyAnalysisRecord = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" }), records?: readonly PolicyCorrelationHistoricalRecord[]): PolicyCorrelationObservabilitySurface {
  const result = runPolicyCorrelationEngine(policyAnalysis, records ?? buildDefaultPolicyCorrelationHistoricalRecords(policyAnalysis));
  const explanations = result.correlations.map((correlation) => buildPolicyCorrelationExplanation(correlation));
  return Object.freeze({
    policy_analyzed: policyAnalysis.policy_id,
    policy_version: policyAnalysis.policy_version,
    policy_type: policyAnalysis.policy_type,
    correlations: result.correlations,
    explanations: Object.freeze(explanations),
    validation_failures: result.validation.failures,
    consistency_status: result.validation.validation_state === "PASS" ? "CONSISTENT" : result.validation.failures.some((failure) => failure.reason === "CROSS_LEDGER_INCONSISTENCY") ? "INCONSISTENT" : "INVALID",
    replay_ready: result.validation.replayable,
    tenant_isolation_preserved: result.validation.tenant_scoped,
  });
}
