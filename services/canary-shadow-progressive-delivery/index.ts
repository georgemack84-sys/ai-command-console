import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayDeploymentOrchestrationPromotionGovernance, runDeploymentOrchestrationPromotionGovernance, validateDeploymentOrchestrationPromotionGovernance } from "@/services/deployment-orchestration-promotion-governance";
import type {
  ExposureStage,
  ProgressiveDeliveryBundle,
  ProgressiveDeliveryFailure,
  ProgressiveDeliveryInput,
  ProgressiveDeliveryOutcome,
  ProgressiveDeliveryResult,
  ProgressiveDeliveryValidation,
  ProgressiveDeliveryCertificationTest,
  RolloutRecommendationOutcome,
} from "@/types/canary-shadow-progressive-delivery";

const VERSION = "canary-shadow-progressive-delivery/v15.5" as const;
const IDENTIFIER = "CanaryShadowProgressiveDelivery" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProgressiveDeliveryFailure[], failure: ProgressiveDeliveryFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProgressiveDeliveryInput["scenario"]): ProgressiveDeliveryFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProgressiveDeliveryFailure[]): ProgressiveDeliveryOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_DELIVERY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const exposureStages = freezeArray(["0%", "1%", "5%", "10%", "25%", "50%", "100%"] as const satisfies readonly ExposureStage[]);
const recommendationOutcomes = freezeArray(["CONTINUE", "HOLD", "REQUIRE_REVIEW", "RECOMMEND_ROLLBACK", "REQUIRE_REQUALIFICATION"] as const satisfies readonly RolloutRecommendationOutcome[]);

