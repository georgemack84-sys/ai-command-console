import type { HistoricalIntelligenceReport } from "@/types/historical-intelligence-engine";
import type { PredictionObject } from "@/types/prediction-contract";
import type { PreventativeRecommendationReport } from "@/types/preventative-recommendation-engine";
import type { RiskForecastingReport } from "@/types/risk-forecasting-engine";

export type PredictionKnowledgeType =
  | "PREDICTION_HISTORY"
  | "PREDICTION_MODEL"
  | "HISTORICAL_ACCURACY"
  | "BEHAVIORAL_INTELLIGENCE"
  | "SCENARIO_INTELLIGENCE"
  | "MITIGATION_KNOWLEDGE"
  | "OPERATOR_INTELLIGENCE"
  | "FORECAST_EVOLUTION"
  | "CONFIDENCE_INTELLIGENCE"
  | "CERTIFICATION_KNOWLEDGE";

export type PredictionKnowledgeState = "REGISTERED" | "VALIDATED" | "CLASSIFIED" | "LINKED" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type PredictionKnowledgeRelationshipType = "derives_from" | "predicts" | "validates" | "supersedes" | "contradicts" | "reinforces" | "influences" | "mitigates" | "certifies" | "references";

export type PredictionKnowledgeScenario =
  | "BASELINE"
  | "UNAUTHORIZED_MODIFICATION"
  | "KNOWLEDGE_DELETION"
  | "RELATIONSHIP_CORRUPTION"
  | "CROSS_TENANT_ACCESS"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "LINEAGE_BROKEN"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTONOMOUS_LEARNING_ATTEMPT";

export type PredictionKnowledgeFailure =
  | "KNOWLEDGE_REPOSITORY_CONTRACT_INVALID"
  | "PREDICTION_HISTORY_INCOMPLETE"
  | "MODEL_VERSIONING_INVALID"
  | "HISTORICAL_ACCURACY_NOT_REPRODUCIBLE"
  | "BEHAVIOR_PROFILES_MISSING"
  | "SCENARIO_RESULTS_NOT_REPRODUCIBLE"
  | "MITIGATION_RESULTS_MISSING"
  | "OPERATOR_DECISIONS_NOT_TRACEABLE"
  | "FORECAST_EVOLUTION_NONDETERMINISTIC"
  | "CONFIDENCE_EVOLUTION_NOT_REPRODUCIBLE"
  | "KNOWLEDGE_GRAPH_INCOMPLETE"
  | "KNOWLEDGE_RELATIONSHIPS_NONDETERMINISTIC"
  | "REPLAY_ARTIFACTS_MISSING"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "LINEAGE_REFERENCES_MUTABLE"
  | "GOVERNANCE_METADATA_MISSING"
  | "CONSTITUTIONAL_METADATA_MISSING"
  | "INTEGRITY_HASH_INVALID"
  | "KNOWLEDGE_RETRIEVAL_NONDETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "UNAUTHORIZED_MODIFICATION_DETECTED"
  | "KNOWLEDGE_DELETION_DETECTED"
  | "RELATIONSHIP_CORRUPTION_DETECTED"
  | "CROSS_TENANT_ACCESS_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTONOMOUS_LEARNING_DETECTED";

export type KnowledgeRelationship = Readonly<{
  relationship_id: string;
  from_knowledge_id: string;
  to_knowledge_id: string;
  relationship_type: PredictionKnowledgeRelationshipType;
  evidence_reference: string;
  deterministic_order: number;
  relationship_hash: string;
}>;

export type PredictionKnowledgeObject = Readonly<{
  knowledge_id: string;
  knowledge_type: PredictionKnowledgeType;
  tenant_id: string;
  mission_id: string;
  prediction_id: string;
  knowledge_category: string;
  knowledge_version: string;
  knowledge_state: PredictionKnowledgeState;
  prediction_history: readonly string[];
  behavior_profile: readonly string[];
  forecast_evolution: readonly string[];
  confidence_evolution: readonly string[];
  scenario_results: readonly string[];
  mitigation_results: readonly string[];
  operator_decisions: readonly string[];
  historical_accuracy: readonly string[];
  model_reference: string;
  knowledge_relationships: readonly string[];
  governance_metadata: readonly string[];
  constitutional_metadata: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  certification_reference: string;
  explainability: readonly string[];
  integrity_hash: string;
  created_at: string;
  last_certified_at: string;
  advisory_only: true;
  autonomous_learning_performed: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  unauthorized_modified: boolean;
  deleted: boolean;
  object_hash: string;
}>;

