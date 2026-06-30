import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies, validateDependencyGraph } from "@/services/dependency-analysis";
import { optimizePlan, validateOptimizedPlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage, validateAlternativePlanningPackage } from "@/services/alternative-planning";
import { buildContingencyPlanningPackage, validateContingencyPlanningPackage } from "@/services/contingency-planning";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { ObjectiveHierarchyPackage } from "@/types/objective-decomposition";
import type { OptimizedPlanPackage } from "@/types/planning-optimization";
import type { AlternativePlanningPackage } from "@/types/alternative-planning";
import type { ContingencyPlanningPackage } from "@/types/contingency-planning";
import type {
  ConfidenceFactorName,
  ConfidenceFactorScore,
  PlanningConfidenceAssessment,
  PlanningConfidenceCertificationState,
  PlanningConfidenceClassification,
  PlanningConfidenceFailureReason,
  PlanningConfidenceFramework,
  PlanningConfidenceIntake,
  PlanningConfidenceReplayResult,
  PlanningConfidenceScenario,
  PlanningConfidenceValidationResult,
  PlanningConfidenceVisibilitySurface,
} from "@/types/planning-confidence";

const NOW = "2026-06-29T08:00:00.000Z";
const FACTORS: readonly ConfidenceFactorName[] = Object.freeze([
  "OBJECTIVE_CLARITY",
  "DEPENDENCY_COMPLETENESS",
  "POLICY_CERTAINTY",
  "AUTHORITY_CERTAINTY",
  "HISTORICAL_SUCCESS",
  "REPLAY_CONSISTENCY",
  "RESOURCE_AVAILABILITY",
  "RISK_LEVEL",
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly PlanningConfidenceFailureReason[]): readonly PlanningConfidenceFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultInputs(identity: AutonomyIdentityRecord) {
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  const contingencyPackage = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
  return { hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage };
}

export function buildPlanningConfidenceIntake(
  identity = generateAutonomyIdentity(),
  hierarchy?: ObjectiveHierarchyPackage,
  graph?: DependencyGraphPackage,
  optimizedPlan?: OptimizedPlanPackage,
  alternativePackage?: AlternativePlanningPackage,
  contingencyPackage?: ContingencyPlanningPackage,
  scenario: PlanningConfidenceScenario = "BASELINE",
): PlanningConfidenceIntake {
  const inputs = hierarchy && graph && optimizedPlan && alternativePackage && contingencyPackage
    ? { hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage }
    : defaultInputs(identity);
  const failures: PlanningConfidenceFailureReason[] = [];
  const graphValidation = validateDependencyGraph(identity, inputs.graph, inputs.hierarchy);
  const optValidation = validateOptimizedPlan(identity, inputs.optimizedPlan, inputs.graph);
  const altValidation = validateAlternativePlanningPackage(inputs.alternativePackage);
  const contingencyValidation = validateContingencyPlanningPackage(inputs.contingencyPackage);
  if (scenario === "INCOMPLETE_PLANNING_PACKAGE") failures.push("INCOMPLETE_PLANNING_PACKAGE");
  if ([optValidation.certification_state, altValidation.certification_state, contingencyValidation.certification_state].includes("FAIL") || scenario === "UNCERTIFIED_PLAN") failures.push("UNCERTIFIED_PLAN");
  if (scenario === "MISSING_REPLAY_METADATA") failures.push("MISSING_REPLAY_METADATA");
  if (scenario === "INCONSISTENT_LINEAGE") failures.push("INCONSISTENT_LINEAGE");
  if (scenario === "INVALID_GOVERNANCE_STATE") failures.push("INVALID_GOVERNANCE_STATE");
  if (!graphValidation.ready_for_optimization || scenario === "INVALID_DEPENDENCY_GRAPH") failures.push("DEPENDENCY_GRAPH_INVALID");
  const governance = scenario === "INVALID_GOVERNANCE_STATE" ? freezeArray<string>([]) : freezeArray(inputs.optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.policy_refs));
  const replayReference = scenario === "MISSING_REPLAY_METADATA" ? "" : inputs.optimizedPlan.replay_model.evidence_refs[0] ?? "";
  const lineageReference = scenario === "INCONSISTENT_LINEAGE" ? "" : inputs.optimizedPlan.replay_model.lineage_refs[0] ?? "";
  const source = {
    confidence_intake_id: id("PCI", "planning-confidence-intake-id", { plan: inputs.optimizedPlan.optimized_plan_id, contingency: inputs.contingencyPackage.contingency_package_id, scenario }),
    objective_id: inputs.optimizedPlan.objective_id,
    mission_id: inputs.optimizedPlan.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : inputs.optimizedPlan.tenant_id,
    objective_hierarchy: inputs.hierarchy,
    dependency_graph: inputs.graph,
    optimized_plan: inputs.optimizedPlan,
    alternative_package: inputs.alternativePackage,
    contingency_package: inputs.contingencyPackage,
    governance_constraints: governance,
    authority_requirements: freezeArray(inputs.optimizedPlan.governance_checkpoints.flatMap((checkpoint) => checkpoint.authority_refs)),
    assumptions: scenario === "ASSUMPTIONS_UNSUPPORTED" ? freezeArray<string>([]) : freezeArray(["objective scope stable", "tenant resources available", "governance state current"]),
    replay_reference: replayReference,
    lineage_reference: lineageReference,
    intake_failures: uniqueFailures(failures),
  };
  return Object.freeze({ ...source, intake_hash: hashValue("planning-confidence-intake", source) });
}

