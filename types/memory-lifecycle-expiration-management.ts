import type { AdaptiveMemoryReplayResult } from "@/types/adaptive-memory-replay-engine";

export type MemoryLifecycleStatus = "AUTHORITATIVE" | "REJECTED";

export type MemoryLifecycleState =
  | "CANDIDATE"
  | "QUALIFIED"
  | "APPROVED"
  | "ACTIVE"
  | "REFERENCED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "EXPIRED"
  | "HISTORICAL";

export type LifecycleTransitionOutcome = "TRANSITION_APPROVED" | "TRANSITION_DENIED";

export type LifecycleValidator =
  | "LIFECYCLE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "RETENTION_EVALUATION"
  | "EXPIRATION_EVALUATION"
  | "SUPERSESSION_EVALUATION"
  | "ARCHIVAL_VALIDATION"
  | "REPLAY_VALIDATION"
  | "TENANT_OWNERSHIP_VALIDATION"
  | "INTEGRITY_VERIFICATION";

export type MemoryLifecycleFailure =
  | "REPLAY_ENGINE_UNAVAILABLE"
  | "HISTORICAL_MEMORY_DELETED"
  | "SUPERSESSION_OVERWROTE_PREVIOUS_MEMORY"
  | "EXPIRATION_REMOVED_REPLAY_CAPABILITY"
  | "LIFECYCLE_TRANSITION_NONDETERMINISTIC"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "REPLAY_CONTINUITY_BROKEN"
  | "EVIDENCE_LINEAGE_LOST"
  | "UNAUTHORIZED_LIFECYCLE_TRANSITION"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_VERIFICATION_FAILED";

export type MemoryLifecycleScenario =
  | "BASELINE"
  | "REPLAY_ENGINE_UNAVAILABLE"
  | "HISTORICAL_DELETION"
  | "SUPERSESSION_OVERWRITE"
  | "EXPIRATION_REPLAY_REMOVAL"
  | "NONDETERMINISTIC_TRANSITION"
  | "GOVERNANCE_BYPASS"
  | "REPLAY_CONTINUITY_BREAK"
  | "EVIDENCE_LINEAGE_LOSS"
  | "UNAUTHORIZED_TRANSITION"
  | "TENANT_ISOLATION_BREACH"
  | "INTEGRITY_FAILURE";

export type LifecycleValidationReport = Readonly<{
  validator: LifecycleValidator;
  valid: boolean;
  deterministic: boolean;
  replayable: boolean;
  outcome: LifecycleTransitionOutcome;
  explanation: string;
  integrity_hash: string;
}>;

export type LifecyclePolicy = Readonly<{
  policy_id: string;
  policy_type: "RETENTION" | "EXPIRATION";
  requirements: readonly string[];
  compliant: boolean;
  preserves_historical_memory: true;
  preserves_replayability: boolean;
  integrity_hash: string;
}>;

export type MemoryLifecycleRecord = Readonly<{
  lifecycle_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  previous_state: MemoryLifecycleState;
  new_state: MemoryLifecycleState;
  transition_reason: string;
  expiration_policy: LifecyclePolicy;
  retention_policy: LifecyclePolicy;
  supersession_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  validation_reports: readonly LifecycleValidationReport[];
  transition_outcome: LifecycleTransitionOutcome;
  transition_timestamp: string;
  historical_memory_preserved: boolean;
  operationally_available: boolean;
  replay_available: boolean;
  source_replay_hash: string;
  integrity_hash: string;
}>;

export type LifecycleLedgerEntry = Readonly<{
  ledger_id: string;
  lifecycle_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "ACTIVATION"
    | "SUPERSESSION"
    | "EXPIRATION"
    | "ARCHIVAL"
    | "RETENTION_DECISION"
    | "GOVERNANCE_APPROVAL"
    | "REPLAY_VALIDATION"
    | "LIFECYCLE_TRANSITION"
    | "POLICY_EVALUATION"
    | "INTEGRITY_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type MemoryLifecycleContract = Readonly<{
  contract_id: "memory-lifecycle-expiration-management-contract";
  version: "memory-lifecycle-expiration-management/v1";
  architecture: readonly string[];
  states: readonly MemoryLifecycleState[];
  validators: readonly LifecycleValidator[];
  outcomes: readonly LifecycleTransitionOutcome[];
  transition_rules: readonly string[];
  retention_rules: readonly string[];
  expiration_rules: readonly string[];
  security_requirements: readonly string[];
  historical_guarantees: readonly string[];
  history_is_permanent: true;
  lifecycle_without_information_loss: true;
  governance_before_transition: true;
  replay_across_time: true;
  advisory_only: true;
  deletion_supported: false;
  integrity_hash: string;
}>;

export type MemoryLifecycleMetrics = Readonly<{
  lifecycle_transitions: number;
  activation_count: number;
  supersession_count: number;
  expiration_count: number;
  archival_count: number;
  retention_compliance: number;
  replay_success: number;
  lifecycle_latency_ms: number;
  transition_failures: number;
  policy_violations: number;
  failures: readonly MemoryLifecycleFailure[];
  integrity_hash: string;
}>;

export type MemoryLifecycleApiSurface = Readonly<{
  api_id: string;
  establish_manager: "POST /memory-lifecycle-expiration-management/establish";
  retrieve_contract: "GET /memory-lifecycle-expiration-management/contract";
  retrieve_records: "POST /memory-lifecycle-expiration-management/records";
  retrieve_retention: "POST /memory-lifecycle-expiration-management/retention";
  retrieve_expiration: "POST /memory-lifecycle-expiration-management/expiration";
  retrieve_ledger: "POST /memory-lifecycle-expiration-management/ledger";
  retrieve_metrics: "POST /memory-lifecycle-expiration-management/metrics";
  replay_manager: "POST /memory-lifecycle-expiration-management/replay";
  inspect_manager: "POST /memory-lifecycle-expiration-management/inspect";
  historical_deletion_supported: false;
  destructive_expiration_supported: false;
  supersession_overwrite_supported: false;
  integrity_hash: string;
}>;

export type MemoryLifecycleInput = Readonly<{
  scenario?: MemoryLifecycleScenario;
  replay_result?: AdaptiveMemoryReplayResult;
}>;

export type MemoryLifecycleResult = Readonly<{
  memory_lifecycle_version: "memory-lifecycle-expiration-management/v1";
  manager_identifier: "MemoryLifecycleExpirationManagement";
  status: MemoryLifecycleStatus;
  api_surface: MemoryLifecycleApiSurface;
  replay_result: AdaptiveMemoryReplayResult;
  contract: MemoryLifecycleContract;
  lifecycle_records: readonly MemoryLifecycleRecord[];
  lifecycle_ledger: readonly LifecycleLedgerEntry[];
  metrics: MemoryLifecycleMetrics;
  failures: readonly MemoryLifecycleFailure[];
  deterministic: boolean;
  replayable: boolean;
  governance_enforced: boolean;
  historical_traceability_preserved: boolean;
  replay_continuity_preserved: boolean;
  tenant_isolation_enforced: boolean;
  historical_deletion_prevented: boolean;
  advisory_only: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MemoryLifecycleManager = Readonly<{
  memory_lifecycle_version: "memory-lifecycle-expiration-management/v1";
  supported_states: readonly MemoryLifecycleState[];
  supported_validators: readonly LifecycleValidator[];
  supported_outcomes: readonly LifecycleTransitionOutcome[];
  api_surface: MemoryLifecycleApiSurface;
  result: MemoryLifecycleResult;
}>;
