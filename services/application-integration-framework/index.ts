import { runApplicationIdentityTenancyNamespace, validateApplicationIdentityTenancyNamespace } from "@/services/application-identity-tenancy-namespace";
import { runApplicationLifecycleCertification, validateApplicationLifecycleCertification } from "@/services/application-lifecycle-certification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationIntegrationBundle,
  ApplicationIntegrationFailure,
  ApplicationIntegrationFrameworkResult,
  ApplicationIntegrationInput,
  ApplicationIntegrationOutcome,
  ApplicationIntegrationScenario,
  ApplicationIntegrationValidation,
} from "@/types/application-integration-framework";

const VERSION = "application-integration-framework/v4.6" as const;
const IDENTIFIER = "ApplicationIntegrationFramework" as const;
let baselineIdentity: ReturnType<typeof runApplicationIdentityTenancyNamespace> | undefined;
let baselineLifecycle: ReturnType<typeof runApplicationLifecycleCertification> | undefined;

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
function has(failures: readonly ApplicationIntegrationFailure[], failure: ApplicationIntegrationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationIntegrationScenario): ApplicationIntegrationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationIntegrationFailure[]): ApplicationIntegrationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineIdentity() { baselineIdentity ??= runApplicationIdentityTenancyNamespace(); return baselineIdentity; }
function getBaselineLifecycle() { baselineLifecycle ??= runApplicationLifecycleCertification(); return baselineLifecycle; }

