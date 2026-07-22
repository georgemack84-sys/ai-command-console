import type { CertificationFrameworkResult } from "@/types/decision-certification-framework";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type FoundationSchemaScope =
  | "DECISION_ORCHESTRATION_CONTRACT"
  | "DECISION_CANDIDATE_SCHEMA"
  | "DECISION_CONTEXT_SCHEMA"
  | "DEPENDENCY_GRAPH_SCHEMA"
  | "PRIORITY_MODEL"
  | "GOVERNANCE_CONTRACT"
  | "DECISION_PACKAGE_SCHEMA"
  | "WORKFLOW_SCHEMA"
  | "REPLAY_SCHEMA";

export type FoundationCertificationCheck =
  | "CONTRACT_COMPLETENESS"
  | "REQUIRED_FIELDS"
  | "IDENTITY_UNIQUENESS"
  | "LIFECYCLE_COMPLETENESS"
  | "RELATIONSHIP_VALIDITY"
  | "DEPENDENCY_MAPPING"
  | "GOVERNANCE_METADATA"
  | "CONSTITUTIONAL_METADATA"
  | "AUTHORITY_METADATA"
  | "REPLAY_METADATA"
  | "INTEGRITY_METADATA"
  | "TENANT_METADATA"
  | "VERSION_IDENTIFIER"
  | "BACKWARD_COMPATIBILITY"
  | "FORWARD_COMPATIBILITY"
  | "MIGRATION_MAPPING"
  | "DETERMINISTIC_VALIDATION";

export type SchemaCertificationState = "PASS" | "FAIL";
export type SchemaCompatibilityState = "COMPATIBLE" | "INCOMPATIBLE";

