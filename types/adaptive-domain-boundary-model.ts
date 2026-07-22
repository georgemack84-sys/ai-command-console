import type { AdaptiveContractFoundationResult, AdaptiveDomain } from "@/types/adaptive-intelligence-contract-foundation";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveDomainClassification = "ALLOWED" | "RESTRICTED" | "PROHIBITED";
export type AdaptiveBoundaryOperation = "ANALYZE" | "SIMULATE" | "RECOMMEND" | "MUTATE" | "EXECUTE";
export type AdaptiveBoundaryDecision = "PASS" | "RESTRICT" | "REJECT";
export type AdaptiveBoundaryValidationState = "PASS" | "FAIL";

export type AdaptiveBoundaryCheck =
  | "CONTRACT_FOUNDATION"
  | "DOMAIN_REGISTRY"
  | "CLASSIFICATION"
  | "PERMISSION"
  | "GOVERNANCE"
  | "OPERATOR_REVIEW"
  | "REPLAY"
  | "CERTIFICATION"
  | "TENANT_ISOLATION"
  | "INHERITANCE"
  | "INTEGRITY"
  | "DEFAULT_DENY";

export type AdaptiveBoundaryFailure =
  | "CONTRACT_FOUNDATION_INVALID"
  | "UNKNOWN_DOMAIN"
  | "HIDDEN_ADAPTIVE_DOMAIN"
  | "UNAUTHORIZED_DOMAIN_CREATION"
  | "CLASSIFICATION_MISSING"
  | "PERMISSION_CLASSIFICATION_MISMATCH"
  | "GOVERNANCE_REQUIREMENTS_MISSING"
  | "OPERATOR_REVIEW_MISSING"
  | "REPLAY_REQUIREMENTS_MISSING"
  | "CERTIFICATION_REQUIREMENTS_MISSING"
  | "CONSTITUTIONAL_REFERENCE_INVALID"
  | "AUTHORITY_ESCALATION"
  | "TENANT_ISOLATION_BREACH"
  | "CROSS_TENANT_MEMORY_SHARING"
  | "PROHIBITED_RECOMMENDATION"
  | "PROHIBITED_MUTATION"
  | "EXECUTION_AUTHORITY_GRANTED"
  | "INHERITED_BOUNDARY_WEAKENED"
  | "BOUNDARY_REPLAY_MISMATCH"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_BOUNDARY_BEHAVIOR"
  | "AUTHORIZATION_FAILURE";

export type AdaptiveDomainDefinition = Readonly<{
  domain_id: string;
  domain_name: string;
  domain_category: AdaptiveDomain;
  classification: AdaptiveDomainClassification;
  analysis_allowed: boolean;
  recommendation_allowed: boolean;
  simulation_allowed: boolean;
  governance_review_required: boolean;
  operator_review_required: boolean;
  replay_required: true;
  certification_required: true;
  mutation_allowed: false;
  parent_domain: string;
  restriction_reason: string;
  constitutional_reference: string;
  governance_reference: string;
  integrity_hash: string;
}>;

export type AdaptiveDomainRestrictionRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  contract_id: string;
  domains: readonly AdaptiveDomainDefinition[];
  allowed_domain_ids: readonly string[];
  restricted_domain_ids: readonly string[];
  prohibited_domain_ids: readonly string[];
  append_only: true;
  default_decision: "REJECT";
  integrity_hash: string;
}>;

export type AdaptiveBoundaryRequest = Readonly<{
  request_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_domain: string;
  requested_operation: AdaptiveBoundaryOperation;
  supporting_evidence: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
}>;

