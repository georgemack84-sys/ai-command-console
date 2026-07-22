export type ProductionReadinessOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type QualificationLifecycleState = "REGISTERED" | "PREPARING" | "EVIDENCE_COLLECTION" | "QUALIFICATION_REVIEW" | "READY_FOR_PROMOTION" | "PROMOTION_APPROVED" | "DEPLOYMENT_PENDING" | "DEPLOYED" | "MONITORING" | "SUPERSEDED" | "ROLLED_BACK" | "ARCHIVED";
export type ProductionEnvironment = "SYNTHETIC" | "QUALIFICATION" | "PRE_PRODUCTION" | "PRODUCTION";
export type ProductionEvidenceType = "SYNTHETIC_CERTIFICATION" | "REPLAY_EVIDENCE" | "INTEGRITY_VERIFICATION" | "TENANT_ISOLATION_VALIDATION" | "BOUNDARY_VALIDATION" | "GOVERNANCE_APPROVAL" | "DEPENDENCY_VERIFICATION" | "ROLLBACK_VERIFICATION" | "OPERATIONAL_READINESS" | "RELEASE_APPROVAL";
export type ProductionAuthorityRole = "GOVERNANCE_AUTHORITY" | "OPERATOR_AUTHORITY" | "MISSION_CONTROL_ADVISOR" | "EMERGENCY_AUTHORITY" | "ESCALATION_AUTHORITY";
export type ProductionReadinessFailure = "PRODUCTION_CONTRACT_NOT_APPROVED" | "LIFECYCLE_NON_DETERMINISTIC" | "SCOPE_REGISTRY_INCOMPLETE" | "RELEASE_IDENTITIES_MUTABLE" | "PROMOTION_RULES_NOT_ENFORCED" | "PROMOTION_AUTHORITY_AMBIGUOUS" | "GOVERNANCE_APPROVAL_NOT_REQUIRED" | "ADVISORY_BOUNDARY_BREACH" | "PRODUCTION_EFFECT_BOUNDARY_NOT_ENFORCED" | "REQUIRED_EVIDENCE_UNDEFINED" | "MISSING_EVIDENCE_ALLOWED_PROMOTION" | "CERTIFICATION_INHERITANCE_NON_DETERMINISTIC" | "INVALID_INHERITANCE_NOT_BLOCKED" | "ROLLBACK_NOT_MANDATORY" | "ROLLBACK_REPLAY_NOT_REPRODUCIBLE" | "RELEASE_LINEAGE_LOST" | "PROMOTION_REPLAY_NON_DETERMINISTIC" | "AUDIT_TRAIL_MUTABLE" | "FAIL_CLOSED_NOT_ENFORCED" | "SYNTHETIC_CERTIFICATION_NOT_REQUIRED" | "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE" | "AUTHORITY_HIERARCHY_BREACH" | "PRODUCTION_GOVERNANCE_NON_DETERMINISTIC" | "FOUNDATION_NOT_READY" | "NON_CONSTITUTIONAL_READINESS_WARNING";
export type ProductionReadinessScenario = "BASELINE" | ProductionReadinessFailure;

export type ProductionReadinessInput = Readonly<{ scenario?: ProductionReadinessScenario; tenant_id?: string }>;

export type ProductionReadinessContract = Readonly<{
  contract_version: "production-readiness-foundation/v15.1";
  production_qualification_required: boolean;
  governance_immutable: boolean;
  replay_required: boolean;
  rollback_required: boolean;
  fail_closed: boolean;
  advisory_only: boolean;
  deployment_authority_implies_execution_authority: false;
  required_evidence: readonly ProductionEvidenceType[];
  authority_hierarchy: readonly ProductionAuthorityRole[];
  integrity_hash: string;
}>;

export type DeploymentQualificationLifecycle = Readonly<{
  lifecycle_id: string;
  states: readonly QualificationLifecycleState[];
  deterministic_transitions: boolean;
  skipped_states_allowed: false;
  rollback_preserves_history: boolean;
  supersession_preserves_prior_releases: boolean;
  every_transition_audited: boolean;
  integrity_hash: string;
}>;

export type ProductionScopeRegistry = Readonly<{
  scope_id: string;
  production_environments: readonly ProductionEnvironment[];
  deployment_regions: readonly string[];
  services: readonly string[];
  tenants: readonly string[];
  feature_scope: readonly string[];
  release_scope: readonly string[];
  supported_configurations: readonly string[];
  operational_boundaries: readonly string[];
  immutable_after_approval: boolean;
  requalification_required_for_changes: boolean;
  integrity_hash: string;
}>;

export type ProductionReleaseRecord = Readonly<{
  release_id: string;
  release_name: string;
  release_version: string;
  release_lineage: readonly string[];
  deployment_scope: string;
  certification_refs: readonly string[];
  synthetic_validation_refs: readonly string[];
  evidence_refs: readonly string[];
  rollback_plan_ref: string;
  approval_refs: readonly string[];
  deployment_constraints: readonly string[];
  creation_timestamp: string;
  integrity_hash: string;
}>;

