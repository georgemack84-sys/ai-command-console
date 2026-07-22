export type InstitutionalMemoryStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type InstitutionalMemoryLifecycleStage = "IDENTIFIED" | "QUALIFIED" | "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_VALIDATION" | "APPROVED" | "PERSISTED" | "VERSIONED" | "INDEXED" | "REPLAYABLE" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type InstitutionalMemoryType = "LESSON_LEARNED" | "DECISION_HISTORY" | "STRATEGY_HISTORY" | "OPERATIONAL_OUTCOME" | "GOVERNANCE_DECISION" | "EXCEPTION" | "RISK_PATTERN" | "CONFIDENCE_EVOLUTION";
export type InstitutionalMemoryDomain = "LESSONS_LEARNED" | "DECISION_HISTORY" | "STRATEGY_HISTORY" | "OPERATIONAL_OUTCOMES" | "GOVERNANCE_DECISIONS" | "EXCEPTIONS" | "RISK_PATTERNS" | "CONFIDENCE_HISTORY";
export type InstitutionalMemoryFailure =
  | "QUALIFICATION_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "HUMAN_APPROVAL_MISSING"
  | "APPEND_ONLY_VIOLATION"
  | "MODIFICATION_ATTEMPT"
  | "DELETE_ATTEMPT"
  | "LINEAGE_INCOMPLETE"
  | "SUPERSESSION_NONDETERMINISTIC"
  | "HISTORICAL_VERSION_MISSING"
  | "REPLAY_DIVERGENCE"
  | "CROSS_REFERENCE_INVALID"
  | "TENANT_ISOLATION_BREACH"
  | "INTEGRITY_HASH_MISMATCH"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "OBSERVABILITY_INCOMPLETE";
export type InstitutionalMemoryScenario = "BASELINE" | InstitutionalMemoryFailure;

export type InstitutionalMemoryContract = Readonly<{
  contract_id: string;
  lifecycle: readonly InstitutionalMemoryLifecycleStage[];
  memory_types: readonly InstitutionalMemoryType[];
  qualification_required: boolean;
  governance_approval_required: boolean;
  constitutional_validation_required: boolean;
  human_approval_required: boolean;
  append_only_required: boolean;
  overwrite_supported: false;
  delete_supported: false;
  supersession_only: true;
  replay_required: boolean;
  tenant_isolation_required: boolean;
  integrity_hash: string;
}>;

export type InstitutionalMemoryRecord = Readonly<{
  memory_id: string;
  memory_type: InstitutionalMemoryType;
  tenant_id: string;
  organization_id: string;
  title: string;
  summary: string;
  knowledge_domain: InstitutionalMemoryDomain;
  source_records: readonly string[];
  qualification_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  approval_refs: readonly string[];
  confidence_refs: readonly string[];
  risk_refs: readonly string[];
  strategy_refs: readonly string[];
  decision_refs: readonly string[];
  outcome_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  version: string;
  supersedes_version: string | null;
  status: InstitutionalMemoryLifecycleStage;
  effective_date: string;
  created_at: string;
  integrity_hash: string;
}>;

export type InstitutionalRepository = Readonly<{
  repository_id: string;
  domain: InstitutionalMemoryDomain;
  records: readonly string[];
  replay_ref: string;
  lineage_complete: boolean;
  certified: boolean;
  integrity_hash: string;
}>;

export type InstitutionalReplay = Readonly<{
  replay_id: string;
  point_in_time_reconstruction: boolean;
  historical_reconstruction: boolean;
  decision_history_replay: boolean;
  strategy_history_replay: boolean;
  operational_outcome_replay: boolean;
  governance_decision_replay: boolean;
  exception_history_replay: boolean;
  risk_pattern_replay: boolean;
  confidence_evolution_replay: boolean;
  divergence_detected: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type InstitutionalVersion = Readonly<{
  version_id: string;
  memory_id: string;
  version: string;
  supersedes_version: string | null;
  accessible: boolean;
  replayable: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type InstitutionalLineage = Readonly<{
  lineage_id: string;
  memory_id: string;
  source_refs: readonly string[];
  qualification_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  cross_references: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type InstitutionalMemoryLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "MEMORY_CREATED" | "MEMORY_QUALIFIED" | "MEMORY_APPROVED" | "MEMORY_PERSISTED" | "MEMORY_VERSIONED" | "MEMORY_SUPERSEDED" | "MEMORY_REPLAYED" | "MEMORY_CERTIFIED";
  memory_id: string;
  version: string;
  append_only: boolean;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type InstitutionalMemoryObservability = Readonly<{
  observability_id: string;
  replay_latency_ms: number;
  retrieval_latency_ms: number;
  storage_growth_records: number;
  lineage_completeness: number;
  missing_approvals: number;
  qualification_failures: number;
  integrity_violations: number;
  orphaned_references: number;
  stale_versions: number;
  replay_failures: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type InstitutionalMemoryCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: InstitutionalMemoryFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type InstitutionalMemoryCertification = Readonly<{
  certification_id: string;
  status: InstitutionalMemoryStatus;
  available_for_reuse: boolean;
  failures: readonly InstitutionalMemoryFailure[];
  tests: readonly InstitutionalMemoryCertificationTest[];
  integrity_hash: string;
}>;

export type InstitutionalMemoryInput = Readonly<{
  scenario?: InstitutionalMemoryScenario;
  tenant_id?: string;
  organization_id?: string;
}>;

export type InstitutionalMemoryResult = Readonly<{
  institutional_memory_version: "institutional-memory-engine/v11.3";
  institutional_memory_identifier: "InstitutionalMemoryEngine";
  qualification_certified: boolean;
  contract: InstitutionalMemoryContract;
  records: readonly InstitutionalMemoryRecord[];
  repositories: readonly InstitutionalRepository[];
  versions: readonly InstitutionalVersion[];
  lineage: InstitutionalLineage;
  replay: InstitutionalReplay;
  ledger: readonly InstitutionalMemoryLedgerEntry[];
  observability: InstitutionalMemoryObservability;
  certification: InstitutionalMemoryCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type InstitutionalMemoryValidation = Readonly<{
  memory_id: string | null;
  valid: boolean;
  status: InstitutionalMemoryStatus;
  available_for_reuse: boolean;
  failures: readonly InstitutionalMemoryFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type InstitutionalMemoryContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "institutional-memory-engine/v11.3";
    institutional_memory_is_adaptive_memory: false;
    archive_never_delete: true;
    overwrite_supported: false;
    qualification_required: true;
    lifecycle: readonly InstitutionalMemoryLifecycleStage[];
    domains: readonly InstitutionalMemoryDomain[];
  }>;
  result: InstitutionalMemoryResult;
  validation: InstitutionalMemoryValidation;
  observability: InstitutionalMemoryObservability;
}>;
