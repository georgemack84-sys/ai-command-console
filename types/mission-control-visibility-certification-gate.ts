import type { MissionControlVisibilityContractReport } from "@/types/mission-control-visibility-contract";
import type { MissionControlOperationalDashboardReport } from "@/types/mission-control-operational-dashboard";
import type { MissionControlGraphVisualizationReport } from "@/types/mission-control-graph-visualization-engine";
import type { ReplayInvestigationWorkspaceReport } from "@/types/mission-control-replay-investigation-workspace";

export type VisibilityCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type VisibilityCertificationCategory = "CONTRACT" | "DASHBOARD" | "GRAPH" | "REPLAY" | "INTEGRITY" | "LINEAGE" | "SECURITY" | "ADVISORY" | "TRANSPARENCY";

export type VisibilityCertificationScenario =
  | "BASELINE"
  | "MINOR_PRESENTATION_GAP"
  | "MISSING_EXECUTION_EVENTS"
  | "HIDDEN_AUTONOMY_STATE"
  | "HIDDEN_GOVERNANCE_STATUS"
  | "CONFIDENCE_MISMATCH"
  | "HIDDEN_RISK"
  | "HIDDEN_INTERVENTION"
  | "PLANNING_GRAPH_MISMATCH"
  | "DELEGATION_MISMATCH"
  | "GRAPH_RECONSTRUCTION_MISMATCH"
  | "REPLAY_VISUALIZATION_MISMATCH"
  | "LINEAGE_BREAK"
  | "HIDDEN_INTEGRITY_STATUS"
  | "INCONSISTENT_DASHBOARD_STATE"
  | "REFERENCE_MUTATION"
  | "CROSS_TENANT_VISIBILITY"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "EXECUTION_CONTROLS_EXPOSED"
  | "REPLAY_MISMATCH"
  | "HIDDEN_AUTONOMOUS_ACTIVITY";

export type VisibilityCertificationFailure =
  | "MINOR_PRESENTATION_GAP"
  | "VISIBILITY_CONTRACT_MISSING"
  | "DASHBOARD_SCHEMA_INVALID"
  | "EXECUTION_TIMELINE_INCOMPLETE"
  | "AUTONOMY_STATE_HIDDEN"
  | "GOVERNANCE_STATUS_HIDDEN"
  | "CONFIDENCE_VISIBILITY_MISMATCH"
  | "RISK_INDICATORS_HIDDEN"
  | "INTERVENTION_HISTORY_HIDDEN"
  | "PLANNING_GRAPH_NOT_DETERMINISTIC"
  | "DELEGATION_GRAPH_NOT_DETERMINISTIC"
  | "EXECUTION_GRAPH_NOT_REPRODUCIBLE"
  | "GRAPH_RECONSTRUCTION_MISMATCH"
  | "REPLAY_VISUALIZATION_NOT_DETERMINISTIC"
  | "REPLAY_VISUALIZATION_MISMATCH"
  | "LINEAGE_VISUALIZATION_INCOMPLETE"
  | "LINEAGE_BREAK_DETECTED"
  | "INTEGRITY_HASHES_HIDDEN"
  | "INTEGRITY_STATUS_HIDDEN"
  | "DASHBOARD_REFRESH_NONDETERMINISTIC"
  | "DASHBOARD_STATE_INCONSISTENT"
  | "IMMUTABLE_REFERENCES_NOT_PRESERVED"
  | "REFERENCE_MUTATION_DETECTED"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "CROSS_TENANT_VISIBILITY_DETECTED"
  | "AUTHORIZATION_NOT_ENFORCED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "ADVISORY_ONLY_NOT_ENFORCED"
  | "EXECUTION_CONTROLS_EXPOSED"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "REPLAY_MISMATCH"
  | "OPERATOR_TRANSPARENCY_INCOMPLETE"
  | "HIDDEN_AUTONOMOUS_ACTIVITY"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type VisibilityCertificationTestResult = Readonly<{
  test_id: string;
  category: VisibilityCertificationCategory;
  name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: VisibilityCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type VisibilityCertificationEvidence = Readonly<{
  evidence_id: string;
  visibility_contract_hash: string;
  dashboard_hash: string;
  graph_engine_hash: string;
  replay_workspace_hash: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type VisibilityCertificationScorecard = Readonly<{
  determinism_score: number;
  visibility_score: number;
  replay_score: number;
  integrity_score: number;
  lineage_score: number;
  governance_score: number;
  security_score: number;
  scorecard_hash: string;
}>;

export type VisibilityCertificationReport = Readonly<{
  executive_summary: string;
  corrective_actions: readonly string[];
  audit_entries: readonly string[];
  evidence_references: readonly string[];
  immutable_checksum: string;
}>;

export type MissionControlVisibilityCertificationReport = Readonly<{
  visibility_certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase: "8J";
  phase_version: "8J.5";
  schema_version: "mission-control-visibility-certification-gate/v8J.5";
  certification_state: VisibilityCertificationState;
  certification_version: string;
  visibility_contract_version: string;
  dashboard_version: string;
  graph_engine_version: string;
  replay_workspace_version: string;
  visibility_contract: MissionControlVisibilityContractReport;
  operational_dashboard: MissionControlOperationalDashboardReport;
  graph_visualization: MissionControlGraphVisualizationReport;
  replay_workspace: ReplayInvestigationWorkspaceReport;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  determinism_score: number;
  visibility_score: number;
  replay_score: number;
  integrity_score: number;
  lineage_score: number;
  governance_score: number;
  security_score: number;
  overall_result: VisibilityCertificationState;
  certification_tests: readonly VisibilityCertificationTestResult[];
  passed_tests: readonly VisibilityCertificationTestResult[];
  failed_tests: readonly VisibilityCertificationTestResult[];
  warnings: readonly VisibilityCertificationFailure[];
  detected_findings: readonly VisibilityCertificationFailure[];
  certification_evidence: VisibilityCertificationEvidence;
  scorecard: VisibilityCertificationScorecard;
  certification_report: VisibilityCertificationReport;
  phase_8k_authorized: boolean;
  operator_approval_status: "APPROVED_FOR_PHASE_8K" | "APPROVED_FOR_REMEDIATION" | "BLOCKED";
  production_ready: boolean;
  generated_at: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  report_hash: string;
}>;

export type VisibilityCertificationInput = Readonly<{
  scenario?: VisibilityCertificationScenario;
}>;

export type VisibilityCertificationValidationResult = Readonly<{
  certification_id: string | null;
  validation_state: "VALID" | "INVALID";
  certified: boolean;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  report_hash_valid: boolean;
  phase_8k_authorized: boolean;
  failures: readonly VisibilityCertificationFailure[];
  validation_hash: string;
}>;

export type VisibilityCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: VisibilityCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warnings: readonly VisibilityCertificationFailure[];
  failures: readonly VisibilityCertificationFailure[];
  determinism_score: number;
  visibility_score: number;
  replay_score: number;
  integrity_score: number;
  lineage_score: number;
  governance_score: number;
  security_score: number;
  operator_approval_status: MissionControlVisibilityCertificationReport["operator_approval_status"];
  phase_8k_authorized: boolean;
  production_ready: boolean;
}>;
