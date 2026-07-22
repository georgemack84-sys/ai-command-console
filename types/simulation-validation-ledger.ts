import type { ReplayDivergenceResult } from "@/types/replay-divergence-detection-engine";

export type SimulationValidationLedgerStatus = "COMMITTED" | "FAIL_CLOSED";

export type SimulationValidationLedgerOperation =
  | "APPEND_RECORD"
  | "VERIFY_INTEGRITY"
  | "REPLAY_LOOKUP"
  | "PROPOSAL_LOOKUP"
  | "SIMULATION_LOOKUP"
  | "DIVERGENCE_LOOKUP"
  | "CERTIFICATION_LOOKUP"
  | "AUDIT_RETRIEVAL"
  | "LINEAGE_TRAVERSAL";

export type SimulationValidationLedgerFailure =
  | "DIVERGENCE_ANALYSIS_UNAVAILABLE"
  | "RECORD_MODIFICATION_ATTEMPT"
  | "RECORD_DELETION_ATTEMPT"
  | "APPEND_SEQUENCE_CORRUPTION"
  | "REPLAY_ARTIFACT_LOSS"
  | "MISSING_PROPOSAL_LINEAGE"
  | "MISSING_GOVERNANCE_ANALYSIS"
  | "MISSING_OPERATOR_ANALYSIS"
  | "MISSING_CERTIFICATION_RECOMMENDATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_HASH_MISMATCH"
  | "CRYPTOGRAPHIC_VERIFICATION_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "INCOMPLETE_AUDIT_TRAIL"
  | "UNAUTHORIZED_LEDGER_ACCESS";

export type SimulationValidationLedgerScenario =
  | "BASELINE"
  | "DIVERGENCE_UNAVAILABLE"
  | "RECORD_MODIFICATION"
  | "RECORD_DELETION"
  | "APPEND_SEQUENCE_CORRUPTION"
  | "REPLAY_ARTIFACT_LOSS"
  | "MISSING_PROPOSAL_LINEAGE"
  | "MISSING_GOVERNANCE_ANALYSIS"
  | "MISSING_OPERATOR_ANALYSIS"
  | "MISSING_CERTIFICATION_RECOMMENDATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_HASH_MISMATCH"
  | "CRYPTOGRAPHIC_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "INCOMPLETE_AUDIT_TRAIL"
  | "UNAUTHORIZED_ACCESS";

export type SimulationValidationLedgerRecord = Readonly<{
  ledger_record_id: string;
  proposal_id: string;
  simulation_id: string;
  tenant_id: string;
  simulation_configuration: string;
  replay_inputs: string;
  replay_outputs: string;
  divergence_analysis: string;
  improvement_metrics: string;
  governance_analysis: string;
  operator_analysis: string;
  certification_recommendation: string;
  replay_hash: string;
  integrity_hash: string;
  previous_record_hash: string;
  ledger_sequence: number;
  recorded_timestamp: string;
}>;

export type SimulationValidationLedgerPackage = Readonly<{
  simulation_audit_package_hash: string;
  replay_reconstruction_package_hash: string;
  governance_evidence_package_hash: string;
  operator_evidence_package_hash: string;
  certification_evidence_package_hash: string;
  ledger_integrity_report_hash: string;
  lineage_verification_report_hash: string;
  integrity_hash: string;
}>;

export type SimulationValidationLedgerMetrics = Readonly<{
  records_committed: number;
  append_only_enforced: boolean;
  immutable_storage_enforced: boolean;
  replay_reconstruction_supported: boolean;
  proposal_lineage_complete: boolean;
  evidence_lineage_complete: boolean;
  governance_lineage_complete: boolean;
  certification_lineage_complete: boolean;
  operator_lineage_complete: boolean;
  tenant_isolation_enforced: boolean;
  cryptographic_verification_passed: boolean;
  audit_trail_complete: boolean;
  failures: readonly SimulationValidationLedgerFailure[];
  integrity_hash: string;
}>;

export type SimulationValidationLedgerApiSurface = Readonly<{
  api_id: string;
  append_record: "POST /simulation-validation-ledger/append";
  verify_integrity: "POST /simulation-validation-ledger/verify";
  replay_lookup: "POST /simulation-validation-ledger/replay-lookup";
  proposal_lookup: "POST /simulation-validation-ledger/proposal-lookup";
  simulation_lookup: "POST /simulation-validation-ledger/simulation-lookup";
  divergence_lookup: "POST /simulation-validation-ledger/divergence-lookup";
  certification_lookup: "POST /simulation-validation-ledger/certification-lookup";
  audit_retrieval: "POST /simulation-validation-ledger/audit";
  lineage_traversal: "POST /simulation-validation-ledger/lineage";
  retrieve_contract: "GET /simulation-validation-ledger/contract";
  update_supported: false;
  delete_supported: false;
  cross_tenant_access_supported: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type SimulationValidationLedgerInput = Readonly<{
  scenario?: SimulationValidationLedgerScenario;
  proposal_id?: string;
  tenant_id?: string;
  divergence_result?: ReplayDivergenceResult;
}>;

export type SimulationValidationLedgerResult = Readonly<{
  simulation_validation_ledger_version: "simulation-validation-ledger/v1";
  ledger_identifier: "SimulationValidationLedger";
  ledger_status: SimulationValidationLedgerStatus;
  api_surface: SimulationValidationLedgerApiSurface;
  supported_operations: readonly SimulationValidationLedgerOperation[];
  divergence_result: ReplayDivergenceResult;
  record: SimulationValidationLedgerRecord;
  evidence_package: SimulationValidationLedgerPackage;
  metrics: SimulationValidationLedgerMetrics;
  failures: readonly SimulationValidationLedgerFailure[];
  append_only: boolean;
  immutable: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  cryptographically_verifiable: boolean;
  fully_auditable: boolean;
  single_source_of_truth: true;
  update_supported: false;
  delete_supported: false;
  cross_tenant_access_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SimulationValidationLedgerFoundation = Readonly<{
  simulation_validation_ledger_version: "simulation-validation-ledger/v1";
  supported_operations: readonly SimulationValidationLedgerOperation[];
  api_surface: SimulationValidationLedgerApiSurface;
  result: SimulationValidationLedgerResult;
}>;
