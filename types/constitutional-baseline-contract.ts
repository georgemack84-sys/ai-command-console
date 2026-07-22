export type ConstitutionalInvariantCategory = "AUTHORITY" | "GOVERNANCE" | "DETERMINISM" | "REPLAY" | "INTEGRITY" | "VISIBILITY" | "ISOLATION" | "LEARNING" | "OPTIMIZATION" | "RECOVERY" | "CERTIFICATION" | "SECURITY" | "AUDITABILITY" | "EXPLAINABILITY";
export type ConstitutionalValidationType = "REQUIRED" | "OPTIONAL" | "CONDITIONAL" | "PROHIBITED" | "DERIVED" | "COMPUTED";
export type ConstitutionalBaselineScenario = "BASELINE" | "CONSTITUTIONAL_VERSION_MISMATCH" | "MISSING_INVARIANT" | "AUTHORITY_ESCALATION" | "GOVERNANCE_BYPASS" | "OPERATOR_BYPASS" | "NONDETERMINISTIC_EXECUTION" | "REPLAY_DIVERGENCE" | "INTEGRITY_CORRUPTION" | "TENANT_ISOLATION_VIOLATION" | "UNAUTHORIZED_LEARNING" | "UNAUTHORIZED_OPTIMIZATION" | "UNAUTHORIZED_RECOVERY" | "HIDDEN_EXECUTION" | "HIDDEN_STATE" | "CONSTITUTIONAL_MODIFICATION" | "MISSING_AUDIT_EVIDENCE" | "INCOMPLETE_REPLAY_LINEAGE" | "FAIL_OPEN_BEHAVIOR";
export type ConstitutionalBaselineFailure = "CONSTITUTIONAL_VERSION_MISMATCH" | "MISSING_INVARIANT_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "OPERATOR_BYPASS_DETECTED" | "NONDETERMINISTIC_EXECUTION_DETECTED" | "REPLAY_DIVERGENCE_DETECTED" | "INTEGRITY_CORRUPTION_DETECTED" | "TENANT_ISOLATION_VIOLATION_DETECTED" | "UNAUTHORIZED_LEARNING_DETECTED" | "UNAUTHORIZED_OPTIMIZATION_DETECTED" | "UNAUTHORIZED_RECOVERY_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "HIDDEN_STATE_DETECTED" | "CONSTITUTIONAL_MODIFICATION_DETECTED" | "AUDIT_EVIDENCE_MISSING" | "REPLAY_LINEAGE_INCOMPLETE" | "FAIL_OPEN_BEHAVIOR_DETECTED";

export type ConstitutionVersionDefinition = Readonly<{
  constitution_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  constitution_name: "CATA Constitutional Baseline";
  major_version: 8;
  minor_version: 101;
  effective_date: "1970-01-01T00:00:00.000Z";
  approval_reference: string;
  status: "CERTIFIED_BASELINE" | "BLOCKED";
  checksum: string;
  lineage_reference: string;
}>;

export type MissionScopeRecord = Readonly<{
  mission_scope_id: string;
  mission_type: string;
  authorized_capabilities: readonly string[];
  restricted_capabilities: readonly string[];
  mission_constraints: readonly string[];
  risk_threshold: number;
  operator_required_actions: readonly string[];
  escalation_rules: readonly string[];
}>;

export type ConstitutionalAuthorityModel = Readonly<{
  operator_authority: "SUPREME";
  governance_authority: "MANDATORY";
  agent_authority: "ADVISORY_ONLY";
  mission_authority: "BOUNDED";
  approval_chains: readonly string[];
  delegation_rules: readonly string[];
  authority_escalation_rules: readonly string[];
  authority_revocation_rules: readonly string[];
  emergency_authority_limits: readonly string[];
  autonomous_authority_creation_allowed: false;
  privilege_escalation_allowed: boolean;
}>;

