import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority } from "@/types/decision-priority-contract";

export type MissionCriticalityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "MINIMAL";
export type UrgencyClassification = "IMMEDIATE" | "VERY_HIGH" | "HIGH" | "NORMAL" | "LOW";
export type ExecutionWindowState = "OPEN" | "LIMITED" | "CLOSING" | "MISSED" | "BLOCKED";

export type MissionUrgencyFailureReason =
  | "MISSION_OBJECTIVES_MISSING"
  | "INVALID_DEADLINE"
  | "CRITICAL_PATH_REFERENCES_INCOMPLETE"
  | "TIMING_DATA_INCONSISTENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HIDDEN_SCORING_DETECTED";

export type MissionUrgencyScoringInput = Readonly<{
  candidate?: DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  mission_objective_refs?: readonly string[];
  strategic_priority?: number;
  business_impact?: number;
  safety_impact?: number;
  continuity_impact?: number;
  milestone_refs?: readonly string[];
  milestone_proximity_minutes?: number;
  milestone_blocked?: boolean;
  dependency_refs?: readonly string[];
  critical_path_refs?: readonly string[];
  downstream_blocking_count?: number;
  deadline_refs?: readonly string[];
  minutes_until_deadline?: number;
  delay_tolerance_minutes?: number;
  delay_penalty_inputs?: readonly string[];
  execution_window_state?: ExecutionWindowState;
  event_refs?: readonly string[];
  emergency_event_detected?: boolean;
  governance_refs?: readonly string[];
  constitutional_refs?: readonly string[];
  replay_refs?: readonly string[];
  evidence_refs?: readonly string[];
  hidden_scoring_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type MissionCriticalityAssessment = Readonly<{
  assessment_id: string;
  decision_candidate_id: string;
  mission_objective_refs: readonly string[];
  criticality_level: MissionCriticalityLevel;
  mission_score: number;
  milestone_refs: readonly string[];
  dependency_refs: readonly string[];
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type UrgencyAssessment = Readonly<{
  urgency_id: string;
  decision_candidate_id: string;
  urgency_score: number;
  urgency_classification: UrgencyClassification;
  deadline_refs: readonly string[];
  execution_window_state: ExecutionWindowState;
  delay_penalty_score: number;
  critical_path_refs: readonly string[];
  event_refs: readonly string[];
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type MissionUrgencyExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  mission_rationale: string;
  urgency_rationale: string;
  milestone_rationale: string;
  critical_path_rationale: string;
  delay_penalty_rationale: string;
  execution_window_rationale: string;
  event_rationale: string;
  governance_rationale: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type MissionUrgencyLedgerRecord = Readonly<{
  ledger_entry_id: string;
  decision_candidate_id: string;
  mission_score: number;
  urgency_score: number;
  mission_assessment_ref: string;
  urgency_assessment_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type MissionUrgencyReplayRecord = Readonly<{
  replay_id: string;
  decision_candidate_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  mission_score: number;
  urgency_score: number;
  replay_valid: boolean;
  failures: readonly MissionUrgencyFailureReason[];
  integrity_hash: string;
}>;

export type MissionUrgencyScoringResult = Readonly<{
  scoring_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly MissionUrgencyFailureReason[];
  mission_assessment: MissionCriticalityAssessment;
  urgency_assessment: UrgencyAssessment;
  explanation: MissionUrgencyExplanation;
  ledger_record: MissionUrgencyLedgerRecord;
  replay_record: MissionUrgencyReplayRecord;
  priority_input: DecisionPriority;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MissionUrgencyObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  replay_failures: number;
  governance_failures: number;
  tenant_failures: number;
  average_mission_score: number;
  average_urgency_score: number;
  criticality_distribution: Readonly<Record<MissionCriticalityLevel, number>>;
  urgency_distribution: Readonly<Record<UrgencyClassification, number>>;
}>;
