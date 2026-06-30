import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan, validateOptimizedPlan } from "@/services/planning-optimization";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { OptimizedPlanPackage } from "@/types/planning-optimization";
import type {
  AlternativeComparisonRow,
  AlternativeDimensionRating,
  AlternativePlan,
  AlternativePlanningCertificationState,
  AlternativePlanningConstraint,
  AlternativePlanningFailureReason,
  AlternativePlanningFramework,
  AlternativePlanningIntake,
  AlternativePlanningPackage,
  AlternativePlanningReplayResult,
  AlternativePlanningScenario,
  AlternativePlanningValidationResult,
  AlternativePlanningVisibilitySurface,
  AlternativeRecommendationEvidence,
  AlternativeStrategyType,
  AlternativeTradeoffAnalysis,
} from "@/types/alternative-planning";

const NOW = "2026-06-29T06:00:00.000Z";
const STANDARD_STRATEGIES: readonly AlternativeStrategyType[] = Object.freeze(["PREFERRED", "CONSERVATIVE", "LOW_RISK", "HIGH_RELIABILITY", "OPERATOR_CONTROLLED"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly AlternativePlanningFailureReason[]): readonly AlternativePlanningFailureReason[] {
  return freezeArray([...new Set(values)]);
}

export function buildAlternativePlanningIntake(identity = generateAutonomyIdentity(), optimizedPlan = optimizePlan(identity, decomposeObjective(identity), analyzeDependencies(identity, decomposeObjective(identity))), graph = analyzeDependencies(identity, decomposeObjective(identity)), scenario: AlternativePlanningScenario = "BASELINE"): AlternativePlanningIntake {
  const optimizedValidation = validateOptimizedPlan(identity, optimizedPlan, graph);
  const failures: AlternativePlanningFailureReason[] = [];
  if (optimizedValidation.certification_state === "FAIL" || scenario === "UNCERTIFIED_OPTIMIZED_PLAN") failures.push("UNCERTIFIED_OPTIMIZED_PLAN");
  if (scenario === "MISSING_METADATA") failures.push("INCOMPLETE_PLANNING_METADATA");
  if (scenario === "INVALID_REPLAY_REFERENCE") failures.push("INVALID_REPLAY_REFERENCE");
  if (scenario === "MISSING_GOVERNANCE") failures.push("MISSING_GOVERNANCE_CONSTRAINTS");
  if (scenario === "INCONSISTENT_LINEAGE") failures.push("INCONSISTENT_LINEAGE");
  const governance = scenario === "MISSING_GOVERNANCE" ? freezeArray<string>([]) : freezeArray(optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.policy_refs));
  const replayReference = scenario === "INVALID_REPLAY_REFERENCE" ? "" : optimizedPlan.replay_model.evidence_refs[0] ?? "";
  const lineageReference = scenario === "INCONSISTENT_LINEAGE" ? "lineage:mismatch" : optimizedPlan.replay_model.lineage_refs[0] ?? "";
  const source = {
    alternative_intake_id: id("API", "alternative-planning-intake-id", { plan: optimizedPlan.optimized_plan_id, scenario }),
    optimized_plan_id: optimizedPlan.optimized_plan_id,
    dependency_graph_id: graph.dependency_graph_id,
    objective_id: optimizedPlan.objective_id,
    mission_id: optimizedPlan.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : optimizedPlan.tenant_id,
    optimized_plan: optimizedPlan,
    dependency_graph: graph,
    governance_constraints: governance,
    authority_requirements: freezeArray(optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.authority_refs)),
    replay_reference: replayReference,
    lineage_reference: lineageReference,
    intake_valid: failures.length === 0,
    intake_failures: uniqueFailures(failures),
  };
  return Object.freeze({ ...source, intake_hash: hashValue("alternative-planning-intake", source) });
}

