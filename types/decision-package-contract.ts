import type { GovernanceDecisionCertificationGateResult } from "@/types/governance-constitutional-decision-certification-gate";

export type DecisionPackageLifecycleState =
  | "DRAFT"
  | "BUILDING"
  | "VALIDATING"
  | "VERIFIED"
  | "CERTIFIED"
  | "READY_FOR_PRESENTATION"
  | "PRESENTED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type DecisionPackageVersion = "operator-decision-package/v1";
export type DecisionPackageSchemaVersion = "operator-decision-package-schema/v1";
export type DecisionPackageGeneratorVersion = "decision-package-contract/v1";

export type PackageOption = Readonly<{
  option_id: string;
  label: string;
  summary: string;
  governance_notes: readonly string[];
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type PackageMetadata = Readonly<{
  package_id: string;
  package_version: DecisionPackageVersion;
  schema_version: DecisionPackageSchemaVersion;
  generated_timestamp: string;
  generator_version: DecisionPackageGeneratorVersion;
  orchestration_id: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type PackageLifecycleStateRecord = Readonly<{
  package_id: string;
  current_state: DecisionPackageLifecycleState;
  previous_state?: DecisionPackageLifecycleState;
  transition_timestamp: string;
  transition_reason: string;
  transitioned_by: string;
  integrity_hash: string;
}>;

export type OperatorDecisionPackage = Readonly<{
  package_id: string;
  package_version: DecisionPackageVersion;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  generated_timestamp: string;
  generated_by: string;
  recommended_option: PackageOption;
  alternative_options: readonly PackageOption[];
  rejected_options: readonly PackageOption[];
  rationale: string;
  evidence_summary: string;
  risk_summary: string;
  confidence_summary: string;
  forecast_summary: string;
  governance_summary: string;
  constitutional_summary: string;
  authority_summary: string;
  operator_required_action: "REVIEW_ONLY" | "APPROVE_REVIEW" | "REQUEST_MORE_EVIDENCE" | "ESCALATE_REVIEW";
  approval_requirements: readonly string[];
  rollback_guidance: string;
  recovery_guidance: string;
  replay_ref: string;
  lineage_ref: string;
  metadata: PackageMetadata;
  lifecycle: PackageLifecycleStateRecord;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageContractFailureReason =
  | "PACKAGE_ID_MISSING"
  | "SCHEMA_INVALID"
  | "REQUIRED_FIELD_MISSING"
  | "LIFECYCLE_INVALID"
  | "GOVERNANCE_SUMMARY_MISSING"
  | "CONSTITUTIONAL_SUMMARY_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "VERSION_INVALID"
  | "TENANT_MISMATCH"
  | "AUTHORITY_INFORMATION_MISSING"
  | "METADATA_INVALID"
  | "REPLAY_DIVERGENCE"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_PACKAGE_CONTRACT_ACCESS";

export type PackageValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  schema_valid: boolean;
  lifecycle_valid: boolean;
  integrity_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly DecisionPackageContractFailureReason[];
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type DecisionPackageSchemaRegistryEntry = Readonly<{
  schema_version: DecisionPackageSchemaVersion;
  package_version: DecisionPackageVersion;
  generator_version: DecisionPackageGeneratorVersion;
  required_fields: readonly string[];
  lifecycle_states: readonly DecisionPackageLifecycleState[];
  backward_compatible: true;
  destructive_changes_allowed: false;
  integrity_hash: string;
}>;

export type DecisionPackageContractInput = Readonly<{
  certification_result?: GovernanceDecisionCertificationGateResult;
  package?: OperatorDecisionPackage;
  lifecycle?: PackageLifecycleStateRecord;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type DecisionPackageContractResult = Readonly<{
  contract_status: "PASS" | "FAIL";
  fail_closed: boolean;
  certification_result: GovernanceDecisionCertificationGateResult;
  package: OperatorDecisionPackage;
  schema_registry: DecisionPackageSchemaRegistryEntry;
  validation: PackageValidationResult;
  replay_hash: string;
  failures: readonly DecisionPackageContractFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageContractReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  package_id: string;
  package_version: DecisionPackageVersion;
  schema_version: DecisionPackageSchemaVersion;
  lifecycle_state: DecisionPackageLifecycleState;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly DecisionPackageContractFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageContractObservability = Readonly<{
  packages_validated: number;
  validation_failures: number;
  schema_violations: number;
  lifecycle_violations: number;
  replay_completeness: number;
  integrity_failures: number;
  version_distribution: Readonly<Record<DecisionPackageVersion, number>>;
  lineage_completeness: number;
  package_generation_latency_ms: number;
}>;

export type DecisionPackageContractFoundation = Readonly<{
  contract_version: "decision-package-contract/v1";
  lifecycle_states: readonly DecisionPackageLifecycleState[];
  allowed_transitions: Readonly<Record<DecisionPackageLifecycleState, readonly DecisionPackageLifecycleState[]>>;
  schema_registry: DecisionPackageSchemaRegistryEntry;
  result: DecisionPackageContractResult;
  replay: DecisionPackageContractReplay;
  observability: DecisionPackageContractObservability;
}>;
