export type ApplicationGovernanceOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationGovernanceCheckResult = "PASS" | "FAIL";
export type GovernancePathStep = "APPLICATION_REQUEST" | "APPLICATION_GOVERNANCE_BINDING" | "CAF_AUTHORITY_GATE" | "CAF_POLICY_GATE" | "CAF_SAFETY_GATE" | "APPROVAL_ROUTING" | "EXECUTION_DECISION";

export type ApplicationGovernanceFailure =
  | "P4_7_EVIDENCE_GOVERNANCE_INVALID"
  | "CCI_GOVERNANCE_SERVICES_INVALID"
  | "CCI_GOVERNANCE_REGISTRY_INVALID"
  | "CCI_EVIDENCE_SERVICES_INVALID"
  | "CCI_IDENTITY_SERVICES_INVALID"
  | "CCI_AUDIT_SERVICES_INVALID"
  | "CAF_AUTHORITY_GATE_INVALID"
  | "CAF_POLICY_GATE_INVALID"
  | "CAF_SAFETY_GATE_INVALID"
  | "CAF_AUTHORITY_MATRIX_INVALID"
  | "CAF_WARNING_FRAMEWORK_INVALID"
  | "CAF_GOVERNANCE_EVIDENCE_INVALID"
  | "PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID"
  | "CONSTITUTIONAL_BINDING_MISSING"
  | "GOVERNANCE_INHERITANCE_NON_DETERMINISTIC"
  | "AUTHORITY_INHERITANCE_INVALID"
  | "AUTHORITY_EXPANSION_ALLOWED"
  | "INDEPENDENT_GOVERNANCE_MODEL_DEFINED"
  | "GOVERNANCE_ENGINE_DUPLICATED"
  | "POLICY_ENGINE_DUPLICATED"
  | "SAFETY_ENGINE_DUPLICATED"
  | "AUTHORITY_EVALUATION_DUPLICATED"
  | "POLICY_EVALUATION_DUPLICATED"
  | "SAFETY_EVALUATION_DUPLICATED"
  | "EXECUTION_ADMISSION_ATTEMPTED"
  | "RUNTIME_GOVERNANCE_ATTEMPTED"
  | "CERTIFICATION_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "AUDIT_INFRASTRUCTURE_ATTEMPTED"
  | "GOVERNANCE_NOT_ATTACHED"
  | "GOVERNANCE_CONTRACT_INVALID"
  | "APPROVAL_ROUTING_NON_DETERMINISTIC"
  | "APPROVAL_LINEAGE_INCOMPLETE"
  | "CAF_AUTHORITY_GATE_NOT_BOUND"
  | "CAF_POLICY_GATE_NOT_BOUND"
  | "CAF_SAFETY_GATE_NOT_BOUND"
  | "POLICY_INHERITANCE_INVALID"
  | "SAFETY_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "COMPLIANCE_REPORT_MISSING"
  | "COMPLIANCE_RECORD_MISSING"
  | "CONSTITUTIONAL_GOVERNANCE_BYPASS_ALLOWED"
  | "CERTIFICATION_PRUNED";

export type ApplicationGovernanceScenario = "BASELINE" | ApplicationGovernanceFailure;
export type ApplicationGovernanceInput = Readonly<{ scenario?: ApplicationGovernanceScenario; tenant_id?: string }>;

export type ConstitutionalBindingModel = Readonly<{
  binding_id: string;
  application_id: string;
  authority_hierarchy: readonly string[];
  governance_sequence: readonly GovernancePathStep[];
  constitutional_inheritance: boolean;
  governance_inheritance: boolean;
  authority_inheritance: boolean;
  contracts_validated: boolean;
  deterministic: boolean;
  independent_governance_defined: boolean;
  integrity_hash: string;
}>;

export type AuthorityBindingRegistry = Readonly<{
  registry_id: string;
  inherited_authority_refs: readonly string[];
  authority_ceilings: readonly string[];
  tenant_restrictions: readonly string[];
  application_restrictions: readonly string[];
  authority_validation: boolean;
  authority_expansion_impossible: boolean;
  integrity_hash: string;
}>;

export type GovernanceBindingRegistry = Readonly<{
  registry_id: string;
  governance_contract_refs: readonly string[];
  governance_attachment_refs: readonly string[];
  governance_lifecycle_refs: readonly string[];
  governance_attached: boolean;
  governance_validated: boolean;
  duplicates_governance_engine: boolean;
  integrity_hash: string;
}>;

