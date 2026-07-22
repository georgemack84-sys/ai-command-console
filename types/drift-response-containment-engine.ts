import type { DriftDefenseArchitectureResult, DriftSeverity } from "@/types/drift-defense-architecture";

export type DriftContainmentResponse =
  | "MONITOR"
  | "ESCALATE"
  | "SUPPRESS_ADAPTATION"
  | "REQUIRE_REVIEW"
  | "REQUIRE_SIMULATION"
  | "REQUIRE_CERTIFICATION"
  | "ROLLBACK"
  | "FAIL_CLOSED";

export type DriftResponseContainmentStatus = "PASS" | "CONTAINMENT_SELECTED" | "ESCALATED" | "ROLLBACK_REQUIRED" | "FAIL_CLOSED";

export type DriftResponseSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CATASTROPHIC";

export type DriftResponseScenario =
  | "BASELINE"
  | "LOW_CONFIDENCE_DRIFT"
  | "MODERATE_STRATEGIC_DRIFT"
  | "HIGH_RISK_DRIFT"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "REPLAY_FAILURE"
  | "TENANT_CONTAMINATION"
  | "EVIDENCE_POISONING"
  | "FEEDBACK_MANIPULATION"
  | "OPTIMIZATION_PRESSURE"
  | "ADVERSARIAL_SUCCESS"
  | "REPEATED_DRIFT"
  | "UNRESOLVED_ADAPTIVE_BEHAVIOR"
  | "CERTIFICATION_REQUIRED"
  | "ROLLBACK_REQUIRED"
  | "RECOVERY_READY"
  | "RECOVERY_DEFERRED"
  | "UNSUPPORTED_DRIFT"
  | "AMBIGUOUS_DRIFT"
  | "NONDETERMINISTIC_RESPONSE"
  | "NONREPLAYABLE_RESPONSE_EVIDENCE"
  | "UNKNOWN_DRIFT_BEHAVIOR";

export type DriftResponseFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "LOW_CONFIDENCE_DRIFT"
  | "MODERATE_STRATEGIC_DRIFT"
  | "HIGH_RISK_DRIFT"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "REPLAY_FAILURE"
  | "TENANT_CONTAMINATION"
  | "EVIDENCE_POISONING"
  | "FEEDBACK_MANIPULATION"
  | "OPTIMIZATION_PRESSURE"
  | "ADVERSARIAL_SUCCESS"
  | "REPEATED_DRIFT"
  | "UNRESOLVED_ADAPTIVE_BEHAVIOR"
  | "CERTIFICATION_REQUIRED"
  | "ROLLBACK_REQUIRED"
  | "RECOVERY_READY"
  | "RECOVERY_DEFERRED"
  | "UNSUPPORTED_DRIFT"
  | "AMBIGUOUS_DRIFT"
  | "NONDETERMINISTIC_RESPONSE"
  | "NONREPLAYABLE_RESPONSE_EVIDENCE"
  | "UNKNOWN_DRIFT_BEHAVIOR";

export type DriftResponsePolicy = Readonly<{
  policy_id: string;
  drift_category: string;
  severity_level: DriftResponseSeverity;
  required_response: DriftContainmentResponse;
  containment_level: string;
  escalation_policy: string;
  rollback_policy: string;
  certification_policy: string;
  operator_notification_policy: string;
  replay_policy: string;
  approval_reference: string;
  version: string;
  integrity_hash: string;
}>;

export type SeverityAssessment = Readonly<{
  assessment_id: string;
  severity: DriftResponseSeverity;
  governance_impact_score: number;
  constitutional_impact_score: number;
  authority_impact_score: number;
  replay_impact_score: number;
  tenant_impact_score: number;
  evidence_integrity_score: number;
  propagation_risk_score: number;
  operational_impact_score: number;
  recovery_complexity_score: number;
  historical_recurrence_score: number;
  severity_justification: string;
  risk_classification: string;
  integrity_hash: string;
}>;

export type ContainmentDecision = Readonly<{
  decision_id: string;
  selected_response: DriftContainmentResponse;
  containment_scope: string;
  containment_level: string;
  suppression_required: boolean;
  governance_involvement: boolean;
  operator_involvement: boolean;
  certification_required: boolean;
  rollback_eligible: boolean;
  containment_actions: readonly string[];
  deterministic: true;
  replayable: true;
  explainable: true;
  auditable: true;
  tenant_isolated: true;
  integrity_hash: string;
}>;

export type EscalationPackage = Readonly<{
  escalation_id: string;
  escalation_status: "NONE" | "PENDING" | "ROUTED" | "BLOCKING";
  routes: readonly string[];
  escalation_triggers: readonly DriftResponseFailure[];
  escalation_timeline: readonly string[];
  escalation_decision_record: string;
  integrity_hash: string;
}>;

export type RollbackEligibilityReport = Readonly<{
  report_id: string;
  rollback_safety_score: number;
  rollback_completeness_score: number;
  replay_compatibility_score: number;
  certification_history_score: number;
  evidence_integrity_score: number;
  dependency_impact_score: number;
  governance_approval_required: boolean;
  recovery_feasibility_score: number;
  rollback_required: boolean;
  rollback_recommended: boolean;
  rollback_prohibited: boolean;
  rollback_sequence: readonly string[];
  rollback_verification_requirements: readonly string[];
  recovery_assessment: string;
  integrity_hash: string;
}>;