export type FoundationSchemaCertificationFailure =
  | "MISSING_REQUIRED_SCHEMA"
  | "INVALID_CONTRACT_DEFINITION"
  | "INCOMPLETE_REQUIRED_FIELDS"
  | "DUPLICATE_IDENTITIES"
  | "CONFLICTING_DEFINITIONS"
  | "INVALID_LIFECYCLE"
  | "BROKEN_REFERENCES"
  | "MISSING_REPLAY_METADATA"
  | "MISSING_GOVERNANCE_METADATA"
  | "MISSING_CONSTITUTIONAL_METADATA"
  | "MISSING_AUTHORITY_METADATA"
  | "TENANT_METADATA_MISSING"
  | "VERSION_INCOMPATIBILITY"
  | "MIGRATION_INCONSISTENCY"
  | "REPLAY_INCONSISTENCY"
  | "NONDETERMINISTIC_VALIDATION"
  | "SCHEMA_AMBIGUITY"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_VALIDATION_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type FoundationSchemaValidationRecord = Readonly<{
  validation_id: string;
  schema_scope: FoundationSchemaScope;
  tenant_id: string;
  mission_id: string;
  schema_ref: string;
  schema_version: string;
  required_fields: readonly string[];
  validated_checks: readonly FoundationCertificationCheck[];
  validation_state: SchemaCertificationState;
  governance_metadata_ref: string;
  constitutional_metadata_ref: string;
  authority_metadata_ref: string;
  replay_metadata_ref: string;
  tenant_metadata_ref: string;
  certification_ref: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ContractValidationReport = Readonly<{
  contract_report_id: string;
  tenant_id: string;
  mission_id: string;
  validated_contracts: readonly FoundationSchemaScope[];
  required_attributes_complete: boolean;
  identity_unique: boolean;
  lifecycle_complete: boolean;
  state_consistent: boolean;
  replay_compatible: boolean;
  governance_compatible: boolean;
  authority_metadata_complete: boolean;
  certification_metadata_complete: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type VersionCompatibilityReport = Readonly<{
  version_report_id: string;
  tenant_id: string;
  mission_id: string;
  compatibility_matrix: Readonly<Record<FoundationSchemaScope, SchemaCompatibilityState>>;
  backward_compatible: boolean;
  forward_compatible: boolean;
  deprecated_fields: readonly string[];
  migration_mappings: readonly string[];
  upgrade_safe: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type CrossSchemaConsistencyReport = Readonly<{
  consistency_report_id: string;
  tenant_id: string;
  mission_id: string;
  identity_consistent: boolean;
  shared_fields_consistent: boolean;
  enumerations_consistent: boolean;
  references_valid: boolean;
  common_metadata_complete: boolean;
  governance_consistent: boolean;
  replay_consistent: boolean;
  authority_consistent: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DependencyValidationReport = Readonly<{
  dependency_report_id: string;
  tenant_id: string;
  mission_id: string;
  required_dependencies: readonly string[];
  optional_dependencies: readonly string[];
  circular_references_detected: boolean;
  missing_references: readonly string[];
  invalid_references: readonly string[];
  dependency_order: readonly FoundationSchemaScope[];
  shared_contracts: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type FoundationCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  schema_evidence_refs: readonly string[];
  contract_evidence_refs: readonly string[];
  version_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type FoundationCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  validation_scope: readonly FoundationSchemaScope[];
  certified_schemas: readonly string[];
  certified_contracts: readonly string[];
  version_compatibility_assessment: SchemaCompatibilityState;
  cross_schema_consistency: SchemaCertificationState;
  dependency_validation: SchemaCertificationState;
  replay_validation: SchemaCertificationState;
  integrity_verification: SchemaCertificationState;
  failure_analysis: readonly FoundationSchemaCertificationFailure[];
  certification_decision: SchemaCertificationState;
  production_readiness: "READY" | "BLOCKED";
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type FoundationCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "SCHEMA_VALIDATED" | "CONTRACT_VALIDATED" | "VERSION_COMPATIBILITY_VERIFIED" | "CONSISTENCY_VERIFIED" | "DEPENDENCY_VALIDATED" | "FOUNDATION_CERTIFIED" | "FOUNDATION_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: SchemaCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type FoundationSchemaCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  required_schemas_present: boolean;
  contracts_valid: boolean;
  required_fields_complete: boolean;
  identities_unique: boolean;
  definitions_consistent: boolean;
  lifecycle_valid: boolean;
  references_valid: boolean;
  replay_metadata_complete: boolean;
  governance_metadata_complete: boolean;
  constitutional_metadata_complete: boolean;
  authority_metadata_complete: boolean;
  tenant_metadata_complete: boolean;
  version_compatible: boolean;
  migrations_consistent: boolean;
  replay_consistent: boolean;
  deterministic_validation: boolean;
  schema_unambiguous: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly FoundationSchemaCertificationFailure[];
  integrity_hash: string;
}>;

export type FoundationSchemaCertificationInput = Readonly<{
  certification_framework?: CertificationFrameworkResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_SCHEMA"
    | "INVALID_CONTRACT"
    | "INCOMPLETE_FIELDS"
    | "DUPLICATE_IDENTITIES"
    | "CONFLICTING_DEFINITIONS"
    | "INVALID_LIFECYCLE"
    | "BROKEN_REFERENCES"
    | "MISSING_REPLAY_METADATA"
    | "MISSING_GOVERNANCE_METADATA"
    | "MISSING_CONSTITUTIONAL_METADATA"
    | "MISSING_AUTHORITY_METADATA"
    | "MISSING_TENANT_METADATA"
    | "VERSION_INCOMPATIBILITY"
    | "MIGRATION_INCONSISTENCY"
    | "REPLAY_INCONSISTENCY"
    | "NONDETERMINISTIC_VALIDATION"
    | "SCHEMA_AMBIGUITY"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type FoundationSchemaCertificationResult = Readonly<{
  certification_version: "decision-foundation-schema-certification/v1";
  certification_framework: CertificationFrameworkResult;
  schema_validations: readonly FoundationSchemaValidationRecord[];
  contract_report: ContractValidationReport;
  version_report: VersionCompatibilityReport;
  consistency_report: CrossSchemaConsistencyReport;
  dependency_report: DependencyValidationReport;
  evidence_package: FoundationCertificationEvidencePackage;
  foundation_report: FoundationCertificationReport;
  foundation_ledger: readonly FoundationCertificationLedgerEntry[];
  validation: FoundationSchemaCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_schemas_or_contracts: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type FoundationSchemaCertificationFoundation = Readonly<{
  certification_version: "decision-foundation-schema-certification/v1";
  scopes: readonly FoundationSchemaScope[];
  checks: readonly FoundationCertificationCheck[];
  result: FoundationSchemaCertificationResult;
}>;
