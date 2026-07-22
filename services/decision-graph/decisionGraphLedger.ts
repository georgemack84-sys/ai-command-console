import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import type {
  DecisionGraphLedgerEntryType,
  DecisionGraphLedgerInput,
  DecisionGraphLedgerReasonCode,
  DecisionGraphLedgerRecord,
  DecisionGraphLedgerResult,
  GraphReplayLedgerRecord,
  GraphSnapshotRecord,
  LedgerIntegrityRecord,
  RelationshipGraphLedgerRecord,
} from "./types";

export const DECISION_GRAPH_LEDGER_VERSION = "decision-graph-ledger/v1";
const LEDGER_TIMESTAMP_REF = "decision-graph-ledger-timestamp-ref";
const GENESIS_HASH = "GENESIS";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionGraphLedgerReasonCode[], reason: DecisionGraphLedgerReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function ledgerHash(record: Omit<DecisionGraphLedgerRecord, "integrity_hash"> | DecisionGraphLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionGraphLedgerRecord;
  return hash(hashable);
}

function snapshotHash(record: Omit<GraphSnapshotRecord, "integrity_hash" | "snapshot_hash">): string {
  return hash(record);
}

function relationshipLedgerHash(record: Omit<RelationshipGraphLedgerRecord, "integrity_hash"> | RelationshipGraphLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as RelationshipGraphLedgerRecord;
  return hash(hashable);
}

function replayLedgerHash(record: Omit<GraphReplayLedgerRecord, "integrity_hash"> | GraphReplayLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as GraphReplayLedgerRecord;
  return hash(hashable);
}

function integrityRecordHash(record: Omit<LedgerIntegrityRecord, "integrity_hash"> | LedgerIntegrityRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as LedgerIntegrityRecord;
  return hash(hashable);
}

function resultHash(result: Omit<DecisionGraphLedgerResult, "integrity_hash"> | DecisionGraphLedgerResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as DecisionGraphLedgerResult;
  return hash(hashable);
}

function relationshipIntegrityHash(relationship: DecisionGraphLedgerInput["relationships"][number]): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function latestEntryHash(entries: readonly DecisionGraphLedgerRecord[]): string {
  return entries.length > 0 ? entries[entries.length - 1].integrity_hash : GENESIS_HASH;
}

function graphGovernanceRefs(input: DecisionGraphLedgerInput): string[] {
  return normalizeStrings([
    ...input.nodes.flatMap((node) => node.governance_refs),
    ...input.relationships.flatMap((relationship) => relationship.governance_refs),
    ...(input.graph_ordering?.ordering_record?.governance_refs ?? []),
  ]);
}

function graphReplayRefs(input: DecisionGraphLedgerInput): string[] {
  return normalizeStrings([
    ...input.nodes.flatMap((node) => node.replay_refs),
    ...input.relationships.flatMap((relationship) => relationship.replay_refs),
    ...(input.graph_ordering?.ordering_record?.replay_refs ?? []),
    input.dependency_validation?.replay_package.expected_replay_hash ?? "",
    input.conflict_detection?.replay_package.expected_replay_hash ?? "",
    input.blocker_detection?.replay_package.expected_replay_hash ?? "",
    input.graph_safety?.replay_package.expected_replay_hash ?? "",
    input.graph_ordering?.replay_hash ?? "",
  ]);
}

function eventPlan(input: DecisionGraphLedgerInput): DecisionGraphLedgerEntryType[] {
  return [
    "GRAPH_CREATED",
    ...input.nodes.map(() => "NODE_REGISTERED" as const),
    ...input.relationships.map(() => "RELATIONSHIP_CREATED" as const),
    ...(input.dependency_validation ? ["DEPENDENCY_VALIDATED" as const] : []),
    ...(input.conflict_detection?.conflicts ?? []).map(() => "CONFLICT_DETECTED" as const),
    ...(input.blocker_detection?.blockers ?? []).map(() => "BLOCKER_DETECTED" as const),
    ...(input.graph_safety?.cycles ?? []).map(() => "CYCLE_DETECTED" as const),
    ...(input.graph_ordering?.ordering_record ? ["GRAPH_ORDERED" as const] : []),
    "GRAPH_SNAPSHOT",
    "REPLAY_VALIDATED",
  ];
}

