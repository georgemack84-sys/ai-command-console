import type { AdaptiveArchitectureCertificationGateResult } from "@/types/adaptive-architecture-certification-gate";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OutcomeType = "SUCCESSFUL" | "PARTIALLY_SUCCESSFUL" | "FAILED" | "REJECTED" | "OVERRIDDEN" | "DEFERRED" | "ESCALATED" | "ROLLBACK_REQUIRED" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
export type OutcomeGovernanceResult = "APPROVED" | "DENIED" | "ESCALATED" | "REVIEW_REQUIRED" | "ROLLED_BACK";
export type OutcomeOperatorActionResult = "ACCEPTED" | "REJECTED" | "OVERRIDDEN" | "MODIFIED" | "DEFERRED";
export type OutcomeRollbackResult = "NOT_REQUIRED" | "INITIATED" | "COMPLETED" | "FAILED";
export type OutcomeValidationState = "PASS" | "FAIL";

export type MissionImpact = Readonly<{
  objectives_completed: readonly string[];
  objectives_failed: readonly string[];
  operational_effect: string;
  unintended_effects: readonly string[];
  recovery_required: boolean;
}>;

export type RiskActualization = Readonly<{
  realized_risks: readonly string[];
  avoided_risks: readonly string[];
  underestimated_risks: readonly string[];
  overestimated_risks: readonly string[];
}>;

export type ConfidenceActualization = Readonly<{
  accurate_confidence: readonly string[];
  overconfidence: readonly string[];
  underconfidence: readonly string[];
  invalid_confidence: readonly string[];
}>;

