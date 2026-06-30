import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { ObjectiveHierarchyPackage } from "@/types/objective-decomposition";
import type { OptimizedPlanPackage } from "@/types/planning-optimization";
import type { AlternativePlanningPackage } from "@/types/alternative-planning";
import type { ContingencyPlanningPackage } from "@/types/contingency-planning";

export type PlanningConfidenceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PlanningConfidenceClassification = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type PlanningStateMachineState =
  | "RECEIVED"
  | "ANALYZING"
  | "DECOMPOSING"
  | "DEPENDENCY_ANALYSIS"
  | "OPTIMIZING"
  | "GENERATING_ALTERNATIVES"
  | "BUILDING_CONTINGENCIES"
  | "CONFIDENCE_ESTIMATION"
  | "GOVERNANCE_VALIDATION"
  | "READY"
  | "REJECTED";

export type ConfidenceFactorName =
  | "OBJECTIVE_CLARITY"
  | "DEPENDENCY_COMPLETENESS"
  | "POLICY_CERTAINTY"
  | "AUTHORITY_CERTAINTY"
  | "HISTORICAL_SUCCESS"
  | "REPLAY_CONSISTENCY"
  | "RESOURCE_AVAILABILITY"
  | "RISK_LEVEL";

export type PlanningConfidenceScenario =
  | "BASELINE"
  | "INCOMPLETE_PLANNING_PACKAGE"
  | "UNCERTIFIED_PLAN"
  | "MISSING_REPLAY_METADATA"
  | "INCONSISTENT_LINEAGE"
  | "INVALID_GOVERNANCE_STATE"
  | "AMBIGUOUS_OBJECTIVE"
  | "INVALID_DEPENDENCY_GRAPH"
  | "GOVERNANCE_FAILURE"
  | "AUTHORITY_UNCERTAIN"
  | "LIMITED_HISTORY"
  | "REPLAY_MISMATCH"
  | "RESOURCE_UNAVAILABLE"
  | "HIGH_RISK"
  | "TENANT_VIOLATION"
  | "ASSUMPTIONS_UNSUPPORTED"
  | "HIDDEN_PLAN"
  | "SELF_AUTHORIZATION"
  | "CONDITIONAL_REPORTING_GAP";

export type PlanningConfidenceFailureReason =
  | "INCOMPLETE_PLANNING_PACKAGE"
  | "UNCERTIFIED_PLAN"
  | "MISSING_REPLAY_METADATA"
  | "INCONSISTENT_LINEAGE"
  | "INVALID_GOVERNANCE_STATE"
  | "OBJECTIVE_INCOMPLETE"
  | "AMBIGUOUS_OBJECTIVE"
  | "DEPENDENCY_GRAPH_INVALID"
  | "DEPENDENCY_CYCLE"
  | "UNRESOLVED_BLOCKERS"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "POLICY_CONFLICT"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_UNCERTAIN"
  | "AUTHORITY_ESCALATION"
  | "INCOMPLETE_APPROVALS"
  | "LIMITED_HISTORICAL_EVIDENCE"
  | "REPLAY_INCONSISTENCY"
  | "MISSING_EVIDENCE"
  | "BROKEN_LINEAGE"
  | "RESOURCE_UNAVAILABLE"
  | "MISSING_RECOVERY_CAPACITY"
  | "RISK_ABOVE_THRESHOLD"
  | "ASSUMPTIONS_UNSUPPORTED"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_PLAN"
  | "SELF_AUTHORIZATION"
  | "CONFIDENCE_BELOW_MINIMUM"
  | "RATIONALE_INCOMPLETE"
  | "REPORTING_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type ConfidenceFactorScore = Readonly<{
  factor_name: ConfidenceFactorName;
  score: number;
  classification: PlanningConfidenceClassification;
  rationale: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  reductions: readonly PlanningConfidenceFailureReason[];
}>;

export type PlanningConfidenceIntake = Readonly<{
  confidence_intake_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  objective_hierarchy: ObjectiveHierarchyPackage;
  dependency_graph: DependencyGraphPackage;
  optimized_plan: OptimizedPlanPackage;
  alternative_package: AlternativePlanningPackage;
  contingency_package: ContingencyPlanningPackage;
  governance_constraints: readonly string[];
  authority_requirements: readonly string[];
  assumptions: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  intake_failures: readonly PlanningConfidenceFailureReason[];
  intake_hash: string;
}>;

export type PlanningConfidenceAssessment = Readonly<{
  confidence_assessment_id: string;
  plan_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  classification: PlanningConfidenceClassification;
  overall_score: number;
  factor_scores: readonly ConfidenceFactorScore[];
  rationale: string;
  confidence_increasers: readonly string[];
  confidence_reducers: readonly PlanningConfidenceFailureReason[];
  governance_justification: string;
  readiness_assessment: "READY_FOR_GOVERNANCE_REVIEW" | "OPERATOR_REVIEW_RECOMMENDED" | "BLOCKED_PENDING_REVIEW" | "REJECTED";
  planning_state: PlanningStateMachineState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  risk_score: number;
  advisory_only: true;
  execution_authorized: false;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type PlanningConfidenceValidationResult = Readonly<{
  validation_id: string;
  confidence_assessment_id: string;
  certification_state: PlanningConfidenceCertificationState;
  failures: readonly PlanningConfidenceFailureReason[];
  all_factors_evaluated: boolean;
  confidence_rationale_complete: boolean;
  governance_validated: boolean;
  authority_verified: boolean;
  replay_deterministic: boolean;
  evidence_complete: boolean;
  tenant_isolation_preserved: boolean;
  advisory_only_enforced: boolean;
  ready_for_execution_orchestration_review: boolean;
  validation_hash: string;
}>;

export type PlanningConfidenceReplayResult = Readonly<{
  replay_id: string;
  confidence_assessment_id: string;
  replay_factor_order: readonly ConfidenceFactorName[];
  replay_evidence_refs: readonly string[];
  validation_state: PlanningConfidenceCertificationState;
  failure_reason: PlanningConfidenceFailureReason | null;
  replay_hash: string;
}>;

export type PlanningConfidenceVisibilitySurface = Readonly<{
  confidence_assessment_id: string;
  certification_state: PlanningConfidenceCertificationState;
  classification: PlanningConfidenceClassification;
  overall_score: number;
  factor_scores: readonly ConfidenceFactorScore[];
  readiness_assessment: PlanningConfidenceAssessment["readiness_assessment"];
  failure_reasons: readonly PlanningConfidenceFailureReason[];
  advisory_only: true;
  execution_authorized: false;
  integrity_status: "VALID" | "INVALID";
}>;

export type PlanningConfidenceFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  intake: PlanningConfidenceIntake;
  assessment: PlanningConfidenceAssessment;
  validation: PlanningConfidenceValidationResult;
  replay: PlanningConfidenceReplayResult;
  visibility: PlanningConfidenceVisibilitySurface;
}>;
