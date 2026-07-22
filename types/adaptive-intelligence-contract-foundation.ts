import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { FinalOrchestratorCertificationResult } from "@/types/decision-final-orchestrator-certification";

export type AdaptiveContractScope = "GLOBAL" | "TENANT" | "ORGANIZATION" | "MISSION" | "ENVIRONMENT";
export type AdaptiveContractLifecycleState = "CREATED" | "VALIDATED" | "UNDER_GOVERNANCE_REVIEW" | "UNDER_CERTIFICATION" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type AdaptiveContractVersionState = "DRAFT" | "UNDER_REVIEW" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type AdaptiveContractValidationState = "PASS" | "FAIL";

export type AdaptiveDomain =
  | "LEARNING_RULES"
  | "SIMULATION_RULES"
  | "RECOMMENDATION_RULES"
  | "CONFIDENCE_CALIBRATION"
  | "RISK_ADAPTATION"
  | "MEMORY_ADAPTATION"
  | "FORECAST_ADAPTATION";

export type AdaptiveContractCheck =
  | "SCHEMA_VALIDATION"
  | "IDENTITY_VALIDATION"
  | "VERSION_VALIDATION"
  | "SCOPE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "AUTHORITY_VALIDATION"
  | "CERTIFICATION_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "LIFECYCLE_VALIDATION"
  | "INHERITANCE_VALIDATION"
  | "SAFETY_VALIDATION";

export type AdaptiveContractFailure =
  | "FINAL_ORCHESTRATOR_CERTIFICATION_INVALID"
  | "DUPLICATE_CONTRACT_IDENTITY"
  | "INVALID_CONTRACT_VERSION"
  | "TENANT_SCOPE_MISSING"
  | "MISSION_SCOPE_MISSING"
  | "AUTHORITY_UNDEFINED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "AUTHORITY_REFERENCES_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "ADVISORY_ONLY_DISABLED"
  | "PROHIBITED_LEARNING_TARGETS_OMITTED"
  | "ROLLBACK_DISABLED"
  | "INTEGRITY_HASH_MISMATCH"
  | "LIFECYCLE_VIOLATION"
  | "CROSS_TENANT_INHERITANCE"
  | "INHERITED_RESTRICTION_WEAKENED"
  | "HIDDEN_PERMISSION"
  | "SELF_CERTIFICATION_ATTEMPTED"
  | "SELF_ACTIVATION_ATTEMPTED"
  | "EXECUTION_AUTHORITY_GRANTED"
  | "AUTHORIZATION_FAILURE";

export type AdaptiveContractVersion = Readonly<{
  major: number;
  minor: number;
  patch: number;
  certification_version: string;
  replay_version: string;
  version_label: string;
  version_state: AdaptiveContractVersionState;
}>;

export type AdaptiveContractAuthority = Readonly<{
  owning_authority: string;
  governance_authority: string;
  certification_authority: string;
  approving_authority: string;
  operator_authority: string;
  update_proposers: readonly string[];
  self_certification_allowed: false;
  self_activation_allowed: false;
}>;

