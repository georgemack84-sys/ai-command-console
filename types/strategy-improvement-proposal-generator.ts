import type { MissionStrategyComparisonResult } from "@/types/mission-strategy-comparison-engine";
import type { StrategicFailureResult } from "@/types/strategic-failure-analyzer";
import type { StrategicOpportunityResult } from "@/types/strategic-opportunity-analyzer";
import type { StrategyDomain } from "@/types/strategy-evolution-contract";

export type StrategyProposalRecommendation = "ADVANCE" | "DEFER" | "REVISE" | "REJECT";
export type StrategyProposalLifecycleState = "GENERATED" | "VALIDATED" | "PRIORITIZED" | "RECOMMENDED" | "REGISTERED" | "READY_FOR_GOVERNANCE_REVIEW" | "REJECTED" | "SUPERSEDED" | "WITHDRAWN";
export type StrategyProposalValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type StrategyImprovementProposalFailure =
  | "UPSTREAM_INTELLIGENCE_UNCERTIFIED"
  | "HISTORICAL_EVIDENCE_MISSING"
  | "RECURRING_PATTERN_REFERENCES_MISSING"
  | "EXPECTED_BENEFITS_MISSING"
  | "EXPECTED_RISKS_MISSING"
  | "GOVERNANCE_ANALYSIS_INCOMPLETE"
  | "CONSTITUTIONAL_ANALYSIS_INCOMPLETE"
  | "OPERATOR_IMPACT_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "ROLLBACK_PLAN_MISSING"
  | "SIMULATION_REQUIREMENT_DISABLED"
  | "APPROVAL_REQUIREMENT_DISABLED"
  | "CERTIFICATION_REQUIREMENT_DISABLED"
  | "HIDDEN_REASONING_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRIORITY_NONDETERMINISTIC"
  | "REGISTRY_MUTATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "STRATEGY_MUTATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategyImprovementProposalScenario =
  | "BASELINE"
  | "ADVANCE"
  | "DEFER"
  | "REVISE"
  | "REJECT"
  | "UNCERTIFIED_UPSTREAM"
  | "MISSING_HISTORICAL_EVIDENCE"
  | "MISSING_PATTERN_REFS"
  | "MISSING_BENEFITS"
  | "MISSING_RISKS"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_OPERATOR_IMPACT"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "SIMULATION_DISABLED"
  | "APPROVAL_DISABLED"
  | "CERTIFICATION_DISABLED"
  | "HIDDEN_REASONING"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "NONDETERMINISTIC_PRIORITY"
  | "REGISTRY_MUTATION"
  | "ADVISORY_VIOLATION"
  | "STRATEGY_MUTATION"
  | "FAIL_OPEN";

export type StrategyEvolutionProposal = Readonly<{
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  strategy_area: StrategyDomain;
  current_strategy_summary: string;
  proposed_strategy_change: string;
  rationale: string;
  supporting_pattern_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_opportunity_refs: readonly string[];
  supporting_failure_refs: readonly string[];
  supporting_comparison_refs: readonly string[];
  expected_benefits: readonly string[];
  expected_risks: readonly string[];
  governance_implications: readonly string[];
  constitutional_implications: readonly string[];
  operator_impact: readonly string[];
  simulation_required: boolean;
  approval_required: boolean;
  certification_required: boolean;
  rollback_plan_ref: string;
  replay_refs: readonly string[];
  priority_score: number;
  priority_rank: number;
  recommendation: StrategyProposalRecommendation;
  lifecycle_state: StrategyProposalLifecycleState;
  hidden_reasoning_detected: boolean;
  advisory_only: true;
  mutates_strategy: false;
  integrity_hash: string;
}>;

export type StrategyProposalRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  proposal_refs: readonly string[];
  priority_index: readonly string[];
  recommendation_index: Readonly<Record<StrategyProposalRecommendation, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyProposalValidation = Readonly<{
  validation_id: string;
  state: StrategyProposalValidationState;
  certified: boolean;
  failures: readonly StrategyImprovementProposalFailure[];
  upstream_certified: boolean;
  evidence_complete: boolean;
  pattern_references_complete: boolean;
  benefits_documented: boolean;
  risks_documented: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  operator_impact_complete: boolean;
  replay_complete: boolean;
  rollback_complete: boolean;
  simulation_required: boolean;
  approval_required: boolean;
  certification_required: boolean;
  hidden_reasoning_absent: boolean;
  tenant_isolated: boolean;
  priority_deterministic: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_strategy_mutation: boolean;
  integrity_hash: string;
}>;

export type StrategyProposalApiSurface = Readonly<{
  api_id: string;
  generate_proposals: "POST /strategy-improvement-proposal-generator/generate";
  retrieve_proposals: "POST /strategy-improvement-proposal-generator/proposals";
  retrieve_priority: "POST /strategy-improvement-proposal-generator/priority";
  retrieve_recommendation: "POST /strategy-improvement-proposal-generator/recommendation";
  retrieve_evidence: "POST /strategy-improvement-proposal-generator/evidence";
  retrieve_governance: "POST /strategy-improvement-proposal-generator/governance";
  replay_generation: "POST /strategy-improvement-proposal-generator/replay";
  retrieve_registry: "POST /strategy-improvement-proposal-generator/registry";
  retrieve_contract: "GET /strategy-improvement-proposal-generator/contract";
  update_supported: false;
  delete_supported: false;
  direct_strategy_mutation_supported: false;
  direct_approval_supported: false;
  integrity_hash: string;
}>;

export type StrategyImprovementProposalInput = Readonly<{
  opportunity_result?: StrategicOpportunityResult;
  failure_result?: StrategicFailureResult;
  comparison_result?: MissionStrategyComparisonResult;
  scenario?: StrategyImprovementProposalScenario;
}>;

export type StrategyImprovementProposalResult = Readonly<{
  strategy_improvement_proposal_generator_version: "strategy-improvement-proposal-generator/v1";
  opportunity_result: StrategicOpportunityResult;
  failure_result: StrategicFailureResult;
  comparison_result: MissionStrategyComparisonResult;
  api_surface: StrategyProposalApiSurface;
  proposals: readonly StrategyEvolutionProposal[];
  registry: StrategyProposalRegistry;
  validation: StrategyProposalValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  governance_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_strategy: false;
  direct_approval: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyImprovementProposalFoundation = Readonly<{
  strategy_improvement_proposal_generator_version: "strategy-improvement-proposal-generator/v1";
  api_surface: StrategyProposalApiSurface;
  result: StrategyImprovementProposalResult;
}>;