export type ConstitutionalGovernanceRequirements = Readonly<{
  policy_validation_required: true;
  constitution_validation_required: true;
  approval_validation_required: true;
  risk_validation_required: true;
  compliance_validation_required: true;
  audit_validation_required: true;
  evidence_validation_required: true;
  certification_validation_required: true;
  governance_precedes_execution: true;
  governance_bypass_allowed: boolean;
  governance_evidence_immutable: true;
}>;

export type ConstitutionalInvariantRecord = Readonly<{
  invariant_id: string;
  invariant_name: string;
  category: ConstitutionalInvariantCategory;
  description: string;
  validation_rule: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mandatory: true;
  constitutional_reference: string;
  effective_version: "constitutional-baseline-contract/v8ALT.10.1";
  status: "ACTIVE" | "MISSING";
}>;

export type ConstitutionalComplianceSchema = Readonly<{
  schema_id: string;
  sections: Readonly<Record<"CONSTITUTION" | "AUTHORITY" | "GOVERNANCE" | "OPERATOR" | "DETERMINISM" | "REPLAY" | "INTEGRITY" | "ISOLATION" | "LEARNING" | "OPTIMIZATION" | "RECOVERY" | "CERTIFICATION", ConstitutionalValidationType>>;
  prohibited_operations: readonly string[];
  required_evidence: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalAuditRecord = Readonly<{
  audit_id: string;
  failure: ConstitutionalBaselineFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalBaselineContract = Readonly<{
  contract_id: string;
  version_definition: ConstitutionVersionDefinition;
  mission_scopes: readonly MissionScopeRecord[];
  authority_model: ConstitutionalAuthorityModel;
  governance_requirements: ConstitutionalGovernanceRequirements;
  invariant_registry: readonly ConstitutionalInvariantRecord[];
  compliance_schema: ConstitutionalComplianceSchema;
  audit_records: readonly ConstitutionalAuditRecord[];
  failures: readonly ConstitutionalBaselineFailure[];
  contract_only: true;
  execution_authority_granted: false;
  mission_outcome_modification_authorized: false;
  governance_modification_authorized: false;
  constitution_modification_authorized: false;
  fail_open_authorized: false;
  final_state: "CONSTITUTIONAL_BASELINE_DEFINED" | "CONSTITUTIONAL_BASELINE_BLOCKED";
  integrity_hash: string;
}>;

export type ConstitutionalBaselineValidationResult = Readonly<{
  contract_id: string;
  valid: boolean;
  version_valid: boolean;
  invariants_complete: boolean;
  authority_preserved: boolean;
  governance_enforced: boolean;
  operator_supremacy_preserved: boolean;
  deterministic: boolean;
  replay_fidelity_preserved: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  learning_restricted: boolean;
  optimization_restricted: boolean;
  recovery_restricted: boolean;
  hidden_execution_absent: boolean;
  hidden_state_absent: boolean;
  audit_evidence_complete: boolean;
  replay_lineage_complete: boolean;
  fail_closed: boolean;
  contract_only: true;
  execution_authority_granted: false;
  failures: readonly ConstitutionalBaselineFailure[];
  validation_hash: string;
}>;

export type ConstitutionalBaselineObservabilitySurface = Readonly<{
  contract_id: string;
  final_state: string;
  invariant_count: number;
  mission_scope_count: number;
  audit_count: number;
  failure_count: number;
  contract_only: true;
  execution_authority_granted: false;
  integrity_hash: string;
}>;

export type ConstitutionalBaselineInput = Readonly<{ scenario?: ConstitutionalBaselineScenario; contract?: ConstitutionalBaselineContract }>;

export type ConstitutionalBaselineContractBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "constitutional-baseline-contract/v8ALT.10.1";
    final_state: "CONSTITUTIONAL_BASELINE_READY";
    invariant_categories: readonly ConstitutionalInvariantCategory[];
    principles: readonly string[];
  }>;
  contract: ConstitutionalBaselineContract;
  validation: ConstitutionalBaselineValidationResult;
  observability: ConstitutionalBaselineObservabilitySurface;
}>;
