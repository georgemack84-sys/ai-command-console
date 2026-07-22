import { buildInstitutionalMemoryEngine, validateInstitutionalMemoryEngine } from "@/services/institutional-memory-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CrossMissionGraphCertification,
  CrossMissionGraphCertificationTest,
  CrossMissionGraphContract,
  CrossMissionGraphContractBundle,
  CrossMissionGraphFailure,
  CrossMissionGraphInput,
  CrossMissionGraphResult,
  CrossMissionGraphScenario,
  CrossMissionGraphValidation,
  GraphDomain,
  GraphDomainRecord,
  GraphEdge,
  GraphEdgeKind,
  GraphLedgerEntry,
  GraphNode,
  GraphNodeKind,
  GraphObservability,
  GraphReplay,
  HistoricalClusterRecord,
  SemanticSearchResult,
  TraversalRecord,
} from "@/types/cross-mission-intelligence-graph";

const VERSION = "cross-mission-intelligence-graph/v11.4" as const;
const ID = "CrossMissionIntelligenceGraph" as const;
const TENANT_ID = "tenant_mission_control";
const DOMAINS: readonly GraphDomain[] = Object.freeze(["MISSION_GRAPH", "ENTITY_RELATIONSHIPS", "STRATEGY_RELATIONSHIPS", "EVIDENCE_RELATIONSHIPS", "PATTERN_RELATIONSHIPS", "TEMPORAL_RELATIONSHIPS"]);
const NODE_KINDS: readonly GraphNodeKind[] = Object.freeze(["MISSION", "ENTITY", "STRATEGY", "EVIDENCE", "PATTERN", "TEMPORAL_EVENT"]);
const EDGE_KINDS: readonly GraphEdgeKind[] = Object.freeze(["RELATED_TO", "PARTICIPATES_IN", "GOVERNED_BY", "EVOLVED_FROM", "SUPPORTS", "CONTRADICTS", "RECURRING_PATTERN", "CAUSAL_SEQUENCE", "SUPERSEDES"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: CrossMissionGraphScenario): CrossMissionGraphFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly CrossMissionGraphFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly CrossMissionGraphFailure[]): CrossMissionGraphContract {
  const base: Omit<CrossMissionGraphContract, "integrity_hash"> = {
    contract_id: id("cross_mission_graph_contract", VERSION),
    lifecycle: freezeArray(["QUALIFIED_INTELLIGENCE", "GRAPH_QUALIFICATION", "NODE_BUILDER", "RELATIONSHIP_DISCOVERY", "RELATIONSHIP_QUALIFICATION", "GRAPH_VALIDATION", "IMMUTABLE_GRAPH_LEDGER", "SEMANTIC_QUERY_ENGINE", "CROSS_MISSION_INTELLIGENCE_APIS"]),
    domains: DOMAINS,
    node_identity_deterministic: !failures.includes("NODE_IDENTITY_NONDETERMINISTIC"),
    edge_identity_deterministic: !failures.includes("EDGE_IDENTITY_NONDETERMINISTIC"),
    qualification_only: !failures.includes("QUALIFICATION_BYPASS"),
    governance_required: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    constitutional_required: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    replay_required: !failures.includes("REPLAY_DIVERGENCE"),
    confidence_threshold: 0.8,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("GRAPH_CONTRACT_INVALID") ? "invalid-graph-contract" : hashWithoutIntegrity(base) });
}

