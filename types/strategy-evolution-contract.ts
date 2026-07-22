import type { PatternCertificationResult } from "@/types/pattern-intelligence-certification-gate";

export type StrategyDomain =
  | "PRIORITIZATION"
  | "RISK_HANDLING"
  | "CONFIDENCE_CALIBRATION"
  | "EVIDENCE_REQUIREMENTS"
  | "SIMULATION_SELECTION"
  | "OPERATOR_ESCALATION"
  | "GOVERNANCE_ROUTING"
  | "MISSION_PLANNING"
  | "RECOMMENDATION_GENERATION"
  | "ROLLBACK_PREPARATION"
  | "DECISION_PACKAGE_PRESENTATION";

export type ProhibitedStrategyMutation =
  | "CONSTITUTIONAL_CHANGES"
  | "GOVERNANCE_POLICY_MODIFICATION"
  | "AUTHORITY_EXPANSION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "TENANT_ISOLATION_CHANGES"
  | "REPLAY_ARCHITECTURE_CHANGES"
  | "TRUTH_LEDGER_MUTATION"
  | "EVIDENCE_INTEGRITY_RULES"
  | "AUDIT_LOGGING_BEHAVIOR"
  | "DETERMINISTIC_EXECUTION_GUARANTEES"
  | "CERTIFICATION_REQUIREMENTS"
  | "FAIL_SAFE_MECHANISMS"
  | "SECURITY_BOUNDARIES"
  | "CRYPTOGRAPHIC_VERIFICATION"
  | "IMMUTABLE_HISTORY";

export type StrategyProposalLifecycleState =
  | "DRAFT"
  | "VALIDATED"
  | "GOVERNANCE_REVIEW"
  | "SIMULATION_PENDING"
  | "SIMULATION_COMPLETED"
  | "CERTIFICATION_PENDING"
  | "CERTIFIED"
  | "OPERATOR_APPROVAL"
  | "AVAILABLE_FOR_ADOPTION"
  | "REJECTED"
  | "CANCELLED"
  | "SUPERSEDED";

export type StrategyContractValidationState = "CONTRACT_VALIDATED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type StrategyContractFailure =
  | "PATTERN_INTELLIGENCE_CERTIFICATION_REQUIRED"
  | "UNKNOWN_STRATEGY_DOMAIN"
  | "MULTI_DOMAIN_NOT_APPROVED"
  | "PROHIBITED_STRATEGY_MUTATION"
  | "GOVERNANCE_REQUIREMENTS_MISSING"
  | "SIMULATION_REQUIREMENT_ABSENT"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "ROLLBACK_PLAN_ABSENT"
  | "OPERATOR_APPROVAL_DISABLED"
  | "CERTIFICATION_REQUIREMENT_ABSENT"
  | "ADVISORY_ONLY_DISABLED"
  | "INTEGRITY_HASH_INVALID"
  | "TENANT_ISOLATION_VIOLATED"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "AUTONOMOUS_STRATEGY_MUTATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "CERTIFICATION_BYPASS_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategyContractScenario =
  | "BASELINE"
  | "PATTERN_CERTIFICATION_MISSING"
  | "UNKNOWN_DOMAIN"
  | "MULTI_DOMAIN_UNAPPROVED"
  | "PROHIBITED_MUTATION"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "OPERATOR_APPROVAL_DISABLED"
  | "MISSING_CERTIFICATION"
  | "ADVISORY_DISABLED"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "INVALID_LIFECYCLE"
  | "AUTONOMOUS_MUTATION"
  | "GOVERNANCE_BYPASS"
  | "SIMULATION_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "FAIL_OPEN";

export type StrategyEvolutionProposalEnvelope = Readonly<{
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  strategy_domains: readonly StrategyDomain[];
  prohibited_domain_refs: readonly ProhibitedStrategyMutation[];
  lifecycle_state: StrategyProposalLifecycleState;
  governance_refs: readonly string[];
  simulation_refs: readonly string[];
  certification_refs: readonly string[];
  rollback_refs: readonly string[];
  replay_refs: readonly string[];
  operator_approval_required: boolean;
  multi_domain_approved: boolean;
  advisory_only: boolean;
  mutates_strategy: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionContract = Readonly<{
  contract_id: string;
  contract_version: "strategy-evolution-contract/v1";
  tenant_id: string;
  strategy_domains: readonly StrategyDomain[];
  prohibited_domains: readonly ProhibitedStrategyMutation[];
  governance_requirements: readonly string[];
  simulation_requirements: readonly string[];
  operator_requirements: readonly string[];
  certification_requirements: readonly string[];
  rollback_requirements: readonly string[];
  replay_requirements: readonly string[];
  advisory_only: true;
  deterministic: true;
  governance_supremacy: true;
  operator_authority: true;
  integrity_hash: string;
}>;

export type StrategyContractValidation = Readonly<{
  validation_id: string;
  state: StrategyContractValidationState;
  certified: boolean;
  failures: readonly StrategyContractFailure[];
  pattern_intelligence_certified: boolean;
  domains_registered: boolean;
  prohibited_mutations_enforced: boolean;
  governance_requirements_complete: boolean;
  simulation_requirements_complete: boolean;
  certification_requirements_complete: boolean;
  replay_requirements_complete: boolean;
  rollback_requirements_complete: boolean;
  operator_approval_required: boolean;
  advisory_only_enforced: boolean;
  tenant_isolated: boolean;
  lifecycle_valid: boolean;
  integrity_verified: boolean;
  no_autonomous_strategy_mutation: boolean;
  integrity_hash: string;
}>;

export type StrategyContractApiSurface = Readonly<{
  api_id: string;
  retrieve_contract: "GET /strategy-evolution-contract/contract";
  validate_proposal: "POST /strategy-evolution-contract/validate";
  retrieve_domains: "POST /strategy-evolution-contract/domains";
  retrieve_authority_rules: "POST /strategy-evolution-contract/authority";
  retrieve_governance_rules: "POST /strategy-evolution-contract/governance";
  retrieve_simulation_requirements: "POST /strategy-evolution-contract/simulation";
  retrieve_certification_requirements: "POST /strategy-evolution-contract/certification";
  retrieve_rollback_requirements: "POST /strategy-evolution-contract/rollback";
  retrieve_replay_requirements: "POST /strategy-evolution-contract/replay";
  update_supported: false;
  delete_supported: false;
  autonomous_strategy_mutation_supported: false;
  self_approval_supported: false;
  integrity_hash: string;
}>;

export type StrategyEvolutionContractInput = Readonly<{
  pattern_certification?: PatternCertificationResult;
  proposal?: StrategyEvolutionProposalEnvelope;
  scenario?: StrategyContractScenario;
}>;

export type StrategyEvolutionContractResult = Readonly<{
  strategy_evolution_contract_version: "strategy-evolution-contract/v1";
  pattern_certification: PatternCertificationResult;
  api_surface: StrategyContractApiSurface;
  contract: StrategyEvolutionContract;
  proposal_envelope: StrategyEvolutionProposalEnvelope;
  validation: StrategyContractValidation;
  deterministic: true;
  replayable: true;
  explainable: true;
  advisory_only: true;
  governance_controlled: true;
  constitutionally_compliant: boolean;
  operator_approved_required: true;
  simulation_required: true;
  certification_required: true;
  rollback_required: true;
  tenant_isolated: boolean;
  autonomous_strategy_mutation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyEvolutionContractFoundation = Readonly<{
  strategy_evolution_contract_version: "strategy-evolution-contract/v1";
  api_surface: StrategyContractApiSurface;
  result: StrategyEvolutionContractResult;
}>;
