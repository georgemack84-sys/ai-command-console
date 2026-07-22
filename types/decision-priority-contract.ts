import type { DecisionCandidate } from "@/types/decision-input-normalization";

export type DecisionPriorityState =
  | "CRITICAL"
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "DEFERRED"
  | "BLOCKED"
  | "REJECTED";

export type DecisionPriorityLifecycleState =
  | "REGISTERED"
  | "VALIDATED"
  | "SCORING"
  | "RANKED"
  | "EXPLAINED"
  | "CERTIFIED"
  | "RECORDED";

export type DecisionPriorityFactorName =
  | "mission_score"
  | "urgency_score"
  | "risk_score"
  | "confidence_score"
  | "governance_score"
  | "runtime_score"
  | "recovery_score"
  | "forecast_score"
  | "operator_score"
  | "dependency_score";

export type DecisionPriorityScores = Readonly<Record<DecisionPriorityFactorName, number>>;

export type DecisionPriorityScoringProfile = Readonly<{
  scoring_profile: "priority-evaluation-profile/v1";
  weights: Readonly<Record<DecisionPriorityFactorName, number>>;
  state_thresholds: Readonly<{
    critical: number;
    high: number;
    moderate: number;
    low: number;
  }>;
  integrity_hash: string;
}>;

export type DecisionPriority = Readonly<DecisionPriorityScores & {
  priority_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  total_priority_score: number;
  priority_state: DecisionPriorityState;
  lifecycle_state: DecisionPriorityLifecycleState;
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  scoring_profile: DecisionPriorityScoringProfile["scoring_profile"];
  priority_version: "priority-evaluation-contract/v1";
  created_timestamp: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPriorityExplanation = Readonly<{
  explanation_id: string;
  priority_id: string;
  factor_contributions: Readonly<Record<DecisionPriorityFactorName, number>>;
  governance_rationale: string;
  confidence_rationale: string;
  dependency_rationale: string;
  runtime_rationale: string;
  recovery_rationale: string;
  forecast_rationale: string;
  operator_rationale: string;
  integrity_hash: string;
}>;

export type DecisionPriorityBuildInput = Readonly<{
  candidate?: DecisionCandidate;
  scores?: Partial<DecisionPriorityScores>;
  scoring_profile?: DecisionPriorityScoringProfile;
  lifecycle_state?: DecisionPriorityLifecycleState;
  forced_state?: "BLOCKED" | "REJECTED";
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  constitutional_refs?: readonly string[];
  authority_refs?: readonly string[];
  replay_refs?: readonly string[];
  tenant_id?: string;
  mission_id?: string;
  hidden_scoring_refs?: readonly string[];
}>;

export type DecisionPriorityFailureReason =
  | "PRIORITY_OBJECT_MISSING"
  | "CANDIDATE_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "MISSING_EVIDENCE_REFERENCES"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_CONSTITUTIONAL_REFERENCES"
  | "MISSING_AUTHORITY_REFERENCES"
  | "MISSING_REPLAY_REFERENCES"
  | "SCORE_OUT_OF_RANGE"
  | "INVALID_PRIORITY_STATE"
  | "UNKNOWN_SCORING_PROFILE"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_MISMATCH"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "HIDDEN_SCORING_DETECTED";

export type DecisionPriorityValidationResult = Readonly<{
  validation_state: "VALID" | "REJECTED";
  priority_state: DecisionPriorityState | "UNKNOWN";
  failures: readonly DecisionPriorityFailureReason[];
  checks: Readonly<{
    schema_complete: boolean;
    candidate_linked: boolean;
    references_complete: boolean;
    scores_in_range: boolean;
    state_valid: boolean;
    integrity_valid: boolean;
    replay_ready: boolean;
    tenant_isolated: boolean;
    constitutional_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type DecisionPriorityReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  priority_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_total_priority_score: number;
  reconstructed_priority_state: DecisionPriorityState;
  failures: readonly DecisionPriorityFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPriorityLifecycleTransition = Readonly<{
  transition_id: string;
  priority_id: string;
  from_state: DecisionPriorityLifecycleState;
  to_state: DecisionPriorityLifecycleState;
  transition_valid: boolean;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DecisionPriorityContractFoundation = Readonly<{
  priority_version: "priority-evaluation-contract/v1";
  states: readonly DecisionPriorityState[];
  lifecycle: readonly DecisionPriorityLifecycleState[];
  factors: readonly DecisionPriorityFactorName[];
  scoring_profile: DecisionPriorityScoringProfile;
  priority: DecisionPriority;
  explanation: DecisionPriorityExplanation;
  validation: DecisionPriorityValidationResult;
  replay: DecisionPriorityReplayResult;
}>;

export type DecisionPriorityObservability = Readonly<{
  priority_objects_created: number;
  validation_failures: number;
  replay_failures: number;
  governance_failures: number;
  constitutional_failures: number;
  integrity_failures: number;
  tenant_isolation_failures: number;
  average_priority_score: number;
  state_distribution: Readonly<Record<DecisionPriorityState, number>>;
}>;
