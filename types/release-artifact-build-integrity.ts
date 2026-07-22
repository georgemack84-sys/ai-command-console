export type ReleaseArtifactOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReleaseArtifactLifecycleState = "REGISTERED" | "BUILDING" | "BUILT" | "SIGNED" | "ATTESTED" | "CERTIFIED" | "PROMOTION_ELIGIBLE" | "DEPLOYED" | "RETIRED";
export type ReleaseArtifactFailure = "ARTIFACT_CONTRACT_INVALID" | "ARTIFACT_IDENTITY_MUTABLE" | "REGISTRY_INCOMPLETE" | "BUILD_MANIFEST_NON_DETERMINISTIC" | "SOURCE_REVISION_UNVERIFIED" | "DEPENDENCY_VERSIONS_UNVERIFIED" | "CONFIGURATION_IDENTITY_UNVERIFIED" | "BINARY_HASH_MISMATCH" | "CONTAINER_DIGEST_MISMATCH" | "INTEGRITY_VALIDATOR_FAILED" | "SBOM_INCOMPLETE" | "SUPPLY_CHAIN_NOT_TRACEABLE" | "PROVENANCE_LEDGER_INCOMPLETE" | "BUILD_REPLAY_NOT_REPRODUCIBLE" | "ARTIFACT_UNSIGNED" | "ATTESTATION_UNVERIFIED" | "CERTIFICATION_BINDING_INVALID" | "PHASE14_CERTIFICATION_NOT_REFERENCED" | "CERTIFICATION_EVIDENCE_MUTABLE" | "REPRODUCIBLE_BUILD_NOT_VERIFIED" | "BINARY_EQUALITY_NOT_CONFIRMED" | "ENVIRONMENT_IDENTITY_UNVERIFIED" | "REPLAY_NON_DETERMINISTIC" | "AUDIT_LINEAGE_LOST" | "FAIL_CLOSED_NOT_ENFORCED" | "NON_CONSTITUTIONAL_ARTIFACT_WARNING";
export type ReleaseArtifactScenario = "BASELINE" | ReleaseArtifactFailure;

export type ReleaseArtifactInput = Readonly<{ scenario?: ReleaseArtifactScenario; tenant_id?: string }>;

export type ReleaseArtifactContract = Readonly<{
  contract_version: "release-artifact-build-integrity/v15.2";
  lifecycle: readonly ReleaseArtifactLifecycleState[];
  immutable_identity_required: boolean;
  deterministic_build_required: boolean;
  provenance_required: boolean;
  replay_required: boolean;
  certification_binding_required: boolean;
  fail_closed: boolean;
  advisory_only_governance: boolean;
  integrity_hash: string;
}>;

