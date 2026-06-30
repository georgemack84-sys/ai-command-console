import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan, validateOptimizedPlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage, validateAlternativePlanningPackage } from "@/services/alternative-planning";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { OptimizedPlanPackage } from "@/types/planning-optimization";
import type { AlternativePlanningPackage } from "@/types/alternative-planning";
import type {
  ContingencyCertificationState,
  ContingencyFailureReason,
  ContingencyPlan,
  ContingencyPlanningFramework,
  ContingencyPlanningIntake,
  ContingencyPlanningPackage,
  ContingencyPlanningScenario,
  ContingencyReplayResult,
  ContingencyValidationResult,
  ContingencyVisibilitySurface,
  FailureCategory,
  FailureScenario,
  RecoveryDecisionMatrixRow,
  RecoveryEvidencePackage,
  RecoveryPriority,
  RecoveryStrategyType,
} from "@/types/contingency-planning";

const NOW = "2026-06-29T07:00:00.000Z";
const STRATEGIES: readonly RecoveryStrategyType[] = Object.freeze(["ROLLBACK", "RETRY", "OPERATOR_INTERVENTION", "SAFE_STOP", "DEGRADED_EXECUTION"]);
const CATEGORIES: readonly FailureCategory[] = Object.freeze(["PARTIAL_FAILURE", "DEPENDENCY_FAILURE", "GOVERNANCE_FAILURE", "AUTHORITY_LOSS", "ENVIRONMENTAL_CHANGE", "MULTIPLE_FAILURES"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly ContingencyFailureReason[]): readonly ContingencyFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultInputs(identity: AutonomyIdentityRecord) {
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  return { graph, optimizedPlan, alternativePackage };
}

export function buildContingencyIntake(identity = generateAutonomyIdentity(), optimizedPlan?: OptimizedPlanPackage, alternativePackage?: AlternativePlanningPackage, graph?: DependencyGraphPackage, scenario: ContingencyPlanningScenario = "BASELINE"): ContingencyPlanningIntake {
  const inputs = optimizedPlan && alternativePackage && graph ? { optimizedPlan, alternativePackage, graph } : defaultInputs(identity);
  const optValidation = validateOptimizedPlan(identity, inputs.optimizedPlan, inputs.graph);
  const altValidation = validateAlternativePlanningPackage(inputs.alternativePackage);
  const failures: ContingencyFailureReason[] = [];
  if (optValidation.certification_state === "FAIL" || scenario === "UNCERTIFIED_OPTIMIZED_PLAN") failures.push("UNCERTIFIED_OPTIMIZED_PLAN");
  if (altValidation.certification_state === "FAIL" || scenario === "UNCERTIFIED_ALTERNATIVE_PACKAGE") failures.push("UNCERTIFIED_ALTERNATIVE_PACKAGE");
  if (scenario === "MISSING_RECOVERY_METADATA") failures.push("INCOMPLETE_RECOVERY_METADATA");
  if (scenario === "MISSING_GOVERNANCE") failures.push("MISSING_GOVERNANCE_CONSTRAINTS");
  if (scenario === "INVALID_REPLAY_REFERENCE") failures.push("INVALID_REPLAY_REFERENCE");
  if (scenario === "INCONSISTENT_PLANNING_STATE") failures.push("INCONSISTENT_PLANNING_STATE");
  const governance = scenario === "MISSING_GOVERNANCE" ? freezeArray<string>([]) : freezeArray(inputs.optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.policy_refs));
  const replay = scenario === "INVALID_REPLAY_REFERENCE" ? "" : inputs.optimizedPlan.replay_model.evidence_refs[0] ?? "";
  const lineage = scenario === "INCONSISTENT_PLANNING_STATE" ? "lineage:mismatch" : inputs.optimizedPlan.replay_model.lineage_refs[0] ?? "";
  const source = {
    contingency_intake_id: id("CPI", "contingency-intake-id", { plan: inputs.optimizedPlan.optimized_plan_id, alternative: inputs.alternativePackage.alternative_package_id, scenario }),
    optimized_plan_id: inputs.optimizedPlan.optimized_plan_id,
    alternative_package_id: inputs.alternativePackage.alternative_package_id,
    dependency_graph_id: inputs.graph.dependency_graph_id,
    objective_id: inputs.optimizedPlan.objective_id,
    mission_id: inputs.optimizedPlan.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : inputs.optimizedPlan.tenant_id,
    optimized_plan: inputs.optimizedPlan,
    alternative_package: inputs.alternativePackage,
    dependency_graph: inputs.graph,
    governance_constraints: governance,
    authority_requirements: freezeArray(inputs.optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.authority_refs)),
    replay_reference: replay,
    lineage_reference: lineage,
    recovery_metadata_complete: scenario !== "MISSING_RECOVERY_METADATA",
    intake_failures: uniqueFailures(failures),
  };
  return Object.freeze({ ...source, intake_hash: hashValue("contingency-intake", source) });
}

