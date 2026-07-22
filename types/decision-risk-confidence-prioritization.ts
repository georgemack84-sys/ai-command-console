import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority } from "@/types/decision-priority-contract";

export type RiskPriorityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "MINIMAL";
export type RiskProbabilityLevel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "MINIMAL";
export type ConfidencePriorityLevel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW";
export type PriorityRestrictionStatus = "NONE" | "REVIEW_REQUIRED" | "RESTRICTED" | "BLOCKED";
export type RiskEscalationStatus = "NONE" | "GOVERNANCE_REVIEW" | "OPERATOR_REVIEW" | "IMMEDIATE_GOVERNANCE_REVIEW";

export type RiskConfidenceFailureReason =
  | "RISK_DATA_INCOMPLETE"
  | "EVIDENCE_REFERENCES_MISSING"
  | "CONFIDENCE_INPUTS_INVALID"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "ASSESSMENT_REPLAY_MISMATCH"
  | "HIDDEN_PRIORITIZATION_DETECTED";

export type RiskConfidencePrioritizationInput = Readonly<{
  candidate?: DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  operational_risk?: number;
  mission_risk?: number;
  governance_risk?: number;
  constitutional_risk?: number;
  execution_risk?: number;
  recovery_risk?: number;
  dependency_risk?: number;
  cascading_failure_potential?: number;
  probability_inputs?: readonly number[];
  impact_inputs?: readonly number[];
  confidence_inputs?: readonly number[];
  reliability_inputs?: readonly number[];
  uncertainty_inputs?: readonly number[];
  degradation_inputs?: readonly number[];
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  constitutional_refs?: readonly string[];
  replay_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  hidden_prioritization_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type RiskPriorityAssessment = Readonly<{
  assessment_id: string;
  decision_candidate_id: string;
  risk_severity_score: number;
  probability_score: number;
  impact_score: number;
  composite_risk_score: number;
  risk_level: RiskPriorityLevel;
  escalation_required: boolean;
  escalation_status: RiskEscalationStatus;
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type ConfidenceAssessment = Readonly<{
  confidence_id: string;
  decision_candidate_id: string;
  confidence_score: number;
  reliability_score: number;
  uncertainty_score: number;
  degradation_score: number;
  confidence_level: ConfidencePriorityLevel;
  restriction_status: PriorityRestrictionStatus;
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type RiskConfidenceExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  risk_rationale: string;
  probability_rationale: string;
  impact_rationale: string;
  confidence_rationale: string;
  evidence_reliability_rationale: string;
  uncertainty_rationale: string;
  degradation_rationale: string;
  escalation_rationale: string;
  priority_adjustment_rationale: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskConfidenceLedgerRecord = Readonly<{
  ledger_entry_id: string;
  decision_candidate_id: string;
  risk_assessment_ref: string;
  confidence_assessment_ref: string;
  risk_score: number;
  confidence_score: number;
  priority_adjustment: number;
  restriction_status: PriorityRestrictionStatus;
  escalation_status: RiskEscalationStatus;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type RiskConfidenceReplayRecord = Readonly<{
  replay_id: string;
  decision_candidate_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  risk_score: number;
  confidence_score: number;
  replay_valid: boolean;
  failures: readonly RiskConfidenceFailureReason[];
  integrity_hash: string;
}>;

export type RiskConfidencePrioritizationResult = Readonly<{
  prioritization_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly RiskConfidenceFailureReason[];
  risk_assessment: RiskPriorityAssessment;
  confidence_assessment: ConfidenceAssessment;
  explanation: RiskConfidenceExplanation;
  ledger_record: RiskConfidenceLedgerRecord;
  replay_record: RiskConfidenceReplayRecord;
  priority_input: DecisionPriority;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskConfidenceObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  replay_failures: number;
  governance_failures: number;
  tenant_failures: number;
  average_risk_score: number;
  average_confidence_score: number;
  risk_distribution: Readonly<Record<RiskPriorityLevel, number>>;
  confidence_distribution: Readonly<Record<ConfidencePriorityLevel, number>>;
}>;
