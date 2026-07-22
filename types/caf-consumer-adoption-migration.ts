export type MigrationState = "PLANNED" | "READINESS_IN_PROGRESS" | "READY_FOR_APPROVAL" | "APPROVED" | "ROLLOUT_IN_PROGRESS" | "ROLLOUT_PAUSED" | "TRANSITION_IN_PROGRESS" | "STABILIZING" | "COMPLETED" | "ROLLED_BACK" | "CANCELLED";
export type CompatibilityStatus = "UNKNOWN" | "COMPATIBLE" | "COMPATIBLE_WITH_CONDITIONS" | "INCOMPATIBLE" | "REQUIRES_UPGRADE" | "REQUIRES_CONFIGURATION" | "REQUIRES_GOVERNANCE_REVIEW";
export type AdoptionDecisionType = "APPROVE" | "APPROVE_WITH_CONDITIONS" | "DEFER" | "REJECT" | "REQUIRES_GOVERNANCE_REVIEW";
export type RolloutStrategy = "PILOT" | "CANARY" | "PHASED" | "DEPARTMENTAL" | "REGIONAL" | "TENANT_BY_TENANT" | "FULL_DEPLOYMENT";
export type ConsumerAdoptionCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type ConsumerAdoptionMigrationFailure =
  | "P3_15_PLATFORM_CERTIFICATE_INVALID"
  | "P3_16_SDK_INTERFACE_INVALID"
  | "PLATFORM_CERTIFICATION_DUPLICATED"
  | "SDK_CERTIFICATION_DUPLICATED"
  | "RUNTIME_DEPLOYMENT_ATTEMPTED"
  | "OPERATIONAL_GOVERNANCE_DUPLICATED"
  | "PLATFORM_ASSURANCE_DUPLICATED"
  | "MIGRATION_PLAN_MISSING"
  | "MIGRATION_LIFECYCLE_BYPASSED"
  | "READINESS_ASSESSMENT_FAILED"
  | "COMPATIBILITY_NOT_VERIFIED"
  | "INCOMPATIBLE_CONSUMER_APPROVED"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "ROLLOUT_NOT_AUTHORIZED"
  | "ROLLOUT_SEQUENCE_NON_DETERMINISTIC"
  | "TRANSITION_CONTINUITY_LOST"
  | "ROLLBACK_GOVERNANCE_MISSING"
  | "MIGRATION_EVIDENCE_MISSING"
  | "MIGRATION_EVIDENCE_MUTABLE"
  | "MIGRATION_LINEAGE_INCOMPLETE"
  | "ADOPTION_REPORT_MISSING"
  | "UNCERTIFIED_PLATFORM_MIGRATION_ALLOWED"
  | "UNCERTIFIED_SDK_MIGRATION_ALLOWED"
  | "CONSTITUTIONAL_GOVERNANCE_BYPASSED"
  | "CERTIFICATION_PRUNED";

export type ConsumerAdoptionMigrationScenario = "BASELINE" | ConsumerAdoptionMigrationFailure;
export type ConsumerAdoptionMigrationInput = Readonly<{ scenario?: ConsumerAdoptionMigrationScenario; tenant_id?: string }>;

export type MigrationPlan = Readonly<{
  plan_id: string;
  strategy: RolloutStrategy;
  sequencing: readonly MigrationState[];
  dependency_plan_refs: readonly string[];
  rollout_waves: readonly string[];
  rollback_prepared: boolean;
  readiness_validation_ref: string;
  approved: boolean;
  integrity_hash: string;
}>;

export type ConsumerReadinessAssessment = Readonly<{
  assessment_id: string;
  platform_compatible: boolean;
  infrastructure_ready: boolean;
  governance_ready: boolean;
  operational_ready: boolean;
  security_ready: boolean;
  dependency_ready: boolean;
  result: "READY" | "NOT_READY";
  integrity_hash: string;
}>;