export function loadAlternativePlanningConstraints(intake: AlternativePlanningIntake, scenario: AlternativePlanningScenario = "BASELINE"): readonly AlternativePlanningConstraint[] {
  const constraints: AlternativePlanningConstraint[] = [
    constraint("optimized plan certified", intake.optimized_plan.certification_state !== "FAIL" && scenario !== "UNCERTIFIED_OPTIMIZED_PLAN", "UNCERTIFIED_OPTIMIZED_PLAN"),
    constraint("planning metadata complete", Boolean(intake.objective_id && intake.mission_id && intake.tenant_id) && scenario !== "MISSING_METADATA", "INCOMPLETE_PLANNING_METADATA"),
    constraint("replay reference valid", Boolean(intake.replay_reference) && scenario !== "INVALID_REPLAY_REFERENCE", "INVALID_REPLAY_REFERENCE"),
    constraint("governance constraints present", intake.governance_constraints.length > 0 && scenario !== "MISSING_GOVERNANCE", "MISSING_GOVERNANCE_CONSTRAINTS"),
    constraint("lineage consistent", intake.lineage_reference.startsWith("lineage:") && scenario !== "INCONSISTENT_LINEAGE", "INCONSISTENT_LINEAGE"),
    constraint("tenant isolation preserved", intake.tenant_id === intake.optimized_plan.tenant_id && scenario !== "TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"),
  ];
  return freezeArray(constraints);
}

function constraint(name: string, satisfied: boolean, failure: AlternativePlanningFailureReason): AlternativePlanningConstraint {
  return Object.freeze({
    constraint_id: id("APC", "alternative-planning-constraint-id", { name, failure }),
    name,
    required: true,
    satisfied,
    failure_reason: satisfied ? null : failure,
  });
}

function strategyDescription(strategy: AlternativeStrategyType): string {
  const descriptions: Record<AlternativeStrategyType, string> = {
    PREFERRED: "Balanced advisory strategy preserving efficiency, governance, replay fidelity, safety, and operator visibility.",
    CONSERVATIVE: "Caution-first advisory strategy with stronger verification, governance checkpoints, rollback readiness, and review.",
    LOW_RISK: "Risk-minimizing advisory strategy with staged execution, reduced concurrency, and frequent validation.",
    HIGH_RELIABILITY: "Resilience-first advisory strategy with redundant checks, recovery readiness, and dependency robustness.",
    OPERATOR_CONTROLLED: "Operator-supervised advisory strategy emphasizing approvals, intervention windows, and transparency.",
  };
  return descriptions[strategy];
}

function dimension(strategy: AlternativeStrategyType, dimensionName: string): AlternativeDimensionRating {
  const values: Record<AlternativeStrategyType, Record<string, AlternativeDimensionRating>> = {
    PREFERRED: { speed: "HIGH", governance: "HIGH", risk: "LOW", resources: "BALANCED", reliability: "HIGH", operator: "MODERATE", replay: "HIGH", recovery: "HIGH" },
    CONSERVATIVE: { speed: "MEDIUM", governance: "VERY_HIGH", risk: "VERY_LOW", resources: "MODERATE", reliability: "HIGH", operator: "HIGH", replay: "HIGH", recovery: "VERY_HIGH" },
    LOW_RISK: { speed: "MEDIUM", governance: "VERY_HIGH", risk: "LOWEST", resources: "MODERATE", reliability: "HIGH", operator: "HIGH", replay: "HIGH", recovery: "VERY_HIGH" },
    HIGH_RELIABILITY: { speed: "MEDIUM", governance: "VERY_HIGH", risk: "VERY_LOW", resources: "HIGHEST", reliability: "HIGHEST", operator: "MODERATE", replay: "HIGH", recovery: "HIGHEST" },
    OPERATOR_CONTROLLED: { speed: "LOW", governance: "VERY_HIGH", risk: "LOW", resources: "MODERATE", reliability: "HIGH", operator: "HIGHEST", replay: "HIGH", recovery: "HIGH" },
  };
  return values[strategy]?.[dimensionName] ?? "MEDIUM";
}

