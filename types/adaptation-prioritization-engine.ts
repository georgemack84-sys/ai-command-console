import type { AdaptationScoringResult, ProposalScore } from "@/types/adaptation-scoring-engine";

export type AdaptationPriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "DEFERRED";

export type AdaptationPriorityFactor =
  | "EXPECTED_BENEFIT"
  | "URGENCY"
  | "RECURRENCE"
  | "MISSION_IMPACT"
  | "OPERATOR_IMPACT"
  | "GOVERNANCE_IMPACT"
  | "CONSTITUTIONAL_IMPORTANCE"
  | "EVIDENCE_STRENGTH"
  | "SIMULATION_READINESS"
  | "CERTIFICATION_READINESS";

export type AdaptationPrioritizationState = "PRIORITIZED" | "DEFERRED" | "FAILED";

export type AdaptationPrioritizationFailure =
  | "PROPOSAL_VALIDATION_FAILED"
  | "PROPOSAL_SCORE_UNAVAILABLE"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_ANALYSIS_MISSING"
  | "CONSTITUTIONAL_ANALYSIS_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DETERMINISTIC_ORDERING_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "PROPOSAL_REJECTION_ATTEMPT"
  | "PROPOSAL_SUPPRESSION_ATTEMPT"
  | "GOVERNANCE_WORKFLOW_ALTERATION_ATTEMPT";

export type AdaptationPrioritizationScenario =
  | "BASELINE"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "DEFERRED"
  | "TIE_BREAK"
  | "MISSING_SCORE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "GOVERNANCE_MISSING"
  | "CONSTITUTIONAL_MISSING"
  | "INVALID_PROPOSAL"
  | "INTEGRITY_FAILURE"
  | "ORDERING_FAILURE"
  | "TENANT_VIOLATION"
  | "MUTATION_ATTEMPT"
  | "APPROVAL_ATTEMPT"
  | "REJECTION_ATTEMPT"
  | "SUPPRESSION_ATTEMPT"
  | "GOVERNANCE_WORKFLOW_ALTERATION";

export type PriorityFactorScore = Readonly<{
  factor: AdaptationPriorityFactor;
  score: number;
  weight: number;
  weighted_score: number;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type PriorityExplanation = Readonly<{
  explanation_id: string;
  proposal_id: string;
  priority_level: AdaptationPriorityLevel;
  contributing_factors: readonly string[];
  factor_weights: Readonly<Record<AdaptationPriorityFactor, number>>;
  evidence_references: readonly string[];
  readiness_assessment: string;
  governance_considerations: readonly string[];
  constitutional_considerations: readonly string[];
  replay_references: readonly string[];
  calculation_version: "adaptation-prioritization-rules/v1";
  integrity_hash: string;
}>;

export type PrioritizedAdaptationProposal = Readonly<{
  priority_id: string;
  proposal_id: string;
  generated_proposal_id: string;
  score_id: string;
  rank: number;
  priority_level: AdaptationPriorityLevel;
  priority_score: number;
  factor_scores: readonly PriorityFactorScore[];
  explanation: PriorityExplanation;
  tie_break_values: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  advisory_only: true;
  approves_proposal: false;
  rejects_proposal: false;
  implements_proposal: false;
  suppresses_proposal: false;
  mutates_proposal: false;
  alters_governance_workflow: false;
  integrity_hash: string;
}>;

export type AdaptationPrioritizationMetrics = Readonly<{
  proposals_prioritized: number;
  priority_distribution: Readonly<Record<AdaptationPriorityLevel, number>>;
  average_prioritization_latency_ms: number;
  benefit_distribution: readonly number[];
  urgency_distribution: readonly number[];
  mission_impact_distribution: readonly number[];
  evidence_strength_distribution: readonly number[];
  governance_sensitivity_distribution: readonly number[];
  simulation_readiness_distribution: readonly number[];
  certification_readiness_distribution: readonly number[];
  deterministic_replay_success: boolean;
  prioritization_validation_failures: readonly AdaptationPrioritizationFailure[];
  integrity_hash: string;
}>;

export type AdaptationPrioritizationApiSurface = Readonly<{
  api_id: string;
  prioritize_proposals: "POST /adaptation-prioritization-engine/prioritize";
  retrieve_priorities: "POST /adaptation-prioritization-engine/priorities";
  retrieve_factors: "POST /adaptation-prioritization-engine/factors";
  retrieve_explanations: "POST /adaptation-prioritization-engine/explanations";
  retrieve_metrics: "POST /adaptation-prioritization-engine/metrics";
  replay_prioritization: "POST /adaptation-prioritization-engine/replay";
  inspect_prioritization: "POST /adaptation-prioritization-engine/inspect";
  retrieve_contract: "GET /adaptation-prioritization-engine/contract";
  approval_supported: false;
  rejection_supported: false;
  implementation_supported: false;
  suppression_supported: false;
  proposal_mutation_supported: false;
  governance_workflow_mutation_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationPrioritizationInput = Readonly<{
  scenario?: AdaptationPrioritizationScenario;
  scoring_result?: AdaptationScoringResult;
}>;

export type AdaptationPrioritizationResult = Readonly<{
  adaptation_prioritization_engine_version: "adaptation-prioritization-engine/v1";
  calculation_version: "adaptation-prioritization-rules/v1";
  api_surface: AdaptationPrioritizationApiSurface;
  scoring_result: AdaptationScoringResult;
  prioritized_proposals: readonly PrioritizedAdaptationProposal[];
  metrics: AdaptationPrioritizationMetrics;
  prioritization_state: AdaptationPrioritizationState;
  failures: readonly AdaptationPrioritizationFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  evidence_validated: boolean;
  governance_aware: boolean;
  constitutional_precedence_enforced: boolean;
  advisory_only: true;
  approves_proposals: false;
  rejects_proposals: false;
  implements_proposals: false;
  suppresses_proposals: false;
  mutates_proposals: false;
  alters_governance_workflows: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationPrioritizationFoundation = Readonly<{
  adaptation_prioritization_engine_version: "adaptation-prioritization-engine/v1";
  supported_factors: readonly AdaptationPriorityFactor[];
  priority_levels: readonly AdaptationPriorityLevel[];
  api_surface: AdaptationPrioritizationApiSurface;
  result: AdaptationPrioritizationResult;
}>;

export type PrioritizableProposalScore = ProposalScore;
