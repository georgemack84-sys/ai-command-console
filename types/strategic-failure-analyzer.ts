import type { StrategyEvolutionContractResult, StrategyDomain } from "@/types/strategy-evolution-contract";

export type StrategicFailureCategory =
  | "STRATEGY_MISMATCH"
  | "EVIDENCE_WEAKNESS"
  | "CONFIDENCE_ERROR"
  | "GOVERNANCE_ROUTING_ISSUE"
  | "ESCALATION_DELAY"
  | "SIMULATION_GAP"
  | "PLANNING_FAILURE";

export type StrategicFailureSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type StrategicFailureLifecycleState = "DETECTED" | "VALIDATED" | "ROOT_CAUSE_IDENTIFIED" | "CLASSIFIED" | "REGISTERED" | "AVAILABLE_FOR_STRATEGY_EVOLUTION" | "REJECTED" | "SUPERSEDED" | "ARCHIVED";
export type StrategicFailureValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type StrategicFailureFailure =
  | "STRATEGY_CONTRACT_UNCERTIFIED"
  | "FAILURE_NOT_REPRODUCIBLE"
  | "ROOT_CAUSE_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "PATTERN_REFERENCES_MISSING"
  | "REPLAY_VERIFICATION_FAILED"
  | "GOVERNANCE_REFERENCES_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATED"
  | "CLASSIFICATION_NONDETERMINISTIC"
  | "INTEGRITY_HASH_MISMATCH"
  | "SINGLE_FAILURE_INSUFFICIENT"
  | "REGISTRY_MUTATION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "STRATEGY_MUTATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategicFailureScenario =
  | "BASELINE"
  | "STRATEGY_MISMATCH"
  | "EVIDENCE_WEAKNESS"
  | "CONFIDENCE_ERROR"
  | "GOVERNANCE_ROUTING_ISSUE"
  | "ESCALATION_DELAY"
  | "SIMULATION_GAP"
  | "PLANNING_FAILURE"
  | "UNCERTIFIED_CONTRACT"
  | "NOT_REPRODUCIBLE"
  | "MISSING_ROOT_CAUSE"
  | "MISSING_EVIDENCE"
  | "MISSING_PATTERN_REFS"
  | "REPLAY_FAILURE"
  | "MISSING_GOVERNANCE"
  | "CROSS_TENANT"
  | "NONDETERMINISTIC_CLASSIFICATION"
  | "HASH_MISMATCH"
  | "SINGLE_FAILURE"
  | "REGISTRY_MUTATION"
  | "ADVISORY_VIOLATION"
  | "STRATEGY_MUTATION"
  | "FAIL_OPEN";

export type StrategicFailureRecord = Readonly<{
  failure_id: string;
  tenant_id: string;
  mission_scope: string;
  strategy_area: StrategyDomain;
  failure_category: StrategicFailureCategory;
  failure_summary: string;
  root_cause_summary: string;
  severity: StrategicFailureSeverity;
  recurrence_score: number;
  operational_impact: number;
  governance_impact: number;
  constitutional_impact: number;
  supporting_pattern_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_recommendation_refs: readonly string[];
  supporting_replay_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  remediation_priority: number;
  lifecycle_state: StrategicFailureLifecycleState;
  advisory_only: true;
  mutates_strategy: false;
  integrity_hash: string;
}>;

export type StrategicFailureRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  failure_refs: readonly string[];
  category_index: Readonly<Record<StrategicFailureCategory, readonly string[]>>;
  severity_index: Readonly<Record<StrategicFailureSeverity, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategicFailureValidation = Readonly<{
  validation_id: string;
  state: StrategicFailureValidationState;
  certified: boolean;
  failures: readonly StrategicFailureFailure[];
  contract_certified: boolean;
  reproducible: boolean;
  root_cause_identified: boolean;
  evidence_complete: boolean;
  pattern_references_complete: boolean;
  replay_verified: boolean;
  governance_referenced: boolean;
  tenant_isolated: boolean;
  classification_deterministic: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_strategy_mutation: boolean;
  integrity_hash: string;
}>;

export type StrategicFailureApiSurface = Readonly<{
  api_id: string;
  analyze_failures: "POST /strategic-failure-analyzer/analyze";
  retrieve_failures: "POST /strategic-failure-analyzer/failures";
  retrieve_classification: "POST /strategic-failure-analyzer/classification";
  retrieve_root_cause: "POST /strategic-failure-analyzer/root-cause";
  retrieve_evidence: "POST /strategic-failure-analyzer/evidence";
  retrieve_governance: "POST /strategic-failure-analyzer/governance";
  replay_analysis: "POST /strategic-failure-analyzer/replay";
  retrieve_registry: "POST /strategic-failure-analyzer/registry";
  retrieve_contract: "GET /strategic-failure-analyzer/contract";
  update_supported: false;
  delete_supported: false;
  strategy_mutation_supported: false;
  proposal_generation_supported: false;
  remediation_execution_supported: false;
  integrity_hash: string;
}>;

export type StrategicFailureInput = Readonly<{
  strategy_contract?: StrategyEvolutionContractResult;
  scenario?: StrategicFailureScenario;
}>;

export type StrategicFailureResult = Readonly<{
  strategic_failure_analyzer_version: "strategic-failure-analyzer/v1";
  strategy_contract: StrategyEvolutionContractResult;
  api_surface: StrategicFailureApiSurface;
  failures: readonly StrategicFailureRecord[];
  registry: StrategicFailureRegistry;
  validation: StrategicFailureValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  governance_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_strategy: false;
  generates_proposals: false;
  executes_remediation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategicFailureFoundation = Readonly<{
  strategic_failure_analyzer_version: "strategic-failure-analyzer/v1";
  api_surface: StrategicFailureApiSurface;
  result: StrategicFailureResult;
}>;