export type PredictionKnowledgeGraph = Readonly<{
  graph_id: string;
  tenant_id: string;
  nodes: readonly string[];
  relationships: readonly KnowledgeRelationship[];
  influence_graph: readonly string[];
  dependency_graph: readonly string[];
  causal_graph: readonly string[];
  graph_hash: string;
}>;

export type PredictionKnowledgeRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  knowledge_objects: readonly PredictionKnowledgeObject[];
  knowledge_graph: PredictionKnowledgeGraph;
  retrieval_indexes: Readonly<Record<string, readonly string[]>>;
  certification_evidence: readonly string[];
  replay_artifacts: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  append_only: true;
  repository_hash: string;
}>;

export type PredictionKnowledgeInput = Readonly<{
  scenario?: PredictionKnowledgeScenario;
  tenant_id?: string;
  mission_id?: string;
  prediction?: PredictionObject;
  historical_report?: HistoricalIntelligenceReport;
  risk_report?: RiskForecastingReport;
  recommendation_report?: PreventativeRecommendationReport;
}>;

export type PredictionKnowledgeReplayResult = Readonly<{
  replay_reference: string;
  repository_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type PredictionKnowledgeValidationResult = Readonly<{
  repository_id: string | null;
  valid: boolean;
  knowledge_repository_contract_valid: boolean;
  prediction_history_preserved: boolean;
  prediction_models_versioned_deterministically: boolean;
  historical_accuracy_reproducible: boolean;
  behavior_profiles_preserved: boolean;
  scenario_results_reproducible: boolean;
  mitigation_results_preserved: boolean;
  operator_decisions_traceable: boolean;
  forecast_evolution_deterministic: boolean;
  confidence_evolution_reproducible: boolean;
  prediction_knowledge_graph_complete: boolean;
  knowledge_relationships_deterministic: boolean;
  replay_artifacts_preserved: boolean;
  certification_evidence_complete: boolean;
  lineage_references_immutable: boolean;
  governance_metadata_preserved: boolean;
  constitutional_metadata_preserved: boolean;
  integrity_hashes_reproducible: boolean;
  deterministic_knowledge_retrieval_verified: boolean;
  replay_reconstructs_identical_knowledge_state: boolean;
  unauthorized_knowledge_modification_rejected: boolean;
  knowledge_deletion_detected: boolean;
  knowledge_relationship_corruption_detected: boolean;
  cross_tenant_knowledge_access_rejected: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly PredictionKnowledgeFailure[];
  validation_hash: string;
}>;

export type PredictionKnowledgeObservabilitySurface = Readonly<{
  repository_id: string;
  tenant_id: string;
  mission_id: string;
  knowledge_object_count: number;
  relationship_count: number;
  active_objects: number;
  certified_objects: number;
  advisory_only: true;
  repository_hash: string;
}>;

export type PredictionKnowledgeRepositoryContract = Readonly<{
  doctrine: Readonly<{
    repository_version: "prediction-knowledge-repository/v8ALT.3.5";
    principles: readonly string[];
    knowledge_types: readonly PredictionKnowledgeType[];
    lifecycle_states: readonly PredictionKnowledgeState[];
    relationship_types: readonly PredictionKnowledgeRelationshipType[];
    autonomous_learning: false;
    advisory_only: true;
  }>;
  repository: PredictionKnowledgeRepository;
  validation: PredictionKnowledgeValidationResult;
  replay: PredictionKnowledgeReplayResult;
  observability: PredictionKnowledgeObservabilitySurface;
}>;
