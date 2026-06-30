import type { EscalationConfidenceLevel, EscalationReplayState, EscalationSeverity } from "./escalation-contract";
import type { EscalationDetectionResult, EscalationDetectionScenario, EscalationDetectionOutputType } from "./escalation-detection";

export type EscalationPriorityLevel = EscalationSeverity;

export type EscalationPrioritizationScenario =
  | EscalationDetectionScenario
  | "INFO_EVENT"
  | "LOW_POLICY_INCONSISTENCY"
  | "INVALID_ESCALATION_RECORD"
  | "UNSUPPORTED_PRIORITY"
  | "MISSING_PRIORITY_EVIDENCE"
  | "INCOMPLETE_PRIORITY_CONTEXT"
  | "PRIORITY_REPLAY_MISMATCH"
  | "BROKEN_PRIORITY_LINEAGE"
  | "CROSS_TENANT_PRIORITY"
  | "HIDDEN_PRIORITY_STATE"
  | "PRIORITY_HASH_MISMATCH"
  | "PRIORITIZATION_HASH_MISMATCH";

export type EscalationPriorityFactorType =
  | "CONSTITUTIONAL_IMPACT"
  | "AUTHORITY_IMPACT"
  | "POLICY_IMPACT"
  | "COMPLIANCE_IMPACT"
  | "OPERATIONAL_GOVERNANCE_IMPACT"
  | "RISK_IMPACT"
  | "EVIDENCE_QUALITY"
  | "REPLAY_INTEGRITY"
  | "HISTORICAL_CONTEXT";

export type EscalationPriorityFactor = Readonly<{
  factor_type: EscalationPriorityFactorType;
  factor_score: number;
  factor_weight: number;
  factor_reason: string;
  evidence_refs: readonly string[];
}>;

export type EscalationPriorityConfidence = Readonly<{
  confidence_score: number;
  confidence_level: EscalationConfidenceLevel;
  confidence_reason: string;
  confidence_inputs: readonly string[];
  confidence_hash: string;
}>;

export type EscalationPriorityLineage = Readonly<{
  priority_id: string;
  escalation_id: string;
  parent_priority: string | null;
  root_priority: string;
  priority_history: readonly string[];
  trigger_chain: readonly string[];
}>;

export type EscalationPriorityRecord = Readonly<{
  priority_id: string;
  escalation_id: string;
  tenant_id: string;
  mission_id: string;
  priority_level: EscalationPriorityLevel;
  priority_score: number;
  priority_reason: string;
  priority_factors: readonly EscalationPriorityFactor[];
  priority_timestamp: string;
  confidence: EscalationPriorityConfidence;
  lineage: EscalationPriorityLineage;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  explainability: Readonly<{
    why_assigned: string;
    contributing_factors: readonly string[];
    constitutional_basis: readonly string[];
    authority_basis: readonly string[];
    policy_basis: readonly string[];
    compliance_basis: readonly string[];
    evidence_basis: readonly string[];
    higher_priority_exclusion: string;
    lower_priority_exclusion: string;
    confidence_explanation: string;
  }>;
  advisory_boundary: Readonly<{
    advisory_only: true;
    execution_authority: false;
    mutation_authority: false;
    policy_modification_authority: false;
    operator_override_authority: false;
    recommendation_authority: false;
  }>;
  priority_version: "ESCALATION-PRIORITIZATION-V1";
  priority_hash: string;
}>;

export type EscalationPrioritizationLedgerRecord = Readonly<{
  priority_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  source_detection_hash: string;
  escalation_ids: readonly string[];
  priority_ids: readonly string[];
  priority_levels: readonly EscalationPriorityLevel[];
  evidence_refs: readonly string[];
  governance_context_refs: readonly string[];
  confidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  prioritization_hash: string;
  recorded_timestamp: string;
}>;

export type EscalationPrioritizationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type EscalationPrioritizationResult = Readonly<{
  contract_version: "ESCALATION-PRIORITIZATION-V1";
  tenant_id: string;
  mission_id: string;
  prioritizer_version: "ESCALATION-PRIORITIZATION-V1";
  source_detection: EscalationDetectionResult;
  priority_records: readonly EscalationPriorityRecord[];
  prioritized_escalation_ids: readonly string[];
  ledger_record: EscalationPrioritizationLedgerRecord;
  validation_state: EscalationPrioritizationValidationState;
  replay_state: EscalationReplayState;
  prioritization_hash: string;
}>;