export type EnvironmentPromotionRules = Readonly<{
  promotion_id: string;
  path: readonly ProductionEnvironment[];
  no_skipped_environments: boolean;
  evidence_completion_required: boolean;
  successful_certification_required: boolean;
  governance_approval_required: boolean;
  rollback_readiness_required: boolean;
  replayable: boolean;
  prior_environments_immutable: boolean;
  integrity_hash: string;
}>;

export type PromotionAuthorityModel = Readonly<{
  authority_id: string;
  governance_approves_policy: boolean;
  operators_approve_operational_promotion: boolean;
  mission_control_recommends_only: boolean;
  assessment_system_authorizes_deployment: false;
  delegation_bounded: boolean;
  authority_inheritance_deterministic: boolean;
  integrity_hash: string;
}>;

export type ProductionEvidenceRegistry = Readonly<{
  evidence_registry_id: string;
  required_evidence: readonly ProductionEvidenceType[];
  evidence_refs: readonly string[];
  missing_evidence_blocks_promotion: boolean;
  immutable: boolean;
  replayable: boolean;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type CertificationInheritanceRecord = Readonly<{
  inheritance_id: string;
  synthetic_certification_ref: string;
  dependency_inheritance_refs: readonly string[];
  evidence_inheritance_refs: readonly string[];
  supersession_inheritance_refs: readonly string[];
  qualification_inheritance_refs: readonly string[];
  only_certified_artifacts_inherit: boolean;
  preserves_lineage: boolean;
  never_overrides_certification: boolean;
  invalid_inheritance_blocked: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type RollbackReadinessRecord = Readonly<{
  rollback_plan_id: string;
  rollback_triggers: readonly string[];
  rollback_evidence_refs: readonly string[];
  rollback_owner: string;
  rollback_validated_before_promotion: boolean;
  replayable: boolean;
  immutable: boolean;
  evidence_preserved: boolean;
  integrity_hash: string;
}>;

export type ProductionBoundaryGovernance = Readonly<{
  boundary_id: string;
  execution_authority_protected: boolean;
  advisory_only_separation: boolean;
  operator_authority_preserved: boolean;
  tenant_isolation_preserved: boolean;
  audit_ownership_preserved: boolean;
  governance_ownership_preserved: boolean;
  production_effect_boundaries_enforced: boolean;
  boundary_violations_block_deployment: boolean;
  boundary_replay_required: boolean;
  integrity_hash: string;
}>;

export type ProductionReadinessReport = Readonly<{
  report_id: string;
  lifecycle_valid: boolean;
  promotion_rules_valid: boolean;
  authority_hierarchy_valid: boolean;
  rollback_ready: boolean;
  evidence_complete: boolean;
  boundary_enforced: boolean;
  certification_inheritance_valid: boolean;
  scope_registry_valid: boolean;
  release_identities_valid: boolean;
  replay_reproducible: boolean;
  integrity_hash: string;
}>;

export type ProductionReadinessCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionReadinessOutcome;
  passed: boolean;
  failure_reason: ProductionReadinessFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionReadinessResult = Readonly<{
  phase_version: "production-readiness-foundation/v15.1";
  phase_identifier: "ProductionReadinessFoundation";
  phase14_certification_ref: string;
  contract: ProductionReadinessContract;
  lifecycle: DeploymentQualificationLifecycle;
  scope_registry: ProductionScopeRegistry;
  release_record: ProductionReleaseRecord;
  promotion_rules: EnvironmentPromotionRules;
  authority_model: PromotionAuthorityModel;
  evidence_registry: ProductionEvidenceRegistry;
  certification_inheritance: CertificationInheritanceRecord;
  rollback: RollbackReadinessRecord;
  boundary_governance: ProductionBoundaryGovernance;
  readiness_report: ProductionReadinessReport;
  certification_tests: readonly ProductionReadinessCertificationTest[];
  failures: readonly ProductionReadinessFailure[];
  outcome: ProductionReadinessOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionReadinessValidation = Readonly<{
  valid: boolean;
  outcome: ProductionReadinessOutcome;
  contract_valid: boolean;
  lifecycle_valid: boolean;
  scope_valid: boolean;
  release_valid: boolean;
  promotion_valid: boolean;
  authority_valid: boolean;
  evidence_valid: boolean;
  inheritance_valid: boolean;
  rollback_valid: boolean;
  boundary_valid: boolean;
  readiness_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ProductionReadinessFailure[];
  integrity_hash: string;
}>;

export type ProductionReadinessBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-readiness-foundation/v15.1";
    upstream_phase: "phase14-certification-gate/v14.12";
    lifecycle: readonly QualificationLifecycleState[];
    promotion_path: readonly ProductionEnvironment[];
    required_evidence: readonly ProductionEvidenceType[];
    certification_outcomes: readonly ProductionReadinessOutcome[];
  }>;
  result: ProductionReadinessResult;
  validation: ProductionReadinessValidation;
}>;
