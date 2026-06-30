import type { GovernanceAssurancePackage } from "@/types/governance-assurance-engine";
import type { RuntimeAssurancePackage } from "@/types/runtime-assurance-engine";

export type RecoveryInterventionState =
  | "INITIALIZING"
  | "COLLECTING_EVIDENCE"
  | "ANALYZING_FAILURE"
  | "EVALUATING_OPTIONS"
  | "ESTIMATING_CONFIDENCE"
  | "PRIORITIZING_INTERVENTION"
  | "GENERATING_RECOMMENDATION"
  | "AWAITING_GOVERNANCE"
  | "CONTINUE"
  | "RETRY"
  | "PAUSE"
  | "ROLLBACK"
  | "ALTERNATE_PLAN"
  | "ESCALATE"
  | "TERMINATE"
  | "CLOSED";

export type RecoveryRecommendedAction = "CONTINUE" | "RETRY" | "PAUSE" | "ROLLBACK" | "ALTERNATE_PLAN" | "ESCALATE" | "TERMINATE";

export type RecoveryConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type RollbackConfidenceLevel = "CERTAIN" | "HIGH" | "MODERATE" | "LOW" | "UNSAFE";

export type InterventionPriority = "P1_CRITICAL" | "P2_HIGH" | "P3_MEDIUM" | "P4_LOW" | "P5_INFORMATIONAL";

export type RecoveryInterventionScenario =
  | "BASELINE"
  | "TRANSIENT_FAILURE"
  | "MISSING_APPROVAL"
  | "DEPENDENCY_UNAVAILABLE"
  | "CHECKPOINT_AVAILABLE"
  | "CHECKPOINT_CORRUPTED"
  | "ALTERNATE_PLAN_AVAILABLE"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_AMBIGUITY"
  | "EXECUTION_DEADLOCK"
  | "CONFIDENCE_COLLAPSE"
  | "UNRECOVERABLE_CORRUPTION"
  | "REPLAY_IMPOSSIBLE"
  | "INSUFFICIENT_EVIDENCE"
  | "HASH_MISMATCH";

export type RecoveryInterventionFailureReason =
  | "TRANSIENT_FAILURE_DETECTED"
  | "APPROVAL_PENDING"
  | "DEPENDENCY_UNAVAILABLE"
  | "CHECKPOINT_AVAILABLE"
  | "CHECKPOINT_CORRUPTED"
  | "ALTERNATE_PLAN_AVAILABLE"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_AMBIGUITY"
  | "EXECUTION_DEADLOCK"
  | "CONFIDENCE_COLLAPSE"
  | "UNRECOVERABLE_CORRUPTION"
  | "REPLAY_IMPOSSIBLE"
  | "INSUFFICIENT_EVIDENCE"
  | "RUNTIME_ASSURANCE_FAILED"
  | "GOVERNANCE_ASSURANCE_FAILED"
  | "TENANT_ISOLATION_VIOLATION"
  | "ASSURANCE_NOT_ADVISORY"
  | "INTEGRITY_HASH_MISMATCH";

export type RecoveryOptionAssessment = Readonly<{
  option_id: string;
  action: RecoveryRecommendedAction;
  eligible: boolean;
  confidence_score: number;
  rejection_reasons: readonly RecoveryInterventionFailureReason[];
  required_approvals: readonly string[];
  expected_outcome: string;
  assessment_hash: string;
}>;

export type RecoveryConfidenceAssessment = Readonly<{
  assessment_id: string;
  recovery_score: number;
  recovery_confidence: RecoveryConfidenceLevel;
  rollback_score: number;
  rollback_confidence: RollbackConfidenceLevel;
  confidence_factors: readonly string[];
  assessment_hash: string;
}>;

export type InterventionPriorityAssessment = Readonly<{
  priority_id: string;
  intervention_priority: InterventionPriority;
  priority_score: number;
  urgency_reason: string;
  priority_factors: readonly string[];
  priority_hash: string;
}>;

export type RecoveryExplainability = Readonly<{
  explainability_id: string;
  selected_reason: string;
  rejected_options: readonly string[];
  runtime_conditions: readonly string[];
  governance_rules: readonly string[];
  constitutional_principles: readonly string[];
  authority_validations: readonly string[];
  supporting_evidence: readonly string[];
  expected_consequences: readonly string[];
  explainability_hash: string;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  runtime_state: string;
  governance_state: string;
  recommended_action: RecoveryRecommendedAction;
  recommendation_reason: string;
  recovery_confidence: RecoveryConfidenceLevel;
  rollback_confidence: RollbackConfidenceLevel;
  intervention_priority: InterventionPriority;
  alternative_options: readonly RecoveryOptionAssessment[];
  expected_outcome: string;
  operator_required: boolean;
  required_approvals: readonly string[];
  risk_assessment: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence_summary: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  integrity_hash: string;
  created_at: string;
}>;

export type RecoveryInterventionValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly RecoveryInterventionFailureReason[];
  runtime_evidence_valid: boolean;
  governance_evidence_valid: boolean;
  recommendation_deterministic: boolean;
  operator_supremacy_preserved: boolean;
  advisory_only: boolean;
  tenant_isolated: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  ready_for_certification: boolean;
  validation_hash: string;
}>;

export type RecoveryInterventionReplayResult = Readonly<{
  replay_id: string;
  package_id: string;
  reconstructed_pipeline: readonly RecoveryInterventionState[];
  reconstructed_action: RecoveryRecommendedAction;
  reconstructed_priority: InterventionPriority;
  reconstructed_failures: readonly RecoveryInterventionFailureReason[];
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  replay_hash: string;
}>;

export type RecoveryInterventionPackage = Readonly<{
  package_id: string;
  engine_version: "recovery-intervention-intelligence/v8E.4";
  source_runtime_package: RuntimeAssurancePackage;
  source_governance_package: GovernanceAssurancePackage;
  pipeline_state: RecoveryInterventionState;
  option_assessments: readonly RecoveryOptionAssessment[];
  confidence_assessment: RecoveryConfidenceAssessment;
  priority_assessment: InterventionPriorityAssessment;
  recommendation: RecoveryRecommendation;
  explainability: RecoveryExplainability;
  validation: RecoveryInterventionValidationResult;
  replay: RecoveryInterventionReplayResult;
  advisory_only: true;
  recovery_executed: false;
  workflow_modified: false;
  approval_granted: false;
  authority_modified: false;
  governance_bypassed: false;
  package_hash: string;
}>;

export type RecoveryInterventionDashboardSurface = Readonly<{
  package_id: string;
  execution_id: string;
  pipeline_state: RecoveryInterventionState;
  recommended_action: RecoveryRecommendedAction;
  intervention_priority: InterventionPriority;
  recovery_confidence: RecoveryConfidenceLevel;
  rollback_confidence: RollbackConfidenceLevel;
  operator_required: boolean;
  validation_state: "PASS" | "FAIL";
  integrity_status: "VALID" | "INVALID";
}>;

export type RecoveryInterventionFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "recovery-intervention-intelligence/v8E.4";
    states: readonly RecoveryInterventionState[];
    actions: readonly RecoveryRecommendedAction[];
    priorities: readonly InterventionPriority[];
  }>;
  package: RecoveryInterventionPackage;
  dashboard: RecoveryInterventionDashboardSurface;
}>;
