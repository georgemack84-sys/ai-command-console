export type ConflictCategory =
  | "Recommendation"
  | "Governance"
  | "Authority"
  | "Evidence"
  | "Risk"
  | "Confidence"
  | "Forecast"
  | "Mission Objective"
  | "Recovery"
  | "Timing"
  | "Resource"
  | "Tenant Boundary"
  | "Certification"
  | "Constitutional";

export type ConflictType =
  | "recommendation_conflict"
  | "governance_conflict"
  | "authority_conflict"
  | "evidence_conflict"
  | "risk_conflict"
  | "confidence_conflict"
  | "forecast_conflict"
  | "mission_objective_conflict"
  | "recovery_conflict"
  | "timing_conflict"
  | "resource_conflict"
  | "tenant_boundary_conflict"
  | "certification_conflict"
  | "constitutional_conflict";

export type ConflictState = "DETECTED" | "CLASSIFIED" | "UNDER_REVIEW" | "ARBITRATED" | "ESCALATED" | "CLOSED";

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "BLOCKING";

export type ArbitrationStatus = "NOT_REQUESTED" | "REQUESTED" | "COMPLETED" | "ESCALATED";

export type ConflictDetectionRule = Readonly<{
  rule_id: string;
  rule_name: string;
  rule_version: string;
  conflict_category: ConflictCategory;
  evaluation_logic: string;
  evidence_requirements: readonly string[];
  governance_requirements: readonly string[];
  authority_requirements: readonly string[];
  replay_requirements: readonly string[];
  deterministic_threshold: number;
  integrity_hash: string;
}>;

export type ConflictRecord = Readonly<{
  conflict_id: string;
  tenant_id: string;
  mission_id: string;
  conflict_type: ConflictType;
  conflict_category: ConflictCategory;
  secondary_categories: readonly ConflictCategory[];
  conflict_state: ConflictState;
  severity: ConflictSeverity;
  priority: number;
  candidate_refs: readonly string[];
  source_systems: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  policy_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  forecast_refs: readonly string[];
  resource_refs: readonly string[];
  recovery_refs: readonly string[];
  certification_refs: readonly string[];
  detection_reason: string;
  detection_rule_id: string;
  arbitration_required: boolean;
  arbitration_status: ArbitrationStatus;
  escalation_required: boolean;
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  created_timestamp: string;
  updated_timestamp: string;
  integrity_hash: string;
}>;

export type ConflictLifecycleAuditEntry = Readonly<{
  audit_id: string;
  conflict_id: string;
  previous_state: ConflictState;
  new_state: ConflictState;
  initiating_component: string;
  triggering_rule: string;
  transition_valid: boolean;
  replay_ref: string;
  transition_timestamp: string;
  integrity_hash: string;
}>;

export type ConflictArbitrationRequest = Readonly<{
  conflict_id: string;
  candidate_refs: readonly string[];
  conflict_category: ConflictCategory;
  severity: ConflictSeverity;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  constitutional_refs: readonly string[];
  arbitration_constraints: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ConflictRegistrationInput = Readonly<{
  tenant_id?: string;
  mission_id?: string;
  conflict_type?: ConflictType;
  conflict_category?: ConflictCategory;
  secondary_categories?: readonly ConflictCategory[];
  candidate_refs?: readonly string[];
  source_systems?: readonly string[];
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  constitutional_refs?: readonly string[];
  authority_refs?: readonly string[];
  policy_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  forecast_refs?: readonly string[];
  resource_refs?: readonly string[];
  recovery_refs?: readonly string[];
  certification_refs?: readonly string[];
  detection_reason?: string;
  detection_rule?: ConflictDetectionRule;
  conflict_state?: ConflictState;
  existing_conflict_ids?: readonly string[];
  replay_ref?: string;
  lineage_ref?: string;
  advisory_only?: boolean;
}>;

export type ConflictFailureReason =
  | "CONFLICT_OBJECT_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_CONFLICT_ID"
  | "MISSING_CANDIDATE_REFERENCES"
  | "MISSING_EVIDENCE_REFERENCES"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_CONSTITUTIONAL_REFERENCES"
  | "MISSING_AUTHORITY_REFERENCES"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_LINEAGE_REFERENCE"
  | "INVALID_CONFLICT_CATEGORY"
  | "INVALID_CONFLICT_STATE"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "ARBITRATION_REQUEST_FAILED"
  | "DETECTION_RULE_INVALID";

export type ConflictValidationResult = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ConflictFailureReason[];
  checks: Readonly<{
    schema_complete: boolean;
    evidence_complete: boolean;
    governance_complete: boolean;
    constitutional_complete: boolean;
    authority_complete: boolean;
    replay_ready: boolean;
    lineage_complete: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
}>;

export type ConflictRegistrationResult = Readonly<{
  registration_status: "REGISTERED" | "REJECTED";
  fail_closed: boolean;
  conflict?: ConflictRecord;
  validation: ConflictValidationResult;
}>;

export type ConflictReplayResult = Readonly<{
  replay_id: string;
  conflict_id: string;
  replay_valid: boolean;
  reconstructed_hash: string;
  expected_hash: string;
  lifecycle_transitions: readonly ConflictLifecycleAuditEntry[];
  arbitration_request?: ConflictArbitrationRequest;
  failures: readonly ConflictFailureReason[];
  integrity_hash: string;
}>;

export type ConflictDetectionObservability = Readonly<{
  conflicts_detected: number;
  conflicts_by_category: Readonly<Record<ConflictCategory, number>>;
  conflicts_by_severity: Readonly<Record<ConflictSeverity, number>>;
  lifecycle_state_distribution: Readonly<Record<ConflictState, number>>;
  replay_success_rate: number;
  integrity_validation_success: number;
  governance_validation_success: number;
  constitutional_validation_success: number;
  arbitration_request_generation_rate: number;
  fail_closed_events: number;
}>;

export type ConflictDetectionContractFoundation = Readonly<{
  contract_version: "conflict-detection-contract/v1";
  categories: readonly ConflictCategory[];
  states: readonly ConflictState[];
  severities: readonly ConflictSeverity[];
  allowed_transitions: Readonly<Record<ConflictState, readonly ConflictState[]>>;
  detection_rule: ConflictDetectionRule;
  conflict: ConflictRecord;
  arbitration_request: ConflictArbitrationRequest;
  validation: ConflictValidationResult;
  replay: ConflictReplayResult;
}>;
