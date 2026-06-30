import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildIntegrityContract, validateIntegrityContract } from "@/services/integrity-contract";
import type { IntegrityRecord, IntegrityState } from "@/types/integrity-contract";
import type {
  AutonomousCanonicalHashArtifact,
  AutonomousHashChainArtifactType,
  AutonomousHashChainExecution,
  AutonomousHashChainFailureReason,
  AutonomousHashChainInput,
  AutonomousHashChainLedgerEntry,
  AutonomousHashChainLineageGraph,
  AutonomousHashChainNode,
  AutonomousHashChainObservabilitySurface,
  AutonomousHashChainReplayEvidence,
  AutonomousHashChainScenario,
  AutonomousHashChainValidationIssue,
  AutonomousHashChainValidationReport,
  AutonomousHashGeneration,
} from "@/types/autonomous-hash-chain-engine";

const NOW = "2026-06-30T12:00:00.000Z";
const SCHEMA_VERSION = "autonomous-hash-chain-engine/v8H.2" as const;
const NODE_SCHEMA_VERSION = "autonomous-hash-chain-node/v8H.2" as const;
const CHAIN_VERSION = "autonomous-hash-chain/v8H.2" as const;
const SERIALIZER_VERSION = "autonomous-hash-canonical-serializer/v8H.2" as const;
const HASH_ALGORITHM = "SHA-256" as const;
const GENESIS_HASH = "GENESIS";
const EXPECTED_NODE_COUNT = 9;

const FAILURE_STATE: Readonly<Record<AutonomousHashChainFailureReason, IntegrityState>> = Object.freeze({
  INVALID_HASH: "CORRUPTED",
  BROKEN_PARENT_LINK: "CORRUPTED",
  MISSING_PARENT: "CORRUPTED",
  REPLAY_MISMATCH: "CORRUPTED",
  NONDETERMINISTIC_ORDERING: "CORRUPTED",
  ORPHAN_NODE: "CORRUPTED",
  UNAUTHORIZED_CHAIN_MODIFICATION: "CORRUPTED",
  CROSS_TENANT_LINKAGE: "CORRUPTED",
  LINEAGE_CORRUPTION: "CORRUPTED",
  GOVERNANCE_REFERENCE_LOSS: "DEGRADED",
  CONSTITUTIONAL_REFERENCE_LOSS: "CORRUPTED",
  DUPLICATE_HASH: "CORRUPTED",
  MISSING_CHAIN_NODE: "CORRUPTED",
  UNSUPPORTED_HASH_ALGORITHM: "DEGRADED",
});

