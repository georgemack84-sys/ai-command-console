import type { AdaptiveSimulationContractResult } from "@/types/adaptive-simulation-contract";

export type HistoricalReplayOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "REQUIRES_MORE_EVIDENCE" | "REQUIRES_GOVERNANCE_REVIEW";

export type HistoricalReplayScope =
  | "PREVIOUS_MISSIONS"
  | "PREVIOUS_DECISIONS"
  | "PREVIOUS_RECOMMENDATIONS"
  | "OPERATOR_ACTIONS"
  | "GOVERNANCE_REVIEWS"
  | "APPROVAL_WORKFLOWS"
  | "ROLLBACK_EVENTS"
  | "CONFIDENCE_EVOLUTION"
  | "RISK_EVOLUTION";

export type HistoricalReplayDataSource =
  | "TRUTH_LEDGER"
  | "RECOMMENDATION_LEDGER"
  | "DECISION_GRAPH"
  | "GOVERNANCE_LEDGER"
  | "REPLAY_LEDGER"
  | "RISK_HISTORY"
  | "CONFIDENCE_HISTORY"
  | "MISSION_TIMELINE"
  | "OPERATOR_ACTIVITY_LEDGER"
  | "APPROVAL_LEDGER"
  | "ROLLBACK_LEDGER";

export type HistoricalReplayFailure =
  | "ADAPTIVE_SIMULATION_CONTRACT_UNAVAILABLE"
  | "NONDETERMINISTIC_REPLAY"
  | "REPLAY_DIFFERS_FROM_HISTORY"
  | "RECOMMENDATION_INCONSISTENCY"
  | "EVIDENCE_MISMATCH"
  | "GOVERNANCE_BEHAVIOR_CHANGED"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_WORKFLOW_CHANGED"
  | "APPROVAL_SEQUENCE_CHANGED"
  | "REPLAY_HASH_MISMATCH"
  | "MISSING_HISTORICAL_EVIDENCE"
  | "ROLLBACK_INCONSISTENCY"
  | "TENANT_ISOLATION_BREACH"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "SYNTHETIC_DATA_INTRODUCED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "APPROVAL_OR_DEPLOYMENT_ATTEMPT";

export type HistoricalReplayScenario =
  | "BASELINE"
  | "CONDITIONAL_REPORTING"
  | "NONDETERMINISTIC"
  | "REPLAY_DIFFERENCE"
  | "RECOMMENDATION_INCONSISTENCY"
  | "EVIDENCE_MISMATCH"
  | "GOVERNANCE_CHANGE"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_WORKFLOW_CHANGE"
  | "APPROVAL_SEQUENCE_CHANGE"
  | "REPLAY_HASH_MISMATCH"
  | "MISSING_HISTORICAL_EVIDENCE"
  | "ROLLBACK_INCONSISTENCY"
  | "TENANT_ISOLATION_BREACH"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_FAILURE"
  | "SYNTHETIC_DATA"
  | "PRODUCTION_MUTATION"
  | "APPROVAL_OR_DEPLOYMENT";

export type HistoricalReplayValidationCheck = Readonly<{
  scope: HistoricalReplayScope;
  replayed_elements: readonly string[];
  validation_requirements: readonly string[];
  passed: boolean;
  failures: readonly HistoricalReplayFailure[];
  integrity_hash: string;
}>;

export type HistoricalReplayValidation = Readonly<{
  replay_id: string;
  proposal_id: string;
  tenant_id: string;
  replay_scope: readonly HistoricalReplayScope[];
  historical_execution_reference: string;
  replay_execution_reference: string;
  baseline_hash: string;
  replay_hash: string;
  deterministic: boolean;
  replay_matches_history: boolean;
  recommendation_consistent: boolean;
  governance_preserved: boolean;
  operator_preserved: boolean;
  evidence_consistent: boolean;
  confidence_consistent: boolean;
  risk_consistent: boolean;
  replay_explanation: string;
  validation_result: HistoricalReplayOutcome;
  integrity_hash: string;
}>;

export type HistoricalReplayMetrics = Readonly<{
  replay_scopes_validated: number;
  data_sources_authorized: number;
  validation_checks_passed: number;
  validation_checks_total: number;
  deterministic_replay_rate: number;
  replay_match_rate: number;
  recommendation_consistency_rate: number;
  evidence_consistency_rate: number;
  governance_preservation_rate: number;
  operator_preservation_rate: number;
  confidence_consistency_rate: number;
  risk_consistency_rate: number;
  failures: readonly HistoricalReplayFailure[];
  integrity_hash: string;
}>;

export type HistoricalReplayApiSurface = Readonly<{
  api_id: string;
  validate_replay: "POST /historical-replay-test-harness/validate";
  retrieve_scopes: "POST /historical-replay-test-harness/scopes";
  retrieve_data_sources: "POST /historical-replay-test-harness/data-sources";
  retrieve_metrics: "POST /historical-replay-test-harness/metrics";
  replay_validation: "POST /historical-replay-test-harness/replay";
  inspect_harness: "POST /historical-replay-test-harness/inspect";
  retrieve_contract: "GET /historical-replay-test-harness/contract";
  synthetic_data_supported: false;
  production_mutation_supported: false;
  approval_or_deployment_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type HistoricalReplayInput = Readonly<{
  scenario?: HistoricalReplayScenario;
  proposal_id?: string;
  tenant_id?: string;
  adaptive_simulation_contract?: AdaptiveSimulationContractResult;
}>;

export type HistoricalReplayHarnessResult = Readonly<{
  historical_replay_test_harness_version: "historical-replay-test-harness/v1";
  harness_identifier: "HistoricalReplayTestHarness";
  api_surface: HistoricalReplayApiSurface;
  adaptive_simulation_contract: AdaptiveSimulationContractResult;
  authorized_data_sources: readonly HistoricalReplayDataSource[];
  validation_checks: readonly HistoricalReplayValidationCheck[];
  validation: HistoricalReplayValidation;
  metrics: HistoricalReplayMetrics;
  outcome: HistoricalReplayOutcome;
  failures: readonly HistoricalReplayFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  immutable_historical_records_preserved: true;
  tenant_isolated: boolean;
  governance_preserved: boolean;
  constitutional_behavior_preserved: boolean;
  operator_authority_preserved: boolean;
  advisory_only: true;
  synthetic_data_introduced: false;
  modifies_history: false;
  modifies_production_behavior: false;
  approves_or_deploys_proposal: false;
  baseline_replay_package_hash: string;
  replay_integrity_report_hash: string;
  replay_determinism_report_hash: string;
  simulation_validation_ledger_entry_hash: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type HistoricalReplayFoundation = Readonly<{
  historical_replay_test_harness_version: "historical-replay-test-harness/v1";
  supported_scopes: readonly HistoricalReplayScope[];
  authorized_data_sources: readonly HistoricalReplayDataSource[];
  api_surface: HistoricalReplayApiSurface;
  result: HistoricalReplayHarnessResult;
}>;
