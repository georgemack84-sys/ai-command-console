export type EnvironmentQualificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type EnvironmentQualificationResultState = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "REQUALIFICATION_REQUIRED" | "FAILED";
export type ProductionEnvironmentLifecycleState = "REGISTERED" | "DISCOVERED" | "BASELINE_CAPTURED" | "VALIDATING" | "QUALIFIED" | "ATTESTED" | "ACTIVE" | "MONITORED" | "REQUALIFICATION_REQUIRED" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type DriftCategory = "NONE" | "AUTHORIZED" | "UNAUTHORIZED" | "SECURITY_CRITICAL" | "GOVERNANCE_CRITICAL";
export type ContinuousQualificationResponse = "CONTINUE_QUALIFICATION" | "REQUIRE_REQUALIFICATION" | "SUSPEND_QUALIFICATION" | "BLOCK_DEPLOYMENT" | "ESCALATE_GOVERNANCE";
export type ProductionEnvironmentFailure = "REGISTRY_INCOMPLETE" | "ENVIRONMENT_IDENTITIES_NOT_UNIQUE" | "ENVIRONMENT_VERSIONS_UNGOVERNED" | "IDENTITY_VERSION_INVALID" | "INFRASTRUCTURE_INTEGRITY_FAILED" | "NETWORK_BOUNDARIES_INVALID" | "SECRETS_CONFIGURATION_INVALID" | "STORAGE_ISOLATION_FAILED" | "POLICY_DEPLOYMENT_INVALID" | "OBSERVABILITY_COVERAGE_INCOMPLETE" | "TENANT_ISOLATION_CONTROLS_INVALID" | "CONFIGURATION_NOT_REPRODUCIBLE" | "DRIFT_NOT_DETECTABLE" | "UNAUTHORIZED_DRIFT_NOT_INVALIDATING" | "ATTESTATION_NOT_GENERATED" | "ATTESTATION_NOT_VERIFIABLE" | "QUALIFICATION_EVIDENCE_MUTABLE" | "ENVIRONMENT_LINEAGE_LOST" | "CONTINUOUS_QUALIFICATION_INOPERABLE" | "REQUALIFICATION_NON_DETERMINISTIC" | "UNAUTHORIZED_ENVIRONMENTS_NOT_BLOCKED" | "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE" | "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE" | "GOVERNANCE_ENFORCEMENT_NON_DETERMINISTIC" | "PHASE14_ENVIRONMENT_MODEL_NONCONFORMANT" | "PRODUCTION_READINESS_REQUIREMENTS_UNSATISFIED" | "NON_CONSTITUTIONAL_ENVIRONMENT_WARNING";
export type ProductionEnvironmentScenario = "BASELINE" | ProductionEnvironmentFailure;

export type ProductionEnvironmentQualificationInput = Readonly<{ scenario?: ProductionEnvironmentScenario; tenant_id?: string }>;

export type ProductionEnvironmentContract = Readonly<{
  contract_version: "production-environment-qualification/v15.3";
  lifecycle: readonly ProductionEnvironmentLifecycleState[];
  qualification_precedes_deployment: boolean;
  immutable_environment_identity: boolean;
  synthetic_equivalence_required: boolean;
  drift_invalidates_qualification: boolean;
  governance_required: boolean;
  replay_required: boolean;
  integrity_hash: string;
}>;

