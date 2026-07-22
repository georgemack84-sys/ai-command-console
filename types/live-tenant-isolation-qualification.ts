export type LiveTenantIsolationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type IsolationQualificationLifecycleState = "MONITORING" | "OBSERVATION_COLLECTED" | "BOUNDARY_VALIDATED" | "QUALIFIED" | "ANOMALY_DETECTED" | "INVESTIGATION_REQUIRED" | "REPLAY_VALIDATED" | "OPERATOR_REVIEW" | "CONTAINMENT_RECOMMENDED" | "QUALIFICATION_RESTORED";
export type IsolationSeverityLevel = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL";
export type IsolationIncidentCategory = "IDENTITY_BOUNDARY" | "MEMORY_BOUNDARY" | "POLICY_BOUNDARY" | "EVIDENCE_BOUNDARY" | "ARTIFACT_BOUNDARY" | "CACHE_BOUNDARY" | "TELEMETRY_BOUNDARY" | "REPLAY_BOUNDARY" | "CONFIGURATION_BOUNDARY" | "UNKNOWN_BOUNDARY";
export type IsolationDomain = "Identity" | "Memory" | "Evidence" | "Policy" | "Artifacts" | "Cache" | "Telemetry" | "Replay";
export type LiveTenantIsolationFailure = "UNAUTHORIZED_CROSS_TENANT_ACCESS" | "ISOLATION_NOT_CONTINUOUSLY_VERIFIED" | "TENANT_CONTAINMENT_NOT_OPERATIONAL" | "INCIDENTS_NOT_REPLAYABLE" | "BOUNDARY_ATTESTATIONS_NOT_REPRODUCIBLE" | "CROSS_TENANT_DETECTION_NON_DETERMINISTIC" | "MISSION_CONTROL_NOT_ADVISORY_ONLY" | "CONTAINMENT_AUTHORITY_NOT_EXTERNAL" | "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION" | "FORENSIC_LINEAGE_MUTABLE" | "CONTINUOUS_QUALIFICATION_NOT_INTEGRATED" | "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT" | "TENANT_RUNTIME_STATE_VISIBLE" | "MEMORY_OWNERSHIP_CROSSES_TENANT" | "NON_CONSTITUTIONAL_ISOLATION_WARNING";
export type LiveTenantIsolationScenario = "BASELINE" | LiveTenantIsolationFailure;

export type LiveTenantIsolationInput = Readonly<{ scenario?: LiveTenantIsolationScenario; tenant_id?: string }>;

export type IsolationObservation = Readonly<{
  observation_id: string;
  tenant_id: string;
  environment_id: string;
  workload_id: string;
  identity_refs: readonly string[];
  policy_refs: readonly string[];
  evidence_refs: readonly string[];
  artifact_refs: readonly string[];
  replay_refs: readonly string[];
  telemetry_refs: readonly string[];
  timestamp: string;
  lineage_refs: readonly string[];
  continuously_verified: boolean;
  integrity_hash: string;
}>;

export type CrossTenantAccessRecord = Readonly<{
  detector_id: string;
  domains_validated: readonly IsolationDomain[];
  identity_crossover_detected: boolean;
  memory_crossover_detected: boolean;
  policy_crossover_detected: boolean;
  evidence_crossover_detected: boolean;
  artifact_crossover_detected: boolean;
  cache_crossover_detected: boolean;
  telemetry_crossover_detected: boolean;
  replay_crossover_detected: boolean;
  shared_execution_context_detected: boolean;
  improper_authorization_inheritance_detected: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type TenantBoundaryAttestation = Readonly<{
  attestation_id: string;
  identity_integrity: boolean;
  namespace_isolation: boolean;
  policy_isolation: boolean;
  memory_ownership: boolean;
  artifact_ownership: boolean;
  cache_ownership: boolean;
  telemetry_routing: boolean;
  replay_ownership: boolean;
  lineage_ownership: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type IsolationIncidentRecord = Readonly<{
  incident_id: string;
  lifecycle: readonly IsolationQualificationLifecycleState[];
  affected_tenants: readonly string[];
  affected_resources: readonly string[];
  boundary_type: IsolationIncidentCategory;
  severity: IsolationSeverityLevel;
  investigation_refs: readonly string[];
  replay_refs: readonly string[];
  operator_decision_refs: readonly string[];
  containment_refs: readonly string[];
  remediation_lineage_refs: readonly string[];
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type TenantContainmentRecord = Readonly<{
  containment_id: string;
  tenant_id: string;
  mission_control_recommends_only: boolean;
  external_authorization_required: boolean;
  tenant_suspension_supported: boolean;
  traffic_isolation_supported: boolean;
  network_segmentation_supported: boolean;
  session_invalidation_supported: boolean;
  processing_pause_supported: boolean;
  investigation_mode_supported: boolean;
  read_only_preservation_supported: boolean;
  forensic_capture_supported: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationReplayRecord = Readonly<{
  replay_id: string;
  deterministic_replay: boolean;
  timeline_reconstruction: boolean;
  policy_reconstruction: boolean;
  identity_reconstruction: boolean;
  artifact_reconstruction: boolean;
  memory_reconstruction: boolean;
  operator_decision_replay: boolean;
  containment_replay: boolean;
  lineage_replay: boolean;
  preserves_original_tenant_isolation: boolean;
  integrity_hash: string;
}>;

export type LiveTenantIsolationCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: LiveTenantIsolationOutcome;
  passed: boolean;
  failure_reason: LiveTenantIsolationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type LiveTenantIsolationResult = Readonly<{
  phase_version: "live-tenant-isolation-qualification/v15.7";
  phase_identifier: "LiveTenantIsolationQualification";
  production_boundary_ref: string;
  lifecycle: readonly IsolationQualificationLifecycleState[];
  observation: IsolationObservation;
  detector: CrossTenantAccessRecord;
  attestation: TenantBoundaryAttestation;
  incident_registry: readonly IsolationIncidentRecord[];
  containment: TenantContainmentRecord;
  replay: TenantIsolationReplayRecord;
  certification_tests: readonly LiveTenantIsolationCertificationTest[];
  failures: readonly LiveTenantIsolationFailure[];
  outcome: LiveTenantIsolationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type LiveTenantIsolationValidation = Readonly<{
  valid: boolean;
  outcome: LiveTenantIsolationOutcome;
  observation_valid: boolean;
  detector_valid: boolean;
  attestation_valid: boolean;
  incidents_valid: boolean;
  containment_valid: boolean;
  replay_valid: boolean;
  certification_valid: boolean;
  failures: readonly LiveTenantIsolationFailure[];
  integrity_hash: string;
}>;

export type LiveTenantIsolationBundle = Readonly<{
  doctrine: Readonly<{
    version: "live-tenant-isolation-qualification/v15.7";
    upstream_phase: "production-boundary-enforcement/v15.6";
    lifecycle: readonly IsolationQualificationLifecycleState[];
    domains: readonly IsolationDomain[];
    severities: readonly IsolationSeverityLevel[];
    categories: readonly IsolationIncidentCategory[];
    certification_outcomes: readonly LiveTenantIsolationOutcome[];
  }>;
  result: LiveTenantIsolationResult;
  validation: LiveTenantIsolationValidation;
}>;
