import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeGovernanceEscalationPatterns, replayGovernanceEscalationPatterns } from "@/services/governance-escalation-pattern-intelligence";
import type { GovernanceEscalationInput, GovernanceEscalationResult } from "@/types/governance-escalation-pattern-intelligence";
import type {
  PatternLedger,
  PatternLedgerApiSurface,
  PatternLedgerFailure,
  PatternLedgerFoundation,
  PatternLedgerInput,
  PatternLedgerRecord,
  PatternLedgerResult,
  PatternLedgerValidation,
  PatternLineageRegistry,
  PatternReplayIndex,
} from "@/types/pattern-intelligence-ledger";

const PATTERN_LEDGER_VERSION = "pattern-intelligence-ledger/v1" as const;
const LEDGER_APPEND_TIMESTAMP = "2026-07-09T00:00:00.000Z";
const GENESIS_HASH = "GENESIS";

type Scenario = NonNullable<PatternLedgerInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function governanceScenario(scenario: Scenario): GovernanceEscalationInput["scenario"] {
  const map: Partial<Record<Scenario, GovernanceEscalationInput["scenario"]>> = {
    MISSING_GOVERNANCE_INPUT: "MISSING_SCORING",
    UNCERTIFIED_GOVERNANCE_INPUT: "REJECTED_SCORING",
    MISSING_REPLAY: "MISSING_REPLAY",
    MISSING_GOVERNANCE_REFS: "MISSING_GOVERNANCE_LINEAGE",
    MISSING_EVIDENCE: "MISSING_CERTIFICATION_EVIDENCE",
    CROSS_TENANT: "CROSS_TENANT",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    MISSING_EXPLANATION: "MISSING_EXPLANATION",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternLedgerInput, scenario: Scenario): GovernanceEscalationResult {
  if (input.governance_result) return input.governance_result;
  return analyzeGovernanceEscalationPatterns({ scenario: governanceScenario(scenario) });
}

function buildApiSurface(): PatternLedgerApiSurface {
  const base: Omit<PatternLedgerApiSurface, "integrity_hash"> = {
    api_id: "pattern_intelligence_ledger_api",
    append_pattern_record: "POST /pattern-intelligence-ledger/append",
    retrieve_pattern_record: "POST /pattern-intelligence-ledger/record",
    retrieve_pattern_history: "POST /pattern-intelligence-ledger/history",
    query_ledger: "POST /pattern-intelligence-ledger/query",
    verify_integrity: "POST /pattern-intelligence-ledger/integrity",
    retrieve_lineage: "POST /pattern-intelligence-ledger/lineage",
    replay_ledger: "POST /pattern-intelligence-ledger/replay",
    retrieve_contract: "GET /pattern-intelligence-ledger/contract",
    update_supported: false,
    delete_supported: false,
    autonomous_learning_supported: false,
    governance_mutation_supported: false,
    execution_decision_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceRefs(record: GovernanceEscalationResult["governance_pattern_records"][number], scenario: Scenario): readonly string[] {
  if (scenario === "MISSING_EVIDENCE") return freezeArray([]);
  return freezeArray([...record.supporting_pattern_refs, ...record.supporting_governance_refs, ...record.supporting_authority_refs, ...record.supporting_certification_refs]);
}

function buildLineageParents(record: GovernanceEscalationResult["governance_pattern_records"][number], scenario: Scenario): readonly string[] {
  if (scenario === "MISSING_LINEAGE") return freezeArray([]);
  return freezeArray([record.pattern_id, record.governance_pattern_id, ...record.supporting_pattern_refs]);
}

function buildLedgerRecords(governanceResult: GovernanceEscalationResult, scenario: Scenario): readonly PatternLedgerRecord[] {
  if (scenario === "MISSING_GOVERNANCE_INPUT") return freezeArray([]);
  let previousHash = GENESIS_HASH;
  return freezeArray(governanceResult.governance_pattern_records.map((governanceRecord, index) => {
    const scoringRecord = governanceResult.scoring_result.score_records.find((score) => score.pattern_id === governanceRecord.pattern_id);
    const appendSequence = scenario === "INVALID_APPEND_ORDER" ? index + 2 : index + 1;
    const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : governanceRecord.replay_refs;
    const governanceRefs = scenario === "MISSING_GOVERNANCE_REFS" ? freezeArray([]) : governanceRecord.supporting_governance_refs;
    const scoringRefs = scenario === "MISSING_SCORING" ? freezeArray([]) : freezeArray(scoringRecord ? [scoringRecord.score_id] : []);
    const certificationRefs = scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : governanceRecord.supporting_certification_refs;
    const explanation = scenario === "MISSING_EXPLANATION"
      ? ""
      : `Ledger entry preserves ${governanceRecord.pattern_id} with recurrence, evidence, scoring, governance, certification, lineage, replay, and integrity context.`;
    const base: Omit<PatternLedgerRecord, "integrity_hash"> = {
      ledger_record_id: `pattern_ledger_${hash(`${governanceRecord.governance_pattern_id}:${appendSequence}`).slice(0, 16)}`,
      pattern_id: governanceRecord.pattern_id,
      tenant_id: scenario === "CROSS_TENANT" ? `${governanceRecord.tenant_id}:foreign` : governanceRecord.tenant_id,
      mission_scope: governanceRecord.mission_scope,
      pattern_type: governanceRecord.governance_pattern_type,
      pattern_summary: governanceRecord.governance_summary,
      pattern_version: "pattern-intelligence/v1",
      recurrence_history_refs: freezeArray([`${governanceRecord.pattern_id}:recurrence-history:v1`]),
      evidence_refs: buildEvidenceRefs(governanceRecord, scenario),
      replay_refs: replayRefs,
      scoring_refs: scoringRefs,
      governance_review_refs: governanceRefs,
      certification_refs: certificationRefs,
      lineage_parent_refs: buildLineageParents(governanceRecord, scenario),
      lineage_child_refs: scenario === "SUPERSEDED" ? freezeArray([`${governanceRecord.pattern_id}:child:v2`]) : freezeArray([]),
      append_timestamp: LEDGER_APPEND_TIMESTAMP,
      append_sequence: appendSequence,
      previous_record_hash: scenario === "HASH_CHAIN_BREAK" ? hash("broken-chain") : previousHash,
      ledger_version: PATTERN_LEDGER_VERSION,
      lifecycle_state: scenario === "SUPERSEDED" ? "SUPERSEDED" : "ACTIVE",
      explanation,
      advisory_only: true,
      immutable: true,
      append_only: true,
      update_supported: false,
      delete_supported: false,
      mutates_intelligence: false,
      modifies_governance: false,
      modifies_recommendations: false,
      execution_decision: false,
    };
    const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    previousHash = record.integrity_hash;
    if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.ledger_record_id }) });
    if (scenario === "RECORD_MUTATION") return Object.freeze({ ...record, mutates_intelligence: true as false });
    if (scenario === "DELETE_OPERATION") return Object.freeze({ ...record, delete_supported: true as false });
    if (scenario === "UPDATE_OPERATION") return Object.freeze({ ...record, update_supported: true as false });
    return record;
  }));
}