export type ProductionEnvironmentRecord = Readonly<{
  environment_id: string;
  environment_version: string;
  environment_name: string;
  provider: "AWS";
  region: string;
  environment_class: "PRODUCTION";
  network_boundary_refs: readonly string[];
  storage_refs: readonly string[];
  observability_refs: readonly string[];
  qualification_status: EnvironmentQualificationResultState;
  attestation_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type EnvironmentVersionGovernance = Readonly<{
  governance_id: string;
  immutable_identity: boolean;
  configuration_revisions_create_versions: boolean;
  qualification_references_specific_version: boolean;
  deployments_reference_qualified_versions_only: boolean;
  version_lineage_complete: boolean;
  supersession_chain_preserved: boolean;
  integrity_hash: string;
}>;

export type EnvironmentQualificationRecord = Readonly<{
  qualification_id: string;
  environment_id: string;
  environment_version: string;
  result: EnvironmentQualificationResultState;
  infrastructure_consistent: boolean;
  required_services_present: boolean;
  configuration_complete: boolean;
  security_controls_valid: boolean;
  governance_controls_valid: boolean;
  deployment_ready: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type InfrastructureIntegrityRecord = Readonly<{
  integrity_id: string;
  compute_verified: boolean;
  network_boundaries_verified: boolean;
  storage_isolation_verified: boolean;
  provisioning_verified: boolean;
  iam_configuration_verified: boolean;
  secrets_configuration_verified: boolean;
  encryption_verified: boolean;
  platform_services_verified: boolean;
  unauthorized_resources_blocked: boolean;
  integrity_hash: string;
}>;

export type ConfigurationDriftRecord = Readonly<{
  drift_id: string;
  category: DriftCategory;
  configuration_hashes_verified: boolean;
  deployment_configuration_verified: boolean;
  runtime_settings_verified: boolean;
  policy_deployment_verified: boolean;
  secrets_configuration_verified: boolean;
  network_policy_verified: boolean;
  infrastructure_policy_verified: boolean;
  unauthorized_drift_invalidates_qualification: boolean;
  critical_drift_blocks_deployment: boolean;
  historical_drift_immutable: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationQualification = Readonly<{
  qualification_id: string;
  identity_isolation: boolean;
  storage_isolation: boolean;
  network_isolation: boolean;
  secrets_isolation: boolean;
  policy_isolation: boolean;
  telemetry_isolation: boolean;
  replay_isolation: boolean;
  cross_tenant_access_impossible: boolean;
  violations_detectable: boolean;
  integrity_hash: string;
}>;

export type ObservabilityQualification = Readonly<{
  qualification_id: string;
  metrics_coverage: boolean;
  logging_coverage: boolean;
  tracing_coverage: boolean;
  replay_capture: boolean;
  alert_coverage: boolean;
  integrity_telemetry: boolean;
  qualification_telemetry: boolean;
  telemetry_deterministic: boolean;
  integrity_hash: string;
}>;

export type EnvironmentAttestationRecord = Readonly<{
  attestation_id: string;
  environment_id: string;
  environment_version: string;
  qualification_result: EnvironmentQualificationResultState;
  validator_versions: readonly string[];
  infrastructure_hashes: readonly string[];
  configuration_hashes: readonly string[];
  evidence_refs: readonly string[];
  signer: string;
  timestamp: string;
  cryptographically_verifiable: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ContinuousEnvironmentQualification = Readonly<{
  monitor_id: string;
  monitored_controls: readonly string[];
  response: ContinuousQualificationResponse;
  continuous_monitoring: boolean;
  requalification_deterministic: boolean;
  drift_handled_automatically: boolean;
  unauthorized_environments_blocked: boolean;
  integrity_hash: string;
}>;

export type EnvironmentLifecycleGovernance = Readonly<{
  lifecycle_id: string;
  states: readonly ProductionEnvironmentLifecycleState[];
  historical_environments_immutable: boolean;
  supersession_preserves_lineage: boolean;
  retired_environments_replayable: boolean;
  replay_reproducible: boolean;
  integrity_hash: string;
}>;

export type ProductionEnvironmentCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: EnvironmentQualificationOutcome;
  passed: boolean;
  failure_reason: ProductionEnvironmentFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionEnvironmentQualificationResult = Readonly<{
  phase_version: "production-environment-qualification/v15.3";
  phase_identifier: "ProductionEnvironmentQualification";
  release_artifact_ref: string;
  production_readiness_ref: string;
  contract: ProductionEnvironmentContract;
  registry: readonly ProductionEnvironmentRecord[];
  version_governance: EnvironmentVersionGovernance;
  qualification: EnvironmentQualificationRecord;
  infrastructure_integrity: InfrastructureIntegrityRecord;
  drift: ConfigurationDriftRecord;
  tenant_isolation: TenantIsolationQualification;
  observability: ObservabilityQualification;
  attestation: EnvironmentAttestationRecord;
  continuous_qualification: ContinuousEnvironmentQualification;
  lifecycle_governance: EnvironmentLifecycleGovernance;
  certification_tests: readonly ProductionEnvironmentCertificationTest[];
  failures: readonly ProductionEnvironmentFailure[];
  outcome: EnvironmentQualificationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionEnvironmentQualificationValidation = Readonly<{
  valid: boolean;
  outcome: EnvironmentQualificationOutcome;
  contract_valid: boolean;
  registry_valid: boolean;
  governance_valid: boolean;
  qualification_valid: boolean;
  infrastructure_valid: boolean;
  drift_valid: boolean;
  tenant_valid: boolean;
  observability_valid: boolean;
  attestation_valid: boolean;
  continuous_valid: boolean;
  lifecycle_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ProductionEnvironmentFailure[];
  integrity_hash: string;
}>;

export type ProductionEnvironmentQualificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-environment-qualification/v15.3";
    upstream_phase: "release-artifact-build-integrity/v15.2";
    lifecycle: readonly ProductionEnvironmentLifecycleState[];
    drift_categories: readonly DriftCategory[];
    certification_outcomes: readonly EnvironmentQualificationOutcome[];
  }>;
  result: ProductionEnvironmentQualificationResult;
  validation: ProductionEnvironmentQualificationValidation;
}>;
