import type { TenantIsolationResult } from "@/types/tenant-isolation-privacy-enforcement";

export type AdaptiveMemoryReplayStatus = "AUTHORITATIVE" | "REJECTED";

export type ReplayValidationOutcome =
  | "VALID"
  | "REPLAY_DIVERGENCE"
  | "INCOMPLETE_LINEAGE"
  | "INTEGRITY_FAILURE";

export type ReplayValidator =
  | "MEMORY_RETRIEVAL"
  | "LINEAGE_RECOVERY"
  | "MISSION_RECONSTRUCTION"
  | "EVIDENCE_RECONSTRUCTION"
  | "GOVERNANCE_RECONSTRUCTION"
  | "SIMULATION_RECONSTRUCTION"
  | "OUTCOME_RECONSTRUCTION"
  | "CERTIFICATION_RECONSTRUCTION"
  | "TENANT_ISOLATION_VALIDATION"
  | "INTEGRITY_VERIFICATION";

export type AdaptiveMemoryReplayFailure =
  | "TENANT_ISOLATION_UNAVAILABLE"
  | "REPLAY_NONDETERMINISTIC"
  | "HISTORICAL_RECONSTRUCTION_DIVERGED"
  | "LINEAGE_INCOMPLETE"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_HISTORY_ALTERED"
  | "SIMULATION_RECONSTRUCTION_FAILED"
  | "OUTCOME_INCONSISTENT"
  | "CERTIFICATION_MISMATCH"
  | "REPLAY_INTEGRITY_COMPROMISED"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_VALIDATION_BYPASSED";

export type AdaptiveMemoryReplayScenario =
  | "BASELINE"
  | "TENANT_ISOLATION_UNAVAILABLE"
  | "NONDETERMINISTIC_REPLAY"
  | "REPLAY_DIVERGENCE"
  | "INCOMPLETE_LINEAGE"
  | "MISSING_EVIDENCE"
  | "ALTERED_GOVERNANCE"
  | "SIMULATION_FAILURE"
  | "OUTCOME_MISMATCH"
  | "CERTIFICATION_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "VALIDATION_BYPASS";

export type ReplayValidationReport = Readonly<{
  validator: ReplayValidator;
  valid: boolean;
  deterministic: boolean;
  replayable: boolean;
  outcome: ReplayValidationOutcome;
  explanation: string;
  integrity_hash: string;
}>;

export type ReconstructedMission = Readonly<{
  mission_id: string;
  tenant_id: string;
  originating_memory_id: string;
  operational_context_hash: string;
  historical_state_hash: string;
  reconstruction_order: readonly string[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type MemoryReplayRecord = Readonly<{
  replay_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  replay_timestamp: string;
  replay_scope: "COMPLETE_MEMORY_LIFECYCLE";
  reconstructed_mission: ReconstructedMission;
  evidence_refs: readonly string[];
  recommendation_refs: readonly string[];
  governance_refs: readonly string[];
  simulation_refs: readonly string[];
  outcome_refs: readonly string[];
  certification_refs: readonly string[];
  lineage_refs: readonly string[];
  validators: readonly ReplayValidationReport[];
  replay_status: ReplayValidationOutcome;
  source_isolation_hash: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MemoryReplayLedgerEntry = Readonly<{
  ledger_id: string;
  replay_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "REPLAY_REQUEST"
    | "MEMORY_RETRIEVAL"
    | "LINEAGE_RECOVERY"
    | "MISSION_RECONSTRUCTION"
    | "EVIDENCE_RECOVERY"
    | "GOVERNANCE_RECONSTRUCTION"
    | "SIMULATION_RECONSTRUCTION"
    | "OUTCOME_RECONSTRUCTION"
    | "REPLAY_VALIDATION"
    | "INTEGRITY_VERIFICATION"
    | "REPLAY_OUTCOME";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemoryReplayContract = Readonly<{
  contract_id: "adaptive-memory-replay-engine-contract";
  version: "adaptive-memory-replay-engine/v1";
  architecture: readonly string[];
  validators: readonly ReplayValidator[];
  outcomes: readonly ReplayValidationOutcome[];
  replay_rules: readonly string[];
  deterministic_replay_rules: readonly string[];
  validation_rules: readonly string[];
  security_requirements: readonly string[];
  replay_guarantees: readonly string[];
  replay_before_trust: true;
  historical_fidelity: true;
  evidence_centric_replay: true;
  governance_preservation: true;
  advisory_only: true;
  tenant_isolation_required: true;
  integrity_hash: string;
}>;

export type AdaptiveMemoryReplayMetrics = Readonly<{
  replay_requests: number;
  replay_duration_ms: number;
  replay_success_rate: number;
  replay_failures: number;
  replay_divergence_events: number;
  lineage_completeness: number;
  reconstruction_latency_ms: number;
  integrity_failures: number;
  authorization_failures: number;
  replay_validation_accuracy: number;
  failures: readonly AdaptiveMemoryReplayFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryReplayApiSurface = Readonly<{
  api_id: string;
  establish_engine: "POST /adaptive-memory-replay-engine/establish";
  retrieve_contract: "GET /adaptive-memory-replay-engine/contract";
  retrieve_records: "POST /adaptive-memory-replay-engine/records";
  retrieve_lineage: "POST /adaptive-memory-replay-engine/lineage";
  retrieve_validation: "POST /adaptive-memory-replay-engine/validation";
  retrieve_ledger: "POST /adaptive-memory-replay-engine/ledger";
  retrieve_metrics: "POST /adaptive-memory-replay-engine/metrics";
  replay_engine: "POST /adaptive-memory-replay-engine/replay";
  inspect_engine: "POST /adaptive-memory-replay-engine/inspect";
  production_mutation_supported: false;
  historical_optimization_supported: false;
  tenant_bypass_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryReplayInput = Readonly<{
  scenario?: AdaptiveMemoryReplayScenario;
  tenant_isolation_result?: TenantIsolationResult;
}>;

export type AdaptiveMemoryReplayResult = Readonly<{
  adaptive_memory_replay_version: "adaptive-memory-replay-engine/v1";
  engine_identifier: "AdaptiveMemoryReplayEngine";
  status: AdaptiveMemoryReplayStatus;
  api_surface: AdaptiveMemoryReplayApiSurface;
  tenant_isolation_result: TenantIsolationResult;
  contract: AdaptiveMemoryReplayContract;
  replay_records: readonly MemoryReplayRecord[];
  replay_ledger: readonly MemoryReplayLedgerEntry[];
  metrics: AdaptiveMemoryReplayMetrics;
  failures: readonly AdaptiveMemoryReplayFailure[];
  deterministic: boolean;
  replayable: boolean;
  historical_fidelity_preserved: boolean;
  evidence_provenance_preserved: boolean;
  governance_preserved: boolean;
  tenant_isolation_enforced: boolean;
  advisory_only: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryReplayEngine = Readonly<{
  adaptive_memory_replay_version: "adaptive-memory-replay-engine/v1";
  supported_validators: readonly ReplayValidator[];
  supported_outcomes: readonly ReplayValidationOutcome[];
  api_surface: AdaptiveMemoryReplayApiSurface;
  result: AdaptiveMemoryReplayResult;
}>;
