import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMissionControl, validateMissionControl } from "@/services/mission-control";
import type { StevnActivation, StevnBundle, StevnCapabilityClass, StevnDivergenceClass, StevnFailure, StevnInput, StevnInterfaceClass, StevnOutcome, StevnRecord, StevnResult, StevnScenario, StevnValidation } from "@/types/stevn";

const VERSION = "stevn-application/v4.17" as const;
const IDENTIFIER = "STEVNApplication" as const;
const CREATED_AT = "2026-07-18T00:00:00.000Z" as const;
let baselineMissionControl: ReturnType<typeof runMissionControl> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly StevnFailure[], failure: StevnFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: StevnScenario): StevnFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly StevnFailure[]): StevnOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getMissionControl() { baselineMissionControl ??= runMissionControl(); return baselineMissionControl; }
function record(applicationId: string, tenantId: string, id: string, refs: readonly string[], failures: readonly StevnFailure[], missing: StevnFailure): StevnRecord {
  return nested({
    record_id: has(failures, missing) ? "" : id,
    application_id: applicationId,
    tenant_id: tenantId,
    version: VERSION,
    lifecycle_status: has(failures, "UNCERTIFIED_ACTIVATION_PATH") ? "ACTIVE" as const : "CERTIFIED" as const,
    created_at: CREATED_AT,
    refs: freezeArray(refs),
    source_refs: freezeArray(["source:program-4:p4.17"]),
    policy_refs: freezeArray(["policy:civitas:application-governance", "policy:stevn-application:boundary"]),
    authority_refs: freezeArray(["authority:civitas:operator", "authority:mission-control:interfaces"]),
    operator_refs: freezeArray(["operator:primary"]),
    evidence_refs: freezeArray(["cci:evidence:stevn-application"]),
    replay_refs: freezeArray(["cci:replay:stevn-application"]),
    operational: !has(failures, missing),
    deterministic: !has(failures, "NONDETERMINISTIC_BEHAVIOR"),
  });
}
function resultReplayHash(result: Omit<StevnResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    capabilities: result.capabilities.integrity_hash,
    domain: result.domain_model.integrity_hash,
    experience: result.experience.integrity_hash,
    integrations: result.integrations.integrity_hash,
    governance: result.governance.integrity_hash,
    evidence: result.evidence.integrity_hash,
    replay: result.replay.integrity_hash,
    operations: result.operations.integrity_hash,
    security: result.security.integrity_hash,
    lifecycle: result.lifecycle.integrity_hash,
    certification: result.certification.integrity_hash,
    activation: result.activation.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<StevnResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runStevn(input: StevnInput = {}): StevnResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<StevnFailure>(direct ? [direct] : []);
  const missionControl = getMissionControl();
  const dependencyFailures = freezeArray<StevnFailure>([
    ...(!validateMissionControl(missionControl).valid || has(scenarioFailures, "P4_11_MISSION_CONTROL_INVALID") ? ["P4_11_MISSION_CONTROL_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_10_OPERATIONAL_INTELLIGENCE_INVALID") ? ["P4_10_OPERATIONAL_INTELLIGENCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_9_REPLAY_AUDIT_INVALID") ? ["P4_9_REPLAY_AUDIT_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_8_GOVERNANCE_BINDING_INVALID") ? ["P4_8_GOVERNANCE_BINDING_INVALID" as const] : []),
    ...(has(scenarioFailures, "P4_7_EVIDENCE_GOVERNANCE_INVALID") ? ["P4_7_EVIDENCE_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_CAPABILITY_ATLAS_INVALID") ? ["PROGRAM_1_CAPABILITY_ATLAS_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_INVALID") ? ["PROGRAM_2_CCI_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_INVALID") ? ["PROGRAM_3_CAF_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = has(failures, "STEVN_APPLICATION_MISSING") ? "" : input.application_id ?? "app:stevn-application";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundationBase = record(applicationId, tenantId, "P4.17-STEVN-FOUNDATION-001", ["constitution:stevn-application", "boundary:application-framework-distinction", "registry:application:stevn"], failures, "APPLICATION_CONSTITUTION_MISSING");
  const foundation = nested({
    ...foundationBase,
    application_name: "STEVN Application" as const,
    application_namespace: "civitas.application.stevn" as const,
    framework_namespace: "mission_control.framework.stevn" as const,
    owns_application: true as const,
    owns_framework: false as const,
    advisory_boundary: true as const,
    distinction_contract_ref: has(failures, "APPLICATION_FRAMEWORK_DISTINCTION_MISSING") ? "" : "contract:stevn-application-framework-distinction",
    registration_ref: has(failures, "APPLICATION_REGISTRATION_MISSING") ? "" : "registry:program-4:stevn-application",
    namespace_collision_free: !has(failures, "NAMESPACE_COLLISION") && !has(failures, "AMBIGUOUS_STEVN_TERMINOLOGY"),
  });
  const capabilities = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-CAPABILITY-MAP-001", ["capability:application-native", "capability:cci-consumed", "capability:caf-composed", "capability:mission-control-consumed", "capability:stevn-framework-consumed"], failures, "CAPABILITY_MAP_MISSING"), classifications: freezeArray<StevnCapabilityClass>(["APPLICATION_NATIVE", "CCI_CONSUMED", "CAF_COMPOSED", "MISSION_CONTROL_CONSUMED", "STEVN_FRAMEWORK_CONSUMED", "EXTERNAL_GOVERNED_SERVICE"]), hidden_capabilities: has(failures, "HIDDEN_CAPABILITY") ? freezeArray(["unregistered-execution"]) : freezeArray<string>([]), degradation_matrix_ref: has(failures, "CAPABILITY_DEPENDENCY_UNAVAILABLE") ? "" : "degradation:stevn-application" });
  const domain_model = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-DOMAIN-MODEL-001", ["STEVNApplicationRecord", "STEVNApplicationConfiguration", "STEVNApplicationSession", "STEVNApplicationWorkflow", "STEVNApplicationCapabilityBinding", "STEVNApplicationInteractionRecord", "STEVNApplicationEvidenceReference", "STEVNApplicationOperationalRecord"], failures, "DOMAIN_MODEL_MISSING"), core_records: freezeArray(["STEVNApplicationRecord", "STEVNApplicationConfiguration", "STEVNApplicationSession", "STEVNApplicationWorkflow", "STEVNApplicationCapabilityBinding", "STEVNApplicationInteractionRecord", "STEVNApplicationEvidenceReference", "STEVNApplicationOperationalRecord"]), deterministic_identifiers: !has(failures, "NONDETERMINISTIC_BEHAVIOR"), workflow_state_model_valid: !has(failures, "WORKFLOW_STATE_MODEL_INVALID") });
  const experience = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-EXPERIENCE-001", ["navigation:stevn-application", "view:governance-warnings", "view:provenance", "view:dependency-health"], failures, "EXPERIENCE_LAYER_MISSING"), views: freezeArray(["Application Health", "Capability Health", "Integration Health", "Governance Status", "Authority and Approval Status", "Evidence Completeness", "Replay Status", "Tenant Isolation Status", "Incident Status", "Certification Status"]), provenance_visible: true, warnings_visible: !has(failures, "OPERATOR_WARNING_VIEW_MISSING"), hidden_autonomy: has(failures, "OPERATOR_BYPASS") });
  const integrations = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-INTEGRATION-001", ["cci:identity", "cci:evidence", "caf:authority-policy-safety", "mission-control:interfaces", "mission_control.framework.stevn:authorized"], failures, "CCI_INTEGRATION_MISSING"), cci_bindings: has(failures, "CCI_INTEGRATION_MISSING") ? freezeArray<string>([]) : freezeArray(["identity", "registry", "namespace", "storage", "evidence", "provenance", "messaging", "policy", "governance", "replay", "audit", "observability", "security", "lifecycle", "certification"]), caf_gate_sequence: has(failures, "CAF_GATE_SEQUENCE_INVALID") ? freezeArray(["CAF Policy Gate", "CAF Authority Gate", "Execution admission"]) : freezeArray(["Resolve authority requirement", "Capture operator approval when required", "CAF Authority Gate", "CAF Policy Gate", "CAF Safety Gate", "Resolve warning disposition", "Execution admission", "Authorized execution"]), mission_control_interfaces: freezeArray<StevnInterfaceClass>(["READ_ONLY", "ADVISORY_INPUT", "ADVISORY_OUTPUT", "GOVERNED_COMMAND_REQUEST", "EVENT_SUBSCRIPTION", "EVIDENCE_REFERENCE", "REPLAY_REFERENCE"]), framework_interfaces: has(failures, "FRAMEWORK_INTERFACE_UNAUTHORIZED") ? freezeArray<StevnInterfaceClass>(["PROHIBITED"]) : freezeArray<StevnInterfaceClass>(["READ_ONLY", "ADVISORY_INPUT", "EVIDENCE_REFERENCE", "REPLAY_REFERENCE"]), duplicates_shared_infrastructure: has(failures, "LOCAL_CCI_DUPLICATION_ATTEMPTED"), unauthorized_framework_access: has(failures, "FRAMEWORK_INTERFACE_UNAUTHORIZED") });
  const governance = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-GOVERNANCE-001", ["governance-binding:p4.8", "authority:requirements", "approval:routing", "policy:constraints"], failures, "GOVERNANCE_BINDING_MISSING"), authority_gate_ref: has(failures, "CAF_GATE_SEQUENCE_INVALID") ? "" : "caf:authority-gate", policy_gate_ref: has(failures, "POLICY_UNAVAILABLE") ? "" : "caf:policy-gate", safety_gate_ref: "caf:safety-gate", approval_routing_ref: has(failures, "OPERATOR_BYPASS") ? "" : "operator-approval:stevn-application", operator_disposition_refs: has(failures, "OPERATOR_BYPASS") ? freezeArray<string>([]) : freezeArray(["operator-disposition:stevn:001"]), expands_authority: has(failures, "AUTHORITY_EXPANSION"), bypasses_governance: has(failures, "GOVERNANCE_BYPASS"), bypasses_operator: has(failures, "OPERATOR_BYPASS") });
  const evidence = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-EVIDENCE-INDEX-001", ["evidence-index:stevn-application", "source-registry:stevn-application", "provenance-view:stevn-application"], failures, "EVIDENCE_INDEX_MISSING"), evidence_index_refs: has(failures, "MATERIAL_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:evidence-index:stevn-application"]), source_registry_refs: freezeArray(["source-registry:stevn-application"]), provenance_view_refs: freezeArray(["provenance-view:stevn-application"]), material_evidence_complete: !has(failures, "MATERIAL_EVIDENCE_MISSING"), owns_canonical_storage: has(failures, "EVIDENCE_STORAGE_DUPLICATED") });
  const replay = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-REPLAY-ANALYSIS-001", ["replay-request:stevn-application", "audit-report:stevn-application", "forensic-findings:stevn-application"], failures, "REPLAY_ANALYSIS_MISSING"), replay_request_refs: freezeArray(["cci:replay-request:stevn-application"]), divergence_classes: has(failures, "UNEXPLAINED_DIVERGENCE") ? freezeArray<StevnDivergenceClass>(["UNEXPLAINED"]) : has(failures, "NONDETERMINISTIC_BEHAVIOR") ? freezeArray<StevnDivergenceClass>(["NONDETERMINISTIC"]) : freezeArray<StevnDivergenceClass>(["INPUT", "CONFIGURATION", "DEPENDENCY", "POLICY", "AUTHORITY", "OPERATOR", "OUTPUT"]), unexplained_divergence: has(failures, "UNEXPLAINED_DIVERGENCE"), nondeterministic_divergence: has(failures, "NONDETERMINISTIC_BEHAVIOR"), executes_replay_engine: has(failures, "REPLAY_ENGINE_DUPLICATED") });
  const operations = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-OPERATIONS-001", ["dashboard:stevn-application", "alerts:stevn-application", "diagnostics:stevn-application"], failures, "OBSERVABILITY_MISSING"), dashboard_views: experience.views, dependency_health_observable: !has(failures, "DEPENDENCY_HEALTH_UNOBSERVABLE"), incident_status_visible: true, certification_status_visible: true });
  const security = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-SECURITY-001", ["tenant-isolation:stevn-application", "threat-model:stevn-application", "access-control:stevn-application"], failures, "SECURITY_MODEL_INVALID"), tenant_isolation_validated: !has(failures, "TENANT_ISOLATION_FAILURE"), namespace_spoofing_detected: has(failures, "NAMESPACE_COLLISION"), privilege_escalation_blocked: !has(failures, "PRIVILEGE_ESCALATION_UNBLOCKED"), access_control_matrix_ref: "access-control:stevn-application" });
  const lifecycle = nested({ ...record(applicationId, tenantId, "P4.17-STEVN-LIFECYCLE-001", ["release:stevn-application", "lineage:stevn-application", "rollback:stevn-application"], failures, "LIFECYCLE_RECORD_MISSING"), release_manifest_ref: has(failures, "RELEASE_ARTIFACT_MISMATCH") ? "" : "release:stevn-application:4.17.0", version_lineage_ref: "lineage:stevn-application:v4.17", rollback_plan_ref: has(failures, "ROLLBACK_UNAVAILABLE") ? "" : "rollback:stevn-application:4.17.0", rollback_validated: !has(failures, "ROLLBACK_UNAVAILABLE"), activation_prevented_when_uncertified: !has(failures, "UNCERTIFIED_ACTIVATION_PATH") });
  const noOutOfScope = !foundation.owns_framework && !has(failures, "FRAMEWORK_OWNERSHIP_CONFLICT") && !integrations.duplicates_shared_infrastructure && !governance.expands_authority && !governance.bypasses_governance && !replay.executes_replay_engine && !evidence.owns_canonical_storage;
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(applicationId.length === 0 ? ["STEVN_APPLICATION_MISSING" as const] : []),
    ...(foundation.distinction_contract_ref.length === 0 ? ["APPLICATION_FRAMEWORK_DISTINCTION_MISSING" as const] : []),
    ...(!foundation.namespace_collision_free ? ["NAMESPACE_COLLISION" as const] : []),
    ...(foundation.registration_ref.length === 0 ? ["APPLICATION_REGISTRATION_MISSING" as const] : []),
    ...(capabilities.hidden_capabilities.length > 0 ? ["HIDDEN_CAPABILITY" as const] : []),
    ...(capabilities.degradation_matrix_ref.length === 0 ? ["CAPABILITY_DEPENDENCY_UNAVAILABLE" as const] : []),
    ...(!domain_model.workflow_state_model_valid ? ["WORKFLOW_STATE_MODEL_INVALID" as const] : []),
    ...(!experience.warnings_visible ? ["OPERATOR_WARNING_VIEW_MISSING" as const] : []),
    ...(integrations.cci_bindings.length === 0 ? ["CCI_INTEGRATION_MISSING" as const] : []),
    ...(integrations.unauthorized_framework_access ? ["FRAMEWORK_INTERFACE_UNAUTHORIZED" as const] : []),
    ...(governance.authority_gate_ref.length === 0 ? ["CAF_GATE_SEQUENCE_INVALID" as const] : []),
    ...(governance.policy_gate_ref.length === 0 ? ["POLICY_UNAVAILABLE" as const] : []),
    ...(governance.approval_routing_ref.length === 0 ? ["OPERATOR_BYPASS" as const] : []),
    ...(evidence.evidence_index_refs.length === 0 || !evidence.material_evidence_complete ? ["MATERIAL_EVIDENCE_MISSING" as const] : []),
    ...(replay.unexplained_divergence ? ["UNEXPLAINED_DIVERGENCE" as const] : []),
    ...(replay.nondeterministic_divergence ? ["NONDETERMINISTIC_BEHAVIOR" as const] : []),
    ...(!operations.dependency_health_observable ? ["DEPENDENCY_HEALTH_UNOBSERVABLE" as const] : []),
    ...(!security.tenant_isolation_validated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!security.privilege_escalation_blocked ? ["PRIVILEGE_ESCALATION_UNBLOCKED" as const] : []),
    ...(!lifecycle.rollback_validated ? ["ROLLBACK_UNAVAILABLE" as const] : []),
    ...(!lifecycle.activation_prevented_when_uncertified ? ["UNCERTIFIED_ACTIVATION_PATH" as const] : []),
    ...(!noOutOfScope ? ["FRAMEWORK_OWNERSHIP_CONFLICT" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.17-STEVN-CERTIFICATION-001",
    status: outcome(derivedFailures) === "PASS" ? "CERTIFIED" as const : "CERTIFICATION_SUSPENDED" as const,
    decision: outcome(derivedFailures) === "PASS" ? "PASS" as const : "FAIL" as const,
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    distinction_verified: foundation.distinction_contract_ref.length > 0 && !foundation.owns_framework,
    namespace_integrity: foundation.namespace_collision_free,
    capability_complete: capabilities.operational && capabilities.hidden_capabilities.length === 0 && capabilities.degradation_matrix_ref.length > 0,
    integrations_validated: integrations.operational && !integrations.duplicates_shared_infrastructure && !integrations.unauthorized_framework_access && integrations.caf_gate_sequence[0] === "Resolve authority requirement",
    governance_compliant: governance.operational && governance.authority_gate_ref.length > 0 && governance.policy_gate_ref.length > 0 && !governance.expands_authority && !governance.bypasses_governance && !governance.bypasses_operator,
    evidence_complete: evidence.operational && evidence.material_evidence_complete && !evidence.owns_canonical_storage,
    replay_passed: replay.operational && !replay.unexplained_divergence && !replay.nondeterministic_divergence && !replay.executes_replay_engine,
    observability_operational: operations.operational && operations.dependency_health_observable,
    tenant_isolation_passed: security.operational && security.tenant_isolation_validated && security.privilege_escalation_blocked,
    rollback_ready: lifecycle.operational && lifecycle.rollback_validated,
    production_ready: outcome(derivedFailures) === "PASS",
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const activationBase = record(applicationId, tenantId, "P4.17-STEVN-ACTIVATION-001", ["activation:stevn-application", "production:stevn-application", "rollback-verification:stevn-application"], failures, "PRODUCTION_ACTIVATION_MISSING");
  const activation: StevnActivation = nested({ ...activationBase, production_environment_ref: "production:tenant:primary", certificate_ref: certification.outcome === "PASS" && !has(failures, "CERTIFICATION_FAILED") ? certification.certification_id : "", release_artifact_ref: has(failures, "RELEASE_ARTIFACT_MISMATCH") ? "" : lifecycle.release_manifest_ref, activation_authority_ref: "governance-authorization:stevn-activation", activated: activationBase.operational && certification.outcome === "PASS" && lifecycle.rollback_validated && lifecycle.activation_prevented_when_uncertified });
  const activationFailures = freezeArray([...new Set([...certification.failures, ...(activation.certificate_ref.length === 0 ? ["CERTIFICATION_FAILED" as const] : []), ...(activation.release_artifact_ref.length === 0 ? ["RELEASE_ARTIFACT_MISMATCH" as const] : []), ...(!activation.activated ? ["PRODUCTION_ACTIVATION_MISSING" as const] : [])])]);
  const finalCertification = nested({ ...certification, failures: activationFailures, outcome: outcome(activationFailures), phase_ready: outcome(activationFailures) === "PASS", production_ready: activation.activated });
  const base: Omit<StevnResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, mission_control_ref: "mission-control/v4.11", foundation, capabilities, domain_model, experience, integrations, governance, evidence, replay, operations, security, lifecycle, certification: finalCertification, activation };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateStevn(result?: StevnResult): StevnValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, capabilities_valid: false, domain_valid: false, experience_valid: false, integrations_valid: false, governance_valid: false, evidence_valid: false, replay_valid: false, operations_valid: false, security_valid: false, lifecycle_valid: false, certification_valid: false, activation_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.operational && result.foundation.application_id.length > 0 && result.foundation.owns_application && !result.foundation.owns_framework && result.foundation.distinction_contract_ref.length > 0 && result.foundation.namespace_collision_free;
  const capabilities_valid = verifyHashedRecord(result.capabilities) && result.capabilities.operational && result.capabilities.hidden_capabilities.length === 0 && result.capabilities.classifications.includes("STEVN_FRAMEWORK_CONSUMED") && result.capabilities.degradation_matrix_ref.length > 0;
  const domain_valid = verifyHashedRecord(result.domain_model) && result.domain_model.operational && result.domain_model.core_records.includes("STEVNApplicationRecord") && result.domain_model.workflow_state_model_valid && result.domain_model.deterministic_identifiers;
  const experience_valid = verifyHashedRecord(result.experience) && result.experience.operational && result.experience.provenance_visible && result.experience.warnings_visible && !result.experience.hidden_autonomy;
  const integrations_valid = verifyHashedRecord(result.integrations) && result.integrations.operational && result.integrations.cci_bindings.length > 0 && result.integrations.caf_gate_sequence[0] === "Resolve authority requirement" && result.integrations.framework_interfaces.every((value) => value !== "PROHIBITED") && !result.integrations.duplicates_shared_infrastructure && !result.integrations.unauthorized_framework_access;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.operational && result.governance.authority_gate_ref.length > 0 && result.governance.policy_gate_ref.length > 0 && result.governance.safety_gate_ref.length > 0 && result.governance.operator_disposition_refs.length > 0 && !result.governance.expands_authority && !result.governance.bypasses_governance && !result.governance.bypasses_operator;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.operational && result.evidence.evidence_index_refs.length > 0 && result.evidence.material_evidence_complete && !result.evidence.owns_canonical_storage;
  const replay_valid = verifyHashedRecord(result.replay) && result.replay.operational && !result.replay.unexplained_divergence && !result.replay.nondeterministic_divergence && !result.replay.executes_replay_engine;
  const operations_valid = verifyHashedRecord(result.operations) && result.operations.operational && result.operations.dependency_health_observable && result.operations.certification_status_visible;
  const security_valid = verifyHashedRecord(result.security) && result.security.operational && result.security.tenant_isolation_validated && result.security.privilege_escalation_blocked;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle) && result.lifecycle.operational && result.lifecycle.rollback_validated && result.lifecycle.activation_prevented_when_uncertified && result.lifecycle.release_manifest_ref.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.status === "CERTIFIED" && result.certification.decision === "PASS" && result.certification.failures.length === 0 && result.certification.no_out_of_scope_ownership;
  const activation_valid = verifyHashedRecord(result.activation) && result.activation.operational && result.activation.activated && result.activation.certificate_ref === result.certification.certification_id && result.activation.release_artifact_ref === result.lifecycle.release_manifest_ref;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && capabilities_valid && domain_valid && experience_valid && integrations_valid && governance_valid && evidence_valid && replay_valid && operations_valid && security_valid && lifecycle_valid && certification_valid && activation_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, capabilities_valid, domain_valid, experience_valid, integrations_valid, governance_valid, evidence_valid, replay_valid, operations_valid, security_valid, lifecycle_valid, certification_valid, activation_valid, failures: result.certification.failures });
}

export function replayStevn(result = runStevn()): boolean {
  const replayed = runStevn();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateStevn(result).valid;
}

export function getStevnBundle(): StevnBundle {
  const result = runStevn();
  return Object.freeze({
    doctrine: Object.freeze({ version: VERSION, owns_stevn_application: true, owns_stevn_framework: false, owns_mission_control_architecture: false, owns_cci_infrastructure: false, owns_caf_runtime: false, owns_governance_engines: false, owns_replay_engine: false, owns_evidence_storage: false, owns_certification_engine: false, advisory_boundary: true }),
    result,
    validation: validateStevn(result),
  });
}

export const StevnService = Object.freeze({ run: runStevn, validate: validateStevn, replay: replayStevn });
