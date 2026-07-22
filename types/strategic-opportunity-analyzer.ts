import type { StrategyEvolutionContractResult, StrategyDomain } from "@/types/strategy-evolution-contract";

export type StrategicOpportunityCategory =
  | "SUCCESS_OPPORTUNITY"
  | "RISK_OPPORTUNITY"
  | "DECISION_OPPORTUNITY"
  | "EVIDENCE_OPPORTUNITY"
  | "GOVERNANCE_OPPORTUNITY"
  | "OPERATOR_OPPORTUNITY"
  | "SIMULATION_OPPORTUNITY";

export type StrategicOpportunityLifecycleState = "DETECTED" | "VALIDATED" | "EVIDENCE_CONFIRMED" | "RANKED" | "REGISTERED" | "AVAILABLE_FOR_PROPOSAL" | "REJECTED" | "SUPERSEDED" | "ARCHIVED";

export type StrategicOpportunityValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type StrategicOpportunityFailure =
  | "STRATEGY_CONTRACT_UNCERTIFIED"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "PATTERN_INTELLIGENCE_UNAVAILABLE"
  | "REPLAY_VERIFICATION_FAILED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "OPPORTUNITY_NOT_REPRODUCIBLE"
  | "RANKING_NONDETERMINISTIC"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "SINGLE_SUCCESS_INSUFFICIENT"
  | "REGISTRY_MUTATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "STRATEGY_MUTATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategicOpportunityScenario =
  | "BASELINE"
  | "SUCCESS_OPPORTUNITY"
  | "RISK_OPPORTUNITY"
  | "DECISION_OPPORTUNITY"
  | "EVIDENCE_OPPORTUNITY"
  | "GOVERNANCE_OPPORTUNITY"
  | "OPERATOR_OPPORTUNITY"
  | "SIMULATION_OPPORTUNITY"
  | "UNCERTIFIED_CONTRACT"
  | "MISSING_EVIDENCE"
  | "MISSING_PATTERN_INTELLIGENCE"
  | "REPLAY_FAILURE"
  | "MISSING_GOVERNANCE"
  | "NOT_REPRODUCIBLE"
  | "NONDETERMINISTIC_RANKING"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "SINGLE_SUCCESS"
  | "REGISTRY_MUTATION"
  | "ADVISORY_VIOLATION"
  | "STRATEGY_MUTATION"
  | "FAIL_OPEN";

export type StrategicOpportunityRecord = Readonly<{
  opportunity_id: string;
  tenant_id: string;
  mission_scope: string;
  opportunity_category: StrategicOpportunityCategory;
  strategy_area: StrategyDomain;
  opportunity_summary: string;
  supporting_pattern_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_recommendation_refs: readonly string[];
  supporting_decision_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  supporting_replay_refs: readonly string[];
  opportunity_score: number;
  repeatability_score: number;
  evidence_strength: number;
  expected_benefit: number;
  governance_impact: number;
  operator_impact: number;
  ranking_position: number;
  lifecycle_state: StrategicOpportunityLifecycleState;
  advisory_only: true;
  mutates_strategy: false;
  integrity_hash: string;
}>;

export type StrategicOpportunityRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  opportunity_refs: readonly string[];
  category_index: Readonly<Record<StrategicOpportunityCategory, readonly string[]>>;
  ranking_index: readonly string[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategicOpportunityValidation = Readonly<{
  validation_id: string;
  state: StrategicOpportunityValidationState;
  certified: boolean;
  failures: readonly StrategicOpportunityFailure[];
  contract_certified: boolean;
  evidence_complete: boolean;
  pattern_intelligence_available: boolean;
  replay_verified: boolean;
  governance_referenced: boolean;
  reproducible: boolean;
  ranking_deterministic: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_strategy_mutation: boolean;
  integrity_hash: string;
}>;

export type StrategicOpportunityApiSurface = Readonly<{
  api_id: string;
  analyze_opportunities: "POST /strategic-opportunity-analyzer/analyze";
  retrieve_opportunities: "POST /strategic-opportunity-analyzer/opportunities";
  retrieve_ranking: "POST /strategic-opportunity-analyzer/ranking";
  retrieve_evidence: "POST /strategic-opportunity-analyzer/evidence";
  retrieve_governance: "POST /strategic-opportunity-analyzer/governance";
  replay_analysis: "POST /strategic-opportunity-analyzer/replay";
  retrieve_registry: "POST /strategic-opportunity-analyzer/registry";
  retrieve_contract: "GET /strategic-opportunity-analyzer/contract";
  update_supported: false;
  delete_supported: false;
  strategy_mutation_supported: false;
  proposal_generation_supported: false;
  integrity_hash: string;
}>;

export type StrategicOpportunityInput = Readonly<{
  strategy_contract?: StrategyEvolutionContractResult;
  scenario?: StrategicOpportunityScenario;
}>;

export type StrategicOpportunityResult = Readonly<{
  strategic_opportunity_analyzer_version: "strategic-opportunity-analyzer/v1";
  strategy_contract: StrategyEvolutionContractResult;
  api_surface: StrategicOpportunityApiSurface;
  opportunities: readonly StrategicOpportunityRecord[];
  registry: StrategicOpportunityRegistry;
  validation: StrategicOpportunityValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  governance_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_strategy: false;
  generates_proposals: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategicOpportunityFoundation = Readonly<{
  strategic_opportunity_analyzer_version: "strategic-opportunity-analyzer/v1";
  api_surface: StrategicOpportunityApiSurface;
  result: StrategicOpportunityResult;
}>;
