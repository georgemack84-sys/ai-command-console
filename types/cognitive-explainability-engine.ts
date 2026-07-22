import type { PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";

export type CognitiveExplainabilityLevel = "EXECUTIVE" | "OPERATOR" | "ANALYST" | "FORENSIC" | "CERTIFICATION" | "DEVELOPER";
export type CognitiveExplainabilityPipelineState = "EXPLANATION_REQUESTED" | "KNOWLEDGE_RETRIEVAL" | "EVIDENCE_RECONSTRUCTION" | "REASONING_RECONSTRUCTION" | "ALTERNATIVE_ANALYSIS" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "REPLAY_VALIDATION" | "COGNITIVE_EXPLANATION" | "CERTIFICATION" | "REJECTED";

export type CognitiveExplainabilityScenario =
  | "BASELINE"
  | "HIDDEN_REASONING"
  | "UNDOCUMENTED_EVIDENCE_INFLUENCE"
  | "UNEXPLAINED_GOVERNANCE_OUTCOME"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "REPLAY_EXPLANATION_MISMATCH"
  | "EXPLANATION_MUTATION"
  | "CROSS_TENANT_ACCESS"
  | "ADVISORY_ONLY_VIOLATION";

export type CognitiveExplainabilityFailure =
  | "COGNITIVE_EXPLAINABILITY_CONTRACT_INVALID"
  | "REASONING_GRAPH_NONDETERMINISTIC"
  | "CAUSAL_CHAIN_INCOMPLETE"
  | "EVIDENCE_HIERARCHY_NONDETERMINISTIC"
  | "EVIDENCE_WEIGHTING_UNEXPLAINED"
  | "CONFIDENCE_NARRATIVE_NONDETERMINISTIC"
  | "UNCERTAINTY_ANALYSIS_INCOMPLETE"
  | "GOVERNANCE_REASONING_NONDETERMINISTIC"
  | "CONSTITUTIONAL_REASONING_MISSING"
  | "FORECAST_LINEAGE_INCOMPLETE"
  | "REPLAY_NARRATIVE_NONDETERMINISTIC"
  | "COUNTERFACTUAL_ANALYSIS_NONDETERMINISTIC"
  | "ALTERNATIVE_FUTURES_MISSING"
  | "DECISION_TRADEOFFS_UNEXPLAINED"
  | "ASSUMPTIONS_MISSING"
  | "LIMITATIONS_MISSING"
  | "REPLAY_EXPLANATION_MISMATCH"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "INTEGRITY_HASH_INVALID"
  | "HIDDEN_REASONING_DETECTED"
  | "UNDOCUMENTED_EVIDENCE_INFLUENCE_DETECTED"
  | "UNEXPLAINED_GOVERNANCE_OUTCOME_DETECTED"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "EXPLANATION_MUTATION_DETECTED"
  | "CROSS_TENANT_EXPLANATION_ACCESS_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type ReasoningGraphNode = Readonly<{
  node_id: string;
  node_type: "OBSERVATION" | "EVIDENCE" | "MODEL" | "FORECAST" | "CONFIDENCE" | "GOVERNANCE" | "CONSTITUTIONAL" | "COUNTERFACTUAL" | "REPLAY" | "CERTIFICATION";
  label: string;
  source_reference: string;
  deterministic_order: number;
  node_hash: string;
}>;

export type ReasoningGraphEdge = Readonly<{
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  relation: "supports" | "constrains" | "explains" | "validates" | "rejects" | "replays" | "certifies";
  rationale: string;
  deterministic_order: number;
  edge_hash: string;
}>;

export type ReasoningGraph = Readonly<{
  graph_id: string;
  nodes: readonly ReasoningGraphNode[];
  edges: readonly ReasoningGraphEdge[];
  causal_chain: readonly string[];
  influence_graph: readonly string[];
  reasoning_timeline: readonly string[];
  graph_hash: string;
}>;

export type EvidenceHierarchyItem = Readonly<{
  evidence_id: string;
  source_reference: string;
  relevance: number;
  quality: number;
  confidence_contribution: number;
  weight: number;
  trust_rationale: string;
  evidence_hash: string;
}>;

export type CounterfactualAnalysis = Readonly<{
  counterfactual_id: string;
  alternative_future: string;
  rejected_reason: string;
  governance_outcome: string;
  recovery_path: string;
  tradeoff: string;
  counterfactual_hash: string;
}>;

