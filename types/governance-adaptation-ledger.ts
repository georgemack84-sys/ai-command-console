import type { AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type GovernanceAdaptationLedgerEventType =
  | "VALIDATION_RECORDED"
  | "GOVERNANCE_DECISION"
  | "CONSTITUTIONAL_REVIEW"
  | "AUTHORITY_REVIEW"
  | "POLICY_CONFLICT"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_COMPLETED"
  | "SIMULATION_AUTHORIZED"
  | "SIMULATION_DENIED"
  | "OPERATOR_DECISION"
  | "ESCALATION_CREATED"
  | "ESCALATION_RESOLVED"
  | "CERTIFICATION_UPDATED"
  | "ROLLBACK_REGISTERED"
  | "REPLAY_REGISTERED"
  | "LEDGER_VERIFIED";

export type GovernanceAdaptationLedgerIntegrityStatus = "VERIFIED" | "FAILED" | "FAIL_CLOSED";
export type GovernanceAdaptationLedgerValidationState = "CERTIFIED" | "FAILED" | "FAIL_CLOSED";

export type GovernanceAdaptationLedgerFailure =
  | "LEDGER_APPEND_FAILED"
  | "LEDGER_ENTRY_MODIFIED"
  | "LEDGER_ENTRY_DELETED"
  | "HASH_VERIFICATION_FAILED"
  | "PARENT_HASH_CONTINUITY_BROKEN"
  | "TIMESTAMP_ORDERING_INVALID"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "ROLLBACK_LINEAGE_INCOMPLETE"
  | "CERTIFICATION_LINEAGE_INCOMPLETE"
  | "SUPPORTING_EVIDENCE_UNLINKED"
  | "TENANT_OWNERSHIP_UNVERIFIED"
  | "CROSS_TENANT_LEDGER_REFERENCE"
  | "EVENT_CHRONOLOGY_UNRECONSTRUCTABLE"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "LEDGER_CORRUPTION_DETECTED";

export type GovernanceAdaptationLedgerScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "VALIDATION"
  | "GOVERNANCE_DECISION"
  | "CONSTITUTIONAL_REVIEW"
  | "AUTHORITY_REVIEW"
  | "POLICY_CONFLICT"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_COMPLETED"
  | "SIMULATION_AUTHORIZED"
  | "SIMULATION_DENIED"
  | "OPERATOR_DECISION"
  | "ESCALATION_CREATED"
  | "ESCALATION_RESOLVED"
  | "CERTIFICATION_UPDATED"
  | "ROLLBACK_REGISTERED"
  | "REPLAY_REGISTERED"
  | "LEDGER_VERIFIED"
  | "APPEND_FAILURE"
  | "ENTRY_MODIFIED"
  | "ENTRY_DELETED"
  | "HASH_MISMATCH"
  | "BROKEN_PARENT_HASH"
  | "BAD_TIMESTAMP"
  | "MISSING_REPLAY_LINEAGE"
  | "MISSING_ROLLBACK_LINEAGE"
  | "MISSING_CERTIFICATION_LINEAGE"
  | "MISSING_EVIDENCE_LINK"
  | "TENANT_UNVERIFIED"
  | "CROSS_TENANT_REFERENCE"
  | "BROKEN_CHRONOLOGY"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_CORRUPTION";

export type GovernanceAdaptationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  proposal_id: string;
  event_type: GovernanceAdaptationLedgerEventType;
  validation_reference: string;
  governance_decision: string;
  constitutional_review: string;
  authority_review: string;
  policy_conflicts: readonly string[];
  required_approvals: readonly string[];
  simulation_authorization: "AUTHORIZED" | "DENIED" | "NOT_REQUESTED";
  operator_decision: "APPROVED" | "REJECTED" | "PENDING" | "NOT_REQUESTED";
  escalation_reference: string;
  replay_lineage: readonly string[];
  rollback_lineage: readonly string[];
  certification_lineage: readonly string[];
  evidence_references: readonly string[];
  parent_hash: string;
  entry_hash: string;
  ledger_timestamp: string;
  integrity_status: GovernanceAdaptationLedgerIntegrityStatus;
  append_only: true;
  immutable: boolean;
  deleted: boolean;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLineageGraph = Readonly<{
  graph_id: string;
  validation_sequence: readonly string[];
  decision_sequence: readonly string[];
  dependency_chain: readonly string[];
  replay_lineage: readonly string[];
  rollback_lineage: readonly string[];
  certification_lineage: readonly string[];
  event_chronology: readonly GovernanceAdaptationLedgerEventType[];
  complete: boolean;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLedgerIntegrityReport = Readonly<{
  report_id: string;
  entries_verified: number;
  hash_verified: boolean;
  parent_hash_continuity: boolean;
  timestamp_ordering_verified: boolean;
  tenant_ownership_verified: boolean;
  referential_integrity_verified: boolean;
  event_chronology_reconstructable: boolean;
  failures: readonly GovernanceAdaptationLedgerFailure[];
  integrity_hash: string;
}>;

export type GovernanceAdaptationReplayIndex = Readonly<{
  replay_index_id: string;
  replay_refs: readonly string[];
  replay_hashes: readonly string[];
  byte_identical: boolean;
  deterministic: true;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLedgerApiSurface = Readonly<{
  api_id: string;
  append_entry: "POST /governance-adaptation-ledger/append";
  retrieve_entries: "POST /governance-adaptation-ledger/entries";
  retrieve_lineage: "POST /governance-adaptation-ledger/lineage";
  retrieve_integrity: "POST /governance-adaptation-ledger/integrity";
  retrieve_replay_index: "POST /governance-adaptation-ledger/replay-index";
  replay_ledger: "POST /governance-adaptation-ledger/replay";
  retrieve_contract: "GET /governance-adaptation-ledger/contract";
  append_only: true;
  update_supported: false;
  delete_supported: false;
  mutation_supported: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLedgerInput = Readonly<{
  scenario?: GovernanceAdaptationLedgerScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
  conflict_result?: AdaptivePolicyConflictDetectorResult;
}>;

export type GovernanceAdaptationLedgerResult = Readonly<{
  governance_adaptation_ledger_version: "governance-adaptation-ledger/v1";
  api_surface: GovernanceAdaptationLedgerApiSurface;
  entries: readonly GovernanceAdaptationLedgerEntry[];
  lineage_graph: GovernanceAdaptationLineageGraph;
  integrity_report: GovernanceAdaptationLedgerIntegrityReport;
  replay_index: GovernanceAdaptationReplayIndex;
  validation_state: GovernanceAdaptationLedgerValidationState;
  fail_closed: boolean;
  append_only: true;
  immutable: true;
  replayable: boolean;
  tenant_isolated: boolean;
  audit_ready: boolean;
  tamper_evident: true;
  advisory_only: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationLedgerFoundation = Readonly<{
  governance_adaptation_ledger_version: "governance-adaptation-ledger/v1";
  api_surface: GovernanceAdaptationLedgerApiSurface;
  result: GovernanceAdaptationLedgerResult;
}>;
