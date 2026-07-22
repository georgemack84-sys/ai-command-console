import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { DelegationEngineBundle, DelegationEngineDecision, DelegationEngineFailure, DelegationEngineInput, DelegationEngineResult, DelegationEngineScenario, DelegationEngineValidation, DelegationLifecycleState } from "@/types/delegation-engine";

const VERSION = "delegation-engine/w2.11" as const;
const IDENTIFIER = "DelegationEngine" as const;
const STATES = Object.freeze<DelegationLifecycleState[]>(["Proposed", "Validated", "Approved", "Active", "Suspended", "Revoked", "Expired", "Archived"]);
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;
let safetyGateBaseline: ReturnType<typeof runSafetyGate> | undefined;
let planningEngineBaseline: ReturnType<typeof runPlanningEngine> | undefined;
let memoryEngineBaseline: ReturnType<typeof runMemoryEngine> | undefined;
let runtimeOrchestratorBaseline: ReturnType<typeof runRuntimeOrchestrator> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly DelegationEngineFailure[], failure: DelegationEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: DelegationEngineScenario): DelegationEngineFailure | undefined { return scenario === "BASELINE" || scenario === "OPERATIONAL_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly DelegationEngineFailure[], scenario: DelegationEngineScenario): DelegationEngineDecision {
  const conditional = new Set<DelegationEngineFailure>(["DELEGATION_CONTRACTS_MISSING", "DELEGATION_EVIDENCE_MISSING", "AUTHORITY_INTERSECTION_MISSING", "DELEGATION_LIFECYCLE_MISSING", "REVOCATION_ENGINE_MISSING", "DELEGATION_MONITORING_MISSING", "DELEGATION_LINEAGE_MISSING", "DELEGATION_GOVERNANCE_MISSING", "RUNTIME_DELEGATION_INTEGRATION_MISSING", "DELEGATION_API_MISSING", "DELEGATION_ENGINE_OPERATIONAL_GATE_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "DELEGATION_ENGINE_OPERATIONAL_GATE_FAILED")) return "NOT_OPERATIONAL";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "OPERATIONAL_WITH_OBSERVATIONS") return "CONDITIONALLY_OPERATIONAL";
  return "DELEGATION_ENGINE_OPERATIONAL";
}
function resultReplayHash(result: Omit<DelegationEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ contracts: result.contracts.integrity_hash, authority: result.authority_intersection.integrity_hash, lifecycle: result.lifecycle.integrity_hash, revocation: result.revocation.integrity_hash, monitoring: result.monitoring.integrity_hash, lineage: result.lineage.integrity_hash, governance: result.governance.integrity_hash, runtime: result.runtime_integration.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<DelegationEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runDelegationEngine(input: DelegationEngineInput = {}): DelegationEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<DelegationEngineFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation(); agentRegistryBaseline ??= runAgentRegistry(); lifecycleBaseline ??= runLifecycleEngine(); capabilityRegistryBaseline ??= runCapabilityRegistry(); skillRegistryBaseline ??= runSkillRegistry(); authorityValidatorBaseline ??= runAuthorityValidator(); policyGateBaseline ??= runPolicyGate(); safetyGateBaseline ??= runSafetyGate(); planningEngineBaseline ??= runPlanningEngine(); memoryEngineBaseline ??= runMemoryEngine(); runtimeOrchestratorBaseline ??= runRuntimeOrchestrator();
  const upstream = [
    ["W2_0_CAF_CONSTITUTION_INVALID", !validateCafConstitutionalFoundation(constitutionBaseline).valid],
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(agentRegistryBaseline).valid],
    ["W2_2_LIFECYCLE_ENGINE_INVALID", !validateLifecycleEngine(lifecycleBaseline).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(capabilityRegistryBaseline).valid],
    ["W2_4_SKILL_REGISTRY_INVALID", !validateSkillRegistry(skillRegistryBaseline).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(authorityValidatorBaseline).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(policyGateBaseline).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(safetyGateBaseline).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(planningEngineBaseline).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(memoryEngineBaseline).valid],
    ["W2_10_RUNTIME_ORCHESTRATOR_INVALID", !validateRuntimeOrchestrator(runtimeOrchestratorBaseline).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const contractsOk = !has(failures, "DELEGATION_CONTRACTS_MISSING") && !has(failures, "DELEGATION_CONTRACT_INVALID") && !has(failures, "DELEGATION_SCOPE_AMBIGUOUS") && !has(failures, "DELEGATION_EVIDENCE_MISSING");
  const authorityOk = !has(failures, "AUTHORITY_INTERSECTION_MISSING") && !has(failures, "AUTHORITY_ELEVATION_ALLOWED") && !has(failures, "POLICY_RESTRICTION_BYPASSED") && !has(failures, "SAFETY_RESTRICTION_BYPASSED") && !has(failures, "RUNTIME_RESTRICTION_BYPASSED") && !has(failures, "TENANT_RESTRICTION_BYPASSED");
  const lifecycleOk = !has(failures, "DELEGATION_LIFECYCLE_MISSING") && !has(failures, "INVALID_LIFECYCLE_TRANSITION_ALLOWED") && !has(failures, "DELEGATION_VALIDATION_INCOMPLETE");
  const revocationOk = !has(failures, "REVOCATION_ENGINE_MISSING") && !has(failures, "REVOCATION_NOT_IMMEDIATE") && !has(failures, "CASCADE_REVOCATION_FAILED") && !has(failures, "REVOKED_DELEGATION_RETAINS_AUTHORITY");
  const monitoringOk = !has(failures, "DELEGATION_MONITORING_MISSING") && !has(failures, "AUTHORITY_DRIFT_UNDETECTED") && !has(failures, "EXPIRED_DELEGATION_UNDETECTED") && !has(failures, "DELEGATION_CHAIN_DEPTH_UNDETECTED");
  const lineageOk = !has(failures, "DELEGATION_LINEAGE_MISSING") && !has(failures, "DELEGATION_LINEAGE_NOT_IMMUTABLE");
  const governanceOk = !has(failures, "DELEGATION_GOVERNANCE_MISSING") && !has(failures, "PRIVILEGE_ESCALATION_ALLOWED") && !has(failures, "CROSS_TENANT_DELEGATION_ALLOWED") && !has(failures, "POLICY_BYPASS_ALLOWED");
  const runtimeOk = !has(failures, "RUNTIME_DELEGATION_INTEGRATION_MISSING") && !has(failures, "DELEGATED_ACTION_NOT_VALIDATED");
  const apisOk = !has(failures, "DELEGATION_API_MISSING");
  const evidenceOk = !has(failures, "DELEGATION_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "DELEGATION_REPLAY_INVALID") && contractsOk;
  const decision = decisionFor(failures, scenario);
  const operational = decision === "DELEGATION_ENGINE_OPERATIONAL";
  const contracts = nested({ registry_id: contractsOk ? `registry:w2.11:delegation-contracts:${input.seed ?? "canonical"}` : "", contract_schema: contractsOk, delegation_scope: contractsOk, constraints: contractsOk, duration: contractsOk, conditions: contractsOk, evidence: contractsOk, metadata: contractsOk, delegator: contractsOk, delegate: contractsOk, authority_granted: contractsOk, capabilities_granted: contractsOk, restrictions: contractsOk, expiration: contractsOk, revocation_policy: contractsOk, contract_validator: contractsOk });
  const authority_intersection = nested({ engine_id: authorityOk ? "engine:w2.11:authority-intersection" : "", delegator_authority: authorityOk, delegate_eligibility: authorityOk, policy_restrictions: authorityOk, safety_restrictions: authorityOk, runtime_restrictions: authorityOk, tenant_restrictions: authorityOk, minimum_constitutional_authority: authorityOk, no_authority_elevation: authorityOk, effective_authority_evidence: authorityOk, deterministic_resolution: authorityOk });
  const lifecycle = nested({ manager_id: lifecycleOk ? "manager:w2.11:delegation-lifecycle" : "", states: lifecycleOk ? freezeArray(STATES) : freezeArray<DelegationLifecycleState>([]), authority_verification: lifecycleOk, policy_verification: lifecycleOk, safety_verification: lifecycleOk, runtime_verification: lifecycleOk, capability_verification: lifecycleOk, transitions_enforced: lifecycleOk, lifecycle_history: lifecycleOk, auditable: lifecycleOk });
  const revocation = nested({ engine_id: revocationOk ? "engine:w2.11:revocation" : "", operator_source: revocationOk, policy_source: revocationOk, safety_source: revocationOk, authority_source: revocationOk, runtime_source: revocationOk, lifecycle_source: revocationOk, expiration_source: revocationOk, trust_degradation_source: revocationOk, parent_revocation_source: revocationOk, immediate_termination: revocationOk, cascading_revocation: revocationOk, task_cancellation: revocationOk, capability_removal: revocationOk, runtime_notification: revocationOk, audit_recording: revocationOk });
  const monitoring = nested({ monitor_id: monitoringOk ? "monitor:w2.11:delegation" : "", authority_validity: monitoringOk, policy_compliance: monitoringOk, safety_compliance: monitoringOk, runtime_compliance: monitoringOk, expiration: monitoringOk, capability_usage: monitoringOk, abnormal_behavior: monitoringOk, delegation_chains: monitoringOk, authority_drift_alerts: monitoringOk, expired_alerts: monitoringOk, policy_violation_alerts: monitoringOk, safety_violation_alerts: monitoringOk, runtime_violation_alerts: monitoringOk, depth_alerts: monitoringOk, continuous: monitoringOk });
  const lineage = nested({ graph_id: lineageOk ? "graph:w2.11:delegation-lineage" : "", delegator: lineageOk, delegate: lineageOk, authority_changes: lineageOk, revocations: lineageOk, renewals: lineageOk, delegation_chain: lineageOk, execution_lineage: lineageOk, timeline: lineageOk, immutable_history: lineageOk, evidence: lineageOk });
  const governance = nested({ rules_id: governanceOk ? "rules:w2.11:delegation-governance" : "", no_authority_elevation: governanceOk, no_policy_bypass: governanceOk, no_safety_bypass: governanceOk, tenant_isolation: governanceOk, fully_auditable: governanceOk, immutable_evidence_required: governanceOk, explainable: governanceOk, revoked_authority_removed_immediately: governanceOk, compliance_report: governanceOk });
  const runtime_integration = nested({ adapter_id: runtimeOk ? "adapter:w2.11:runtime-delegation" : "", runtime_orchestrator_integration: runtimeOk, planning_engine_integration: runtimeOk, authority_validator_integration: runtimeOk, policy_gate_integration: runtimeOk, safety_gate_integration: runtimeOk, verify_before_execution: runtimeOk, enforce_restrictions: runtimeOk, validate_expiration: runtimeOk, validate_revocation_status: runtimeOk, validate_runtime_eligibility: runtimeOk, enforcement_api: runtimeOk });
  const apis = nested({ api_id: apisOk ? "api:w2.11:delegation" : "", create_delegation: apisOk, validate_contract: apisOk, resolve_authority: apisOk, approve_delegation: apisOk, suspend_delegation: apisOk, revoke_delegation: apisOk, list_delegations: apisOk, inspect_lineage: apisOk, monitor_delegation: apisOk, verify_runtime_delegation: apisOk, replay_delegation: apisOk, stable: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.11:delegation-evidence" : "", records: evidenceOk ? freezeArray(["delegation:contract", "delegation:authority-resolution", "delegation:lifecycle", "delegation:revocation", "delegation:monitoring", "delegation:lineage", "delegation:governance", "delegation:runtime-enforcement"]) : freezeArray<string>([]), contract_evidence: evidenceOk, authority_resolution_evidence: evidenceOk, lifecycle_evidence: evidenceOk, revocation_evidence: evidenceOk, monitoring_evidence: evidenceOk, lineage_evidence: evidenceOk, governance_evidence: evidenceOk, runtime_enforcement_evidence: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.11-DELEGATION-ENGINE-READINESS-001", decision, phase_ready: operational, constitution_ready: !has(failures, "W2_0_CAF_CONSTITUTION_INVALID"), agent_registry_ready: !has(failures, "W2_1_AGENT_REGISTRY_INVALID"), lifecycle_engine_ready: !has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID"), capability_registry_ready: !has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID"), skill_registry_ready: !has(failures, "W2_4_SKILL_REGISTRY_INVALID"), authority_validator_ready: !has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID"), policy_gate_ready: !has(failures, "W2_6_POLICY_GATE_INVALID"), safety_gate_ready: !has(failures, "W2_7_SAFETY_GATE_INVALID"), planning_engine_ready: !has(failures, "W2_8_PLANNING_ENGINE_INVALID"), memory_engine_ready: !has(failures, "W2_9_MEMORY_ENGINE_INVALID"), runtime_orchestrator_ready: !has(failures, "W2_10_RUNTIME_ORCHESTRATOR_INVALID"), contracts_ready: contractsOk, authority_intersection_ready: authorityOk, lifecycle_ready: lifecycleOk, revocation_ready: revocationOk, monitoring_ready: monitoringOk, lineage_ready: lineageOk, governance_ready: governanceOk, runtime_integration_ready: runtimeOk, apis_ready: apisOk, evidence_ready: evidenceOk, no_elevation: authorityOk && governanceOk, immediate_revocation: revocationOk && governanceOk, tenant_isolation_preserved: authorityOk && governanceOk, failures });
  const base: Omit<DelegationEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", safety_gate_ref: "safety-gate/w2.7", planning_engine_ref: "planning-engine/w2.8", memory_engine_ref: "memory-engine/w2.9", runtime_orchestrator_ref: "runtime-orchestrator/w2.10", contracts, authority_intersection, lifecycle, revocation, monitoring, lineage, governance, runtime_integration, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateDelegationEngine(result?: DelegationEngineResult): DelegationEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_OPERATIONAL" as const, replay_hash_valid: false, integrity_hash_valid: false, contracts_valid: false, authority_intersection_valid: false, lifecycle_valid: false, revocation_valid: false, monitoring_valid: false, lineage_valid: false, governance_valid: false, runtime_integration_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["DELEGATION_CONTRACTS_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const contracts_valid = verifyHashed(result.contracts) && result.contracts.contract_schema && result.contracts.contract_validator && result.contracts.revocation_policy;
  const authority_intersection_valid = verifyHashed(result.authority_intersection) && result.authority_intersection.minimum_constitutional_authority && result.authority_intersection.no_authority_elevation && result.authority_intersection.deterministic_resolution;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === 8 && result.lifecycle.transitions_enforced && result.lifecycle.auditable;
  const revocation_valid = verifyHashed(result.revocation) && result.revocation.immediate_termination && result.revocation.cascading_revocation && result.revocation.audit_recording;
  const monitoring_valid = verifyHashed(result.monitoring) && result.monitoring.authority_drift_alerts && result.monitoring.depth_alerts && result.monitoring.continuous;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.delegation_chain && result.lineage.immutable_history && result.lineage.evidence;
  const governance_valid = verifyHashed(result.governance) && result.governance.no_authority_elevation && result.governance.no_policy_bypass && result.governance.no_safety_bypass && result.governance.tenant_isolation;
  const runtime_integration_valid = verifyHashed(result.runtime_integration) && result.runtime_integration.verify_before_execution && result.runtime_integration.validate_revocation_status && result.runtime_integration.enforcement_api;
  const apis_valid = verifyHashed(result.apis) && result.apis.create_delegation && result.apis.revoke_delegation && result.apis.replay_delegation && result.apis.stable;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.replayable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.no_elevation && result.readiness.immediate_revocation && result.readiness.tenant_isolation_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && contracts_valid && authority_intersection_valid && lifecycle_valid && revocation_valid && monitoring_valid && lineage_valid && governance_valid && runtime_integration_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, contracts_valid, authority_intersection_valid, lifecycle_valid, revocation_valid, monitoring_valid, lineage_valid, governance_valid, runtime_integration_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayDelegationEngine(result = runDelegationEngine()): boolean { const replayed = runDelegationEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateDelegationEngine(result).valid; }
export function getDelegationEngineBundle(): DelegationEngineBundle { const result = runDelegationEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_delegation_contracts: true, owns_authority_intersection: true, owns_delegation_lifecycle: true, owns_revocation: true, owns_delegation_monitoring: true, owns_delegation_lineage: true, owns_delegation_governance: true, owns_runtime_delegation: true, owns_delegation_evidence: true, prevents_authority_elevation: true, operational_gate: "Delegation Engine Operational Gate" }), result, validation: validateDelegationEngine(result) }); }
export const DelegationEngineService = Object.freeze({ run: runDelegationEngine, validate: validateDelegationEngine, replay: replayDelegationEngine });