export type AdaptiveBoundaryEnforcementResult = Readonly<{
  enforcement_id: string;
  tenant_id: string;
  contract_id: string;
  adaptive_domain: string;
  classification: AdaptiveDomainClassification | "UNKNOWN";
  requested_operation: AdaptiveBoundaryOperation;
  validation_result: AdaptiveBoundaryDecision;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  operator_review_required: boolean;
  reason: string;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryReplayModel = Readonly<{
  replay_model_id: string;
  tenant_id: string;
  contract_id: string;
  evaluated_domain: string;
  classification: AdaptiveDomainClassification | "UNKNOWN";
  validation_outcome: AdaptiveBoundaryDecision;
  supporting_evidence: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_reproducible: boolean;
  deterministic_reconstruction: boolean;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  contract_id: string;
  checks: readonly AdaptiveBoundaryCheck[];
  allowed_domains_valid: boolean;
  restricted_domains_valid: boolean;
  prohibited_domains_valid: boolean;
  default_deny_enforced: boolean;
  governance_inherited: boolean;
  replay_inherited: boolean;
  certification_inherited: boolean;
  operator_review_enforced: boolean;
  tenant_isolation_preserved: boolean;
  advisory_only_preserved: boolean;
  boundary_replay_verified: boolean;
  integrity_verified: boolean;
  failure_analysis: readonly AdaptiveBoundaryFailure[];
  certification_decision: AdaptiveBoundaryValidationState;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryLedgerEntry = Readonly<{
  boundary_event_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_domain: string;
  classification: AdaptiveDomainClassification | "UNKNOWN";
  requested_operation: AdaptiveBoundaryOperation;
  validation_result: AdaptiveBoundaryDecision;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  operator_review_required: boolean;
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  contract_foundation_valid: boolean;
  domain_registry_complete: boolean;
  classifications_valid: boolean;
  permissions_match_classification: boolean;
  governance_requirements_present: boolean;
  replay_requirements_present: boolean;
  certification_requirements_present: boolean;
  tenant_isolated: boolean;
  inheritance_enforced: boolean;
  default_deny_enforced: boolean;
  advisory_only: boolean;
  integrity_verified: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly AdaptiveBoundaryFailure[];
  integrity_hash: string;
}>;

export type AdaptiveBoundaryInput = Readonly<{
  contract_foundation?: AdaptiveContractFoundationResult;
  role?: VisibilityRole;
  operation?: AdaptiveBoundaryOperation;
  domain_id?: string;
  scenario?:
    | "BASELINE"
    | "CONTRACT_INVALID"
    | "UNKNOWN_DOMAIN"
    | "HIDDEN_DOMAIN"
    | "UNAUTHORIZED_DOMAIN_CREATION"
    | "CLASSIFICATION_MISSING"
    | "PERMISSION_MISMATCH"
    | "MISSING_GOVERNANCE"
    | "MISSING_OPERATOR_REVIEW"
    | "MISSING_REPLAY"
    | "MISSING_CERTIFICATION"
    | "INVALID_CONSTITUTION"
    | "AUTHORITY_ESCALATION"
    | "TENANT_BREACH"
    | "CROSS_TENANT_MEMORY"
    | "PROHIBITED_RECOMMENDATION"
    | "PROHIBITED_MUTATION"
    | "EXECUTION_AUTHORITY"
    | "INHERITANCE_WEAKENED"
    | "REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE";
}>;

export type AdaptiveBoundaryResult = Readonly<{
  boundary_version: "adaptive-domain-boundary-model/v1";
  contract_foundation: AdaptiveContractFoundationResult;
  registry: AdaptiveDomainRestrictionRegistry;
  request: AdaptiveBoundaryRequest;
  enforcement_result: AdaptiveBoundaryEnforcementResult;
  replay_model: AdaptiveBoundaryReplayModel;
  certification_report: AdaptiveBoundaryCertificationReport;
  boundary_ledger: readonly AdaptiveBoundaryLedgerEntry[];
  validation: AdaptiveBoundaryValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  permits_execution: false;
  mutates_domain_registry: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryFoundation = Readonly<{
  boundary_version: "adaptive-domain-boundary-model/v1";
  checks: readonly AdaptiveBoundaryCheck[];
  classifications: readonly AdaptiveDomainClassification[];
  result: AdaptiveBoundaryResult;
}>;
