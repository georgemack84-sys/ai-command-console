import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { loadSharedGovernanceContext } from "@/services/shared-governance-assurance";
import type {
  CoordinationIntegrityEngineBundle,
  CoordinationIntegrityEvidence,
  CoordinationIntegrityInput,
  CoordinationIntegrityLedger,
  CoordinationIntegrityObservabilitySurface,
  CoordinationIntegrityReplayResult,
  CoordinationIntegrityValidationResult,
  CoordinationIntegrityContract,
  HashVerificationRecord,
  IntegrityArtifactType,
  IntegrityFailure,
  IntegrityLedgerEntry,
  IntegrityOperationEvent,
  IntegrityScenario,
  ReplayReferenceRecord,
  SharedStateRecord,
  TamperDetectionReport,
} from "@/types/coordination-integrity-engine";

const VERSION = "coordination-integrity-engine/v8ALT.7.6" as const;
const NOW = "2026-07-13T22:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "REGISTERING", "HASHING", "CHAINING", "VERIFYING", "MONITORING", "VALID", "DEGRADED", "CORRUPTED", "UNVERIFIED", "CERTIFIED"] as const);
const artifactTypes = Object.freeze(["GENESIS", "PLANNING", "DELEGATION", "COMMUNICATION", "COORDINATION_EVENT", "SHARED_STATE", "REPLAY", "CERTIFICATION"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failuresFor(scenario: IntegrityScenario): readonly IntegrityFailure[] {
  const map: Partial<Record<IntegrityScenario, IntegrityFailure>> = {
    COMMUNICATION_HASH_MISMATCH: "COMMUNICATION_HASH_MISMATCH_DETECTED",
    DELEGATION_HASH_MISMATCH: "DELEGATION_HASH_MISMATCH_DETECTED",
    PLAN_HASH_CORRUPTION: "PLAN_HASH_CORRUPTION_DETECTED",
    EVENT_HASH_MISMATCH: "COORDINATION_EVENT_HASH_MISMATCH_DETECTED",
    MISSING_COORDINATION_EVENT: "MISSING_COORDINATION_EVENT_DETECTED",
    SHARED_STATE_CORRUPTION: "CORRUPTED_SHARED_STATE_DETECTED",
    REPLAY_REFERENCE_CORRUPTION: "REPLAY_REFERENCE_CORRUPTION_DETECTED",
    ALTERED_MESSAGE: "ALTERED_MESSAGE_DETECTED",
    UNAUTHORIZED_COMMUNICATION_CHANGE: "UNAUTHORIZED_COMMUNICATION_CHANGE_DETECTED",
    BROKEN_HASH_CHAIN: "BROKEN_HASH_CHAIN_DETECTED",
    INVALID_SIGNATURE: "INTEGRITY_SIGNATURE_INVALID",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    CROSS_TENANT_CONTAMINATION: "CROSS_TENANT_INTEGRITY_CONTAMINATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

export function computeCoordinationHash(artifact: unknown): string {
  return hashValue("coordination-integrity-artifact", artifact);
}

function ledgerHash(ledger: Omit<CoordinationIntegrityLedger, "contract_hash"> | CoordinationIntegrityLedger): string {
  const { contract_hash: _hash, ...source } = ledger as CoordinationIntegrityLedger;
  return hashValue("coordination-integrity-ledger", source);
}

function entryPayload(type: IntegrityArtifactType, shared: ReturnType<typeof loadSharedGovernanceContext>) {
  const payloads: Record<IntegrityArtifactType, unknown> = {
    GENESIS: { coordination_session_id: shared.coordination_session_id, mission_id: shared.mission_id },
    PLANNING: shared.influence_graph,
    DELEGATION: shared.evidence.delegation_evidence,
    COMMUNICATION: { message_id: "message:coordination:primary", source_agent: shared.participating_agents[0]?.agent_id, destination_agent: shared.participating_agents[1]?.agent_id, message_type: "GOVERNANCE_STATUS" },
    COORDINATION_EVENT: shared.events,
    SHARED_STATE: { mission_state: "SYNCHRONIZED", planning_state: "CERTIFIED", delegation_state: "CERTIFIED", governance_state: "CERTIFIED", authority_state: "CERTIFIED", runtime_state: "MONITORED" },
    REPLAY: shared.evidence.replay_reference,
    CERTIFICATION: "COORDINATION_INTEGRITY_ENGINE_CERTIFIED",
  };
  return payloads[type];
}

function shouldFail(type: IntegrityArtifactType, failures: readonly IntegrityFailure[]) {
  return (type === "COMMUNICATION" && (failures.includes("COMMUNICATION_HASH_MISMATCH_DETECTED") || failures.includes("ALTERED_MESSAGE_DETECTED") || failures.includes("UNAUTHORIZED_COMMUNICATION_CHANGE_DETECTED")))
    || (type === "DELEGATION" && failures.includes("DELEGATION_HASH_MISMATCH_DETECTED"))
    || (type === "PLANNING" && failures.includes("PLAN_HASH_CORRUPTION_DETECTED"))
    || (type === "COORDINATION_EVENT" && failures.includes("COORDINATION_EVENT_HASH_MISMATCH_DETECTED"))
    || (type === "SHARED_STATE" && failures.includes("CORRUPTED_SHARED_STATE_DETECTED"))
    || (type === "REPLAY" && (failures.includes("REPLAY_REFERENCE_CORRUPTION_DETECTED") || failures.includes("REPLAY_MISMATCH_DETECTED")));
}

export function registerCoordinationArtifact(input: CoordinationIntegrityInput = {}): CoordinationIntegrityLedger {
  return createCoordinationIntegrityLedger(input);
}

export function createCoordinationIntegrityLedger(input: CoordinationIntegrityInput = {}): CoordinationIntegrityLedger {
  if (input.ledger) return input.ledger;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const shared = loadSharedGovernanceContext({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const tenant = failures.includes("CROSS_TENANT_INTEGRITY_CONTAMINATION_DETECTED") ? "external-tenant" : shared.tenant_id;
  const integrityId = id("CINT", "coordination-integrity", { mission: shared.mission_id, scenario: input.scenario ?? "BASELINE" });
  const contractBase = {
    coordination_integrity_id: integrityId,
    coordination_session_id: shared.coordination_session_id,
    mission_id: shared.mission_id,
    tenant_id: tenant,
    integrity_policy_version: "coordination-integrity-policy/v8ALT.7.6" as const,
    hash_algorithm: "SHA-256-CANONICAL" as const,
    hash_chain_version: "coordination-hash-chain/v8ALT.7.6" as const,
    replay_reference_policy: freezeArray(["replay-reference-required", "hash-reference-required", "lineage-required"]),
    retention_policy: freezeArray(["append-only", "immutable", "forensic-reconstruction"]),
    verification_policy: freezeArray(["verify-all-artifacts", "fail-closed", "operator-visible"]),
    created_timestamp: NOW,
    immutable: true as const,
    append_only: true as const,
    governance_bound: true as const,
    tenant_isolated: true as const,
  };
  const contract: CoordinationIntegrityContract = Object.freeze({ ...contractBase, integrity_hash: hashValue("coordination-integrity-contract", contractBase) });
  let parent = "GENESIS-HASH";
  const rawEntries = artifactTypes.map((type, index) => {
    const payload = entryPayload(type, shared);
    const expected = computeCoordinationHash({ type, payload, index });
    const observed = shouldFail(type, failures) ? computeCoordinationHash({ type, payload, index, tampered: true }) : expected;
    const entryParent = failures.includes("BROKEN_HASH_CHAIN_DETECTED") && index === 4 ? "BROKEN-PARENT-HASH" : parent;
    const base = {
      coordination_integrity_entry_id: id("CIEN", "coordination-integrity-entry", { integrityId, type }),
      coordination_session_id: shared.coordination_session_id,
      artifact_type: type,
      artifact_reference: `artifact:${type.toLowerCase()}:${index}`,
      artifact_hash: observed,
      expected_hash: expected,
      parent_hash: entryParent,
      lineage_reference: `lineage:${type.toLowerCase()}:${integrityId}`,
      replay_reference: failures.includes("REPLAY_REFERENCE_CORRUPTION_DETECTED") && type === "REPLAY" ? "" : `replay:${type.toLowerCase()}:${integrityId}`,
      governance_reference: shared.governance_context.governance_context_id,
      constitutional_reference: shared.constitution_reference,
      tenant_id: tenant,
      verification_status: failures.includes("MISSING_COORDINATION_EVENT_DETECTED") && type === "COORDINATION_EVENT" ? "MISSING" as const : observed === expected ? "VERIFIED" as const : "FAILED" as const,
      timestamp: `2026-07-13T22:0${index}:00.000Z`,
    };
    const signature = failures.includes("INTEGRITY_SIGNATURE_INVALID") && index === 2 ? "" : hashValue("coordination-integrity-signature", base);
    parent = observed;
    return Object.freeze({ ...base, integrity_signature: signature });
  });
  const entries = freezeArray(failures.includes("MISSING_COORDINATION_EVENT_DETECTED") ? rawEntries.filter((entry) => entry.artifact_type !== "COORDINATION_EVENT") : rawEntries);
  const verifications: readonly HashVerificationRecord[] = freezeArray(entries.map((entry) => Object.freeze({ verification_id: id("VFY", "coordination-hash-verification", entry.artifact_reference), artifact_reference: entry.artifact_reference, expected_hash: entry.expected_hash, computed_hash: entry.artifact_hash, verification_result: entry.verification_status === "MISSING" ? "MISSING" as const : entry.expected_hash === entry.artifact_hash ? "MATCH" as const : "MISMATCH" as const, verification_timestamp: NOW })));
  const replayReferences: readonly ReplayReferenceRecord[] = freezeArray(entries.map((entry) => Object.freeze({ replay_reference_id: id("RREF", "coordination-replay-reference", entry.artifact_reference), coordination_session_id: shared.coordination_session_id, artifact_reference: entry.artifact_reference, hash_reference: entry.artifact_hash, lineage_reference: entry.lineage_reference, verification_status: entry.replay_reference ? "VALID" as const : "CORRUPTED" as const, timestamp: NOW })));
  const stateBase = { shared_state_id: id("SSTATE", "coordination-shared-state", integrityId), coordination_session_id: shared.coordination_session_id, mission_state: "SYNCHRONIZED", planning_state: "CERTIFIED", delegation_state: "CERTIFIED", governance_state: "CERTIFIED", authority_state: "CERTIFIED", runtime_state: failures.includes("CORRUPTED_SHARED_STATE_DETECTED") ? "CORRUPTED" : "MONITORED", timestamp: NOW };
  const sharedState: SharedStateRecord = Object.freeze({ ...stateBase, state_hash: failures.includes("CORRUPTED_SHARED_STATE_DETECTED") ? "" : hashValue("coordination-shared-state", stateBase) });
  const reports: readonly TamperDetectionReport[] = freezeArray(failures.map((failure) => Object.freeze({ tamper_report_id: id("TAMP", "coordination-tamper-report", failure), coordination_session_id: shared.coordination_session_id, artifact_reference: failure.includes("COMMUNICATION") || failure.includes("MESSAGE") ? "artifact:communication:3" : failure.includes("DELEGATION") ? "artifact:delegation:2" : failure.includes("PLAN") ? "artifact:planning:1" : failure.includes("STATE") ? "artifact:shared_state:5" : failure.includes("REPLAY") ? "artifact:replay:6" : "artifact:coordination", tamper_type: failure, severity: "CRITICAL" as const, detected_timestamp: NOW, recommended_action: "Fail closed, preserve evidence, and require operator/governance review." })));
  const events: readonly IntegrityOperationEvent[] = freezeArray(entries.map((entry) => Object.freeze({ event_id: id("CIOP", "coordination-integrity-operation", entry.artifact_reference), coordination_session_id: shared.coordination_session_id, artifact_reference: entry.artifact_reference, operation_type: "VERIFY_CHAIN" as const, verification_state: entry.verification_status === "VERIFIED" ? "VALID" as const : "CORRUPTED" as const, previous_hash: entry.parent_hash, new_hash: entry.artifact_hash, verification_result: entry.verification_status === "VERIFIED" ? "PASS" as const : "FAIL" as const, timestamp: entry.timestamp, integrity_signature: hashValue("coordination-integrity-operation", entry) })));
  const evidenceBase = {
    integrity_validation_id: id("CIV", "coordination-integrity-validation", integrityId),
    coordination_session_id: shared.coordination_session_id,
    mission_id: shared.mission_id,
    artifact_references: freezeArray(entries.map((entry) => entry.artifact_reference)),
    communication_hashes: freezeArray(entries.filter((entry) => entry.artifact_type === "COMMUNICATION").map((entry) => entry.artifact_hash)),
    delegation_hashes: freezeArray(entries.filter((entry) => entry.artifact_type === "DELEGATION").map((entry) => entry.artifact_hash)),
    plan_hashes: freezeArray(entries.filter((entry) => entry.artifact_type === "PLANNING").map((entry) => entry.artifact_hash)),
    event_hashes: freezeArray(entries.filter((entry) => entry.artifact_type === "COORDINATION_EVENT").map((entry) => entry.artifact_hash)),
    shared_state_hashes: freezeArray([sharedState.state_hash]),
    replay_hashes: freezeArray(entries.filter((entry) => entry.artifact_type === "REPLAY").map((entry) => entry.artifact_hash)),
    verification_results: verifications,
    lineage_reference: `lineage:coordination-integrity:${integrityId}`,
    timestamp: NOW,
  };
  const evidence: CoordinationIntegrityEvidence = Object.freeze({ ...evidenceBase, integrity_hash: hashValue("coordination-integrity-evidence", evidenceBase) });
  const valid = failures.length === 0;
  const status = Object.freeze({ state: valid ? "VALID" as const : "CORRUPTED" as const, verification_score: valid ? 1 : 0.42, replay_ready: valid, certification_ready: valid, integrity_confidence: valid ? 0.99 : 0.31 });
  const base = { contract, entries, verifications, replay_references: replayReferences, shared_state: sharedState, tamper_reports: reports, status, events, evidence, version: VERSION };
  return Object.freeze({ ...base, contract_hash: ledgerHash(base as Omit<CoordinationIntegrityLedger, "contract_hash">) });
}

export function verifyHashChain(ledger = createCoordinationIntegrityLedger()): CoordinationIntegrityValidationResult {
  return validateCoordinationIntegrity(ledger);
}

export function validateCoordinationIntegrity(ledger = createCoordinationIntegrityLedger()): CoordinationIntegrityValidationResult {
  const entryByType = (type: IntegrityArtifactType) => ledger.entries.filter((entry) => entry.artifact_type === type);
  const chain = ledger.entries.every((entry, index) => index === 0 || entry.parent_hash === ledger.entries[index - 1]?.artifact_hash);
  const verificationsMatch = (type: IntegrityArtifactType) => entryByType(type).every((entry) => entry.expected_hash === entry.artifact_hash && entry.verification_status === "VERIFIED");
  const contract_valid = ledger.contract.immutable && ledger.contract.append_only && ledger.contract.governance_bound && ledger.contract.tenant_isolated;
  const communication_hashes_valid = verificationsMatch("COMMUNICATION");
  const delegation_hashes_valid = verificationsMatch("DELEGATION");
  const plan_hashes_valid = verificationsMatch("PLANNING");
  const event_hashes_valid = verificationsMatch("COORDINATION_EVENT") && entryByType("COORDINATION_EVENT").length === 1;
  const shared_state_hashes_valid = verificationsMatch("SHARED_STATE") && Boolean(ledger.shared_state.state_hash);
  const replay_references_valid = verificationsMatch("REPLAY") && ledger.replay_references.every((ref) => ref.verification_status === "VALID");
  const hash_chain_complete = ledger.entries.length === artifactTypes.length && chain;
  const lineage_preserved = ledger.entries.every((entry) => entry.lineage_reference) && Boolean(ledger.evidence.lineage_reference);
  const deterministic_replay = replay_references_valid && ledger.status.replay_ready;
  const immutable_ledger = ledger.contract.immutable && ledger.contract.append_only;
  const governance_references_preserved = ledger.entries.every((entry) => entry.governance_reference);
  const constitutional_references_preserved = ledger.entries.every((entry) => entry.constitutional_reference);
  const signatures_valid = ledger.entries.every((entry) => entry.integrity_signature) && ledger.events.every((event) => event.integrity_signature);
  const operator_visible = true;
  const tenant_isolated = ledger.contract.tenant_id.startsWith("tenant:") && ledger.entries.every((entry) => entry.tenant_id === ledger.contract.tenant_id);
  const integrityValid = ledgerHash(ledger) === ledger.contract_hash && ledger.contract.integrity_hash && ledger.evidence.integrity_hash;
  const failures = unique([
    ...(!communication_hashes_valid ? ["COMMUNICATION_HASH_MISMATCH_DETECTED" as const] : []),
    ...(!delegation_hashes_valid ? ["DELEGATION_HASH_MISMATCH_DETECTED" as const] : []),
    ...(!plan_hashes_valid ? ["PLAN_HASH_CORRUPTION_DETECTED" as const] : []),
    ...(!event_hashes_valid ? [entryByType("COORDINATION_EVENT").length === 0 ? "MISSING_COORDINATION_EVENT_DETECTED" as const : "COORDINATION_EVENT_HASH_MISMATCH_DETECTED" as const] : []),
    ...(!shared_state_hashes_valid ? ["CORRUPTED_SHARED_STATE_DETECTED" as const] : []),
    ...(!replay_references_valid ? ["REPLAY_REFERENCE_CORRUPTION_DETECTED" as const] : []),
    ...(!hash_chain_complete ? ["BROKEN_HASH_CHAIN_DETECTED" as const] : []),
    ...(!deterministic_replay ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!signatures_valid ? ["INTEGRITY_SIGNATURE_INVALID" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_INTEGRITY_CONTAMINATION_DETECTED" as const] : []),
    ...(!integrityValid ? ["INTEGRITY_SIGNATURE_INVALID" as const] : []),
    ...ledger.tamper_reports.map((report) => report.tamper_type),
  ]);
  const valid = failures.length === 0;
  const source = { coordination_integrity_id: ledger.contract.coordination_integrity_id, valid, contract_valid, communication_hashes_valid, delegation_hashes_valid, plan_hashes_valid, event_hashes_valid, shared_state_hashes_valid, replay_references_valid, hash_chain_complete, lineage_preserved, deterministic_replay, immutable_ledger, governance_references_preserved, constitutional_references_preserved, signatures_valid, operator_visible, tenant_isolated, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("coordination-integrity-validation-result", source) });
}

export function validateReplayReferences(input: CoordinationIntegrityInput = {}) {
  const validation = validateCoordinationIntegrity(createCoordinationIntegrityLedger(input));
  return { replay_references_valid: validation.replay_references_valid, deterministic_replay: validation.deterministic_replay, failures: validation.failures };
}

export function detectTampering(input: CoordinationIntegrityInput = {}) {
  return createCoordinationIntegrityLedger(input).tamper_reports;
}

export function generateIntegrityReport(input: CoordinationIntegrityInput = {}) {
  const ledger = createCoordinationIntegrityLedger(input);
  return { status: ledger.status, evidence: ledger.evidence, tamper_reports: ledger.tamper_reports, validation: validateCoordinationIntegrity(ledger) };
}

export function replayCoordinationIntegrity(ledger = createCoordinationIntegrityLedger()): CoordinationIntegrityReplayResult {
  const reconstructed_hash = ledgerHash(ledger);
  const source = { replay_reference: `replay:coordination-integrity:${ledger.contract.coordination_integrity_id}`, coordination_integrity_id: ledger.contract.coordination_integrity_id, deterministic: reconstructed_hash === ledger.contract_hash && ledger.status.replay_ready, reconstructed_hash, original_hash: ledger.contract_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("coordination-integrity-replay", source) });
}

export function buildCoordinationIntegrityObservabilitySurface(ledger = createCoordinationIntegrityLedger()): CoordinationIntegrityObservabilitySurface {
  return Object.freeze({ coordination_integrity_id: ledger.contract.coordination_integrity_id, tenant_id: ledger.contract.tenant_id, mission_id: ledger.contract.mission_id, ledger_entry_count: ledger.entries.length, verification_count: ledger.verifications.length, tamper_report_count: ledger.tamper_reports.length, status: ledger.status.state, contract_hash: ledger.contract_hash });
}

export function getCoordinationIntegrityEngine(): CoordinationIntegrityEngineBundle {
  const ledger = createCoordinationIntegrityLedger();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "COORDINATION_INTEGRITY_ENGINE_CERTIFIED", states, artifact_types: artifactTypes, principles: freezeArray(["immutable-coordination-history", "append-only-integrity-ledger", "deterministic-hashing", "hash-chain-continuity", "replay-reference-integrity", "tamper-evidence", "forensic-reconstruction", "tenant-isolation", "operator-visible-verification", "no-history-mutation"]) }),
    ledger,
    validation: validateCoordinationIntegrity(ledger),
    replay: replayCoordinationIntegrity(ledger),
    observability: buildCoordinationIntegrityObservabilitySurface(ledger),
  });
}
