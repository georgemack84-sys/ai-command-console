import { runAurora, validateAurora } from "@/services/aurora";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPolicyBusinessGovernance, validatePolicyBusinessGovernance } from "@/services/policy-business-governance";
import { runPublisherOs, validatePublisherOs } from "@/services/publisher-os";
import type { ApexBundle, ApexFailure, ApexInput, ApexOutcome, ApexRecord, ApexResult, ApexScenario, ApexValidation } from "@/types/apex";

const VERSION = "apex/v4.16" as const;
const IDENTIFIER = "APEX" as const;
let baselineAurora: ReturnType<typeof runAurora> | undefined;
let baselinePublisher: ReturnType<typeof runPublisherOs> | undefined;
let baselinePbg: ReturnType<typeof runPolicyBusinessGovernance> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ApexFailure[], failure: ApexFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApexScenario): ApexFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApexFailure[]): ApexOutcome { if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED"; return failures.length ? "FAIL" : "PASS"; }
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getAurora() { baselineAurora ??= runAurora(); return baselineAurora; }
function getPublisher() { baselinePublisher ??= runPublisherOs(); return baselinePublisher; }
function getPbg() { baselinePbg ??= runPolicyBusinessGovernance(); return baselinePbg; }
function record(id: string, refs: readonly string[], failures: readonly ApexFailure[], missing: ApexFailure, nondeterministic?: ApexFailure): ApexRecord {
  return nested({ record_id: has(failures, missing) ? "" : id, refs: freezeArray(refs), operational: !has(failures, missing), deterministic: nondeterministic ? !has(failures, nondeterministic) : true });
}
function resultReplayHash(result: Omit<ApexResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.foundation.integrity_hash,
    planning: result.planning_engine.integrity_hash,
    workflow: result.workflow_orchestration.integrity_hash,
    execution: result.execution_coordination.integrity_hash,
    dashboards: result.dashboards.integrity_hash,
    collaboration: result.collaboration.integrity_hash,
    governance: result.governance.integrity_hash,
    evidence: result.evidence.integrity_hash,
    replay: result.replay.integrity_hash,
    observability: result.observability.integrity_hash,
    lifecycle: result.lifecycle_certification.integrity_hash,
    security: result.security.integrity_hash,
    performance: result.performance.integrity_hash,
    integration: result.integration_validation.integrity_hash,
    qualification: result.qualification.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApexResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash }); }

