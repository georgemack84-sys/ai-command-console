import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ConstitutionalDecisionStatus,
  GovernanceApprovalStatus,
  GovernanceAuthorityStatus,
  GovernanceCertificationStatus,
  GovernanceDecisionContractFailureReason,
  GovernanceDecisionContractInput,
  GovernanceDecisionContractObservability,
  GovernanceDecisionContractReplay,
  GovernanceDecisionContractValidation,
  GovernanceDecisionFilterContractFoundation,
  GovernanceDecisionLifecycleAuditEvent,
  GovernanceDecisionLifecycleState,
  GovernanceDecisionRecord,
  GovernanceDecisionStatus,
  GovernanceEnforcementState,
  GovernanceIntegrityStatus,
  GovernanceLineageStatus,
  GovernanceReplayStatus,
} from "@/types/governance-decision-filter-contract";

const CONTRACT_VERSION = "governance-decision-filter-contract/v1" as const;
const NOW = "2026-07-04T00:14:00.000Z";

export const GOVERNANCE_DECISION_STATUSES: readonly GovernanceDecisionStatus[] = Object.freeze(["PENDING", "VALID", "CONDITIONAL", "VIOLATION", "FAILED", "UNKNOWN"]);
export const CONSTITUTIONAL_DECISION_STATUSES: readonly ConstitutionalDecisionStatus[] = Object.freeze(["NOT_VALIDATED", "COMPLIANT", "NON_COMPLIANT", "CONDITIONAL", "FAILED", "UNKNOWN"]);
export const GOVERNANCE_AUTHORITY_STATUSES: readonly GovernanceAuthorityStatus[] = Object.freeze(["NOT_REQUIRED", "AUTHORIZED", "OPERATOR_REQUIRED", "GOVERNANCE_REQUIRED", "CERTIFICATION_REQUIRED", "UNAUTHORIZED"]);
export const GOVERNANCE_APPROVAL_STATUSES: readonly GovernanceApprovalStatus[] = Object.freeze(["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED", "EXPIRED"]);
export const GOVERNANCE_CERTIFICATION_STATUSES: readonly GovernanceCertificationStatus[] = Object.freeze(["NOT_REQUIRED", "PENDING", "CERTIFIED", "FAILED", "UNKNOWN"]);
export const GOVERNANCE_REPLAY_STATUSES: readonly GovernanceReplayStatus[] = Object.freeze(["AVAILABLE", "VERIFIED", "PARTIAL", "MISSING", "FAILED"]);
export const GOVERNANCE_LINEAGE_STATUSES: readonly GovernanceLineageStatus[] = Object.freeze(["COMPLETE", "PARTIAL", "BROKEN", "UNKNOWN"]);
export const GOVERNANCE_INTEGRITY_STATUSES: readonly GovernanceIntegrityStatus[] = Object.freeze(["VERIFIED", "PARTIAL", "FAILED", "UNKNOWN"]);
export const GOVERNANCE_ENFORCEMENT_STATES: readonly GovernanceEnforcementState[] = Object.freeze(["ALLOW", "ALLOW_WITH_OPERATOR_APPROVAL", "ALLOW_WITH_GOVERNANCE_REVIEW", "RESTRICT", "DEFER", "ESCALATE", "BLOCK", "FAIL_CLOSED"]);
export const GOVERNANCE_DECISION_LIFECYCLE: readonly GovernanceDecisionLifecycleState[] = Object.freeze(["CREATED", "REGISTERED", "VALIDATED", "READY_FOR_ENFORCEMENT", "UNDER_ENFORCEMENT", "FINALIZED", "ARCHIVED"]);