export type CognitiveExplanationObject = Readonly<{
  explanation_id: string;
  prediction_id: string;
  knowledge_id: string;
  mission_id: string;
  tenant_id: string;
  level: CognitiveExplainabilityLevel;
  pipeline_state: CognitiveExplainabilityPipelineState;
  reasoning_graph: ReasoningGraph;
  causal_chain: readonly string[];
  evidence_hierarchy: readonly EvidenceHierarchyItem[];
  confidence_narrative: readonly string[];
  uncertainty_profile: readonly string[];
  governance_reasoning: readonly string[];
  constitutional_reasoning: readonly string[];
  forecast_lineage: readonly string[];
  counterfactual_analysis: readonly CounterfactualAnalysis[];
  replay_narrative: readonly string[];
  decision_tradeoffs: readonly string[];
  alternative_futures: readonly string[];
  assumptions: readonly string[];
  limitations: readonly string[];
  operator_briefing: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  certification_reference: string;
  integrity_hash: string;
  generated_at: string;
  version: "cognitive-explainability-engine/v8ALT.3.6";
  advisory_only: true;
  read_only: true;
  prediction_modified: boolean;
  confidence_modified: boolean;
  governance_modified: boolean;
  mission_execution_modified: boolean;
  explanation_mutated: boolean;
  hidden_reasoning_detected: boolean;
  explanation_hash: string;
}>;

export type CognitiveExplainabilityRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  explanations: readonly CognitiveExplanationObject[];
  reasoning_graphs: readonly string[];
  evidence_hierarchies: readonly string[];
  confidence_narratives: readonly string[];
  governance_narratives: readonly string[];
  constitutional_narratives: readonly string[];
  counterfactual_analyses: readonly string[];
  replay_explanations: readonly string[];
  lineage_references: readonly string[];
  certification_evidence: readonly string[];
  integrity_hashes: readonly string[];
  source_knowledge_repository: PredictionKnowledgeRepository;
  append_only: true;
  repository_hash: string;
}>;

export type CognitiveExplainabilityInput = Readonly<{
  scenario?: CognitiveExplainabilityScenario;
  level?: CognitiveExplainabilityLevel;
  tenant_id?: string;
  mission_id?: string;
  knowledge_repository?: PredictionKnowledgeRepository;
}>;

export type CognitiveExplainabilityReplayResult = Readonly<{
  replay_reference: string;
  repository_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type CognitiveExplainabilityValidationResult = Readonly<{
  repository_id: string | null;
  valid: boolean;
  cognitive_explainability_contract_valid: boolean;
  reasoning_graphs_reproducible: boolean;
  causal_reasoning_chains_complete: boolean;
  evidence_hierarchy_deterministic: boolean;
  evidence_weighting_explainable: boolean;
  confidence_narratives_reproducible: boolean;
  uncertainty_analysis_complete: boolean;
  governance_reasoning_deterministic: boolean;
  constitutional_reasoning_verified: boolean;
  forecast_lineage_complete: boolean;
  replay_narratives_reproducible: boolean;
  counterfactual_analyses_deterministic: boolean;
  alternative_futures_documented: boolean;
  decision_tradeoffs_explainable: boolean;
  assumptions_documented: boolean;
  limitations_documented: boolean;
  replay_reconstructs_identical_explanations: boolean;
  certification_evidence_complete: boolean;
  integrity_hashes_reproducible: boolean;
  hidden_reasoning_rejected: boolean;
  undocumented_evidence_influence_rejected: boolean;
  unexplained_governance_outcome_rejected: boolean;
  constitutional_validation_present: boolean;
  explanation_mutation_rejected: boolean;
  cross_tenant_explanation_access_rejected: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly CognitiveExplainabilityFailure[];
  validation_hash: string;
}>;

export type CognitiveExplainabilityObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  explanation_count: number;
  reasoning_graph_count: number;
  evidence_item_count: number;
  counterfactual_count: number;
  level: CognitiveExplainabilityLevel;
  advisory_only: true;
  read_only: true;
  repository_hash: string;
}>;

export type CognitiveExplainabilityEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "cognitive-explainability-engine/v8ALT.3.6";
    principles: readonly string[];
    explainability_levels: readonly CognitiveExplainabilityLevel[];
    pipeline_states: readonly CognitiveExplainabilityPipelineState[];
    read_only: true;
    advisory_only: true;
  }>;
  repository: CognitiveExplainabilityRepository;
  validation: CognitiveExplainabilityValidationResult;
  replay: CognitiveExplainabilityReplayResult;
  observability: CognitiveExplainabilityObservabilitySurface;
}>;
