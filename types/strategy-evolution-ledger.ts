import type { StrategyDomain } from "@/types/strategy-evolution-contract";
import type { StrategyImprovementProposalResult } from "@/types/strategy-improvement-proposal-generator";

export type StrategyEvolutionLedgerLifecycleState = "RECORDED" | "HASH_VERIFIED" | "LINEAGE_LINKED" | "REPLAY_BOUND" | "CERTIFIED" | "IMMUTABLE" | "ARCHIVED" | "SUPERSEDED";
export type StrategyEvolutionLedgerValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_REFERENCES";

export type StrategyEvolutionLedgerFailure =
  | "PROPOSAL_GENERATOR_UNCERTIFIED"
  | "PROPOSAL_IDENTIFIER_MISSING"
  | "PROPOSAL_VERSION_MISSING"
  | "VERSION_OVERWRITE_ATTEMPTED"
  | "LEDGER_MUTATION_ATTEMPTED"
  | "LINEAGE_REFERENCE_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "ROLLBACK_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_INCOMPLETE"
  | "SIMULATION_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "TENANT_ISOLATION_VIOLATED"
  | "APPEND_ONLY_VIOLATION"
  | "FAIL_OPEN_BEHAVIOR";

export type StrategyEvolutionLedgerScenario =
  | "BASELINE"
  | "REVISION"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "UNCERTIFIED_PROPOSAL"
  | "MISSING_PROPOSAL_ID"
  | "MISSING_VERSION"
  | "VERSION_OVERWRITE"
  | "LEDGER_MUTATION"
  | "MISSING_LINEAGE"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_CERTIFICATION"
  | "HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "CROSS_TENANT"
  | "APPEND_ONLY_VIOLATION"
  | "FAIL_OPEN";

export type StrategyEvolutionLedgerRecord = Readonly<{
  ledger_record_id: string;
  proposal_id: string;
  proposal_version: string;
  tenant_id: string;
  mission_scope: string;
  strategy_area: StrategyDomain;
  lifecycle_state: StrategyEvolutionLedgerLifecycleState;
  parent_version_ref: string;
  superseded_by_ref: string;
  supporting_proposal_refs: readonly string[];
  governance_decision_refs: readonly string[];
  simulation_refs: readonly string[];
  certification_refs: readonly string[];
  replay_refs: readonly string[];
  rollback_refs: readonly string[];
  lineage_refs: readonly string[];
  previous_hash: string;
  ledger_timestamp: string;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionLedgerRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  ledger_record_refs: readonly string[];
  proposal_version_index: Readonly<Record<string, readonly string[]>>;
  lineage_index: Readonly<Record<string, readonly string[]>>;
  previous_hash_chain: readonly string[];
  append_only: boolean;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionLedgerValidation = Readonly<{
  validation_id: string;
  state: StrategyEvolutionLedgerValidationState;
  certified: boolean;
  failures: readonly StrategyEvolutionLedgerFailure[];
  proposal_generator_certified: boolean;
  proposal_identity_complete: boolean;
  version_complete: boolean;
  version_not_overwritten: boolean;
  ledger_not_mutated: boolean;
  lineage_complete: boolean;
  replay_complete: boolean;
  rollback_complete: boolean;
  governance_complete: boolean;
  simulation_complete: boolean;
  certification_complete: boolean;
  previous_hash_verified: boolean;
  tenant_isolated: boolean;
  append_only: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type StrategyEvolutionLedgerApiSurface = Readonly<{
  api_id: string;
  record_proposal: "POST /strategy-evolution-ledger/record";
  retrieve_records: "POST /strategy-evolution-ledger/records";
  retrieve_versions: "POST /strategy-evolution-ledger/versions";
  retrieve_lineage: "POST /strategy-evolution-ledger/lineage";
  verify_integrity: "POST /strategy-evolution-ledger/integrity";
  replay_ledger: "POST /strategy-evolution-ledger/replay";
  retrieve_rollback: "POST /strategy-evolution-ledger/rollback";
  retrieve_registry: "POST /strategy-evolution-ledger/registry";
  retrieve_contract: "GET /strategy-evolution-ledger/contract";
  update_supported: false;
  delete_supported: false;
  overwrite_supported: false;
  integrity_hash: string;
}>;

export type StrategyEvolutionLedgerInput = Readonly<{
  proposal_result?: StrategyImprovementProposalResult;
  scenario?: StrategyEvolutionLedgerScenario;
}>;

export type StrategyEvolutionLedgerResult = Readonly<{
  strategy_evolution_ledger_version: "strategy-evolution-ledger/v1";
  proposal_result: StrategyImprovementProposalResult;
  api_surface: StrategyEvolutionLedgerApiSurface;
  records: readonly StrategyEvolutionLedgerRecord[];
  registry: StrategyEvolutionLedgerRegistry;
  validation: StrategyEvolutionLedgerValidation;
  deterministic: true;
  replayable: true;
  append_only: boolean;
  immutable: boolean;
  tenant_isolated: boolean;
  governance_protected: boolean;
  constitutionally_compliant: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyEvolutionLedgerFoundation = Readonly<{
  strategy_evolution_ledger_version: "strategy-evolution-ledger/v1";
  api_surface: StrategyEvolutionLedgerApiSurface;
  result: StrategyEvolutionLedgerResult;
}>;
