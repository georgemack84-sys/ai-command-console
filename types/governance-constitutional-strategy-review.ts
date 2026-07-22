import type { StrategyEvolutionLedgerResult } from "@/types/strategy-evolution-ledger";

export type StrategyReviewOutcome = "APPROVED_FOR_SIMULATION" | "REVISION_REQUIRED" | "GOVERNANCE_REJECTED" | "CONSTITUTIONAL_REJECTED";
export type StrategyReviewLifecycleState = "SUBMITTED" | "GOVERNANCE_VALIDATED" | "CONSTITUTION_VALIDATED" | "AUTHORITY_VERIFIED" | "POLICY_ANALYZED" | "REGULATORY_REVIEWED" | "DECISION_ISSUED" | "RECORDED" | "REJECTED" | "RETURNED_FOR_REVISION";
export type StrategyReviewValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_REVIEW";

export type GovernanceConstitutionalStrategyReviewFailure =
  | "LEDGER_UNCERTIFIED"
  | "GOVERNANCE_COMPLIANCE_INCOMPLETE"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "AUTHORITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "ADVISORY_ONLY_VIOLATED"
  | "POLICY_CONFLICT_UNRESOLVED"
  | "REGULATORY_ANALYSIS_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "CROSS_TENANT_PROPOSAL_DETECTED"
  | "REVIEW_OUTCOME_NONDETERMINISTIC"
  | "INTEGRITY_HASH_MISMATCH"
  | "REGISTRY_MUTATION_DETECTED"
  | "SIMULATION_BYPASS_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type GovernanceConstitutionalStrategyReviewScenario =
  | "BASELINE"
  | "APPROVED_FOR_SIMULATION"
  | "REVISION_REQUIRED"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTIONAL_REJECTED"
  | "UNCERTIFIED_LEDGER"
  | "MISSING_GOVERNANCE"
  | "CONSTITUTIONAL_FAIL"
  | "AUTHORITY_FAIL"
  | "TENANT_ISOLATION_FAIL"
  | "ADVISORY_VIOLATION"
  | "POLICY_CONFLICT"
  | "MISSING_REGULATORY"
  | "MISSING_REPLAY"
  | "CROSS_TENANT"
  | "NONDETERMINISTIC_OUTCOME"
  | "HASH_MISMATCH"
  | "REGISTRY_MUTATION"
  | "SIMULATION_BYPASS"
  | "FAIL_OPEN";

export type StrategyGovernanceReview = Readonly<{
  review_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  governance_compliance: boolean;
  constitutional_compliance: boolean;
  authority_verification: boolean;
  tenant_isolation_status: boolean;
  advisory_only_validation: boolean;
  policy_conflict_summary: string;
  regulatory_implications: readonly string[];
  review_outcome: StrategyReviewOutcome;
  reviewer_identity: string;
  supporting_governance_refs: readonly string[];
  supporting_policy_refs: readonly string[];
  supporting_replay_refs: readonly string[];
  review_timestamp: string;
  lifecycle_state: StrategyReviewLifecycleState;
  simulation_entry_permitted: boolean;
  mutates_strategy: false;
  direct_approval: false;
  integrity_hash: string;
}>;

export type StrategyReviewRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  review_refs: readonly string[];
  outcome_index: Readonly<Record<StrategyReviewOutcome, readonly string[]>>;
  proposal_index: Readonly<Record<string, readonly string[]>>;
  append_only: boolean;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyReviewValidation = Readonly<{
  validation_id: string;
  state: StrategyReviewValidationState;
  certified: boolean;
  failures: readonly GovernanceConstitutionalStrategyReviewFailure[];
  ledger_certified: boolean;
  governance_complete: boolean;
  constitutional_compliant: boolean;
  authority_verified: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  policy_conflicts_resolved: boolean;
  regulatory_complete: boolean;
  replay_complete: boolean;
  outcome_deterministic: boolean;
  registry_immutable: boolean;
  simulation_gate_enforced: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type StrategyReviewApiSurface = Readonly<{
  api_id: string;
  review_proposal: "POST /governance-constitutional-strategy-review/review";
  retrieve_reviews: "POST /governance-constitutional-strategy-review/reviews";
  retrieve_decision: "POST /governance-constitutional-strategy-review/decision";
  retrieve_governance: "POST /governance-constitutional-strategy-review/governance";
  retrieve_constitutional: "POST /governance-constitutional-strategy-review/constitutional";
  retrieve_authority: "POST /governance-constitutional-strategy-review/authority";
  retrieve_policy: "POST /governance-constitutional-strategy-review/policy";
  retrieve_regulatory: "POST /governance-constitutional-strategy-review/regulatory";
  replay_review: "POST /governance-constitutional-strategy-review/replay";
  retrieve_registry: "POST /governance-constitutional-strategy-review/registry";
  retrieve_contract: "GET /governance-constitutional-strategy-review/contract";
  update_supported: false;
  delete_supported: false;
  direct_approval_supported: false;
  simulation_bypass_supported: false;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalStrategyReviewInput = Readonly<{
  ledger_result?: StrategyEvolutionLedgerResult;
  scenario?: GovernanceConstitutionalStrategyReviewScenario;
}>;

export type GovernanceConstitutionalStrategyReviewResult = Readonly<{
  governance_constitutional_strategy_review_version: "governance-constitutional-strategy-review/v1";
  ledger_result: StrategyEvolutionLedgerResult;
  api_surface: StrategyReviewApiSurface;
  reviews: readonly StrategyGovernanceReview[];
  registry: StrategyReviewRegistry;
  validation: StrategyReviewValidation;
  deterministic: true;
  replayable: true;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  simulation_entry_permitted: boolean;
  mutates_strategy: false;
  direct_approval: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalStrategyReviewFoundation = Readonly<{
  governance_constitutional_strategy_review_version: "governance-constitutional-strategy-review/v1";
  api_surface: StrategyReviewApiSurface;
  result: GovernanceConstitutionalStrategyReviewResult;
}>;