function classifyScore(score: number, hardFailure = false): PlanningConfidenceClassification {
  if (hardFailure || score < 50) return "INSUFFICIENT";
  if (score < 70) return "LOW";
  if (score < 86) return "MEDIUM";
  return "HIGH";
}

function factorScore(name: ConfidenceFactorName, score: number, rationale: string, evidence: readonly string[], governance: readonly string[], replay: readonly string[], reductions: readonly PlanningConfidenceFailureReason[]): ConfidenceFactorScore {
  return Object.freeze({
    factor_name: name,
    score,
    classification: classifyScore(score, reductions.some((item) => ["GOVERNANCE_VALIDATION_FAILED", "AUTHORITY_UNCERTAIN", "REPLAY_INCONSISTENCY", "TENANT_ISOLATION_VIOLATION"].includes(item))),
    rationale,
    evidence_refs: freezeArray(evidence),
    governance_refs: freezeArray(governance),
    replay_refs: freezeArray(replay),
    reductions: freezeArray(reductions),
  });
}

export function evaluateConfidenceFactors(intake: PlanningConfidenceIntake, scenario: PlanningConfidenceScenario = "BASELINE"): readonly ConfidenceFactorScore[] {
  const evidenceBase = [`evidence:${intake.objective_id}:planning`, `evidence:${intake.contingency_package.contingency_package_id}:recovery`];
  const governance = intake.governance_constraints;
  const replay = intake.replay_reference ? [intake.replay_reference] : [];
  return freezeArray([
    factorScore("OBJECTIVE_CLARITY", scenario === "AMBIGUOUS_OBJECTIVE" ? 42 : 94, "Objective definition, scope, measurable outcomes, and completion criteria are evaluated.", evidenceBase, governance, replay, scenario === "AMBIGUOUS_OBJECTIVE" ? ["AMBIGUOUS_OBJECTIVE"] : []),
    factorScore("DEPENDENCY_COMPLETENESS", scenario === "INVALID_DEPENDENCY_GRAPH" ? 35 : 93, "Dependency graph integrity, critical path, blockers, and ordering confidence are evaluated.", evidenceBase, governance, replay, scenario === "INVALID_DEPENDENCY_GRAPH" ? ["DEPENDENCY_GRAPH_INVALID"] : []),
    factorScore("POLICY_CERTAINTY", scenario === "GOVERNANCE_FAILURE" || scenario === "INVALID_GOVERNANCE_STATE" ? 20 : 95, "Governance validation, policy consistency, constitutional compliance, and compliance readiness are evaluated.", evidenceBase, governance, replay, scenario === "GOVERNANCE_FAILURE" || scenario === "INVALID_GOVERNANCE_STATE" ? ["GOVERNANCE_VALIDATION_FAILED"] : []),
    factorScore("AUTHORITY_CERTAINTY", scenario === "AUTHORITY_UNCERTAIN" ? 38 : 91, "Authority verification, approval completeness, and delegation validity are evaluated.", evidenceBase, governance, replay, scenario === "AUTHORITY_UNCERTAIN" ? ["AUTHORITY_UNCERTAIN"] : []),
    factorScore("HISTORICAL_SUCCESS", scenario === "LIMITED_HISTORY" ? 64 : 84, "Historical planning quality, replay accuracy, recovery outcomes, and mission similarity are evaluated.", evidenceBase, governance, replay, scenario === "LIMITED_HISTORY" ? ["LIMITED_HISTORICAL_EVIDENCE"] : []),
    factorScore("REPLAY_CONSISTENCY", scenario === "REPLAY_MISMATCH" || scenario === "MISSING_REPLAY_METADATA" ? 25 : 96, "Replay reproducibility, evidence integrity, lineage continuity, and deterministic behavior are evaluated.", evidenceBase, governance, replay, scenario === "REPLAY_MISMATCH" || scenario === "MISSING_REPLAY_METADATA" ? ["REPLAY_INCONSISTENCY"] : []),
    factorScore("RESOURCE_AVAILABILITY", scenario === "RESOURCE_UNAVAILABLE" ? 35 : 88, "Infrastructure readiness, service capacity, tooling availability, and recovery resources are evaluated.", evidenceBase, governance, replay, scenario === "RESOURCE_UNAVAILABLE" ? ["RESOURCE_UNAVAILABLE"] : []),
    factorScore("RISK_LEVEL", scenario === "HIGH_RISK" ? 32 : 89, "Operational, governance, dependency, environmental, and authority risk are evaluated.", evidenceBase, governance, replay, scenario === "HIGH_RISK" ? ["RISK_ABOVE_THRESHOLD"] : []),
  ]);
}

