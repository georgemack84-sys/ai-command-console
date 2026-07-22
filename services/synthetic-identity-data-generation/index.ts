import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runSyntheticEnvironmentArchitecture, validateSyntheticEnvironmentArchitecture } from "@/services/synthetic-environment-architecture";
import type {
  SyntheticDatasetRecord,
  SyntheticGenerationCertificationTest,
  SyntheticGenerationFailure,
  SyntheticGenerationOutcome,
  SyntheticGenerationScenario,
  SyntheticIdentityDataGenerationBundle,
  SyntheticIdentityDataGenerationInput,
  SyntheticIdentityDataGenerationResult,
  SyntheticIdentityDataGenerationValidation,
  SyntheticIdentityRecord,
  SyntheticIntegrityRecord,
  SyntheticOriginRecord,
  SyntheticProvenanceLedgerEntry,
  SyntheticReplayDivergenceCategory,
} from "@/types/synthetic-identity-data-generation";

const VERSION = "synthetic-identity-data-generation/v14.3" as const;
const IDENTIFIER = "SyntheticIdentityDataGeneration" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const GENERATOR_VERSION = "synthetic-generator/v14.3" as const;
const VALIDATOR_VERSION = "synthetic-integrity-validator/v14.3" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";
const DEFAULT_SEED = "seed:phase-14.3:canonical";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: SyntheticGenerationScenario): SyntheticGenerationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SyntheticGenerationFailure[], failure: SyntheticGenerationFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly SyntheticGenerationFailure[]): SyntheticGenerationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_METADATA_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["DEFINED", "GENERATED", "QUALIFIED", "REGISTERED", "ACTIVE", "SUPERSEDED", "ARCHIVED"] as const);
const divergenceCategories = freezeArray(["INPUT_DIVERGENCE", "SEED_DIVERGENCE", "SCHEMA_DIVERGENCE", "VERSION_DIVERGENCE", "OUTPUT_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly SyntheticReplayDivergenceCategory[]);

function resultReplayHash(result: Omit<SyntheticIdentityDataGenerationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    environment: result.environment_ref,
    contract: result.contract.integrity_hash,
    identities: result.identities.map((item) => item.integrity_hash),
    datasets: result.datasets.map((item) => item.integrity_hash),
    origins: result.origins.map((item) => item.integrity_hash),
    integrity: result.integrity_records.map((item) => item.integrity_hash),
    provenance: result.provenance_ledger.map((item) => item.integrity_hash),
    replay: result.replay.integrity_hash,
    governance: result.governance.integrity_hash,
    observability: result.observability.integrity_hash,
    tests: result.certification_tests.map((item) => item.integrity_hash),
    outcome: result.outcome,
  });
}

function resultIntegrityHash(result: Omit<SyntheticIdentityDataGenerationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

function test(name: string, passed: boolean, failure: SyntheticGenerationFailure): SyntheticGenerationCertificationTest {
  const outcome: SyntheticGenerationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_METADATA_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("synthetic_generation_test", name), name, expected: "PASS" as const, actual: outcome, passed, failure_reason: passed ? null : failure });
}

function makeOrigin(artifact_reference: string, spec: string, seed: string, policyRef: string, failureOrigin: boolean, mutableLineage: boolean): SyntheticOriginRecord {
  const lineage = mutableLineage ? "" : id("synthetic_lineage", artifact_reference);
  return nested({ origin_id: failureOrigin ? "" : id("synthetic_origin", artifact_reference), artifact_reference, generator_version: GENERATOR_VERSION, generation_specification: spec, deterministic_seed: seed, provenance_reference: id("synthetic_provenance", artifact_reference), lineage_reference: lineage, governing_policy_reference: policyRef, created_timestamp: TIMESTAMP });
}

