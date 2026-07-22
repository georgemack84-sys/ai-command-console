import type { MissionHealthClassification, MissionSubsystemId } from "@/types/mission-health-contract";

export type HealthCollectionState = "REGISTERED" | "WAITING_FOR_REPORT" | "COLLECTING" | "VALIDATING" | "NORMALIZING" | "EVIDENCE_LINKING" | "HEALTH_RECORD_CREATED" | "PUBLISHED" | "ARCHIVED";
export type HealthCategory = "Planning Health" | "Orchestration Health" | "Delegation Health" | "Supervision Health" | "Governance Health" | "Replay Health" | "Integrity Health" | "Authority Health";
export type CollectionStatus = "COMPLETE" | "PARTIAL" | "REJECTED";
export type AlertCategory = "INFORMATION" | "NOTICE" | "WARNING" | "HIGH_RISK" | "CRITICAL" | "EMERGENCY";
export type CollectionFailureCategory = "COLLECTION_FAILURE" | "VALIDATION_FAILURE" | "NORMALIZATION_FAILURE" | "SCHEMA_FAILURE" | "SUBSYSTEM_TIMEOUT" | "MISSING_EVIDENCE" | "REPLAY_FAILURE" | "INTEGRITY_FAILURE" | "AUTHORITY_FAILURE" | "GOVERNANCE_FAILURE";

export type SubsystemHealthCollectionScenario =
  | "BASELINE"
  | "SCHEMA_INVALID"
  | "DUPLICATE_SUBMISSION"
  | "MISSING_EVIDENCE"
  | "INVALID_CONFIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "AUTHORITY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CROSS_TENANT_REPORT"
  | "ADVISORY_ONLY_VIOLATION";

export type SubsystemHealthCollectionFailure =
  | "COLLECTION_CONTRACT_INVALID"
  | "HEALTH_SCHEMA_INVALID"
  | "SUBSYSTEM_IDENTITY_INVALID"
  | "DUPLICATE_SUBMISSION_DETECTED"
  | "NORMALIZATION_INVALID"
  | "EVIDENCE_MISSING"
  | "CONFIDENCE_INVALID"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_INVALID"
  | "AUTHORITY_VALIDATION_FAILED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "TENANT_OWNERSHIP_INVALID"
  | "ADVISORY_ONLY_VIOLATION";

export type StabilityMetrics = Readonly<{
  stability_score: number;
  stability_duration: string;
  oscillation_frequency: number;
  recovery_rate: number;
  degradation_velocity: number;
  health_volatility: number;
  operational_consistency: number;
  stability_hash: string;
}>;

export type HealthAlert = Readonly<{
  alert_id: string;
  subsystem: MissionSubsystemId;
  severity: AlertCategory;
  affected_metric: string;
  supporting_evidence: string;
  confidence: number;
  timestamp: string;
  alert_hash: string;
}>;

export type HealthAnomaly = Readonly<{
  anomaly_id: string;
  subsystem: MissionSubsystemId;
  detected_metric: string;
  severity: AlertCategory;
  evidence: string;
  replay_reference: string;
  anomaly_hash: string;
}>;

export type CollectionEvidence = Readonly<{
  evidence_id: string;
  health_record_id: string;
  subsystem: MissionSubsystemId;
  metric: string;
  metric_value: number;
  confidence: number;
  source: string;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type NormalizedHealthMetric = Readonly<{
  metric_id: string;
  subsystem: MissionSubsystemId;
  normalized_score: number;
  normalized_confidence: number;
  normalized_stability: number;
  normalized_risk: number;
  version_alignment: "mission-health-contract/v8ALT.4.1";
  metric_hash: string;
}>;

export type CollectedSubsystemHealthRecord = Readonly<{
  health_record_id: string;
  subsystem_id: MissionSubsystemId;
  subsystem_name: string;
  health_category: HealthCategory;
  mission_id: string;
  tenant_id: string;
  health_score: number;
  confidence: number;
  health_state: MissionHealthClassification;
  stability_score: number;
  stability_metrics: StabilityMetrics;
  risk_level: number;
  degradation_state: "NONE" | "WATCH" | "DEGRADED" | "CRITICAL";
  alerts: readonly HealthAlert[];
  anomalies: readonly HealthAnomaly[];
  failures: readonly CollectionFailureCategory[];
  evidence_reference: string;
  evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
  record_hash: string;
}>;

export type SubsystemHealthCollection = Readonly<{
  collection_id: string;
  mission_id: string;
  tenant_id: string;
  collection_timestamp: string;
  collection_state: HealthCollectionState;
  overall_collection_status: CollectionStatus;
  subsystems: readonly CollectedSubsystemHealthRecord[];
  normalized_metrics: readonly NormalizedHealthMetric[];
  evidence_references: readonly CollectionEvidence[];
  health_event_stream: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  contract_version: "subsystem-health-collection-engine/v8ALT.4.2";
  advisory_only: true;
  corrective_action_executed: boolean;
  recovery_initiated: boolean;
  subsystem_state_modified: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  collection_hash: string;
}>;

export type SubsystemHealthCollectionInput = Readonly<{
  scenario?: SubsystemHealthCollectionScenario;
  tenant_id?: string;
  mission_id?: string;
}>;

export type SubsystemHealthCollectionValidationResult = Readonly<{
  collection_id: string | null;
  valid: boolean;
  collection_contract_valid: boolean;
  health_schema_valid: boolean;
  subsystem_identity_verified: boolean;
  deterministic_ordering_verified: boolean;
  normalization_reproducible: boolean;
  evidence_registered: boolean;
  confidence_valid: boolean;
  replay_references_present: boolean;
  lineage_references_present: boolean;
  integrity_hashes_valid: boolean;
  authority_validation_enforced: boolean;
  governance_validation_enforced: boolean;
  tenant_ownership_valid: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly SubsystemHealthCollectionFailure[];
  validation_hash: string;
}>;

export type SubsystemHealthCollectionReplayResult = Readonly<{
  replay_reference: string;
  collection_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type SubsystemHealthCollectionObservabilitySurface = Readonly<{
  collection_id: string;
  mission_id: string;
  tenant_id: string;
  subsystem_count: number;
  alert_count: number;
  anomaly_count: number;
  failure_count: number;
  overall_collection_status: CollectionStatus;
  advisory_only: true;
  collection_hash: string;
}>;

export type SubsystemHealthCollectionEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "subsystem-health-collection-engine/v8ALT.4.2";
    principles: readonly string[];
    collection_states: readonly HealthCollectionState[];
    supported_subsystems: readonly string[];
    alert_categories: readonly AlertCategory[];
    failure_categories: readonly CollectionFailureCategory[];
    advisory_only: true;
  }>;
  collection: SubsystemHealthCollection;
  validation: SubsystemHealthCollectionValidationResult;
  replay: SubsystemHealthCollectionReplayResult;
  observability: SubsystemHealthCollectionObservabilitySurface;
}>;
