import type { DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationDiscoveryCategory } from "@/types/optimization-opportunity-discovery";

export type OptimizationRecommendationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type OptimizationRecommendationStatus = "GENERATED" | "SCORED" | "EXPLAINED" | "IMPLEMENTATION_READY" | "OPERATOR_REVIEW" | "APPROVED" | "IMPLEMENTED" | "REJECTED" | "VERIFIED";
export type OptimizationRecommendationDecision = "RECOMMEND" | "REVIEW" | "DEFER" | "REJECT";
export type OptimizationRecommendationScenario = "BASELINE" | "MISSING_VALIDATION_LEDGER" | "VALIDATION_LEDGER_REJECTED" | "UNVALIDATED_OPPORTUNITY" | "HIDDEN_RECOMMENDATION" | "SCORE_MANIPULATION" | "MISSING_EXPLAINABILITY" | "MISSING_IMPLEMENTATION_PLAN" | "MISSING_ROLLBACK_STRATEGY" | "AUTHORITY_ESCALATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "TENANT_LEAKAGE" | "AUTOMATIC_IMPLEMENTATION_ATTEMPT" | "APPROVAL_BYPASS_ATTEMPT" | "MUTABLE_LEDGER_HISTORY" | "INTEGRITY_FAILURE";
export type OptimizationRecommendationFailure = "VALIDATION_LEDGER_MISSING" | "VALIDATION_LEDGER_REJECTED" | "UNVALIDATED_OPPORTUNITY_DETECTED" | "HIDDEN_RECOMMENDATION_DETECTED" | "SCORE_MANIPULATION_DETECTED" | "EXPLAINABILITY_MISSING" | "IMPLEMENTATION_PLAN_MISSING" | "ROLLBACK_STRATEGY_MISSING" | "AUTHORITY_ESCALATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_BYPASS_DETECTED" | "TENANT_LEAKAGE_DETECTED" | "AUTOMATIC_IMPLEMENTATION_ATTEMPTED" | "APPROVAL_BYPASS_ATTEMPTED" | "MUTABLE_LEDGER_HISTORY_DETECTED" | "INTEGRITY_VERIFICATION_FAILED";

export type OptimizationRecommendationRecord = Readonly<{
  recommendation_id: string;
  opportunity_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  subsystem: string;
  recommendation_title: string;
  recommendation_summary: string;
  optimization_category: OptimizationDiscoveryCategory;
  priority_level: OptimizationRecommendationPriority;
  recommendation_status: OptimizationRecommendationStatus;
  decision_state: OptimizationRecommendationDecision;
  operator_required: true;
  advisory_only: true;
  implementation_authority: false;
  approval_authority: false;
  automatic_implementation: boolean;
  operator_approval_required: true;
  timestamp: string;
  integrity_hash: string;
}>;

export type OptimizationScoreRecord = Readonly<{
  score_id: string;
  recommendation_id: string;
  efficiency_score: number;
  latency_score: number;
  resource_score: number;
  scalability_score: number;
  implementation_score: number;
  deterministic_score: number;
  replay_score: number;
  governance_score: number;
  constitutional_score: number;
  authority_score: number;
  confidence_score: number;
  overall_score: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type OptimizationExplainabilityReport = Readonly<{
  report_id: string;
  recommendation_id: string;
  optimization_reason: string;
  evidence_summary: string;
  validation_summary: string;
  projected_benefits: string;
  implementation_rationale: string;
  deterministic_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  confidence_score: number;
  integrity_hash: string;
  timestamp: string;
}>;

export type OptimizationImplementationPlan = Readonly<{
  implementation_plan_id: string;
  recommendation_id: string;
  implementation_steps: readonly string[];
  subsystem_dependencies: readonly string[];
  deployment_sequence: readonly string[];
  validation_checkpoints: readonly string[];
  expected_duration: string;
  implementation_risk: number;
  operator_actions: readonly string[];
  verification_requirements: readonly string[];
  implementation_action_executed: false;
  timestamp: string;
  integrity_hash: string;
}>;

export type OptimizationRollbackStrategy = Readonly<{
  rollback_strategy_id: string;
  recommendation_id: string;
  rollback_conditions: readonly string[];
  rollback_steps: readonly string[];
  recovery_plan: readonly string[];
  verification_steps: readonly string[];
  replay_validation: "REQUIRED";
  integrity_validation: "REQUIRED";
  operator_notification: "REQUIRED";
  timestamp: string;
  integrity_hash: string;
}>;

export type OptimizationRecommendationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  recommendation_id: string;
  recommendation_version: string;
  approval_status: "PENDING_OPERATOR_REVIEW" | "BYPASSED";
  implementation_status: "NOT_IMPLEMENTED" | "IMPLEMENTED";
  replay_reference: string;
  lineage_reference: string;
  immutable: boolean;
  integrity_hash: string;
  created_timestamp: string;
  updated_timestamp: string;
}>;

export type OptimizationRecommendationLedger = Readonly<{
  ledger_id: string;
  final_state: "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW" | "OPTIMIZATION_RECOMMENDATIONS_BLOCKED";
  source_validation_ledger_id: string | null;
  recommendations: readonly OptimizationRecommendationRecord[];
  scores: readonly OptimizationScoreRecord[];
  explainability_reports: readonly OptimizationExplainabilityReport[];
  implementation_plans: readonly OptimizationImplementationPlan[];
  rollback_strategies: readonly OptimizationRollbackStrategy[];
  ledger_entries: readonly OptimizationRecommendationLedgerEntry[];
  failures: readonly OptimizationRecommendationFailure[];
  advisory_only: true;
  implementation_authority: false;
  approval_authority: false;
  automatic_implementation: false;
  operator_approval_required: true;
  integrity_hash: string;
}>;

export type OptimizationRecommendationValidationResult = Readonly<{
  ledger_id: string;
  valid: boolean;
  validation_ledger_ready: boolean;
  every_validated_opportunity_recommended: boolean;
  scores_reproducible: boolean;
  explainability_complete: boolean;
  implementation_plans_complete: boolean;
  rollback_strategies_complete: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  immutable_history: boolean;
  advisory_only: true;
  implementation_authority_absent: boolean;
  approval_authority_absent: boolean;
  automatic_implementation_absent: boolean;
  operator_approval_required: true;
  ready_for_certification_gate: boolean;
  fail_closed: boolean;
  failures: readonly OptimizationRecommendationFailure[];
  validation_hash: string;
}>;

export type OptimizationRecommendationObservabilitySurface = Readonly<{
  ledger_id: string;
  final_state: string;
  recommendation_count: number;
  recommend_count: number;
  review_count: number;
  defer_count: number;
  reject_count: number;
  failure_count: number;
  advisory_only: true;
  implementation_authority: false;
  approval_authority: false;
  integrity_hash: string;
}>;

export type OptimizationRecommendationInput = Readonly<{ scenario?: OptimizationRecommendationScenario; validation_ledger?: DeterministicOptimizationValidationLedger | null; ledger?: OptimizationRecommendationLedger }>;

export type OptimizationRecommendationEngineBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "optimization-recommendation-engine/v8ALT.8.4";
    final_state: "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW";
    statuses: readonly OptimizationRecommendationStatus[];
    decisions: readonly OptimizationRecommendationDecision[];
    priorities: readonly OptimizationRecommendationPriority[];
    principles: readonly string[];
  }>;
  ledger: OptimizationRecommendationLedger;
  validation: OptimizationRecommendationValidationResult;
  observability: OptimizationRecommendationObservabilitySurface;
}>;
