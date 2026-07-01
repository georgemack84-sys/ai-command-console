import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceHashChain, validateGovernanceHashChain } from "@/services/governance-hash-chain";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceHashChainFailureReason, GovernanceHashChainScenario } from "@/types/governance-hash-chain";
import type {
  GovernanceIntegrityObservation,
  GovernanceTamperDetectionInput,
  GovernanceTamperDetectionReason,
  GovernanceTamperDetectionReport,
  GovernanceTamperObservabilitySurface,
  GovernanceTamperResponse,
  GovernanceTamperScenario,
  GovernanceTamperTruthLedgerEvent,
  GovernanceTamperViolation,
  GovernanceTamperViolationType,
} from "@/types/governance-tamper-detection";

const NOW = "2026-06-27T11:00:00.000Z";
const SCHEMA_VERSION = "governance-tamper-detection/v7I.3" as const;

const REASON_STATE: Readonly<Record<GovernanceTamperDetectionReason, GovernanceIntegrityState>> = Object.freeze({
  HASH_MISMATCH: "CORRUPTED",
  MISSING_CHAIN_LINK: "CORRUPTED",
  DUPLICATE_CHAIN_POSITION: "CORRUPTED",
  PREVIOUS_HASH_MISMATCH: "CORRUPTED",
  ROOT_HASH_MISMATCH: "CORRUPTED",
  REPLAY_RECONSTRUCTION_MISMATCH: "CORRUPTED",
  PARENT_RECORD_MISSING: "CORRUPTED",
  ROOT_LINEAGE_MISSING: "CORRUPTED",
  IMMUTABLE_IDENTITY_MODIFIED: "CORRUPTED",
  CROSS_TENANT_REFERENCE: "CORRUPTED",
  UNSUPPORTED_HASH_VERSION: "DEGRADED",
  VERIFICATION_DELAY: "DEGRADED",
  MISSING_OPTIONAL_METADATA: "DEGRADED",
  UNAUTHORIZED_INSERTION: "CORRUPTED",
  UNAUTHORIZED_DELETION: "CORRUPTED",
  CHAIN_REORDERING: "CORRUPTED",
  UNKNOWN_INTEGRITY_STATE: "CORRUPTED",
});

const CHAIN_REASON_MAP: Readonly<Record<GovernanceHashChainFailureReason, GovernanceTamperDetectionReason>> = Object.freeze({
  CANONICAL_SERIALIZATION_MISMATCH: "HASH_MISMATCH",
  CONTENT_HASH_MISMATCH: "HASH_MISMATCH",
  PREVIOUS_HASH_MISMATCH: "PREVIOUS_HASH_MISMATCH",
  ROOT_HASH_MISMATCH: "ROOT_HASH_MISMATCH",
  MISSING_CHAIN_RECORD: "MISSING_CHAIN_LINK",
  DUPLICATE_CHAIN_POSITION: "DUPLICATE_CHAIN_POSITION",
  REORDERED_CHAIN: "CHAIN_REORDERING",
  REPLAY_HASH_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
  UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_VERSION",
  MISSING_LINEAGE_REFERENCE: "PARENT_RECORD_MISSING",
  LEDGER_PERSISTENCE_DELAY: "VERIFICATION_DELAY",
  CROSS_TENANT_LINKAGE: "CROSS_TENANT_REFERENCE",
});

