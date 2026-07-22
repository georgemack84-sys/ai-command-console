import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";

export type GovernanceAdaptationPolicyCategory =
  | "GOVERNANCE"
  | "CONSTITUTIONAL"
  | "AUTHORITY"
  | "OPERATIONAL"
  | "SECURITY"
  | "PRIVACY"
  | "COMPLIANCE"
  | "CERTIFICATION"
  | "TRUST"
  | "EVIDENCE"
  | "AUDIT"
  | "REPLAY"
  | "ROLLBACK"
  | "SIMULATION"
  | "RISK"
  | "TENANT"
  | "DATA_PROTECTION"
  | "LIFECYCLE"
  | "CHANGE_MANAGEMENT"
  | "HUMAN_OVERSIGHT";

export type GovernanceRuleCategory = "REQUIRED" | "OPTIONAL" | "ADVISORY" | "RESTRICTED" | "PROHIBITED";
export type GovernanceRuleStatus = "PASSED" | "FAILED" | "NOT_APPLICABLE";
export type GovernanceDependencyStatus = "SATISFIED" | "MISSING" | "UNVERIFIABLE";
export type GovernanceExceptionDecision = "NONE_REQUESTED" | "PERMITTED_WITH_APPROVAL" | "REJECTED";
export type GovernanceEscalationLevel = "NONE" | "OPERATOR" | "GOVERNANCE" | "CONSTITUTIONAL" | "EXECUTIVE" | "MULTI_STAGE";

export type GovernanceValidationStatus =
  | "COMPLIANT"
  | "COMPLIANT_WITH_APPROVAL"
  | "REQUIRES_OPERATOR_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_EXECUTIVE_REVIEW"
  | "POLICY_CONFLICT"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type GovernanceAdaptationFailure =
  | "POLICIES_UNRESOLVED"
  | "RULES_MISSING"
  | "RULE_FAILED"
  | "POLICY_CONFLICT_DETECTED"
  | "DEPENDENCY_UNVERIFIABLE"
  | "APPROVALS_UNDETERMINED"
  | "OBLIGATIONS_INCOMPLETE"
  | "UNAUTHORIZED_EXCEPTION"
  | "CONSTITUTIONAL_EXCEPTION"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "OPERATOR_AUTHORITY_REMOVAL_DETECTED"
  | "REPLAY_EVIDENCE_UNAVAILABLE"
  | "AUDIT_EVIDENCE_INCOMPLETE"
  | "LINEAGE_MISSING"
  | "EVIDENCE_INSUFFICIENT"
  | "INTEGRITY_HASH_FAILED"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_RECORDING_FAILED"
  | "NONDETERMINISTIC_VALIDATION"
  | "FAIL_OPEN_BEHAVIOR";

export type GovernanceAdaptationScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "POLICY_CONFLICT"
  | "RESTRICTED_PROPOSAL"
  | "EXECUTIVE_REQUIRED"
  | "AUTHORIZED_EXCEPTION"
  | "UNAUTHORIZED_EXCEPTION"
  | "CONSTITUTIONAL_EXCEPTION"
  | "POLICY_DISCOVERY_FAILURE"
  | "RULE_DISCOVERY_FAILURE"
  | "DEPENDENCY_UNVERIFIABLE"
  | "APPROVAL_UNDETERMINED"
  | "OBLIGATION_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_FAILURE";

export type GovernancePolicyAssessment = Readonly<{
  policy_id: string;
  category: GovernanceAdaptationPolicyCategory;
  version: string;
  applicable: boolean;
  passed: boolean;
  explanation: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceRuleEvaluation = Readonly<{
  rule_id: string;
  category: GovernanceRuleCategory;
  status: GovernanceRuleStatus;
  explanation: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceDependencyResult = Readonly<{
  dependency_id: string;
  status: GovernanceDependencyStatus;
  explanation: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceApprovalRequirement = Readonly<{
  approval_id: string;
  approver_role: string;
  sequence: number;
  mandatory: true;
  justification: string;
  integrity_hash: string;
}>;

export type GovernanceObligation = Readonly<{
  obligation_id: string;
  obligation_type: string;
  rationale: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceExceptionResult = Readonly<{
  exception_id: string;
  requested: boolean;
  decision: GovernanceExceptionDecision;
  required_approvals: readonly string[];
  explanation: string;
  integrity_hash: string;
}>;

export type GovernanceEscalationRequirement = Readonly<{
  escalation_id: string;
  level: GovernanceEscalationLevel;
  required_reviewers: readonly string[];
  rationale: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  validation_id: string;
  proposal_id: string;
  tenant_id: string;
  final_status: GovernanceValidationStatus;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  recorded_at: string;
  integrity_hash: string;
}>;

export type GovernanceValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  policy_set_version: string;
  evaluated_policies: readonly GovernancePolicyAssessment[];
  rule_results: readonly GovernanceRuleEvaluation[];
  dependency_results: readonly GovernanceDependencyResult[];
  required_approvals: readonly GovernanceApprovalRequirement[];
  governance_obligations: readonly GovernanceObligation[];
  exception_results: readonly GovernanceExceptionResult[];
  escalation_requirements: readonly GovernanceEscalationRequirement[];
  governance_status: GovernanceValidationStatus;
  governance_reasoning: readonly string[];
  failures: readonly GovernanceAdaptationFailure[];
  evidence_references: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationApiSurface = Readonly<{
  api_id: string;
  validate_proposal: "POST /governance-adaptation-validator/validate";
  retrieve_policies: "POST /governance-adaptation-validator/policies";
  retrieve_rules: "POST /governance-adaptation-validator/rules";
  retrieve_dependencies: "POST /governance-adaptation-validator/dependencies";
  retrieve_approvals: "POST /governance-adaptation-validator/approvals";
  retrieve_obligations: "POST /governance-adaptation-validator/obligations";
  retrieve_exceptions: "POST /governance-adaptation-validator/exceptions";
  retrieve_escalations: "POST /governance-adaptation-validator/escalations";
  retrieve_ledger: "POST /governance-adaptation-validator/ledger";
  replay_validation: "POST /governance-adaptation-validator/replay";
  retrieve_contract: "GET /governance-adaptation-validator/contract";
  execution_approval_supported: false;
  governance_bypass_supported: false;
  fail_open_supported: false;
  mutation_supported: false;
  integrity_hash: string;
}>;

export type GovernanceAdaptationValidatorInput = Readonly<{
  scenario?: GovernanceAdaptationScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
}>;

export type GovernanceAdaptationValidatorResult = Readonly<{
  governance_adaptation_validator_version: "governance-adaptation-validator/v1";
  api_surface: GovernanceAdaptationApiSurface;
  validation: GovernanceValidation;
  ledger_entry: GovernanceAdaptationLedgerEntry;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: boolean;
  advisory_only: true;
  operator_controlled: true;
  fail_closed: boolean;
  tenant_isolated: boolean;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationValidatorFoundation = Readonly<{
  governance_adaptation_validator_version: "governance-adaptation-validator/v1";
  api_surface: GovernanceAdaptationApiSurface;
  result: GovernanceAdaptationValidatorResult;
}>;
