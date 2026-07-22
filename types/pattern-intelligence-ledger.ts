import type { GovernanceEscalationResult } from "@/types/governance-escalation-pattern-intelligence";

export type PatternLedgerLifecycleState = "CREATED" | "APPENDED" | "VERIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";

export type PatternLedgerValidationState =
  | "GOVERNANCE_INPUT_VALIDATED"
  | "LEDGER_RECORD_APPENDED"
  | "INTEGRITY_VERIFIED"
  | "LINEAGE_REGISTERED"
  | "REPLAY_INDEXED"
  | "CERTIFIED"
  | "FAILED"
  | "PENDING_EVIDENCE";

export type PatternLedgerFailure =
  | "GOVERNANCE_INPUT_MISSING"
  | "GOVERNANCE_INPUT_UNCERTIFIED"
  | "INTEGRITY_HASH_GENERATION_FAILED"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "EVIDENCE_REFERENCES_INCOMPLETE"
  | "SCORING_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "APPEND_ORDERING_INVALID"
  | "TENANT_BOUNDARY_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "HASH_CHAIN_INVALID"
  | "RECORD_MUTATION_DETECTED"
  | "DELETE_OPERATION_DETECTED"
  | "UPDATE_OPERATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternLedgerScenario =
  | "BASELINE"
  | "SUPERSEDED"
  | "MISSING_GOVERNANCE_INPUT"
  | "UNCERTIFIED_GOVERNANCE_INPUT"
  | "MISSING_LINEAGE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE_REFS"
  | "MISSING_EVIDENCE"
  | "MISSING_SCORING"
  | "MISSING_CERTIFICATION"
  | "INVALID_APPEND_ORDER"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "HASH_CHAIN_BREAK"
  | "RECORD_MUTATION"
  | "DELETE_OPERATION"
  | "UPDATE_OPERATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type PatternLedgerRecord = Readonly<{
  ledger_record_id: string;
  pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  pattern_type: string;
  pattern_summary: string;
  pattern_version: "pattern-intelligence/v1";
  recurrence_history_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  scoring_refs: readonly string[];
  governance_review_refs: readonly string[];
  certification_refs: readonly string[];
  lineage_parent_refs: readonly string[];
  lineage_child_refs: readonly string[];
  append_timestamp: string;
  append_sequence: number;
  integrity_hash: string;
  previous_record_hash: string;
  ledger_version: "pattern-intelligence-ledger/v1";
  lifecycle_state: PatternLedgerLifecycleState;
  explanation: string;
  advisory_only: true;
  immutable: true;
  append_only: true;
  update_supported: false;
  delete_supported: false;
  mutates_intelligence: false;
  modifies_governance: false;
  modifies_recommendations: false;
  execution_decision: false;
}>;

export type PatternLineageRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  parent_index: Readonly<Record<string, readonly string[]>>;
  child_index: Readonly<Record<string, readonly string[]>>;
  replay_lineage_refs: readonly string[];
  governance_lineage_refs: readonly string[];
  scoring_lineage_refs: readonly string[];
  evidence_lineage_refs: readonly string[];
  immutable: true;
  deterministic: true;
  integrity_hash: string;
}>;

export type PatternReplayIndex = Readonly<{
  replay_index_id: string;
  tenant_id: string;
  pattern_refs: readonly string[];
  ledger_sequence: readonly number[];
  replay_refs: readonly string[];
  lineage_graph_refs: readonly string[];
  evidence_refs: readonly string[];
  deterministic: true;
  integrity_hash: string;
}>;

export type PatternLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  records: readonly PatternLedgerRecord[];
  record_refs: readonly string[];
  append_only: true;
  immutable: true;
  update_supported: false;
  delete_supported: false;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternLedgerValidation = Readonly<{
  validation_id: string;
  state: PatternLedgerValidationState;
  certified: boolean;
  failures: readonly PatternLedgerFailure[];
  governance_input_accepted: boolean;
  integrity_verified: boolean;
  hash_chain_valid: boolean;
  append_ordering_valid: boolean;
  lineage_complete: boolean;
  replay_references_complete: boolean;
  governance_references_complete: boolean;
  evidence_references_complete: boolean;
  scoring_references_complete: boolean;
  certification_references_complete: boolean;
  tenant_isolated: boolean;
  replay_validated: boolean;
  explanations_complete: boolean;
  append_only: boolean;
  immutable: boolean;
  advisory_only: boolean;
  no_updates: boolean;
  no_deletes: boolean;
  no_autonomous_learning: boolean;
  integrity_hash: string;
}>;

export type PatternLedgerApiSurface = Readonly<{
  api_id: string;
  append_pattern_record: "POST /pattern-intelligence-ledger/append";
  retrieve_pattern_record: "POST /pattern-intelligence-ledger/record";
  retrieve_pattern_history: "POST /pattern-intelligence-ledger/history";
  query_ledger: "POST /pattern-intelligence-ledger/query";
  verify_integrity: "POST /pattern-intelligence-ledger/integrity";
  retrieve_lineage: "POST /pattern-intelligence-ledger/lineage";
  replay_ledger: "POST /pattern-intelligence-ledger/replay";
  retrieve_contract: "GET /pattern-intelligence-ledger/contract";
  update_supported: false;
  delete_supported: false;
  autonomous_learning_supported: false;
  governance_mutation_supported: false;
  execution_decision_supported: false;
  integrity_hash: string;
}>;

export type PatternLedgerInput = Readonly<{
  governance_result?: GovernanceEscalationResult;
  scenario?: PatternLedgerScenario;
}>;

export type PatternLedgerResult = Readonly<{
  pattern_intelligence_ledger_version: "pattern-intelligence-ledger/v1";
  governance_result: GovernanceEscalationResult;
  api_surface: PatternLedgerApiSurface;
  ledger: PatternLedger;
  lineage_registry: PatternLineageRegistry;
  replay_index: PatternReplayIndex;
  validation: PatternLedgerValidation;
  deterministic: true;
  replayable: true;
  cryptographically_verifiable: true;
  governance_aware: true;
  constitutionally_compliant: true;
  operator_visible: true;
  tenant_isolated: true;
  advisory_only: true;
  append_only: true;
  immutable: true;
  autonomous_learning: false;
  modifies_recommendations: false;
  modifies_governance: false;
  execution_decision: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternLedgerFoundation = Readonly<{
  pattern_intelligence_ledger_version: "pattern-intelligence-ledger/v1";
  api_surface: PatternLedgerApiSurface;
  result: PatternLedgerResult;
}>;