function buildAlternativePlan(intake: AlternativePlanningIntake, strategy: AlternativeStrategyType, scenario: AlternativePlanningScenario): AlternativePlan {
  const order = intake.optimized_plan.execution_order;
  const parallelGroups = strategy === "LOW_RISK" || strategy === "OPERATOR_CONTROLLED"
    ? freezeArray(order.map((step, index) => Object.freeze({
      group_id: id("APG", "alternative-serial-group-id", { strategy, task: step.task_id, index }),
      tasks: freezeArray([step.task_id]),
      safety_validation: "PASS" as const,
      resource_validation: "PASS" as const,
      governance_validation: "PASS" as const,
    })))
    : intake.optimized_plan.parallel_groups;
  const checkpointMultiplier = strategy === "CONSERVATIVE" || strategy === "OPERATOR_CONTROLLED" ? 2 : 1;
  const governanceCheckpoints = scenario === "GOVERNANCE_VIOLATION" && strategy === "PREFERRED"
    ? freezeArray([])
    : freezeArray(Array.from({ length: checkpointMultiplier }).flatMap((_, copyIndex) => intake.optimized_plan.governance_checkpoints.map((checkpoint) => Object.freeze({
      ...checkpoint,
      checkpoint_id: copyIndex === 0 ? checkpoint.checkpoint_id : id("APGC", "alternative-governance-checkpoint-id", { strategy, checkpoint: checkpoint.checkpoint_id, copyIndex }),
    }))));
  const evidence = scenario === "EVIDENCE_MISSING" && strategy === "PREFERRED" ? freezeArray<string>([]) : freezeArray([
    `evidence:${intake.optimized_plan_id}:${strategy}:governance`,
    `evidence:${intake.optimized_plan_id}:${strategy}:replay`,
    `evidence:${intake.optimized_plan_id}:${strategy}:tradeoff`,
  ]);
  const tradeoffs = scenario === "TRADEOFFS_UNDOCUMENTED" && strategy === "PREFERRED" ? freezeArray<string>([]) : freezeArray([
    `${strategy} changes execution characteristics without changing dependency validity.`,
    `${strategy} preserves governance and replay while shifting speed, risk, resources, or operator workload.`,
  ]);
  const rationale = scenario === "RATIONALE_INCOMPLETE" && strategy === "PREFERRED" ? "" : `${strategy} exists to give operators a distinct advisory option for ${strategyDescription(strategy).toLowerCase()}`;
  const tenantId = scenario === "TENANT_VIOLATION" && strategy === "PREFERRED" ? "tenant_beta" : intake.tenant_id;
  const base = {
    alternative_plan_id: id("AP", "alternative-plan-id", { optimizedPlan: intake.optimized_plan_id, strategy, scenario }),
    strategy_type: strategy,
    objective_id: intake.objective_id,
    mission_id: intake.mission_id,
    tenant_id: tenantId,
    description: strategyDescription(strategy),
    execution_plan: `${strategy} advisory plan for ${intake.optimized_plan_id}`,
    execution_order: order,
    parallel_groups: scenario === "REPLAY_DIVERGENCE" && strategy === "PREFERRED" ? freezeArray([...parallelGroups].reverse()) : parallelGroups,
    resource_plan: strategy === "HIGH_RELIABILITY"
      ? freezeArray([...intake.optimized_plan.resource_allocation, ...intake.optimized_plan.resource_allocation.map((resource) => Object.freeze({ ...resource, resource_id: `${resource.resource_id}-redundant` }))])
      : intake.optimized_plan.resource_allocation,
    governance_checkpoints: governanceCheckpoints,
    authority_requirements: intake.authority_requirements,
    risk_profile: Object.freeze({
      operational_risk: dimension(strategy, "risk"),
      mission_risk: dimension(strategy, "risk"),
      governance_risk: "LOW",
      replay_risk: "LOW",
    }),
    reliability_profile: Object.freeze({
      reliability: dimension(strategy, "reliability"),
      recovery_readiness: dimension(strategy, "recovery"),
      fault_tolerance: strategy === "HIGH_RELIABILITY" ? "HIGHEST" as const : "HIGH" as const,
    }),
    operator_checkpoints: freezeArray(governanceCheckpoints.map((checkpoint) => checkpoint.checkpoint_id)),
    estimated_duration: strategy === "PREFERRED" ? "standard" : strategy === "OPERATOR_CONTROLLED" ? "longest" : "extended",
    resource_consumption: dimension(strategy, "resources"),
    advantages: freezeArray([`Optimizes ${strategy.toLowerCase().replace(/_/g, " ")} planning characteristics.`, "Preserves advisory-only operator decision authority."]),
    tradeoffs,
    selection_guidance: `Select ${strategy} when its speed, risk, reliability, resource, and operator involvement profile best fits the mission context.`,
    rationale,
    supporting_evidence: evidence,
    confidence_score: strategy === "PREFERRED" ? 0.91 : strategy === "HIGH_RELIABILITY" ? 0.89 : 0.87,
    replay_reference: scenario === "REPLAY_DIVERGENCE" && strategy === "PREFERRED" ? "replay:divergent" : intake.replay_reference,
    lineage_reference: intake.lineage_reference,
    hidden_execution_paths: scenario === "HIDDEN_EXECUTION_PATH" && strategy === "PREFERRED",
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeAlternativePlanHash(base) });
}

