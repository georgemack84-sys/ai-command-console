export type SafetyGateOutcome = "SAFE" | "SAFE_WITH_WARNINGS" | "REQUIRES_REVIEW" | "CONTAIN" | "BLOCK" | "FAIL_CLOSED";
export type InterventionType = "ADVISORY" | "REQUIRE_APPROVAL" | "PAUSE" | "ESCALATE" | "STOP" | "FAIL_CLOSED";
export type ContainmentLevel = "NONE" | "LOCAL" | "CAPABILITY" | "AGENT" | "TENANT" | "GLOBAL";
export type AutomationEligibilityDecision = "ELIGIBLE" | "ELIGIBLE_WITH_APPROVAL" | "ELIGIBLE_WITH_CONSTRAINTS" | "NOT_ELIGIBLE" | "FAIL_CLOSED";
export type SafetyCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type SafetyWarningSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SafetyBehavioralConstraintFailure =
  | "P3_3_RUNTIME_INVALID"
  | "P3_4_MEMORY_GOVERNANCE_INVALID"
  | "P3_5_PLANNING_INVALID"
  | "P3_6_COLLABORATION_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "SAFETY_ARCHITECTURE_INCOMPLETE"
  | "BEHAVIORAL_CONSTRAINT_MISSING"
  | "SAFETY_GATE_NON_DETERMINISTIC"
  | "ENFORCEMENT_NON_DETERMINISTIC"
  | "INTERVENTION_NON_REPRODUCIBLE"
  | "CONTAINMENT_NON_DETERMINISTIC"
  | "SAFETY_WARNING_REGISTRY_INCOMPLETE"
  | "WARNING_ROUTING_NON_DETERMINISTIC"
  | "AUTOMATION_ELIGIBILITY_NON_DETERMINISTIC"
  | "UNSAFE_AUTOMATION_ELIGIBLE"
  | "EXCEPTION_BYPASSES_AUTHORITY"
  | "EXCEPTION_EVIDENCE_MISSING"
  | "EXCEPTION_EXPIRATION_MISSING"
  | "SAFETY_EVIDENCE_MISSING"
  | "OBSERVABILITY_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "CERTIFICATION_PRUNED";

export type SafetyBehavioralConstraintScenario = "BASELINE" | SafetyBehavioralConstraintFailure;
export type SafetyBehavioralConstraintInput = Readonly<{ scenario?: SafetyBehavioralConstraintScenario; tenant_id?: string }>;