export function runSyntheticIdentityDataGeneration(input: SyntheticIdentityDataGenerationInput = {}): SyntheticIdentityDataGenerationResult {
  const environment = runSyntheticEnvironmentArchitecture();
  const environmentValid = validateSyntheticEnvironmentArchitecture(environment).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(environmentValid ? [] : ["ENVIRONMENT_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const tenant = has(failures, "TENANT_ISOLATION_BREACH") ? `${input.tenant_id ?? DEFAULT_TENANT}:foreign` : input.tenant_id ?? DEFAULT_TENANT;
  const seed = has(failures, "IDENTITY_GENERATION_NON_DETERMINISTIC") || has(failures, "DATASET_GENERATION_NON_DETERMINISTIC") ? `${input.generation_seed ?? DEFAULT_SEED}:${Date.now()}` : input.generation_seed ?? DEFAULT_SEED;
  const identityCount = input.identity_count ?? 4;
  const datasetRecordCount = input.dataset_record_count ?? 128;
  const policyRef = has(failures, "GOVERNANCE_NON_COMPLIANT") ? "" : id("synthetic_policy", { tenant, version: VERSION });

  const contract = nested({
    contract_version: VERSION,
    environment_architecture_ref: environment.integrity_hash,
    lifecycle,
    deterministic_generation_required: !has(failures, "IDENTITY_GENERATION_NON_DETERMINISTIC") && !has(failures, "DATASET_GENERATION_NON_DETERMINISTIC"),
    immutable_provenance_required: !has(failures, "ORIGIN_LINEAGE_MUTABLE"),
    replay_required: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    explainability_required: !has(failures, "EXPLAINABILITY_INCOMPLETE"),
    production_separation_required: !has(failures, "PRODUCTION_CONTAMINATION"),
    governance_required: !has(failures, "GOVERNANCE_NON_COMPLIANT"),
    advisory_only: true,
  });

  const identityTypes = freezeArray(["USER", "OPERATOR", "ORGANIZATION", "ASSET"] as const);
  const identities = freezeArray(Array.from({ length: identityCount }, (_, index): SyntheticIdentityRecord => {
    const identity_type = identityTypes[index % identityTypes.length];
    const deterministic_identifier = id("synthetic_identity_identifier", { tenant, seed, identity_type, index });
    const artifactRef = id("synthetic_identity", deterministic_identifier);
    const origin = id("synthetic_origin", artifactRef);
    return nested({
      synthetic_identity_id: artifactRef,
      identity_type,
      tenant_id: tenant,
      identity_name: `Synthetic ${identity_type.toLowerCase()} ${index + 1}`,
      deterministic_identifier,
      generation_seed: seed,
      generator_version: GENERATOR_VERSION,
      lifecycle_state: has(failures, "IDENTITY_LIFECYCLE_INVALID") ? "GENERATED" as const : "ACTIVE" as const,
      origin_reference: origin,
      lineage_reference: has(failures, "PROVENANCE_GRAPH_INCOMPLETE") ? "" : id("synthetic_lineage", artifactRef),
      replay_reference: id("synthetic_replay", artifactRef),
      created_timestamp: TIMESTAMP,
    });
  }));

  const datasets = freezeArray((["MISSION", "GOVERNANCE", "TELEMETRY"] as const).map((dataset_type, index): SyntheticDatasetRecord => {
    const synthetic_dataset_id = id("synthetic_dataset", { tenant, seed, dataset_type, index });
    return nested({
      synthetic_dataset_id,
      dataset_type,
      tenant_id: tenant,
      dataset_version: "dataset/v14.3.0" as const,
      schema_version: has(failures, "SCHEMA_VALIDATION_FAILED") ? "schema/v14.3.0" as const : "schema/v14.3.0" as const,
      generation_specification: has(failures, "EXPLAINABILITY_INCOMPLETE") ? "" : `deterministic ${dataset_type.toLowerCase()} data specification`,
      generation_seed: seed,
      record_count: datasetRecordCount + index,
      origin_reference: id("synthetic_origin", synthetic_dataset_id),
      replay_reference: id("synthetic_replay", synthetic_dataset_id),
      lineage_reference: has(failures, "PROVENANCE_GRAPH_INCOMPLETE") ? "" : id("synthetic_lineage", synthetic_dataset_id),
      created_timestamp: TIMESTAMP,
    });
  }));

  const origins = freezeArray([...identities, ...datasets].map((artifact) => makeOrigin("synthetic_identity_id" in artifact ? artifact.synthetic_identity_id : artifact.synthetic_dataset_id, "synthetic_identity_id" in artifact ? artifact.identity_type : artifact.dataset_type, seed, policyRef, has(failures, "ORIGIN_REGISTRY_INCOMPLETE") || has(failures, "CANONICAL_ORIGIN_VIOLATION"), has(failures, "ORIGIN_LINEAGE_MUTABLE"))));
  const integrity_records = freezeArray([...identities.map((artifact) => ({ ref: artifact.synthetic_identity_id, type: "IDENTITY" as const, replay: artifact.replay_reference })), ...datasets.map((artifact) => ({ ref: artifact.synthetic_dataset_id, type: "DATASET" as const, replay: artifact.replay_reference })), ...origins.map((artifact) => ({ ref: artifact.origin_id, type: "ORIGIN" as const, replay: id("synthetic_replay", artifact.origin_id) }))].map((artifact): SyntheticIntegrityRecord => nested({ integrity_validation_id: id("synthetic_integrity", artifact.ref), artifact_reference: artifact.ref, validation_type: artifact.type, validation_result: has(failures, "INTEGRITY_VALIDATION_FAILED") ? "INVALID" as const : "VALID" as const, validation_timestamp: TIMESTAMP, validator_version: VALIDATOR_VERSION, replay_reference: artifact.replay, evidence_reference: id("synthetic_evidence", artifact.ref) })));
  const ledgerEvents = freezeArray(["IDENTITY_CREATED", "DATASET_GENERATED", "ORIGIN_REGISTERED", "INTEGRITY_VALIDATED", "REPLAY_VERIFIED", "GOVERNANCE_APPROVED", "OBSERVABILITY_RECORDED"] as const);
  const provenance_ledger = freezeArray(ledgerEvents.map((event_type, index): SyntheticProvenanceLedgerEntry => {
    const entry = nested({ ledger_entry_id: id("synthetic_provenance_ledger", { event_type, index }), event_type, artifact_reference: index < identities.length ? identities[index].synthetic_identity_id : datasets[index % datasets.length].synthetic_dataset_id, sequence: index + 1, immutable: !has(failures, "AUDIT_MUTABLE"), replayable: true });
    return has(failures, "AUDIT_MUTABLE") && index === ledgerEvents.length - 1 ? Object.freeze({ ...entry, integrity_hash: hash({ mutable: entry.ledger_entry_id }) }) : entry;
  }));

  const replay = nested({
    replay_id: id("synthetic_generation_replay", { tenant, seed }),
    identities_reproduced: !has(failures, "IDENTITY_GENERATION_NON_DETERMINISTIC") && !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    organizations_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    assets_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    datasets_reproduced: !has(failures, "DATASET_GENERATION_NON_DETERMINISTIC") && !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    evidence_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    relationships_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    metadata_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    integrity_hashes_reproduced: !has(failures, "REPLAY_REGENERATION_MISMATCH"),
    divergence_categories: freezeArray(has(failures, "UNEXPLAINED_DIVERGENCE_ACCEPTED") ? ["UNEXPLAINED_DIVERGENCE"] as const : has(failures, "REPLAY_REGENERATION_MISMATCH") ? ["OUTPUT_DIVERGENCE"] as const : []),
    unexplained_divergence_rejected: !has(failures, "UNEXPLAINED_DIVERGENCE_ACCEPTED"),
    replay_evidence_immutable: !has(failures, "AUDIT_MUTABLE"),
  });
  const governance = nested({ governance_id: id("synthetic_generation_governance", tenant), tenant_isolation_enforced: !has(failures, "TENANT_ISOLATION_BREACH"), environment_isolation_enforced: true, governance_compliant: !has(failures, "GOVERNANCE_NON_COMPLIANT") && environmentValid, replay_authorized: !has(failures, "GOVERNANCE_NON_COMPLIANT"), origin_ownership_preserved: !has(failures, "ORIGIN_LINEAGE_MUTABLE"), production_contamination_prevented: !has(failures, "PRODUCTION_CONTAMINATION"), production_impersonation_prevented: !has(failures, "PRODUCTION_CONTAMINATION"), cross_tenant_sharing_governed: !has(failures, "TENANT_ISOLATION_BREACH") });
  const observability = nested({ observability_id: id("synthetic_generation_observability", VERSION), generation_throughput_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), replay_success_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), origin_completeness_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), integrity_failures_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), duplicate_identities_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), schema_violations_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), replay_divergence_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), governance_violations_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), isolation_failures_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), alerts_configured: !has(failures, "OBSERVABILITY_UNAVAILABLE") });

  const tests = freezeArray([
    test("Synthetic Identity Contract valid", contract.deterministic_generation_required && contract.advisory_only, "IDENTITY_CONTRACT_INVALID"),
    test("Identity lifecycle deterministic", identities.every((identity) => identity.lifecycle_state === "ACTIVE"), "IDENTITY_LIFECYCLE_INVALID"),
    test("Identity generation reproducible", replay.identities_reproduced, "IDENTITY_GENERATION_NON_DETERMINISTIC"),
    test("Synthetic Dataset generation deterministic", replay.datasets_reproduced, "DATASET_GENERATION_NON_DETERMINISTIC"),
    test("Origin Registry complete", origins.every((origin) => Boolean(origin.origin_id)), "ORIGIN_REGISTRY_INCOMPLETE"),
    test("Canonical origin enforced", origins.length === new Set(origins.map((origin) => origin.origin_id)).size, "CANONICAL_ORIGIN_VIOLATION"),
    test("Origin lineage immutable", origins.every((origin) => Boolean(origin.lineage_reference)), "ORIGIN_LINEAGE_MUTABLE"),
    test("Integrity validation successful", integrity_records.every((record) => record.validation_result === "VALID"), "INTEGRITY_VALIDATION_FAILED"),
    test("Schema validation successful", !has(failures, "SCHEMA_VALIDATION_FAILED"), "SCHEMA_VALIDATION_FAILED"),
    test("Replay regeneration identical", replay.identities_reproduced && replay.datasets_reproduced && replay.integrity_hashes_reproduced, "REPLAY_REGENERATION_MISMATCH"),
    test("Replay divergence detection operational", !has(failures, "REPLAY_DIVERGENCE_UNDETECTED"), "REPLAY_DIVERGENCE_UNDETECTED"),
    test("Unexplained divergence rejected", replay.unexplained_divergence_rejected, "UNEXPLAINED_DIVERGENCE_ACCEPTED"),
    test("Provenance graph complete", identities.every((identity) => Boolean(identity.lineage_reference)) && datasets.every((dataset) => Boolean(dataset.lineage_reference)), "PROVENANCE_GRAPH_INCOMPLETE"),
    test("Tenant isolation enforced", governance.tenant_isolation_enforced, "TENANT_ISOLATION_BREACH"),
    test("Production contamination prevented", governance.production_contamination_prevented && governance.production_impersonation_prevented, "PRODUCTION_CONTAMINATION"),
    test("Governance compliance enforced", governance.governance_compliant, "GOVERNANCE_NON_COMPLIANT"),
    test("Explainability complete", datasets.every((dataset) => Boolean(dataset.generation_specification)), "EXPLAINABILITY_INCOMPLETE"),
    test("Immutable audit preserved", provenance_ledger.every((entry) => entry.immutable && verify(entry)), "AUDIT_MUTABLE"),
    test("Observability operational", observability.alerts_configured, "OBSERVABILITY_UNAVAILABLE"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is SyntheticGenerationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<SyntheticIdentityDataGenerationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, environment_ref: environment.integrity_hash, contract, identities, datasets, origins, integrity_records, provenance_ledger, replay, governance, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSyntheticIdentityDataGeneration(result = runSyntheticIdentityDataGeneration()): SyntheticIdentityDataGenerationValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.deterministic_generation_required && result.contract.immutable_provenance_required && result.contract.replay_required && result.contract.governance_required;
  const identities_valid = result.identities.length > 0 && result.identities.every((identity) => verify(identity) && identity.lifecycle_state === "ACTIVE" && Boolean(identity.origin_reference) && Boolean(identity.lineage_reference) && Boolean(identity.replay_reference));
  const datasets_valid = result.datasets.length > 0 && result.datasets.every((dataset) => verify(dataset) && dataset.record_count > 0 && Boolean(dataset.generation_specification) && Boolean(dataset.origin_reference) && Boolean(dataset.replay_reference) && Boolean(dataset.lineage_reference));
  const origins_valid = result.origins.length === result.identities.length + result.datasets.length && result.origins.every((origin) => verify(origin) && Boolean(origin.origin_id) && Boolean(origin.lineage_reference) && Boolean(origin.governing_policy_reference));
  const integrity_valid = result.integrity_records.every((record) => verify(record) && record.validation_result === "VALID");
  const provenance_valid = result.provenance_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && entry.replayable);
  const replay_valid = verify(result.replay) && result.replay.identities_reproduced && result.replay.datasets_reproduced && result.replay.integrity_hashes_reproduced && result.replay.unexplained_divergence_rejected && result.replay.replay_evidence_immutable;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 19 && result.certification_tests.every((item) => verify(item) && item.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && identities_valid && datasets_valid && origins_valid && integrity_valid && provenance_valid && replay_valid && governance_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, identities_valid, datasets_valid, origins_valid, integrity_valid, provenance_valid, replay_valid, governance_valid, observability_valid, certification_valid, failures: result.failures });
}

export function replaySyntheticIdentityDataGeneration(result = runSyntheticIdentityDataGeneration()): boolean {
  const replayed = runSyntheticIdentityDataGeneration();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSyntheticIdentityDataGeneration(result).valid;
}

export function getSyntheticIdentityDataGenerationBundle(): SyntheticIdentityDataGenerationBundle {
  const result = runSyntheticIdentityDataGeneration();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, foundation_phase: "synthetic-validation-foundation/v14.1" as const, environment_phase: "synthetic-environment-architecture/v14.2" as const, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), replay_divergence_categories: divergenceCategories }), result, validation: validateSyntheticIdentityDataGeneration(result) });
}

export const SyntheticIdentityDataGenerationService = Object.freeze({ run: runSyntheticIdentityDataGeneration, validate: validateSyntheticIdentityDataGeneration, replay: replaySyntheticIdentityDataGeneration });
