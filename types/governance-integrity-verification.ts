import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceHashChainExecution } from "@/types/governance-hash-chain";
import type { GovernanceTamperDetectionReport, GovernanceTamperScenario } from "@/types/governance-tamper-detection";

export type GovernanceIntegrityVerificationMode = "CONTINUOUS" | "SCHEDULED" | "ON_DEMAND";

export type GovernanceIntegrityVerificationScenario =
  | "BASELINE"
  | "CONTRACT_SCHEMA_INVALID"
  | "IMMUTABLE_IDENTITY_MODIFIED"
  | "CONTENT_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "GOVERNANCE_CHAIN_INCOMPLETE"
  | "LINEAGE_RECONSTRUCTION_FAILED"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "UNSUPPORTED_VERIFICATION_VERSION"
  | "OPTIONAL_METADATA_UNAVAILABLE"
  | "DELAYED_VERIFICATION_EXECUTION"
  | "UNKNOWN_VERIFICATION_STATE";

export type GovernanceIntegrityVerificationFailure =
  | "CONTRACT_SCHEMA_INVALID"
  | "IMMUTABLE_IDENTITY_MODIFIED"
  | "CONTENT_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "GOVERNANCE_CHAIN_INCOMPLETE"
  | "LINEAGE_RECONSTRUCTION_FAILED"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "UNSUPPORTED_VERIFICATION_VERSION"
  | "OPTIONAL_METADATA_UNAVAILABLE"
  | "DELAYED_VERIFICATION_EXECUTION"
  | "UNKNOWN_VERIFICATION_STATE";

export type GovernanceIntegrityVerificationModule =
  | "CONTRACT"
  | "IDENTITY"
  | "HASH"
  | "CHAIN"
  | "LINEAGE"
  | "REPLAY"
  | "EVIDENCE"
  | "TENANT"
  | "DECISION";

export type GovernanceIntegrityVerificationResult = Readonly<{
  module: GovernanceIntegrityVerificationModule;
  state: GovernanceIntegrityState;
  passed: boolean;
  failure: GovernanceIntegrityVerificationFailure | null;
  message: string;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type GovernanceIntegrityVerificationTruthLedgerRecord = Readonly<{
  verification_record_id: string;
  verification_id: string;
  tenant_id: string;
  mission_id: string;
  integrity_state: GovernanceIntegrityState;
  result_hashes: readonly string[];
  tamper_event_ids: readonly string[];
  evidence_hash: string;
  recorded_at: string;
  append_only: true;
}>;

export type GovernanceIntegrityVerificationReport = Readonly<{
  phase_version: "7I.4";
  schema_version: "governance-integrity-verification/v7I.4";
  verification_id: string;
  verification_mode: GovernanceIntegrityVerificationMode;
  verification_timestamp: string;
  verification_scope: string;
  verified_governance_object: string;
  tenant_id: string;
  mission_id: string;
  source_chain: GovernanceHashChainExecution;
  tamper_report: GovernanceTamperDetectionReport;
  verification_results: readonly GovernanceIntegrityVerificationResult[];
  integrity_state: GovernanceIntegrityState;
  downstream_trust_allowed: boolean;
  certification_ready: boolean;
  failure_details: readonly GovernanceIntegrityVerificationFailure[];
  supporting_evidence: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  operator_summary: string;
  truth_ledger_record: GovernanceIntegrityVerificationTruthLedgerRecord;
  report_hash: string;
  advisory_only_notice: string;
}>;

export type GovernanceIntegrityVerificationInput = Readonly<{
  scenario?: GovernanceIntegrityVerificationScenario;
  mode?: GovernanceIntegrityVerificationMode;
  tamper_scenario?: GovernanceTamperScenario;
  chain?: GovernanceHashChainExecution;
  tamper_report?: GovernanceTamperDetectionReport;
  tenant_id?: string;
  mission_id?: string;
  created_by?: string;
}>;

export type GovernanceIntegrityVerificationObservabilitySurface = Readonly<{
  verification_id: string;
  verification_mode: GovernanceIntegrityVerificationMode;
  tenant_id: string;
  mission_id: string;
  integrity_state: GovernanceIntegrityState;
  downstream_trust_allowed: boolean;
  certification_ready: boolean;
  failed_modules: readonly GovernanceIntegrityVerificationModule[];
  failure_details: readonly GovernanceIntegrityVerificationFailure[];
  truth_ledger_record_id: string;
  report_hash: string;
  advisory_only_notice: string;
}>;
