import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { discoverOptimizationOpportunities, validateOptimizationDiscovery } from "@/services/optimization-opportunity-discovery";
import type { OptimizationOpportunityRecord, OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";
import type {
  BenefitEstimationRecord,
  ConstraintPreservationRecord,
  ImpactAnalysisRecord,
  ImpactAnalysisState,
  ImpactDecisionOutcome,
  OptimizationImpactAnalysisBundle,
  OptimizationImpactAnalysisLedger,
  OptimizationImpactFailure,
  OptimizationImpactInput,
  OptimizationImpactObservabilitySurface,
  OptimizationImpactScenario,
  OptimizationImpactValidationResult,
  ResourceImpactReport,
  RiskAssessmentReport,
} from "@/types/optimization-impact-analysis";

const VERSION = "optimization-impact-analysis/v8ALT.8.2" as const;
const NOW = "2026-07-15T08:00:00.000Z";
const workflow = Object.freeze(["PENDING", "BENEFIT_ANALYSIS", "RESOURCE_ANALYSIS", "RISK_ANALYSIS", "CONSTRAINT_VALIDATION", "COMPLETED"] as const);
const outcomes = Object.freeze(["ACCEPTABLE", "REVIEW_REQUIRED", "HIGH_RISK", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function pct(from: number, to: number): number { return Number((((from - to) / Math.max(from, 1)) * 100).toFixed(2)); }

function scenarioFailure(scenario: OptimizationImpactScenario): OptimizationImpactFailure | null {
  const map: Partial<Record<OptimizationImpactScenario, OptimizationImpactFailure>> = {
    MISSING_DISCOVERY_REGISTRY: "DISCOVERY_REGISTRY_MISSING",
    OPPORTUNITY_NOT_READY: "OPPORTUNITY_NOT_READY_FOR_ANALYSIS",
    BENEFIT_ESTIMATE_MISMATCH: "BENEFIT_ESTIMATE_MISMATCH_DETECTED",
    RESOURCE_REGRESSION: "RESOURCE_REGRESSION_DETECTED",
    HIGH_DETERMINISTIC_RISK: "DETERMINISTIC_RISK_HIGH",
    REPLAY_RISK: "REPLAY_RISK_HIGH",
    GOVERNANCE_RISK: "GOVERNANCE_RISK_HIGH",
    CONSTITUTIONAL_RISK: "CONSTITUTIONAL_RISK_HIGH",
    AUTHORITY_RISK: "AUTHORITY_RISK_HIGH",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILED",
    VISIBILITY_FAILURE: "OPERATOR_VISIBILITY_FAILED",
    LINEAGE_MUTATION: "LINEAGE_MUTATION_DETECTED",
    AUTOMATIC_IMPLEMENTATION_ATTEMPT: "AUTOMATIC_IMPLEMENTATION_ATTEMPTED",
    RECOMMENDATION_AUTHORITY_ATTEMPT: "RECOMMENDATION_AUTHORITY_ATTEMPTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

function decisionFor(failures: readonly OptimizationImpactFailure[], risk: number): ImpactDecisionOutcome {
  if (failures.some((failure) => ["DISCOVERY_REGISTRY_MISSING", "GOVERNANCE_RISK_HIGH", "CONSTITUTIONAL_RISK_HIGH", "AUTHORITY_RISK_HIGH", "TENANT_ISOLATION_FAILED", "LINEAGE_MUTATION_DETECTED", "AUTOMATIC_IMPLEMENTATION_ATTEMPTED", "RECOMMENDATION_AUTHORITY_ATTEMPTED", "INTEGRITY_VERIFICATION_FAILED"].includes(failure))) return "REJECTED";
  if (risk >= 0.75 || failures.some((failure) => ["DETERMINISTIC_RISK_HIGH", "REPLAY_RISK_HIGH"].includes(failure))) return "HIGH_RISK";
  if (failures.length || risk >= 0.45) return "REVIEW_REQUIRED";
  return "ACCEPTABLE";
}

function buildBenefit(opportunity: OptimizationOpportunityRecord, scenario: OptimizationImpactScenario): BenefitEstimationRecord {
  const projected = scenario === "BENEFIT_ESTIMATE_MISMATCH" ? opportunity.current_metric * 1.12 : opportunity.projected_metric;
  const base = {
    estimation_id: id("OIBE", "optimization-impact-benefit", { opportunity: opportunity.opportunity_id, scenario }),
    opportunity_id: opportunity.opportunity_id,
    performance_metric: `${opportunity.subsystem}:${opportunity.opportunity_type}`,
    baseline_value: opportunity.current_metric,
    projected_value: Number(projected.toFixed(2)),
    improvement_percentage: pct(opportunity.current_metric, projected),
    confidence_score: scenario === "BENEFIT_ESTIMATE_MISMATCH" ? 0.54 : opportunity.confidence_score,
    historical_reference: `history:impact:${opportunity.subsystem}`,
    replay_reference: opportunity.replay_reference,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-impact-benefit", base) });
}

function buildResource(opportunity: OptimizationOpportunityRecord, scenario: OptimizationImpactScenario): ResourceImpactReport {
  const regression = scenario === "RESOURCE_REGRESSION";
  const factor = regression ? 1 : -1;
  const base = {
    report_id: id("OIRR", "optimization-impact-resource", { opportunity: opportunity.opportunity_id, scenario }),
    opportunity_id: opportunity.opportunity_id,
    CPU_delta: factor * 4,
    memory_delta: factor * 3,
    storage_delta: factor * 2,
    network_delta: factor * 1,
    scheduling_delta: factor * 5,
    replay_delta: factor * 6,
    utilization_score: regression ? 0.35 : 0.91,
    sustainability_score: regression ? 0.4 : 0.93,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-impact-resource", base) });
}

function buildRisk(opportunity: OptimizationOpportunityRecord, scenario: OptimizationImpactScenario): RiskAssessmentReport {
  const high = (target: OptimizationImpactScenario) => scenario === target ? 0.91 : 0.08;
  const implementation = scenario === "RESOURCE_REGRESSION" || scenario === "BENEFIT_ESTIMATE_MISMATCH" ? 0.52 : 0.18;
  const base = {
    risk_report_id: id("OIRA", "optimization-impact-risk", { opportunity: opportunity.opportunity_id, scenario }),
    opportunity_id: opportunity.opportunity_id,
    deterministic_risk: high("HIGH_DETERMINISTIC_RISK"),
    replay_risk: high("REPLAY_RISK"),
    governance_risk: high("GOVERNANCE_RISK"),
    constitutional_risk: high("CONSTITUTIONAL_RISK"),
    authority_risk: high("AUTHORITY_RISK"),
    operational_risk: scenario === "VISIBILITY_FAILURE" ? 0.72 : 0.14,
    implementation_risk: implementation,
    mitigation_plan: freezeArray(["operator review before recommendation", "deterministic validation required", "certification gate required"]),
    confidence_score: 0.95,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-impact-risk", base) });
}

function buildConstraint(opportunity: OptimizationOpportunityRecord, scenario: OptimizationImpactScenario): ConstraintPreservationRecord {
  const base = {
    constraint_record_id: id("OIC", "optimization-impact-constraint", { opportunity: opportunity.opportunity_id, scenario }),
    opportunity_id: opportunity.opportunity_id,
    deterministic_validation: scenario === "HIGH_DETERMINISTIC_RISK" ? "FAIL" as const : "PASS" as const,
    replay_validation: scenario === "REPLAY_RISK" ? "FAIL" as const : "PASS" as const,
    governance_validation: scenario === "GOVERNANCE_RISK" ? "FAIL" as const : "PASS" as const,
    constitutional_validation: scenario === "CONSTITUTIONAL_RISK" ? "FAIL" as const : "PASS" as const,
    authority_validation: scenario === "AUTHORITY_RISK" ? "FAIL" as const : "PASS" as const,
    tenant_validation: scenario === "TENANT_ISOLATION_FAILURE" ? "FAIL" as const : "PASS" as const,
    visibility_validation: scenario === "VISIBILITY_FAILURE" ? "FAIL" as const : "PASS" as const,
    explainability_validation: "PASS" as const,
    lineage_validation: scenario === "LINEAGE_MUTATION" ? "FAIL" as const : "PASS" as const,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-impact-constraint", base) });
}

function analyzeOpportunity(opportunity: OptimizationOpportunityRecord, scenario: OptimizationImpactScenario, failures: readonly OptimizationImpactFailure[]): ImpactAnalysisRecord {
  const projectedPerformance = scenario === "BENEFIT_ESTIMATE_MISMATCH" ? opportunity.current_metric * 1.12 : opportunity.projected_metric;
  const risk = failures.length ? 0.88 : scenario === "RESOURCE_REGRESSION" ? 0.58 : 0.16;
  const base = {
    impact_analysis_id: id("OIA", "optimization-impact-analysis", { opportunity: opportunity.opportunity_id, scenario }),
    opportunity_id: opportunity.opportunity_id,
    mission_id: opportunity.mission_id,
    execution_id: "execution:impact-analysis:8alt-8-2",
    tenant_id: scenario === "TENANT_ISOLATION_FAILURE" ? "tenant:foreign" : opportunity.tenant_id,
    subsystem: opportunity.subsystem,
    optimization_category: opportunity.optimization_category,
    current_performance: opportunity.current_metric,
    projected_performance: Number(projectedPerformance.toFixed(2)),
    projected_improvement: Number((opportunity.current_metric - projectedPerformance).toFixed(2)),
    efficiency_score: failures.includes("BENEFIT_ESTIMATE_MISMATCH_DETECTED") ? 0.42 : 0.9,
    confidence_score: failures.length ? 0.62 : 0.96,
    resource_impact_score: failures.includes("RESOURCE_REGRESSION_DETECTED") ? 0.28 : 0.92,
    implementation_complexity: failures.length ? 0.74 : 0.24,
    overall_risk_score: risk,
    analysis_status: "COMPLETED" as ImpactAnalysisState,
    decision_outcome: decisionFor(failures, risk),
    advisory_only: true as const,
    execution_authority: false as const,
    automatic_implementation: scenario === "AUTOMATIC_IMPLEMENTATION_ATTEMPT",
    recommendation_authority: scenario === "RECOMMENDATION_AUTHORITY_ATTEMPT",
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-impact-analysis-record", base) });
}

function collectFailures(ledger: Omit<OptimizationImpactAnalysisLedger, "integrity_hash"> | OptimizationImpactAnalysisLedger, registry: OptimizationOpportunityRegistry | null): readonly OptimizationImpactFailure[] {
  return unique([
    ...ledger.failures,
    ...(!registry ? ["DISCOVERY_REGISTRY_MISSING" as const] : []),
    ...(registry && !validateOptimizationDiscovery(registry).ready_for_impact_analysis ? ["OPPORTUNITY_NOT_READY_FOR_ANALYSIS" as const] : []),
    ...(ledger.benefits.some((benefit) => benefit.projected_value >= benefit.baseline_value || benefit.improvement_percentage <= 0) ? ["BENEFIT_ESTIMATE_MISMATCH_DETECTED" as const] : []),
    ...(ledger.resources.some((resource) => resource.CPU_delta > 0 || resource.memory_delta > 0 || resource.sustainability_score < 0.7) ? ["RESOURCE_REGRESSION_DETECTED" as const] : []),
    ...(ledger.risks.some((risk) => risk.deterministic_risk >= 0.75) ? ["DETERMINISTIC_RISK_HIGH" as const] : []),
    ...(ledger.risks.some((risk) => risk.replay_risk >= 0.75) ? ["REPLAY_RISK_HIGH" as const] : []),
    ...(ledger.risks.some((risk) => risk.governance_risk >= 0.75) ? ["GOVERNANCE_RISK_HIGH" as const] : []),
    ...(ledger.risks.some((risk) => risk.constitutional_risk >= 0.75) ? ["CONSTITUTIONAL_RISK_HIGH" as const] : []),
    ...(ledger.risks.some((risk) => risk.authority_risk >= 0.75) ? ["AUTHORITY_RISK_HIGH" as const] : []),
    ...(ledger.constraints.some((constraint) => constraint.tenant_validation === "FAIL") ? ["TENANT_ISOLATION_FAILED" as const] : []),
    ...(ledger.constraints.some((constraint) => constraint.visibility_validation === "FAIL") ? ["OPERATOR_VISIBILITY_FAILED" as const] : []),
    ...(ledger.constraints.some((constraint) => constraint.lineage_validation === "FAIL") ? ["LINEAGE_MUTATION_DETECTED" as const] : []),
    ...(ledger.analyses.some((analysis) => analysis.automatic_implementation) ? ["AUTOMATIC_IMPLEMENTATION_ATTEMPTED" as const] : []),
    ...(ledger.analyses.some((analysis) => analysis.recommendation_authority) ? ["RECOMMENDATION_AUTHORITY_ATTEMPTED" as const] : []),
  ]);
}

export function runOptimizationImpactAnalysis(input: OptimizationImpactInput = {}): OptimizationImpactAnalysisLedger {
  if (input.ledger) return input.ledger;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const registry = scenario === "MISSING_DISCOVERY_REGISTRY" ? null : input.registry ?? discoverOptimizationOpportunities(scenario === "OPPORTUNITY_NOT_READY" ? { scenario: "LIFECYCLE_SKIP" } : {});
  const opportunities = registry?.opportunities ?? freezeArray([]);
  const initialFailures = unique([...(injected ? [injected] : [])]);
  const benefits = freezeArray(opportunities.map((opportunity) => buildBenefit(opportunity, scenario)));
  const resources = freezeArray(opportunities.map((opportunity) => buildResource(opportunity, scenario)));
  const risks = freezeArray(opportunities.map((opportunity) => buildRisk(opportunity, scenario)));
  const constraints = freezeArray(opportunities.map((opportunity) => buildConstraint(opportunity, scenario)));
  const analysisFailures = unique(initialFailures);
  const analyses = freezeArray(opportunities.map((opportunity) => analyzeOpportunity(opportunity, scenario, analysisFailures)));
  const source = {
    ledger_id: id("OIAL", "optimization-impact-ledger", { registry: registry?.registry_id ?? "missing", scenario }),
    final_state: initialFailures.length ? "OPTIMIZATION_IMPACT_ANALYSIS_BLOCKED" as const : "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE" as const,
    source_registry_id: registry?.registry_id ?? null,
    analyses,
    benefits,
    resources,
    risks,
    constraints,
    failures: initialFailures,
    advisory_only: true as const,
    execution_authority: false as const,
    automatic_implementation: false as const,
    recommendation_authority: false as const,
  };
  const failures = collectFailures(source, registry);
  const ledger = { ...source, failures, final_state: failures.length ? "OPTIMIZATION_IMPACT_ANALYSIS_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...ledger, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("optimization-impact-ledger", ledger) });
}

export function listBenefitEstimations(input: OptimizationImpactInput = {}) { return runOptimizationImpactAnalysis(input).benefits; }
export function listResourceImpactReports(input: OptimizationImpactInput = {}) { return runOptimizationImpactAnalysis(input).resources; }
export function listRiskAssessmentReports(input: OptimizationImpactInput = {}) { return runOptimizationImpactAnalysis(input).risks; }
export function listConstraintPreservationRecords(input: OptimizationImpactInput = {}) { return runOptimizationImpactAnalysis(input).constraints; }

export function validateOptimizationImpactAnalysis(ledger = runOptimizationImpactAnalysis(), registry: OptimizationOpportunityRegistry | null = discoverOptimizationOpportunities()): OptimizationImpactValidationResult {
  const failures = unique([
    ...collectFailures(ledger, registry),
    ...(!ledger.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const has = (failure: OptimizationImpactFailure) => failures.includes(failure);
  const expectedCount = registry?.opportunities.length ?? 0;
  const every_opportunity_analyzed = Boolean(registry) && ledger.analyses.length === expectedCount && ledger.benefits.length === expectedCount && ledger.resources.length === expectedCount && ledger.risks.length === expectedCount && ledger.constraints.length === expectedCount;
  const valid = failures.length === 0 && every_opportunity_analyzed && ledger.final_state === "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE" && ledger.advisory_only && !ledger.execution_authority && !ledger.automatic_implementation && !ledger.recommendation_authority;
  const source = {
    ledger_id: ledger.ledger_id,
    valid,
    every_opportunity_analyzed,
    benefits_reproducible: !has("BENEFIT_ESTIMATE_MISMATCH_DETECTED"),
    resources_assessed: !has("RESOURCE_REGRESSION_DETECTED") && ledger.resources.length === expectedCount,
    risks_assessed: ledger.risks.length === expectedCount,
    constraints_preserved: !["DETERMINISTIC_RISK_HIGH", "REPLAY_RISK_HIGH", "GOVERNANCE_RISK_HIGH", "CONSTITUTIONAL_RISK_HIGH", "AUTHORITY_RISK_HIGH", "TENANT_ISOLATION_FAILED", "OPERATOR_VISIBILITY_FAILED", "LINEAGE_MUTATION_DETECTED"].some((failure) => has(failure as OptimizationImpactFailure)),
    deterministic_preserved: !has("DETERMINISTIC_RISK_HIGH"),
    replay_preserved: !has("REPLAY_RISK_HIGH"),
    governance_preserved: !has("GOVERNANCE_RISK_HIGH"),
    constitutional_preserved: !has("CONSTITUTIONAL_RISK_HIGH"),
    authority_preserved: !has("AUTHORITY_RISK_HIGH"),
    tenant_isolated: !has("TENANT_ISOLATION_FAILED"),
    operator_visibility_preserved: !has("OPERATOR_VISIBILITY_FAILED"),
    lineage_immutable: !has("LINEAGE_MUTATION_DETECTED"),
    advisory_only: true as const,
    execution_authority_absent: !ledger.execution_authority && ledger.analyses.every((analysis) => !analysis.execution_authority),
    automatic_implementation_absent: !ledger.automatic_implementation && ledger.analyses.every((analysis) => !analysis.automatic_implementation),
    recommendation_authority_absent: !ledger.recommendation_authority && ledger.analyses.every((analysis) => !analysis.recommendation_authority),
    ready_for_deterministic_validation: valid,
    fail_closed: valid || failures.length > 0 || ledger.final_state !== "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE",
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("optimization-impact-validation", source) });
}

export function buildOptimizationImpactObservabilitySurface(ledger = runOptimizationImpactAnalysis()): OptimizationImpactObservabilitySurface {
  return Object.freeze({
    ledger_id: ledger.ledger_id,
    final_state: ledger.final_state,
    analysis_count: ledger.analyses.length,
    acceptable_count: ledger.analyses.filter((analysis) => analysis.decision_outcome === "ACCEPTABLE").length,
    review_count: ledger.analyses.filter((analysis) => analysis.decision_outcome === "REVIEW_REQUIRED").length,
    high_risk_count: ledger.analyses.filter((analysis) => analysis.decision_outcome === "HIGH_RISK").length,
    rejected_count: ledger.analyses.filter((analysis) => analysis.decision_outcome === "REJECTED").length,
    failure_count: ledger.failures.length,
    advisory_only: true,
    execution_authority: false,
    integrity_hash: ledger.integrity_hash,
  });
}

export function getOptimizationImpactAnalysis(): OptimizationImpactAnalysisBundle {
  const registry = discoverOptimizationOpportunities();
  const ledger = runOptimizationImpactAnalysis({ registry });
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      final_state: "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE",
      workflow,
      decision_outcomes: outcomes,
      principles: freezeArray(["analysis-only", "advisory-output-only", "registry-derived-opportunities", "deterministic-benefit-estimation", "resource-impact-accounting", "risk-scored-readiness", "constraint-preservation", "replay-compatible-reports", "no-automatic-implementation", "no-recommendation-authority"]),
    }),
    ledger,
    validation: validateOptimizationImpactAnalysis(ledger, registry),
    observability: buildOptimizationImpactObservabilitySurface(ledger),
  });
}
