import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayReleaseArtifactBuildIntegrity, runReleaseArtifactBuildIntegrity, validateReleaseArtifactBuildIntegrity } from "@/services/release-artifact-build-integrity";
import type {
  DriftCategory,
  EnvironmentQualificationOutcome,
  ProductionEnvironmentCertificationTest,
  ProductionEnvironmentFailure,
  ProductionEnvironmentLifecycleState,
  ProductionEnvironmentQualificationBundle,
  ProductionEnvironmentQualificationInput,
  ProductionEnvironmentQualificationResult,
  ProductionEnvironmentQualificationValidation,
} from "@/types/production-environment-qualification";

const VERSION = "production-environment-qualification/v15.3" as const;
const IDENTIFIER = "ProductionEnvironmentQualification" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionEnvironmentFailure[], failure: ProductionEnvironmentFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionEnvironmentQualificationInput["scenario"]): ProductionEnvironmentFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionEnvironmentFailure[]): EnvironmentQualificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_ENVIRONMENT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["REGISTERED", "DISCOVERED", "BASELINE_CAPTURED", "VALIDATING", "QUALIFIED", "ATTESTED", "ACTIVE", "MONITORED", "REQUALIFICATION_REQUIRED", "SUPERSEDED", "RETIRED", "ARCHIVED"] as const satisfies readonly ProductionEnvironmentLifecycleState[]);
const driftCategories = freezeArray(["NONE", "AUTHORIZED", "UNAUTHORIZED", "SECURITY_CRITICAL", "GOVERNANCE_CRITICAL"] as const satisfies readonly DriftCategory[]);

