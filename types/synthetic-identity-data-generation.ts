export type SyntheticIdentityLifecycleState = "DEFINED" | "GENERATED" | "QUALIFIED" | "REGISTERED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type SyntheticIdentityType = "USER" | "OPERATOR" | "ORGANIZATION" | "SYSTEM" | "ASSET" | "INFRASTRUCTURE" | "RELATIONSHIP";
export type SyntheticDatasetType = "OPERATIONAL" | "MISSION" | "GOVERNANCE" | "TRUST" | "SECURITY" | "EVENT_HISTORY" | "TELEMETRY" | "AUDIT_RECORDS" | "EVIDENCE_COLLECTION";
export type SyntheticGenerationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type SyntheticIntegrityValidationResult = "VALID" | "INVALID";
export type SyntheticReplayDivergenceCategory = "INPUT_DIVERGENCE" | "SEED_DIVERGENCE" | "SCHEMA_DIVERGENCE" | "VERSION_DIVERGENCE" | "OUTPUT_DIVERGENCE" | "UNEXPLAINED_DIVERGENCE";
export type SyntheticGenerationFailure = "ENVIRONMENT_NOT_APPROVED" | "IDENTITY_CONTRACT_INVALID" | "IDENTITY_LIFECYCLE_INVALID" | "IDENTITY_GENERATION_NON_DETERMINISTIC" | "DATASET_GENERATION_NON_DETERMINISTIC" | "ORIGIN_REGISTRY_INCOMPLETE" | "CANONICAL_ORIGIN_VIOLATION" | "ORIGIN_LINEAGE_MUTABLE" | "INTEGRITY_VALIDATION_FAILED" | "SCHEMA_VALIDATION_FAILED" | "REPLAY_REGENERATION_MISMATCH" | "REPLAY_DIVERGENCE_UNDETECTED" | "UNEXPLAINED_DIVERGENCE_ACCEPTED" | "PROVENANCE_GRAPH_INCOMPLETE" | "TENANT_ISOLATION_BREACH" | "PRODUCTION_CONTAMINATION" | "GOVERNANCE_NON_COMPLIANT" | "EXPLAINABILITY_INCOMPLETE" | "AUDIT_MUTABLE" | "OBSERVABILITY_UNAVAILABLE" | "NON_CONSTITUTIONAL_METADATA_WARNING";
export type SyntheticGenerationScenario = "BASELINE" | SyntheticGenerationFailure;

export type SyntheticIdentityDataGenerationInput = Readonly<{
  scenario?: SyntheticGenerationScenario;
  tenant_id?: string;
  generation_seed?: string;
  identity_count?: number;
  dataset_record_count?: number;
}>;

