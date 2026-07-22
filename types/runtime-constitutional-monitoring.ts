import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";

export type RuntimeMonitoringDomain = "AUTHORITY" | "POLICY" | "OPERATOR_AUTHORITY" | "RUNTIME_CONFIDENCE" | "MISSION_STATE" | "GOVERNANCE_HEALTH" | "EXECUTION_INTEGRITY" | "TENANT_ISOLATION" | "SYSTEM_DRIFT";
export type ConstitutionalHealthState = "EXCELLENT" | "HEALTHY" | "STABLE" | "WATCH" | "DEGRADED" | "CRITICAL" | "NON_COMPLIANT";
export type RuntimeDriftLevel = "STABLE" | "MINOR" | "MODERATE" | "ELEVATED" | "CRITICAL";
export type RuntimeComplianceState = "COMPLIANT" | "OBSERVED" | "DEGRADED" | "NON_COMPLIANT" | "FAIL_CLOSED";
export type RuntimeConstitutionalScenario = "BASELINE" | "CONSTITUTIONAL_BYPASS" | "GOVERNANCE_BYPASS" | "AUTHORITY_ESCALATION" | "OPERATOR_AUTHORITY_OVERRIDE" | "POLICY_ENFORCEMENT_FAILURE" | "HIDDEN_EXECUTION" | "EXECUTION_NONDETERMINISM" | "REPLAY_DIVERGENCE" | "INTEGRITY_VERIFICATION_FAILURE" | "TENANT_ISOLATION_BREACH" | "UNAUTHORIZED_LEARNING" | "UNAUTHORIZED_OPTIMIZATION" | "UNAUTHORIZED_RECOVERY" | "MONITORING_EVIDENCE_CORRUPTION" | "CONSTITUTIONAL_HEALTH_UNAVAILABLE" | "MISSING_RUNTIME_VISIBILITY" | "INCOMPLETE_MONITORING_LINEAGE";
export type RuntimeConstitutionalFailure = "CONSTITUTIONAL_BYPASS_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED" | "POLICY_ENFORCEMENT_FAILURE_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "EXECUTION_NONDETERMINISM_DETECTED" | "REPLAY_DIVERGENCE_DETECTED" | "INTEGRITY_VERIFICATION_FAILURE_DETECTED" | "TENANT_ISOLATION_BREACH_DETECTED" | "UNAUTHORIZED_LEARNING_DETECTED" | "UNAUTHORIZED_OPTIMIZATION_DETECTED" | "UNAUTHORIZED_RECOVERY_DETECTED" | "MONITORING_EVIDENCE_CORRUPTION_DETECTED" | "CONSTITUTIONAL_HEALTH_UNAVAILABLE" | "RUNTIME_VISIBILITY_MISSING" | "MONITORING_LINEAGE_INCOMPLETE";

export type RuntimeComplianceStatus = Readonly<{
  runtime_monitor_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  runtime_timestamp: "1970-01-01T00:00:00.000Z";
  monitored_domain: RuntimeMonitoringDomain;
  authority_status: "PASS" | "FAIL";
  policy_status: "PASS" | "FAIL";
  operator_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  execution_integrity: "PASS" | "FAIL";
  tenant_isolation: "PASS" | "FAIL";
  system_drift: RuntimeDriftLevel;
  constitution_health: ConstitutionalHealthState;
  confidence_score: number;
  overall_compliance: RuntimeComplianceState;
  recommendations: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  failure: RuntimeConstitutionalFailure | null;
  monitoring_only: true;
  passive_observer: true;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  runtime_intervention_authorized: false;
  background_process_authorized: false;
  integrity_hash: string;
}>;

export type RuntimeConstitutionHealthAssessment = Readonly<{
  health_id: string;
  authority_health: number;
  governance_health: number;
  policy_health: number;
  integrity_health: number;
  replay_health: number;
  isolation_health: number;
  confidence_health: number;
  drift_health: number;
  visibility_health: number;
  mission_health: number;
  overall_health_state: ConstitutionalHealthState;
  integrity_hash: string;
}>;

export type RuntimeMonitoringTimelineEntry = Readonly<{
  timeline_id: string;
  runtime_monitor_id: string;
  monitored_domain: RuntimeMonitoringDomain;
  health_state: ConstitutionalHealthState;
  compliance_state: RuntimeComplianceState;
  replay_checkpoint: string;
  integrity_hash: string;
}>;

export type RuntimeRiskIndicator = Readonly<{
  risk_id: string;
  risk_type: "AUTHORITY_RISK" | "GOVERNANCE_RISK" | "REPLAY_RISK" | "INTEGRITY_RISK" | "ISOLATION_RISK" | "CONSTITUTIONAL_RISK";
  risk_score: number;
  drift_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type RuntimeMonitoringLedgerRecord = Readonly<{
  monitoring_record_id: string;
  runtime_monitor_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  monitored_domain: RuntimeMonitoringDomain;
  health_state: ConstitutionalHealthState;
  compliance_state: RuntimeComplianceState;
  risk_score: number;
  drift_score: number;
  validation_reference: string;
  evidence_reference: string;
  lineage_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type RuntimeConstitutionalAuditRecord = Readonly<{
  audit_id: string;
  failure: RuntimeConstitutionalFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type RuntimeConstitutionalMonitoringRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  validation_repository_id: string;
  final_state: "RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE" | "RUNTIME_CONSTITUTIONAL_MONITORING_FAIL_CLOSED";
  statuses: readonly RuntimeComplianceStatus[];
  health: RuntimeConstitutionHealthAssessment;
  timeline: readonly RuntimeMonitoringTimelineEntry[];
  risks: readonly RuntimeRiskIndicator[];
  ledger: readonly RuntimeMonitoringLedgerRecord[];
  audit_records: readonly RuntimeConstitutionalAuditRecord[];
  failures: readonly RuntimeConstitutionalFailure[];
  monitoring_only: true;
  passive_observer: true;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  runtime_intervention_authorized: false;
  background_process_authorized: false;
  integrity_hash: string;
}>;

export type RuntimeConstitutionalMonitoringValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  passive_observer: true;
  monitoring_only: true;
  baseline_valid: boolean;
  deterministic_monitoring: boolean;
  replay_compatible: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  health_available: boolean;
  runtime_visibility_complete: boolean;
  fail_closed: boolean;
  failures: readonly RuntimeConstitutionalFailure[];
  validation_hash: string;
}>;

export type RuntimeConstitutionalMonitoringObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  status_count: number;
  timeline_count: number;
  risk_count: number;
  ledger_count: number;
  audit_count: number;
  failure_count: number;
  health_state: ConstitutionalHealthState;
  monitoring_only: true;
  passive_observer: true;
  runtime_intervention_authorized: false;
  integrity_hash: string;
}>;

export type RuntimeConstitutionalMonitoringInput = Readonly<{ scenario?: RuntimeConstitutionalScenario; baseline?: ConstitutionalBaselineContract; validationRepository?: ContinuousConstitutionalValidationRepository; repository?: RuntimeConstitutionalMonitoringRepository }>;

export type RuntimeConstitutionalMonitoringBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "runtime-constitutional-monitoring/v8ALT.10.3";
    final_state: "RUNTIME_CONSTITUTIONAL_MONITORING_READY";
    monitoring_domains: readonly RuntimeMonitoringDomain[];
    principles: readonly string[];
  }>;
  repository: RuntimeConstitutionalMonitoringRepository;
  validation: RuntimeConstitutionalMonitoringValidationResult;
  observability: RuntimeConstitutionalMonitoringObservabilitySurface;
}>;
