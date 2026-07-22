import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority, DecisionPriorityFactorName, DecisionPriorityState } from "@/types/decision-priority-contract";

export type ConstraintOutcome =
  | "ALLOW_RANKING"
  | "ALLOW_WITH_REVIEW"
  | "ELEVATE_VISIBILITY"
  | "RESTRICT_ELEVATION"
  | "BLOCK_RANKING"
  | "REJECT_CANDIDATE";

export type PriorityScoringFailureReason =
  | "REQUIRED_FACTOR_SCORE_MISSING"
  | "SCORE_OUT_OF_RANGE"
  | "WEIGHT_PROFILE_MISSING"
  | "WEIGHT_PROFILE_VERSION_UNKNOWN"
  | "WEIGHT_OUT_OF_RANGE"
  | "WEIGHTS_NOT_NORMALIZED"
  | "GOVERNANCE_OVERRIDES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_HASH_INVALID"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "TIE_BREAK_ORDERING_UNREPRODUCIBLE"
  | "PRIORITY_STATE_UNRESOLVED"
  | "HIDDEN_RANKING_LOGIC_DETECTED"
  | "PRIORITY_SCORING_REPLAY_MISMATCH";

export type PriorityWeightProfile = Readonly<{
  weight_profile_id: string;
  tenant_id: string;
  mission_scope: string;
  profile_version: "priority-weight-profile/v1";
  mission_weight: number;
  urgency_weight: number;
  risk_weight: number;
  confidence_weight: number;
  governance_weight: number;
  runtime_weight: number;
  recovery_weight: number;
  forecast_weight: number;
  operator_weight: number;
  dependency_weight: number;
  governance_override_rules: readonly string[];
  confidence_restriction_rules: readonly string[];
  blocked_state_rules: readonly string[];
  effective_from: string;
  effective_until: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type PriorityScoringCandidateInput = Readonly<{
  candidate?: DecisionCandidate;
  decision_candidate_id?: string;
  tenant_id?: string;
  mission_id?: string;
  scores?: Partial<Record<DecisionPriorityFactorName, number>>;
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  replay_refs?: readonly string[];
  constitutional_violation?: boolean;
  governance_conflict?: boolean;
  certification_blocker?: boolean;
  dependency_missing?: boolean;
  schema_or_integrity_invalid?: boolean;
  low_confidence_review_required?: boolean;
  blocked?: boolean;
  rejected?: boolean;
}>;

export type PriorityScoringEngineInput = Readonly<{
  candidates?: readonly PriorityScoringCandidateInput[];
  weight_profile?: PriorityWeightProfile;
  hidden_ranking_refs?: readonly string[];
  tie_break_reproducible?: boolean;
  expected_replay_hash?: string;
}>;

export type CompositePriorityScore = Readonly<Record<DecisionPriorityFactorName, number> & {
  score_id: string;
  decision_candidate_id: string;
  weight_profile_id: string;
  overall_priority_score: number;
  factor_contribution_breakdown: Readonly<Record<DecisionPriorityFactorName, number>>;
  applied_constraints: readonly ConstraintOutcome[];
  priority_state: DecisionPriorityState;
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type PriorityRankingRecord = Readonly<{
  ranking_id: string;
  tenant_id: string;
  mission_id: string;
  ranking_order: number | null;
  rank_position: number | null;
  decision_candidate_id: string;
  priority_state: DecisionPriorityState;
  overall_priority_score: number;
  tie_break_result: string;
  tie_break_fields_used: readonly string[];
  scoring_profile_ref: string;
  explanation_ref: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  created_timestamp: string;
  integrity_hash: string;
}>;

export type PriorityScoringExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  score_rationale: string;
  weight_rationale: string;
  governance_rationale: string;
  confidence_rationale: string;
  tie_break_rationale: string;
  state_rationale: string;
  ranking_rationale: string;
  integrity_hash: string;
}>;

export type PriorityScoringReplayRecord = Readonly<{
  replay_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  replay_valid: boolean;
  ranking_order: readonly string[];
  failures: readonly PriorityScoringFailureReason[];
  integrity_hash: string;
}>;

export type PriorityScoringLedgerRecord = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  ranking_refs: readonly string[];
  score_refs: readonly string[];
  active_ranking_order: readonly string[];
  blocked_candidate_refs: readonly string[];
  rejected_candidate_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type PriorityScoringEngineResult = Readonly<{
  scoring_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly PriorityScoringFailureReason[];
  weight_profile: PriorityWeightProfile;
  composite_scores: readonly CompositePriorityScore[];
  ranking_records: readonly PriorityRankingRecord[];
  explanations: readonly PriorityScoringExplanation[];
  ledger_record: PriorityScoringLedgerRecord;
  replay_record: PriorityScoringReplayRecord;
  priority_inputs: readonly DecisionPriority[];
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PriorityScoringObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  ranked_candidates: number;
  blocked_candidates: number;
  rejected_candidates: number;
  replay_failures: number;
  weight_profile_failures: number;
  tenant_failures: number;
  average_priority_score: number;
  state_distribution: Readonly<Record<DecisionPriorityState, number>>;
}>;