function buildLedgerEntry(input: {
  source: DecisionGraphLedgerInput;
  entryType: DecisionGraphLedgerEntryType;
  sequence: number;
  previousHash: string;
  nodeRefs?: readonly string[];
  relationshipRefs?: readonly string[];
  dependencyRefs?: readonly string[];
  conflictRefs?: readonly string[];
  blockerRefs?: readonly string[];
  cycleRefs?: readonly string[];
  orderingRefs?: readonly string[];
  evidenceRefs?: readonly string[];
}): DecisionGraphLedgerRecord {
  const governance = graphGovernanceRefs(input.source);
  const replay = graphReplayRefs(input.source);
  const base: Omit<DecisionGraphLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `graph_ledger_${input.source.graph_id}_${String(input.sequence).padStart(6, "0")}_${input.entryType.toLowerCase()}`,
    graph_id: input.source.graph_id,
    entry_type: input.entryType,
    graph_version: input.source.graph_version,
    tenant_id: input.source.tenant_id,
    mission_id: input.source.mission_id,
    node_refs: normalizeStrings(input.nodeRefs ?? []),
    relationship_refs: normalizeStrings(input.relationshipRefs ?? []),
    dependency_refs: normalizeStrings(input.dependencyRefs ?? []),
    conflict_refs: normalizeStrings(input.conflictRefs ?? []),
    blocker_refs: normalizeStrings(input.blockerRefs ?? []),
    cycle_refs: normalizeStrings(input.cycleRefs ?? []),
    ordering_refs: normalizeStrings(input.orderingRefs ?? []),
    replay_refs: replay,
    governance_refs: governance,
    evidence_refs: normalizeStrings(input.evidenceRefs ?? []),
    previous_entry_hash: input.previousHash,
    timestamp: LEDGER_TIMESTAMP_REF,
    ledger_version: input.source.ledger_version ?? DECISION_GRAPH_LEDGER_VERSION,
    sequence: input.sequence,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function buildLedgerEntries(input: DecisionGraphLedgerInput): DecisionGraphLedgerRecord[] {
  const entries: DecisionGraphLedgerRecord[] = [];
  let previousHash = latestEntryHash(input.existing_entries ?? []);
  let sequence = (input.existing_entries?.length ?? 0) + 1;
  const push = (entry: Omit<Parameters<typeof buildLedgerEntry>[0], "source" | "sequence" | "previousHash">): void => {
    const record = buildLedgerEntry({ source: input, sequence, previousHash, ...entry });
    entries.push(record);
    previousHash = record.integrity_hash;
    sequence += 1;
  };

  push({
    entryType: "GRAPH_CREATED",
    nodeRefs: input.nodes.map((node) => node.node_id),
    relationshipRefs: input.relationships.map((relationship) => relationship.relationship_id),
    evidenceRefs: [input.graph_version],
  });
  for (const node of [...input.nodes].sort((a, b) => a.node_id.localeCompare(b.node_id))) {
    push({ entryType: "NODE_REGISTERED", nodeRefs: [node.node_id], evidenceRefs: [node.integrity_hash ?? ""] });
  }
  for (const relationship of [...input.relationships].sort((a, b) => a.relationship_id.localeCompare(b.relationship_id))) {
    push({ entryType: "RELATIONSHIP_CREATED", relationshipRefs: [relationship.relationship_id], evidenceRefs: [relationship.integrity_hash] });
  }
  if (input.dependency_validation) {
    push({
      entryType: "DEPENDENCY_VALIDATED",
      dependencyRefs: input.dependency_validation.validation_records.map((record) => record.validation_id),
      evidenceRefs: [input.dependency_validation.integrity_hash],
    });
  }
  for (const conflict of input.conflict_detection?.conflicts ?? []) {
    push({ entryType: "CONFLICT_DETECTED", conflictRefs: [conflict.conflict_id], evidenceRefs: [conflict.integrity_hash] });
  }
  for (const blocker of input.blocker_detection?.blockers ?? []) {
    push({ entryType: "BLOCKER_DETECTED", blockerRefs: [blocker.blocker_id], evidenceRefs: [blocker.integrity_hash] });
  }
  for (const cycle of input.graph_safety?.cycles ?? []) {
    push({ entryType: "CYCLE_DETECTED", cycleRefs: [cycle.cycle_id], evidenceRefs: [cycle.integrity_hash] });
  }
  if (input.graph_ordering?.ordering_record) {
    push({
      entryType: "GRAPH_ORDERED",
      orderingRefs: [input.graph_ordering.ordering_record.ordering_id],
      evidenceRefs: [input.graph_ordering.ordering_record.integrity_hash],
    });
  }
  push({ entryType: "GRAPH_SNAPSHOT", evidenceRefs: [hash({ nodes: input.nodes, relationships: input.relationships })] });
  push({ entryType: "REPLAY_VALIDATED", orderingRefs: input.graph_ordering?.ordering_record ? [input.graph_ordering.ordering_record.ordering_id] : [], evidenceRefs: [hash(eventPlan(input))] });
  return entries;
}

function buildSnapshot(input: DecisionGraphLedgerInput, entries: readonly DecisionGraphLedgerRecord[]): GraphSnapshotRecord {
  const base: Omit<GraphSnapshotRecord, "integrity_hash" | "snapshot_hash"> = {
    snapshot_id: `graph_snapshot_${input.graph_id}_${String(entries.length).padStart(6, "0")}`,
    graph_id: input.graph_id,
    graph_version: input.graph_version,
    snapshot_type: "GRAPH_SNAPSHOT",
    graph_state: input.graph_ordering?.ordering_record ? "ORDERED" : "ACTIVE",
    node_count: input.nodes.length,
    relationship_count: input.relationships.length,
    dependency_count: input.dependency_validation?.validation_records.length ?? input.relationships.filter((relationship) => relationship.relationship_type === "depends_on").length,
    conflict_count: input.conflict_detection?.conflicts.length ?? 0,
    blocker_count: input.blocker_detection?.blockers.length ?? 0,
    cycle_count: input.graph_safety?.cycles.length ?? 0,
    ordering_state: input.graph_ordering?.ordering_record ? "ORDERED" : "NOT_ORDERED",
    governance_refs: graphGovernanceRefs(input),
    replay_refs: graphReplayRefs(input),
    timestamp: LEDGER_TIMESTAMP_REF,
  };
  const snapshot_hash = snapshotHash(base);
  return Object.freeze({ ...base, snapshot_hash, integrity_hash: hash({ ...base, snapshot_hash }) });
}

function buildRelationshipLedger(input: DecisionGraphLedgerInput): RelationshipGraphLedgerRecord[] {
  return [...input.relationships].sort((a, b) => a.relationship_id.localeCompare(b.relationship_id)).map((relationship) => {
    const base: Omit<RelationshipGraphLedgerRecord, "integrity_hash"> = {
      relationship_entry_id: `relationship_ledger_${relationship.relationship_id}`,
      relationship_id: relationship.relationship_id,
      graph_id: input.graph_id,
      source_node: relationship.source_node_id,
      target_node: relationship.target_node_id,
      relationship_type: relationship.relationship_type,
      relationship_state: "CREATED",
      lineage_refs: normalizeStrings([...relationship.source_candidate_refs, ...relationship.target_candidate_refs]),
      governance_refs: normalizeStrings(relationship.governance_refs),
      replay_refs: normalizeStrings(relationship.replay_refs),
      timestamp: LEDGER_TIMESTAMP_REF,
    };
    return Object.freeze({ ...base, integrity_hash: relationshipLedgerHash(base) });
  });
}

function validateExistingEntries(input: DecisionGraphLedgerInput, reasons: DecisionGraphLedgerReasonCode[]): boolean {
  const entries = [...(input.existing_entries ?? [])].sort((a, b) => a.sequence - b.sequence);
  let previous = GENESIS_HASH;
  let valid = true;
  for (const entry of entries) {
    const hashValid = entry.integrity_hash === ledgerHash(entry);
    const chainValid = entry.previous_entry_hash === previous;
    const scopeValid = entry.graph_id === input.graph_id && entry.tenant_id === input.tenant_id && entry.mission_id === input.mission_id;
    if (!hashValid) {
      addReason(reasons, "INTEGRITY_HASH_MISMATCH");
      valid = false;
    }
    if (!chainValid) {
      addReason(reasons, "PREVIOUS_HASH_MISMATCH");
      valid = false;
    }
    if (!scopeValid) {
      addReason(reasons, "TENANT_ISOLATION_VIOLATED");
      valid = false;
    }
    previous = entry.integrity_hash;
  }
  if (input.expected_previous_entry_hash && input.expected_previous_entry_hash !== previous) {
    addReason(reasons, "APPEND_ONLY_RULE_VIOLATED");
    valid = false;
  }
  if (valid) {
    addReason(reasons, "APPEND_ONLY_HISTORY_VALIDATED");
    addReason(reasons, "PREVIOUS_HASH_CHAIN_VALIDATED");
  }
  return valid;
}

function buildIntegrityRecords(input: DecisionGraphLedgerInput, entries: readonly DecisionGraphLedgerRecord[], replayHashValue: string): LedgerIntegrityRecord[] {
  let previous = latestEntryHash(input.existing_entries ?? []);
  return entries.map((entry) => {
    const hashValid = entry.integrity_hash === ledgerHash(entry);
    const chainValid = entry.previous_entry_hash === previous;
    previous = entry.integrity_hash;
    const base: Omit<LedgerIntegrityRecord, "integrity_hash"> = {
      validation_id: `ledger_integrity_${entry.ledger_entry_id}`,
      graph_id: input.graph_id,
      ledger_entry_id: entry.ledger_entry_id,
      validation_result: hashValid && chainValid ? "PASS" : "FAIL",
      chain_validation: chainValid ? "PASS" : "FAIL",
      hash_validation: hashValid ? "PASS" : "FAIL",
      replay_validation: replayHashValue.length > 0 ? "PASS" : "FAIL",
      validator_version: input.ledger_version ?? DECISION_GRAPH_LEDGER_VERSION,
    };
    return Object.freeze({ ...base, integrity_hash: integrityRecordHash(base) });
  });
}

function buildReplayRecord(input: DecisionGraphLedgerInput, snapshot: GraphSnapshotRecord, entries: readonly DecisionGraphLedgerRecord[]): GraphReplayLedgerRecord {
  const expected = hash({ snapshot, entries, relationships: input.relationships, nodes: input.nodes });
  const replayed = hash({ snapshot, entries, relationships: input.relationships, nodes: input.nodes });
  const base: Omit<GraphReplayLedgerRecord, "integrity_hash"> = {
    replay_id: `graph_replay_ledger_${input.graph_id}`,
    graph_id: input.graph_id,
    graph_version: input.graph_version,
    snapshot_refs: [snapshot.snapshot_id],
    ledger_refs: entries.map((entry) => entry.ledger_entry_id),
    ordering_refs: normalizeStrings(input.graph_ordering?.ordering_record ? [input.graph_ordering.ordering_record.ordering_id] : []),
    validator_versions: normalizeStrings([
      input.dependency_validation?.replay_package.validator_version ?? "",
      input.conflict_detection?.replay_package.detector_version ?? "",
      input.blocker_detection?.replay_package.detector_version ?? "",
      input.graph_safety?.replay_package.validator_version ?? "",
      input.graph_ordering?.ordering_record?.ordering_version ?? "",
      input.ledger_version ?? DECISION_GRAPH_LEDGER_VERSION,
    ]),
    expected_graph_hash: expected,
    replay_graph_hash: replayed,
    comparison_result: expected === replayed ? "MATCH" : "MISMATCH",
  };
  return Object.freeze({ ...base, integrity_hash: replayLedgerHash(base) });
}

function failResult(input: DecisionGraphLedgerInput, reasons: DecisionGraphLedgerReasonCode[]): DecisionGraphLedgerResult {
  const replay = hash({ failed: true, graph_id: input.graph_id, reasons: normalizeStrings(reasons) });
  const base: Omit<DecisionGraphLedgerResult, "integrity_hash"> = {
    ledger_status: "FAIL",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DecisionGraphLedgerReasonCode[]),
    ledger_entries: Object.freeze([]),
    relationship_ledger: Object.freeze([]),
    integrity_records: Object.freeze([]),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function persistDecisionGraphLedger(input: DecisionGraphLedgerInput): DecisionGraphLedgerResult {
  const reasons: DecisionGraphLedgerReasonCode[] = [];
  addReason(reasons, "GRAPH_EVENT_SERIALIZED");
  if ((input.hidden_mutation_refs ?? []).length > 0) return failResult(input, [...reasons, "HIDDEN_LEDGER_MUTATION_DETECTED"]);
  if ((input.expected_graph_version ?? input.graph_version) !== input.graph_version) return failResult(input, [...reasons, "GRAPH_VERSION_MISMATCH"]);
  if (!validateExistingEntries(input, reasons)) return failResult(input, reasons);

  const scoped = input.nodes.every((node) => node.tenant_id === input.tenant_id && node.mission_id === input.mission_id)
    && input.relationships.every((relationship) => input.nodes.some((node) => node.node_id === relationship.source_node_id && node.tenant_id === input.tenant_id && node.mission_id === input.mission_id));
  if (!scoped) return failResult(input, [...reasons, "TENANT_ISOLATION_VIOLATED"]);
  addReason(reasons, "TENANT_ISOLATION_VALIDATED");
  addReason(reasons, "MISSION_ISOLATION_VALIDATED");

  if (!input.relationships.every((relationship) => relationship.integrity_hash === relationshipIntegrityHash(relationship))) return failResult(input, [...reasons, "INTEGRITY_HASH_MISMATCH"]);
  if (!input.relationships.every((relationship) => relationship.source_candidate_refs.length > 0 && relationship.target_candidate_refs.length > 0)) return failResult(input, [...reasons, "RELATIONSHIP_LINEAGE_MISSING"]);
  if (graphGovernanceRefs(input).length === 0) return failResult(input, [...reasons, "GOVERNANCE_REFERENCES_MISSING"]);
  addReason(reasons, "GOVERNANCE_REFERENCES_PRESENT");
  if (graphReplayRefs(input).length === 0) return failResult(input, [...reasons, "REPLAY_REFERENCES_MISSING"]);
  addReason(reasons, "REPLAY_REFERENCES_PRESENT");

  const entries = Object.freeze(buildLedgerEntries(input));
  for (const type of new Set(entries.map((entry) => entry.entry_type))) {
    if (type === "GRAPH_CREATED") addReason(reasons, "GRAPH_CREATION_RECORDED");
    if (type === "NODE_REGISTERED") addReason(reasons, "NODE_REGISTRATION_RECORDED");
    if (type === "RELATIONSHIP_CREATED") addReason(reasons, "RELATIONSHIP_RECORDED");
    if (type === "DEPENDENCY_VALIDATED") addReason(reasons, "DEPENDENCY_VALIDATION_RECORDED");
    if (type === "CONFLICT_DETECTED") addReason(reasons, "CONFLICT_RECORDED");
    if (type === "BLOCKER_DETECTED") addReason(reasons, "BLOCKER_RECORDED");
    if (type === "CYCLE_DETECTED") addReason(reasons, "CYCLE_RECORDED");
    if (type === "GRAPH_ORDERED") addReason(reasons, "GRAPH_ORDERING_RECORDED");
    if (type === "GRAPH_SNAPSHOT") addReason(reasons, "GRAPH_SNAPSHOT_RECORDED");
    if (type === "REPLAY_VALIDATED") addReason(reasons, "REPLAY_LEDGER_RECORDED");
  }

  const snapshot = buildSnapshot(input, entries);
  const relationshipLedger = Object.freeze(buildRelationshipLedger(input));
  const replayRecord = buildReplayRecord(input, snapshot, entries);
  const replay = hash({ entries, snapshot, relationshipLedger, replayRecord });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult(input, [...reasons, "REPLAY_RECONSTRUCTION_IMPOSSIBLE"]);
  if (replayRecord.comparison_result !== "MATCH") return failResult(input, [...reasons, "REPLAY_RECONSTRUCTION_IMPOSSIBLE"]);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH");

  const integrityRecords = Object.freeze(buildIntegrityRecords(input, entries, replay));
  if (!integrityRecords.every((record) => record.validation_result === "PASS")) return failResult(input, [...reasons, "INTEGRITY_HASH_MISMATCH"]);
  addReason(reasons, "ENTRY_HASH_REPRODUCIBLE");
  addReason(reasons, "SNAPSHOT_HASH_REPRODUCIBLE");

  const base: Omit<DecisionGraphLedgerResult, "integrity_hash"> = {
    ledger_status: "PASS",
    certificationStatus: "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DecisionGraphLedgerReasonCode[]),
    ledger_entries: entries,
    snapshot_record: snapshot,
    relationship_ledger: relationshipLedger,
    integrity_records: integrityRecords,
    replay_record: replayRecord,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const DecisionGraphLedger = Object.freeze({
  persist: persistDecisionGraphLedger,
});
