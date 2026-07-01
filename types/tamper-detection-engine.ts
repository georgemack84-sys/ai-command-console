import type { AutonomousHashChainExecution, AutonomousHashChainScenario } from "@/types/autonomous-hash-chain-engine";
import type { AutonomousHashChainArtifactType } from "@/types/autonomous-hash-chain-engine";
import type { IntegrityState } from "@/types/integrity-contract";

export type TamperDetectionState = "CLEAN" | "WARNING" | "DEGRADED" | "CORRUPTED" | "INVALID";
export type TamperAlertSeverity = "INFORMATION" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TamperDetectionCategory =
  | "HASH_INTEGRITY"
  | "ARTIFACT_INTEGRITY"
  | "REPLAY_INTEGRITY"
  | "LINEAGE_INTEGRITY"
  | "EXECUTION_INTEGRITY"
  | "GOVERNANCE_INTEGRITY";

export type TamperDetectionScenario =
  | "BASELINE"
  | "INCONSISTENT_HASH"
  | "DUPLICATE_HASH"
  | "UNAUTHORIZED_MODIFICATION"
  | "DELETED_RECORD"
  | "INSERTED_RECORD"
  | "REPLAY_ALTERATION"
  | "REPLAY_OMISSION"
  | "LINEAGE_CORRUPTION"
  | "ORPHAN_RECORD"
  | "MISSING_PARENT"
  | "EXECUTION_DIVERGENCE"
  | "CHECKPOINT_INCONSISTENCY"
  | "ORDERING_MUTATION"
  | "GOVERNANCE_REFERENCE_LOSS"
  | "CONSTITUTIONAL_REFERENCE_LOSS"
  | "CROSS_TENANT_LINKAGE"
  | "MALFORMED_METADATA"
  | "HISTORICAL_INCONSISTENCY"
  | "UNSUPPORTED_HASH_ALGORITHM";

export type TamperDetectionReason =
  | "INCONSISTENT_HASH"
  | "DUPLICATE_HASH"
  | "UNAUTHORIZED_MODIFICATION"
  | "DELETED_RECORD"
  | "INSERTED_RECORD"
  | "REPLAY_ALTERATION"
  | "REPLAY_OMISSION"
  | "LINEAGE_CORRUPTION"
  | "ORPHAN_RECORD"
  | "MISSING_PARENT"
  | "EXECUTION_DIVERGENCE"
  | "CHECKPOINT_INCONSISTENCY"
  | "ORDERING_MUTATION"
  | "GOVERNANCE_REFERENCE_LOSS"
  | "CONSTITUTIONAL_REFERENCE_LOSS"
  | "CROSS_TENANT_LINKAGE"
  | "MALFORMED_METADATA"
  | "HISTORICAL_INCONSISTENCY"
  | "UNSUPPORTED_HASH_ALGORITHM";

export type TamperDetection = Readonly<{
  detection_id: string;
  tenant_id: string;
  artifact_id: string;
  artifact_type: AutonomousHashChainArtifactType;
  detection_type: TamperDetectionCategory;
  detection_state: TamperDetectionState;
  integrity_score: number;
  detected_issue: TamperDetectionReason;
  affected_hash: string;
  affected_lineage: string;
  replay_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  confidence: number;
  recommended_action: string;
  timestamp: string;
  evidence_reference: string;
  path: string;
}>;

export type TamperIntegrityObservation = Readonly<{
  observation_id: string;
  monitor_id: "autonomous-tamper-monitor/v8H.3";
  observed_at: string;
  chain_id: string;
  tenant_id: string;
  observed_node_count: number;
  expected_node_count: number;
  observed_genesis_hash: string;
  observed_terminal_hash: string;
  replay_chain_hash: string;
  lineage_hash: string;
  validation_state: IntegrityState;
  observation_hash: string;
}>;

export type TamperIntegrityAlert = Readonly<{
  alert_id: string;
  detection_id: string;
  severity: TamperAlertSeverity;
  category: TamperDetectionCategory;
  tenant_id: string;
  artifact_id: string;
  message: string;
  governance_notification_required: boolean;
  certification_suspended: boolean;
  evidence_hash: string;
  emitted_at: string;
}>;