export function computeAlternativePlanHash(plan: Omit<AlternativePlan, "integrity_hash"> | AlternativePlan): string {
  return hashValue("alternative-plan", {
    alternative_plan_id: plan.alternative_plan_id,
    strategy_type: plan.strategy_type,
    objective_id: plan.objective_id,
    mission_id: plan.mission_id,
    tenant_id: plan.tenant_id,
    execution_order: plan.execution_order.map((step) => step.task_id),
    parallel_groups: plan.parallel_groups.map((group) => group.tasks),
    resource_plan: plan.resource_plan,
    governance_checkpoints: plan.governance_checkpoints,
    tradeoffs: plan.tradeoffs,
    rationale: plan.rationale,
    supporting_evidence: plan.supporting_evidence,
    replay_reference: plan.replay_reference,
    lineage_reference: plan.lineage_reference,
    hidden_execution_paths: plan.hidden_execution_paths,
    created_timestamp: plan.created_timestamp,
  });
}

export function generateAlternativeStrategies(intake: AlternativePlanningIntake, scenario: AlternativePlanningScenario = "BASELINE"): readonly AlternativePlan[] {
  const strategies = scenario === "MISSING_STRATEGY" ? STANDARD_STRATEGIES.filter((strategy) => strategy !== "LOW_RISK") : STANDARD_STRATEGIES;
  const plans = strategies.map((strategy) => buildAlternativePlan(intake, strategy, scenario));
  if (scenario === "DUPLICATE_STRATEGY") return freezeArray([...plans, buildAlternativePlan(intake, "PREFERRED", scenario)]);
  if (scenario === "UNSUPPORTED_STRATEGY") return freezeArray([...plans, Object.freeze({ ...buildAlternativePlan(intake, "PREFERRED", scenario), strategy_type: "UNSUPPORTED" as AlternativeStrategyType })]);
  return freezeArray(plans);
}

function buildComparisonMatrix(): readonly AlternativeComparisonRow[] {
  const row = (dimensionName: string, key: string): AlternativeComparisonRow => Object.freeze({
    dimension: dimensionName,
    preferred: dimension("PREFERRED", key),
    conservative: dimension("CONSERVATIVE", key),
    low_risk: dimension("LOW_RISK", key),
    high_reliability: dimension("HIGH_RELIABILITY", key),
    operator_controlled: dimension("OPERATOR_CONTROLLED", key),
  });
  return freezeArray([
    row("Execution Speed", "speed"),
    row("Governance Strength", "governance"),
    row("Operational Risk", "risk"),
    row("Resource Usage", "resources"),
    row("Reliability", "reliability"),
    row("Operator Involvement", "operator"),
    row("Replay Simplicity", "replay"),
    row("Recovery Readiness", "recovery"),
  ]);
}