export type CertificationRequirementReport = Readonly<{
  report_id: string;
  certification_required: boolean;
  certification_scope: readonly string[];
  certification_sequence: readonly string[];
  certification_dependencies: readonly string[];
  affected_certifications: readonly string[];
  replay_certification_required: boolean;
  governance_certification_required: boolean;
  simulation_certification_required: boolean;
  operator_certification_required: boolean;
  rollback_certification_required: boolean;
  audit_certification_required: boolean;
  integrity_hash: string;
}>;

export type OperatorNotificationPackage = Readonly<{
  notification_id: string;
  notification_status: "NONE" | "QUEUED" | "SENT";
  recipients: readonly string[];
  detected_drift: readonly DriftResponseFailure[];
  severity: DriftResponseSeverity;
  affected_components: readonly string[];
  containment_actions: readonly string[];
  escalation_status: string;
  replay_references: readonly string[];
  recommended_actions: readonly string[];
  integrity_hash: string;
}>;

export type DriftReplayRecord = Readonly<{
  replay_record_ref: string;
  detected_drift: readonly DriftResponseFailure[];
  severity_assessment_ref: string;
  response_selection: DriftContainmentResponse;
  containment_execution: readonly string[];
  escalation_decisions: readonly string[];
  rollback_actions: readonly string[];
  certification_decisions: readonly string[];
  operator_actions: readonly string[];
  governance_actions: readonly string[];
  integrity_hash: string;
}>;

export type RecoveryReadinessReport = Readonly<{
  report_id: string;
  recovery_decision: "RECOVERY_PERMITTED" | "RECOVERY_DEFERRED" | "ADDITIONAL_EVIDENCE_REQUIRED" | "ADDITIONAL_SIMULATION_REQUIRED" | "PERMANENT_SUPPRESSION_REQUIRED";
  containment_completion: boolean;
  governance_approval: boolean;
  simulation_completion: boolean;
  certification_completion: boolean;
  replay_validation: boolean;
  rollback_validation: boolean;
  operator_approval: boolean;
  audit_completion: boolean;
  recovery_decision_summary: string;
  integrity_hash: string;
}>;

export type DriftResponseRecord = Readonly<{
  response_id: string;
  tenant_id: string;
  drift_id: string;
  drift_category: string;
  severity: DriftResponseSeverity;
  selected_response: DriftContainmentResponse;
  containment_level: string;
  escalation_status: string;
  rollback_eligibility: string;
  rollback_executed: boolean;
  certification_required: boolean;
  operator_notification_status: string;
  replay_record_ref: string;
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  governance_impact: string;
  constitutional_impact: string;
  containment_actions: readonly string[];
  supporting_evidence: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DriftResponseMetrics = Readonly<{
  severity: DriftResponseSeverity;
  selected_response: DriftContainmentResponse;
  containment_required: boolean;
  rollback_required: boolean;
  certification_required: boolean;
  escalation_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly DriftResponseFailure[];
  integrity_hash: string;
}>;

export type DriftResponseApiSurface = Readonly<{
  api_id: string;
  respond_to_drift: "POST /drift-response-containment/respond";
  retrieve_policy: "POST /drift-response-containment/policy";
  retrieve_severity: "POST /drift-response-containment/severity";
  retrieve_containment: "POST /drift-response-containment/containment";
  retrieve_escalation: "POST /drift-response-containment/escalation";
  retrieve_rollback: "POST /drift-response-containment/rollback";
  retrieve_certification: "POST /drift-response-containment/certification";
  retrieve_notification: "POST /drift-response-containment/notification";
  retrieve_replay_record: "POST /drift-response-containment/replay-record";
  retrieve_recovery: "POST /drift-response-containment/recovery";
  retrieve_ledger_record: "POST /drift-response-containment/ledger";
  retrieve_metrics: "POST /drift-response-containment/metrics";
  replay_response: "POST /drift-response-containment/replay";
  inspect_response: "POST /drift-response-containment/inspect";
  retrieve_contract: "GET /drift-response-containment/contract";
  production_mutation_supported: false;
  adaptive_execution_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type DriftResponseInput = Readonly<{
  scenario?: DriftResponseScenario;
  tenant_id?: string;
  drift_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type DriftResponseResult = Readonly<{
  drift_response_containment_version: "drift-response-containment/v1";
  engine_identifier: "DriftResponseContainmentEngine";
  status: DriftResponseContainmentStatus;
  api_surface: DriftResponseApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  response_policy: DriftResponsePolicy;
  severity_assessment: SeverityAssessment;
  containment_decision: ContainmentDecision;
  escalation_package: EscalationPackage;
  rollback_report: RollbackEligibilityReport;
  certification_report: CertificationRequirementReport;
  notification_package: OperatorNotificationPackage;
  replay_record: DriftReplayRecord;
  recovery_readiness_report: RecoveryReadinessReport;
  response_record: DriftResponseRecord;
  metrics: DriftResponseMetrics;
  failures: readonly DriftResponseFailure[];
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
  authorizes_adaptive_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DriftResponseFoundation = Readonly<{
  drift_response_containment_version: "drift-response-containment/v1";
  api_surface: DriftResponseApiSurface;
  result: DriftResponseResult;
}>;
