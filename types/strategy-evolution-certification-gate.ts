import type { StrategyReplayExplainabilityResult } from "@/types/strategy-replay-explainability-engine";

export type StrategyEvolutionCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type StrategyEvolutionCertificationStatus = "PASS" | "FAIL";
export type StrategyEvolutionCertificationValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "CONDITIONAL";

export type StrategyEvolutionCertificationFailure =
  | "REPLAY_EXPLAINABILITY_UNCERTIFIED"
  | "STRATEGY_EVOLUTION_CONTRACT_INVALID"
  | "PROPOSAL_GENERATION_NONDETERMINISTIC"
  | "SUPPORTING_EVIDENCE_INCOMPLETE"
  | "SUPPORTING_PATTERNS_ABSENT"
  | "SUPPORTING_OUTCOMES_MISSING"
  | "GOVERNANCE_IMPLICATIONS_MISSING"
  | "CONSTITUTIONAL_IMPLICATIONS_MISSING"
  | "OPERATOR_IMPACT_UNDOCUMENTED"
  | "SIMULATION_REQUIREMENT_BYPASSED"
  | "APPROVAL_REQUIREMENT_BYPASSED"
  | "CERTIFICATION_REQUIREMENT_BYPASSED"
  | "ROLLBACK_PLAN_ABSENT"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "PROPOSAL_LINEAGE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_DIVERGED"
  | "HIDDEN_REASONING_DETECTED"
  | "UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"
  | "GOVERNANCE_REVIEW_BYPASSED"
  | "CONSTITUTIONAL_REVIEW_BYPASSED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"
  | "NON_FUNCTIONAL_DEFICIENCY_REMAINING"
  | "REGISTRY_MUTATION_DETECTED";

export type StrategyEvolutionCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_PASS"
  | "UNCERTIFIED_REPLAY"
  | "INVALID_CONTRACT"
  | "NONDETERMINISTIC_PROPOSAL"
  | "MISSING_EVIDENCE"
  | "MISSING_PATTERNS"
  | "MISSING_OUTCOMES"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_OPERATOR"
  | "SIMULATION_BYPASS"
  | "APPROVAL_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "MISSING_ROLLBACK"
  | "MISSING_REPLAY"
  | "MISSING_LINEAGE"
  | "REPLAY_DIVERGENCE"
  | "HIDDEN_REASONING"
  | "STRATEGY_MUTATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "FAIL_OPEN"
  | "REGISTRY_MUTATION";

export type StrategyEvolutionCertificationRecord = Readonly<{
  certification_id: string;
  certification_version: string;
  tenant_id: string;
  mission_scope: string;
  proposal_refs: readonly string[];
  functional_validation_status: StrategyEvolutionCertificationStatus;
  governance_validation_status: StrategyEvolutionCertificationStatus;
  constitutional_validation_status: StrategyEvolutionCertificationStatus;
  simulation_validation_status: StrategyEvolutionCertificationStatus;
  replay_validation_status: StrategyEvolutionCertificationStatus;
  explainability_validation_status: StrategyEvolutionCertificationStatus;
  integrity_validation_status: StrategyEvolutionCertificationStatus;
  certification_outcome: StrategyEvolutionCertificationOutcome;
  failed_test_refs: readonly StrategyEvolutionCertificationFailure[];
  remediation_requirements: readonly string[];
  reviewer_refs: readonly string[];
  certification_timestamp: string;
  production_ready: boolean;
  advisory_only_verified: boolean;
  mutation_blocked: boolean;
  tenant_isolation_verified: boolean;
  fail_closed_verified: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionCertificationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  certification_refs: readonly string[];
  outcome_index: Readonly<Record<StrategyEvolutionCertificationOutcome, readonly string[]>>;
  proposal_index: Readonly<Record<string, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionCertificationValidation = Readonly<{
  validation_id: string;
  state: StrategyEvolutionCertificationValidationState;
  certified: boolean;
  failures: readonly StrategyEvolutionCertificationFailure[];
  replay_explainability_certified: boolean;
  functional_validated: boolean;
  evidence_complete: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  simulation_validated: boolean;
  replay_validated: boolean;
  explainability_validated: boolean;
  integrity_validated: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  mutation_blocked: boolean;
  fail_closed: boolean;
  production_ready: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionCertificationApiSurface = Readonly<{
  api_id: string;
  certify_strategy_evolution: "POST /strategy-evolution-certification-gate/certify";
  retrieve_records: "POST /strategy-evolution-certification-gate/records";
  retrieve_decision: "POST /strategy-evolution-certification-gate/decision";
  retrieve_functional: "POST /strategy-evolution-certification-gate/functional";
  retrieve_governance: "POST /strategy-evolution-certification-gate/governance";
  retrieve_constitutional: "POST /strategy-evolution-certification-gate/constitutional";
  retrieve_simulation: "POST /strategy-evolution-certification-gate/simulation";
  replay_certification: "POST /strategy-evolution-certification-gate/replay";
  retrieve_integrity: "POST /strategy-evolution-certification-gate/integrity";
  retrieve_registry: "POST /strategy-evolution-certification-gate/registry";
  retrieve_contract: "GET /strategy-evolution-certification-gate/contract";
  update_supported: false;
  delete_supported: false;
  production_promotion_supported: false;
  strategy_mutation_supported: false;
  integrity_hash: string;
}>;

export type StrategyEvolutionCertificationInput = Readonly<{
  replay_result?: StrategyReplayExplainabilityResult;
  scenario?: StrategyEvolutionCertificationScenario;
}>;

export type StrategyEvolutionCertificationResult = Readonly<{
  strategy_evolution_certification_gate_version: "strategy-evolution-certification-gate/v1";
  replay_result: StrategyReplayExplainabilityResult;
  api_surface: StrategyEvolutionCertificationApiSurface;
  certification_records: readonly StrategyEvolutionCertificationRecord[];
  registry: StrategyEvolutionCertificationRegistry;
  validation: StrategyEvolutionCertificationValidation;
  deterministic: true;
  replayable: true;
  certification_outcome: StrategyEvolutionCertificationOutcome;
  production_ready: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  mutates_strategy: false;
  authorizes_adoption: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyEvolutionCertificationFoundation = Readonly<{
  strategy_evolution_certification_gate_version: "strategy-evolution-certification-gate/v1";
  api_surface: StrategyEvolutionCertificationApiSurface;
  result: StrategyEvolutionCertificationResult;
}>;