function buildTradeoffAnalysis(plans: readonly AlternativePlan[]): readonly AlternativeTradeoffAnalysis[] {
  return freezeArray(plans.map((plan) => Object.freeze({
    strategy_type: plan.strategy_type,
    execution_duration: dimension(plan.strategy_type, "speed"),
    resource_consumption: plan.resource_consumption,
    governance_overhead: dimension(plan.strategy_type, "governance"),
    operator_workload: dimension(plan.strategy_type, "operator"),
    mission_risk: plan.risk_profile.mission_risk,
    resilience: plan.reliability_profile.recovery_readiness,
    replay_complexity: "LOW" as const,
    implementation_complexity: plan.strategy_type === "PREFERRED" ? "LOW" as const : "MEDIUM" as const,
  })));
}

function buildRecommendationEvidence(plans: readonly AlternativePlan[], scenario: AlternativePlanningScenario): readonly AlternativeRecommendationEvidence[] {
  return freezeArray(plans.map((plan) => Object.freeze({
    evidence_id: id("APE", "alternative-planning-evidence-id", { plan: plan.alternative_plan_id }),
    strategy_type: plan.strategy_type,
    why_generated: plan.rationale,
    when_to_select: plan.selection_guidance,
    evidence_refs: scenario === "EVIDENCE_MISSING" && plan.strategy_type === "PREFERRED" ? freezeArray<string>([]) : plan.supporting_evidence,
    replay_refs: freezeArray([plan.replay_reference]),
  })));
}

function certify(failures: readonly AlternativePlanningFailureReason[]): AlternativePlanningCertificationState {
  const hardFailures: readonly AlternativePlanningFailureReason[] = ["MISSING_GOVERNANCE_CONSTRAINTS", "GOVERNANCE_VIOLATION", "POLICY_VIOLATION", "CONSTITUTIONAL_VIOLATION", "AUTHORITY_ESCALATION", "TENANT_ISOLATION_VIOLATION", "REPLAY_DIVERGENCE", "UNSTABLE_ORDERING", "HIDDEN_EXECUTION_PATH", "INTEGRITY_HASH_MISMATCH", "REQUIRED_STRATEGY_MISSING", "DUPLICATE_STRATEGY", "UNSUPPORTED_STRATEGY"];
  return failures.some((failure) => hardFailures.includes(failure)) ? "FAIL" : failures.length ? "CONDITIONAL_PASS" : "PASS";
}

function packageHashSource(pkg: Omit<AlternativePlanningPackage, "integrity_hash"> | AlternativePlanningPackage) {
  return {
    alternative_package_id: pkg.alternative_package_id,
    optimized_plan_id: pkg.optimized_plan_id,
    alternatives: pkg.alternatives.map((plan) => ({ id: plan.alternative_plan_id, strategy: plan.strategy_type, hash: plan.integrity_hash })),
    comparison_matrix: pkg.comparison_matrix,
    tradeoff_analysis: pkg.tradeoff_analysis,
    recommendation_evidence: pkg.recommendation_evidence,
    certification_state: pkg.certification_state,
    failure_reasons: pkg.failure_reasons,
    advisory_only: pkg.advisory_only,
    selected_plan_id: pkg.selected_plan_id,
    created_timestamp: pkg.created_timestamp,
  };
}

export function computeAlternativePlanningPackageHash(pkg: Omit<AlternativePlanningPackage, "integrity_hash"> | AlternativePlanningPackage): string {
  return hashValue("alternative-planning-package", packageHashSource(pkg));
}