export type AdaptiveIntelligenceContract = Readonly<{
  contract_id: string;
  contract_name: string;
  contract_version: AdaptiveContractVersion;
  tenant_id: string;
  mission_scope: readonly string[];
  tenant_scope: AdaptiveContractScope;
  contract_owner: string;
  contract_authority: AdaptiveContractAuthority;
  adaptive_domains_allowed: readonly AdaptiveDomain[];
  adaptive_domains_restricted: readonly AdaptiveDomain[];
  prohibited_learning_targets: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  authority_requirements: readonly string[];
  replay_required: true;
  simulation_required: true;
  certification_required: true;
  rollback_required: true;
  advisory_only: true;
  lifecycle_state: AdaptiveContractLifecycleState;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  certification_refs: readonly string[];
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type AdaptiveContractIdentityRecord = Readonly<{
  identity_record_id: string;
  contract_id: string;
  contract_name: string;
  version_label: string;
  owner: string;
  authority_level: string;
  tenant_id: string;
  mission_scope: readonly string[];
  created_at: string;
  immutable: boolean;
  unique_identity: boolean;
  integrity_hash: string;
}>;

export type AdaptiveContractReplayBinding = Readonly<{
  replay_binding_id: string;
  tenant_id: string;
  contract_id: string;
  replay_identifier: string;
  replay_version: string;
  replay_lineage: readonly string[];
  replay_refs: readonly string[];
  replay_integrity_verified: boolean;
  replay_timestamp: string;
  deterministic_reconstruction: boolean;
  integrity_hash: string;
}>;

export type AdaptiveContractCertificationMetadata = Readonly<{
  certification_id: string;
  contract_id: string;
  certification_version: string;
  certification_authority: string;
  certification_timestamp: string;
  certification_status: "CERTIFIED" | "BLOCKED";
  certification_evidence: readonly string[];
  certification_replay: readonly string[];
  certification_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveContractInheritanceRules = Readonly<{
  inheritance_id: string;
  contract_id: string;
  governance_requirements_inherited: boolean;
  constitutional_requirements_inherited: boolean;
  replay_requirements_inherited: boolean;
  authority_boundaries_inherited: boolean;
  advisory_only_inherited: boolean;
  certification_requirements_inherited: boolean;
  rollback_requirements_inherited: boolean;
  restrictions_weakened: false;
  cross_tenant_inheritance_allowed: false;
  integrity_hash: string;
}>;

export type AdaptiveContractValidationReport = Readonly<{
  validation_id: string;
  contract_id: string;
  tenant_id: string;
  checks: readonly AdaptiveContractCheck[];
  schema_valid: boolean;
  identity_valid: boolean;
  version_valid: boolean;
  scope_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  authority_valid: boolean;
  certification_valid: boolean;
  integrity_valid: boolean;
  lifecycle_valid: boolean;
  inheritance_valid: boolean;
  safety_valid: boolean;
  validation_state: AdaptiveContractValidationState;
  failures: readonly AdaptiveContractFailure[];
  integrity_hash: string;
}>;

export type AdaptiveContractLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  contract_id: string;
  event_type: "CONTRACT_CREATED" | "IDENTITY_REGISTERED" | "VERSION_VALIDATED" | "REPLAY_BOUND" | "GOVERNANCE_BOUND" | "CERTIFICATION_BOUND" | "CONTRACT_CERTIFIED" | "CONTRACT_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  validation_state: AdaptiveContractValidationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type AdaptiveContractValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  final_orchestrator_certification_valid: boolean;
  identity_unique: boolean;
  version_valid: boolean;
  tenant_scoped: boolean;
  mission_scoped: boolean;
  authority_defined: boolean;
  governance_bound: boolean;
  replay_bound: boolean;
  certification_bound: boolean;
  advisory_only: boolean;
  prohibited_targets_defined: boolean;
  rollback_enabled: boolean;
  lifecycle_valid: boolean;
  inheritance_enforced: boolean;
  security_boundaries_valid: boolean;
  integrity_verified: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly AdaptiveContractFailure[];
  integrity_hash: string;
}>;

export type AdaptiveContractFoundationInput = Readonly<{
  final_certification?: FinalOrchestratorCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "FINAL_CERTIFICATION_INVALID"
    | "DUPLICATE_IDENTITY"
    | "INVALID_VERSION"
    | "MISSING_TENANT"
    | "MISSING_MISSION"
    | "AUTHORITY_UNDEFINED"
    | "MISSING_GOVERNANCE"
    | "MISSING_CONSTITUTION"
    | "INCOMPLETE_AUTHORITY_REFS"
    | "MISSING_REPLAY"
    | "MISSING_CERTIFICATION"
    | "ADVISORY_DISABLED"
    | "MISSING_PROHIBITED_TARGETS"
    | "ROLLBACK_DISABLED"
    | "HASH_MISMATCH"
    | "LIFECYCLE_VIOLATION"
    | "CROSS_TENANT_INHERITANCE"
    | "RESTRICTION_WEAKENED"
    | "HIDDEN_PERMISSION"
    | "SELF_CERTIFICATION"
    | "SELF_ACTIVATION"
    | "EXECUTION_AUTHORITY"
    | "UNAUTHORIZED_ROLE";
}>;

export type AdaptiveContractFoundationResult = Readonly<{
  foundation_version: "adaptive-intelligence-contract-foundation/v1";
  final_certification: FinalOrchestratorCertificationResult;
  contract: AdaptiveIntelligenceContract;
  identity_record: AdaptiveContractIdentityRecord;
  replay_binding: AdaptiveContractReplayBinding;
  certification_metadata: AdaptiveContractCertificationMetadata;
  inheritance_rules: AdaptiveContractInheritanceRules;
  validation_report: AdaptiveContractValidationReport;
  contract_ledger: readonly AdaptiveContractLedgerEntry[];
  validation: AdaptiveContractValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  permits_adaptation: boolean;
  permits_execution: false;
  mutates_constitution: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveContractFoundation = Readonly<{
  foundation_version: "adaptive-intelligence-contract-foundation/v1";
  checks: readonly AdaptiveContractCheck[];
  allowed_domains: readonly AdaptiveDomain[];
  result: AdaptiveContractFoundationResult;
}>;
