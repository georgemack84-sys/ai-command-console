import type { ExecutionBoundaryPackage } from "@/types/execution-boundary-engine";

export type GovernancePolicyState = "RECEIVED" | "DISCOVERING" | "VALIDATING" | "AUTHORIZED" | "RESTRICTED" | "PAUSED" | "ESCALATED" | "BLOCKED" | "FAILED" | "COMPLETED";
export type GovernancePolicyDecision = "ALLOW" | "ALLOW_WITH_RESTRICTIONS" | "CHECKPOINT" | "PAUSE" | "ESCALATE" | "BLOCK" | "FAIL_SAFE";
export type GovernancePolicyCategory = "CONSTITUTIONAL" | "GOVERNANCE" | "POLICY" | "REGULATORY" | "MISSION" | "RUNTIME";

export type GovernancePolicyScenario =
  | "BASELINE"
  | "MINOR_POLICY_CONFLICT"
  | "GOVERNANCE_UNCERTAINTY"
  | "GOVERNANCE_CONFLICT"
  | "CONFLICTING_OPERATOR_APPROVALS"
  | "REGULATORY_AMBIGUITY"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "POLICY_BYPASS"
  | "UNAUTHORIZED_POLICY_OVERRIDE"
  | "PROTECTED_RESOURCE_ACCESS"
  | "UNAUTHORIZED_EXECUTION"
  | "EXPIRED_APPROVALS"
  | "COMPLIANCE_FAILURE"
  | "MISSING_APPROVALS"
  | "RUNTIME_GOVERNANCE_DRIFT"
  | "INTEGRITY_FAILURE"
  | "MISSING_POLICY_REFERENCES"
  | "REPLAY_MISMATCH"
  | "LINEAGE_MISSING"
  | "TENANT_MISMATCH"
  | "EXECUTION_BOUNDARY_BLOCKED";

export type GovernancePolicyViolation =
  | "MINOR_POLICY_CONFLICT"
  | "GOVERNANCE_UNCERTAIN"
  | "GOVERNANCE_CONFLICT"
  | "CONFLICTING_OPERATOR_APPROVALS"
  | "REGULATORY_AMBIGUITY"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "POLICY_BYPASS"
  | "UNAUTHORIZED_POLICY_OVERRIDE"
  | "PROTECTED_RESOURCE_ACCESS"
  | "UNAUTHORIZED_EXECUTION"
  | "EXPIRED_APPROVAL"
  | "COMPLIANCE_FAILURE"
  | "MISSING_APPROVAL"
  | "RUNTIME_GOVERNANCE_DRIFT"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "POLICY_REFERENCE_MISSING"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "EXECUTION_BOUNDARY_NOT_AUTHORIZED";

export type GovernancePolicyEvaluation = Readonly<{
  evaluation_id: string;
  category: GovernancePolicyCategory;
  status: "PASS" | "FAIL";
  evaluated_rules: readonly string[];
  evaluated_references: readonly string[];
  detected_conflicts: readonly string[];
  detected_violations: readonly GovernancePolicyViolation[];
  explanation: string;
  integrity_hash: string;
}>;

export type GovernanceEnforcementContract = Readonly<{
  governance_enforcement_id: string;
  mission_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  governance_version: string;
  constitution_version: string;
  policy_versions: readonly string[];
  regulatory_versions: readonly string[];
  execution_state: string;
  governance_status: "VALID" | "UNCERTAIN" | "CONFLICT" | "INVALID";
  evaluated_rules: readonly string[];
  evaluated_policies: readonly string[];
  evaluated_constitution: readonly string[];
  evaluated_regulations: readonly string[];
  compliance_status: "COMPLIANT" | "NON_COMPLIANT" | "UNKNOWN";
  detected_conflicts: readonly string[];
  detected_violations: readonly GovernancePolicyViolation[];
  enforcement_decision: GovernancePolicyDecision;
  restrictions: readonly string[];
  operator_required: boolean;
  governance_review_required: boolean;
  confidence: number;
  explanation: string;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  integrity_hash: string;
}>;

export type GovernancePolicyEvidence = Readonly<{
  evidence_id: string;
  governance_rules_evaluated: readonly string[];
  policies_evaluated: readonly string[];
  constitutional_rules_evaluated: readonly string[];
  regulatory_rules_evaluated: readonly string[];
  conflict_analysis: readonly string[];
  compliance_analysis: readonly string[];
  enforcement_reasoning: string;
  restrictions_applied: readonly string[];
  detected_violations: readonly GovernancePolicyViolation[];
  operator_approvals: readonly string[];
  governance_approvals: readonly string[];
  confidence: number;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  truth_ledger_reference: string;
  integrity_hash: string;
}>;

export type GovernancePolicyLedgerEntry = Readonly<{
  ledger_entry_id: string;
  governance_enforcement_id: string;
  governance_evidence: string;
  policy_evidence: string;
  constitutional_evidence: string;
  compliance_evidence: string;
  violation_evidence: readonly GovernancePolicyViolation[];
  enforcement_decision: GovernancePolicyDecision;
  restriction_evidence: readonly string[];
  replay_references: readonly string[];
  append_only: true;
  ledger_hash: string;
}>;

export type GovernancePolicyReplayResult = Readonly<{
  replay_id: string;
  governance_enforcement_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_decision: GovernancePolicyDecision;
  reconstructed_contract_hash: string;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: GovernancePolicyViolation | null;
  replay_hash: string;
}>;

export type GovernancePolicyPackage = Readonly<{
  package_id: string;
  engine_version: "governance-policy-enforcement-engine/v8F.4";
  source_execution_boundary_package: ExecutionBoundaryPackage;
  enforcement_state: GovernancePolicyState;
  governance_enforcement: GovernanceEnforcementContract;
  evaluations: readonly GovernancePolicyEvaluation[];
  evidence: GovernancePolicyEvidence;
  ledger_entry: GovernancePolicyLedgerEntry;
  replay: GovernancePolicyReplayResult;
  policy_created: false;
  policy_modified: false;
  constitutional_rules_modified: false;
  package_hash: string;
}>;

export type GovernancePolicyVisibilitySurface = Readonly<{
  package_id: string;
  governance_status: string;
  policy_status: string;
  constitutional_status: string;
  compliance_status: string;
  evaluated_rules: readonly string[];
  applied_restrictions: readonly string[];
  detected_conflicts: readonly string[];
  violation_history: readonly GovernancePolicyViolation[];
  operator_approvals: readonly string[];
  governance_approvals: readonly string[];
  confidence_score: number;
  enforcement_reasoning: string;
  replay_status: "PASS" | "FAIL";
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type GovernancePolicyFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "governance-policy-enforcement-engine/v8F.4";
    states: readonly GovernancePolicyState[];
    decisions: readonly GovernancePolicyDecision[];
    categories: readonly GovernancePolicyCategory[];
  }>;
  package: GovernancePolicyPackage;
  visibility: GovernancePolicyVisibilitySurface;
}>;
