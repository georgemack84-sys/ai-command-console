export type KnowledgeLifecycleStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type KnowledgeLifecycleState = "OBSERVED" | "QUALIFIED" | "CERTIFIED" | "PERSISTENT" | "REFERENCED" | "UPDATED" | "SUPERSEDED" | "ARCHIVED" | "RETIRED";
export type KnowledgeLifecycleTransition = "OBSERVE" | "QUALIFY" | "CERTIFY" | "PERSIST" | "REFERENCE" | "UPDATE" | "SUPERSEDE" | "ARCHIVE" | "RETIRE" | "REQUALIFY" | "REVOKE";
export type KnowledgeLifecycleFailure =
  | "LEARNING_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "NONDETERMINISTIC_TRANSITION"
  | "ILLEGAL_TRANSITION"
  | "QUALIFICATION_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_APPROVAL_MISSING"
  | "VERSION_LINEAGE_INCOMPLETE"
  | "SUPERSESSION_NONDETERMINISTIC"
  | "HISTORICAL_PRESERVATION_FAILED"
  | "EXPIRATION_POLICY_INVALID"
  | "REVIEW_SCHEDULING_FAILED"
  | "REQUALIFICATION_NONDETERMINISTIC"
  | "REVOCATION_NOT_ENFORCED"
  | "RETIRED_RETRIEVABLE"
  | "HASH_VALIDATION_FAILED"
  | "LINEAGE_VALIDATION_FAILED"
  | "REPLAY_VALIDATION_FAILED"
  | "CORRUPTION_UNDETECTED"
  | "POLICY_ENFORCEMENT_FAILED"
  | "TENANT_ISOLATION_BREACH"
  | "AUDIT_INCOMPLETE"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "OBSERVABILITY_INCOMPLETE";
export type KnowledgeLifecycleScenario = "BASELINE" | KnowledgeLifecycleFailure;

export type KnowledgeLifecycleContract = Readonly<{
  contract_id: string;
  states: readonly KnowledgeLifecycleState[];
  transitions: readonly KnowledgeLifecycleTransition[];
  deterministic_required: boolean;
  replay_required: boolean;
  governance_required: boolean;
  constitutional_required: boolean;
  qualification_required: boolean;
  certification_required: boolean;
  deletion_supported: false;
  silent_expiration_supported: false;
  history_overwrite_supported: false;
  integrity_hash: string;
}>;

export type KnowledgeLifecycleRecord = Readonly<{
  lifecycle_id: string;
  knowledge_id: string;
  tenant_id: string;
  current_state: KnowledgeLifecycleState;
  previous_state: KnowledgeLifecycleState | null;
  transition_reason: string;
  transition_timestamp: string;
  transition_actor: string;
  approval_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  evidence_refs: readonly string[];
  version_id: string;
  superseded_by: string | null;
  expiration_policy: string;
  archive_policy: string;
  retirement_policy: string;
  integrity_hash: string;
}>;

export type LifecycleTransitionRecord = Readonly<{
  transition_id: string;
  transition: KnowledgeLifecycleTransition;
  from_state: KnowledgeLifecycleState | null;
  to_state: KnowledgeLifecycleState;
  legal: boolean;
  deterministic: boolean;
  replay_validated: boolean;
  approval_refs: readonly string[];
  integrity_hash: string;
}>;

export type LifecyclePolicyRecord = Readonly<{
  policy_id: string;
  expiration_review_required: boolean;
  automatic_delete_supported: false;
  stale_detection: boolean;
  requalification_triggers: readonly string[];
  revocation_blocks_retrieval: boolean;
  retired_preserved_for_audit: boolean;
  integrity_hash: string;
}>;

export type LifecycleVersionRecord = Readonly<{
  version_id: string;
  knowledge_id: string;
  version: string;
  supersedes: string | null;
  superseded_by: string | null;
  immutable: boolean;
  replayable: boolean;
  auditable: boolean;
  integrity_hash: string;
}>;

export type LifecycleIntegrityReport = Readonly<{
  report_id: string;
  hash_valid: boolean;
  lineage_valid: boolean;
  evidence_refs_valid: boolean;
  governance_refs_valid: boolean;
  version_refs_valid: boolean;
  replay_consistent: boolean;
  corruption_detected: boolean;
  integrity_hash: string;
}>;

export type LifecycleLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "TRANSITION_RECORDED" | "EXPIRATION_REVIEWED" | "SUPERSESSION_RECORDED" | "REQUALIFICATION_RECORDED" | "REVOCATION_RECORDED" | "RETIREMENT_RECORDED" | "INTEGRITY_VALIDATED" | "CERTIFICATION_RECORDED";
  lifecycle_id: string;
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type LifecycleObservability = Readonly<{
  observability_id: string;
  active_knowledge: number;
  certified_knowledge: number;
  archived_knowledge: number;
  retired_knowledge: number;
  pending_transitions: number;
  expired_intelligence: number;
  requalification_backlog: number;
  revocations: number;
  supersessions: number;
  integrity_health: number;
  replay_success_rate: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type LifecycleCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: KnowledgeLifecycleFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type LifecycleCertification = Readonly<{
  certification_id: string;
  status: KnowledgeLifecycleStatus;
  production_ready: boolean;
  failures: readonly KnowledgeLifecycleFailure[];
  tests: readonly LifecycleCertificationTest[];
  integrity_hash: string;
}>;

export type KnowledgeLifecycleInput = Readonly<{ scenario?: KnowledgeLifecycleScenario; tenant_id?: string }>;

export type KnowledgeLifecycleResult = Readonly<{
  lifecycle_version: "knowledge-lifecycle-management/v11.8";
  lifecycle_identifier: "KnowledgeLifecycleManagement";
  organizational_learning_certified: boolean;
  contract: KnowledgeLifecycleContract;
  records: readonly KnowledgeLifecycleRecord[];
  transitions: readonly LifecycleTransitionRecord[];
  policies: LifecyclePolicyRecord;
  versions: readonly LifecycleVersionRecord[];
  integrity_report: LifecycleIntegrityReport;
  ledger: readonly LifecycleLedgerEntry[];
  observability: LifecycleObservability;
  certification: LifecycleCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type KnowledgeLifecycleValidation = Readonly<{
  lifecycle_id: string | null;
  valid: boolean;
  status: KnowledgeLifecycleStatus;
  production_ready: boolean;
  failures: readonly KnowledgeLifecycleFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type KnowledgeLifecycleContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "knowledge-lifecycle-management/v11.8";
    deterministic_lifecycle: true;
    silent_expiration_supported: false;
    deletion_supported: false;
    archive_never_disappears: true;
    retirement_deletes_history: false;
    states: readonly KnowledgeLifecycleState[];
  }>;
  result: KnowledgeLifecycleResult;
  validation: KnowledgeLifecycleValidation;
  observability: LifecycleObservability;
}>;
