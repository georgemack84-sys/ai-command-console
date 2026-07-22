import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type TenantIsolationDriftStatus = "PASS" | "DRIFT_DETECTED" | "BLOCKED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type TenantIsolationDriftFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_BOUNDARY_CHANGE"
  | "UNKNOWN_TENANT_OWNERSHIP"
  | "MIXED_TENANT_LINEAGE"
  | "UNAUTHORIZED_TENANT_ACCESS"
  | "INVALID_NAMESPACE_ASSIGNMENT"
  | "AMBIGUOUS_TENANT_OWNERSHIP"
  | "TENANT_CONTAMINATION_DETECTED"
  | "ADAPTATION_LEAKAGE_DETECTED"
  | "SHARED_LEARNING_DETECTED"
  | "UNAUTHORIZED_REUSE_DETECTED"
  | "POLICY_CROSSOVER_DETECTED"
  | "CROSS_TENANT_OPTIMIZATION_DETECTED"
  | "CROSS_TENANT_EVIDENCE_INFLUENCE"
  | "SHARED_RECOMMENDATION_BEHAVIOR"
  | "REPLAY_CONTAMINATION_DETECTED"
  | "SIMULATION_CONTAMINATION_DETECTED"
  | "CONFIGURATION_CROSSOVER_DETECTED"
  | "NAMESPACE_DRIFT_DETECTED"
  | "SHARED_ADAPTATION_DETECTED"
  | "RECOMMENDATION_CONTAMINATION"
  | "INHERITED_OPTIMIZATION_DETECTED"
  | "CROSS_TENANT_PROPOSAL_REUSE"
  | "TRANSFERRED_BEHAVIOR_DETECTED"
  | "RECOMMENDATION_INHERITANCE_DETECTED"
  | "CONFIDENCE_TRANSFER_DETECTED"
  | "RISK_MODEL_SHARING_DETECTED"
  | "HISTORICAL_LEARNING_CONTAMINATION"
  | "GOVERNANCE_CONTAMINATION"
  | "SHARED_APPROVAL_LOGIC"
  | "CROSS_TENANT_GOVERNANCE_INFLUENCE"
  | "OPTIMIZATION_INHERITANCE_DETECTED"
  | "OPTIMIZATION_REUSE_DETECTED"
  | "SHARED_OPTIMIZATION_OBJECTIVES"
  | "SHARED_ADAPTIVE_STATE"
  | "CROSS_TENANT_LINEAGE_CONTAMINATION"
  | "NONDETERMINISTIC_ISOLATION_ASSESSMENT"
  | "NONREPLAYABLE_ISOLATION_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_TENANT_BEHAVIOR";

