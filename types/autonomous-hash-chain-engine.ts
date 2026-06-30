import type { IntegrityArtifactType, IntegrityRecord, IntegrityState } from "@/types/integrity-contract";

export type AutonomousHashChainArtifactType = IntegrityArtifactType | "DECISION_RECORD" | "CERTIFICATION_RECORD";

export type AutonomousHashChainScenario =
  | "BASELINE"
  | "INVALID_HASH"
  | "BROKEN_PARENT_LINK"
  | "MISSING_PARENT"
  | "REPLAY_MISMATCH"
  | "NONDETERMINISTIC_ORDERING"
  | "ORPHAN_NODE"
  | "UNAUTHORIZED_CHAIN_MODIFICATION"
  | "CROSS_TENANT_LINKAGE"
  | "LINEAGE_CORRUPTION"
  | "GOVERNANCE_REFERENCE_LOSS"
  | "CONSTITUTIONAL_REFERENCE_LOSS"
  | "DUPLICATE_HASH"
  | "MISSING_CHAIN_NODE"
  | "UNSUPPORTED_HASH_ALGORITHM";

export type AutonomousHashChainFailureReason =
  | "INVALID_HASH"
  | "BROKEN_PARENT_LINK"
  | "MISSING_PARENT"
  | "REPLAY_MISMATCH"
  | "NONDETERMINISTIC_ORDERING"
  | "ORPHAN_NODE"
  | "UNAUTHORIZED_CHAIN_MODIFICATION"
  | "CROSS_TENANT_LINKAGE"
  | "LINEAGE_CORRUPTION"
  | "GOVERNANCE_REFERENCE_LOSS"
  | "CONSTITUTIONAL_REFERENCE_LOSS"
  | "DUPLICATE_HASH"
  | "MISSING_CHAIN_NODE"
  | "UNSUPPORTED_HASH_ALGORITHM";

export type AutonomousHashLifecycleState = "CREATED" | "HASH_GENERATED" | "LINKED" | "VERIFIED" | "CERTIFIED" | "ARCHIVED";
export type AutonomousHashChainState = "INITIALIZING" | "BUILDING" | "VERIFIED" | "CERTIFIED" | "DEGRADED" | "BROKEN" | "CORRUPTED" | "ARCHIVED";

export type AutonomousCanonicalHashArtifact = Readonly<{
  serializer_version: "autonomous-hash-canonical-serializer/v8H.2";
  schema_version: string;
  canonical_payload: string;
  canonical_hash: string;
  deterministic: true;
}>;

export type AutonomousHashGeneration = Readonly<{
  current_hash: string;
  payload_hash: string;
  lineage_hash: string;
  replay_hash: string;
  governance_hash: string;
  constitutional_hash: string;
  hash_algorithm: "SHA-256";
  hash_version: "autonomous-hash-chain/v8H.2";
  generated_at: string;
}>;

export type AutonomousHashParentArtifact = Readonly<{
  parent_hash: string;
  parent_artifact_id: string | null;
  parent_artifact_type: AutonomousHashChainArtifactType | null;
}>;

export type AutonomousHashChainNode = Readonly<{
  hash_id: string;
  chain_id: string;
  artifact_type: AutonomousHashChainArtifactType;
  artifact_id: string;
  tenant_id: string;
  sequence_number: number;
  parent_artifact: AutonomousHashParentArtifact;
  current_hash: string;
  parent_hash: string;
  lineage_hash: string;
  replay_hash: string;
  governance_hash: string;
  constitutional_hash: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  authority_reference: string;
  canonical: AutonomousCanonicalHashArtifact;
  hash_generation: AutonomousHashGeneration;
  integrity_state: IntegrityState;
  lifecycle_state: AutonomousHashLifecycleState;
  timestamp: string;
  schema_version: "autonomous-hash-chain-node/v8H.2";
  append_only: true;
}>;

export type AutonomousHashChainLedgerEntry = Readonly<{
  chain_id: string;
  hash_id: string;
  sequence_number: number;
  artifact_id: string;
  artifact_type: AutonomousHashChainArtifactType;
  previous_hash: string;
  current_hash: string;
  tenant_id: string;
  append_only: true;
  ledger_hash: string;
}>;

export type AutonomousHashChainLineageGraph = Readonly<{
  chain_id: string;
  genesis_hash: string;
  terminal_hash: string;
  ancestry_hash_ids: readonly string[];
  lineage_edges: readonly Readonly<{ from_hash_id: string; to_hash_id: string; edge_hash: string }>[];
  lineage_hash: string;
}>;

export type AutonomousHashChainReplayEvidence = Readonly<{
  replay_reference: string;
  replay_checkpoint: string;
  replay_reconstruction_hash: string;
  reconstructed_node_hashes: readonly string[];
  replay_chain_hash: string;
  deterministic_replay: boolean;
}>;

export type AutonomousHashChainValidationIssue = Readonly<{
  reason: AutonomousHashChainFailureReason;
  state: IntegrityState;
  path: string;
  message: string;
}>;

export type AutonomousHashChainValidationReport = Readonly<{
  chain_id: string | null;
  validation_state: IntegrityState;
  chain_state: AutonomousHashChainState;
  valid: boolean;
  node_count: number;
  genesis_hash: string | null;
  terminal_hash: string | null;
  hash_reproducible: boolean;
  parent_links_valid: boolean;
  parent_existence_valid: boolean;
  replay_reconstructable: boolean;
  ordering_deterministic: boolean;
  chain_complete: boolean;
  append_only_valid: boolean;
  lineage_continuous: boolean;
  governance_traceable: boolean;
  constitutional_traceable: boolean;
  tenant_isolated: boolean;
  algorithm_supported: boolean;
  failures: readonly AutonomousHashChainValidationIssue[];
  validation_hash: string;
}>;

export type AutonomousHashChainExecution = Readonly<{
  phase_version: "8H.2";
  schema_version: "autonomous-hash-chain-engine/v8H.2";
  chain_id: string;
  tenant_id: string;
  hash_algorithm: "SHA-256";
  chain_version: "autonomous-hash-chain/v8H.2";
  source_integrity_contract: IntegrityRecord;
  genesis_hash: string;
  terminal_hash: string;
  nodes: readonly AutonomousHashChainNode[];
  lineage_graph: AutonomousHashChainLineageGraph;
  replay_evidence: AutonomousHashChainReplayEvidence;
  ledger_entries: readonly AutonomousHashChainLedgerEntry[];
  validation: AutonomousHashChainValidationReport;
  certification_evidence_hash: string;
  advisory_only_notice: string;
}>;

export type AutonomousHashChainInput = Readonly<{
  scenario?: AutonomousHashChainScenario;
  integrityRecord?: IntegrityRecord;
  execution?: AutonomousHashChainExecution;
}>;

export type AutonomousHashChainObservabilitySurface = Readonly<{
  chain_id: string;
  tenant_id: string;
  validation_state: IntegrityState;
  chain_state: AutonomousHashChainState;
  node_count: number;
  genesis_hash: string;
  terminal_hash: string;
  latest_hash: string;
  failure_count: number;
  failures: readonly AutonomousHashChainFailureReason[];
  replay_chain_hash: string;
  lineage_hash: string;
  ledger_entries: number;
}>;
