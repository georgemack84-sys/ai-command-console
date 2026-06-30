import type { GovernanceIntegrityObjectType, GovernanceIntegrityState } from "@/types/governance-integrity-contract";

export type GovernanceHashChainScenario =
  | "BASELINE"
  | "CANONICAL_SERIALIZATION_MISMATCH"
  | "CONTENT_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "MISSING_CHAIN_RECORD"
  | "DUPLICATE_CHAIN_POSITION"
  | "REORDERED_CHAIN"
  | "REPLAY_HASH_MISMATCH"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "MISSING_LINEAGE_REFERENCE"
  | "LEDGER_PERSISTENCE_DELAY"
  | "CROSS_TENANT_LINKAGE";

export type GovernanceHashChainFailureReason =
  | "CANONICAL_SERIALIZATION_MISMATCH"
  | "CONTENT_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "ROOT_HASH_MISMATCH"
  | "MISSING_CHAIN_RECORD"
  | "DUPLICATE_CHAIN_POSITION"
  | "REORDERED_CHAIN"
  | "REPLAY_HASH_MISMATCH"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "MISSING_LINEAGE_REFERENCE"
  | "LEDGER_PERSISTENCE_DELAY"
  | "CROSS_TENANT_LINKAGE";

export type GovernanceCanonicalSerialization = Readonly<{
  serializer_version: "governance-canonical-serializer/v7I.2";
  schema_version: string;
  canonical_payload: string;
  canonical_hash: string;
  deterministic: boolean;
}>;

export type GovernanceHashGeneration = Readonly<{
  content_hash: string;
  canonical_hash: string;
  hash_algorithm: "SHA-256";
  hash_version: "governance-hash-chain/v7I.2";
  hash_timestamp: string;
}>;

export type GovernanceHashChainRecord = Readonly<{
  chain_id: string;
  record_id: string;
  integrity_record_id: string;
  governance_object_id: string;
  governance_object_type: GovernanceIntegrityObjectType;
  tenant_id: string;
  mission_id: string;
  chain_position: number;
  chain_version: "governance-hash-chain/v7I.2";
  previous_hash: string | null;
  current_hash: string;
  root_hash: string;
  canonical: GovernanceCanonicalSerialization;
  hash_generation: GovernanceHashGeneration;
  lineage_parent_record_id: string | null;
  replay_id: string;
  replay_hash: string;
  reconstruction_hash: string;
  truth_ledger_reference: string;
  verification_status: "VERIFIED" | "PENDING" | "FAILED";
  verification_timestamp: string;
}>;

export type GovernanceLineageHashGraph = Readonly<{
  chain_id: string;
  root_hash: string;
  ancestry_record_ids: readonly string[];
  lineage_edges: readonly Readonly<{ from_record_id: string; to_record_id: string; edge_hash: string }>[];
  lineage_hash: string;
}>;

export type GovernanceReplayHashChain = Readonly<{
  replay_id: string;
  replay_input_hash: string;
  replay_state_hash: string;
  replay_output_hash: string;
  reconstruction_hash: string;
  replay_verification_hash: string;
  replay_chain_hash: string;
  truth_ledger_reference: string;
}>;

export type GovernanceIntegrityLedgerEntry = Readonly<{
  chain_id: string;
  record_id: string;
  previous_hash: string | null;
  current_hash: string;
  root_hash: string;
  hash_algorithm: "SHA-256";
  verification_status: "VERIFIED" | "PENDING" | "FAILED";
  verification_timestamp: string;
  tenant_id: string;
  mission_id: string;
  append_only: true;
  ledger_hash: string;
}>;

export type GovernanceHashChainValidationIssue = Readonly<{
  reason: GovernanceHashChainFailureReason;
  state: GovernanceIntegrityState;
  path: string;
  message: string;
}>;

export type GovernanceHashChainValidationReport = Readonly<{
  chain_id: string | null;
  validation_state: GovernanceIntegrityState;
  valid: boolean;
  record_count: number;
  root_hash: string | null;
  canonical_serialization_valid: boolean;
  content_hashes_valid: boolean;
  previous_hashes_valid: boolean;
  root_hash_valid: boolean;
  chain_complete: boolean;
  ordering_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  ledger_persisted: boolean;
  failures: readonly GovernanceHashChainValidationIssue[];
  validation_hash: string;
}>;

export type GovernanceHashChainExecution = Readonly<{
  phase_version: "7I.2";
  schema_version: "governance-hash-chain-engine/v7I.2";
  chain_id: string;
  tenant_id: string;
  mission_id: string;
  chain_version: "governance-hash-chain/v7I.2";
  hash_algorithm: "SHA-256";
  root_hash: string;
  records: readonly GovernanceHashChainRecord[];
  lineage_graph: GovernanceLineageHashGraph;
  replay_chain: GovernanceReplayHashChain;
  ledger_entries: readonly GovernanceIntegrityLedgerEntry[];
  validation: GovernanceHashChainValidationReport;
  chain_execution_hash: string;
  advisory_only_notice: string;
}>;

export type GovernanceHashChainInput = Readonly<{
  scenario?: GovernanceHashChainScenario;
  tenant_id?: string;
  mission_id?: string;
  created_by?: string;
  execution?: GovernanceHashChainExecution;
}>;

export type GovernanceHashChainObservabilitySurface = Readonly<{
  chain_id: string;
  tenant_id: string;
  mission_id: string;
  validation_state: GovernanceIntegrityState;
  record_count: number;
  root_hash: string;
  latest_hash: string;
  failure_count: number;
  failures: readonly GovernanceHashChainFailureReason[];
  replay_chain_hash: string;
  lineage_hash: string;
  ledger_entries: number;
  advisory_only_notice: string;
}>;
