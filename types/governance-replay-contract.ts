import type { LineageCertificationReport } from "@/types/lineage-certification";

export type GovernanceReplayStatus = "REQUESTED" | "READY" | "VALIDATED" | "REPLAYABLE" | "REJECTED" | "ARCHIVED";

export type GovernanceReplayScope =
  | "FULL_GOVERNANCE_EXECUTION"
  | "SINGLE_RECOMMENDATION"
  | "POLICY_EVALUATION"
  | "COMPLIANCE_REVIEW"
  | "RISK_ANALYSIS"
  | "ESCALATION_DECISION"
  | "GOVERNANCE_EXPLANATION"
  | "CERTIFICATION_REPLAY";

export type GovernanceReplayScenario =
  | "BASELINE"
  | "MISSING_CONTRACT"
  | "DUPLICATE_REPLAY_ID"
  | "MISSING_EXECUTION"
  | "EVIDENCE_INCOMPLETE"
  | "LINEAGE_BROKEN"
  | "HASH_MISMATCH"
  | "TENANT_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "UNSUPPORTED_VERSION"
  | "INTEGRITY_FAILURE"
  | "HIDDEN_STATE"
  | "NON_DETERMINISTIC_SEED"
  | "UNAUTHORIZED_REQUESTOR"
  | "IMMUTABLE_MUTATION";

export type GovernanceReplayFailureReason =
  | "REPLAY_CONTRACT_MISSING"
  | "DUPLICATE_REPLAY_IDENTIFIER"
  | "GOVERNANCE_EXECUTION_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "LINEAGE_BROKEN"
  | "REPLAY_HASH_MISMATCH"
  | "TENANT_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "UNSUPPORTED_REPLAY_VERSION"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "MISSING_REQUIRED_FIELD"
  | "IMMUTABLE_FIELD_MUTATION"
  | "HIDDEN_REPLAY_STATE"
  | "REPLAY_AUTHORIZATION_FAILED";

export type GovernanceReplayValidationError = Readonly<{
  code: `GRC-${string}`;
  reason: GovernanceReplayFailureReason;
  field: string;
  message: string;
}>;

export type GovernanceReplayDependency = Readonly<{
  dependency_id: string;
  dependency_type: "CONSTITUTION" | "POLICY" | "AUTHORITY" | "CONFIDENCE_MODEL" | "CERTIFICATION_RULE" | "LINEAGE_GRAPH" | "TRUTH_LEDGER" | "REPLAY_CONTROL";
  reference: string;
  required: true;
  resolved: boolean;
  dependency_hash: string;
}>;

export type GovernanceReplayAuditEntry = Readonly<{
  audit_id: string;
  event_type: "REQUESTED" | "VALIDATED" | "AUTHORIZED" | "REJECTED" | "HASHED" | "REGISTERED";
  requester: string;
  timestamp: string;
  replay_scope: GovernanceReplayScope;
  reconstructed_artifacts: readonly string[];
  verification_results: readonly string[];
  certification_outcome: "PASS" | "FAIL" | "PENDING";
  audit_hash: string;
}>;

export type GovernanceReplayContract = Readonly<{
  governance_replay_id: string;
  tenant_id: string;
  mission_id: string;
  governance_session_id: string;
  governance_execution_id: string;
  replay_version: "governance-replay-contract/v7H.1";
  replay_timestamp: string;
  replay_status: GovernanceReplayStatus;
  replay_scope: GovernanceReplayScope;
  original_execution_timestamp: string;
  replay_requestor: string;
  governance_contract_reference: string;
  truth_ledger_reference: string;
  policy_reference_ids: readonly string[];
  compliance_reference_ids: readonly string[];
  risk_reference_ids: readonly string[];
  recommendation_reference_ids: readonly string[];
  escalation_reference_ids: readonly string[];
  lineage_reference_ids: readonly string[];
  evidence_reference_ids: readonly string[];
  input_reconstruction_reference: string;
  state_reconstruction_reference: string;
  output_verification_reference: string;
  confidence_reference: string;
  governance_hash: string;
  reconstruction_hash: string;
  replay_hash: string;
  certification_hash: string;
  integrity_hash: string;
  explainability_reference: string;
  deterministic_seed: string;
  constitutional_reference: string;
  authority_reference: string;
  tenant_boundary_reference: string;
  replay_notes: readonly string[];
  dependencies: readonly GovernanceReplayDependency[];
  audit_log: readonly GovernanceReplayAuditEntry[];
  source_certification: LineageCertificationReport;
  contract_hash: string;
}>;

export type GovernanceReplayEngineInput = Readonly<{
  scenario?: GovernanceReplayScenario;
  tenant_id?: string;
  mission_id?: string;
  replay_scope?: GovernanceReplayScope;
  replay_requestor?: string;
}>;

export type GovernanceReplayIdentity = Readonly<{
  governance_replay_id: string;
  governance_execution_id: string;
  governance_session_id: string;
  replay_version: GovernanceReplayContract["replay_version"];
  identity_hash: string;
}>;

export type GovernanceReplayReferenceRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  mission_id: string;
  replay_ids: readonly string[];
  truth_ledger_references: readonly string[];
  governance_ledger_references: readonly string[];
  policy_ledger_references: readonly string[];
  compliance_ledger_references: readonly string[];
  risk_ledger_references: readonly string[];
  recommendation_ledger_references: readonly string[];
  escalation_ledger_references: readonly string[];
  lineage_graph_references: readonly string[];
  evidence_graph_references: readonly string[];
  all_references_resolved: boolean;
  registry_hash: string;
}>;

export type GovernanceReplayDeterministicConfig = Readonly<{
  config_id: string;
  deterministic_seed: string;
  ordering_strategy: "LEXICOGRAPHIC_STABLE";
  timestamp_source: "ORIGINAL_EXECUTION_ONLY";
  external_data_policy: "PROHIBITED";
  mutable_cache_policy: "PROHIBITED";
  hidden_configuration_policy: "PROHIBITED";
  replay_sequence: readonly string[];
  config_hash: string;
}>;

export type GovernanceReplayAuthorizationResult = Readonly<{
  governance_replay_id: string;
  authorized: boolean;
  replay_requestor: string;
  required_role: "GOVERNANCE_REPLAY_OPERATOR";
  authority_reference: string;
  tenant_boundary_reference: string;
  failures: readonly GovernanceReplayFailureReason[];
  authorization_hash: string;
}>;

export type GovernanceReplayValidationResult = Readonly<{
  governance_replay_id: string | null;
  validation_state: "VALID" | "INVALID";
  replay_ready: boolean;
  hash_valid: boolean;
  tenant_isolated: boolean;
  dependencies_resolved: boolean;
  references_resolved: boolean;
  deterministic_controls_valid: boolean;
  authorization_valid: boolean;
  certification_ready: boolean;
  errors: readonly GovernanceReplayValidationError[];
  validation_hash: string;
}>;

export type GovernanceReplayObservabilitySurface = Readonly<{
  governance_replay_id: string;
  replay_status: GovernanceReplayStatus;
  replay_scope: GovernanceReplayScope;
  validation_state: GovernanceReplayValidationResult["validation_state"];
  replay_ready: boolean;
  dependency_count: number;
  evidence_reference_count: number;
  lineage_reference_count: number;
  audit_events: number;
  failures: readonly GovernanceReplayFailureReason[];
  advisory_only_notice: string;
}>;
