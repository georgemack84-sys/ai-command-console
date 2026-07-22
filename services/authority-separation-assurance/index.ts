import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateDelegationMap } from "@/services/deterministic-delegation-assurance";
import type { AgentIdentity, AuthorityCategory } from "@/types/multi-agent-coordination-contract";
import type {
  AuthorityBoundary,
  AuthorityConflict,
  AuthorityContract,
  AuthorityEvent,
  AuthorityFailure,
  AuthorityInput,
  AuthorityObservabilitySurface,
  AuthorityProfileRecord,
  AuthorityReplayResult,
  AuthorityScenario,
  AuthoritySeparationAssuranceBundle,
  AuthorityValidationResult,
  BoundaryViolationAlert,
  EscalationLevel,
  EscalationReview,
} from "@/types/authority-separation-assurance";

const VERSION = "authority-separation-assurance/v8ALT.7.4" as const;
const NOW = "2026-07-13T20:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "AUTHORITY_VALIDATION", "ROLE_VALIDATION", "BOUNDARY_VERIFICATION", "GOVERNANCE_VALIDATION", "TENANT_VALIDATION", "ESCALATION_VALIDATION", "ACTIVE", "REPLAY_READY", "CERTIFIED", "FAILED"] as const);
const escalationLevels = Object.freeze(["NONE", "AGENT", "COORDINATOR", "SUPERVISOR", "GOVERNANCE", "OPERATOR", "CERTIFICATION"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failuresFor(scenario: AuthorityScenario): readonly AuthorityFailure[] {
  const map: Partial<Record<AuthorityScenario, AuthorityFailure>> = {
    AUTHORITY_OVERLAP: "AUTHORITY_OVERLAP_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    UNAUTHORIZED_CONTROL_TRANSFER: "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED",
    HIDDEN_COMMAND_AUTHORITY: "HIDDEN_COMMAND_AUTHORITY_DETECTED",
    PRIVILEGE_LEAKAGE: "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED",
    ROLE_MERGING: "ROLE_SEPARATION_VIOLATED",
    OPERATOR_BYPASS: "OPERATOR_SUPREMACY_VIOLATED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    CROSS_TENANT_AUTHORITY: "CROSS_TENANT_AUTHORITY_DETECTED",
    UNAUTHORIZED_ESCALATION: "UNAUTHORIZED_ESCALATION_DETECTED",
    ADVISORY_EXECUTION: "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION",
    REPLAY_MISMATCH: "AUTHORITY_REPLAY_MISMATCH_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    HIDDEN_AUTHORITY_STATE: "HIDDEN_AUTHORITY_STATE_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function approvedActionsFor(authority: AuthorityCategory): readonly string[] {
  if (authority === "NONE") return freezeArray(["observe"]);
  if (authority === "CERTIFY") return freezeArray(["certify-evidence", "validate-certification"]);
  if (authority === "GOVERNANCE_ADVISORY") return freezeArray(["advise-governance", "review-policy"]);
  return freezeArray(["recommend", "analyze", "validate-evidence"]);
}

function profiles(agents: readonly AgentIdentity[], failures: readonly AuthorityFailure[], mission: string, tenant: string): readonly AuthorityProfileRecord[] {
  return freezeArray(agents.map((agent, index) => {
    const authority = failures.includes("AUTHORITY_ESCALATION_DETECTED") && index === 1 ? "CERTIFY" as AuthorityCategory : failures.includes("AUTHORITY_OVERLAP_DETECTED") && index < 2 ? "SUPERVISE" as AuthorityCategory : agent.authority_profile;
    const base = {
      authority_profile_id: id("AUTH", "authority-profile", { agent: agent.agent_id, authority }),
      agent_id: agent.agent_id,
      role: failures.includes("ROLE_SEPARATION_VIOLATED") && index === 1 ? agents[0]?.role ?? agent.role : agent.role,
      authority_level: authority,
      approved_actions: failures.includes("ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION") && index === 1 ? freezeArray(["execute-protected-action"]) : approvedActionsFor(authority),
      restricted_actions: failures.includes("HIDDEN_COMMAND_AUTHORITY_DETECTED") && index === 1 ? freezeArray([]) : freezeArray(["execute-actions", "modify-governance", "modify-policy", "delegate-execution-authority", "alter-mission-state", "override-operator"]),
      delegation_permissions: failures.includes("UNAUTHORIZED_CONTROL_TRANSFER_DETECTED") && index === 1 ? freezeArray(["transfer-control"]) : freezeArray(["recommend-delegation-only"]),
      escalation_permissions: failures.includes("UNAUTHORIZED_ESCALATION_DETECTED") && index === 1 ? freezeArray(["CERTIFICATION"] as EscalationLevel[]) : freezeArray(["NONE", "OPERATOR"] as EscalationLevel[]),
      operator_override: "OPERATOR_ONLY" as const,
      governance_binding: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "" : "governance:authority:v8ALT.7.4",
      constitutional_binding: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? "" : "constitution:authority:v8ALT.7.4",
      tenant_scope: failures.includes("CROSS_TENANT_AUTHORITY_DETECTED") && index === 1 ? "external-tenant" : tenant,
      mission_scope: mission,
      immutable: true as const,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("authority-profile-record", base) });
  }));
}

function boundaries(items: readonly AuthorityProfileRecord[], failures: readonly AuthorityFailure[]): readonly AuthorityBoundary[] {
  return freezeArray(items.map((profile) => {
    const valid = Boolean(profile.governance_binding && profile.constitutional_binding && profile.restricted_actions.length > 0 && !failures.includes("HIDDEN_AUTHORITY_STATE_DETECTED"));
    const base = { boundary_id: id("BND", "authority-boundary", profile.authority_profile_id), agent_id: profile.agent_id, authority_scope: profile.authority_level, role_scope: profile.role, mission_scope: profile.mission_scope, tenant_scope: profile.tenant_scope, governance_scope: profile.governance_binding, constitutional_scope: profile.constitutional_binding, validation_status: valid ? "VALID" as const : "INVALID" as const };
    return Object.freeze({ ...base, integrity_hash: hashValue("authority-boundary", base) });
  }));
}

function conflicts(agentIds: readonly string[], failures: readonly AuthorityFailure[]): readonly AuthorityConflict[] {
  const make = (type: AuthorityConflict["conflict_type"], failure: AuthorityFailure) => Object.freeze({ conflict_id: id("ACON", "authority-conflict", { type, failure }), affected_agents: freezeArray(agentIds.slice(0, 2)), conflict_type: type, severity: "CRITICAL" as const, authority_reference: `authority:${failure}`, recommended_action: "Fail closed and require operator/governance review.", timestamp: NOW });
  return freezeArray([
    failures.includes("AUTHORITY_OVERLAP_DETECTED") ? make("OVERLAP", "AUTHORITY_OVERLAP_DETECTED") : null,
    failures.includes("AUTHORITY_ESCALATION_DETECTED") || failures.includes("UNAUTHORIZED_ESCALATION_DETECTED") ? make("ESCALATION", failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "AUTHORITY_ESCALATION_DETECTED" : "UNAUTHORIZED_ESCALATION_DETECTED") : null,
    failures.includes("UNAUTHORIZED_CONTROL_TRANSFER_DETECTED") ? make("CONTROL_TRANSFER", "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED") : null,
    failures.includes("HIDDEN_COMMAND_AUTHORITY_DETECTED") ? make("HIDDEN_COMMAND", "HIDDEN_COMMAND_AUTHORITY_DETECTED") : null,
    failures.includes("CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED") ? make("PRIVILEGE_LEAKAGE", "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED") : null,
    failures.includes("ROLE_SEPARATION_VIOLATED") ? make("ROLE_MERGING", "ROLE_SEPARATION_VIOLATED") : null,
    failures.includes("OPERATOR_SUPREMACY_VIOLATED") ? make("OPERATOR_BYPASS", "OPERATOR_SUPREMACY_VIOLATED") : null,
    failures.includes("GOVERNANCE_BYPASS_DETECTED") ? make("GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED") : null,
    failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? make("CONSTITUTIONAL", "CONSTITUTIONAL_VIOLATION_DETECTED") : null,
    failures.includes("CROSS_TENANT_AUTHORITY_DETECTED") ? make("TENANT", "CROSS_TENANT_AUTHORITY_DETECTED") : null,
    failures.includes("ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION") ? make("ADVISORY_EXECUTION", "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION") : null,
    failures.includes("AUTHORITY_REPLAY_MISMATCH_DETECTED") ? make("REPLAY", "AUTHORITY_REPLAY_MISMATCH_DETECTED") : null,
    failures.includes("INTEGRITY_HASH_INVALID") ? make("INTEGRITY", "INTEGRITY_HASH_INVALID") : null,
    failures.includes("HIDDEN_AUTHORITY_STATE_DETECTED") ? make("HIDDEN_STATE", "HIDDEN_AUTHORITY_STATE_DETECTED") : null,
  ].filter(Boolean) as AuthorityConflict[]);
}

function alerts(found: readonly AuthorityConflict[]): readonly BoundaryViolationAlert[] {
  const failureByType: Record<AuthorityConflict["conflict_type"], AuthorityFailure> = {
    OVERLAP: "AUTHORITY_OVERLAP_DETECTED", ESCALATION: "AUTHORITY_ESCALATION_DETECTED", CONTROL_TRANSFER: "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED", HIDDEN_COMMAND: "HIDDEN_COMMAND_AUTHORITY_DETECTED", PRIVILEGE_LEAKAGE: "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED", ROLE_MERGING: "ROLE_SEPARATION_VIOLATED", OPERATOR_BYPASS: "OPERATOR_SUPREMACY_VIOLATED", GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED", CONSTITUTIONAL: "CONSTITUTIONAL_VIOLATION_DETECTED", TENANT: "CROSS_TENANT_AUTHORITY_DETECTED", ADVISORY_EXECUTION: "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION", REPLAY: "AUTHORITY_REPLAY_MISMATCH_DETECTED", INTEGRITY: "INTEGRITY_HASH_INVALID", HIDDEN_STATE: "HIDDEN_AUTHORITY_STATE_DETECTED",
  };
  return freezeArray(found.map((conflict) => Object.freeze({ alert_id: id("ALRT", "authority-alert", conflict.conflict_id), agent_id: conflict.affected_agents[0] ?? "agent:unknown", violation_type: failureByType[conflict.conflict_type], authority_reference: conflict.authority_reference, severity: conflict.severity, detected_timestamp: conflict.timestamp, recommended_response: conflict.recommended_action })));
}

function contractHash(contract: Omit<AuthorityContract, "contract_hash"> | AuthorityContract): string {
  const { contract_hash: _hash, ...source } = contract as AuthorityContract;
  return hashValue("authority-separation-contract", source);
}

export function createAuthoritySeparationContract(input: AuthorityInput = {}): AuthorityContract {
  if (input.contract) return input.contract;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const delegation = generateDelegationMap({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("ASAC", "authority-separation-contract", { mission: delegation.mission_id, scenario: input.scenario ?? "BASELINE" });
  const validationId = id("ASAV", "authority-separation-validation", contractId);
  const profileRecords = profiles(delegation.participating_agents, failures, delegation.mission_id, delegation.tenant_id);
  const boundaryRecords = boundaries(profileRecords, failures);
  const foundConflicts = conflicts(profileRecords.map((profile) => profile.agent_id), failures);
  const escalationReviews: EscalationReview[] = profileRecords.slice(0, 2).map((profile, index) => {
    const level = failures.includes("UNAUTHORIZED_ESCALATION_DETECTED") && index === 1 ? "CERTIFICATION" as EscalationLevel : "OPERATOR" as EscalationLevel;
    const base = { escalation_id: id("ESC", "authority-escalation", { validationId, agent: profile.agent_id }), requesting_agent: profile.agent_id, receiving_authority: level === "OPERATOR" ? "operator" : "certification-authority", escalation_level: level, reason: "authority boundary review", governance_validation: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "INVALID" as const : "VALID" as const, operator_required: true, status: failures.length ? "BLOCKED" as const : "APPROVED_FOR_REVIEW" as const, timestamp: NOW };
    return Object.freeze({ ...base, integrity_hash: hashValue("authority-escalation-review", base) });
  });
  const eventTransitions: [AuthorityEvent["previous_state"], AuthorityEvent["new_state"]][] = [["INITIALIZING", "AUTHORITY_VALIDATION"], ["AUTHORITY_VALIDATION", "ROLE_VALIDATION"], ["ROLE_VALIDATION", "BOUNDARY_VERIFICATION"], ["BOUNDARY_VERIFICATION", "GOVERNANCE_VALIDATION"], ["GOVERNANCE_VALIDATION", "TENANT_VALIDATION"], ["TENANT_VALIDATION", "ESCALATION_VALIDATION"], ["ESCALATION_VALIDATION", "REPLAY_READY"], ["REPLAY_READY", "CERTIFIED"]];
  const events = freezeArray(eventTransitions.map(([previous_state, new_state], index) => {
    const base = { event_id: id("AUEV", "authority-event", { validationId, index }), authority_validation_id: validationId, agent_id: profileRecords[index % profileRecords.length]?.agent_id ?? "agent:unknown", event_type: "authority_state_transition", authority_state: failures.length ? "FAILED" as const : new_state, previous_state, new_state: failures.length ? "FAILED" as const : new_state, authority_reference: profileRecords[index % profileRecords.length]?.authority_profile_id ?? "", governance_reference: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "" : "governance:authority:v8ALT.7.4", timestamp: `2026-07-13T20:0${index}:00.000Z` };
    return Object.freeze({ ...base, integrity_hash: hashValue("authority-event", base) });
  }));
  const evidenceBase = { authority_validation_id: validationId, coordination_session_id: delegation.coordination_session_id, mission_id: delegation.mission_id, agent_ids: freezeArray(profileRecords.map((profile) => profile.agent_id)), authority_profiles: freezeArray(profileRecords.map((profile) => profile.integrity_hash)), boundary_evidence: freezeArray(boundaryRecords.map((boundary) => boundary.integrity_hash)), role_evidence: freezeArray(profileRecords.map((profile) => `${profile.agent_id}:${profile.role}`)), governance_evidence: freezeArray(profileRecords.map((profile) => profile.governance_binding).filter(Boolean)), constitutional_evidence: freezeArray(profileRecords.map((profile) => profile.constitutional_binding).filter(Boolean)), tenant_evidence: freezeArray(profileRecords.map((profile) => profile.tenant_scope)), escalation_evidence: freezeArray(escalationReviews.map((review) => review.integrity_hash)), replay_reference: failures.includes("AUTHORITY_REPLAY_MISMATCH_DETECTED") ? "" : `replay:authority:${contractId}`, lineage_reference: `lineage:authority:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: hashValue("authority-evidence", evidenceBase) });
  const base = {
    authority_contract_id: contractId,
    authority_validation_id: validationId,
    coordination_session_id: delegation.coordination_session_id,
    mission_id: delegation.mission_id,
    tenant_id: delegation.tenant_id,
    participating_agents: freezeArray(delegation.participating_agents),
    authority_profiles: profileRecords,
    role_assignments: freezeArray(profileRecords.map((profile) => `${profile.agent_id}:${profile.role}`)),
    authority_boundaries: boundaryRecords,
    delegation_permissions: freezeArray(["recommend-delegation-only", "no-execution-authority-transfer"]),
    escalation_policy: freezeArray(["operator-required", "governance-validated", "deterministic-path"]),
    governance_policy: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? freezeArray<string>([]) : freezeArray(["governance-supremacy", "governance-validation-required"]),
    constitutional_policy: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? freezeArray<string>([]) : freezeArray(["constitutional-supremacy", "constitutional-validation-required"]),
    operator_supremacy_policy: failures.includes("OPERATOR_SUPREMACY_VIOLATED") ? freezeArray<string>([]) : freezeArray(["operator-approve", "operator-reject", "operator-pause", "operator-terminate", "operator-revoke"]),
    advisory_only_policy: freezeArray(["no-execute-actions", "no-modify-governance", "no-modify-policy", "no-delegate-execution-authority", "no-alter-mission-state"]),
    conflicts: foundConflicts,
    escalation_reviews: freezeArray(escalationReviews),
    violation_alerts: alerts(foundConflicts),
    evidence,
    events,
    created_timestamp: NOW,
    version: VERSION,
    immutable: true as const,
    append_only: true as const,
    operator_visible: !failures.includes("HIDDEN_AUTHORITY_STATE_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("authority-integrity", { contractId, profileRecords, boundaryRecords, evidence, events }),
  };
  return Object.freeze({ ...base, contract_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : contractHash(base as Omit<AuthorityContract, "contract_hash">) });
}

export function validateAuthoritySeparation(contract = createAuthoritySeparationContract()): AuthorityValidationResult {
  const profileIds = contract.authority_profiles.map((profile) => profile.agent_id);
  const rolePairs = contract.authority_profiles.map((profile) => profile.role);
  const profiles_deterministic = new Set(profileIds).size === profileIds.length && contract.authority_profiles.every((profile) => profile.immutable && profile.integrity_hash);
  const boundaries_valid = contract.authority_boundaries.every((boundary) => boundary.validation_status === "VALID" && boundary.integrity_hash);
  const role_separation_valid = new Set(rolePairs).size === rolePairs.length;
  const operator_supremacy_valid = contract.operator_supremacy_policy.length > 0 && contract.authority_profiles.every((profile) => profile.operator_override === "OPERATOR_ONLY" && !profile.approved_actions.includes("override-operator"));
  const governance_valid = contract.governance_policy.length > 0 && contract.authority_profiles.every((profile) => profile.governance_binding) && contract.events.every((event) => event.governance_reference);
  const constitutional_valid = contract.constitutional_policy.length > 0 && contract.authority_profiles.every((profile) => profile.constitutional_binding);
  const tenant_isolated = contract.tenant_id.startsWith("tenant:") && contract.authority_profiles.every((profile) => profile.tenant_scope === contract.tenant_id);
  const escalation_valid = contract.escalation_reviews.every((review) => review.operator_required && review.governance_validation === "VALID" && review.escalation_level !== "CERTIFICATION");
  const advisory_only_valid = contract.authority_profiles.every((profile) => !profile.approved_actions.includes("execute-protected-action") && profile.restricted_actions.includes("execute-actions") && !profile.delegation_permissions.includes("transfer-control"));
  const conflict_free = contract.conflicts.length === 0;
  const replay_valid = Boolean(contract.evidence.replay_reference) && contract.events.every((event) => event.integrity_hash);
  const lineage_preserved = Boolean(contract.evidence.lineage_reference) && contract.authority_profiles.every((profile) => profile.authority_profile_id);
  const integrity_valid = Boolean(contract.integrity_hash && contract.contract_hash) && contractHash(contract) === contract.contract_hash;
  const operator_visible = contract.operator_visible;
  const failures = unique([
    ...(!profiles_deterministic ? ["HIDDEN_AUTHORITY_STATE_DETECTED" as const] : []),
    ...(!boundaries_valid ? ["HIDDEN_COMMAND_AUTHORITY_DETECTED" as const] : []),
    ...(!role_separation_valid ? ["ROLE_SEPARATION_VIOLATED" as const] : []),
    ...(!operator_supremacy_valid ? ["OPERATOR_SUPREMACY_VIOLATED" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_AUTHORITY_DETECTED" as const] : []),
    ...(!escalation_valid ? ["UNAUTHORIZED_ESCALATION_DETECTED" as const] : []),
    ...(!advisory_only_valid ? [contract.authority_profiles.some((profile) => profile.approved_actions.includes("execute-protected-action")) ? "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION" as const : "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED" as const] : []),
    ...(!conflict_free ? contract.conflicts.map((conflict) => conflict.conflict_type === "ESCALATION" ? "AUTHORITY_ESCALATION_DETECTED" as const : conflict.conflict_type === "CONTROL_TRANSFER" ? "UNAUTHORIZED_CONTROL_TRANSFER_DETECTED" as const : conflict.conflict_type === "PRIVILEGE_LEAKAGE" ? "CROSS_AGENT_PRIVILEGE_LEAKAGE_DETECTED" as const : conflict.conflict_type === "REPLAY" ? "AUTHORITY_REPLAY_MISMATCH_DETECTED" as const : conflict.conflict_type === "HIDDEN_STATE" ? "HIDDEN_AUTHORITY_STATE_DETECTED" as const : conflict.conflict_type === "HIDDEN_COMMAND" ? "HIDDEN_COMMAND_AUTHORITY_DETECTED" as const : conflict.conflict_type === "ADVISORY_EXECUTION" ? "ADVISORY_AGENT_EXECUTED_PROTECTED_ACTION" as const : conflict.conflict_type === "OPERATOR_BYPASS" ? "OPERATOR_SUPREMACY_VIOLATED" as const : conflict.conflict_type === "GOVERNANCE_BYPASS" ? "GOVERNANCE_BYPASS_DETECTED" as const : conflict.conflict_type === "CONSTITUTIONAL" ? "CONSTITUTIONAL_VIOLATION_DETECTED" as const : conflict.conflict_type === "TENANT" ? "CROSS_TENANT_AUTHORITY_DETECTED" as const : conflict.conflict_type === "INTEGRITY" ? "INTEGRITY_HASH_INVALID" as const : conflict.conflict_type === "ROLE_MERGING" ? "ROLE_SEPARATION_VIOLATED" as const : "AUTHORITY_OVERLAP_DETECTED" as const) : []),
    ...(!replay_valid ? ["AUTHORITY_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!operator_visible ? ["HIDDEN_AUTHORITY_STATE_DETECTED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { authority_contract_id: contract.authority_contract_id, valid, profiles_deterministic, boundaries_valid, role_separation_valid, operator_supremacy_valid, governance_valid, constitutional_valid, tenant_isolated, escalation_valid, advisory_only_valid, conflict_free, replay_valid, lineage_preserved, integrity_valid, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("authority-validation", source) });
}

export function validateAuthorityProfiles(input: AuthorityInput = {}) { const validation = validateAuthoritySeparation(createAuthoritySeparationContract(input)); return { profiles_deterministic: validation.profiles_deterministic, boundaries_valid: validation.boundaries_valid, failures: validation.failures }; }
export function verifyRoleSeparation(input: AuthorityInput = {}) { const validation = validateAuthoritySeparation(createAuthoritySeparationContract(input)); return { role_separation_valid: validation.role_separation_valid, failures: validation.failures }; }
export function validateEscalation(input: AuthorityInput = {}) { const validation = validateAuthoritySeparation(createAuthoritySeparationContract(input)); return { escalation_valid: validation.escalation_valid, failures: validation.failures }; }
export function detectAuthorityConflicts(input: AuthorityInput = {}) { return createAuthoritySeparationContract(input).conflicts; }
export function generateAuthorityConflictMap(input: AuthorityInput = {}) { const contract = createAuthoritySeparationContract(input); return { conflicts: contract.conflicts, alerts: contract.violation_alerts, boundaries: contract.authority_boundaries }; }
export function validateAuthorityReplay(input: AuthorityInput = {}) { const validation = validateAuthoritySeparation(createAuthoritySeparationContract(input)); return { replay_valid: validation.replay_valid, failures: validation.failures }; }
export function finalizeAuthoritySeparation(input: AuthorityInput = {}) { return createAuthoritySeparationContract(input); }

export function replayAuthoritySeparation(contract = createAuthoritySeparationContract()): AuthorityReplayResult {
  const reconstructed_hash = contractHash(contract);
  const source = { replay_reference: `replay:authority:${contract.authority_contract_id}`, authority_contract_id: contract.authority_contract_id, deterministic: reconstructed_hash === contract.contract_hash && Boolean(contract.evidence.replay_reference), reconstructed_hash, original_hash: contract.contract_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("authority-replay", source) });
}

export function buildAuthorityObservabilitySurface(contract = createAuthoritySeparationContract()): AuthorityObservabilitySurface {
  return Object.freeze({ authority_contract_id: contract.authority_contract_id, authority_validation_id: contract.authority_validation_id, tenant_id: contract.tenant_id, mission_id: contract.mission_id, profile_count: contract.authority_profiles.length, boundary_count: contract.authority_boundaries.length, conflict_count: contract.conflicts.length, alert_count: contract.violation_alerts.length, state: validateAuthoritySeparation(contract).valid ? "CERTIFIED" : "FAILED", contract_hash: contract.contract_hash });
}

export function getAuthoritySeparationAssurance(): AuthoritySeparationAssuranceBundle {
  const contract = createAuthoritySeparationContract();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "AUTHORITY_SEPARATION_ASSURANCE_CERTIFIED", states, escalation_levels: escalationLevels, principles: freezeArray(["explicit-authority-boundaries", "role-separation", "operator-supremacy", "governance-supremacy", "constitutional-supremacy", "tenant-isolation", "deterministic-escalation-review", "advisory-only-enforcement", "privilege-leakage-detection", "replayable-authority-evidence"]) }),
    contract,
    validation: validateAuthoritySeparation(contract),
    replay: replayAuthoritySeparation(contract),
    observability: buildAuthorityObservabilitySurface(contract),
  });
}
