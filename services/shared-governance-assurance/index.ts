import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createAuthoritySeparationContract } from "@/services/authority-separation-assurance";
import type {
  GovernanceContext,
  GovernanceDecisionRecord,
  GovernanceInfluenceGraphNode,
  GovernanceStateRecord,
  GovernanceSyncState,
  PolicyAlignmentRecord,
  SharedGovernanceAssuranceBundle,
  SharedGovernanceConflict,
  SharedGovernanceContract,
  SharedGovernanceFailure,
  SharedGovernanceInput,
  SharedGovernanceObservabilitySurface,
  SharedGovernanceReplayResult,
  SharedGovernanceScenario,
  SharedGovernanceValidationResult,
} from "@/types/shared-governance-assurance";

const VERSION = "shared-governance-assurance/v8ALT.7.5" as const;
const NOW = "2026-07-13T21:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "GOVERNANCE_LOADING", "POLICY_SYNCHRONIZATION", "CONSTITUTION_VALIDATION", "EVIDENCE_VALIDATION", "DELEGATION_VALIDATION", "GOVERNANCE_SYNCHRONIZED", "REPLAY_READY", "CERTIFIED", "FAILED"] as const);
const governanceCategories = Object.freeze(["Constitution", "Authority", "Delegation", "Execution", "Risk", "Recovery", "Security", "Compliance", "Integrity", "Certification"] as const);
const policyTypes = Object.freeze(["Authority", "Execution", "Delegation", "Communication", "Security", "Recovery", "Runtime", "Risk", "Integrity", "Certification"] as const);
const evidenceSources = Object.freeze(["Truth Ledger", "Mission Ledger", "Planning Ledger", "Delegation Ledger", "Runtime Ledger", "Integrity Ledger", "Risk Ledger", "Replay Ledger", "Certification Ledger"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failuresFor(scenario: SharedGovernanceScenario): readonly SharedGovernanceFailure[] {
  const map: Partial<Record<SharedGovernanceScenario, SharedGovernanceFailure>> = {
    GOVERNANCE_CONTEXT_MISMATCH: "GOVERNANCE_CONTEXT_MISMATCH_DETECTED",
    CONSTITUTIONAL_MISMATCH: "CONSTITUTIONAL_MISMATCH_DETECTED",
    POLICY_DRIFT: "POLICY_DRIFT_DETECTED",
    REPLAY_MISMATCH: "GOVERNANCE_REPLAY_MISMATCH_DETECTED",
    MISSING_GOVERNANCE_EVIDENCE: "MISSING_GOVERNANCE_EVIDENCE_DETECTED",
    DELEGATION_GOVERNANCE_BYPASS: "DELEGATION_BYPASSES_GOVERNANCE",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    INCONSISTENT_RULE_INTERPRETATION: "INCONSISTENT_RULE_INTERPRETATION_DETECTED",
    AUTHORITY_POLICY_MISMATCH: "AUTHORITY_POLICY_MISMATCH_DETECTED",
    HIDDEN_GOVERNANCE_EVALUATION: "HIDDEN_GOVERNANCE_EVALUATION_DETECTED",
    CROSS_TENANT_GOVERNANCE_LEAKAGE: "CROSS_TENANT_GOVERNANCE_LEAKAGE_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function contractHash(contract: Omit<SharedGovernanceContract, "contract_hash"> | SharedGovernanceContract): string {
  const { contract_hash: _hash, ...source } = contract as SharedGovernanceContract;
  return hashValue("shared-governance-contract", source);
}

function context(validationId: string, coordinationSessionId: string, mission: string, tenant: string, failures: readonly SharedGovernanceFailure[]): GovernanceContext {
  const base = {
    governance_context_id: failures.includes("GOVERNANCE_CONTEXT_MISMATCH_DETECTED") ? `governance-context:${validationId}:drifted` : `governance-context:${validationId}`,
    coordination_session_id: coordinationSessionId,
    mission_id: mission,
    tenant_id: failures.includes("CROSS_TENANT_GOVERNANCE_LEAKAGE_DETECTED") ? "external-tenant" : tenant,
    constitution_version: failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") ? "constitution/v0" : "constitution/v8ALT.7.5",
    governance_policy_version: failures.includes("POLICY_DRIFT_DETECTED") ? "governance-policy/v0" : "governance-policy/v8ALT.7.5",
    authority_policy_version: failures.includes("AUTHORITY_POLICY_MISMATCH_DETECTED") ? "authority-policy/v0" : "authority-policy/v8ALT.7.5",
    security_policy_version: "security-policy/v8ALT.7.5",
    risk_policy_version: "risk-policy/v8ALT.7.5",
    compliance_policy_version: "compliance-policy/v8ALT.7.5",
    effective_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("shared-governance-context", base) });
}

function statesFor(ctx: GovernanceContext, failures: readonly SharedGovernanceFailure[]): readonly GovernanceStateRecord[] {
  return freezeArray(governanceCategories.map((category, index) => {
    const base = {
      governance_state_id: id("GOVS", "governance-state", { context: ctx.governance_context_id, category }),
      governance_context_id: ctx.governance_context_id,
      policy_version: failures.includes("POLICY_DRIFT_DETECTED") && index === 1 ? "policy/drifted" : `${category.toLowerCase()}-policy/v8ALT.7.5`,
      constitution_version: ctx.constitution_version,
      authority_version: ctx.authority_policy_version,
      validation_status: failures.includes("GOVERNANCE_BYPASS_DETECTED") && index === 1 ? "INVALID" as const : "VALID" as const,
      effective_timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("governance-state-record", base) });
  }));
}

function alignments(agentIds: readonly string[], ctx: GovernanceContext, failures: readonly SharedGovernanceFailure[]): readonly PolicyAlignmentRecord[] {
  return freezeArray(agentIds.map((agentId, index) => {
    const base = {
      agent_id: agentId,
      policy_version: failures.includes("POLICY_DRIFT_DETECTED") && index === 1 ? "governance-policy/v0" : ctx.governance_policy_version,
      constitution_version: failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") && index === 1 ? "constitution/v0" : ctx.constitution_version,
      authority_version: failures.includes("AUTHORITY_POLICY_MISMATCH_DETECTED") && index === 1 ? "authority-policy/v0" : ctx.authority_policy_version,
      compliance_status: failures.includes("INCONSISTENT_RULE_INTERPRETATION_DETECTED") && index === 1 ? "NON_COMPLIANT" as const : "COMPLIANT" as const,
      validation_timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("policy-alignment-record", base) });
  }));
}

