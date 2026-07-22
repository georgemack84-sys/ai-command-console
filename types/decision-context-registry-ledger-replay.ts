import type { DecisionContext } from "@/types/decision-context-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { ContextIntegrityValidationReport } from "@/types/decision-context-integrity-validation-explainability";

export type ContextRegistryLifecycleState = "REGISTERED" | "VALIDATED" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type ContextLedgerEventType =
  | "CONTEXT_REGISTERED"
  | "CONTEXT_VALIDATED"
  | "CONTEXT_CERTIFIED"
  | "CONTEXT_REPLAY_GENERATED"
  | "CONTEXT_REPLAY_VERIFIED"
  | "CONTEXT_SUPERSEDED"
  | "CONTEXT_ARCHIVED"
  | "CONTEXT_RESTORED"
  | "CONTEXT_REPLAY_EXECUTED";

export type ContextRegistryFailureReason =
  | "REGISTRY_WRITE_FAILED"
  | "LEDGER_APPEND_FAILED"
  | "REPOSITORY_PERSISTENCE_FAILED"
  | "REPLAY_PACKAGE_INCOMPLETE"
  | "VERSION_CONFLICT_DETECTED"
  | "DUPLICATE_REGISTRY_IDENTITY"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_STORAGE_DETECTED"
  | "VALIDATION_NOT_CERTIFIED";

export type ContextRegistryRecord = Readonly<{
  registry_record_id: string;
  context_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  context_version: number;
  schema_version: string;
  validation_state: string;
  certification_state: "CERTIFIED" | "NOT_CERTIFIED";
  registry_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type ContextLedgerEntry = Readonly<{
  ledger_entry_id: string;
  context_id: string;
  event_type: ContextLedgerEventType;
  event_timestamp: string;
  event_actor: "SYSTEM";
  event_source: string;
  previous_hash: string;
  current_hash: string;
  replay_reference: string;
  certification_reference: string;
  integrity_hash: string;
}>;

export type ReplayPackage = Readonly<{
  replay_package_id: string;
  context_id: string;
  replay_inputs: readonly string[];
  replay_dependencies: readonly string[];
  replay_lineage: readonly string[];
  replay_metadata: Readonly<{
    replay_version: "context-replay/v1";
    schema_version: string;
    resolver_versions: readonly string[];
    generated_by: "context-registry-ledger-replay/v1";
  }>;
  replay_version: "context-replay/v1";
  replay_hash: string;
  integrity_hash: string;
}>;

export type ContextRepositoryRecord = Readonly<{
  repository_id: string;
  context_id: string;
  serialized_context: string;
  context_metadata: Readonly<Record<string, string | number>>;
  validation_reports: readonly string[];
  explainability_reports: readonly string[];
  replay_package: ReplayPackage;
  certification_package: readonly string[];
  archive_status: "ACTIVE" | "ARCHIVED";
  integrity_hash: string;
}>;

export type ContextAuditTrail = Readonly<{
  audit_id: string;
  context_id: string;
  registry_events: readonly string[];
  ledger_events: readonly string[];
  validation_events: readonly string[];
  certification_events: readonly string[];
  replay_events: readonly string[];
  operator_events: readonly string[];
  governance_events: readonly string[];
  integrity_hash: string;
}>;

export type ContextRegistryValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  lifecycle_state: ContextRegistryLifecycleState;
  failure_reason?: ContextRegistryFailureReason;
  failure_reasons: readonly ContextRegistryFailureReason[];
  checks: Readonly<{
    registry_identity_unique: boolean;
    context_stored: boolean;
    ledger_created: boolean;
    repository_integrity_verified: boolean;
    replay_package_complete: boolean;
    replay_dependencies_resolved: boolean;
    version_history_preserved: boolean;
    audit_trail_complete: boolean;
    certification_artifacts_attached: boolean;
    integrity_hashes_reproducible: boolean;
    tenant_isolated: boolean;
  }>;
}>;

export type ContextRegistryRequest = Readonly<{
  registration_id: string;
  candidate: DecisionCandidate;
  decision_context?: DecisionContext;
  validation_report?: ContextIntegrityValidationReport;
  existing_registry?: readonly ContextRegistryRecord[];
  registry_version: "context-registry-ledger-replay/v1";
}>;

export type ContextRegistryPackage = Readonly<{
  registration_id: string;
  candidate_id: string;
  registry_record: ContextRegistryRecord;
  ledger_entries: readonly ContextLedgerEntry[];
  repository_record: ContextRepositoryRecord;
  replay_package: ReplayPackage;
  audit_trail: ContextAuditTrail;
  validation: ContextRegistryValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ContextRegistryReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  registration_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_lifecycle_state: ContextRegistryLifecycleState;
  failures: readonly ContextRegistryFailureReason[];
  integrity_hash: string;
}>;

export type ContextRegistryObservability = Readonly<{
  registration_attempts: number;
  successful_registrations: number;
  failed_registrations: number;
  ledger_entries_created: number;
  replay_packages_created: number;
  duplicate_identity_failures: number;
  persistence_failures: number;
  replay_failures: number;
  integrity_failures: number;
  isolation_failures: number;
  replay_success_rate: number;
}>;
