export type PilotExpansionGovernanceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ExpansionType = "TENANT" | "ENVIRONMENT" | "WORKLOAD" | "CAPABILITY" | "GEOGRAPHIC";
export type ExpansionQualificationOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_REMEDIATION" | "NOT_QUALIFIED";
export type ExpansionRiskCategory = "OPERATIONAL" | "GOVERNANCE" | "REPLAY" | "ADVISORY_BOUNDARY" | "TENANT_ISOLATION" | "DEPLOYMENT" | "EVIDENCE_INTEGRITY" | "CERTIFICATION" | "SCALABILITY";
export type ExpansionRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ExpansionRiskResponse = "ACCEPT" | "MITIGATE" | "REQUIRE_REVIEW" | "REQUIRE_REQUALIFICATION" | "REJECT";
export type ExpansionApprovalDecision = "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT" | "DEFER";
export type ExpansionStatus = "REQUESTED" | "QUALIFIED" | "APPROVED" | "REJECTED" | "ACTIVATED" | "BLOCKED";
export type Vp2VerificationOption = "CANONICAL_EVIDENCE_SUBSYSTEM" | "EVIDENCE_PLATFORM_ARCHITECTURE";
export type PilotExpansionGovernanceFailure =
  | "EXPANSION_NOT_GOVERNED"
  | "QUALIFICATION_NOT_DETERMINISTIC"
  | "RISK_NOT_EVALUATED"
  | "ADVISORY_BOUNDARY_WEAKENED"
  | "CERTIFICATION_PREREQUISITE_NOT_ENFORCED"
  | "EXPANSION_LINEAGE_INCOMPLETE"
  | "EXPANSION_EVIDENCE_MUTABLE"
  | "EXPANSION_REPLAY_NOT_REPRODUCIBLE"
  | "GOVERNANCE_APPROVALS_NOT_ATTRIBUTABLE"
  | "VP2_NOT_COMPLETE"
  | "UNAUTHORIZED_PILOT_GROWTH"
  | "PHASE_16_9_READINESS_NOT_VALID"
  | "NON_CONSTITUTIONAL_EXPANSION_WARNING";
export type PilotExpansionGovernanceScenario = "BASELINE" | PilotExpansionGovernanceFailure;

export type PilotExpansionGovernanceInput = Readonly<{ scenario?: PilotExpansionGovernanceScenario; tenant_id?: string; operator_id?: string; mission_id?: string; pilot_id?: string; expansion_id?: string; expansion_type?: ExpansionType; requested_scope?: readonly string[] }>;