export function analyzeFailureScenarios(intake: ContingencyPlanningIntake): readonly FailureScenario[] {
  const points = intake.optimized_plan.execution_order.map((step) => step.task_id);
  const recommended: Record<FailureCategory, readonly RecoveryStrategyType[]> = {
    PARTIAL_FAILURE: ["RETRY", "ROLLBACK"],
    DEPENDENCY_FAILURE: ["RETRY", "SAFE_STOP"],
    GOVERNANCE_FAILURE: ["OPERATOR_INTERVENTION"],
    AUTHORITY_LOSS: ["OPERATOR_INTERVENTION"],
    ENVIRONMENTAL_CHANGE: ["DEGRADED_EXECUTION", "SAFE_STOP"],
    MULTIPLE_FAILURES: ["ROLLBACK", "OPERATOR_INTERVENTION"],
  };
  const priority: Record<FailureCategory, RecoveryPriority> = {
    PARTIAL_FAILURE: "HIGH",
    DEPENDENCY_FAILURE: "HIGH",
    GOVERNANCE_FAILURE: "CRITICAL",
    AUTHORITY_LOSS: "CRITICAL",
    ENVIRONMENTAL_CHANGE: "MEDIUM",
    MULTIPLE_FAILURES: "CRITICAL",
  };
  return freezeArray(CATEGORIES.map((category, index) => Object.freeze({
    failure_scenario_id: id("CFS", "contingency-failure-scenario-id", { intake: intake.contingency_intake_id, category }),
    failure_category: category,
    likely_failure_points: freezeArray(points.filter((_, taskIndex) => taskIndex % CATEGORIES.length === index || taskIndex === index).slice(0, 2)),
    impact_assessment: priority[category],
    recovery_priority: priority[category],
    recommended_strategies: recommended[category],
    governance_context: intake.governance_constraints,
    evidence_refs: freezeArray([`evidence:${intake.optimized_plan_id}:${category}`]),
  })));
}

function categoryForStrategy(strategy: RecoveryStrategyType): FailureCategory {
  const mapping: Record<RecoveryStrategyType, FailureCategory> = {
    ROLLBACK: "MULTIPLE_FAILURES",
    RETRY: "PARTIAL_FAILURE",
    OPERATOR_INTERVENTION: "GOVERNANCE_FAILURE",
    SAFE_STOP: "DEPENDENCY_FAILURE",
    DEGRADED_EXECUTION: "ENVIRONMENTAL_CHANGE",
  };
  return mapping[strategy];
}

