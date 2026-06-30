import type {
  EscalationContractRecord,
  EscalationReplayState,
  EscalationTriggerType,
  EscalationType,
} from "./escalation-contract";

export type EscalationDetectionScenario =
  | "BASELINE"
  | "CONSTITUTIONAL_RISK"
  | "AUTHORITY_VIOLATION"
  | "POLICY_FAILURE"
  | "COMPLIANCE_DEGRADATION"
  | "PROCESS_FAILURE"
  | "RISK_ESCALATION"
  | "EVIDENCE_ESCALATION"
  | "REPLAY_ESCALATION"
  | "INTEGRITY_ESCALATION"
  | "NO_ESCALATION"
  | "UNSUPPORTED_TRIGGER"
  | "MISSING_EVIDENCE"
  | "INVALID_AUTHORITY"
  | "INVALID_CONSTITUTIONAL_REF"
  | "INCOMPLETE_GOVERNANCE_CONTEXT"
  | "REPLAY_MISMATCH"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "HIDDEN_STATE"
  | "EXECUTION_AUTHORITY"
  | "DETECTION_HASH_MISMATCH";

export type EscalationDetectionOutputType =
  | "CONSTITUTIONAL_ESCALATION"
  | "AUTHORITY_ESCALATION"
  | "POLICY_ESCALATION"
  | "COMPLIANCE_ESCALATION"
  | "PROCESS_ESCALATION"
  | "RISK_ESCALATION"
  | "EVIDENCE_ESCALATION"
  | "REPLAY_ESCALATION"
  | "INTEGRITY_ESCALATION";

export type EscalationDetectionValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type EscalationGovernanceInput = Readonly<{
  input_id: string;
  tenant_id: string;
  mission_id: string;
  governance_session_id: string;
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  policy_refs: readonly string[];
  compliance_refs: readonly string[];
  recommendation_refs: readonly string[];
  risk_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  trust_score: number;
  operational_health_score: number;
  source_timestamp: string;
  input_hash: string;
}>;

export type EscalationTriggerEvaluation = Readonly<{
  evaluation_id: string;
  trigger_type: EscalationTriggerType;
  output_type: EscalationDetectionOutputType;
  applicable: boolean;
  supported: boolean;
  evidence_present: boolean;
  governance_valid: boolean;
  escalation_required: boolean;
  evaluation_reason: string;
  evaluation_hash: string;
}>;

export type EscalationDetectionFinding = Readonly<{
  finding_id: string;
  trigger_type: EscalationTriggerType;
  output_type: EscalationDetectionOutputType;
  escalation_type: EscalationType;
  escalation_required: boolean;
  explanation: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  confidence_score: number;
  finding_hash: string;
}>;

export type EscalationDetectionLedgerRecord = Readonly<{
  detection_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  escalation_ids: readonly string[];
  trigger_evidence_refs: readonly string[];
  confidence_refs: readonly string[];
  governance_context_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  detection_hash: string;
  recorded_timestamp: string;
}>;

export type EscalationDetectionResult = Readonly<{
  contract_version: "ESCALATION-DETECTION-V1";
  tenant_id: string;
  mission_id: string;
  detector_version: "ESCALATION-DETECTION-V1";
  input: EscalationGovernanceInput;
  trigger_evaluations: readonly EscalationTriggerEvaluation[];
  findings: readonly EscalationDetectionFinding[];
  escalation_records: readonly EscalationContractRecord[];
  ledger_record: EscalationDetectionLedgerRecord;
  validation_state: EscalationDetectionValidationState;
  replay_state: EscalationReplayState;
  detection_hash: string;
}>;

export type EscalationDetectionFailureReason =
  | "DETECTION_RESULT_MISSING"
  | "UNSUPPORTED_TRIGGER_ACCEPTED"
  | "MISSING_EVIDENCE_ACCEPTED"
  | "INVALID_AUTHORITY_ACCEPTED"
  | "INVALID_CONSTITUTIONAL_REF_ACCEPTED"
  | "INCOMPLETE_GOVERNANCE_CONTEXT_ACCEPTED"
  | "REPLAY_MISMATCH_ACCEPTED"
  | "BROKEN_LINEAGE_ACCEPTED"
  | "CROSS_TENANT_DETECTION"
  | "HIDDEN_STATE_DETECTED"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "ESCALATION_CONTRACT_INVALID"
  | "TRUTH_LEDGER_RECORD_MISSING"
  | "DETECTION_HASH_MISMATCH";

export type EscalationDetectionValidationFailure = Readonly<{
  failure_id: string;
  reason: EscalationDetectionFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type EscalationDetectionValidationResult = Readonly<{
  validation_state: EscalationDetectionValidationState;
  validator_version: "ESCALATION-DETECTION-VALIDATOR-V1";
  checks: Readonly<{
    triggers_supported: boolean;
    evidence_complete: boolean;
    governance_context_complete: boolean;
    authority_valid: boolean;
    constitutional_refs_valid: boolean;
    contracts_valid: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    lineage_reconstructable: boolean;
    replay_ready: boolean;
    truth_ledger_recorded: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly EscalationDetectionValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type EscalationDetectionReplayResult = Readonly<{
  replay_id: string;
  replay_state: EscalationReplayState;
  reconstructed_detection_hash: string;
  expected_detection_hash: string;
  reconstructed_escalation_ids: readonly string[];
  expected_escalation_ids: readonly string[];
  failure_reason: EscalationDetectionFailureReason | null;
}>;

export type EscalationDetectionMetrics = Readonly<{
  detection_rate: number;
  trigger_frequency: Readonly<Record<EscalationTriggerType, number>>;
  trigger_distribution: Readonly<Record<EscalationDetectionOutputType, number>>;
  replay_success_rate: number;
  evidence_completeness: number;
  average_confidence: number;
  constitutional_escalation_count: number;
  authority_escalation_count: number;
  compliance_escalation_count: number;
  integrity_escalation_count: number;
  replay_escalation_count: number;
  average_detection_latency_ms: number;
}>;

export type EscalationDetectionObservabilitySurface = Readonly<{
  escalation_count: number;
  trigger_evaluations: readonly EscalationTriggerEvaluation[];
  finding_explanations: readonly string[];
  escalation_ids: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  ledger_refs: readonly string[];
  replay_state: EscalationReplayState;
  advisory_only_notice: string;
  metrics: EscalationDetectionMetrics;
  validation_failures: readonly EscalationDetectionFailureReason[];
}>;

export type EscalationDetectionDoctrine = Readonly<{
  principles: readonly ("deterministic" | "trigger-evaluated" | "evidence-driven" | "governance-aware" | "constitutionally-bound" | "authority-preserving" | "advisory-only" | "tenant-safe" | "truth-ledger-recorded" | "replayable" | "explainable" | "certification-ready" | "fail-closed")[];
  supported_outputs: readonly EscalationDetectionOutputType[];
  detector_version: "ESCALATION-DETECTION-V1";
}>;
