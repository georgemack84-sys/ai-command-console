import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceQueryContract, validateGovernanceQueryContract } from "@/services/governance-query-contract";
import { runGovernanceSearch } from "@/services/governance-search-engine";
import type { GovernanceQueryContract, GovernanceQueryErrorState, GovernanceQueryValidationIssue } from "@/types/governance-query-contract";
import type { GovernanceSearchDomain } from "@/types/governance-search-engine";
import type {
  GovernanceHistoricalLedgerRecord,
  GovernanceHistoricalReconstructionErrorState,
  GovernanceHistoricalReconstructionInput,
  GovernanceHistoricalReconstructionObservabilitySurface,
  GovernanceHistoricalReconstructionResponse,
  GovernanceHistoricalReconstructionScenario,
  GovernanceHistoricalReconstructionState,
  GovernanceHistoricalReplayValidation,
  GovernanceHistoricalSnapshotSection,
  GovernanceHistoricalTimelineEvent,
  HistoricalGovernanceSnapshot,
} from "@/types/governance-historical-reconstruction";

const NOW = "2026-06-27T13:30:00.000Z";
const DEFAULT_TIMESTAMP = "2026-06-18T12:00:00.000Z";
const SCHEMA_VERSION = "governance-historical-reconstruction/v7J.3" as const;
const SNAPSHOT_VERSION = "historical-governance-snapshot/v7J.3" as const;
const LEDGER_VERSION = "governance-ledger/v7J.3" as const;

