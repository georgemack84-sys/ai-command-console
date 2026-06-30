import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceIntegrityContract } from "@/services/governance-integrity-contract";
import type { GovernanceIntegrityContract, GovernanceIntegrityObjectType, GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type {
  GovernanceCanonicalSerialization,
  GovernanceHashChainExecution,
  GovernanceHashChainFailureReason,
  GovernanceHashChainInput,
  GovernanceHashChainObservabilitySurface,
  GovernanceHashChainRecord,
  GovernanceHashChainScenario,
  GovernanceHashChainValidationIssue,
  GovernanceHashChainValidationReport,
  GovernanceHashGeneration,
  GovernanceIntegrityLedgerEntry,
  GovernanceLineageHashGraph,
  GovernanceReplayHashChain,
} from "@/types/governance-hash-chain";

const NOW = "2026-06-27T10:30:00.000Z";
const SCHEMA_VERSION = "governance-hash-chain-engine/v7I.2" as const;
const CHAIN_VERSION = "governance-hash-chain/v7I.2" as const;
const SERIALIZER_VERSION = "governance-canonical-serializer/v7I.2" as const;
const HASH_ALGORITHM = "SHA-256" as const;
const GENESIS_HASH = "GENESIS";

const FAILURE_STATE: Readonly<Record<GovernanceHashChainFailureReason, GovernanceIntegrityState>> = Object.freeze({
  CANONICAL_SERIALIZATION_MISMATCH: "CORRUPTED",
  CONTENT_HASH_MISMATCH: "CORRUPTED",
  PREVIOUS_HASH_MISMATCH: "CORRUPTED",
  ROOT_HASH_MISMATCH: "CORRUPTED",
  MISSING_CHAIN_RECORD: "CORRUPTED",
  DUPLICATE_CHAIN_POSITION: "CORRUPTED",
  REORDERED_CHAIN: "CORRUPTED",
  REPLAY_HASH_MISMATCH: "CORRUPTED",
  UNSUPPORTED_HASH_ALGORITHM: "DEGRADED",
  MISSING_LINEAGE_REFERENCE: "DEGRADED",
  LEDGER_PERSISTENCE_DELAY: "DEGRADED",
  CROSS_TENANT_LINKAGE: "CORRUPTED",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function classify(reason: GovernanceHashChainFailureReason): GovernanceIntegrityState {
  return FAILURE_STATE[reason];
}

export function classifyGovernanceHashChainFailure(reason: GovernanceHashChainFailureReason): GovernanceIntegrityState {
  return classify(reason);
}

function statePrecedence(state: GovernanceIntegrityState): number {
  return state === "CORRUPTED" ? 3 : state === "DEGRADED" ? 2 : 1;
}

function deriveState(issues: readonly GovernanceHashChainValidationIssue[]): GovernanceIntegrityState {
  return issues.reduce<GovernanceIntegrityState>((current, issue) => statePrecedence(issue.state) > statePrecedence(current) ? issue.state : current, "VALID");
}

function issue(reason: GovernanceHashChainFailureReason, path: string, message: string): GovernanceHashChainValidationIssue {
  return Object.freeze({ reason, state: classify(reason), path, message });
}

export function canonicalizeGovernanceArtifact(payload: unknown, schemaVersion: string = SCHEMA_VERSION): GovernanceCanonicalSerialization {
  const canonical_payload = canonicalizeConfidenceToString({
    serializer_version: SERIALIZER_VERSION,
    schema_version: schemaVersion,
    payload,
  });
  return Object.freeze({
    serializer_version: SERIALIZER_VERSION,
    schema_version: schemaVersion,
    canonical_payload,
    canonical_hash: hashValue("governance-hash-chain-canonical", canonical_payload),
    deterministic: true,
  });
}

export function generateGovernanceArtifactHash(canonical: GovernanceCanonicalSerialization): GovernanceHashGeneration {
  return Object.freeze({
    content_hash: hashValue("governance-hash-chain-content", canonical.canonical_payload),
    canonical_hash: canonical.canonical_hash,
    hash_algorithm: HASH_ALGORITHM,
    hash_version: CHAIN_VERSION,
    hash_timestamp: NOW,
  });
}

type ChainArtifact = Readonly<{
  object_id: string;
  object_type: GovernanceIntegrityObjectType;
  payload: unknown;
  lineage_parent_record_id: string | null;
}>;

function artifactsFromContract(contract: GovernanceIntegrityContract): readonly ChainArtifact[] {
  return freezeArray([
    {
      object_id: contract.lineage.root_record_id,
      object_type: "GOVERNANCE_RECORD",
      payload: { root_record_id: contract.lineage.root_record_id, tenant_id: contract.identity.tenant_id, mission_id: contract.identity.mission_id },
      lineage_parent_record_id: null,
    },
    {
      object_id: contract.evidence_references.policy_ids[0] ?? "policy-missing",
      object_type: "POLICY",
      payload: { policy_ids: contract.evidence_references.policy_ids, integrity_record_id: contract.identity.integrity_record_id },
      lineage_parent_record_id: contract.lineage.root_record_id,
    },
    {
      object_id: contract.evidence_references.compliance_ids[0] ?? "compliance-missing",
      object_type: "COMPLIANCE_EVALUATION",
      payload: { compliance_ids: contract.evidence_references.compliance_ids, policy_ids: contract.evidence_references.policy_ids },
      lineage_parent_record_id: contract.evidence_references.policy_ids[0] ?? contract.lineage.root_record_id,
    },
    {
      object_id: contract.evidence_references.risk_ids[0] ?? "risk-missing",
      object_type: "RISK_ASSESSMENT",
      payload: { risk_ids: contract.evidence_references.risk_ids, compliance_ids: contract.evidence_references.compliance_ids },
      lineage_parent_record_id: contract.evidence_references.compliance_ids[0] ?? contract.lineage.root_record_id,
    },
    {
      object_id: contract.evidence_references.recommendation_ids[0] ?? "recommendation-missing",
      object_type: "GOVERNANCE_RECOMMENDATION",
      payload: { recommendation_ids: contract.evidence_references.recommendation_ids, risk_ids: contract.evidence_references.risk_ids },
      lineage_parent_record_id: contract.evidence_references.risk_ids[0] ?? contract.lineage.root_record_id,
    },
    {
      object_id: contract.replay_references.replay_id,
      object_type: "REPLAY_RECORD",
      payload: contract.replay_references,
      lineage_parent_record_id: contract.evidence_references.recommendation_ids[0] ?? contract.lineage.root_record_id,
    },
    {
      object_id: contract.identity.governance_object_id,
      object_type: "CERTIFICATION_RECORD",
      payload: {
        certification_metadata: contract.certification_metadata,
        verification_metadata: contract.verification_metadata,
        record_hash: contract.record_hash,
      },
      lineage_parent_record_id: contract.replay_references.replay_id,
    },
  ]);
}

function recordHashSource(record: Omit<GovernanceHashChainRecord, "current_hash" | "root_hash">): Record<string, unknown> {
  return {
    chain_id: record.chain_id,
    record_id: record.record_id,
    integrity_record_id: record.integrity_record_id,
    governance_object_id: record.governance_object_id,
    governance_object_type: record.governance_object_type,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    chain_position: record.chain_position,
    chain_version: record.chain_version,
    previous_hash: record.previous_hash,
    canonical_hash: record.canonical.canonical_hash,
    content_hash: record.hash_generation.content_hash,
    lineage_parent_record_id: record.lineage_parent_record_id,
    replay_id: record.replay_id,
    replay_hash: record.replay_hash,
    reconstruction_hash: record.reconstruction_hash,
    truth_ledger_reference: record.truth_ledger_reference,
  };
}

function buildRecords(contract: GovernanceIntegrityContract): readonly GovernanceHashChainRecord[] {
  const chain_id = `GHCE-7I2-${hashValue("governance-hash-chain-id", { tenant: contract.identity.tenant_id, mission: contract.identity.mission_id, root: contract.lineage.root_record_id }).slice(0, 10).toUpperCase()}`;
  const records: GovernanceHashChainRecord[] = [];
  let previousHash: string | null = null;
  let rootHash = "";
  artifactsFromContract(contract).forEach((artifact, index) => {
    const canonical = canonicalizeGovernanceArtifact(artifact.payload);
    const hash_generation = generateGovernanceArtifactHash(canonical);
    const withoutHashes = {
      chain_id,
      record_id: `GHCR-7I2-${hashValue("governance-hash-chain-record-id", { chain_id, object_id: artifact.object_id, index }).slice(0, 10).toUpperCase()}`,
      integrity_record_id: contract.identity.integrity_record_id,
      governance_object_id: artifact.object_id,
      governance_object_type: artifact.object_type,
      tenant_id: contract.identity.tenant_id,
      mission_id: contract.identity.mission_id,
      chain_position: index,
      chain_version: CHAIN_VERSION,
      previous_hash: previousHash,
      canonical,
      hash_generation,
      lineage_parent_record_id: artifact.lineage_parent_record_id,
      replay_id: contract.replay_references.replay_id,
      replay_hash: contract.replay_references.replay_hash,
      reconstruction_hash: contract.replay_references.reconstruction_hash,
      truth_ledger_reference: contract.replay_references.truth_ledger_reference,
      verification_status: "VERIFIED" as const,
      verification_timestamp: NOW,
    };
    const current_hash = hashValue("governance-hash-chain-record", recordHashSource(withoutHashes));
    rootHash = index === 0 ? current_hash : rootHash;
    const record = Object.freeze({ ...withoutHashes, current_hash, root_hash: rootHash });
    records.push(record);
    previousHash = current_hash;
  });
  return freezeArray(records);
}

function buildLineageGraph(records: readonly GovernanceHashChainRecord[]): GovernanceLineageHashGraph {
  const edges = records.slice(1).map((record, index) => {
    const from_record_id = records[index].record_id;
    const to_record_id = record.record_id;
    return Object.freeze({ from_record_id, to_record_id, edge_hash: hashValue("governance-hash-chain-lineage-edge", { from_record_id, to_record_id, current_hash: record.current_hash }) });
  });
  const source = {
    chain_id: records[0]?.chain_id ?? "",
    root_hash: records[0]?.root_hash ?? "",
    ancestry_record_ids: records.map((record) => record.record_id),
    lineage_edges: edges,
  };
  return Object.freeze({ ...source, ancestry_record_ids: freezeArray(source.ancestry_record_ids), lineage_edges: freezeArray(edges), lineage_hash: hashValue("governance-hash-chain-lineage-graph", source) });
}

function buildReplayChain(contract: GovernanceIntegrityContract, records: readonly GovernanceHashChainRecord[]): GovernanceReplayHashChain {
  const replayRecord = records.find((record) => record.governance_object_type === "REPLAY_RECORD") ?? records[0];
  const certificationRecord = records.find((record) => record.governance_object_type === "CERTIFICATION_RECORD") ?? records[records.length - 1];
  const source = {
    replay_id: contract.replay_references.replay_id,
    replay_input_hash: records[1]?.current_hash ?? "",
    replay_state_hash: records[3]?.current_hash ?? "",
    replay_output_hash: certificationRecord?.current_hash ?? "",
    reconstruction_hash: contract.replay_references.reconstruction_hash,
    replay_verification_hash: replayRecord?.current_hash ?? "",
    truth_ledger_reference: contract.replay_references.truth_ledger_reference,
  };
  return Object.freeze({ ...source, replay_chain_hash: hashValue("governance-hash-chain-replay", source) });
}

function buildLedgerEntries(records: readonly GovernanceHashChainRecord[]): readonly GovernanceIntegrityLedgerEntry[] {
  return freezeArray(records.map((record) => {
    const source = {
      chain_id: record.chain_id,
      record_id: record.record_id,
      previous_hash: record.previous_hash,
      current_hash: record.current_hash,
      root_hash: record.root_hash,
      hash_algorithm: record.hash_generation.hash_algorithm,
      verification_status: record.verification_status,
      verification_timestamp: record.verification_timestamp,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      append_only: true as const,
    };
    return Object.freeze({ ...source, ledger_hash: hashValue("governance-hash-chain-ledger-entry", source) });
  }));
}

function applyScenario(execution: Omit<GovernanceHashChainExecution, "validation" | "chain_execution_hash">, scenario: GovernanceHashChainScenario): Omit<GovernanceHashChainExecution, "validation" | "chain_execution_hash"> {
  const records = [...execution.records];
  if (scenario === "MISSING_CHAIN_RECORD") records.splice(3, 1);
  if (scenario === "DUPLICATE_CHAIN_POSITION" && records[2]) records[2] = Object.freeze({ ...records[2], chain_position: records[1].chain_position });
  if (scenario === "REORDERED_CHAIN" && records[2] && records[3]) [records[2], records[3]] = [records[3], records[2]];
  if (scenario === "CONTENT_HASH_MISMATCH" && records[1]) records[1] = Object.freeze({ ...records[1], hash_generation: { ...records[1].hash_generation, content_hash: "tampered-content-hash" } });
  if (scenario === "CANONICAL_SERIALIZATION_MISMATCH" && records[1]) records[1] = Object.freeze({ ...records[1], canonical: { ...records[1].canonical, canonical_payload: `${records[1].canonical.canonical_payload}:unstable` } });
  if (scenario === "PREVIOUS_HASH_MISMATCH" && records[2]) records[2] = Object.freeze({ ...records[2], previous_hash: "broken-previous-hash" });
  if (scenario === "ROOT_HASH_MISMATCH" && records[2]) records[2] = Object.freeze({ ...records[2], root_hash: "broken-root-hash" });
  if (scenario === "REPLAY_HASH_MISMATCH" && records[5]) records[5] = Object.freeze({ ...records[5], replay_hash: "broken-replay-hash" });
  if (scenario === "UNSUPPORTED_HASH_ALGORITHM" && records[1]) records[1] = Object.freeze({ ...records[1], hash_generation: { ...records[1].hash_generation, hash_algorithm: "MD5" as "SHA-256" } });
  if (scenario === "MISSING_LINEAGE_REFERENCE" && records[3]) {
    records[3] = Object.freeze({ ...records[3], lineage_parent_record_id: null });
    const resealed = resealRecords(records);
    return Object.freeze({ ...execution, root_hash: resealed[0]?.root_hash ?? execution.root_hash, records: resealed, lineage_graph: buildLineageGraph(resealed), ledger_entries: buildLedgerEntries(resealed) });
  }
  if (scenario === "LEDGER_PERSISTENCE_DELAY") return Object.freeze({ ...execution, ledger_entries: freezeArray(execution.ledger_entries.slice(0, -1)) });
  if (scenario === "CROSS_TENANT_LINKAGE" && records[2]) records[2] = Object.freeze({ ...records[2], tenant_id: "tenant_external" });
  const lineage_graph = buildLineageGraph(records);
  return Object.freeze({ ...execution, records: freezeArray(records), lineage_graph });
}

function recomputeCurrentHash(record: GovernanceHashChainRecord): string {
  const { current_hash: _current, root_hash: _root, ...withoutHashes } = record;
  return hashValue("governance-hash-chain-record", recordHashSource(withoutHashes));
}

function resealRecords(records: readonly GovernanceHashChainRecord[]): readonly GovernanceHashChainRecord[] {
  let previousHash: string | null = null;
  let rootHash = "";
  return freezeArray(records.map((record, index) => {
    const base = Object.freeze({ ...record, chain_position: index, previous_hash: previousHash, root_hash: rootHash });
    const current_hash = recomputeCurrentHash(base);
    rootHash = index === 0 ? current_hash : rootHash;
    const resealed = Object.freeze({ ...base, current_hash, root_hash: rootHash });
    previousHash = current_hash;
    return resealed;
  }));
}

function validateRecords(execution: Omit<GovernanceHashChainExecution, "validation" | "chain_execution_hash">): GovernanceHashChainValidationIssue[] {
  const issues: GovernanceHashChainValidationIssue[] = [];
  const records = execution.records;
  if (records.length < 7) issues.push(issue("MISSING_CHAIN_RECORD", "records", "Governance hash chain has a missing record."));
  const positions = records.map((record) => record.chain_position);
  if (new Set(positions).size !== positions.length) issues.push(issue("DUPLICATE_CHAIN_POSITION", "records.chain_position", "Multiple records share the same chain position."));
  if (positions.some((position, index) => position !== index)) issues.push(issue("REORDERED_CHAIN", "records.chain_position", "Chain positions must be sequential and deterministic."));
  const rootHash = records[0]?.current_hash ?? null;
  records.forEach((record, index) => {
    const parsedCanonical = (() => {
      try {
        return JSON.parse(record.canonical.canonical_payload) as { payload?: unknown };
      } catch {
        return null;
      }
    })();
    const canonical = parsedCanonical ? canonicalizeGovernanceArtifact(parsedCanonical.payload, record.canonical.schema_version) : null;
    if (!canonical || canonical.canonical_payload !== record.canonical.canonical_payload || canonical.canonical_hash !== record.canonical.canonical_hash) {
      issues.push(issue("CANONICAL_SERIALIZATION_MISMATCH", `records.${index}.canonical`, "Canonical serialization must be deterministic."));
    }
    const generated = generateGovernanceArtifactHash(record.canonical);
    if (generated.content_hash !== record.hash_generation.content_hash || generated.canonical_hash !== record.hash_generation.canonical_hash) {
      issues.push(issue("CONTENT_HASH_MISMATCH", `records.${index}.hash_generation`, "Stored content hash differs from computed hash."));
    }
    if (record.hash_generation.hash_algorithm !== HASH_ALGORITHM || record.hash_generation.hash_version !== CHAIN_VERSION) {
      issues.push(issue("UNSUPPORTED_HASH_ALGORITHM", `records.${index}.hash_generation.hash_algorithm`, "Unsupported hash algorithm or version."));
    }
    const expectedPrevious = index === 0 ? null : records[index - 1]?.current_hash;
    if (record.previous_hash !== expectedPrevious) {
      issues.push(issue("PREVIOUS_HASH_MISMATCH", `records.${index}.previous_hash`, "Previous hash does not match the prior chain record."));
    }
    if (record.root_hash !== rootHash) {
      issues.push(issue("ROOT_HASH_MISMATCH", `records.${index}.root_hash`, "Root hash was altered or does not match chain root."));
    }
    if (recomputeCurrentHash(record) !== record.current_hash) {
      issues.push(issue("CONTENT_HASH_MISMATCH", `records.${index}.current_hash`, "Current hash is not reproducible."));
    }
    if (!record.lineage_parent_record_id && index > 0) {
      issues.push(issue("MISSING_LINEAGE_REFERENCE", `records.${index}.lineage_parent_record_id`, "Lineage parent reference is required for non-root records."));
    }
    if (record.tenant_id !== execution.tenant_id) {
      issues.push(issue("CROSS_TENANT_LINKAGE", `records.${index}.tenant_id`, "Cross-tenant hash-chain linkage is prohibited."));
    }
    if (record.replay_hash !== records[0]?.replay_hash) {
      issues.push(issue("REPLAY_HASH_MISMATCH", `records.${index}.replay_hash`, "Replay hash differs across chain records."));
    }
  });
  if (execution.ledger_entries.length !== records.length) {
    issues.push(issue("LEDGER_PERSISTENCE_DELAY", "ledger_entries", "Integrity ledger entries have not all been committed."));
  }
  return issues;
}

function validationReport(execution: Omit<GovernanceHashChainExecution, "validation" | "chain_execution_hash">): GovernanceHashChainValidationReport {
  const failures = freezeArray(validateRecords(execution));
  const validation_state = deriveState(failures);
  const has = (reason: GovernanceHashChainFailureReason) => failures.some((failure) => failure.reason === reason);
  const source = {
    chain_id: execution.chain_id,
    validation_state,
    valid: validation_state === "VALID",
    record_count: execution.records.length,
    root_hash: execution.root_hash,
    canonical_serialization_valid: !has("CANONICAL_SERIALIZATION_MISMATCH"),
    content_hashes_valid: !has("CONTENT_HASH_MISMATCH") && !has("UNSUPPORTED_HASH_ALGORITHM"),
    previous_hashes_valid: !has("PREVIOUS_HASH_MISMATCH"),
    root_hash_valid: !has("ROOT_HASH_MISMATCH"),
    chain_complete: !has("MISSING_CHAIN_RECORD"),
    ordering_valid: !has("DUPLICATE_CHAIN_POSITION") && !has("REORDERED_CHAIN"),
    replay_valid: !has("REPLAY_HASH_MISMATCH"),
    lineage_valid: !has("MISSING_LINEAGE_REFERENCE"),
    ledger_persisted: !has("LEDGER_PERSISTENCE_DELAY"),
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-hash-chain-validation", source) });
}

function executionHash(execution: Omit<GovernanceHashChainExecution, "chain_execution_hash">): string {
  return hashValue("governance-hash-chain-execution", {
    chain_id: execution.chain_id,
    root_hash: execution.root_hash,
    record_hashes: execution.records.map((record) => record.current_hash),
    lineage_hash: execution.lineage_graph.lineage_hash,
    replay_chain_hash: execution.replay_chain.replay_chain_hash,
    ledger_hashes: execution.ledger_entries.map((entry) => entry.ledger_hash),
    validation_hash: execution.validation.validation_hash,
  });
}

export function buildGovernanceHashChain(input: GovernanceHashChainInput = {}): GovernanceHashChainExecution {
  if (input.execution && !input.scenario) return input.execution;
  const contract = buildGovernanceIntegrityContract({ tenant_id: input.tenant_id, mission_id: input.mission_id, created_by: input.created_by });
  const records = buildRecords(contract);
  const base = Object.freeze({
    phase_version: "7I.2" as const,
    schema_version: SCHEMA_VERSION,
    chain_id: records[0].chain_id,
    tenant_id: contract.identity.tenant_id,
    mission_id: contract.identity.mission_id,
    chain_version: CHAIN_VERSION,
    hash_algorithm: HASH_ALGORITHM,
    root_hash: records[0].root_hash,
    records,
    lineage_graph: buildLineageGraph(records),
    replay_chain: buildReplayChain(contract, records),
    ledger_entries: buildLedgerEntries(records),
    advisory_only_notice: "The governance hash chain provides integrity assurance and does not grant autonomous execution authority.",
  });
  const scenarioApplied = applyScenario(base, input.scenario ?? "BASELINE");
  const validation = validationReport(scenarioApplied);
  const withValidation = Object.freeze({ ...scenarioApplied, validation });
  return Object.freeze({ ...withValidation, chain_execution_hash: executionHash(withValidation) });
}

export function validateGovernanceHashChain(input: GovernanceHashChainInput | GovernanceHashChainExecution = {}): GovernanceHashChainValidationReport {
  const execution = "phase_version" in input ? input as GovernanceHashChainExecution : buildGovernanceHashChain(input as GovernanceHashChainInput);
  return validationReport(execution);
}

export function buildGovernanceHashChainObservabilitySurface(input: GovernanceHashChainInput = {}): GovernanceHashChainObservabilitySurface {
  const execution = buildGovernanceHashChain(input);
  const latest = execution.records[execution.records.length - 1];
  return Object.freeze({
    chain_id: execution.chain_id,
    tenant_id: execution.tenant_id,
    mission_id: execution.mission_id,
    validation_state: execution.validation.validation_state,
    record_count: execution.records.length,
    root_hash: execution.root_hash,
    latest_hash: latest?.current_hash ?? "",
    failure_count: execution.validation.failures.length,
    failures: freezeArray(execution.validation.failures.map((failure) => failure.reason)),
    replay_chain_hash: execution.replay_chain.replay_chain_hash,
    lineage_hash: execution.lineage_graph.lineage_hash,
    ledger_entries: execution.ledger_entries.length,
    advisory_only_notice: execution.advisory_only_notice,
  });
}

export function getGovernanceHashChainContract() {
  const execution = buildGovernanceHashChain();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "canonical-serialization-before-hashing",
        "deterministic-hash-generation",
        "single-immutable-root-hash",
        "sequential-previous-hash-linkage",
        "replay-stable-reconstruction",
        "tenant-isolated-chain",
        "append-only-ledger-metadata",
        "fail-closed-validation",
      ]),
      schema_version: SCHEMA_VERSION,
      chain_version: CHAIN_VERSION,
      serializer_version: SERIALIZER_VERSION,
      hash_algorithm: HASH_ALGORITHM,
      failure_state_mapping: FAILURE_STATE,
    }),
    execution,
    validation: execution.validation,
    observability: buildGovernanceHashChainObservabilitySurface({ execution }),
  });
}
