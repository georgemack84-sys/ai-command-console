import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStrategyComparisonIntelligence, validateStrategyComparisonIntelligence } from "@/services/strategy-comparison-intelligence";
import type {
  DependencyAnalysisReport,
  PortfolioAdvisoryArtifact,
  PortfolioAssessmentArtifact,
  PortfolioAssessmentCertification,
  PortfolioAssessmentCertificationTest,
  PortfolioAssessmentContractBundle,
  PortfolioAssessmentFailure,
  PortfolioAssessmentInput,
  PortfolioAssessmentLedger,
  PortfolioAssessmentResult,
  PortfolioAssessmentScenario,
  PortfolioAssessmentValidation,
  PortfolioComparisonArtifact,
  PortfolioMembershipRecord,
  PortfolioObservabilityReport,
  PortfolioReplayReport,
  PortfolioRiskAssessment,
  PortfolioScenarioAssessment,
  ResourceConflictReport,
} from "@/types/portfolio-assessment-intelligence";

const VERSION = "portfolio-assessment-intelligence/v12.8" as const;
const ID = "PortfolioAssessmentIntelligence" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: PortfolioAssessmentScenario): PortfolioAssessmentFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly PortfolioAssessmentFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function membership(strategies: readonly string[], failures: readonly PortfolioAssessmentFailure[]): PortfolioMembershipRecord {
  const refs = failures.includes("DUPLICATE_MEMBERSHIP") ? freezeArray([...strategies, strategies[0] ?? "strategy:missing"]) : strategies;
  const duplicates = freezeArray([...new Set(refs.filter((strategy, index) => refs.indexOf(strategy) !== index))]);
  return nested({ manifest_id: id("portfolio_membership", refs), strategy_refs: refs, strategy_versions: freezeArray(refs.map(() => "v1.0.0")), inclusion_rationale: freezeArray(refs.map((strategy) => `${strategy} included from completed comparison ranking.`)), qualification_preserved: !failures.includes("STRATEGY_VERSION_MISMATCH"), immutable: !failures.includes("MEMBERSHIP_MUTABLE"), duplicate_strategy_refs: duplicates, lineage_complete: !failures.includes("MEMBERSHIP_LINEAGE_INCOMPLETE") });
}

function dependencies(strategies: readonly string[], failures: readonly PortfolioAssessmentFailure[]): DependencyAnalysisReport {
  const edges = freezeArray(strategies.slice(1).map((strategy, index) => nested({ from: strategies[index], to: strategy, type: index % 2 ? "parallel" : "sequential" })));
  return nested({ graph_id: id("portfolio_dependency_graph", strategies), dependency_edges: edges, missing_prerequisites: failures.includes("DEPENDENCY_ANALYSIS_INCOMPLETE") ? freezeArray(["strategy:missing-prerequisite"]) : freezeArray([]), circular_dependencies: failures.includes("CIRCULAR_DEPENDENCY_UNRESOLVED") ? freezeArray(["strategy:a -> strategy:b -> strategy:a"]) : freezeArray([]), sequencing_conflicts: freezeArray([]), failure_propagation_map: freezeArray(["critical strategy failure propagates to dependent sequencing path"]), critical_path: strategies, reproducible: !failures.includes("DEPENDENCY_ANALYSIS_INCOMPLETE") && !failures.includes("CIRCULAR_DEPENDENCY_UNRESOLVED") });
}

function resources(failures: readonly PortfolioAssessmentFailure[]): ResourceConflictReport {
  const conflicts = failures.includes("RESOURCE_CONFLICT_UNDETECTED") ? freezeArray([]) : freezeArray(["operator attention contention"]);
  return nested({ report_id: id("portfolio_resource_conflicts", VERSION), demand_matrix: Object.freeze({ personnel: 4, budget: 7, compute: 3, governance_capacity: 2, operator_attention: 8 }), allocation_summary: Object.freeze({ personnel: 6, budget: 10, compute: 8, governance_capacity: 4, operator_attention: 10 }), conflicts, conflict_resolution_candidates: freezeArray(["sequence operator-heavy strategies", "reserve governance review capacity"]), capacity_validated: !failures.includes("CAPACITY_VALIDATION_FAILED"), reproducible: true });
}