export function runApex(input: ApexInput = {}): ApexResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApexFailure>(direct ? [direct] : []);
  const aurora = getAurora();
  const publisher = getPublisher();
  const pbg = getPbg();
  const dependencyFailures = freezeArray<ApexFailure>([
    ...(!validateAurora(aurora).valid || has(scenarioFailures, "P4_15_AURORA_INVALID") ? ["P4_15_AURORA_INVALID" as const] : []),
    ...(!validatePublisherOs(publisher).valid || has(scenarioFailures, "P4_14_PUBLISHER_OS_INVALID") ? ["P4_14_PUBLISHER_OS_INVALID" as const] : []),
    ...(!validatePolicyBusinessGovernance(pbg).valid || has(scenarioFailures, "P4_13_PBG_INVALID") ? ["P4_13_PBG_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_FOUNDATION_INVALID") ? ["PROGRAM_1_FOUNDATION_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_2_CCI_INVALID") ? ["PROGRAM_2_CCI_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_3_CAF_INVALID") ? ["PROGRAM_3_CAF_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? "app:apex";
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const foundation = nested({
    record_id: has(failures, "APEX_APPLICATION_MISSING") || has(failures, "APPLICATION_FOUNDATION_MISSING") ? "" : "P4.16-APEX-FOUNDATION-001",
    refs: freezeArray(["architecture:apex", "constitution:apex", "planning-model:apex", "execution-model:apex"]),
    operational: !has(failures, "APEX_APPLICATION_MISSING") && !has(failures, "APPLICATION_FOUNDATION_MISSING"),
    deterministic: true,
    application_id: has(failures, "APEX_APPLICATION_MISSING") ? "" : applicationId,
    application_name: "APEX" as const,
    tenant_id: tenantId,
    application_constitution_ref: has(failures, "APPLICATION_CONSTITUTION_MISSING") ? "" : "constitution:apex",
    planning_model_ref: has(failures, "PLANNING_MODEL_MISSING") ? "" : "planning-model:apex",
    execution_model_ref: has(failures, "EXECUTION_MODEL_MISSING") ? "" : "execution-model:apex",
  });
  const planning_engine = record("P4.16-PLANNING-ENGINE-001", ["operational-planning", "mission-planning", "dependency-planning", "scheduling", "objective-decomposition"], failures, "PLANNING_ENGINE_MISSING");
  const workflow_orchestration = record("P4.16-WORKFLOW-ENGINE-001", ["workflow-execution", "stage-progression", "dependency-coordination", "execution-sequencing"], failures, "WORKFLOW_ENGINE_MISSING");
  const execution_coordination = record("P4.16-EXECUTION-COORDINATOR-001", ["execution-lifecycle", "execution-state", "orchestration-requests", "execution-monitoring"], failures, "EXECUTION_COORDINATOR_MISSING");
  const dashboards = record("P4.16-OPERATIONAL-DASHBOARD-001", ["planning-dashboard", "execution-dashboard", "workflow-visualization", "progress-monitoring"], failures, "OPERATIONAL_DASHBOARD_MISSING");
  const collaboration = record("P4.16-COLLABORATION-WORKSPACE-001", ["shared-planning", "coordination", "approvals", "planning-comments", "caf-collaboration"], failures, "COLLABORATION_WORKSPACE_MISSING");
  const governance = nested({
    record_id: has(failures, "GOVERNANCE_INTEGRATION_MISSING") ? "" : "P4.16-GOVERNANCE-INTEGRATION-001",
    refs: freezeArray(["constitutional-execution", "governed-planning", "approval-routing"]),
    operational: !has(failures, "GOVERNANCE_INTEGRATION_MISSING"),
    deterministic: true,
    authority_gate_ref: has(failures, "AUTHORITY_GATE_NOT_BOUND") ? "" : "caf:authority-gate",
    policy_gate_ref: has(failures, "POLICY_GATE_NOT_BOUND") ? "" : "caf:policy-gate",
    safety_gate_ref: has(failures, "SAFETY_GATE_NOT_BOUND") ? "" : "caf:safety-gate",
    approval_routing_ref: has(failures, "APPROVAL_ROUTING_MISSING") ? "" : "caf:approval-framework",
    constitutional_execution_verified: true,
    governed_planning_verified: true,
    enforcement_owned: has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") || has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") || has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED") || has(failures, "GOVERNANCE_ENGINE_ATTEMPTED"),
  });
  const evidence = nested({
    record_id: has(failures, "EVIDENCE_INTEGRATION_MISSING") ? "" : "P4.16-EVIDENCE-VIEWS-001",
    refs: freezeArray(["execution-references", "workflow-evidence", "planning-evidence-index"]),
    operational: !has(failures, "EVIDENCE_INTEGRATION_MISSING"),
    deterministic: true,
    execution_refs: freezeArray(["execution:apex:001"]),
    workflow_evidence_refs: has(failures, "WORKFLOW_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:evidence:apex:workflow"]),
    planning_evidence_index_refs: has(failures, "PLANNING_EVIDENCE_INDEX_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:evidence-index:apex:planning"]),
    canonical_cci_evidence: true,
    owns_evidence_storage: has(failures, "EVIDENCE_STORAGE_ATTEMPTED"),
  });
  const replay = nested({
    record_id: has(failures, "REPLAY_INTEGRATION_MISSING") ? "" : "P4.16-REPLAY-VIEWER-001",
    refs: freezeArray(["execution-replay", "planning-replay", "workflow-replay"]),
    operational: !has(failures, "REPLAY_INTEGRATION_MISSING"),
    deterministic: true,
    execution_replay_view_refs: freezeArray(["replay-view:execution"]),
    planning_replay_visualization_refs: freezeArray(["replay-view:planning"]),
    workflow_replay_interpretation_refs: freezeArray(["replay-view:workflow"]),
    consumes_caf_behavioral_replay: !has(failures, "BEHAVIORAL_REPLAY_NOT_CONSUMED"),
    executes_replay: has(failures, "REPLAY_ENGINE_ATTEMPTED"),
  });
  const observability = record("P4.16-OPERATIONAL-INTELLIGENCE-DASHBOARD-001", ["execution-metrics", "workflow-metrics", "dashboards", "diagnostics"], failures, "OBSERVABILITY_MISSING");
  const lifecycle_certification = record("P4.16-LIFECYCLE-CERTIFICATION-001", ["application-lifecycle", "version-lineage", "certification-records", "release-management"], failures, "LIFECYCLE_RECORDS_MISSING");
  const security = nested({
    record_id: has(failures, "SECURITY_BOUNDARIES_INVALID") ? "" : "P4.16-TENANT-BOUNDARY-VALIDATION-001",
    refs: freezeArray(["tenant-isolation", "authorization-inheritance", "namespace-isolation", "secure-boundaries"]),
    operational: !has(failures, "SECURITY_BOUNDARIES_INVALID"),
    deterministic: true,
    tenant_boundary_refs: freezeArray(["tenant-boundary:apex"]),
    authorization_inheritance_ref: "cci:identity-authorization",
    namespace_isolation_ref: "cci:namespace-isolation",
    secure_boundary_refs: freezeArray(["security-boundary:apex"]),
    tenant_isolation_validated: !has(failures, "TENANT_ISOLATION_INVALID"),
  });
  const performance = record("P4.16-PERFORMANCE-REPORT-001", ["planning-scalability", "workflow-throughput", "coordination-performance", "dashboard-responsiveness"], failures, "PERFORMANCE_REPORT_MISSING");
  const integration_validation = record("P4.16-INTEGRATION-REPORT-001", ["caf-integration", "cci-integration", "application-interoperability", "platform-compatibility"], failures, "INTEGRATION_REPORT_MISSING");
  const qualification = nested({
    record_id: has(failures, "QUALIFICATION_FAILED") ? "" : "P4.16-APEX-QUALIFICATION-001",
    refs: freezeArray(["constitutional-compliance", "architecture", "governance", "replay", "evidence", "interoperability", "operations", "tenant", "performance", "maturity"]),
    operational: !has(failures, "QUALIFICATION_FAILED"),
    deterministic: true,
    performance_report_ref: has(failures, "PERFORMANCE_REPORT_MISSING") ? "" : performance.record_id,
    integration_report_ref: has(failures, "INTEGRATION_REPORT_MISSING") ? "" : integration_validation.record_id,
    production_readiness_ref: has(failures, "PRODUCTION_READINESS_MISSING") ? "" : "readiness:apex:production",
    certification_record_refs: has(failures, "CERTIFICATION_RECORDS_MISSING") ? freezeArray<string>([]) : freezeArray(["certification:apex:application"]),
    replay_compatible: !has(failures, "BEHAVIORAL_REPLAY_NOT_CONSUMED") && !has(failures, "REPLAY_INTEGRATION_MISSING"),
    evidence_complete: evidence.workflow_evidence_refs.length > 0 && evidence.planning_evidence_index_refs.length > 0,
    interoperability_verified: !has(failures, "INTEROPERABILITY_INVALID"),
    operational_readiness: !has(failures, "PRODUCTION_READINESS_MISSING"),
    application_maturity: true,
    qualified: !has(failures, "QUALIFICATION_FAILED"),
  });
  const noOutOfScope = !has(failures, "IDENTITY_OWNERSHIP_ATTEMPTED") && !has(failures, "GOVERNANCE_ENGINE_ATTEMPTED") && !has(failures, "AUTHORITY_ENFORCEMENT_ATTEMPTED") && !has(failures, "POLICY_ENFORCEMENT_ATTEMPTED") && !has(failures, "SAFETY_ENFORCEMENT_ATTEMPTED") && !has(failures, "REPLAY_ENGINE_ATTEMPTED") && !has(failures, "AUDIT_ENGINE_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "CERTIFICATION_ENGINE_ATTEMPTED") && !has(failures, "MESSAGING_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "OBSERVABILITY_PLATFORM_ATTEMPTED") && !has(failures, "REGISTRY_INFRASTRUCTURE_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(foundation.application_id.length === 0 ? ["APEX_APPLICATION_MISSING" as const] : []),
    ...(foundation.record_id.length === 0 ? ["APPLICATION_FOUNDATION_MISSING" as const] : []),
    ...(foundation.application_constitution_ref.length === 0 ? ["APPLICATION_CONSTITUTION_MISSING" as const] : []),
    ...(foundation.planning_model_ref.length === 0 ? ["PLANNING_MODEL_MISSING" as const] : []),
    ...(foundation.execution_model_ref.length === 0 ? ["EXECUTION_MODEL_MISSING" as const] : []),
    ...(!planning_engine.operational ? ["PLANNING_ENGINE_MISSING" as const] : []),
    ...(has(failures, "MISSION_PLANNING_MISSING") ? ["MISSION_PLANNING_MISSING" as const] : []),
    ...(has(failures, "DEPENDENCY_PLANNING_MISSING") ? ["DEPENDENCY_PLANNING_MISSING" as const] : []),
    ...(has(failures, "SCHEDULING_MISSING") ? ["SCHEDULING_MISSING" as const] : []),
    ...(has(failures, "OBJECTIVE_DECOMPOSITION_MISSING") ? ["OBJECTIVE_DECOMPOSITION_MISSING" as const] : []),
    ...(!workflow_orchestration.operational ? ["WORKFLOW_ENGINE_MISSING" as const] : []),
    ...(has(failures, "STAGE_PROGRESSION_INVALID") ? ["STAGE_PROGRESSION_INVALID" as const] : []),
    ...(has(failures, "DEPENDENCY_COORDINATION_INVALID") ? ["DEPENDENCY_COORDINATION_INVALID" as const] : []),
    ...(!execution_coordination.operational ? ["EXECUTION_COORDINATOR_MISSING" as const] : []),
    ...(has(failures, "EXECUTION_STATE_INVALID") ? ["EXECUTION_STATE_INVALID" as const] : []),
    ...(has(failures, "EXECUTION_MONITORING_MISSING") ? ["EXECUTION_MONITORING_MISSING" as const] : []),
    ...(!dashboards.operational ? ["OPERATIONAL_DASHBOARD_MISSING" as const] : []),
    ...(has(failures, "WORKFLOW_VISUALIZATION_MISSING") ? ["WORKFLOW_VISUALIZATION_MISSING" as const] : []),
    ...(has(failures, "PROGRESS_MONITORING_MISSING") ? ["PROGRESS_MONITORING_MISSING" as const] : []),
    ...(!collaboration.operational ? ["COLLABORATION_WORKSPACE_MISSING" as const] : []),
    ...(has(failures, "CAF_COLLABORATION_INVALID") ? ["CAF_COLLABORATION_INVALID" as const] : []),
    ...(has(failures, "APPROVAL_COLLABORATION_MISSING") ? ["APPROVAL_COLLABORATION_MISSING" as const] : []),
    ...(!governance.operational ? ["GOVERNANCE_INTEGRATION_MISSING" as const] : []),
    ...(governance.authority_gate_ref.length === 0 ? ["AUTHORITY_GATE_NOT_BOUND" as const] : []),
    ...(governance.policy_gate_ref.length === 0 ? ["POLICY_GATE_NOT_BOUND" as const] : []),
    ...(governance.safety_gate_ref.length === 0 ? ["SAFETY_GATE_NOT_BOUND" as const] : []),
    ...(governance.approval_routing_ref.length === 0 ? ["APPROVAL_ROUTING_MISSING" as const] : []),
    ...(!evidence.operational ? ["EVIDENCE_INTEGRATION_MISSING" as const] : []),
    ...(evidence.workflow_evidence_refs.length === 0 ? ["WORKFLOW_EVIDENCE_MISSING" as const] : []),
    ...(evidence.planning_evidence_index_refs.length === 0 ? ["PLANNING_EVIDENCE_INDEX_MISSING" as const] : []),
    ...(!replay.operational ? ["REPLAY_INTEGRATION_MISSING" as const] : []),
    ...(!replay.consumes_caf_behavioral_replay ? ["BEHAVIORAL_REPLAY_NOT_CONSUMED" as const] : []),
    ...(!observability.operational ? ["OBSERVABILITY_MISSING" as const] : []),
    ...(has(failures, "DIAGNOSTICS_MISSING") ? ["DIAGNOSTICS_MISSING" as const] : []),
    ...(!lifecycle_certification.operational ? ["LIFECYCLE_RECORDS_MISSING" as const] : []),
    ...(qualification.certification_record_refs.length === 0 ? ["CERTIFICATION_RECORDS_MISSING" as const] : []),
    ...(!security.tenant_isolation_validated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!security.operational ? ["SECURITY_BOUNDARIES_INVALID" as const] : []),
    ...(qualification.performance_report_ref.length === 0 ? ["PERFORMANCE_REPORT_MISSING" as const] : []),
    ...(has(failures, "SCALABILITY_INVALID") ? ["SCALABILITY_INVALID" as const] : []),
    ...(qualification.integration_report_ref.length === 0 ? ["INTEGRATION_REPORT_MISSING" as const] : []),
    ...(!qualification.interoperability_verified ? ["INTEROPERABILITY_INVALID" as const] : []),
    ...(qualification.production_readiness_ref.length === 0 ? ["PRODUCTION_READINESS_MISSING" as const] : []),
    ...(!qualification.qualified ? ["QUALIFICATION_FAILED" as const] : []),
    ...(!noOutOfScope ? ["IDENTITY_OWNERSHIP_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.16-APEX-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    foundation_complete: foundation.operational && foundation.application_constitution_ref.length > 0 && foundation.planning_model_ref.length > 0 && foundation.execution_model_ref.length > 0,
    planning_operational: planning_engine.operational,
    workflow_orchestration_operational: workflow_orchestration.operational,
    execution_coordination_operational: execution_coordination.operational,
    dashboards_operational: dashboards.operational,
    collaboration_supported: collaboration.operational,
    governance_integrated: governance.operational && !governance.enforcement_owned && governance.authority_gate_ref.length > 0 && governance.policy_gate_ref.length > 0 && governance.safety_gate_ref.length > 0,
    evidence_complete: qualification.evidence_complete && !evidence.owns_evidence_storage,
    replay_supported: replay.operational && replay.consumes_caf_behavioral_replay && !replay.executes_replay,
    observability_operational: observability.operational,
    lifecycle_certification_supported: lifecycle_certification.operational && qualification.certification_record_refs.length > 0,
    tenant_isolation_validated: security.tenant_isolation_validated,
    performance_scalability_validated: performance.operational && !has(failures, "SCALABILITY_INVALID"),
    integrations_validated: integration_validation.operational && qualification.interoperability_verified,
    production_ready: qualification.production_readiness_ref.length > 0 && qualification.operational_readiness,
    application_qualified: qualification.qualified,
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<ApexResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    aurora_ref: "aurora/v4.15",
    publisher_os_ref: "publisher-os/v4.14",
    pbg_ref: "policy-business-governance/v4.13",
    foundation,
    planning_engine,
    workflow_orchestration,
    execution_coordination,
    dashboards,
    collaboration,
    governance,
    evidence,
    replay,
    observability,
    lifecycle_certification,
    security,
    performance,
    integration_validation,
    qualification,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApex(result?: ApexResult): ApexValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, planning_valid: false, workflow_valid: false, execution_valid: false, dashboards_valid: false, collaboration_valid: false, governance_valid: false, evidence_valid: false, replay_valid: false, observability_valid: false, lifecycle_valid: false, security_valid: false, performance_valid: false, integration_valid: false, qualification_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashedRecord(result.foundation) && result.foundation.operational && result.foundation.application_id.length > 0 && result.foundation.application_constitution_ref.length > 0 && result.foundation.planning_model_ref.length > 0 && result.foundation.execution_model_ref.length > 0;
  const planning_valid = verifyHashedRecord(result.planning_engine) && result.planning_engine.operational;
  const workflow_valid = verifyHashedRecord(result.workflow_orchestration) && result.workflow_orchestration.operational;
  const execution_valid = verifyHashedRecord(result.execution_coordination) && result.execution_coordination.operational;
  const dashboards_valid = verifyHashedRecord(result.dashboards) && result.dashboards.operational;
  const collaboration_valid = verifyHashedRecord(result.collaboration) && result.collaboration.operational;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.operational && result.governance.authority_gate_ref.length > 0 && result.governance.policy_gate_ref.length > 0 && result.governance.safety_gate_ref.length > 0 && !result.governance.enforcement_owned;
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.operational && result.evidence.workflow_evidence_refs.length > 0 && result.evidence.planning_evidence_index_refs.length > 0 && !result.evidence.owns_evidence_storage;
  const replay_valid = verifyHashedRecord(result.replay) && result.replay.operational && result.replay.consumes_caf_behavioral_replay && !result.replay.executes_replay;
  const observability_valid = verifyHashedRecord(result.observability) && result.observability.operational;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle_certification) && result.lifecycle_certification.operational && result.qualification.certification_record_refs.length > 0;
  const security_valid = verifyHashedRecord(result.security) && result.security.operational && result.security.tenant_isolation_validated;
  const performance_valid = verifyHashedRecord(result.performance) && result.performance.operational && result.qualification.performance_report_ref.length > 0;
  const integration_valid = verifyHashedRecord(result.integration_validation) && result.integration_validation.operational && result.qualification.integration_report_ref.length > 0 && result.qualification.interoperability_verified;
  const qualification_valid = verifyHashedRecord(result.qualification) && result.qualification.qualified && result.qualification.production_readiness_ref.length > 0 && result.qualification.evidence_complete && result.qualification.replay_compatible;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && planning_valid && workflow_valid && execution_valid && dashboards_valid && collaboration_valid && governance_valid && evidence_valid && replay_valid && observability_valid && lifecycle_valid && security_valid && performance_valid && integration_valid && qualification_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, foundation_valid, planning_valid, workflow_valid, execution_valid, dashboards_valid, collaboration_valid, governance_valid, evidence_valid, replay_valid, observability_valid, lifecycle_valid, security_valid, performance_valid, integration_valid, qualification_valid, certification_valid, failures: result.certification.failures });
}

export function replayApex(result = runApex()): boolean {
  const replayed = runApex();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApex(result).valid;
}

export function getApexBundle(): ApexBundle {
  const result = runApex();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_planning_workflows: true,
      owns_execution_orchestration: true,
      owns_operational_coordination: true,
      owns_workflow_management: true,
      owns_operational_dashboards: true,
      owns_identity: false,
      owns_governance_engines: false,
      owns_authority_enforcement: false,
      owns_policy_enforcement: false,
      owns_safety_enforcement: false,
      owns_replay_engine: false,
      owns_audit_engine: false,
      owns_evidence_storage: false,
      owns_certification_engine: false,
      owns_messaging_infrastructure: false,
      owns_observability_platform: false,
      owns_registry_infrastructure: false,
    }),
    result,
    validation: validateApex(result),
  });
}

export const ApexService = Object.freeze({ run: runApex, validate: validateApex, replay: replayApex });
