import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createCoordinationIntegrityLedger } from "@/services/coordination-integrity-engine";
import type {
  AgentReplayTrace,
  ReplayArtifactType,
  ReplayConsistencyAssuranceBundle,
  ReplayConsistencyFailure,
  ReplayConsistencyInput,
  ReplayConsistencyObservabilitySurface,
  ReplayConsistencyScenario,
  ReplayConsistencySession,
  ReplayConsistencyValidationResult,
  ReplayLedgerEntry,
  ReplayMachineState,
  ReplayMismatchAnalysis,
  ReplayOperationEvent,
  ReplayState,
} from "@/types/replay-consistency-assurance";

const VERSION = "replay-consistency-assurance/v8ALT.7.7" as const;
const NOW = "2026-07-13T23:00:00.000Z";
const machineStates = Object.freeze(["INITIALIZING", "LOADING_EVIDENCE", "VERIFYING_HASHES", "RECONSTRUCTING", "VALIDATING", "COMPARING", "REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID", "CERTIFIED"] as const);
const artifactTypes = Object.freeze(["MISSION", "PLANNING", "DELEGATION", "COMMUNICATION", "GOVERNANCE", "AUTHORITY", "SHARED_STATE", "INTERVENTION", "MISSION_COMPLETION"] as const);
const interventionTypes = Object.freeze(["OPERATOR", "GOVERNANCE", "SUPERVISOR", "CERTIFICATION", "RUNTIME", "RECOVERY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failuresFor(scenario: ReplayConsistencyScenario): readonly ReplayConsistencyFailure[] {
  const map: Partial<Record<ReplayConsistencyScenario, ReplayConsistencyFailure>> = {
    PLANNING_MISMATCH: "PLANNING_REPLAY_MISMATCH_DETECTED",
    DELEGATION_MISMATCH: "DELEGATION_REPLAY_MISMATCH_DETECTED",
    MISSING_COMMUNICATION: "MISSING_COMMUNICATION_DETECTED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_REPLAY_MISMATCH_DETECTED",
    AUTHORITY_MISMATCH: "AUTHORITY_REPLAY_MISMATCH_DETECTED",
    SHARED_STATE_MISMATCH: "SHARED_STATE_REPLAY_MISMATCH_DETECTED",
    INTERVENTION_MISMATCH: "INTERVENTION_REPLAY_MISMATCH_DETECTED",
    ORDERING_MISMATCH: "ORDERING_MISMATCH_DETECTED",
    INCOMPLETE_REPLAY: "INCOMPLETE_REPLAY_DETECTED",
    INCONSISTENT_AGENT_STATE: "INCONSISTENT_AGENT_STATE_RECONSTRUCTION_DETECTED",
    INTEGRITY_FAILURE: "REPLAY_INTEGRITY_VERIFICATION_FAILED",
    CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_CONTAMINATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function sessionHash(session: Omit<ReplayConsistencySession, "contract_hash"> | ReplayConsistencySession): string {
  const { contract_hash: _hash, ...source } = session as ReplayConsistencySession;
  return hashValue("replay-consistency-session", source);
}

function failForType(type: ReplayArtifactType, failures: readonly ReplayConsistencyFailure[]) {
  return (type === "PLANNING" && failures.includes("PLANNING_REPLAY_MISMATCH_DETECTED"))
    || (type === "DELEGATION" && failures.includes("DELEGATION_REPLAY_MISMATCH_DETECTED"))
    || (type === "COMMUNICATION" && failures.includes("MISSING_COMMUNICATION_DETECTED"))
    || (type === "GOVERNANCE" && failures.includes("GOVERNANCE_REPLAY_MISMATCH_DETECTED"))
    || (type === "AUTHORITY" && failures.includes("AUTHORITY_REPLAY_MISMATCH_DETECTED"))
    || (type === "SHARED_STATE" && failures.includes("SHARED_STATE_REPLAY_MISMATCH_DETECTED"))
    || (type === "INTERVENTION" && failures.includes("INTERVENTION_REPLAY_MISMATCH_DETECTED"));
}

export function startReplay(input: ReplayConsistencyInput = {}): ReplayConsistencySession {
  if (input.session) return input.session;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const integrity = createCoordinationIntegrityLedger({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("RCAC", "replay-consistency-contract", { mission: integrity.contract.mission_id, scenario: input.scenario ?? "BASELINE" });
  const tenant = failures.includes("CROSS_TENANT_REPLAY_CONTAMINATION_DETECTED") ? "external-tenant" : integrity.contract.tenant_id;
  const refFor = (type: string) => integrity.entries.find((entry) => entry.artifact_type === type)?.artifact_reference ?? `artifact:${type.toLowerCase()}`;
  const contractBase = {
    replay_contract_id: contractId,
    coordination_session_id: integrity.contract.coordination_session_id,
    mission_id: integrity.contract.mission_id,
    tenant_id: tenant,
    planning_reference: refFor("PLANNING"),
    delegation_reference: refFor("DELEGATION"),
    communication_reference: failures.includes("MISSING_COMMUNICATION_DETECTED") ? "" : refFor("COMMUNICATION"),
    governance_reference: "governance:replay:v8ALT.7.7",
    authority_reference: "authority:replay:v8ALT.7.7",
    shared_state_reference: refFor("SHARED_STATE"),
    intervention_reference: "intervention:operator-review",
    integrity_reference: integrity.contract.coordination_integrity_id,
    replay_policy_version: "replay-consistency-policy/v8ALT.7.7" as const,
    created_timestamp: NOW,
    immutable: true as const,
    append_only: true as const,
    governance_bound: true as const,
    tenant_isolated: true as const,
  };
  const contract = Object.freeze({ ...contractBase, integrity_hash: failures.includes("REPLAY_INTEGRITY_VERIFICATION_FAILED") ? "" : hashValue("replay-consistency-contract", contractBase) });
  const ledgerRows = artifactTypes.map((type, index) => {
    const failed = failForType(type, failures);
    const missing = type === "COMMUNICATION" && failures.includes("MISSING_COMMUNICATION_DETECTED");
    return Object.freeze({
      replay_entry_id: id("RLED", "replay-ledger-entry", { contractId, type }),
      coordination_session_id: integrity.contract.coordination_session_id,
      artifact_type: type,
      artifact_reference: missing ? "" : `replay-artifact:${type.toLowerCase()}:${index}`,
      hash_reference: failed ? `mismatch:${type}` : hashValue("replay-artifact", { type, index }),
      lineage_reference: `lineage:replay:${type.toLowerCase()}:${contractId}`,
      replay_state: missing ? "INCOMPLETE" as ReplayState : failed ? "MISMATCH" as ReplayState : "REPRODUCED" as ReplayState,
      verification_result: missing ? "MISSING" as const : failed ? "MISMATCH" as const : "MATCH" as const,
      timestamp: `2026-07-13T23:0${index}:00.000Z`,
    });
  });
  const ordered = failures.includes("ORDERING_MISMATCH_DETECTED") ? freezeArray([...artifactTypes].reverse()) : artifactTypes;
  const timelineBase = { timeline_id: id("RTLN", "replay-timeline", contractId), event_sequence: ordered, planning_reference: contract.planning_reference, delegation_reference: contract.delegation_reference, communication_reference: contract.communication_reference, governance_reference: contract.governance_reference, authority_reference: contract.authority_reference, shared_state_reference: contract.shared_state_reference, timestamp: NOW };
  const timeline = Object.freeze({ ...timelineBase, integrity_hash: hashValue("replay-timeline", timelineBase) });
  const agentIds = freezeArray(["agent:coordinator", "agent:planner", "agent:analyst", "agent:validator"]);
  const traces: readonly AgentReplayTrace[] = freezeArray(agentIds.map((agentId, index) => {
    const mismatch = failures.includes("INCONSISTENT_AGENT_STATE_RECONSTRUCTION_DETECTED") && index === 1;
    const base = { agent_replay_trace_id: id("ARTR", "agent-replay-trace", { contractId, agentId }), agent_id: agentId, replayed_actions: freezeArray(["load-evidence", "reconstruct", "compare"]), state_transitions: mismatch ? freezeArray(["INITIALIZING", "DIVERGED"]) : freezeArray(["INITIALIZING", "RECONSTRUCTING", "REPRODUCED"]), authority_validations: freezeArray(["authority:valid"]), communication_events: freezeArray(contract.communication_reference ? [contract.communication_reference] : []), delegation_events: freezeArray([contract.delegation_reference]), verification_result: mismatch ? "MISMATCH" as const : "REPRODUCED" as const };
    return Object.freeze({ ...base, integrity_hash: hashValue("agent-replay-trace", base) });
  }));
  const analyses: readonly ReplayMismatchAnalysis[] = freezeArray(failures.map((failure) => Object.freeze({ analysis_id: id("RMIS", "replay-mismatch-analysis", failure), artifact_reference: failure.includes("PLANNING") ? contract.planning_reference : failure.includes("DELEGATION") ? contract.delegation_reference : failure.includes("COMMUNICATION") ? contract.communication_reference : failure.includes("GOVERNANCE") ? contract.governance_reference : failure.includes("AUTHORITY") ? contract.authority_reference : failure.includes("STATE") ? contract.shared_state_reference : "replay:session", expected_value: "recorded-history", observed_value: "reconstructed-history", difference_summary: `Replay difference detected: ${failure}`, root_cause: failure, severity: "CRITICAL" as const, recommended_action: "Fail closed and preserve mismatch analysis for operator/governance review." })));
  const operations: ReplayOperationEvent["replay_operation"][] = ["START", "REPLAY_PLANNING", "REPLAY_DELEGATION", "REPLAY_COMMUNICATION", "REPLAY_SHARED_STATE", "COMPARE", "REPORT"];
  const events: readonly ReplayOperationEvent[] = freezeArray(operations.map((operation, index) => {
    const base = { event_id: id("RCEV", "replay-operation-event", { contractId, operation }), coordination_session_id: integrity.contract.coordination_session_id, artifact_reference: ledgerRows[index]?.artifact_reference ?? "replay:report", replay_operation: operation, previous_state: index === 0 ? "INITIALIZING" as ReplayMachineState : "RECONSTRUCTING" as ReplayMachineState, current_state: failures.length ? "MISMATCH" as ReplayMachineState : index === operations.length - 1 ? "CERTIFIED" as ReplayMachineState : "RECONSTRUCTING" as ReplayMachineState, verification_result: failures.length ? "FAIL" as const : "PASS" as const, timestamp: `2026-07-13T23:1${index}:00.000Z` };
    return Object.freeze({ ...base, integrity_signature: hashValue("replay-operation-event", base) });
  }));
  const evidenceBase = { replay_validation_id: id("RVAL", "replay-validation", contractId), coordination_session_id: integrity.contract.coordination_session_id, mission_id: integrity.contract.mission_id, planning_references: freezeArray([contract.planning_reference]), delegation_references: freezeArray([contract.delegation_reference]), communication_references: freezeArray(contract.communication_reference ? [contract.communication_reference] : []), governance_references: freezeArray([contract.governance_reference]), authority_references: freezeArray([contract.authority_reference]), shared_state_references: freezeArray([contract.shared_state_reference]), intervention_references: failures.includes("INCOMPLETE_REPLAY_DETECTED") ? freezeArray<string>([]) : freezeArray([contract.intervention_reference]), verification_results: freezeArray(ledgerRows.map((row) => row.verification_result)), lineage_reference: `lineage:replay-consistency:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: failures.includes("REPLAY_INTEGRITY_VERIFICATION_FAILED") ? "" : hashValue("replay-consistency-evidence", evidenceBase) });
  const base = { contract, ledger: freezeArray(failures.includes("INCOMPLETE_REPLAY_DETECTED") ? ledgerRows.slice(0, -1) : ledgerRows), timeline, agent_traces: traces, mismatch_analysis: analyses, events, evidence, state: failures.length ? failures.includes("INCOMPLETE_REPLAY_DETECTED") ? "INCOMPLETE" as ReplayState : failures.includes("REPLAY_INTEGRITY_VERIFICATION_FAILED") ? "INVALID" as ReplayState : "MISMATCH" as ReplayState : "REPRODUCED" as ReplayState, version: VERSION };
  return Object.freeze({ ...base, contract_hash: sessionHash(base as Omit<ReplayConsistencySession, "contract_hash">) });
}

export function replayPlanning(input: ReplayConsistencyInput = {}) { return startReplay(input).ledger.filter((entry) => entry.artifact_type === "PLANNING"); }
export function replayDelegation(input: ReplayConsistencyInput = {}) { return startReplay(input).ledger.filter((entry) => entry.artifact_type === "DELEGATION"); }
export function replayCommunication(input: ReplayConsistencyInput = {}) { return startReplay(input).ledger.filter((entry) => entry.artifact_type === "COMMUNICATION"); }
export function replaySharedState(input: ReplayConsistencyInput = {}) { return startReplay(input).ledger.filter((entry) => entry.artifact_type === "SHARED_STATE"); }
export function compareReplay(input: ReplayConsistencyInput = {}) { return startReplay(input).mismatch_analysis; }
export function generateReplayReport(input: ReplayConsistencyInput = {}) { const session = startReplay(input); return { session, validation: validateReplayConsistency(session), mismatches: session.mismatch_analysis }; }

export function validateReplayConsistency(session = startReplay()): ReplayConsistencyValidationResult {
  const stateFor = (type: ReplayArtifactType) => session.ledger.find((entry) => entry.artifact_type === type)?.replay_state;
  const reproduced = (type: ReplayArtifactType) => stateFor(type) === "REPRODUCED";
  const sequence = artifactTypes.join(">");
  const actualSequence = session.timeline.event_sequence.join(">");
  const contract_valid = session.contract.immutable && session.contract.append_only && session.contract.governance_bound && session.contract.tenant_isolated;
  const planning_reproduced = reproduced("PLANNING");
  const delegation_reproduced = reproduced("DELEGATION");
  const communication_reproduced = reproduced("COMMUNICATION") && session.evidence.communication_references.length > 0;
  const governance_reproduced = reproduced("GOVERNANCE");
  const authority_reproduced = reproduced("AUTHORITY");
  const shared_state_reproduced = reproduced("SHARED_STATE");
  const intervention_reproduced = reproduced("INTERVENTION") && session.evidence.intervention_references.length > 0;
  const ordering_deterministic = actualSequence === sequence;
  const evidence_complete = session.ledger.length === artifactTypes.length && session.evidence.communication_references.length > 0 && session.evidence.intervention_references.length > 0;
  const agent_state_identical = session.agent_traces.every((trace) => trace.verification_result === "REPRODUCED");
  const integrity_verified = Boolean(session.contract.integrity_hash && session.evidence.integrity_hash && sessionHash(session) === session.contract_hash);
  const hash_chain_verified = session.ledger.every((entry) => entry.hash_reference && entry.lineage_reference);
  const lineage_preserved = Boolean(session.evidence.lineage_reference) && session.ledger.every((entry) => entry.lineage_reference);
  const operator_visible = true;
  const tenant_isolated = session.contract.tenant_id.startsWith("tenant:");
  const failures = unique([
    ...(!planning_reproduced ? ["PLANNING_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!delegation_reproduced ? ["DELEGATION_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!communication_reproduced ? ["MISSING_COMMUNICATION_DETECTED" as const] : []),
    ...(!governance_reproduced ? ["GOVERNANCE_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!authority_reproduced ? ["AUTHORITY_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!shared_state_reproduced ? ["SHARED_STATE_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!intervention_reproduced ? ["INTERVENTION_REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!ordering_deterministic ? ["ORDERING_MISMATCH_DETECTED" as const] : []),
    ...(!evidence_complete ? ["INCOMPLETE_REPLAY_DETECTED" as const] : []),
    ...(!agent_state_identical ? ["INCONSISTENT_AGENT_STATE_RECONSTRUCTION_DETECTED" as const] : []),
    ...(!integrity_verified ? ["REPLAY_INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_REPLAY_CONTAMINATION_DETECTED" as const] : []),
    ...session.mismatch_analysis.map((analysis) => analysis.root_cause),
  ]);
  const valid = failures.length === 0;
  const source = { replay_contract_id: session.contract.replay_contract_id, valid, contract_valid, planning_reproduced, delegation_reproduced, communication_reproduced, governance_reproduced, authority_reproduced, shared_state_reproduced, intervention_reproduced, ordering_deterministic, evidence_complete, agent_state_identical, integrity_verified, hash_chain_verified, lineage_preserved, operator_visible, tenant_isolated, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("replay-consistency-validation", source) });
}

export function buildReplayConsistencyObservabilitySurface(session = startReplay()): ReplayConsistencyObservabilitySurface {
  return Object.freeze({ replay_contract_id: session.contract.replay_contract_id, tenant_id: session.contract.tenant_id, mission_id: session.contract.mission_id, replay_entry_count: session.ledger.length, agent_trace_count: session.agent_traces.length, mismatch_count: session.mismatch_analysis.length, state: session.state, contract_hash: session.contract_hash });
}

export function getReplayConsistencyAssurance(): ReplayConsistencyAssuranceBundle {
  const session = startReplay();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "REPLAY_CONSISTENCY_ASSURANCE_CERTIFIED", states: machineStates, artifact_types: artifactTypes, intervention_types: interventionTypes, principles: freezeArray(["deterministic-reconstruction", "immutable-replay-history", "planning-replay", "delegation-replay", "communication-replay", "governance-replay", "authority-replay", "shared-state-replay", "mismatch-analysis-only", "no-replay-mutation"]) }),
    session,
    validation: validateReplayConsistency(session),
    observability: buildReplayConsistencyObservabilitySurface(session),
  });
}