function resultReplayHash(result: Omit<ApplicationIntegrationFrameworkResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    contract: result.integration_contract.integrity_hash,
    cci: result.cci_adapter.integrity_hash,
    caf: result.caf_adapter.integrity_hash,
    gateway: result.application_gateway.integrity_hash,
    interface: result.interface_record.integrity_hash,
    integration: result.integration_record.integrity_hash,
    governance: result.interface_governance.integrity_hash,
    evidence: result.evidence.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationIntegrationFrameworkResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationIntegrationFramework(input: ApplicationIntegrationInput = {}): ApplicationIntegrationFrameworkResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationIntegrationFailure>(direct ? [direct] : []);
  const identity = getBaselineIdentity();
  const lifecycle = getBaselineLifecycle();
  const dependencyFailures = freezeArray<ApplicationIntegrationFailure>([
    ...(!validateApplicationIdentityTenancyNamespace(identity).valid || has(scenarioFailures, "P4_4_IDENTITY_INVALID") ? ["P4_4_IDENTITY_INVALID" as const] : []),
    ...(!validateApplicationLifecycleCertification(lifecycle).valid || has(scenarioFailures, "P4_5_CERTIFICATION_INVALID") ? ["P4_5_CERTIFICATION_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_STANDARDS_INVALID") ? ["PROGRAM_1_STANDARDS_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_CAPABILITY_ATLAS_INVALID") ? ["PROGRAM_1_CAPABILITY_ATLAS_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_TERMINOLOGY_INVALID") ? ["PROGRAM_1_TERMINOLOGY_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const appId = identity.identity_record.application_id;
  const interfaceId = "iface:p4.6:command-console:operator-workflow";
  const contractId = has(failures, "CONTRACT_REGISTRY_MISSING") ? "" : "contract:p4.6:operator-workflow";
  const integration_contract = nested({
    integration_contract_id: contractId,
    application_id: appId,
    provider_application_id: "caf-legion",
    interface_id: interfaceId,
    contract_version: has(failures, "CONTRACT_NOT_VERSIONED") ? "" : "1.0.0",
    contract_type: "WORKFLOW_INTERFACE" as const,
    supported_operations: freezeArray(["invoke", "validate", "observe"]),
    dependency_refs: freezeArray(["Program 2 - CCI Shared Platform Services", "Program 3 - CAF Legion Services", lifecycle.certificate.certificate_id]),
    compatibility_rules: has(failures, "INTERFACE_COMPATIBILITY_NOT_VALIDATED") ? freezeArray([]) : freezeArray(["semver-compatible", "tenant-isolated", "evidence-producing"]),
    authority_requirements: freezeArray(["authority:p4.6:integration"]),
    policy_requirements: freezeArray(["policy:p4.6:interface"]),
    certification_requirements: freezeArray([lifecycle.certificate.certificate_id]),
    lifecycle_status: "ACTIVE" as const,
    effective_date: "2026-07-17",
    retirement_date: "",
    versioned: !has(failures, "CONTRACT_NOT_VERSIONED"),
    contract_driven: !has(failures, "INTEGRATION_NOT_CONTRACT_DRIVEN"),
    lineage_refs: has(failures, "CONTRACT_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:p4.6:contract", lifecycle.version_lineage.lineage_id]),
  });
  const cci_adapter = nested({
    adapter_id: "P4.6-CCI-ADAPTER-001",
    registry_access: !has(failures, "CCI_INTEGRATION_INVALID"),
    messaging: !has(failures, "CCI_INTEGRATION_INVALID"),
    storage: !has(failures, "CCI_INTEGRATION_INVALID"),
    evidence: !has(failures, "CCI_INTEGRATION_INVALID"),
    identity: !has(failures, "CCI_INTEGRATION_INVALID"),
    observability: !has(failures, "CCI_INTEGRATION_INVALID"),
    validated: !has(failures, "CCI_INTEGRATION_INVALID"),
  });
  const caf_adapter = nested({
    adapter_id: "P4.6-CAF-ADAPTER-001",
    agent_invocation: !has(failures, "CAF_INTEGRATION_INVALID"),
    workflow_invocation: !has(failures, "CAF_INTEGRATION_INVALID"),
    reasoning_requests: !has(failures, "CAF_INTEGRATION_INVALID"),
    capability_execution_contracts: !has(failures, "CAF_INTEGRATION_INVALID"),
    governance_interaction: !has(failures, "CAF_INTEGRATION_INVALID"),
    policy_enforcement: !has(failures, "CAF_INTEGRATION_INVALID"),
    safety_integration: !has(failures, "CAF_INTEGRATION_INVALID"),
    evidence_integration: !has(failures, "CAF_INTEGRATION_INVALID"),
    operator_workflow_integration: !has(failures, "CAF_INTEGRATION_INVALID"),
    validated: !has(failures, "CAF_INTEGRATION_INVALID"),
  });
  const application_gateway = nested({
    gateway_id: "P4.6-APPLICATION-GATEWAY-001",
    routing: !has(failures, "APPLICATION_GATEWAY_UNAVAILABLE"),
    authentication: !has(failures, "GATEWAY_AUTHENTICATION_MISSING"),
    authorization: !has(failures, "GATEWAY_AUTHORIZATION_MISSING"),
    request_validation: !has(failures, "REQUEST_VALIDATION_MISSING"),
    protocol_translation: true,
    interface_enforcement: true,
    rate_governance: true,
    observability: true,
    operational: !has(failures, "APPLICATION_GATEWAY_UNAVAILABLE"),
  });
  const interface_record = nested({
    interface_id: has(failures, "INTERFACE_NOT_REGISTERED") ? "" : interfaceId,
    application_id: appId,
    namespace: has(failures, "INTERFACE_NAMESPACE_UNGOVERNED") ? "" : identity.namespace_record.namespace,
    interface_name: "operator-workflow",
    interface_version: has(failures, "INTERFACE_VERSIONING_FAILED") ? "" : "1.0.0",
    interface_type: "WORKFLOW_INTERFACE" as const,
    owner: has(failures, "INTERFACE_OWNER_MISSING") ? "" : identity.ownership_record.constitutional_owner,
    visibility: "ECOSYSTEM" as const,
    compatibility_status: has(failures, "INTERFACE_COMPATIBILITY_NOT_VALIDATED") ? "INCOMPATIBLE" as const : "COMPATIBLE" as const,
    lifecycle_status: "ACTIVE" as const,
    certification_status: "CERTIFIED" as const,
    dependency_refs: integration_contract.dependency_refs,
    evidence_refs: freezeArray(["evidence:p4.6:interface"]),
  });
  const integration_record = nested({
    integration_id: "P4.6-INTEGRATION-001",
    source_application: appId,
    target_application: "caf-legion",
    integration_type: "WORKFLOW_INTERFACE" as const,
    gateway_used: !has(failures, "APPLICATION_GATEWAY_UNAVAILABLE"),
    interface_ref: interface_record.interface_id,
    contract_ref: integration_contract.integration_contract_id,
    tenant_scope: input.tenant_id ?? identity.tenant_integration.tenant_id,
    compatibility_result: interface_record.compatibility_status,
    validation_result: has(failures, "INTEROPERABILITY_VALIDATION_FAILED") ? "VALIDATION_FAILED" as const : "VALIDATED" as const,
    certification_status: "CERTIFIED" as const,
    evidence_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p4.6:integration"]),
  });
  const interface_governance = nested({
    governance_id: "P4.6-INTERFACE-GOVERNANCE-001",
    interface_approval: !has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    interface_versioning: !has(failures, "INTERFACE_VERSIONING_FAILED"),
    compatibility_validation: !has(failures, "INTERFACE_COMPATIBILITY_NOT_VALIDATED"),
    deprecation_governance: true,
    breaking_change_governance: !has(failures, "BREAKING_CHANGE_UNGOVERNED"),
    lifecycle_governance: true,
    constitutional_compliance: !has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASSED"),
    namespace_ownership: !has(failures, "INTERFACE_NAMESPACE_UNGOVERNED"),
  });
  const evidence = nested({
    evidence_id: "P4.6-INTEGRATION-EVIDENCE-001",
    contract_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([integration_contract.integration_contract_id]),
    interface_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([interface_record.interface_id]),
    gateway_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([application_gateway.gateway_id]),
    adapter_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([cci_adapter.adapter_id, caf_adapter.adapter_id]),
    interoperability_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([integration_record.integration_id]),
    governance_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([interface_governance.governance_id]),
    audit_refs: has(failures, "EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["audit:p4.6:integration"]),
    immutable: !has(failures, "EVIDENCE_MUTABLE"),
    complete: !has(failures, "EVIDENCE_MISSING"),
  });
  const tenantIsolationPreserved = !has(failures, "TENANT_ISOLATION_BROKEN") && integration_record.tenant_scope.length > 0;
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(integration_contract.integration_contract_id.length === 0 ? ["CONTRACT_REGISTRY_MISSING" as const] : []),
    ...(!integration_contract.versioned ? ["CONTRACT_NOT_VERSIONED" as const] : []),
    ...(integration_contract.lineage_refs.length === 0 ? ["CONTRACT_LINEAGE_INCOMPLETE" as const] : []),
    ...(interface_record.interface_id.length === 0 ? ["INTERFACE_NOT_REGISTERED" as const] : []),
    ...(interface_record.owner.length === 0 ? ["INTERFACE_OWNER_MISSING" as const] : []),
    ...(interface_record.namespace.length === 0 ? ["INTERFACE_NAMESPACE_UNGOVERNED" as const] : []),
    ...(interface_record.interface_version.length === 0 ? ["INTERFACE_VERSIONING_FAILED" as const] : []),
    ...(interface_record.compatibility_status !== "COMPATIBLE" ? ["INTERFACE_COMPATIBILITY_NOT_VALIDATED" as const] : []),
    ...(!interface_governance.breaking_change_governance ? ["BREAKING_CHANGE_UNGOVERNED" as const] : []),
    ...(!application_gateway.operational ? ["APPLICATION_GATEWAY_UNAVAILABLE" as const] : []),
    ...(!application_gateway.authentication ? ["GATEWAY_AUTHENTICATION_MISSING" as const] : []),
    ...(!application_gateway.authorization ? ["GATEWAY_AUTHORIZATION_MISSING" as const] : []),
    ...(!application_gateway.request_validation ? ["REQUEST_VALIDATION_MISSING" as const] : []),
    ...(!tenantIsolationPreserved ? ["TENANT_ISOLATION_BROKEN" as const] : []),
    ...(has(failures, "UNAUTHORIZED_PLATFORM_COUPLING") ? ["UNAUTHORIZED_PLATFORM_COUPLING" as const] : []),
    ...(!integration_contract.contract_driven ? ["INTEGRATION_NOT_CONTRACT_DRIVEN" as const] : []),
    ...(integration_record.contract_ref.length === 0 ? ["INTEROPERABILITY_CONTRACT_MISSING" as const] : []),
    ...(integration_record.validation_result !== "VALIDATED" ? ["INTEROPERABILITY_VALIDATION_FAILED" as const] : []),
    ...(!evidence.complete ? ["EVIDENCE_MISSING" as const] : []),
    ...(!evidence.immutable ? ["EVIDENCE_MUTABLE" as const] : []),
    ...(!interface_governance.constitutional_compliance ? ["CONSTITUTIONAL_GOVERNANCE_BYPASSED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.6-INTEGRATION-FRAMEWORK-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    gateway_operational: application_gateway.operational && application_gateway.authentication && application_gateway.authorization && application_gateway.request_validation,
    interface_registry_implemented: interface_record.interface_id.length > 0 && interface_record.owner.length > 0,
    contracts_versioned_governed: integration_contract.versioned && integration_contract.contract_driven && integration_contract.lineage_refs.length > 0,
    cci_pathways_validated: cci_adapter.validated,
    caf_pathways_validated: caf_adapter.validated,
    interoperability_enforced: integration_record.validation_result === "VALIDATED" && integration_record.contract_ref.length > 0,
    interface_lifecycle_governed: interface_governance.lifecycle_governance && interface_governance.breaking_change_governance,
    compatibility_deterministic: interface_record.compatibility_status === "COMPATIBLE",
    evidence_immutable: evidence.complete && evidence.immutable,
    tenant_isolation_preserved: tenantIsolationPreserved,
    constitutional_governance_enforced: interface_governance.constitutional_compliance,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationIntegrationFrameworkResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_identity_ref: "application-identity-tenancy-namespace/v4.4",
    application_certification_ref: "application-lifecycle-certification/v4.5",
    cci_services_ref: "Program 2 - CCI Shared Platform Services",
    caf_services_ref: "Program 3 - CAF Legion Services",
    program_1_standards_ref: "Program 1 - Constitutional Standards",
    integration_contract,
    cci_adapter,
    caf_adapter,
    application_gateway,
    interface_record,
    integration_record,
    interface_governance,
    evidence,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationIntegrationFramework(result?: ApplicationIntegrationFrameworkResult): ApplicationIntegrationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, contract_valid: false, cci_valid: false, caf_valid: false, gateway_valid: false, interface_valid: false, interoperability_valid: false, governance_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const contract_valid = verifyHashedRecord(result.integration_contract) && result.integration_contract.integration_contract_id.length > 0 && result.integration_contract.versioned && result.integration_contract.contract_driven && result.integration_contract.lineage_refs.length > 0;
  const cci_valid = verifyHashedRecord(result.cci_adapter) && result.cci_adapter.validated;
  const caf_valid = verifyHashedRecord(result.caf_adapter) && result.caf_adapter.validated;
  const gateway_valid = verifyHashedRecord(result.application_gateway) && result.application_gateway.operational && result.application_gateway.authentication && result.application_gateway.authorization && result.application_gateway.request_validation;
  const interface_valid = verifyHashedRecord(result.interface_record) && result.interface_record.interface_id.length > 0 && result.interface_record.owner.length > 0 && result.interface_record.namespace.length > 0 && result.interface_record.compatibility_status === "COMPATIBLE";
  const interoperability_valid = verifyHashedRecord(result.integration_record) && result.integration_record.validation_result === "VALIDATED" && result.integration_record.gateway_used && result.integration_record.contract_ref.length > 0;
  const governance_valid = verifyHashedRecord(result.interface_governance) && result.interface_governance.constitutional_compliance && result.interface_governance.breaking_change_governance && result.interface_governance.namespace_ownership;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.complete && result.evidence.immutable;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && contract_valid && cci_valid && caf_valid && gateway_valid && interface_valid && interoperability_valid && governance_valid && evidence_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, contract_valid, cci_valid, caf_valid, gateway_valid, interface_valid, interoperability_valid, governance_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationIntegrationFramework(result = runApplicationIntegrationFramework()): boolean {
  const replayed = runApplicationIntegrationFramework();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationIntegrationFramework(result).valid;
}

export function getApplicationIntegrationFrameworkBundle(): ApplicationIntegrationBundle {
  const result = runApplicationIntegrationFramework();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_cci_integration: true,
      owns_caf_integration: true,
      owns_interface_governance: true,
      owns_application_interoperability_contracts: true,
      builds_applications: false,
      executes_applications: false,
      deploys_applications: false,
      bypasses_constitutional_governance: false,
    }),
    result,
    validation: validateApplicationIntegrationFramework(result),
  });
}

export const ApplicationIntegrationFrameworkService = Object.freeze({
  run: runApplicationIntegrationFramework,
  validate: validateApplicationIntegrationFramework,
  replay: replayApplicationIntegrationFramework,
});
