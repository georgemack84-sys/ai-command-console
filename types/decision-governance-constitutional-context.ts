import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";
import type { EvidenceDependencyContextPackage } from "@/types/decision-evidence-dependency-context";
import type { RiskConfidenceContextPackage } from "@/types/decision-risk-confidence-context";

export type GovernanceStatus = "Compliant" | "Conditionally Compliant" | "Review Required" | "Escalation Required" | "Non-Compliant";
export type ConstitutionalCompliance = "Compliant" | "Conditionally Compliant" | "Review Required" | "Non-Compliant";

export type GovernanceConstitutionalResolutionState =
  | "PENDING"
  | "POLICY_REPOSITORY_RESOLVED"
  | "ACTIVE_POLICIES_RESOLVED"
  | "APPLICABLE_RULES_RESOLVED"
  | "GOVERNANCE_EVALUATED"
  | "APPROVALS_RESOLVED"
  | "REVIEWS_RESOLVED"
  | "POLICY_CONFLICTS_DETECTED"
  | "GOVERNANCE_VALIDATED"
  | "CONSTITUTION_REPOSITORY_RESOLVED"
  | "PRINCIPLES_RESOLVED"
  | "CONSTITUTION_EVALUATED"
  | "COMPLIANCE_ASSESSED"
  | "CONSTRAINTS_RESOLVED"
  | "VIOLATIONS_DETECTED"
  | "CONSTITUTION_VALIDATED"
  | "PASSED"
  | "FAILED_GOVERNANCE"
  | "FAILED_CONSTITUTIONAL"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type GovernanceConstitutionalFailureReason =
  | "POLICY_REPOSITORY_UNAVAILABLE"
  | "APPLICABLE_POLICIES_UNRESOLVED"
  | "GOVERNANCE_EVALUATION_INCOMPLETE"
  | "GOVERNANCE_STATUS_UNDETERMINED"
  | "APPROVALS_UNRESOLVED"
  | "REVIEWS_UNRESOLVED"
  | "POLICY_CONFLICT_UNRESOLVED"
  | "CONSTITUTIONAL_PRINCIPLES_UNAVAILABLE"
  | "CONSTITUTIONAL_EVALUATION_INCOMPLETE"
  | "CONSTITUTIONAL_COMPLIANCE_UNDETERMINED"
  | "CONSTITUTIONAL_CONSTRAINTS_UNENFORCED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_INCOMPATIBLE"
  | "CROSS_TENANT_GOVERNANCE_REFERENCE"
  | "INTEGRITY_VERIFICATION_FAILED";

export type GovernancePolicy = Readonly<{
  policy_id: string;
  tenant_id: string;
  mission_id: string;
  policy_type: "ORGANIZATIONAL" | "MISSION" | "TENANT" | "SECURITY" | "RISK" | "APPROVAL" | "ESCALATION" | "OPERATIONAL";
  policy_version: string;
  precedence: number;
  applicable_rules: readonly string[];
  approval_requirements: readonly string[];
  review_requirements: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceEvaluation = Readonly<{
  policy_id: string;
  applicable: boolean;
  satisfied: boolean;
  exceptions: readonly string[];
  violations: readonly string[];
  recommendations: readonly string[];
  dependencies: readonly string[];
  rationale: string;
  integrity_hash: string;
}>;

export type PolicyConflict = Readonly<{
  conflict_id: string;
  policy_refs: readonly string[];
  conflict_type: "APPROVAL" | "SECURITY" | "OPERATIONAL" | "DIRECTIVE" | "PRECEDENCE";
  resolved: boolean;
  resolution_basis: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceExplainability = Readonly<{
  applicable_policy_rationale: readonly string[];
  evaluation_results: readonly string[];
  approval_rationale: readonly string[];
  review_rationale: readonly string[];
  conflict_reasoning: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalPrinciple = Readonly<{
  principle_id: string;
  principle_name: string;
  immutable: boolean;
  constraints: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalEvaluation = Readonly<{
  principle_id: string;
  applicable: boolean;
  compliant: boolean;
  supporting_evidence: readonly string[];
  validation_results: readonly string[];
  required_remediation: readonly string[];
  rationale: string;
  integrity_hash: string;
}>;

export type ConstitutionalExplainability = Readonly<{
  principles_applied: readonly string[];
  compliance_determination: string;
  constraint_enforcement: readonly string[];
  violation_rationale: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceContext = Readonly<{
  governance_context_id: string;
  decision_candidate_id: string;
  active_policies: readonly GovernancePolicy[];
  applicable_rules: readonly string[];
  governance_evaluations: readonly GovernanceEvaluation[];
  governance_status: GovernanceStatus;
  governance_approvals: readonly string[];
  required_reviews: readonly string[];
  policy_conflicts: readonly PolicyConflict[];
  governance_lineage: readonly string[];
  validation_state: GovernanceConstitutionalResolutionState;
  explainability: GovernanceExplainability;
  integrity_hash: string;
}>;

export type ConstitutionalContext = Readonly<{
  constitutional_context_id: string;
  decision_candidate_id: string;
  constitutional_principles: readonly ConstitutionalPrinciple[];
  constitutional_evaluations: readonly ConstitutionalEvaluation[];
  constitutional_compliance: ConstitutionalCompliance;
  constitutional_constraints: readonly string[];
  constitutional_violations: readonly string[];
  constitutional_lineage: readonly string[];
  validation_state: GovernanceConstitutionalResolutionState;
  explainability: ConstitutionalExplainability;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  evidence_dependency_package?: EvidenceDependencyContextPackage;
  risk_confidence_package?: RiskConfidenceContextPackage;
  resolver_version: "governance-constitutional-context-resolver/v1";
}>;

export type GovernanceConstitutionalValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: GovernanceConstitutionalResolutionState;
  failure_reason?: GovernanceConstitutionalFailureReason;
  failure_reasons: readonly GovernanceConstitutionalFailureReason[];
  checks: Readonly<{
    policies_identified: boolean;
    governance_evaluations_complete: boolean;
    governance_status_determined: boolean;
    approvals_resolved: boolean;
    reviews_resolved: boolean;
    policy_conflicts_resolved: boolean;
    principles_resolved: boolean;
    constitutional_evaluations_complete: boolean;
    compliance_determined: boolean;
    constraints_enforced: boolean;
    violations_absent: boolean;
    lineage_preserved: boolean;
    replay_compatible: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type GovernanceConstitutionalContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  governance_context: GovernanceContext;
  constitutional_context: ConstitutionalContext;
  governance_domain: DecisionContextDomain;
  constitutional_domain: DecisionContextDomain;
  validation: GovernanceConstitutionalValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: GovernanceConstitutionalResolutionState;
  failures: readonly GovernanceConstitutionalFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceConstitutionalObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  governance_failures: number;
  constitutional_failures: number;
  isolation_failures: number;
  integrity_failures: number;
  policy_conflict_count: number;
  constitutional_violation_count: number;
  replay_success_rate: number;
}>;
