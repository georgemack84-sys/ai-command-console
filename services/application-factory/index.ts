import { runApex, validateApex } from "@/services/apex";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStevn, validateStevn } from "@/services/stevn";
import type { ApplicationFactoryBundle, ApplicationFactoryFailure, ApplicationFactoryInput, ApplicationFactoryOutcome, ApplicationFactoryRecord, ApplicationFactoryResult, ApplicationFactoryScenario, ApplicationFactoryValidation } from "@/types/application-factory";

const VERSION = "application-factory/v4.18" as const;
const IDENTIFIER = "ApplicationFactory" as const;
let baselineStevn: ReturnType<typeof runStevn> | undefined;
let baselineApex: ReturnType<typeof runApex> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ApplicationFactoryFailure[], failure: ApplicationFactoryFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationFactoryScenario): ApplicationFactoryFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationFactoryFailure[]): ApplicationFactoryOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getStevn() { baselineStevn ??= runStevn(); return baselineStevn; }
function getApex() { baselineApex ??= runApex(); return baselineApex; }
function record(factoryId: string, tenantId: string, id: string, refs: readonly string[], failures: readonly ApplicationFactoryFailure[], missing: ApplicationFactoryFailure): ApplicationFactoryRecord {
  return nested({
    record_id: has(failures, missing) ? "" : id,
    factory_id: factoryId,
    tenant_id: tenantId,
    version: VERSION,
    refs: freezeArray(refs),
    evidence_refs: freezeArray(["cci:evidence:application-factory"]),
    replay_refs: freezeArray(["cci:replay:application-factory"]),
    operational: !has(failures, missing),
    deterministic: !has(failures, "BOOTSTRAP_NONDETERMINISTIC") && !has(failures, "REPLAY_NONDETERMINISTIC"),
  });
}
function resultReplayHash(result: Omit<ApplicationFactoryResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    templates: result.templates.integrity_hash,
    blueprints: result.blueprints.integrity_hash,
    bootstrap: result.bootstrap.integrity_hash,
    inheritance: result.inheritance.integrity_hash,
    integration: result.integration.integrity_hash,
    promotion: result.promotion.integrity_hash,
    governance: result.governance.integrity_hash,
    replayEvidence: result.replay_evidence.integrity_hash,
    observability: result.observability.integrity_hash,
    security: result.security.integrity_hash,
    qualification: result.qualification.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationFactoryResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runApplicationFactory(input: ApplicationFactoryInput = {}): ApplicationFactoryResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationFactoryFailure>(direct ? [direct] : []);
  const stevn = getStevn();
  const apex = getApex();
  const dependencyFailures = freezeArray<ApplicationFactoryFailure>([
    ...(!validateStevn(stevn).valid || has(scenarioFailures, "P4_17_STEVN_INVALID") ? ["P4_17_STEVN_INVALID" as const] : []),
    ...(!validateApex(apex).valid || has(scenarioFailures, "P4_16_APEX_INVALID") ? ["P4_16_APEX_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_15_AURORA_INVALID") ? ["P4_15_AURORA_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_14_PUBLISHER_OS_INVALID") ? ["P4_14_PUBLISHER_OS_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_13_PBG_INVALID") ? ["P4_13_PBG_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_12_QCI_INVALID") ? ["P4_12_QCI_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_10_OBSERVABILITY_INVALID") ? ["P4_10_OBSERVABILITY_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_9_REPLAY_AUDIT_INVALID") ? ["P4_9_REPLAY_AUDIT_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_8_GOVERNANCE_BINDING_INVALID") ? ["P4_8_GOVERNANCE_BINDING_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_7_EVIDENCE_GOVERNANCE_INVALID") ? ["P4_7_EVIDENCE_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_6_INTEGRATION_FRAMEWORK_INVALID") ? ["P4_6_INTEGRATION_FRAMEWORK_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_5_LIFECYCLE_CERTIFICATION_INVALID") ? ["P4_5_LIFECYCLE_CERTIFICATION_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_4_IDENTITY_NAMESPACE_INVALID") ? ["P4_4_IDENTITY_NAMESPACE_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_3_CAPABILITY_MAPPING_INVALID") ? ["P4_3_CAPABILITY_MAPPING_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_2_REGISTRY_CATALOG_INVALID") ? ["P4_2_REGISTRY_CATALOG_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_1_CONSTITUTION_INVALID") ? ["P4_1_CONSTITUTION_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const factoryId = input.factory_id ?? "factory:application";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const slug = input.application_slug ?? "generated-civitas-app";
  const foundation = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-FOUNDATION-001", ["factory-architecture", "generation-pipeline", "template-registry", "bootstrap-orchestration"], failures, "FACTORY_ARCHITECTURE_MISSING"), generation_pipeline_ref: has(failures, "GENERATION_PIPELINE_MISSING") ? "" : "pipeline:application-generation", template_registry_ref: has(failures, "TEMPLATE_REGISTRY_MISSING") ? "" : "registry:application-templates", bootstrap_orchestrator_ref: "orchestrator:application-bootstrap", owns_platform_architecture: has(failures, "PLATFORM_ARCHITECTURE_OWNERSHIP_ATTEMPTED"), owns_governance: has(failures, "GOVERNANCE_ENGINE_OWNERSHIP_ATTEMPTED") });
  const templates = nested({ ...record(factoryId, tenantId, "P4.18-TEMPLATE-REGISTRY-001", ["template:standard-application", "template:mission-application", "template:intelligence-application"], failures, "TEMPLATE_REGISTRY_MISSING"), template_refs: freezeArray(["template:standard-application", "template:mission-application", "template:intelligence-application"]), approved_template_refs: has(failures, "TEMPLATE_NOT_APPROVED") ? freezeArray<string>([]) : freezeArray(["approval:template:standard-application"]), lineage_refs: has(failures, "TEMPLATE_LINEAGE_MISSING") ? freezeArray<string>([]) : freezeArray(["lineage:template:standard-application:v1"]), governed_versioning: !has(failures, "TEMPLATE_LINEAGE_MISSING") });
  const blueprints = nested({ ...record(factoryId, tenantId, "P4.18-BLUEPRINT-LIBRARY-001", ["blueprint:application-shell", "blueprint:governed-api", "blueprint:observability"], failures, "BLUEPRINT_LIBRARY_MISSING"), blueprint_refs: freezeArray(["blueprint:application-shell", "blueprint:governed-api", "blueprint:observability"]), approved_blueprint_refs: has(failures, "BLUEPRINT_NOT_APPROVED") ? freezeArray<string>([]) : freezeArray(["approval:blueprint:application-shell"]), reusable_module_refs: freezeArray(["module:identity", "module:governance", "module:evidence", "module:replay", "module:observability"]), composition_valid: !has(failures, "COMPOSITION_INVALID") });
  const bootstrap = nested({ ...record(factoryId, tenantId, "P4.18-BOOTSTRAP-ENGINE-001", ["bootstrap:identity", "bootstrap:namespace", "bootstrap:capability", "bootstrap:contracts"], failures, "BOOTSTRAP_ENGINE_MISSING"), generated_application_id: `app:${slug}`, generated_namespace: has(failures, "NAMESPACE_GENERATION_INVALID") ? "" : `civitas.application.${slug}`, identity_ref: has(failures, "IDENTITY_INITIALIZATION_INVALID") ? "" : `identity:${slug}`, capability_composition_ref: has(failures, "CAPABILITY_COMPOSITION_INVALID") ? "" : `capability-composition:${slug}`, contract_refs: has(failures, "CONTRACT_GENERATION_MISSING") ? freezeArray<string>([]) : freezeArray([`contract:${slug}:constitution`, `contract:${slug}:integration`, `contract:${slug}:evidence`]), deterministic_bootstrap: !has(failures, "BOOTSTRAP_NONDETERMINISTIC") });
  const inheritance = nested({ ...record(factoryId, tenantId, "P4.18-CONSTITUTIONAL-INHERITANCE-001", ["p4.1", "p4.8", "p4.5"], failures, "CONSTITUTIONAL_INHERITANCE_MISSING"), constitutional_ref: has(failures, "CONSTITUTIONAL_INHERITANCE_MISSING") ? "" : "application-constitutional-foundation/v4.1", governance_ref: has(failures, "GOVERNANCE_INHERITANCE_MISSING") ? "" : "application-governance-binding/v4.8", ownership_ref: "application-boundary:ownership", authority_ref: has(failures, "AUTHORITY_INHERITANCE_MISSING") ? "" : "authority:inherited", lifecycle_ref: has(failures, "LIFECYCLE_INHERITANCE_MISSING") ? "" : "application-lifecycle-certification/v4.5", complete: !has(failures, "CONSTITUTIONAL_INHERITANCE_MISSING") && !has(failures, "GOVERNANCE_INHERITANCE_MISSING") && !has(failures, "AUTHORITY_INHERITANCE_MISSING") && !has(failures, "LIFECYCLE_INHERITANCE_MISSING") });
  const integration = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-INTEGRATION-001", ["registry", "lifecycle", "integration", "evidence", "observability"], failures, "REGISTRY_REGISTRATION_MISSING"), registry_ref: has(failures, "REGISTRY_REGISTRATION_MISSING") ? "" : `registry:application:${slug}`, lifecycle_ref: "lifecycle:initialized", integration_contract_refs: has(failures, "INTEGRATION_CONTRACTS_MISSING") ? freezeArray<string>([]) : freezeArray(["contract:cci", "contract:caf", "contract:mission-control"]), evidence_ref: has(failures, "EVIDENCE_INITIALIZATION_MISSING") ? "" : "evidence:initialized", observability_ref: has(failures, "OBSERVABILITY_INITIALIZATION_MISSING") ? "" : "observability:initialized", initialized: true });
  const promotion = nested({ ...record(factoryId, tenantId, "P4.18-PROMOTION-PIPELINE-001", ["promotion-validation", "promotion-workflow", "promotion-approvals", "deployment-readiness"], failures, "PROMOTION_PIPELINE_MISSING"), promotion_workflow_ref: "workflow:application-promotion", approval_ref: has(failures, "PROMOTION_APPROVAL_MISSING") ? "" : "approval:promotion:operator", readiness_ref: has(failures, "PROMOTION_READINESS_INVALID") ? "" : "readiness:promotion", governance_ref: "governance:promotion", promotion_allowed: !has(failures, "PROMOTION_APPROVAL_MISSING") && !has(failures, "PROMOTION_READINESS_INVALID") });
  const governance = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-GOVERNANCE-001", ["template-approvals", "blueprint-approvals", "bootstrap-governance", "factory-audit"], failures, "FACTORY_GOVERNANCE_MISSING"), template_approval_ref: "approval:templates", blueprint_approval_ref: "approval:blueprints", bootstrap_policy_ref: "policy:bootstrap", audit_report_ref: has(failures, "FACTORY_AUDIT_MISSING") ? "" : "audit:factory", governed: !has(failures, "FACTORY_GOVERNANCE_MISSING") && !has(failures, "FACTORY_AUDIT_MISSING") });
  const replay_evidence = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-REPLAY-EVIDENCE-001", ["bootstrap-replay", "promotion-replay", "template-lineage", "blueprint-lineage"], failures, "REPLAY_EVIDENCE_MISSING"), bootstrap_replay_ref: has(failures, "REPLAY_EVIDENCE_MISSING") ? "" : "replay:bootstrap", promotion_replay_ref: has(failures, "REPLAY_EVIDENCE_MISSING") ? "" : "replay:promotion", template_lineage_ref: "lineage:template", blueprint_lineage_ref: "lineage:blueprint", replay_complete: !has(failures, "REPLAY_EVIDENCE_MISSING") && !has(failures, "REPLAY_NONDETERMINISTIC") });
  const observability = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-OBSERVABILITY-001", ["generation-telemetry", "template-usage", "bootstrap-diagnostics", "promotion-metrics"], failures, "FACTORY_OBSERVABILITY_MISSING"), dashboard_ref: "dashboard:application-factory", generation_telemetry_ref: "telemetry:generation", template_usage_ref: "metrics:template-usage", promotion_metrics_ref: "metrics:promotion", diagnostics_ref: has(failures, "DIAGNOSTICS_MISSING") ? "" : "diagnostics:factory", observable: !has(failures, "FACTORY_OBSERVABILITY_MISSING") && !has(failures, "DIAGNOSTICS_MISSING") });
  const security = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-SECURITY-001", ["tenant-isolation", "namespace-validation", "identity-verification", "artifact-integrity", "promotion-authorization"], failures, "TENANT_ISOLATION_INVALID"), tenant_isolation_ref: has(failures, "TENANT_ISOLATION_INVALID") ? "" : "isolation:tenant", namespace_validation_ref: has(failures, "NAMESPACE_GENERATION_INVALID") ? "" : "validation:namespace", identity_verification_ref: has(failures, "IDENTITY_INITIALIZATION_INVALID") ? "" : "verification:identity", artifact_integrity_ref: has(failures, "ARTIFACT_INTEGRITY_INVALID") ? "" : "integrity:artifact", promotion_authorization_ref: has(failures, "PROMOTION_AUTHORIZATION_INVALID") ? "" : "authorization:promotion", secure: !has(failures, "TENANT_ISOLATION_INVALID") && !has(failures, "ARTIFACT_INTEGRITY_INVALID") && !has(failures, "PROMOTION_AUTHORIZATION_INVALID") });
  const noOutOfScope = !foundation.owns_platform_architecture && !foundation.owns_governance && !has(failures, "REGISTRY_ENGINE_OWNERSHIP_ATTEMPTED") && !has(failures, "CERTIFICATION_ENGINE_OWNERSHIP_ATTEMPTED") && !has(failures, "REPLAY_ENGINE_OWNERSHIP_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED");
  const qualification = nested({ ...record(factoryId, tenantId, "P4.18-FACTORY-QUALIFICATION-001", ["constitutional-inheritance", "deterministic-bootstrapping", "template-governance", "promotion-governance", "replay", "evidence", "identity", "namespace", "observability", "interoperability", "security"], failures, "QUALIFICATION_FAILED"), constitutional_inheritance_valid: inheritance.complete, deterministic_bootstrapping_valid: bootstrap.deterministic_bootstrap, template_governance_valid: templates.approved_template_refs.length > 0 && templates.governed_versioning, architecture_validation_valid: blueprints.approved_blueprint_refs.length > 0 && blueprints.composition_valid, promotion_governance_valid: promotion.promotion_allowed, replay_complete: replay_evidence.replay_complete, evidence_integrity_valid: !has(failures, "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED") && replay_evidence.evidence_refs.length > 0, identity_correct: bootstrap.identity_ref.length > 0, namespace_isolated: bootstrap.generated_namespace.length > 0 && security.tenant_isolation_ref.length > 0, observability_valid: observability.observable, interoperability_valid: !has(failures, "INTEROPERABILITY_INVALID"), security_valid: security.secure, qualified: !has(failures, "QUALIFICATION_FAILED") });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.generation_pipeline_ref.length === 0 ? ["GENERATION_PIPELINE_MISSING" as const] : []),
    ...(foundation.template_registry_ref.length === 0 ? ["TEMPLATE_REGISTRY_MISSING" as const] : []),
    ...(templates.approved_template_refs.length === 0 ? ["TEMPLATE_NOT_APPROVED" as const] : []),
    ...(templates.lineage_refs.length === 0 ? ["TEMPLATE_LINEAGE_MISSING" as const] : []),
    ...(blueprints.approved_blueprint_refs.length === 0 ? ["BLUEPRINT_NOT_APPROVED" as const] : []),
    ...(!blueprints.composition_valid ? ["COMPOSITION_INVALID" as const] : []),
    ...(!bootstrap.deterministic_bootstrap ? ["BOOTSTRAP_NONDETERMINISTIC" as const] : []),
    ...(bootstrap.generated_namespace.length === 0 ? ["NAMESPACE_GENERATION_INVALID" as const] : []),
    ...(bootstrap.identity_ref.length === 0 ? ["IDENTITY_INITIALIZATION_INVALID" as const] : []),
    ...(bootstrap.capability_composition_ref.length === 0 ? ["CAPABILITY_COMPOSITION_INVALID" as const] : []),
    ...(bootstrap.contract_refs.length === 0 ? ["CONTRACT_GENERATION_MISSING" as const] : []),
    ...(!inheritance.complete ? ["CONSTITUTIONAL_INHERITANCE_MISSING" as const] : []),
    ...(integration.registry_ref.length === 0 ? ["REGISTRY_REGISTRATION_MISSING" as const] : []),
    ...(integration.integration_contract_refs.length === 0 ? ["INTEGRATION_CONTRACTS_MISSING" as const] : []),
    ...(integration.evidence_ref.length === 0 ? ["EVIDENCE_INITIALIZATION_MISSING" as const] : []),
    ...(integration.observability_ref.length === 0 ? ["OBSERVABILITY_INITIALIZATION_MISSING" as const] : []),
    ...(!promotion.promotion_allowed ? ["PROMOTION_READINESS_INVALID" as const] : []),
    ...(!governance.governed ? ["FACTORY_GOVERNANCE_MISSING" as const] : []),
    ...(!replay_evidence.replay_complete ? ["REPLAY_EVIDENCE_MISSING" as const] : []),
    ...(!observability.observable ? ["FACTORY_OBSERVABILITY_MISSING" as const] : []),
    ...(!security.secure ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!qualification.interoperability_valid ? ["INTEROPERABILITY_INVALID" as const] : []),
    ...(!qualification.qualified ? ["QUALIFICATION_FAILED" as const] : []),
    ...(!noOutOfScope ? ["PLATFORM_ARCHITECTURE_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({ certification_id: "P4.18-APPLICATION-FACTORY-CERTIFICATION-001", outcome: outcome(derivedFailures), phase_ready: outcome(derivedFailures) === "PASS", factory_foundation_ready: foundation.operational && foundation.generation_pipeline_ref.length > 0, templates_ready: templates.operational && templates.approved_template_refs.length > 0 && templates.lineage_refs.length > 0, blueprints_ready: blueprints.operational && blueprints.approved_blueprint_refs.length > 0 && blueprints.composition_valid, bootstrap_ready: bootstrap.operational && bootstrap.deterministic_bootstrap && bootstrap.contract_refs.length > 0, inheritance_ready: inheritance.complete, integration_ready: integration.initialized && integration.registry_ref.length > 0 && integration.integration_contract_refs.length > 0, promotion_ready: promotion.operational && promotion.promotion_allowed, governance_ready: governance.governed, replay_evidence_ready: replay_evidence.replay_complete, observability_ready: observability.observable, security_ready: security.secure, qualification_ready: qualification.qualified && qualification.interoperability_valid, no_out_of_scope_ownership: noOutOfScope, failures: derivedFailures });
  const base: Omit<ApplicationFactoryResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, stevn_ref: "stevn-application/v4.17", apex_ref: "apex/v4.16", foundation, templates, blueprints, bootstrap, inheritance, integration, promotion, governance, replay_evidence, observability, security, qualification, certification };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationFactory(result?: ApplicationFactoryResult): ApplicationFactoryValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, templates_valid: false, blueprints_valid: false, bootstrap_valid: false, inheritance_valid: false, integration_valid: false, promotion_valid: false, governance_valid: false, replay_evidence_valid: false, observability_valid: false, security_valid: false, qualification_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.operational && result.foundation.generation_pipeline_ref.length > 0 && result.foundation.template_registry_ref.length > 0 && !result.foundation.owns_platform_architecture && !result.foundation.owns_governance;
  const templates_valid = verifyHashedRecord(result.templates) && result.templates.operational && result.templates.approved_template_refs.length > 0 && result.templates.lineage_refs.length > 0 && result.templates.governed_versioning;
  const blueprints_valid = verifyHashedRecord(result.blueprints) && result.blueprints.operational && result.blueprints.approved_blueprint_refs.length > 0 && result.blueprints.composition_valid;
  const bootstrap_valid = verifyHashedRecord(result.bootstrap) && result.bootstrap.operational && result.bootstrap.deterministic_bootstrap && result.bootstrap.generated_namespace.length > 0 && result.bootstrap.identity_ref.length > 0 && result.bootstrap.capability_composition_ref.length > 0 && result.bootstrap.contract_refs.length > 0;
  const inheritance_valid = verifyHashedRecord(result.inheritance) && result.inheritance.operational && result.inheritance.complete;
  const integration_valid = verifyHashedRecord(result.integration) && result.integration.operational && result.integration.initialized && result.integration.registry_ref.length > 0 && result.integration.integration_contract_refs.length > 0 && result.integration.evidence_ref.length > 0 && result.integration.observability_ref.length > 0;
  const promotion_valid = verifyHashedRecord(result.promotion) && result.promotion.operational && result.promotion.promotion_allowed && result.promotion.approval_ref.length > 0;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.operational && result.governance.governed && result.governance.audit_report_ref.length > 0;
  const replay_evidence_valid = verifyHashedRecord(result.replay_evidence) && result.replay_evidence.operational && result.replay_evidence.replay_complete;
  const observability_valid = verifyHashedRecord(result.observability) && result.observability.operational && result.observability.observable && result.observability.diagnostics_ref.length > 0;
  const security_valid = verifyHashedRecord(result.security) && result.security.operational && result.security.secure && result.security.tenant_isolation_ref.length > 0 && result.security.artifact_integrity_ref.length > 0;
  const qualification_valid = verifyHashedRecord(result.qualification) && result.qualification.operational && result.qualification.qualified && result.qualification.constitutional_inheritance_valid && result.qualification.deterministic_bootstrapping_valid && result.qualification.template_governance_valid && result.qualification.architecture_validation_valid && result.qualification.promotion_governance_valid && result.qualification.replay_complete && result.qualification.evidence_integrity_valid && result.qualification.identity_correct && result.qualification.namespace_isolated && result.qualification.observability_valid && result.qualification.interoperability_valid && result.qualification.security_valid;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0 && result.certification.no_out_of_scope_ownership;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && templates_valid && blueprints_valid && bootstrap_valid && inheritance_valid && integration_valid && promotion_valid && governance_valid && replay_evidence_valid && observability_valid && security_valid && qualification_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, templates_valid, blueprints_valid, bootstrap_valid, inheritance_valid, integration_valid, promotion_valid, governance_valid, replay_evidence_valid, observability_valid, security_valid, qualification_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationFactory(result = runApplicationFactory()): boolean {
  const replayed = runApplicationFactory();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationFactory(result).valid;
}

export function getApplicationFactoryBundle(): ApplicationFactoryBundle {
  const result = runApplicationFactory();
  return Object.freeze({
    doctrine: Object.freeze({ version: VERSION, owns_application_templates: true, owns_application_bootstrapping: true, owns_reusable_architectures: true, owns_application_promotion: true, owns_platform_architecture: false, owns_governance_engines: false, owns_registry_engine: false, owns_certification_engine: false, owns_replay_engine: false, owns_evidence_storage: false }),
    result,
    validation: validateApplicationFactory(result),
  });
}

export const ApplicationFactoryService = Object.freeze({ run: runApplicationFactory, validate: validateApplicationFactory, replay: replayApplicationFactory });