export type OutcomeObservationRecord = Readonly<{
  contract_version: "actual-result-capture-contract/v1";
  schema_version: string;
  outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  decision_package_id: string;
  operator_workflow_id: string;
  observed_timestamp: string;
  observation_source: string;
  outcome_type: OutcomeType;
  expected_outcome_refs: readonly string[];
  actual_outcome_summary: string;
  actual_outcome_evidence_refs: readonly string[];
  mission_impact: MissionImpact;
  governance_result: OutcomeGovernanceResult;
  operator_action_result: OutcomeOperatorActionResult;
  risk_actualization: RiskActualization;
  confidence_actualization: ConfidenceActualization;
  rollback_result: OutcomeRollbackResult;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeContractVersion = Readonly<{
  contract_version: "actual-result-capture-contract/v1";
  schema_version: string;
  effective_date: string;
  compatibility_level: "CURRENT" | "HISTORICAL_REPLAY_COMPATIBLE" | "DEPRECATED_COMPATIBLE";
  deprecated: boolean;
  migration_required: boolean;
  checksum: string;
}>;

export type OutcomeCaptureCheck =
  | "ARCHITECTURE_CERTIFICATION"
  | "CONTRACT_VERSION"
  | "SCHEMA_VERSION"
  | "REQUIRED_FIELDS"
  | "IDENTITY"
  | "TIMESTAMP"
  | "REFERENCE_MODEL"
  | "EVIDENCE"
  | "MISSION_IMPACT"
  | "GOVERNANCE_LINEAGE"
  | "OPERATOR_WORKFLOW"
  | "REPLAY_LINEAGE"
  | "DETERMINISTIC_SERIALIZATION"
  | "INTEGRITY";

export type OutcomeCaptureFailure =
  | "ARCHITECTURE_NOT_CERTIFIED"
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_OUTCOME_ID_ACCEPTED"
  | "UNSUPPORTED_SCHEMA_VERSION_ACCEPTED"
  | "UNSUPPORTED_CONTRACT_VERSION_ACCEPTED"
  | "INVALID_TIMESTAMP_ACCEPTED"
  | "MISSING_EVIDENCE_ACCEPTED"
  | "INVALID_EVIDENCE_REFERENCE_ACCEPTED"
  | "MISSING_REPLAY_REFERENCES_ACCEPTED"
  | "MISSING_GOVERNANCE_REFERENCES_ACCEPTED"
  | "NONDETERMINISTIC_SERIALIZATION_DETECTED"
  | "INTEGRITY_HASH_MISMATCH_DETECTED"
  | "ORPHAN_OUTCOME_ACCEPTED"
  | "HISTORICAL_REPLAY_BROKEN_BY_SCHEMA_CHANGE"
  | "INFERRED_OUTCOME_ACCEPTED"
  | "PREDICTIVE_OUTCOME_ACCEPTED"
  | "RECOMMENDATION_OUTCOME_ACCEPTED"
  | "IDENTITY_MUTATION_ACCEPTED"
  | "TIMESTAMP_MUTATION_ACCEPTED"
  | "VALIDATION_AFTER_PERSISTENCE"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_OUTCOME_CAPTURE_BEHAVIOR";

export type OutcomeSchemaValidation = Readonly<{
  validation_id: string;
  contract_version_valid: boolean;
  schema_version_supported: boolean;
  required_fields_present: boolean;
  mission_impact_structured: boolean;
  governance_result_structured: boolean;
  operator_result_structured: boolean;
  risk_actualization_structured: boolean;
  confidence_actualization_structured: boolean;
  rollback_result_structured: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeIdentityValidation = Readonly<{
  validation_id: string;
  outcome_id_unique: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  decision_valid: boolean;
  identity_immutable: boolean;
  duplicate_rejected: boolean;
  identity_lineage_stable: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeEvidenceValidation = Readonly<{
  validation_id: string;
  evidence_exists: boolean;
  references_valid: boolean;
  evidence_immutable: boolean;
  evidence_lineage_preserved: boolean;
  inferred_outcomes_absent: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeReplayValidation = Readonly<{
  validation_id: string;
  originating_decision_present: boolean;
  originating_package_present: boolean;
  evidence_refs_present: boolean;
  governance_refs_present: boolean;
  operator_refs_present: boolean;
  ledger_refs_present: boolean;
  replay_sequence_present: boolean;
  reconstruction_identical: boolean;
  historical_compatibility_preserved: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeCaptureValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  architecture_certified: boolean;
  schema_valid: boolean;
  identity_valid: boolean;
  timestamp_valid: boolean;
  references_valid: boolean;
  evidence_valid: boolean;
  replay_valid: boolean;
  governance_lineage_present: boolean;
  deterministic_serialization: boolean;
  integrity_verified: boolean;
  historical_replay_compatible: boolean;
  validation_before_persistence: boolean;
  authorization_valid: boolean;
  failures: readonly OutcomeCaptureFailure[];
  integrity_hash: string;
}>;

export type OutcomeObservationLedgerRecord = Readonly<{
  record_id: string;
  outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  outcome_type: OutcomeType;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  validation_result: OutcomeValidationState;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OutcomeCaptureCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeCaptureCheck[];
  canonical_schema_defined: boolean;
  schema_deterministic: boolean;
  identity_rules_enforced: boolean;
  timestamp_rules_standardized: boolean;
  reference_model_validated: boolean;
  evidence_mandatory: boolean;
  governance_lineage_preserved: boolean;
  replay_references_required: boolean;
  integrity_hashing_deterministic: boolean;
  version_registry_operational: boolean;
  historical_replay_compatible: boolean;
  analysis_logic_absent: boolean;
  failure_analysis: readonly OutcomeCaptureFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type ActualResultCaptureContractInput = Readonly<{
  architecture_certification?: AdaptiveArchitectureCertificationGateResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "ARCHITECTURE_NOT_CERTIFIED"
    | "MISSING_REQUIRED_FIELD"
    | "DUPLICATE_OUTCOME_ID"
    | "UNSUPPORTED_SCHEMA_VERSION"
    | "UNSUPPORTED_CONTRACT_VERSION"
    | "INVALID_TIMESTAMP"
    | "MISSING_EVIDENCE"
    | "INVALID_EVIDENCE_REFERENCE"
    | "MISSING_REPLAY_REFS"
    | "MISSING_GOVERNANCE_REFS"
    | "NONDETERMINISTIC_SERIALIZATION"
    | "HASH_MISMATCH"
    | "ORPHAN_OUTCOME"
    | "HISTORICAL_REPLAY_BROKEN"
    | "INFERRED_OUTCOME"
    | "PREDICTIVE_OUTCOME"
    | "RECOMMENDATION_OUTCOME"
    | "IDENTITY_MUTATION"
    | "TIMESTAMP_MUTATION"
    | "VALIDATION_AFTER_PERSISTENCE"
    | "FAIL_OPEN";
}>;

export type ActualResultCaptureContractResult = Readonly<{
  outcome_capture_contract_version: "actual-result-capture-contract/v1";
  architecture_certification: AdaptiveArchitectureCertificationGateResult;
  version_registry: readonly OutcomeContractVersion[];
  outcome_record: OutcomeObservationRecord;
  schema_validation: OutcomeSchemaValidation;
  identity_validation: OutcomeIdentityValidation;
  evidence_validation: OutcomeEvidenceValidation;
  replay_validation: OutcomeReplayValidation;
  validation: OutcomeCaptureValidation;
  observation_ledger: readonly OutcomeObservationLedgerRecord[];
  certification_report: OutcomeCaptureCertificationReport;
  deterministic: true;
  replayable: true;
  structural_only: true;
  permits_analysis: false;
  permits_inference: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ActualResultCaptureContractFoundation = Readonly<{
  outcome_capture_contract_version: "actual-result-capture-contract/v1";
  checks: readonly OutcomeCaptureCheck[];
  supported_versions: readonly OutcomeContractVersion[];
  result: ActualResultCaptureContractResult;
}>;