export type ExpansionPolicy = Readonly<{ policy_id: string; governed_types: readonly ExpansionType[]; certification_required: boolean; advisory_only_required: boolean; deterministic_qualification_required: boolean; immutable_evidence_required: boolean; replay_required: boolean; governance_authority_supreme: boolean; prevents_unauthorized_growth: boolean; integrity_hash: string }>;
export type ExpansionQualification = Readonly<{ qualification_id: string; inputs: readonly string[]; outcome: ExpansionQualificationOutcome; pilot_certification_status: "PASSING" | "NON_PASSING"; operational_health: boolean; performance_validation: boolean; reliability_validation: boolean; governance_compliance: boolean; incident_history_acceptable: boolean; replay_quality: boolean; evidence_complete: boolean; advisory_boundary_intact: boolean; tenant_isolation_intact: boolean; deterministic: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ExpansionRiskAssessment = Readonly<{ risk_assessment_id: string; categories: readonly ExpansionRiskCategory[]; risk_level: ExpansionRiskLevel; response: ExpansionRiskResponse; deterministic: boolean; evaluated: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ExpansionApprovalWorkflow = Readonly<{ workflow_id: string; proposal_ref: string; qualification_ref: string; risk_ref: string; governance_review_ref: string; approval_authority_ref: string; decision: ExpansionApprovalDecision; attributable: boolean; grants_operational_authority: boolean; advisory_only: boolean; integrity_hash: string }>;
export type PilotExpansionRecord = Readonly<{ expansion_id: string; pilot_id: string; expansion_type: ExpansionType; requested_scope: readonly string[]; approved_scope: readonly string[]; qualification_result: ExpansionQualificationOutcome; risk_level: ExpansionRiskLevel; certification_reference: string; governance_reference: string; operator_reference: string | null; evidence_refs: readonly string[]; replay_refs: readonly string[]; lineage_refs: readonly string[]; approval_timestamp: string; expansion_status: ExpansionStatus; immutable: boolean; integrity_hash: string }>;
export type ExpansionRegistry = Readonly<{ registry_id: string; records: readonly PilotExpansionRecord[]; approved_count: number; rejected_count: number; tracks_scope_evolution: boolean; tracks_qualification_history: boolean; tracks_approvals: boolean; tracks_evidence: boolean; tracks_certification_linkage: boolean; tracks_replay_lineage: boolean; immutable: boolean; integrity_hash: string }>;
export type ExpansionLineageNode = Readonly<{ node_id: string; node_type: "PILOT" | "CERTIFICATION" | "QUALIFICATION" | "APPROVAL" | "EVIDENCE" | "REPLAY" | "MONITORING" | "INCIDENT" | "EXPANSION_HISTORY"; refs: readonly string[]; integrity_hash: string }>;
export type ExpansionEvidenceIntegration = Readonly<{ integration_id: string; evidence_platform_ref: string; canonical_subsystem_verified: boolean; evidence_platform_verified: boolean; duplicate_evidence_infrastructure_created: boolean; persistence_reused: boolean; lineage_graph_reused: boolean; integrity_validation_reused: boolean; certification_linkage_reused: boolean; immutable_audit_reused: boolean; tenant_isolation_controls_reused: boolean; vp2_option: Vp2VerificationOption; vp2_outcome: "PASS" | "FAIL"; integrity_hash: string }>;
export type ExpansionGovernanceDashboard = Readonly<{ dashboard_id: string; qualification_visible: boolean; risk_visible: boolean; approval_visible: boolean; lineage_visible: boolean; evidence_visible: boolean; replay_visible: boolean; vp2_visible: boolean; unauthorized_growth_alerts: number; outcome: ExpansionApprovalDecision; integrity_hash: string }>;
export type ExpansionDecisionLedgerEntry = Readonly<{ ledger_entry_id: string; sequence: number; event_type: "EXPANSION_REQUESTED" | "QUALIFICATION_VALIDATED" | "RISK_ASSESSED" | "GOVERNANCE_REVIEWED" | "APPROVAL_DECIDED" | "REGISTRY_UPDATED" | "LINEAGE_RECORDED" | "EVIDENCE_INTEGRATED" | "VP2_VERIFIED"; expansion_refs: readonly string[]; evidence_refs: readonly string[]; replay_refs: readonly string[]; governance_refs: readonly string[]; append_only: boolean; immutable: boolean; integrity_hash: string }>;
export type PilotExpansionGovernanceCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: PilotExpansionGovernanceOutcome; passed: boolean; failure_reason: PilotExpansionGovernanceFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type PilotExpansionGovernanceResult = Readonly<{ phase_version: "pilot-expansion-governance/v16.10"; phase_identifier: "PilotExpansionGovernance"; pilot_readiness_assessment_ref: string; policy: ExpansionPolicy; qualification: ExpansionQualification; risk_assessment: ExpansionRiskAssessment; approval_workflow: ExpansionApprovalWorkflow; expansion_record: PilotExpansionRecord; registry: ExpansionRegistry; lineage_graph: readonly ExpansionLineageNode[]; evidence_integration: ExpansionEvidenceIntegration; dashboard: ExpansionGovernanceDashboard; decision_ledger: readonly ExpansionDecisionLedgerEntry[]; certification_tests: readonly PilotExpansionGovernanceCertificationTest[]; failures: readonly PilotExpansionGovernanceFailure[]; outcome: PilotExpansionGovernanceOutcome; replay_hash: string; integrity_hash: string }>;
export type PilotExpansionGovernanceValidation = Readonly<{ valid: boolean; outcome: PilotExpansionGovernanceOutcome; policy_valid: boolean; qualification_valid: boolean; risk_valid: boolean; workflow_valid: boolean; record_valid: boolean; registry_valid: boolean; lineage_valid: boolean; evidence_valid: boolean; dashboard_valid: boolean; ledger_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly PilotExpansionGovernanceFailure[]; integrity_hash: string }>;
export type PilotExpansionGovernanceBundle = Readonly<{ doctrine: Readonly<{ version: "pilot-expansion-governance/v16.10"; upstream_phase: "pilot-readiness-assessment/v16.9"; expansion_types: readonly ExpansionType[]; qualification_outcomes: readonly ExpansionQualificationOutcome[]; risk_levels: readonly ExpansionRiskLevel[]; risk_responses: readonly ExpansionRiskResponse[]; vp2_options: readonly Vp2VerificationOption[]; certification_outcomes: readonly PilotExpansionGovernanceOutcome[] }>; result: PilotExpansionGovernanceResult; validation: PilotExpansionGovernanceValidation }>;