export type TamperCorruptionReport = Readonly<{
  corruption_report_id: string;
  detection_state: TamperDetectionState;
  corruption_classification: TamperDetectionReason | "NONE";
  corruption_scope: "NONE" | "SINGLE_ARTIFACT" | "CHAIN_SEGMENT" | "FULL_CHAIN";
  affected_artifacts: readonly string[];
  recovery_recommendation: string;
  report_hash: string;
}>;

export type TamperReplayVerificationReport = Readonly<{
  replay_reference: string;
  replay_reproducible: boolean;
  replay_ordering_valid: boolean;
  replay_evidence_valid: boolean;
  replay_chain_hash: string;
  replay_verification_hash: string;
}>;

export type TamperLineageAnalysis = Readonly<{
  lineage_reference: string;
  lineage_continuous: boolean;
  orphan_count: number;
  missing_parent_count: number;
  lineage_hash: string;
}>;

export type TamperHistoricalConsistency = Readonly<{
  chronology_valid: boolean;
  lifecycle_ordering_valid: boolean;
  governance_continuity_valid: boolean;
  authority_continuity_valid: boolean;
  replay_continuity_valid: boolean;
  consistency_hash: string;
}>;

export type TamperRepairRecommendation = Readonly<{
  recommendation_id: string;
  reason: TamperDetectionReason | "NONE";
  priority: TamperAlertSeverity;
  action: string;
  operator_review_required: boolean;
  recommendation_hash: string;
}>;

export type TamperGovernanceNotification = Readonly<{
  notification_id: string;
  severity: TamperAlertSeverity;
  tenant_id: string;
  detection_ids: readonly string[];
  governance_reference: string;
  constitutional_reference: string;
  message: string;
  notification_hash: string;
}>;

export type TamperForensicEvidence = Readonly<{
  evidence_id: string;
  chain_id: string;
  observation_hash: string;
  detection_hashes: readonly string[];
  alert_hashes: readonly string[];
  replay_verification_hash: string;
  lineage_hash: string;
  consistency_hash: string;
  evidence_hash: string;
}>;

export type TamperDetectionReport = Readonly<{
  phase_version: "8H.3";
  schema_version: "tamper-detection-engine/v8H.3";
  report_id: string;
  monitoring_state: "MONITORING" | "WARNING" | "DEGRADED" | "CORRUPTION_CONFIRMED" | "INVALID";
  detection_state: TamperDetectionState;
  integrity_state: IntegrityState;
  source_chain: AutonomousHashChainExecution;
  observation: TamperIntegrityObservation;
  detections: readonly TamperDetection[];
  alerts: readonly TamperIntegrityAlert[];
  corruption_report: TamperCorruptionReport;
  replay_verification: TamperReplayVerificationReport;
  lineage_analysis: TamperLineageAnalysis;
  historical_consistency: TamperHistoricalConsistency;
  repair_recommendations: readonly TamperRepairRecommendation[];
  governance_notifications: readonly TamperGovernanceNotification[];
  forensic_evidence: TamperForensicEvidence;
  deterministic: true;
  certification_ready: boolean;
  report_hash: string;
  advisory_only_notice: string;
}>;

export type TamperDetectionInput = Readonly<{
  scenario?: TamperDetectionScenario;
  hash_chain_scenario?: AutonomousHashChainScenario;
  chain?: AutonomousHashChainExecution;
}>;

export type TamperDetectionObservabilitySurface = Readonly<{
  report_id: string;
  chain_id: string;
  tenant_id: string;
  detection_state: TamperDetectionState;
  integrity_state: IntegrityState;
  alert_count: number;
  critical_alerts: number;
  detections: readonly TamperDetectionReason[];
  certification_ready: boolean;
  downstream_blocked: boolean;
  latest_observation_hash: string;
  forensic_evidence_hash: string;
}>;
