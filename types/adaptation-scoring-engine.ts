import type { AdaptationProposalGeneratorResult } from "@/types/adaptation-proposal-generator";
import type { GeneratedAdaptationProposal } from "@/types/adaptation-proposal-generator";

export type AdaptationScoreDimension =
  | "BENEFIT"
  | "RISK"
  | "CONFIDENCE"
  | "EVIDENCE"
  | "OPERATOR"
  | "GOVERNANCE"
  | "REPLAY"
  | "CERTIFICATION_COMPLEXITY"
  | "ROLLBACK_READINESS"
  | "EXPLAINABILITY";

export type AdaptationScoringState = "SCORED" | "PENDING_EVIDENCE" | "FAILED";

export type AdaptationScoringFailure =
  | "PROPOSAL_CONTRACT_INVALID"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_ANALYSIS_ABSENT"
  | "CONSTITUTIONAL_ANALYSIS_ABSENT"
  | "AUTHORITY_ANALYSIS_ABSENT"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "SCORE_REPLAY_NOT_REPRODUCIBLE"
  | "NONDETERMINISTIC_SCORE_DETECTED"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "PROPOSAL_SUPPRESSION_ATTEMPT"
  | "PROPOSAL_PRIORITIZATION_ATTEMPT"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "PROPOSAL_IMPLEMENTATION_ATTEMPT";

export type AdaptationScoringScenario =
  | "BASELINE"
  | "HIGH_BENEFIT"
  | "HIGH_RISK"
  | "LOW_EVIDENCE"
  | "LOW_EXPLAINABILITY"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "GOVERNANCE_ABSENT"
  | "CONSTITUTIONAL_ABSENT"
  | "AUTHORITY_ABSENT"
  | "CONTRACT_INVALID"
  | "INTEGRITY_FAILURE"
  | "TENANT_VIOLATION"
  | "NONDETERMINISTIC_SCORE"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "SUPPRESSION_ATTEMPT"
  | "PRIORITIZATION_ATTEMPT"
  | "APPROVAL_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT";

export type ScoreExplanation = Readonly<{
  explanation_id: string;
  dimension: AdaptationScoreDimension | "OVERALL";
  contributing_factors: readonly string[];
  evidence_references: readonly string[];
  calculation_version: "adaptation-scoring-rules/v1";
  reasoning_summary: string;
  confidence_rationale: string;
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type ProposalDimensionScore = Readonly<{
  dimension: AdaptationScoreDimension;
  score: number;
  normalized_score: number;
  explanation: ScoreExplanation;
  integrity_hash: string;
}>;

export type ProposalScore = Readonly<{
  score_id: string;
  proposal_id: string;
  generated_proposal_id: string;
  overall_score: number;
  benefit_score: number;
  risk_score: number;
  confidence_score: number;
  governance_score: number;
  operator_score: number;
  evidence_score: number;
  replay_score: number;
  certification_complexity_score: number;
  rollback_readiness_score: number;
  explainability_score: number;
  simulation_score: number;
  dimension_scores: readonly ProposalDimensionScore[];
  overall_explanation: ScoreExplanation;
  scoring_version: "adaptation-scoring-engine/v1";
  calculation_version: "adaptation-scoring-rules/v1";
  proposal_integrity_hash: string;
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  advisory_only: true;
  approves_proposal: false;
  rejects_proposal: false;
  implements_proposal: false;
  suppresses_proposal: false;
  prioritizes_proposal: false;
  mutates_proposal: false;
  integrity_hash: string;
}>;

export type AdaptationScoringMetrics = Readonly<{
  proposals_scored: number;
  average_overall_score: number;
  average_benefit_score: number;
  average_risk_score: number;
  evidence_quality_distribution: readonly number[];
  governance_sensitivity_distribution: readonly number[];
  operator_usefulness_distribution: readonly number[];
  explainability_distribution: readonly number[];
  replay_completeness_rate: number;
  scoring_latency_ms: number;
  validation_failures: readonly AdaptationScoringFailure[];
  deterministic_replay_success_rate: number;
  integrity_hash: string;
}>;

export type AdaptationScoringApiSurface = Readonly<{
  api_id: string;
  score_proposals: "POST /adaptation-scoring-engine/score";
  retrieve_scores: "POST /adaptation-scoring-engine/scores";
  retrieve_dimensions: "POST /adaptation-scoring-engine/dimensions";
  retrieve_explanations: "POST /adaptation-scoring-engine/explanations";
  retrieve_metrics: "POST /adaptation-scoring-engine/metrics";
  replay_scoring: "POST /adaptation-scoring-engine/replay";
  inspect_scoring: "POST /adaptation-scoring-engine/inspect";
  retrieve_contract: "GET /adaptation-scoring-engine/contract";
  approval_supported: false;
  rejection_supported: false;
  implementation_supported: false;
  suppression_supported: false;
  prioritization_supported: false;
  proposal_mutation_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationScoringInput = Readonly<{
  scenario?: AdaptationScoringScenario;
  generator_result?: AdaptationProposalGeneratorResult;
}>;

export type AdaptationScoringResult = Readonly<{
  adaptation_scoring_engine_version: "adaptation-scoring-engine/v1";
  calculation_version: "adaptation-scoring-rules/v1";
  api_surface: AdaptationScoringApiSurface;
  generator_result: AdaptationProposalGeneratorResult;
  scored_proposals: readonly ProposalScore[];
  metrics: AdaptationScoringMetrics;
  scoring_state: AdaptationScoringState;
  failures: readonly AdaptationScoringFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  evidence_based: boolean;
  tenant_isolated: boolean;
  governance_neutral: true;
  advisory_only: true;
  approves_proposals: false;
  rejects_proposals: false;
  implements_proposals: false;
  suppresses_proposals: false;
  prioritizes_proposals: false;
  mutates_proposals: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationScoringFoundation = Readonly<{
  adaptation_scoring_engine_version: "adaptation-scoring-engine/v1";
  supported_dimensions: readonly AdaptationScoreDimension[];
  api_surface: AdaptationScoringApiSurface;
  result: AdaptationScoringResult;
}>;

export type ScoreableGeneratedProposal = GeneratedAdaptationProposal;
