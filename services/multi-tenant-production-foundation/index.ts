import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPhase16CertificationGate } from "@/services/phase-16-certification-gate";
import type {
  CertificationBoundary,
  ConstitutionalInvariant,
  IsolationDomain,
  MultiTenantProductionFoundationBundle,
  MultiTenantProductionFoundationFailure,
  MultiTenantProductionFoundationInput,
  MultiTenantProductionFoundationOutcome,
  MultiTenantProductionFoundationResult,
  MultiTenantProductionFoundationTest,
  MultiTenantProductionFoundationValidation,
  ProductionLifecycleState,
  ProductionOwnershipDomain,
  ScalingContract,
  TenantResponsibility,
} from "@/types/multi-tenant-production-foundation";

const VERSION = "multi-tenant-production-foundation/v17.1" as const;
const IDENTIFIER = "MultiTenantProductionFoundation" as const;
const DEFAULT_TENANT = "tenant_phase_17_foundation";
const DEFAULT_OPERATOR = "operator_phase_17_foundation";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly MultiTenantProductionFoundationFailure[], failure: MultiTenantProductionFoundationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: MultiTenantProductionFoundationInput["scenario"]): MultiTenantProductionFoundationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly MultiTenantProductionFoundationFailure[]): MultiTenantProductionFoundationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_FOUNDATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["ARCHITECTURE_DEFINED", "CONTRACT_ESTABLISHED", "FOUNDATION_REGISTERED", "TENANT_SCALING_ENABLED", "CERTIFICATION_BOUNDARIES_ESTABLISHED", "FOUNDATION_CERTIFIED"] as const satisfies readonly ProductionLifecycleState[]);
const ownershipDomains = freezeArray(["PLATFORM_GOVERNANCE", "INFRASTRUCTURE", "TENANT", "OPERATIONAL", "CERTIFICATION", "EVIDENCE", "DEPLOYMENT"] as const satisfies readonly ProductionOwnershipDomain[]);
const tenantResponsibilities = freezeArray(["IDENTITY_MANAGEMENT", "GOVERNANCE_COMPLIANCE", "CERTIFICATION_MAINTENANCE", "EVIDENCE_PRESERVATION", "OPERATIONAL_REPORTING", "REPLAY_PARTICIPATION", "POLICY_COMPLIANCE", "SECURITY_RESPONSIBILITY"] as const satisfies readonly TenantResponsibility[]);
const invariants = freezeArray(["DETERMINISTIC_EXECUTION", "DETERMINISTIC_REPLAY", "IMMUTABLE_AUDIT_HISTORY", "IMMUTABLE_EVIDENCE", "ADVISORY_ONLY_OPERATION", "GOVERNANCE_SUPREMACY", "OPERATOR_SUPREMACY", "TENANT_ISOLATION", "CERTIFICATION_AUTHORITY", "REPRODUCIBLE_SYSTEM_BEHAVIOR", "VERSION_LINEAGE_PRESERVATION", "CONSTITUTIONAL_PRECEDENCE"] as const satisfies readonly ConstitutionalInvariant[]);
const scalingContracts = freezeArray(["TENANT_ONBOARDING", "TENANT_EXPANSION", "REGIONAL_EXPANSION", "CAPABILITY_PROMOTION", "WORKLOAD_SCALING", "INFRASTRUCTURE_SCALING", "CERTIFICATION_SCALING", "GOVERNANCE_SCALING"] as const satisfies readonly ScalingContract[]);
const isolationDomains = freezeArray(["IDENTITY", "AUTHENTICATION", "AUTHORIZATION", "POLICY_EVALUATION", "RUNTIME_EXECUTION", "STORAGE", "EVIDENCE", "REPLAY", "TELEMETRY", "MESSAGING", "AUDIT", "CERTIFICATION", "OBSERVABILITY"] as const satisfies readonly IsolationDomain[]);
const certificationBoundaries = freezeArray(["TENANT", "PLATFORM", "INFRASTRUCTURE", "CAPABILITY", "DEPLOYMENT", "REGIONAL", "OPERATIONAL"] as const satisfies readonly CertificationBoundary[]);

