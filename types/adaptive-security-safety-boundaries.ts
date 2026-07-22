import type { AdaptiveIntelligenceLedgerResult } from "@/types/adaptive-intelligence-ledger";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveSecurityEventType =
  | "SAFETY_VALIDATION"
  | "HIDDEN_LEARNING_DETECTED"
  | "HIDDEN_MEMORY_DETECTED"
  | "UNAUTHORIZED_ADAPTATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "REPLAY_SUPPRESSION_DETECTED"
  | "LEDGER_TAMPERING_DETECTED"
  | "SELF_MODIFICATION_DETECTED"
  | "BOUNDARY_ALLOW"
  | "BOUNDARY_REJECT";

export type AdaptiveSecuritySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AdaptiveContainmentAction = "ALLOW_ADVISORY" | "REJECT_PROPOSAL" | "SUSPEND_ADAPTIVE_COMPONENT" | "ESCALATE_GOVERNANCE" | "NOTIFY_OPERATOR" | "INVALIDATE_CERTIFICATION" | "RECOMMEND_ROLLBACK" | "OPEN_FORENSIC_INVESTIGATION" | "ENFORCE_TENANT_ISOLATION";
export type AdaptiveSafetyValidationState = "PASS" | "FAIL";

export type AdaptiveSafetyRule =
  | "ADVISORY_ONLY_LEARNING"
  | "DETERMINISTIC_BEHAVIOR"
  | "MANDATORY_REPLAY"
  | "MANDATORY_GOVERNANCE_APPROVAL"
  | "MANDATORY_OPERATOR_APPROVAL"
  | "NO_AUTOMATIC_AUTHORITY_EXPANSION"
  | "NO_HIDDEN_ADAPTIVE_STATE"
  | "GOVERNED_REPLAYABLE_MEMORY"
  | "NO_CROSS_TENANT_LEARNING"
  | "NO_SELF_MODIFICATION";

export type AdaptiveSecurityCheck =
  | "SAFETY_POLICY_REGISTRY"
  | "BOUNDARY_ENFORCEMENT"
  | "HIDDEN_LEARNING_DETECTION"
  | "HIDDEN_MEMORY_DETECTION"
  | "UNAUTHORIZED_ADAPTATION_DETECTION"
  | "AUTHORITY_ESCALATION_PREVENTION"
  | "GOVERNANCE_SUPREMACY"
  | "REPLAY_ENFORCEMENT"
  | "LEDGER_INTEGRITY"
  | "TENANT_ISOLATION"
  | "SELF_MODIFICATION_PREVENTION"
  | "SECURITY_EVENT_LEDGER"
  | "DETERMINISTIC_REPLAY";

export type AdaptiveSecurityFailure =
  | "HIDDEN_LEARNING_DETECTED"
  | "HIDDEN_MEMORY_DETECTED"
  | "UNAUTHORIZED_ADAPTATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "REPLAY_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED"
  | "SELF_MODIFICATION_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "UNAUTHORIZED_BEHAVIORAL_CHANGE"
  | "HIDDEN_OPTIMIZATION"
  | "UNAUTHORIZED_CALIBRATION"
  | "SILENT_RECOMMENDATION_CHANGE"
  | "UNEXPLAINED_BEHAVIOR_DRIFT"
  | "UNDOCUMENTED_PARAMETER_EVOLUTION"
  | "MEMORY_NOT_REGISTERED"
  | "MEMORY_NOT_GOVERNED"
  | "MEMORY_NOT_REPLAYABLE"
  | "MEMORY_NOT_TENANT_ISOLATED"
  | "POLICY_CIRCUMVENTION"
  | "CERTIFICATION_BYPASS"
  | "CROSS_TENANT_CONTAMINATION"
  | "AUTONOMOUS_SELF_IMPROVEMENT"
  | "UNAUTHORIZED_OPTIMIZATION"
  | "SAFETY_POLICY_MISSING"
  | "SECURITY_LEDGER_NOT_APPEND_ONLY"
  | "SECURITY_REPLAY_MISMATCH"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_SECURITY_BEHAVIOR";