export type ReleaseArtifactIdentity = Readonly<{
  artifact_id: string;
  release_id: string;
  version: string;
  semantic_version: string;
  source_revision: string;
  platform_target: "container";
  architecture: "linux/amd64";
  creation_timestamp: string;
  creator: "MISSION_CONTROL_BUILD_SERVICE";
  signing_identity: string;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReleaseArtifactRegistry = Readonly<{
  registry_id: string;
  artifacts: readonly ReleaseArtifactIdentity[];
  exactly_one_identity_per_artifact: boolean;
  replacement_prohibited: boolean;
  historical_artifacts_accessible: boolean;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type BuildManifest = Readonly<{
  manifest_id: string;
  source_commit: string;
  repository_identity: string;
  dependency_versions: readonly string[];
  compiler_versions: readonly string[];
  toolchain_versions: readonly string[];
  operating_system: string;
  container_base_image: string;
  build_parameters: readonly string[];
  environment_variables: readonly string[];
  build_timestamp: string;
  build_identity: string;
  artifact_hashes: readonly string[];
  deterministic: boolean;
  environment_reproducible: boolean;
  configuration_immutable: boolean;
  integrity_hash: string;
}>;

export type ArtifactIntegrityRecord = Readonly<{
  integrity_id: string;
  sha256_hash_verified: boolean;
  binary_identity_verified: boolean;
  image_digest_verified: boolean;
  archive_integrity_verified: boolean;
  signature_valid: boolean;
  manifest_consistent: boolean;
  promotion_blocked_on_mismatch: boolean;
  integrity_hash: string;
}>;

export type SoftwareBillOfMaterials = Readonly<{
  sbom_id: string;
  packages: readonly string[];
  libraries: readonly string[];
  framework_versions: readonly string[];
  transitive_dependencies: readonly string[];
  licenses: readonly string[];
  component_hashes: readonly string[];
  source_origins: readonly string[];
  supplier_identities: readonly string[];
  immutable: boolean;
  dependency_lineage_traceable: boolean;
  integrity_hash: string;
}>;

export type BuildProvenanceRecord = Readonly<{
  provenance_id: string;
  build_events: readonly string[];
  builder_identity: string;
  build_host: string;
  execution_environment: string;
  toolchain_versions: readonly string[];
  source_revision: string;
  dependency_resolution_refs: readonly string[];
  signing_event_refs: readonly string[];
  attestation_event_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type ArtifactSignature = Readonly<{
  signature_id: string;
  artifact_id: string;
  signing_certificate: string;
  trust_chain_valid: boolean;
  key_not_expired: boolean;
  signature_integrity_valid: boolean;
  integrity_hash: string;
}>;

export type ArtifactAttestation = Readonly<{
  attestation_id: string;
  artifact_id: string;
  provenance_ref: string;
  sbom_ref: string;
  certification_ref: string;
  attestation_complete: boolean;
  verified: boolean;
  integrity_hash: string;
}>;

export type CertificationBindingRecord = Readonly<{
  binding_id: string;
  artifact_id: string;
  phase14_certification_id: string;
  replay_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  validation_evidence_refs: readonly string[];
  environment_qualification_refs: readonly string[];
  synthetic_certification_refs: readonly string[];
  immutable: boolean;
  survives_supersession: boolean;
  integrity_hash: string;
}>;

export type ReproducibleBuildRecord = Readonly<{
  rebuild_id: string;
  independent_rebuild_refs: readonly string[];
  binary_equality: boolean;
  image_equality: boolean;
  reproducibility_verified: boolean;
  deterministic_outputs: boolean;
  configuration_consistent: boolean;
  drift_detected: boolean;
  integrity_hash: string;
}>;

export type ReleaseArtifactCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ReleaseArtifactOutcome;
  passed: boolean;
  failure_reason: ReleaseArtifactFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReleaseArtifactCertificationRecord = Readonly<{
  certification_id: string;
  artifact_id: string;
  outcome: ReleaseArtifactOutcome;
  artifact_refs: readonly string[];
  manifest_refs: readonly string[];
  integrity_refs: readonly string[];
  sbom_refs: readonly string[];
  provenance_refs: readonly string[];
  signature_refs: readonly string[];
  attestation_refs: readonly string[];
  certification_binding_refs: readonly string[];
  reproducible_build_refs: readonly string[];
  audit_lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReleaseArtifactBuildIntegrityResult = Readonly<{
  phase_version: "release-artifact-build-integrity/v15.2";
  phase_identifier: "ReleaseArtifactBuildIntegrity";
  production_readiness_ref: string;
  phase14_certification_ref: string;
  contract: ReleaseArtifactContract;
  artifact_identity: ReleaseArtifactIdentity;
  registry: ReleaseArtifactRegistry;
  build_manifest: BuildManifest;
  integrity_record: ArtifactIntegrityRecord;
  sbom: SoftwareBillOfMaterials;
  provenance: BuildProvenanceRecord;
  signature: ArtifactSignature;
  attestation: ArtifactAttestation;
  certification_binding: CertificationBindingRecord;
  reproducible_build: ReproducibleBuildRecord;
  certification_tests: readonly ReleaseArtifactCertificationTest[];
  certification_record: ReleaseArtifactCertificationRecord;
  failures: readonly ReleaseArtifactFailure[];
  outcome: ReleaseArtifactOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReleaseArtifactBuildIntegrityValidation = Readonly<{
  valid: boolean;
  outcome: ReleaseArtifactOutcome;
  contract_valid: boolean;
  registry_valid: boolean;
  manifest_valid: boolean;
  integrity_valid: boolean;
  sbom_valid: boolean;
  provenance_valid: boolean;
  signing_valid: boolean;
  binding_valid: boolean;
  reproducible_build_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ReleaseArtifactFailure[];
  integrity_hash: string;
}>;

export type ReleaseArtifactBuildIntegrityBundle = Readonly<{
  doctrine: Readonly<{
    version: "release-artifact-build-integrity/v15.2";
    upstream_phase: "production-readiness-foundation/v15.1";
    lifecycle: readonly ReleaseArtifactLifecycleState[];
    certification_outcomes: readonly ReleaseArtifactOutcome[];
  }>;
  result: ReleaseArtifactBuildIntegrityResult;
  validation: ReleaseArtifactBuildIntegrityValidation;
}>;
