import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AgentIdentityLifecycleBundle,
  AgentIdentityLifecycleFailure,
  AgentIdentityLifecycleInput,
  AgentIdentityLifecycleResult,
  AgentIdentityLifecycleScenario,
  AgentIdentityLifecycleValidation,
  AgentLifecycleCertificationOutcome,
  AgentLifecycleEvidenceEntry,
  AgentLifecycleState,
} from "@/types/caf-agent-identity-lifecycle";

const VERSION = "caf-agent-identity-lifecycle/v3.1" as const;
const IDENTIFIER = "CafAgentIdentityLifecycle" as const;
const STATES: readonly AgentLifecycleState[] = Object.freeze(["REGISTERED", "VALIDATED", "APPROVED", "READY", "ACTIVATED", "ACTIVE", "SUSPENDED", "RESUMING", "UPGRADING", "RETIRED", "ARCHIVED"]);
const TRANSITIONS = Object.freeze(["REGISTERED->VALIDATED", "VALIDATED->APPROVED", "APPROVED->READY", "READY->ACTIVATED", "ACTIVATED->ACTIVE", "ACTIVE->SUSPENDED", "SUSPENDED->RESUMING", "RESUMING->ACTIVE", "ACTIVE->UPGRADING", "UPGRADING->ACTIVE", "ACTIVE->RETIRED", "RETIRED->ARCHIVED"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: AgentIdentityLifecycleScenario): AgentIdentityLifecycleFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AgentIdentityLifecycleFailure[], failure: AgentIdentityLifecycleFailure): boolean { return failures.includes(failure); }
function certOutcome(failures: readonly AgentIdentityLifecycleFailure[]): AgentLifecycleCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(failures: readonly AgentIdentityLifecycleFailure[]): readonly AgentLifecycleEvidenceEntry[] {
  const missing = has(failures, "LIFECYCLE_EVIDENCE_MISSING");
  const events: readonly AgentLifecycleEvidenceEntry["event_type"][] = freezeArray(["IDENTITY_CREATED", "REGISTERED", "VALIDATED", "APPROVED", "ACTIVATED", "UPGRADED", "SUSPENDED", "RECOVERED", "RETIRED", "ARCHIVED"]);
  const states: readonly AgentLifecycleState[] = freezeArray(["REGISTERED", "REGISTERED", "VALIDATED", "APPROVED", "ACTIVATED", "UPGRADING", "SUSPENDED", "RESUMING", "RETIRED", "ARCHIVED"]);
  return freezeArray(events.filter((event) => !(missing && event === "APPROVED")).map((event_type, index) => nested({
    evidence_id: `P3.1-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    lifecycle_state: states[index],
    evidence_refs: missing && event_type === "ACTIVATED" ? freezeArray([]) : freezeArray([`evidence:p3.1:${event_type.toLowerCase()}`]),
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<AgentIdentityLifecycleResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    identity: result.identity.integrity_hash,
    registry: result.registry.integrity_hash,
    lifecycle_contract: result.lifecycle_contract.integrity_hash,
    activation: result.activation.integrity_hash,
    suspension_recovery: result.suspension_recovery.integrity_hash,
    retirement: result.retirement.integrity_hash,
    version_lineage: result.version_lineage.integrity_hash,
    lifecycle_evidence: result.lifecycle_evidence.map((entry) => entry.integrity_hash),
    observability: result.observability.integrity_hash,
    replay_validation: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<AgentIdentityLifecycleResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runAgentIdentityLifecycle(input: AgentIdentityLifecycleInput = {}): AgentIdentityLifecycleResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<AgentIdentityLifecycleFailure>(direct ? [direct] : []);
  const p30 = runCafConstitutionalFoundation();
  const p30Valid = validateCafConstitutionalFoundation(p30).valid && !has(scenarioFailures, "P3_0_CONSTITUTIONAL_BASELINE_INVALID");
  const failures = freezeArray<AgentIdentityLifecycleFailure>(p30Valid ? scenarioFailures : [...scenarioFailures, "P3_0_CONSTITUTIONAL_BASELINE_INVALID"]);
  const tenant_id = has(failures, "UNAUTHORIZED_TENANT") ? "tenant:unauthorized" : input.tenant_id ?? "tenant:caf-primary";

  const identity = nested({
    agent_id: has(failures, "IDENTITY_COLLISION") ? "caf.agent.duplicate" : "caf.agent.identity.lifecycle.guardian.v1",
    agent_namespace: "caf.agent.identity.lifecycle",
    agent_class: "GOVERNED_AGENT",
    agent_type: "LIFECYCLE_GUARDIAN",
    agent_owner: has(failures, "IDENTITY_COLLISION") ? "" : "owner:program-3-agent-lifecycle",
    agent_instance: "agent-instance:p3.1:guardian:001",
    agent_family: "caf.agent.identity",
    agent_generation: 1,
    agent_version: "1.0.0",
    agent_status: "ACTIVE" as const,
    tenant_id,
    deterministic_identity: !has(failures, "IDENTITY_COLLISION"),
    namespace_governed: !has(failures, "NAMESPACE_UNGOVERNED"),
    collision_free: !has(failures, "IDENTITY_COLLISION"),
    lineage_refs: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:p3.1:identity-root", "lineage:p3.1:version-1.0.0"]),
  });

  const registry = nested({
    registry_id: "P3.1-AGENT-REGISTRY-001",
    identity,
    metadata_refs: freezeArray(["metadata:p3.1:agent-guardian"]),
    capability_refs: freezeArray(["capability:p3.1:lifecycle-governance"]),
    dependency_refs: freezeArray(["P2.3", "P2.4", "P2.5", "P2.6", "P2.7", "P2.8", p30.constitution.constitution_id]),
    governance_state: failures.length ? "BLOCKED" as const : "GOVERNED" as const,
    lifecycle_state: identity.agent_status,
    immutable: !has(failures, "REGISTRY_MUTABLE"),
    replayable: !has(failures, "REGISTRY_MUTABLE"),
    discovery_enabled: true,
    lineage_traversal_supported: identity.lineage_refs.length > 0,
    history_refs: freezeArray(["history:p3.1:registered", "history:p3.1:activated"]),
  });

  const lifecycle_contract = nested({
    lifecycle_contract_id: "P3.1-LIFECYCLE-CONTRACT-001",
    states: STATES,
    legal_transitions: TRANSITIONS,
    attempted_transition: has(failures, "ILLEGAL_LIFECYCLE_TRANSITION") ? "RETIRED->ACTIVE" : "READY->ACTIVATED",
    transition_legal: !has(failures, "ILLEGAL_LIFECYCLE_TRANSITION"),
    approvals_skipped: has(failures, "ACTIVATION_WITHOUT_GOVERNANCE"),
    activation_governed: !has(failures, "ACTIVATION_WITHOUT_GOVERNANCE"),
    retired_reactivation_blocked: !has(failures, "ILLEGAL_LIFECYCLE_TRANSITION"),
    archived_immutable: true,
    deterministic: !has(failures, "ILLEGAL_LIFECYCLE_TRANSITION"),
  });

  const activation = nested({
    activation_id: "P3.1-ACTIVATION-001",
    identity_valid: identity.deterministic_identity && identity.collision_free,
    dependencies_satisfied: true,
    authority_approved: !has(failures, "ACTIVATION_WITHOUT_GOVERNANCE"),
    policies_satisfied: true,
    tenant_authorized: !has(failures, "UNAUTHORIZED_TENANT"),
    resources_ready: true,
    version_compatible: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
    evidence_complete: !has(failures, "LIFECYCLE_EVIDENCE_MISSING"),
    activation_authorized: !has(failures, "ACTIVATION_WITHOUT_GOVERNANCE") && !has(failures, "UNAUTHORIZED_TENANT") && !has(failures, "IDENTITY_COLLISION"),
    ledger_ref: "ledger:p3.1:activation",
  });

  const suspension_recovery = nested({
    suspension_id: "P3.1-SUSPENSION-001",
    suspension_causes: freezeArray(["operator request", "governance decision", "dependency failure", "policy violation", "security event", "platform maintenance", "tenant isolation", "resource exhaustion"]),
    suspension_deterministic: !has(failures, "SUSPENSION_NON_DETERMINISTIC"),
    recovery_id: "P3.1-RECOVERY-001",
    issue_resolved: true,
    policies_satisfied: true,
    dependencies_healthy: true,
    authority_approval: !has(failures, "RECOVERY_UNGOVERNED"),
    evidence_recorded: !has(failures, "LIFECYCLE_EVIDENCE_MISSING"),
    recovery_governed: !has(failures, "RECOVERY_UNGOVERNED"),
  });

  const retirement = nested({
    retirement_id: "P3.1-RETIREMENT-001",
    retirement_type: "SUPERSEDED" as const,
    activation_disabled: true,
    configuration_frozen: true,
    evidence_preserved: !has(failures, "RETIREMENT_DESTROYS_HISTORY"),
    lineage_preserved: !has(failures, "RETIREMENT_DESTROYS_HISTORY"),
    metadata_archived: true,
    replay_compatibility_maintained: !has(failures, "RETIREMENT_DESTROYS_HISTORY"),
    history_destroyed: has(failures, "RETIREMENT_DESTROYS_HISTORY"),
  });

  const version_lineage = nested({
    lineage_id: "P3.1-VERSION-LINEAGE-001",
    parent_version: "0.9.0",
    child_version: "1.0.0",
    upgrade_path: "0.9.0->1.0.0",
    compatibility: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? "INCOMPATIBLE" as const : "COMPATIBLE" as const,
    migration_ref: "migration:p3.1:0.9.0-to-1.0.0",
    supersession_ref: "supersession:p3.1:guardian-v1",
    rollback_targets: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["0.9.0"]),
    fork_refs: freezeArray(["fork:p3.1:lineage-preserved"]),
    immutable: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
    fully_traceable: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
  });

  const lifecycle_evidence = buildEvidence(failures);
  const observability = nested({
    observability_id: "P3.1-OBSERVABILITY-001",
    metrics: Object.freeze({
      registrations: 1,
      activations: activation.activation_authorized ? 1 : 0,
      active_agents: activation.activation_authorized ? 1 : 0,
      suspensions: 1,
      recoveries: suspension_recovery.recovery_governed ? 1 : 0,
      retirements: 1,
      upgrades: 1,
      failed_activations: activation.activation_authorized ? 0 : 1,
      policy_violations: 0,
      version_distribution: freezeArray(["1.0.0:1"]),
    }),
    dashboards: freezeArray(["Lifecycle Dashboard", "Registry Dashboard", "Version Dashboard", "Governance Dashboard", "Operational Health Dashboard"]),
    alerts: has(failures, "OBSERVABILITY_GAP") ? freezeArray(["activation failures"]) : freezeArray(["identity conflicts", "activation failures", "illegal transitions", "orphaned versions", "registry inconsistencies"]),
    complete_visibility: !has(failures, "OBSERVABILITY_GAP"),
  });

  const replay_validation = nested({
    replay_validation_id: "P3.1-REPLAY-VALIDATION-001",
    identity_reconstructed: identity.deterministic_identity,
    registry_reconstructed: registry.replayable,
    lifecycle_reconstructed: lifecycle_contract.deterministic,
    activation_reconstructed: activation.evidence_complete,
    suspension_recovery_reconstructed: suspension_recovery.suspension_deterministic && suspension_recovery.recovery_governed,
    retirement_reconstructed: retirement.replay_compatibility_maintained,
    version_lineage_reconstructed: version_lineage.fully_traceable,
    evidence_reconstructed: lifecycle_evidence.length === 10 && lifecycle_evidence.every((entry) => entry.immutable && entry.replayable && entry.evidence_refs.length > 0),
    deterministic: !has(failures, "REPLAY_RECONSTRUCTION_FAILED"),
  });

  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!identity.deterministic_identity || !identity.collision_free ? ["IDENTITY_COLLISION" as const] : []),
    ...(!identity.namespace_governed ? ["NAMESPACE_UNGOVERNED" as const] : []),
    ...(!registry.immutable || !registry.replayable ? ["REGISTRY_MUTABLE" as const] : []),
    ...(!lifecycle_contract.transition_legal || !lifecycle_contract.deterministic ? ["ILLEGAL_LIFECYCLE_TRANSITION" as const] : []),
    ...(!activation.activation_authorized && has(failures, "ACTIVATION_WITHOUT_GOVERNANCE") ? ["ACTIVATION_WITHOUT_GOVERNANCE" as const] : []),
    ...(!activation.tenant_authorized ? ["UNAUTHORIZED_TENANT" as const] : []),
    ...(!suspension_recovery.suspension_deterministic ? ["SUSPENSION_NON_DETERMINISTIC" as const] : []),
    ...(!suspension_recovery.recovery_governed ? ["RECOVERY_UNGOVERNED" as const] : []),
    ...(retirement.history_destroyed ? ["RETIREMENT_DESTROYS_HISTORY" as const] : []),
    ...(!version_lineage.fully_traceable ? ["VERSION_LINEAGE_INCOMPLETE" as const] : []),
    ...(!replay_validation.evidence_reconstructed ? ["LIFECYCLE_EVIDENCE_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_RECONSTRUCTION_FAILED" as const] : []),
    ...(!observability.complete_visibility ? ["OBSERVABILITY_GAP" as const] : []),
  ])]);

  const certification = nested({
    certification_id: "P3.1-CERTIFICATION-GATE-001",
    outcome: certOutcome(derivedFailures),
    certified: certOutcome(derivedFailures) === "PASS",
    deterministic_identities: identity.deterministic_identity,
    namespace_governance: identity.namespace_governed,
    uniqueness_validated: identity.collision_free,
    ownership_validated: Boolean(identity.agent_owner),
    legal_transitions_enforced: lifecycle_contract.transition_legal && !lifecycle_contract.approvals_skipped,
    activation_governed: activation.activation_authorized,
    suspension_governed: suspension_recovery.suspension_deterministic,
    retirement_governed: !retirement.history_destroyed && retirement.replay_compatibility_maintained,
    registry_integrity: registry.immutable && registry.replayable,
    lineage_complete: version_lineage.fully_traceable && identity.lineage_refs.length > 0,
    tenant_isolation_preserved: activation.tenant_authorized && identity.tenant_id !== "tenant:unauthorized",
    evidence_complete: replay_validation.evidence_reconstructed,
    replay_reproducible: replay_validation.deterministic,
    constitutional_compliance: p30Valid,
    failures: derivedFailures,
  });

  const base: Omit<AgentIdentityLifecycleResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    identity,
    registry,
    lifecycle_contract,
    activation,
    suspension_recovery,
    retirement,
    version_lineage,
    lifecycle_evidence,
    observability,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAgentIdentityLifecycle(result?: AgentIdentityLifecycleResult): AgentIdentityLifecycleValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, identity_valid: false, registry_valid: false, lifecycle_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const identity_valid = verifyHashedRecord(result.identity) && result.identity.deterministic_identity && result.identity.collision_free && result.identity.namespace_governed;
  const registry_valid = verifyHashedRecord(result.registry) && result.registry.immutable && result.registry.replayable && result.registry.identity.integrity_hash === result.identity.integrity_hash;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle_contract) && result.lifecycle_contract.transition_legal && result.lifecycle_contract.activation_governed && result.lifecycle_contract.deterministic;
  const evidence_valid = result.lifecycle_evidence.length === 10 && result.lifecycle_evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0);
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && identity_valid && registry_valid && lifecycle_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, identity_valid, registry_valid, lifecycle_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayAgentIdentityLifecycle(result = runAgentIdentityLifecycle()): boolean {
  const replayed = runAgentIdentityLifecycle();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAgentIdentityLifecycle(result).valid;
}

export function getAgentIdentityLifecycleBundle(): AgentIdentityLifecycleBundle {
  const result = runAgentIdentityLifecycle();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_constitutional_foundation: true,
      owns_identity_lifecycle_only: true,
      cci_identity_infrastructure_owner: "Program 2" as const,
      deterministic_identity_required: true,
      immutable_lineage_required: true,
      governed_lifecycle_required: true,
      replay_safe_reconstruction_required: true,
      multi_tenant_isolation_required: true,
    }),
    result,
    validation: validateAgentIdentityLifecycle(result),
  });
}

export const AgentIdentityLifecycleService = Object.freeze({
  run: runAgentIdentityLifecycle,
  validate: validateAgentIdentityLifecycle,
  replay: replayAgentIdentityLifecycle,
});
