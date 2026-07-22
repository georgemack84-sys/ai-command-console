import { runApplicationCapabilityComposition, validateApplicationCapabilityComposition } from "@/services/application-capability-composition";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationIdentityBundle,
  ApplicationIdentityFailure,
  ApplicationIdentityInput,
  ApplicationIdentityOutcome,
  ApplicationIdentityScenario,
  ApplicationIdentityTenancyNamespaceResult,
  ApplicationIdentityValidation,
  ApplicationIdentityLifecycleState,
} from "@/types/application-identity-tenancy-namespace";

const VERSION = "application-identity-tenancy-namespace/v4.4" as const;
const IDENTIFIER = "ApplicationIdentityTenancyNamespace" as const;
const LIFECYCLE: readonly ApplicationIdentityLifecycleState[] = Object.freeze(["IDENTITY_REQUESTED", "IDENTITY_VALIDATED", "NAMESPACE_ASSIGNED", "OWNERSHIP_REGISTERED", "TENANT_BOUND", "ACTIVE", "UPDATED", "TRANSFERRED", "SUSPENDED", "RETIRED"]);
let baselineComposition: ReturnType<typeof runApplicationCapabilityComposition> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ApplicationIdentityFailure[], failure: ApplicationIdentityFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationIdentityScenario): ApplicationIdentityFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationIdentityFailure[]): ApplicationIdentityOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineComposition() { baselineComposition ??= runApplicationCapabilityComposition(); return baselineComposition; }

