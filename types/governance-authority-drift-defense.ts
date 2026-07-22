import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type GovernanceAuthorityDriftStatus = "PASS" | "DRIFT_DETECTED" | "CONTAINED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type GovernanceAuthorityDriftFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "GOVERNANCE_RELAXATION_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "APPROVAL_BYPASS_ATTEMPT"
  | "GOVERNANCE_RULE_WEAKENING"
  | "GOVERNANCE_DEPENDENCY_REMOVAL"
  | "POLICY_ENFORCEMENT_DEGRADATION"
  | "GOVERNANCE_SUPPRESSION_DETECTED"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "ESCALATION_SUPPRESSION_DETECTED"
  | "CERTIFICATION_AVOIDANCE_DETECTED"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "UNAUTHORIZED_GOVERNANCE_EVOLUTION"
  | "NONDETERMINISTIC_ENFORCEMENT"
  | "NONREPLAYABLE_GOVERNANCE_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_GOVERNANCE_BEHAVIOR";

export type GovernanceAuthorityDriftScenario =
  | "BASELINE"
  | "GOVERNANCE_RELAXATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "APPROVAL_BYPASS"
  | "GOVERNANCE_RULE_WEAKENING"
  | "GOVERNANCE_DEPENDENCY_REMOVAL"
  | "POLICY_ENFORCEMENT_DEGRADATION"
  | "GOVERNANCE_SUPPRESSION"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "ESCALATION_SUPPRESSION"
  | "CERTIFICATION_AVOIDANCE"
  | "PRIVILEGE_ESCALATION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "UNAUTHORIZED_GOVERNANCE_EVOLUTION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type GovernanceBaseline = Readonly<{
  baseline_id: string;
  governance_version: string;
  constitutional_version: string;
  authority_model: readonly string[];
  approval_workflows: readonly string[];
  escalation_policies: readonly string[];
  certification_requirements: readonly string[];
  operator_authority: readonly string[];
  effective_date: string;
  approval_reference: string;
  integrity_hash: string;
}>;