function buildContingencyPlan(intake: ContingencyPlanningIntake, strategy: RecoveryStrategyType, scenario: ContingencyPlanningScenario): ContingencyPlan {
  const failureCategory = categoryForStrategy(strategy);
  const evidence = scenario === "EVIDENCE_CHAIN_BROKEN" && strategy === "ROLLBACK" ? freezeArray<string>([]) : freezeArray([
    `evidence:${intake.optimized_plan_id}:${strategy}:governance`,
    `evidence:${intake.optimized_plan_id}:${strategy}:replay`,
    `evidence:${intake.optimized_plan_id}:${strategy}:recovery`,
  ]);
  const workflow = scenario === "UNRECOVERABLE_STATE" && strategy === "ROLLBACK" ? freezeArray<string>([]) : freezeArray([
    `classify ${failureCategory}`,
    `validate governance before ${strategy}`,
    `prepare ${strategy} recommendation`,
    "await operator approval",
    "preserve replay and evidence",
  ]);
  const triggerConditions = freezeArray([`${failureCategory} detected`, "governance validation required", "operator review required"]);
  const rollbackReference = strategy === "ROLLBACK" && scenario !== "ROLLBACK_IMPOSSIBLE" ? intake.optimized_plan.safety_margins.safe_stop_points[0] ?? intake.optimized_plan_id : null;
  const retryConditions = strategy === "RETRY" && scenario !== "UNSAFE_RETRY" ? freezeArray(["retry_count < 3", "cooldown elapsed", "governance validation passed"]) : freezeArray<string>([]);
  const operatorActions = strategy === "OPERATOR_INTERVENTION" && scenario !== "INCOMPLETE_OPERATOR_GUIDANCE"
    ? freezeArray(["review failure context", "confirm authority", "approve recovery recommendation"])
    : strategy === "OPERATOR_INTERVENTION" ? freezeArray<string>([]) : freezeArray(["review advisory recommendation"]);
  const safeStopSequence = strategy === "SAFE_STOP" && scenario !== "SAFE_STOP_STATE_LOSS"
    ? freezeArray(["pause workflow", "preserve state", "stabilize resources", "notify operator"])
    : strategy === "SAFE_STOP" ? freezeArray<string>([]) : freezeArray(["safe-stop available if recovery degrades"]);
  const degradedProfile = strategy === "DEGRADED_EXECUTION" && scenario !== "DEGRADED_GOVERNANCE_VIOLATION"
    ? freezeArray(["essential objectives only", "non-critical tasks deferred", "governance checks retained"])
    : strategy === "DEGRADED_EXECUTION" ? freezeArray(["governance checks reduced"]) : freezeArray(["degraded execution not primary"]);
  const rationale = scenario === "INCOMPLETE_OPERATOR_GUIDANCE" && strategy === "OPERATOR_INTERVENTION" ? "" : `${strategy} prepares a deterministic advisory recovery path for ${failureCategory}.`;
  const tenantId = scenario === "TENANT_VIOLATION" && strategy === "ROLLBACK" ? "tenant_beta" : intake.tenant_id;
  const base = {
    contingency_plan_id: id("CP", "contingency-plan-id", { intake: intake.contingency_intake_id, strategy, scenario }),
    strategy_type: strategy,
    failure_category: failureCategory,
    objective_id: intake.objective_id,
    mission_id: intake.mission_id,
    tenant_id: tenantId,
    trigger_conditions: triggerConditions,
    recovery_workflow: workflow,
    rollback_reference: strategy === "ROLLBACK" ? rollbackReference : null,
    retry_conditions: retryConditions,
    operator_actions: operatorActions,
    safe_stop_sequence: safeStopSequence,
    degraded_execution_profile: degradedProfile,
    required_authority: intake.authority_requirements,
    governance_requirements: intake.governance_constraints,
    estimated_recovery_time: strategy === "OPERATOR_INTERVENTION" ? "operator-paced" : strategy === "SAFE_STOP" ? "immediate-controlled" : "bounded",
    supporting_evidence: evidence,
    rationale,
    confidence_score: strategy === "ROLLBACK" ? 0.9 : strategy === "RETRY" ? 0.88 : 0.86,
    replay_reference: scenario === "REPLAY_DIVERGENCE" && strategy === "ROLLBACK" ? "" : intake.replay_reference,
    lineage_reference: scenario === "EVIDENCE_CHAIN_BROKEN" && strategy === "ROLLBACK" ? "" : intake.lineage_reference,
    hidden_recovery_logic: scenario === "HIDDEN_RECOVERY_LOGIC" && strategy === "ROLLBACK",
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeContingencyPlanHash(base) });
}

