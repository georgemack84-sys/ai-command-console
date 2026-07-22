import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority } from "@/types/decision-priority-contract";

export type DependencyPriorityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";
export type ExecutionSequenceState = "VALID" | "READY" | "WAITING" | "BLOCKED" | "INVALID";

export type DependencyWeightFailureReason =
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "DEPENDENCY_REFERENCES_MISSING"
  | "GRAPH_INTEGRITY_VERIFICATION_FAILED"
  | "EXECUTION_SEQUENCE_INCONSISTENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "CROSS_TENANT_DEPENDENCY_DETECTED"
  | "CYCLIC_DEPENDENCY_UNRESOLVED"
  | "CANONICAL_GRAPH_ORDERING_FAILED"
  | "DEPENDENCY_REPLAY_MISMATCH"
  | "HIDDEN_DEPENDENCY_WEIGHTING_DETECTED";

export type DependencyWeightAnalyzerInput = Readonly<{
  candidate?: DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  dependency_graph_complete?: boolean;
  graph_integrity_verified?: boolean;
  canonical_ordering_reproducible?: boolean;
  unresolved_cycle_refs?: readonly string[];
  blocked_decision_count?: number;
  blocked_workflow_count?: number;
  dependency_chain_depth?: number;
  graph_depth_score?: number;
  graph_centrality_score?: number;
  cascade_impact_score?: number;
  bottleneck_score?: number;
  execution_sequence_score?: number;
  execution_sequence_state?: ExecutionSequenceState;
  prerequisite_refs?: readonly string[];
  blocked_by_refs?: readonly string[];
  downstream_refs?: readonly string[];
  dependency_refs?: readonly string[];
  governance_refs?: readonly string[];
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  hidden_weighting_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type DependencyWeightAssessment = Readonly<{
  assessment_id: string;
  decision_candidate_id: string;
  dependency_weight_score: number;
  blocked_decision_count: number;
  dependency_chain_depth: number;
  graph_depth_score: number;
  cascade_impact_score: number;
  bottleneck_score: number;
  execution_sequence_score: number;
  composite_dependency_score: number;
  dependency_priority_level: DependencyPriorityLevel;
  explanation_ref: string;
  dependency_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type ExecutionSequenceAssessment = Readonly<{
  sequence_id: string;
  decision_candidate_id: string;
  execution_sequence_state: ExecutionSequenceState;
  prerequisite_refs: readonly string[];
  blocked_by_refs: readonly string[];
  downstream_refs: readonly string[];
  sequence_score: number;
  sequencing_validation: "PASS" | "FAIL";
  explanation_ref: string;
  dependency_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type DependencyWeightExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  blockage_rationale: string;
  chain_rationale: string;
  graph_rationale: string;
  cascade_rationale: string;
  bottleneck_rationale: string;
  sequencing_rationale: string;
  priority_adjustment_rationale: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DependencyWeightLedgerRecord = Readonly<{
  ledger_entry_id: string;
  decision_candidate_id: string;
  dependency_assessment_ref: string;
  sequence_assessment_ref: string;
  dependency_score: number;
  priority_adjustment: number;
  dependency_priority_level: DependencyPriorityLevel;
  execution_sequence_state: ExecutionSequenceState;
  affected_decision_refs: readonly string[];
  dependency_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type DependencyWeightReplayRecord = Readonly<{
  replay_id: string;
  decision_candidate_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  dependency_score: number;
  replay_valid: boolean;
  failures: readonly DependencyWeightFailureReason[];
  integrity_hash: string;
}>;

export type DependencyWeightAnalyzerResult = Readonly<{
  analyzer_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly DependencyWeightFailureReason[];
  dependency_assessment: DependencyWeightAssessment;
  execution_sequence_assessment: ExecutionSequenceAssessment;
  explanation: DependencyWeightExplanation;
  ledger_record: DependencyWeightLedgerRecord;
  replay_record: DependencyWeightReplayRecord;
  priority_input: DecisionPriority;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DependencyWeightObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  replay_failures: number;
  graph_failures: number;
  sequence_failures: number;
  tenant_failures: number;
  average_dependency_score: number;
  blocked_decisions_total: number;
  dependency_distribution: Readonly<Record<DependencyPriorityLevel, number>>;
  sequence_distribution: Readonly<Record<ExecutionSequenceState, number>>;
}>;