export type TenantIsolationDriftScenario =
  | "BASELINE"
  | "UNAUTHORIZED_BOUNDARY_CHANGE"
  | "UNKNOWN_TENANT_OWNERSHIP"
  | "MIXED_TENANT_LINEAGE"
  | "UNAUTHORIZED_TENANT_ACCESS"
  | "INVALID_NAMESPACE"
  | "AMBIGUOUS_OWNERSHIP"
  | "TENANT_CONTAMINATION"
  | "ADAPTATION_LEAKAGE"
  | "SHARED_LEARNING"
  | "UNAUTHORIZED_REUSE"
  | "POLICY_CROSSOVER"
  | "CROSS_TENANT_OPTIMIZATION"
  | "EVIDENCE_INFLUENCE"
  | "SHARED_RECOMMENDATION"
  | "REPLAY_CONTAMINATION"
  | "SIMULATION_CONTAMINATION"
  | "CONFIGURATION_CROSSOVER"
  | "NAMESPACE_DRIFT"
  | "SHARED_ADAPTATION"
  | "RECOMMENDATION_CONTAMINATION"
  | "INHERITED_OPTIMIZATION"
  | "PROPOSAL_REUSE"
  | "TRANSFERRED_BEHAVIOR"
  | "RECOMMENDATION_INHERITANCE"
  | "CONFIDENCE_TRANSFER"
  | "RISK_MODEL_SHARING"
  | "HISTORICAL_LEARNING_CONTAMINATION"
  | "GOVERNANCE_CONTAMINATION"
  | "SHARED_APPROVAL_LOGIC"
  | "GOVERNANCE_INFLUENCE"
  | "OPTIMIZATION_INHERITANCE"
  | "OPTIMIZATION_REUSE"
  | "SHARED_OPTIMIZATION_OBJECTIVES"
  | "SHARED_ADAPTIVE_STATE"
  | "LINEAGE_CONTAMINATION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type TenantIsolationBaseline = Readonly<{
  baseline_id: string;
  tenant_model_version: string;
  tenant_namespace: string;
  isolation_policies: readonly string[];
  approved_sharing_rules: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  platform_capabilities: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type TenantBoundaryValidationReport = Readonly<{
  report_id: string;
  tenant_ownership_score: number;
  namespace_integrity_score: number;
  adaptation_ownership_score: number;
  evidence_ownership_score: number;
  policy_ownership_score: number;
  recommendation_ownership_score: number;
  replay_ownership_score: number;
  simulation_ownership_score: number;
  tenant_ownership_summary: string;
  isolation_verification_assessment: string;
  rejected_boundary_conditions: readonly TenantIsolationDriftFailure[];
  integrity_hash: string;
}>;

