import type { AutonomyCertificationContractReport, AutonomyCertificationComponent } from "@/types/autonomy-certification-contract";

export type DeterministicValidationState = "REGISTERED" | "INPUT_VALIDATION" | "ENVIRONMENT_VALIDATION" | "BASELINE_EXECUTION" | "REPEAT_EXECUTION" | "COMPARISON" | "REPLAY_VALIDATION" | "INTEGRITY_VALIDATION" | "GOVERNANCE_VALIDATION" | "AUTHORITY_VALIDATION" | "VISIBILITY_VALIDATION" | "TENANT_VALIDATION" | "ASSESSMENT" | "COMPLETE";
export type DeterministicValidationDomain = "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "RUNTIME_SUPERVISION" | "REPLAY" | "INTEGRITY" | "GOVERNANCE" | "AUTHORITY" | "VISIBILITY" | "TENANT_ISOLATION";
export type DeterministicResult = "DETERMINISTIC" | "NONDETERMINISTIC";
export type DeterministicSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SignatureStatus = "MATCH" | "MISMATCH";

export type DeterministicValidationScenario =
  | "BASELINE"
  | "PLANNING_DIVERGENCE"
  | "EXECUTION_DIVERGENCE"
  | "DELEGATION_DIVERGENCE"
  | "SUPERVISION_DIVERGENCE"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "VISIBILITY_MISMATCH"
  | "LINEAGE_MISMATCH"
  | "REPLAY_CORRUPTION"
  | "HIDDEN_EXECUTION_STATE"
  | "HIDDEN_GOVERNANCE_STATE"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_STATE_LEAKAGE"
  | "NONDETERMINISTIC_STATE_TRANSITIONS"
  | "MUTABLE_HISTORICAL_EVIDENCE";

export type DeterministicValidationFailure =
  | "PLANNING_DIVERGENCE_DETECTED"
  | "EXECUTION_DIVERGENCE_DETECTED"
  | "DELEGATION_DIVERGENCE_DETECTED"
  | "SUPERVISION_DIVERGENCE_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "CONFIDENCE_MISMATCH_DETECTED"
  | "GOVERNANCE_MISMATCH_DETECTED"
  | "AUTHORITY_MISMATCH_DETECTED"
  | "VISIBILITY_MISMATCH_DETECTED"
  | "LINEAGE_MISMATCH_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "HIDDEN_EXECUTION_STATE_DETECTED"
  | "HIDDEN_GOVERNANCE_STATE_DETECTED"
  | "TENANT_ISOLATION_FAILURE_DETECTED"
  | "CROSS_TENANT_STATE_LEAKAGE_DETECTED"
  | "NONDETERMINISTIC_STATE_TRANSITIONS_DETECTED"
  | "MUTABLE_HISTORICAL_EVIDENCE_DETECTED";

export type ValidationSignatureSet = Readonly<{
  input_signature: string;
  environment_signature: string;
  state_signature: string;
  decision_signature: string;
  confidence_signature: string;
  replay_signature: string;
  integrity_signature: string;
  governance_signature: string;
  authority_signature: string;
  visibility_signature: string;
  tenant_signature: string;
  lineage_signature: string;
  evidence_signature: string;
  signature_hash: string;
}>;

export type ExecutionComparisonRecord = Readonly<{
  comparison_id: string;
  domain: DeterministicValidationDomain;
  baseline_signature: string;
  comparison_signature: string;
  status: SignatureStatus;
  detected_failure: DeterministicValidationFailure | null;
  explanation: string;
  evidence_refs: readonly string[];
  comparison_hash: string;
}>;

export type ValidationEvidenceRecord = Readonly<{
  evidence_id: string;
  domain: DeterministicValidationDomain;
  evidence_type: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  immutable_reference: string;
  evidence_hash: string;
}>;

export type DeterministicValidationReport = Readonly<{
  validation_id: string;
  engine_version: "deterministic-validation-engine/v8K.2";
  tenant_id: string;
  mission_id: string;
  component: AutonomyCertificationComponent;
  validation_scope: readonly DeterministicValidationDomain[];
  baseline_execution: ValidationSignatureSet;
  comparison_execution: ValidationSignatureSet;
  input_signature: string;
  environment_signature: string;
  state_signature: string;
  decision_signature: string;
  confidence_signature: string;
  replay_signature: string;
  integrity_signature: string;
  governance_signature: string;
  authority_signature: string;
  visibility_signature: string;
  tenant_signature: string;
  deterministic_result: DeterministicResult;
  detected_differences: readonly DeterministicValidationFailure[];
  severity: DeterministicSeverity;
  validation_state: DeterministicValidationState;
  validation_timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence: readonly ValidationEvidenceRecord[];
  comparisons: readonly ExecutionComparisonRecord[];
  certification_contract: AutonomyCertificationContractReport;
  metadata: Readonly<Record<string, string>>;
  report_hash: string;
}>;

export type DeterministicValidationInput = Readonly<{
  scenario?: DeterministicValidationScenario;
  component?: AutonomyCertificationComponent;
}>;

export type DeterministicValidationResult = Readonly<{
  validation_id: string | null;
  valid: boolean;
  deterministic_result: DeterministicResult | null;
  report_hash_valid: boolean;
  evidence_complete: boolean;
  failures: readonly DeterministicValidationFailure[];
  validation_hash: string;
}>;

export type DeterministicValidationObservabilitySurface = Readonly<{
  validation_id: string;
  deterministic_result: DeterministicResult;
  validation_state: DeterministicValidationState;
  severity: DeterministicSeverity;
  comparison_count: number;
  mismatches: number;
  failures: readonly DeterministicValidationFailure[];
  evidence_records: number;
  report_hash: string;
}>;
