import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  hashTruthIntegrityContract,
  validateTruthIntegrityContract,
} from "./integrityContract";
import type {
  TruthHashChainAuditEventName,
  TruthHashChainCanonicalizationContext,
  TruthHashChainEdge,
  TruthHashChainEdgeSpec,
  TruthHashChainExecution,
  TruthHashChainExecutionRequest,
  TruthHashChainExecutionStorageRecord,
  TruthHashChainFailureCode,
  TruthHashChainFailureReason,
  TruthHashChainHashContext,
  TruthHashChainIntegrityReport,
  TruthHashChainNode,
  TruthHashChainOrderingContext,
  TruthHashChainProof,
  TruthHashChainResultState,
  TruthHashChainRoot,
  TruthHashChainRootStrategy,
  TruthHashChainScope,
  TruthHashChainSourceArtifact,
  TruthHashChainTarget,
  TruthHashChainTargetType,
  TruthHashChainType,
  TruthIntegrityContract,
} from "./types";

export const TRUTH_HASH_CHAIN_EVENTS: Readonly<Record<TruthHashChainAuditEventName, TruthHashChainAuditEventName>> = Object.freeze({
  HASH_CHAIN_REQUESTED: "HASH_CHAIN_REQUESTED",
  HASH_CHAIN_INTEGRITY_CONTRACT_LOADED: "HASH_CHAIN_INTEGRITY_CONTRACT_LOADED",
  HASH_CHAIN_SCOPE_RESOLVED: "HASH_CHAIN_SCOPE_RESOLVED",
  HASH_CHAIN_SOURCES_LOADED: "HASH_CHAIN_SOURCES_LOADED",
  HASH_CHAIN_ARTIFACTS_CANONICALIZED: "HASH_CHAIN_ARTIFACTS_CANONICALIZED",
  HASH_CHAIN_NODES_BUILT: "HASH_CHAIN_NODES_BUILT",
  HASH_CHAIN_EDGES_BUILT: "HASH_CHAIN_EDGES_BUILT",
  HASH_CHAIN_ORDERED: "HASH_CHAIN_ORDERED",
  HASH_CHAIN_ROOT_COMPUTED: "HASH_CHAIN_ROOT_COMPUTED",
  HASH_CHAIN_VERIFIED: "HASH_CHAIN_VERIFIED",
  HASH_CHAIN_MISMATCH_DETECTED: "HASH_CHAIN_MISMATCH_DETECTED",
  HASH_CHAIN_INCOMPLETE_DETECTED: "HASH_CHAIN_INCOMPLETE_DETECTED",
  HASH_CHAIN_CORRUPTION_DETECTED: "HASH_CHAIN_CORRUPTION_DETECTED",
  HASH_CHAIN_UNAUTHORIZED_DETECTED: "HASH_CHAIN_UNAUTHORIZED_DETECTED",
  HASH_CHAIN_INVALID_DETECTED: "HASH_CHAIN_INVALID_DETECTED",
  HASH_CHAIN_PROOF_CREATED: "HASH_CHAIN_PROOF_CREATED",
  HASH_CHAIN_RESULT_RECORDED: "HASH_CHAIN_RESULT_RECORDED",
  HASH_CHAIN_ESCALATED: "HASH_CHAIN_ESCALATED",
});

export const TRUTH_HASH_CHAIN_RESULT_PRECEDENCE: Readonly<Record<TruthHashChainResultState, number>> = Object.freeze({
  VERIFIED: 0,
  MISMATCH: 1,
  INCOMPLETE: 2,
  CORRUPTED: 3,
  UNAUTHORIZED: 4,
  INVALID: 5,
});

const TYPE_TO_TARGET: Readonly<Record<TruthHashChainType, TruthHashChainTargetType>> = Object.freeze({
  TRUTH_RECORD_HASH_CHAIN: "TRUTH_RECORD",
  EVENT_HASH_CHAIN: "EVENT",
  EVIDENCE_HASH_CHAIN: "EVIDENCE_CHAIN",
  LINEAGE_HASH_CHAIN: "LINEAGE_GRAPH",
  GOVERNANCE_HASH_CHAIN: "GOVERNANCE_DECISION",
  RECOMMENDATION_HASH_CHAIN: "TRUTH_RECORD",
  RISK_HASH_CHAIN: "TRUTH_RECORD",
  CONFIDENCE_HASH_CHAIN: "TRUTH_RECORD",
  REPLAY_ARTIFACT_HASH_CHAIN: "REPLAY_CHAIN",
  SCHEMA_HASH_CHAIN: "SCHEMA",
  MISSION_HASH_CHAIN: "MISSION",
  FULL_CONTEXT_HASH_CHAIN: "FULL_CONTEXT",
});

