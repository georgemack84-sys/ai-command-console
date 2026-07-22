export type GovernanceEnforcementStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "DEFERRED" | "EXPIRED";
export type GovernanceEnforcementFailure =
  | "LIFECYCLE_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "CONSTITUTIONAL_VIOLATION"
  | "CONSTITUTIONAL_PRECEDENCE_BROKEN"
  | "CONSTITUTIONAL_REPLAY_FAILED"
  | "GOVERNANCE_BYPASS"
  | "GOVERNANCE_WORKFLOW_INVALID"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "POLICY_VIOLATION"
  | "POLICY_CONFLICT_UNRESOLVED"
  | "QUALIFICATION_BYPASS"
  | "LIFECYCLE_POLICY_BYPASS"
  | "SECURITY_POLICY_FAILURE"
  | "ADVISORY_ONLY_VIOLATION"
  | "HUMAN_SUPREMACY_VIOLATION"
  | "CAPABILITY_CEILING_BREACH"
  | "AUTHORITY_ESCALATION"
  | "SELF_CERTIFICATION_ATTEMPT"
  | "HUMAN_APPROVAL_MISSING"
  | "APPROVAL_REPLAY_FAILED"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_INSUFFICIENT"
  | "LINEAGE_INCOMPLETE"
  | "PROVENANCE_INVALID"
  | "CONFIDENCE_NOT_QUALIFIED"
  | "LEDGER_MUTATION"
  | "AUDIT_INCOMPLETE"
  | "ACCOUNTABILITY_GAP"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_ISOLATION_BREACH"
  | "UNAUTHORIZED_PERSISTENCE"
  | "UNAUTHORIZED_MUTATION"
  | "OBSERVABILITY_INCOMPLETE";
export type GovernanceEnforcementScenario = "BASELINE" | GovernanceEnforcementFailure;

export type ConstitutionalEnforcementContract = Readonly<{
  contract_id: string;
  constitution_highest_precedence: boolean;
  validation_before_persistence: boolean;
  violation_terminates_processing: boolean;
  reproducible_decisions: boolean;
  fail_closed_default: boolean;
  immutable_constitutional_integrity: boolean;
  integrity_hash: string;
}>;

export type GovernanceValidationReport = Readonly<{
  report_id: string;
  governance_approved: boolean;
  workflow_valid: boolean;
  lineage_complete: boolean;
  replay_validated: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PolicyValidationReport = Readonly<{
  report_id: string;
  retention_policy_valid: boolean;
  qualification_policy_valid: boolean;
  visibility_policy_valid: boolean;
  classification_policy_valid: boolean;
  security_policy_valid: boolean;
  lifecycle_policy_valid: boolean;
  conflicts_resolved: boolean;
  integrity_hash: string;
}>;

export type AuthorityBoundaryReport = Readonly<{
  report_id: string;
  advisory_only_enforced: boolean;
  operator_supremacy_enforced: boolean;
  human_approval_enforced: boolean;
  capability_ceiling_valid: boolean;
  authority_escalation_blocked: boolean;
  self_certification_blocked: boolean;
  integrity_hash: string;
}>;

export type HumanApprovalRecord = Readonly<{
  approval_id: string;
  state: ApprovalState;
  required_for: readonly string[];
  operator_id: string;
  replay_ref: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayEvidenceComplianceReport = Readonly<{
  report_id: string;
  deterministic_replay: boolean;
  lineage_replay: boolean;
  governance_replay: boolean;
  constitutional_replay: boolean;
  approval_replay: boolean;
  evidence_complete: boolean;
  provenance_valid: boolean;
  confidence_sufficient: boolean;
  certification_refs_present: boolean;
  integrity_hash: string;
}>;

export type GovernanceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "CONSTITUTION_VALIDATED" | "GOVERNANCE_APPROVED" | "POLICY_VALIDATED" | "AUTHORITY_ENFORCED" | "HUMAN_APPROVED" | "ADVISORY_VALIDATED" | "REPLAY_EVIDENCE_VALIDATED" | "AUDIT_RECORDED" | "CERTIFICATION_RECORDED";
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type GovernanceObservability = Readonly<{
  observability_id: string;
  governance_compliance_rate: number;
  constitutional_validation_success: number;
  approval_latency_ms: number;
  replay_success_rate: number;
  audit_completeness: number;
  evidence_sufficiency_score: number;
  authority_violation_count: number;
  policy_compliance_rate: number;
  governance_throughput: number;
  certification_readiness: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type GovernanceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: GovernanceEnforcementFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceCertification = Readonly<{
  certification_id: string;
  status: GovernanceEnforcementStatus;
  persistent_capabilities_enabled: boolean;
  failures: readonly GovernanceEnforcementFailure[];
  tests: readonly GovernanceCertificationTest[];
  integrity_hash: string;
}>;

export type GovernanceEnforcementInput = Readonly<{ scenario?: GovernanceEnforcementScenario; tenant_id?: string }>;

export type GovernanceEnforcementResult = Readonly<{
  enforcement_version: "governance-constitutional-enforcement/v11.9";
  enforcement_identifier: "GovernanceConstitutionalEnforcement";
  lifecycle_certified: boolean;
  constitutional_contract: ConstitutionalEnforcementContract;
  governance: GovernanceValidationReport;
  policy: PolicyValidationReport;
  authority: AuthorityBoundaryReport;
  human_approval: HumanApprovalRecord;
  replay_evidence: ReplayEvidenceComplianceReport;
  ledger: readonly GovernanceLedgerEntry[];
  observability: GovernanceObservability;
  certification: GovernanceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceEnforcementValidation = Readonly<{
  enforcement_id: string | null;
  valid: boolean;
  status: GovernanceEnforcementStatus;
  persistent_capabilities_enabled: boolean;
  failures: readonly GovernanceEnforcementFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type GovernanceEnforcementContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "governance-constitutional-enforcement/v11.9";
    constitution_supersedes_policy: true;
    human_authority_delegated: false;
    intelligence_advisory_only: true;
    fail_closed_default: true;
    governance_bypass_supported: false;
  }>;
  result: GovernanceEnforcementResult;
  validation: GovernanceEnforcementValidation;
  observability: GovernanceObservability;
}>;