export type SyntheticIdentityContract = Readonly<{
  contract_version: "synthetic-identity-data-generation/v14.3";
  environment_architecture_ref: string;
  lifecycle: readonly SyntheticIdentityLifecycleState[];
  deterministic_generation_required: boolean;
  immutable_provenance_required: boolean;
  replay_required: boolean;
  explainability_required: boolean;
  production_separation_required: boolean;
  governance_required: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type SyntheticIdentityRecord = Readonly<{
  synthetic_identity_id: string;
  identity_type: SyntheticIdentityType;
  tenant_id: string;
  identity_name: string;
  deterministic_identifier: string;
  generation_seed: string;
  generator_version: "synthetic-generator/v14.3";
  lifecycle_state: SyntheticIdentityLifecycleState;
  origin_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type SyntheticDatasetRecord = Readonly<{
  synthetic_dataset_id: string;
  dataset_type: SyntheticDatasetType;
  tenant_id: string;
  dataset_version: "dataset/v14.3.0";
  schema_version: "schema/v14.3.0";
  generation_specification: string;
  generation_seed: string;
  record_count: number;
  origin_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type SyntheticOriginRecord = Readonly<{
  origin_id: string;
  artifact_reference: string;
  generator_version: "synthetic-generator/v14.3";
  generation_specification: string;
  deterministic_seed: string;
  provenance_reference: string;
  lineage_reference: string;
  governing_policy_reference: string;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type SyntheticIntegrityRecord = Readonly<{
  integrity_validation_id: string;
  artifact_reference: string;
  validation_type: "IDENTITY" | "DATASET" | "ORIGIN" | "PROVENANCE";
  validation_result: SyntheticIntegrityValidationResult;
  validation_timestamp: string;
  validator_version: "synthetic-integrity-validator/v14.3";
  replay_reference: string;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type SyntheticProvenanceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "IDENTITY_CREATED" | "DATASET_GENERATED" | "ORIGIN_REGISTERED" | "INTEGRITY_VALIDATED" | "REPLAY_VERIFIED" | "GOVERNANCE_APPROVED" | "OBSERVABILITY_RECORDED";
  artifact_reference: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SyntheticReplayReport = Readonly<{
  replay_id: string;
  identities_reproduced: boolean;
  organizations_reproduced: boolean;
  assets_reproduced: boolean;
  datasets_reproduced: boolean;
  evidence_reproduced: boolean;
  relationships_reproduced: boolean;
  metadata_reproduced: boolean;
  integrity_hashes_reproduced: boolean;
  divergence_categories: readonly SyntheticReplayDivergenceCategory[];
  unexplained_divergence_rejected: boolean;
  replay_evidence_immutable: boolean;
  integrity_hash: string;
}>;

export type SyntheticGovernanceIsolationReport = Readonly<{
  governance_id: string;
  tenant_isolation_enforced: boolean;
  environment_isolation_enforced: boolean;
  governance_compliant: boolean;
  replay_authorized: boolean;
  origin_ownership_preserved: boolean;
  production_contamination_prevented: boolean;
  production_impersonation_prevented: boolean;
  cross_tenant_sharing_governed: boolean;
  integrity_hash: string;
}>;

export type SyntheticObservabilityReport = Readonly<{
  observability_id: string;
  generation_throughput_monitored: boolean;
  replay_success_monitored: boolean;
  origin_completeness_monitored: boolean;
  integrity_failures_monitored: boolean;
  duplicate_identities_monitored: boolean;
  schema_violations_monitored: boolean;
  replay_divergence_monitored: boolean;
  governance_violations_monitored: boolean;
  isolation_failures_monitored: boolean;
  alerts_configured: boolean;
  integrity_hash: string;
}>;

export type SyntheticGenerationCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: SyntheticGenerationOutcome;
  passed: boolean;
  failure_reason: SyntheticGenerationFailure | null;
  integrity_hash: string;
}>;

export type SyntheticIdentityDataGenerationResult = Readonly<{
  phase_version: "synthetic-identity-data-generation/v14.3";
  phase_identifier: "SyntheticIdentityDataGeneration";
  environment_ref: string;
  contract: SyntheticIdentityContract;
  identities: readonly SyntheticIdentityRecord[];
  datasets: readonly SyntheticDatasetRecord[];
  origins: readonly SyntheticOriginRecord[];
  integrity_records: readonly SyntheticIntegrityRecord[];
  provenance_ledger: readonly SyntheticProvenanceLedgerEntry[];
  replay: SyntheticReplayReport;
  governance: SyntheticGovernanceIsolationReport;
  observability: SyntheticObservabilityReport;
  certification_tests: readonly SyntheticGenerationCertificationTest[];
  failures: readonly SyntheticGenerationFailure[];
  outcome: SyntheticGenerationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SyntheticIdentityDataGenerationValidation = Readonly<{
  valid: boolean;
  outcome: SyntheticGenerationOutcome;
  contract_valid: boolean;
  identities_valid: boolean;
  datasets_valid: boolean;
  origins_valid: boolean;
  integrity_valid: boolean;
  provenance_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly SyntheticGenerationFailure[];
  integrity_hash: string;
}>;

export type SyntheticIdentityDataGenerationBundle = Readonly<{
  doctrine: Readonly<{
    version: "synthetic-identity-data-generation/v14.3";
    foundation_phase: "synthetic-validation-foundation/v14.1";
    environment_phase: "synthetic-environment-architecture/v14.2";
    certification_outcomes: readonly SyntheticGenerationOutcome[];
    replay_divergence_categories: readonly SyntheticReplayDivergenceCategory[];
  }>;
  result: SyntheticIdentityDataGenerationResult;
  validation: SyntheticIdentityDataGenerationValidation;
}>;