export type GovernanceDriftReport = Readonly<{
  report_id: string;
  detected_governance_drift: readonly GovernanceAuthorityDriftFailure[];
  constitutional_analysis: string;
  approval_workflow_analysis: string;
  escalation_analysis: string;
  governance_impacts: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  supporting_evidence: readonly string[];
  containment_actions: readonly string[];
  recommended_responses: readonly DriftResponse[];
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type AuthorityDriftReport = Readonly<{
  report_id: string;
  authority_drift_report: string;
  boundary_integrity_assessment: string;
  authority_violation_summary: string;
  authority_integrity_score: number;
  unauthorized_permissions: readonly string[];
  automatic_blocks: readonly string[];
  operator_impact: string;
  integrity_hash: string;
}>;

export type ConstitutionalComplianceReport = Readonly<{
  report_id: string;
  constitutional_compliance_report: string;
  constitutional_drift_assessment: string;
  governance_supremacy_preserved: boolean;
  operator_supremacy_preserved: boolean;
  advisory_only_preserved: boolean;
  replay_requirements_preserved: boolean;
  audit_requirements_preserved: boolean;
  tenant_isolation_preserved: boolean;
  evidence_integrity_preserved: boolean;
  integrity_hash: string;
}>;

export type ApprovalWorkflowIntegrityReport = Readonly<{
  report_id: string;
  approval_integrity_report: string;
  workflow_drift_analysis: string;
  approval_integrity_score: number;
  detected_workflow_anomalies: readonly GovernanceAuthorityDriftFailure[];
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type EscalationIntegrityReport = Readonly<{
  report_id: string;
  escalation_drift_summary: string;
  escalation_integrity_report: string;
  escalation_consistency_score: number;
  governance_compliance_score: number;
  constitutional_compliance_score: number;
  operator_notification_score: number;
  certification_routing_score: number;
  integrity_hash: string;
}>;

export type GovernanceContainmentDecision = Readonly<{
  containment_id: string;
  automatic_blocks: readonly string[];
  containment_actions: readonly string[];
  mandatory_escalation_required: boolean;
  escalation_destinations: readonly string[];
  deterministic: true;
  replayable: true;
  explainable: true;
  auditable: true;
  governance_approved_path_required: true;
  integrity_hash: string;
}>;

export type GovernanceDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  baseline_ref: string;
  governance_version: string;
  constitutional_version: string;
  drift_category: "GOVERNANCE_AUTHORITY_DRIFT";
  severity: DriftSeverity;
  authority_impact: string;
  governance_impact: string;
  constitutional_impact: string;
  approval_workflow_impact: string;
  escalation_impact: string;
  affected_adaptations: readonly string[];
  affected_decisions: readonly string[];
  automatic_blocks: readonly string[];
  recommended_response: DriftResponse;
  containment_actions: readonly string[];
  supporting_evidence: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type MandatoryEscalation = Readonly<{
  escalation_id: string;
  triggers: readonly string[];
  destinations: readonly string[];
  required: boolean;
  fail_closed_recovery_available: true;
  operator_notification_required: true;
  certification_review_required: boolean;
  integrity_hash: string;
}>;

export type GovernanceAuthorityMetrics = Readonly<{
  authority_integrity_score: number;
  approval_integrity_score: number;
  escalation_integrity_score: number;
  containment_blocks_count: number;
  mandatory_escalation_required: boolean;
  deterministic_enforcement: boolean;
  replayable_enforcement: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly GovernanceAuthorityDriftFailure[];
  integrity_hash: string;
}>;

export type GovernanceAuthorityApiSurface = Readonly<{
  api_id: string;
  defend_governance_authority: "POST /governance-authority-drift-defense/defend";
  retrieve_baseline: "POST /governance-authority-drift-defense/baseline";
  retrieve_governance_report: "POST /governance-authority-drift-defense/governance-report";
  retrieve_authority_report: "POST /governance-authority-drift-defense/authority-report";
  retrieve_constitutional_report: "POST /governance-authority-drift-defense/constitutional-report";
  retrieve_approval_report: "POST /governance-authority-drift-defense/approval-report";
  retrieve_escalation_report: "POST /governance-authority-drift-defense/escalation-report";
  retrieve_containment: "POST /governance-authority-drift-defense/containment";
  retrieve_ledger_record: "POST /governance-authority-drift-defense/ledger";
  retrieve_metrics: "POST /governance-authority-drift-defense/metrics";
  replay_defense: "POST /governance-authority-drift-defense/replay";
  inspect_defense: "POST /governance-authority-drift-defense/inspect";
  retrieve_contract: "GET /governance-authority-drift-defense/contract";
  authority_expansion_supported: false;
  governance_bypass_supported: false;
  autonomous_execution_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type GovernanceAuthorityInput = Readonly<{
  scenario?: GovernanceAuthorityDriftScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type GovernanceAuthorityResult = Readonly<{
  governance_authority_drift_defense_version: "governance-authority-drift-defense/v1";
  defense_identifier: "GovernanceAuthorityDriftDefense";
  status: GovernanceAuthorityDriftStatus;
  api_surface: GovernanceAuthorityApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: GovernanceBaseline;
  governance_report: GovernanceDriftReport;
  authority_report: AuthorityDriftReport;
  constitutional_report: ConstitutionalComplianceReport;
  approval_report: ApprovalWorkflowIntegrityReport;
  escalation_report: EscalationIntegrityReport;
  containment_decision: GovernanceContainmentDecision;
  drift_record: GovernanceDriftRecord;
  mandatory_escalation: MandatoryEscalation;
  metrics: GovernanceAuthorityMetrics;
  failures: readonly GovernanceAuthorityDriftFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  expands_authority: false;
  authorizes_autonomous_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAuthorityFoundation = Readonly<{
  governance_authority_drift_defense_version: "governance-authority-drift-defense/v1";
  api_surface: GovernanceAuthorityApiSurface;
  result: GovernanceAuthorityResult;
}>;
