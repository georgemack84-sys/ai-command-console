import type { AdaptationConsolidationResult, ConsolidatedAdaptationProposal } from "@/types/adaptation-consolidation-engine";

export type ProposalLineageReferenceCategory =
  | "OUTCOME"
  | "RECOMMENDATION"
  | "EVIDENCE"
  | "SIMULATION"
  | "OPERATOR_FEEDBACK"
  | "GOVERNANCE_REVIEW"
  | "CERTIFICATION_HISTORY"
  | "RISK_RECORD"
  | "CONFIDENCE_RECORD"
  | "SCORING"
  | "PRIORITIZATION"
  | "SUPPRESSION"
  | "CONSOLIDATION";

export type ProposalLineageBindingState = "BOUND" | "FAIL_CLOSED";

export type ProposalLineageReplayFailure =
  | "REQUIRED_REFERENCES_MISSING"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "REPLAY_GRAPH_GENERATION_FAILED"
  | "GOVERNANCE_HISTORY_INCOMPLETE"
  | "CERTIFICATION_HISTORY_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DEPENDENCY_GRAPH_INCONSISTENT"
  | "DETERMINISTIC_REPLAY_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "NO_BINDABLE_PROPOSALS"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "HISTORICAL_RECORD_MUTATION_ATTEMPT"
  | "LINEAGE_REWRITE_ATTEMPT"
  | "IMMUTABLE_RECORD_OVERWRITE_ATTEMPT"
  | "DEPENDENCY_FABRICATION_ATTEMPT"
  | "GOVERNANCE_HISTORY_BYPASS_ATTEMPT"
  | "CERTIFICATION_HISTORY_BYPASS_ATTEMPT"
  | "OPERATOR_HISTORY_BYPASS_ATTEMPT"
  | "CROSS_TENANT_LINEAGE_ATTEMPT"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "PROPOSAL_REJECTION_ATTEMPT"
  | "PROPOSAL_IMPLEMENTATION_ATTEMPT";

export type ProposalLineageReplayScenario =
  | "BASELINE"
  | "DUPLICATE_CONSOLIDATION"
  | "OVERLAPPING_CONSOLIDATION"
  | "CONFLICTING_RELATIONSHIP"
  | "MISSING_REFERENCES"
  | "MISSING_EVIDENCE"
  | "REPLAY_GRAPH_FAILURE"
  | "MISSING_GOVERNANCE"
  | "MISSING_CERTIFICATION"
  | "INTEGRITY_FAILURE"
  | "DEPENDENCY_INCONSISTENT"
  | "NONDETERMINISTIC_REPLAY"
  | "TENANT_VIOLATION"
  | "NO_BINDABLE_PROPOSALS"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "HISTORICAL_MUTATION_ATTEMPT"
  | "LINEAGE_REWRITE_ATTEMPT"
  | "IMMUTABLE_OVERWRITE_ATTEMPT"
  | "DEPENDENCY_FABRICATION"
  | "GOVERNANCE_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "OPERATOR_BYPASS"
  | "CROSS_TENANT_LINEAGE"
  | "APPROVAL_ATTEMPT"
  | "REJECTION_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT";

export type ProposalLineageReference = Readonly<{
  reference_id: string;
  category: ProposalLineageReferenceCategory;
  artifact_id: string;
  source_phase: string;
  immutable: true;
  tenant_scope: "CURRENT_TENANT";
  integrity_hash: string;
}>;

export type ProposalDependencyGraph = Readonly<{
  graph_id: string;
  proposal_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  topological_order: readonly string[];
  graph_consistent: boolean;
  immutable: true;
  integrity_hash: string;
}>;

export type ProposalReplayGraph = Readonly<{
  replay_graph_id: string;
  proposal_id: string;
  replay_version: "proposal-lineage-replay/v1";
  replay_steps: readonly string[];
  reconstructs_identity: boolean;
  reconstructs_inputs: boolean;
  reconstructs_evidence: boolean;
  reconstructs_analytical_reasoning: boolean;
  reconstructs_governance: boolean;
  reconstructs_constitutional: boolean;
  reconstructs_authority: boolean;
  reconstructs_scoring: boolean;
  reconstructs_prioritization: boolean;
  reconstructs_suppression: boolean;
  reconstructs_consolidation: boolean;
  byte_identical_reconstruction: boolean;
  immutable: true;
  integrity_hash: string;
}>;

