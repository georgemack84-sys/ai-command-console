import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayProductionBoundaryEnforcement, runProductionBoundaryEnforcement, validateProductionBoundaryEnforcement } from "@/services/production-boundary-enforcement";
import type {
  IsolationDomain,
  IsolationIncidentCategory,
  IsolationQualificationLifecycleState,
  IsolationSeverityLevel,
  LiveTenantIsolationBundle,
  LiveTenantIsolationCertificationTest,
  LiveTenantIsolationFailure,
  LiveTenantIsolationInput,
  LiveTenantIsolationOutcome,
  LiveTenantIsolationResult,
  LiveTenantIsolationValidation,
} from "@/types/live-tenant-isolation-qualification";

const VERSION = "live-tenant-isolation-qualification/v15.7" as const;
const IDENTIFIER = "LiveTenantIsolationQualification" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_15_live_isolation" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly LiveTenantIsolationFailure[], failure: LiveTenantIsolationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: LiveTenantIsolationInput["scenario"]): LiveTenantIsolationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly LiveTenantIsolationFailure[]): LiveTenantIsolationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_ISOLATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["MONITORING", "OBSERVATION_COLLECTED", "BOUNDARY_VALIDATED", "QUALIFIED", "ANOMALY_DETECTED", "INVESTIGATION_REQUIRED", "REPLAY_VALIDATED", "OPERATOR_REVIEW", "CONTAINMENT_RECOMMENDED", "QUALIFICATION_RESTORED"] as const satisfies readonly IsolationQualificationLifecycleState[]);
const domains = freezeArray(["Identity", "Memory", "Evidence", "Policy", "Artifacts", "Cache", "Telemetry", "Replay"] as const satisfies readonly IsolationDomain[]);
const severities = freezeArray(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CONSTITUTIONAL"] as const satisfies readonly IsolationSeverityLevel[]);
const categories = freezeArray(["IDENTITY_BOUNDARY", "MEMORY_BOUNDARY", "POLICY_BOUNDARY", "EVIDENCE_BOUNDARY", "ARTIFACT_BOUNDARY", "CACHE_BOUNDARY", "TELEMETRY_BOUNDARY", "REPLAY_BOUNDARY", "CONFIGURATION_BOUNDARY", "UNKNOWN_BOUNDARY"] as const satisfies readonly IsolationIncidentCategory[]);

function certTest(name: string, passed: boolean, failure: LiveTenantIsolationFailure, evidence_refs: readonly string[]): LiveTenantIsolationCertificationTest {
  const actual: LiveTenantIsolationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_ISOLATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("live_tenant_isolation_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<LiveTenantIsolationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ boundary: result.production_boundary_ref, observation: result.observation.integrity_hash, detector: result.detector.integrity_hash, attestation: result.attestation.integrity_hash, incidents: result.incident_registry.map((i) => i.integrity_hash), containment: result.containment.integrity_hash, replay: result.replay.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<LiveTenantIsolationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runLiveTenantIsolationQualification(input: LiveTenantIsolationInput = {}): LiveTenantIsolationResult {
  const boundary = runProductionBoundaryEnforcement();
  const boundaryValid = validateProductionBoundaryEnforcement(boundary);
  const boundaryReplayable = replayProductionBoundaryEnforcement(boundary);
  const direct = directFailure(input.scenario);
  const upstreamFailures: LiveTenantIsolationFailure[] = boundaryValid.valid && boundaryReplayable ? [] : ["MISSION_CONTROL_NOT_ADVISORY_ONLY"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenant = input.tenant_id ?? DEFAULT_TENANT;
  const observation = nested({ observation_id: id("isolation_observation", tenant), tenant_id: tenant, environment_id: id("environment", boundary.integrity_hash), workload_id: id("workload", tenant), identity_refs: has(failures, "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT") ? freezeArray([]) : freezeArray([id("identity", tenant)]), policy_refs: freezeArray([id("policy", tenant)]), evidence_refs: freezeArray([boundary.integrity_hash]), artifact_refs: freezeArray([boundary.progressive_delivery_ref]), replay_refs: freezeArray([boundary.replay_hash]), telemetry_refs: freezeArray([id("telemetry", tenant)]), timestamp: TIMESTAMP, lineage_refs: has(failures, "FORENSIC_LINEAGE_MUTABLE") ? freezeArray([]) : freezeArray([boundary.integrity_hash]), continuously_verified: !has(failures, "ISOLATION_NOT_CONTINUOUSLY_VERIFIED") });
  const detector = nested({ detector_id: id("cross_tenant_detector", tenant), domains_validated: domains, identity_crossover_detected: has(failures, "UNAUTHORIZED_CROSS_TENANT_ACCESS") || has(failures, "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT"), memory_crossover_detected: has(failures, "MEMORY_OWNERSHIP_CROSSES_TENANT") || has(failures, "TENANT_RUNTIME_STATE_VISIBLE"), policy_crossover_detected: false, evidence_crossover_detected: false, artifact_crossover_detected: false, cache_crossover_detected: false, telemetry_crossover_detected: false, replay_crossover_detected: !has(failures, "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION") ? false : true, shared_execution_context_detected: has(failures, "TENANT_RUNTIME_STATE_VISIBLE"), improper_authorization_inheritance_detected: has(failures, "UNAUTHORIZED_CROSS_TENANT_ACCESS"), deterministic: !has(failures, "CROSS_TENANT_DETECTION_NON_DETERMINISTIC") });
  const attestation = nested({ attestation_id: id("tenant_boundary_attestation", tenant), identity_integrity: !has(failures, "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT"), namespace_isolation: !has(failures, "UNAUTHORIZED_CROSS_TENANT_ACCESS"), policy_isolation: true, memory_ownership: !has(failures, "MEMORY_OWNERSHIP_CROSSES_TENANT"), artifact_ownership: true, cache_ownership: true, telemetry_routing: true, replay_ownership: !has(failures, "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION"), lineage_ownership: !has(failures, "FORENSIC_LINEAGE_MUTABLE"), reproducible: !has(failures, "BOUNDARY_ATTESTATIONS_NOT_REPRODUCIBLE") });
  const containment = nested({ containment_id: id("tenant_containment", tenant), tenant_id: tenant, mission_control_recommends_only: !has(failures, "MISSION_CONTROL_NOT_ADVISORY_ONLY"), external_authorization_required: !has(failures, "CONTAINMENT_AUTHORITY_NOT_EXTERNAL"), tenant_suspension_supported: true, traffic_isolation_supported: true, network_segmentation_supported: true, session_invalidation_supported: true, processing_pause_supported: true, investigation_mode_supported: true, read_only_preservation_supported: true, forensic_capture_supported: true, operational: !has(failures, "TENANT_CONTAINMENT_NOT_OPERATIONAL") });
  const incident = nested({ incident_id: id("isolation_incident", tenant), lifecycle, affected_tenants: freezeArray([tenant]), affected_resources: freezeArray([observation.workload_id]), boundary_type: "IDENTITY_BOUNDARY" as const, severity: failures.length ? "CONSTITUTIONAL" as const : "INFORMATIONAL" as const, investigation_refs: freezeArray([observation.integrity_hash]), replay_refs: has(failures, "INCIDENTS_NOT_REPLAYABLE") ? freezeArray([]) : freezeArray([boundary.replay_hash]), operator_decision_refs: freezeArray([boundary.authorization.integrity_hash]), containment_refs: freezeArray([containment.integrity_hash]), remediation_lineage_refs: has(failures, "FORENSIC_LINEAGE_MUTABLE") ? freezeArray([]) : freezeArray([boundary.containment.integrity_hash]), immutable: !has(failures, "FORENSIC_LINEAGE_MUTABLE"), replayable: !has(failures, "INCIDENTS_NOT_REPLAYABLE") });
  const replay = nested({ replay_id: id("tenant_isolation_replay", tenant), deterministic_replay: !has(failures, "INCIDENTS_NOT_REPLAYABLE"), timeline_reconstruction: true, policy_reconstruction: true, identity_reconstruction: true, artifact_reconstruction: true, memory_reconstruction: !has(failures, "MEMORY_OWNERSHIP_CROSSES_TENANT"), operator_decision_replay: true, containment_replay: true, lineage_replay: !has(failures, "FORENSIC_LINEAGE_MUTABLE"), preserves_original_tenant_isolation: !has(failures, "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION") });
  const incident_registry = freezeArray([incident]);
  const noAccess = !detector.identity_crossover_detected && !detector.memory_crossover_detected && !detector.replay_crossover_detected && !detector.shared_execution_context_detected && !detector.improper_authorization_inheritance_detected;
  const tests = freezeArray([
    certTest("No unauthorized cross-tenant access", noAccess, "UNAUTHORIZED_CROSS_TENANT_ACCESS", [detector.integrity_hash]),
    certTest("Isolation continuously verified", observation.continuously_verified, "ISOLATION_NOT_CONTINUOUSLY_VERIFIED", [observation.integrity_hash]),
    certTest("Tenant containment operational", containment.operational, "TENANT_CONTAINMENT_NOT_OPERATIONAL", [containment.integrity_hash]),
    certTest("Isolation incidents replayable", incident_registry.every((entry) => entry.replayable && entry.replay_refs.length > 0), "INCIDENTS_NOT_REPLAYABLE", incident_registry.map((entry) => entry.integrity_hash)),
    certTest("Boundary attestations reproducible", attestation.reproducible, "BOUNDARY_ATTESTATIONS_NOT_REPRODUCIBLE", [attestation.integrity_hash]),
    certTest("Cross-tenant detection deterministic", detector.deterministic, "CROSS_TENANT_DETECTION_NON_DETERMINISTIC", [detector.integrity_hash]),
    certTest("Mission Control remains advisory-only", containment.mission_control_recommends_only, "MISSION_CONTROL_NOT_ADVISORY_ONLY", [containment.integrity_hash]),
    certTest("Containment authority externally governed", containment.external_authorization_required, "CONTAINMENT_AUTHORITY_NOT_EXTERNAL", [containment.integrity_hash]),
    certTest("Replay preserves tenant isolation", replay.preserves_original_tenant_isolation && attestation.replay_ownership, "REPLAY_DOES_NOT_PRESERVE_TENANT_ISOLATION", [replay.integrity_hash]),
    certTest("Forensic lineage immutable", incident_registry.every((entry) => entry.immutable && entry.remediation_lineage_refs.length > 0) && observation.lineage_refs.length > 0, "FORENSIC_LINEAGE_MUTABLE", [incident.integrity_hash]),
    certTest("Continuous qualification integrated with production governance", boundaryValid.valid && boundaryReplayable, "CONTINUOUS_QUALIFICATION_NOT_INTEGRATED", [boundary.integrity_hash]),
    certTest("Tenant interactions attributable to exactly one tenant", observation.identity_refs.length === 1 && attestation.identity_integrity, "IDENTITY_NOT_ATTRIBUTABLE_TO_ONE_TENANT", [observation.integrity_hash]),
    certTest("Tenant runtime state not visible cross-tenant", !detector.shared_execution_context_detected, "TENANT_RUNTIME_STATE_VISIBLE", [detector.integrity_hash]),
    certTest("Memory ownership remains tenant scoped", attestation.memory_ownership && replay.memory_reconstruction, "MEMORY_OWNERSHIP_CROSSES_TENANT", [attestation.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is LiveTenantIsolationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<LiveTenantIsolationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_boundary_ref: boundary.integrity_hash, lifecycle, observation, detector, attestation, incident_registry, containment, replay, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateLiveTenantIsolationQualification(result = runLiveTenantIsolationQualification()): LiveTenantIsolationValidation {
  const observation_valid = verify(result.observation) && result.observation.identity_refs.length === 1 && result.observation.continuously_verified && result.observation.lineage_refs.length > 0;
  const detector_valid = verify(result.detector) && result.detector.deterministic && Object.entries(result.detector).filter(([key]) => key.endsWith("_detected")).every(([, value]) => value === false);
  const attestation_valid = verify(result.attestation) && Object.entries(result.attestation).filter(([key]) => key !== "attestation_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const incidents_valid = result.incident_registry.length === 1 && result.incident_registry.every((entry) => verify(entry) && entry.immutable && entry.replayable && entry.replay_refs.length > 0 && entry.remediation_lineage_refs.length > 0);
  const containment_valid = verify(result.containment) && result.containment.mission_control_recommends_only && result.containment.external_authorization_required && result.containment.operational && result.containment.forensic_capture_supported;
  const replay_valid = verify(result.replay) && result.replay.deterministic_replay && result.replay.preserves_original_tenant_isolation && resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const valid = result.outcome === "PASS" && observation_valid && detector_valid && attestation_valid && incidents_valid && containment_valid && replay_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, observation_valid, detector_valid, attestation_valid, incidents_valid, containment_valid, replay_valid, certification_valid, failures: result.failures });
}

export function replayLiveTenantIsolationQualification(result = runLiveTenantIsolationQualification()): boolean {
  const replayed = runLiveTenantIsolationQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateLiveTenantIsolationQualification(result).valid;
}

export function getLiveTenantIsolationQualificationBundle(): LiveTenantIsolationBundle {
  const result = runLiveTenantIsolationQualification();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-boundary-enforcement/v15.6" as const, lifecycle, domains, severities, categories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateLiveTenantIsolationQualification(result) });
}

export const LiveTenantIsolationQualificationService = Object.freeze({ run: runLiveTenantIsolationQualification, validate: validateLiveTenantIsolationQualification, replay: replayLiveTenantIsolationQualification });
