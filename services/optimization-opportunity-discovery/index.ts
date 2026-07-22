import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getCoordinationAssuranceCertificationGate } from "@/services/coordination-assurance-certification-gate";
import { getMissionHealthCertificationGateContract } from "@/services/mission-health-certification-gate";
import { getPredictionCertificationGateContract } from "@/services/prediction-certification-gate";
import type {
  DiscoveryEvidenceRecord,
  OpportunityLifecycleState,
  OptimizationDiscoveryFailure,
  OptimizationDiscoveryInput,
  OptimizationDiscoveryObservabilitySurface,
  OptimizationDiscoveryScenario,
  OptimizationDiscoveryValidationResult,
  OptimizationOpportunityDiscoveryBundle,
  OptimizationOpportunityRecord,
  OptimizationOpportunityRegistry,
  PerformanceBaselineRecord,
} from "@/types/optimization-opportunity-discovery";

const VERSION = "optimization-opportunity-discovery/v8ALT.8.1" as const;
const NOW = "2026-07-15T04:00:00.000Z";
const lifecycle = Object.freeze(["OBSERVED", "IDENTIFIED", "CLASSIFIED", "BASELINED", "EVIDENCE_COLLECTED", "READY_FOR_ANALYSIS"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: OptimizationDiscoveryScenario): OptimizationDiscoveryFailure | null {
  const map: Partial<Record<OptimizationDiscoveryScenario, OptimizationDiscoveryFailure>> = {
    METRIC_DRIFT: "METRIC_DRIFT_DETECTED",
    REPLAY_MISMATCH: "REPLAY_FIDELITY_LOST",
    GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_BOUNDARY_VIOLATION: "AUTHORITY_BOUNDARY_VIOLATED",
    TENANT_LEAKAGE_ATTEMPT: "TENANT_ISOLATION_BROKEN",
    HIDDEN_EVIDENCE: "OPTIMIZATION_EVIDENCE_HIDDEN",
    MUTABLE_RECORD_ATTEMPT: "IMMUTABILITY_VIOLATED",
    AUTOMATIC_OPTIMIZATION_ATTEMPT: "AUTOMATIC_OPTIMIZATION_ATTEMPTED",
    LIFECYCLE_SKIP: "LIFECYCLE_ORDER_INVALID",
    INCOMPLETE_BASELINE: "BASELINE_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function buildBaselines(scenario: OptimizationDiscoveryScenario): readonly PerformanceBaselineRecord[] {
  if (scenario === "INCOMPLETE_BASELINE") return freezeArray([]);
  const metrics = [
    ["planning-engine", "planning_latency_ms", 240, 255, 12],
    ["execution-orchestration", "queue_depth", 7, 9, 2],
    ["replay-engine", "replay_reconstruction_ms", 410, 430, 18],
    ["coordination-intelligence", "delegation_route_ms", 95, 110, 9],
  ] as const;
  return freezeArray(metrics.map(([subsystem, metric_name, metric_value, historical_average, variance]) => {
    const base = { baseline_id: id("OODB", "optimization-baseline", { subsystem, metric_name }), subsystem, metric_name, metric_value, confidence_score: 0.96, historical_average, variance, replay_reference: `replay:${subsystem}:${metric_name}`, immutable: scenario !== "MUTABLE_RECORD_ATTEMPT", timestamp: NOW };
    return Object.freeze({ ...base, integrity_hash: hashValue("optimization-baseline", base) });
  }));
}

function buildOpportunity(baseline: PerformanceBaselineRecord, index: number, scenario: OptimizationDiscoveryScenario): OptimizationOpportunityRecord {
  const category = index === 0 ? "PLANNING" as const : index === 1 ? "ORCHESTRATION" as const : index === 2 ? "REPLAY" as const : "DELEGATION" as const;
  const type = index === 0 ? "LATENCY_OPTIMIZATION" as const : index === 1 ? "SCHEDULING_OPTIMIZATION" as const : index === 2 ? "REPLAY_OPTIMIZATION" as const : "ROUTING_OPTIMIZATION" as const;
  const history: readonly OpportunityLifecycleState[] = scenario === "LIFECYCLE_SKIP" && index === 0 ? freezeArray(["OBSERVED", "CLASSIFIED", "READY_FOR_ANALYSIS"]) : lifecycle;
  const currentMetric = scenario === "METRIC_DRIFT" && index === 0 ? baseline.metric_value * 1.45 : baseline.metric_value * 1.18;
  const projectedMetric = Number((baseline.metric_value * 0.91).toFixed(2));
  const base = {
    opportunity_id: id("OOD", "optimization-opportunity", { baseline: baseline.baseline_id, scenario, index }),
    mission_id: "mission:controlled-autonomy:8alt",
    execution_id: "execution:discovery:8alt-8-1",
    tenant_id: scenario === "TENANT_LEAKAGE_ATTEMPT" && index === 0 ? "tenant:foreign" : "tenant:alpha",
    subsystem: baseline.subsystem,
    optimization_category: category,
    opportunity_type: type,
    lifecycle_state: history[history.length - 1] ?? "OBSERVED",
    lifecycle_history: history,
    description: `Observed deterministic ${baseline.metric_name} optimization opportunity in ${baseline.subsystem}.`,
    current_metric: Number(currentMetric.toFixed(2)),
    baseline_metric: baseline.metric_value,
    projected_metric: projectedMetric,
    projected_improvement: Number((currentMetric - projectedMetric).toFixed(2)),
    confidence_score: scenario === "METRIC_DRIFT" ? 0.91 : 0.97,
    evidence_reference: scenario === "HIDDEN_EVIDENCE" && index === 0 ? "" : `evidence:${baseline.baseline_id}`,
    replay_reference: scenario === "REPLAY_MISMATCH" && index === 0 ? "replay:mismatch" : baseline.replay_reference,
    governance_reference: "governance:optimization-discovery:read-only",
    constitutional_reference: "constitutional:optimization-discovery:advisory-only",
    authority_validation: scenario === "AUTHORITY_BOUNDARY_VIOLATION" && index === 0 ? "VIOLATED" as const : "PRESERVED" as const,
    advisory_only: true as const,
    execution_authority: false as const,
    automatic_optimization: scenario === "AUTOMATIC_OPTIMIZATION_ATTEMPT" && index === 0,
    mission_outcome_preserved: scenario !== "AUTOMATIC_OPTIMIZATION_ATTEMPT",
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-opportunity", base) });
}

function buildEvidence(opportunities: readonly OptimizationOpportunityRecord[], scenario: OptimizationDiscoveryScenario): readonly DiscoveryEvidenceRecord[] {
  if (scenario === "HIDDEN_EVIDENCE") return freezeArray(opportunities.slice(1).map((opportunity, index) => evidenceRecord(opportunity, index, scenario)));
  return freezeArray(opportunities.map((opportunity, index) => evidenceRecord(opportunity, index, scenario)));
}

function evidenceRecord(opportunity: OptimizationOpportunityRecord, index: number, scenario: OptimizationDiscoveryScenario): DiscoveryEvidenceRecord {
  const base = {
    evidence_id: id("OODE", "optimization-evidence", { opportunity: opportunity.opportunity_id, index }),
    opportunity_id: opportunity.opportunity_id,
    evidence_type: index === 0 ? "PERFORMANCE_METRIC" as const : index === 1 ? "RESOURCE_PROFILE" as const : index === 2 ? "REPLAY_COMPARISON" as const : "HISTORICAL_TREND" as const,
    subsystem: opportunity.subsystem,
    observed_metric: opportunity.current_metric,
    baseline_metric: opportunity.baseline_metric,
    replay_reference: opportunity.replay_reference,
    historical_reference: `history:${opportunity.subsystem}`,
    confidence_score: opportunity.confidence_score,
    governance_validation: scenario === "GOVERNANCE_VALIDATION_FAILURE" && index === 0 ? "FAIL" as const : "PASS" as const,
    constitutional_validation: scenario === "CONSTITUTIONAL_VALIDATION_FAILURE" && index === 0 ? "FAIL" as const : "PASS" as const,
    authority_validation: opportunity.authority_validation === "VIOLATED" ? "FAIL" as const : "PASS" as const,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-evidence", base) });
}

function discoverFailures(registry: Omit<OptimizationOpportunityRegistry, "integrity_hash"> | OptimizationOpportunityRegistry): readonly OptimizationDiscoveryFailure[] {
  const expectedLifecycle = lifecycle.join("|");
  return unique([
    ...registry.failures,
    ...(registry.baselines.length === 0 ? ["BASELINE_INCOMPLETE" as const] : []),
    ...(registry.baselines.some((baseline) => !baseline.immutable) ? ["IMMUTABILITY_VIOLATED" as const] : []),
    ...(registry.opportunities.some((opportunity) => opportunity.lifecycle_history.join("|") !== expectedLifecycle || opportunity.lifecycle_state !== "READY_FOR_ANALYSIS") ? ["LIFECYCLE_ORDER_INVALID" as const] : []),
    ...(registry.opportunities.some((opportunity) => !opportunity.evidence_reference) ? ["OPTIMIZATION_EVIDENCE_HIDDEN" as const] : []),
    ...(registry.opportunities.some((opportunity) => opportunity.replay_reference.includes("mismatch")) ? ["REPLAY_FIDELITY_LOST" as const] : []),
    ...(registry.opportunities.some((opportunity) => opportunity.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_BROKEN" as const] : []),
    ...(registry.opportunities.some((opportunity) => opportunity.authority_validation !== "PRESERVED") ? ["AUTHORITY_BOUNDARY_VIOLATED" as const] : []),
    ...(registry.opportunities.some((opportunity) => opportunity.automatic_optimization || opportunity.execution_authority) ? ["AUTOMATIC_OPTIMIZATION_ATTEMPTED" as const] : []),
    ...(registry.opportunities.some((opportunity) => !opportunity.mission_outcome_preserved) ? ["AUTOMATIC_OPTIMIZATION_ATTEMPTED" as const] : []),
    ...(registry.evidence.some((evidence) => evidence.governance_validation === "FAIL") ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(registry.evidence.some((evidence) => evidence.constitutional_validation === "FAIL") ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(registry.evidence.some((evidence) => evidence.authority_validation === "FAIL") ? ["AUTHORITY_BOUNDARY_VIOLATED" as const] : []),
    ...(registry.evidence.length < registry.opportunities.length ? ["OPTIMIZATION_EVIDENCE_HIDDEN" as const] : []),
  ]);
}

export function discoverOptimizationOpportunities(input: OptimizationDiscoveryInput = {}): OptimizationOpportunityRegistry {
  if (input.registry) return input.registry;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const coordination = getCoordinationAssuranceCertificationGate();
  const missionHealth = getMissionHealthCertificationGateContract();
  const prediction = getPredictionCertificationGateContract();
  const baselines = buildBaselines(scenario);
  const opportunities = freezeArray(baselines.map((baseline, index) => buildOpportunity(baseline, index, scenario)));
  const evidence = buildEvidence(opportunities, scenario);
  const baseFailures = unique([
    ...(injected ? [injected] : []),
    ...(!coordination.validation.valid ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!missionHealth.validation.valid ? ["METRIC_DRIFT_DETECTED" as const] : []),
    ...(!prediction.validation.valid ? ["REPLAY_FIDELITY_LOST" as const] : []),
  ]);
  const source = {
    registry_id: id("OODR", "optimization-discovery-registry", { scenario }),
    final_state: baseFailures.length ? "OPTIMIZATION_DISCOVERY_BLOCKED" as const : "OPTIMIZATION_OPPORTUNITIES_DISCOVERED" as const,
    opportunities,
    baselines,
    evidence,
    failures: baseFailures,
    advisory_only: true as const,
    execution_authority: false as const,
    automatic_optimization: false as const,
  };
  const failures = discoverFailures(source);
  const registry = { ...source, failures, final_state: failures.length ? "OPTIMIZATION_DISCOVERY_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...registry, integrity_hash: scenario === "MUTABLE_RECORD_ATTEMPT" ? "" : hashValue("optimization-discovery-registry", registry) });
}

export function listPerformanceBaselines(input: OptimizationDiscoveryInput = {}) { return discoverOptimizationOpportunities(input).baselines; }
export function listDiscoveryEvidence(input: OptimizationDiscoveryInput = {}) { return discoverOptimizationOpportunities(input).evidence; }

export function validateOptimizationDiscovery(registry = discoverOptimizationOpportunities()): OptimizationDiscoveryValidationResult {
  const failures = unique([
    ...discoverFailures(registry),
    ...(!registry.integrity_hash ? ["IMMUTABILITY_VIOLATED" as const] : []),
  ]);
  const has = (failure: OptimizationDiscoveryFailure) => failures.includes(failure);
  const valid = failures.length === 0 && registry.final_state === "OPTIMIZATION_OPPORTUNITIES_DISCOVERED" && registry.advisory_only && !registry.execution_authority && !registry.automatic_optimization;
  const source = {
    registry_id: registry.registry_id,
    valid,
    deterministic_discovery: true,
    lifecycle_order_valid: !has("LIFECYCLE_ORDER_INVALID"),
    baselines_reproducible: !has("BASELINE_INCOMPLETE"),
    evidence_complete: !has("OPTIMIZATION_EVIDENCE_HIDDEN"),
    replay_fidelity_preserved: !has("REPLAY_FIDELITY_LOST"),
    governance_compliant: !has("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_compliant: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_boundaries_preserved: !has("AUTHORITY_BOUNDARY_VIOLATED"),
    tenant_isolated: !has("TENANT_ISOLATION_BROKEN"),
    immutable_records: !has("IMMUTABILITY_VIOLATED"),
    mission_outcomes_preserved: !has("AUTOMATIC_OPTIMIZATION_ATTEMPTED"),
    advisory_only: true as const,
    execution_authority_absent: !registry.execution_authority && registry.opportunities.every((opportunity) => !opportunity.execution_authority),
    automatic_optimization_absent: !registry.automatic_optimization && registry.opportunities.every((opportunity) => !opportunity.automatic_optimization),
    hidden_evidence_absent: !has("OPTIMIZATION_EVIDENCE_HIDDEN"),
    ready_for_impact_analysis: valid,
    fail_closed: valid || failures.length > 0 || registry.final_state !== "OPTIMIZATION_OPPORTUNITIES_DISCOVERED",
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("optimization-discovery-validation", source) });
}

export function buildOptimizationDiscoveryObservabilitySurface(registry = discoverOptimizationOpportunities()): OptimizationDiscoveryObservabilitySurface {
  return Object.freeze({
    registry_id: registry.registry_id,
    final_state: registry.final_state,
    opportunity_count: registry.opportunities.length,
    baseline_count: registry.baselines.length,
    evidence_count: registry.evidence.length,
    failure_count: registry.failures.length,
    advisory_only: true,
    execution_authority: false,
    integrity_hash: registry.integrity_hash,
  });
}

export function getOptimizationOpportunityDiscovery(): OptimizationOpportunityDiscoveryBundle {
  const registry = discoverOptimizationOpportunities();
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      final_state: "OPTIMIZATION_OPPORTUNITIES_DISCOVERED",
      lifecycle,
      principles: freezeArray(["observational-discovery-only", "advisory-output-only", "immutable-evidence", "deterministic-baselines", "replay-fidelity", "governance-compliance", "constitutional-compliance", "authority-preservation", "tenant-isolation", "no-automatic-optimization"]),
    }),
    registry,
    validation: validateOptimizationDiscovery(registry),
    observability: buildOptimizationDiscoveryObservabilitySurface(registry),
  });
}
