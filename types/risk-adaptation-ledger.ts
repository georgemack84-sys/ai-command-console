import type { RiskAdaptationDomain, RiskAdaptationFoundationResult } from "@/types/risk-adaptation-engine-foundation";
import type { RiskPatternResult } from "@/types/risk-pattern-intelligence";

export type RiskAdaptationLedgerEntryType = "PROPOSAL_CREATED" | "REVISION_REQUESTED" | "VALIDATION_COMPLETED" | "GOVERNANCE_REVIEWED" | "SIMULATION_EXECUTED" | "OPERATOR_APPROVED" | "OPERATOR_REJECTED" | "CERTIFICATION_DECIDED" | "REPLAY_GENERATED" | "ROLLBACK_LINEAGE_RECORDED" | "HISTORICAL_REFERENCE_RECORDED";
export type RiskAdaptationLedgerDecision = "APPROVED" | "REJECTED" | "REVISION_REQUESTED" | "CERTIFIED" | "FAILED";
export type RiskAdaptationLedgerValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskAdaptationLedgerFailure =
  | "SCHEMA_INVALID"
  | "REQUIRED_REFERENCES_MISSING"
  | "EVIDENCE_MISSING"
  | "HASH_VERIFICATION_FAILED"
  | "CHAIN_CONTINUITY_BROKEN"
  | "ENTRY_ORDERING_INVALID"
  | "TIMESTAMP_INCONSISTENT"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "SIMULATION_REFERENCES_MISSING"
  | "OPERATOR_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "HISTORICAL_ENTRY_MUTATION_DETECTED"
  | "LEDGER_ENTRY_DELETION_DETECTED"
  | "TRANSACTION_REORDER_DETECTED"
  | "EVIDENCE_REWRITE_DETECTED"
  | "GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"
  | "CONSTITUTIONAL_REVIEW_SUPPRESSION_DETECTED"
  | "OPERATOR_AUTHORITY_BYPASS_DETECTED"
  | "UNAUTHORIZED_WRITE_DETECTED"
  | "NONDETERMINISTIC_LEDGER_COMMIT"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskAdaptationLedgerScenario =
  | "BASELINE"
  | "PROPOSAL"
  | "REVISION"
  | "VALIDATION"
  | "GOVERNANCE"
  | "SIMULATION"
  | "APPROVED"
  | "REJECTED"
  | "CERTIFIED"
  | "REPLAY"
  | "ROLLBACK"
  | "HISTORICAL_REFERENCE"
  | "MISSING_SCHEMA"
  | "MISSING_REFERENCES"
  | "MISSING_EVIDENCE"
  | "HASH_MISMATCH"
  | "BROKEN_CHAIN"
  | "REORDERED"
  | "BAD_TIMESTAMP"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_OPERATOR"
  | "MISSING_CERTIFICATION"
  | "BROKEN_LINEAGE"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HISTORICAL_MUTATION"
  | "DELETION"
  | "EVIDENCE_REWRITE"
  | "GOVERNANCE_SUPPRESSION"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "OPERATOR_BYPASS"
  | "UNAUTHORIZED_WRITE"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskAdaptationLedgerRecord = Readonly<{
  ledger_entry_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: string;
  risk_domain: RiskAdaptationDomain;
  entry_type: RiskAdaptationLedgerEntryType;
  entry_timestamp: string;
  proposal_ref: string;
  governance_review_ref: string;
  simulation_ref: string;
  operator_decision_ref: string;
  certification_ref: string;
  implementation_lineage_ref: string;
  rollback_lineage_ref: string;
  replay_lineage_ref: string;
  supporting_evidence_refs: readonly string[];
  previous_hash: string;
  current_hash: string;
  integrity_hash: string;
  created_by: string;
  created_at: string;
  append_only: true;
  immutable: true;
  deleted: false;
  authorized_write: true;
  rewrites_evidence: false;
  suppresses_governance_history: false;
  suppresses_constitutional_review: false;
  bypasses_operator_authority: false;
}>;

export type RiskAdaptationProposalRegistry = Readonly<{
  registry_id: string;
  proposal_refs: readonly string[];
  proposal_versions: readonly string[];
  proposal_owner_refs: readonly string[];
  rationale_refs: readonly string[];
  immutable_history: true;
  integrity_hash: string;
}>;

export type RiskAdaptationGovernanceAuditRegistry = Readonly<{
  registry_id: string;
  governance_review_refs: readonly string[];
  constitutional_review_refs: readonly string[];
  compliance_review_refs: readonly string[];
  authority_decision_refs: readonly string[];
  governance_outcomes: readonly RiskAdaptationLedgerDecision[];
  immutable_history: true;
  integrity_hash: string;
}>;

export type RiskAdaptationSimulationRegistry = Readonly<{
  registry_id: string;
  simulation_refs: readonly string[];
  simulation_input_refs: readonly string[];
  simulation_output_refs: readonly string[];
  validation_result_refs: readonly string[];
  improvement_measurement_refs: readonly string[];
  replay_refs: readonly string[];
  immutable_history: true;
  integrity_hash: string;
}>;

