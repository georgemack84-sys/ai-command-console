import type { ConfidenceDegradationResult } from "@/types/confidence-degradation-analyzer";

export type ConfidenceProposalType =
  | "CONFIDENCE_THRESHOLD_ADJUSTMENT"
  | "EVIDENCE_WEIGHTING_REFINEMENT"
  | "SOURCE_WEIGHTING_ADJUSTMENT"
  | "ADDITIONAL_UNCERTAINTY_MODELING"
  | "MISSION_SPECIFIC_CALIBRATION"
  | "RISK_AWARE_CALIBRATION"
  | "GOVERNANCE_SENSITIVE_CALIBRATION"
  | "OPERATOR_VISIBILITY_IMPROVEMENT";
export type ProposalBenefitRating = "MINIMAL" | "MODERATE" | "SIGNIFICANT" | "MAJOR" | "TRANSFORMATIONAL";
export type ProposalRiskCategory = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ProposalPriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "DEFERRED";
export type ProposalStatus = "DRAFT" | "VALIDATED" | "UNDER_GOVERNANCE_REVIEW" | "SIMULATION_REQUIRED" | "SIMULATION_PASSED" | "SIMULATION_FAILED" | "AWAITING_OPERATOR_APPROVAL" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type ProposalValidationState = "GENERATED" | "CERTIFIED" | "FAILED" | "REJECTED";

export type ConfidenceAdaptationProposalFailure =
  | "SUPPORTING_EVIDENCE_MISSING"
  | "OUTCOME_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "SIMULATION_REQUIREMENT_MISSING"
  | "OPERATOR_APPROVAL_REQUIREMENT_MISSING"
  | "ROLLBACK_STRATEGY_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_CONFIDENCE_MUTATION_DETECTED"
  | "CONFIDENCE_MODEL_UPDATE_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "OPERATOR_APPROVAL_BYPASS_DETECTED"
  | "HISTORICAL_RECORD_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_PROPOSAL_GENERATION"
  | "FAIL_OPEN_BEHAVIOR";

export type ConfidenceAdaptationProposalScenario =
  | "BASELINE"
  | "THRESHOLD"
  | "EVIDENCE_WEIGHTING"
  | "SOURCE_WEIGHTING"
  | "UNCERTAINTY_MODELING"
  | "MISSION_CALIBRATION"
  | "RISK_AWARE"
  | "GOVERNANCE_SENSITIVE"
  | "OPERATOR_VISIBILITY"
  | "LOW_PRIORITY"
  | "MEDIUM_PRIORITY"
  | "HIGH_PRIORITY"
  | "CRITICAL_PRIORITY"
  | "MISSING_EVIDENCE"
  | "MISSING_OUTCOME"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_OPERATOR_APPROVAL"
  | "MISSING_ROLLBACK"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "PRODUCTION_MUTATION"
  | "MODEL_UPDATE"
  | "GOVERNANCE_BYPASS"
  | "SIMULATION_BYPASS"
  | "OPERATOR_APPROVAL_BYPASS"
  | "HISTORICAL_RECORD_MUTATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type ConfidenceAdaptationProposal = Readonly<{
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  proposal_type: ConfidenceProposalType;
  current_calibration: string;
  observed_problem: string;
  supporting_evidence_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  proposed_calibration_change: string;
  expected_improvement: ProposalBenefitRating;
  expected_confidence_gain: number;
  potential_risks: readonly string[];
  risk_category: ProposalRiskCategory;
  governance_implications: readonly string[];
  simulation_required: boolean;
  rollback_strategy: string;
  approval_requirements: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  advisory_only: true;
  modifies_production_confidence: false;
  updates_confidence_model: false;
  changes_governance_requirements: false;
  bypasses_simulation: false;
  bypasses_operator_approval: false;
  mutates_historical_records: false;
  integrity_hash: string;
}>;