function aggregateClassification(score: number, failures: readonly PlanningConfidenceFailureReason[]): PlanningConfidenceClassification {
  const insufficient: readonly PlanningConfidenceFailureReason[] = [
    "INCOMPLETE_PLANNING_PACKAGE",
    "UNCERTIFIED_PLAN",
    "MISSING_REPLAY_METADATA",
    "INVALID_GOVERNANCE_STATE",
    "DEPENDENCY_GRAPH_INVALID",
    "GOVERNANCE_VALIDATION_FAILED",
    "AUTHORITY_UNCERTAIN",
    "REPLAY_INCONSISTENCY",
    "TENANT_ISOLATION_VIOLATION",
    "HIDDEN_PLAN",
    "SELF_AUTHORIZATION",
  ];
  return classifyScore(score, failures.some((failure) => insufficient.includes(failure)));
}

export function computePlanningConfidenceAssessmentHash(assessment: Omit<PlanningConfidenceAssessment, "integrity_hash"> | PlanningConfidenceAssessment): string {
  return hashValue("planning-confidence-assessment", {
    confidence_assessment_id: assessment.confidence_assessment_id,
    plan_id: assessment.plan_id,
    classification: assessment.classification,
    overall_score: assessment.overall_score,
    factor_scores: assessment.factor_scores.map((factor) => ({ name: factor.factor_name, score: factor.score, reductions: factor.reductions })),
    confidence_reducers: assessment.confidence_reducers,
    planning_state: assessment.planning_state,
    advisory_only: assessment.advisory_only,
    execution_authorized: assessment.execution_authorized,
    created_timestamp: assessment.created_timestamp,
  });
}

