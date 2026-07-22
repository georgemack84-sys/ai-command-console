import type { AuthorityGovernanceBindingResult } from "@/types/authority-governance-binding";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveReplayType =
  | "HISTORICAL_REPLAY"
  | "PROPOSAL_REPLAY"
  | "SIMULATION_REPLAY"
  | "GOVERNANCE_REPLAY"
  | "CERTIFICATION_REPLAY"
  | "OPERATOR_DECISION_REPLAY"
  | "ROLLBACK_REPLAY"
  | "FULL_LIFECYCLE_REPLAY";

export type AdaptiveReplayValidationState = "PASS" | "FAIL";

export type AdaptiveReplayCheck =
  | "AUTHORITY_BINDING"
  | "REPLAY_METADATA"
  | "INPUT_LINEAGE"
  | "PROCESSING_LINEAGE"
  | "OUTPUT_LINEAGE"
  | "EVIDENCE_TRACEABILITY"
  | "SIMULATION_TRACEABILITY"
  | "GOVERNANCE_TRACEABILITY"
  | "OPERATOR_TRACEABILITY"
  | "CERTIFICATION_TRACEABILITY"
  | "DETERMINISTIC_RECONSTRUCTION"
  | "INTEGRITY_VERIFICATION"
  | "LEDGER_IMMUTABILITY";

export type AdaptiveReplayFailure =
  | "AUTHORITY_BINDING_INVALID"
  | "REPLAY_IDENTIFIER_MISSING"
  | "INPUT_LINEAGE_INCOMPLETE"
  | "OUTPUT_LINEAGE_INCOMPLETE"
  | "PROCESSING_LINEAGE_INCOMPLETE"
  | "EVIDENCE_REFERENCES_MISSING"
  | "SIMULATION_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "OPERATOR_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "REPLAY_STEPS_MISSING"
  | "DETERMINISTIC_RECONSTRUCTION_DIFFERED"
  | "REPLAY_RESULT_MISMATCH"
  | "INTEGRITY_HASH_MISMATCH"
  | "HIDDEN_ADAPTIVE_PROCESSING"
  | "UNDOCUMENTED_REASONING"
  | "REPLAY_BYPASS"
  | "EVIDENCE_SUBSTITUTION"
  | "SIMULATION_OMISSION"
  | "GOVERNANCE_OMISSION"
  | "OPERATOR_OMISSION"
  | "CERTIFICATION_OMISSION"
  | "HISTORICAL_RECORD_MUTATION"
  | "FAIL_OPEN_REPLAY_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type AdaptiveReplayRecord = Readonly<{
  replay_id: string;
  replay_version: string;
  adaptation_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  replay_type: AdaptiveReplayType;
  input_lineage_refs: readonly string[];
  output_lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  certification_refs: readonly string[];
  replay_steps: readonly string[];
  replay_result: "MATCH" | "DIVERGED";
  deterministic_verified: boolean;
  created_at: string;
  integrity_hash: string;
}>;

export type AdaptiveReplayMetadata = Readonly<{
  metadata_id: string;
  replay_id: string;
  proposal_id: string;
  component_versions: readonly string[];
  adaptive_capability: string;
  execution_timestamps: readonly string[];
  lifecycle_state: string;
  replay_environment: string;
  deterministic_verification: boolean;
  append_only: true;
  integrity_hash: string;
}>;

export type AdaptiveLineageContract = Readonly<{
  lineage_id: string;
  replay_id: string;
  input_lineage: readonly string[];
  processing_lineage: readonly string[];
  output_lineage: readonly string[];
  every_output_has_input: boolean;
  reasoning_path_complete: boolean;
  integrity_hash: string;
}>;

export type AdaptiveReplayVerification = Readonly<{
  verification_id: string;
  replay_id: string;
  identical_inputs: boolean;
  identical_evidence: boolean;
  identical_processing_sequence: boolean;
  identical_governance_decisions: boolean;
  identical_simulation_outcomes: boolean;
  identical_recommendations: boolean;
  identical_integrity_hashes: boolean;
  verification_result: AdaptiveReplayValidationState;
  integrity_hash: string;
}>;