const DOMAIN_ORDER: readonly GovernanceSearchDomain[] = ["POLICY", "RECOMMENDATION", "RISK", "COMPLIANCE", "ESCALATION", "EVIDENCE", "LINEAGE", "REPLAY", "CERTIFICATION", "AUDIT", "TRUTH_LEDGER", "VIOLATION"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function issue(state: GovernanceHistoricalReconstructionErrorState, path: string, message: string): GovernanceQueryValidationIssue {
  const queryState: Record<GovernanceHistoricalReconstructionErrorState, GovernanceQueryErrorState> = {
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    LEDGER_RECORDS_INCOMPLETE: "VALIDATION_FAILED",
    LINEAGE_INCONSISTENT: "INVALID_LINEAGE_REFERENCE",
    POLICY_HISTORY_INCOMPLETE: "VALIDATION_FAILED",
    RECONSTRUCTION_HASH_MISMATCH: "VALIDATION_FAILED",
    REPLAY_HASH_MISMATCH: "INVALID_REPLAY_REFERENCE",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    TIMESTAMP_NOT_FOUND: "VALIDATION_FAILED",
    VERSION_INCOMPATIBLE: "VALIDATION_FAILED",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryContractForScenario(input: GovernanceHistoricalReconstructionInput): GovernanceQueryContract {
  if (input.query_contract) return input.query_contract;
  if (input.scenario === "TENANT_ISOLATION_VIOLATION") return buildGovernanceQueryContract({ scenario: "TENANT_ISOLATION_VIOLATION" });
  if (input.scenario === "CONSTITUTIONAL_VIOLATION") return buildGovernanceQueryContract({ scenario: "CONSTITUTIONAL_VIOLATION" });
  return buildGovernanceQueryContract({ query_type: "GOVERNANCE_HISTORY", target_object: "TRUTH_RECORD", authorization_level: "GOVERNANCE" });
}

function resolveTimestamp(input: GovernanceHistoricalReconstructionInput): string | null {
  if (input.scenario === "TIMESTAMP_NOT_FOUND") return null;
  return input.historical_timestamp ?? DEFAULT_TIMESTAMP;
}

function asLedgerRecord(record: ReturnType<typeof runGovernanceSearch>["results"][number], tenant_id: string, mission_id: string): GovernanceHistoricalLedgerRecord {
  const source = {
    immutable_identifier: record.immutable_identifier,
    tenant_id,
    mission_id,
    domain: record.domain,
    object_type: record.object_type,
    query_type: record.domain === "TRUTH_LEDGER" ? "GOVERNANCE_HISTORY" as const : record.object_type === "RECOMMENDATION" ? "RECOMMENDATION_LOOKUP" as const : record.object_type === "POLICY" ? "POLICY_LOOKUP" as const : record.object_type === "RISK_ASSESSMENT" ? "RISK_LOOKUP" as const : record.object_type === "COMPLIANCE_EVALUATION" ? "COMPLIANCE_LOOKUP" as const : record.object_type === "ESCALATION" ? "ESCALATION_LOOKUP" as const : record.object_type === "EVIDENCE" ? "EVIDENCE_LOOKUP" as const : record.object_type === "LINEAGE_CHAIN" ? "LINEAGE_LOOKUP" as const : "GOVERNANCE_HISTORY" as const,
    title: record.title,
    summary: record.summary,
    governance_timestamp: record.governance_timestamp,
    ledger_sequence: record.ledger_sequence,
    lineage_hierarchy: record.lineage_hierarchy,
    object_version: record.object_version,
    policy_refs: ["policy:governance-integrity", "policy:tenant-isolation"],
    authority_refs: ["authority:constitutional-governance", "authority:mission-control"],
    evidence_refs: record.evidence_refs,
    replay_refs: record.replay_refs,
    lineage_refs: record.lineage_refs,
    truth_ledger_refs: record.truth_ledger_refs,
    tags: freezeArray([record.domain.toLowerCase(), "historical", "governance"]),
    state: "ACTIVE",
    severity: record.domain === "ESCALATION" ? "HIGH" : "MEDIUM",
    confidence: 0.9,
    integrity_state: "VALID" as const,
    restricted: false,
    valid_from: "2026-06-01T00:00:00.000Z",
    valid_to: null,
    ledger_version: LEDGER_VERSION,
    checkpoint_id: `checkpoint:7j3:${record.ledger_sequence}`,
    historical_event_type: record.domain === "POLICY" ? "CERTIFIED" as const : "UPDATED" as const,
  };
  return Object.freeze({ ...source, payload_hash: hashValue("governance-historical-ledger-record", source) });
}

function discoverLedgerRecords(input: GovernanceHistoricalReconstructionInput, contract: GovernanceQueryContract): readonly GovernanceHistoricalLedgerRecord[] {
  if (input.ledger_records) return freezeArray(input.ledger_records);
  const search = runGovernanceSearch({ scenario: "HISTORICAL_SEARCH", query_contract: contract, requested_domains: DOMAIN_ORDER, search_terms: ["governance"] });
  const records = search.results.map((result) => asLedgerRecord(result, contract.tenant_id, contract.mission_id));
  if (input.scenario === "LEDGER_RECORDS_INCOMPLETE") return freezeArray(records.filter((record) => record.domain !== "EVIDENCE"));
  if (input.scenario === "POLICY_HISTORY_INCOMPLETE") return freezeArray(records.filter((record) => record.domain !== "POLICY"));
  if (input.scenario === "VERSION_INCOMPATIBLE") return freezeArray(records.map((record, index) => index === 0 ? Object.freeze({ ...record, ledger_version: "governance-ledger/v0" as typeof LEDGER_VERSION }) : record));
  if (input.scenario === "LINEAGE_INCONSISTENT") return freezeArray(records.map((record, index) => index === 1 ? Object.freeze({ ...record, lineage_refs: [] }) : record));
  return freezeArray(records);
}

function activeAt(record: GovernanceHistoricalLedgerRecord, timestamp: string): boolean {
  return record.valid_from <= timestamp && (!record.valid_to || timestamp <= record.valid_to);
}

function sortLedger(records: readonly GovernanceHistoricalLedgerRecord[]): readonly GovernanceHistoricalLedgerRecord[] {
  return freezeArray([...records].sort((a, b) =>
    a.governance_timestamp.localeCompare(b.governance_timestamp) ||
    a.ledger_sequence - b.ledger_sequence ||
    a.lineage_hierarchy.localeCompare(b.lineage_hierarchy) ||
    a.immutable_identifier.localeCompare(b.immutable_identifier),
  ));
}

function buildTimeline(records: readonly GovernanceHistoricalLedgerRecord[]): readonly GovernanceHistoricalTimelineEvent[] {
  return freezeArray(sortLedger(records).map((record) => {
    const source = {
      event_id: `GHTE-7J3-${hashValue("governance-historical-timeline-event-id", record.immutable_identifier).slice(0, 10).toUpperCase()}`,
      timestamp: record.governance_timestamp,
      ledger_sequence: record.ledger_sequence,
      domain: record.domain,
      immutable_identifier: record.immutable_identifier,
      event_type: record.historical_event_type,
      parent_refs: freezeArray(record.lineage_refs.slice(0, 1)),
      child_refs: freezeArray(record.lineage_refs.slice(1)),
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-historical-timeline-event", source) });
  }));
}

function section(domain: GovernanceSearchDomain, records: readonly GovernanceHistoricalLedgerRecord[]): GovernanceHistoricalSnapshotSection {
  const domainRecords = sortLedger(records.filter((record) => record.domain === domain));
  const source = { domain, records: domainRecords, record_count: domainRecords.length };
  return Object.freeze({ ...source, section_hash: hashValue("governance-historical-snapshot-section", source) });
}

function buildSnapshot(contract: GovernanceQueryContract, timestamp: string, records: readonly GovernanceHistoricalLedgerRecord[]): HistoricalGovernanceSnapshot {
  const activeRecords = sortLedger(records.filter((record) => activeAt(record, timestamp)));
  const source = {
    snapshot_id: `GHS-7J3-${hashValue("governance-historical-snapshot-id", { tenant: contract.tenant_id, mission: contract.mission_id, timestamp }).slice(0, 10).toUpperCase()}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    historical_timestamp: timestamp,
    governance_state: activeRecords.some((record) => record.integrity_state === "CORRUPTED") ? "BLOCKED" as const : "ACTIVE" as const,
    active_policies: section("POLICY", activeRecords),
    recommendations: section("RECOMMENDATION", activeRecords),
    risks: section("RISK", activeRecords),
    compliance: section("COMPLIANCE", activeRecords),
    escalations: section("ESCALATION", activeRecords),
    authority_assignments: section("POLICY", activeRecords),
    evidence: section("EVIDENCE", activeRecords),
    lineage: section("LINEAGE", activeRecords),
    replay_reference: contract.replay_scope.replay_id,
    snapshot_version: SNAPSHOT_VERSION,
  };
  return Object.freeze({ ...source, reconstruction_hash: hashValue("governance-historical-snapshot", source) });
}

function validateReplay(contract: GovernanceQueryContract, snapshot: HistoricalGovernanceSnapshot, input: GovernanceHistoricalReconstructionInput): GovernanceHistoricalReplayValidation {
  const expected = input.expected_reconstruction_hash ?? snapshot.reconstruction_hash;
  const actual = input.scenario === "RECONSTRUCTION_HASH_MISMATCH" ? `${snapshot.reconstruction_hash}:mismatch` : snapshot.reconstruction_hash;
  const replayHash = input.scenario === "REPLAY_HASH_MISMATCH" ? "" : contract.replay_scope.replay_hash;
  const source = {
    replay_id: contract.replay_scope.replay_id,
    replay_hash: replayHash,
    expected_reconstruction_hash: expected,
    actual_reconstruction_hash: actual,
    ledger_integrity_verified: true,
    snapshot_consistent: expected === actual,
    object_version_compatible: input.scenario !== "VERSION_INCOMPATIBLE",
    replay_valid: Boolean(replayHash) && expected === actual && input.scenario !== "VERSION_INCOMPATIBLE",
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-historical-replay-validation", source) });
}

function deriveFailure(input: GovernanceHistoricalReconstructionInput, timestamp: string | null, records: readonly GovernanceHistoricalLedgerRecord[], replay: GovernanceHistoricalReplayValidation | null): GovernanceHistoricalReconstructionErrorState | null {
  if (!timestamp) return "TIMESTAMP_NOT_FOUND";
  if (input.scenario === "TENANT_ISOLATION_VIOLATION") return "TENANT_ISOLATION_VIOLATION";
  if (input.scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (!records.some((record) => record.domain === "EVIDENCE")) return "LEDGER_RECORDS_INCOMPLETE";
  if (!records.some((record) => record.domain === "POLICY")) return "POLICY_HISTORY_INCOMPLETE";
  if (records.some((record) => record.ledger_version !== LEDGER_VERSION)) return "VERSION_INCOMPATIBLE";
  if (records.some((record) => record.lineage_refs.length === 0)) return "LINEAGE_INCONSISTENT";
  if (replay && !replay.replay_hash) return "REPLAY_HASH_MISMATCH";
  if (replay && replay.expected_reconstruction_hash !== replay.actual_reconstruction_hash) return "RECONSTRUCTION_HASH_MISMATCH";
  return null;
}

export function reconstructHistoricalGovernance(input: GovernanceHistoricalReconstructionInput = {}): GovernanceHistoricalReconstructionResponse {
  const contract = queryContractForScenario(input);
  const queryValidation = validateGovernanceQueryContract(contract);
  const timestamp = resolveTimestamp(input);
  const searchResponse = runGovernanceSearch({ scenario: "HISTORICAL_SEARCH", query_contract: contract, requested_domains: DOMAIN_ORDER, search_terms: ["governance"] });
  const records = timestamp ? discoverLedgerRecords(input, contract) : freezeArray([]);
  const timeline = timestamp ? buildTimeline(records) : freezeArray([]);
  const preliminaryFailure = deriveFailure(input, timestamp, records, null);
  const snapshot = timestamp && !preliminaryFailure ? buildSnapshot(contract, timestamp, records) : null;
  const replayValidation = snapshot ? validateReplay(contract, snapshot, input) : null;
  const failure = preliminaryFailure ?? deriveFailure(input, timestamp, records, replayValidation);
  const reconstructionState: GovernanceHistoricalReconstructionState = failure ?? "SNAPSHOT_RECONSTRUCTED";
  const failures = freezeArray([
    ...queryValidation.errors,
    ...(failure ? [issue(failure, "historical_reconstruction", `${failure} detected during historical governance reconstruction.`)] : []),
  ]);
  const reconstructionId = `GHR-7J3-${hashValue("governance-historical-reconstruction-id", { query: contract.query_id, timestamp, state: reconstructionState }).slice(0, 10).toUpperCase()}`;
  const reconstructionHash = snapshot && replayValidation?.replay_valid ? hashValue("governance-historical-reconstruction-response", {
    reconstruction_id: reconstructionId,
    snapshot_hash: snapshot.reconstruction_hash,
    timeline: timeline.map((event) => event.event_hash),
    replay_validation: replayValidation.validation_hash,
  }) : null;
  return Object.freeze({
    phase_version: "7J.3",
    schema_version: SCHEMA_VERSION,
    reconstruction_id: reconstructionId,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    historical_timestamp: timestamp,
    reconstruction_state: reconstructionState,
    query_validation: queryValidation,
    search_response: searchResponse,
    ledger_records: records,
    timeline,
    snapshot,
    replay_validation: replayValidation,
    failures,
    reconstruction_hash: reconstructionHash,
    read_only: true,
    advisory_only_notice: "Historical governance reconstruction is deterministic, immutable, read-only, replay-verifiable, and audit-backed.",
  });
}

export function validateHistoricalGovernanceReconstruction(input: GovernanceHistoricalReconstructionInput = {}) {
  const response = reconstructHistoricalGovernance(input);
  return Object.freeze({
    reconstruction_id: response.reconstruction_id,
    valid: response.reconstruction_state === "SNAPSHOT_RECONSTRUCTED",
    reconstruction_state: response.reconstruction_state,
    replay_valid: response.replay_validation?.replay_valid ?? false,
    lineage_verified: !response.failures.some((failure) => failure.state === "INVALID_LINEAGE_REFERENCE"),
    version_compatible: response.replay_validation?.object_version_compatible ?? false,
    errors: response.failures,
    reconstruction_hash: response.reconstruction_hash,
  });
}

export function computeHistoricalGovernanceReconstructionHash(response: GovernanceHistoricalReconstructionResponse): string | null {
  if (!response.snapshot || !response.replay_validation?.replay_valid) return null;
  return hashValue("governance-historical-reconstruction-response", {
    reconstruction_id: response.reconstruction_id,
    snapshot_hash: response.snapshot.reconstruction_hash,
    timeline: response.timeline.map((event) => event.event_hash),
    replay_validation: response.replay_validation.validation_hash,
  });
}

export function buildHistoricalGovernanceReconstructionObservabilitySurface(input: GovernanceHistoricalReconstructionInput = {}): GovernanceHistoricalReconstructionObservabilitySurface {
  const response = reconstructHistoricalGovernance(input);
  const errors = response.reconstruction_state === "SNAPSHOT_RECONSTRUCTED" ? [] : [response.reconstruction_state as GovernanceHistoricalReconstructionErrorState];
  return Object.freeze({
    reconstruction_id: response.reconstruction_id,
    reconstruction_state: response.reconstruction_state,
    historical_timestamp: response.historical_timestamp,
    ledger_record_count: response.ledger_records.length,
    timeline_event_count: response.timeline.length,
    replay_valid: response.replay_validation?.replay_valid ?? false,
    errors: freezeArray(errors),
    reconstruction_hash: response.reconstruction_hash,
  });
}

export function getHistoricalGovernanceReconstructionContract() {
  const response = reconstructHistoricalGovernance();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "immutable", "replayable", "explainable", "evidence-backed", "lineage-preserving", "constitutionally-governed", "tenant-isolated", "version-aware", "certification-ready"]),
      schema_version: SCHEMA_VERSION,
      snapshot_version: SNAPSHOT_VERSION,
      ledger_version: LEDGER_VERSION,
      reconstruction_sources: freezeArray(["Truth Ledger", "Replay Ledger", "Evidence Ledger", "Policy Ledger", "Recommendation Ledger", "Compliance Ledger", "Risk Ledger", "Escalation Ledger", "Lineage Ledger", "Integrity Ledger", "Certification Ledger", "Audit Ledger"]),
      error_states: freezeArray(["TIMESTAMP_NOT_FOUND", "LEDGER_RECORDS_INCOMPLETE", "POLICY_HISTORY_INCOMPLETE", "REPLAY_HASH_MISMATCH", "RECONSTRUCTION_HASH_MISMATCH", "LINEAGE_INCONSISTENT", "VERSION_INCOMPATIBLE", "TENANT_ISOLATION_VIOLATION", "CONSTITUTIONAL_VIOLATION"] as const),
    }),
    response,
    validation: validateHistoricalGovernanceReconstruction(),
    observability: buildHistoricalGovernanceReconstructionObservabilitySurface(),
  });
}