function decisions(ctx: GovernanceContext, failures: readonly SharedGovernanceFailure[]): readonly GovernanceDecisionRecord[] {
  return freezeArray(policyTypes.map((policy, index) => {
    const base = {
      decision_id: id("GDEC", "governance-decision", { context: ctx.governance_context_id, policy }),
      governance_context_id: ctx.governance_context_id,
      policy_reference: failures.includes("GOVERNANCE_BYPASS_DETECTED") && index === 1 ? "" : `${policy.toLowerCase()}-policy/v8ALT.7.5`,
      constitutional_reference: ctx.constitution_version,
      decision_result: failures.includes("INCONSISTENT_RULE_INTERPRETATION_DETECTED") && index === 1 ? "REJECT" as const : "ALLOW_RECOMMENDATION" as const,
      decision_reason: "Shared deterministic governance evaluation for advisory coordination.",
      confidence_score: failures.length ? 0.51 : 0.97,
      timestamp: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("governance-decision", base) });
  }));
}

function graph(nodes: readonly GovernanceDecisionRecord[], failures: readonly SharedGovernanceFailure[]): readonly GovernanceInfluenceGraphNode[] {
  return freezeArray(nodes.map((decision, index) => {
    const base = { graph_id: "governance-influence-graph:primary", decision_id: decision.decision_id, policy_node: decision.policy_reference, constitution_node: decision.constitutional_reference, authority_node: failures.includes("AUTHORITY_POLICY_MISMATCH_DETECTED") && index === 1 ? "authority-policy/v0" : "authority-policy/v8ALT.7.5", evidence_node: failures.includes("MISSING_GOVERNANCE_EVIDENCE_DETECTED") && index === 1 ? "" : `evidence:${evidenceSources[index % evidenceSources.length]}`, delegation_node: failures.includes("DELEGATION_BYPASSES_GOVERNANCE") && index === 1 ? "" : "delegation:governed", execution_node: "execution:advisory-only", result_node: decision.decision_result };
    return Object.freeze({ ...base, integrity_hash: hashValue("governance-influence-node", base) });
  }));
}