export type AdaptationLeakageReport = Readonly<{
  report_id: string;
  proposal_lineage_score: number;
  adaptation_ownership_score: number;
  recommendation_reuse_score: number;
  decision_reuse_score: number;
  simulation_influence_score: number;
  replay_influence_score: number;
  evidence_dependency_score: number;
  leakage_detected: boolean;
  lineage_isolation_assessment: string;
  detected_leakage: readonly TenantIsolationDriftFailure[];
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type CrossTenantLearningReport = Readonly<{
  report_id: string;
  learning_isolation_score: number;
  behavior_transfer_score: number;
  optimization_reuse_score: number;
  recommendation_inheritance_score: number;
  confidence_transfer_score: number;
  risk_model_isolation_score: number;
  historical_learning_score: number;
  cross_tenant_learning_assessment: string;
  detected_learning_violations: readonly TenantIsolationDriftFailure[];
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type PolicyIsolationReport = Readonly<{
  report_id: string;
  policy_ownership_score: number;
  governance_ownership_score: number;
  constitutional_ownership_score: number;
  policy_inheritance_score: number;
  approval_workflow_score: number;
  escalation_policy_score: number;
  certification_policy_score: number;
  governance_boundary_assessment: string;
  detected_policy_violations: readonly TenantIsolationDriftFailure[];
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type OptimizationIsolationReport = Readonly<{
  report_id: string;
  objective_isolation_score: number;
  optimization_lineage_score: number;
  optimization_evidence_score: number;
  recommendation_optimization_score: number;
  confidence_optimization_score: number;
  risk_optimization_score: number;
  strategy_optimization_score: number;
  optimization_boundary_assessment: string;
  detected_optimization_violations: readonly TenantIsolationDriftFailure[];
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type TenantIsolationIntegrityScoreReport = Readonly<{
  score_id: string;
  boundary_integrity_score: number;
  ownership_integrity_score: number;
  lineage_isolation_score: number;
  policy_isolation_score: number;
  optimization_isolation_score: number;
  replay_isolation_score: number;
  tenant_isolation_integrity_score: number;
  integrity_hash: string;
}>;

export type TenantIsolationAssessment = Readonly<{
  assessment_id: string;
  isolation_drift_detected: boolean;
  detected_violations: readonly TenantIsolationDriftFailure[];
  affected_tenants: readonly string[];
  adaptation_analysis: string;
  evidence_analysis: string;
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  replay_impacts: readonly string[];
  optimization_impacts: readonly string[];
  supporting_evidence: readonly string[];
  recommended_response: DriftResponse;
  containment_actions: readonly string[];
  severity: DriftSeverity;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type CrossTenantContaminationAssessment = Readonly<{
  assessment_id: string;
  contamination_scope: string;
  severity: DriftSeverity;
  propagation_risk: string;
  recovery_requirements: readonly string[];
  containment_complete: boolean;
  affected_resources: readonly string[];
  integrity_hash: string;
}>;

export type TenantIsolationDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  tenant_model_version: string;
  drift_category: string;
  tenant_isolation_integrity_score: number;
  boundary_integrity_score: number;
  lineage_isolation_score: number;
  policy_isolation_score: number;
  optimization_isolation_score: number;
  severity: DriftSeverity;
  affected_tenants: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  affected_evidence: readonly string[];
  supporting_evidence: string;
  automatic_blocks: readonly string[];
  recommended_response: DriftResponse;
  containment_required: boolean;
  governance_impact: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type TenantIsolationDriftMetrics = Readonly<{
  tenant_isolation_integrity_score: number;
  boundary_integrity_score: number;
  lineage_isolation_score: number;
  policy_isolation_score: number;
  optimization_isolation_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly TenantIsolationDriftFailure[];
  integrity_hash: string;
}>;

export type TenantIsolationDriftApiSurface = Readonly<{
  api_id: string;
  defend_tenant_isolation: "POST /tenant-isolation-drift-defense/defend";
  retrieve_baseline: "POST /tenant-isolation-drift-defense/baseline";
  retrieve_boundary: "POST /tenant-isolation-drift-defense/boundary";
  retrieve_leakage: "POST /tenant-isolation-drift-defense/leakage";
  retrieve_learning: "POST /tenant-isolation-drift-defense/learning";
  retrieve_policy: "POST /tenant-isolation-drift-defense/policy";
  retrieve_optimization: "POST /tenant-isolation-drift-defense/optimization";
  retrieve_integrity_score: "POST /tenant-isolation-drift-defense/integrity-score";
  retrieve_assessment: "POST /tenant-isolation-drift-defense/assessment";
  retrieve_contamination: "POST /tenant-isolation-drift-defense/contamination";
  retrieve_ledger_record: "POST /tenant-isolation-drift-defense/ledger";
  retrieve_metrics: "POST /tenant-isolation-drift-defense/metrics";
  replay_defense: "POST /tenant-isolation-drift-defense/replay";
  inspect_defense: "POST /tenant-isolation-drift-defense/inspect";
  retrieve_contract: "GET /tenant-isolation-drift-defense/contract";
  production_mutation_supported: false;
  tenant_sharing_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type TenantIsolationDriftInput = Readonly<{
  scenario?: TenantIsolationDriftScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type TenantIsolationDriftResult = Readonly<{
  tenant_isolation_drift_defense_version: "tenant-isolation-drift-defense/v1";
  defense_identifier: "TenantIsolationDriftDefense";
  status: TenantIsolationDriftStatus;
  api_surface: TenantIsolationDriftApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: TenantIsolationBaseline;
  boundary_report: TenantBoundaryValidationReport;
  leakage_report: AdaptationLeakageReport;
  learning_report: CrossTenantLearningReport;
  policy_report: PolicyIsolationReport;
  optimization_report: OptimizationIsolationReport;
  integrity_score_report: TenantIsolationIntegrityScoreReport;
  isolation_assessment: TenantIsolationAssessment;
  contamination_assessment: CrossTenantContaminationAssessment;
  drift_record: TenantIsolationDriftRecord;
  metrics: TenantIsolationDriftMetrics;
  failures: readonly TenantIsolationDriftFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_tenant_sharing: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TenantIsolationDriftFoundation = Readonly<{
  tenant_isolation_drift_defense_version: "tenant-isolation-drift-defense/v1";
  api_surface: TenantIsolationDriftApiSurface;
  result: TenantIsolationDriftResult;
}>;
