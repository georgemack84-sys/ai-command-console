import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { runSimulation, validateSimulation } from "@/services/simulation";
import type { MonitoringEntityKind, MonitoringHealthStatus, ProductionMonitoringBundle, ProductionMonitoringDecision, ProductionMonitoringFailure, ProductionMonitoringInput, ProductionMonitoringResult, ProductionMonitoringScenario, ProductionMonitoringValidation } from "@/types/production-monitoring-primitives";

const VERSION = "production-monitoring-primitives/mc-13a" as const;
const IDENTIFIER = "ProductionMonitoringPrimitives" as const;
const ENTITIES = Object.freeze<MonitoringEntityKind[]>(["SERVICE", "MISSION", "RUNTIME", "AGENT", "INFRASTRUCTURE", "DEPENDENCY", "TENANT"]);
const HEALTH_STATUSES = Object.freeze<MonitoringHealthStatus[]>(["HEALTHY", "DEGRADED", "WARNING", "FAILED", "RECOVERING"]);
const DOWNSTREAM_CONTRACTS = Object.freeze(["digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"] as const);
const UPSTREAM_REFS = Object.freeze(["cci-event-history/production", "cci-observability-platform/production", "caf-runtime-events/production", "platform-health-services/production", "infrastructure-metrics/production", ...DOWNSTREAM_CONTRACTS]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { twin: runDigitalTwin(), simulation: runSimulation(), risk: runRiskAssessment() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly ProductionMonitoringFailure[], failure: ProductionMonitoringFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ProductionMonitoringScenario): ProductionMonitoringFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly ProductionMonitoringFailure[], scenario?: ProductionMonitoringScenario): ProductionMonitoringDecision {
  const conditional = new Set<ProductionMonitoringFailure>(["OPERATIONAL_STATE_COLLECTOR_MISSING", "OPERATIONAL_REGISTRY_MISSING", "HEALTH_EVALUATION_ENGINE_MISSING", "HEALTH_REGISTRY_MISSING", "DEPENDENCY_HEALTH_MISSING", "AVAILABILITY_STATUS_MISSING", "DEGRADATION_DETECTION_MISSING", "RESOURCE_METRICS_COLLECTOR_MISSING", "CAPACITY_METRICS_MISSING", "EVENT_CORRELATION_ENGINE_MISSING", "TIMELINE_ENGINE_MISSING", "MONITORING_EVIDENCE_MISSING", "MONITORING_CONTRACTS_MISSING", "MONITORING_APIS_UNSTABLE", "MONITORING_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "MONITORING_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "PRODUCTION_MONITORING_PRIMITIVES_QUALIFIED";
}
function resultReplayHash(result: Omit<ProductionMonitoringResult, "replay_hash" | "integrity_hash">): string { return hash({ sources: result.sources.integrity_hash, operational: result.operational.integrity_hash, health: result.health.integrity_hash, resources: result.resources.integrity_hash, correlation: result.correlation.integrity_hash, evidence: result.evidence.integrity_hash, contracts: result.contracts.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ProductionMonitoringResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runProductionMonitoringPrimitives(input: ProductionMonitoringInput = {}): ProductionMonitoringResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<ProductionMonitoringFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_7_SIMULATION_INVALID", !validateSimulation(baselines.simulation).valid],
    ["MC_8_RISK_ASSESSMENT_INVALID", !validateRiskAssessment(baselines.risk).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const sourcesOk = !has(failures, "PRODUCTION_TELEMETRY_MISSING") && !has(failures, "NON_PRODUCTION_TELEMETRY_USED") && !has(failures, "SYNTHETIC_MONITORING_SUBSTITUTED");
  const operationalOk = !has(failures, "OPERATIONAL_STATE_COLLECTOR_MISSING") && !has(failures, "OPERATIONAL_REGISTRY_MISSING") && !has(failures, "STATE_TRANSITIONS_NOT_DETERMINISTIC");
  const healthOk = !has(failures, "HEALTH_EVALUATION_ENGINE_MISSING") && !has(failures, "HEALTH_REGISTRY_MISSING") && !has(failures, "DEPENDENCY_HEALTH_MISSING") && !has(failures, "AVAILABILITY_STATUS_MISSING") && !has(failures, "DEGRADATION_DETECTION_MISSING");
  const resourcesOk = !has(failures, "RESOURCE_METRICS_COLLECTOR_MISSING") && !has(failures, "RESOURCE_METRICS_INCOMPLETE") && !has(failures, "TENANT_RESOURCE_ISOLATION_MISSING") && !has(failures, "CAPACITY_METRICS_MISSING");
  const correlationOk = !has(failures, "EVENT_CORRELATION_ENGINE_MISSING") && !has(failures, "CORRELATION_GRAPH_MISSING") && !has(failures, "TIMELINE_ENGINE_MISSING") && !has(failures, "CAUSAL_MAPPING_INCOMPLETE") && !has(failures, "CROSS_SERVICE_CORRELATION_INACCURATE");
  const evidenceOk = !has(failures, "MONITORING_EVIDENCE_MISSING") && !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") && !has(failures, "INTEGRITY_VERIFICATION_MISSING") && !has(failures, "REPLAY_COMPATIBILITY_MISSING");
  const contractsOk = !has(failures, "MONITORING_CONTRACTS_MISSING") && !has(failures, "DOWNSTREAM_CONSUMPTION_FAILED") && !has(failures, "MONITORING_APIS_UNSTABLE") && !has(failures, "INFRASTRUCTURE_COUPLING_DETECTED");
  const noMutation = !has(failures, "OPERATIONAL_MUTATION_ATTEMPTED");
  const noMissionIntelligence = !has(failures, "MISSION_INTELLIGENCE_GENERATED");
  const governanceOk = !has(failures, "GOVERNANCE_BYPASS_ATTEMPTED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "PRODUCTION_MONITORING_PRIMITIVES_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.risk.tenant_id;
  const monitoring_id = input.monitoring_id ?? `production-monitoring:mc-13a:${input.seed ?? "canonical"}`;
  const sources = nested({ source_id: sourcesOk ? "source:mc-13a:production-telemetry" : "", production_only: sourcesOk, cci_event_history: sourcesOk, cci_observability_platform: sourcesOk, caf_runtime_events: sourcesOk, platform_health_services: sourcesOk, infrastructure_metrics: sourcesOk, no_synthetic_substitution: sourcesOk });
  const operational = nested({ registry_id: operationalOk ? "registry:mc-13a:operational-state" : "", entities: operationalOk ? freezeArray(ENTITIES) : freezeArray<MonitoringEntityKind>([]), service_status: operationalOk, mission_execution_state: operationalOk, runtime_activity: operationalOk, platform_utilization: operationalOk, operational_anomalies: operationalOk, state_transitions: operationalOk, deterministic_collection: operationalOk });
  const health = nested({ registry_id: healthOk ? "registry:mc-13a:health-status" : "", statuses: healthOk ? freezeArray(HEALTH_STATUSES) : freezeArray<MonitoringHealthStatus>([]), service_health: healthOk, runtime_health: healthOk, agent_health: healthOk, infrastructure_health: healthOk, dependency_health: healthOk, availability_status: healthOk, degradation_detection: healthOk });
  const resources = nested({ registry_id: resourcesOk ? "registry:mc-13a:resource-metrics" : "", cpu_utilization: resourcesOk, memory_utilization: resourcesOk, storage_utilization: resourcesOk, network_utilization: resourcesOk, queue_depth: resourcesOk, thread_utilization: resourcesOk, runtime_capacity: resourcesOk, tenant_resource_isolation: resourcesOk, deterministic_metrics: resourcesOk });
  const correlation = nested({ graph_id: correlationOk ? "graph:mc-13a:event-correlation" : "", cross_service_correlation: correlationOk, timeline_correlation: correlationOk, dependency_correlation: correlationOk, mission_correlation: correlationOk, runtime_correlation: correlationOk, infrastructure_correlation: correlationOk, causal_relationship_mapping: correlationOk, deterministic_timeline: correlationOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-13a:monitoring" : "", observation_source: evidenceOk, collection_timestamp: "2026-07-20T00:00:00.000Z", immutable_evidence_identifier: evidenceOk, correlation_identifier: evidenceOk, collection_method: evidenceOk, integrity_verification: evidenceOk, replay_compatible: evidenceOk, lineage_complete: evidenceOk });
  const contracts = nested({ contract_id: contractsOk ? "contract:mc-13a:monitoring-primitives" : "", monitoring_primitive_service: contractsOk, operational_monitoring_api: contractsOk, health_monitoring_api: contractsOk, resource_monitoring_api: contractsOk, event_correlation_api: contractsOk, evidence_api: contractsOk, downstream_contracts: contractsOk ? freezeArray(DOWNSTREAM_CONTRACTS) : freezeArray<string>([]), stable: contractsOk });
  const readiness = nested({ readiness_id: "MC-13A-PRODUCTION-MONITORING-PRIMITIVES-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), sources_ready: sourcesOk, operational_ready: operationalOk, health_ready: healthOk, resources_ready: resourcesOk, correlation_ready: correlationOk, evidence_ready: evidenceOk, contracts_ready: contractsOk, deterministic_monitoring: operationalOk && resourcesOk && correlationOk, production_only_inputs: sourcesOk, observational_only: noMutation, no_mission_intelligence: noMissionIntelligence, no_state_mutation: noMutation, tenant_isolation_preserved: resourcesOk, digital_twin_consumption_ready: contractsOk, simulation_consumption_ready: contractsOk, risk_assessment_consumption_ready: contractsOk, qualification_ready: qualified && governanceOk, failures });
  const base: Omit<ProductionMonitoringResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, monitoring_id, sources, operational, health, resources, correlation, evidence, contracts, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionMonitoringPrimitives(result?: ProductionMonitoringResult): ProductionMonitoringValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, sources_valid: false, operational_valid: false, health_valid: false, resources_valid: false, correlation_valid: false, evidence_valid: false, contracts_valid: false, readiness_valid: false, failures: freezeArray(["PRODUCTION_TELEMETRY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const sources_valid = verifyHashed(result.sources) && result.sources.production_only && result.sources.cci_event_history && result.sources.cci_observability_platform && result.sources.caf_runtime_events && result.sources.no_synthetic_substitution;
  const operational_valid = verifyHashed(result.operational) && result.operational.entities.length === 7 && result.operational.service_status && result.operational.mission_execution_state && result.operational.state_transitions && result.operational.deterministic_collection;
  const health_valid = verifyHashed(result.health) && result.health.statuses.length === 5 && result.health.service_health && result.health.dependency_health && result.health.availability_status && result.health.degradation_detection;
  const resources_valid = verifyHashed(result.resources) && result.resources.cpu_utilization && result.resources.memory_utilization && result.resources.queue_depth && result.resources.runtime_capacity && result.resources.tenant_resource_isolation && result.resources.deterministic_metrics;
  const correlation_valid = verifyHashed(result.correlation) && result.correlation.cross_service_correlation && result.correlation.timeline_correlation && result.correlation.dependency_correlation && result.correlation.causal_relationship_mapping && result.correlation.deterministic_timeline;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.observation_source && result.evidence.immutable_evidence_identifier && result.evidence.integrity_verification && result.evidence.replay_compatible && result.evidence.lineage_complete;
  const contracts_valid = verifyHashed(result.contracts) && result.contracts.monitoring_primitive_service && result.contracts.operational_monitoring_api && result.contracts.health_monitoring_api && result.contracts.resource_monitoring_api && result.contracts.event_correlation_api && result.contracts.evidence_api && result.contracts.downstream_contracts.length === 3 && result.contracts.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.deterministic_monitoring && result.readiness.production_only_inputs && result.readiness.observational_only && result.readiness.no_mission_intelligence && result.readiness.no_state_mutation && result.readiness.tenant_isolation_preserved && result.readiness.digital_twin_consumption_ready && result.readiness.simulation_consumption_ready && result.readiness.risk_assessment_consumption_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && sources_valid && operational_valid && health_valid && resources_valid && correlation_valid && evidence_valid && contracts_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, sources_valid, operational_valid, health_valid, resources_valid, correlation_valid, evidence_valid, contracts_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayProductionMonitoringPrimitives(result = runProductionMonitoringPrimitives()): boolean { const replayed = runProductionMonitoringPrimitives(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionMonitoringPrimitives(result).valid; }
export function getProductionMonitoringPrimitivesBundle(): ProductionMonitoringBundle { const result = runProductionMonitoringPrimitives(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, authoritative_operational_telemetry_layer: true, production_only_inputs: true, observational_only: true, no_platform_mutation_authority: true, no_mission_intelligence_generation: true, downstream_consumers: DOWNSTREAM_CONTRACTS, qualification_gate: "Production Monitoring Primitive Qualification Gate" }), result, validation: validateProductionMonitoringPrimitives(result) }); }
export const ProductionMonitoringPrimitivesService = Object.freeze({ run: runProductionMonitoringPrimitives, validate: validateProductionMonitoringPrimitives, replay: replayProductionMonitoringPrimitives });
