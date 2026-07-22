import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";

export type ContinuousConstitutionalSubsystem = "PLANNING" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "RECOVERY" | "OPTIMIZATION" | "LEARNING" | "REPLAY" | "VISIBILITY" | "INTEGRITY" | "GOVERNANCE" | "AUTHORITY";
export type ContinuousConstitutionalValidationState = "VERIFIED" | "COMPLIANT" | "OBSERVING" | "WARNING" | "DEGRADED" | "VIOLATION" | "BLOCKED";
export type ContinuousConstitutionalScenario = "BASELINE" | "CONSTITUTIONAL_RULE_VIOLATION" | "GOVERNANCE_BYPASS" | "OPERATOR_AUTHORITY_OVERRIDE" | "PRIVILEGE_ESCALATION" | "NONDETERMINISTIC_EXECUTION" | "REPLAY_MISMATCH" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_EXECUTION_PATH" | "HIDDEN_AUTONOMOUS_LEARNING" | "POLICY_MUTATION" | "CONSTITUTIONAL_MUTATION" | "TENANT_ISOLATION_FAILURE" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "INCOMPLETE_VALIDATION_LINEAGE" | "UNVERIFIED_AUTONOMOUS_SUBSYSTEM";
export type ContinuousConstitutionalFailure = "CONSTITUTIONAL_RULE_VIOLATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED" | "PRIVILEGE_ESCALATION_DETECTED" | "NONDETERMINISTIC_EXECUTION_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "INTEGRITY_VERIFICATION_FAILURE_DETECTED" | "HIDDEN_EXECUTION_PATH_DETECTED" | "HIDDEN_AUTONOMOUS_LEARNING_DETECTED" | "POLICY_MUTATION_DETECTED" | "CONSTITUTIONAL_MUTATION_DETECTED" | "TENANT_ISOLATION_FAILURE_DETECTED" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "VALIDATION_LINEAGE_INCOMPLETE" | "UNVERIFIED_AUTONOMOUS_SUBSYSTEM_DETECTED";

export type ConstitutionalValidationReport = Readonly<{
  validation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  subsystem: ContinuousConstitutionalSubsystem;
  validation_timestamp: "1970-01-01T00:00:00.000Z";
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  validated_invariants: readonly string[];
  validation_result: ContinuousConstitutionalValidationState;
  compliance_score: number;
  authority_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  determinism_status: "PASS" | "FAIL";
  replay_status: "PASS" | "FAIL";
  integrity_status: "PASS" | "FAIL";
  violation_count: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendations: readonly string[];
  validator_version: "continuous-constitutional-validation/v8ALT.10.2";
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  failure: ContinuousConstitutionalFailure | null;
  validation_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  background_monitor_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalComplianceTimelineEntry = Readonly<{
  timeline_id: string;
  validation_id: string;
  subsystem: ContinuousConstitutionalSubsystem;
  validation_result: ContinuousConstitutionalValidationState;
  governance_decision: "ALLOW_OBSERVATION" | "FAIL_CLOSED";
  authority_evaluation: "WITHIN_LIMITS" | "VIOLATION";
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalViolationAlert = Readonly<{
  alert_id: string;
  validation_id: string;
  subsystem: ContinuousConstitutionalSubsystem;
  alert_type: ContinuousConstitutionalFailure;
  severity: "HIGH" | "CRITICAL";
  fail_closed: true;
  operator_visible: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalTrendAssessment = Readonly<{
  trend_id: string;
  domain: "CONSTITUTIONAL_STABILITY" | "GOVERNANCE_HEALTH" | "AUTHORITY_CONSISTENCY" | "REPLAY_CONSISTENCY" | "SUBSYSTEM_COMPLIANCE" | "CERTIFICATION_READINESS";
  score: number;
  trend_direction: "STABLE" | "DEGRADED";
  evidence_count: number;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ContinuousConstitutionalAuditRecord = Readonly<{
  audit_id: string;
  failure: ContinuousConstitutionalFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ContinuousConstitutionalValidationRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  final_state: "CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE" | "CONTINUOUS_CONSTITUTIONAL_VALIDATION_BLOCKED";
  reports: readonly ConstitutionalValidationReport[];
  timeline: readonly ConstitutionalComplianceTimelineEntry[];
  alerts: readonly ConstitutionalViolationAlert[];
  trends: readonly ConstitutionalTrendAssessment[];
  audit_records: readonly ContinuousConstitutionalAuditRecord[];
  failures: readonly ContinuousConstitutionalFailure[];
  validation_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  background_monitor_authorized: false;
  integrity_hash: string;
}>;

export type ContinuousConstitutionalValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  baseline_valid: boolean;
  all_subsystems_validated: boolean;
  constitutional_compliance: boolean;
  governance_supremacy_preserved: boolean;
  operator_supremacy_preserved: boolean;
  deterministic: boolean;
  replay_compatible: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  fail_closed: boolean;
  validation_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  failures: readonly ContinuousConstitutionalFailure[];
  validation_hash: string;
}>;

export type ContinuousConstitutionalObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  report_count: number;
  timeline_count: number;
  alert_count: number;
  trend_count: number;
  audit_count: number;
  failure_count: number;
  validation_only: true;
  advisory_only: true;
  background_monitor_authorized: false;
  integrity_hash: string;
}>;

export type ContinuousConstitutionalInput = Readonly<{ scenario?: ContinuousConstitutionalScenario; baseline?: ConstitutionalBaselineContract; repository?: ContinuousConstitutionalValidationRepository }>;

export type ContinuousConstitutionalValidationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "continuous-constitutional-validation/v8ALT.10.2";
    final_state: "CONTINUOUS_CONSTITUTIONAL_VALIDATION_READY";
    subsystems: readonly ContinuousConstitutionalSubsystem[];
    principles: readonly string[];
  }>;
  repository: ContinuousConstitutionalValidationRepository;
  validation: ContinuousConstitutionalValidationResult;
  observability: ContinuousConstitutionalObservabilitySurface;
}>;
