import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";

export type ConstitutionalProtectionCategory =
  | "HUMAN_AUTHORITY"
  | "ADVISORY_ONLY_OPERATION"
  | "OPERATOR_SUPREMACY"
  | "GOVERNANCE_SUPREMACY"
  | "CONSTITUTIONAL_INTEGRITY"
  | "DETERMINISM"
  | "EXPLAINABILITY"
  | "REPLAYABILITY"
  | "AUDITABILITY"
  | "EVIDENCE_INTEGRITY"
  | "TRUST_PRESERVATION"
  | "TENANT_ISOLATION"
  | "HISTORICAL_TRUTH"
  | "HISTORICAL_IMMUTABILITY"
  | "ACCOUNTABILITY"
  | "TRANSPARENCY"
  | "SEPARATION_OF_DUTIES"
  | "LEAST_AUTHORITY"
  | "PRODUCTION_SAFETY"
  | "SIMULATION_FIRST_OPERATION";

export type ConstitutionalRuleKind = "MANDATORY" | "ABSOLUTE_PROHIBITION" | "AUTHORITY_LIMITATION" | "GOVERNANCE_REQUIREMENT" | "TRUTH_PRESERVATION";
export type ConstitutionalRuleStatus = "PASSED" | "FAILED" | "NOT_APPLICABLE";
export type ConstitutionalConflictSeverity = "NONE" | "ADVISORY_CONCERN" | "REVIEW_REQUIRED" | "CONSTITUTIONAL_CONFLICT" | "CRITICAL_VIOLATION" | "AUTOMATIC_REJECTION";
export type ConstitutionalViolationSeverity = "NONE" | "ADVISORY_CONCERN" | "REVIEW_REQUIRED" | "CONSTITUTIONAL_CONFLICT" | "CRITICAL_VIOLATION" | "AUTOMATIC_REJECTION";

export type ConstitutionalAdaptationStatus =
  | "COMPLIANT"
  | "COMPLIANT_WITH_REVIEW"
  | "REQUIRES_CONSTITUTIONAL_REVIEW"
  | "CONSTITUTIONAL_CONFLICT"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type ConstitutionalAdaptationFailure =
  | "PRINCIPLES_UNRESOLVED"
  | "RULE_EVALUATION_INCOMPLETE"
  | "NONDETERMINISTIC_REASONING"
  | "HUMAN_AUTHORITY_UNGUARANTEED"
  | "GOVERNANCE_SUPREMACY_WEAKENED"
  | "OPERATOR_SUPREMACY_WEAKENED"
  | "ADVISORY_ONLY_VIOLATED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "AUTONOMOUS_EXECUTION_INTRODUCED"
  | "EXPLAINABILITY_REDUCED"
  | "REPLAY_DEGRADED"
  | "AUDITABILITY_WEAKENED"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "TENANT_ISOLATION_UNGUARANTEED"
  | "HISTORICAL_TRUTH_MUTATION_RISK"
  | "HISTORICAL_IMMUTABILITY_VIOLATED"
  | "CONSTITUTIONAL_LINEAGE_INCOMPLETE"
  | "INTEGRITY_HASH_FAILED"
  | "REPLAY_DIVERGENCE"
  | "DECISION_RECORDING_FAILED"
  | "TRANSPARENCY_REDUCED"
  | "CONSTITUTIONAL_REVIEW_BYPASSED"
  | "FAIL_OPEN_BEHAVIOR";

export type ConstitutionalAdaptationScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "REVIEW_REQUIRED"
  | "CONSTITUTIONAL_CONFLICT"
  | "RESTRICTED_PROPOSAL"
  | "PRINCIPLE_DISCOVERY_FAILURE"
  | "RULE_EVALUATION_INCOMPLETE"
  | "HUMAN_AUTHORITY_LOSS"
  | "GOVERNANCE_WEAKENING"
  | "OPERATOR_SUPREMACY_WEAKENING"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "AUTONOMOUS_EXECUTION"
  | "EXPLAINABILITY_REDUCTION"
  | "REPLAY_DEGRADATION"
  | "AUDITABILITY_WEAKENING"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_FAILURE"
  | "HISTORICAL_TRUTH_MUTATION"
  | "HISTORICAL_IMMUTABILITY_VIOLATION"
  | "TRANSPARENCY_REDUCTION"
  | "CONSTITUTIONAL_REVIEW_BYPASS"
  | "LINEAGE_INCOMPLETE"
  | "HASH_MISMATCH"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_FAILURE"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type ConstitutionalProtectedPrinciple = Readonly<{
  principle_id: string;
  category: ConstitutionalProtectionCategory;
  guarantee: string;
  preserved: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalRuleEvaluation = Readonly<{
  rule_id: string;
  kind: ConstitutionalRuleKind;
  status: ConstitutionalRuleStatus;
  reasoning: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalDependency = Readonly<{
  dependency_id: string;
  satisfied: boolean;
  explanation: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalConflictResult = Readonly<{
  conflict_id: string;
  category: ConstitutionalProtectionCategory;
  severity: ConstitutionalConflictSeverity;
  resolution_required: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type ConstitutionalViolation = Readonly<{
  violation_id: string;
  category: ConstitutionalProtectionCategory;
  severity: ConstitutionalViolationSeverity;
  automatically_rejected: boolean;
  evidence_refs: readonly string[];
  explanation: string;
  integrity_hash: string;
}>;

export type ConstitutionalLedgerEntry = Readonly<{
  ledger_entry_id: string;
  validation_id: string;
  proposal_id: string;
  tenant_id: string;
  final_status: ConstitutionalAdaptationStatus;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  recorded_at: string;
  integrity_hash: string;
}>;

export type ConstitutionalAdaptationValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  constitution_version: string;
  protected_principles: readonly ConstitutionalProtectedPrinciple[];
  evaluated_rules: readonly ConstitutionalRuleEvaluation[];
  constitutional_dependencies: readonly ConstitutionalDependency[];
  conflict_results: readonly ConstitutionalConflictResult[];
  violations: readonly ConstitutionalViolation[];
  rejection_reasons: readonly string[];
  constitutional_status: ConstitutionalAdaptationStatus;
  constitutional_reasoning: readonly string[];
  failures: readonly ConstitutionalAdaptationFailure[];
  supporting_evidence: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type ConstitutionalAdaptationApiSurface = Readonly<{
  api_id: string;
  validate_proposal: "POST /constitutional-adaptation-validator/validate";
  retrieve_principles: "POST /constitutional-adaptation-validator/principles";
  retrieve_rules: "POST /constitutional-adaptation-validator/rules";
  retrieve_conflicts: "POST /constitutional-adaptation-validator/conflicts";
  retrieve_violations: "POST /constitutional-adaptation-validator/violations";
  retrieve_rejection: "POST /constitutional-adaptation-validator/rejection";
  retrieve_ledger: "POST /constitutional-adaptation-validator/ledger";
  replay_validation: "POST /constitutional-adaptation-validator/replay";
  retrieve_contract: "GET /constitutional-adaptation-validator/contract";
  execution_approval_supported: false;
  authority_expansion_supported: false;
  constitutional_bypass_supported: false;
  fail_open_supported: false;
  mutation_supported: false;
  integrity_hash: string;
}>;

export type ConstitutionalAdaptationValidatorInput = Readonly<{
  scenario?: ConstitutionalAdaptationScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
}>;

export type ConstitutionalAdaptationValidatorResult = Readonly<{
  constitutional_adaptation_validator_version: "constitutional-adaptation-validator/v1";
  api_surface: ConstitutionalAdaptationApiSurface;
  validation: ConstitutionalAdaptationValidation;
  ledger_entry: ConstitutionalLedgerEntry;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: boolean;
  advisory_only: true;
  human_governed: true;
  operator_controlled: true;
  governance_enforced: true;
  fail_closed: boolean;
  tenant_isolated: boolean;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConstitutionalAdaptationValidatorFoundation = Readonly<{
  constitutional_adaptation_validator_version: "constitutional-adaptation-validator/v1";
  api_surface: ConstitutionalAdaptationApiSurface;
  result: ConstitutionalAdaptationValidatorResult;
}>;
