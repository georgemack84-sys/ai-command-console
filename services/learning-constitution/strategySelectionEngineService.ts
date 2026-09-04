import { StrategySelectionService } from "./strategySelectionService";
import type { StrategyDefinition } from "../../types/learning-constitution/strategyRegistry";
import type { StrategyEvaluationProfile } from "../../types/learning-constitution/strategyEvaluation";
import type { LearningObjectiveProfile, StrategyCompositionPlan, StrategyEscalation, StrategyReselection, StrategySelectionEngineInput, StrategySelectionPolicy, StrategySelectionRecord, StrategySelectionScore } from "../../types/learning-constitution/strategySelectionEngine";

const evidenceRank = { UNTESTED: 0, EXPERIMENTAL: 1, PRELIMINARY: 2, SUPPORTED: 3, CONTEXT_SPECIALIZED: 3, WELL_SUPPORTED: 4 } as const;
const numeric = (value: number | undefined) => value ?? 0;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const policyMinimum = (policy: StrategySelectionPolicy, profile: LearningObjectiveProfile) => policy.minimumEvidenceByRisk[profile.risk];
/**
 * Phase 40 policy engine. It delegates hard registry eligibility to Phase 38, applies
 * non-negotiable evidence policy before scoring, and returns only a reproducible recommendation.
 */
export class StrategySelectionEngineService {
  private readonly eligibility = new StrategySelectionService();

