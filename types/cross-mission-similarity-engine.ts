import type { MemoryPermission } from "@/types/adaptive-memory-foundation";
import type { PatternMemoryRecord, PatternMemoryRegistryResult } from "@/types/pattern-memory-registry";

export type CrossMissionSimilarityStatus = "AUTHORITATIVE" | "REJECTED";

export type MissionComparisonDimension =
  | "OBJECTIVE"
  | "EVIDENCE"
  | "RISK"
  | "CONFIDENCE"
  | "GOVERNANCE"
  | "OUTCOME"
  | "SIMULATION"
  | "STRATEGY"
  | "OPERATOR"
  | "CERTIFICATION";

export type ContextMatchingDimension =
  | "OPERATIONAL_ENVIRONMENT"
  | "ORGANIZATIONAL_STRUCTURE"
  | "MISSION_PHASE"
  | "DEPENDENCY_GRAPH"
  | "REGULATORY_ENVIRONMENT"
  | "MISSION_CONSTRAINTS"
  | "AVAILABLE_RESOURCES"
  | "EXECUTION_CONDITIONS";

export type SimilarityLedgerEvent =
  | "SIMILARITY_REQUEST"
  | "CANDIDATE_DISCOVERY"
  | "FEATURE_EXTRACTION"
  | "COMPARISON_EXECUTION"
  | "SCORING_CALCULATION"
  | "RANKING_DECISION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "RETRIEVAL_EVENT"
  | "AUTHORIZATION_DECISION"
  | "INTEGRITY_VERIFICATION"
  | "SIMILARITY_FAILURE";

export type CrossMissionSimilarityFailure =
  | "REGISTRY_UNAVAILABLE"
  | "NONDETERMINISTIC_SIMILARITY_SCORE"
  | "NONDETERMINISTIC_COMPARISON_RESULT"
  | "UNAUTHORIZED_MISSION_COMPARABLE"
  | "TENANT_ISOLATION_VIOLATED"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "RANKING_CHANGED_WITHOUT_EVIDENCE"
  | "INCONSISTENT_EXPLANATION"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "UNAUTHORIZED_KNOWLEDGE_SHARING"
  | "CROSS_TENANT_COMPARISON_NOT_APPROVED";

export type CrossMissionSimilarityScenario =
  | "BASELINE"
  | "REGISTRY_UNAVAILABLE"
  | "NONDETERMINISTIC_SCORE"
  | "NONDETERMINISTIC_COMPARISON"
  | "UNAUTHORIZED_MISSION"
  | "TENANT_BREACH"
  | "GOVERNANCE_BYPASS"
  | "MISSING_REPLAY"
  | "INCOMPLETE_EVIDENCE"
  | "RANKING_DRIFT"
  | "INCONSISTENT_EXPLANATION"
  | "INTEGRITY_FAILURE"
  | "UNAUTHORIZED_SHARING"
  | "CROSS_TENANT_ATTEMPT";

export type MissionCandidateEligibility = Readonly<{
  tenant_authorization: boolean;
  mission_scope_allows_comparison: boolean;
  governance_permits_reuse: boolean;
  evidence_lineage_complete: boolean;
  replay_references_available: boolean;
  certification_valid: boolean;
  integrity_verified: boolean;
  cross_tenant_blocked_by_default: boolean;
  eligible: boolean;
  integrity_hash: string;
}>;

export type MissionSimilarityExplanation = Readonly<{
  matched_objectives: readonly string[];
  matched_evidence: readonly string[];
  matched_risks: readonly string[];
  matched_governance_decisions: readonly string[];
  matched_simulations: readonly string[];
  supporting_patterns: readonly string[];
  strongest_contributing_factors: readonly MissionComparisonDimension[];
  weakest_contributing_factors: readonly MissionComparisonDimension[];
  similarity_confidence: number;
  replay_refs: readonly string[];
  explanation_complete: boolean;
  integrity_hash: string;
}>;

