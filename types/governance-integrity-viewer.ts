import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceIntegrityCertificationState } from "@/types/governance-integrity-certification";
import type { GovernanceIntegrityVerificationModule } from "@/types/governance-integrity-verification";
import type { GovernanceIntegrityObjectType } from "@/types/governance-integrity-contract";
import type { GovernanceTamperDetectionReason, GovernanceTamperViolationType } from "@/types/governance-tamper-detection";

export type GovernanceIntegrityViewerAction =
  | "REPAIR_INTEGRITY"
  | "MODIFY_HASH"
  | "RECALCULATE_HASH"
  | "MODIFY_VERIFICATION"
  | "ALTER_HISTORY"
  | "OVERRIDE_GOVERNANCE";

export type GovernanceIntegrityViewerInput = Readonly<{
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
  state?: GovernanceIntegrityState;
}>;

export type GovernanceIntegrityHashDisplay = Readonly<{
  hash_id: string;
  record_id: string;
  governance_object_id: string;
  governance_object_type: GovernanceIntegrityObjectType;
  chain_position: number;
  current_hash: string;
  previous_hash: string | null;
  root_hash: string;
  replay_hash: string;
  evidence_hash: string;
  hash_algorithm: "SHA-256";
  verification_status: "VERIFIED" | "PENDING" | "FAILED";
  display_hash: string;
}>;

export type GovernanceIntegrityVerificationDisplay = Readonly<{
  verification_id: string;
  module: GovernanceIntegrityVerificationModule;
  state: GovernanceIntegrityState;
  passed: boolean;
  failure: string | null;
  message: string;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type GovernanceIntegrityTamperAlert = Readonly<{
  alert_id: string;
  detection_timestamp: string;
  affected_records: readonly string[];
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  violation_type: GovernanceTamperViolationType | "NONE";
  reason: GovernanceTamperDetectionReason | "NONE";
  investigation_status: "NOT_REQUIRED" | "OPEN" | "CONTAINED" | "BLOCKED";
  resolution_status: "CLEAR" | "PENDING" | "REQUIRES_RECOVERY";
  supporting_evidence: readonly string[];
  alert_hash: string;
}>;

export type GovernanceIntegrityTimelineEvent = Readonly<{
  event_id: string;
  timestamp: string;
  event_type: "INTEGRITY_INITIALIZATION" | "HASH_GENERATION" | "VERIFICATION_EXECUTION" | "TAMPER_DETECTION" | "INTEGRITY_DEGRADATION" | "RECOVERY_VERIFICATION" | "CERTIFICATION_VALIDATION";
  integrity_state: GovernanceIntegrityState;
  summary: string;
  evidence_refs: readonly string[];
  event_hash: string;
}>;

export type GovernanceIntegrityTrustIndicators = Readonly<{
  overall_trust_score: number;
  integrity_confidence: number;
  verification_confidence: number;
  hash_confidence: number;
  replay_confidence: number;
  evidence_confidence: number;
  certification_confidence: number;
  governance_trust_level: "TRUSTED" | "WATCH" | "BLOCKED";
  trust_hash: string;
}>;

export type GovernanceIntegrityTrend = Readonly<{
  trend_id: string;
  verification_success_rate: number;
  tamper_frequency: number;
  degradation_events: number;
  recovery_events: number;
  replay_consistency: number;
  hash_validation_success: number;
  certification_stability: number;
  trend_hash: string;
}>;

export type GovernanceIntegrityViewerView = Readonly<{
  viewer_id: string;
  schema_version: "governance-integrity-viewer/v7K.4";
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  integrity_state: GovernanceIntegrityState;
  certification_state: GovernanceIntegrityCertificationState;
  viewer_version: "governance-integrity-view/v7K.4";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  hash_repair_allowed: false;
  verification_mutation_allowed: false;
  hash_recalculation_allowed: false;
  mutation_allowed: false;
  tenant_isolated: boolean;
  authorization_enforced: boolean;
  chain_id: string;
  chain_version: string;
  chain_continuity: boolean;
  chain_completeness: boolean;
  protected_record_count: number;
  verification_id: string;
  certification_id: string;
  truth_ledger_certification_reference: string;
  hashes: readonly GovernanceIntegrityHashDisplay[];
  verification_results: readonly GovernanceIntegrityVerificationDisplay[];
  tamper_alerts: readonly GovernanceIntegrityTamperAlert[];
  corruption_indicators: readonly string[];
  timeline: readonly GovernanceIntegrityTimelineEvent[];
  trust_indicators: GovernanceIntegrityTrustIndicators;
  trends: GovernanceIntegrityTrend;
  certification_history: readonly Readonly<{
    certification_id: string;
    certification_state: GovernanceIntegrityCertificationState;
    certification_date: string;
    validation_scope: string;
    outstanding_issues: readonly string[];
    report_hash: string;
  }>[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  viewer_hash: string;
}>;

export type GovernanceIntegrityViewerObservabilitySurface = Readonly<{
  viewer_id: string;
  integrity_state: GovernanceIntegrityState;
  certification_state: GovernanceIntegrityCertificationState;
  protected_record_count: number;
  tamper_alert_count: number;
  corruption_indicator_count: number;
  read_only: true;
  viewer_hash: string;
}>;