export type AdaptiveReplayCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly AdaptiveReplayCheck[];
  metadata_complete: boolean;
  lineage_complete: boolean;
  evidence_complete: boolean;
  simulation_complete: boolean;
  governance_complete: boolean;
  operator_complete: boolean;
  certification_complete: boolean;
  deterministic_replay_verified: boolean;
  integrity_verified: boolean;
  ledger_immutable: boolean;
  audit_ready: boolean;
  failure_analysis: readonly AdaptiveReplayFailure[];
  certification_decision: AdaptiveReplayValidationState;
  integrity_hash: string;
}>;

export type AdaptiveTraceabilityLedgerRecord = Readonly<{
  record_id: string;
  replay_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  replay_type: AdaptiveReplayType;
  validation_result: AdaptiveReplayValidationState;
  lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_refs: readonly string[];
  certification_refs: readonly string[];
  deterministic_status: boolean;
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type AdaptiveReplayValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  authority_binding_valid: boolean;
  replay_identifier_present: boolean;
  input_lineage_complete: boolean;
  processing_lineage_complete: boolean;
  output_lineage_complete: boolean;
  evidence_complete: boolean;
  simulation_complete: boolean;
  governance_complete: boolean;
  operator_complete: boolean;
  certification_complete: boolean;
  deterministic_reconstruction: boolean;
  replay_steps_reproducible: boolean;
  integrity_verified: boolean;
  ledger_immutable: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly AdaptiveReplayFailure[];
  integrity_hash: string;
}>;

export type AdaptiveReplayTraceabilityInput = Readonly<{
  authority_binding?: AuthorityGovernanceBindingResult;
  role?: VisibilityRole;
  replay_type?: AdaptiveReplayType;
  scenario?:
    | "BASELINE"
    | "AUTHORITY_INVALID"
    | "MISSING_REPLAY_ID"
    | "MISSING_INPUT_LINEAGE"
    | "MISSING_OUTPUT_LINEAGE"
    | "MISSING_PROCESSING_LINEAGE"
    | "MISSING_EVIDENCE"
    | "MISSING_SIMULATION"
    | "MISSING_GOVERNANCE"
    | "MISSING_OPERATOR"
    | "MISSING_CERTIFICATION"
    | "MISSING_REPLAY_STEPS"
    | "DETERMINISM_MISMATCH"
    | "REPLAY_RESULT_MISMATCH"
    | "HASH_MISMATCH"
    | "HIDDEN_PROCESSING"
    | "UNDOCUMENTED_REASONING"
    | "REPLAY_BYPASS"
    | "EVIDENCE_SUBSTITUTION"
    | "SIMULATION_OMISSION"
    | "GOVERNANCE_OMISSION"
    | "OPERATOR_OMISSION"
    | "CERTIFICATION_OMISSION"
    | "HISTORICAL_MUTATION"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type AdaptiveReplayTraceabilityResult = Readonly<{
  replay_contract_version: "adaptive-replay-traceability-contract/v1";
  authority_binding: AuthorityGovernanceBindingResult;
  replay_record: AdaptiveReplayRecord;
  metadata: AdaptiveReplayMetadata;
  lineage_contract: AdaptiveLineageContract;
  verification: AdaptiveReplayVerification;
  certification_report: AdaptiveReplayCertificationReport;
  traceability_ledger: readonly AdaptiveTraceabilityLedgerRecord[];
  validation: AdaptiveReplayValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  traceability_complete: boolean;
  permits_execution: false;
  mutates_history: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveReplayTraceabilityFoundation = Readonly<{
  replay_contract_version: "adaptive-replay-traceability-contract/v1";
  checks: readonly AdaptiveReplayCheck[];
  replay_types: readonly AdaptiveReplayType[];
  result: AdaptiveReplayTraceabilityResult;
}>;