function certTest(name: string, passed: boolean, failure: MultiTenantProductionFoundationFailure, evidence_refs: readonly string[]): MultiTenantProductionFoundationTest {
  const actual: MultiTenantProductionFoundationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_FOUNDATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("multi_tenant_production_foundation_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<MultiTenantProductionFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ phase16: result.phase_16_certification_ref, contract: result.contract.integrity_hash, lifecycle: result.lifecycle.integrity_hash, architecture: result.architecture_registry.integrity_hash, tenant: result.tenant_scale_registry.integrity_hash, responsibility: result.responsibility_model.integrity_hash, authority: result.scaling_authority_model.integrity_hash, boundary: result.boundary_contract.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<MultiTenantProductionFoundationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runMultiTenantProductionFoundation(input: MultiTenantProductionFoundationInput = {}): MultiTenantProductionFoundationResult {
  const phase16 = runPhase16CertificationGate({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: MultiTenantProductionFoundationFailure[] = phase16.outcome === "PASS" ? [] : ["PHASE_16_12_CERTIFICATION_NOT_PASS"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_FOUNDATION_WARNING"));
  const foundationId = input.foundation_id ?? id("production_foundation", input.architecture_version ?? "17.1.0");
  const evidenceRefs = freezeArray([phase16.integrity_hash, phase16.certification_report.integrity_hash, phase16.ledger_entry.integrity_hash]);
  const architectureVersion = input.architecture_version ?? "17.1.0";
  const contract = nested({ contract_id: id("multi_tenant_production_contract", foundationId), architecture_version: architectureVersion, approved: !has(failures, "PRODUCTION_CONTRACT_NOT_APPROVED"), ownership_domains: has(failures, "PRODUCTION_OWNERSHIP_NOT_DEFINED") ? freezeArray([]) : ownershipDomains, tenant_responsibilities: has(failures, "TENANT_RESPONSIBILITIES_NOT_GOVERNED") ? freezeArray([]) : tenantResponsibilities, constitutional_invariants: has(failures, "CONSTITUTIONAL_INVARIANTS_NOT_ENFORCED") ? freezeArray([]) : invariants, scaling_contracts: scalingContracts, isolation_domains: isolationDomains, certification_boundaries: has(failures, "CERTIFICATION_BOUNDARIES_NOT_ESTABLISHED") ? freezeArray([]) : certificationBoundaries, immutable: true, evidence_refs: evidenceRefs });
  const lifecycle = nested({ lifecycle_id: id("production_scaling_lifecycle", foundationId), states: lifecycleStates, current_state: blockingFailures.length ? "FOUNDATION_REGISTERED" as const : "FOUNDATION_CERTIFIED" as const, deterministic_progression: !has(failures, "SCALING_NOT_DETERMINISTIC"), historical_states_immutable: true, replay_reconstructable: !has(failures, "REPLAY_NOT_PRESERVED"), transition_refs: evidenceRefs });
  const architecture_registry = nested({ registry_id: id("production_architecture_registry", foundationId), architecture_version: architectureVersion, registered_topologies: has(failures, "PRODUCTION_ARCHITECTURE_INCOMPLETE") ? freezeArray([]) : freezeArray(["production architecture", "platform topology", "tenant topology", "deployment topology", "regional topology", "capability topology", "governance topology", "certification topology"]), registry_lineage: freezeArray([phase16.integrity_hash, contract.integrity_hash, lifecycle.integrity_hash]), superseded_architectures_replayable: !has(failures, "REPLAY_NOT_PRESERVED"), versioned: true, operational: !has(failures, "ARCHITECTURE_REGISTRY_NOT_OPERATIONAL"), immutable: true });
  const tenantRecord = nested({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, classification: "production-qualified", production_environment: "multi-tenant-production", regional_assignments: freezeArray(["canonical-region-a"]), scaling_eligible: blockingFailures.length === 0, certification_status: blockingFailures.length === 0 ? "CERTIFIED" as const : "NOT_CERTIFIED" as const, isolation_classification: "strict-constitutional-isolation", governance_authority: "constitutional-governance", deployment_lineage: evidenceRefs, operational_lineage: freezeArray([lifecycle.integrity_hash]) });
  const tenant_scale_registry = nested({ registry_id: id("tenant_scale_registry", foundationId), tenant_records: has(failures, "TENANT_SCALE_REGISTRY_NOT_OPERATIONAL") ? freezeArray([]) : freezeArray([tenantRecord]), history_immutable: true, historical_registrations_preserved: true, operational: !has(failures, "TENANT_SCALE_REGISTRY_NOT_OPERATIONAL") });
  const responsibility_model = nested({ model_id: id("production_responsibility_model", foundationId), responsibility_domains: freezeArray(["platform governance", "platform operators", "tenant administrators", "certification authorities", "deployment authorities", "infrastructure authorities", "evidence custodians", "security authorities"]), explicit_responsibilities: !has(failures, "PRODUCTION_OWNERSHIP_NOT_DEFINED"), deterministic_authority_inheritance: !has(failures, "SCALING_NOT_DETERMINISTIC"), authority_refs: freezeArray([contract.integrity_hash]) });
  const scaling_authority_model = nested({ model_id: id("scaling_authority_model", foundationId), approval_authorities: freezeArray(["tenant enrollment", "infrastructure expansion", "production scaling", "capability promotion", "regional assignment", "certification approval", "recovery authorization"]), governance_bypass_prohibited: true, delegation_prohibited_unless_authorized: true, deterministic_conflict_resolution: !has(failures, "SCALING_NOT_DETERMINISTIC"), grants_execution_authority: false });
  const boundary_contract = nested({ boundary_id: id("production_boundary_contract", foundationId), advisory_only_preserved: true, tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_NOT_VALIDATED"), certification_scope_preserved: !has(failures, "CERTIFICATION_BOUNDARIES_NOT_ESTABLISHED"), prior_guarantees_not_weakened: !has(failures, "CONSTITUTIONAL_INVARIANTS_NOT_ENFORCED"), deterministic_requalification_required: true });
  const certification_package = nested({ package_id: id("production_foundation_certification_package", foundationId), production_architecture_complete: architecture_registry.registered_topologies.length === 8, production_contract_approved: contract.approved, ownership_defined: contract.ownership_domains.length === 7, tenant_responsibilities_governed: contract.tenant_responsibilities.length === 8, scaling_deterministic: lifecycle.deterministic_progression && scaling_authority_model.deterministic_conflict_resolution, invariants_enforced: contract.constitutional_invariants.length === 12, architecture_registry_operational: architecture_registry.operational, tenant_scale_registry_operational: tenant_scale_registry.operational && tenant_scale_registry.tenant_records.length > 0, certification_boundaries_established: contract.certification_boundaries.length === 7, replay_preserved: lifecycle.replay_reconstructable && architecture_registry.superseded_architectures_replayable, tenant_isolation_validated: boundary_contract.tenant_isolation_preserved, foundation_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Production architecture complete", certification_package.production_architecture_complete, "PRODUCTION_ARCHITECTURE_INCOMPLETE", [architecture_registry.integrity_hash]),
    certTest("Production contract approved", certification_package.production_contract_approved, "PRODUCTION_CONTRACT_NOT_APPROVED", [contract.integrity_hash]),
    certTest("Production ownership explicitly defined", certification_package.ownership_defined && responsibility_model.explicit_responsibilities, "PRODUCTION_OWNERSHIP_NOT_DEFINED", [responsibility_model.integrity_hash]),
    certTest("Tenant responsibilities fully governed", certification_package.tenant_responsibilities_governed, "TENANT_RESPONSIBILITIES_NOT_GOVERNED", [contract.integrity_hash]),
    certTest("Scaling deterministic", certification_package.scaling_deterministic, "SCALING_NOT_DETERMINISTIC", [lifecycle.integrity_hash, scaling_authority_model.integrity_hash]),
    certTest("Constitutional invariants enforced", certification_package.invariants_enforced && boundary_contract.prior_guarantees_not_weakened, "CONSTITUTIONAL_INVARIANTS_NOT_ENFORCED", [contract.integrity_hash]),
    certTest("Architecture registry operational", certification_package.architecture_registry_operational, "ARCHITECTURE_REGISTRY_NOT_OPERATIONAL", [architecture_registry.integrity_hash]),
    certTest("Tenant Scale Registry operational", certification_package.tenant_scale_registry_operational, "TENANT_SCALE_REGISTRY_NOT_OPERATIONAL", [tenant_scale_registry.integrity_hash]),
    certTest("Certification boundaries established", certification_package.certification_boundaries_established && boundary_contract.certification_scope_preserved, "CERTIFICATION_BOUNDARIES_NOT_ESTABLISHED", [boundary_contract.integrity_hash]),
    certTest("Replay fully preserved", certification_package.replay_preserved, "REPLAY_NOT_PRESERVED", [lifecycle.integrity_hash]),
    certTest("Tenant isolation guarantees validated", certification_package.tenant_isolation_validated, "TENANT_ISOLATION_NOT_VALIDATED", [boundary_contract.integrity_hash]),
    certTest("Production foundation certification completed", certification_package.foundation_certified, "FOUNDATION_CERTIFICATION_NOT_COMPLETED", [certification_package.integrity_hash]),
    certTest("Phase 16.12 certification PASS prerequisite", phase16.outcome === "PASS", "PHASE_16_12_CERTIFICATION_NOT_PASS", [phase16.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is MultiTenantProductionFoundationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<MultiTenantProductionFoundationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, phase_16_certification_ref: phase16.integrity_hash, contract, lifecycle, architecture_registry, tenant_scale_registry, responsibility_model, scaling_authority_model, boundary_contract, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMultiTenantProductionFoundation(result = runMultiTenantProductionFoundation()): MultiTenantProductionFoundationValidation {
  const contract_valid = verify(result.contract) && result.contract.approved && result.contract.ownership_domains.length === 7 && result.contract.tenant_responsibilities.length === 8 && result.contract.constitutional_invariants.length === 12 && result.contract.scaling_contracts.length === 8 && result.contract.isolation_domains.length === 13 && result.contract.certification_boundaries.length === 7 && result.contract.immutable && result.contract.evidence_refs.length > 0;
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.length === 6 && result.lifecycle.current_state === "FOUNDATION_CERTIFIED" && result.lifecycle.deterministic_progression && result.lifecycle.historical_states_immutable && result.lifecycle.replay_reconstructable && result.lifecycle.transition_refs.length > 0;
  const architecture_registry_valid = verify(result.architecture_registry) && result.architecture_registry.registered_topologies.length === 8 && result.architecture_registry.registry_lineage.length > 0 && result.architecture_registry.superseded_architectures_replayable && result.architecture_registry.versioned && result.architecture_registry.operational && result.architecture_registry.immutable;
  const tenant_scale_registry_valid = verify(result.tenant_scale_registry) && result.tenant_scale_registry.tenant_records.length === 1 && result.tenant_scale_registry.tenant_records.every((record) => verify(record) && record.scaling_eligible && record.certification_status === "CERTIFIED" && record.deployment_lineage.length > 0 && record.operational_lineage.length > 0) && result.tenant_scale_registry.history_immutable && result.tenant_scale_registry.historical_registrations_preserved && result.tenant_scale_registry.operational;
  const responsibility_model_valid = verify(result.responsibility_model) && result.responsibility_model.responsibility_domains.length === 8 && result.responsibility_model.explicit_responsibilities && result.responsibility_model.deterministic_authority_inheritance && result.responsibility_model.authority_refs.length > 0;
  const scaling_authority_model_valid = verify(result.scaling_authority_model) && result.scaling_authority_model.approval_authorities.length === 7 && result.scaling_authority_model.governance_bypass_prohibited && result.scaling_authority_model.delegation_prohibited_unless_authorized && result.scaling_authority_model.deterministic_conflict_resolution && !result.scaling_authority_model.grants_execution_authority;
  const boundary_contract_valid = verify(result.boundary_contract) && result.boundary_contract.advisory_only_preserved && result.boundary_contract.tenant_isolation_preserved && result.boundary_contract.certification_scope_preserved && result.boundary_contract.prior_guarantees_not_weakened && result.boundary_contract.deterministic_requalification_required;
  const certification_package_valid = verify(result.certification_package) && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true) && result.certification_package.evidence_refs.length > 0;
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && contract_valid && lifecycle_valid && architecture_registry_valid && tenant_scale_registry_valid && responsibility_model_valid && scaling_authority_model_valid && boundary_contract_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, lifecycle_valid, architecture_registry_valid, tenant_scale_registry_valid, responsibility_model_valid, scaling_authority_model_valid, boundary_contract_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayMultiTenantProductionFoundation(result = runMultiTenantProductionFoundation()): boolean {
  const replayed = runMultiTenantProductionFoundation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMultiTenantProductionFoundation(result).valid;
}

export function getMultiTenantProductionFoundationBundle(): MultiTenantProductionFoundationBundle {
  const result = runMultiTenantProductionFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "phase-16-certification-gate/v16.12" as const, lifecycle_states: lifecycleStates, ownership_domains: ownershipDomains, scaling_contracts: scalingContracts, isolation_domains: isolationDomains, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateMultiTenantProductionFoundation(result) });
}

export const MultiTenantProductionFoundationService = Object.freeze({ run: runMultiTenantProductionFoundation, validate: validateMultiTenantProductionFoundation, replay: replayMultiTenantProductionFoundation });