export type AdaptiveSecurityRecord = Readonly<{
  security_event_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_component: string;
  security_event_type: AdaptiveSecurityEventType;
  detection_source: string;
  policy_reference: string;
  violation_detected: boolean;
  severity: AdaptiveSecuritySeverity;
  containment_action: AdaptiveContainmentAction;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
}>;

export type AdaptiveSafetyPolicy = Readonly<{
  policy_id: string;
  protected_domain: string;
  allowed_behavior: readonly string[];
  prohibited_behavior: readonly string[];
  containment_actions: readonly AdaptiveContainmentAction[];
  replay_requirements: readonly string[];
  certification_refs: readonly string[];
  immutable_after_certification: boolean;
  integrity_hash: string;
}>;

export type AdaptiveSafetyPolicyRegistry = Readonly<{
  registry_id: string;
  policies: readonly AdaptiveSafetyPolicy[];
  active_rules: readonly AdaptiveSafetyRule[];
  certified: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type HiddenLearningDetection = Readonly<{
  detector_id: string;
  undocumented_learning: boolean;
  hidden_optimization: boolean;
  unauthorized_calibration: boolean;
  silent_recommendation_changes: boolean;
  unexplained_behavior_drift: boolean;
  undocumented_parameter_evolution: boolean;
  hidden_memory_creation: boolean;
  containment_triggered: boolean;
  integrity_hash: string;
}>;

export type HiddenMemoryDetection = Readonly<{
  detector_id: string;
  memory_registered: boolean;
  memory_governed: boolean;
  memory_replayable: boolean;
  memory_tenant_isolated: boolean;
  lifecycle_metadata_present: boolean;
  lineage_references_present: boolean;
  undocumented_memory_detected: boolean;
  integrity_hash: string;
}>;

export type UnauthorizedAdaptationDetection = Readonly<{
  detector_id: string;
  behavior_mutation: boolean;
  unauthorized_heuristics: boolean;
  hidden_prioritization_changes: boolean;
  confidence_manipulation: boolean;
  risk_manipulation: boolean;
  recommendation_mutation: boolean;
  simulation_alteration: boolean;
  policy_circumvention: boolean;
  rejected_before_execution: boolean;
  integrity_hash: string;
}>;

export type AdaptiveBoundaryEnforcement = Readonly<{
  enforcement_id: string;
  adaptive_capability_authorized: boolean;
  learning_registered: boolean;
  memory_registered: boolean;
  replay_references_complete: boolean;
  governance_approval_exists: boolean;
  authority_unchanged: boolean;
  tenant_isolation_preserved: boolean;
  integrity_hashes_valid: boolean;
  boundary_decision: "ALLOW" | "REJECT";
  integrity_hash: string;
}>;

export type AdaptiveSecurityLedgerRecord = Readonly<{
  record_id: string;
  security_event_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_component: string;
  event_type: AdaptiveSecurityEventType;
  violation_summary: string;
  severity: AdaptiveSecuritySeverity;
  containment_action: AdaptiveContainmentAction;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
}>;

export type AdaptiveSafetyReplay = Readonly<{
  replay_id: string;
  detected_threats: readonly AdaptiveSecurityFailure[];
  violated_policies: readonly string[];
  validation_results: readonly AdaptiveSafetyValidationState[];
  containment_actions: readonly AdaptiveContainmentAction[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  identical_security_outcome: boolean;
  identical_containment: boolean;
  identical_integrity_hashes: boolean;
  replay_result: AdaptiveSafetyValidationState;
  integrity_hash: string;
}>;

export type AdaptiveSecurityDashboard = Readonly<{
  dashboard_id: string;
  active_safety_policies: number;
  detected_threats: readonly AdaptiveSecurityFailure[];
  hidden_learning_events: number;
  hidden_memory_events: number;
  behavioral_drift_indicators: number;
  authority_violations: number;
  governance_bypass_attempts: number;
  replay_compliance: AdaptiveSafetyValidationState;
  containment_actions: readonly AdaptiveContainmentAction[];
  certification_status: AdaptiveSafetyValidationState;
  integrity_hash: string;
}>;

export type AdaptiveSafetyCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly AdaptiveSecurityCheck[];
  safety_rules_enforced: boolean;
  hidden_learning_blocked: boolean;
  hidden_memory_blocked: boolean;
  unauthorized_adaptation_blocked: boolean;
  authority_escalation_prevented: boolean;
  governance_supremacy_preserved: boolean;
  replay_enforced: boolean;
  ledger_integrity_protected: boolean;
  tenant_isolation_preserved: boolean;
  self_modification_prevented: boolean;
  immutable_audit_trail: boolean;
  failure_analysis: readonly AdaptiveSecurityFailure[];
  certification_decision: AdaptiveSafetyValidationState;
  integrity_hash: string;
}>;

export type AdaptiveSafetyValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  safety_policy_present: boolean;
  hidden_learning_absent: boolean;
  hidden_memory_absent: boolean;
  unauthorized_adaptation_absent: boolean;
  authority_escalation_absent: boolean;
  governance_bypass_absent: boolean;
  replay_references_present: boolean;
  tenant_isolated: boolean;
  ledger_integrity_preserved: boolean;
  self_modification_absent: boolean;
  integrity_verified: boolean;
  security_ledger_immutable: boolean;
  deterministic_replay: boolean;
  authorization_valid: boolean;
  failures: readonly AdaptiveSecurityFailure[];
  integrity_hash: string;
}>;

