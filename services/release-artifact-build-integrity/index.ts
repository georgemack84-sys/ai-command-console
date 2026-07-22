import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayProductionReadinessFoundation, runProductionReadinessFoundation, validateProductionReadinessFoundation } from "@/services/production-readiness-foundation";
import type {
  ReleaseArtifactBuildIntegrityBundle,
  ReleaseArtifactBuildIntegrityResult,
  ReleaseArtifactBuildIntegrityValidation,
  ReleaseArtifactCertificationTest,
  ReleaseArtifactFailure,
  ReleaseArtifactInput,
  ReleaseArtifactLifecycleState,
  ReleaseArtifactOutcome,
} from "@/types/release-artifact-build-integrity";

const VERSION = "release-artifact-build-integrity/v15.2" as const;
const IDENTIFIER = "ReleaseArtifactBuildIntegrity" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_15_release_artifact" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ReleaseArtifactFailure[], failure: ReleaseArtifactFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ReleaseArtifactInput["scenario"]): ReleaseArtifactFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ReleaseArtifactFailure[]): ReleaseArtifactOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_ARTIFACT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["REGISTERED", "BUILDING", "BUILT", "SIGNED", "ATTESTED", "CERTIFIED", "PROMOTION_ELIGIBLE", "DEPLOYED", "RETIRED"] as const satisfies readonly ReleaseArtifactLifecycleState[]);