export type ApprovalRoutingRecord = Readonly<{
  routing_id: string;
  caf_authority_gate_ref: string;
  approval_delegation_refs: readonly string[];
  routing_rules: readonly string[];
  approval_lineage_refs: readonly string[];
  deterministic: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type PolicyComplianceRecord = Readonly<{
  compliance_id: string;
  caf_policy_gate_ref: string;
  policy_binding_refs: readonly string[];
  inherited_policy_refs: readonly string[];
  policy_evaluation_contract_refs: readonly string[];
  policies_inherited: boolean;
  validation_complete: boolean;
  duplicates_policy_engine: boolean;
  integrity_hash: string;
}>;

export type SafetyComplianceRecord = Readonly<{
  compliance_id: string;
  caf_safety_gate_ref: string;
  safety_binding_refs: readonly string[];
  safety_governance_refs: readonly string[];
  safety_evidence_refs: readonly string[];
  safety_enforcement_inherited: boolean;
  safety_lineage_complete: boolean;
  duplicates_safety_engine: boolean;
  integrity_hash: string;
}>;

export type GovernanceEvidence = Readonly<{
  evidence_id: string;
  authority_compliance_refs: readonly string[];
  policy_compliance_refs: readonly string[];
  safety_compliance_refs: readonly string[];
  approval_lineage_refs: readonly string[];
  governance_lineage_refs: readonly string[];
  reproducible: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ComplianceReport = Readonly<{
  report_id: string;
  compliance_record_id: string;
  inherited_authority_summary: string;
  policy_compliance_summary: string;
  safety_compliance_summary: string;
  approval_history_refs: readonly string[];
  governance_lineage_refs: readonly string[];
  reproducible: boolean;
  generated: boolean;
  integrity_hash: string;
}>;

export type ApplicationGovernanceCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationGovernanceOutcome;
  phase_ready: boolean;
  applications_constitutionally_bound: boolean;
  governance_inheritance_deterministic: boolean;
  authority_inheritance_validated: boolean;
  approval_routing_operational: boolean;
  caf_authority_gate_bound: boolean;
  caf_policy_gate_bound: boolean;
  caf_safety_gate_bound: boolean;
  governance_lineage_reproducible: boolean;
  compliance_evidence_complete: boolean;
  no_governance_bypass: boolean;
  no_authority_elevation: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly ApplicationGovernanceFailure[];
  integrity_hash: string;
}>;

export type ApplicationGovernanceBindingResult = Readonly<{
  phase_version: "application-governance-binding/v4.8";
  phase_identifier: "ApplicationGovernanceBinding";
  evidence_governance_ref: "application-evidence-source-governance/v4.7";
  cci_governance_services_ref: "Program 2 - CCI Governance Services";
  caf_authority_gate_ref: "Program 3 - CAF Authority Gate";
  caf_policy_gate_ref: "Program 3 - CAF Policy Gate";
  caf_safety_gate_ref: "Program 3 - CAF Safety Gate";
  constitutional_binding: ConstitutionalBindingModel;
  authority_binding: AuthorityBindingRegistry;
  governance_binding: GovernanceBindingRegistry;
  approval_routing: ApprovalRoutingRecord;
  policy_compliance: PolicyComplianceRecord;
  safety_compliance: SafetyComplianceRecord;
  governance_evidence: GovernanceEvidence;
  compliance_report: ComplianceReport;
  certification: ApplicationGovernanceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationGovernanceOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  binding_valid: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  approval_valid: boolean;
  policy_valid: boolean;
  safety_valid: boolean;
  evidence_valid: boolean;
  compliance_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationGovernanceFailure[];
  integrity_hash: string;
}>;

export type ApplicationGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-governance-binding/v4.8";
    owns_application_governance: true;
    owns_constitutional_binding: true;
    owns_authority_inheritance: true;
    owns_approval_routing: true;
    implements_governance_engines: false;
    implements_policy_engines: false;
    implements_safety_engines: false;
    performs_authority_evaluation: false;
    performs_policy_evaluation: false;
    performs_safety_evaluation: false;
    owns_runtime_governance: false;
    owns_certification: false;
    owns_evidence_storage: false;
  }>;
  result: ApplicationGovernanceBindingResult;
  validation: ApplicationGovernanceValidation;
}>;