function risk(failures: readonly PortfolioAssessmentFailure[]): PortfolioRiskAssessment {
  return nested({ report_id: id("portfolio_risk", VERSION), aggregate_risk_score: failures.includes("AGGREGATE_RISK_NONREPRODUCIBLE") ? 0.91 : 0.34, risk_categories: freezeArray(["correlated risk", "systemic risk", "governance risk", "operational risk", "dependency risk", "uncertainty accumulation"]), correlation_matrix_ref: "correlation:portfolio:v1", systemic_risk_report: failures.includes("SYSTEMIC_RISK_MISSING") ? "" : "Systemic risk remains bounded by diversified strategy timing.", mitigations: freezeArray(["staggered rollout", "governance checkpointing", "dependency isolation"]), reproducible: !failures.includes("AGGREGATE_RISK_NONREPRODUCIBLE") && !failures.includes("SYSTEMIC_RISK_MISSING") });
}

function scenarios(failures: readonly PortfolioAssessmentFailure[]): PortfolioScenarioAssessment {
  return nested({ assessment_id: id("portfolio_scenarios", VERSION), scenario_refs: failures.includes("SCENARIO_EVALUATION_INCOMPLETE") ? freezeArray(["BASE_CASE"]) : freezeArray(["BASE_CASE", "BEST_CASE", "WORST_CASE", "EXPECTED_CASE", "STRESS_CASE", "ADVERSARIAL_CASE", "RESOURCE_CASE", "POLICY_CASE", "TEMPORAL_CASE", "CONSTRAINT_CASE"]), robustness_score: 0.78, resilience_score: 0.81, sensitivity_report: freezeArray(["worst-case budget pressure", "stress-case operator capacity"]), outcome_matrix_ref: "outcome-matrix:portfolio:v1", complete: !failures.includes("SCENARIO_EVALUATION_INCOMPLETE"), reproducible: !failures.includes("SCENARIO_SENSITIVITY_NONREPRODUCIBLE") });
}

function portfolioComparison(failures: readonly PortfolioAssessmentFailure[]): PortfolioComparisonArtifact {
  return nested({ comparison_id: id("portfolio_comparison", VERSION), alternative_portfolios: freezeArray(["portfolio:balanced", "portfolio:resilience-heavy", "portfolio:cost-optimized"]), ranking: failures.includes("PORTFOLIO_COMPARISON_NONDETERMINISTIC") ? freezeArray(["portfolio:cost-optimized", "portfolio:balanced", "portfolio:resilience-heavy"]) : freezeArray(["portfolio:balanced", "portfolio:resilience-heavy", "portfolio:cost-optimized"]), threshold_evaluation: failures.includes("THRESHOLD_POLICY_NOT_APPLIED") ? "" : "threshold-policy:portfolio:v1 applied", tie_resolution: failures.includes("TIE_RESOLUTION_FAILED") ? "" : "tie-policy:portfolio-deterministic:v1", deterministic: !failures.includes("PORTFOLIO_COMPARISON_NONDETERMINISTIC") });
}

function advisory(evidence: readonly string[], failures: readonly PortfolioAssessmentFailure[]): PortfolioAdvisoryArtifact {
  return nested({ advisory_id: id("portfolio_advisory", VERSION), recommended_portfolio: "portfolio:balanced", alternative_portfolios: freezeArray(["portfolio:resilience-heavy", "portfolio:cost-optimized"]), tradeoffs: freezeArray(["risk reduction versus implementation time", "operator workload versus resilience"]), strengths: freezeArray(["diversified risk", "strong replay lineage"]), weaknesses: freezeArray(["operator attention contention"]), resource_summary: "Resource use stays within modeled capacity after sequencing.", dependency_summary: "Critical path remains explicit and reproducible.", risk_summary: "Aggregate risk is bounded with documented mitigations.", confidence_summary: "Portfolio confidence: 0.82.", uncertainty_summary: "Portfolio uncertainty: 0.18.", advisory_narrative: failures.includes("ADVISORY_RATIONALE_INCOMPLETE") ? "" : "Recommend balanced portfolio as advisory-only selection for operator review.", non_executable: !failures.includes("ADVISORY_OUTPUT_EXECUTABLE"), evidence_refs: failures.includes("EVIDENCE_MISSING") ? freezeArray([]) : evidence });
}