export type EscalationPrioritizationFailureReason =
  | "PRIORITIZATION_RESULT_MISSING"
  | "SOURCE_DETECTION_INVALID"
  | "INVALID_ESCALATION_RECORD"
  | "ESCALATION_NOT_PRIORITIZED"
  | "DUPLICATE_PRIORITY_RECORD"
  | "UNSUPPORTED_PRIORITY_LEVEL"
  | "PRIORITY_SCORE_INVALID"
  | "PRIORITY_REASON_MISSING"
  | "MISSING_EVIDENCE"
  | "INCOMPLETE_GOVERNANCE_CONTEXT"
  | "CONFIDENCE_INVALID"
  | "CONFIDENCE_HASH_MISMATCH"
  | "REPLAY_MISMATCH_ACCEPTED"
  | "BROKEN_LINEAGE"
  | "MUTABLE_PRIORITY_IDENTIFIER"
  | "CROSS_TENANT_PRIORITY"
  | "HIDDEN_PRIORITIZATION_STATE"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "TRUTH_LEDGER_RECORD_MISSING"
  | "PRIORITY_HASH_MISMATCH"
  | "PRIORITIZATION_HASH_MISMATCH";

export type EscalationPrioritizationValidationFailure = Readonly<{
  failure_id: string;
  reason: EscalationPrioritizationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type EscalationPrioritizationValidationResult = Readonly<{
  validation_state: EscalationPrioritizationValidationState;
  validator_version: "ESCALATION-PRIORITIZATION-VALIDATOR-V1";
  checks: Readonly<{
    source_detection_valid: boolean;
    escalation_records_valid: boolean;
    every_escalation_prioritized: boolean;
    priority_levels_supported: boolean;
    score_reproducible: boolean;
    evidence_complete: boolean;
    governance_context_complete: boolean;
    confidence_reproducible: boolean;
    lineage_reconstructable: boolean;
    replay_ready: boolean;
    truth_ledger_recorded: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly EscalationPrioritizationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type EscalationPrioritizationReplayResult = Readonly<{
  replay_id: string;
  replay_state: EscalationReplayState;
  reconstructed_prioritization_hash: string;
  expected_prioritization_hash: string;
  reconstructed_priority_ids: readonly string[];
  expected_priority_ids: readonly string[];
  failure_reason: EscalationPrioritizationFailureReason | null;
}>;

export type EscalationPrioritizationMetrics = Readonly<{
  total_prioritized_escalations: number;
  priority_distribution: Readonly<Record<EscalationPriorityLevel, number>>;
  average_priority_score: number;
  constitutional_escalation_rate: number;
  authority_escalation_rate: number;
  compliance_escalation_rate: number;
  policy_escalation_rate: number;
  evidence_completeness_rate: number;
  confidence_distribution: Readonly<Record<EscalationConfidenceLevel, number>>;
  replay_success_rate: number;
  prioritization_latency_ms: number;
  lineage_reconstruction_success: number;
}>;

export type EscalationPrioritizationObservabilitySurface = Readonly<{
  priority_count: number;
  priority_ids: readonly string[];
  priorities: readonly EscalationPriorityLevel[];
  scores: readonly number[];
  priority_reasons: readonly string[];
  contributing_factors: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  ledger_refs: readonly string[];
  replay_state: EscalationReplayState;
  advisory_only_notice: string;
  metrics: EscalationPrioritizationMetrics;
  validation_failures: readonly EscalationPrioritizationFailureReason[];
}>;

export type EscalationPrioritizationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "severity-calculated" | "impact-assessed" | "evidence-backed" | "confidence-reproducible" | "lineage-preserving" | "truth-ledger-recorded" | "replayable" | "explainable" | "advisory-only" | "tenant-safe" | "certification-ready" | "fail-closed")[];
  supported_priority_levels: readonly EscalationPriorityLevel[];
  supported_detection_outputs: readonly EscalationDetectionOutputType[];
  prioritizer_version: "ESCALATION-PRIORITIZATION-V1";
}>;