export function computeContingencyPlanHash(plan: Omit<ContingencyPlan, "integrity_hash"> | ContingencyPlan): string {
  return hashValue("contingency-plan", {
    contingency_plan_id: plan.contingency_plan_id,
    strategy_type: plan.strategy_type,
    failure_category: plan.failure_category,
    tenant_id: plan.tenant_id,
    trigger_conditions: plan.trigger_conditions,
    recovery_workflow: plan.recovery_workflow,
    rollback_reference: plan.rollback_reference,
    retry_conditions: plan.retry_conditions,
    operator_actions: plan.operator_actions,
    safe_stop_sequence: plan.safe_stop_sequence,
    degraded_execution_profile: plan.degraded_execution_profile,
    required_authority: plan.required_authority,
    governance_requirements: plan.governance_requirements,
    supporting_evidence: plan.supporting_evidence,
    rationale: plan.rationale,
    replay_reference: plan.replay_reference,
    lineage_reference: plan.lineage_reference,
    hidden_recovery_logic: plan.hidden_recovery_logic,
    created_timestamp: plan.created_timestamp,
  });
}

export function buildRecoveryPlans(intake: ContingencyPlanningIntake, scenario: ContingencyPlanningScenario = "BASELINE"): readonly ContingencyPlan[] {
  const strategies = STRATEGIES.filter((strategy) => {
    if (scenario === "MISSING_ROLLBACK") return strategy !== "ROLLBACK";
    if (scenario === "MISSING_RETRY") return strategy !== "RETRY";
    if (scenario === "MISSING_OPERATOR_INTERVENTION") return strategy !== "OPERATOR_INTERVENTION";
    if (scenario === "MISSING_SAFE_STOP") return strategy !== "SAFE_STOP";
    if (scenario === "MISSING_DEGRADED_EXECUTION") return strategy !== "DEGRADED_EXECUTION";
    return true;
  });
  return freezeArray(strategies.map((strategy) => buildContingencyPlan(intake, strategy, scenario)));
}

export function buildRecoveryDecisionMatrix(): readonly RecoveryDecisionMatrixRow[] {
  const rows: readonly [FailureCategory, readonly RecoveryStrategyType[], string, RecoveryPriority][] = [
    ["PARTIAL_FAILURE", ["RETRY", "ROLLBACK"], "Retry if bounded and valid; rollback if retry cannot preserve integrity.", "HIGH"],
    ["DEPENDENCY_FAILURE", ["RETRY", "SAFE_STOP"], "Retry dependency restoration or safe-stop when prerequisite integrity is uncertain.", "HIGH"],
    ["GOVERNANCE_FAILURE", ["OPERATOR_INTERVENTION"], "Governance failures require operator review and authority confirmation.", "CRITICAL"],
    ["AUTHORITY_LOSS", ["OPERATOR_INTERVENTION"], "Authority loss requires human reassignment or renewed approval.", "CRITICAL"],
    ["ENVIRONMENTAL_CHANGE", ["DEGRADED_EXECUTION", "SAFE_STOP"], "Continue only with governed reduced capability or stop safely.", "MEDIUM"],
    ["MULTIPLE_FAILURES", ["ROLLBACK", "OPERATOR_INTERVENTION"], "Compound failures require rollback plus operator decision support.", "CRITICAL"],
  ];
  return freezeArray(rows.map(([failure_category, recommended_recovery, decision_rationale, recovery_priority]) => Object.freeze({ failure_category, recommended_recovery, decision_rationale, recovery_priority })));
}

function buildEvidencePackages(plans: readonly ContingencyPlan[]): readonly RecoveryEvidencePackage[] {
  return freezeArray(plans.map((plan) => Object.freeze({
    evidence_package_id: id("CEP", "contingency-evidence-package-id", plan.contingency_plan_id),
    plan_id: plan.contingency_plan_id,
    evidence_refs: plan.supporting_evidence,
    replay_refs: freezeArray([plan.replay_reference]),
    lineage_refs: freezeArray([plan.lineage_reference]),
  })));
}