export type ProposalTraceability = Readonly<{
  backward_traceability: readonly ProposalLineageReferenceCategory[];
  forward_traceability: readonly string[];
  complete_backward_traceability: boolean;
  complete_forward_traceability: boolean;
  integrity_hash: string;
}>;

export type ProposalLineageRecord = Readonly<{
  lineage_id: string;
  proposal_id: string;
  consolidated_proposal_id: string;
  referenced_artifacts: readonly ProposalLineageReference[];
  dependency_graph: ProposalDependencyGraph;
  replay_graph: ProposalReplayGraph;
  traceability: ProposalTraceability;
  creation_timestamp: string;
  binder_version: "proposal-lineage-replay-binder/v1";
  immutable: true;
  complete_provenance: boolean;
  replay_reconstructable: boolean;
  advisory_only: true;
  modifies_proposal: false;
  mutates_history: false;
  approves_proposal: false;
  rejects_proposal: false;
  implements_proposal: false;
  integrity_hash: string;
}>;

export type ProposalLineageReplayMetrics = Readonly<{
  proposals_bound: number;
  lineage_completeness_rate: number;
  replay_completeness_rate: number;
  dependency_graph_size: number;
  historical_artifacts_referenced: number;
  replay_generation_latency_ms: number;
  integrity_verification_failures: number;
  missing_reference_detections: number;
  deterministic_replay_success: boolean;
  lineage_validation_failures: readonly ProposalLineageReplayFailure[];
  integrity_hash: string;
}>;

export type ProposalLineageReplayApiSurface = Readonly<{
  api_id: string;
  bind_lineage: "POST /proposal-lineage-replay-binder/bind";
  retrieve_records: "POST /proposal-lineage-replay-binder/records";
  retrieve_replay_graphs: "POST /proposal-lineage-replay-binder/replay-graphs";
  retrieve_dependency_graphs: "POST /proposal-lineage-replay-binder/dependency-graphs";
  retrieve_metrics: "POST /proposal-lineage-replay-binder/metrics";
  replay_lineage: "POST /proposal-lineage-replay-binder/replay";
  inspect_lineage: "POST /proposal-lineage-replay-binder/inspect";
  retrieve_contract: "GET /proposal-lineage-replay-binder/contract";
  proposal_mutation_supported: false;
  historical_record_mutation_supported: false;
  lineage_rewrite_supported: false;
  approval_supported: false;
  rejection_supported: false;
  implementation_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ProposalLineageReplayInput = Readonly<{
  scenario?: ProposalLineageReplayScenario;
  consolidation_result?: AdaptationConsolidationResult;
}>;

export type ProposalLineageReplayResult = Readonly<{
  proposal_lineage_replay_binder_version: "proposal-lineage-replay-binder/v1";
  binding_version: "proposal-lineage-binding-rules/v1";
  api_surface: ProposalLineageReplayApiSurface;
  consolidation_result: AdaptationConsolidationResult;
  lineage_records: readonly ProposalLineageRecord[];
  metrics: ProposalLineageReplayMetrics;
  binding_state: ProposalLineageBindingState;
  failures: readonly ProposalLineageReplayFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  lineage_immutable: boolean;
  backward_traceability_complete: boolean;
  forward_traceability_complete: boolean;
  advisory_only: true;
  modifies_proposals: false;
  mutates_historical_records: false;
  rewrites_lineage: false;
  approves_proposals: false;
  rejects_proposals: false;
  implements_proposals: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProposalLineageReplayFoundation = Readonly<{
  proposal_lineage_replay_binder_version: "proposal-lineage-replay-binder/v1";
  supported_reference_categories: readonly ProposalLineageReferenceCategory[];
  api_surface: ProposalLineageReplayApiSurface;
  result: ProposalLineageReplayResult;
}>;

export type LineageBindableProposal = ConsolidatedAdaptationProposal;
