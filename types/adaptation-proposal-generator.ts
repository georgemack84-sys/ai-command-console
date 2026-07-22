import type { AdaptationProposalContractResult, AdaptationProposalScenario } from "@/types/adaptation-proposal-contract";

export type AdaptationProposalCategory =
  | "CONFIDENCE_CALIBRATION"
  | "RISK_CALIBRATION"
  | "RECOMMENDATION_HEURISTIC"
  | "PRIORITY_WEIGHTING"
  | "EVIDENCE_REQUIREMENT"
  | "SIMULATION_SELECTION"
  | "GOVERNANCE_ROUTING"
  | "OPERATOR_VISIBILITY"
  | "DECISION_PACKAGE_FORMAT"
  | "STRATEGIC_PATTERN_RESPONSE"
  | "ROLLBACK_GUIDANCE";

export type AdaptationProposalGeneratorState = "GENERATED" | "PENDING_EVIDENCE" | "FAILED";

export type AdaptationProposalGeneratorFailure =
  | "INPUT_INCOMPLETE"
  | "EVIDENCE_MISSING"
  | "OUTCOME_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "GOVERNANCE_ANALYSIS_FAILED"
  | "CONSTITUTIONAL_ANALYSIS_FAILED"
  | "AUTHORITY_ANALYSIS_FAILED"
  | "PROPOSAL_CONTRACT_VALIDATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "DETERMINISTIC_REPLAY_NOT_GUARANTEED"
  | "NONDETERMINISTIC_GENERATION_DETECTED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "MODEL_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "CONSTITUTIONAL_BYPASS_ATTEMPT"
  | "OPERATOR_AUTHORITY_REMOVAL_ATTEMPT"
  | "GOVERNANCE_VISIBILITY_SUPPRESSION_ATTEMPT";

export type AdaptationProposalGeneratorScenario =
  | "BASELINE"
  | "CONFIDENCE_IMPROVEMENT"
  | "RISK_IMPROVEMENT"
  | "EVIDENCE_IMPROVEMENT"
  | "SIMULATION_IMPROVEMENT"
  | "GOVERNANCE_ROUTING"
  | "OPERATOR_VISIBILITY"
  | "STRATEGIC_IMPROVEMENT"
  | "ROLLBACK_IMPROVEMENT"
  | "PRIORITIZATION_LOGIC"
  | "DECISION_PACKAGE_IMPROVEMENT"
  | "MISSING_INPUT"
  | "MISSING_EVIDENCE"
  | "MISSING_OUTCOMES"
  | "MISSING_REPLAY"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "AUTHORITY_FAILURE"
  | "CONTRACT_VALIDATION_FAILURE"
  | "INTEGRITY_FAILURE"
  | "TENANT_VIOLATION"
  | "REPLAY_NOT_GUARANTEED"
  | "NONDETERMINISTIC_GENERATION"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "MODEL_MUTATION_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "CONSTITUTIONAL_BYPASS_ATTEMPT"
  | "OPERATOR_AUTHORITY_REMOVAL"
  | "GOVERNANCE_VISIBILITY_SUPPRESSION";

export type AdaptiveIntelligenceSourceFinding = Readonly<{
  source_id: string;
  source_domain:
    | "OUTCOME_OBSERVATION"
    | "RECOMMENDATION_ANALYSIS"
    | "PATTERN_INTELLIGENCE"
    | "CONFIDENCE_ADAPTATION"
    | "RISK_ADAPTATION"
    | "STRATEGY_EVOLUTION"
    | "OPERATOR_FEEDBACK";
  finding_summary: string;
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  tenant_id: string;
  confidence: number;
  severity: number;
  integrity_hash: string;
}>;

export type AdaptationOpportunity = Readonly<{
  opportunity_id: string;
  categories: readonly AdaptationProposalCategory[];
  source_finding_refs: readonly string[];
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  replay_refs: readonly string[];
  priority_score: number;
  explainability: string;
  integrity_hash: string;
}>;

export type GeneratedAdaptationProposal = Readonly<{
  generated_proposal_id: string;
  categories: readonly AdaptationProposalCategory[];
  source_finding_refs: readonly string[];
  opportunity_id: string;
  contract_result: AdaptationProposalContractResult;
  recommendation_only: true;
  integrity_hash: string;
}>;

export type AdaptationProposalGeneratorMetrics = Readonly<{
  proposals_generated: number;
  proposals_rejected: number;
  generation_latency_ms: number;
  proposal_categories: readonly AdaptationProposalCategory[];
  evidence_utilization: number;
  source_distribution: Readonly<Record<string, number>>;
  deterministic_replay_success: boolean;
  validation_failures: readonly AdaptationProposalGeneratorFailure[];
  governance_evaluation_outcomes: readonly string[];
  operator_impact_classifications: readonly string[];
  integrity_hash: string;
}>;

export type AdaptationProposalGeneratorApiSurface = Readonly<{
  api_id: string;
  generate_proposals: "POST /adaptation-proposal-generator/generate";
  retrieve_proposals: "POST /adaptation-proposal-generator/proposals";
  retrieve_classifications: "POST /adaptation-proposal-generator/classifications";
  retrieve_metrics: "POST /adaptation-proposal-generator/metrics";
  replay_generation: "POST /adaptation-proposal-generator/replay";
  inspect_generator: "POST /adaptation-proposal-generator/inspect";
  retrieve_contract: "GET /adaptation-proposal-generator/contract";
  execution_supported: false;
  deployment_supported: false;
  production_mutation_supported: false;
  model_mutation_supported: false;
  policy_mutation_supported: false;
  governance_bypass_supported: false;
  operator_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationProposalGeneratorInput = Readonly<{
  scenario?: AdaptationProposalGeneratorScenario;
  contract_scenario?: AdaptationProposalScenario;
  source_findings?: readonly AdaptiveIntelligenceSourceFinding[];
}>;

export type AdaptationProposalGeneratorResult = Readonly<{
  adaptation_proposal_generator_version: "adaptation-proposal-generator/v1";
  synthesis_rule_version: "adaptation-proposal-synthesis-rules/v1";
  api_surface: AdaptationProposalGeneratorApiSurface;
  source_findings: readonly AdaptiveIntelligenceSourceFinding[];
  opportunities: readonly AdaptationOpportunity[];
  generated_proposals: readonly GeneratedAdaptationProposal[];
  metrics: AdaptationProposalGeneratorMetrics;
  generation_state: AdaptationProposalGeneratorState;
  failures: readonly AdaptationProposalGeneratorFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  tenant_isolated: boolean;
  governance_enforced: boolean;
  constitutional_enforced: boolean;
  authority_enforced: boolean;
  advisory_only: true;
  executes_changes: false;
  deploys_changes: false;
  mutates_production: false;
  mutates_models: false;
  mutates_policy: false;
  bypasses_constitutional_review: false;
  removes_operator_authority: false;
  suppresses_governance_visibility: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationProposalGeneratorFoundation = Readonly<{
  adaptation_proposal_generator_version: "adaptation-proposal-generator/v1";
  supported_categories: readonly AdaptationProposalCategory[];
  api_surface: AdaptationProposalGeneratorApiSurface;
  result: AdaptationProposalGeneratorResult;
}>;
