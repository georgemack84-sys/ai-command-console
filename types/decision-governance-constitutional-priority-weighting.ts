import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority } from "@/types/decision-priority-contract";

export type GovernancePriorityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";
export type ConstitutionalSeverityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";
export type AuthorityConflictType = "NONE" | "OPERATOR_BOUNDARY" | "GOVERNANCE_BOUNDARY" | "DELEGATED_AUTHORITY" | "UNAUTHORIZED_AUTHORITY";
export type GovernanceEscalationStatus = "NONE" | "GOVERNANCE_REVIEW" | "OPERATOR_REVIEW" | "IMMEDIATE_GOVERNANCE_REVIEW";

export type GovernanceConstitutionalFailureReason =
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "AUTHORITY_METADATA_INCOMPLETE"
  | "CERTIFICATION_STATUS_UNVERIFIED"
  | "COMPLIANCE_INPUTS_INVALID"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_GOVERNANCE_DATA_DETECTED"
  | "GOVERNANCE_REPLAY_MISMATCH"
  | "HIDDEN_GOVERNANCE_WEIGHTING_DETECTED";

export type GovernanceConstitutionalPriorityInput = Readonly<{
  candidate?: DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  governance_weight?: number;
  constitutional_severity?: number;
  policy_violation_score?: number;
  authority_conflict_score?: number;
  certification_blocker_score?: number;
  compliance_score?: number;
  regulatory_exposure_score?: number;
  governance_uncertainty_score?: number;
  certification_verified?: boolean;
  authority_metadata_complete?: boolean;
  authority_conflict_type?: AuthorityConflictType;
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  constitutional_refs?: readonly string[];
  authority_refs?: readonly string[];
  certification_refs?: readonly string[];
  compliance_refs?: readonly string[];
  regulatory_refs?: readonly string[];
  replay_refs?: readonly string[];
  hidden_weighting_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type GovernancePriorityAssessment = Readonly<{
  assessment_id: string;
  decision_candidate_id: string;
  governance_weight_score: number;
  constitutional_severity_score: number;
  policy_violation_score: number;
  compliance_score: number;
  regulatory_exposure_score: number;
  certification_blocker_score: number;
  escalation_weight_score: number;
  composite_governance_score: number;
  governance_priority_level: GovernancePriorityLevel;
  constitutional_severity_level: ConstitutionalSeverityLevel;
  escalation_required: boolean;
  escalation_status: GovernanceEscalationStatus;
  explanation_ref: string;
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type AuthorityConflictAssessment = Readonly<{
  conflict_id: string;
  decision_candidate_id: string;
  authority_conflict_score: number;
  conflict_type: AuthorityConflictType;
  operator_review_required: boolean;
  governance_escalation_required: boolean;
  explanation_ref: string;
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type GovernancePriorityExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  governance_rationale: string;
  constitutional_rationale: string;
  policy_rationale: string;
  authority_rationale: string;
  certification_rationale: string;
  compliance_rationale: string;
  regulatory_rationale: string;
  escalation_rationale: string;
  priority_adjustment_rationale: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernancePriorityLedgerRecord = Readonly<{
  ledger_entry_id: string;
  decision_candidate_id: string;
  governance_assessment_ref: string;
  authority_assessment_ref: string;
  governance_score: number;
  operator_score: number;
  priority_adjustment: number;
  escalation_status: GovernanceEscalationStatus;
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type GovernancePriorityReplayRecord = Readonly<{
  replay_id: string;
  decision_candidate_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  governance_score: number;
  operator_score: number;
  replay_valid: boolean;
  failures: readonly GovernanceConstitutionalFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceConstitutionalPriorityResult = Readonly<{
  prioritization_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly GovernanceConstitutionalFailureReason[];
  governance_assessment: GovernancePriorityAssessment;
  authority_assessment: AuthorityConflictAssessment;
  explanation: GovernancePriorityExplanation;
  ledger_record: GovernancePriorityLedgerRecord;
  replay_record: GovernancePriorityReplayRecord;
  priority_input: DecisionPriority;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceConstitutionalPriorityObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  replay_failures: number;
  governance_failures: number;
  constitutional_failures: number;
  tenant_failures: number;
  operator_review_required: number;
  escalation_distribution: Readonly<Record<GovernanceEscalationStatus, number>>;
  governance_distribution: Readonly<Record<GovernancePriorityLevel, number>>;
  average_governance_score: number;
  average_operator_score: number;
}>;