export type ProposalPriorityRecord = Readonly<{
  priority_id: string;
  proposal_id: string;
  priority_level: ProposalPriorityLevel;
  benefit_score: number;
  risk_score: number;
  governance_score: number;
  mission_impact_score: number;
  evidence_strength_score: number;
  overall_priority_score: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceProposalRegistryRecord = Readonly<{
  registry_record_id: string;
  proposal_id: string;
  proposal_version: string;
  proposal_status: ProposalStatus;
  governance_status: "PENDING_REVIEW" | "REQUIRED" | "APPROVED" | "REJECTED";
  simulation_status: "REQUIRED" | "PASSED" | "FAILED" | "NOT_RUN";
  approval_status: "OPERATOR_APPROVAL_REQUIRED" | "APPROVED" | "REJECTED";
  implementation_status: "NOT_IMPLEMENTED" | "BLOCKED" | "CERTIFIED_FOR_FUTURE_IMPLEMENTATION";
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceProposalRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  proposal_refs: readonly string[];
  priority_refs: readonly string[];
  registry_record_refs: readonly string[];
  type_index: Readonly<Record<ConfidenceProposalType, readonly string[]>>;
  priority_index: Readonly<Record<ProposalPriorityLevel, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationProposalValidation = Readonly<{
  validation_id: string;
  state: ProposalValidationState;
  certified: boolean;
  failures: readonly ConfidenceAdaptationProposalFailure[];
  evidence_complete: boolean;
  outcome_validation_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  simulation_required: boolean;
  operator_approval_required: boolean;
  rollback_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_production_confidence_mutation: boolean;
  no_model_update: boolean;
  no_governance_bypass: boolean;
  no_simulation_bypass: boolean;
  no_operator_approval_bypass: boolean;
  no_historical_record_mutation: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationProposalApiSurface = Readonly<{
  api_id: string;
  generate_proposal: "POST /confidence-adaptation-proposal-generator/analyze";
  retrieve_proposals: "POST /confidence-adaptation-proposal-generator/proposals";
  retrieve_priorities: "POST /confidence-adaptation-proposal-generator/priorities";
  retrieve_registry: "POST /confidence-adaptation-proposal-generator/registry";
  retrieve_benefits: "POST /confidence-adaptation-proposal-generator/benefits";
  retrieve_risks: "POST /confidence-adaptation-proposal-generator/risks";
  retrieve_governance: "POST /confidence-adaptation-proposal-generator/governance";
  retrieve_simulation: "POST /confidence-adaptation-proposal-generator/simulation";
  retrieve_approvals: "POST /confidence-adaptation-proposal-generator/approvals";
  replay_analysis: "POST /confidence-adaptation-proposal-generator/replay";
  retrieve_contract: "GET /confidence-adaptation-proposal-generator/contract";
  update_supported: false;
  delete_supported: false;
  production_confidence_mutation_supported: false;
  model_update_supported: false;
  governance_bypass_supported: false;
  simulation_bypass_supported: false;
  operator_approval_bypass_supported: false;
  historical_record_mutation_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationProposalInput = Readonly<{
  scenario?: ConfidenceAdaptationProposalScenario;
  degradation_result?: ConfidenceDegradationResult;
}>;

export type ConfidenceAdaptationProposalResult = Readonly<{
  confidence_adaptation_proposal_generator_version: "confidence-adaptation-proposal-generator/v1";
  api_surface: ConfidenceAdaptationProposalApiSurface;
  proposals: readonly ConfidenceAdaptationProposal[];
  priorities: readonly ProposalPriorityRecord[];
  registry_records: readonly ConfidenceProposalRegistryRecord[];
  registry: ConfidenceProposalRegistry;
  validation: ConfidenceAdaptationProposalValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  modifies_production_confidence: false;
  updates_confidence_model: false;
  changes_governance_requirements: false;
  bypasses_simulation: false;
  bypasses_operator_approval: false;
  mutates_historical_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationProposalFoundation = Readonly<{
  confidence_adaptation_proposal_generator_version: "confidence-adaptation-proposal-generator/v1";
  api_surface: ConfidenceAdaptationProposalApiSurface;
  result: ConfidenceAdaptationProposalResult;
}>;