function certify(failures: readonly ContingencyFailureReason[]): ContingencyCertificationState {
  const hard: readonly ContingencyFailureReason[] = [
    "UNCERTIFIED_OPTIMIZED_PLAN",
    "UNCERTIFIED_ALTERNATIVE_PACKAGE",
    "MISSING_GOVERNANCE_CONSTRAINTS",
    "INVALID_REPLAY_REFERENCE",
    "INCONSISTENT_PLANNING_STATE",
    "RECOVERY_STRATEGY_MISSING",
    "ROLLBACK_PATH_UNAVAILABLE",
    "UNSAFE_RETRY_CONDITIONS",
    "SAFE_STOP_STATE_PRESERVATION_FAILED",
    "DEGRADED_EXECUTION_GOVERNANCE_VIOLATION",
    "GOVERNANCE_VIOLATION",
    "AUTHORITY_ESCALATION",
    "TENANT_ISOLATION_VIOLATION",
    "REPLAY_DIVERGENCE",
    "NONDETERMINISTIC_RECOVERY",
    "BROKEN_LINEAGE",
    "HIDDEN_RECOVERY_LOGIC",
    "UNRECOVERABLE_EXECUTION_STATE",
    "INTEGRITY_HASH_MISMATCH",
  ];
  return failures.some((failure) => hard.includes(failure)) ? "FAIL" : failures.length ? "CONDITIONAL_PASS" : "PASS";
}

function packageHashSource(pkg: Omit<ContingencyPlanningPackage, "integrity_hash"> | ContingencyPlanningPackage) {
  return {
    contingency_package_id: pkg.contingency_package_id,
    optimized_plan_id: pkg.optimized_plan_id,
    alternative_package_id: pkg.alternative_package_id,
    failure_scenarios: pkg.failure_scenarios.map((scenario) => scenario.failure_category),
    recovery_plans: pkg.recovery_plans.map((plan) => ({ id: plan.contingency_plan_id, strategy: plan.strategy_type, hash: plan.integrity_hash })),
    decision_matrix: pkg.decision_matrix,
    evidence_packages: pkg.evidence_packages,
    certification_state: pkg.certification_state,
    failure_reasons: pkg.failure_reasons,
    advisory_only: pkg.advisory_only,
    recovery_initiated: pkg.recovery_initiated,
    selected_recovery_plan_id: pkg.selected_recovery_plan_id,
    created_timestamp: pkg.created_timestamp,
  };
}

export function computeContingencyPackageHash(pkg: Omit<ContingencyPlanningPackage, "integrity_hash"> | ContingencyPlanningPackage): string {
  return hashValue("contingency-package", packageHashSource(pkg));
}

