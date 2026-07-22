import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionPriority } from "@/types/decision-priority-contract";

export type OperationalImpactLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";
export type ForecastImpactCategory = "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "CRITICAL_NEGATIVE";
export type ResilienceLevel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "CRITICAL";

export type OperationalImpactFailureReason =
  | "RUNTIME_CONTEXT_INCOMPLETE"
  | "RECOVERY_INFORMATION_UNAVAILABLE"
  | "FORECAST_REFERENCES_MISSING"
  | "CONTINUITY_ANALYSIS_INCOMPLETE"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_OPERATIONAL_DATA_DETECTED"
  | "OPERATIONAL_REPLAY_MISMATCH"
  | "HIDDEN_OPERATIONAL_WEIGHTING_DETECTED"
  | "FORECAST_NONDETERMINISM_DETECTED";

export type OperationalImpactAssessmentInput = Readonly<{
  candidate?: DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  runtime_health_score?: number;
  execution_latency_score?: number;
  runtime_degradation_score?: number;
  recovery_readiness_score?: number;
  rollback_availability_score?: number;
  recovery_complexity_score?: number;
  forecast_success_score?: number;
  future_risk_score?: number;
  future_confidence_score?: number;
  execution_stability_score?: number;
  continuity_score?: number;
  resilience_score?: number;
  downstream_consequence_score?: number;
  affected_components?: readonly string[];
  runtime_refs?: readonly string[];
  recovery_refs?: readonly string[];
  forecast_refs?: readonly string[];
  continuity_refs?: readonly string[];
  resilience_refs?: readonly string[];
  downstream_refs?: readonly string[];
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  replay_refs?: readonly string[];
  hidden_weighting_refs?: readonly string[];
  nondeterministic_forecast_refs?: readonly string[];
  expected_replay_hash?: string;
}>;

export type RuntimeImpactAssessment = Readonly<{
  runtime_assessment_id: string;
  decision_candidate_id: string;
  runtime_health_score: number;
  execution_latency_score: number;
  stability_score: number;
  runtime_impact_score: number;
  runtime_classification: OperationalImpactLevel;
  explanation_ref: string;
  runtime_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type OperationalImpactAssessment = Readonly<{
  assessment_id: string;
  decision_candidate_id: string;
  runtime_score: number;
  recovery_score: number;
  forecast_score: number;
  execution_stability_score: number;
  continuity_score: number;
  resilience_score: number;
  downstream_consequence_score: number;
  composite_operational_score: number;
  operational_classification: OperationalImpactLevel;
  forecast_category: ForecastImpactCategory;
  resilience_level: ResilienceLevel;
  explanation_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  assessment_timestamp: string;
  integrity_hash: string;
}>;

export type OperationalImpactExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  runtime_rationale: string;
  recovery_rationale: string;
  forecast_rationale: string;
  stability_rationale: string;
  continuity_rationale: string;
  resilience_rationale: string;
  downstream_rationale: string;
  priority_adjustment_rationale: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalImpactLedgerRecord = Readonly<{
  ledger_entry_id: string;
  decision_candidate_id: string;
  operational_assessment_ref: string;
  runtime_assessment_ref: string;
  runtime_score: number;
  recovery_score: number;
  forecast_score: number;
  composite_operational_score: number;
  priority_adjustment: number;
  affected_components: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type OperationalImpactReplayRecord = Readonly<{
  replay_id: string;
  decision_candidate_id: string;
  expected_hash: string;
  reconstructed_hash: string;
  runtime_score: number;
  recovery_score: number;
  forecast_score: number;
  replay_valid: boolean;
  failures: readonly OperationalImpactFailureReason[];
  integrity_hash: string;
}>;

export type OperationalImpactAssessmentResult = Readonly<{
  assessment_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  failures: readonly OperationalImpactFailureReason[];
  operational_assessment: OperationalImpactAssessment;
  runtime_assessment: RuntimeImpactAssessment;
  explanation: OperationalImpactExplanation;
  ledger_record: OperationalImpactLedgerRecord;
  replay_record: OperationalImpactReplayRecord;
  priority_input: DecisionPriority;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperationalImpactObservability = Readonly<{
  evaluations: number;
  pass_count: number;
  fail_count: number;
  replay_failures: number;
  runtime_failures: number;
  forecast_failures: number;
  tenant_failures: number;
  average_operational_score: number;
  average_runtime_score: number;
  average_recovery_score: number;
  average_forecast_score: number;
  operational_distribution: Readonly<Record<OperationalImpactLevel, number>>;
  forecast_distribution: Readonly<Record<ForecastImpactCategory, number>>;
}>;