export type AdaptiveSecuritySafetyBoundariesInput = Readonly<{
  adaptive_ledger?: AdaptiveIntelligenceLedgerResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "HIDDEN_LEARNING"
    | "HIDDEN_MEMORY"
    | "UNAUTHORIZED_ADAPTATION"
    | "AUTHORITY_ESCALATION"
    | "GOVERNANCE_BYPASS"
    | "MISSING_REPLAY_REFS"
    | "TENANT_VIOLATION"
    | "LEDGER_MODIFICATION"
    | "SELF_MODIFICATION"
    | "HASH_MISMATCH"
    | "HIDDEN_OPTIMIZATION"
    | "UNAUTHORIZED_CALIBRATION"
    | "SILENT_RECOMMENDATION_CHANGE"
    | "BEHAVIOR_DRIFT"
    | "PARAMETER_EVOLUTION"
    | "MEMORY_NOT_REGISTERED"
    | "MEMORY_NOT_GOVERNED"
    | "MEMORY_NOT_REPLAYABLE"
    | "MEMORY_NOT_TENANT_ISOLATED"
    | "POLICY_CIRCUMVENTION"
    | "CERTIFICATION_BYPASS"
    | "CROSS_TENANT_CONTAMINATION"
    | "AUTONOMOUS_SELF_IMPROVEMENT"
    | "UNAUTHORIZED_OPTIMIZATION"
    | "MISSING_POLICY"
    | "SECURITY_LEDGER_MUTATION"
    | "SECURITY_REPLAY_MISMATCH"
    | "FAIL_OPEN";
}>;

export type AdaptiveSecuritySafetyBoundariesResult = Readonly<{
  security_boundary_version: "adaptive-security-safety-boundaries/v1";
  adaptive_ledger: AdaptiveIntelligenceLedgerResult;
  policy_registry: AdaptiveSafetyPolicyRegistry;
  security_record: AdaptiveSecurityRecord;
  hidden_learning_detection: HiddenLearningDetection;
  hidden_memory_detection: HiddenMemoryDetection;
  unauthorized_adaptation_detection: UnauthorizedAdaptationDetection;
  boundary_enforcement: AdaptiveBoundaryEnforcement;
  security_ledger: readonly AdaptiveSecurityLedgerRecord[];
  safety_replay: AdaptiveSafetyReplay;
  dashboard: AdaptiveSecurityDashboard;
  certification_report: AdaptiveSafetyCertificationReport;
  validation: AdaptiveSafetyValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  fail_closed: true;
  permits_adaptation: boolean;
  permits_execution: false;
  permits_self_modification: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveSecuritySafetyBoundariesFoundation = Readonly<{
  security_boundary_version: "adaptive-security-safety-boundaries/v1";
  checks: readonly AdaptiveSecurityCheck[];
  safety_rules: readonly AdaptiveSafetyRule[];
  result: AdaptiveSecuritySafetyBoundariesResult;
}>;
