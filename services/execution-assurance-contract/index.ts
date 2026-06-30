import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runDelegationCertificationGate } from "@/services/delegation-certification-gate";
import type { DelegationCertificationReport } from "@/types/delegation-certification-gate";
import type {
  ExecutionAssuranceContractFramework,
  ExecutionAssuranceFailureReason,
  ExecutionAssuranceObservabilitySurface,
  ExecutionAssuranceRecord,
  ExecutionAssuranceReplayResult,
  ExecutionAssuranceScenario,
  ExecutionAssuranceState,
  ExecutionAssuranceTransition,
  ExecutionAssuranceValidationResult,
  ExecutionAssuranceVersionPolicy,
  RuntimeAssuranceContract,
} from "@/types/execution-assurance-contract";

type AssuranceDraft = Omit<ExecutionAssuranceRecord, "integrity_hash">;

const NOW = "2026-06-29T18:00:00.000Z";
const ASSURANCE_VERSION = "execution-assurance-contract/v8E.1" as const;
const SCHEMA_VERSION = "execution-assurance-schema/v8E.1" as const;
const LIFECYCLE_STATES: readonly ExecutionAssuranceState[] = Object.freeze(["CREATED", "INITIALIZING", "VALIDATING", "ANALYZING", "ASSESSING", "HEALTHY", "MONITORING", "WARNING", "DEGRADED", "RECOVERY_RECOMMENDED", "ESCALATION_RECOMMENDED", "ROLLBACK_RECOMMENDED", "TERMINATION_RECOMMENDED", "COMPLETED", "FAILED"]);
const TERMINAL_STATES: readonly ExecutionAssuranceState[] = Object.freeze(["COMPLETED", "FAILED"]);
const ALLOWED_TRANSITIONS: Readonly<Record<ExecutionAssuranceState, readonly ExecutionAssuranceState[]>> = Object.freeze({
  CREATED: ["INITIALIZING", "FAILED"],
  INITIALIZING: ["VALIDATING", "FAILED"],
  VALIDATING: ["ANALYZING", "FAILED"],
  ANALYZING: ["ASSESSING", "FAILED"],
  ASSESSING: ["HEALTHY", "WARNING", "DEGRADED", "FAILED"],
  HEALTHY: ["MONITORING", "WARNING", "DEGRADED", "COMPLETED"],
  MONITORING: ["HEALTHY", "WARNING", "DEGRADED", "COMPLETED", "FAILED"],
  WARNING: ["MONITORING", "DEGRADED", "ESCALATION_RECOMMENDED", "COMPLETED"],
  DEGRADED: ["RECOVERY_RECOMMENDED", "ESCALATION_RECOMMENDED", "ROLLBACK_RECOMMENDED", "TERMINATION_RECOMMENDED", "FAILED"],
  RECOVERY_RECOMMENDED: ["MONITORING", "ESCALATION_RECOMMENDED", "FAILED"],
  ESCALATION_RECOMMENDED: ["MONITORING", "ROLLBACK_RECOMMENDED", "TERMINATION_RECOMMENDED"],
  ROLLBACK_RECOMMENDED: ["MONITORING", "TERMINATION_RECOMMENDED", "FAILED"],
  TERMINATION_RECOMMENDED: ["FAILED", "COMPLETED"],
  COMPLETED: [],
  FAILED: [],
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

function transitionHashSource(transition: Omit<ExecutionAssuranceTransition, "transition_hash"> | ExecutionAssuranceTransition) {
  return {
    transition_id: transition.transition_id,
    from_state: transition.from_state,
    to_state: transition.to_state,
    timestamp: transition.timestamp,
    evidence_reference: transition.evidence_reference,
    replay_reference: transition.replay_reference,
  };
}

function computeTransitionHash(transition: Omit<ExecutionAssuranceTransition, "transition_hash"> | ExecutionAssuranceTransition): string {
  return hashValue("execution-assurance-transition", transitionHashSource(transition));
}

function recordHashSource(record: AssuranceDraft | ExecutionAssuranceRecord) {
  return {
    assurance_id: record.assurance_id,
    assurance_version: record.assurance_version,
    schema_version: record.schema_version,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    execution_id: record.execution_id,
    workflow_id: record.workflow_id,
    assurance_type: record.assurance_type,
    assurance_scope: record.assurance_scope,
    execution_state: record.execution_state,
    assurance_state: record.assurance_state,
    runtime_health: record.runtime_health,
    governance_health: record.governance_health,
    integrity_health: record.integrity_health,
    confidence_level: record.confidence_level,
    confidence_score: record.confidence_score,
    risk_level: record.risk_level,
    risk_score: record.risk_score,
    governance_score: record.governance_score,
    integrity_score: record.integrity_score,
    recommended_action: record.recommended_action,
    constitutional_status: record.constitutional_status,
    policy_status: record.policy_status,
    authority_status: record.authority_status,
    operator_required: record.operator_required,
    validation_results: record.validation_results,
    detected_issues: record.detected_issues,
    recommendations: record.recommendations,
    recovery_options: record.recovery_options,
    checkpoint_reference: record.checkpoint_reference,
    parent_assurance_id: record.parent_assurance_id,
    lineage_reference: record.lineage_reference,
    replay_reference: record.replay_reference,
    evidence_reference: record.evidence_reference,
    runtime_contract: record.runtime_contract,
    lifecycle: record.lifecycle,
    governance_metadata: record.governance_metadata,
    replay_metadata: record.replay_metadata,
    lineage_metadata: record.lineage_metadata,
    integrity_metadata: record.integrity_metadata,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function computeExecutionAssuranceIntegrityHash(record: AssuranceDraft | ExecutionAssuranceRecord): string {
  return hashValue("execution-assurance-record", recordHashSource(record));
}

function buildTransitions(assuranceId: string, evidence: string, replay: string, scenario: ExecutionAssuranceScenario): readonly ExecutionAssuranceTransition[] {
  const pairs: readonly [ExecutionAssuranceState, ExecutionAssuranceState][] = scenario === "INVALID_TRANSITION"
    ? [["CREATED", "HEALTHY"]]
    : [["CREATED", "INITIALIZING"], ["INITIALIZING", "VALIDATING"], ["VALIDATING", "ANALYZING"], ["ANALYZING", "ASSESSING"], ["ASSESSING", "HEALTHY"], ["HEALTHY", "MONITORING"]];
  return freezeArray(pairs.map(([from_state, to_state], index) => {
    const source = {
      transition_id: id("EAT", "execution-assurance-transition-id", { assuranceId, from_state, to_state, index }),
      from_state,
      to_state,
      timestamp: NOW,
      evidence_reference: evidence,
      replay_reference: replay,
    };
    return Object.freeze({ ...source, transition_hash: computeTransitionHash(source) });
  }));
}

function runtimeContract(scenario: ExecutionAssuranceScenario): RuntimeAssuranceContract {
  return Object.freeze({
    runtime_inputs: freezeArray(["execution status", "workflow progress", "delegation state", "governance status", "policy state", "authority status", "checkpoint status", "replay status", "integrity status", "confidence estimates", "risk assessments", "operator actions"]),
    runtime_outputs: freezeArray(["execution health", "confidence score", "risk score", "governance score", "integrity score", "recommended action", "evidence", "lineage", "replay metadata"]),
    guarantees: freezeArray(["deterministic evaluation", "immutable evidence", "reproducible recommendations", "governance validation", "constitutional validation", "authority validation", "replay reconstruction"]),
    restrictions: freezeArray(["never execute workflows", "never modify execution", "never bypass governance", "never bypass authority", "never modify policy", "never modify constitutional rules", "never alter historical evidence", "never conceal evaluation results"]),
    advisory_only: scenario !== "NOT_ADVISORY",
    execution_modified: scenario === "NOT_ADVISORY",
    policy_modified: false,
    constitutional_rules_modified: false,
  });
}

function defaultCertification() {
  return runDelegationCertificationGate();
}

export function buildExecutionAssuranceRecord(input: { scenario?: ExecutionAssuranceScenario; certification?: DelegationCertificationReport; parent_assurance?: ExecutionAssuranceRecord } = {}): ExecutionAssuranceRecord {
  const scenario = input.scenario ?? "BASELINE";
  const certification = input.certification ?? defaultCertification();
  const routing = certification.source_routing_package;
  const classification = routing.source_authority_validation.source_classification.classification;
  const tenant_id = scenario === "TENANT_MISMATCH" ? "tenant_beta" : classification.tenant_id;
  const mission_id = scenario === "MISSION_MISMATCH" ? "mission_external" : classification.mission_id;
  const execution_id = scenario === "MISSING_REQUIRED_FIELD" ? "" : `execution:${classification.delegation_id}`;
  const workflow_id = `workflow:${routing.routing_decision.routing_id}`;
  const assuranceSource = { tenant_id, mission_id, execution_id, workflow_id, parent: input.parent_assurance?.assurance_id ?? null };
  const assurance_id = scenario === "DUPLICATE_ID" && input.parent_assurance ? input.parent_assurance.assurance_id : id("EA", "execution-assurance-id", assuranceSource);
  const replayReference = scenario === "REPLAY_MISSING" ? "" : `replay:${assurance_id}`;
  const lineageReference = scenario === "LINEAGE_BROKEN" ? "" : `lineage:${input.parent_assurance?.assurance_id ?? assurance_id}`;
  const evidenceReference = scenario === "EVIDENCE_MISSING" ? "" : certification.certification_evidence.evidence_hash;
  const contract = runtimeContract(scenario);
  const transitions = buildTransitions(assurance_id, evidenceReference, replayReference, scenario);
  const health = scenario === "RUNTIME_INVALID" ? "CRITICAL" : "HEALTHY";
  const base: AssuranceDraft = {
    assurance_id,
    assurance_version: scenario === "UNSUPPORTED_VERSION" ? "execution-assurance-contract/v0" as typeof ASSURANCE_VERSION : ASSURANCE_VERSION,
    schema_version: scenario === "UNSUPPORTED_VERSION" ? "execution-assurance-schema/v0" as typeof SCHEMA_VERSION : SCHEMA_VERSION,
    tenant_id,
    mission_id,
    execution_id,
    workflow_id,
    assurance_type: "COMPOSITE",
    assurance_scope: "EXECUTION",
    execution_state: scenario === "RUNTIME_INVALID" ? "FAILED" : "RUNNING",
    assurance_state: scenario === "INVALID_TRANSITION" ? "HEALTHY" : "MONITORING",
    runtime_health: health,
    governance_health: scenario === "GOVERNANCE_INVALID" ? "CRITICAL" : "HEALTHY",
    integrity_health: scenario === "HASH_MISMATCH" ? "CRITICAL" : "HEALTHY",
    confidence_level: scenario === "RUNTIME_INVALID" ? "LOW" : "HIGH",
    confidence_score: scenario === "RUNTIME_INVALID" ? 0.52 : 0.94,
    risk_level: scenario === "RUNTIME_INVALID" ? "CRITICAL" : "LOW",
    risk_score: scenario === "RUNTIME_INVALID" ? 0.91 : 0.18,
    governance_score: scenario === "GOVERNANCE_INVALID" ? 0.25 : 0.96,
    integrity_score: scenario === "HASH_MISMATCH" ? 0.2 : 0.98,
    recommended_action: scenario === "RUNTIME_INVALID" ? "RECOMMEND_ESCALATION" : "CONTINUE_MONITORING",
    constitutional_status: scenario === "CONSTITUTIONAL_VIOLATION" ? "VIOLATION" : "COMPLIANT",
    policy_status: scenario === "GOVERNANCE_INVALID" ? "INVALID" : "VALID",
    authority_status: scenario === "AUTHORITY_INVALID" ? "INVALID" : "VALID",
    operator_required: routing.contingency_plan.operator_takeover.takeover_required,
    validation_results: freezeArray([certification.certification_result.result_hash, routing.validation.validation_hash]),
    detected_issues: scenario === "RUNTIME_INVALID" ? freezeArray(["runtime input invalid"]) : freezeArray<string>([]),
    recommendations: freezeArray([scenario === "RUNTIME_INVALID" ? "Escalate to operator review." : "Continue governed monitoring."]),
    recovery_options: freezeArray(["recommend recovery", "recommend rollback", "recommend escalation"]),
    checkpoint_reference: routing.contingency_plan.rollback_path.protected_checkpoints[0] ?? null,
    parent_assurance_id: input.parent_assurance?.assurance_id ?? null,
    lineage_reference: lineageReference,
    replay_reference: replayReference,
    evidence_reference: evidenceReference,
    runtime_contract: contract,
    lifecycle: Object.freeze({ transitions, terminal: TERMINAL_STATES.includes(scenario === "INVALID_TRANSITION" ? "HEALTHY" : "MONITORING") }),
    governance_metadata: Object.freeze({
      constitution_version: "constitution/v8",
      governance_version: scenario === "GOVERNANCE_INVALID" ? "" : "governance/v7",
      policy_version: scenario === "GOVERNANCE_INVALID" ? "" : "policy/v8E",
      authority_scope: routing.delegation_plan.delegate_type,
      approval_reference: routing.source_authority_validation.validation.evidence.operator_approvals[0] ?? "approval:not-required",
      operator_reference: "operator:mission-control",
      compliance_status: scenario === "GOVERNANCE_INVALID" || scenario === "CONSTITUTIONAL_VIOLATION" || scenario === "AUTHORITY_INVALID" ? "NON_COMPLIANT" : "COMPLIANT",
    }),
    replay_metadata: Object.freeze({
      replay_reference: replayReference,
      snapshot_reference: scenario === "REPLAY_MISSING" ? "" : `snapshot:${assurance_id}`,
      timeline_reference: scenario === "REPLAY_MISSING" ? "" : `timeline:${assurance_id}`,
      decision_reference: scenario === "REPLAY_MISSING" ? "" : certification.certification_result.result_hash,
      checkpoint_reference: routing.contingency_plan.rollback_path.protected_checkpoints[0] ?? null,
    }),
    lineage_metadata: Object.freeze({
      parent_assurance: input.parent_assurance?.assurance_id ?? null,
      child_assurances: freezeArray<string>([]),
      execution_reference: execution_id,
      workflow_reference: workflow_id,
      delegation_reference: classification.delegation_id,
    }),
    integrity_metadata: Object.freeze({
      schema_hash: hashValue("execution-assurance-schema", SCHEMA_VERSION),
      state_hash: hashValue("execution-assurance-state", transitions.map((transition) => transition.transition_hash)),
      evidence_hash: hashValue("execution-assurance-evidence", evidenceReference),
      lineage_hash: hashValue("execution-assurance-lineage", { lineageReference, parent: input.parent_assurance?.assurance_id ?? null }),
    }),
    created_at: NOW,
    updated_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-assurance-hash" : computeExecutionAssuranceIntegrityHash(base) });
}

function validateTransitions(record: ExecutionAssuranceRecord, failures: ExecutionAssuranceFailureReason[]) {
  for (const transition of record.lifecycle.transitions) {
    if (!ALLOWED_TRANSITIONS[transition.from_state].includes(transition.to_state)) failures.push("INVALID_STATE_TRANSITION");
    if (!transition.evidence_reference || !transition.replay_reference) failures.push("INVALID_STATE_TRANSITION");
    if (computeTransitionHash(transition) !== transition.transition_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  }
  const last = record.lifecycle.transitions.at(-1)?.to_state ?? "CREATED";
  if (record.assurance_state !== last && !TERMINAL_STATES.includes(record.assurance_state)) failures.push("INVALID_STATE_TRANSITION");
}

export function validateExecutionAssuranceRecord(record?: ExecutionAssuranceRecord, context: { registry?: readonly ExecutionAssuranceRecord[]; original_record?: ExecutionAssuranceRecord } = {}): ExecutionAssuranceValidationResult {
  if (!record) {
    const failures = freezeArray<ExecutionAssuranceFailureReason>(["REQUIRED_FIELD_MISSING"]);
    return Object.freeze({
      validation_id: id("EAV", "execution-assurance-validation-id", failures),
      assurance_id: null,
      validation_state: "FAIL",
      failures,
      identity_valid: false,
      schema_valid: false,
      governance_valid: false,
      runtime_valid: false,
      replay_ready: false,
      lineage_complete: false,
      integrity_verified: false,
      tenant_isolated: false,
      advisory_only: false,
      ready_for_runtime_assurance: false,
      validation_hash: hashValue("execution-assurance-validation", failures),
    });
  }
  const failures: ExecutionAssuranceFailureReason[] = [];
  const required = [record.assurance_id, record.tenant_id, record.mission_id, record.execution_id, record.assurance_state, record.confidence_level, record.integrity_hash, record.replay_reference, record.lineage_reference, record.evidence_reference];
  if (required.some((value) => !value)) failures.push("REQUIRED_FIELD_MISSING");
  if (record.assurance_version !== ASSURANCE_VERSION || record.schema_version !== SCHEMA_VERSION) failures.push("UNSUPPORTED_SCHEMA_VERSION");
  if (record.tenant_id !== "tenant_alpha") failures.push("TENANT_OWNERSHIP_INVALID");
  if (!record.mission_id.startsWith("mission_") || record.mission_id === "mission_external") failures.push("MISSION_OWNERSHIP_INVALID");
  if (record.constitutional_status !== "COMPLIANT") failures.push("CONSTITUTIONAL_VIOLATION");
  if (record.policy_status !== "VALID" || record.governance_health === "CRITICAL" || record.governance_metadata.compliance_status !== "COMPLIANT") failures.push("GOVERNANCE_INVALID");
  if (record.authority_status !== "VALID") failures.push("AUTHORITY_INVALID");
  if (record.execution_state === "FAILED" && record.runtime_health === "HEALTHY") failures.push("RUNTIME_INPUT_INVALID");
  if (record.runtime_health === "CRITICAL") failures.push("RUNTIME_INPUT_INVALID");
  if (!record.replay_metadata.replay_reference || !record.replay_metadata.snapshot_reference || !record.replay_metadata.timeline_reference || !record.replay_metadata.decision_reference) failures.push("REPLAY_METADATA_INCOMPLETE");
  if (!record.lineage_reference || !record.lineage_metadata.execution_reference || !record.lineage_metadata.workflow_reference || !record.lineage_metadata.delegation_reference) failures.push("LINEAGE_INCOMPLETE");
  if (!record.evidence_reference || !record.integrity_metadata.evidence_hash) failures.push("EVIDENCE_INCOMPLETE");
  if (!record.runtime_contract.advisory_only || record.runtime_contract.execution_modified || record.runtime_contract.policy_modified || record.runtime_contract.constitutional_rules_modified) failures.push("ASSURANCE_NOT_ADVISORY");
  validateTransitions(record, failures);
  if (computeExecutionAssuranceIntegrityHash(record) !== record.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const registry = context.registry ?? [record];
  if (registry.filter((item) => item.assurance_id === record.assurance_id).length > 1) failures.push("DUPLICATE_ASSURANCE_ID");
  const original = context.original_record;
  if (original) {
    const protectedPairs: readonly [unknown, unknown][] = [
      [original.assurance_id, record.assurance_id],
      [original.tenant_id, record.tenant_id],
      [original.mission_id, record.mission_id],
      [original.execution_id, record.execution_id],
      [original.workflow_id, record.workflow_id],
      [original.created_at, record.created_at],
    ];
    if (protectedPairs.some(([before, after]) => before !== after)) failures.push("IMMUTABLE_FIELD_MUTATION");
  }
  const uniqueFailures = unique(failures);
  const has = (reason: ExecutionAssuranceFailureReason) => uniqueFailures.includes(reason);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { assurance_id: record.assurance_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("EAV", "execution-assurance-validation-id", source),
    assurance_id: record.assurance_id,
    validation_state,
    failures: uniqueFailures,
    identity_valid: !has("REQUIRED_FIELD_MISSING") && !has("DUPLICATE_ASSURANCE_ID") && !has("IMMUTABLE_FIELD_MUTATION"),
    schema_valid: !has("UNSUPPORTED_SCHEMA_VERSION") && !has("REQUIRED_FIELD_MISSING"),
    governance_valid: !has("GOVERNANCE_INVALID") && !has("CONSTITUTIONAL_VIOLATION") && !has("AUTHORITY_INVALID"),
    runtime_valid: !has("RUNTIME_INPUT_INVALID") && !has("INVALID_STATE_TRANSITION"),
    replay_ready: !has("REPLAY_METADATA_INCOMPLETE"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("EVIDENCE_INCOMPLETE"),
    tenant_isolated: !has("TENANT_OWNERSHIP_INVALID") && !has("MISSION_OWNERSHIP_INVALID"),
    advisory_only: !has("ASSURANCE_NOT_ADVISORY"),
    ready_for_runtime_assurance: validation_state === "PASS",
    validation_hash: hashValue("execution-assurance-validation", source),
  });
}

export function replayExecutionAssuranceRecord(record: ExecutionAssuranceRecord): ExecutionAssuranceReplayResult {
  const validation = validateExecutionAssuranceRecord(record);
  const source = {
    replay_id: id("EAR", "execution-assurance-replay-id", record.assurance_id),
    assurance_id: record.assurance_id,
    reconstructed_state_order: freezeArray(["CREATED" as const, ...record.lifecycle.transitions.map((transition) => transition.to_state)]),
    reconstructed_recommended_action: record.recommended_action,
    reconstructed_health: record.runtime_health,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("execution-assurance-replay", source) });
}

export function getExecutionAssuranceVersionPolicy(): ExecutionAssuranceVersionPolicy {
  return Object.freeze({
    current_assurance_version: ASSURANCE_VERSION,
    current_schema_version: SCHEMA_VERSION,
    supported_schema_versions: freezeArray([SCHEMA_VERSION]),
    deprecated_schema_versions: freezeArray([]),
    semantic_version: "8.1.0",
    deterministic_compatibility_required: true,
    migration_guidance: freezeArray(["Create a new assurance identity for structural schema changes.", "Preserve replay, lineage, and evidence references across compatible upgrades.", "Never migrate by mutating historical assurance evidence."]),
  });
}

export function buildExecutionAssuranceObservabilitySurface(record = buildExecutionAssuranceRecord()): ExecutionAssuranceObservabilitySurface {
  const validation = validateExecutionAssuranceRecord(record);
  return Object.freeze({
    assurance_id: record.assurance_id,
    execution_id: record.execution_id,
    workflow_id: record.workflow_id,
    assurance_state: record.assurance_state,
    runtime_health: record.runtime_health,
    confidence_level: record.confidence_level,
    risk_level: record.risk_level,
    recommended_action: record.recommended_action,
    validation_state: validation.validation_state,
    failure_reasons: validation.failures,
    replay_reference: record.replay_reference,
    lineage_reference: record.lineage_reference,
    integrity_status: validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getExecutionAssuranceContractFramework(): ExecutionAssuranceContractFramework {
  const assurance_record = buildExecutionAssuranceRecord();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "explainable", "replayable", "constitutionally-compliant", "governance-aware", "authority-constrained", "tenant-isolated", "observable", "cryptographically-verifiable", "advisory-only"]),
      assurance_version: ASSURANCE_VERSION,
      lifecycle_states: freezeArray(LIFECYCLE_STATES),
      terminal_states: freezeArray(TERMINAL_STATES),
    }),
    assurance_record,
    validation: validateExecutionAssuranceRecord(assurance_record),
    replay: replayExecutionAssuranceRecord(assurance_record),
    version_policy: getExecutionAssuranceVersionPolicy(),
    observability: buildExecutionAssuranceObservabilitySurface(assurance_record),
  });
}
