import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runSecurityCore, validateSecurityCore } from "@/services/security-core";
import { runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import { runCafLegionRuntime, validateCafLegionRuntime } from "@/services/caf-legion-runtime";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runCertificationEngine, validateCertificationEngine } from "@/services/certification-engine";
import { runOperatorConsole, validateOperatorConsole } from "@/services/operator-console";
import type { MissionLifecycleState, MissionLineageStatus, MissionManagementBundle, MissionManagementDecision, MissionManagementFailure, MissionManagementInput, MissionManagementResult, MissionManagementScenario, MissionManagementValidation, MissionProjectionPhase } from "@/types/mission-management";

const VERSION = "mission-management/mc-1" as const;
const IDENTIFIER = "MissionManagement" as const;
const LIFECYCLE_STATES = Object.freeze<MissionLifecycleState[]>(["DRAFT", "REGISTERED", "DEFINED", "VALIDATING", "APPROVED", "SCHEDULED", "READY", "ACTIVE", "PAUSED", "BLOCKED", "DEGRADED", "RECOVERING", "COMPLETING", "COMPLETED", "CANCELLED", "RETIRED"]);
const PROJECTION_PHASES = Object.freeze<MissionProjectionPhase[]>(["Definition", "Validation", "Planning", "Readiness", "Execution", "Intervention", "Completion", "Closure"]);
const LINEAGE_STATUSES = Object.freeze<MissionLineageStatus[]>(["ROOT", "DERIVED", "BRANCHED", "SUPERSEDED", "RETIRED", "HISTORICAL"]);
const UPSTREAM_REFS = Object.freeze(["identity-core/w1.1a", "registry-core/w1.4a", "configuration-platform/w1.5", "security-core/w1.7a", "observability-platform/w1.6", "caf-legion-runtime/w1.8", "lifecycle-engine/w2.2", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "runtime-orchestrator/w2.10", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15", "operator-console/w2.16"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { identity: runIdentityCore(), registry: runRegistryCore(), configuration: runConfigurationPlatform(), security: runSecurityCore(), observability: runObservabilityPlatform(), cafRuntime: runCafLegionRuntime(), lifecycle: runLifecycleEngine(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), runtime: runRuntimeOrchestrator(), evidence: runEvidenceEngine(), replay: runReplayEngine(), certification: runCertificationEngine(), operatorConsole: runOperatorConsole() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly MissionManagementFailure[], failure: MissionManagementFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: MissionManagementScenario): MissionManagementFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly MissionManagementFailure[], scenario: MissionManagementScenario): MissionManagementDecision {
  const conditional = new Set<MissionManagementFailure>(["MISSION_REGISTRY_MISSING", "MISSION_LIFECYCLE_MISSING", "MISSION_TEMPLATES_MISSING", "MISSION_OBJECTIVES_MISSING", "MISSION_ASSIGNMENT_MISSING", "MISSION_DEPENDENCIES_MISSING", "MISSION_TIMELINE_MISSING", "MISSION_EVIDENCE_MISSING", "MISSION_RULES_MISSING", "MISSION_LINEAGE_MISSING", "MISSION_PROJECTION_MISSING", "MISSION_APIS_MISSING", "MISSION_OBSERVABILITY_MISSING", "MISSION_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "MISSION_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "MISSION_MANAGEMENT_QUALIFIED";
}
function resultReplayHash(result: Omit<MissionManagementResult, "replay_hash" | "integrity_hash">): string { return hash({ registry: result.registry.integrity_hash, lifecycle: result.lifecycle.integrity_hash, projection: result.projection.integrity_hash, lineage: result.lineage.integrity_hash, templates: result.templates.integrity_hash, objectives: result.objectives.integrity_hash, assignment: result.assignment.integrity_hash, dependencies: result.dependencies.integrity_hash, timeline: result.timeline.integrity_hash, evidence: result.evidence.integrity_hash, rules: result.rules.integrity_hash, apis: result.apis.integrity_hash, observability: result.observability.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<MissionManagementResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runMissionManagement(input: MissionManagementInput = {}): MissionManagementResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<MissionManagementFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["W1_IDENTITY_INVALID", !validateIdentityCore(baselines.identity).valid],
    ["W1_REGISTRY_INVALID", !validateRegistryCore(baselines.registry).valid],
    ["W1_CONFIGURATION_INVALID", !validateConfigurationPlatform(baselines.configuration).valid],
    ["W1_SECURITY_INVALID", !validateSecurityCore(baselines.security).valid],
    ["W1_OBSERVABILITY_INVALID", !validateObservabilityPlatform(baselines.observability).valid],
    ["W1_CAF_RUNTIME_INVALID", !validateCafLegionRuntime(baselines.cafRuntime).valid],
    ["W2_LIFECYCLE_INVALID", !validateLifecycleEngine(baselines.lifecycle).valid],
    ["W2_AUTHORITY_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_POLICY_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_SAFETY_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_PLANNING_INVALID", !validatePlanningEngine(baselines.planning).valid],
    ["W2_MEMORY_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["W2_RUNTIME_INVALID", !validateRuntimeOrchestrator(baselines.runtime).valid],
    ["W2_EVIDENCE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_REPLAY_INVALID", !validateReplayEngine(baselines.replay).valid],
    ["W2_CERTIFICATION_INVALID", !validateCertificationEngine(baselines.certification).valid],
    ["W2_OPERATOR_CONSOLE_INVALID", !validateOperatorConsole(baselines.operatorConsole).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const registryOk = !has(failures, "MISSION_REGISTRY_MISSING") && !has(failures, "MISSION_REGISTRY_TENANT_ISOLATION_FAILED") && !has(failures, "MISSION_IDENTIFIERS_MUTABLE");
  const lifecycleOk = !has(failures, "MISSION_LIFECYCLE_MISSING") && !has(failures, "MISSION_LIFECYCLE_STATE_COUNT_INVALID") && !has(failures, "MISSION_LIFECYCLE_ALTERNATE_TERMINOLOGY") && !has(failures, "MISSION_TRANSITION_NON_DETERMINISTIC") && !has(failures, "MISSION_TRANSITION_GOVERNANCE_BYPASSED");
  const projectionOk = !has(failures, "MISSION_PROJECTION_MISSING") && !has(failures, "MISSION_PROJECTION_PHASE_COUNT_INVALID");
  const lineageOk = !has(failures, "MISSION_LINEAGE_MISSING") && !has(failures, "MISSION_LINEAGE_MUTABLE");
  const templatesOk = !has(failures, "MISSION_TEMPLATES_MISSING") && !has(failures, "MISSION_TEMPLATE_GOVERNANCE_MISSING");
  const objectivesOk = !has(failures, "MISSION_OBJECTIVES_MISSING") && !has(failures, "MISSION_OBJECTIVE_EVIDENCE_MISSING");
  const assignmentOk = !has(failures, "MISSION_ASSIGNMENT_MISSING") && !has(failures, "MISSION_ASSIGNMENT_QUALIFICATION_BYPASSED");
  const dependenciesOk = !has(failures, "MISSION_DEPENDENCIES_MISSING") && !has(failures, "MISSION_DEPENDENCY_CYCLE_UNDETECTED");
  const timelineOk = !has(failures, "MISSION_TIMELINE_MISSING") && !has(failures, "MISSION_TIMELINE_REPLAY_INVALID");
  const evidenceOk = !has(failures, "MISSION_EVIDENCE_MISSING") && !has(failures, "MISSION_EVIDENCE_NOT_IMMUTABLE");
  const rulesOk = !has(failures, "MISSION_RULES_MISSING") && !has(failures, "MISSION_RULES_BYPASSED");
  const apisOk = !has(failures, "MISSION_APIS_MISSING") && !has(failures, "MISSION_QUERY_NON_DETERMINISTIC");
  const observabilityOk = !has(failures, "MISSION_OBSERVABILITY_MISSING");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "MISSION_MANAGEMENT_QUALIFIED";
  const mission_id = input.mission_id ?? `mission:mc-1:${input.seed ?? "canonical"}`;
  const tenant_id = input.tenant_id ?? "tenant:qualified:primary";
  const registry = nested({ registry_id: registryOk ? "registry:mc-1:missions" : "", mission_registration: registryOk, mission_discovery: registryOk, mission_lookup: registryOk, mission_ownership: registryOk, version_history: registryOk, metadata: registryOk, tenant_isolation: registryOk, namespace_support: registryOk, immutable_identifiers: registryOk, mission_catalog: registryOk, registry_queries: registryOk });
  const lifecycle = nested({ engine_id: lifecycleOk ? "engine:mc-1:mission-lifecycle" : "", states: lifecycleOk ? freezeArray(LIFECYCLE_STATES) : freezeArray<MissionLifecycleState>([]), transition_validation: lifecycleOk, constitutional_enforcement: lifecycleOk, authority_verification: lifecycleOk, policy_verification: lifecycleOk, safety_verification: lifecycleOk, operator_approval: lifecycleOk, transition_evidence: lifecycleOk, replay_compatibility: lifecycleOk, deterministic_transitions: lifecycleOk, fail_closed_validation: lifecycleOk, immutable_transition_history: lifecycleOk });
  const projection = nested({ projection_id: projectionOk ? "projection:mc-1:mission-8-phase" : "", phases: projectionOk ? freezeArray(PROJECTION_PHASES) : freezeArray<MissionProjectionPhase>([]), derived_from_lifecycle_only: projectionOk, dashboard_projection: projectionOk, operational_views: projectionOk, planning_projection: projectionOk, reporting_projection: projectionOk, lifecycle_authoritative: projectionOk, no_alternate_model: projectionOk });
  const lineage = nested({ lineage_id: lineageOk ? "lineage:mc-1:mission" : "", statuses: lineageOk ? freezeArray(LINEAGE_STATUSES) : freezeArray<MissionLineageStatus>([]), ancestry: lineageOk, derivation: lineageOk, branching: lineageOk, supersession: lineageOk, retirement: lineageOk, historical_lineage: lineageOk, immutable_lineage: lineageOk, no_alternate_lineage: lineageOk });
  const templates = nested({ template_registry_id: templatesOk ? "registry:mc-1:mission-templates" : "", standard_definitions: templatesOk, parameterized_templates: templatesOk, template_inheritance: templatesOk, version_management: templatesOk, template_approval: templatesOk, template_governance: templatesOk, template_library: templatesOk, template_validator: templatesOk });
  const objectives = nested({ objective_registry_id: objectivesOk ? "registry:mc-1:objectives" : "", objective_definition: objectivesOk, objective_hierarchy: objectivesOk, success_criteria: objectivesOk, completion_criteria: objectivesOk, priority: objectivesOk, objective_dependencies: objectivesOk, objective_evidence: objectivesOk, objective_graph: objectivesOk, objective_validation: objectivesOk });
  const assignment = nested({ assignment_service_id: assignmentOk ? "service:mc-1:assignment" : "", operators: assignmentOk, teams: assignmentOk, caf_agents: assignmentOk, capabilities: assignmentOk, resources: assignmentOk, organizations: assignmentOk, authority_validation: assignmentOk, policy_validation: assignmentOk, availability_validation: assignmentOk, qualification_validation: assignmentOk, assignment_records: assignmentOk, assignment_history: assignmentOk });
  const dependencies = nested({ dependency_service_id: dependenciesOk ? "service:mc-1:dependencies" : "", predecessor_missions: dependenciesOk, successor_missions: dependenciesOk, blocking_missions: dependenciesOk, prerequisite_validation: dependenciesOk, dependency_graph: dependenciesOk, cycle_detection: dependenciesOk, dependency_evidence: dependenciesOk, dependency_reports: dependenciesOk });
  const timeline = nested({ timeline_service_id: timelineOk ? "service:mc-1:timeline" : "", scheduling: timelineOk, milestones: timelineOk, checkpoints: timelineOk, projected_timeline: timelineOk, historical_timeline: timelineOk, timeline_replay: timelineOk, execution_history: timelineOk, timeline_graph: timelineOk, timeline_records: timelineOk });
  const evidence = nested({ integration_id: evidenceOk ? "integration:mc-1:evidence" : "", lifecycle_events: evidenceOk, approvals: evidenceOk, assignments: evidenceOk, objective_completion: evidenceOk, dependency_validation: evidenceOk, constitutional_decisions: evidenceOk, operator_actions: evidenceOk, replay_references: evidenceOk, immutable_event_evidence: evidenceOk, evidence_packages: evidenceOk });
  const rules = nested({ rules_id: rulesOk ? "rules:mc-1:constitutional-mission" : "", lifecycle_validation: rulesOk, transition_legality: rulesOk, authority_validation: rulesOk, policy_validation: rulesOk, safety_validation: rulesOk, operator_supremacy: rulesOk, tenant_isolation: rulesOk, governance_compliance: rulesOk, bypass_prevention: rulesOk });
  const apis = nested({ api_id: apisOk ? "api:mc-1:mission-management" : "", mission_api: apisOk, registry_api: apisOk, timeline_api: apisOk, assignment_api: apisOk, objective_api: apisOk, template_api: apisOk, dependency_api: apisOk, lifecycle_api: apisOk, query_api: apisOk, deterministic_queries: apisOk, stable: apisOk });
  const observability = nested({ observability_id: observabilityOk ? "observability:mc-1:missions" : "", lifecycle_metrics: observabilityOk, assignment_metrics: observabilityOk, objective_metrics: observabilityOk, dependency_metrics: observabilityOk, timeline_metrics: observabilityOk, transition_latency: observabilityOk, constitutional_violations: observabilityOk, audit_metrics: observabilityOk, health_metrics: observabilityOk });
  const readiness = nested({ readiness_id: "MC-1-MISSION-MANAGEMENT-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("W1_") && !failure.startsWith("W2_")), registry_ready: registryOk, lifecycle_ready: lifecycleOk, projection_ready: projectionOk, lineage_ready: lineageOk, templates_ready: templatesOk, objectives_ready: objectivesOk, assignment_ready: assignmentOk, dependencies_ready: dependenciesOk, timeline_ready: timelineOk, evidence_ready: evidenceOk, rules_ready: rulesOk, apis_ready: apisOk, observability_ready: observabilityOk, qualification_ready: qualified, failures });
  const base: Omit<MissionManagementResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), mission_id, tenant_id, registry, lifecycle, projection, lineage, templates, objectives, assignment, dependencies, timeline, evidence, rules, apis, observability, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMissionManagement(result?: MissionManagementResult): MissionManagementValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, lifecycle_valid: false, projection_valid: false, lineage_valid: false, templates_valid: false, objectives_valid: false, assignment_valid: false, dependencies_valid: false, timeline_valid: false, evidence_valid: false, rules_valid: false, apis_valid: false, observability_valid: false, readiness_valid: false, failures: freezeArray(["MISSION_REGISTRY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const registry_valid = verifyHashed(result.registry) && result.registry.tenant_isolation && result.registry.immutable_identifiers && result.registry.registry_queries;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === 16 && result.lifecycle.deterministic_transitions && result.lifecycle.fail_closed_validation && result.lifecycle.immutable_transition_history;
  const projection_valid = verifyHashed(result.projection) && result.projection.phases.length === 8 && result.projection.derived_from_lifecycle_only && result.projection.lifecycle_authoritative && result.projection.no_alternate_model;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.statuses.length === 6 && result.lineage.immutable_lineage && result.lineage.no_alternate_lineage;
  const templates_valid = verifyHashed(result.templates) && result.templates.version_management && result.templates.template_approval && result.templates.template_governance;
  const objectives_valid = verifyHashed(result.objectives) && result.objectives.objective_graph && result.objectives.objective_validation && result.objectives.objective_evidence;
  const assignment_valid = verifyHashed(result.assignment) && result.assignment.authority_validation && result.assignment.policy_validation && result.assignment.qualification_validation && result.assignment.assignment_history;
  const dependencies_valid = verifyHashed(result.dependencies) && result.dependencies.prerequisite_validation && result.dependencies.cycle_detection && result.dependencies.dependency_evidence;
  const timeline_valid = verifyHashed(result.timeline) && result.timeline.timeline_replay && result.timeline.execution_history && result.timeline.timeline_records;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.lifecycle_events && result.evidence.immutable_event_evidence && result.evidence.replay_references;
  const rules_valid = verifyHashed(result.rules) && result.rules.lifecycle_validation && result.rules.transition_legality && result.rules.authority_validation && result.rules.policy_validation && result.rules.safety_validation && result.rules.operator_supremacy && result.rules.bypass_prevention;
  const apis_valid = verifyHashed(result.apis) && result.apis.mission_api && result.apis.lifecycle_api && result.apis.query_api && result.apis.deterministic_queries && result.apis.stable;
  const observability_valid = verifyHashed(result.observability) && result.observability.lifecycle_metrics && result.observability.transition_latency && result.observability.constitutional_violations && result.observability.health_metrics;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.qualification_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && registry_valid && lifecycle_valid && projection_valid && lineage_valid && templates_valid && objectives_valid && assignment_valid && dependencies_valid && timeline_valid && evidence_valid && rules_valid && apis_valid && observability_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, registry_valid, lifecycle_valid, projection_valid, lineage_valid, templates_valid, objectives_valid, assignment_valid, dependencies_valid, timeline_valid, evidence_valid, rules_valid, apis_valid, observability_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayMissionManagement(result = runMissionManagement()): boolean { const replayed = runMissionManagement(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMissionManagement(result).valid; }
export function getMissionManagementBundle(): MissionManagementBundle { const result = runMissionManagement(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_canonical_mission_model: true, owns_mission_registry: true, owns_mission_lifecycle: true, owns_mission_templates: true, owns_mission_objectives: true, owns_mission_assignment: true, owns_mission_dependencies: true, owns_mission_timeline: true, owns_mission_evidence_integration: true, no_additional_lifecycle_states: true, no_alternate_lifecycle_models: true, qualification_gate: "Mission Management Qualification Gate" }), result, validation: validateMissionManagement(result) }); }
export const MissionManagementService = Object.freeze({ run: runMissionManagement, validate: validateMissionManagement, replay: replayMissionManagement });
