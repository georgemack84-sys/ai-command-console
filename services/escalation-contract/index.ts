import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  EscalationContractDoctrine,
  EscalationContractRecord,
  EscalationLifecycleTransitionResult,
  EscalationObservabilitySurface,
  EscalationReplayResult,
  EscalationRoutingTarget,
  EscalationSeverity,
  EscalationState,
  EscalationTriggerType,
  EscalationType,
  EscalationValidationFailure,
  EscalationValidationFailureReason,
  EscalationValidationResult,
} from "@/types/escalation-contract";

const NOW: "2026-06-26T14:00:00.000Z" = "2026-06-26T14:00:00.000Z";
const CONTRACT_VERSION: "ESCALATION-CONTRACT-V1" = "ESCALATION-CONTRACT-V1";

export const ESCALATION_TYPES: readonly EscalationType[] = Object.freeze(["CONSTITUTIONAL", "AUTHORITY", "POLICY", "COMPLIANCE", "GOVERNANCE", "RISK", "RECOMMENDATION", "EVIDENCE", "REPLAY", "OPERATIONAL"]);
export const ESCALATION_TRIGGERS: readonly EscalationTriggerType[] = Object.freeze(["CONSTITUTIONAL_CONFLICT", "AUTHORITY_DRIFT", "POLICY_VIOLATION", "COMPLIANCE_GAP", "GOVERNANCE_EXCEPTION", "RISK_THRESHOLD", "RECOMMENDATION_BLOCKER", "EVIDENCE_INTEGRITY_FAILURE", "REPLAY_MISMATCH", "OPERATIONAL_FAILURE"]);
export const ESCALATION_SEVERITIES: readonly EscalationSeverity[] = Object.freeze(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const ESCALATION_ROUTING_TARGETS: readonly EscalationRoutingTarget[] = Object.freeze(["OPERATOR_REVIEW", "GOVERNANCE_REVIEW", "COMPLIANCE_REVIEW", "POLICY_REVIEW", "CONSTITUTIONAL_REVIEW", "EMERGENCY_GOVERNANCE_REVIEW"]);
const ESCALATION_STATES: readonly EscalationState[] = Object.freeze(["CREATED", "VALIDATED", "PRIORITIZED", "ROUTED", "RECORDED", "REPLAYED", "CERTIFIED", "SUPERSEDED", "ARCHIVED"]);
const IMMUTABLE_FIELDS: readonly (keyof EscalationContractRecord)[] = Object.freeze(["escalation_id", "tenant_id", "mission_id", "governance_session_id", "created_timestamp"]);
const TRANSITIONS: Readonly<Record<EscalationState, readonly EscalationState[]>> = Object.freeze({
  CREATED: Object.freeze(["VALIDATED", "SUPERSEDED"] as const),
  VALIDATED: Object.freeze(["PRIORITIZED", "SUPERSEDED"] as const),
  PRIORITIZED: Object.freeze(["ROUTED", "SUPERSEDED"] as const),
  ROUTED: Object.freeze(["RECORDED", "SUPERSEDED"] as const),
  RECORDED: Object.freeze(["REPLAYED", "CERTIFIED", "SUPERSEDED"] as const),
  REPLAYED: Object.freeze(["CERTIFIED", "SUPERSEDED"] as const),
  CERTIFIED: Object.freeze(["ARCHIVED", "SUPERSEDED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

export type EscalationContractScenario = "BASELINE" | "MISSING_TRIGGER" | "UNSUPPORTED_TRIGGER" | "INVALID_SEVERITY" | "MISSING_ROUTING" | "INCOMPLETE_EVIDENCE" | "BROKEN_LINEAGE" | "REPLAY_MISMATCH" | "LEDGER_MISSING" | "CROSS_TENANT" | "EXECUTION_AUTHORITY" | "AUTHORITY_EXPANSION" | "HIDDEN_STATE" | "HASH_MISMATCH";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn<T extends object>(object: Partial<T>, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function failure(reason: EscalationValidationFailureReason, field_path: string, message: string): EscalationValidationFailure {
  return Object.freeze({ failure_id: hashValue("escalation-contract-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function severityFor(score: number): EscalationSeverity {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "INFO";
}

function confidenceLevel(score: number) {
  if (score >= 95) return "CERTIFICATION_READY" as const;
  if (score >= 85) return "HIGH" as const;
  if (score >= 65) return "MODERATE" as const;
  return "LOW" as const;
}

export function buildEscalationContractDoctrine(): EscalationContractDoctrine {
  return Object.freeze({
    principles: Object.freeze(["canonical", "deterministic", "trigger-defined", "severity-thresholded", "route-governed", "evidence-bound", "confidence-reproducible", "lineage-preserving", "replayable", "truth-ledger-recorded", "constitutional-supremacy", "advisory-only", "tenant-safe", "certification-ready", "fail-closed"] as const),
    supported_types: ESCALATION_TYPES,
    supported_triggers: ESCALATION_TRIGGERS,
    supported_severities: ESCALATION_SEVERITIES,
    supported_routing_targets: ESCALATION_ROUTING_TARGETS,
    lifecycle_states: ESCALATION_STATES,
    contract_version: CONTRACT_VERSION,
  });
}

export function generateEscalationId(tenant_id: string, mission_id: string, trigger_type: EscalationTriggerType): string {
  return `ESC-7F1-${hashValue("escalation-contract-id", { tenant_id, mission_id, trigger_type }).slice(0, 10).toUpperCase()}`;
}

function triggerHash(input: { trigger_type: string; trigger_name: string; trigger_reason: string; trigger_source: string; trigger_timestamp: string }) {
  return hashValue("escalation-trigger", input);
}

function routingHash(input: { routing_target: string; routing_priority: string; routing_reason: string; routing_policy: string }) {
  return hashValue("escalation-routing", input);
}

function confidenceHash(input: Record<string, number | string>) {
  return hashValue("escalation-confidence", input);
}

export function computeEscalationHash(record: Omit<EscalationContractRecord, "escalation_hash"> | EscalationContractRecord): string {
  const { escalation_hash: _hash, ...source } = record as EscalationContractRecord;
  return hashValue("escalation-contract", source);
}

function buildRecordWithoutHash(input: Partial<EscalationContractRecord>, scenario: EscalationContractScenario): Omit<EscalationContractRecord, "escalation_hash"> {
  const tenant_id = hasOwn(input, "tenant_id") ? input.tenant_id! : "tenant_alpha";
  const mission_id = hasOwn(input, "mission_id") ? input.mission_id! : "mission_governance_escalation";
  const trigger_type = scenario === "UNSUPPORTED_TRIGGER" ? "UNSUPPORTED_TRIGGER" as EscalationTriggerType : input.trigger_definition?.trigger_type ?? "POLICY_VIOLATION";
  const escalation_type = hasOwn(input, "escalation_type") ? input.escalation_type! : "POLICY";
  const escalation_id = hasOwn(input, "escalation_id") ? input.escalation_id! : generateEscalationId(tenant_id, mission_id, trigger_type);
  const triggerTimestamp = input.trigger_definition?.trigger_timestamp ?? NOW;
  const triggerSource = input.trigger_definition?.trigger_source ?? `governance_event_${tenant_id}_policy_001`;
  const triggerName = input.trigger_definition?.trigger_name ?? "Policy violation requires governance attention";
  const triggerReason = input.trigger_definition?.trigger_reason ?? "Policy evidence, governance context, and risk threshold indicate operator-visible escalation is required.";
  const trigger = scenario === "MISSING_TRIGGER" ? undefined : Object.freeze({
    trigger_id: input.trigger_definition?.trigger_id ?? `trigger_${tenant_id}_${trigger_type.toLowerCase()}_001`,
    trigger_type,
    trigger_name: triggerName,
    trigger_reason: triggerReason,
    trigger_timestamp: triggerTimestamp,
    trigger_source: triggerSource,
    deterministic_trigger_hash: input.trigger_definition?.deterministic_trigger_hash ?? triggerHash({ trigger_type, trigger_name: triggerName, trigger_reason: triggerReason, trigger_source: triggerSource, trigger_timestamp: triggerTimestamp }),
  });
  const severity_score = input.severity_definition?.severity_score ?? 78;
  const severity = scenario === "INVALID_SEVERITY" ? "INVALID" as EscalationSeverity : input.severity_definition?.severity ?? severityFor(severity_score);
  const routing_target = scenario === "MISSING_ROUTING" ? undefined as never : input.routing_definition?.routing_target ?? (severity === "CRITICAL" ? "EMERGENCY_GOVERNANCE_REVIEW" : severity === "HIGH" ? "GOVERNANCE_REVIEW" : "OPERATOR_REVIEW");
  const routing_priority = input.routing_definition?.routing_priority ?? (severity === "CRITICAL" ? "URGENT" : severity === "HIGH" ? "HIGH" : "NORMAL");
  const routing_reason = input.routing_definition?.routing_reason ?? "Routing preserves governance authority and directs attention to the appropriate review lane.";
  const routing_policy = input.routing_definition?.routing_policy ?? `routing_policy_${tenant_id}_governance_escalation_v1`;
  const confidence_inputs = input.confidence_metadata?.confidence_inputs ?? Object.freeze({ evidence_quality: 92, severity_score, replay_integrity: 100, lineage_completeness: 100 });
  const confidence_score = input.confidence_metadata?.confidence_score ?? 91;
  const evidenceTenant = scenario === "CROSS_TENANT" ? "tenant_beta" : tenant_id;
  const evidence_references = input.evidence_references ?? Object.freeze({
    evidence_ids: scenario === "INCOMPLETE_EVIDENCE" ? Object.freeze([]) : Object.freeze([`evidence_${evidenceTenant}_escalation_policy`, `evidence_${evidenceTenant}_escalation_risk`, `evidence_${evidenceTenant}_escalation_replay`]),
    truth_record_ids: Object.freeze([`truth_record_${evidenceTenant}_escalation_7f1`]),
    recommendation_ids: Object.freeze([`recommendation_${evidenceTenant}_7e_escalation_candidate`]),
    policy_ids: Object.freeze([`policy_${evidenceTenant}_governance_escalation_v1`]),
    risk_ids: Object.freeze([`risk_${evidenceTenant}_authority_policy_001`]),
    compliance_ids: Object.freeze([`compliance_${evidenceTenant}_7d_certified`]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? Object.freeze([]) : Object.freeze([`lineage_${evidenceTenant}_escalation_origin_7f1`]),
  });
  const replayBase = { escalation_id, tenant_id, mission_id, trigger, severity, routing_target, evidence_references, confidence_inputs };
  const reconstruction_hash = scenario === "REPLAY_MISMATCH" ? "tampered" : hashValue("escalation-reconstruction", replayBase);
  return {
    escalation_id,
    tenant_id,
    mission_id,
    governance_session_id: hasOwn(input, "governance_session_id") ? input.governance_session_id! : `gov_session_${tenant_id}_7f1`,
    escalation_type,
    category: input.category ?? "governance_attention_required",
    source: input.source ?? triggerSource,
    trigger_definition: trigger as never,
    severity_definition: input.severity_definition ?? Object.freeze({ severity, severity_score, severity_reason: "Severity is derived from policy impact, authority risk, evidence integrity, and replay confidence.", threshold_model_version: "ESCALATION-SEVERITY-V1" as const }),
    routing_definition: input.routing_definition ?? Object.freeze({ routing_target, routing_priority, routing_reason, routing_policy, deterministic_routing_hash: routingHash({ routing_target, routing_priority, routing_reason, routing_policy }) }),
    evidence_references,
    governance_context: input.governance_context ?? Object.freeze({ constitutional_context: Object.freeze(["constitution_operator_supremacy_v1", "constitution_advisory_escalation_v1"]), authority_context: Object.freeze(["no_authority_expansion", "operator_review_required"]), policy_context: Object.freeze([`policy_${tenant_id}_governance_escalation_v1`]), compliance_context: Object.freeze([`compliance_${tenant_id}_escalation_visibility`]), risk_context: Object.freeze([`risk_${tenant_id}_authority_policy_001`]) }),
    confidence_metadata: input.confidence_metadata ?? Object.freeze({ confidence_score, confidence_level: confidenceLevel(confidence_score), confidence_reason: "Confidence is deterministic from evidence quality, severity score, replay integrity, and lineage completeness.", confidence_inputs, confidence_hash: confidenceHash(confidence_inputs) }),
    lineage_references: input.lineage_references ?? Object.freeze({ parent_escalation_id: null, root_escalation_id: escalation_id, lineage_chain: scenario === "BROKEN_LINEAGE" ? Object.freeze([]) : Object.freeze([`lineage_${tenant_id}_escalation_origin_7f1`, escalation_id]), supersedes_escalation_ids: Object.freeze([]), related_escalation_ids: Object.freeze([]) }),
    replay_metadata: input.replay_metadata ?? Object.freeze({ replay_id: `replay_${tenant_id}_escalation_contract_7f1`, replay_hash: hashValue("escalation-replay", replayBase), reconstruction_hash, replay_timestamp: NOW }),
    truth_ledger_reference: scenario === "LEDGER_MISSING" ? undefined as never : input.truth_ledger_reference ?? Object.freeze({ truth_record_reference: `truth_ledger_${tenant_id}_escalation_contract_7f1`, ledger_hash: hashValue("escalation-ledger", { escalation_id, tenant_id, evidence_references }), ledger_sequence: 1 }),
    certification_metadata: input.certification_metadata ?? Object.freeze({ contract_version: CONTRACT_VERSION, schema_version: "ESCALATION-SCHEMA-V1" as const, certification_version: "ESCALATION-CERTIFICATION-PREREQ-V1" as const, validation_state: "VALID" as const }),
    advisory_boundary: input.advisory_boundary ?? Object.freeze({ advisory_only: true, execution_authority: scenario === "EXECUTION_AUTHORITY" ? true as false : false, mutation_authority: false, approval_authority: false, operator_override_authority: false, authority_expansion: scenario === "AUTHORITY_EXPANSION" ? true as false : false }),
    state: input.state ?? "VALIDATED",
    created_timestamp: input.created_timestamp ?? NOW,
  };
}

export function buildEscalationContractRecord(input: Partial<EscalationContractRecord> & { scenario?: EscalationContractScenario } = {}): EscalationContractRecord {
  const scenario = input.scenario ?? "BASELINE";
  const withoutHash = buildRecordWithoutHash(input, scenario);
  const hash = scenario === "HASH_MISMATCH" ? "tampered" : input.escalation_hash ?? computeEscalationHash(withoutHash);
  return Object.freeze({ ...withoutHash, escalation_hash: hash });
}

export function validateEscalationContractRecord(record: Partial<EscalationContractRecord> | undefined, context: { original_record?: EscalationContractRecord } = {}): EscalationValidationResult {
  const errors: EscalationValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "escalation contract missing"));
  if (record?.certification_metadata?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_CONTRACT_VERSION", "certification_metadata.contract_version", "unsupported escalation contract version"));
  if (!record?.escalation_id) errors.push(failure("ESCALATION_ID_MISSING", "escalation_id", "escalation id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.governance_session_id) errors.push(failure("GOVERNANCE_SESSION_ID_MISSING", "governance_session_id", "governance session id missing"));
  if (!record?.escalation_type || !ESCALATION_TYPES.includes(record.escalation_type)) errors.push(failure("UNSUPPORTED_ESCALATION_TYPE", "escalation_type", "unsupported escalation type"));
  const trigger = record?.trigger_definition;
  if (!trigger?.trigger_id) errors.push(failure("TRIGGER_MISSING", "trigger_definition", "deterministic trigger missing"));
  if (trigger?.trigger_type && !ESCALATION_TRIGGERS.includes(trigger.trigger_type)) errors.push(failure("UNSUPPORTED_TRIGGER", "trigger_definition.trigger_type", "unsupported trigger type"));
  if (trigger && triggerHash({ trigger_type: trigger.trigger_type, trigger_name: trigger.trigger_name, trigger_reason: trigger.trigger_reason, trigger_source: trigger.trigger_source, trigger_timestamp: trigger.trigger_timestamp }) !== trigger.deterministic_trigger_hash) errors.push(failure("TRIGGER_HASH_MISMATCH", "trigger_definition.deterministic_trigger_hash", "trigger hash mismatch"));
  const severity = record?.severity_definition;
  if (!severity?.severity || !ESCALATION_SEVERITIES.includes(severity.severity)) errors.push(failure("INVALID_SEVERITY", "severity_definition.severity", "invalid escalation severity"));
  if (typeof severity?.severity_score !== "number" || severity.severity_score < 0 || severity.severity_score > 100) errors.push(failure("SEVERITY_SCORE_INVALID", "severity_definition.severity_score", "severity score invalid"));
  if (!severity?.severity_reason) errors.push(failure("SEVERITY_REASON_MISSING", "severity_definition.severity_reason", "severity reason missing"));
  const routing = record?.routing_definition;
  if (!routing?.routing_target || !ESCALATION_ROUTING_TARGETS.includes(routing.routing_target)) errors.push(failure("ROUTING_TARGET_MISSING", "routing_definition.routing_target", "routing target missing or unsupported"));
  if (routing?.routing_target && routingHash({ routing_target: routing.routing_target, routing_priority: routing.routing_priority, routing_reason: routing.routing_reason, routing_policy: routing.routing_policy }) !== routing.deterministic_routing_hash) errors.push(failure("ROUTING_HASH_MISMATCH", "routing_definition.deterministic_routing_hash", "routing hash mismatch"));
  const evidence = record?.evidence_references;
  if (!evidence?.evidence_ids?.length || !evidence.truth_record_ids?.length || !evidence.policy_ids?.length || !evidence.risk_ids?.length) errors.push(failure("EVIDENCE_INCOMPLETE", "evidence_references", "evidence, truth, policy, and risk refs are required"));
  if (!evidence?.lineage_refs?.length || !record?.lineage_references?.lineage_chain?.length) errors.push(failure("LINEAGE_BROKEN", "lineage_references", "lineage chain is missing"));
  const governance = record?.governance_context;
  if (!governance?.constitutional_context?.length || !governance.authority_context?.length || !governance.policy_context?.length || !governance.risk_context?.length) errors.push(failure("GOVERNANCE_CONTEXT_MISSING", "governance_context", "governance context incomplete"));
  const confidence = record?.confidence_metadata;
  if (typeof confidence?.confidence_score !== "number" || confidence.confidence_score < 0 || confidence.confidence_score > 100 || !confidence.confidence_reason) errors.push(failure("CONFIDENCE_INVALID", "confidence_metadata", "confidence metadata invalid"));
  if (confidence && confidenceHash(confidence.confidence_inputs) !== confidence.confidence_hash) errors.push(failure("CONFIDENCE_HASH_MISMATCH", "confidence_metadata.confidence_hash", "confidence hash mismatch"));
  const replay = record?.replay_metadata;
  if (!replay?.replay_id || !replay.replay_hash || !replay.reconstruction_hash) errors.push(failure("REPLAY_METADATA_MISSING", "replay_metadata", "replay metadata missing"));
  if (replay && replay.reconstruction_hash !== hashValue("escalation-reconstruction", { escalation_id: record?.escalation_id, tenant_id: record?.tenant_id, mission_id: record?.mission_id, trigger: record?.trigger_definition, severity: record?.severity_definition?.severity, routing_target: record?.routing_definition?.routing_target, evidence_references: record?.evidence_references, confidence_inputs: record?.confidence_metadata?.confidence_inputs })) errors.push(failure("REPLAY_HASH_MISMATCH", "replay_metadata.reconstruction_hash", "replay reconstruction hash mismatch"));
  if (!record?.truth_ledger_reference?.truth_record_reference || !record.truth_ledger_reference.ledger_hash) errors.push(failure("TRUTH_LEDGER_MISSING", "truth_ledger_reference", "Truth Ledger reference missing"));
  if (record?.truth_ledger_reference && (!Number.isInteger(record.truth_ledger_reference.ledger_sequence) || record.truth_ledger_reference.ledger_sequence <= 0)) errors.push(failure("INVALID_LEDGER_SEQUENCE", "truth_ledger_reference.ledger_sequence", "ledger sequence must be positive"));
  const boundary = record?.advisory_boundary;
  if (!boundary?.advisory_only) errors.push(failure("ADVISORY_BOUNDARY_MISSING", "advisory_boundary", "advisory-only boundary missing"));
  if (boundary?.execution_authority !== false || boundary?.mutation_authority !== false || boundary?.approval_authority !== false || boundary?.operator_override_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", "advisory_boundary", "escalation cannot execute, mutate, approve, or override operators"));
  if (boundary?.authority_expansion !== false) errors.push(failure("AUTHORITY_EXPANSION_DETECTED", "advisory_boundary.authority_expansion", "escalation cannot expand authority"));
  if (containsTenantLeak(record, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant escalation reference detected"));
  if (!record?.state || !ESCALATION_STATES.includes(record.state)) errors.push(failure("INVALID_STATE", "state", "invalid escalation state"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_escalation_state" in record || "random_seed" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden escalation state detected"));
  if (context.original_record) {
    for (const key of IMMUTABLE_FIELDS) {
      if (canonicalizeConfidenceToString(context.original_record[key]) !== canonicalizeConfidenceToString(record?.[key])) errors.push(failure("IMMUTABLE_IDENTITY_MUTATION", String(key), `${String(key)} cannot be mutated`));
    }
  }
  if (record?.escalation_hash && computeEscalationHash(record as EscalationContractRecord) !== record.escalation_hash) errors.push(failure("ESCALATION_HASH_MISMATCH", "escalation_hash", "escalation hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["EXECUTION_AUTHORITY_DETECTED", "AUTHORITY_EXPANSION_DETECTED", "IMMUTABLE_IDENTITY_MUTATION", "HIDDEN_STATE_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_METADATA_MISSING", "REPLAY_HASH_MISMATCH", "ESCALATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    escalation_id: record?.escalation_id,
    validation_state,
    validator_version: "ESCALATION-CONTRACT-VALIDATOR-V1",
    checks: Object.freeze({
      identity_valid: !errors.some((error) => ["ESCALATION_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "GOVERNANCE_SESSION_ID_MISSING", "IMMUTABLE_IDENTITY_MUTATION"].includes(error.reason)),
      trigger_valid: !errors.some((error) => ["TRIGGER_MISSING", "UNSUPPORTED_TRIGGER", "TRIGGER_HASH_MISMATCH"].includes(error.reason)),
      severity_valid: !errors.some((error) => ["INVALID_SEVERITY", "SEVERITY_SCORE_INVALID", "SEVERITY_REASON_MISSING"].includes(error.reason)),
      routing_valid: !errors.some((error) => ["ROUTING_TARGET_MISSING", "ROUTING_HASH_MISMATCH"].includes(error.reason)),
      evidence_valid: !errors.some((error) => error.reason === "EVIDENCE_INCOMPLETE"),
      governance_context_valid: !errors.some((error) => error.reason === "GOVERNANCE_CONTEXT_MISSING"),
      confidence_valid: !errors.some((error) => ["CONFIDENCE_INVALID", "CONFIDENCE_HASH_MISMATCH"].includes(error.reason)),
      lineage_valid: !errors.some((error) => error.reason === "LINEAGE_BROKEN"),
      replay_valid: !errors.some((error) => ["REPLAY_METADATA_MISSING", "REPLAY_HASH_MISMATCH", "ESCALATION_HASH_MISMATCH"].includes(error.reason)),
      ledger_valid: !errors.some((error) => ["TRUTH_LEDGER_MISSING", "INVALID_LEDGER_SEQUENCE"].includes(error.reason)),
      advisory_only_enforced: !errors.some((error) => ["ADVISORY_BOUNDARY_MISSING", "EXECUTION_AUTHORITY_DETECTED", "AUTHORITY_EXPANSION_DETECTED"].includes(error.reason)),
      tenant_isolated: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      state_valid: !errors.some((error) => error.reason === "INVALID_STATE"),
      hash_valid: !errors.some((error) => error.reason === "ESCALATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayEscalationContract(record: EscalationContractRecord): EscalationReplayResult {
  const reconstructed_hash = computeEscalationHash(record);
  const validation = validateEscalationContractRecord(record);
  const reproduced = reconstructed_hash === record.escalation_hash && validation.validation_state === "VALID";
  return Object.freeze({ replay_id: hashValue("escalation-contract-replay", { id: record.escalation_id, reconstructed_hash }), escalation_id: record.escalation_id, replay_state: reproduced ? "REPRODUCED" : record.replay_metadata ? "MISMATCH" : "INCOMPLETE", reconstructed_hash, expected_hash: record.escalation_hash, failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "ESCALATION_HASH_MISMATCH" });
}

export function transitionEscalationState(record: EscalationContractRecord, to_state: EscalationState): EscalationLifecycleTransitionResult {
  const allowed = TRANSITIONS[record.state]?.includes(to_state) ?? false;
  return Object.freeze({ from_state: record.state, to_state, allowed, reason: allowed ? "escalation lifecycle transition allowed" : `invalid escalation lifecycle transition: ${record.state} to ${to_state}` });
}

export function buildEscalationObservabilitySurface(record = buildEscalationContractRecord()): EscalationObservabilitySurface {
  const validation = validateEscalationContractRecord(record);
  const replay = replayEscalationContract(record);
  return Object.freeze({
    escalation_id: record.escalation_id,
    escalation_type: record.escalation_type,
    severity: record.severity_definition.severity,
    severity_score: record.severity_definition.severity_score,
    routing_target: record.routing_definition.routing_target,
    trigger_reason: record.trigger_definition.trigger_reason,
    evidence_basis: record.evidence_references.evidence_ids,
    governance_context: record.governance_context,
    confidence: Object.freeze({ score: record.confidence_metadata.confidence_score, level: record.confidence_metadata.confidence_level, reason: record.confidence_metadata.confidence_reason }),
    replay_state: replay.replay_state,
    ledger_reference: record.truth_ledger_reference,
    advisory_only_notice: "Escalations recommend governance attention only; they do not execute, mutate policy, approve requests, override operators, or expand authority.",
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function getEscalationContract() {
  const record = buildEscalationContractRecord();
  return Object.freeze({ doctrine: buildEscalationContractDoctrine(), record, observability: buildEscalationObservabilitySurface(record), validation: validateEscalationContractRecord(record), replay: replayEscalationContract(record) });
}