const ARTIFACT_ORDER = Object.freeze([
  "PLANNING_RECORD",
  "DECISION_RECORD",
  "DELEGATION_RECORD",
  "EXECUTION_RECORD",
  "ORCHESTRATION_RECORD",
  "SUPERVISION_RECORD",
  "INTERVENTION_RECORD",
  "REPLAY_RECORD",
  "CERTIFICATION_RECORD",
] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(reason: AutonomousHashChainFailureReason, path: string, message: string): AutonomousHashChainValidationIssue {
  return Object.freeze({ reason, state: FAILURE_STATE[reason], path, message });
}

function deriveState(issues: readonly AutonomousHashChainValidationIssue[]): IntegrityState {
  if (issues.some((item) => item.state === "CORRUPTED")) return "CORRUPTED";
  if (issues.some((item) => item.state === "DEGRADED")) return "DEGRADED";
  return "VALID";
}

function chainState(state: IntegrityState) {
  if (state === "CORRUPTED") return "CORRUPTED" as const;
  if (state === "DEGRADED") return "DEGRADED" as const;
  return "CERTIFIED" as const;
}

export function classifyAutonomousHashChainFailure(reason: AutonomousHashChainFailureReason): IntegrityState {
  return FAILURE_STATE[reason];
}

export function canonicalizeAutonomousHashArtifact(payload: unknown, schemaVersion: string = NODE_SCHEMA_VERSION): AutonomousCanonicalHashArtifact {
  const canonical_payload = canonicalizeConfidenceToString({
    serializer_version: SERIALIZER_VERSION,
    schema_version: schemaVersion,
    payload,
  });
  return Object.freeze({
    serializer_version: SERIALIZER_VERSION,
    schema_version: schemaVersion,
    canonical_payload,
    canonical_hash: hashValue("autonomous-hash-chain-canonical", canonical_payload),
    deterministic: true,
  });
}

function artifactIdFor(type: AutonomousHashChainArtifactType, integrity: IntegrityRecord): string {
  const ids = integrity.immutable_identifiers;
  switch (type) {
    case "PLANNING_RECORD": return ids.planning_id;
    case "DECISION_RECORD":
    case "GOVERNANCE_DECISION": return ids.decision_id;
    case "DELEGATION_RECORD": return ids.delegation_id;
    case "EXECUTION_RECORD": return ids.execution_id;
    case "ORCHESTRATION_RECORD": return ids.orchestration_id;
    case "SUPERVISION_RECORD": return ids.supervision_id;
    case "INTERVENTION_RECORD": return ids.intervention_id;
    case "REPLAY_RECORD": return ids.replay_id;
    case "CERTIFICATION_RECORD": return integrity.artifact_id;
    default: return integrity.artifact_id;
  }
}

function payloadFor(type: AutonomousHashChainArtifactType, integrity: IntegrityRecord) {
  return {
    artifact_type: type,
    artifact_id: artifactIdFor(type, integrity),
    source_integrity_id: integrity.integrity_id,
    replay_reference: integrity.replay_reference,
    lineage_reference: integrity.lineage_reference,
    integrity_reference: integrity.integrity_reference,
    governance_reference: integrity.governance_reference,
    constitutional_reference: integrity.constitutional_reference,
    authority_reference: integrity.authority_reference,
    integrity_hashes: integrity.hash_policy,
  };
}

function generateHash(canonical: AutonomousCanonicalHashArtifact, integrity: IntegrityRecord, parentHash: string): AutonomousHashGeneration {
  const source = {
    canonical_hash: canonical.canonical_hash,
    replay_reference: integrity.replay_reference,
    lineage_reference: integrity.lineage_reference,
    governance_reference: integrity.governance_reference,
    constitutional_reference: integrity.constitutional_reference,
    parent_hash: parentHash,
  };
  return Object.freeze({
    current_hash: hashValue("autonomous-hash-chain-current", source),
    payload_hash: hashValue("autonomous-hash-chain-payload", canonical.canonical_payload),
    lineage_hash: hashValue("autonomous-hash-chain-lineage", { lineage_reference: integrity.lineage_reference, lineage_path: integrity.lineage.lineage_path, parent_hash: parentHash }),
    replay_hash: hashValue("autonomous-hash-chain-replay", { replay_reference: integrity.replay_reference, replay_id: integrity.immutable_identifiers.replay_id, current: source }),
    governance_hash: hashValue("autonomous-hash-chain-governance", { governance_reference: integrity.governance_reference, authority_reference: integrity.authority_reference }),
    constitutional_hash: hashValue("autonomous-hash-chain-constitutional", integrity.constitutional_reference),
    hash_algorithm: HASH_ALGORITHM,
    hash_version: CHAIN_VERSION,
    generated_at: NOW,
  });
}

function hashSource(node: Omit<AutonomousHashChainNode, "current_hash" | "hash_generation">, generation: AutonomousHashGeneration) {
  return {
    hash_id: node.hash_id,
    chain_id: node.chain_id,
    artifact_type: node.artifact_type,
    artifact_id: node.artifact_id,
    tenant_id: node.tenant_id,
    sequence_number: node.sequence_number,
    parent_artifact: node.parent_artifact,
    parent_hash: node.parent_hash,
    canonical_hash: node.canonical.canonical_hash,
    payload_hash: generation.payload_hash,
    lineage_hash: generation.lineage_hash,
    replay_hash: generation.replay_hash,
    governance_hash: generation.governance_hash,
    constitutional_hash: generation.constitutional_hash,
    replay_reference: node.replay_reference,
    lineage_reference: node.lineage_reference,
    integrity_reference: node.integrity_reference,
    governance_reference: node.governance_reference,
    constitutional_reference: node.constitutional_reference,
    authority_reference: node.authority_reference,
    schema_version: node.schema_version,
  };
}

function recomputeNodeHash(node: AutonomousHashChainNode): string {
  const { current_hash: _current, hash_generation, ...withoutCurrent } = node;
  return hashValue("autonomous-hash-chain-node", hashSource(withoutCurrent, hash_generation));
}

function resealNode(node: AutonomousHashChainNode): AutonomousHashChainNode {
  const hash_generation = Object.freeze({
    ...node.hash_generation,
    governance_hash: hashValue("autonomous-hash-chain-governance", { governance_reference: node.governance_reference, authority_reference: node.authority_reference }),
    constitutional_hash: hashValue("autonomous-hash-chain-constitutional", node.constitutional_reference),
  });
  const current_hash = recomputeNodeHash({ ...node, hash_generation });
  return Object.freeze({
    ...node,
    current_hash,
    governance_hash: hash_generation.governance_hash,
    constitutional_hash: hash_generation.constitutional_hash,
    hash_generation: Object.freeze({ ...hash_generation, current_hash }),
  });
}

function resealFollowingParentLinks(nodes: AutonomousHashChainNode[], startIndex: number): void {
  for (let index = startIndex; index < nodes.length; index += 1) {
    const parent = nodes[index - 1];
    nodes[index] = resealNode(Object.freeze({
      ...nodes[index],
      parent_hash: parent.current_hash,
      parent_artifact: Object.freeze({
        ...nodes[index].parent_artifact,
        parent_hash: parent.current_hash,
        parent_artifact_id: parent.artifact_id,
        parent_artifact_type: parent.artifact_type,
      }),
    }));
  }
}

function buildNodes(integrity: IntegrityRecord): readonly AutonomousHashChainNode[] {
  const chain_id = id("AHC", "autonomous-hash-chain-id", { integrity_id: integrity.integrity_id, tenant_id: integrity.tenant_id });
  const nodes: AutonomousHashChainNode[] = [];
  ARTIFACT_ORDER.forEach((artifact_type, index) => {
    const parent = nodes[index - 1] ?? null;
    const parent_hash = parent?.current_hash ?? GENESIS_HASH;
    const canonical = canonicalizeAutonomousHashArtifact(payloadFor(artifact_type, integrity));
    const hash_generation_seed = generateHash(canonical, integrity, parent_hash);
    const withoutHash = Object.freeze({
      hash_id: id("AHN", "autonomous-hash-node-id", { chain_id, artifact_type, index }),
      chain_id,
      artifact_type,
      artifact_id: artifactIdFor(artifact_type, integrity),
      tenant_id: integrity.tenant_id,
      sequence_number: index,
      parent_artifact: Object.freeze({
        parent_hash,
        parent_artifact_id: parent?.artifact_id ?? null,
        parent_artifact_type: parent?.artifact_type ?? null,
      }),
      parent_hash,
      lineage_hash: hash_generation_seed.lineage_hash,
      replay_hash: hash_generation_seed.replay_hash,
      governance_hash: hash_generation_seed.governance_hash,
      constitutional_hash: hash_generation_seed.constitutional_hash,
      replay_reference: integrity.replay_reference,
      lineage_reference: integrity.lineage_reference,
      integrity_reference: integrity.integrity_reference,
      governance_reference: integrity.governance_reference,
      constitutional_reference: integrity.constitutional_reference,
      authority_reference: integrity.authority_reference,
      canonical,
      integrity_state: "VALID" as const,
      lifecycle_state: "CERTIFIED" as const,
      timestamp: NOW,
      schema_version: NODE_SCHEMA_VERSION,
      append_only: true as const,
    });
    const current_hash = hashValue("autonomous-hash-chain-node", hashSource(withoutHash, hash_generation_seed));
    const hash_generation = Object.freeze({ ...hash_generation_seed, current_hash });
    nodes.push(Object.freeze({ ...withoutHash, current_hash, hash_generation }));
  });
  return freezeArray(nodes);
}

function buildLineageGraph(nodes: readonly AutonomousHashChainNode[]): AutonomousHashChainLineageGraph {
  const edges = nodes.slice(1).map((node, index) => {
    const from_hash_id = nodes[index].hash_id;
    const to_hash_id = node.hash_id;
    return Object.freeze({ from_hash_id, to_hash_id, edge_hash: hashValue("autonomous-hash-chain-lineage-edge", { from_hash_id, to_hash_id, current_hash: node.current_hash }) });
  });
  const source = {
    chain_id: nodes[0]?.chain_id ?? "",
    genesis_hash: nodes[0]?.current_hash ?? "",
    terminal_hash: nodes[nodes.length - 1]?.current_hash ?? "",
    ancestry_hash_ids: nodes.map((node) => node.hash_id),
    lineage_edges: edges,
  };
  return Object.freeze({ ...source, ancestry_hash_ids: freezeArray(source.ancestry_hash_ids), lineage_edges: freezeArray(edges), lineage_hash: hashValue("autonomous-hash-chain-lineage-graph", source) });
}

function buildReplayEvidence(integrity: IntegrityRecord, nodes: readonly AutonomousHashChainNode[]): AutonomousHashChainReplayEvidence {
  const source = {
    replay_reference: integrity.replay_reference,
    replay_checkpoint: integrity.source_replay_certification.certification_evidence.replay_id,
    replay_reconstruction_hash: integrity.source_replay_certification.integrity_hash,
    reconstructed_node_hashes: nodes.map((node) => node.current_hash),
    deterministic_replay: true,
  };
  return Object.freeze({ ...source, reconstructed_node_hashes: freezeArray(source.reconstructed_node_hashes), replay_chain_hash: hashValue("autonomous-hash-chain-replay-evidence", source) });
}

function buildLedgerEntries(nodes: readonly AutonomousHashChainNode[]): readonly AutonomousHashChainLedgerEntry[] {
  return freezeArray(nodes.map((node) => {
    const source = {
      chain_id: node.chain_id,
      hash_id: node.hash_id,
      sequence_number: node.sequence_number,
      artifact_id: node.artifact_id,
      artifact_type: node.artifact_type,
      previous_hash: node.parent_hash,
      current_hash: node.current_hash,
      tenant_id: node.tenant_id,
      append_only: true as const,
    };
    return Object.freeze({ ...source, ledger_hash: hashValue("autonomous-hash-chain-ledger-entry", source) });
  }));
}

function applyScenario(base: Omit<AutonomousHashChainExecution, "validation" | "certification_evidence_hash">, scenario: AutonomousHashChainScenario): Omit<AutonomousHashChainExecution, "validation" | "certification_evidence_hash"> {
  const nodes = [...base.nodes];
  if (scenario === "MISSING_CHAIN_NODE") nodes.splice(3, 1);
  if (scenario === "NONDETERMINISTIC_ORDERING" && nodes[2] && nodes[3]) [nodes[2], nodes[3]] = [nodes[3], nodes[2]];
  if (scenario === "INVALID_HASH" && nodes[1]) nodes[1] = Object.freeze({ ...nodes[1], current_hash: "tampered-current-hash", hash_generation: { ...nodes[1].hash_generation, current_hash: "tampered-current-hash" } });
  if (scenario === "BROKEN_PARENT_LINK" && nodes[2]) nodes[2] = Object.freeze({ ...nodes[2], parent_hash: "broken-parent-hash", parent_artifact: { ...nodes[2].parent_artifact, parent_hash: "broken-parent-hash" } });
  if (scenario === "MISSING_PARENT" && nodes[4]) nodes[4] = Object.freeze({ ...nodes[4], parent_artifact: { ...nodes[4].parent_artifact, parent_artifact_id: "missing-parent" } });
  if (scenario === "ORPHAN_NODE" && nodes[5]) nodes[5] = Object.freeze({ ...nodes[5], parent_artifact: { ...nodes[5].parent_artifact, parent_artifact_id: null, parent_artifact_type: null } });
  if (scenario === "REPLAY_MISMATCH" && nodes[6]) nodes[6] = Object.freeze({ ...nodes[6], replay_reference: "replay:mismatch" });
  if (scenario === "UNAUTHORIZED_CHAIN_MODIFICATION" && nodes[1]) nodes[1] = Object.freeze({ ...nodes[1], artifact_id: `${nodes[1].artifact_id}:modified` });
  if (scenario === "CROSS_TENANT_LINKAGE" && nodes[2]) nodes[2] = Object.freeze({ ...nodes[2], tenant_id: "tenant_external" });
  if (scenario === "LINEAGE_CORRUPTION" && nodes[3]) nodes[3] = Object.freeze({ ...nodes[3], lineage_reference: "" });
  if (scenario === "GOVERNANCE_REFERENCE_LOSS" && nodes[4]) {
    nodes[4] = resealNode(Object.freeze({ ...nodes[4], governance_reference: "", authority_reference: "" }));
    resealFollowingParentLinks(nodes, 5);
  }
  if (scenario === "CONSTITUTIONAL_REFERENCE_LOSS" && nodes[4]) nodes[4] = Object.freeze({ ...nodes[4], constitutional_reference: "" });
  if (scenario === "DUPLICATE_HASH" && nodes[4]) nodes[4] = Object.freeze({ ...nodes[4], current_hash: nodes[3]?.current_hash ?? nodes[4].current_hash, hash_generation: { ...nodes[4].hash_generation, current_hash: nodes[3]?.current_hash ?? nodes[4].current_hash } });
  if (scenario === "UNSUPPORTED_HASH_ALGORITHM" && nodes[1]) nodes[1] = Object.freeze({ ...nodes[1], hash_generation: { ...nodes[1].hash_generation, hash_algorithm: "MD5" as "SHA-256" } });
  const lineage_graph = buildLineageGraph(nodes);
  const replay_evidence = buildReplayEvidence(base.source_integrity_contract, nodes);
  return Object.freeze({
    ...base,
    genesis_hash: nodes[0]?.current_hash ?? "",
    terminal_hash: nodes[nodes.length - 1]?.current_hash ?? "",
    nodes: freezeArray(nodes),
    lineage_graph,
    replay_evidence,
    ledger_entries: buildLedgerEntries(nodes),
  });
}

function validateNodes(execution: Omit<AutonomousHashChainExecution, "validation" | "certification_evidence_hash">): AutonomousHashChainValidationIssue[] {
  const issues: AutonomousHashChainValidationIssue[] = [];
  const nodes = execution.nodes;
  const integrityValidation = validateIntegrityContract(execution.source_integrity_contract);
  if (!integrityValidation.valid) issues.push(issue("UNAUTHORIZED_CHAIN_MODIFICATION", "source_integrity_contract", "Source integrity contract must validate before chain certification."));
  if (nodes.length < EXPECTED_NODE_COUNT) issues.push(issue("MISSING_CHAIN_NODE", "nodes", "Autonomous chain must contain planning through certification nodes."));
  const hashes = nodes.map((node) => node.current_hash);
  if (new Set(hashes).size !== hashes.length) issues.push(issue("DUPLICATE_HASH", "nodes.current_hash", "Node hashes must be unique within the chain."));
  nodes.forEach((node, index) => {
    const expectedType = ARTIFACT_ORDER[index];
    if (node.sequence_number !== index || (expectedType && node.artifact_type !== expectedType)) issues.push(issue("NONDETERMINISTIC_ORDERING", `nodes.${index}.sequence_number`, "Hash chain order must follow the canonical autonomous lifecycle."));
    const expectedParentHash = index === 0 ? GENESIS_HASH : nodes[index - 1]?.current_hash;
    if (node.parent_hash !== expectedParentHash || node.parent_artifact.parent_hash !== expectedParentHash) issues.push(issue("BROKEN_PARENT_LINK", `nodes.${index}.parent_hash`, "Parent hash must match the prior node current hash."));
    if (index > 0 && !nodes.some((candidate) => candidate.artifact_id === node.parent_artifact.parent_artifact_id)) issues.push(issue("MISSING_PARENT", `nodes.${index}.parent_artifact`, "Parent artifact reference must exist in the chain."));
    if (index > 0 && (!node.parent_artifact.parent_artifact_id || !node.parent_artifact.parent_artifact_type)) issues.push(issue("ORPHAN_NODE", `nodes.${index}.parent_artifact`, "Non-genesis nodes cannot be orphaned."));
    if (recomputeNodeHash(node) !== node.current_hash || node.hash_generation.current_hash !== node.current_hash) issues.push(issue("INVALID_HASH", `nodes.${index}.current_hash`, "Node hash must be reproducible from canonical payload and metadata."));
    if (node.replay_reference !== execution.source_integrity_contract.replay_reference || !node.replay_hash) issues.push(issue("REPLAY_MISMATCH", `nodes.${index}.replay_reference`, "Replay reference and replay hash must remain reconstructable across the chain."));
    if (!node.lineage_reference || !node.lineage_hash) issues.push(issue("LINEAGE_CORRUPTION", `nodes.${index}.lineage_reference`, "Lineage reference and lineage hash are required."));
    if (!node.governance_reference || !node.authority_reference) issues.push(issue("GOVERNANCE_REFERENCE_LOSS", `nodes.${index}.governance_reference`, "Governance and authority references are required."));
    if (!node.constitutional_reference) issues.push(issue("CONSTITUTIONAL_REFERENCE_LOSS", `nodes.${index}.constitutional_reference`, "Constitutional reference must be preserved."));
    if (node.tenant_id !== execution.tenant_id || node.tenant_id.includes("external")) issues.push(issue("CROSS_TENANT_LINKAGE", `nodes.${index}.tenant_id`, "Hash chain nodes cannot cross tenant boundaries."));
    if (node.artifact_id.endsWith(":modified") || !node.append_only) issues.push(issue("UNAUTHORIZED_CHAIN_MODIFICATION", `nodes.${index}`, "Hash chain nodes are append-only and cannot be modified."));
    if (node.hash_generation.hash_algorithm !== HASH_ALGORITHM || node.hash_generation.hash_version !== CHAIN_VERSION) issues.push(issue("UNSUPPORTED_HASH_ALGORITHM", `nodes.${index}.hash_generation`, "Only SHA-256 autonomous hash-chain v8H.2 is supported."));
  });
  return issues;
}

function validationReport(execution: Omit<AutonomousHashChainExecution, "validation" | "certification_evidence_hash">): AutonomousHashChainValidationReport {
  const failures = freezeArray(validateNodes(execution));
  const validation_state = deriveState(failures);
  const has = (reason: AutonomousHashChainFailureReason) => failures.some((failure) => failure.reason === reason);
  const source = {
    chain_id: execution.chain_id,
    validation_state,
    chain_state: chainState(validation_state),
    valid: validation_state === "VALID",
    node_count: execution.nodes.length,
    genesis_hash: execution.genesis_hash,
    terminal_hash: execution.terminal_hash,
    failures,
  };
  return Object.freeze({
    ...source,
    hash_reproducible: !has("INVALID_HASH") && !has("UNSUPPORTED_HASH_ALGORITHM"),
    parent_links_valid: !has("BROKEN_PARENT_LINK"),
    parent_existence_valid: !has("MISSING_PARENT") && !has("ORPHAN_NODE"),
    replay_reconstructable: !has("REPLAY_MISMATCH"),
    ordering_deterministic: !has("NONDETERMINISTIC_ORDERING"),
    chain_complete: !has("MISSING_CHAIN_NODE"),
    append_only_valid: !has("UNAUTHORIZED_CHAIN_MODIFICATION"),
    lineage_continuous: !has("LINEAGE_CORRUPTION"),
    governance_traceable: !has("GOVERNANCE_REFERENCE_LOSS"),
    constitutional_traceable: !has("CONSTITUTIONAL_REFERENCE_LOSS"),
    tenant_isolated: !has("CROSS_TENANT_LINKAGE"),
    algorithm_supported: !has("UNSUPPORTED_HASH_ALGORITHM"),
    validation_hash: hashValue("autonomous-hash-chain-validation", source),
  });
}

function certificationEvidenceHash(execution: Omit<AutonomousHashChainExecution, "certification_evidence_hash">): string {
  return hashValue("autonomous-hash-chain-certification-evidence", {
    chain_id: execution.chain_id,
    genesis_hash: execution.genesis_hash,
    terminal_hash: execution.terminal_hash,
    lineage_hash: execution.lineage_graph.lineage_hash,
    replay_chain_hash: execution.replay_evidence.replay_chain_hash,
    ledger_hashes: execution.ledger_entries.map((entry) => entry.ledger_hash),
    validation_hash: execution.validation.validation_hash,
  });
}

export function buildAutonomousHashChain(input: AutonomousHashChainInput = {}): AutonomousHashChainExecution {
  if (input.execution && !input.scenario) return input.execution;
  const source_integrity_contract = input.integrityRecord ?? buildIntegrityContract();
  const nodes = buildNodes(source_integrity_contract);
  const base = Object.freeze({
    phase_version: "8H.2" as const,
    schema_version: SCHEMA_VERSION,
    chain_id: nodes[0].chain_id,
    tenant_id: source_integrity_contract.tenant_id,
    hash_algorithm: HASH_ALGORITHM,
    chain_version: CHAIN_VERSION,
    source_integrity_contract,
    genesis_hash: nodes[0].current_hash,
    terminal_hash: nodes[nodes.length - 1].current_hash,
    nodes,
    lineage_graph: buildLineageGraph(nodes),
    replay_evidence: buildReplayEvidence(source_integrity_contract, nodes),
    ledger_entries: buildLedgerEntries(nodes),
    advisory_only_notice: "The autonomous hash chain provides cryptographic integrity evidence and does not grant execution authority.",
  });
  const scenarioApplied = applyScenario(base, input.scenario ?? "BASELINE");
  const validation = validationReport(scenarioApplied);
  const withValidation = Object.freeze({ ...scenarioApplied, validation });
  return Object.freeze({ ...withValidation, certification_evidence_hash: certificationEvidenceHash(withValidation) });
}

export function appendAutonomousHashChainNode(execution: AutonomousHashChainExecution, artifact_type: AutonomousHashChainArtifactType, artifact_id: string): AutonomousHashChainExecution {
  const previous = execution.nodes[execution.nodes.length - 1];
  const payload = { artifact_type, artifact_id, source_integrity_id: execution.source_integrity_contract.integrity_id, replay_reference: execution.source_integrity_contract.replay_reference, lineage_reference: execution.source_integrity_contract.lineage_reference };
  const canonical = canonicalizeAutonomousHashArtifact(payload);
  const generation = generateHash(canonical, execution.source_integrity_contract, previous.current_hash);
  const withoutHash = Object.freeze({
    hash_id: id("AHN", "autonomous-hash-node-id", { chain_id: execution.chain_id, artifact_type, artifact_id, index: execution.nodes.length }),
    chain_id: execution.chain_id,
    artifact_type,
    artifact_id,
    tenant_id: execution.tenant_id,
    sequence_number: execution.nodes.length,
    parent_artifact: Object.freeze({ parent_hash: previous.current_hash, parent_artifact_id: previous.artifact_id, parent_artifact_type: previous.artifact_type }),
    parent_hash: previous.current_hash,
    lineage_hash: generation.lineage_hash,
    replay_hash: generation.replay_hash,
    governance_hash: generation.governance_hash,
    constitutional_hash: generation.constitutional_hash,
    replay_reference: execution.source_integrity_contract.replay_reference,
    lineage_reference: execution.source_integrity_contract.lineage_reference,
    integrity_reference: execution.source_integrity_contract.integrity_reference,
    governance_reference: execution.source_integrity_contract.governance_reference,
    constitutional_reference: execution.source_integrity_contract.constitutional_reference,
    authority_reference: execution.source_integrity_contract.authority_reference,
    canonical,
    integrity_state: "VALID" as const,
    lifecycle_state: "CERTIFIED" as const,
    timestamp: NOW,
    schema_version: NODE_SCHEMA_VERSION,
    append_only: true as const,
  });
  const current_hash = hashValue("autonomous-hash-chain-node", hashSource(withoutHash, generation));
  const nodes = freezeArray([...execution.nodes, Object.freeze({ ...withoutHash, current_hash, hash_generation: Object.freeze({ ...generation, current_hash }) })]);
  const base = Object.freeze({ ...execution, terminal_hash: current_hash, nodes, lineage_graph: buildLineageGraph(nodes), replay_evidence: buildReplayEvidence(execution.source_integrity_contract, nodes), ledger_entries: buildLedgerEntries(nodes) });
  const validation = validationReport(base);
  const withValidation = Object.freeze({ ...base, validation });
  return Object.freeze({ ...withValidation, certification_evidence_hash: certificationEvidenceHash(withValidation) });
}

export function validateAutonomousHashChain(input: AutonomousHashChainInput | AutonomousHashChainExecution = {}): AutonomousHashChainValidationReport {
  const execution = "phase_version" in input ? input as AutonomousHashChainExecution : buildAutonomousHashChain(input as AutonomousHashChainInput);
  return validationReport(execution);
}

export function buildAutonomousHashChainObservabilitySurface(input: AutonomousHashChainInput = {}): AutonomousHashChainObservabilitySurface {
  const execution = buildAutonomousHashChain(input);
  const latest = execution.nodes[execution.nodes.length - 1];
  return Object.freeze({
    chain_id: execution.chain_id,
    tenant_id: execution.tenant_id,
    validation_state: execution.validation.validation_state,
    chain_state: execution.validation.chain_state,
    node_count: execution.nodes.length,
    genesis_hash: execution.genesis_hash,
    terminal_hash: execution.terminal_hash,
    latest_hash: latest?.current_hash ?? "",
    failure_count: execution.validation.failures.length,
    failures: freezeArray(execution.validation.failures.map((failure) => failure.reason)),
    replay_chain_hash: execution.replay_evidence.replay_chain_hash,
    lineage_hash: execution.lineage_graph.lineage_hash,
    ledger_entries: execution.ledger_entries.length,
  });
}

export function getAutonomousHashChainContract() {
  const execution = buildAutonomousHashChain();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "deterministic-artifact-hashing",
        "canonical-planning-to-certification-order",
        "single-parent-linkage",
        "append-only-chain-construction",
        "replay-reconstructable-hashes",
        "lineage-preserving-parent-links",
        "governance-and-constitutional-traceability",
        "tenant-isolated-cryptographic-ledger",
        "fail-closed-chain-validation",
      ]),
      schema_version: SCHEMA_VERSION,
      node_schema_version: NODE_SCHEMA_VERSION,
      chain_version: CHAIN_VERSION,
      serializer_version: SERIALIZER_VERSION,
      hash_algorithm: HASH_ALGORITHM,
      artifact_order: ARTIFACT_ORDER,
      failure_state_mapping: FAILURE_STATE,
    }),
    execution,
    validation: execution.validation,
    observability: buildAutonomousHashChainObservabilitySurface({ execution }),
  });
}