export type RiskAdaptationOperatorDecisionRegistry = Readonly<{
  registry_id: string;
  operator_decision_refs: readonly string[];
  decision_authority_refs: readonly string[];
  decision_rationale_refs: readonly string[];
  decisions: readonly RiskAdaptationLedgerDecision[];
  immutable_history: true;
  integrity_hash: string;
}>;

export type RiskAdaptationCertificationHistoryRegistry = Readonly<{
  registry_id: string;
  certification_refs: readonly string[];
  certification_evidence_refs: readonly string[];
  reviewer_refs: readonly string[];
  certification_outcomes: readonly RiskAdaptationLedgerDecision[];
  historical_supersession_refs: readonly string[];
  immutable_history: true;
  integrity_hash: string;
}>;

export type RiskAdaptationLineageRegistry = Readonly<{
  registry_id: string;
  implementation_lineage_refs: readonly string[];
  rollback_lineage_refs: readonly string[];
  replay_lineage_refs: readonly string[];
  dependency_chain_refs: readonly string[];
  reconstructs_identical_lifecycle: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationLedgerIntegrityReport = Readonly<{
  integrity_report_id: string;
  ledger_entry_refs: readonly string[];
  hash_integrity_verified: boolean;
  chain_continuity_verified: boolean;
  entry_ordering_verified: boolean;
  timestamp_consistency_verified: boolean;
  referential_integrity_verified: boolean;
  tenant_isolation_verified: boolean;
  lineage_complete: boolean;
  audit_ready: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationLedgerValidation = Readonly<{
  validation_id: string;
  state: RiskAdaptationLedgerValidationState;
  certified: boolean;
  failures: readonly RiskAdaptationLedgerFailure[];
  schema_valid: boolean;
  required_references_complete: boolean;
  evidence_complete: boolean;
  hash_verified: boolean;
  chain_continuity_verified: boolean;
  entry_ordering_verified: boolean;
  timestamp_consistency_verified: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  simulation_complete: boolean;
  operator_complete: boolean;
  certification_complete: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  append_only: boolean;
  immutable_history: boolean;
  no_deletion: boolean;
  no_reorder: boolean;
  no_evidence_rewrite: boolean;
  no_governance_suppression: boolean;
  no_constitutional_suppression: boolean;
  no_operator_bypass: boolean;
  authorized_write: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationLedgerApiSurface = Readonly<{
  api_id: string;
  commit_entry: "POST /risk-adaptation-ledger/commit";
  retrieve_entries: "POST /risk-adaptation-ledger/entries";
  retrieve_proposals: "POST /risk-adaptation-ledger/proposals";
  retrieve_governance: "POST /risk-adaptation-ledger/governance";
  retrieve_simulations: "POST /risk-adaptation-ledger/simulations";
  retrieve_operator_decisions: "POST /risk-adaptation-ledger/operator-decisions";
  retrieve_certifications: "POST /risk-adaptation-ledger/certifications";
  retrieve_lineage: "POST /risk-adaptation-ledger/lineage";
  retrieve_integrity: "POST /risk-adaptation-ledger/integrity";
  retrieve_validation: "POST /risk-adaptation-ledger/validation";
  replay_ledger: "POST /risk-adaptation-ledger/replay";
  retrieve_contract: "GET /risk-adaptation-ledger/contract";
  update_supported: false;
  delete_supported: false;
  reorder_supported: false;
  historical_mutation_supported: false;
  unauthorized_write_supported: false;
  integrity_hash: string;
}>;

export type RiskAdaptationLedgerInput = Readonly<{
  scenario?: RiskAdaptationLedgerScenario;
  foundation_result?: RiskAdaptationFoundationResult;
  pattern_result?: RiskPatternResult;
}>;

export type RiskAdaptationLedgerResult = Readonly<{
  risk_adaptation_ledger_version: "risk-adaptation-ledger/v1";
  api_surface: RiskAdaptationLedgerApiSurface;
  entries: readonly RiskAdaptationLedgerRecord[];
  proposal_registry: RiskAdaptationProposalRegistry;
  governance_registry: RiskAdaptationGovernanceAuditRegistry;
  simulation_registry: RiskAdaptationSimulationRegistry;
  operator_registry: RiskAdaptationOperatorDecisionRegistry;
  certification_registry: RiskAdaptationCertificationHistoryRegistry;
  lineage_registry: RiskAdaptationLineageRegistry;
  integrity_report: RiskAdaptationLedgerIntegrityReport;
  validation: RiskAdaptationLedgerValidation;
  append_only: true;
  immutable: true;
  replayable: true;
  deterministic: true;
  audit_ready: boolean;
  tenant_isolated: boolean;
  deletes_records: false;
  mutates_historical_entries: false;
  reorders_transactions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskAdaptationLedgerFoundation = Readonly<{
  risk_adaptation_ledger_version: "risk-adaptation-ledger/v1";
  api_surface: RiskAdaptationLedgerApiSurface;
  result: RiskAdaptationLedgerResult;
}>;