const REPLAY_ORDER: Readonly<Record<string, number>> = Object.freeze({
  REPLAY_CONTRACT: 10,
  REPLAY_INPUT_BUNDLE: 20,
  REPLAY_STATE_PACKAGE: 30,
  REPLAY_OUTPUT_VERIFICATION: 40,
  REPLAY_DETERMINISM_GATE: 50,
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(code: TruthHashChainFailureCode, message: string, result_state: TruthHashChainResultState, path: string): TruthHashChainFailureReason {
  return Object.freeze({ code, message, result_state, path });
}

function dominant(states: readonly TruthHashChainResultState[]): TruthHashChainResultState {
  return states.reduce<TruthHashChainResultState>((current, next) => (
    TRUTH_HASH_CHAIN_RESULT_PRECEDENCE[next] > TRUTH_HASH_CHAIN_RESULT_PRECEDENCE[current] ? next : current
  ), "VERIFIED");
}

function defaultType(contract: TruthIntegrityContract): TruthHashChainType {
  if (contract.integrity_type === "EVENT_INTEGRITY") return "EVENT_HASH_CHAIN";
  if (contract.integrity_type === "EVIDENCE_INTEGRITY") return "EVIDENCE_HASH_CHAIN";
  if (contract.integrity_type === "LINEAGE_INTEGRITY") return "LINEAGE_HASH_CHAIN";
  if (contract.integrity_type === "GOVERNANCE_INTEGRITY") return "GOVERNANCE_HASH_CHAIN";
  if (contract.integrity_type === "SCHEMA_INTEGRITY") return "SCHEMA_HASH_CHAIN";
  if (contract.integrity_type === "MISSION_INTEGRITY") return "MISSION_HASH_CHAIN";
  if (contract.integrity_type.startsWith("REPLAY_")) return "REPLAY_ARTIFACT_HASH_CHAIN";
  if (contract.integrity_type === "FULL_CONTEXT_INTEGRITY") return "FULL_CONTEXT_HASH_CHAIN";
  return "TRUTH_RECORD_HASH_CHAIN";
}

function defaultScope(contract: TruthIntegrityContract, chainType: TruthHashChainType): TruthHashChainScope {
  const scopeType = chainType === "REPLAY_ARTIFACT_HASH_CHAIN" ? "REPLAY" : chainType === "MISSION_HASH_CHAIN" ? "MISSION" : chainType === "FULL_CONTEXT_HASH_CHAIN" ? "FULL_CONTEXT" : "CHAIN";
  return Object.freeze({
    scope_type: scopeType,
    allowed_tenant_ids: contract.integrity_scope.allowed_tenant_ids,
    allowed_mission_ids: contract.integrity_scope.allowed_mission_ids,
    allowed_target_types: Object.freeze([TYPE_TO_TARGET[chainType]]),
    allowed_record_types: contract.integrity_scope.allowed_record_types,
    allowed_event_types: contract.integrity_scope.allowed_event_types,
    include_evidence: contract.integrity_scope.include_evidence,
    include_lineage: contract.integrity_scope.include_lineage,
    include_governance: contract.integrity_scope.include_governance,
    include_replay_artifacts: contract.integrity_scope.include_replay_artifacts,
    include_schema_context: contract.integrity_scope.include_schema_context,
    allowed_time_range: contract.integrity_scope.allowed_time_range,
    redaction_required: contract.integrity_scope.redaction_required,
    restricted_fields: contract.integrity_scope.restricted_fields,
  });
}

function defaultTarget(contract: TruthIntegrityContract, chainType: TruthHashChainType): TruthHashChainTarget {
  return Object.freeze({
    target_type: TYPE_TO_TARGET[chainType],
    target_ids: contract.integrity_target.target_ids,
    target_description: contract.integrity_target.target_description,
  });
}

function canonicalizationContext(request: TruthHashChainExecutionRequest): TruthHashChainCanonicalizationContext {
  return Object.freeze({
    canonical_serialization: "STABLE_JSON",
    canonical_hash_algorithm: "SHA256",
    stable_key_ordering: true,
    stable_array_ordering: true,
    stable_null_handling: true,
    stable_timestamp_representation: true,
    excluded_metadata_fields: Object.freeze(["observed_at", "runtime_nonce"]),
    fail_on_unstable_serialization: true,
    fail_on_wall_clock_injection: true,
    fail_on_environment_specific_values: true,
  });
}

function hashContext(contract: TruthIntegrityContract): TruthHashChainHashContext {
  return Object.freeze({
    hash_algorithm: "SHA256",
    canonical_serialization: "STABLE_JSON",
    require_node_hashes: true,
    require_edge_hashes: true,
    require_root_hash: true,
    require_schema_hashes: contract.integrity_scope.include_schema_context,
    require_governance_hashes: contract.integrity_scope.include_governance,
    require_evidence_hashes: contract.integrity_scope.include_evidence,
    require_lineage_hashes: contract.integrity_scope.include_lineage,
    require_replay_hashes: contract.integrity_scope.include_replay_artifacts,
    allow_missing_hashes: false,
    allow_hash_recalculation: true,
    fail_on_hash_mismatch: true,
    fail_on_hash_chain_gap: true,
    fail_on_provenance_mismatch: true,
  });
}

function orderArtifacts(request: TruthHashChainExecutionRequest): readonly TruthHashChainSourceArtifact[] {
  const strategy = request.ordering_strategy ?? (request.hash_chain_type === "REPLAY_ARTIFACT_HASH_CHAIN" ? "REPLAY_ARTIFACT_ORDER" : "LEDGER_SEQUENCE");
  return Object.freeze([...request.source_artifacts].sort((left, right) => {
    const leftOrder = strategy === "REPLAY_ARTIFACT_ORDER" ? REPLAY_ORDER[left.node_type] ?? 999 : left.source_order ?? 999;
    const rightOrder = strategy === "REPLAY_ARTIFACT_ORDER" ? REPLAY_ORDER[right.node_type] ?? 999 : right.source_order ?? 999;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.source_ref.localeCompare(right.source_ref);
  }));
}

function buildOrderingContext(request: TruthHashChainExecutionRequest, artifacts: readonly TruthHashChainSourceArtifact[]): TruthHashChainOrderingContext {
  const orderingPayload = {
    strategy: request.ordering_strategy ?? (request.hash_chain_type === "REPLAY_ARTIFACT_HASH_CHAIN" ? "REPLAY_ARTIFACT_ORDER" : "LEDGER_SEQUENCE"),
    tie_breaker: request.tie_breaker ?? "SOURCE_REF",
    ordered_sources: artifacts.map((artifact) => artifact.source_ref),
  };
  return Object.freeze({
    ordering_strategy: orderingPayload.strategy,
    tie_breaker: orderingPayload.tie_breaker,
    require_total_order: true,
    ordering_hash: hashValue("mission-control-hash-chain-ordering-hash", orderingPayload),
  });
}

function nodeHashPayload(node: Omit<TruthHashChainNode, "node_hash">): Record<string, unknown> {
  return {
    node_id: node.node_id,
    node_type: node.node_type,
    source_ref: node.source_ref,
    tenant_id: node.tenant_id,
    mission_id: node.mission_id,
    canonical_payload_hash: node.canonical_payload_hash,
    stored_hash: node.stored_hash,
    observed_hash: node.observed_hash,
    expected_hash: node.expected_hash,
    hash_match: node.hash_match,
    schema_ref: node.schema_ref,
    schema_hash: node.schema_hash,
    governance_refs: node.governance_refs,
    evidence_refs: node.evidence_refs,
    lineage_refs: node.lineage_refs,
    lifecycle_state: node.lifecycle_state,
    certification_state: node.certification_state,
    node_order: node.node_order,
  };
}

function buildNodes(
  artifacts: readonly TruthHashChainSourceArtifact[],
  request: TruthHashChainExecutionRequest,
  failures: TruthHashChainFailureReason[],
): readonly TruthHashChainNode[] {
  const nodes: TruthHashChainNode[] = [];
  artifacts.forEach((artifact, index) => {
    if (artifact.missing) {
      failures.push(failure("SOURCE_ARTIFACT_MISSING", `${artifact.source_ref} is missing.`, "INCOMPLETE", `source_artifacts.${artifact.source_ref}`));
      return;
    }
    if (!artifact.source_ref || !artifact.tenant_id) {
      failures.push(failure("NODE_INVALID", "Hash chain source artifact requires source ref and tenant.", "INVALID", `source_artifacts.${index}`));
      return;
    }
    const payloadHash = hashValue("mission-control-hash-chain-canonical-payload-hash", artifact.payload);
    const observedHash = artifact.observed_hash ?? artifact.stored_hash ?? payloadHash;
    const expectedHash = artifact.expected_hash ?? artifact.stored_hash;
    const hashMatch = expectedHash === undefined || expectedHash === observedHash;
    const nodeWithoutHash: Omit<TruthHashChainNode, "node_hash"> = Object.freeze({
      node_id: `node_${index + 1}_${artifact.source_ref}`,
      node_type: artifact.node_type,
      source_ref: artifact.source_ref,
      tenant_id: artifact.tenant_id,
      mission_id: artifact.mission_id,
      canonical_payload_hash: payloadHash,
      stored_hash: artifact.stored_hash,
      observed_hash: observedHash,
      expected_hash: expectedHash,
      hash_match: hashMatch,
      schema_ref: artifact.schema_ref,
      schema_hash: artifact.schema_hash,
      governance_refs: artifact.governance_refs,
      evidence_refs: artifact.evidence_refs,
      lineage_refs: artifact.lineage_refs,
      lifecycle_state: artifact.lifecycle_state,
      certification_state: artifact.certification_state,
      node_order: index + 1,
    });
    const node = Object.freeze({
      ...nodeWithoutHash,
      node_hash: hashValue("mission-control-hash-chain-node-hash", nodeHashPayload(nodeWithoutHash)),
    });
    nodes.push(node);
    if (expectedHash === undefined) failures.push(failure("EXPECTED_NODE_HASH_MISSING", `${artifact.source_ref} has no expected hash.`, "INCOMPLETE", `hash_nodes.${node.node_id}.expected_hash`));
    if (!hashMatch) failures.push(failure("NODE_HASH_MISMATCH", `${artifact.source_ref} hash does not match expected hash.`, "MISMATCH", `hash_nodes.${node.node_id}.observed_hash`));
    if (artifact.stored_hash && artifact.stored_hash !== payloadHash && artifact.corrupted) {
      failures.push(failure("CORRUPTED_NODE_DETECTED", `${artifact.source_ref} stored hash conflicts with canonical payload hash.`, "CORRUPTED", `hash_nodes.${node.node_id}.stored_hash`));
    }
    if (artifact.unauthorized) failures.push(failure("SOURCE_ARTIFACT_UNAUTHORIZED", `${artifact.source_ref} is outside requester authority.`, "UNAUTHORIZED", `hash_nodes.${node.node_id}`));
    if (artifact.provenance_mismatch) failures.push(failure("REPLAY_PROVENANCE_MISMATCH", `${artifact.source_ref} provenance does not match replay chain.`, "INVALID", `hash_nodes.${node.node_id}`));
    if (artifact.policy_substituted) failures.push(failure("POLICY_SUBSTITUTION_DETECTED", `${artifact.source_ref} substituted current policy for historical policy.`, "INVALID", `hash_nodes.${node.node_id}`));
    if (artifact.governance_bypass) failures.push(failure("GOVERNANCE_BYPASS_DETECTED", `${artifact.source_ref} bypassed governance.`, "INVALID", `hash_nodes.${node.node_id}`));
    if (artifact.silent_schema_migration) failures.push(failure("SILENT_SCHEMA_MIGRATION_DETECTED", `${artifact.source_ref} silently migrated schema.`, "INVALID", `hash_nodes.${node.node_id}`));
  });
  return Object.freeze(nodes);
}

function edgeHashPayload(edge: Omit<TruthHashChainEdge, "edge_hash" | "edge_payload_hash">): Record<string, unknown> {
  return {
    edge_id: edge.edge_id,
    edge_type: edge.edge_type,
    from_node_id: edge.from_node_id,
    to_node_id: edge.to_node_id,
    tenant_id: edge.tenant_id,
    mission_id: edge.mission_id,
    edge_order: edge.edge_order,
    expected_edge_hash: edge.expected_edge_hash,
    observed_edge_hash: edge.observed_edge_hash,
    edge_hash_match: edge.edge_hash_match,
  };
}

function sequenceEdgeSpecs(nodes: readonly TruthHashChainNode[]): readonly TruthHashChainEdgeSpec[] {
  return Object.freeze(nodes.slice(0, -1).map((node, index) => Object.freeze({
    edge_type: "SEQUENCE_NEXT",
    from_source_ref: node.source_ref,
    to_source_ref: nodes[index + 1].source_ref,
    tenant_id: node.tenant_id,
    mission_id: node.mission_id,
    edge_order: index + 1,
  })));
}

function buildEdges(
  nodes: readonly TruthHashChainNode[],
  request: TruthHashChainExecutionRequest,
  failures: TruthHashChainFailureReason[],
): readonly TruthHashChainEdge[] {
  const bySource = new Map(nodes.map((node) => [node.source_ref, node]));
  const specs = request.edge_specs ?? sequenceEdgeSpecs(nodes);
  const edges: TruthHashChainEdge[] = [];
  specs.forEach((spec, index) => {
    if (spec.missing) {
      failures.push(failure("EDGE_MISSING", `Required edge ${spec.from_source_ref} -> ${spec.to_source_ref} is missing.`, "INCOMPLETE", `edge_specs.${index}`));
      return;
    }
    const from = bySource.get(spec.from_source_ref);
    const to = bySource.get(spec.to_source_ref);
    if (!from || !to) {
      failures.push(failure("EDGE_INVALID", "Hash chain edge references missing nodes.", "INVALID", `edge_specs.${index}`));
      return;
    }
    if (from.tenant_id !== to.tenant_id || (spec.tenant_id && spec.tenant_id !== from.tenant_id)) {
      failures.push(failure("CROSS_TENANT_EDGE_DETECTED", "Hash chain edge crosses tenant boundary.", "INVALID", `edge_specs.${index}`));
    }
    const observedEdgeHash = spec.observed_edge_hash ?? hashValue("mission-control-hash-chain-observed-edge-hash", {
      edge_type: spec.edge_type,
      from_node_hash: from.node_hash,
      to_node_hash: to.node_hash,
      edge_order: spec.edge_order ?? index + 1,
    });
    const expectedEdgeHash = spec.expected_edge_hash;
    const edgeHashMatch = expectedEdgeHash === undefined || expectedEdgeHash === observedEdgeHash;
    const edgeWithoutHashes: Omit<TruthHashChainEdge, "edge_hash" | "edge_payload_hash"> = Object.freeze({
      edge_id: spec.edge_id ?? `edge_${index + 1}_${from.node_id}_${to.node_id}`,
      edge_type: spec.edge_type,
      from_node_id: from.node_id,
      to_node_id: to.node_id,
      tenant_id: spec.tenant_id ?? from.tenant_id,
      mission_id: spec.mission_id ?? from.mission_id,
      edge_order: spec.edge_order ?? index + 1,
      expected_edge_hash: expectedEdgeHash,
      observed_edge_hash: observedEdgeHash,
      edge_hash_match: edgeHashMatch,
    });
    const edgePayloadHash = hashValue("mission-control-hash-chain-edge-payload-hash", edgeHashPayload(edgeWithoutHashes));
    const edge = Object.freeze({
      ...edgeWithoutHashes,
      edge_payload_hash: edgePayloadHash,
      edge_hash: hashValue("mission-control-hash-chain-edge-hash", { ...edgeHashPayload(edgeWithoutHashes), edge_payload_hash: edgePayloadHash }),
    });
    edges.push(edge);
    if (!edgeHashMatch) failures.push(failure("EDGE_HASH_MISMATCH", `${edge.edge_id} hash does not match expected hash.`, "MISMATCH", `hash_edges.${edge.edge_id}.observed_edge_hash`));
    if (spec.unauthorized) failures.push(failure("SOURCE_ARTIFACT_UNAUTHORIZED", `${edge.edge_id} is unauthorized.`, "UNAUTHORIZED", `hash_edges.${edge.edge_id}`));
  });
  if (request.force_missing_edge) failures.push(failure("EDGE_MISSING", "Required hash chain edge is missing.", "INCOMPLETE", "hash_edges"));
  if (request.force_chain_gap) failures.push(failure("CHAIN_GAP_DETECTED", "Hash chain gap detected.", "INCOMPLETE", "hash_edges"));
  return Object.freeze(edges);
}

function buildRoot(
  request: TruthHashChainExecutionRequest,
  nodes: readonly TruthHashChainNode[],
  edges: readonly TruthHashChainEdge[],
  failures: TruthHashChainFailureReason[],
): TruthHashChainRoot {
  const expectedRoot = request.force_root_hash_mismatch ? "expected_wrong_root_hash" : request.expected_root_hash;
  const observedRoot = hashValue("mission-control-hash-chain-root-hash", {
    hash_chain_id: request.hash_chain_id,
    node_hashes: nodes.map((node) => node.node_hash),
    edge_hashes: edges.map((edge) => edge.edge_hash),
    root_strategy: request.root_strategy ?? "LINEAR_CHAIN_ROOT",
  });
  const rootHashMatch = expectedRoot === undefined || expectedRoot === observedRoot;
  if (!rootHashMatch) failures.push(failure("ROOT_HASH_MISMATCH", "Observed root hash does not match expected root hash.", "MISMATCH", "chain_root.observed_root_hash"));
  return Object.freeze({
    root_id: `root_${request.hash_chain_id}`,
    hash_chain_id: request.hash_chain_id,
    root_strategy: request.root_strategy ?? "LINEAR_CHAIN_ROOT",
    node_hashes: Object.freeze(nodes.map((node) => node.node_hash)),
    edge_hashes: Object.freeze(edges.map((edge) => edge.edge_hash)),
    expected_root_hash: expectedRoot,
    observed_root_hash: observedRoot,
    root_hash_match: rootHashMatch,
    root_hash_algorithm: "SHA256",
    canonical_serialization: "STABLE_JSON",
  });
}

function buildProof(
  request: TruthHashChainExecutionRequest,
  root: TruthHashChainRoot,
  canonical: TruthHashChainCanonicalizationContext,
  ordering: TruthHashChainOrderingContext,
  hash: TruthHashChainHashContext,
): TruthHashChainProof {
  const proofWithoutHash = {
    proof_id: `proof_${request.hash_chain_id}`,
    hash_chain_id: request.hash_chain_id,
    root_hash: root.observed_root_hash,
    node_count: root.node_hashes.length,
    edge_count: root.edge_hashes.length,
    proof_path_hashes: [...root.node_hashes, ...root.edge_hashes],
    canonicalization_context_hash: hashValue("mission-control-hash-chain-canonicalization-context-hash", canonical),
    ordering_context_hash: ordering.ordering_hash,
    hash_context_hash: hashValue("mission-control-hash-chain-hash-context-hash", hash),
  };
  const proofHash = request.force_proof_hash_mismatch ? "wrong_proof_hash" : hashValue("mission-control-hash-chain-proof-hash", proofWithoutHash);
  return Object.freeze({ ...proofWithoutHash, proof_hash: proofHash });
}

function executionHashPayload(execution: Omit<TruthHashChainExecution, "chain_execution_hash">): Record<string, unknown> {
  return {
    hash_chain_id: execution.hash_chain_id,
    integrity_contract_id: execution.integrity_contract_id,
    tenant_id: execution.tenant_id,
    mission_id: execution.mission_id,
    hash_chain_type: execution.hash_chain_type,
    hash_chain_scope: execution.hash_chain_scope,
    hash_chain_target: execution.hash_chain_target,
    source_refs: execution.source_refs,
    canonicalization_context: execution.canonicalization_context,
    ordering_context: execution.ordering_context,
    hash_context: execution.hash_context,
    expected_chain: execution.expected_chain,
    observed_chain: execution.observed_chain,
    hash_nodes: execution.hash_nodes,
    hash_edges: execution.hash_edges,
    chain_root: execution.chain_root,
    chain_proof: execution.chain_proof,
    completeness_report: execution.completeness_report,
    integrity_report: execution.integrity_report,
    chain_result_state: execution.chain_result_state,
    failure_reasons: execution.failure_reasons,
    escalation_reasons: execution.escalation_reasons,
    audit_events: execution.audit_events,
    created_at: execution.created_at,
  };
}

function validateRequestEnvelope(
  request: TruthHashChainExecutionRequest,
  contract: TruthIntegrityContract | undefined,
  scope: TruthHashChainScope | undefined,
  target: TruthHashChainTarget | undefined,
  failures: TruthHashChainFailureReason[],
): void {
  if (!contract || request.force_integrity_contract_missing) {
    failures.push(failure("INTEGRITY_CONTRACT_MISSING", "Integrity contract is required for hash chain execution.", "INVALID", "integrity_contract"));
    return;
  }
  const contractValidation = validateTruthIntegrityContract(contract);
  if (contractValidation.state === "INVALID") failures.push(failure("INTEGRITY_CONTRACT_INVALID", "Integrity contract must be valid before hash chain execution.", "INVALID", "integrity_contract"));
  if (request.force_integrity_contract_hash_mismatch || (contract.contract_hash && contract.contract_hash !== hashTruthIntegrityContract({ ...contract, contract_hash: undefined }))) {
    failures.push(failure("INTEGRITY_CONTRACT_HASH_MISMATCH", "Integrity contract hash does not match canonical contract.", "INVALID", "integrity_contract.contract_hash"));
  }
  if (!scope || request.force_hash_chain_scope_missing) {
    failures.push(failure("HASH_CHAIN_SCOPE_MISSING", "Hash chain scope is required.", "INVALID", "hash_chain_scope"));
    return;
  }
  if (!scope.allowed_tenant_ids.includes(contract.tenant_id)) failures.push(failure("TENANT_SCOPE_VIOLATION", "Hash chain tenant is outside allowed scope.", "INVALID", "hash_chain_scope.allowed_tenant_ids"));
  if (contract.mission_id && scope.allowed_mission_ids && !scope.allowed_mission_ids.includes(contract.mission_id)) {
    failures.push(failure("MISSION_SCOPE_VIOLATION", "Hash chain mission is outside allowed scope.", "INVALID", "hash_chain_scope.allowed_mission_ids"));
  }
  if (!target || request.force_hash_chain_target_missing) {
    failures.push(failure("HASH_CHAIN_TARGET_MISSING", "Hash chain target is required.", "INVALID", "hash_chain_target"));
    return;
  }
  if (target.target_ids.length === 0 || !scope.allowed_target_types.includes(target.target_type)) {
    failures.push(failure("HASH_CHAIN_TARGET_INVALID", "Hash chain target must be inside scope.", "INVALID", "hash_chain_target"));
  }
}

function validateContexts(request: TruthHashChainExecutionRequest, contract: TruthIntegrityContract, failures: TruthHashChainFailureReason[]): void {
  if (request.force_unstable_serialization) failures.push(failure("UNSTABLE_SERIALIZATION_DETECTED", "Unstable serialization detected.", "INVALID", "canonicalization_context"));
  if (request.force_wall_clock_injection) failures.push(failure("WALL_CLOCK_INJECTION_DETECTED", "Wall-clock injection detected.", "INVALID", "canonicalization_context"));
  if (request.force_environment_value) failures.push(failure("ENVIRONMENT_VALUE_DETECTED", "Environment-specific value detected.", "INVALID", "canonicalization_context"));
  if (request.force_ambiguous_ordering) failures.push(failure("AMBIGUOUS_ORDERING_DETECTED", "Hash chain ordering is ambiguous.", "INVALID", "ordering_context"));
  if (request.force_unsupported_hash_algorithm || contract.hash_requirements.required_hash_algorithm !== "SHA256") {
    failures.push(failure("UNSUPPORTED_HASH_ALGORITHM", "Hash chain requires SHA256.", "INVALID", "hash_context.hash_algorithm"));
  }
  if (request.force_source_mutation || contract.authority_context.source_mutation_allowed !== false) failures.push(failure("SOURCE_MUTATION_ATTEMPTED", "Hash chain engine cannot mutate sources.", "INVALID", "authority_context.source_mutation_allowed"));
  if (request.force_execution_authority || contract.authority_context.execution_authority !== "NONE") failures.push(failure("EXECUTION_AUTHORITY_DETECTED", "Hash chain engine cannot execute authority.", "INVALID", "authority_context.execution_authority"));
}

export function buildTruthHashChainExecution(request: TruthHashChainExecutionRequest): TruthHashChainExecution {
  const failures: TruthHashChainFailureReason[] = [];
  const contract = request.force_integrity_contract_missing ? undefined : request.integrity_contract;
  const chainType = request.hash_chain_type ?? (contract ? defaultType(contract) : "FULL_CONTEXT_HASH_CHAIN");
  const scope = request.force_hash_chain_scope_missing ? undefined : request.hash_chain_scope ?? (contract ? defaultScope(contract, chainType) : undefined);
  const target = request.force_hash_chain_target_missing ? undefined : request.hash_chain_target ?? (contract ? defaultTarget(contract, chainType) : undefined);
  const canonical = canonicalizationContext(request);
  const hash = contract ? hashContext(contract) : hashContext(request.integrity_contract);

  validateRequestEnvelope(request, contract, scope, target, failures);
  if (request.force_hash_chain_scope_missing && !failures.some((item) => item.code === "HASH_CHAIN_SCOPE_MISSING")) {
    failures.push(failure("HASH_CHAIN_SCOPE_MISSING", "Hash chain scope is required.", "INVALID", "hash_chain_scope"));
  }
  if (request.force_hash_chain_target_missing && !failures.some((item) => item.code === "HASH_CHAIN_TARGET_MISSING")) {
    failures.push(failure("HASH_CHAIN_TARGET_MISSING", "Hash chain target is required.", "INVALID", "hash_chain_target"));
  }
  if (scope && contract && !scope.allowed_tenant_ids.includes(contract.tenant_id) && !failures.some((item) => item.code === "TENANT_SCOPE_VIOLATION")) {
    failures.push(failure("TENANT_SCOPE_VIOLATION", "Hash chain tenant is outside allowed scope.", "INVALID", "hash_chain_scope.allowed_tenant_ids"));
  }
  if (scope && contract?.mission_id && scope.allowed_mission_ids && !scope.allowed_mission_ids.includes(contract.mission_id) && !failures.some((item) => item.code === "MISSION_SCOPE_VIOLATION")) {
    failures.push(failure("MISSION_SCOPE_VIOLATION", "Hash chain mission is outside allowed scope.", "INVALID", "hash_chain_scope.allowed_mission_ids"));
  }
  if (scope && target && (!target.target_ids.length || !scope.allowed_target_types.includes(target.target_type)) && !failures.some((item) => item.code === "HASH_CHAIN_TARGET_INVALID")) {
    failures.push(failure("HASH_CHAIN_TARGET_INVALID", "Hash chain target must be inside scope.", "INVALID", "hash_chain_target"));
  }
  if (contract) validateContexts(request, contract, failures);

  const orderedArtifacts = orderArtifacts({ ...request, hash_chain_type: chainType });
  const ordering = buildOrderingContext({ ...request, hash_chain_type: chainType }, orderedArtifacts);
  const nodes = buildNodes(orderedArtifacts, request, failures);
  for (const node of nodes) {
    if (contract && node.tenant_id !== contract.tenant_id) failures.push(failure("SOURCE_TENANT_MISMATCH", `${node.source_ref} tenant does not match contract tenant.`, "INVALID", `hash_nodes.${node.node_id}.tenant_id`));
    if (contract?.mission_id && node.mission_id && node.mission_id !== contract.mission_id) failures.push(failure("MISSION_SCOPE_VIOLATION", `${node.source_ref} mission does not match contract mission.`, "INVALID", `hash_nodes.${node.node_id}.mission_id`));
  }
  const edges = buildEdges(nodes, request, failures);
  const root = buildRoot(request, nodes, edges, failures);
  const proof = buildProof(request, root, canonical, ordering, hash);
  if (request.force_proof_hash_mismatch) failures.push(failure("PROOF_HASH_MISMATCH", "Hash chain proof hash mismatch detected.", "MISMATCH", "chain_proof.proof_hash"));

  const expectedNodeCount = request.expected_node_count ?? request.source_artifacts.filter((artifact) => !artifact.missing).length;
  const expectedEdgeCount = request.expected_edge_count ?? Math.max(expectedNodeCount - 1, 0);
  if (nodes.length < expectedNodeCount) failures.push(failure("SOURCE_ARTIFACT_MISSING", "Observed node count is below expected node count.", "INCOMPLETE", "hash_nodes"));
  if (edges.length < expectedEdgeCount) failures.push(failure("EDGE_MISSING", "Observed edge count is below expected edge count.", "INCOMPLETE", "hash_edges"));

  const resultState = dominant(failures.map((item) => item.result_state));
  const completeness = Object.freeze({
    complete: !failures.some((item) => item.result_state === "INCOMPLETE"),
    required_node_count: expectedNodeCount,
    observed_node_count: nodes.length,
    required_edge_count: expectedEdgeCount,
    observed_edge_count: edges.length,
    missing_nodes: Object.freeze(failures.filter((item) => item.code === "SOURCE_ARTIFACT_MISSING").map((item) => item.path)),
    missing_edges: Object.freeze(failures.filter((item) => item.code === "EDGE_MISSING" || item.code === "CHAIN_GAP_DETECTED").map((item) => item.path)),
    missing_hashes: Object.freeze(failures.filter((item) => item.code === "EXPECTED_NODE_HASH_MISSING").map((item) => item.path)),
  });
  const integrity: TruthHashChainIntegrityReport = Object.freeze({
    deterministic: !failures.some((item) => ["UNSTABLE_SERIALIZATION_DETECTED", "AMBIGUOUS_ORDERING_DETECTED", "UNSUPPORTED_HASH_ALGORITHM"].includes(item.code)),
    canonical_serialization_verified: !failures.some((item) => ["UNSTABLE_SERIALIZATION_DETECTED", "WALL_CLOCK_INJECTION_DETECTED", "ENVIRONMENT_VALUE_DETECTED"].includes(item.code)),
    ordering_verified: !failures.some((item) => ["AMBIGUOUS_ORDERING_DETECTED", "ORDERING_INVALID"].includes(item.code)),
    tenant_scope_preserved: !failures.some((item) => ["TENANT_SCOPE_VIOLATION", "SOURCE_TENANT_MISMATCH", "CROSS_TENANT_EDGE_DETECTED"].includes(item.code)),
    mission_scope_preserved: !failures.some((item) => item.code === "MISSION_SCOPE_VIOLATION"),
    governance_preserved: !failures.some((item) => ["POLICY_SUBSTITUTION_DETECTED", "GOVERNANCE_BYPASS_DETECTED"].includes(item.code)),
    authority_preserved: !failures.some((item) => ["SOURCE_ARTIFACT_UNAUTHORIZED", "EXECUTION_AUTHORITY_DETECTED", "SOURCE_MUTATION_ATTEMPTED"].includes(item.code)),
    evidence_preserved: !failures.some((item) => ["EVIDENCE_MISSING", "EVIDENCE_HASH_MISMATCH"].includes(item.code)),
    lineage_preserved: !failures.some((item) => item.code === "LINEAGE_BROKEN"),
    replay_provenance_preserved: !failures.some((item) => ["REPLAY_HASH_MISMATCH", "REPLAY_PROVENANCE_MISMATCH"].includes(item.code)),
    schema_context_preserved: !failures.some((item) => ["SCHEMA_HASH_MISMATCH", "SILENT_SCHEMA_MIGRATION_DETECTED"].includes(item.code)),
    node_hash_mismatches: Object.freeze(failures.filter((item) => item.code === "NODE_HASH_MISMATCH").map((item) => item.path)),
    edge_hash_mismatches: Object.freeze(failures.filter((item) => item.code === "EDGE_HASH_MISMATCH").map((item) => item.path)),
    corrupted_nodes: Object.freeze(failures.filter((item) => item.code === "CORRUPTED_NODE_DETECTED").map((item) => item.path)),
    unauthorized_nodes: Object.freeze(failures.filter((item) => item.code === "SOURCE_ARTIFACT_UNAUTHORIZED").map((item) => item.path)),
    invalid_edges: Object.freeze(failures.filter((item) => item.code === "CROSS_TENANT_EDGE_DETECTED" || item.code === "EDGE_INVALID").map((item) => item.path)),
  });
  const auditEvents: TruthHashChainAuditEventName[] = [
    "HASH_CHAIN_REQUESTED",
    "HASH_CHAIN_INTEGRITY_CONTRACT_LOADED",
    "HASH_CHAIN_SCOPE_RESOLVED",
    "HASH_CHAIN_SOURCES_LOADED",
    "HASH_CHAIN_ARTIFACTS_CANONICALIZED",
    "HASH_CHAIN_NODES_BUILT",
    "HASH_CHAIN_EDGES_BUILT",
    "HASH_CHAIN_ORDERED",
    "HASH_CHAIN_ROOT_COMPUTED",
    resultState === "VERIFIED" ? "HASH_CHAIN_VERIFIED" : resultState === "MISMATCH" ? "HASH_CHAIN_MISMATCH_DETECTED" : resultState === "INCOMPLETE" ? "HASH_CHAIN_INCOMPLETE_DETECTED" : resultState === "CORRUPTED" ? "HASH_CHAIN_CORRUPTION_DETECTED" : resultState === "UNAUTHORIZED" ? "HASH_CHAIN_UNAUTHORIZED_DETECTED" : "HASH_CHAIN_INVALID_DETECTED",
    "HASH_CHAIN_PROOF_CREATED",
    "HASH_CHAIN_RESULT_RECORDED",
  ];
  const executionWithoutHash: Omit<TruthHashChainExecution, "chain_execution_hash"> = Object.freeze({
    hash_chain_id: request.hash_chain_id,
    integrity_contract_id: contract?.integrity_contract_id ?? "missing_integrity_contract",
    tenant_id: contract?.tenant_id ?? request.integrity_contract.tenant_id,
    mission_id: contract?.mission_id ?? request.integrity_contract.mission_id,
    hash_chain_type: chainType,
    hash_chain_scope: scope ?? defaultScope(request.integrity_contract, chainType),
    hash_chain_target: target ?? defaultTarget(request.integrity_contract, chainType),
    requested_by: request.integrity_contract.requested_by,
    requested_at: request.integrity_contract.requested_at,
    source_refs: request.integrity_contract.source_refs,
    canonicalization_context: canonical,
    ordering_context: ordering,
    hash_context: hash,
    expected_chain: Object.freeze({
      expected_root_hash: request.expected_root_hash,
      expected_node_count: expectedNodeCount,
      expected_edge_count: expectedEdgeCount,
      expected_node_hashes: Object.freeze(nodes.map((node) => node.expected_hash).filter((item): item is string => !!item)),
      expected_edge_hashes: Object.freeze(edges.map((edge) => edge.expected_edge_hash).filter((item): item is string => !!item)),
    }),
    observed_chain: Object.freeze({
      observed_root_hash: root.observed_root_hash,
      observed_node_count: nodes.length,
      observed_edge_count: edges.length,
      observed_node_hashes: Object.freeze(nodes.map((node) => node.observed_hash)),
      observed_edge_hashes: Object.freeze(edges.map((edge) => edge.observed_edge_hash)),
    }),
    hash_nodes: nodes,
    hash_edges: edges,
    chain_root: root,
    chain_proof: proof,
    completeness_report: completeness,
    integrity_report: integrity,
    chain_result_state: resultState,
    lifecycle_state: resultState === "VERIFIED" ? "VERIFIED" : failures.some((item) => item.result_state === "UNAUTHORIZED") ? "ESCALATED" : "FAILED",
    certification_state: resultState === "VERIFIED" ? "CHAIN_VERIFIED" : resultState === "MISMATCH" ? "CHAIN_MISMATCHED" : resultState === "INCOMPLETE" ? "CHAIN_INCOMPLETE" : resultState === "CORRUPTED" ? "CHAIN_CORRUPTED" : resultState === "UNAUTHORIZED" ? "CHAIN_UNAUTHORIZED" : "CHAIN_INVALID",
    failure_reasons: failures.length ? Object.freeze(failures) : undefined,
    escalation_reasons: failures.some((item) => item.result_state === "UNAUTHORIZED") ? Object.freeze(failures.filter((item) => item.result_state === "UNAUTHORIZED").map((item) => Object.freeze({ code: item.code, message: item.message, path: item.path }))) : undefined,
    audit_events: Object.freeze(auditEvents),
    created_at: request.created_at,
    readOnly: true,
    sourceMutationAllowed: false,
  });
  return Object.freeze({
    ...executionWithoutHash,
    chain_execution_hash: hashValue("mission-control-hash-chain-execution-hash", executionHashPayload(executionWithoutHash)),
  });
}

export function toTruthHashChainExecutionStorageRecord(execution: TruthHashChainExecution): TruthHashChainExecutionStorageRecord {
  return Object.freeze({
    hash_chain_id: execution.hash_chain_id,
    integrity_contract_id: execution.integrity_contract_id,
    tenant_id: execution.tenant_id,
    mission_id: execution.mission_id,
    hash_chain_type: execution.hash_chain_type,
    hash_chain_scope_json: canonicalizeConfidenceToString(execution.hash_chain_scope),
    hash_chain_target_json: canonicalizeConfidenceToString(execution.hash_chain_target),
    requested_by_json: canonicalizeConfidenceToString(execution.requested_by),
    requested_at: execution.requested_at,
    source_refs_json: canonicalizeConfidenceToString(execution.source_refs),
    canonicalization_context_json: canonicalizeConfidenceToString(execution.canonicalization_context),
    ordering_context_json: canonicalizeConfidenceToString(execution.ordering_context),
    hash_context_json: canonicalizeConfidenceToString(execution.hash_context),
    expected_chain_json: execution.expected_chain ? canonicalizeConfidenceToString(execution.expected_chain) : undefined,
    observed_chain_json: execution.observed_chain ? canonicalizeConfidenceToString(execution.observed_chain) : undefined,
    hash_nodes_json: canonicalizeConfidenceToString(execution.hash_nodes),
    hash_edges_json: canonicalizeConfidenceToString(execution.hash_edges),
    chain_root_json: canonicalizeConfidenceToString(execution.chain_root),
    chain_proof_json: canonicalizeConfidenceToString(execution.chain_proof),
    completeness_report_json: canonicalizeConfidenceToString(execution.completeness_report),
    integrity_report_json: canonicalizeConfidenceToString(execution.integrity_report),
    chain_result_state: execution.chain_result_state,
    lifecycle_state: execution.lifecycle_state,
    certification_state: execution.certification_state,
    failure_reasons_json: execution.failure_reasons ? canonicalizeConfidenceToString(execution.failure_reasons) : undefined,
    escalation_reasons_json: execution.escalation_reasons ? canonicalizeConfidenceToString(execution.escalation_reasons) : undefined,
    audit_events_json: canonicalizeConfidenceToString(execution.audit_events),
    chain_execution_hash: execution.chain_execution_hash,
    created_at: execution.created_at,
  });
}