const SCENARIO_CHAIN: Partial<Record<GovernanceTamperScenario, GovernanceHashChainScenario>> = Object.freeze({
  HASH_MISMATCH: "CONTENT_HASH_MISMATCH",
  MISSING_CHAIN_LINK: "MISSING_CHAIN_RECORD",
  DUPLICATE_CHAIN_POSITION: "DUPLICATE_CHAIN_POSITION",
  PREVIOUS_HASH_MISMATCH: "PREVIOUS_HASH_MISMATCH",
  ROOT_HASH_MISMATCH: "ROOT_HASH_MISMATCH",
  REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_HASH_MISMATCH",
  PARENT_RECORD_MISSING: "MISSING_LINEAGE_REFERENCE",
  CROSS_TENANT_REFERENCE: "CROSS_TENANT_LINKAGE",
  UNSUPPORTED_HASH_VERSION: "UNSUPPORTED_HASH_ALGORITHM",
  VERIFICATION_DELAY: "LEDGER_PERSISTENCE_DELAY",
  UNAUTHORIZED_DELETION: "MISSING_CHAIN_RECORD",
  CHAIN_REORDERING: "REORDERED_CHAIN",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function statePrecedence(state: GovernanceIntegrityState): number {
  return state === "CORRUPTED" ? 3 : state === "DEGRADED" ? 2 : 1;
}

function deriveState(violations: readonly GovernanceTamperViolation[]): GovernanceIntegrityState {
  return violations.reduce<GovernanceIntegrityState>((state, violation) => statePrecedence(violation.integrity_state) > statePrecedence(state) ? violation.integrity_state : state, "VALID");
}

export function classifyGovernanceTamperReason(reason: GovernanceTamperDetectionReason): GovernanceIntegrityState {
  return REASON_STATE[reason];
}

function violationType(reason: GovernanceTamperDetectionReason): GovernanceTamperViolationType {
  if (["HASH_MISMATCH", "UNSUPPORTED_HASH_VERSION"].includes(reason)) return "HASH_MISMATCH_DETECTED";
  if (["MISSING_CHAIN_LINK", "DUPLICATE_CHAIN_POSITION", "PREVIOUS_HASH_MISMATCH", "ROOT_HASH_MISMATCH", "UNAUTHORIZED_INSERTION", "UNAUTHORIZED_DELETION", "CHAIN_REORDERING"].includes(reason)) return "CHAIN_CORRUPTION_DETECTED";
  if (["PARENT_RECORD_MISSING", "ROOT_LINEAGE_MISSING"].includes(reason)) return "LINEAGE_CORRUPTION_DETECTED";
  if (reason === "REPLAY_RECONSTRUCTION_MISMATCH") return "REPLAY_MISMATCH_DETECTED";
  if (reason === "IMMUTABLE_IDENTITY_MODIFIED") return "IMMUTABLE_FIELD_MODIFIED";
  if (reason === "CROSS_TENANT_REFERENCE") return "TENANT_VIOLATION_DETECTED";
  if (["VERIFICATION_DELAY", "MISSING_OPTIONAL_METADATA"].includes(reason)) return "DEGRADATION_CONFIRMED";
  return "CORRUPTION_CONFIRMED";
}

function scenarioReason(scenario: GovernanceTamperScenario): GovernanceTamperDetectionReason | null {
  const map: Partial<Record<GovernanceTamperScenario, GovernanceTamperDetectionReason>> = {
    ROOT_LINEAGE_MISSING: "ROOT_LINEAGE_MISSING",
    IMMUTABLE_IDENTITY_MODIFIED: "IMMUTABLE_IDENTITY_MODIFIED",
    MISSING_OPTIONAL_METADATA: "MISSING_OPTIONAL_METADATA",
    UNAUTHORIZED_INSERTION: "UNAUTHORIZED_INSERTION",
    UNKNOWN_INTEGRITY_STATE: "UNKNOWN_INTEGRITY_STATE",
  };
  return map[scenario] ?? null;
}

function buildObservation(input: GovernanceTamperDetectionInput, validationState?: GovernanceIntegrityState): GovernanceIntegrityObservation {
  const chain = input.chain ?? buildGovernanceHashChain({
    scenario: input.hash_chain_scenario ?? SCENARIO_CHAIN[input.scenario ?? "BASELINE"],
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.created_by,
  });
  const latest = chain.records[chain.records.length - 1];
  const source = {
    observation_id: `GTDO-7I3-${hashValue("governance-tamper-observation-id", { chain: chain.chain_id, scenario: input.scenario ?? "BASELINE" }).slice(0, 10).toUpperCase()}`,
    monitor_id: "governance-integrity-monitor/v7I.3",
    observed_at: NOW,
    chain_id: chain.chain_id,
    tenant_id: chain.tenant_id,
    mission_id: chain.mission_id,
    observed_record_count: chain.records.length,
    expected_record_count: 7,
    observed_root_hash: chain.root_hash,
    expected_root_hash: chain.records[0]?.current_hash ?? "",
    observed_latest_hash: latest?.current_hash ?? "",
    replay_chain_hash: chain.replay_chain.replay_chain_hash,
    lineage_hash: chain.lineage_graph.lineage_hash,
    validation_state: validationState ?? validateGovernanceHashChain(chain).validation_state,
  };
  return Object.freeze({ ...source, observation_hash: hashValue("governance-tamper-observation", source) });
}

function buildViolation(reason: GovernanceTamperDetectionReason, path: string, message: string, evidence: readonly string[]): GovernanceTamperViolation {
  const integrity_state = classifyGovernanceTamperReason(reason);
  const source = {
    violation_type: violationType(reason),
    reason,
    integrity_state,
    path,
    message,
    evidence_hashes: freezeArray(evidence),
    detected_at: NOW,
  };
  return Object.freeze({
    violation_id: `GTDV-7I3-${hashValue("governance-tamper-violation-id", source).slice(0, 10).toUpperCase()}`,
    ...source,
  });
}

function ledgerEvents(reportBase: { chain_id: string; tenant_id: string; mission_id: string }, violations: readonly GovernanceTamperViolation[]): readonly GovernanceTamperTruthLedgerEvent[] {
  return freezeArray(violations.map((violation) => {
    const source = {
      event_type: violation.violation_type,
      chain_id: reportBase.chain_id,
      tenant_id: reportBase.tenant_id,
      mission_id: reportBase.mission_id,
      violation_ids: [violation.violation_id],
      recorded_at: NOW,
      append_only: true as const,
    };
    return Object.freeze({
      ledger_event_id: `GTDL-7I3-${hashValue("governance-tamper-ledger-event-id", source).slice(0, 10).toUpperCase()}`,
      ...source,
      evidence_hash: hashValue("governance-tamper-ledger-event", { source, evidence: violation.evidence_hashes }),
    });
  }));
}

function buildResponse(detectionId: string, integrityState: GovernanceIntegrityState, violations: readonly GovernanceTamperViolation[]): GovernanceTamperResponse {
  const corrupted = integrityState === "CORRUPTED";
  const degraded = integrityState === "DEGRADED";
  const source = {
    response_id: `GTDR-7I3-${hashValue("governance-tamper-response-id", detectionId).slice(0, 10).toUpperCase()}`,
    response_state: integrityState,
    downstream_blocked: corrupted,
    operator_notification_required: corrupted || degraded,
    recovery_required: corrupted,
    response_actions: corrupted
      ? freezeArray(["BLOCK_DOWNSTREAM_GOVERNANCE_USE", "NOTIFY_OPERATOR", "REQUIRE_INTEGRITY_VERIFICATION", "WRITE_TRUTH_LEDGER_EVENT"])
      : degraded
        ? freezeArray(["NOTIFY_OPERATOR", "SCHEDULE_REVALIDATION", "WRITE_TRUTH_LEDGER_EVENT"])
        : freezeArray(["CONTINUE_MONITORING"]),
    violation_ids: violations.map((violation) => violation.violation_id),
  };
  return Object.freeze({ ...source, response_hash: hashValue("governance-tamper-response", source) });
}

export function runGovernanceTamperDetection(input: GovernanceTamperDetectionInput = {}): GovernanceTamperDetectionReport {
  const source_chain = input.chain ?? buildGovernanceHashChain({
    scenario: input.hash_chain_scenario ?? SCENARIO_CHAIN[input.scenario ?? "BASELINE"],
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.created_by,
  });
  const chainValidation = validateGovernanceHashChain(source_chain);
  const observation = buildObservation({ ...input, chain: source_chain }, chainValidation.validation_state);
  const fromChain = chainValidation.failures.map((failure) => {
    const reason = CHAIN_REASON_MAP[failure.reason];
    return buildViolation(reason, failure.path, failure.message, [chainValidation.validation_hash, observation.observation_hash]);
  });
  const direct = scenarioReason(input.scenario ?? "BASELINE");
  const directViolations = direct
    ? [buildViolation(direct, "governance_identity", `${direct} detected by immutable governance tamper monitor.`, [observation.observation_hash])]
    : [];
  const violations = freezeArray([...fromChain, ...directViolations]);
  const integrity_state = deriveState(violations);
  const detection_id = `GTD-7I3-${hashValue("governance-tamper-detection-id", { chain: source_chain.chain_id, observation: observation.observation_hash, scenario: input.scenario ?? "BASELINE" }).slice(0, 10).toUpperCase()}`;
  const truth_ledger_events = ledgerEvents(source_chain, violations);
  const response = buildResponse(detection_id, integrity_state, violations);
  const base = {
    phase_version: "7I.3" as const,
    schema_version: SCHEMA_VERSION,
    detection_id,
    monitoring_state: integrity_state === "CORRUPTED" ? "CORRUPTION_CONFIRMED" as const : integrity_state === "DEGRADED" ? "DEGRADED" as const : "MONITORING" as const,
    integrity_state,
    source_chain,
    observation,
    violations,
    truth_ledger_events,
    response,
    advisory_only_notice: "Governance tamper detection identifies integrity violations and does not grant autonomous execution authority.",
  };
  return Object.freeze({ ...base, report_hash: hashValue("governance-tamper-report", base) });
}

export function buildGovernanceTamperObservabilitySurface(input: GovernanceTamperDetectionInput = {}): GovernanceTamperObservabilitySurface {
  const report = runGovernanceTamperDetection(input);
  return Object.freeze({
    detection_id: report.detection_id,
    chain_id: report.source_chain.chain_id,
    tenant_id: report.source_chain.tenant_id,
    mission_id: report.source_chain.mission_id,
    integrity_state: report.integrity_state,
    monitoring_state: report.monitoring_state,
    violation_count: report.violations.length,
    violations: freezeArray(report.violations.map((violation) => violation.reason)),
    downstream_blocked: report.response.downstream_blocked,
    truth_ledger_events: report.truth_ledger_events.length,
    latest_observation_hash: report.observation.observation_hash,
    advisory_only_notice: report.advisory_only_notice,
  });
}

export function getGovernanceTamperDetectionContract() {
  const report = runGovernanceTamperDetection();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "continuous-integrity-monitoring",
        "hash-tamper-detection",
        "chain-corruption-detection",
        "lineage-manipulation-detection",
        "replay-manipulation-detection",
        "immutable-identity-monitoring",
        "tenant-boundary-detection",
        "truth-ledger-event-recording",
        "fail-closed-response",
      ]),
      schema_version: SCHEMA_VERSION,
      failure_state_mapping: REASON_STATE,
    }),
    report,
    observability: buildGovernanceTamperObservabilitySurface(),
  });
}