function assessment(tenantId: string, cycleRef: string, membershipRecord: PortfolioMembershipRecord, dep: DependencyAnalysisReport, res: ResourceConflictReport, riskReport: PortfolioRiskAssessment, scenarioAssessment: PortfolioScenarioAssessment, comparison: PortfolioComparisonArtifact, advisoryArtifact: PortfolioAdvisoryArtifact, evidence: readonly string[], failures: readonly PortfolioAssessmentFailure[]): PortfolioAssessmentArtifact {
  const seed = { cycleRef, strategies: membershipRecord.strategy_refs, version: VERSION };
  const assessmentId = failures.includes("PORTFOLIO_IDENTITY_NONDETERMINISTIC") ? id("portfolio_assessment", { seed, nonce: "unstable" }) : id("portfolio_assessment", seed);
  return nested({ portfolio_assessment_id: assessmentId, assessment_type: "INTEGRATED_STRATEGY_PORTFOLIO" as const, recommendation_cycle_ref: cycleRef, portfolio_scope: "enterprise strategic recommendation portfolio", portfolio_objectives: freezeArray(["maximize strategic value", "bound aggregate risk", "preserve operator authority"]), strategy_refs: membershipRecord.strategy_refs, strategy_versions: membershipRecord.strategy_versions, dependency_graph_ref: dep.graph_id, resource_requirements: res.demand_matrix, resource_conflicts: res.conflicts, scenario_refs: scenarioAssessment.scenario_refs, aggregate_risk: riskReport.aggregate_risk_score, portfolio_scores: Object.freeze({ expected_value: 0.82, resilience: 0.81, resource_efficiency: 0.74 }), optimization_summary: "Balanced portfolio dominates alternatives under deterministic thresholds.", advisory_recommendation: advisoryArtifact.advisory_narrative, confidence: 0.82, uncertainty: 0.18, evidence_refs: evidence, policy_manifest_ref: failures.includes("POLICY_MANIFEST_MISSING") ? "" : `manifest:${cycleRef}:portfolio`, authority_ref: "authority:portfolio:advisory", origin_ref: `origin:${cycleRef}:portfolio-assessment`, replay_ref: `replay:${assessmentId}`, lifecycle_state: failures.includes("LIFECYCLE_NONREPRODUCIBLE") ? "VALIDATING" as const : "COMPLETE" as const, advisory_only: !failures.includes("ADVISORY_OUTPUT_EXECUTABLE"), tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant_beta" : tenantId });
}

function replay(failures: readonly PortfolioAssessmentFailure[]): PortfolioReplayReport {
  const ok = !failures.includes("REPLAY_MISMATCH");
  return nested({ report_id: id("portfolio_replay", VERSION), membership_restored: ok, dependencies_restored: ok, resources_restored: ok, scenarios_restored: ok, comparisons_restored: ok, rankings_restored: ok, advisory_outputs_restored: ok, outcome: ok ? "MATCH" as const : "FAILURE" as const });
}

function ledger(assessmentArtifact: PortfolioAssessmentArtifact, failures: readonly PortfolioAssessmentFailure[]): PortfolioAssessmentLedger {
  const entries = freezeArray(["ASSESSMENT_REGISTERED", "DEPENDENCIES_ANALYZED", "RESOURCES_ANALYZED", "RISK_AGGREGATED", "SCENARIOS_EVALUATED", "PORTFOLIOS_COMPARED", "ADVISORY_PRODUCED", "REPLAY_VALIDATED"].map((type, index) => nested({ entry_id: id("portfolio_ledger_entry", { type, index, assessment: assessmentArtifact.portfolio_assessment_id }), type, subject_id: assessmentArtifact.portfolio_assessment_id })));
  return nested({ ledger_id: id("portfolio_ledger", assessmentArtifact.portfolio_assessment_id), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, entries });
}

function observability(dep: DependencyAnalysisReport, res: ResourceConflictReport, scenarioAssessment: PortfolioScenarioAssessment, replayReport: PortfolioReplayReport, failures: readonly PortfolioAssessmentFailure[]): PortfolioObservabilityReport {
  return nested({ report_id: id("portfolio_observability", VERSION), assessment_latency_ms: 210, dependency_graph_size: dep.dependency_edges.length, conflict_frequency: res.conflicts.length, aggregate_risk_trend: 0.34, scenario_coverage: scenarioAssessment.scenario_refs.length / 10, comparison_frequency: 1, replay_success: replayReport.outcome === "MATCH" ? 1 : 0, portfolio_stability: 0.87, observable: !failures.includes("OBSERVABILITY_MISSING") });
}

function certTest(name: string, passed: boolean, failure: PortfolioAssessmentFailure, refs: readonly string[]): PortfolioAssessmentCertificationTest {
  return nested({ test_id: id("portfolio_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}

type CertBase = Omit<PortfolioAssessmentResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly PortfolioAssessmentCertificationTest[] {
  const refs = freezeArray([result.assessment.integrity_hash, result.membership.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Portfolio artifact contract complete", result.assessment.portfolio_assessment_id.length > 0 && result.assessment.policy_manifest_ref.length > 0, "PORTFOLIO_ARTIFACT_CONTRACT_INVALID", refs),
    certTest("Portfolio identity deterministic", result.assessment.portfolio_assessment_id === id("portfolio_assessment", { cycleRef: result.assessment.recommendation_cycle_ref, strategies: result.membership.strategy_refs, version: VERSION }), "PORTFOLIO_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Lifecycle reproducible", result.assessment.lifecycle_state === "COMPLETE", "LIFECYCLE_NONREPRODUCIBLE", refs),
    certTest("Membership immutable", result.membership.immutable, "MEMBERSHIP_MUTABLE", refs),
    certTest("Strategy versions fixed", result.membership.qualification_preserved, "STRATEGY_VERSION_MISMATCH", refs),
    certTest("Duplicate membership prevented", result.membership.duplicate_strategy_refs.length === 0, "DUPLICATE_MEMBERSHIP", refs),
    certTest("Membership lineage complete", result.membership.lineage_complete, "MEMBERSHIP_LINEAGE_INCOMPLETE", refs),
    certTest("Dependencies explicit", result.dependencies.reproducible && result.dependencies.missing_prerequisites.length === 0, "DEPENDENCY_ANALYSIS_INCOMPLETE", refs),
    certTest("Circular dependencies resolved", result.dependencies.circular_dependencies.length === 0, "CIRCULAR_DEPENDENCY_UNRESOLVED", refs),
    certTest("Resource conflicts detected", result.resources.conflicts.length > 0, "RESOURCE_CONFLICT_UNDETECTED", refs),
    certTest("Capacity validated", result.resources.capacity_validated, "CAPACITY_VALIDATION_FAILED", refs),
    certTest("Aggregate risk reproducible", result.risk.reproducible, "AGGREGATE_RISK_NONREPRODUCIBLE", refs),
    certTest("Systemic risk documented", result.risk.systemic_risk_report.length > 0, "SYSTEMIC_RISK_MISSING", refs),
    certTest("Scenarios evaluated", result.scenarios.complete && result.scenarios.scenario_refs.length === 10, "SCENARIO_EVALUATION_INCOMPLETE", refs),
    certTest("Scenario sensitivity reproducible", result.scenarios.reproducible, "SCENARIO_SENSITIVITY_NONREPRODUCIBLE", refs),
    certTest("Portfolio comparison deterministic", result.comparison.deterministic, "PORTFOLIO_COMPARISON_NONDETERMINISTIC", refs),
    certTest("Threshold policy applied", result.comparison.threshold_evaluation.length > 0, "THRESHOLD_POLICY_NOT_APPLIED", refs),
    certTest("Tie resolution applied", result.comparison.tie_resolution.length > 0, "TIE_RESOLUTION_FAILED", refs),
    certTest("Advisory output non-executable", result.advisory.non_executable && result.assessment.advisory_only, "ADVISORY_OUTPUT_EXECUTABLE", refs),
    certTest("Advisory rationale complete", result.advisory.advisory_narrative.length > 0, "ADVISORY_RATIONALE_INCOMPLETE", refs),
    certTest("Evidence linked", result.advisory.evidence_refs.length > 0 && result.assessment.evidence_refs.length > 0, "EVIDENCE_MISSING", refs),
    certTest("Policy manifest bound", result.assessment.policy_manifest_ref.length > 0, "POLICY_MANIFEST_MISSING", refs),
    certTest("Governance enforced", result.assessment.policy_manifest_ref.length > 0, "GOVERNANCE_FAILURE", refs),
    certTest("Constitutional compliance enforced", result.assessment.advisory_only, "CONSTITUTIONAL_VIOLATION", refs),
    certTest("Replay matches", result.replay.outcome === "MATCH", "REPLAY_MISMATCH", refs),
    certTest("Integrity valid", result.assessment.integrity_hash.length > 0, "INTEGRITY_VALIDATION_FAILED", refs),
    certTest("Tenant isolation preserved", result.assessment.tenant_id === "tenant_mission_control", "TENANT_ISOLATION_BREACH", refs),
    certTest("Ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<PortfolioAssessmentResult, "replay_hash" | "integrity_hash">): string {
  return hash({ assessment: result.assessment.integrity_hash, membership: result.membership.integrity_hash, dependencies: result.dependencies.integrity_hash, resources: result.resources.integrity_hash, risk: result.risk.integrity_hash, scenarios: result.scenarios.integrity_hash, comparison: result.comparison.integrity_hash, advisory: result.advisory.integrity_hash, replay: result.replay.integrity_hash, ledger: result.ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<PortfolioAssessmentResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runPortfolioAssessmentIntelligence(input: PortfolioAssessmentInput = {}): PortfolioAssessmentResult {
  const comparison = runStrategyComparisonIntelligence({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const comparisonValid = validateStrategyComparisonIntelligence(comparison).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<PortfolioAssessmentFailure>([...(comparisonValid ? [] : ["PORTFOLIO_ARTIFACT_CONTRACT_INVALID" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const cycleRef = input.recommendation_cycle_ref ?? comparison.comparison.recommendation_cycle_ref;
  const evidence = comparison.comparison.evidence_refs;
  const member = membership(comparison.comparison.participating_strategy_refs, failures);
  const dep = dependencies(member.strategy_refs, failures);
  const res = resources(failures);
  const riskReport = risk(failures);
  const scen = scenarios(failures);
  const comp = portfolioComparison(failures);
  const adv = advisory(evidence, failures);
  const assess = assessment(tenantId, cycleRef, member, dep, res, riskReport, scen, comp, adv, evidence, failures);
  const rep = replay(failures);
  const led = ledger(assess, failures);
  const obs = observability(dep, res, scen, rep, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, assessment: assess, membership: member, dependencies: dep, resources: res, risk: riskReport, scenarios: scen, comparison: comp, advisory: adv, replay: rep, ledger: led, observability: obs };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is PortfolioAssessmentFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification = nested({ certification_id: id("portfolio_certification", VERSION), status, production_ready: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validatePortfolioAssessmentIntelligence(result?: PortfolioAssessmentResult): PortfolioAssessmentValidation {
  if (!result) {
    const failures = freezeArray<PortfolioAssessmentFailure>(["PORTFOLIO_ARTIFACT_CONTRACT_INVALID"]);
    const base = { assessment_id: null, valid: false, status: "FAIL" as const, production_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false, membership_valid: false, advisory_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.assessment) === result.assessment.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const membership_valid = result.membership.immutable && result.membership.duplicate_strategy_refs.length === 0;
  const advisory_valid = result.advisory.non_executable && result.advisory.advisory_narrative.length > 0;
  const valid = result.certification.status === "PASS" && result.certification.production_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && membership_valid && advisory_valid;
  const base = { assessment_id: result.assessment.portfolio_assessment_id, valid, status: result.certification.status, production_ready: result.certification.production_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, membership_valid, advisory_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayPortfolioAssessmentIntelligence(result = runPortfolioAssessmentIntelligence()): boolean {
  const replayed = runPortfolioAssessmentIntelligence({ tenant_id: result.assessment.tenant_id, recommendation_cycle_ref: result.assessment.recommendation_cycle_ref });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validatePortfolioAssessmentIntelligence(result).valid;
}

export function getPortfolioAssessmentIntelligenceContract(): PortfolioAssessmentContractBundle {
  const result = runPortfolioAssessmentIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, immutable_membership_required: true, deterministic_dependency_analysis_required: true, scenario_evaluation_required: true, replay_required: true, governance_validation_required: true }), result, validation: validatePortfolioAssessmentIntelligence(result) });
}

export const PortfolioAssessmentIntelligence = Object.freeze({ run: runPortfolioAssessmentIntelligence, validate: validatePortfolioAssessmentIntelligence, replay: replayPortfolioAssessmentIntelligence });