function buildLedger(governanceResult: GovernanceEscalationResult, records: readonly PatternLedgerRecord[], scenario: Scenario): PatternLedger {
  const base: Omit<PatternLedger, "integrity_hash"> = {
    ledger_id: `pattern_intelligence_ledger_${hash(governanceResult.registry.registry_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${governanceResult.registry.tenant_id}:foreign` : governanceResult.registry.tenant_id,
    records,
    record_refs: records.map((record) => record.ledger_record_id),
    append_only: true,
    immutable: true,
    update_supported: false,
    delete_supported: false,
    deleted: scenario === "DELETE_OPERATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineageRegistry(ledger: PatternLedger): PatternLineageRegistry {
  const parent_index = ledger.records.reduce((index, record) => {
    return { ...index, [record.ledger_record_id]: record.lineage_parent_refs };
  }, {} as Record<string, readonly string[]>);
  const child_index = ledger.records.reduce((index, record) => {
    return { ...index, [record.ledger_record_id]: record.lineage_child_refs };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<PatternLineageRegistry, "integrity_hash"> = {
    registry_id: `${ledger.ledger_id}:lineage`,
    tenant_id: ledger.tenant_id,
    parent_index: Object.freeze(parent_index),
    child_index: Object.freeze(child_index),
    replay_lineage_refs: freezeArray(ledger.records.flatMap((record) => record.replay_refs)),
    governance_lineage_refs: freezeArray(ledger.records.flatMap((record) => record.governance_review_refs)),
    scoring_lineage_refs: freezeArray(ledger.records.flatMap((record) => record.scoring_refs)),
    evidence_lineage_refs: freezeArray(ledger.records.flatMap((record) => record.evidence_refs)),
    immutable: true,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayIndex(ledger: PatternLedger): PatternReplayIndex {
  const base: Omit<PatternReplayIndex, "integrity_hash"> = {
    replay_index_id: `${ledger.ledger_id}:replay`,
    tenant_id: ledger.tenant_id,
    pattern_refs: freezeArray(ledger.records.map((record) => record.pattern_id)),
    ledger_sequence: freezeArray(ledger.records.map((record) => record.append_sequence)),
    replay_refs: freezeArray(ledger.records.flatMap((record) => record.replay_refs)),
    lineage_graph_refs: freezeArray(ledger.records.flatMap((record) => [record.ledger_record_id, ...record.lineage_parent_refs, ...record.lineage_child_refs])),
    evidence_refs: freezeArray(ledger.records.flatMap((record) => record.evidence_refs)),
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function chainValid(records: readonly PatternLedgerRecord[]): boolean {
  return records.every((record, index) => {
    const expectedPrevious = index === 0 ? GENESIS_HASH : records[index - 1].integrity_hash;
    return record.previous_record_hash === expectedPrevious;
  });
}

function appendOrderingValid(records: readonly PatternLedgerRecord[]): boolean {
  return records.every((record, index) => record.append_sequence === index + 1);
}

function collectFailures(governanceResult: GovernanceEscalationResult, ledger: PatternLedger, scenario: Scenario): readonly PatternLedgerFailure[] {
  const failures: PatternLedgerFailure[] = [];
  const recordsVerified = ledger.records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  if (scenario === "MISSING_GOVERNANCE_INPUT" || !ledger.records.length) failures.push("GOVERNANCE_INPUT_MISSING");
  if (scenario === "UNCERTIFIED_GOVERNANCE_INPUT" || !governanceResult.validation.certified) failures.push("GOVERNANCE_INPUT_UNCERTIFIED");
  if (scenario === "MISSING_LINEAGE" || ledger.records.some((record) => !record.lineage_parent_refs.length)) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "MISSING_REPLAY" || ledger.records.some((record) => !record.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE_REFS" || ledger.records.some((record) => !record.governance_review_refs.length)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_EVIDENCE" || ledger.records.some((record) => !record.evidence_refs.length)) failures.push("EVIDENCE_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_SCORING" || ledger.records.some((record) => !record.scoring_refs.length)) failures.push("SCORING_REFERENCES_MISSING");
  if (scenario === "MISSING_CERTIFICATION" || ledger.records.some((record) => !record.certification_refs.length)) failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (scenario === "INVALID_APPEND_ORDER" || !appendOrderingValid(ledger.records)) failures.push("APPEND_ORDERING_INVALID");
  if (scenario === "CROSS_TENANT" || ledger.tenant_id !== governanceResult.registry.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATED");
  if (scenario === "REPLAY_DIVERGENCE" || !replayGovernanceEscalationPatterns(governanceResult)) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || !recordsVerified || hashWithoutIntegrity(ledger) !== ledger.integrity_hash) failures.push("INTEGRITY_HASH_GENERATION_FAILED");
  if (scenario === "HASH_CHAIN_BREAK" || !chainValid(ledger.records)) failures.push("HASH_CHAIN_INVALID");
  if (scenario === "RECORD_MUTATION" || ledger.records.some((record) => record.mutates_intelligence)) failures.push("RECORD_MUTATION_DETECTED");
  if (scenario === "DELETE_OPERATION" || ledger.deleted || ledger.delete_supported || ledger.records.some((record) => record.delete_supported)) failures.push("DELETE_OPERATION_DETECTED");
  if (scenario === "UPDATE_OPERATION" || ledger.update_supported || ledger.records.some((record) => record.update_supported)) failures.push("UPDATE_OPERATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || ledger.records.some((record) => !record.explanation || !record.pattern_summary)) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly PatternLedgerFailure[]): PatternLedgerValidation["state"] {
  if (failures.includes("EVIDENCE_REFERENCES_INCOMPLETE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(ledger: PatternLedger, lineageRegistry: PatternLineageRegistry, replayIndex: PatternReplayIndex, failures: readonly PatternLedgerFailure[]): PatternLedgerValidation {
  const recordsVerified = ledger.records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const lineageVerified = hashWithoutIntegrity(lineageRegistry) === lineageRegistry.integrity_hash;
  const replayIndexVerified = hashWithoutIntegrity(replayIndex) === replayIndex.integrity_hash;
  const base: Omit<PatternLedgerValidation, "integrity_hash"> = {
    validation_id: "pattern_intelligence_ledger_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && ledgerVerified && lineageVerified && replayIndexVerified,
    failures,
    governance_input_accepted: !failures.includes("GOVERNANCE_INPUT_MISSING") && !failures.includes("GOVERNANCE_INPUT_UNCERTIFIED"),
    integrity_verified: recordsVerified && ledgerVerified && lineageVerified && replayIndexVerified,
    hash_chain_valid: !failures.includes("HASH_CHAIN_INVALID"),
    append_ordering_valid: !failures.includes("APPEND_ORDERING_INVALID"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    replay_references_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_references_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    evidence_references_complete: !failures.includes("EVIDENCE_REFERENCES_INCOMPLETE"),
    scoring_references_complete: !failures.includes("SCORING_REFERENCES_MISSING"),
    certification_references_complete: !failures.includes("CERTIFICATION_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_VIOLATED"),
    replay_validated: !failures.includes("REPLAY_DIVERGENCE_DETECTED"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    append_only: ledger.append_only,
    immutable: ledger.immutable,
    advisory_only: ledger.records.every((record) => record.advisory_only),
    no_updates: !ledger.update_supported && ledger.records.every((record) => !record.update_supported),
    no_deletes: !ledger.delete_supported && !ledger.deleted && ledger.records.every((record) => !record.delete_supported),
    no_autonomous_learning: ledger.records.every((record) => !record.mutates_intelligence),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_replay_hash: result.governance_result.replay_hash,
    ledger: result.ledger,
    lineage_registry: result.lineage_registry,
    replay_index: result.replay_index,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<PatternLedgerResult, "integrity_hash">): string {
  return hash({
    pattern_intelligence_ledger_version: result.pattern_intelligence_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    governance_hash: result.governance_result.integrity_hash,
    ledger_hash: result.ledger.integrity_hash,
    lineage_hash: result.lineage_registry.integrity_hash,
    replay_index_hash: result.replay_index.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    append_only: result.append_only,
    immutable: result.immutable,
    advisory_only: result.advisory_only,
  });
}

export function appendPatternIntelligenceLedger(input: PatternLedgerInput = {}): PatternLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const governance_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const records = buildLedgerRecords(governance_result, scenario);
  const ledger = buildLedger(governance_result, records, scenario);
  const lineage_registry = buildLineageRegistry(ledger);
  const replay_index = buildReplayIndex(ledger);
  const failures = collectFailures(governance_result, ledger, scenario);
  const validation = buildValidation(ledger, lineage_registry, replay_index, failures);
  const base: Omit<PatternLedgerResult, "integrity_hash" | "replay_hash"> = {
    pattern_intelligence_ledger_version: PATTERN_LEDGER_VERSION,
    governance_result,
    api_surface,
    ledger,
    lineage_registry,
    replay_index,
    validation,
    deterministic: true,
    replayable: true,
    cryptographically_verifiable: true,
    governance_aware: true,
    constitutionally_compliant: true,
    operator_visible: true,
    tenant_isolated: true,
    advisory_only: true,
    append_only: true,
    immutable: true,
    autonomous_learning: false,
    modifies_recommendations: false,
    modifies_governance: false,
    execution_decision: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternIntelligenceLedger(result: PatternLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayGovernanceEscalationPatterns(result.governance_result);
}

export function computePatternLedgerRecordHash(record: Omit<PatternLedgerRecord, "integrity_hash"> | PatternLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

export function getPatternIntelligenceLedgerFoundation(): PatternLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_intelligence_ledger_version: PATTERN_LEDGER_VERSION,
    api_surface,
    result: appendPatternIntelligenceLedger(),
  });
}

export const PatternIntelligenceLedger = Object.freeze({
  append: appendPatternIntelligenceLedger,
  replay: replayPatternIntelligenceLedger,
});
