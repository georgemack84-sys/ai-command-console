import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";
import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";

export type ConstitutionalViolationDomain = "AUTHORITY_ESCALATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "HIDDEN_EXECUTION" | "REPLAY_MISMATCH" | "LEARNING_OUTSIDE_POLICY" | "UNAUTHORIZED_OPTIMIZATION" | "RUNTIME_DRIFT" | "INTEGRITY_DEGRADATION" | "POLICY_VIOLATION" | "TENANT_LEAKAGE";
export type ConstitutionalViolationSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "BLOCKING";
export type ConstitutionalViolationState = "DETECTED" | "VERIFIED" | "ESCALATED" | "CONTAINED" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type ConstitutionalDriftClassification = "Stable" | "Emerging" | "Moderate" | "Severe" | "Critical";
export type ConstitutionalViolationScenario = "BASELINE" | ConstitutionalViolationDomain | "OPERATOR_AUTHORITY_OVERRIDE" | "REPLAY_NONDETERMINISM" | "UNAUTHORIZED_RECOVERY" | "CONSTITUTIONAL_MUTATION" | "GOVERNANCE_MUTATION" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "EVIDENCE_TAMPERING" | "MONITORING_FAILURE";
export type ConstitutionalViolationFailure = "AUTHORITY_ESCALATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_BYPASS_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "LEARNING_OUTSIDE_POLICY_DETECTED" | "UNAUTHORIZED_OPTIMIZATION_DETECTED" | "RUNTIME_DRIFT_DETECTED" | "INTEGRITY_DEGRADATION_DETECTED" | "POLICY_VIOLATION_DETECTED" | "TENANT_LEAKAGE_DETECTED" | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED" | "REPLAY_NONDETERMINISM_DETECTED" | "UNAUTHORIZED_RECOVERY_DETECTED" | "CONSTITUTIONAL_MUTATION_DETECTED" | "GOVERNANCE_MUTATION_DETECTED" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "EVIDENCE_TAMPERING_DETECTED" | "MONITORING_FAILURE_DETECTED";

export type ConstitutionalViolationRecord = Readonly<{
  violation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  violation_timestamp: "1970-01-01T00:00:00.000Z";
  violation_category: ConstitutionalViolationDomain;
  detected_component: string;
  affected_subsystem: string;
  severity: ConstitutionalViolationSeverity;
  constitutional_rule: string;
  policy_reference: string;
  authority_reference: string;
  governance_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  risk_score: number;
  recommended_action: string;
  validation_status: "NO_VIOLATION" | "VERIFIED_VIOLATION" | "FAIL_CLOSED_REQUIRED";
  failure: ConstitutionalViolationFailure | null;
  fail_closed_required: boolean;
  advisory_only: true;
  detection_only: true;
  enforcement_authorized: false;
  autonomous_remediation_authorized: false;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalViolationEvidencePackage = Readonly<{
  evidence_package_id: string;
  violation_id: string;
  violation_summary: string;
  constitutional_rule_violated: string;
  triggering_event: string;
  execution_context: string;
  mission_context: string;
  governance_evaluation: "PASS" | "FAIL";
  authority_evaluation: "PASS" | "FAIL";
  replay_snapshot: string;
  evidence_chain: readonly string[];
  integrity_verification: "VERIFIED" | "FAILED";
  confidence_assessment: number;
  forensic_references: readonly string[];
  immutable: true;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type ConstitutionalSeverityClassification = Readonly<{
  classification_id: string;
  violation_id: string;
  violation_category: ConstitutionalViolationDomain;
  severity: ConstitutionalViolationSeverity;
  drift_classification: ConstitutionalDriftClassification;
  response_priority: "RECORD" | "MONITOR" | "GOVERNANCE_REVIEW" | "OPERATOR_NOTIFICATION" | "FAIL_CLOSED_REVIEW" | "MISSION_BLOCK_REVIEW";
  reproducible: true;
  integrity_hash: string;
}>;

export type ConstitutionalViolationLedgerRecord = Readonly<{
  violation_record_id: string;
  violation_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  severity: ConstitutionalViolationSeverity;
  violation_state: ConstitutionalViolationState;
  constitutional_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  resolution_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalViolationAlert = Readonly<{
  alert_id: string;
  violation_id: string;
  severity: ConstitutionalViolationSeverity;
  notified_targets: readonly ("CONSTITUTIONAL_GOVERNANCE_ENGINE" | "RUNTIME_ASSURANCE_ENGINE" | "MISSION_CONTROL_DASHBOARD" | "OPERATOR_CONSOLE" | "CERTIFICATION_ENGINE" | "REPLAY_SYSTEM" | "AUDIT_LEDGER")[];
  violation_summary: string;
  constitutional_references: readonly string[];
  evidence_package_id: string;
  replay_reference: string;
  recommended_governance_actions: readonly string[];
  advisory_only: true;
  autonomous_response_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalViolationDetectionRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  validation_repository_id: string;
  runtime_monitoring_repository_id: string;
  final_state: "CONSTITUTIONAL_VIOLATION_DETECTION_COMPLETE" | "CONSTITUTIONAL_VIOLATION_DETECTION_FAIL_CLOSED";
  violations: readonly ConstitutionalViolationRecord[];
  classifications: readonly ConstitutionalSeverityClassification[];
  evidence_packages: readonly ConstitutionalViolationEvidencePackage[];
  ledger: readonly ConstitutionalViolationLedgerRecord[];
  alerts: readonly ConstitutionalViolationAlert[];
  failures: readonly ConstitutionalViolationFailure[];
  advisory_only: true;
  detection_only: true;
  enforcement_authorized: false;
  autonomous_remediation_authorized: false;
  execution_modification_authorized: false;
  authority_grant_authorized: false;
  governance_override_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalViolationDetectionValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  deterministic_detection: boolean;
  evidence_complete: boolean;
  replay_compatible: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  detection_only: true;
  fail_closed_ready: boolean;
  no_autonomous_remediation: boolean;
  no_enforcement_authority: boolean;
  failures: readonly ConstitutionalViolationFailure[];
  validation_hash: string;
}>;

export type ConstitutionalViolationDetectionObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  violation_count: number;
  classification_count: number;
  evidence_count: number;
  ledger_count: number;
  alert_count: number;
  failure_count: number;
  critical_or_blocking_count: number;
  advisory_only: true;
  detection_only: true;
  enforcement_authorized: false;
  autonomous_remediation_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalViolationDetectionInput = Readonly<{ scenario?: ConstitutionalViolationScenario; baseline?: ConstitutionalBaselineContract; validationRepository?: ContinuousConstitutionalValidationRepository; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; repository?: ConstitutionalViolationDetectionRepository }>;

export type ConstitutionalViolationDetectionBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-violation-detection/v8ALT.10.4";
    final_state: "CONSTITUTIONAL_VIOLATION_DETECTION_READY";
    detection_domains: readonly ConstitutionalViolationDomain[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalViolationDetectionRepository;
  validation: ConstitutionalViolationDetectionValidationResult;
  observability: ConstitutionalViolationDetectionObservabilitySurface;
}>;