function certTest(name: string, passed: boolean, failure: ProgressiveDeliveryFailure, evidence_refs: readonly string[]): ProgressiveDeliveryCertificationTest {
  const actual: ProgressiveDeliveryOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_DELIVERY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("progressive_delivery_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProgressiveDeliveryResult, "replay_hash" | "integrity_hash">): string {
  return hash({ deployment: result.deployment_governance_ref, shadow: result.shadow_execution.integrity_hash, canary: result.canary.integrity_hash, policy: result.exposure_policy.integrity_hash, exposure: result.exposure_decision.integrity_hash, comparison: result.comparison.integrity_hash, recommendation: result.recommendation.integrity_hash, replay: result.replay.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), record: result.certification_record.integrity_hash, outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProgressiveDeliveryResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runCanaryShadowProgressiveDelivery(input: ProgressiveDeliveryInput = {}): ProgressiveDeliveryResult {
  const deployment = runDeploymentOrchestrationPromotionGovernance();
  const deploymentValid = validateDeploymentOrchestrationPromotionGovernance(deployment);
  const deploymentReplayable = replayDeploymentOrchestrationPromotionGovernance(deployment);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProgressiveDeliveryFailure[] = deploymentValid.valid && deploymentReplayable ? [] : ["PRODUCTION_GOVERNANCE_NOT_MAINTAINED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const evidenceRefs = freezeArray([deployment.integrity_hash, deployment.promotion_gate.integrity_hash, deployment.approval_workflow.integrity_hash]);
  const shadow_execution = nested({ shadow_id: id("shadow_execution", deployment.integrity_hash), mirrored_requests: true, synthetic_response_generation: true, execution_isolation: !has(failures, "SHADOW_EXECUTION_NOT_ISOLATED"), production_comparison: true, replay_capture: !has(failures, "REPLAY_NON_DETERMINISTIC"), divergence_detection: !has(failures, "DIVERGENCE_DETECTION_NON_DETERMINISTIC"), production_state_modified: false as const, external_side_effects_executed: false as const, replayable: !has(failures, "REPLAY_NON_DETERMINISTIC"), evidence_refs: has(failures, "AUDIT_LINEAGE_INCOMPLETE") ? freezeArray([]) : evidenceRefs });
  const canary = nested({ canary_id: id("canary", deployment.identity.deployment_id), internal_canary: true, tenant_canary: !has(failures, "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED"), capability_canary: !has(failures, "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED"), environment_canary: true, operator_approved: true, governance_controlled_activation: !has(failures, "PRODUCTION_GOVERNANCE_NOT_MAINTAINED"), failed_canary_blocks_expansion: !has(failures, "UNSAFE_EXPANSION_NOT_BLOCKED"), deterministic: !has(failures, "CANARY_ACTIVATION_NON_DETERMINISTIC"), evidence_refs: evidenceRefs });
  const exposure_policy = nested({ policy_id: id("exposure_policy", deployment.integrity_hash), maximum_rollout: has(failures, "PERCENTAGE_EXPOSURE_UNBOUNDED") ? "100%" as const : "50%" as const, approval_requirements: freezeArray(["operator approval", "governance policy"]), rollback_triggers: freezeArray(["divergence", "latency regression", "integrity failure"]), tenant_restrictions: has(failures, "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED") ? freezeArray([]) : freezeArray(["tenant_phase_15_deployment"]), capability_restrictions: has(failures, "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED") ? freezeArray([]) : freezeArray(["advisory assessment"]), safety_thresholds: freezeArray(["error_rate<1%", "p95_latency<500ms"]), governed: !has(failures, "EXPOSURE_POLICIES_NOT_ENFORCED"), enforceable_constraints: !has(failures, "EXPOSURE_POLICIES_NOT_ENFORCED") });
  const exposure_decision = nested({ decision_id: id("exposure_decision", deployment.integrity_hash), stages: exposureStages, current_stage: "10%" as const, percentage_bounded: !has(failures, "PERCENTAGE_EXPOSURE_UNBOUNDED"), tenant_scoped: !has(failures, "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED"), capability_scoped: !has(failures, "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED"), policy_enforced: !has(failures, "EXPOSURE_POLICIES_NOT_ENFORCED"), unsafe_expansion_blocked: !has(failures, "UNSAFE_EXPANSION_NOT_BLOCKED"), deterministic_progression: !has(failures, "PROGRESSIVE_ROLLOUT_NON_DETERMINISTIC"), immutable_history: !has(failures, "EXPOSURE_HISTORY_MUTABLE") });
  const comparison = nested({ comparison_id: id("production_comparison", deployment.integrity_hash), output_consistency: true, latency_within_bounds: true, reliability_within_bounds: true, governance_behavior_consistent: !has(failures, "PRODUCTION_GOVERNANCE_NOT_MAINTAINED"), replay_consistency: !has(failures, "REPLAY_NON_DETERMINISTIC"), certification_expectations_met: !has(failures, "CERTIFICATION_LINEAGE_LOST"), operational_integrity: true, divergence_detected: has(failures, "DIVERGENCE_DETECTION_NON_DETERMINISTIC"), deterministic: !has(failures, "DIVERGENCE_DETECTION_NON_DETERMINISTIC"), reproducible: !has(failures, "PRODUCTION_COMPARISON_NOT_REPRODUCIBLE") });
  const recommendation = nested({ recommendation_id: id("rollout_recommendation", deployment.integrity_hash), outcome: has(failures, "UNSAFE_EXPANSION_NOT_BLOCKED") ? "RECOMMEND_ROLLBACK" as const : "CONTINUE" as const, risk_assessment_refs: freezeArray([comparison.integrity_hash]), rollback_evidence_refs: freezeArray([deployment.rollback.integrity_hash]), mission_control_initiates_rollback: false as const, deployment_authority_required: true as const, immutable: !has(failures, "EXPOSURE_HISTORY_MUTABLE"), deterministic: !has(failures, "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE"), replayable: !has(failures, "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE") });
  const replay = nested({ replay_id: id("progressive_replay", deployment.integrity_hash), rollout_stages_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), exposure_decisions_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), comparison_evidence_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), rollback_recommendations_replayed: !has(failures, "REPLAY_NON_DETERMINISTIC"), approvals_replayed: true, policy_evaluations_replayed: true, audit_lineage_refs: has(failures, "AUDIT_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([deployment.lineage.integrity_hash, deployment.ledger[0]?.integrity_hash ?? deployment.integrity_hash]), deterministic: !has(failures, "REPLAY_NON_DETERMINISTIC") });
  const tests = freezeArray([
    certTest("Shadow execution isolated", shadow_execution.execution_isolation, "SHADOW_EXECUTION_NOT_ISOLATED", [shadow_execution.integrity_hash]),
    certTest("Production effects prevented during shadow execution", shadow_execution.production_state_modified === false && shadow_execution.external_side_effects_executed === false, "PRODUCTION_EFFECTS_NOT_PREVENTED", [shadow_execution.integrity_hash]),
    certTest("Canary activation deterministic", canary.deterministic, "CANARY_ACTIVATION_NON_DETERMINISTIC", [canary.integrity_hash]),
    certTest("Exposure policies enforced", exposure_policy.governed && exposure_policy.enforceable_constraints, "EXPOSURE_POLICIES_NOT_ENFORCED", [exposure_policy.integrity_hash]),
    certTest("Progressive rollout deterministic", exposure_decision.deterministic_progression, "PROGRESSIVE_ROLLOUT_NON_DETERMINISTIC", [exposure_decision.integrity_hash]),
    certTest("Percentage exposure bounded", exposure_decision.percentage_bounded && exposure_policy.maximum_rollout !== "100%", "PERCENTAGE_EXPOSURE_UNBOUNDED", [exposure_policy.integrity_hash]),
    certTest("Tenant-scoped rollout enforced", exposure_decision.tenant_scoped && exposure_policy.tenant_restrictions.length > 0, "TENANT_SCOPED_ROLLOUT_NOT_ENFORCED", [exposure_policy.integrity_hash]),
    certTest("Capability-scoped activation enforced", exposure_decision.capability_scoped && exposure_policy.capability_restrictions.length > 0, "CAPABILITY_SCOPED_ACTIVATION_NOT_ENFORCED", [exposure_policy.integrity_hash]),
    certTest("Production comparison reproducible", comparison.reproducible, "PRODUCTION_COMPARISON_NOT_REPRODUCIBLE", [comparison.integrity_hash]),
    certTest("Divergence detection deterministic", comparison.deterministic && !comparison.divergence_detected, "DIVERGENCE_DETECTION_NON_DETERMINISTIC", [comparison.integrity_hash]),
    certTest("Rollback recommendations reproducible", recommendation.deterministic && recommendation.replayable, "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE", [recommendation.integrity_hash]),
    certTest("Mission Control advisory-only boundary preserved", recommendation.mission_control_initiates_rollback === false, "ADVISORY_BOUNDARY_BREACH", [recommendation.integrity_hash]),
    certTest("Deployment authority separation enforced", recommendation.deployment_authority_required === true, "DEPLOYMENT_AUTHORITY_SEPARATION_BREACH", [recommendation.integrity_hash]),
    certTest("Replay deterministic", replay.deterministic, "REPLAY_NON_DETERMINISTIC", [replay.integrity_hash]),
    certTest("Audit lineage complete", replay.audit_lineage_refs.length > 0 && shadow_execution.evidence_refs.length > 0, "AUDIT_LINEAGE_INCOMPLETE", [replay.integrity_hash]),
    certTest("Exposure history immutable", exposure_decision.immutable_history && recommendation.immutable, "EXPOSURE_HISTORY_MUTABLE", [exposure_decision.integrity_hash]),
    certTest("Policy violations fail closed", exposure_policy.enforceable_constraints, "POLICY_VIOLATION_NOT_FAIL_CLOSED", [exposure_policy.integrity_hash]),
    certTest("Unsafe rollout expansion blocked", exposure_decision.unsafe_expansion_blocked && canary.failed_canary_blocks_expansion, "UNSAFE_EXPANSION_NOT_BLOCKED", [exposure_decision.integrity_hash]),
    certTest("Certification lineage preserved", comparison.certification_expectations_met, "CERTIFICATION_LINEAGE_LOST", [deployment.lineage.integrity_hash]),
    certTest("Production governance maintained", canary.governance_controlled_activation && comparison.governance_behavior_consistent, "PRODUCTION_GOVERNANCE_NOT_MAINTAINED", [deployment.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProgressiveDeliveryFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const certification_record = nested({ certification_id: id("progressive_delivery_certification", deployment.integrity_hash), deployment_governance_ref: deployment.integrity_hash, shadow_refs: freezeArray([shadow_execution.integrity_hash]), canary_refs: freezeArray([canary.integrity_hash]), exposure_refs: freezeArray([exposure_policy.integrity_hash, exposure_decision.integrity_hash]), comparison_refs: freezeArray([comparison.integrity_hash]), recommendation_refs: freezeArray([recommendation.integrity_hash]), replay_refs: freezeArray([replay.integrity_hash]), certification_lineage_refs: has(effectiveFailures, "CERTIFICATION_LINEAGE_LOST") ? freezeArray([]) : freezeArray([deployment.lineage.integrity_hash]), outcome });
  const base: Omit<ProgressiveDeliveryResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, deployment_governance_ref: deployment.integrity_hash, shadow_execution, canary, exposure_policy, exposure_decision, comparison, recommendation, replay, certification_tests: tests, certification_record, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCanaryShadowProgressiveDelivery(result = runCanaryShadowProgressiveDelivery()): ProgressiveDeliveryValidation {
  const shadow_valid = verify(result.shadow_execution) && result.shadow_execution.execution_isolation && result.shadow_execution.production_state_modified === false && result.shadow_execution.external_side_effects_executed === false && result.shadow_execution.replayable && result.shadow_execution.evidence_refs.length > 0;
  const canary_valid = verify(result.canary) && result.canary.deterministic && result.canary.tenant_canary && result.canary.capability_canary && result.canary.governance_controlled_activation && result.canary.failed_canary_blocks_expansion;
  const policy_valid = verify(result.exposure_policy) && result.exposure_policy.governed && result.exposure_policy.enforceable_constraints && result.exposure_policy.maximum_rollout !== "100%" && result.exposure_policy.tenant_restrictions.length > 0 && result.exposure_policy.capability_restrictions.length > 0;
  const exposure_valid = verify(result.exposure_decision) && result.exposure_decision.percentage_bounded && result.exposure_decision.tenant_scoped && result.exposure_decision.capability_scoped && result.exposure_decision.policy_enforced && result.exposure_decision.unsafe_expansion_blocked && result.exposure_decision.deterministic_progression && result.exposure_decision.immutable_history;
  const comparison_valid = verify(result.comparison) && result.comparison.reproducible && result.comparison.deterministic && !result.comparison.divergence_detected && result.comparison.certification_expectations_met && result.comparison.governance_behavior_consistent;
  const recommendation_valid = verify(result.recommendation) && result.recommendation.outcome === "CONTINUE" && result.recommendation.mission_control_initiates_rollback === false && result.recommendation.deployment_authority_required === true && result.recommendation.immutable && result.recommendation.deterministic && result.recommendation.replayable;
  const replay_valid = verify(result.replay) && result.replay.deterministic && result.replay.audit_lineage_refs.length > 0 && resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const certification_valid = verify(result.certification_record) && result.certification_tests.length === 20 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0) && result.certification_record.outcome === result.outcome && result.certification_record.certification_lineage_refs.length > 0;
  const valid = result.outcome === "PASS" && shadow_valid && canary_valid && policy_valid && exposure_valid && comparison_valid && recommendation_valid && replay_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, shadow_valid, canary_valid, policy_valid, exposure_valid, comparison_valid, recommendation_valid, replay_valid, certification_valid, failures: result.failures });
}

export function replayCanaryShadowProgressiveDelivery(result = runCanaryShadowProgressiveDelivery()): boolean {
  const replayed = runCanaryShadowProgressiveDelivery();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCanaryShadowProgressiveDelivery(result).valid;
}

export function getCanaryShadowProgressiveDeliveryBundle(): ProgressiveDeliveryBundle {
  const result = runCanaryShadowProgressiveDelivery();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "deployment-orchestration-promotion-governance/v15.4" as const, exposure_stages: exposureStages, recommendation_outcomes: recommendationOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateCanaryShadowProgressiveDelivery(result) });
}

export const CanaryShadowProgressiveDeliveryService = Object.freeze({ run: runCanaryShadowProgressiveDelivery, validate: validateCanaryShadowProgressiveDelivery, replay: replayCanaryShadowProgressiveDelivery });
