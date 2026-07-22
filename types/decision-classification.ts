import type { DecisionInput, DecisionType } from "@/types/decision-schema";

export type DecisionTaxonomyVersion = "decision-taxonomy/v9.1.3";
export type DecisionClassificationStatus = "ACTIVE" | "INACTIVE" | "DEPRECATED";
export type DecisionAuthorityLevel = "ADVISORY_ONLY";
export type DecisionClassificationValidationState = "VALID" | "FAILED_CLOSED";

export type DecisionBehavioralProfile = Readonly<{
  required_inputs: readonly string[];
  produces: readonly string[];
  required_evidence: readonly string[];
  required_governance_checks: readonly string[];
  required_constitutional_checks: readonly string[];
  replay_behavior: string;
  operator_approval_required: boolean;
  authority_boundaries: readonly string[];
  explainability_requirements: readonly string[];
  confidence_expectations: readonly string[];
  audit_requirements: readonly string[];
}>;

export type DecisionClassificationRecord = Readonly<{
  classification_id: string;
  category_name: DecisionType;
  category_description: string;
  behavioral_profile: DecisionBehavioralProfile;
  authority_level: DecisionAuthorityLevel;
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  replay_requirements: readonly string[];
  lineage_requirements: readonly string[];
  validation_profile: readonly string[];
  lifecycle_profile: readonly string[];
  version: DecisionTaxonomyVersion;
  status: DecisionClassificationStatus;
  created_at: string;
  integrity_hash: string;
}>;

export type DecisionClassificationResult = Readonly<{
  classification_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  primary_category: DecisionType;
  related_categories: readonly DecisionType[];
  taxonomy_version: DecisionTaxonomyVersion;
  record: DecisionClassificationRecord;
  inherited_guarantees: readonly string[];
  advisory_only: true;
  execution_authorized: false;
  governance_modification_authorized: false;
  constitutional_modification_authorized: false;
  operator_bypass_authorized: false;
  self_authorization_allowed: false;
  classification_hash: string;
}>;

export type DecisionClassificationFailure =
  | "DECISION_INPUT_INVALID"
  | "CATEGORY_UNDEFINED"
  | "CATEGORY_INACTIVE"
  | "DUPLICATE_PRIMARY_CLASSIFICATION"
  | "UNSUPPORTED_TAXONOMY_VERSION"
  | "BEHAVIORAL_PROFILE_MISSING"
  | "GOVERNANCE_PROFILE_MISSING"
  | "CONSTITUTIONAL_PROFILE_MISSING"
  | "REPLAY_PROFILE_MISSING"
  | "LINEAGE_PROFILE_MISSING"
  | "AUTHORITY_PROFILE_MISSING"
  | "CLASSIFICATION_AMBIGUITY"
  | "TENANT_ISOLATION_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "INTEGRITY_HASH_MISMATCH";

export type DecisionClassificationValidationResult = Readonly<{
  validation_state: DecisionClassificationValidationState;
  classification_id?: string;
  failures: readonly DecisionClassificationFailure[];
  checks: Readonly<{
    category_exists: boolean;
    category_supported: boolean;
    category_active: boolean;
    metadata_present: boolean;
    behavioral_profile_complete: boolean;
    governance_profile_assigned: boolean;
    constitutional_profile_assigned: boolean;
    replay_profile_assigned: boolean;
    lineage_profile_assigned: boolean;
    authority_profile_assigned: boolean;
    exactly_one_primary_category: boolean;
    tenant_isolated: boolean;
    advisory_only_enforced: boolean;
    integrity_valid: boolean;
  }>;
}>;

export type DecisionTaxonomyValidationResult = Readonly<{
  taxonomy_version: DecisionTaxonomyVersion;
  valid: boolean;
  category_count: number;
  failures: readonly DecisionClassificationFailure[];
}>;

export type DecisionClassificationObservability = Readonly<{
  classification_requests: number;
  category_distribution: Readonly<Record<string, number>>;
  validation_failures: number;
  undefined_category_attempts: number;
  replay_mismatches: number;
  taxonomy_version_usage: Readonly<Record<string, number>>;
  authority_violations: number;
  governance_validation_failures: number;
  constitutional_validation_failures: number;
}>;

export type DecisionClassificationInput = Readonly<{
  decision_input?: DecisionInput;
  category?: DecisionType | string;
  related_categories?: readonly (DecisionType | string)[];
  taxonomy_version?: DecisionTaxonomyVersion | string;
  scenario?: "BASELINE" | "UNDEFINED_CATEGORY" | "INACTIVE_CATEGORY" | "DUPLICATE_PRIMARY" | "MISSING_BEHAVIOR" | "MISSING_GOVERNANCE" | "MISSING_CONSTITUTIONAL" | "MISSING_REPLAY" | "TENANT_LEAK" | "ADVISORY_ONLY_VIOLATION" | "INTEGRITY_FAILURE";
}>;