function resultReplayHash(result: Omit<ApplicationIdentityTenancyNamespaceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    lifecycle: result.identity_lifecycle,
    identity: result.identity_record.integrity_hash,
    namespace: result.namespace_record.integrity_hash,
    ownership: result.ownership_record.integrity_hash,
    tenant: result.tenant_integration.integrity_hash,
    validation: result.validation_report.integrity_hash,
    synchronization: result.registry_synchronization.integrity_hash,
    evidence: result.evidence.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationIdentityTenancyNamespaceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationIdentityTenancyNamespace(input: ApplicationIdentityInput = {}): ApplicationIdentityTenancyNamespaceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationIdentityFailure>(direct ? [direct] : []);
  const composition = getBaselineComposition();
  const dependencyFailures = freezeArray<ApplicationIdentityFailure>([
    ...(!validateApplicationCapabilityComposition(composition).valid || has(scenarioFailures, "P4_3_COMPOSITION_INVALID") ? ["P4_3_COMPOSITION_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_IDENTITY_INFRASTRUCTURE_INVALID") ? ["CCI_IDENTITY_INFRASTRUCTURE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_NAMESPACE_REGISTRY_INVALID") ? ["CCI_NAMESPACE_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_IDENTITY_SERVICES_INVALID") ? ["CAF_IDENTITY_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "TQF_TENANT_CONTRACT_INVALID") ? ["TQF_TENANT_CONTRACT_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = has(failures, "APPLICATION_ID_MISSING") ? "" : has(failures, "APPLICATION_ID_MUTABLE") ? "civitas.app.ops.command-console-mutated" : composition.capability_map.application_id;
  const namespace = "civitas.app.ops.command-console";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const identity_record = nested({
    application_id: applicationId,
    application_name: "command-console",
    application_type: "OPERATIONAL_APPLICATION",
    namespace,
    owner_id: "org:civitas-operations",
    constitutional_owner: has(failures, "CONSTITUTIONAL_OWNER_MISSING") ? "" : "owner:constitutional:applications",
    tenant_contract_reference: has(failures, "TQF_TENANT_CONTRACT_INVALID") ? "" : "tqf:tenant-contract:qualified",
    identity_version: "1.0.0",
    identity_status: "ACTIVE" as const,
    lineage_reference: has(failures, "IDENTITY_LINEAGE_INCOMPLETE") ? "" : "lineage:p4.4:identity",
    immutable: !has(failures, "APPLICATION_ID_MUTABLE"),
    globally_unique: !has(failures, "APPLICATION_ID_NOT_UNIQUE"),
  });
  const namespace_record = nested({
    namespace_id: "P4.4-NAMESPACE-001",
    namespace: has(failures, "NAMESPACE_COLLISION_DETECTED") ? "civitas.app.ops.duplicate" : namespace,
    parent_namespace: "civitas.app.ops",
    owner: identity_record.constitutional_owner,
    child_namespaces: freezeArray(["civitas.app.ops.command-console.tenant"]),
    allocation_status: has(failures, "NAMESPACE_NOT_ALLOCATED") ? "RESERVED" as const : "ALLOCATED" as const,
    reservation_status: has(failures, "NAMESPACE_NOT_RESERVED") ? "UNRESERVED" as const : "RESERVED" as const,
    allocation_history: has(failures, "NAMESPACE_INHERITANCE_INVALID") ? freezeArray([]) : freezeArray(["allocated:p4.4:identity"]),
    retirement_history: has(failures, "NAMESPACE_RETIREMENT_MISSING") ? freezeArray([]) : freezeArray(["retirement-policy:p4.4:defined"]),
    lineage_reference: "lineage:p4.4:namespace",
    collision_prevention: !has(failures, "NAMESPACE_COLLISION_DETECTED"),
  });
  const ownership_record = nested({
    ownership_id: "P4.4-OWNERSHIP-001",
    application_id: identity_record.application_id,
    owning_organization: "Civitas Operations",
    constitutional_owner: identity_record.constitutional_owner,
    operational_owner: has(failures, "OPERATIONAL_OWNER_MISSING") ? "" : "owner:operational:command-console",
    ownership_type: "CONSTITUTIONAL" as const,
    stewardship_assignment: "steward:p4.4:application-identity",
    effective_date: "2026-07-17",
    transfer_governance_ref: has(failures, "OWNERSHIP_TRANSFER_UNGOVERNED") ? "" : "governance:p4.4:ownership-transfer",
    lineage_reference: has(failures, "OWNERSHIP_LINEAGE_INCOMPLETE") ? "" : "lineage:p4.4:ownership",
    registered: !has(failures, "OWNERSHIP_NOT_REGISTERED"),
  });
  const tenant_integration = nested({
    tenant_binding_id: "P4.4-TENANT-BINDING-001",
    application_id: identity_record.application_id,
    tenant_id: has(failures, "TENANT_NOT_BOUND") ? "" : tenantId,
    tenant_contract_reference: has(failures, "TENANT_CONTRACT_VALIDATION_FAILED") ? "" : identity_record.tenant_contract_reference,
    namespace_binding: has(failures, "TENANT_NAMESPACE_BINDING_INVALID") ? "" : `${namespace_record.namespace}.tenant.primary`,
    boundary_validation_status: has(failures, "TENANT_BOUNDARY_INVALID") ? "FAIL" as const : "PASS" as const,
    qualification_status: has(failures, "TENANT_QUALIFICATION_UNVERIFIED") ? "UNQUALIFIED" as const : "QUALIFIED" as const,
    isolation_enforced: !has(failures, "TENANT_ISOLATION_FAILED"),
    contract_validated: !has(failures, "TENANT_CONTRACT_VALIDATION_FAILED") && !has(failures, "TQF_TENANT_CONTRACT_INVALID"),
  });
  const validationOk = identity_record.application_id.length > 0 && identity_record.immutable && identity_record.globally_unique && namespace_record.allocation_status === "ALLOCATED" && namespace_record.reservation_status === "RESERVED" && ownership_record.registered && ownership_record.constitutional_owner.length > 0 && ownership_record.operational_owner.length > 0 && tenant_integration.tenant_id.length > 0 && tenant_integration.boundary_validation_status === "PASS" && tenant_integration.qualification_status === "QUALIFIED" && tenant_integration.isolation_enforced && tenant_integration.contract_validated;
  const validation_report = nested({
    report_id: "P4.4-IDENTITY-VALIDATION-REPORT-001",
    identity_uniqueness_valid: identity_record.globally_unique,
    duplicate_detection_passed: identity_record.globally_unique,
    namespace_verified: namespace_record.allocation_status === "ALLOCATED" && namespace_record.collision_prevention,
    ownership_validated: ownership_record.registered && ownership_record.constitutional_owner.length > 0,
    tenant_qualification_verified: tenant_integration.qualification_status === "QUALIFIED",
    tenant_boundary_validated: tenant_integration.boundary_validation_status === "PASS" && tenant_integration.isolation_enforced,
    result: validationOk && !has(failures, "IDENTITY_VALIDATION_FAILED") ? "PASS" as const : "FAIL" as const,
  });
  const registry_synchronization = nested({
    synchronization_id: "P4.4-REGISTRY-SYNCHRONIZATION-001",
    cci_identity_sync: !has(failures, "CCI_IDENTITY_INFRASTRUCTURE_INVALID"),
    cci_namespace_sync: !has(failures, "CCI_NAMESPACE_REGISTRY_INVALID"),
    caf_identity_sync: !has(failures, "CAF_IDENTITY_SERVICES_INVALID"),
    tqf_contract_sync: !has(failures, "TQF_TENANT_CONTRACT_INVALID"),
    program_1_registry_sync: true,
    deterministic: !has(failures, "REGISTRY_SYNCHRONIZATION_FAILED"),
  });
  const evidence = nested({
    evidence_id: "P4.4-IDENTITY-EVIDENCE-001",
    identity_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([identity_record.application_id]),
    namespace_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([namespace_record.namespace_id]),
    ownership_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([ownership_record.ownership_id]),
    tenant_boundary_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([tenant_integration.tenant_binding_id]),
    validation_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([validation_report.report_id]),
    synchronization_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([registry_synchronization.synchronization_id]),
    audit_refs: has(failures, "AUDIT_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["audit:p4.4:identity", "audit:p4.4:namespace", "audit:p4.4:tenant-binding"]),
    lineage_refs: has(failures, "IDENTITY_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([identity_record.lineage_reference, namespace_record.lineage_reference, ownership_record.lineage_reference]),
    immutable: !has(failures, "AUDIT_EVIDENCE_MUTABLE"),
    complete: !has(failures, "AUDIT_EVIDENCE_MISSING"),
  });
  const noForbiddenScope = !has(failures, "APPLICATION_LIFECYCLE_IMPLEMENTED") && !has(failures, "DEPLOYMENT_ATTEMPTED") && !has(failures, "RUNTIME_ATTEMPTED") && !has(failures, "MESSAGING_ATTEMPTED") && !has(failures, "GOVERNANCE_EXECUTION_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(identity_record.application_id.length === 0 ? ["APPLICATION_ID_MISSING" as const] : []),
    ...(!identity_record.globally_unique ? ["APPLICATION_ID_NOT_UNIQUE" as const] : []),
    ...(!identity_record.immutable ? ["APPLICATION_ID_MUTABLE" as const] : []),
    ...(identity_record.lineage_reference.length === 0 ? ["IDENTITY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!validationOk ? ["IDENTITY_INTEGRITY_FAILED" as const] : []),
    ...(namespace_record.allocation_status !== "ALLOCATED" ? ["NAMESPACE_NOT_ALLOCATED" as const] : []),
    ...(!namespace_record.collision_prevention ? ["NAMESPACE_COLLISION_DETECTED" as const] : []),
    ...(namespace_record.reservation_status !== "RESERVED" ? ["NAMESPACE_NOT_RESERVED" as const] : []),
    ...(namespace_record.allocation_history.length === 0 ? ["NAMESPACE_INHERITANCE_INVALID" as const] : []),
    ...(namespace_record.retirement_history.length === 0 ? ["NAMESPACE_RETIREMENT_MISSING" as const] : []),
    ...(!ownership_record.registered ? ["OWNERSHIP_NOT_REGISTERED" as const] : []),
    ...(ownership_record.constitutional_owner.length === 0 ? ["CONSTITUTIONAL_OWNER_MISSING" as const] : []),
    ...(ownership_record.operational_owner.length === 0 ? ["OPERATIONAL_OWNER_MISSING" as const] : []),
    ...(ownership_record.transfer_governance_ref.length === 0 ? ["OWNERSHIP_TRANSFER_UNGOVERNED" as const] : []),
    ...(ownership_record.lineage_reference.length === 0 ? ["OWNERSHIP_LINEAGE_INCOMPLETE" as const] : []),
    ...(tenant_integration.tenant_id.length === 0 ? ["TENANT_NOT_BOUND" as const] : []),
    ...(!tenant_integration.isolation_enforced ? ["TENANT_ISOLATION_FAILED" as const] : []),
    ...(tenant_integration.boundary_validation_status !== "PASS" ? ["TENANT_BOUNDARY_INVALID" as const] : []),
    ...(tenant_integration.qualification_status !== "QUALIFIED" ? ["TENANT_QUALIFICATION_UNVERIFIED" as const] : []),
    ...(tenant_integration.namespace_binding.length === 0 ? ["TENANT_NAMESPACE_BINDING_INVALID" as const] : []),
    ...(!tenant_integration.contract_validated ? ["TENANT_CONTRACT_VALIDATION_FAILED" as const] : []),
    ...(validation_report.result !== "PASS" ? ["IDENTITY_VALIDATION_FAILED" as const] : []),
    ...(!registry_synchronization.deterministic ? ["REGISTRY_SYNCHRONIZATION_FAILED" as const] : []),
    ...(!evidence.complete ? ["AUDIT_EVIDENCE_MISSING" as const] : []),
    ...(!evidence.immutable ? ["AUDIT_EVIDENCE_MUTABLE" as const] : []),
  ])]);
  const finalFailures = freezeArray([...new Set([...derivedFailures, ...(!noForbiddenScope ? ["APPLICATION_LIFECYCLE_IMPLEMENTED" as const] : [])])]);
  const certification = nested({
    certification_id: "P4.4-IDENTITY-TENANCY-NAMESPACE-CERTIFICATION-001",
    outcome: outcome(finalFailures),
    phase_ready: outcome(finalFailures) === "PASS",
    identity_unique_immutable: identity_record.application_id.length > 0 && identity_record.immutable && identity_record.globally_unique,
    namespace_governed: namespace_record.allocation_status === "ALLOCATED" && namespace_record.reservation_status === "RESERVED" && namespace_record.collision_prevention,
    ownership_registered: ownership_record.registered && ownership_record.constitutional_owner.length > 0 && ownership_record.operational_owner.length > 0,
    tenant_boundaries_validated: tenant_integration.boundary_validation_status === "PASS" && tenant_integration.isolation_enforced,
    tenant_contracts_integrated: tenant_integration.contract_validated && tenant_integration.tenant_contract_reference.length > 0,
    registries_operational: registry_synchronization.cci_identity_sync && registry_synchronization.cci_namespace_sync && registry_synchronization.caf_identity_sync && registry_synchronization.tqf_contract_sync && registry_synchronization.deterministic,
    lineage_deterministic: evidence.lineage_refs.length === 3,
    evidence_complete: evidence.complete && evidence.immutable,
    constitutional_ownership_enforced: ownership_record.constitutional_owner.length > 0,
    no_forbidden_scope: noForbiddenScope,
    failures: finalFailures,
  });
  const base: Omit<ApplicationIdentityTenancyNamespaceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_capability_composition_ref: "application-capability-composition/v4.3",
    cci_identity_infrastructure_ref: "Program 2 - CCI Identity Infrastructure",
    cci_namespace_registry_ref: "Program 2 - CCI Namespace Registry",
    caf_identity_services_ref: "Program 3 - CAF Identity Services",
    tqf_tenant_contracts_ref: "Program 1 - Tenant Qualification Framework",
    identity_lifecycle: LIFECYCLE,
    identity_record,
    namespace_record,
    ownership_record,
    tenant_integration,
    validation_report,
    registry_synchronization,
    evidence,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationIdentityTenancyNamespace(result?: ApplicationIdentityTenancyNamespaceResult): ApplicationIdentityValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, identity_valid: false, namespace_valid: false, ownership_valid: false, tenant_valid: false, validation_report_valid: false, synchronization_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const identity_valid = verifyHashedRecord(result.identity_record) && result.identity_record.application_id.length > 0 && result.identity_record.immutable && result.identity_record.globally_unique && result.identity_record.lineage_reference.length > 0;
  const namespace_valid = verifyHashedRecord(result.namespace_record) && result.namespace_record.allocation_status === "ALLOCATED" && result.namespace_record.reservation_status === "RESERVED" && result.namespace_record.collision_prevention && result.namespace_record.retirement_history.length > 0;
  const ownership_valid = verifyHashedRecord(result.ownership_record) && result.ownership_record.registered && result.ownership_record.constitutional_owner.length > 0 && result.ownership_record.operational_owner.length > 0 && result.ownership_record.transfer_governance_ref.length > 0;
  const tenant_valid = verifyHashedRecord(result.tenant_integration) && result.tenant_integration.tenant_id.length > 0 && result.tenant_integration.boundary_validation_status === "PASS" && result.tenant_integration.qualification_status === "QUALIFIED" && result.tenant_integration.isolation_enforced && result.tenant_integration.contract_validated;
  const validation_report_valid = verifyHashedRecord(result.validation_report) && result.validation_report.result === "PASS";
  const synchronization_valid = verifyHashedRecord(result.registry_synchronization) && result.registry_synchronization.cci_identity_sync && result.registry_synchronization.cci_namespace_sync && result.registry_synchronization.caf_identity_sync && result.registry_synchronization.tqf_contract_sync && result.registry_synchronization.deterministic;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.complete && result.evidence.immutable && result.evidence.lineage_refs.length === 3;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.no_forbidden_scope && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && identity_valid && namespace_valid && ownership_valid && tenant_valid && validation_report_valid && synchronization_valid && evidence_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, identity_valid, namespace_valid, ownership_valid, tenant_valid, validation_report_valid, synchronization_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationIdentityTenancyNamespace(result = runApplicationIdentityTenancyNamespace()): boolean {
  const replayed = runApplicationIdentityTenancyNamespace();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationIdentityTenancyNamespace(result).valid;
}

export function getApplicationIdentityTenancyNamespaceBundle(): ApplicationIdentityBundle {
  const result = runApplicationIdentityTenancyNamespace();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_identities: true,
      owns_namespaces: true,
      owns_application_ownership: true,
      owns_tenant_integration_boundaries: true,
      implements_application_lifecycle: false,
      owns_capability_composition: false,
      performs_deployment: false,
      owns_runtime: false,
      owns_messaging: false,
      executes_governance: false,
    }),
    result,
    validation: validateApplicationIdentityTenancyNamespace(result),
  });
}

export const ApplicationIdentityTenancyNamespaceService = Object.freeze({
  run: runApplicationIdentityTenancyNamespace,
  validate: validateApplicationIdentityTenancyNamespace,
  replay: replayApplicationIdentityTenancyNamespace,
});
