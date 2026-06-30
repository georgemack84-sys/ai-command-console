import type { GovernanceQueryContract, GovernanceQueryValidationIssue } from "@/types/governance-query-contract";
import type { GovernanceHistoricalLedgerRecord, GovernanceHistoricalReconstructionResponse } from "@/types/governance-historical-reconstruction";
import type { GovernanceSearchDomain } from "@/types/governance-search-engine";

export type GovernanceCorrelationLedger =
  | "TRUTH_LEDGER"
  | "POLICY_LEDGER"
  | "EVIDENCE_LEDGER"
  | "RECOMMENDATION_LEDGER"
  | "COMPLIANCE_LEDGER"
  | "RISK_LEDGER"
  | "ESCALATION_LEDGER"
  | "REPLAY_LEDGER"
  | "INTEGRITY_LEDGER"
  | "LINEAGE_LEDGER";

export type GovernanceCorrelationRelationshipType =
  | "INFLUENCES"
  | "SUPPORTS"
  | "MITIGATES"
  | "ESCALATES"
  | "VALIDATES"
  | "DEPENDS_ON"
  | "SUPERSEDES"
  | "PARENT_OF"
  | "CHILD_OF"
  | "RECONSTRUCTED_BY";

export type GovernanceCorrelationErrorState =
  | "CORRELATION_NOT_FOUND"
  | "LEDGER_REFERENCE_INVALID"
  | "RELATIONSHIP_INCONSISTENT"
  | "EVIDENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "REPLAY_CORRELATION_FAILED"
  | "HASH_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION";

export type GovernanceCorrelationState = "CORRELATIONS_GENERATED" | GovernanceCorrelationErrorState;

export type GovernanceCorrelationScenario =
  | "BASELINE"
  | "CORRELATION_NOT_FOUND"
  | "LEDGER_REFERENCE_INVALID"
  | "RELATIONSHIP_INCONSISTENT"
  | "EVIDENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "REPLAY_CORRELATION_FAILED"
  | "HASH_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION";

export type GovernanceCorrelation = Readonly<{
  correlation_id: string;
  tenant_id: string;
  mission_id: string;
  source_ledger: GovernanceCorrelationLedger;
  source_object: string;
  target_ledger: GovernanceCorrelationLedger;
  target_object: string;
  relationship_type: GovernanceCorrelationRelationshipType;
  supporting_evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  correlation_confidence: number;
  created_timestamp: string;
  correlation_hash: string;
}>;

export type GovernanceRelationshipGraphNode = Readonly<{
  node_id: string;
  ledger: GovernanceCorrelationLedger;
  object_ref: string;
  domain: GovernanceSearchDomain;
  label: string;
  node_hash: string;
}>;

export type GovernanceRelationshipGraphEdge = Readonly<{
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: GovernanceCorrelationRelationshipType;
  correlation_id: string;
  edge_hash: string;
}>;

export type GovernanceRelationshipGraph = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  nodes: readonly GovernanceRelationshipGraphNode[];
  edges: readonly GovernanceRelationshipGraphEdge[];
  graph_version: "governance-relationship-graph/v7J.4";
  graph_hash: string;
}>;

export type GovernanceReplayCorrelation = Readonly<{
  replay_id: string;
  historical_reconstruction_hash: string | null;
  correlated_replay_refs: readonly string[];
  replay_dependency_graph_hash: string;
  replay_consistent: boolean;
  replay_correlation_hash: string;
}>;

export type GovernanceCorrelationValidation = Readonly<{
  valid: boolean;
  relationship_count: number;
  graph_hash: string | null;
  replay_verified: boolean;
  evidence_complete: boolean;
  lineage_verified: boolean;
  hash_verified: boolean;
  errors: readonly GovernanceQueryValidationIssue[];
  validation_hash: string;
}>;

export type GovernanceCrossLedgerCorrelationInput = Readonly<{
  scenario?: GovernanceCorrelationScenario;
  query_contract?: GovernanceQueryContract;
  historical_response?: GovernanceHistoricalReconstructionResponse;
  ledger_records?: readonly GovernanceHistoricalLedgerRecord[];
}>;

export type GovernanceCrossLedgerCorrelationResponse = Readonly<{
  phase_version: "7J.4";
  schema_version: "governance-cross-ledger-correlation/v7J.4";
  correlation_run_id: string;
  tenant_id: string;
  mission_id: string;
  correlation_state: GovernanceCorrelationState;
  historical_response: GovernanceHistoricalReconstructionResponse;
  correlations: readonly GovernanceCorrelation[];
  relationship_graph: GovernanceRelationshipGraph | null;
  replay_correlation: GovernanceReplayCorrelation | null;
  validation: GovernanceCorrelationValidation;
  failures: readonly GovernanceQueryValidationIssue[];
  correlation_hash: string | null;
  read_only: true;
  advisory_only_notice: "Cross-ledger governance correlation is deterministic, immutable, read-only, replay-verifiable, and audit-backed.";
}>;

export type GovernanceCrossLedgerCorrelationObservabilitySurface = Readonly<{
  correlation_run_id: string;
  correlation_state: GovernanceCorrelationState;
  correlation_count: number;
  node_count: number;
  edge_count: number;
  replay_consistent: boolean;
  errors: readonly GovernanceCorrelationErrorState[];
  correlation_hash: string | null;
}>;
