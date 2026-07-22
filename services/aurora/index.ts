import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionControl, validateMissionControl } from "@/services/mission-control";
import { runPolicyBusinessGovernance, validatePolicyBusinessGovernance } from "@/services/policy-business-governance";
import { runPublisherOs, validatePublisherOs } from "@/services/publisher-os";
import { runQuantEdgeCompIntel, validateQuantEdgeCompIntel } from "@/services/quantedge-compintel";
import type { AuroraBundle, AuroraFailure, AuroraInput, AuroraOutcome, AuroraRecord, AuroraResult, AuroraScenario, AuroraValidation } from "@/types/aurora";

const VERSION = "aurora/v4.15" as const;
const IDENTIFIER = "Aurora" as const;
let baselinePublisher: ReturnType<typeof runPublisherOs> | undefined;
let baselinePbg: ReturnType<typeof runPolicyBusinessGovernance> | undefined;
let baselineQci: ReturnType<typeof runQuantEdgeCompIntel> | undefined;
let baselineMission: ReturnType<typeof runMissionControl> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly AuroraFailure[], failure: AuroraFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: AuroraScenario): AuroraFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly AuroraFailure[]): AuroraOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getPublisher() { baselinePublisher ??= runPublisherOs(); return baselinePublisher; }
function getPbg() { baselinePbg ??= runPolicyBusinessGovernance(); return baselinePbg; }
function getQci() { baselineQci ??= runQuantEdgeCompIntel(); return baselineQci; }
function getMission() { baselineMission ??= runMissionControl(); return baselineMission; }
function record(id: string, refs: readonly string[], failures: readonly AuroraFailure[], missing: AuroraFailure, nondeterministic?: AuroraFailure): AuroraRecord {
  return nested({ record_id: has(failures, missing) ? "" : id, refs: freezeArray(refs), operational: !has(failures, missing), deterministic: nondeterministic ? !has(failures, nondeterministic) : true });
}
function resultReplayHash(result: Omit<AuroraResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    domain: result.domain_services.integrity_hash,
    ux: result.user_experience.integrity_hash,
    workflow: result.workflow_engine.integrity_hash,
    integration: result.integration_layer.integrity_hash,
    governance: result.governance.integrity_hash,
    evidence: result.evidence.integrity_hash,
    operations: result.operations.integrity_hash,
    api: result.api_suite.integrity_hash,
    automation: result.automation.integrity_hash,
    security: result.security.integrity_hash,
    readiness: result.readiness.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<AuroraResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runAurora(input: AuroraInput = {}): AuroraResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<AuroraFailure>(direct ? [direct] : []);
  const publisher = getPublisher();
  const pbg = getPbg();
  const qci = getQci();
  const mission = getMission();
  const dependencyFailures = freezeArray<AuroraFailure>([
    ...(!validatePublisherOs(publisher).valid || has(scenarioFailures, "P4_14_PUBLISHER_OS_INVALID") ? ["P4_14_PUBLISHER_OS_INVALID" as const] : []),
    ...(!validatePolicyBusinessGovernance(pbg).valid || has(scenarioFailures, "P4_13_PBG_INVALID") ? ["P4_13_PBG_INVALID" as const] : []),
    ...(!validateQuantEdgeCompIntel(qci).valid || has(scenarioFailures, "P4_12_QCI_INVALID") ? ["P4_12_QCI_INVALID" as const] : []),
    ...(!validateMissionControl(mission).valid || has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_FOUNDATION_INVALID") ? ["PROGRAM_1_FOUNDATION_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_INVALID") ? ["PROGRAM_2_CCI_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_INVALID") ? ["PROGRAM_3_CAF_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? "app:aurora";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundation = nested({
    record_id: has(failures, "AURORA_APPLICATION_MISSING") ? "" : "P4.15-AURORA-FOUNDATION-001",
    refs: freezeArray(["architecture:aurora", "module-registry:aurora", "dependency-graph:aurora"]),
    operational: !has(failures, "AURORA_APPLICATION_MISSING") && !has(failures, "AURORA_ARCHITECTURE_MISSING"),
    deterministic: true,
    application_id: has(failures, "AURORA_APPLICATION_MISSING") ? "" : applicationId,
    application_name: "Aurora" as const,
    tenant_id: tenantId,
    constitutional_inheritance_ref: has(failures, "CONSTITUTIONAL_INHERITANCE_MISSING") ? "" : "application-governance-binding/v4.8",
    module_registry_ref: has(failures, "MODULE_REGISTRY_MISSING") ? "" : "module-registry:aurora",
    dependency_graph_ref: has(failures, "DEPENDENCY_GRAPH_MISSING") ? "" : "dependency-graph:aurora",
  });
  const domain_services = record("P4.15-DOMAIN-SERVICE-LIBRARY-001", ["core-business-services", "domain-workflows", "orchestration-logic", "service-validation"], failures, "DOMAIN_SERVICES_MISSING");
  const user_experience = record("P4.15-AURORA-UI-001", ["application-interface", "navigation", "dashboards", "operator-views", "accessibility", "workflow-interaction"], failures, "USER_EXPERIENCE_MISSING");
  const workflow_engine = record("P4.15-WORKFLOW-ENGINE-001", ["workflow-orchestration", "process-execution", "task-coordination", "approval-integration", "lifecycle-coordination"], failures, "WORKFLOW_ENGINE_MISSING");
  const integration_layer = record("P4.15-INTEGRATION-LAYER-001", ["cci", "caf", "mission-control", "qci", "pbg", "publisher-os"], failures, "INTEGRATION_LAYER_MISSING");
  const governance = nested({
    record_id: has(failures, "GOVERNANCE_INTEGRATION_MISSING") ? "" : "P4.15-GOVERNANCE-INTEGRATION-001",
    refs: freezeArray(["authority-inheritance", "policy-validation", "safety-validation", "governance-routing", "approval-workflows"]),
    operational: !has(failures, "GOVERNANCE_INTEGRATION_MISSING"),
    deterministic: true,
    authority_gate_ref: "caf:authority-gate",
    policy_gate_ref: "caf:policy-gate",
    safety_gate_ref: "caf:safety-gate",
    authority_inheritance_verified: !has(failures, "AUTHORITY_INHERITANCE_INVALID"),
    policy_validation_passed: !has(failures, "POLICY_VALIDATION_INVALID"),
    safety_validation_passed: !has(failures, "SAFETY_VALIDATION_INVALID"),
    enforcement_owned: has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") || has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") || has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED"),
  });
  const evidence = nested({
    record_id: has(failures, "EVIDENCE_INTEGRATION_MISSING") ? "" : "P4.15-AURORA-EVIDENCE-001",
    refs: freezeArray(["evidence-references", "provenance", "lineage", "audit", "replay"]),
    operational: !has(failures, "EVIDENCE_INTEGRATION_MISSING"),
    deterministic: true,
    evidence_refs: has(failures, "CANONICAL_EVIDENCE_REFS_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:evidence:aurora:001"]),
    provenance_refs: freezeArray(["provenance:aurora:001"]),
    lineage_refs: freezeArray(["lineage:aurora:001"]),
    audit_refs: freezeArray(["audit:aurora:001"]),
    replay_refs: has(failures, "REPLAY_REFERENCES_MISSING") ? freezeArray<string>([]) : freezeArray(["replay:aurora:001"]),
    references_canonical_cci_evidence: !has(failures, "CANONICAL_EVIDENCE_REFS_MISSING"),
    owns_evidence_storage: has(failures, "EVIDENCE_STORAGE_ATTEMPTED"),
  });
  const operations = record("P4.15-AURORA-OPERATIONS-001", ["diagnostics", "dashboards", "metrics", "health-monitoring", "application-intelligence"], failures, "OBSERVABILITY_MISSING");
  const api_suite = record("P4.15-AURORA-API-SUITE-001", ["public-apis", "internal-apis", "integration-contracts", "interface-governance", "version-compatibility"], failures, "API_SUITE_MISSING");
  const automation = record("P4.15-AURORA-AUTOMATION-001", ["governed-automation", "workflow-automation", "notifications", "scheduling", "orchestration-support"], failures, "AUTOMATION_SERVICES_MISSING");
  const security = nested({
    record_id: has(failures, "SECURITY_CONFIGURATION_MISSING") ? "" : "P4.15-AURORA-SECURITY-001",
    refs: freezeArray(["tenant-boundaries", "authorization-integration", "namespace-isolation", "secure-configuration"]),
    operational: !has(failures, "SECURITY_CONFIGURATION_MISSING"),
    deterministic: true,
    tenant_boundary_refs: freezeArray(["tenant-boundary:aurora"]),
    authorization_integration_ref: "cci:identity-authorization",
    namespace_isolation_ref: "cci:namespace-isolation",
    secure_configuration_ref: "aurora:secure-configuration",
    tenant_isolation_validated: !has(failures, "TENANT_ISOLATION_INVALID"),
  });
  const readiness = nested({
    record_id: has(failures, "PRODUCTION_READINESS_MISSING") ? "" : "P4.15-AURORA-READINESS-001",
    refs: freezeArray(["validation", "documentation", "production-readiness", "certification"]),
    operational: !has(failures, "PRODUCTION_READINESS_MISSING"),
    deterministic: true,
    validation_report_refs: has(failures, "VALIDATION_REPORTS_MISSING") ? freezeArray<string>([]) : freezeArray(["validation:aurora:functional", "validation:aurora:governance"]),
    documentation_refs: has(failures, "DOCUMENTATION_MISSING") ? freezeArray<string>([]) : freezeArray(["docs:aurora:architecture", "docs:aurora:deployment", "docs:aurora:api"]),
    production_readiness_report_ref: has(failures, "PRODUCTION_READINESS_MISSING") ? "" : "readiness:aurora:production",
    application_certification_ref: has(failures, "APPLICATION_CERTIFICATION_FAILED") ? "" : "certification:aurora:application",
    replay_compatible: !has(failures, "REPLAY_REFERENCES_MISSING"),
    interoperability_verified: !has(failures, "ECOSYSTEM_INTEGRATIONS_INVALID"),
    operational_readiness_approved: !has(failures, "PRODUCTION_READINESS_MISSING"),
  });
  const noOutOfScope = !has(failures, "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED") && !has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") && !has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "REPLAY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "IDENTITY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "REGISTRY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "OBSERVABILITY_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "PLATFORM_LIFECYCLE_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.application_id.length === 0 ? ["AURORA_APPLICATION_MISSING" as const] : []),
    ...(!foundation.operational ? ["AURORA_ARCHITECTURE_MISSING" as const] : []),
    ...(foundation.module_registry_ref.length === 0 ? ["MODULE_REGISTRY_MISSING" as const] : []),
    ...(foundation.dependency_graph_ref.length === 0 ? ["DEPENDENCY_GRAPH_MISSING" as const] : []),
    ...(foundation.constitutional_inheritance_ref.length === 0 ? ["CONSTITUTIONAL_INHERITANCE_MISSING" as const] : []),
    ...(!domain_services.operational ? ["DOMAIN_SERVICES_MISSING" as const] : []),
    ...(has(failures, "DOMAIN_WORKFLOWS_MISSING") ? ["DOMAIN_WORKFLOWS_MISSING" as const] : []),
    ...(has(failures, "ORCHESTRATION_LOGIC_MISSING") ? ["ORCHESTRATION_LOGIC_MISSING" as const] : []),
    ...(has(failures, "SERVICE_VALIDATION_MISSING") ? ["SERVICE_VALIDATION_MISSING" as const] : []),
    ...(!user_experience.operational ? ["USER_EXPERIENCE_MISSING" as const] : []),
    ...(has(failures, "DASHBOARDS_MISSING") ? ["DASHBOARDS_MISSING" as const] : []),
    ...(has(failures, "ACCESSIBILITY_INVALID") ? ["ACCESSIBILITY_INVALID" as const] : []),
    ...(!workflow_engine.operational ? ["WORKFLOW_ENGINE_MISSING" as const] : []),
    ...(has(failures, "WORKFLOW_EXECUTION_FAILED") ? ["WORKFLOW_EXECUTION_FAILED" as const] : []),
    ...(has(failures, "APPROVAL_INTEGRATION_MISSING") ? ["APPROVAL_INTEGRATION_MISSING" as const] : []),
    ...(!integration_layer.operational ? ["INTEGRATION_LAYER_MISSING" as const] : []),
    ...(has(failures, "ECOSYSTEM_INTEGRATIONS_INVALID") ? ["ECOSYSTEM_INTEGRATIONS_INVALID" as const] : []),
    ...(!governance.operational ? ["GOVERNANCE_INTEGRATION_MISSING" as const] : []),
    ...(!governance.authority_inheritance_verified ? ["AUTHORITY_INHERITANCE_INVALID" as const] : []),
    ...(!governance.policy_validation_passed ? ["POLICY_VALIDATION_INVALID" as const] : []),
    ...(!governance.safety_validation_passed ? ["SAFETY_VALIDATION_INVALID" as const] : []),
    ...(!evidence.operational ? ["EVIDENCE_INTEGRATION_MISSING" as const] : []),
    ...(evidence.evidence_refs.length === 0 ? ["CANONICAL_EVIDENCE_REFS_MISSING" as const] : []),
    ...(evidence.replay_refs.length === 0 ? ["REPLAY_REFERENCES_MISSING" as const] : []),
    ...(!operations.operational ? ["OBSERVABILITY_MISSING" as const] : []),
    ...(has(failures, "APPLICATION_INTELLIGENCE_MISSING") ? ["APPLICATION_INTELLIGENCE_MISSING" as const] : []),
    ...(!api_suite.operational ? ["API_SUITE_MISSING" as const] : []),
    ...(has(failures, "INTERFACE_GOVERNANCE_INVALID") ? ["INTERFACE_GOVERNANCE_INVALID" as const] : []),
    ...(has(failures, "VERSION_COMPATIBILITY_INVALID") ? ["VERSION_COMPATIBILITY_INVALID" as const] : []),
    ...(!automation.operational ? ["AUTOMATION_SERVICES_MISSING" as const] : []),
    ...(has(failures, "AUTOMATION_GOVERNANCE_INVALID") ? ["AUTOMATION_GOVERNANCE_INVALID" as const] : []),
    ...(!security.tenant_isolation_validated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!security.operational ? ["SECURITY_CONFIGURATION_MISSING" as const] : []),
    ...(readiness.validation_report_refs.length === 0 ? ["VALIDATION_REPORTS_MISSING" as const] : []),
    ...(readiness.documentation_refs.length === 0 ? ["DOCUMENTATION_MISSING" as const] : []),
    ...(readiness.production_readiness_report_ref.length === 0 ? ["PRODUCTION_READINESS_MISSING" as const] : []),
    ...(readiness.application_certification_ref.length === 0 ? ["APPLICATION_CERTIFICATION_FAILED" as const] : []),
    ...(!noOutOfScope ? ["CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.15-AURORA-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    architecture_complete: foundation.operational && foundation.module_registry_ref.length > 0 && foundation.dependency_graph_ref.length > 0,
    domain_services_operational: domain_services.operational,
    workflows_execute_successfully: workflow_engine.operational && !has(failures, "WORKFLOW_EXECUTION_FAILED"),
    governance_integration_passes: governance.operational && !governance.enforcement_owned,
    authority_inheritance_verified: governance.authority_inheritance_verified,
    policy_validation_verified: governance.policy_validation_passed,
    safety_validation_verified: governance.safety_validation_passed,
    tenant_isolation_validated: security.tenant_isolation_validated,
    replay_compatibility_validated: readiness.replay_compatible,
    evidence_generation_complete: evidence.operational && evidence.evidence_refs.length > 0 && !evidence.owns_evidence_storage,
    observability_operational: operations.operational,
    interoperability_verified: readiness.interoperability_verified,
    documentation_complete: readiness.documentation_refs.length > 0,
    production_readiness_approved: readiness.operational_readiness_approved,
    application_certification_complete: readiness.application_certification_ref.length > 0,
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<AuroraResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    publisher_os_ref: "publisher-os/v4.14",
    pbg_ref: "policy-business-governance/v4.13",
    qci_ref: "quantedge-compintel/v4.12",
    mission_control_ref: "mission-control/v4.11",
    foundation,
    domain_services,
    user_experience,
    workflow_engine,
    integration_layer,
    governance,
    evidence,
    operations,
    api_suite,
    automation,
    security,
    readiness,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAurora(result?: AuroraResult): AuroraValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, domain_valid: false, experience_valid: false, workflow_valid: false, integration_valid: false, governance_valid: false, evidence_valid: false, operations_valid: false, api_valid: false, automation_valid: false, security_valid: false, readiness_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.operational && result.foundation.application_id.length > 0 && result.foundation.constitutional_inheritance_ref.length > 0 && result.foundation.module_registry_ref.length > 0;
  const domain_valid = verifyHashedRecord(result.domain_services) && result.domain_services.operational;
  const experience_valid = verifyHashedRecord(result.user_experience) && result.user_experience.operational;
  const workflow_valid = verifyHashedRecord(result.workflow_engine) && result.workflow_engine.operational;
  const integration_valid = verifyHashedRecord(result.integration_layer) && result.integration_layer.operational;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.operational && result.governance.authority_inheritance_verified && result.governance.policy_validation_passed && result.governance.safety_validation_passed && !result.governance.enforcement_owned;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.operational && result.evidence.references_canonical_cci_evidence && result.evidence.replay_refs.length > 0 && !result.evidence.owns_evidence_storage;
  const operations_valid = verifyHashedRecord(result.operations) && result.operations.operational;
  const api_valid = verifyHashedRecord(result.api_suite) && result.api_suite.operational;
  const automation_valid = verifyHashedRecord(result.automation) && result.automation.operational;
  const security_valid = verifyHashedRecord(result.security) && result.security.operational && result.security.tenant_isolation_validated;
  const readiness_valid = verifyHashedRecord(result.readiness) && result.readiness.operational && result.readiness.validation_report_refs.length > 0 && result.readiness.documentation_refs.length > 0 && result.readiness.application_certification_ref.length > 0 && result.readiness.replay_compatible && result.readiness.interoperability_verified;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && domain_valid && experience_valid && workflow_valid && integration_valid && governance_valid && evidence_valid && operations_valid && api_valid && automation_valid && security_valid && readiness_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, domain_valid, experience_valid, workflow_valid, integration_valid, governance_valid, evidence_valid, operations_valid, api_valid, automation_valid, security_valid, readiness_valid, certification_valid, failures: result.certification.failures });
}

export function replayAurora(result = runAurora()): boolean {
  const replayed = runAurora();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAurora(result).valid;
}

export function getAuroraBundle(): AuroraBundle {
  const result = runAurora();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_logic: true,
      owns_domain_services: true,
      owns_user_experience: true,
      owns_application_apis: true,
      owns_application_automation: true,
      owns_constitutional_governance: false,
      owns_authority_enforcement: false,
      owns_policy_enforcement: false,
      owns_safety_enforcement: false,
      owns_evidence_storage: false,
      owns_replay_infrastructure: false,
      owns_identity_infrastructure: false,
      owns_certification_infrastructure: false,
      owns_registry_infrastructure: false,
      owns_observability_infrastructure: false,
      owns_platform_lifecycle: false,
    }),
    result,
    validation: validateAurora(result),
  });
}

export const AuroraService = Object.freeze({ run: runAurora, validate: validateAurora, replay: replayAurora });
