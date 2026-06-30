import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeFailure, validateFailureAnalysis } from "@/services/failure-analysis-engine";
import type { FailureAnalysisObject, FailureAnalysisScenario } from "@/types/failure-analysis-engine";
import type {
  RecoveryPlan,
  RecoveryPlanEvaluation,
  RecoveryPlanLifecycleState,
  RecoveryPlanningConfidenceLevel,
  RecoveryPlanningEngineContract,
  RecoveryPlanningFailure,
  RecoveryPlanningInput,
  RecoveryPlanningObservabilitySurface,
  RecoveryPlanningPackage,
  RecoveryPlanningReplayResult,
  RecoveryPlanningRiskLevel,
  RecoveryPlanningScenario,
  RecoveryPlanningValidationResult,
  RecoveryStrategyType,
} from "@/types/recovery-planning-engine";
import type { RecoveryValidationStatus } from "@/types/recovery-contract";

const VERSION = "recovery-planning-engine/v8ALT.2.3" as const;
const REPLAY_VERSION = "recovery-planning-replay/v8ALT.2.3" as const;
const REPOSITORY_VERSION = "recovery-plan-repository/v8ALT.2.3" as const;
const TENANT_ID = "tenant:autonomy:primary";

const strategyTypes: readonly RecoveryStrategyType[] = Object.freeze(["ROLLBACK", "RESTART", "CHECKPOINT_RECOVERY", "STAGED_RECOVERY", "DEPENDENCY_REPAIR", "ALTERNATIVE_EXECUTION_PATH", "PARTIAL_CONTINUATION"]);
const lifecycleStates: readonly RecoveryPlanLifecycleState[] = Object.freeze(["PLANNED", "VALIDATING", "GOVERNANCE_REVIEW", "READY_FOR_OPERATOR", "APPROVED", "REJECTED"]);
const confidenceLevels: readonly RecoveryPlanningConfidenceLevel[] = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"]);
const riskLevels: readonly RecoveryPlanningRiskLevel[] = Object.freeze(["MINIMAL", "LOW", "MODERATE", "HIGH", "CRITICAL"]);
const rankingFactors = Object.freeze(["governance compliance", "constitutional compliance", "replay consistency", "integrity preservation", "recovery confidence", "operational risk", "recovery cost", "mission preservation", "dependency stability", "estimated recovery duration"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function confidenceLevel(score: number): RecoveryPlanningConfidenceLevel {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.65) return "MEDIUM";
  if (score >= 0.4) return "LOW";
  return "INSUFFICIENT";
}

function riskLevel(value: number): RecoveryPlanningRiskLevel {
  if (value <= 0.15) return "MINIMAL";
  if (value <= 0.3) return "LOW";
  if (value <= 0.55) return "MODERATE";
  if (value <= 0.8) return "HIGH";
  return "CRITICAL";
}

function scenarioToFailureScenario(scenario: RecoveryPlanningScenario): FailureAnalysisScenario {
  if (scenario === "BASELINE") return "BASELINE_EXECUTION";
  if (scenario === "LOW_CONFIDENCE") return "LOW_EVIDENCE";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_MISMATCH";
  if (scenario === "INTEGRITY_FAILURE") return "INTEGRITY_FAILURE";
  if (scenario === "AUTONOMOUS_EXECUTION_ATTEMPT") return "AUTONOMOUS_RECOVERY_ATTEMPT";
  if (scenario === "GOVERNANCE_MUTATION_ATTEMPT") return "GOVERNANCE_MUTATION_ATTEMPT";
  if (scenario === "TENANT_ISOLATION_FAILURE") return "TENANT_ISOLATION_FAILURE";
  return strategyScenarioNames.includes(scenario as FailureAnalysisScenario) ? scenario as FailureAnalysisScenario : "BASELINE_EXECUTION";
}

const strategyScenarioNames: readonly FailureAnalysisScenario[] = Object.freeze(["BASELINE_EXECUTION", "PLANNING_FAILURE", "ORCHESTRATION_FAILURE", "DEPENDENCY_FAILURE", "SUPERVISION_FAILURE", "INTEGRITY_FAILURE", "CHECKPOINT_CORRUPTION", "RESOURCE_EXHAUSTION", "AUTHORITY_VIOLATION", "GOVERNANCE_VIOLATION", "LOW_EVIDENCE", "REPLAY_MISMATCH", "LINEAGE_BROKEN", "TENANT_ISOLATION_FAILURE", "AUTONOMOUS_RECOVERY_ATTEMPT", "GOVERNANCE_MUTATION_ATTEMPT", "EVIDENCE_FABRICATION", "HIDDEN_RUNTIME_STATE"]);

function scenarioFailures(scenario: RecoveryPlanningScenario): readonly RecoveryPlanningFailure[] {
  const map: Partial<Record<RecoveryPlanningScenario, RecoveryPlanningFailure>> = {
    LOW_CONFIDENCE: "CONFIDENCE_INSUFFICIENT",
    LOW_EVIDENCE: "CONFIDENCE_INSUFFICIENT",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    AUTONOMOUS_RECOVERY_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    ROLLBACK_EXECUTION_ATTEMPT: "ROLLBACK_EXECUTION_DETECTED",
    RESTART_EXECUTION_ATTEMPT: "RESTART_EXECUTION_DETECTED",
    CHECKPOINT_RESTORE_ATTEMPT: "CHECKPOINT_RESTORE_DETECTED",
    GOVERNANCE_MUTATION_ATTEMPT: "GOVERNANCE_MUTATION_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_DETECTED",
    HIDDEN_ALTERNATIVES: "HIDDEN_ALTERNATIVES_DETECTED",
    HIDDEN_RUNTIME_STATE: "HIDDEN_ALTERNATIVES_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function strategyBias(strategy: RecoveryStrategyType, analysis: FailureAnalysisObject): number {
  const map: Partial<Record<typeof analysis.failure_category, RecoveryStrategyType>> = {
    EXECUTION: "CHECKPOINT_RECOVERY",
    PLANNING: "ALTERNATIVE_EXECUTION_PATH",
    ORCHESTRATION: "RESTART",
    DEPENDENCY: "DEPENDENCY_REPAIR",
    SUPERVISION: "PARTIAL_CONTINUATION",
    INTEGRITY: "ROLLBACK",
    CHECKPOINT_CORRUPTION: "ROLLBACK",
    RESOURCE_EXHAUSTION: "STAGED_RECOVERY",
    AUTHORITY_VIOLATION: "PARTIAL_CONTINUATION",
    GOVERNANCE_VIOLATION: "PARTIAL_CONTINUATION",
  };
  return map[analysis.failure_category] === strategy ? 0.24 : 0;
}

function strategyCost(strategy: RecoveryStrategyType): number {
  const map: Record<RecoveryStrategyType, number> = {
    ROLLBACK: 0.42,
    RESTART: 0.36,
    CHECKPOINT_RECOVERY: 0.28,
    STAGED_RECOVERY: 0.5,
    DEPENDENCY_REPAIR: 0.34,
    ALTERNATIVE_EXECUTION_PATH: 0.4,
    PARTIAL_CONTINUATION: 0.22,
  };
  return map[strategy];
}

function strategyRisk(strategy: RecoveryStrategyType, analysis: FailureAnalysisObject): number {
  const preferred: Partial<Record<typeof analysis.failure_category, RecoveryStrategyType>> = {
    EXECUTION: "CHECKPOINT_RECOVERY",
    PLANNING: "ALTERNATIVE_EXECUTION_PATH",
    ORCHESTRATION: "RESTART",
    DEPENDENCY: "DEPENDENCY_REPAIR",
    SUPERVISION: "PARTIAL_CONTINUATION",
    INTEGRITY: "ROLLBACK",
    CHECKPOINT_CORRUPTION: "ROLLBACK",
    RESOURCE_EXHAUSTION: "STAGED_RECOVERY",
    AUTHORITY_VIOLATION: "PARTIAL_CONTINUATION",
    GOVERNANCE_VIOLATION: "PARTIAL_CONTINUATION",
  };
  if (preferred[analysis.failure_category] === strategy) return 0.08;
  const severe = analysis.failure_category === "AUTHORITY_VIOLATION" || analysis.failure_category === "GOVERNANCE_VIOLATION" || analysis.failure_category === "INTEGRITY";
  const base = severe ? 0.62 : 0.28;
  const modifiers: Record<RecoveryStrategyType, number> = {
    ROLLBACK: 0.14,
    RESTART: 0.18,
    CHECKPOINT_RECOVERY: 0.08,
    STAGED_RECOVERY: 0.02,
    DEPENDENCY_REPAIR: 0.1,
    ALTERNATIVE_EXECUTION_PATH: 0.12,
    PARTIAL_CONTINUATION: -0.04,
  };
  return Math.min(1, Math.max(0, base + modifiers[strategy]));
}

function evaluatePlan(strategy: RecoveryStrategyType, planning_id: string, analysis: FailureAnalysisObject, failures: readonly RecoveryPlanningFailure[]): RecoveryPlanEvaluation {
  const baseConfidence = Math.min(0.98, analysis.confidence.confidence_score + strategyBias(strategy, analysis));
  const replay_consistency = failures.includes("REPLAY_INVALID") ? 0.2 : analysis.replay_reference.replay_checksum === "mismatch" ? 0.35 : 0.94;
  const dependency_stability = strategy === "DEPENDENCY_REPAIR" ? 0.9 : analysis.dependency_graph.nodes.length === 6 ? 0.86 : 0.45;
  const recovery_confidence = failures.includes("CONFIDENCE_INSUFFICIENT") ? Math.min(baseConfidence, 0.55) : Number(((baseConfidence + replay_consistency + dependency_stability) / 3).toFixed(4));
  const recovery_cost = strategyCost(strategy);
  const riskNumber = strategyRisk(strategy, analysis);
  const governance_impact = failures.includes("GOVERNANCE_MUTATION_DETECTED") || analysis.governance_status !== "COMPLIANT" ? "CRITICAL" : riskLevel(riskNumber);
  const operational_risk = riskLevel(riskNumber);
  const mission_preservation = strategy === "PARTIAL_CONTINUATION" ? 0.78 : 0.9;
  const estimated_duration_minutes = Math.round(12 + recovery_cost * 60 + riskNumber * 35);
  const evaluation_score = Number(((recovery_confidence * 0.32) + (replay_consistency * 0.16) + (dependency_stability * 0.12) + (mission_preservation * 0.12) + ((1 - riskNumber) * 0.16) + ((1 - recovery_cost) * 0.12)).toFixed(4));
  const base = { evaluation_id: id("RPEV", "recovery-plan-evaluation", { planning_id, strategy }), recovery_confidence, recovery_cost, governance_impact, replay_consistency, operational_risk, mission_preservation, dependency_stability, estimated_duration_minutes, evaluation_score };
  return Object.freeze({ ...base, evaluation_hash: hashValue("recovery-plan-evaluation", base) });
}

function makePlan(strategy: RecoveryStrategyType, planning_id: string, analysis: FailureAnalysisObject, failures: readonly RecoveryPlanningFailure[]): RecoveryPlan {
  const evaluation = evaluatePlan(strategy, planning_id, analysis, failures);
  const governance_validation: RecoveryValidationStatus = failures.includes("GOVERNANCE_MUTATION_DETECTED") || analysis.governance_status !== "COMPLIANT" ? "INVALID" : "VALID";
  const authority_validation: RecoveryValidationStatus = failures.includes("AUTHORITY_ESCALATION_DETECTED") || analysis.authority_status !== "VALID" ? "INVALID" : "VALID";
  const constitutional_validation: RecoveryValidationStatus = analysis.failure_category === "GOVERNANCE_VIOLATION" || failures.includes("GOVERNANCE_MUTATION_DETECTED") ? "INVALID" : "VALID";
  const confidence_score = evaluation.recovery_confidence;
  const recovery_plan_id = id("RPP", "recovery-plan-id", { planning_id, strategy });
  const base = {
    recovery_plan_id,
    recovery_id: analysis.recovery_id,
    strategy_type: strategy,
    lifecycle_state: governance_validation === "VALID" && authority_validation === "VALID" && confidence_score >= 0.65 ? "READY_FOR_OPERATOR" as const : "GOVERNANCE_REVIEW" as const,
    failure_reference: analysis.analysis_id,
    objectives: freezeArray(["Preserve approved mission intent", "Minimize operational disruption", "Maintain governance compliance", "Prepare operator-approved recovery path"]),
    recovery_steps: stepsFor(strategy),
    dependencies: freezeArray(analysis.dependency_graph.nodes.map((node) => node.dependency_reference)),
    rollback_reference: strategy === "ROLLBACK" ? `rollback:${analysis.recovery_id}:latest-valid-checkpoint` : null,
    checkpoint_reference: strategy === "CHECKPOINT_RECOVERY" || strategy === "ROLLBACK" ? `checkpoint:${analysis.recovery_id}:verified` : null,
    governance_requirements: freezeArray(["constitutional compliance", "policy compliance", "audit evidence", "operator approval"]),
    authority_requirements: freezeArray(["tenant ownership", "mission authorization", "execution permission boundary", "recovery authorization"]),
    confidence_score,
    confidence_level: confidenceLevel(confidence_score),
    operational_risk: evaluation.operational_risk,
    estimated_duration: `PT${evaluation.estimated_duration_minutes}M`,
    replay_reference: `replay:${recovery_plan_id}`,
    lineage_reference: `lineage:${recovery_plan_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-plan-integrity", { recovery_plan_id, strategy, evaluation: evaluation.evaluation_hash }),
    governance_validation,
    constitutional_validation,
    authority_validation,
    operator_approval_required: true as const,
    execution_authorized: false as const,
    evaluation,
    rank: 0,
  };
  return Object.freeze({ ...base, plan_hash: hashValue("recovery-plan", base) });
}

function stepsFor(strategy: RecoveryStrategyType): readonly string[] {
  const map: Record<RecoveryStrategyType, readonly string[]> = {
    ROLLBACK: ["Verify latest checkpoint integrity", "Prepare rollback boundary", "Validate replay reconstruction", "Submit rollback package for operator approval"],
    RESTART: ["Select validated restart point", "Verify restart prerequisites", "Rebuild execution sequence", "Submit restart package for operator approval"],
    CHECKPOINT_RECOVERY: ["Select immutable checkpoint", "Verify checkpoint hash", "Prepare restoration sequence", "Submit checkpoint package for operator approval"],
    STAGED_RECOVERY: ["Recover infrastructure stage", "Recover dependency stage", "Recover orchestration stage", "Validate supervision stage", "Submit staged package for operator approval"],
    DEPENDENCY_REPAIR: ["Identify failed dependencies", "Order dependency repair", "Validate dependency graph", "Submit dependency repair package for operator approval"],
    ALTERNATIVE_EXECUTION_PATH: ["Preserve mission intent", "Generate alternative workflow", "Validate rerouted dependencies", "Submit alternative path for operator approval"],
    PARTIAL_CONTINUATION: ["Isolate failed component", "Identify executable components", "Defer blocked tasks", "Submit partial continuation package for operator approval"],
  };
  return freezeArray(map[strategy]);
}

function rankPlans(plans: readonly RecoveryPlan[]): readonly RecoveryPlan[] {
  const ranked = [...plans].sort((a, b) => {
    const governanceDelta = Number(b.governance_validation === "VALID") - Number(a.governance_validation === "VALID");
    if (governanceDelta) return governanceDelta;
    const constitutionalDelta = Number(b.constitutional_validation === "VALID") - Number(a.constitutional_validation === "VALID");
    if (constitutionalDelta) return constitutionalDelta;
    const replayDelta = b.evaluation.replay_consistency - a.evaluation.replay_consistency;
    if (replayDelta) return replayDelta;
    const scoreDelta = b.evaluation.evaluation_score - a.evaluation.evaluation_score;
    if (scoreDelta) return scoreDelta;
    const durationDelta = a.evaluation.estimated_duration_minutes - b.evaluation.estimated_duration_minutes;
    if (durationDelta) return durationDelta;
    return a.strategy_type.localeCompare(b.strategy_type);
  });
  return freezeArray(ranked.map((plan, index) => Object.freeze({ ...plan, rank: index + 1, plan_hash: hashValue("recovery-plan", { ...plan, rank: index + 1, plan_hash: undefined }) })));
}

export function computeRecoveryPlanningPackageHash(pkg: Omit<RecoveryPlanningPackage, "package_hash"> | RecoveryPlanningPackage): string {
  const { package_hash: _hash, ...source } = pkg as RecoveryPlanningPackage;
  return hashValue("recovery-planning-package", source);
}

export function generateRecoveryPlans(input: RecoveryPlanningInput = {}): RecoveryPlanningPackage {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const analysis = input.failure_analysis ?? analyzeFailure({ scenario: scenarioToFailureScenario(scenario), tenant_id: scenario === "TENANT_ISOLATION_FAILURE" ? "external-tenant" : input.tenant_id, mission_id: input.mission_id, execution_id: input.execution_id });
  const planning_id = id("RPL", "recovery-planning-id", { scenario, analysis: analysis.analysis_hash });
  const generatedStrategies = failures.includes("HIDDEN_ALTERNATIVES_DETECTED") ? strategyTypes.slice(0, 3) : strategyTypes;
  const plans = rankPlans(generatedStrategies.map((strategy) => makePlan(strategy, planning_id, analysis, failures)));
  const selected_plan = plans[0];
  const replayChecksum = failures.includes("REPLAY_INVALID") ? "mismatch" : hashValue("recovery-planning-replay-checksum", { planning_id, plans: plans.map((plan) => plan.plan_hash), selected: selected_plan.recovery_plan_id });
  const repositoryBase = {
    repository_id: id("RPR", "recovery-plan-repository", planning_id),
    recovery_id: analysis.recovery_id,
    analysis_id: analysis.analysis_id,
    tenant_id: analysis.tenant_id,
    plan_ids: freezeArray(plans.map((plan) => plan.recovery_plan_id)),
    selected_plan_id: selected_plan.recovery_plan_id,
    append_only: true as const,
    version: REPOSITORY_VERSION,
    lineage_reference: `lineage:${planning_id}`,
    governance_evidence: freezeArray(plans.map((plan) => plan.governance_validation)),
    authority_evidence: freezeArray(plans.map((plan) => plan.authority_validation)),
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-plan-repository-integrity", { planning_id, plans: plans.map((plan) => plan.plan_hash) }),
  };
  const replayBase = {
    replay_reference: `replay:${planning_id}`,
    replay_version: REPLAY_VERSION,
    recovery_inputs: hashValue("recovery-planning-inputs", { scenario, analysis: analysis.analysis_hash }),
    planning_decisions: hashValue("recovery-planning-decisions", plans.map((plan) => plan.strategy_type)),
    strategy_generation: hashValue("recovery-planning-strategy-generation", plans.map((plan) => plan.plan_hash)),
    dependency_analysis: analysis.dependency_graph.graph_hash,
    confidence_calculations: hashValue("recovery-planning-confidence-calculations", plans.map((plan) => plan.evaluation.evaluation_hash)),
    governance_validation: hashValue("recovery-planning-governance-validation", plans.map((plan) => plan.governance_validation)),
    authority_validation: hashValue("recovery-planning-authority-validation", plans.map((plan) => plan.authority_validation)),
    evaluation_results: hashValue("recovery-planning-evaluation-results", plans.map((plan) => plan.evaluation.evaluation_hash)),
    replay_checksum: replayChecksum,
  };
  const base = {
    planning_id,
    recovery_id: analysis.recovery_id,
    analysis_id: analysis.analysis_id,
    mission_id: analysis.mission_id,
    execution_id: analysis.execution_id,
    tenant_id: analysis.tenant_id,
    source_failure_analysis: analysis,
    plans,
    selected_plan,
    ranking_factors: rankingFactors,
    governance_status: failures.includes("GOVERNANCE_MUTATION_DETECTED") || analysis.governance_status !== "COMPLIANT" ? "BLOCKED" as const : "COMPLIANT" as const,
    constitutional_status: analysis.failure_category === "GOVERNANCE_VIOLATION" || failures.includes("GOVERNANCE_MUTATION_DETECTED") ? "VIOLATION" as const : "COMPLIANT" as const,
    authority_status: failures.includes("AUTHORITY_ESCALATION_DETECTED") || analysis.authority_status !== "VALID" ? "INVALID" as const : "VALID" as const,
    replay: Object.freeze({ ...replayBase, replay_hash: hashValue("recovery-planning-replay", replayBase) }),
    repository: Object.freeze({ ...repositoryBase, repository_hash: hashValue("recovery-plan-repository", repositoryBase) }),
    advisory_only: true as const,
    recovery_executed: scenario === "AUTONOMOUS_EXECUTION_ATTEMPT" || scenario === "AUTONOMOUS_RECOVERY_ATTEMPT",
    rollback_performed: scenario === "ROLLBACK_EXECUTION_ATTEMPT",
    restart_performed: scenario === "RESTART_EXECUTION_ATTEMPT",
    checkpoint_restored: scenario === "CHECKPOINT_RESTORE_ATTEMPT",
    governance_modified: scenario === "GOVERNANCE_MUTATION_ATTEMPT",
    authority_escalated: scenario === "AUTHORITY_ESCALATION_ATTEMPT",
    alternatives_hidden: scenario === "HIDDEN_ALTERNATIVES" || scenario === "HIDDEN_RUNTIME_STATE",
  };
  return Object.freeze({ ...base, package_hash: computeRecoveryPlanningPackageHash(base as Omit<RecoveryPlanningPackage, "package_hash">) });
}

export function validateRecoveryPlanningPackage(pkg?: RecoveryPlanningPackage): RecoveryPlanningValidationResult {
  if (!pkg) {
    const failures = freezeArray<RecoveryPlanningFailure>(["PLAN_SCHEMA_INVALID"]);
    const source = { planning_id: null, valid: false, strategies_complete: false, plans_valid: false, evaluations_valid: false, ranking_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, replay_valid: false, lineage_valid: false, integrity_valid: false, confidence_valid: false, tenant_isolated: false, operator_approval_required: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("recovery-planning-validation", source) });
  }
  const strategies_complete = strategyTypes.every((strategy) => pkg.plans.some((plan) => plan.strategy_type === strategy));
  const plans_valid = pkg.plans.length > 0 && pkg.plans.every((plan) => plan.recovery_plan_id && plan.recovery_steps.length && plan.dependencies.length && plan.operator_approval_required && !plan.execution_authorized);
  const evaluations_valid = pkg.plans.every((plan) => plan.evaluation.evaluation_score > 0 && plan.evaluation.replay_consistency >= 0.65);
  const ranking_valid = pkg.plans.every((plan, index) => plan.rank === index + 1) && pkg.selected_plan.rank === 1 && pkg.selected_plan.recovery_plan_id === pkg.plans[0].recovery_plan_id;
  const governance_valid = pkg.governance_status === "COMPLIANT" && pkg.plans.every((plan) => plan.governance_validation === "VALID") && !pkg.governance_modified;
  const constitutional_valid = pkg.constitutional_status === "COMPLIANT" && pkg.plans.every((plan) => plan.constitutional_validation === "VALID");
  const authority_valid = pkg.authority_status === "VALID" && pkg.plans.every((plan) => plan.authority_validation === "VALID") && !pkg.authority_escalated;
  const replay_valid = pkg.replay.replay_checksum !== "mismatch" && validateFailureAnalysis(pkg.source_failure_analysis).replay_valid;
  const lineage_valid = Boolean(pkg.repository.lineage_reference && pkg.repository.plan_ids.length === pkg.plans.length);
  const integrity_valid = Boolean(pkg.repository.integrity_hash) && pkg.plans.every((plan) => plan.integrity_hash);
  const confidence_valid = pkg.selected_plan.confidence_score >= 0.65 && pkg.selected_plan.confidence_level !== "LOW" && pkg.selected_plan.confidence_level !== "INSUFFICIENT";
  const tenant_isolated = pkg.tenant_id === TENANT_ID || pkg.tenant_id.startsWith("tenant:");
  const operator_approval_required = pkg.plans.every((plan) => plan.operator_approval_required) && pkg.selected_plan.lifecycle_state === "READY_FOR_OPERATOR";
  const advisory_only = pkg.advisory_only && !pkg.recovery_executed && !pkg.rollback_performed && !pkg.restart_performed && !pkg.checkpoint_restored && !pkg.governance_modified && !pkg.authority_escalated && !pkg.alternatives_hidden;
  const immutable_hash_valid = computeRecoveryPlanningPackageHash(pkg) === pkg.package_hash;
  const failures = unique([
    ...(!strategies_complete ? ["STRATEGY_GENERATION_INVALID" as const] : []),
    ...(!plans_valid ? ["PLAN_SCHEMA_INVALID" as const] : []),
    ...(!evaluations_valid ? ["EVALUATION_INVALID" as const] : []),
    ...(!ranking_valid ? ["RANKING_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!lineage_valid ? ["LINEAGE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!confidence_valid ? ["CONFIDENCE_INSUFFICIENT" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(pkg.recovery_executed ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(pkg.rollback_performed ? ["ROLLBACK_EXECUTION_DETECTED" as const] : []),
    ...(pkg.restart_performed ? ["RESTART_EXECUTION_DETECTED" as const] : []),
    ...(pkg.checkpoint_restored ? ["CHECKPOINT_RESTORE_DETECTED" as const] : []),
    ...(pkg.governance_modified ? ["GOVERNANCE_MUTATION_DETECTED" as const] : []),
    ...(pkg.authority_escalated ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(pkg.alternatives_hidden ? ["HIDDEN_ALTERNATIVES_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { planning_id: pkg.planning_id, valid, strategies_complete, plans_valid, evaluations_valid, ranking_valid, governance_valid, constitutional_valid, authority_valid, replay_valid, lineage_valid, integrity_valid, confidence_valid, tenant_isolated, operator_approval_required, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-planning-validation", source) });
}

export function replayRecoveryPlanningPackage(pkg = generateRecoveryPlans()): RecoveryPlanningReplayResult {
  const reconstructed_hash = computeRecoveryPlanningPackageHash(pkg);
  const deterministic = reconstructed_hash === pkg.package_hash && pkg.replay.replay_checksum !== "mismatch";
  const source = { replay_reference: pkg.replay.replay_reference, planning_id: pkg.planning_id, deterministic, reconstructed_hash, original_hash: pkg.package_hash, replay_checksum: pkg.replay.replay_checksum };
  return Object.freeze({ ...source, replay_result_hash: hashValue("recovery-planning-replay-result", source) });
}

export function buildRecoveryPlanningObservabilitySurface(pkg = generateRecoveryPlans()): RecoveryPlanningObservabilitySurface {
  const validation = validateRecoveryPlanningPackage(pkg);
  return Object.freeze({
    planning_id: pkg.planning_id,
    recovery_id: pkg.recovery_id,
    analysis_id: pkg.analysis_id,
    selected_strategy: pkg.selected_plan.strategy_type,
    plan_count: pkg.plans.length,
    selected_rank: pkg.selected_plan.rank,
    selected_confidence: pkg.selected_plan.confidence_level,
    selected_risk: pkg.selected_plan.operational_risk,
    governance_status: pkg.governance_status,
    authority_status: pkg.authority_status,
    replay_valid: validation.replay_valid,
    tenant_id: pkg.tenant_id,
    advisory_only: true,
    package_hash: pkg.package_hash,
  });
}

export function getRecoveryPlanningEngineContract(): RecoveryPlanningEngineContract {
  const planning_package = generateRecoveryPlans();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-planning", "advisory-only", "governance-first", "constitutional-compliance", "replay-reproducibility", "explainable-planning", "operator-supremacy", "tenant-isolated", "integrity-preserving", "fail-closed"]),
      strategy_types: strategyTypes,
      lifecycle_states: lifecycleStates,
      confidence_levels: confidenceLevels,
      risk_levels: riskLevels,
      ranking_factors: rankingFactors,
      advisory_only: true,
      operator_approval_required: true,
    }),
    planning_package,
    validation: validateRecoveryPlanningPackage(planning_package),
    replay: replayRecoveryPlanningPackage(planning_package),
    observability: buildRecoveryPlanningObservabilitySurface(planning_package),
  });
}
