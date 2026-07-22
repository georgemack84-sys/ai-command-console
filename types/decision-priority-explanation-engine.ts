import type { PriorityScoringEngineResult } from "@/types/decision-priority-scoring-engine";
import type { DecisionPriorityState } from "@/types/decision-priority-contract";

export type PriorityExplanationFailureReason =
  | "RANKING_RATIONALE_INCOMPLETE"
  | "SCORING_BREAKDOWN_MISSING"
  | "SUPPORTING_EVIDENCE_UNTRACEABLE"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "EXPLANATION_ORDERING_NONDETERMINISTIC"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "HIDDEN_SCORING_LOGIC_DETECTED"
  | "GOVERNANCE_ADJUSTMENT_UNEXPLAINED"
  | "EXPLANATION_REPLAY_MISMATCH";

export type PriorityExplanationInput = Readonly<{
  scoring_result?: PriorityScoringEngineResult;
  ranking_rationale_complete?: boolean;
  scoring_breakdown_complete?: boolean;
  explanation_ordering_deterministic?: boolean;
  governance_adjustment_explained?: boolean;
  hidden_scoring_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type PriorityExplanationRecord = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  priority_state: DecisionPriorityState;
  overall_priority_score: number;
  ranking_position: number | null;
  ranking_rationale: string;
  scoring_breakdown_ref: string;
  evidence_narrative_ref: string;
  governance_explanation_ref: string;
  confidence_explanation_ref: string;
  risk_explanation_ref: string;
  dependency_explanation_ref: string;
  operational_explanation_ref: string;
  operator_summary_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  explanation_version: "priority-explanation-engine/v1";
  integrity_hash: string;
}>;

export type OperatorPrioritySummary = Readonly<{
  summary_id: string;
  decision_candidate_id: string;
  operator_actions: readonly string[];
  approval_requirements: readonly string[];
  escalation_requirements: readonly string[];
  blocked_conditions: readonly string[];
  certification_requirements: readonly string[];
  monitoring_recommendations: readonly string[];
  explanation_ref: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type PriorityExplanationReport = Readonly<{
  report_id: string;
  decision_candidate_id: string;
  executive_summary: string;
  ranking_rationale: string;
  scoring_breakdown: readonly string[];
  evidence_narrative: string;
  governance_narrative: string;
  confidence_narrative: string;
  risk_narrative: string;
  dependency_narrative: string;
  operational_narrative: string;
  operator_summary: string;
  replay_narrative: string;
  integrity_hash: string;
}>;

export type PriorityExplanationLedgerRecord = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  explanation_refs: readonly string[];
  report_refs: readonly string[];
  operator_summary_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type PriorityExplanationReplayRecord = Readonly<{
  replay_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  replay_valid: boolean;
  explanation_order: readonly string[];
  failures: readonly PriorityExplanationFailureReason[];
  integrity_hash: string;
}>;

export type PriorityExplanationEngineResult = Readonly<{
  explanation_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly PriorityExplanationFailureReason[];
  explanation_records: readonly PriorityExplanationRecord[];
  operator_summaries: readonly OperatorPrioritySummary[];
  reports: readonly PriorityExplanationReport[];
  ledger_record: PriorityExplanationLedgerRecord;
  replay_record: PriorityExplanationReplayRecord;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PriorityExplanationObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  explanations_generated: number;
  replay_failures: number;
  evidence_failures: number;
  governance_failures: number;
  tenant_failures: number;
  state_distribution: Readonly<Record<DecisionPriorityState, number>>;
}>;
