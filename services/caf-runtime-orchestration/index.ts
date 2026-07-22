import { runCapabilityComposition, validateCapabilityComposition } from "@/services/caf-capability-composition";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  RuntimeEvidenceEntry,
  RuntimeLifecycleState,
  RuntimeOrchestrationBundle,
  RuntimeOrchestrationFailure,
  RuntimeOrchestrationInput,
  RuntimeOrchestrationResult,
  RuntimeOrchestrationScenario,
  RuntimeOrchestrationValidation,
  RuntimeCertificationOutcome,
  RuntimeScheduleMode,
} from "@/types/caf-runtime-orchestration";

const VERSION = "caf-runtime-orchestration/v3.3" as const;
const IDENTIFIER = "CafRuntimeOrchestration" as const;
const STATES: readonly RuntimeLifecycleState[] = Object.freeze(["REGISTERED", "INITIALIZING", "READY", "SCHEDULED", "EXECUTING", "WAITING", "COMPLETED", "FAILED", "SUSPENDED", "STOPPING", "TERMINATED", "RECOVERING", "RETIRED"]);
const MODES: readonly RuntimeScheduleMode[] = Object.freeze(["IMMEDIATE", "DELAYED", "SCHEDULED", "RECURRING", "EVENT_TRIGGERED", "DEPENDENCY_TRIGGERED"]);

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
function scenarioFailure(scenario: RuntimeOrchestrationScenario): RuntimeOrchestrationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly RuntimeOrchestrationFailure[], failure: RuntimeOrchestrationFailure): boolean { return failures.includes(failure); }
function certOutcome(failures: readonly RuntimeOrchestrationFailure[]): RuntimeCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(failures: readonly RuntimeOrchestrationFailure[]): readonly RuntimeEvidenceEntry[] {
  const missing = has(failures, "RUNTIME_EVIDENCE_MISSING");
  const events: readonly RuntimeEvidenceEntry["event_type"][] = freezeArray(["ACTIVATION", "SCHEDULING", "EXECUTION", "COORDINATION", "LIFECYCLE_TRANSITION", "FAILURE", "RETRY", "RECOVERY", "TERMINATION", "SHUTDOWN"]);
  return freezeArray(events.filter((event) => !(missing && event === "COORDINATION")).map((event_type, index) => nested({
    evidence_id: `P3.3-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    evidence_refs: missing && event_type === "RECOVERY" ? freezeArray([]) : freezeArray([`evidence:p3.3:${event_type.toLowerCase()}`]),
    lineage_ref: `lineage:p3.3:${event_type.toLowerCase()}`,
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<RuntimeOrchestrationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    orchestrator: result.orchestrator.integrity_hash,
    lifecycle_supervisor: result.lifecycle_supervisor.integrity_hash,
    scheduling: result.scheduling.integrity_hash,
    execution_coordination: result.execution_coordination.integrity_hash,
    runtime_state: result.runtime_state.integrity_hash,
    governance_adapter: result.governance_adapter.integrity_hash,
    contract_library: result.contract_library.integrity_hash,
    runtime_evidence: result.runtime_evidence.map((entry) => entry.integrity_hash),
    replay_validation: result.replay_validation.integrity_hash,
    observability: result.observability.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<RuntimeOrchestrationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runRuntimeOrchestration(input: RuntimeOrchestrationInput = {}): RuntimeOrchestrationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<RuntimeOrchestrationFailure>(direct ? [direct] : []);
  const p32 = runCapabilityComposition();
  const p32Valid = validateCapabilityComposition(p32).valid && !has(scenarioFailures, "P3_2_COMPOSITION_INVALID");
  const failures = freezeArray<RuntimeOrchestrationFailure>(p32Valid ? scenarioFailures : [...scenarioFailures, "P3_2_COMPOSITION_INVALID"]);
  const tenant_id = has(failures, "TENANT_ISOLATION_VIOLATION") ? "tenant:cross-boundary" : input.tenant_id ?? "tenant:caf-primary";

  const orchestrator = nested({
    orchestrator_id: "P3.3-RUNTIME-ORCHESTRATOR-001",
    active_agent_refs: freezeArray([p32.composition.agent_ref]),
    composition_refs: freezeArray([p32.composition.composition_id]),
    cci_runtime_ref: "program-2:cci-shared-runtime-services",
    owns_infrastructure: false as const,
    startup_governed: true,
    activation_governed: !has(failures, "RUNTIME_GOVERNANCE_BYPASS"),
    graceful_shutdown_supported: true,
    runtime_synchronization_enabled: true,
    all_execution_orchestrated: !has(failures, "UNORCHESTRATED_EXECUTION"),
    infrastructure_redefinition_marker: has(failures, "CCI_RUNTIME_INFRASTRUCTURE_REDEFINED") ? "attempted" : "none",
  });
  const lifecycle_supervisor = nested({
    supervisor_id: "P3.3-LIFECYCLE-SUPERVISOR-001",
    states: STATES,
    legal_transitions: freezeArray(["REGISTERED->INITIALIZING", "INITIALIZING->READY", "READY->SCHEDULED", "SCHEDULED->EXECUTING", "EXECUTING->WAITING", "WAITING->EXECUTING", "EXECUTING->COMPLETED", "EXECUTING->FAILED", "FAILED->RECOVERING", "RECOVERING->READY", "EXECUTING->STOPPING", "STOPPING->TERMINATED"]),
    attempted_transition: has(failures, "ILLEGAL_RUNTIME_TRANSITION") ? "RETIRED->EXECUTING" : "SCHEDULED->EXECUTING",
    transition_legal: !has(failures, "ILLEGAL_RUNTIME_TRANSITION"),
    health_supervision_enabled: !has(failures, "LIFECYCLE_SUPERVISION_GAP"),
    recovery_enabled: true,
    forced_termination_governed: !has(failures, "RUNTIME_GOVERNANCE_BYPASS"),
    supervision_complete: !has(failures, "LIFECYCLE_SUPERVISION_GAP"),
  });
  const scheduling = nested({
    schedule_id: "P3.3-SCHEDULING-ENGINE-001",
    supported_modes: MODES,
    execution_queue: freezeArray(["runtime-task:activation", "runtime-task:execute", "runtime-task:evidence"]),
    priority_order: has(failures, "SCHEDULING_NON_DETERMINISTIC") ? freezeArray(["runtime-task:evidence", "runtime-task:activation"]) : freezeArray(["runtime-task:activation", "runtime-task:execute", "runtime-task:evidence"]),
    concurrency_policy: "PARALLEL_WITH_BARRIERS" as const,
    execution_windows: freezeArray(["window:immediate", "window:delayed", "window:recurring"]),
    workload_balancing_enabled: true,
    governance_validated: !has(failures, "SCHEDULING_GOVERNANCE_BYPASS"),
    deterministic_ordering: !has(failures, "SCHEDULING_NON_DETERMINISTIC"),
    replayable: !has(failures, "SCHEDULING_NON_DETERMINISTIC"),
  });
  const execution_coordination = nested({
    coordination_id: "P3.3-EXECUTION-COORDINATOR-001",
    dependency_barriers: has(failures, "DEPENDENCY_SYNC_FAILURE") ? freezeArray([]) : freezeArray(["barrier:composition-ready", "barrier:policy-admitted"]),
    execution_sequence: has(failures, "CONCURRENCY_ORDERING_DRIFT") ? freezeArray(["execute", "activate"]) : freezeArray(["activate", "schedule", "execute", "coordinate", "complete"]),
    parallel_groups: freezeArray(["group:independent-skills"]),
    completion_aggregation: true,
    timeout_coordination: true,
    retry_coordination: true,
    cancellation_supported: true,
    rollback_coordination: true,
    synchronization_valid: !has(failures, "DEPENDENCY_SYNC_FAILURE") && !has(failures, "CONCURRENCY_ORDERING_DRIFT"),
  });
  const runtime_state = nested({
    state_id: "P3.3-RUNTIME-STATE-001",
    active_sessions: freezeArray(["session:p3.3:agent-runtime-001"]),
    runtime_metadata_refs: freezeArray(["metadata:p3.3:runtime-session"]),
    execution_status: failures.length ? "BLOCKED" as const : "READY" as const,
    snapshot_refs: freezeArray(["snapshot:p3.3:runtime-ready"]),
    state_persistence_enabled: true,
    synchronization_hash: hash(["session:p3.3:agent-runtime-001", tenant_id]),
    tenant_id,
    tenant_isolated: !has(failures, "TENANT_ISOLATION_VIOLATION"),
  });
  const governance_adapter = nested({
    adapter_id: "P3.3-RUNTIME-GOVERNANCE-ADAPTER-001",
    constitutional_authority_validated: !has(failures, "RUNTIME_GOVERNANCE_BYPASS"),
    runtime_authorization_validated: !has(failures, "RUNTIME_GOVERNANCE_BYPASS"),
    policy_compliance_validated: !has(failures, "RUNTIME_GOVERNANCE_BYPASS"),
    lifecycle_validity_validated: lifecycle_supervisor.transition_legal,
    dependency_readiness_validated: execution_coordination.dependency_barriers.length > 0,
    scheduling_authorization_validated: scheduling.governance_validated,
    unauthorized_execution_fails_closed: true,
  });
  const contract_library = nested({
    contract_id: "P3.3-RUNTIME-CONTRACT-LIBRARY-001",
    contract_refs: has(failures, "RUNTIME_CONTRACT_MISSING") ? freezeArray(["contract:p3.3:runtime-registration"]) : freezeArray(["contract:p3.3:runtime-registration", "contract:p3.3:execution-request", "contract:p3.3:scheduling", "contract:p3.3:lifecycle-supervision", "contract:p3.3:runtime-state", "contract:p3.3:dependency-coordination", "contract:p3.3:completion", "contract:p3.3:termination", "contract:p3.3:recovery"]),
    versioned: true,
    replay_safe: !has(failures, "RUNTIME_CONTRACT_MISSING"),
    complete: !has(failures, "RUNTIME_CONTRACT_MISSING"),
  });
  const runtime_evidence = buildEvidence(failures);
  const observability = nested({
    observability_id: "P3.3-RUNTIME-OBSERVABILITY-001",
    metrics: Object.freeze({
      active_agents: orchestrator.active_agent_refs.length,
      runtime_health: failures.length ? "BLOCKED" as const : "HEALTHY" as const,
      scheduling_latency_ms: 12,
      execution_throughput: 1,
      coordination_delays: 0,
      lifecycle_transitions: 7,
      execution_failures: has(failures, "DEPENDENCY_SYNC_FAILURE") ? 1 : 0,
      recovery_events: 1,
      queue_depth: scheduling.execution_queue.length,
      dependency_wait_times_ms: 3,
    }),
    cci_observability_integrated: true,
    complete_visibility: !has(failures, "OBSERVABILITY_GAP"),
  });
  const evidenceComplete = runtime_evidence.length === 10 && runtime_evidence.every((entry) => entry.immutable && entry.replayable && entry.evidence_refs.length > 0);
  const cciRuntimeIntegrationValid = !has(failures, "CCI_RUNTIME_INFRASTRUCTURE_REDEFINED") && !orchestrator.owns_infrastructure;
  const replay_validation = nested({
    replay_validation_id: "P3.3-RUNTIME-REPLAY-VALIDATION-001",
    lifecycle_replayed: lifecycle_supervisor.transition_legal && lifecycle_supervisor.supervision_complete,
    scheduling_replayed: scheduling.deterministic_ordering && scheduling.replayable,
    execution_replayed: orchestrator.all_execution_orchestrated,
    dependency_replayed: execution_coordination.synchronization_valid,
    supervision_replayed: lifecycle_supervisor.supervision_complete,
    governance_replayed: Object.values(governance_adapter).filter((value): value is boolean => typeof value === "boolean").every(Boolean),
    identical_behavior_reconstructed: !has(failures, "REPLAY_DIVERGENCE"),
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p32Valid ? ["P3_2_COMPOSITION_INVALID" as const] : []),
    ...(!cciRuntimeIntegrationValid ? ["CCI_RUNTIME_INFRASTRUCTURE_REDEFINED" as const] : []),
    ...(!orchestrator.all_execution_orchestrated ? ["UNORCHESTRATED_EXECUTION" as const] : []),
    ...(!scheduling.deterministic_ordering ? ["SCHEDULING_NON_DETERMINISTIC" as const] : []),
    ...(!scheduling.governance_validated ? ["SCHEDULING_GOVERNANCE_BYPASS" as const] : []),
    ...(!lifecycle_supervisor.supervision_complete ? ["LIFECYCLE_SUPERVISION_GAP" as const] : []),
    ...(!lifecycle_supervisor.transition_legal ? ["ILLEGAL_RUNTIME_TRANSITION" as const] : []),
    ...(execution_coordination.dependency_barriers.length === 0 ? ["DEPENDENCY_SYNC_FAILURE" as const] : []),
    ...(!execution_coordination.synchronization_valid && has(failures, "CONCURRENCY_ORDERING_DRIFT") ? ["CONCURRENCY_ORDERING_DRIFT" as const] : []),
    ...(!contract_library.complete ? ["RUNTIME_CONTRACT_MISSING" as const] : []),
    ...(!governance_adapter.constitutional_authority_validated || !governance_adapter.policy_compliance_validated ? ["RUNTIME_GOVERNANCE_BYPASS" as const] : []),
    ...(!evidenceComplete ? ["RUNTIME_EVIDENCE_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!observability.complete_visibility ? ["OBSERVABILITY_GAP" as const] : []),
    ...(!runtime_state.tenant_isolated ? ["TENANT_ISOLATION_VIOLATION" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.3-RUNTIME-CERTIFICATION-GATE-001",
    outcome: certOutcome(derivedFailures),
    certified: certOutcome(derivedFailures) === "PASS",
    all_execution_orchestrated: orchestrator.all_execution_orchestrated,
    scheduling_deterministic: scheduling.deterministic_ordering && scheduling.governance_validated,
    lifecycle_supervision_complete: lifecycle_supervisor.supervision_complete && lifecycle_supervisor.transition_legal,
    execution_coordination_valid: execution_coordination.synchronization_valid,
    contracts_complete: contract_library.complete && contract_library.replay_safe,
    evidence_complete: evidenceComplete,
    cci_runtime_integration_valid: cciRuntimeIntegrationValid,
    governance_enforced: governance_adapter.constitutional_authority_validated && governance_adapter.unauthorized_execution_fails_closed,
    replay_reproducible: replay_validation.deterministic && replay_validation.identical_behavior_reconstructed,
    observability_complete: observability.complete_visibility,
    tenant_isolation_preserved: runtime_state.tenant_isolated,
    failures: derivedFailures,
  });
  const base: Omit<RuntimeOrchestrationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    agent_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1",
    capability_composition_ref: "caf-capability-composition/v3.2",
    cci_shared_runtime_ref: "Program 2 - CCI Shared Runtime Services",
    orchestrator,
    lifecycle_supervisor,
    scheduling,
    execution_coordination,
    runtime_state,
    governance_adapter,
    contract_library,
    runtime_evidence,
    replay_validation,
    observability,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRuntimeOrchestration(result?: RuntimeOrchestrationResult): RuntimeOrchestrationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, orchestrator_valid: false, scheduling_valid: false, lifecycle_valid: false, coordination_valid: false, governance_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const orchestrator_valid = verifyHashedRecord(result.orchestrator) && result.orchestrator.all_execution_orchestrated && !result.orchestrator.owns_infrastructure;
  const scheduling_valid = verifyHashedRecord(result.scheduling) && result.scheduling.deterministic_ordering && result.scheduling.governance_validated && result.scheduling.replayable;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle_supervisor) && result.lifecycle_supervisor.transition_legal && result.lifecycle_supervisor.supervision_complete;
  const coordination_valid = verifyHashedRecord(result.execution_coordination) && result.execution_coordination.synchronization_valid;
  const governance_valid = verifyHashedRecord(result.governance_adapter) && result.governance_adapter.constitutional_authority_validated && result.governance_adapter.unauthorized_execution_fails_closed;
  const evidence_valid = result.runtime_evidence.length === 10 && result.runtime_evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0);
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && orchestrator_valid && scheduling_valid && lifecycle_valid && coordination_valid && governance_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, orchestrator_valid, scheduling_valid, lifecycle_valid, coordination_valid, governance_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayRuntimeOrchestration(result = runRuntimeOrchestration()): boolean {
  const replayed = runRuntimeOrchestration();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateRuntimeOrchestration(result).valid;
}

export function getRuntimeOrchestrationBundle(): RuntimeOrchestrationBundle {
  const result = runRuntimeOrchestration();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_capability_composition: true,
      consumes_cci_shared_runtime_services: true,
      owns_orchestration_not_runtime_infrastructure: true,
      deterministic_scheduling_required: true,
      governed_execution_required: true,
      replayable_runtime_required: true,
      immutable_runtime_evidence_required: true,
    }),
    result,
    validation: validateRuntimeOrchestration(result),
  });
}

export const RuntimeOrchestrationService = Object.freeze({
  run: runRuntimeOrchestration,
  validate: validateRuntimeOrchestration,
  replay: replayRuntimeOrchestration,
});