function certTest(name: string, passed: boolean, failure: ReleaseArtifactFailure, evidence_refs: readonly string[]): ReleaseArtifactCertificationTest {
  const actual: ReleaseArtifactOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_ARTIFACT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("release_artifact_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ReleaseArtifactBuildIntegrityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ readiness: result.production_readiness_ref, phase14: result.phase14_certification_ref, contract: result.contract.integrity_hash, identity: result.artifact_identity.integrity_hash, registry: result.registry.integrity_hash, manifest: result.build_manifest.integrity_hash, integrity: result.integrity_record.integrity_hash, sbom: result.sbom.integrity_hash, provenance: result.provenance.integrity_hash, signature: result.signature.integrity_hash, attestation: result.attestation.integrity_hash, binding: result.certification_binding.integrity_hash, reproducible: result.reproducible_build.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), record: result.certification_record.integrity_hash, outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ReleaseArtifactBuildIntegrityResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runReleaseArtifactBuildIntegrity(input: ReleaseArtifactInput = {}): ReleaseArtifactBuildIntegrityResult {
  const readiness = runProductionReadinessFoundation();
  const readinessValidation = validateProductionReadinessFoundation(readiness);
  const readinessReplayable = replayProductionReadinessFoundation(readiness);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ReleaseArtifactFailure[] = readinessValidation.valid && readinessReplayable ? [] : ["CERTIFICATION_BINDING_INVALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const sourceRevision = id("source_revision", readiness.release_record.integrity_hash);
  const artifactHash = hash({ release: readiness.release_record.release_id, sourceRevision, version: readiness.release_record.release_version });
  const containerDigest = `sha256:${hash({ artifactHash, target: "container" })}`;
  const artifactId = id("release_artifact", artifactHash);
  const contract = nested({ contract_version: VERSION, lifecycle, immutable_identity_required: !has(failures, "ARTIFACT_IDENTITY_MUTABLE"), deterministic_build_required: !has(failures, "BUILD_MANIFEST_NON_DETERMINISTIC"), provenance_required: true, replay_required: true, certification_binding_required: !has(failures, "CERTIFICATION_BINDING_INVALID"), fail_closed: !has(failures, "FAIL_CLOSED_NOT_ENFORCED"), advisory_only_governance: true });
  const artifact_identity = nested({ artifact_id: artifactId, release_id: readiness.release_record.release_id, version: readiness.release_record.release_version, semantic_version: readiness.release_record.release_version, source_revision: has(failures, "SOURCE_REVISION_UNVERIFIED") ? "" : sourceRevision, platform_target: "container" as const, architecture: "linux/amd64" as const, creation_timestamp: TIMESTAMP, creator: "MISSION_CONTROL_BUILD_SERVICE" as const, signing_identity: id("signing_identity", artifactId), immutable: !has(failures, "ARTIFACT_IDENTITY_MUTABLE") });
  const registry = nested({ registry_id: id("artifact_registry", readiness.release_record.release_id), artifacts: has(failures, "REGISTRY_INCOMPLETE") ? freezeArray([]) : freezeArray([artifact_identity]), exactly_one_identity_per_artifact: !has(failures, "ARTIFACT_IDENTITY_MUTABLE"), replacement_prohibited: true, historical_artifacts_accessible: true, lineage_refs: has(failures, "AUDIT_LINEAGE_LOST") ? freezeArray([]) : freezeArray([readiness.release_record.integrity_hash, readiness.phase14_certification_ref]) });
  const build_manifest = nested({ manifest_id: id("build_manifest", artifactId), source_commit: artifact_identity.source_revision, repository_identity: "mission-control", dependency_versions: has(failures, "DEPENDENCY_VERSIONS_UNVERIFIED") ? freezeArray([]) : freezeArray(["next@15", "typescript@5", "vitest@4"]), compiler_versions: freezeArray(["tsc@5"]), toolchain_versions: freezeArray(["node@22", "npm@10"]), operating_system: "linux", container_base_image: "node:22-bookworm-slim", build_parameters: freezeArray(["NODE_ENV=production", "deterministic=true"]), environment_variables: has(failures, "ENVIRONMENT_IDENTITY_UNVERIFIED") ? freezeArray([]) : freezeArray(["TZ=UTC", "SOURCE_DATE_EPOCH=1784073600"]), build_timestamp: TIMESTAMP, build_identity: id("build_identity", artifactId), artifact_hashes: has(failures, "BINARY_HASH_MISMATCH") ? freezeArray(["mismatch"]) : freezeArray([artifactHash, containerDigest]), deterministic: !has(failures, "BUILD_MANIFEST_NON_DETERMINISTIC"), environment_reproducible: !has(failures, "ENVIRONMENT_IDENTITY_UNVERIFIED"), configuration_immutable: !has(failures, "CONFIGURATION_IDENTITY_UNVERIFIED") });
  const integrity_record = nested({ integrity_id: id("artifact_integrity", artifactId), sha256_hash_verified: !has(failures, "BINARY_HASH_MISMATCH"), binary_identity_verified: !has(failures, "BINARY_EQUALITY_NOT_CONFIRMED"), image_digest_verified: !has(failures, "CONTAINER_DIGEST_MISMATCH"), archive_integrity_verified: !has(failures, "INTEGRITY_VALIDATOR_FAILED"), signature_valid: !has(failures, "ARTIFACT_UNSIGNED"), manifest_consistent: !has(failures, "INTEGRITY_VALIDATOR_FAILED"), promotion_blocked_on_mismatch: !has(failures, "FAIL_CLOSED_NOT_ENFORCED") });
  const sbom = nested({ sbom_id: id("sbom", artifactId), packages: has(failures, "SBOM_INCOMPLETE") ? freezeArray([]) : freezeArray(["mission-control"]), libraries: freezeArray(["react", "next", "zod"]), framework_versions: freezeArray(["next@15", "react@19"]), transitive_dependencies: freezeArray(["typescript", "vitest"]), licenses: freezeArray(["MIT", "Apache-2.0"]), component_hashes: has(failures, "SUPPLY_CHAIN_NOT_TRACEABLE") ? freezeArray([]) : freezeArray([hash("react"), hash("next")]), source_origins: freezeArray(["npmjs", "internal"]), supplier_identities: has(failures, "SUPPLY_CHAIN_NOT_TRACEABLE") ? freezeArray([]) : freezeArray(["npm", "mission-control"]), immutable: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"), dependency_lineage_traceable: !has(failures, "SUPPLY_CHAIN_NOT_TRACEABLE") });
  const provenance = nested({ provenance_id: id("build_provenance", artifactId), build_events: has(failures, "PROVENANCE_LEDGER_INCOMPLETE") ? freezeArray(["BUILD_STARTED"]) : freezeArray(["BUILD_STARTED", "DEPENDENCIES_RESOLVED", "ARTIFACT_BUILT", "ARTIFACT_SIGNED", "ATTESTATION_CREATED"]), builder_identity: "MISSION_CONTROL_BUILD_SERVICE", build_host: "deterministic-builder-01", execution_environment: build_manifest.container_base_image, toolchain_versions: build_manifest.toolchain_versions, source_revision: build_manifest.source_commit, dependency_resolution_refs: build_manifest.dependency_versions, signing_event_refs: freezeArray([id("signing_event", artifactId)]), attestation_event_refs: freezeArray([id("attestation_event", artifactId)]), replay_refs: has(failures, "BUILD_REPLAY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([build_manifest.build_identity, readiness.replay_hash]), append_only: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"), replayable: !has(failures, "BUILD_REPLAY_NOT_REPRODUCIBLE") && !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const signature = nested({ signature_id: id("artifact_signature", artifactId), artifact_id: artifactId, signing_certificate: has(failures, "ARTIFACT_UNSIGNED") ? "" : id("certificate", artifactId), trust_chain_valid: !has(failures, "ARTIFACT_UNSIGNED"), key_not_expired: true, signature_integrity_valid: !has(failures, "ARTIFACT_UNSIGNED") });
  const attestation = nested({ attestation_id: id("artifact_attestation", artifactId), artifact_id: artifactId, provenance_ref: provenance.integrity_hash, sbom_ref: sbom.integrity_hash, certification_ref: readiness.phase14_certification_ref, attestation_complete: !has(failures, "ATTESTATION_UNVERIFIED"), verified: !has(failures, "ATTESTATION_UNVERIFIED") });
  const certification_binding = nested({ binding_id: id("certification_binding", artifactId), artifact_id: artifactId, phase14_certification_id: has(failures, "PHASE14_CERTIFICATION_NOT_REFERENCED") ? "" : readiness.phase14_certification_ref, replay_evidence_refs: freezeArray([readiness.replay_hash]), integrity_evidence_refs: freezeArray([readiness.integrity_hash]), validation_evidence_refs: readiness.release_record.synthetic_validation_refs, environment_qualification_refs: freezeArray([readiness.scope_registry.integrity_hash]), synthetic_certification_refs: has(failures, "CERTIFICATION_BINDING_INVALID") ? freezeArray([]) : freezeArray([readiness.phase14_certification_ref]), immutable: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"), survives_supersession: true });
  const reproducible_build = nested({ rebuild_id: id("reproducible_build", artifactId), independent_rebuild_refs: has(failures, "REPRODUCIBLE_BUILD_NOT_VERIFIED") ? freezeArray([]) : freezeArray([id("rebuild_a", artifactId), id("rebuild_b", artifactId)]), binary_equality: !has(failures, "BINARY_EQUALITY_NOT_CONFIRMED"), image_equality: !has(failures, "CONTAINER_DIGEST_MISMATCH"), reproducibility_verified: !has(failures, "REPRODUCIBLE_BUILD_NOT_VERIFIED"), deterministic_outputs: !has(failures, "BUILD_MANIFEST_NON_DETERMINISTIC"), configuration_consistent: !has(failures, "CONFIGURATION_IDENTITY_UNVERIFIED"), drift_detected: has(failures, "BINARY_EQUALITY_NOT_CONFIRMED") });
  const tests = freezeArray([
    certTest("Release Artifact Contract valid", contract.immutable_identity_required && contract.certification_binding_required, "ARTIFACT_CONTRACT_INVALID", [contract.integrity_hash]),
    certTest("Artifact identity immutable", artifact_identity.immutable && registry.exactly_one_identity_per_artifact, "ARTIFACT_IDENTITY_MUTABLE", [artifact_identity.integrity_hash]),
    certTest("Registry complete", registry.artifacts.length === 1 && registry.lineage_refs.length > 0, "REGISTRY_INCOMPLETE", [registry.integrity_hash]),
    certTest("Build Manifest deterministic", build_manifest.deterministic, "BUILD_MANIFEST_NON_DETERMINISTIC", [build_manifest.integrity_hash]),
    certTest("Source revision verified", build_manifest.source_commit.length > 0, "SOURCE_REVISION_UNVERIFIED", [build_manifest.integrity_hash]),
    certTest("Dependency versions verified", build_manifest.dependency_versions.length > 0, "DEPENDENCY_VERSIONS_UNVERIFIED", [build_manifest.integrity_hash]),
    certTest("Configuration identity verified", build_manifest.configuration_immutable, "CONFIGURATION_IDENTITY_UNVERIFIED", [build_manifest.integrity_hash]),
    certTest("Binary hash verified", integrity_record.sha256_hash_verified, "BINARY_HASH_MISMATCH", [integrity_record.integrity_hash]),
    certTest("Container digest verified", integrity_record.image_digest_verified, "CONTAINER_DIGEST_MISMATCH", [integrity_record.integrity_hash]),
    certTest("Artifact Integrity Validator passed", Object.entries(integrity_record).filter(([key]) => key !== "integrity_id" && key !== "integrity_hash").every(([, value]) => value === true), "INTEGRITY_VALIDATOR_FAILED", [integrity_record.integrity_hash]),
    certTest("SBOM complete", sbom.packages.length > 0 && sbom.immutable, "SBOM_INCOMPLETE", [sbom.integrity_hash]),
    certTest("Supply chain traceable", sbom.dependency_lineage_traceable && sbom.component_hashes.length > 0 && sbom.supplier_identities.length > 0, "SUPPLY_CHAIN_NOT_TRACEABLE", [sbom.integrity_hash]),
    certTest("Provenance Ledger complete", provenance.build_events.length === 5 && provenance.append_only, "PROVENANCE_LEDGER_INCOMPLETE", [provenance.integrity_hash]),
    certTest("Build replay reproducible", provenance.replayable && provenance.replay_refs.length > 0, "BUILD_REPLAY_NOT_REPRODUCIBLE", [provenance.integrity_hash]),
    certTest("Artifact signed", signature.signing_certificate.length > 0 && signature.signature_integrity_valid, "ARTIFACT_UNSIGNED", [signature.integrity_hash]),
    certTest("Attestation verified", attestation.attestation_complete && attestation.verified, "ATTESTATION_UNVERIFIED", [attestation.integrity_hash]),
    certTest("Certification binding valid", certification_binding.synthetic_certification_refs.length > 0 && certification_binding.immutable, "CERTIFICATION_BINDING_INVALID", [certification_binding.integrity_hash]),
    certTest("Phase 14 certification referenced", certification_binding.phase14_certification_id.length > 0, "PHASE14_CERTIFICATION_NOT_REFERENCED", [certification_binding.integrity_hash]),
    certTest("Certification evidence immutable", certification_binding.immutable && sbom.immutable && provenance.append_only, "CERTIFICATION_EVIDENCE_MUTABLE", [certification_binding.integrity_hash]),
    certTest("Reproducible build verified", reproducible_build.reproducibility_verified, "REPRODUCIBLE_BUILD_NOT_VERIFIED", [reproducible_build.integrity_hash]),
    certTest("Binary equality confirmed", reproducible_build.binary_equality && !reproducible_build.drift_detected, "BINARY_EQUALITY_NOT_CONFIRMED", [reproducible_build.integrity_hash]),
    certTest("Environment identity verified", build_manifest.environment_reproducible && build_manifest.environment_variables.length > 0, "ENVIRONMENT_IDENTITY_UNVERIFIED", [build_manifest.integrity_hash]),
    certTest("Replay deterministic", provenance.replayable && !has(failures, "REPLAY_NON_DETERMINISTIC"), "REPLAY_NON_DETERMINISTIC", [provenance.integrity_hash]),
    certTest("Audit lineage preserved", registry.lineage_refs.length > 0 && certification_binding.validation_evidence_refs.length > 0, "AUDIT_LINEAGE_LOST", [registry.integrity_hash]),
    certTest("Fail-closed policy enforced", contract.fail_closed && integrity_record.promotion_blocked_on_mismatch, "FAIL_CLOSED_NOT_ENFORCED", [contract.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ReleaseArtifactFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const certification_record = nested({ certification_id: id("release_artifact_certification", artifactId), artifact_id: artifactId, outcome, artifact_refs: freezeArray([artifact_identity.integrity_hash]), manifest_refs: freezeArray([build_manifest.integrity_hash]), integrity_refs: freezeArray([integrity_record.integrity_hash]), sbom_refs: freezeArray([sbom.integrity_hash]), provenance_refs: freezeArray([provenance.integrity_hash]), signature_refs: freezeArray([signature.integrity_hash]), attestation_refs: freezeArray([attestation.integrity_hash]), certification_binding_refs: freezeArray([certification_binding.integrity_hash]), reproducible_build_refs: freezeArray([reproducible_build.integrity_hash]), audit_lineage_refs: registry.lineage_refs });
  const base: Omit<ReleaseArtifactBuildIntegrityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_readiness_ref: readiness.integrity_hash, phase14_certification_ref: readiness.phase14_certification_ref, contract, artifact_identity, registry, build_manifest, integrity_record, sbom, provenance, signature, attestation, certification_binding, reproducible_build, certification_tests: tests, certification_record, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateReleaseArtifactBuildIntegrity(result = runReleaseArtifactBuildIntegrity()): ReleaseArtifactBuildIntegrityValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 9 && result.contract.immutable_identity_required && result.contract.deterministic_build_required && result.contract.fail_closed && result.contract.certification_binding_required;
  const registry_valid = verify(result.artifact_identity) && verify(result.registry) && result.artifact_identity.immutable && result.registry.artifacts.length === 1 && result.registry.exactly_one_identity_per_artifact && result.registry.lineage_refs.length > 0;
  const manifest_valid = verify(result.build_manifest) && result.build_manifest.deterministic && result.build_manifest.source_commit.length > 0 && result.build_manifest.dependency_versions.length > 0 && result.build_manifest.environment_reproducible && result.build_manifest.configuration_immutable;
  const integrity_valid = verify(result.integrity_record) && Object.entries(result.integrity_record).filter(([key]) => key !== "integrity_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const sbom_valid = verify(result.sbom) && result.sbom.packages.length > 0 && result.sbom.immutable && result.sbom.dependency_lineage_traceable && result.sbom.component_hashes.length > 0;
  const provenance_valid = verify(result.provenance) && result.provenance.build_events.length === 5 && result.provenance.append_only && result.provenance.replayable && result.provenance.replay_refs.length > 0;
  const signing_valid = verify(result.signature) && verify(result.attestation) && result.signature.signing_certificate.length > 0 && result.signature.trust_chain_valid && result.signature.signature_integrity_valid && result.attestation.attestation_complete && result.attestation.verified;
  const binding_valid = verify(result.certification_binding) && result.certification_binding.phase14_certification_id.length > 0 && result.certification_binding.synthetic_certification_refs.length > 0 && result.certification_binding.immutable;
  const reproducible_build_valid = verify(result.reproducible_build) && result.reproducible_build.reproducibility_verified && result.reproducible_build.binary_equality && result.reproducible_build.image_equality && result.reproducible_build.configuration_consistent && !result.reproducible_build.drift_detected;
  const certification_valid = verify(result.certification_record) && result.certification_tests.length === 25 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0) && result.certification_record.outcome === result.outcome;
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && registry_valid && manifest_valid && integrity_valid && sbom_valid && provenance_valid && signing_valid && binding_valid && reproducible_build_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, registry_valid, manifest_valid, integrity_valid, sbom_valid, provenance_valid, signing_valid, binding_valid, reproducible_build_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayReleaseArtifactBuildIntegrity(result = runReleaseArtifactBuildIntegrity()): boolean {
  const replayed = runReleaseArtifactBuildIntegrity();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateReleaseArtifactBuildIntegrity(result).valid;
}

export function getReleaseArtifactBuildIntegrityBundle(): ReleaseArtifactBuildIntegrityBundle {
  const result = runReleaseArtifactBuildIntegrity();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-readiness-foundation/v15.1" as const, lifecycle, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateReleaseArtifactBuildIntegrity(result) });
}

export const ReleaseArtifactBuildIntegrityService = Object.freeze({ run: runReleaseArtifactBuildIntegrity, validate: validateReleaseArtifactBuildIntegrity, replay: replayReleaseArtifactBuildIntegrity });