export type MissionSimilarityRecord = Readonly<{
  similarity_id: string;
  source_mission_id: string;
  candidate_mission_id: string;
  tenant_id: string;
  comparison_scope: "TENANT_SCOPED" | "CROSS_TENANT_BLOCKED";
  objective_similarity: number;
  evidence_similarity: number;
  risk_similarity: number;
  confidence_similarity: number;
  governance_similarity: number;
  outcome_similarity: number;
  simulation_similarity: number;
  strategy_similarity: number;
  operator_similarity: number;
  certification_similarity: number;
  overall_similarity_score: number;
  rank: number;
  supporting_pattern_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  retrieval_permissions: readonly MemoryPermission[];
  explanation: MissionSimilarityExplanation;
  encrypted_comparison_hash: string;
  integrity_hash: string;
}>;

export type SimilarityLedgerEntry = Readonly<{
  ledger_id: string;
  similarity_id: string;
  tenant_id: string;
  event: SimilarityLedgerEvent;
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type CrossMissionSimilarityContract = Readonly<{
  contract_id: "cross-mission-similarity-engine-contract";
  version: "cross-mission-similarity-engine/v1";
  architecture: readonly string[];
  comparison_dimensions: readonly MissionComparisonDimension[];
  context_dimensions: readonly ContextMatchingDimension[];
  ranking_rules: readonly string[];
  cross_mission_intelligence_rules: readonly string[];
  cross_tenant_rules: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  advisory_only: true;
  autonomous_learning_supported: false;
  decision_authority_supported: false;
  recommendation_mutation_supported: false;
  cross_tenant_blocked_by_default: true;
  integrity_hash: string;
}>;

export type CrossMissionSimilarityMetrics = Readonly<{
  similarity_requests: number;
  comparison_throughput: number;
  retrieval_latency_ms: number;
  candidate_count: number;
  similarity_score_distribution: readonly number[];
  replay_success_rate: number;
  governance_denials: number;
  authorization_failures: number;
  blocked_cross_tenant_comparisons: number;
  explanation_completeness: number;
  failures: readonly CrossMissionSimilarityFailure[];
  integrity_hash: string;
}>;

export type CrossMissionSimilarityApiSurface = Readonly<{
  api_id: string;
  establish_engine: "POST /cross-mission-similarity-engine/establish";
  retrieve_contract: "GET /cross-mission-similarity-engine/contract";
  retrieve_records: "POST /cross-mission-similarity-engine/records";
  retrieve_candidates: "POST /cross-mission-similarity-engine/candidates";
  retrieve_scoring: "POST /cross-mission-similarity-engine/scoring";
  retrieve_explanations: "POST /cross-mission-similarity-engine/explanations";
  retrieve_ledger: "POST /cross-mission-similarity-engine/ledger";
  retrieve_metrics: "POST /cross-mission-similarity-engine/metrics";
  replay_engine: "POST /cross-mission-similarity-engine/replay";
  inspect_engine: "POST /cross-mission-similarity-engine/inspect";
  autonomous_learning_supported: false;
  decision_authority_supported: false;
  recommendation_mutation_supported: false;
  cross_tenant_default_supported: false;
  integrity_hash: string;
}>;

export type CrossMissionSimilarityInput = Readonly<{
  scenario?: CrossMissionSimilarityScenario;
  registry_result?: PatternMemoryRegistryResult;
}>;

export type CrossMissionSimilarityResult = Readonly<{
  cross_mission_similarity_version: "cross-mission-similarity-engine/v1";
  engine_identifier: "CrossMissionSimilarityEngine";
  status: CrossMissionSimilarityStatus;
  api_surface: CrossMissionSimilarityApiSurface;
  registry_result: PatternMemoryRegistryResult;
  contract: CrossMissionSimilarityContract;
  source_patterns: readonly PatternMemoryRecord[];
  candidate_eligibility: MissionCandidateEligibility;
  similarity_records: readonly MissionSimilarityRecord[];
  similarity_ledger: readonly SimilarityLedgerEntry[];
  metrics: CrossMissionSimilarityMetrics;
  failures: readonly CrossMissionSimilarityFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governed: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  autonomous_learning_supported: false;
  decision_authority_supported: false;
  recommendation_mutation_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CrossMissionSimilarityEngine = Readonly<{
  cross_mission_similarity_version: "cross-mission-similarity-engine/v1";
  supported_comparison_dimensions: readonly MissionComparisonDimension[];
  supported_context_dimensions: readonly ContextMatchingDimension[];
  api_surface: CrossMissionSimilarityApiSurface;
  result: CrossMissionSimilarityResult;
}>;