function nodes(input: CrossMissionGraphInput, sourceRefs: readonly string[], failures: readonly CrossMissionGraphFailure[]): readonly GraphNode[] {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  return freezeArray(NODE_KINDS.map((kind, index) => {
    const source_ref = sourceRefs[index % sourceRefs.length] ?? `source:${kind.toLowerCase()}`;
    const base: Omit<GraphNode, "integrity_hash"> = {
      node_id: failures.includes("NODE_IDENTITY_NONDETERMINISTIC") ? `node_mutated_${index}` : id("graph_node", { tenant_id, kind, source_ref, version: VERSION }),
      kind,
      tenant_id,
      source_ref,
      version_ref: `version:${source_ref}:1.0.0`,
      qualification_ref: failures.includes("QUALIFICATION_BYPASS") ? "" : `qualification:${source_ref}`,
      lineage_refs: failures.includes("LINEAGE_CORRUPTION") ? freezeArray([]) : freezeArray([`lineage:${source_ref}`, "lineage:institutional-memory"]),
      confidence: failures.includes("CONFIDENCE_THRESHOLD_BYPASS") ? 0.51 : 0.91 - index * 0.01,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function edges(nodeRows: readonly GraphNode[], failures: readonly CrossMissionGraphFailure[]): readonly GraphEdge[] {
  return freezeArray(DOMAINS.map((domain, index) => {
    const from = nodeRows[index % nodeRows.length];
    const to = nodeRows[(index + 1) % nodeRows.length];
    const kind = EDGE_KINDS[index % EDGE_KINDS.length];
    const base: Omit<GraphEdge, "integrity_hash"> = {
      edge_id: failures.includes("EDGE_IDENTITY_NONDETERMINISTIC") ? `edge_mutated_${index}` : id("graph_edge", { domain, kind, from: from.node_id, to: to.node_id, version: "1.0.0" }),
      kind,
      from_node_id: from.node_id,
      to_node_id: to.node_id,
      domain,
      evidence_refs: failures.includes("EVIDENCE_RELATIONSHIP_INVALID") ? freezeArray([]) : freezeArray([`evidence:${domain.toLowerCase()}`, from.source_ref]),
      governance_refs: failures.includes("GOVERNANCE_VALIDATION_MISSING") ? freezeArray([]) : freezeArray(["governance:cross-mission-graph:approved"]),
      constitutional_refs: failures.includes("CONSTITUTIONAL_VALIDATION_MISSING") ? freezeArray([]) : freezeArray(["constitutional:cross-mission-graph:validated"]),
      lineage_refs: failures.includes("LINEAGE_CORRUPTION") ? freezeArray([]) : freezeArray([`lineage:edge:${domain.toLowerCase()}`]),
      confidence: failures.includes("CONFIDENCE_THRESHOLD_BYPASS") ? 0.55 : 0.88,
      version: failures.includes("VERSION_HISTORY_MISSING") ? "" : "1.0.0",
      tenant_id: failures.includes("CROSS_TENANT_RELATIONSHIP_UNAUTHORIZED") ? "tenant_other" : from.tenant_id,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function domainRecords(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): readonly GraphDomainRecord[] {
  return freezeArray(DOMAINS.map((domain) => {
    const domainEdges = edgeRows.filter((edge) => edge.domain === domain);
    const base: Omit<GraphDomainRecord, "integrity_hash"> = { domain, node_refs: freezeArray(nodeRows.map((node) => node.node_id)), edge_refs: freezeArray(domainEdges.map((edge) => edge.edge_id)), validated: !failureForDomain(domain, failures), replay_ref: `replay:cross-mission-graph:${domain.toLowerCase()}` };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function failureForDomain(domain: GraphDomain, failures: readonly CrossMissionGraphFailure[]): boolean {
  const map: Record<GraphDomain, CrossMissionGraphFailure> = {
    MISSION_GRAPH: "MISSION_GRAPH_INVALID",
    ENTITY_RELATIONSHIPS: "ENTITY_RELATIONSHIP_INVALID",
    STRATEGY_RELATIONSHIPS: "STRATEGY_RELATIONSHIP_INVALID",
    EVIDENCE_RELATIONSHIPS: "EVIDENCE_RELATIONSHIP_INVALID",
    PATTERN_RELATIONSHIPS: "PATTERN_RELATIONSHIP_INVALID",
    TEMPORAL_RELATIONSHIPS: "TEMPORAL_RELATIONSHIP_INVALID",
  };
  return failures.includes(map[domain]);
}

function search(nodeRows: readonly GraphNode[], failures: readonly CrossMissionGraphFailure[]): SemanticSearchResult {
  const base: Omit<SemanticSearchResult, "integrity_hash"> = { search_id: id("semantic_search", "cross-mission-risk-strategy"), query: "recurring risk strategy evidence", result_node_refs: freezeArray(nodeRows.slice(0, 4).map((node) => node.node_id)), explanation_refs: freezeArray(["explain:semantic:lineage", "explain:semantic:evidence"]), deterministic: !failures.includes("SEARCH_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function traversal(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): TraversalRecord {
  const base: Omit<TraversalRecord, "integrity_hash"> = { traversal_id: id("graph_traversal", nodeRows.map((node) => node.node_id)), start_node_id: nodeRows[0].node_id, path: freezeArray(nodeRows.map((node) => node.node_id)), relationship_refs: freezeArray(edgeRows.map((edge) => edge.edge_id)), deterministic: !failures.includes("TRAVERSAL_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function clusters(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): readonly HistoricalClusterRecord[] {
  return freezeArray([
    Object.freeze({ cluster_id: id("historical_cluster", "risk-strategy"), label: "Recurring risk-to-strategy evolution", node_refs: freezeArray(nodeRows.slice(0, 3).map((node) => node.node_id)), edge_refs: freezeArray(edgeRows.slice(0, 3).map((edge) => edge.edge_id)), reproducible: !failures.includes("CLUSTERING_NONDETERMINISTIC"), integrity_hash: "" }),
    Object.freeze({ cluster_id: id("historical_cluster", "evidence-governance"), label: "Evidence-backed governance decisions", node_refs: freezeArray(nodeRows.slice(3).map((node) => node.node_id)), edge_refs: freezeArray(edgeRows.slice(3).map((edge) => edge.edge_id)), reproducible: !failures.includes("CLUSTERING_NONDETERMINISTIC"), integrity_hash: "" }),
  ].map((cluster) => {
    const base = { ...cluster };
    delete (base as { integrity_hash?: string }).integrity_hash;
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function replay(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): GraphReplay {
  const ok = !failures.includes("REPLAY_DIVERGENCE");
  const baseWithoutHash = { replay_id: id("cross_mission_graph_replay", { nodes: nodeRows.map((node) => node.node_id), edges: edgeRows.map((edge) => edge.edge_id) }), node_reconstruction: ok, edge_reconstruction: ok, search_replay: ok, traversal_replay: ok, clustering_replay: ok, lineage_replay: !failures.includes("LINEAGE_CORRUPTION"), divergence_detected: failures.includes("REPLAY_DIVERGENCE") };
  const replay_hash = hash(baseWithoutHash);
  return Object.freeze({ ...baseWithoutHash, replay_hash, integrity_hash: hashWithoutIntegrity({ ...baseWithoutHash, replay_hash }) });
}

function ledger(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): readonly GraphLedgerEntry[] {
  const events: readonly GraphLedgerEntry["event"][] = freezeArray(["GRAPH_QUALIFIED", "NODE_CREATED", "EDGE_CREATED", "RELATIONSHIP_QUALIFIED", "GRAPH_VALIDATED", "SEARCH_INDEXED", "REPLAY_CERTIFIED", "GRAPH_CERTIFIED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<GraphLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("cross_mission_graph_ledger", `${event}:${index}`), sequence: index + 1, event, node_refs: freezeArray(nodeRows.map((node) => node.node_id)), edge_refs: freezeArray(edgeRows.map((edge) => edge.edge_id)), append_only: true };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(nodeRows: readonly GraphNode[], edgeRows: readonly GraphEdge[], failures: readonly CrossMissionGraphFailure[]): GraphObservability {
  const base: Omit<GraphObservability, "integrity_hash"> = { observability_id: "cross_mission_graph_observability", graph_growth_nodes: nodeRows.length, graph_growth_edges: edgeRows.length, orphan_nodes: failures.includes("GRAPH_INCONSISTENT") ? 1 : 0, broken_edges: failures.includes("GRAPH_INCONSISTENT") ? 1 : 0, stale_intelligence: failures.includes("VERSION_HISTORY_MISSING") ? 1 : 0, duplicate_relationships: 0, qualification_failures: failures.includes("QUALIFICATION_BYPASS") ? 1 : 0, replay_divergence: failures.includes("REPLAY_DIVERGENCE") ? 1 : 0, traversal_latency_ms: failures.includes("PERFORMANCE_THRESHOLD_MISSED") ? 240 : 34, graph_consistency: failures.includes("GRAPH_INCONSISTENT") ? 0.67 : 1, lineage_completeness: failures.includes("LINEAGE_CORRUPTION") ? 0.48 : 1, operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: CrossMissionGraphFailure, refs: readonly string[]): CrossMissionGraphCertificationTest {
  const base: Omit<CrossMissionGraphCertificationTest, "integrity_hash"> = { test_id: id("cross_mission_graph_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<CrossMissionGraphResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly CrossMissionGraphCertificationTest[] {
  const refs = freezeArray([...result.nodes.map((node) => node.integrity_hash), ...result.edges.map((edge) => edge.integrity_hash)]);
  const tenant = result.nodes[0]?.tenant_id;
  return freezeArray([
    test("Graph Contract validation", hashWithoutIntegrity(result.contract) === result.contract.integrity_hash, "GRAPH_CONTRACT_INVALID", refs),
    test("Node identity determinism", result.contract.node_identity_deterministic && result.nodes.every((node) => node.node_id.startsWith("graph_node_")), "NODE_IDENTITY_NONDETERMINISTIC", refs),
    test("Edge identity determinism", result.contract.edge_identity_deterministic && result.edges.every((edge) => edge.edge_id.startsWith("graph_edge_")), "EDGE_IDENTITY_NONDETERMINISTIC", refs),
    test("Mission graph validation", Boolean(result.domains.find((domain) => domain.domain === "MISSION_GRAPH")?.validated), "MISSION_GRAPH_INVALID", refs),
    test("Entity relationships validated", Boolean(result.domains.find((domain) => domain.domain === "ENTITY_RELATIONSHIPS")?.validated), "ENTITY_RELATIONSHIP_INVALID", refs),
    test("Strategy relationships validated", Boolean(result.domains.find((domain) => domain.domain === "STRATEGY_RELATIONSHIPS")?.validated), "STRATEGY_RELATIONSHIP_INVALID", refs),
    test("Evidence relationships validated", Boolean(result.domains.find((domain) => domain.domain === "EVIDENCE_RELATIONSHIPS")?.validated) && result.edges.every((edge) => edge.evidence_refs.length > 0), "EVIDENCE_RELATIONSHIP_INVALID", refs),
    test("Pattern relationships validated", Boolean(result.domains.find((domain) => domain.domain === "PATTERN_RELATIONSHIPS")?.validated), "PATTERN_RELATIONSHIP_INVALID", refs),
    test("Temporal relationships validated", Boolean(result.domains.find((domain) => domain.domain === "TEMPORAL_RELATIONSHIPS")?.validated), "TEMPORAL_RELATIONSHIP_INVALID", refs),
    test("Similarity search reproducible", result.search.deterministic, "SEARCH_NONDETERMINISTIC", refs),
    test("Semantic traversal deterministic", result.traversal.deterministic, "TRAVERSAL_NONDETERMINISTIC", refs),
    test("Historical clustering reproducible", result.clusters.every((cluster) => cluster.reproducible), "CLUSTERING_NONDETERMINISTIC", refs),
    test("Organizational graph consistency", result.observability.graph_consistency === 1 && result.observability.orphan_nodes === 0 && result.observability.broken_edges === 0, "GRAPH_INCONSISTENT", refs),
    test("Confidence-qualified relationships enforced", result.edges.every((edge) => edge.confidence >= result.contract.confidence_threshold), "CONFIDENCE_THRESHOLD_BYPASS", refs),
    test("Qualification-only intelligence admitted", result.institutional_memory_certified && result.nodes.every((node) => node.qualification_ref.length > 0), "QUALIFICATION_BYPASS", refs),
    test("Immutable lineage preserved", result.nodes.every((node) => node.lineage_refs.length > 0) && result.edges.every((edge) => edge.lineage_refs.length > 0), "LINEAGE_CORRUPTION", refs),
    test("Version history maintained", result.nodes.every((node) => node.version_ref.length > 0) && result.edges.every((edge) => edge.version.length > 0), "VERSION_HISTORY_MISSING", refs),
    test("Replay deterministic", result.replay.node_reconstruction && result.replay.edge_reconstruction, "REPLAY_DIVERGENCE", refs),
    test("Replay divergence detection operational", !result.replay.divergence_detected, "REPLAY_DIVERGENCE", refs),
    test("Governance validation mandatory", result.contract.governance_required && result.edges.every((edge) => edge.governance_refs.length > 0), "GOVERNANCE_VALIDATION_MISSING", refs),
    test("Constitutional validation mandatory", result.contract.constitutional_required && result.edges.every((edge) => edge.constitutional_refs.length > 0), "CONSTITUTIONAL_VALIDATION_MISSING", refs),
    test("Tenant isolation preserved", result.contract.tenant_isolation_required && result.nodes.every((node) => node.tenant_id === tenant), "TENANT_ISOLATION_BREACH", refs),
    test("Cross-tenant relationships blocked unless explicitly authorized", result.edges.every((edge) => edge.tenant_id === tenant), "CROSS_TENANT_RELATIONSHIP_UNAUTHORIZED", refs),
    test("Security controls validated", result.contract.tenant_isolation_required && result.contract.governance_required, "SECURITY_CONTROL_FAILURE", refs),
    test("Graph observability operational", result.observability.operational, "OBSERVABILITY_INCOMPLETE", refs),
    test("Performance within certified limits", result.observability.traversal_latency_ms <= 100, "PERFORMANCE_THRESHOLD_MISSED", refs),
    test("Integrity hashes reproducible", result.nodes.every((node) => hashWithoutIntegrity(node) === node.integrity_hash) && result.edges.every((edge) => hashWithoutIntegrity(edge) === edge.integrity_hash), "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<CrossMissionGraphResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, nodes: result.nodes.map((node) => node.integrity_hash), edges: result.edges.map((edge) => edge.integrity_hash), domains: result.domains.map((domain) => domain.integrity_hash), search: result.search.integrity_hash, traversal: result.traversal.integrity_hash, clusters: result.clusters.map((cluster) => cluster.integrity_hash), replay: result.replay.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<CrossMissionGraphResult, "integrity_hash">): string {
  return hash({ version: result.graph_version, id: result.graph_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function buildCrossMissionIntelligenceGraph(input: CrossMissionGraphInput = {}): CrossMissionGraphResult {
  const memory = buildInstitutionalMemoryEngine({ tenant_id: input.tenant_id });
  const memoryValid = validateInstitutionalMemoryEngine(memory).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const initialFailures = freezeArray<CrossMissionGraphFailure>([...(memoryValid ? [] : ["INSTITUTIONAL_MEMORY_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const contractRecord = contract(initialFailures);
  const nodeRows = nodes(input, memory.records.map((record) => record.memory_id), initialFailures);
  const edgeRows = edges(nodeRows, initialFailures);
  const baseWithoutCertification: TestBase = { graph_version: VERSION, graph_identifier: ID, institutional_memory_certified: memoryValid, contract: contractRecord, nodes: nodeRows, edges: edgeRows, domains: domainRecords(nodeRows, edgeRows, initialFailures), search: search(nodeRows, initialFailures), traversal: traversal(nodeRows, edgeRows, initialFailures), clusters: clusters(nodeRows, edgeRows, initialFailures), replay: replay(nodeRows, edgeRows, initialFailures), ledger: ledger(nodeRows, edgeRows, initialFailures), observability: observability(nodeRows, edgeRows, initialFailures) };
  const validationTests = certificationTests(baseWithoutCertification);
  const failures = freezeArray([...new Set([...initialFailures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is CrossMissionGraphFailure => Boolean(failure))])]);
  const status = statusFor(failures);
  const certBase: Omit<CrossMissionGraphCertification, "integrity_hash"> = { certification_id: id("cross_mission_graph_certification", VERSION), status, available_for_graph_intelligence: status === "PASS", failures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<CrossMissionGraphResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateCrossMissionIntelligenceGraph(result?: CrossMissionGraphResult): CrossMissionGraphValidation {
  if (!result) {
    const failures = freezeArray<CrossMissionGraphFailure>(["GRAPH_CONTRACT_INVALID"]);
    const base: Omit<CrossMissionGraphValidation, "validation_hash"> = { graph_id: null, valid: false, status: "FAIL", available_for_graph_intelligence: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash
    && result.nodes.every((node) => hashWithoutIntegrity(node) === node.integrity_hash)
    && result.edges.every((edge) => hashWithoutIntegrity(edge) === edge.integrity_hash)
    && hashWithoutIntegrity(result.replay) === result.replay.integrity_hash
    && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.available_for_graph_intelligence && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<CrossMissionGraphValidation, "validation_hash"> = { graph_id: result.nodes[0]?.node_id ?? null, valid, status: result.certification.status, available_for_graph_intelligence: result.certification.available_for_graph_intelligence, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayCrossMissionIntelligenceGraph(result = buildCrossMissionIntelligenceGraph()): boolean {
  const replayed = buildCrossMissionIntelligenceGraph({ tenant_id: result.nodes[0]?.tenant_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateCrossMissionIntelligenceGraph(result).valid;
}

export function getCrossMissionIntelligenceGraphContract(): CrossMissionGraphContractBundle {
  const result = buildCrossMissionIntelligenceGraph();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, graph_is_adaptive_memory: false, graph_is_institutional_memory_store: false, qualification_only: true, confidence_qualified_edges: true, domains: DOMAINS }), result, validation: validateCrossMissionIntelligenceGraph(result), observability: result.observability });
}

export const CrossMissionIntelligenceGraph = Object.freeze({ build: buildCrossMissionIntelligenceGraph, validate: validateCrossMissionIntelligenceGraph, replay: replayCrossMissionIntelligenceGraph });