export type BehavioralConstraint = Readonly<{
  constraint_id: string;
  boundary: "OPERATIONAL" | "GOVERNANCE" | "POLICY" | "SAFETY" | "RUNTIME" | "MEMORY" | "COLLABORATION";
  prohibited_behaviors: readonly string[];
  escalation_threshold: string;
  deterministic: boolean;
  enforceable: boolean;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type SafetyEvaluation = Readonly<{
  evaluation_id: string;
  behavior_request_ref: string;
  constraint_refs: readonly string[];
  safety_rule_refs: readonly string[];
  risk_assessment_ref: string;
  deterministic: boolean;
  constraints_complete: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type SafetyWarning = Readonly<{
  warning_id: string;
  warning_class:
    | "SAFETY_POLICY_WARNING"
    | "UNSAFE_BEHAVIOR_WARNING"
    | "CONTAINMENT_WARNING"
    | "INTERVENTION_WARNING"
    | "AUTOMATION_WARNING"
    | "OPERATOR_WARNING"
    | "GOVERNANCE_WARNING";
  severity: SafetyWarningSeverity;
  route: string;
  routed: boolean;
  replayable: boolean;
  evidence_ref: string;
  integrity_hash: string;
}>;

export type AutomationEligibility = Readonly<{
  eligibility_id: string;
  decision: AutomationEligibilityDecision;
  confidence_threshold_ref: string;
  governance_requirement_refs: readonly string[];
  operator_requirement_refs: readonly string[];
  policy_requirement_refs: readonly string[];
  runtime_requirement_refs: readonly string[];
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type InterventionDecision = Readonly<{
  intervention_id: string;
  type: InterventionType;
  recommendation: string;
  escalation_refs: readonly string[];
  operator_notification_refs: readonly string[];
  approval_request_refs: readonly string[];
  reproducible: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ContainmentDecision = Readonly<{
  containment_id: string;
  level: ContainmentLevel;
  isolated_scopes: readonly string[];
  recovery_ref: string;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type SafetyExceptionGovernance = Readonly<{
  exception_registry_id: string;
  exception_request_refs: readonly string[];
  approval_refs: readonly string[];
  expiration_ref: string;
  bypasses_constitutional_authority: boolean;
  auditable: boolean;
  replayable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type SafetyGateDecision = Readonly<{
  safety_gate_id: string;
  behavior_request_ref: string;
  safety_evaluation_ref: string;
  automation_eligibility: AutomationEligibilityDecision;
  intervention_type: InterventionType;
  containment_level: ContainmentLevel;
  outcome: SafetyGateOutcome;
  fail_closed_enforced: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type SafetyEvidenceLedger = Readonly<{
  ledger_id: string;
  evidence_refs: readonly string[];
  immutable: boolean;
  lineage_complete: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SafetyObservability = Readonly<{
  dashboard_id: string;
  metrics: readonly string[];
  complete: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SafetyReplayValidation = Readonly<{
  replay_validation_id: string;
  safety_replayed: boolean;
  enforcement_replayed: boolean;
  intervention_replayed: boolean;
  containment_replayed: boolean;
  automation_replayed: boolean;
  exception_replayed: boolean;
  evidence_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SafetyBehavioralConstraintCertification = Readonly<{
  certification_id: string;
  outcome: SafetyCertificationOutcome;
  certified: boolean;
  safety_architecture_complete: boolean;
  behavioral_constraints_complete: boolean;
  safety_gate_deterministic: boolean;
  enforcement_deterministic: boolean;
  intervention_reproducible: boolean;
  containment_deterministic: boolean;
  warning_registry_complete: boolean;
  automation_eligibility_deterministic: boolean;
  exception_governance_controlled: boolean;
  safety_evidence_immutable: boolean;
  observability_complete: boolean;
  replay_reproducible: boolean;
  fail_closed_enforced: boolean;
  failures: readonly SafetyBehavioralConstraintFailure[];
  integrity_hash: string;
}>;

export type SafetyBehavioralConstraintResult = Readonly<{
  phase_version: "caf-safety-behavioral-constraints/v3.8";
  phase_identifier: "CafSafetyBehavioralConstraints";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  memory_knowledge_ref: "caf-memory-knowledge/v3.4";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  collaboration_federation_ref: "caf-collaboration-federation/v3.6";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  constraints: readonly BehavioralConstraint[];
  safety_evaluation: SafetyEvaluation;
  warnings: readonly SafetyWarning[];
  automation_eligibility: AutomationEligibility;
  intervention_decision: InterventionDecision;
  containment_decision: ContainmentDecision;
  exception_governance: SafetyExceptionGovernance;
  safety_gate: SafetyGateDecision;
  evidence_ledger: SafetyEvidenceLedger;
  observability: SafetyObservability;
  replay_validation: SafetyReplayValidation;
  certification: SafetyBehavioralConstraintCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SafetyBehavioralConstraintValidation = Readonly<{
  valid: boolean;
  outcome: SafetyCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  constraints_valid: boolean;
  safety_gate_valid: boolean;
  intervention_valid: boolean;
  containment_valid: boolean;
  automation_valid: boolean;
  exceptions_valid: boolean;
  evidence_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly SafetyBehavioralConstraintFailure[];
  integrity_hash: string;
}>;

export type SafetyBehavioralConstraintBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-safety-behavioral-constraints/v3.8";
    owns_safety_gate: true;
    owns_behavioral_constraints: true;
    owns_intervention: true;
    owns_containment: true;
    owns_automation_eligibility: true;
    owns_exception_governance: true;
    owns_constitutional_authority: false;
    owns_policy_definition: false;
    fail_closed_required: true;
  }>;
  result: SafetyBehavioralConstraintResult;
  validation: SafetyBehavioralConstraintValidation;
}>;