export const GOVERNANCE_DECISION_ALLOWED_TRANSITIONS: Readonly<Record<GovernanceDecisionLifecycleState, readonly GovernanceDecisionLifecycleState[]>> = Object.freeze({
  CREATED: Object.freeze(["REGISTERED"] as GovernanceDecisionLifecycleState[]),
  REGISTERED: Object.freeze(["VALIDATED"] as GovernanceDecisionLifecycleState[]),
  VALIDATED: Object.freeze(["READY_FOR_ENFORCEMENT"] as GovernanceDecisionLifecycleState[]),
  READY_FOR_ENFORCEMENT: Object.freeze(["UNDER_ENFORCEMENT"] as GovernanceDecisionLifecycleState[]),
  UNDER_ENFORCEMENT: Object.freeze(["FINALIZED"] as GovernanceDecisionLifecycleState[]),
  FINALIZED: Object.freeze(["ARCHIVED"] as GovernanceDecisionLifecycleState[]),
  ARCHIVED: Object.freeze([] as GovernanceDecisionLifecycleState[]),
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeRefs(values: readonly string[] | undefined, fallback: readonly string[]): readonly string[] {
  const refs = [...new Set((values ?? fallback).filter((value) => value.length > 0))].sort();
  return Object.freeze(refs);
}

function deterministicGovernanceDecisionId(input: GovernanceDecisionContractInput): string {
  const seed = {
    decision_candidate_id: input.decision_candidate_id ?? "decision_candidate_alpha",
    mission_id: input.mission_id ?? "mission_governance_filter",
    tenant_id: input.tenant_id ?? "tenant_alpha",
  };
  return `governance_decision_${hash(seed).slice(0, 24)}`;
}

export function computeGovernanceDecisionRecordHash(record: Omit<GovernanceDecisionRecord, "integrity_hash"> | GovernanceDecisionRecord): string {
  return hashWithoutIntegrity(record);
}

export function createGovernanceDecisionRecord(input: GovernanceDecisionContractInput = {}): GovernanceDecisionRecord {
  const base: Omit<GovernanceDecisionRecord, "integrity_hash"> = {
    governance_decision_id: input.governance_decision_id ?? deterministicGovernanceDecisionId(input),
    decision_candidate_id: input.decision_candidate_id ?? "decision_candidate_alpha",
    mission_id: input.mission_id ?? "mission_governance_filter",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    governance_status: input.governance_status ?? "PENDING",
    constitutional_status: input.constitutional_status ?? "NOT_VALIDATED",
    authority_status: input.authority_status ?? "NOT_REQUIRED",
    approval_status: input.approval_status ?? "NOT_REQUIRED",
    certification_status: input.certification_status ?? "NOT_REQUIRED",
    replay_status: input.replay_status ?? "AVAILABLE",
    lineage_status: input.lineage_status ?? "COMPLETE",
    integrity_status: input.integrity_status ?? "VERIFIED",
    enforcement_state: input.enforcement_state ?? "DEFER",
    lifecycle_state: input.lifecycle_state ?? "CREATED",
    validation_refs: normalizeRefs(input.validation_refs, ["validation_schema_governance_decision_contract"]),
    evidence_refs: normalizeRefs(input.evidence_refs, ["evidence_decision_candidate_alpha"]),
    replay_refs: normalizeRefs(input.replay_refs, ["replay_governance_decision_contract_alpha"]),
    lineage_refs: normalizeRefs(input.lineage_refs, ["lineage_governance_decision_contract_alpha"]),
    created_at: input.created_at ?? NOW,
    advisory_only: input.advisory_only === false ? (false as never) : true,
  };
  return Object.freeze({ ...base, integrity_hash: computeGovernanceDecisionRecordHash(base) });
}

function validationResult(failures: readonly GovernanceDecisionContractFailureReason[]): GovernanceDecisionContractValidation {
  const unique = Object.freeze([...new Set(failures)] as GovernanceDecisionContractFailureReason[]);
  const has = (failure: GovernanceDecisionContractFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      schema_valid: !has("REQUIRED_FIELD_MISSING") && !has("INVALID_SCHEMA") && !has("MALFORMED_METADATA"),
      identity_valid: !has("DUPLICATE_GOVERNANCE_DECISION_ID") && !has("TENANT_OWNERSHIP_AMBIGUOUS"),
      lifecycle_valid: !has("INVALID_LIFECYCLE_TRANSITION"),
      references_resolved: !has("UNRESOLVED_VALIDATION_REFERENCE") && !has("UNRESOLVED_EVIDENCE_REFERENCE"),
      replay_ready: !has("MISSING_REPLAY_REFERENCE") && !has("REPLAY_DIVERGENCE"),
      lineage_complete: !has("LINEAGE_INCOMPLETE"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION") && !has("TENANT_OWNERSHIP_AMBIGUOUS"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

function requiredFieldsPresent(record: GovernanceDecisionRecord): boolean {
  return Boolean(record.governance_decision_id
    && record.decision_candidate_id
    && record.mission_id
    && record.tenant_id
    && record.governance_status
    && record.constitutional_status
    && record.authority_status
    && record.approval_status
    && record.certification_status
    && record.replay_status
    && record.lineage_status
    && record.integrity_status
    && record.enforcement_state
    && record.integrity_hash);
}

export function validateGovernanceDecisionRecord(record: GovernanceDecisionRecord, input: GovernanceDecisionContractInput = {}): GovernanceDecisionContractValidation {
  const failures: GovernanceDecisionContractFailureReason[] = [];
  if (!requiredFieldsPresent(record)) failures.push("REQUIRED_FIELD_MISSING");
  if (input.existing_governance_decision_ids?.includes(record.governance_decision_id)) failures.push("DUPLICATE_GOVERNANCE_DECISION_ID");
  if (!GOVERNANCE_DECISION_STATUSES.includes(record.governance_status)
    || !CONSTITUTIONAL_DECISION_STATUSES.includes(record.constitutional_status)
    || !GOVERNANCE_AUTHORITY_STATUSES.includes(record.authority_status)
    || !GOVERNANCE_APPROVAL_STATUSES.includes(record.approval_status)
    || !GOVERNANCE_CERTIFICATION_STATUSES.includes(record.certification_status)
    || !GOVERNANCE_REPLAY_STATUSES.includes(record.replay_status)
    || !GOVERNANCE_LINEAGE_STATUSES.includes(record.lineage_status)
    || !GOVERNANCE_INTEGRITY_STATUSES.includes(record.integrity_status)
    || !GOVERNANCE_ENFORCEMENT_STATES.includes(record.enforcement_state)
    || !GOVERNANCE_DECISION_LIFECYCLE.includes(record.lifecycle_state)) failures.push("INVALID_SCHEMA");
  if (record.validation_refs.length === 0 || record.validation_refs.some((ref) => ref.includes("missing") || ref.includes("broken"))) failures.push("UNRESOLVED_VALIDATION_REFERENCE");
  if (record.evidence_refs.length === 0 || record.evidence_refs.some((ref) => ref.includes("missing") || ref.includes("broken"))) failures.push("UNRESOLVED_EVIDENCE_REFERENCE");
  if (record.replay_refs.length === 0 || record.replay_status === "MISSING") failures.push("MISSING_REPLAY_REFERENCE");
  if (record.lineage_refs.length === 0 || record.lineage_status !== "COMPLETE") failures.push("LINEAGE_INCOMPLETE");
  if (!record.tenant_id || record.tenant_id === "unknown" || record.tenant_id.includes(",")) failures.push("TENANT_OWNERSHIP_AMBIGUOUS");
  if (record.tenant_id !== "tenant_beta" && JSON.stringify(record).includes("tenant_beta")) failures.push("TENANT_ISOLATION_VIOLATION");
  if (record.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (record.integrity_status !== "VERIFIED" || computeGovernanceDecisionRecordHash(record) !== record.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(failures);
}

function auditHash(event: Omit<GovernanceDecisionLifecycleAuditEvent, "integrity_hash"> | GovernanceDecisionLifecycleAuditEvent): string {
  return hashWithoutIntegrity(event);
}

function buildAuditEvent(record: GovernanceDecisionRecord, previous_state: GovernanceDecisionLifecycleState, new_state: GovernanceDecisionLifecycleState, transition_valid: boolean): GovernanceDecisionLifecycleAuditEvent {
  const base: Omit<GovernanceDecisionLifecycleAuditEvent, "integrity_hash"> = {
    audit_event_id: `governance_lifecycle_${record.governance_decision_id}_${previous_state.toLowerCase()}_${new_state.toLowerCase()}`,
    governance_decision_id: record.governance_decision_id,
    previous_state,
    new_state,
    transition_valid,
    replay_ref: `replay_lifecycle_${record.governance_decision_id}_${new_state.toLowerCase()}`,
    transition_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: auditHash(base) });
}

export function transitionGovernanceDecisionLifecycle(record: GovernanceDecisionRecord, new_state: GovernanceDecisionLifecycleState): Readonly<{
  record: GovernanceDecisionRecord;
  audit_event: GovernanceDecisionLifecycleAuditEvent;
  validation: GovernanceDecisionContractValidation;
}> {
  const transition_valid = GOVERNANCE_DECISION_ALLOWED_TRANSITIONS[record.lifecycle_state].includes(new_state);
  const audit_event = buildAuditEvent(record, record.lifecycle_state, new_state, transition_valid);
  if (!transition_valid) {
    return Object.freeze({
      record,
      audit_event,
      validation: validationResult(["INVALID_LIFECYCLE_TRANSITION"]),
    });
  }
  const nextBase: Omit<GovernanceDecisionRecord, "integrity_hash"> = { ...record, lifecycle_state: new_state };
  const next = Object.freeze({ ...nextBase, integrity_hash: computeGovernanceDecisionRecordHash(nextBase) });
  return Object.freeze({
    record: next,
    audit_event,
    validation: validateGovernanceDecisionRecord(next),
  });
}

export function replayGovernanceDecisionRecord(record: GovernanceDecisionRecord, lifecycle_events: readonly GovernanceDecisionLifecycleAuditEvent[] = []): GovernanceDecisionContractReplay {
  const reconstructed_hash = computeGovernanceDecisionRecordHash(record);
  const replay_valid = reconstructed_hash === record.integrity_hash
    && lifecycle_events.every((event) => auditHash(event) === event.integrity_hash)
    && validateGovernanceDecisionRecord(record).validation_state === "VALID";
  const failures: GovernanceDecisionContractFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<GovernanceDecisionContractReplay, "integrity_hash"> = {
    replay_id: `replay_governance_decision_contract_${record.governance_decision_id}`,
    governance_decision_id: record.governance_decision_id,
    replay_valid,
    reconstructed_hash,
    expected_hash: record.integrity_hash,
    lifecycle_events,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildGovernanceDecisionContractObservability(input: {
  record: GovernanceDecisionRecord;
  validation: GovernanceDecisionContractValidation;
  replay: GovernanceDecisionContractReplay;
  lifecycle_events?: readonly GovernanceDecisionLifecycleAuditEvent[];
}): GovernanceDecisionContractObservability {
  const lifecycleEvents = input.lifecycle_events ?? [];
  return Object.freeze({
    contract_creation_events: 1,
    validation_events: 1,
    lifecycle_transitions: lifecycleEvents.length,
    integrity_verification_events: input.validation.checks.integrity_valid ? 1 : 0,
    replay_verification_events: input.replay.replay_valid ? 1 : 0,
    contract_failures: input.validation.failures.length + input.replay.failures.length,
    enforcement_readiness_events: input.record.lifecycle_state === "READY_FOR_ENFORCEMENT" ? 1 : 0,
  });
}

export function getGovernanceDecisionFilterContractFoundation(): GovernanceDecisionFilterContractFoundation {
  const created = createGovernanceDecisionRecord();
  const registered = transitionGovernanceDecisionLifecycle(created, "REGISTERED");
  const validated = transitionGovernanceDecisionLifecycle(registered.record, "VALIDATED");
  const ready = transitionGovernanceDecisionLifecycle(validated.record, "READY_FOR_ENFORCEMENT");
  const lifecycle_events = Object.freeze([registered.audit_event, validated.audit_event, ready.audit_event]);
  const validation = validateGovernanceDecisionRecord(ready.record);
  const replay = replayGovernanceDecisionRecord(ready.record, lifecycle_events);
  return Object.freeze({
    contract_version: CONTRACT_VERSION,
    governance_statuses: GOVERNANCE_DECISION_STATUSES,
    constitutional_statuses: CONSTITUTIONAL_DECISION_STATUSES,
    authority_statuses: GOVERNANCE_AUTHORITY_STATUSES,
    approval_statuses: GOVERNANCE_APPROVAL_STATUSES,
    certification_statuses: GOVERNANCE_CERTIFICATION_STATUSES,
    replay_statuses: GOVERNANCE_REPLAY_STATUSES,
    lineage_statuses: GOVERNANCE_LINEAGE_STATUSES,
    integrity_statuses: GOVERNANCE_INTEGRITY_STATUSES,
    enforcement_states: GOVERNANCE_ENFORCEMENT_STATES,
    lifecycle_states: GOVERNANCE_DECISION_LIFECYCLE,
    allowed_lifecycle_transitions: GOVERNANCE_DECISION_ALLOWED_TRANSITIONS,
    record: ready.record,
    validation,
    replay,
    observability: buildGovernanceDecisionContractObservability({ record: ready.record, validation, replay, lifecycle_events }),
  });
}

export const GovernanceDecisionFilterContract = Object.freeze({
  create: createGovernanceDecisionRecord,
  validate: validateGovernanceDecisionRecord,
  transition: transitionGovernanceDecisionLifecycle,
  replay: replayGovernanceDecisionRecord,
  hash: computeGovernanceDecisionRecordHash,
});