export function buildPlanningConfidenceAssessment(
  identity = generateAutonomyIdentity(),
  hierarchy?: ObjectiveHierarchyPackage,
  graph?: DependencyGraphPackage,
  optimizedPlan?: OptimizedPlanPackage,
  alternativePackage?: AlternativePlanningPackage,
  contingencyPackage?: ContingencyPlanningPackage,
  scenario: PlanningConfidenceScenario = "BASELINE",
): PlanningConfidenceAssessment {
  const intake = buildPlanningConfidenceIntake(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage, scenario);
  const factors = evaluateConfidenceFactors(intake, scenario);
  const failures: PlanningConfidenceFailureReason[] = [...intake.intake_failures, ...factors.flatMap((factor) => factor.reductions)];
  if (!intake.replay_reference) failures.push("MISSING_REPLAY_METADATA");
  if (!intake.lineage_reference) failures.push("BROKEN_LINEAGE");
  if (intake.governance_constraints.length === 0) failures.push("INVALID_GOVERNANCE_STATE");
  if (intake.assumptions.length === 0 || scenario === "ASSUMPTIONS_UNSUPPORTED") failures.push("ASSUMPTIONS_UNSUPPORTED");
  if (intake.tenant_id !== intake.optimized_plan.tenant_id || scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATION");
  if (scenario === "HIDDEN_PLAN") failures.push("HIDDEN_PLAN");
  if (scenario === "SELF_AUTHORIZATION") failures.push("SELF_AUTHORIZATION");
  if (scenario === "CONDITIONAL_REPORTING_GAP") failures.push("REPORTING_GAP");
  if (factors.some((factor) => factor.evidence_refs.length === 0)) failures.push("MISSING_EVIDENCE");
  const unique = uniqueFailures(failures);
  const governanceFailure = unique.some((item) => ["INVALID_GOVERNANCE_STATE", "GOVERNANCE_VALIDATION_FAILED", "POLICY_CONFLICT", "CONSTITUTIONAL_VIOLATION"].includes(item));
  const rawScore = Math.round(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  const overall = governanceFailure ? Math.min(rawScore, 49) : rawScore;
  const classification = aggregateClassification(overall, unique);
  const finalFailures = classification === "INSUFFICIENT" ? uniqueFailures([...unique, "CONFIDENCE_BELOW_MINIMUM"]) : unique;
  const evidenceRefs = freezeArray(factors.flatMap((factor) => factor.evidence_refs));
  const replayRefs = freezeArray(factors.flatMap((factor) => factor.replay_refs));
  const lineageRefs = intake.lineage_reference ? freezeArray([intake.lineage_reference]) : freezeArray<string>([]);
  const readiness: PlanningConfidenceAssessment["readiness_assessment"] = classification === "HIGH" ? "READY_FOR_GOVERNANCE_REVIEW" : classification === "MEDIUM" ? "OPERATOR_REVIEW_RECOMMENDED" : classification === "LOW" ? "BLOCKED_PENDING_REVIEW" : "REJECTED";
  const base = {
    confidence_assessment_id: id("PCA", "planning-confidence-assessment-id", { plan: intake.optimized_plan.optimized_plan_id, scenario }),
    plan_id: intake.optimized_plan.optimized_plan_id,
    objective_id: intake.objective_id,
    mission_id: intake.mission_id,
    tenant_id: intake.tenant_id,
    classification,
    overall_score: overall,
    factor_scores: factors,
    rationale: `Planning confidence is ${classification} because ${FACTORS.length} deterministic factors were evaluated with governance weighted above efficiency.`,
    confidence_increasers: freezeArray(factors.filter((factor) => factor.score >= 86).map((factor) => factor.factor_name)),
    confidence_reducers: finalFailures,
    governance_justification: governanceFailure ? "Governance deficiencies cap confidence below HIGH." : "Governance evidence is present and preserved across planning packages.",
    readiness_assessment: readiness,
    planning_state: classification === "INSUFFICIENT" ? "REJECTED" as const : "READY" as const,
    evidence_refs: evidenceRefs,
    replay_refs: replayRefs,
    lineage_refs: lineageRefs,
    risk_score: 100 - overall,
    advisory_only: true as const,
    execution_authorized: false as const,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computePlanningConfidenceAssessmentHash(base) });
}

function certify(failures: readonly PlanningConfidenceFailureReason[], classification: PlanningConfidenceClassification): PlanningConfidenceCertificationState {
  const hard: readonly PlanningConfidenceFailureReason[] = [
    "INCOMPLETE_PLANNING_PACKAGE",
    "UNCERTIFIED_PLAN",
    "MISSING_REPLAY_METADATA",
    "INVALID_GOVERNANCE_STATE",
    "DEPENDENCY_GRAPH_INVALID",
    "GOVERNANCE_VALIDATION_FAILED",
    "AUTHORITY_UNCERTAIN",
    "REPLAY_INCONSISTENCY",
    "TENANT_ISOLATION_VIOLATION",
    "HIDDEN_PLAN",
    "SELF_AUTHORIZATION",
    "INTEGRITY_HASH_MISMATCH",
  ];
  if (classification === "INSUFFICIENT" || failures.some((failure) => hard.includes(failure))) return "FAIL";
  return failures.length ? "CONDITIONAL_PASS" : "PASS";
}

export function validatePlanningConfidenceAssessment(assessment: PlanningConfidenceAssessment): PlanningConfidenceValidationResult {
  const failures: PlanningConfidenceFailureReason[] = [...assessment.confidence_reducers];
  if (assessment.factor_scores.length !== FACTORS.length) failures.push("INCOMPLETE_PLANNING_PACKAGE");
  if (!assessment.rationale || !assessment.governance_justification) failures.push("RATIONALE_INCOMPLETE");
  if (assessment.evidence_refs.length === 0) failures.push("MISSING_EVIDENCE");
  if (assessment.replay_refs.length === 0) failures.push("MISSING_REPLAY_METADATA");
  if (assessment.lineage_refs.length === 0) failures.push("BROKEN_LINEAGE");
  if (computePlanningConfidenceAssessmentHash(assessment) !== assessment.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const unique = uniqueFailures(failures);
  const certification = certify(unique, assessment.classification);
  const has = (reason: PlanningConfidenceFailureReason) => unique.includes(reason);
  const source = { assessment: assessment.confidence_assessment_id, certification, unique };
  return Object.freeze({
    validation_id: id("PCV", "planning-confidence-validation-id", source),
    confidence_assessment_id: assessment.confidence_assessment_id,
    certification_state: certification,
    failures: unique,
    all_factors_evaluated: assessment.factor_scores.length === FACTORS.length,
    confidence_rationale_complete: !has("RATIONALE_INCOMPLETE"),
    governance_validated: !has("INVALID_GOVERNANCE_STATE") && !has("GOVERNANCE_VALIDATION_FAILED") && !has("CONSTITUTIONAL_VIOLATION"),
    authority_verified: !has("AUTHORITY_UNCERTAIN") && !has("AUTHORITY_ESCALATION") && !has("INCOMPLETE_APPROVALS"),
    replay_deterministic: !has("MISSING_REPLAY_METADATA") && !has("REPLAY_INCONSISTENCY"),
    evidence_complete: !has("MISSING_EVIDENCE") && !has("BROKEN_LINEAGE"),
    tenant_isolation_preserved: !has("TENANT_ISOLATION_VIOLATION"),
    advisory_only_enforced: assessment.advisory_only === true && assessment.execution_authorized === false,
    ready_for_execution_orchestration_review: certification !== "FAIL" && assessment.classification !== "LOW" && assessment.classification !== "INSUFFICIENT",
    validation_hash: hashValue("planning-confidence-validation", source),
  });
}

export function replayPlanningConfidenceAssessment(assessment: PlanningConfidenceAssessment): PlanningConfidenceReplayResult {
  const failures: PlanningConfidenceFailureReason[] = [];
  if (computePlanningConfidenceAssessmentHash(assessment) !== assessment.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (assessment.replay_refs.length === 0) failures.push("MISSING_REPLAY_METADATA");
  const source = {
    replay_id: id("PCR", "planning-confidence-replay-id", assessment.confidence_assessment_id),
    confidence_assessment_id: assessment.confidence_assessment_id,
    replay_factor_order: freezeArray(assessment.factor_scores.map((factor) => factor.factor_name)),
    replay_evidence_refs: assessment.evidence_refs,
    validation_state: failures.length ? "FAIL" as const : validatePlanningConfidenceAssessment(assessment).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("planning-confidence-replay", source) });
}

export function buildPlanningConfidenceVisibilitySurface(assessment: PlanningConfidenceAssessment): PlanningConfidenceVisibilitySurface {
  const validation = validatePlanningConfidenceAssessment(assessment);
  return Object.freeze({
    confidence_assessment_id: assessment.confidence_assessment_id,
    certification_state: validation.certification_state,
    classification: assessment.classification,
    overall_score: assessment.overall_score,
    factor_scores: assessment.factor_scores,
    readiness_assessment: assessment.readiness_assessment,
    failure_reasons: validation.failures,
    advisory_only: true,
    execution_authorized: false,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
  });
}

export function getPlanningConfidenceFramework(): PlanningConfidenceFramework {
  const identity = generateAutonomyIdentity();
  const { hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage } = defaultInputs(identity);
  const intake = buildPlanningConfidenceIntake(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage);
  const assessment = buildPlanningConfidenceAssessment(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage);
  return Object.freeze({
    identity,
    intake,
    assessment,
    validation: validatePlanningConfidenceAssessment(assessment),
    replay: replayPlanningConfidenceAssessment(assessment),
    visibility: buildPlanningConfidenceVisibilitySurface(assessment),
  });
}