export function buildAlternativePlanningPackage(identity = generateAutonomyIdentity(), optimizedPlan = optimizePlan(identity, decomposeObjective(identity), analyzeDependencies(identity, decomposeObjective(identity))), graph = analyzeDependencies(identity, decomposeObjective(identity)), scenario: AlternativePlanningScenario = "BASELINE"): AlternativePlanningPackage {
  const intake = buildAlternativePlanningIntake(identity, optimizedPlan, graph, scenario);
  const constraintFailures = loadAlternativePlanningConstraints(intake, scenario).flatMap((item) => item.failure_reason ? [item.failure_reason] : []);
  const alternatives = generateAlternativeStrategies(intake, scenario);
  const failures: AlternativePlanningFailureReason[] = [...constraintFailures, ...intake.intake_failures];
  const strategyTypes = alternatives.map((plan) => plan.strategy_type);
  if (!STANDARD_STRATEGIES.every((strategy) => strategyTypes.includes(strategy))) failures.push("REQUIRED_STRATEGY_MISSING");
  if (new Set(strategyTypes).size !== strategyTypes.length) failures.push("DUPLICATE_STRATEGY");
  if (strategyTypes.some((strategy) => !STANDARD_STRATEGIES.includes(strategy))) failures.push("UNSUPPORTED_STRATEGY");
  if (alternatives.some((plan) => plan.governance_checkpoints.length === 0) || scenario === "GOVERNANCE_VIOLATION") failures.push("GOVERNANCE_VIOLATION");
  if (scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION");
  if (alternatives.some((plan) => plan.tenant_id !== optimizedPlan.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (alternatives.some((plan) => !plan.replay_reference || plan.replay_reference !== intake.replay_reference) || scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE");
  if (alternatives.some((plan) => !plan.rationale)) failures.push("RATIONALE_INCOMPLETE");
  if (alternatives.some((plan) => plan.tradeoffs.length === 0)) failures.push("TRADEOFFS_UNDOCUMENTED");
  if (alternatives.some((plan) => plan.supporting_evidence.length === 0)) failures.push("MISSING_EVIDENCE");
  if (alternatives.some((plan) => plan.hidden_execution_paths)) failures.push("HIDDEN_EXECUTION_PATH");
  if (scenario === "CONDITIONAL_DOCUMENTATION_GAP") failures.push("DOCUMENTATION_GAP");
  if (alternatives.some((plan) => computeAlternativePlanHash(plan) !== plan.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = uniqueFailures(failures);
  const certification = certify(unique);
  const base = {
    alternative_package_id: id("APP", "alternative-planning-package-id", { plan: optimizedPlan.optimized_plan_id, scenario }),
    optimized_plan_id: optimizedPlan.optimized_plan_id,
    objective_id: optimizedPlan.objective_id,
    mission_id: optimizedPlan.mission_id,
    tenant_id: optimizedPlan.tenant_id,
    preferred_plan_id: alternatives.find((plan) => plan.strategy_type === "PREFERRED")?.alternative_plan_id ?? "",
    alternatives,
    comparison_matrix: buildComparisonMatrix(),
    tradeoff_analysis: buildTradeoffAnalysis(alternatives),
    recommendation_evidence: buildRecommendationEvidence(alternatives, scenario),
    certification_state: certification,
    failure_reasons: unique,
    advisory_only: true as const,
    selected_plan_id: null,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeAlternativePlanningPackageHash(base) });
}

export function validateAlternativePlanningPackage(pkg: AlternativePlanningPackage): AlternativePlanningValidationResult {
  const failures: AlternativePlanningFailureReason[] = [...pkg.failure_reasons];
  const strategyTypes = pkg.alternatives.map((plan) => plan.strategy_type);
  if (!STANDARD_STRATEGIES.every((strategy) => strategyTypes.includes(strategy))) failures.push("REQUIRED_STRATEGY_MISSING");
  if (new Set(strategyTypes).size !== strategyTypes.length) failures.push("DUPLICATE_STRATEGY");
  if (strategyTypes.some((strategy) => !STANDARD_STRATEGIES.includes(strategy))) failures.push("UNSUPPORTED_STRATEGY");
  if (pkg.alternatives.some((plan) => plan.governance_checkpoints.length === 0)) failures.push("GOVERNANCE_VIOLATION");
  if (pkg.alternatives.some((plan) => plan.tenant_id !== pkg.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (pkg.alternatives.some((plan) => !plan.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (pkg.alternatives.some((plan) => !plan.rationale)) failures.push("RATIONALE_INCOMPLETE");
  if (pkg.alternatives.some((plan) => plan.tradeoffs.length === 0)) failures.push("TRADEOFFS_UNDOCUMENTED");
  if (pkg.recommendation_evidence.some((item) => item.evidence_refs.length === 0 || item.replay_refs.length === 0)) failures.push("MISSING_EVIDENCE");
  if (pkg.alternatives.some((plan) => plan.hidden_execution_paths)) failures.push("HIDDEN_EXECUTION_PATH");
  if (computeAlternativePlanningPackageHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = uniqueFailures(failures);
  const certification = certify(unique);
  const has = (reason: AlternativePlanningFailureReason) => unique.includes(reason);
  const source = { package: pkg.alternative_package_id, certification, unique };
  return Object.freeze({
    validation_id: id("APV", "alternative-planning-validation-id", source),
    alternative_package_id: pkg.alternative_package_id,
    certification_state: certification,
    failures: unique,
    all_standard_alternatives_generated: !has("REQUIRED_STRATEGY_MISSING") && !has("DUPLICATE_STRATEGY") && !has("UNSUPPORTED_STRATEGY"),
    governance_compliance_preserved: !has("GOVERNANCE_VIOLATION") && !has("POLICY_VIOLATION") && !has("CONSTITUTIONAL_VIOLATION"),
    authority_boundaries_preserved: !has("AUTHORITY_ESCALATION"),
    tenant_isolation_enforced: !has("TENANT_ISOLATION_VIOLATION"),
    deterministic_replay_verified: !has("REPLAY_DIVERGENCE") && !has("UNSTABLE_ORDERING"),
    rationale_complete: !has("RATIONALE_INCOMPLETE"),
    tradeoffs_documented: !has("TRADEOFFS_UNDOCUMENTED"),
    comparison_matrix_generated: pkg.comparison_matrix.length >= 7 && !has("INCONSISTENT_COMPARISON"),
    recommendation_evidence_complete: !has("MISSING_EVIDENCE"),
    advisory_only_enforced: pkg.advisory_only === true && pkg.selected_plan_id === null,
    ready_for_contingency_planning: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("alternative-planning-validation", source),
  });
}

export function replayAlternativePlanningPackage(pkg: AlternativePlanningPackage): AlternativePlanningReplayResult {
  const failures: AlternativePlanningFailureReason[] = [];
  if (computeAlternativePlanningPackageHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (pkg.alternatives.some((plan) => !plan.replay_reference || !plan.lineage_reference)) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("APR", "alternative-planning-replay-id", pkg.alternative_package_id),
    alternative_package_id: pkg.alternative_package_id,
    replay_strategy_order: freezeArray(pkg.alternatives.map((plan) => plan.strategy_type)),
    replay_plan_ids: freezeArray(pkg.alternatives.map((plan) => plan.alternative_plan_id)),
    replay_evidence_refs: freezeArray(pkg.recommendation_evidence.flatMap((item) => item.evidence_refs)),
    validation_state: failures.length ? "FAIL" as const : pkg.certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("alternative-planning-replay", source) });
}

export function buildAlternativePlanningVisibilitySurface(pkg: AlternativePlanningPackage): AlternativePlanningVisibilitySurface {
  const validation = validateAlternativePlanningPackage(pkg);
  return Object.freeze({
    alternative_package_id: pkg.alternative_package_id,
    certification_state: validation.certification_state,
    strategies: freezeArray(pkg.alternatives.map((plan) => plan.strategy_type)),
    preferred_plan_id: pkg.preferred_plan_id,
    comparison_dimensions: freezeArray(pkg.comparison_matrix.map((row) => row.dimension)),
    tradeoff_strategies: freezeArray(pkg.tradeoff_analysis.map((item) => item.strategy_type)),
    rationale_status: validation.rationale_complete ? "COMPLETE" : "INCOMPLETE",
    failure_reasons: validation.failures,
    advisory_only: true,
    selected_plan_id: null,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
    hidden_execution_paths_visible: false,
  });
}

export function getAlternativePlanningFramework(): AlternativePlanningFramework {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const intake = buildAlternativePlanningIntake(identity, optimizedPlan, graph);
  const constraints = loadAlternativePlanningConstraints(intake);
  const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  return Object.freeze({
    identity,
    intake,
    constraints,
    package: pkg,
    validation: validateAlternativePlanningPackage(pkg),
    replay: replayAlternativePlanningPackage(pkg),
    visibility: buildAlternativePlanningVisibilitySurface(pkg),
  });
}