function conflicts(agentIds: readonly string[], failures: readonly SharedGovernanceFailure[], expected: string): readonly SharedGovernanceConflict[] {
  return freezeArray(failures.filter((failure) => failure !== "INTEGRITY_HASH_INVALID").map((failure) => Object.freeze({ conflict_id: id("SGCF", "shared-governance-conflict", failure), conflict_type: failure, affected_agents: freezeArray(agentIds.slice(0, 2)), expected_context: expected, observed_context: `${expected}:mismatch:${failure}`, severity: "CRITICAL" as const, timestamp: NOW })));
}

export function loadSharedGovernanceContext(input: SharedGovernanceInput = {}): SharedGovernanceContract {
  if (input.contract) return input.contract;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const authority = createAuthoritySeparationContract({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("SGAC", "shared-governance-contract", { mission: authority.mission_id, scenario: input.scenario ?? "BASELINE" });
  const validationId = id("SGAV", "shared-governance-validation", contractId);
  const agents = failures.includes("HIDDEN_GOVERNANCE_EVALUATION_DETECTED") ? authority.participating_agents.slice(1) : authority.participating_agents;
  const ctx = context(validationId, authority.coordination_session_id, authority.mission_id, authority.tenant_id, failures);
  const govStates = statesFor(ctx, failures);
  const matrix = alignments(agents.map((agent) => agent.agent_id), ctx, failures);
  const govDecisions = decisions(ctx, failures);
  const influence = graph(govDecisions, failures);
  const foundConflicts = conflicts(agents.map((agent) => agent.agent_id), failures, ctx.governance_context_id);
  const summary = Object.freeze({ summary_id: id("CSUM", "constitutional-summary", validationId), mission_id: authority.mission_id, constitutional_rules_checked: freezeArray(["mission-legality", "authority-limits", "operator-supremacy", "advisory-only", "tenant-isolation"]), violations_detected: failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") ? freezeArray(["constitutional-version-mismatch"]) : freezeArray<string>([]), governance_actions: freezeArray(["certify-shared-context", "fail-closed-on-drift"]), compliance_score: failures.length ? 0.52 : 1, timestamp: NOW });
  const eventTransitions: [GovernanceSyncState, GovernanceSyncState][] = [["INITIALIZING", "GOVERNANCE_LOADING"], ["GOVERNANCE_LOADING", "POLICY_SYNCHRONIZATION"], ["POLICY_SYNCHRONIZATION", "CONSTITUTION_VALIDATION"], ["CONSTITUTION_VALIDATION", "EVIDENCE_VALIDATION"], ["EVIDENCE_VALIDATION", "DELEGATION_VALIDATION"], ["DELEGATION_VALIDATION", "GOVERNANCE_SYNCHRONIZED"], ["GOVERNANCE_SYNCHRONIZED", "REPLAY_READY"], ["REPLAY_READY", "CERTIFIED"]];
  const events = freezeArray(eventTransitions.map(([previous_state, new_state], index) => {
    const base = { event_id: id("SGEV", "shared-governance-event", { validationId, index }), governance_validation_id: validationId, agent_id: agents[index % agents.length]?.agent_id ?? "agent:unknown", event_type: "governance_state_transition", governance_state: failures.length ? "FAILED" as const : new_state, previous_state, new_state: failures.length ? "FAILED" as const : new_state, policy_reference: ctx.governance_policy_version, constitution_reference: ctx.constitution_version, timestamp: `2026-07-13T21:0${index}:00.000Z` };
    return Object.freeze({ ...base, integrity_hash: hashValue("shared-governance-event", base) });
  }));
  const evidenceRefs = failures.includes("MISSING_GOVERNANCE_EVIDENCE_DETECTED") ? freezeArray<string>([]) : freezeArray(evidenceSources.map((source) => `evidence:${source}:v8ALT.7.5`));
  const evidenceBase = { governance_validation_id: validationId, coordination_session_id: authority.coordination_session_id, mission_id: authority.mission_id, agent_ids: freezeArray(agents.map((agent) => agent.agent_id)), governance_context: ctx.governance_context_id, policy_evidence: freezeArray(govStates.map((state) => state.integrity_hash)), constitutional_evidence: freezeArray([ctx.constitution_version]), authority_evidence: freezeArray(authority.authority_profiles.map((profile) => profile.integrity_hash)), delegation_evidence: failures.includes("DELEGATION_BYPASSES_GOVERNANCE") ? freezeArray<string>([]) : freezeArray(["delegation:governed:v8ALT.7.5"]), truth_ledger_references: evidenceRefs, lineage_reference: `lineage:shared-governance:${contractId}`, replay_reference: failures.includes("GOVERNANCE_REPLAY_MISMATCH_DETECTED") ? "" : `replay:shared-governance:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: hashValue("shared-governance-evidence", evidenceBase) });
  const base = {
    shared_governance_contract_id: contractId,
    governance_validation_id: validationId,
    coordination_session_id: authority.coordination_session_id,
    mission_id: authority.mission_id,
    tenant_id: authority.tenant_id,
    participating_agents: freezeArray(agents),
    governance_context: ctx,
    governance_states: govStates,
    constitution_reference: ctx.constitution_version,
    policy_references: freezeArray([ctx.governance_policy_version, ctx.security_policy_version, ctx.risk_policy_version, ctx.compliance_policy_version]),
    authority_references: freezeArray([ctx.authority_policy_version]),
    evidence_references: evidenceRefs,
    delegation_policy: failures.includes("DELEGATION_BYPASSES_GOVERNANCE") ? freezeArray<string>([]) : freezeArray(["delegation-requires-shared-governance", "operator-visible-delegation-review"]),
    replay_policy: freezeArray(["deterministic-policy-order", "immutable-governance-lineage"]),
    policy_alignment_matrix: matrix,
    governance_decisions: govDecisions,
    influence_graph: influence,
    constitutional_summary: summary,
    conflicts: foundConflicts,
    evidence,
    events,
    created_timestamp: NOW,
    version: VERSION,
    immutable: true as const,
    append_only: true as const,
    operator_visible: !failures.includes("HIDDEN_GOVERNANCE_EVALUATION_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("shared-governance-integrity", { contractId, ctx, matrix, govDecisions, influence, evidence }),
  };
  return Object.freeze({ ...base, contract_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : contractHash(base as Omit<SharedGovernanceContract, "contract_hash">) });
}

export function validateSharedGovernance(contract = loadSharedGovernanceContext()): SharedGovernanceValidationResult {
  const contextIds = new Set([contract.governance_context.governance_context_id, ...contract.governance_states.map((state) => state.governance_context_id)]);
  const context_shared = contextIds.size === 1 && contract.participating_agents.every((agent) => agent.tenant_id === contract.tenant_id);
  const rules_identical = contract.governance_states.every((state) => state.validation_status === "VALID" && state.integrity_hash);
  const constitutional_valid = contract.policy_alignment_matrix.every((row) => row.constitution_version === contract.constitution_reference) && contract.constitutional_summary.violations_detected.length === 0;
  const policyVersions = new Set(contract.policy_alignment_matrix.map((row) => row.policy_version));
  const policy_consistent = policyVersions.size === 1 && contract.policy_alignment_matrix.every((row) => row.compliance_status === "COMPLIANT");
  const decisions_reproducible = contract.governance_decisions.every((decision) => decision.policy_reference && decision.constitutional_reference && decision.integrity_hash);
  const evidence_valid = contract.evidence_references.length === evidenceSources.length && contract.influence_graph.every((node) => node.evidence_node) && contract.evidence.truth_ledger_references.length === evidenceSources.length;
  const delegation_governed = contract.delegation_policy.length > 0 && contract.influence_graph.every((node) => node.delegation_node) && contract.evidence.delegation_evidence.length > 0;
  const authority_policy_synchronized = new Set(contract.policy_alignment_matrix.map((row) => row.authority_version)).size === 1 && contract.authority_references.length > 0 && contract.influence_graph.every((node) => node.authority_node === contract.authority_references[0]);
  const truth_ledger_preserved = contract.evidence.truth_ledger_references.some((ref) => ref.includes("Truth Ledger"));
  const lineage_preserved = Boolean(contract.evidence.lineage_reference);
  const replay_valid = Boolean(contract.evidence.replay_reference) && contract.events.every((event) => event.integrity_hash);
  const integrity_valid = Boolean(contract.integrity_hash && contract.contract_hash) && contractHash(contract) === contract.contract_hash;
  const operator_visible = contract.operator_visible;
  const tenant_isolated = contract.tenant_id.startsWith("tenant:") && contract.governance_context.tenant_id === contract.tenant_id && contract.participating_agents.every((agent) => agent.tenant_id === contract.tenant_id);
  const failures = unique([
    ...(!context_shared ? ["GOVERNANCE_CONTEXT_MISMATCH_DETECTED" as const] : []),
    ...(!rules_identical ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_MISMATCH_DETECTED" as const] : []),
    ...(!policy_consistent ? ["POLICY_DRIFT_DETECTED" as const] : []),
    ...(!decisions_reproducible ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!evidence_valid ? ["MISSING_GOVERNANCE_EVIDENCE_DETECTED" as const] : []),
    ...(!delegation_governed ? ["DELEGATION_BYPASSES_GOVERNANCE" as const] : []),
    ...(!authority_policy_synchronized ? ["AUTHORITY_POLICY_MISMATCH_DETECTED" as const] : []),
    ...(!replay_valid ? ["GOVERNANCE_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!operator_visible ? ["HIDDEN_GOVERNANCE_EVALUATION_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_GOVERNANCE_LEAKAGE_DETECTED" as const] : []),
    ...contract.conflicts.map((conflict) => conflict.conflict_type),
  ]);
  const valid = failures.length === 0;
  const source = { shared_governance_contract_id: contract.shared_governance_contract_id, valid, context_shared, rules_identical, constitutional_valid, policy_consistent, decisions_reproducible, evidence_valid, delegation_governed, authority_policy_synchronized, truth_ledger_preserved, lineage_preserved, replay_valid, integrity_valid, operator_visible, tenant_isolated, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("shared-governance-validation", source) });
}

export function validatePolicySynchronization(input: SharedGovernanceInput = {}) { const validation = validateSharedGovernance(loadSharedGovernanceContext(input)); return { policy_consistent: validation.policy_consistent, authority_policy_synchronized: validation.authority_policy_synchronized, failures: validation.failures }; }
export function validateConstitutionalContext(input: SharedGovernanceInput = {}) { const validation = validateSharedGovernance(loadSharedGovernanceContext(input)); return { constitutional_valid: validation.constitutional_valid, failures: validation.failures }; }
export function validateGovernanceEvidence(input: SharedGovernanceInput = {}) { const validation = validateSharedGovernance(loadSharedGovernanceContext(input)); return { evidence_valid: validation.evidence_valid, truth_ledger_preserved: validation.truth_ledger_preserved, failures: validation.failures }; }
export function generateGovernanceInfluenceGraph(input: SharedGovernanceInput = {}) { return loadSharedGovernanceContext(input).influence_graph; }
export function validateGovernanceReplay(input: SharedGovernanceInput = {}) { const validation = validateSharedGovernance(loadSharedGovernanceContext(input)); return { replay_valid: validation.replay_valid, failures: validation.failures }; }
export function finalizeSharedGovernance(input: SharedGovernanceInput = {}) { return loadSharedGovernanceContext(input); }

export function replaySharedGovernance(contract = loadSharedGovernanceContext()): SharedGovernanceReplayResult {
  const reconstructed_hash = contractHash(contract);
  const source = { replay_reference: `replay:shared-governance:${contract.shared_governance_contract_id}`, shared_governance_contract_id: contract.shared_governance_contract_id, deterministic: reconstructed_hash === contract.contract_hash && Boolean(contract.evidence.replay_reference), reconstructed_hash, original_hash: contract.contract_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("shared-governance-replay", source) });
}

export function buildSharedGovernanceObservabilitySurface(contract = loadSharedGovernanceContext()): SharedGovernanceObservabilitySurface {
  return Object.freeze({ shared_governance_contract_id: contract.shared_governance_contract_id, governance_validation_id: contract.governance_validation_id, tenant_id: contract.tenant_id, mission_id: contract.mission_id, agent_count: contract.participating_agents.length, policy_alignment_count: contract.policy_alignment_matrix.length, decision_count: contract.governance_decisions.length, conflict_count: contract.conflicts.length, state: validateSharedGovernance(contract).valid ? "CERTIFIED" : "FAILED", contract_hash: contract.contract_hash });
}

export function getSharedGovernanceAssurance(): SharedGovernanceAssuranceBundle {
  const contract = loadSharedGovernanceContext();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "SHARED_GOVERNANCE_ASSURANCE_CERTIFIED", states, governance_categories: governanceCategories, policy_types: policyTypes, evidence_sources: evidenceSources, principles: freezeArray(["unified-governance-context", "shared-constitutional-constraints", "policy-consistency", "deterministic-governance-decisions", "common-evidence-references", "governance-aware-delegation", "replayable-governance-evidence", "tenant-isolation", "operator-supremacy", "no-governance-mutation"]) }),
    contract,
    validation: validateSharedGovernance(contract),
    replay: replaySharedGovernance(contract),
    observability: buildSharedGovernanceObservabilitySurface(contract),
  });
}
