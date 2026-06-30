import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceHashChainExecution, GovernanceHashChainScenario } from "@/types/governance-hash-chain";

export type GovernanceTamperScenario =
  | "BASELINE"
  | "HASH_MISMATCH"
  | "MISSING_CHAIN_LINK"
  | "DUPLICATE_CHAIN_POSITION"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "PARENT_RECORD_MISSING"
  | "ROOT_LINEAGE_MISSING"
  | "IMMUTABLE_IDENTITY_MODIFIED"
  | "CROSS_TENANT_REFERENCE"
  | "UNSUPPORTED_HASH_VERSION"
  | "VERIFICATION_DELAY"
  | "MISSING_OPTIONAL_METADATA"
  | "UNAUTHORIZED_INSERTION"
  | "UNAUTHORIZED_DELETION"
  | "CHAIN_REORDERING"
  | "UNKNOWN_INTEGRITY_STATE";

export type GovernanceTamperViolationType =
  | "HASH_MISMATCH_DETECTED"
  | "CHAIN_CORRUPTION_DETECTED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "IMMUTABLE_FIELD_MODIFIED"
  | "TENANT_VIOLATION_DETECTED"
  | "VERIFICATION_FAILURE"
  | "DEGRADATION_CONFIRMED"
  | "CORRUPTION_CONFIRMED"
  | "INTEGRITY_RESTORED";

export type GovernanceTamperDetectionReason =
  | "HASH_MISMATCH"
  | "MISSING_CHAIN_LINK"
  | "DUPLICATE_CHAIN_POSITION"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "PARENT_RECORD_MISSING"
  | "ROOT_LINEAGE_MISSING"
  | "IMMUTABLE_IDENTITY_MODIFIED"
  | "CROSS_TENANT_REFERENCE"
  | "UNSUPPORTED_HASH_VERSION"
  | "VERIFICATION_DELAY"
  | "MISSING_OPTIONAL_METADATA"
  | "UNAUTHORIZED_INSERTION"
  | "UNAUTHORIZED_DELETION"
  | "CHAIN_REORDERING"
  | "UNKNOWN_INTEGRITY_STATE";

export type GovernanceIntegrityObservation = Readonly<{
  observation_id: string;
  monitor_id: string;
  observed_at: string;
  chain_id: string;
  tenant_id: string;
  mission_id: string;
  observed_record_count: number;
  expected_record_count: number;
  observed_root_hash: string;
  expected_root_hash: string;
  observed_latest_hash: string;
  replay_chain_hash: string;
  lineage_hash: string;
  validation_state: GovernanceIntegrityState;
  observation_hash: string;
}>;

export type GovernanceTamperViolation = Readonly<{
  violation_id: string;
  violation_type: GovernanceTamperViolationType;
  reason: GovernanceTamperDetectionReason;
  integrity_state: GovernanceIntegrityState;
  path: string;
  message: string;
  evidence_hashes: readonly string[];
  detected_at: string;
}>;

export type GovernanceTamperTruthLedgerEvent = Readonly<{
  ledger_event_id: string;
  event_type: GovernanceTamperViolationType;
  chain_id: string;
  tenant_id: string;
  mission_id: string;
  violation_ids: readonly string[];
  evidence_hash: string;
  recorded_at: string;
  append_only: true;
}>;

export type GovernanceTamperResponse = Readonly<{
  response_id: string;
  response_state: GovernanceIntegrityState;
  downstream_blocked: boolean;
  operator_notification_required: boolean;
  recovery_required: boolean;
  response_actions: readonly string[];
  response_hash: string;
}>;

export type GovernanceTamperDetectionReport = Readonly<{
  phase_version: "7I.3";
  schema_version: "governance-tamper-detection/v7I.3";
  detection_id: string;
  monitoring_state: "MONITORING" | "DEGRADED" | "CORRUPTION_CONFIRMED";
  integrity_state: GovernanceIntegrityState;
  source_chain: GovernanceHashChainExecution;
  observation: GovernanceIntegrityObservation;
  violations: readonly GovernanceTamperViolation[];
  truth_ledger_events: readonly GovernanceTamperTruthLedgerEvent[];
  response: GovernanceTamperResponse;
  report_hash: string;
  advisory_only_notice: string;
}>;

export type GovernanceTamperDetectionInput = Readonly<{
  scenario?: GovernanceTamperScenario;
  hash_chain_scenario?: GovernanceHashChainScenario;
  chain?: GovernanceHashChainExecution;
  tenant_id?: string;
  mission_id?: string;
  created_by?: string;
}>;

export type GovernanceTamperObservabilitySurface = Readonly<{
  detection_id: string;
  chain_id: string;
  tenant_id: string;
  mission_id: string;
  integrity_state: GovernanceIntegrityState;
  monitoring_state: GovernanceTamperDetectionReport["monitoring_state"];
  violation_count: number;
  violations: readonly GovernanceTamperDetectionReason[];
  downstream_blocked: boolean;
  truth_ledger_events: number;
  latest_observation_hash: string;
  advisory_only_notice: string;
}>;
