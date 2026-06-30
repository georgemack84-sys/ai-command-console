import type { GovernanceReplayContract, GovernanceReplayValidationResult } from "@/types/governance-replay-contract";

export type GovernanceInputReconstructionState = "REQUESTED" | "RECONSTRUCTED" | "VALIDATED" | "REPLAY_READY" | "FAILED";

export type GovernanceInputReconstructionScenario =
  | "BASELINE"
  | "MISSING_CONTRACT"
  | "GOVERNANCE_RECORDS_MISSING"
  | "EVIDENCE_MISSING"
  | "POLICY_VERSION_UNAVAILABLE"
  | "COMPLIANCE_INCOMPLETE"
  | "RISK_LINEAGE_BROKEN"
  | "RECOMMENDATION_LINEAGE_MISSING"
  | "ESCALATION_UNRESOLVED"
  | "CONFIG_UNAVAILABLE"
  | "REPLAY_HASH_INVALID"
  | "TENANT_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "LIVE_SOURCE_DETECTED"
  | "NON_DETERMINISTIC_ORDER";

export type GovernanceInputFailureReason =
  | "REPLAY_CONTRACT_MISSING"
  | "GOVERNANCE_RECORDS_MISSING"
  | "EVIDENCE_MISSING"
  | "POLICY_VERSION_UNAVAILABLE"
  | "COMPLIANCE_RECORDS_INCOMPLETE"
  | "RISK_LINEAGE_BROKEN"
  | "RECOMMENDATION_LINEAGE_MISSING"
  | "ESCALATION_REFERENCES_UNRESOLVED"
  | "CONFIGURATION_UNAVAILABLE"
  | "REPLAY_HASH_INVALID"
  | "TENANT_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "LIVE_SOURCE_DETECTED"
  | "NON_DETERMINISTIC_ORDER"
  | "INPUT_PACKAGE_HASH_MISMATCH";

export type GovernanceInputValidationError = Readonly<{
  code: `GIR-${string}`;
  reason: GovernanceInputFailureReason;
  field: string;
  message: string;
}>;

export type GovernanceInputSource = "TRUTH_LEDGER" | "GOVERNANCE_LEDGER" | "POLICY_LEDGER" | "COMPLIANCE_LEDGER" | "RISK_LEDGER" | "RECOMMENDATION_LEDGER" | "ESCALATION_LEDGER" | "LINEAGE_GRAPH" | "EVIDENCE_GRAPH";

export type GovernanceInputRecord = Readonly<{
  record_id: string;
  source: GovernanceInputSource;
  tenant_id: string;
  mission_id: string;
  version: string;
  original_timestamp: string;
  source_reference: string;
  payload_hash: string;
  integrity_status: "VERIFIED" | "FAILED";
  immutable: boolean;
}>;

export type GovernanceInputContext = Readonly<{
  context_id: string;
  category: "GOVERNANCE" | "CONSTITUTIONAL" | "POLICY" | "COMPLIANCE" | "RISK" | "RECOMMENDATION" | "ESCALATION" | "EVIDENCE" | "LINEAGE" | "CONFIGURATION";
  records: readonly GovernanceInputRecord[];
  restored_fields: readonly string[];
  context_hash: string;
}>;

export type GovernanceInputIntegrityResult = Readonly<{
  integrity_id: string;
  record_id: string;
  source: GovernanceInputSource;
  hash_verified: boolean;
  signature_verified: boolean;
  tenant_verified: boolean;
  lineage_verified: boolean;
  integrity_hash: string;
}>;

export type GovernanceInputAuditEntry = Readonly<{
  audit_id: string;
  requester: string;
  timestamp: string;
  reconstructed_artifacts: readonly string[];
  validation_results: readonly string[];
  integrity_status: "VERIFIED" | "FAILED";
  reconstruction_duration_ms: number;
  audit_hash: string;
}>;

export type GovernanceReplayInputPackage = Readonly<{
  reconstruction_id: string;
  phase_version: "7H.2";
  schema_version: "governance-input-reconstruction/v7H.2";
  state: GovernanceInputReconstructionState;
  replay_contract: GovernanceReplayContract;
  replay_contract_validation: GovernanceReplayValidationResult;
  replay_identity: Readonly<{
    governance_replay_id: string;
    governance_execution_id: string;
    governance_session_id: string;
    replay_version: string;
  }>;
  governance_context: GovernanceInputContext;
  constitutional_context: GovernanceInputContext;
  policy_context: GovernanceInputContext;
  compliance_context: GovernanceInputContext;
  risk_context: GovernanceInputContext;
  recommendation_context: GovernanceInputContext;
  escalation_context: GovernanceInputContext;
  evidence_context: GovernanceInputContext;
  lineage_context: GovernanceInputContext;
  configuration_context: GovernanceInputContext;
  deterministic_parameters: Readonly<{
    deterministic_seed: string;
    ordering_strategy: "ORIGINAL_EXECUTION_ORDER";
    timestamp_policy: "PRESERVE_HISTORICAL_TIMESTAMPS";
    live_data_policy: "PROHIBITED";
    source_policy: "IMMUTABLE_LEDGER_ONLY";
    processing_order: readonly string[];
  }>;
  truth_ledger_resolutions: readonly string[];
  integrity_results: readonly GovernanceInputIntegrityResult[];
  audit_log: readonly GovernanceInputAuditEntry[];
  failures: readonly GovernanceInputFailureReason[];
  input_package_hash: string;
}>;

export type GovernanceInputReconstructionInput = Readonly<{
  scenario?: GovernanceInputReconstructionScenario;
  contract?: GovernanceReplayContract;
  tenant_id?: string;
  mission_id?: string;
  replay_requestor?: string;
}>;

export type GovernanceInputValidationResult = Readonly<{
  reconstruction_id: string | null;
  validation_state: "VALID" | "INVALID";
  replay_ready: boolean;
  contract_valid: boolean;
  completeness_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  authority_valid: boolean;
  constitutional_valid: boolean;
  ordering_deterministic: boolean;
  immutable_sources_only: boolean;
  errors: readonly GovernanceInputValidationError[];
  validation_hash: string;
}>;

export type GovernanceInputObservabilitySurface = Readonly<{
  reconstruction_id: string;
  state: GovernanceInputReconstructionState;
  replay_ready: boolean;
  context_count: number;
  record_count: number;
  integrity_passed: number;
  integrity_failed: number;
  failures: readonly GovernanceInputFailureReason[];
  advisory_only_notice: string;
}>;