export type MigrationCompatibilityResult = Readonly<{
  compatibility_id: string;
  api_status: CompatibilityStatus;
  sdk_status: CompatibilityStatus;
  behavioral_status: CompatibilityStatus;
  governance_status: CompatibilityStatus;
  policy_status: CompatibilityStatus;
  version_status: CompatibilityStatus;
  verified_before_rollout: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type AdoptionGovernanceDecision = Readonly<{
  decision_id: string;
  approval_refs: readonly string[];
  governance_checkpoint_refs: readonly string[];
  rollout_authorization_ref: string;
  constitutional_compliance: boolean;
  policy_enforced: boolean;
  decision: AdoptionDecisionType;
  integrity_hash: string;
}>;

export type RolloutStatus = Readonly<{
  rollout_id: string;
  strategy: RolloutStrategy;
  deployment_waves: readonly string[];
  checkpoints: readonly string[];
  advancement_criteria: readonly string[];
  rollback_triggers: readonly string[];
  authorized: boolean;
  deterministic_sequence: boolean;
  status: "AUTHORIZED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "ROLLED_BACK";
  integrity_hash: string;
}>;

export type TransitionRecord = Readonly<{
  transition_id: string;
  execution_ref: string;
  coexistence_period_ref: string;
  cutover_plan_ref: string;
  rollback_readiness_ref: string;
  operational_transition_ref: string;
  stabilization_ref: string;
  operational_continuity_preserved: boolean;
  integrity_hash: string;
}>;

export type MigrationEvidence = Readonly<{
  evidence_id: string;
  migration_plan_refs: readonly string[];
  readiness_refs: readonly string[];
  compatibility_refs: readonly string[];
  approval_refs: readonly string[];
  rollout_checkpoint_refs: readonly string[];
  transition_milestone_refs: readonly string[];
  rollback_refs: readonly string[];
  completion_verification_refs: readonly string[];
  lineage_refs: readonly string[];
  timestamps: readonly string[];
  responsible_authorities: readonly string[];
  immutable: boolean;
  replayable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type AdoptionReport = Readonly<{
  report_id: string;
  migration_progress: string;
  rollout_summary: string;
  adoption_metrics: readonly string[];
  compatibility_report_ref: string;
  governance_report_ref: string;
  executive_summary: string;
  generated: boolean;
  integrity_hash: string;
}>;

export type ConsumerAdoptionMigrationCertification = Readonly<{
  certification_id: string;
  outcome: ConsumerAdoptionCertificationOutcome;
  certified: boolean;
  certified_platform_only: boolean;
  certified_sdks_only: boolean;
  migration_planning_complete: boolean;
  readiness_verified: boolean;
  compatibility_verified: boolean;
  governance_approval_complete: boolean;
  rollout_governed: boolean;
  transition_continuity_preserved: boolean;
  rollback_validated: boolean;
  evidence_complete: boolean;
  reporting_complete: boolean;
  lifecycle_deterministic: boolean;
  constitutional_governance_enforced: boolean;
  failures: readonly ConsumerAdoptionMigrationFailure[];
  integrity_hash: string;
}>;

export type ConsumerAdoptionMigrationResult = Readonly<{
  phase_version: "caf-consumer-adoption-migration/v3.17";
  phase_identifier: "CafConsumerAdoptionMigration";
  platform_certification_ref: "caf-platform-certification/v3.15";
  sdk_interface_qualification_ref: "caf-sdk-interface-qualification/v3.16";
  migration_plan: MigrationPlan;
  readiness_assessment: ConsumerReadinessAssessment;
  compatibility_result: MigrationCompatibilityResult;
  adoption_decision: AdoptionGovernanceDecision;
  rollout_status: RolloutStatus;
  transition_record: TransitionRecord;
  migration_evidence: MigrationEvidence;
  adoption_report: AdoptionReport;
  certification: ConsumerAdoptionMigrationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConsumerAdoptionMigrationValidation = Readonly<{
  valid: boolean;
  outcome: ConsumerAdoptionCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  plan_valid: boolean;
  readiness_valid: boolean;
  compatibility_valid: boolean;
  governance_valid: boolean;
  rollout_valid: boolean;
  transition_valid: boolean;
  evidence_valid: boolean;
  report_valid: boolean;
  certification_valid: boolean;
  failures: readonly ConsumerAdoptionMigrationFailure[];
  integrity_hash: string;
}>;

export type ConsumerAdoptionMigrationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-consumer-adoption-migration/v3.17";
    owns_migration_planning: true;
    owns_adoption_governance: true;
    owns_rollout_governance: true;
    owns_compatibility_validation: true;
    owns_transition_management: true;
    owns_migration_evidence: true;
    owns_platform_certification: false;
    owns_sdk_certification: false;
    owns_runtime_deployment: false;
    owns_operational_governance: false;
    owns_platform_assurance: false;
  }>;
  result: ConsumerAdoptionMigrationResult;
  validation: ConsumerAdoptionMigrationValidation;
}>;
