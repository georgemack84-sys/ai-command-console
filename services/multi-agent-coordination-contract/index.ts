import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AgentIdentity,
  AgentRole,
  AuthorityCategory,
  CommunicationPermission,
  CoordinationContract,
  CoordinationFailure,
  CoordinationInput,
  CoordinationObservabilitySurface,
  CoordinationReplayResult,
  CoordinationScenario,
  CoordinationSession,
  CoordinationValidationResult,
  DelegationPolicy,
  GovernanceBinding,
  LifecycleEvent,
  MissionScope,
  MultiAgentCoordinationContractBundle,
  RoleAssignment,
} from "@/types/multi-agent-coordination-contract";

const VERSION = "multi-agent-coordination-contract/v8ALT.7.1" as const;
const SESSION_VERSION = "coordination-session/v8ALT.7.1" as const;
const NOW = "2026-07-13T17:00:00.000Z";
const TENANT_ID = "tenant:autonomy:primary";
const roles = Object.freeze(["Coordinator", "Planner", "Analyst", "Observer", "Executor", "Validator", "Governance Advisor", "Runtime Supervisor", "Recovery Advisor", "Explainability Agent", "Prediction Agent", "Integrity Auditor", "Certification Agent"] as const);
const authorityCategories = Object.freeze(["NONE", "READ_ONLY", "OBSERVE", "ANALYZE", "PLAN", "RECOMMEND", "VALIDATE", "SUPERVISE", "GOVERNANCE_ADVISORY", "CERTIFY"] as const);
const communicationTypes = Object.freeze(["REQUEST", "RESPONSE", "NOTIFICATION", "STATUS", "RECOMMENDATION", "EVIDENCE", "GOVERNANCE", "EXPLANATION", "HEALTH", "CERTIFICATION"] as const);
const states = Object.freeze(["INITIALIZING", "VALIDATING", "REGISTERING_AGENTS", "VERIFYING_AUTHORITIES", "VERIFYING_GOVERNANCE", "ACTIVE", "PAUSED", "REPLAY_READY", "CERTIFIED", "FAILED", "TERMINATED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: CoordinationScenario): readonly CoordinationFailure[] {
  const map: Partial<Record<CoordinationScenario, CoordinationFailure>> = {
    UNCERTIFIED_AGENT: "UNCERTIFIED_AGENT_DETECTED",
    DUPLICATE_AGENT_IDENTITY: "DUPLICATE_AGENT_IDENTITY_DETECTED",
    MISSION_SCOPE_MISMATCH: "MISSION_SCOPE_MISMATCH_DETECTED",
    ROLE_AMBIGUITY: "ROLE_AMBIGUITY_DETECTED",
    AUTHORITY_OVERLAP: "AUTHORITY_OVERLAP_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    UNAUTHORIZED_COMMUNICATION: "UNAUTHORIZED_COMMUNICATION_PERMITTED",
    CIRCULAR_DELEGATION: "CIRCULAR_DELEGATION_DETECTED",
    MISSING_GOVERNANCE_REFERENCE: "GOVERNANCE_REFERENCE_MISSING",
    MISSING_CONSTITUTIONAL_REFERENCE: "CONSTITUTIONAL_REFERENCE_MISSING",
    MISSING_REPLAY_REQUIREMENTS: "REPLAY_REQUIREMENTS_MISSING",
    CROSS_TENANT_PARTICIPATION: "CROSS_TENANT_PARTICIPATION_REJECTED",
    HIDDEN_PARTICIPANT: "HIDDEN_PARTICIPANT_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function authorityFor(role: AgentRole): AuthorityCategory {
  const map: Record<AgentRole, AuthorityCategory> = {
    Coordinator: "SUPERVISE",
    Planner: "PLAN",
    Analyst: "ANALYZE",
    Observer: "OBSERVE",
    Executor: "NONE",
    Validator: "VALIDATE",
    "Governance Advisor": "GOVERNANCE_ADVISORY",
    "Runtime Supervisor": "SUPERVISE",
    "Recovery Advisor": "RECOMMEND",
    "Explainability Agent": "ANALYZE",
    "Prediction Agent": "ANALYZE",
    "Integrity Auditor": "VALIDATE",
    "Certification Agent": "CERTIFY",
  };
  return map[role];
}

function agents(tenant: string, mission: string, failures: readonly CoordinationFailure[]): readonly AgentIdentity[] {
  const baseRoles: AgentRole[] = ["Coordinator", "Planner", "Analyst", "Validator", "Governance Advisor", "Runtime Supervisor", "Recovery Advisor", "Explainability Agent", "Integrity Auditor", "Certification Agent"];
  const built = baseRoles.map((role, index) => {
    const agent_id = failures.includes("DUPLICATE_AGENT_IDENTITY_DETECTED") && index === 1 ? "agent:duplicate" : `agent:${role.toLowerCase().replaceAll(" ", "-")}`;
    return Object.freeze({
      agent_id: failures.includes("DUPLICATE_AGENT_IDENTITY_DETECTED") && index === 2 ? "agent:duplicate" : agent_id,
      agent_name: role,
      agent_type: "certified-autonomy-agent",
      agent_version: "agent/v8ALT.7.1",
      certification_level: failures.includes("UNCERTIFIED_AGENT_DETECTED") && index === 1 ? "UNCERTIFIED" as const : "CERTIFIED" as const,
      authority_profile: failures.includes("AUTHORITY_ESCALATION_DETECTED") && index === 1 ? "CERTIFY" as const : authorityFor(role),
      governance_profile: failures.includes("GOVERNANCE_REFERENCE_MISSING") ? "" : "governance:multi-agent:v8ALT.7.1",
      constitutional_profile: failures.includes("CONSTITUTIONAL_REFERENCE_MISSING") ? "" : "constitution:operator-supremacy:v8ALT.7.1",
      replay_identity: failures.includes("REPLAY_REQUIREMENTS_MISSING") ? "" : `replay-agent:${role.toLowerCase().replaceAll(" ", "-")}`,
      role,
      tenant_id: failures.includes("CROSS_TENANT_PARTICIPATION_REJECTED") && index === 1 ? "external-tenant" : tenant,
      mission_assignment: failures.includes("MISSION_SCOPE_MISMATCH_DETECTED") && index === 1 ? "mission:other" : mission,
      parent_agent: role === "Coordinator" ? null : "agent:coordinator",
      lineage_reference: `lineage:agent:${role.toLowerCase().replaceAll(" ", "-")}`,
      status: failures.includes("UNCERTIFIED_AGENT_DETECTED") && index === 1 ? "REJECTED" as const : "ACTIVE" as const,
    });
  });
  return freezeArray(failures.includes("HIDDEN_PARTICIPANT_DETECTED") ? built.slice(1) : built);
}

function permissions(failures: readonly CoordinationFailure[]): readonly CommunicationPermission[] {
  const rows: CommunicationPermission[] = [
    { source_role: "Planner", target_role: "Analyst", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Planner", target_role: "Coordinator", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Analyst", target_role: "Planner", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Validator", target_role: "Planner", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Runtime Supervisor", target_role: "Coordinator", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Governance Advisor", target_role: "All", allowed: true, governance_required: true, replay_required: true },
    { source_role: "Executor", target_role: "All", allowed: failures.includes("UNAUTHORIZED_COMMUNICATION_PERMITTED"), governance_required: false, replay_required: false },
  ];
  return freezeArray(rows);
}

function roleAssignments(agentList: readonly AgentIdentity[], failures: readonly CoordinationFailure[]): readonly RoleAssignment[] {
  return freezeArray(agentList.map((agent, index) => Object.freeze({
    role_id: id("ROLE", "coordination-role", { agent: agent.agent_id, role: agent.role }),
    agent_id: agent.agent_id,
    role_name: failures.includes("ROLE_AMBIGUITY_DETECTED") && index === 1 ? "Analyst" as const : agent.role,
    authority_scope: agent.authority_profile,
    delegation_scope: freezeArray(["Analyst", "Observer", "Recovery Advisor"] as AgentRole[]),
    communication_scope: freezeArray(["Coordinator", "Planner", "Analyst", "Validator", "Governance Advisor"] as AgentRole[]),
    governance_scope: agent.governance_profile,
    replay_scope: agent.replay_identity,
    status: agent.status === "ACTIVE" ? "ASSIGNED" as const : "REJECTED" as const,
  })));
}

function delegation(agentList: readonly AgentIdentity[], failures: readonly CoordinationFailure[]): readonly DelegationPolicy[] {
  const source = agentList.find((agent) => agent.role === "Coordinator") ?? agentList[0];
  const target = agentList.find((agent) => agent.role === "Planner") ?? agentList[1] ?? agentList[0];
  return freezeArray([Object.freeze({
    delegation_id: id("DELG", "coordination-delegation", { source: source?.agent_id, target: target?.agent_id }),
    source_agent: source?.agent_id ?? "",
    target_agent: failures.includes("CIRCULAR_DELEGATION_DETECTED") ? source?.agent_id ?? "" : target?.agent_id ?? "",
    authority_preserved: !failures.includes("AUTHORITY_OVERLAP_DETECTED") && !failures.includes("AUTHORITY_ESCALATION_DETECTED"),
    governance_approved: !failures.includes("GOVERNANCE_REFERENCE_MISSING"),
    constitutional_approved: !failures.includes("CONSTITUTIONAL_REFERENCE_MISSING"),
    operator_authority_preserved: true,
    circular_delegation: failures.includes("CIRCULAR_DELEGATION_DETECTED"),
    replay_evidence: failures.includes("REPLAY_REQUIREMENTS_MISSING") ? "" : "replay:coordination:delegation",
  })]);
}

function lifecycle(contractId: string, sessionId: string): readonly LifecycleEvent[] {
  const transitions: [LifecycleEvent["old_state"], LifecycleEvent["new_state"]][] = [["INITIALIZING", "VALIDATING"], ["VALIDATING", "REGISTERING_AGENTS"], ["REGISTERING_AGENTS", "VERIFYING_AUTHORITIES"], ["VERIFYING_AUTHORITIES", "VERIFYING_GOVERNANCE"], ["VERIFYING_GOVERNANCE", "REPLAY_READY"], ["REPLAY_READY", "CERTIFIED"]];
  return freezeArray(transitions.map(([old_state, new_state], index) => {
    const base = { event_id: id("COEV", "coordination-event", { contractId, index }), contract_id: contractId, session_id: sessionId, agent_id: "agent:coordinator", event_type: "state_transition", old_state, new_state, authority_reference: "authority:operator", governance_reference: "governance:multi-agent:v8ALT.7.1", timestamp: `2026-07-13T17:0${index}:00.000Z` };
    return Object.freeze({ ...base, hash: hashValue("coordination-lifecycle-event", base) });
  }));
}

function contractHash(contract: Omit<CoordinationContract, "contract_hash"> | CoordinationContract): string {
  const { contract_hash: _hash, ...source } = contract as CoordinationContract;
  return hashValue("multi-agent-coordination-contract", source);
}

export function createCoordinationContract(input: CoordinationInput = {}): CoordinationContract {
  if (input.contract) return input.contract;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const tenant = input.tenant_id ?? TENANT_ID;
  const mission = input.mission_id ?? "mission:multi-agent:primary";
  const contractId = id("MACC", "multi-agent-coordination-contract", { mission, scenario: input.scenario ?? "BASELINE" });
  const sessionId = id("MACS", "multi-agent-coordination-session", { contractId, mission });
  const agentList = agents(tenant, mission, failures);
  const missionScope: MissionScope = Object.freeze({ mission_id: mission, mission_name: "Certified multi-agent mission", mission_objective: "Coordinate certified advisory agents deterministically", mission_constraints: freezeArray(["advisory-only", "operator-visible", "governance-bound"]), mission_priority: "CERTIFICATION", authorized_agents: freezeArray(agentList.map((agent) => agent.agent_id)), authorized_resources: freezeArray(["evidence", "replay", "governance-context"]), authorized_outputs: freezeArray(["recommendations", "analysis", "certification-evidence"]), mission_boundaries: freezeArray(["no-execution-authority", "no-policy-modification", "tenant-isolated"]), mission_duration: "PT1H" });
  const binding: GovernanceBinding = Object.freeze({ governance_context_id: failures.includes("GOVERNANCE_REFERENCE_MISSING") ? "" : "governance-context:multi-agent:v8ALT.7.1", constitution_version: failures.includes("CONSTITUTIONAL_REFERENCE_MISSING") ? "" : "constitution/v8ALT.7.1", policy_version: failures.includes("GOVERNANCE_REFERENCE_MISSING") ? "" : "policy/v8ALT.7.1", authority_version: "authority/v8ALT.7.1", tenant_context: tenant, risk_profile: "risk:bounded-coordination", confidence_profile: "confidence:deterministic", certification_level: "CERTIFIED" });
  const session: CoordinationSession = Object.freeze({ coordination_session_id: sessionId, coordination_contract_id: contractId, mission_id: mission, execution_id: `execution:${mission}`, tenant_id: tenant, session_version: SESSION_VERSION, coordination_type: "MULTI_AGENT_CERTIFIED_COORDINATION", created_timestamp: NOW, expiration_timestamp: "2026-07-13T18:00:00.000Z", session_state: failures.length ? "FAILED" : "CERTIFIED" });
  const base = {
    coordination_contract_id: contractId,
    coordination_session_id: session.coordination_session_id,
    tenant_id: tenant,
    mission_id: mission,
    execution_id: session.execution_id,
    participating_agents: agentList,
    mission_scope: missionScope,
    role_assignments: roleAssignments(agentList, failures),
    authority_profiles: freezeArray(agentList.map((agent) => `${agent.agent_id}:${agent.authority_profile}`)),
    communication_policy: permissions(failures),
    delegation_policy: delegation(agentList, failures),
    governance_binding: binding,
    replay_policy: failures.includes("REPLAY_REQUIREMENTS_MISSING") ? freezeArray<string>([]) : freezeArray(["deterministic-ordering", "immutable-messages", "lineage-required", "replay-compatible"]),
    integrity_policy: freezeArray(["hash-contract", "hash-events", "hash-evidence"]),
    coordination_constraints: freezeArray(["no-execution-authority", "no-governance-override", "no-constitutional-modification", "no-policy-modification", "no-operator-replacement", "no-tenant-override"]),
    shared_state_policy: freezeArray(["read-only-shared-state", "append-only-evidence"]),
    operator_visibility_policy: failures.includes("HIDDEN_PARTICIPANT_DETECTED") ? freezeArray<string>([]) : freezeArray(["operator-visible-agents", "operator-visible-messages", "operator-visible-delegation"]),
    lifecycle_events: lifecycle(contractId, sessionId),
    created_timestamp: NOW,
    version: VERSION,
    immutable: true as const,
    append_only: true as const,
    hidden_participant_detected: failures.includes("HIDDEN_PARTICIPANT_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("coordination-integrity", { contractId, agents: agentList.map((agent) => agent.agent_id), session }),
  };
  return Object.freeze({ ...base, contract_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : contractHash(base as Omit<CoordinationContract, "contract_hash">) });
}

export function registerAgent(input: CoordinationInput = {}): readonly AgentIdentity[] { return createCoordinationContract(input).participating_agents; }

export function validateCoordinationContract(contract = createCoordinationContract()): CoordinationValidationResult {
  const ids = contract.participating_agents.map((agent) => agent.agent_id);
  const schema_valid = Boolean(contract.coordination_contract_id && contract.coordination_session_id && contract.mission_id && contract.execution_id && contract.version === VERSION);
  const immutable = contract.immutable && contract.append_only;
  const session_identity_unique = Boolean(contract.coordination_session_id && contract.coordination_contract_id);
  const agents_declared = contract.participating_agents.length > 0 && !contract.hidden_participant_detected;
  const certified_agents_only = contract.participating_agents.every((agent) => agent.certification_level === "CERTIFIED" && agent.status === "ACTIVE");
  const duplicateAgents = new Set(ids).size !== ids.length;
  const mission_scope_valid = contract.participating_agents.every((agent) => agent.mission_assignment === contract.mission_id) && contract.mission_scope.mission_id === contract.mission_id;
  const roleNames = contract.role_assignments.map((assignment) => assignment.role_name);
  const roles_deterministic = new Set(roleNames).size === roleNames.length;
  const forbiddenAuthority = contract.participating_agents.some((agent) => agent.role !== "Certification Agent" && agent.authority_profile === "CERTIFY") || contract.coordination_constraints.some((item) => item.includes("override") && !item.startsWith("no-"));
  const delegationAuthorityValid = contract.delegation_policy.every((item) => item.authority_preserved && !item.circular_delegation);
  const authority_valid = !forbiddenAuthority && delegationAuthorityValid && !duplicateAgents;
  const communication_valid = contract.communication_policy.length >= 7 && contract.communication_policy.every((item) => item.source_role !== "Executor" || !item.allowed);
  const delegation_valid = contract.delegation_policy.every((item) => item.governance_approved && item.constitutional_approved && item.operator_authority_preserved && item.replay_evidence && !item.circular_delegation);
  const governance_valid = Boolean(contract.governance_binding.governance_context_id && contract.governance_binding.policy_version) && contract.participating_agents.every((agent) => agent.governance_profile);
  const constitutional_valid = Boolean(contract.governance_binding.constitution_version) && contract.participating_agents.every((agent) => agent.constitutional_profile);
  const replay_valid = contract.replay_policy.length > 0 && contract.participating_agents.every((agent) => agent.replay_identity) && contract.lifecycle_events.every((event) => event.hash);
  const integrity_valid = Boolean(contract.integrity_hash && contract.contract_hash) && contractHash(contract) === contract.contract_hash;
  const tenant_isolated = contract.tenant_id.startsWith("tenant:") && contract.participating_agents.every((agent) => agent.tenant_id === contract.tenant_id);
  const operator_visible = contract.operator_visibility_policy.length > 0 && !contract.hidden_participant_detected;
  const failures = unique([
    ...(!schema_valid ? ["CONTRACT_SCHEMA_INVALID" as const] : []),
    ...(!agents_declared ? ["HIDDEN_PARTICIPANT_DETECTED" as const] : []),
    ...(!certified_agents_only ? ["UNCERTIFIED_AGENT_DETECTED" as const] : []),
    ...(duplicateAgents ? ["DUPLICATE_AGENT_IDENTITY_DETECTED" as const] : []),
    ...(!mission_scope_valid ? ["MISSION_SCOPE_MISMATCH_DETECTED" as const] : []),
    ...(!roles_deterministic ? ["ROLE_AMBIGUITY_DETECTED" as const] : []),
    ...(!authority_valid ? [forbiddenAuthority ? "AUTHORITY_ESCALATION_DETECTED" as const : "AUTHORITY_OVERLAP_DETECTED" as const] : []),
    ...(!communication_valid ? [contract.communication_policy.length < 7 ? "COMMUNICATION_POLICY_INCOMPLETE" as const : "UNAUTHORIZED_COMMUNICATION_PERMITTED" as const] : []),
    ...(!delegation_valid ? [contract.delegation_policy.some((item) => item.circular_delegation) ? "CIRCULAR_DELEGATION_DETECTED" as const : "DELEGATION_POLICY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_REFERENCE_MISSING" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_REFERENCE_MISSING" as const] : []),
    ...(!replay_valid ? ["REPLAY_REQUIREMENTS_MISSING" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_PARTICIPATION_REJECTED" as const] : []),
    ...(!operator_visible ? ["OPERATOR_VISIBILITY_INCOMPLETE" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { contract_id: contract.coordination_contract_id, valid, schema_valid, immutable, session_identity_unique, agents_declared, certified_agents_only, mission_scope_valid, roles_deterministic, authority_valid, communication_valid, delegation_valid, governance_valid, constitutional_valid, replay_valid, integrity_valid, tenant_isolated, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("coordination-validation", source) });
}

export function validateAuthority(input: CoordinationInput = {}) { const validation = validateCoordinationContract(createCoordinationContract(input)); return { authority_valid: validation.authority_valid, failures: validation.failures }; }
export function validateGovernance(input: CoordinationInput = {}) { const validation = validateCoordinationContract(createCoordinationContract(input)); return { governance_valid: validation.governance_valid && validation.constitutional_valid, failures: validation.failures }; }
export function validateReplay(input: CoordinationInput = {}) { const validation = validateCoordinationContract(createCoordinationContract(input)); return { replay_valid: validation.replay_valid, failures: validation.failures }; }
export function validateCommunication(input: CoordinationInput = {}) { const validation = validateCoordinationContract(createCoordinationContract(input)); return { communication_valid: validation.communication_valid, failures: validation.failures }; }
export function finalizeContract(input: CoordinationInput = {}): CoordinationContract { return createCoordinationContract(input); }

export function replayCoordinationContract(contract = createCoordinationContract()): CoordinationReplayResult {
  const reconstructed_hash = contractHash(contract);
  const source = { replay_reference: `replay:coordination-contract:${contract.coordination_contract_id}`, contract_id: contract.coordination_contract_id, deterministic: reconstructed_hash === contract.contract_hash && contract.replay_policy.length > 0, reconstructed_hash, original_hash: contract.contract_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("coordination-replay", source) });
}

export function buildCoordinationObservabilitySurface(contract = createCoordinationContract()): CoordinationObservabilitySurface {
  return Object.freeze({ contract_id: contract.coordination_contract_id, tenant_id: contract.tenant_id, mission_id: contract.mission_id, agent_count: contract.participating_agents.length, role_count: contract.role_assignments.length, state: validateCoordinationContract(contract).valid ? "CERTIFIED" : "FAILED", append_only: true, contract_hash: contract.contract_hash });
}

export function getMultiAgentCoordinationContract(): MultiAgentCoordinationContractBundle {
  const contract = createCoordinationContract();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, principles: freezeArray(["deterministic-coordination-contract", "immutable-session-identity", "certified-agent-identities", "authority-separation", "governance-supremacy", "constitutional-supremacy", "operator-supremacy", "tenant-isolation", "replay-compatible-coordination", "fail-closed-validation"]), roles, authority_categories: authorityCategories, communication_types: communicationTypes, states, final_state: "MULTI_AGENT_COORDINATION_CONTRACT_CERTIFIED" }),
    contract,
    validation: validateCoordinationContract(contract),
    replay: replayCoordinationContract(contract),
    observability: buildCoordinationObservabilitySurface(contract),
  });
}