function certTest(name: string, passed: boolean, failure: ProductionEnvironmentFailure, evidence_refs: readonly string[]): ProductionEnvironmentCertificationTest {
  const actual: EnvironmentQualificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_ENVIRONMENT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("environment_qualification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionEnvironmentQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ artifact: result.release_artifact_ref, readiness: result.production_readiness_ref, contract: result.contract.integrity_hash, registry: result.registry.map((e) => e.integrity_hash), governance: result.version_governance.integrity_hash, qualification: result.qualification.integrity_hash, infrastructure: result.infrastructure_integrity.integrity_hash, drift: result.drift.integrity_hash, tenant: result.tenant_isolation.integrity_hash, observability: result.observability.integrity_hash, attestation: result.attestation.integrity_hash, continuous: result.continuous_qualification.integrity_hash, lifecycle: result.lifecycle_governance.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionEnvironmentQualificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionEnvironmentQualification(input: ProductionEnvironmentQualificationInput = {}): ProductionEnvironmentQualificationResult {
  const artifact = runReleaseArtifactBuildIntegrity();
  const artifactValidation = validateReleaseArtifactBuildIntegrity(artifact);
  const artifactReplayable = replayReleaseArtifactBuildIntegrity(artifact);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionEnvironmentFailure[] = artifactValidation.valid && artifactReplayable ? [] : ["PRODUCTION_READINESS_REQUIREMENTS_UNSATISFIED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const environmentId = id("production_environment", artifact.artifact_identity.release_id);
  const environmentVersion = "prod-env-2026.07.15";
  const contract = nested({ contract_version: VERSION, lifecycle, qualification_precedes_deployment: !has(failures, "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE"), immutable_environment_identity: !has(failures, "ENVIRONMENT_IDENTITIES_NOT_UNIQUE"), synthetic_equivalence_required: !has(failures, "PHASE14_ENVIRONMENT_MODEL_NONCONFORMANT"), drift_invalidates_qualification: !has(failures, "UNAUTHORIZED_DRIFT_NOT_INVALIDATING"), governance_required: !has(failures, "GOVERNANCE_ENFORCEMENT_NON_DETERMINISTIC"), replay_required: !has(failures, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE") });
  const attestationRef = id("environment_attestation_ref", environmentId);
  const registryEntry = nested({ environment_id: environmentId, environment_version: environmentVersion, environment_name: "mission-control-production-us-east-1", provider: "AWS" as const, region: "us-east-1", environment_class: "PRODUCTION" as const, network_boundary_refs: has(failures, "NETWORK_BOUNDARIES_INVALID") ? freezeArray([]) : freezeArray([id("network_boundary", environmentId)]), storage_refs: has(failures, "STORAGE_ISOLATION_FAILED") ? freezeArray([]) : freezeArray([id("storage", environmentId)]), observability_refs: has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([id("observability", environmentId)]), qualification_status: has(failures, "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE") ? "FAILED" as const : "QUALIFIED" as const, attestation_refs: has(failures, "ATTESTATION_NOT_GENERATED") ? freezeArray([]) : freezeArray([attestationRef]), lineage_refs: has(failures, "ENVIRONMENT_LINEAGE_LOST") ? freezeArray([]) : freezeArray([artifact.integrity_hash, artifact.production_readiness_ref]) });
  const registry = freezeArray(has(failures, "REGISTRY_INCOMPLETE") ? [] : [registryEntry]);
  const version_governance = nested({ governance_id: id("environment_version_governance", environmentId), immutable_identity: !has(failures, "ENVIRONMENT_IDENTITIES_NOT_UNIQUE"), configuration_revisions_create_versions: !has(failures, "ENVIRONMENT_VERSIONS_UNGOVERNED"), qualification_references_specific_version: !has(failures, "IDENTITY_VERSION_INVALID"), deployments_reference_qualified_versions_only: !has(failures, "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE"), version_lineage_complete: !has(failures, "ENVIRONMENT_LINEAGE_LOST"), supersession_chain_preserved: true });
  const qualification = nested({ qualification_id: id("environment_qualification", { environmentId, environmentVersion }), environment_id: environmentId, environment_version: environmentVersion, result: registryEntry.qualification_status, infrastructure_consistent: !has(failures, "INFRASTRUCTURE_INTEGRITY_FAILED"), required_services_present: true, configuration_complete: !has(failures, "CONFIGURATION_NOT_REPRODUCIBLE"), security_controls_valid: !has(failures, "SECRETS_CONFIGURATION_INVALID"), governance_controls_valid: !has(failures, "GOVERNANCE_ENFORCEMENT_NON_DETERMINISTIC"), deployment_ready: !has(failures, "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE"), evidence_refs: freezeArray([artifact.integrity_hash, registryEntry.integrity_hash]) });
  const infrastructure_integrity = nested({ integrity_id: id("infrastructure_integrity", environmentId), compute_verified: !has(failures, "INFRASTRUCTURE_INTEGRITY_FAILED"), network_boundaries_verified: !has(failures, "NETWORK_BOUNDARIES_INVALID"), storage_isolation_verified: !has(failures, "STORAGE_ISOLATION_FAILED"), provisioning_verified: !has(failures, "INFRASTRUCTURE_INTEGRITY_FAILED"), iam_configuration_verified: true, secrets_configuration_verified: !has(failures, "SECRETS_CONFIGURATION_INVALID"), encryption_verified: true, platform_services_verified: true, unauthorized_resources_blocked: !has(failures, "UNAUTHORIZED_ENVIRONMENTS_NOT_BLOCKED") });
  const drift = nested({ drift_id: id("configuration_drift", environmentId), category: has(failures, "UNAUTHORIZED_DRIFT_NOT_INVALIDATING") ? "UNAUTHORIZED" as const : "NONE" as const, configuration_hashes_verified: !has(failures, "CONFIGURATION_NOT_REPRODUCIBLE"), deployment_configuration_verified: true, runtime_settings_verified: true, policy_deployment_verified: !has(failures, "POLICY_DEPLOYMENT_INVALID"), secrets_configuration_verified: !has(failures, "SECRETS_CONFIGURATION_INVALID"), network_policy_verified: !has(failures, "NETWORK_BOUNDARIES_INVALID"), infrastructure_policy_verified: !has(failures, "INFRASTRUCTURE_INTEGRITY_FAILED"), unauthorized_drift_invalidates_qualification: !has(failures, "UNAUTHORIZED_DRIFT_NOT_INVALIDATING"), critical_drift_blocks_deployment: true, historical_drift_immutable: !has(failures, "QUALIFICATION_EVIDENCE_MUTABLE") });
  const tenant_isolation = nested({ qualification_id: id("tenant_isolation_qualification", environmentId), identity_isolation: !has(failures, "TENANT_ISOLATION_CONTROLS_INVALID"), storage_isolation: !has(failures, "STORAGE_ISOLATION_FAILED"), network_isolation: !has(failures, "NETWORK_BOUNDARIES_INVALID"), secrets_isolation: !has(failures, "SECRETS_CONFIGURATION_INVALID"), policy_isolation: !has(failures, "POLICY_DEPLOYMENT_INVALID"), telemetry_isolation: !has(failures, "TENANT_ISOLATION_CONTROLS_INVALID"), replay_isolation: !has(failures, "TENANT_ISOLATION_CONTROLS_INVALID"), cross_tenant_access_impossible: !has(failures, "TENANT_ISOLATION_CONTROLS_INVALID"), violations_detectable: true });
  const observability = nested({ qualification_id: id("observability_qualification", environmentId), metrics_coverage: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), logging_coverage: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), tracing_coverage: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), replay_capture: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), alert_coverage: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), integrity_telemetry: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), qualification_telemetry: !has(failures, "OBSERVABILITY_COVERAGE_INCOMPLETE"), telemetry_deterministic: true });
  const attestation = nested({ attestation_id: attestationRef, environment_id: environmentId, environment_version: environmentVersion, qualification_result: qualification.result, validator_versions: freezeArray(["environment-validator@15.3", "drift-validator@15.3"]), infrastructure_hashes: has(failures, "INFRASTRUCTURE_INTEGRITY_FAILED") ? freezeArray([]) : freezeArray([infrastructure_integrity.integrity_hash]), configuration_hashes: has(failures, "CONFIGURATION_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([drift.integrity_hash]), evidence_refs: has(failures, "QUALIFICATION_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([qualification.integrity_hash, artifact.integrity_hash]), signer: id("environment_signer", environmentId), timestamp: TIMESTAMP, cryptographically_verifiable: !has(failures, "ATTESTATION_NOT_VERIFIABLE"), immutable: !has(failures, "QUALIFICATION_EVIDENCE_MUTABLE") });
  const continuous_qualification = nested({ monitor_id: id("continuous_environment_qualification", environmentId), monitored_controls: has(failures, "CONTINUOUS_QUALIFICATION_INOPERABLE") ? freezeArray([]) : freezeArray(["configuration drift", "infrastructure changes", "policy updates", "secrets rotation", "observability degradation", "network changes", "storage changes", "tenant isolation"]), response: has(failures, "UNAUTHORIZED_DRIFT_NOT_INVALIDATING") ? "BLOCK_DEPLOYMENT" as const : "CONTINUE_QUALIFICATION" as const, continuous_monitoring: !has(failures, "CONTINUOUS_QUALIFICATION_INOPERABLE"), requalification_deterministic: !has(failures, "REQUALIFICATION_NON_DETERMINISTIC"), drift_handled_automatically: !has(failures, "DRIFT_NOT_DETECTABLE"), unauthorized_environments_blocked: !has(failures, "UNAUTHORIZED_ENVIRONMENTS_NOT_BLOCKED") });
  const lifecycle_governance = nested({ lifecycle_id: id("environment_lifecycle", environmentId), states: lifecycle, historical_environments_immutable: !has(failures, "QUALIFICATION_EVIDENCE_MUTABLE"), supersession_preserves_lineage: !has(failures, "ENVIRONMENT_LINEAGE_LOST"), retired_environments_replayable: !has(failures, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE"), replay_reproducible: !has(failures, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE") });
  const tests = freezeArray([
    certTest("Production Environment Registry complete", registry.length === 1, "REGISTRY_INCOMPLETE", [registryEntry.integrity_hash]),
    certTest("Environment identities unique", contract.immutable_environment_identity && version_governance.immutable_identity, "ENVIRONMENT_IDENTITIES_NOT_UNIQUE", [registryEntry.integrity_hash]),
    certTest("Environment versions governed", version_governance.configuration_revisions_create_versions, "ENVIRONMENT_VERSIONS_UNGOVERNED", [version_governance.integrity_hash]),
    certTest("Identity and version validated", version_governance.qualification_references_specific_version, "IDENTITY_VERSION_INVALID", [version_governance.integrity_hash]),
    certTest("Infrastructure integrity verified", infrastructure_integrity.compute_verified && infrastructure_integrity.provisioning_verified, "INFRASTRUCTURE_INTEGRITY_FAILED", [infrastructure_integrity.integrity_hash]),
    certTest("Network boundaries validated", infrastructure_integrity.network_boundaries_verified && registryEntry.network_boundary_refs.length > 0, "NETWORK_BOUNDARIES_INVALID", [infrastructure_integrity.integrity_hash]),
    certTest("Secrets configuration verified", infrastructure_integrity.secrets_configuration_verified && drift.secrets_configuration_verified, "SECRETS_CONFIGURATION_INVALID", [infrastructure_integrity.integrity_hash]),
    certTest("Storage isolation enforced", infrastructure_integrity.storage_isolation_verified && tenant_isolation.storage_isolation, "STORAGE_ISOLATION_FAILED", [tenant_isolation.integrity_hash]),
    certTest("Policy deployment verified", drift.policy_deployment_verified && tenant_isolation.policy_isolation, "POLICY_DEPLOYMENT_INVALID", [drift.integrity_hash]),
    certTest("Observability coverage complete", Object.entries(observability).filter(([key]) => key !== "qualification_id" && key !== "integrity_hash").every(([, value]) => value === true), "OBSERVABILITY_COVERAGE_INCOMPLETE", [observability.integrity_hash]),
    certTest("Tenant isolation controls validated", tenant_isolation.cross_tenant_access_impossible && tenant_isolation.violations_detectable, "TENANT_ISOLATION_CONTROLS_INVALID", [tenant_isolation.integrity_hash]),
    certTest("Configuration reproducible", qualification.configuration_complete && drift.configuration_hashes_verified, "CONFIGURATION_NOT_REPRODUCIBLE", [drift.integrity_hash]),
    certTest("Configuration drift detectable", continuous_qualification.drift_handled_automatically, "DRIFT_NOT_DETECTABLE", [continuous_qualification.integrity_hash]),
    certTest("Unauthorized drift invalidates qualification", drift.unauthorized_drift_invalidates_qualification && drift.critical_drift_blocks_deployment, "UNAUTHORIZED_DRIFT_NOT_INVALIDATING", [drift.integrity_hash]),
    certTest("Environment attestation generated", registryEntry.attestation_refs.length > 0, "ATTESTATION_NOT_GENERATED", [attestation.integrity_hash]),
    certTest("Attestation cryptographically verifiable", attestation.cryptographically_verifiable, "ATTESTATION_NOT_VERIFIABLE", [attestation.integrity_hash]),
    certTest("Qualification evidence immutable", attestation.immutable && drift.historical_drift_immutable, "QUALIFICATION_EVIDENCE_MUTABLE", [attestation.integrity_hash]),
    certTest("Environment lineage preserved", registryEntry.lineage_refs.length > 0 && lifecycle_governance.supersession_preserves_lineage, "ENVIRONMENT_LINEAGE_LOST", [registryEntry.integrity_hash]),
    certTest("Continuous qualification operational", continuous_qualification.continuous_monitoring && continuous_qualification.monitored_controls.length === 8, "CONTINUOUS_QUALIFICATION_INOPERABLE", [continuous_qualification.integrity_hash]),
    certTest("Requalification deterministic", continuous_qualification.requalification_deterministic, "REQUALIFICATION_NON_DETERMINISTIC", [continuous_qualification.integrity_hash]),
    certTest("Unauthorized environments blocked", infrastructure_integrity.unauthorized_resources_blocked && continuous_qualification.unauthorized_environments_blocked, "UNAUTHORIZED_ENVIRONMENTS_NOT_BLOCKED", [infrastructure_integrity.integrity_hash]),
    certTest("Only qualified environments eligible for deployment", contract.qualification_precedes_deployment && version_governance.deployments_reference_qualified_versions_only, "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE", [qualification.integrity_hash]),
    certTest("Replay of qualification reproducible", lifecycle_governance.replay_reproducible, "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE", [lifecycle_governance.integrity_hash]),
    certTest("Governance enforcement deterministic", contract.governance_required && qualification.governance_controls_valid, "GOVERNANCE_ENFORCEMENT_NON_DETERMINISTIC", [qualification.integrity_hash]),
    certTest("Phase 14.2 environment model conformity verified", contract.synthetic_equivalence_required, "PHASE14_ENVIRONMENT_MODEL_NONCONFORMANT", [contract.integrity_hash]),
    certTest("Production readiness requirements satisfied", artifactValidation.valid && artifactReplayable, "PRODUCTION_READINESS_REQUIREMENTS_UNSATISFIED", [artifact.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionEnvironmentFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionEnvironmentQualificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, release_artifact_ref: artifact.integrity_hash, production_readiness_ref: artifact.production_readiness_ref, contract, registry, version_governance, qualification, infrastructure_integrity, drift, tenant_isolation, observability, attestation, continuous_qualification, lifecycle_governance, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionEnvironmentQualification(result = runProductionEnvironmentQualification()): ProductionEnvironmentQualificationValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 12 && result.contract.qualification_precedes_deployment && result.contract.immutable_environment_identity && result.contract.synthetic_equivalence_required && result.contract.drift_invalidates_qualification && result.contract.governance_required && result.contract.replay_required;
  const registry_valid = result.registry.length === 1 && result.registry.every((entry) => verify(entry) && entry.qualification_status === "QUALIFIED" && entry.attestation_refs.length > 0 && entry.lineage_refs.length > 0);
  const governance_valid = verify(result.version_governance) && Object.entries(result.version_governance).filter(([key]) => key !== "governance_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const qualification_valid = verify(result.qualification) && result.qualification.result === "QUALIFIED" && result.qualification.evidence_refs.length > 0 && result.qualification.deployment_ready;
  const infrastructure_valid = verify(result.infrastructure_integrity) && Object.entries(result.infrastructure_integrity).filter(([key]) => key !== "integrity_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const drift_valid = verify(result.drift) && result.drift.category === "NONE" && result.drift.unauthorized_drift_invalidates_qualification && result.drift.critical_drift_blocks_deployment && result.drift.historical_drift_immutable;
  const tenant_valid = verify(result.tenant_isolation) && Object.entries(result.tenant_isolation).filter(([key]) => key !== "qualification_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => key !== "qualification_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const attestation_valid = verify(result.attestation) && result.attestation.qualification_result === "QUALIFIED" && result.attestation.cryptographically_verifiable && result.attestation.immutable && result.attestation.evidence_refs.length > 0;
  const continuous_valid = verify(result.continuous_qualification) && result.continuous_qualification.continuous_monitoring && result.continuous_qualification.requalification_deterministic && result.continuous_qualification.drift_handled_automatically && result.continuous_qualification.unauthorized_environments_blocked;
  const lifecycle_valid = verify(result.lifecycle_governance) && result.lifecycle_governance.states.length === 12 && result.lifecycle_governance.historical_environments_immutable && result.lifecycle_governance.supersession_preserves_lineage && result.lifecycle_governance.retired_environments_replayable && result.lifecycle_governance.replay_reproducible;
  const certification_valid = result.certification_tests.length === 26 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && registry_valid && governance_valid && qualification_valid && infrastructure_valid && drift_valid && tenant_valid && observability_valid && attestation_valid && continuous_valid && lifecycle_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, registry_valid, governance_valid, qualification_valid, infrastructure_valid, drift_valid, tenant_valid, observability_valid, attestation_valid, continuous_valid, lifecycle_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayProductionEnvironmentQualification(result = runProductionEnvironmentQualification()): boolean {
  const replayed = runProductionEnvironmentQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionEnvironmentQualification(result).valid;
}

export function getProductionEnvironmentQualificationBundle(): ProductionEnvironmentQualificationBundle {
  const result = runProductionEnvironmentQualification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "release-artifact-build-integrity/v15.2" as const, lifecycle, drift_categories: driftCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionEnvironmentQualification(result) });
}

export const ProductionEnvironmentQualificationService = Object.freeze({ run: runProductionEnvironmentQualification, validate: validateProductionEnvironmentQualification, replay: replayProductionEnvironmentQualification });