  select(input: StrategySelectionEngineInput, strategies: readonly StrategyDefinition[]): StrategySelectionRecord {
    if (!input.profile.primaryType || input.profile.typeConfidence < input.policy.minimumClassificationConfidence) return this.clarification(input);
    const candidates = this.eligibility.candidates(input.request, strategies);
    const scores = candidates.map((candidate) => this.score(candidate.strategy, candidate.excluded ? candidate.exclusionReasons : [], input));
    const eligible = scores.filter((score) => score.eligible && score.total !== null).sort((left, right) => right.total! - left.total! || left.strategyId.localeCompare(right.strategyId));
    const selected = eligible[0] ?? null;
    const mode = selected && this.explorationEligible(input, eligible) ? "EXPLORE" : "EXPLOIT";
    return { selectionId: input.selectionId, requestId: input.request.requestId, objectiveProfileId: input.profile.profileId, selectedStrategyId: selected?.strategyId ?? null, mode, status: selected ? "RECOMMENDED" : scores.length ? "BLOCKED_BY_POLICY" : "NO_ELIGIBLE_STRATEGY", scores, rationale: selected ? [...selected.rationale, `${mode} is advisory only; a governed execution plan and lease remain required.`] : ["No candidate satisfied all hard registry and evidence-policy constraints."], policyVersion: input.policy.policyVersion, classifierVersion: input.profile.classifierVersion, registryVersion: input.registryVersion, evidenceSnapshotId: input.evidenceSnapshotId, createdAt: input.createdAt, immutable: true, recommendationOnly: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }

  reselect(input: Readonly<{ reselectionId: string; priorSelectionId: string; failureAttributionId: string; failure: StrategyReselection["diagnosedFailure"]; createdAt: string }>): StrategyReselection {
    const recommendation = input.failure === "PREREQUISITE" ? "REMEDIATE_PREREQUISITE" : input.failure === "TRANSFER" ? "INCREASE_NOVEL_APPLICATION" : input.failure === "RETENTION" ? "ADD_DELAYED_RECALL" : input.failure === "CALIBRATION" ? "ADD_CALIBRATION_FEEDBACK" : "HUMAN_REVIEW";
    return { reselectionId: input.reselectionId, priorSelectionId: input.priorSelectionId, failureAttributionId: input.failureAttributionId, diagnosedFailure: input.failure, recommendation, createdAt: input.createdAt, recommendationOnly: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }
  compose(input: Readonly<{ compositionPlanId: string; profile: LearningObjectiveProfile; selections: readonly StrategySelectionRecord[]; createdAt: string }>): StrategyCompositionPlan {
    const selected = input.selections.filter((item) => item.status === "RECOMMENDED" && item.selectedStrategyId);
    const types = [input.profile.primaryType, ...input.profile.secondaryTypes].filter((item): item is NonNullable<typeof item> => item !== null);
    const components = types.map((objectiveType, index) => { const selection = selected[index]; if (!selection?.selectedStrategyId) throw new Error(`A recommended strategy selection is required for ${objectiveType}.`); return { objectiveType, prerequisiteComponentIds: index ? [`component-${index}`] : [], selectionId: selection.selectionId, strategyId: selection.selectedStrategyId }; });
    return { compositionPlanId: input.compositionPlanId, objectiveProfileId: input.profile.profileId, components, status: "PROPOSED", createdAt: input.createdAt, requiresApprovedPlan: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }
  escalate(input: Readonly<{ escalationId: string; selectionId: string; trigger: StrategyEscalation["trigger"]; priorEscalations: number; createdAt: string }>): StrategyEscalation {
    const level = input.trigger === "SAFETY_CRITICAL_FAILURE" || input.priorEscalations >= 2 ? "HUMAN_INTERVENTION" : input.priorEscalations === 1 ? "INTENSIVE" : input.priorEscalations === 0 ? "ENHANCED" : "LIGHTWEIGHT";
    return { escalationId: input.escalationId, selectionId: input.selectionId, level, trigger: input.trigger, rationale: level === "HUMAN_INTERVENTION" ? "Repeated or safety-critical failure requires human intervention; automatic escalation stops here." : `${input.trigger} supports a more intensive proposed learning strategy.`, createdAt: input.createdAt, recommendationOnly: true, requiresApprovedPlan: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }

  private score(strategy: StrategyDefinition, hardFailures: readonly string[], input: StrategySelectionEngineInput): StrategySelectionScore {
    const matching = input.profiles.filter((profile) => profile.strategyId === strategy.strategyId);
    const profile = matching.sort((left, right) => evidenceRank[right.confidence] - evidenceRank[left.confidence])[0];
    const confidence = profile?.confidence ?? "UNTESTED";
    const minimum = policyMinimum(input.policy, input.profile);
    const policyFailures = [...hardFailures];
    if (minimum !== "NONE" && evidenceRank[confidence] < evidenceRank[minimum]) policyFailures.push(`EVIDENCE_BELOW_${minimum}`);
    if (input.profile.risk === "SECURITY_CRITICAL" && !profile?.metrics.ADVERSARIAL_ACCURACY) policyFailures.push("ADVERSARIAL_EVIDENCE_REQUIRED");
    if (input.profile.transferRequirement === "HIGH" && profile && profile.metrics.NOVEL_ACCURACY === undefined) policyFailures.push("TRANSFER_EVIDENCE_REQUIRED");
    if (input.profile.retentionRequirement === "HIGH" && profile && profile.metrics.RETENTION_ACCURACY === undefined) policyFailures.push("RETENTION_EVIDENCE_REQUIRED");
    const components = this.components(strategy, profile, input.profile, input.policy);
    const total = policyFailures.length ? null : components.objectiveFit * input.policy.weights.objectiveFit + components.historicalEffectiveness * input.policy.weights.historicalEffectiveness + components.transfer * input.policy.weights.transfer + components.retention * input.policy.weights.retention + components.learnerCompatibility * input.policy.weights.learnerCompatibility + components.evidenceStrength * input.policy.weights.evidenceStrength - components.timeCost * input.policy.weights.timeCost - components.tokenCost * input.policy.weights.tokenCost - components.toolCost * input.policy.weights.toolCost - components.failureRisk * input.policy.weights.failureRisk;
    return { strategyId: strategy.strategyId, eligible: !policyFailures.length, total: total === null ? null : Math.round(total * 100) / 100, components, evidenceProfileIds: matching.map((item) => item.profileId), evidenceConfidence: confidence, disqualificationReasons: policyFailures, rationale: policyFailures.length ? [`Excluded before ranking: ${policyFailures.join(", ")}.`] : [`Objective fit ${components.objectiveFit}/100; evidence is ${confidence}.`, "Historical evidence is contextual association, not causal proof."] };
  }

  private components(strategy: StrategyDefinition, profile: StrategyEvaluationProfile | undefined, objective: LearningObjectiveProfile, policy: StrategySelectionPolicy): Record<string, number> {
    const context = objective.primaryType === "FACTUAL" ? "FACTUAL" : objective.primaryType === "CONCEPTUAL" || objective.primaryType === "PRINCIPLE" ? "CONCEPTUAL" : objective.primaryType === "PROCEDURAL" ? "PROCEDURAL" : objective.primaryType === "DECISION_JUDGMENT" ? "JUDGMENT" : "REASONING";
    const has = (primitive: string) => strategy.steps.some((step) => step.primitive === primitive);
    const learnerCompatibility = objective.currentMastery === "NOVICE" ? (has("EXPLAIN") || has("WORKED_EXAMPLE") ? 90 : 40) : objective.currentMastery === "ADVANCED" || objective.currentMastery === "MASTERED" ? (has("NOVEL_PRACTICE") || has("ADVERSARIAL_TEST") ? 90 : 45) : 70;
    return { objectiveFit: strategy.applicableContexts.includes(context) ? 100 : 0, historicalEffectiveness: clamp(numeric(profile?.metrics.IMMEDIATE_ACCURACY)), transfer: clamp(numeric(profile?.metrics.NOVEL_ACCURACY)), retention: clamp(numeric(profile?.metrics.RETENTION_ACCURACY)), learnerCompatibility, evidenceStrength: evidenceRank[profile?.confidence ?? "UNTESTED"] * 25, timeCost: clamp(numeric(profile?.metrics.ELAPSED_TIME_MINUTES) / Math.max(1, policy.weights.timeCost || 1)), tokenCost: clamp(numeric(profile?.metrics.TOKEN_COST) / 1000), toolCost: clamp(numeric(profile?.metrics.TOOL_COST)), failureRisk: clamp(numeric(profile?.metrics.FAILURE_RATE)) };
  }

  private explorationEligible(input: StrategySelectionEngineInput, scores: readonly StrategySelectionScore[]) { return input.profile.risk === "LOW" && scores.length > 1 && (scores[0].total! - scores[1].total!) <= input.policy.exploration.maximumCandidateScoreDelta; }
  private clarification(input: StrategySelectionEngineInput): StrategySelectionRecord { return { selectionId: input.selectionId, requestId: input.request.requestId, objectiveProfileId: input.profile.profileId, selectedStrategyId: null, mode: "BASELINE", status: "REQUIRES_OBJECTIVE_CLARIFICATION", scores: [], rationale: [`Objective classification confidence ${input.profile.typeConfidence} is below policy minimum ${input.policy.minimumClassificationConfidence}.`, "Request objective clarification or use a governed diagnostic learning step before selection."], policyVersion: input.policy.policyVersion, classifierVersion: input.profile.classifierVersion, registryVersion: input.registryVersion, evidenceSnapshotId: input.evidenceSnapshotId, createdAt: input.createdAt, immutable: true, recommendationOnly: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" }; }
}
