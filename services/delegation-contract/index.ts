import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decideAutonomyAuthority } from "@/services/autonomy-authority";
import { decomposeObjective } from "@/services/objective-decomposition";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type {
  DelegationContract,
  DelegationContractFramework,
  DelegationContractScenario,
  DelegationDelegateType,
  DelegationFailureReason,
  DelegationLifecycleState,
  DelegationLifecycleTransition,
  DelegationObservabilitySurface,
  DelegationRegistry,
  DelegationRegistryAuditEntry,
  DelegationReplayResult,
  DelegationValidationFailure,
  DelegationValidationResult,
  DelegationVersionPolicy,
} from "@/types/delegation-contract";

type DelegationDraft = Omit<DelegationContract, "integrity_hash">;

const NOW = "2026-06-29T13:00:00.000Z";
const CONTRACT_VERSION = "delegation-contract/v8D.1" as const;
const SCHEMA_VERSION = "delegation-schema/v8D.1" as const;
const VALID_DELEGATE_TYPES: readonly DelegationDelegateType[] = Object.freeze(["OPERATOR", "INTERNAL_AGENT", "AUTONOMY_ENGINE", "EXTERNAL_SYSTEM", "DEFERRED", "BLOCKED"]);
const LIFECYCLE_STATES: readonly DelegationLifecycleState[] = Object.freeze(["CREATED", "VALIDATED", "AUTHORIZED", "READY", "DELEGATED", "EXECUTING", "COMPLETED", "BLOCKED", "REJECTED", "CANCELLED", "FAILED", "SUPERSEDED", "ARCHIVED"]);
const TERMINAL_STATES: readonly DelegationLifecycleState[] = Object.freeze(["BLOCKED", "REJECTED", "CANCELLED", "FAILED", "SUPERSEDED", "ARCHIVED", "COMPLETED"]);
const ALLOWED_TRANSITIONS: Readonly<Record<DelegationLifecycleState, readonly DelegationLifecycleState[]>> = Object.freeze({
  CREATED: ["VALIDATED", "REJECTED", "BLOCKED"],
  VALIDATED: ["AUTHORIZED", "REJECTED", "BLOCKED"],
  AUTHORIZED: ["READY", "REJECTED", "BLOCKED"],
  READY: ["DELEGATED", "CANCELLED", "BLOCKED"],
  DELEGATED: ["EXECUTING", "CANCELLED", "FAILED", "SUPERSEDED"],
  EXECUTING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  BLOCKED: ["ARCHIVED"],
  REJECTED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  FAILED: ["ARCHIVED", "SUPERSEDED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
});

const REGISTERED_DELEGATES: Readonly<Record<DelegationDelegateType, readonly string[]>> = Object.freeze({
  OPERATOR: Object.freeze(["operator:mission-control", "operator:governance-review"]),
  INTERNAL_AGENT: Object.freeze(["agent:planner", "agent:orchestrator", "agent:scheduler"]),
  AUTONOMY_ENGINE: Object.freeze(["autonomy:planner", "autonomy:orchestrator", "autonomy:replay"]),
  EXTERNAL_SYSTEM: Object.freeze(["external:enterprise-api", "external:cloud-service"]),
  DEFERRED: Object.freeze(["deferred:dependency", "deferred:approval", "deferred:schedule"]),
  BLOCKED: Object.freeze(["blocked:governance", "blocked:authority", "blocked:integrity"]),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function failure(reason: DelegationFailureReason, field_path: string, message: string): DelegationValidationFailure {
  return Object.freeze({
    failure_id: id("DCF", "delegation-contract-failure", { reason, field_path, message }),
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

function transitionHashSource(transition: Omit<DelegationLifecycleTransition, "transition_hash"> | DelegationLifecycleTransition) {
  return {
    transition_id: transition.transition_id,
    from_state: transition.from_state,
    to_state: transition.to_state,
    timestamp: transition.timestamp,
    authority_reference: transition.authority_reference,
    evidence_reference: transition.evidence_reference,
    replay_reference: transition.replay_reference,
  };
}

function transitionHash(transition: Omit<DelegationLifecycleTransition, "transition_hash"> | DelegationLifecycleTransition): string {
  return hashValue("delegation-lifecycle-transition", transitionHashSource(transition));
}

function contractHashSource(contract: DelegationDraft | DelegationContract) {
  return {
    identity: contract.identity,
    target: contract.target,
    authority: contract.authority,
    metadata: contract.metadata,
    lifecycle: contract.lifecycle,
    versioning: contract.versioning,
    governance: contract.governance,
  };
}

export function computeDelegationIntegrityHash(contract: DelegationDraft | DelegationContract): string {
  return hashValue("delegation-contract-integrity", contractHashSource(contract));
}

export function generateDelegationIdentity(input: {
  tenant_id: string;
  mission_id: string;
  task_id: string;
  execution_plan_id: string;
  delegate_type: DelegationDelegateType;
}) {
  const source = {
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    task_id: input.task_id,
    execution_plan_id: input.execution_plan_id,
    delegate_type: input.delegate_type,
  };
  return Object.freeze({
    delegation_id: id("DEL", "delegation-id", source),
    lineage_reference: `lineage:${id("DLL", "delegation-lineage-id", source)}`,
    replay_reference: `replay:${id("DLR", "delegation-replay-id", source)}`,
  });
}

function delegateFor(scenario: DelegationContractScenario): { type: DelegationDelegateType; id: string; role: string } {
  if (scenario === "UNSUPPORTED_TARGET") return { type: "UNKNOWN" as DelegationDelegateType, id: "delegate:unknown", role: "unsupported" };
  if (scenario === "UNKNOWN_DELEGATE") return { type: "INTERNAL_AGENT", id: "agent:unknown", role: "uncataloged task handler" };
  if (scenario === "SUSPENDED_DELEGATE") return { type: "INTERNAL_AGENT", id: "agent:scheduler", role: "suspended scheduler" };
  if (scenario === "UNCERTIFIED_DELEGATE") return { type: "INTERNAL_AGENT", id: "agent:planner", role: "uncertified planner" };
  if (scenario === "MISSING_OPERATOR_APPROVAL") return { type: "OPERATOR", id: "operator:governance-review", role: "governance reviewer" };
  if (scenario === "GOVERNANCE_BYPASS" || scenario === "CONSTITUTIONAL_VIOLATION" || scenario === "POLICY_VIOLATION") return { type: "BLOCKED", id: "blocked:governance", role: "blocked delegation" };
  return { type: "AUTONOMY_ENGINE", id: "autonomy:orchestrator", role: "deterministic orchestration coordinator" };
}

function buildTransitions(delegation_id: string, authorityReference: string, replayReference: string, scenario: DelegationContractScenario): readonly DelegationLifecycleTransition[] {
  const pairs: readonly [DelegationLifecycleState, DelegationLifecycleState][] = scenario === "INVALID_TRANSITION"
    ? [["CREATED", "DELEGATED"]]
    : [["CREATED", "VALIDATED"], ["VALIDATED", "AUTHORIZED"], ["AUTHORIZED", "READY"]];
  return freezeArray(pairs.map(([from_state, to_state], index) => {
    const source = {
      transition_id: id("DCT", "delegation-transition-id", { delegation_id, from_state, to_state, index, scenario }),
      from_state,
      to_state,
      timestamp: NOW,
      authority_reference: authorityReference,
      evidence_reference: `evidence:${delegation_id}:${index + 1}`,
      replay_reference: replayReference,
    };
    return Object.freeze({ ...source, transition_hash: transitionHash(source) });
  }));
}

function terminalFor(state: DelegationLifecycleState): boolean {
  return TERMINAL_STATES.includes(state);
}

export function buildDelegationContract(input: {
  scenario?: DelegationContractScenario;
  identity?: AutonomyIdentityRecord;
  parent_contract?: DelegationContract;
  lifecycle_state?: DelegationLifecycleState;
} = {}): DelegationContract {
  const scenario = input.scenario ?? "BASELINE";
  const identity = input.identity ?? generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const task = hierarchy.tasks[0];
  const authorityDecision = decideAutonomyAuthority(identity);
  const delegate = delegateFor(scenario);
  const task_id = scenario === "MISSING_TASK" ? "" : task.task_id;
  const execution_plan_id = scenario === "INVALID_PLAN" ? "" : hierarchy.objective_id;
  const generated = generateDelegationIdentity({
    tenant_id: identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    task_id,
    execution_plan_id,
    delegate_type: delegate.type,
  });
  const delegation_id = scenario === "DUPLICATE_ID" && input.parent_contract ? input.parent_contract.identity.delegation_id : generated.delegation_id;
  const authorityReference = scenario === "MISSING_AUTHORITY" ? "" : authorityDecision.decision.authority_decision_id;
  const replayReference = scenario === "REPLAY_CORRUPTION" ? "" : generated.replay_reference;
  const lineageReference = scenario === "LINEAGE_CORRUPTION" ? "" : generated.lineage_reference;
  const registered = REGISTERED_DELEGATES[delegate.type]?.includes(delegate.id) ?? false;
  const currentState = scenario === "INVALID_TRANSITION" ? "DELEGATED" : input.lifecycle_state ?? "READY";
  const base: DelegationDraft = {
    identity: Object.freeze({
      delegation_id,
      task_id,
      execution_plan_id,
      tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_beta" : identity.primary.tenant_id,
      mission_id: identity.primary.mission_id,
    }),
    target: Object.freeze({
      delegate_type: delegate.type,
      delegate_id: delegate.id,
      delegate_role: delegate.role,
      registered,
      certified: scenario !== "UNCERTIFIED_DELEGATE" && registered,
      authorized: scenario !== "MISSING_AUTHORITY" && scenario !== "PRIVILEGE_ESCALATION" && registered,
      suspended: scenario === "SUSPENDED_DELEGATE",
      routing_eligible: registered && scenario !== "SUSPENDED_DELEGATE" && scenario !== "UNCERTIFIED_DELEGATE",
    }),
    authority: Object.freeze({
      authority_level: scenario === "PRIVILEGE_ESCALATION" ? "RECOVER" : identity.primary.authority_scope,
      governing_policy: scenario === "POLICY_VIOLATION" || scenario === "MISSING_AUTHORITY" ? "" : identity.source_contract.governance.policy_set[0] ?? "runtime_policy_v7a",
      constitutional_reference: scenario === "CONSTITUTIONAL_VIOLATION" || scenario === "MISSING_AUTHORITY" ? "" : identity.source_contract.constitution.constitutional_profile,
      approval_required: delegate.type === "OPERATOR" || identity.primary.authority_scope === "ORCHESTRATE",
      approval_reference: scenario === "MISSING_OPERATOR_APPROVAL" ? null : `approval:${delegation_id}`,
      operator_override_allowed: false,
      operator_reference: scenario === "MISSING_OPERATOR_APPROVAL" ? "" : "operator:mission-control",
      governance_approved: scenario !== "GOVERNANCE_BYPASS",
      policy_approved: scenario !== "POLICY_VIOLATION",
      constitutional_approved: scenario !== "CONSTITUTIONAL_VIOLATION",
    }),
    metadata: Object.freeze({
      confidence: scenario === "INVALID_CONFIDENCE" ? 1.4 : 0.92,
      governance_score: scenario === "INVALID_GOVERNANCE_SCORE" ? -0.2 : 0.96,
      priority: scenario === "INVALID_PRIORITY" ? "UNKNOWN" as never : "HIGH",
      deadline: scenario === "INCOMPLETE_METADATA" ? "" : "deadline:phase-8d:deterministic",
      replay_reference: replayReference,
      lineage_reference: lineageReference,
      explanation: scenario === "INCOMPLETE_METADATA" ? "" : `Delegate task ${task_id} to ${delegate.id} under constitutional authority.`,
    }),
    lifecycle: Object.freeze({
      current_state: currentState,
      transition_history: buildTransitions(delegation_id, authorityReference, replayReference, scenario),
      terminal: terminalFor(currentState),
    }),
    versioning: Object.freeze({
      contract_version: scenario === "UNSUPPORTED_VERSION" ? "delegation-contract/v0" as typeof CONTRACT_VERSION : CONTRACT_VERSION,
      schema_version: scenario === "UNSUPPORTED_VERSION" ? "delegation-schema/v0" as typeof SCHEMA_VERSION : SCHEMA_VERSION,
      compatibility_version: "8D.x",
      migration_version: "migration-none",
    }),
    governance: Object.freeze({
      governance_reference: scenario === "GOVERNANCE_BYPASS" ? "" : identity.source_contract.governance.governance_profile,
      truth_ledger_reference: `truth-ledger:${delegation_id}`,
      certification_reference: `certification:${delegation_id}`,
      tenant_isolation_reference: `tenant-isolation:${identity.primary.tenant_id}`,
    }),
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-delegation-hash" : computeDelegationIntegrityHash(base) });
}

function validateTransitions(contract: DelegationContract, failures: DelegationValidationFailure[]) {
  for (const transition of contract.lifecycle.transition_history) {
    if (!ALLOWED_TRANSITIONS[transition.from_state]?.includes(transition.to_state)) {
      failures.push(failure("INVALID_LIFECYCLE_TRANSITION", "lifecycle.transition_history", `${transition.from_state} cannot transition to ${transition.to_state}`));
    }
    if (!transition.authority_reference || !transition.evidence_reference || !transition.replay_reference) {
      failures.push(failure("INVALID_LIFECYCLE_TRANSITION", "lifecycle.transition_history", "transition requires authority, evidence, and replay references"));
    }
    if (transitionHash(transition) !== transition.transition_hash) {
      failures.push(failure("INTEGRITY_HASH_MISMATCH", "lifecycle.transition_history.transition_hash", "transition hash mismatch"));
    }
  }
  const finalState = contract.lifecycle.transition_history.at(-1)?.to_state ?? "CREATED";
  if (contract.lifecycle.current_state !== finalState && !terminalFor(contract.lifecycle.current_state)) {
    failures.push(failure("INVALID_LIFECYCLE_TRANSITION", "lifecycle.current_state", "current state does not match deterministic transition history"));
  }
}

export function validateDelegationContract(contract?: DelegationContract, context: { registry?: readonly DelegationContract[]; original_contract?: DelegationContract; identity?: AutonomyIdentityRecord } = {}): DelegationValidationResult {
  if (!contract) {
    const failures = freezeArray([failure("ORPHAN_DELEGATION", "contract", "delegation contract is required")]);
    return Object.freeze({
      validation_id: id("DCV", "delegation-validation", failures),
      delegation_id: null,
      validation_state: "FAIL",
      failures,
      identity_valid: false,
      target_valid: false,
      authority_valid: false,
      metadata_valid: false,
      lifecycle_valid: false,
      tenant_isolated: false,
      replay_ready: false,
      lineage_complete: false,
      integrity_verified: false,
      ready_for_task_classification: false,
      validation_hash: hashValue("delegation-validation", failures),
    });
  }
  const failures: DelegationValidationFailure[] = [];
  if (!contract.identity.delegation_id) failures.push(failure("ORPHAN_DELEGATION", "identity.delegation_id", "delegation_id is required"));
  if (!contract.identity.task_id) failures.push(failure("MISSING_TASK_ID", "identity.task_id", "task_id is required"));
  if (!contract.identity.execution_plan_id) failures.push(failure("INVALID_EXECUTION_PLAN_REFERENCE", "identity.execution_plan_id", "execution_plan_id is required"));
  if (!VALID_DELEGATE_TYPES.includes(contract.target.delegate_type)) failures.push(failure("UNSUPPORTED_DELEGATE_TYPE", "target.delegate_type", "delegate type is unsupported"));
  if (!contract.target.registered || !(REGISTERED_DELEGATES[contract.target.delegate_type]?.includes(contract.target.delegate_id) ?? false)) failures.push(failure("UNKNOWN_DELEGATE", "target.delegate_id", "delegate is not registered"));
  if (contract.target.suspended) failures.push(failure("SUSPENDED_DELEGATE", "target.suspended", "delegate is suspended"));
  if (!contract.target.certified && !["DEFERRED", "BLOCKED"].includes(contract.target.delegate_type)) failures.push(failure("UNCERTIFIED_DELEGATE", "target.certified", "delegate is not certified"));
  if (!contract.target.authorized && !["DEFERRED", "BLOCKED"].includes(contract.target.delegate_type)) failures.push(failure("MISSING_AUTHORITY", "target.authorized", "delegate is not authorized"));
  if (!contract.authority.governing_policy || !contract.authority.constitutional_reference) failures.push(failure("MISSING_AUTHORITY", "authority", "governing policy and constitutional reference are required"));
  if (!contract.governance.governance_reference || !contract.authority.governance_approved) failures.push(failure("GOVERNANCE_BYPASS", "governance.governance_reference", "governance approval is required"));
  if (!contract.authority.constitutional_approved) failures.push(failure("CONSTITUTIONAL_VIOLATION", "authority.constitutional_approved", "constitutional approval is required"));
  if (!contract.authority.policy_approved) failures.push(failure("POLICY_VIOLATION", "authority.policy_approved", "policy approval is required"));
  if (contract.authority.approval_required && (!contract.authority.approval_reference || !contract.authority.operator_reference)) failures.push(failure("OPERATOR_APPROVAL_MISSING", "authority.approval_reference", "operator approval is required"));
  if (contract.authority.authority_level === "RECOVER" && contract.target.delegate_type !== "BLOCKED") failures.push(failure("PRIVILEGE_ESCALATION", "authority.authority_level", "delegation cannot escalate to recovery authority"));
  if (contract.authority.operator_override_allowed) failures.push(failure("PRIVILEGE_ESCALATION", "authority.operator_override_allowed", "operator override must not grant implicit execution authority"));
  if (contract.identity.tenant_id !== (context.identity?.primary.tenant_id ?? "tenant_alpha")) failures.push(failure("TENANT_MISMATCH", "identity.tenant_id", "delegation tenant does not match source identity"));
  if (contract.metadata.confidence < 0 || contract.metadata.confidence > 1) failures.push(failure("INVALID_CONFIDENCE", "metadata.confidence", "confidence must be between 0 and 1"));
  if (contract.metadata.governance_score < 0 || contract.metadata.governance_score > 1) failures.push(failure("INVALID_GOVERNANCE_SCORE", "metadata.governance_score", "governance score must be between 0 and 1"));
  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(contract.metadata.priority)) failures.push(failure("INVALID_PRIORITY", "metadata.priority", "priority is unsupported"));
  if (!contract.metadata.deadline || !contract.metadata.explanation) failures.push(failure("INCOMPLETE_METADATA", "metadata", "deadline and explanation are required"));
  if (!contract.metadata.replay_reference) failures.push(failure("REPLAY_REFERENCE_CORRUPTION", "metadata.replay_reference", "replay reference is required"));
  if (!contract.metadata.lineage_reference) failures.push(failure("LINEAGE_CORRUPTION", "metadata.lineage_reference", "lineage reference is required"));
  if (contract.versioning.contract_version !== CONTRACT_VERSION || contract.versioning.schema_version !== SCHEMA_VERSION) failures.push(failure("UNSUPPORTED_SCHEMA_VERSION", "versioning", "delegation schema version is unsupported"));
  validateTransitions(contract, failures);
  if (computeDelegationIntegrityHash(contract) !== contract.integrity_hash) failures.push(failure("INTEGRITY_HASH_MISMATCH", "integrity_hash", "delegation integrity hash mismatch"));

  const registry = context.registry ?? [contract];
  if (registry.filter((item) => item.identity.delegation_id === contract.identity.delegation_id).length > 1) failures.push(failure("DUPLICATE_DELEGATION_ID", "identity.delegation_id", "delegation_id is duplicated"));
  const original = context.original_contract;
  if (original) {
    const protectedPairs: readonly [string, unknown, unknown][] = [
      ["identity.delegation_id", original.identity.delegation_id, contract.identity.delegation_id],
      ["identity.task_id", original.identity.task_id, contract.identity.task_id],
      ["identity.execution_plan_id", original.identity.execution_plan_id, contract.identity.execution_plan_id],
      ["identity.tenant_id", original.identity.tenant_id, contract.identity.tenant_id],
      ["metadata.replay_reference", original.metadata.replay_reference, contract.metadata.replay_reference],
    ];
    for (const [fieldPath, before, after] of protectedPairs) {
      if (before !== after) failures.push(failure("IMMUTABLE_FIELD_MUTATION", fieldPath, `${fieldPath} cannot be mutated`));
    }
  }
  const uniqueFailures = freezeArray([...new Map(failures.map((item) => [item.reason, item])).values()]);
  const has = (reason: DelegationFailureReason) => uniqueFailures.some((item) => item.reason === reason);
  const validation_state: "PASS" | "FAIL" = uniqueFailures.length ? "FAIL" : "PASS";
  const source = { delegation_id: contract.identity.delegation_id, validation_state, failures: uniqueFailures.map((item) => item.reason) };
  return Object.freeze({
    validation_id: id("DCV", "delegation-validation-id", source),
    delegation_id: contract.identity.delegation_id,
    validation_state,
    failures: uniqueFailures,
    identity_valid: !has("DUPLICATE_DELEGATION_ID") && !has("MISSING_TASK_ID") && !has("INVALID_EXECUTION_PLAN_REFERENCE") && !has("ORPHAN_DELEGATION"),
    target_valid: !has("UNSUPPORTED_DELEGATE_TYPE") && !has("UNKNOWN_DELEGATE") && !has("SUSPENDED_DELEGATE") && !has("UNCERTIFIED_DELEGATE"),
    authority_valid: !has("MISSING_AUTHORITY") && !has("GOVERNANCE_BYPASS") && !has("CONSTITUTIONAL_VIOLATION") && !has("PRIVILEGE_ESCALATION") && !has("POLICY_VIOLATION") && !has("OPERATOR_APPROVAL_MISSING"),
    metadata_valid: !has("INVALID_CONFIDENCE") && !has("INVALID_GOVERNANCE_SCORE") && !has("INVALID_PRIORITY") && !has("INCOMPLETE_METADATA"),
    lifecycle_valid: !has("INVALID_LIFECYCLE_TRANSITION"),
    tenant_isolated: !has("TENANT_MISMATCH"),
    replay_ready: !has("REPLAY_REFERENCE_CORRUPTION"),
    lineage_complete: !has("LINEAGE_CORRUPTION"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH") && !has("IMMUTABLE_FIELD_MUTATION"),
    ready_for_task_classification: validation_state === "PASS",
    validation_hash: hashValue("delegation-validation", source),
  });
}

export function replayDelegationContract(contract: DelegationContract): DelegationReplayResult {
  const validation = validateDelegationContract(contract);
  const source = {
    replay_id: id("DCR", "delegation-replay-id", contract.identity.delegation_id),
    delegation_id: contract.identity.delegation_id,
    reconstructed_identity: contract.identity,
    reconstructed_target: contract.target,
    reconstructed_state_order: freezeArray(["CREATED" as const, ...contract.lifecycle.transition_history.map((item) => item.to_state)]),
    replay_reference: contract.metadata.replay_reference,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0]?.reason ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("delegation-replay", source) });
}

function auditEntry(event_type: DelegationRegistryAuditEntry["event_type"], contract: DelegationContract, actor = "delegation-contract-registry"): DelegationRegistryAuditEntry {
  const source = { event_type, delegation_id: contract.identity.delegation_id, timestamp: NOW, actor };
  return Object.freeze({ audit_id: id("DCA", "delegation-registry-audit-id", source), ...source, audit_hash: hashValue("delegation-registry-audit", source) });
}

export function buildDelegationRegistry(delegations: readonly DelegationContract[] = [buildDelegationContract()]): DelegationRegistry {
  const audit: DelegationRegistryAuditEntry[] = [];
  const active: string[] = [];
  const terminal: string[] = [];
  for (const delegation of delegations) {
    const validation = validateDelegationContract(delegation, { registry: delegations });
    if (validation.validation_state === "PASS") {
      audit.push(auditEntry(terminalFor(delegation.lifecycle.current_state) ? "ARCHIVED" : "REGISTERED", delegation));
      if (terminalFor(delegation.lifecycle.current_state)) terminal.push(delegation.identity.delegation_id);
      else active.push(delegation.identity.delegation_id);
    } else {
      audit.push(auditEntry("VALIDATION_FAILED", delegation));
    }
  }
  const source = {
    registry_id: id("DCRG", "delegation-registry-id", delegations.map((item) => item.identity.delegation_id)),
    tenant_id: delegations[0]?.identity.tenant_id ?? "tenant_alpha",
    delegations: freezeArray(delegations),
    active_delegations: freezeArray(active),
    terminal_delegations: freezeArray(terminal),
    audit_trail: freezeArray(audit),
  };
  return Object.freeze({ ...source, registry_hash: hashValue("delegation-registry", source) });
}

export function getDelegationVersionPolicy(): DelegationVersionPolicy {
  return Object.freeze({
    current_contract_version: CONTRACT_VERSION,
    current_schema_version: SCHEMA_VERSION,
    supported_schema_versions: freezeArray([SCHEMA_VERSION]),
    deprecated_schema_versions: freezeArray([]),
    semantic_version: "8.1.0",
    backward_compatible_with: freezeArray([]),
    deterministic_compatibility_required: true,
    migration_guidance: freezeArray(["Create a new delegation identity for structural target or authority changes.", "Retain archived contracts in the delegation registry.", "Preserve replay and lineage references across compatible schema upgrades."]),
  });
}

export function buildDelegationObservabilitySurface(contract = buildDelegationContract(), registry: readonly DelegationContract[] = [contract]): DelegationObservabilitySurface {
  const validation = validateDelegationContract(contract, { registry });
  return Object.freeze({
    delegation_id: contract.identity.delegation_id,
    task_id: contract.identity.task_id,
    delegate_type: contract.target.delegate_type,
    delegate_id: contract.target.delegate_id,
    lifecycle_state: contract.lifecycle.current_state,
    validation_state: validation.validation_state,
    failure_reasons: freezeArray(validation.failures.map((item) => item.reason)),
    authority_level: contract.authority.authority_level,
    governance_reference: contract.governance.governance_reference,
    replay_reference: contract.metadata.replay_reference,
    lineage_reference: contract.metadata.lineage_reference,
    integrity_status: validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getDelegationContractFramework(): DelegationContractFramework {
  const contract = buildDelegationContract();
  const registry = buildDelegationRegistry([contract]);
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["immutable", "deterministic", "governance-controlled", "constitutional-first", "authority-validated", "replayable", "lineage-anchored", "tenant-isolated", "fail-closed", "schema-compatible"]),
      contract_version: CONTRACT_VERSION,
      lifecycle_states: freezeArray(LIFECYCLE_STATES),
      delegate_types: freezeArray(VALID_DELEGATE_TYPES),
      terminal_states: freezeArray(TERMINAL_STATES),
    }),
    contract,
    validation: validateDelegationContract(contract, { registry: registry.delegations }),
    replay: replayDelegationContract(contract),
    registry,
    version_policy: getDelegationVersionPolicy(),
    observability: buildDelegationObservabilitySurface(contract, registry.delegations),
  });
}
