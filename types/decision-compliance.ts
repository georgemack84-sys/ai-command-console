import type { AuthorityBoundaryRecord } from "@/types/decision-authority-boundary";
import type { DecisionType } from "@/types/decision-schema";

export type ComplianceState = "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "NON_COMPLIANT" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_VIOLATION";
export type ComplianceValidationStatus = "VALID" | "FAILED_CLOSED";
export type PolicyType = "GOVERNANCE" | "MISSION" | "AUTHORITY" | "CERTIFICATION";

export type GovernanceReferenceContract = Readonly<{
  governance_reference_id: string;
  tenant_id: string;
  mission_id: string;
  policy_id: string;
  policy_version: string;
  policy_category: PolicyType;
  governance_scope: string;
  compliance_status: "COMPLIANT";
  authority_requirements: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  validated_at: string;
}>;

export type ConstitutionalReferenceContract = Readonly<{
  constitutional_reference_id: string;
  tenant_id: string;
  mission_id: string;
  constitutional_rule_id: string;
  constitutional_version: string;
  constitutional_scope: string;
  validation_status: "COMPLIANT";
  authority_constraints: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  validated_at: string;
}>;

export type PolicyMappingRecord = Readonly<{
  mapping_id: string;
  orchestration_id: string;
  policy_id: string;
  policy_version: string;
  policy_type: PolicyType;
  applicability_reason: string;
  mapping_status: "APPLICABLE";
  validated_at: string;
  integrity_hash: string;
}>;

export type ConstitutionalMappingRecord = Readonly<{
  mapping_id: string;
  orchestration_id: string;
  constitutional_rule_id: string;
  constitutional_version: string;
  applicability_reason: string;
  validation_status: "APPLICABLE";
  integrity_hash: string;
}>;

export type ComplianceMetadata = Readonly<{
  compliance_id: string;
  orchestration_id: string;
  governance_status: ComplianceState;
  constitutional_status: ComplianceState;
  authority_status: ComplianceState;
  evaluated_policies: readonly string[];
  evaluated_constitutional_rules: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  evaluated_at: string;
}>;

export type ComplianceAuditRecord = Readonly<{
  audit_id: string;
  compliance_id: string;
  orchestration_id: string;
  compliance_state: ComplianceState;
  governance_reference_ids: readonly string[];
  constitutional_reference_ids: readonly string[];
  policy_mapping_ids: readonly string[];
  constitutional_mapping_ids: readonly string[];
  authority_id: string;
  append_only: true;
  advisory_only: true;
  integrity_hash: string;
  recorded_at: string;
}>;

export type ComplianceEvaluation = Readonly<{
  compliance_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: DecisionType;
  governance_references: readonly GovernanceReferenceContract[];
  constitutional_references: readonly ConstitutionalReferenceContract[];
  policy_mappings: readonly PolicyMappingRecord[];
  constitutional_mappings: readonly ConstitutionalMappingRecord[];
  authority_record: AuthorityBoundaryRecord;
  metadata: ComplianceMetadata;
  audit_record: ComplianceAuditRecord;
  compliance_state: ComplianceState;
  failures: readonly ComplianceFailure[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type ComplianceFailure =
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "POLICY_VERSION_UNSUPPORTED"
  | "CONSTITUTIONAL_RULE_MISSING"
  | "CONSTITUTIONAL_VERSION_UNSUPPORTED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "NONDETERMINISTIC_EVALUATION";

export type ComplianceValidationResult = Readonly<{
  validation_status: ComplianceValidationStatus;
  compliance_state: ComplianceState;
  compliance_id: string;
  failures: readonly ComplianceFailure[];
  checks: Readonly<{
    governance_references_present: boolean;
    constitutional_references_present: boolean;
    policy_mapping_complete: boolean;
    constitutional_mapping_complete: boolean;
    authority_verified: boolean;
    replay_complete: boolean;
    lineage_intact: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
    deterministic: boolean;
  }>;
}>;

export type ComplianceReplayResult = Readonly<{
  compliance_id: string;
  replay_valid: boolean;
  reconstructed_state: ComplianceState;
  reconstructed_policy_mappings: readonly string[];
  reconstructed_constitutional_mappings: readonly string[];
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly ComplianceFailure[];
}>;

export type DecisionComplianceInput = Readonly<{
  authority_record?: AuthorityBoundaryRecord;
  governance_references?: readonly GovernanceReferenceContract[];
  constitutional_references?: readonly ConstitutionalReferenceContract[];
  scenario?: "BASELINE" | "MISSING_GOVERNANCE" | "MISSING_CONSTITUTIONAL" | "UNSUPPORTED_POLICY" | "UNSUPPORTED_CONSTITUTION" | "AUTHORITY_VIOLATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "REPLAY_MISSING" | "LINEAGE_BROKEN" | "TENANT_LEAK" | "INTEGRITY_MISMATCH" | "NONDETERMINISTIC";
}>;

export type ComplianceObservability = Readonly<{
  governance_validation_count: number;
  constitutional_validation_count: number;
  compliance_outcomes: Readonly<Record<string, number>>;
  policy_mapping_frequency: Readonly<Record<string, number>>;
  authority_verification_failures: number;
  governance_violations: number;
  constitutional_violations: number;
  replay_mismatches: number;
  compliance_latency_ms: number;
  policy_version_usage: Readonly<Record<string, number>>;
}>;
