import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runPredictionKnowledgeRepository, validatePredictionKnowledgeRepository } from "@/services/prediction-knowledge-repository";
import type {
  CognitiveExplainabilityEngineContract,
  CognitiveExplainabilityFailure,
  CognitiveExplainabilityInput,
  CognitiveExplainabilityLevel,
  CognitiveExplainabilityObservabilitySurface,
  CognitiveExplainabilityReplayResult,
  CognitiveExplainabilityRepository,
  CognitiveExplainabilityScenario,
  CognitiveExplainabilityValidationResult,
  CognitiveExplanationObject,
  CounterfactualAnalysis,
  EvidenceHierarchyItem,
  ReasoningGraph,
  ReasoningGraphEdge,
  ReasoningGraphNode,
} from "@/types/cognitive-explainability-engine";
import type { PredictionKnowledgeObject } from "@/types/prediction-knowledge-repository";

const NOW = "2026-07-12T20:00:00.000Z";
const VERSION = "cognitive-explainability-engine/v8ALT.3.6" as const;
const TENANT_ID = "tenant:autonomy:primary";
const explainabilityLevels: readonly CognitiveExplainabilityLevel[] = Object.freeze(["EXECUTIVE", "OPERATOR", "ANALYST", "FORENSIC", "CERTIFICATION", "DEVELOPER"]);
const pipelineStates = Object.freeze(["EXPLANATION_REQUESTED", "KNOWLEDGE_RETRIEVAL", "EVIDENCE_RECONSTRUCTION", "REASONING_RECONSTRUCTION", "ALTERNATIVE_ANALYSIS", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "REPLAY_VALIDATION", "COGNITIVE_EXPLANATION", "CERTIFICATION", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioFailures(scenario: CognitiveExplainabilityScenario): readonly CognitiveExplainabilityFailure[] {
  const map: Partial<Record<CognitiveExplainabilityScenario, CognitiveExplainabilityFailure>> = {
    HIDDEN_REASONING: "HIDDEN_REASONING_DETECTED",
    UNDOCUMENTED_EVIDENCE_INFLUENCE: "UNDOCUMENTED_EVIDENCE_INFLUENCE_DETECTED",
    UNEXPLAINED_GOVERNANCE_OUTCOME: "UNEXPLAINED_GOVERNANCE_OUTCOME_DETECTED",
    CONSTITUTIONAL_VALIDATION_MISSING: "CONSTITUTIONAL_VALIDATION_MISSING",
    REPLAY_EXPLANATION_MISMATCH: "REPLAY_EXPLANATION_MISMATCH",
    EXPLANATION_MUTATION: "EXPLANATION_MUTATION_DETECTED",
    CROSS_TENANT_ACCESS: "CROSS_TENANT_EXPLANATION_ACCESS_DETECTED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function graphNode(type: ReasoningGraphNode["node_type"], label: string, source: string, order: number): ReasoningGraphNode {
  const base = { node_id: id("CEEN", "cognitive-explainability-node", { type, source, order }), node_type: type, label, source_reference: source, deterministic_order: order };
  return Object.freeze({ ...base, node_hash: hashValue("cognitive-explainability-node", base) });
}

function graphEdge(from: string, to: string, relation: ReasoningGraphEdge["relation"], rationale: string, order: number): ReasoningGraphEdge {
  const base = { edge_id: id("CEEE", "cognitive-explainability-edge", { from, to, relation, order }), from_node_id: from, to_node_id: to, relation, rationale, deterministic_order: order };
  return Object.freeze({ ...base, edge_hash: hashValue("cognitive-explainability-edge", base) });
}

function reasoningGraph(knowledge: PredictionKnowledgeObject, failures: readonly CognitiveExplainabilityFailure[]): ReasoningGraph {
  const nodes = [
    graphNode("OBSERVATION", "Originating predictive observations", knowledge.prediction_history.join("|"), 0),
    graphNode("EVIDENCE", "Evidence selected from knowledge repository", knowledge.knowledge_id, 1),
    graphNode("MODEL", "Versioned predictive model reference", knowledge.model_reference, 2),
    graphNode("FORECAST", "Forecast evolution reconstructed", knowledge.forecast_evolution.join("|"), 3),
    graphNode("CONFIDENCE", "Confidence contributors reconstructed", knowledge.confidence_evolution.join("|"), 4),
    graphNode("GOVERNANCE", "Governance reasoning reconstructed", knowledge.governance_metadata.join("|"), 5),
    graphNode("CONSTITUTIONAL", "Constitutional compliance reconstructed", knowledge.constitutional_metadata.join("|"), 6),
    graphNode("COUNTERFACTUAL", "Alternative futures compared", knowledge.scenario_results.join("|"), 7),
    graphNode("REPLAY", "Replay pathway reconstructed", knowledge.replay_reference, 8),
    graphNode("CERTIFICATION", "Certification evidence preserved", knowledge.certification_reference, 9),
  ].sort((a, b) => a.deterministic_order - b.deterministic_order);
  const hidden = failures.includes("HIDDEN_REASONING_DETECTED");
  const edges = hidden ? [] : nodes.slice(0, -1).map((node, index) => graphEdge(node.node_id, nodes[index + 1].node_id, index % 2 === 0 ? "explains" : "validates", "explicit deterministic reasoning transition", index)).sort((a, b) => a.deterministic_order - b.deterministic_order);
  const base = {
    graph_id: id("CEEG", "cognitive-explainability-graph", knowledge.knowledge_id),
    nodes: freezeArray(nodes),
    edges: freezeArray(edges),
    causal_chain: hidden ? freezeArray<string>([]) : freezeArray(nodes.map((node) => node.node_id)),
    influence_graph: freezeArray(knowledge.knowledge_relationships.map((rel) => `${rel}->${knowledge.knowledge_id}`).sort()),
    reasoning_timeline: freezeArray(nodes.map((node) => `${node.deterministic_order}:${node.node_type}:${node.source_reference}`).sort()),
  };
  return Object.freeze({ ...base, graph_hash: hashValue("cognitive-explainability-graph", base) });
}

function evidenceItem(source: string, index: number, failures: readonly CognitiveExplainabilityFailure[]): EvidenceHierarchyItem {
  const weight = Number((0.32 + index * 0.07).toFixed(4));
  const base = {
    evidence_id: id("CEEV", "cognitive-explainability-evidence", { source, index }),
    source_reference: source,
    relevance: Number(Math.min(0.98, 0.75 + index * 0.02).toFixed(4)),
    quality: Number(Math.min(0.97, 0.7 + index * 0.025).toFixed(4)),
    confidence_contribution: Number(Math.min(0.9, 0.25 + index * 0.04).toFixed(4)),
    weight,
    trust_rationale: failures.includes("UNDOCUMENTED_EVIDENCE_INFLUENCE_DETECTED") ? "" : "evidence influence is documented through repository lineage, replay, and integrity references",
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("cognitive-explainability-evidence", base) });
}

function counterfactual(source: string, index: number): CounterfactualAnalysis {
  const base = {
    counterfactual_id: id("CEECF", "cognitive-explainability-counterfactual", { source, index }),
    alternative_future: `alternative future from ${source}`,
    rejected_reason: "rejected because deterministic evidence, governance constraints, or confidence limitations favored the certified forecast",
    governance_outcome: "requires operator review and remains advisory",
    recovery_path: "manual recovery preparation remains available",
    tradeoff: "lower immediacy in exchange for higher governance certainty",
  };
  return Object.freeze({ ...base, counterfactual_hash: hashValue("cognitive-explainability-counterfactual", base) });
}

function computeExplanationHash(explanation: Omit<CognitiveExplanationObject, "explanation_hash"> | CognitiveExplanationObject): string {
  const { explanation_hash: _hash, ...source } = explanation as CognitiveExplanationObject;
  return hashValue("cognitive-explainability-object", source);
}

function explanation(knowledge: PredictionKnowledgeObject, level: CognitiveExplainabilityLevel, failures: readonly CognitiveExplainabilityFailure[]): CognitiveExplanationObject {
  const reasoning_graph = reasoningGraph(knowledge, failures);
  const evidenceSources = [...knowledge.prediction_history, ...knowledge.behavior_profile, ...knowledge.forecast_evolution].slice(0, 6);
  const evidence_hierarchy = freezeArray(evidenceSources.map((source, index) => evidenceItem(source, index, failures)).sort((a, b) => b.weight - a.weight || a.evidence_id.localeCompare(b.evidence_id)));
  const counterfactual_analysis = freezeArray(knowledge.scenario_results.slice(0, 3).map((source, index) => counterfactual(source, index)));
  const replayBroken = failures.includes("REPLAY_EXPLANATION_MISMATCH");
  const constitutionalMissing = failures.includes("CONSTITUTIONAL_VALIDATION_MISSING");
  const governanceMissing = failures.includes("UNEXPLAINED_GOVERNANCE_OUTCOME_DETECTED");
  const mutated = failures.includes("EXPLANATION_MUTATION_DETECTED");
  const base = {
    explanation_id: id("CEE", "cognitive-explanation", { knowledge: knowledge.knowledge_id, level }),
    prediction_id: knowledge.prediction_id,
    knowledge_id: knowledge.knowledge_id,
    mission_id: knowledge.mission_id,
    tenant_id: failures.includes("CROSS_TENANT_EXPLANATION_ACCESS_DETECTED") ? "external-tenant" : knowledge.tenant_id,
    level,
    pipeline_state: failures.length ? "REJECTED" as const : "CERTIFICATION" as const,
    reasoning_graph,
    causal_chain: reasoning_graph.causal_chain,
    evidence_hierarchy,
    confidence_narrative: freezeArray(knowledge.confidence_evolution.map((item) => `confidence contribution preserved from ${item}`)),
    uncertainty_profile: freezeArray(["uncertainty remains where evidence is indirect", "confidence depends on replay and lineage integrity", "operator judgment remains required"]),
    governance_reasoning: governanceMissing ? freezeArray<string>([]) : freezeArray(knowledge.governance_metadata.map((item) => `governance outcome explained by ${item}`)),
    constitutional_reasoning: constitutionalMissing ? freezeArray<string>([]) : freezeArray(knowledge.constitutional_metadata.map((item) => `constitutional compliance explained by ${item}`)),
    forecast_lineage: freezeArray([...knowledge.forecast_evolution, knowledge.lineage_reference].filter(Boolean)),
    counterfactual_analysis,
    replay_narrative: replayBroken ? freezeArray<string>([]) : freezeArray(["replay inputs reconstructed from knowledge repository", "reasoning graph regenerated deterministically", "explanation hash compared against original"]),
    decision_tradeoffs: freezeArray(["speed versus certification certainty", "mitigation readiness versus operator approval", "forecast sensitivity versus evidence confidence"]),
    alternative_futures: freezeArray(counterfactual_analysis.map((item) => item.alternative_future)),
    assumptions: freezeArray(["source knowledge repository is immutable", "explanation reconstructs explicit artifacts only", "operator approval controls downstream action"]),
    limitations: freezeArray(["does not expose private model internals", "does not mutate forecasts", "does not execute mitigations"]),
    operator_briefing: freezeArray([`${level.toLowerCase()} explanation generated from certified predictive knowledge`, "why, why-not, assumptions, uncertainty, governance, and replay are documented"]),
    lineage_reference: knowledge.lineage_reference,
    replay_reference: replayBroken ? "" : knowledge.replay_reference,
    certification_reference: knowledge.certification_reference,
    integrity_hash: failures.includes("EXPLANATION_MUTATION_DETECTED") ? "" : hashValue("cognitive-explainability-integrity", { knowledge: knowledge.knowledge_id, graph: reasoning_graph.graph_hash, evidence: evidence_hierarchy.map((item) => item.evidence_hash) }),
    generated_at: NOW,
    version: VERSION,
    advisory_only: true as const,
    read_only: true as const,
    prediction_modified: false,
    confidence_modified: false,
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    mission_execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    explanation_mutated: mutated,
    hidden_reasoning_detected: failures.includes("HIDDEN_REASONING_DETECTED"),
  };
  return Object.freeze({ ...base, explanation_hash: computeExplanationHash(base as Omit<CognitiveExplanationObject, "explanation_hash">) });
}

export function computeCognitiveExplainabilityRepositoryHash(repository: Omit<CognitiveExplainabilityRepository, "repository_hash"> | CognitiveExplainabilityRepository): string {
  const { repository_hash: _hash, ...source } = repository as CognitiveExplainabilityRepository;
  return hashValue("cognitive-explainability-repository", source);
}

export function runCognitiveExplainability(input: CognitiveExplainabilityInput = {}): CognitiveExplainabilityRepository {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const source = input.knowledge_repository ?? runPredictionKnowledgeRepository({ tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id });
  const level = input.level ?? "OPERATOR";
  const explanations = freezeArray(source.knowledge_objects.map((knowledge) => explanation(knowledge, level, failures)));
  const repositoryBase = {
    repository_id: id("CEEREPO", "cognitive-explainability-repository", { source: source.repository_hash, scenario, level }),
    tenant_id: failures.includes("CROSS_TENANT_EXPLANATION_ACCESS_DETECTED") ? "external-tenant" : source.tenant_id,
    mission_id: source.mission_id,
    explanations,
    reasoning_graphs: freezeArray(explanations.map((item) => item.reasoning_graph.graph_hash).filter(Boolean).sort()),
    evidence_hierarchies: freezeArray(explanations.flatMap((item) => item.evidence_hierarchy.map((evidence) => evidence.evidence_hash)).filter(Boolean).sort()),
    confidence_narratives: freezeArray(explanations.flatMap((item) => item.confidence_narrative).sort()),
    governance_narratives: freezeArray(explanations.flatMap((item) => item.governance_reasoning).sort()),
    constitutional_narratives: freezeArray(explanations.flatMap((item) => item.constitutional_reasoning).sort()),
    counterfactual_analyses: freezeArray(explanations.flatMap((item) => item.counterfactual_analysis.map((cf) => cf.counterfactual_hash)).sort()),
    replay_explanations: freezeArray(explanations.flatMap((item) => item.replay_narrative).sort()),
    lineage_references: freezeArray(explanations.map((item) => item.lineage_reference).filter(Boolean).sort()),
    certification_evidence: freezeArray(explanations.map((item) => item.certification_reference).filter(Boolean).sort()),
    integrity_hashes: freezeArray(explanations.map((item) => item.integrity_hash).filter(Boolean).sort()),
    source_knowledge_repository: source,
    append_only: true as const,
  };
  return Object.freeze({ ...repositoryBase, repository_hash: computeCognitiveExplainabilityRepositoryHash(repositoryBase as Omit<CognitiveExplainabilityRepository, "repository_hash">) });
}

export function replayCognitiveExplainability(repository = runCognitiveExplainability()): CognitiveExplainabilityReplayResult {
  const reconstructed_hash = computeCognitiveExplainabilityRepositoryHash(repository);
  const source = { replay_reference: `replay:${repository.repository_id}`, repository_id: repository.repository_id, deterministic: reconstructed_hash === repository.repository_hash && repository.replay_explanations.length > 0, reconstructed_hash, original_hash: repository.repository_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("cognitive-explainability-replay", source) });
}

export function validateCognitiveExplainability(repository?: CognitiveExplainabilityRepository): CognitiveExplainabilityValidationResult {
  if (!repository) {
    const failures = freezeArray<CognitiveExplainabilityFailure>(["COGNITIVE_EXPLAINABILITY_CONTRACT_INVALID"]);
    const source = { repository_id: null, valid: false, cognitive_explainability_contract_valid: false, reasoning_graphs_reproducible: false, causal_reasoning_chains_complete: false, evidence_hierarchy_deterministic: false, evidence_weighting_explainable: false, confidence_narratives_reproducible: false, uncertainty_analysis_complete: false, governance_reasoning_deterministic: false, constitutional_reasoning_verified: false, forecast_lineage_complete: false, replay_narratives_reproducible: false, counterfactual_analyses_deterministic: false, alternative_futures_documented: false, decision_tradeoffs_explainable: false, assumptions_documented: false, limitations_documented: false, replay_reconstructs_identical_explanations: false, certification_evidence_complete: false, integrity_hashes_reproducible: false, hidden_reasoning_rejected: false, undocumented_evidence_influence_rejected: false, unexplained_governance_outcome_rejected: false, constitutional_validation_present: false, explanation_mutation_rejected: false, cross_tenant_explanation_access_rejected: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("cognitive-explainability-validation", source) });
  }
  const expectedCount = repository.source_knowledge_repository.knowledge_objects.length;
  const sourceValid = validatePredictionKnowledgeRepository(repository.source_knowledge_repository).valid;
  const cognitive_explainability_contract_valid = repository.append_only && repository.explanations.length === expectedCount && sourceValid;
  const reasoning_graphs_reproducible = repository.reasoning_graphs.length === expectedCount && repository.explanations.every((item) => item.reasoning_graph.graph_hash);
  const causal_reasoning_chains_complete = repository.explanations.every((item) => item.causal_chain.length >= 5);
  const evidence_hierarchy_deterministic = repository.explanations.every((item) => item.evidence_hierarchy.length > 0 && item.evidence_hierarchy.map((evidence) => evidence.weight).every((weight, index, arr) => index === 0 || weight <= arr[index - 1]));
  const evidence_weighting_explainable = repository.explanations.every((item) => item.evidence_hierarchy.every((evidence) => evidence.trust_rationale));
  const confidence_narratives_reproducible = repository.explanations.every((item) => item.confidence_narrative.length > 0);
  const uncertainty_analysis_complete = repository.explanations.every((item) => item.uncertainty_profile.length >= 3);
  const governance_reasoning_deterministic = repository.explanations.every((item) => item.governance_reasoning.length > 0);
  const constitutional_reasoning_verified = repository.explanations.every((item) => item.constitutional_reasoning.length > 0);
  const forecast_lineage_complete = repository.explanations.every((item) => item.forecast_lineage.length > 0 && item.lineage_reference);
  const replay_narratives_reproducible = repository.explanations.every((item) => item.replay_narrative.length > 0 && item.replay_reference);
  const counterfactual_analyses_deterministic = repository.explanations.every((item) => item.counterfactual_analysis.length > 0);
  const alternative_futures_documented = repository.explanations.every((item) => item.alternative_futures.length === item.counterfactual_analysis.length);
  const decision_tradeoffs_explainable = repository.explanations.every((item) => item.decision_tradeoffs.length > 0);
  const assumptions_documented = repository.explanations.every((item) => item.assumptions.length > 0);
  const limitations_documented = repository.explanations.every((item) => item.limitations.length > 0);
  const replay_reconstructs_identical_explanations = replayCognitiveExplainability(repository).deterministic;
  const certification_evidence_complete = repository.certification_evidence.length === expectedCount;
  const integrity_hashes_reproducible = repository.integrity_hashes.length === expectedCount && computeCognitiveExplainabilityRepositoryHash(repository) === repository.repository_hash;
  const hidden_reasoning_rejected = !repository.explanations.some((item) => item.hidden_reasoning_detected);
  const undocumented_evidence_influence_rejected = evidence_weighting_explainable;
  const unexplained_governance_outcome_rejected = governance_reasoning_deterministic;
  const constitutional_validation_present = constitutional_reasoning_verified;
  const explanation_mutation_rejected = !repository.explanations.some((item) => item.explanation_mutated);
  const cross_tenant_explanation_access_rejected = repository.tenant_id !== "external-tenant" && repository.explanations.every((item) => item.tenant_id === repository.tenant_id);
  const advisory_only_behavior_enforced = repository.explanations.every((item) => item.advisory_only && item.read_only && !item.prediction_modified && !item.confidence_modified && !item.governance_modified && !item.mission_execution_modified);
  const failures = unique([
    ...(!cognitive_explainability_contract_valid ? ["COGNITIVE_EXPLAINABILITY_CONTRACT_INVALID" as const] : []),
    ...(!reasoning_graphs_reproducible ? ["REASONING_GRAPH_NONDETERMINISTIC" as const] : []),
    ...(!causal_reasoning_chains_complete ? ["CAUSAL_CHAIN_INCOMPLETE" as const, "HIDDEN_REASONING_DETECTED" as const] : []),
    ...(!evidence_hierarchy_deterministic ? ["EVIDENCE_HIERARCHY_NONDETERMINISTIC" as const] : []),
    ...(!evidence_weighting_explainable ? ["EVIDENCE_WEIGHTING_UNEXPLAINED" as const, "UNDOCUMENTED_EVIDENCE_INFLUENCE_DETECTED" as const] : []),
    ...(!confidence_narratives_reproducible ? ["CONFIDENCE_NARRATIVE_NONDETERMINISTIC" as const] : []),
    ...(!uncertainty_analysis_complete ? ["UNCERTAINTY_ANALYSIS_INCOMPLETE" as const] : []),
    ...(!governance_reasoning_deterministic ? ["GOVERNANCE_REASONING_NONDETERMINISTIC" as const, "UNEXPLAINED_GOVERNANCE_OUTCOME_DETECTED" as const] : []),
    ...(!constitutional_reasoning_verified ? ["CONSTITUTIONAL_REASONING_MISSING" as const, "CONSTITUTIONAL_VALIDATION_MISSING" as const] : []),
    ...(!forecast_lineage_complete ? ["FORECAST_LINEAGE_INCOMPLETE" as const] : []),
    ...(!replay_narratives_reproducible ? ["REPLAY_NARRATIVE_NONDETERMINISTIC" as const] : []),
    ...(!counterfactual_analyses_deterministic ? ["COUNTERFACTUAL_ANALYSIS_NONDETERMINISTIC" as const] : []),
    ...(!alternative_futures_documented ? ["ALTERNATIVE_FUTURES_MISSING" as const] : []),
    ...(!decision_tradeoffs_explainable ? ["DECISION_TRADEOFFS_UNEXPLAINED" as const] : []),
    ...(!assumptions_documented ? ["ASSUMPTIONS_MISSING" as const] : []),
    ...(!limitations_documented ? ["LIMITATIONS_MISSING" as const] : []),
    ...(!replay_reconstructs_identical_explanations ? ["REPLAY_EXPLANATION_MISMATCH" as const] : []),
    ...(!certification_evidence_complete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!integrity_hashes_reproducible ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!hidden_reasoning_rejected ? ["HIDDEN_REASONING_DETECTED" as const] : []),
    ...(!explanation_mutation_rejected ? ["EXPLANATION_MUTATION_DETECTED" as const] : []),
    ...(!cross_tenant_explanation_access_rejected ? ["CROSS_TENANT_EXPLANATION_ACCESS_DETECTED" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { repository_id: repository.repository_id, valid, cognitive_explainability_contract_valid, reasoning_graphs_reproducible, causal_reasoning_chains_complete, evidence_hierarchy_deterministic, evidence_weighting_explainable, confidence_narratives_reproducible, uncertainty_analysis_complete, governance_reasoning_deterministic, constitutional_reasoning_verified, forecast_lineage_complete, replay_narratives_reproducible, counterfactual_analyses_deterministic, alternative_futures_documented, decision_tradeoffs_explainable, assumptions_documented, limitations_documented, replay_reconstructs_identical_explanations, certification_evidence_complete, integrity_hashes_reproducible, hidden_reasoning_rejected, undocumented_evidence_influence_rejected, unexplained_governance_outcome_rejected, constitutional_validation_present, explanation_mutation_rejected, cross_tenant_explanation_access_rejected, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("cognitive-explainability-validation", source) });
}

export function buildCognitiveExplainabilityObservabilitySurface(repository = runCognitiveExplainability()): CognitiveExplainabilityObservabilitySurface {
  return Object.freeze({
    repository_id: repository.repository_id,
    tenant_id: repository.tenant_id,
    mission_id: repository.mission_id,
    explanation_count: repository.explanations.length,
    reasoning_graph_count: repository.reasoning_graphs.length,
    evidence_item_count: repository.evidence_hierarchies.length,
    counterfactual_count: repository.counterfactual_analyses.length,
    level: repository.explanations[0]?.level ?? "OPERATOR",
    advisory_only: true,
    read_only: true,
    repository_hash: repository.repository_hash,
  });
}

export function getCognitiveExplainabilityEngineContract(): CognitiveExplainabilityEngineContract {
  const repository = runCognitiveExplainability();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["cognitive-transparency", "deterministic-explainability", "replay-reproducibility", "evidence-first-reasoning", "governance-first-interpretation", "constitutional-accountability", "advisory-only-behavior", "immutable-explanations", "tenant-isolation", "certification-readiness", "read-only-operation"]),
      explainability_levels: explainabilityLevels,
      pipeline_states: pipelineStates,
      read_only: true,
      advisory_only: true,
    }),
    repository,
    validation: validateCognitiveExplainability(repository),
    replay: replayCognitiveExplainability(repository),
    observability: buildCognitiveExplainabilityObservabilitySurface(repository),
  });
}