export function buildContingencyPlanningPackage(identity = generateAutonomyIdentity(), optimizedPlan?: OptimizedPlanPackage, alternativePackage?: AlternativePlanningPackage, graph?: DependencyGraphPackage, scenario: ContingencyPlanningScenario = "BASELINE"): ContingencyPlanningPackage {
  const inputs = optimizedPlan && alternativePackage && graph ? { optimizedPlan, alternativePackage, graph } : defaultInputs(identity);
  const intake = buildContingencyIntake(identity, inputs.optimizedPlan, inputs.alternativePackage, inputs.graph, scenario);
  const scenarios = analyzeFailureScenarios(intake);
  const plans = buildRecoveryPlans(intake, scenario);
  const failures: ContingencyFailureReason[] = [...intake.intake_failures];
  const planStrategies = plans.map((plan) => plan.strategy_type);
  if (!STRATEGIES.every((strategy) => planStrategies.includes(strategy))) failures.push("RECOVERY_STRATEGY_MISSING");
  if (scenario === "ROLLBACK_IMPOSSIBLE" || plans.some((plan) => plan.strategy_type === "ROLLBACK" && !plan.rollback_reference)) failures.push("ROLLBACK_PATH_UNAVAILABLE");
  if (scenario === "UNSAFE_RETRY" || plans.some((plan) => plan.strategy_type === "RETRY" && plan.retry_conditions.length === 0)) failures.push("UNSAFE_RETRY_CONDITIONS");
  if (plans.some((plan) => plan.strategy_type === "OPERATOR_INTERVENTION" && (plan.operator_actions.length === 0 || !plan.rationale))) failures.push("OPERATOR_GUIDANCE_INCOMPLETE");
  if (scenario === "SAFE_STOP_STATE_LOSS" || plans.some((plan) => plan.strategy_type === "SAFE_STOP" && plan.safe_stop_sequence.length === 0)) failures.push("SAFE_STOP_STATE_PRESERVATION_FAILED");
  if (scenario === "DEGRADED_GOVERNANCE_VIOLATION" || plans.some((plan) => plan.strategy_type === "DEGRADED_EXECUTION" && !plan.degraded_execution_profile.includes("governance checks retained"))) failures.push("DEGRADED_EXECUTION_GOVERNANCE_VIOLATION");
  if (scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION");
  if (plans.some((plan) => plan.tenant_id !== inputs.optimizedPlan.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (plans.some((plan) => !plan.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (plans.some((plan) => plan.supporting_evidence.length === 0)) failures.push("MISSING_EVIDENCE");
  if (plans.some((plan) => !plan.lineage_reference)) failures.push("BROKEN_LINEAGE");
  if (plans.some((plan) => plan.recovery_workflow.length === 0)) failures.push("UNRECOVERABLE_EXECUTION_STATE");
  if (plans.some((plan) => !plan.rationale)) failures.push("RATIONALE_INCOMPLETE");
  if (plans.some((plan) => plan.hidden_recovery_logic)) failures.push("HIDDEN_RECOVERY_LOGIC");
  if (scenario === "CONDITIONAL_REPORTING_GAP") failures.push("REPORTING_GAP");
  if (plans.some((plan) => computeContingencyPlanHash(plan) !== plan.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = uniqueFailures(failures);
  const certification = certify(unique);
  const base = {
    contingency_package_id: id("CPP", "contingency-package-id", { plan: inputs.optimizedPlan.optimized_plan_id, alternative: inputs.alternativePackage.alternative_package_id, scenario }),
    optimized_plan_id: inputs.optimizedPlan.optimized_plan_id,
    alternative_package_id: inputs.alternativePackage.alternative_package_id,
    objective_id: inputs.optimizedPlan.objective_id,
    mission_id: inputs.optimizedPlan.mission_id,
    tenant_id: inputs.optimizedPlan.tenant_id,
    failure_scenarios: scenarios,
    recovery_plans: plans,
    decision_matrix: buildRecoveryDecisionMatrix(),
    evidence_packages: buildEvidencePackages(plans),
    certification_state: certification,
    failure_reasons: unique,
    advisory_only: true as const,
    recovery_initiated: false as const,
    selected_recovery_plan_id: null,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeContingencyPackageHash(base) });
}

export function validateContingencyPlanningPackage(pkg: ContingencyPlanningPackage): ContingencyValidationResult {
  const failures: ContingencyFailureReason[] = [...pkg.failure_reasons];
  const strategies = pkg.recovery_plans.map((plan) => plan.strategy_type);
  if (!STRATEGIES.every((strategy) => strategies.includes(strategy))) failures.push("RECOVERY_STRATEGY_MISSING");
  if (pkg.recovery_plans.some((plan) => plan.tenant_id !== pkg.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (pkg.recovery_plans.some((plan) => !plan.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (pkg.evidence_packages.some((item) => item.evidence_refs.length === 0 || item.replay_refs.some((ref) => !ref))) failures.push("MISSING_EVIDENCE");
  if (pkg.evidence_packages.some((item) => item.lineage_refs.some((ref) => !ref))) failures.push("BROKEN_LINEAGE");
  if (pkg.recovery_plans.some((plan) => plan.hidden_recovery_logic)) failures.push("HIDDEN_RECOVERY_LOGIC");
  if (computeContingencyPackageHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = uniqueFailures(failures);
  const certification = certify(unique);
  const has = (reason: ContingencyFailureReason) => unique.includes(reason);
  const source = { package: pkg.contingency_package_id, certification, unique };
  return Object.freeze({
    validation_id: id("CPV", "contingency-validation-id", source),
    contingency_package_id: pkg.contingency_package_id,
    certification_state: certification,
    failures: unique,
    rollback_plan_generated: strategies.includes("ROLLBACK") && !has("ROLLBACK_PATH_UNAVAILABLE"),
    retry_plan_generated: strategies.includes("RETRY") && !has("UNSAFE_RETRY_CONDITIONS"),
    operator_intervention_plan_generated: strategies.includes("OPERATOR_INTERVENTION") && !has("OPERATOR_GUIDANCE_INCOMPLETE"),
    safe_stop_plan_generated: strategies.includes("SAFE_STOP") && !has("SAFE_STOP_STATE_PRESERVATION_FAILED"),
    degraded_execution_plan_generated: strategies.includes("DEGRADED_EXECUTION") && !has("DEGRADED_EXECUTION_GOVERNANCE_VIOLATION"),
    failure_scenarios_analyzed: pkg.failure_scenarios.length === CATEGORIES.length,
    governance_compliance_preserved: !has("MISSING_GOVERNANCE_CONSTRAINTS") && !has("GOVERNANCE_VIOLATION") && !has("POLICY_VIOLATION") && !has("CONSTITUTIONAL_VIOLATION"),
    replay_determinism_verified: !has("REPLAY_DIVERGENCE") && !has("NONDETERMINISTIC_RECOVERY"),
    authority_boundaries_preserved: !has("AUTHORITY_ESCALATION") && !has("AUTHORITY_VALIDATION_FAILED"),
    tenant_isolation_enforced: !has("TENANT_ISOLATION_VIOLATION"),
    evidence_chain_preserved: !has("MISSING_EVIDENCE") && !has("BROKEN_LINEAGE"),
    advisory_only_enforced: pkg.advisory_only === true && pkg.recovery_initiated === false && pkg.selected_recovery_plan_id === null,
    ready_for_planning_confidence: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("contingency-validation", source),
  });
}

export function replayContingencyPlanningPackage(pkg: ContingencyPlanningPackage): ContingencyReplayResult {
  const failures: ContingencyFailureReason[] = [];
  if (computeContingencyPackageHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (pkg.recovery_plans.some((plan) => !plan.replay_reference || !plan.lineage_reference)) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("CPR", "contingency-replay-id", pkg.contingency_package_id),
    contingency_package_id: pkg.contingency_package_id,
    replay_plan_order: freezeArray(pkg.recovery_plans.map((plan) => plan.strategy_type)),
    replay_scenario_order: freezeArray(pkg.failure_scenarios.map((scenario) => scenario.failure_category)),
    replay_evidence_refs: freezeArray(pkg.evidence_packages.flatMap((item) => item.evidence_refs)),
    validation_state: failures.length ? "FAIL" as const : pkg.certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("contingency-replay", source) });
}

export function buildContingencyVisibilitySurface(pkg: ContingencyPlanningPackage): ContingencyVisibilitySurface {
  const validation = validateContingencyPlanningPackage(pkg);
  return Object.freeze({
    contingency_package_id: pkg.contingency_package_id,
    certification_state: validation.certification_state,
    failure_categories: freezeArray(pkg.failure_scenarios.map((scenario) => scenario.failure_category)),
    recovery_strategies: freezeArray(pkg.recovery_plans.map((plan) => plan.strategy_type)),
    decision_matrix_entries: freezeArray(pkg.decision_matrix.map((row) => `${row.failure_category}:${row.recommended_recovery.join("+")}`)),
    failure_reasons: validation.failures,
    advisory_only: true,
    recovery_initiated: false,
    selected_recovery_plan_id: null,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
    hidden_recovery_logic_visible: false,
  });
}

export function getContingencyPlanningFramework(): ContingencyPlanningFramework {
  const identity = generateAutonomyIdentity();
  const { graph, optimizedPlan, alternativePackage } = defaultInputs(identity);
  const intake = buildContingencyIntake(identity, optimizedPlan, alternativePackage, graph);
  const pkg = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
  return Object.freeze({
    identity,
    intake,
    package: pkg,
    validation: validateContingencyPlanningPackage(pkg),
    replay: replayContingencyPlanningPackage(pkg),
    visibility: buildContingencyVisibilitySurface(pkg),
  });
}
