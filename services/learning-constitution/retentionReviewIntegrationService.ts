import type { Evaluation, EvaluationScore, EvaluationValidity } from "../../types/learning-constitution/evaluationEngine";
import type { SkillGraphProjection } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import type { RetentionArtifactStore, RetentionEvidence, RetentionRecord, RetentionReviewPlan } from "../../types/learning-constitution/retentionEngine";

const checkpointFor = (record: RetentionRecord): RetentionReviewPlan["checkpoint"] => record.stage === "NOT_EVALUATED" ? "IMMEDIATE" : record.stage === "IMMEDIATE_ONLY" ? "SHORT_TERM" : record.stage === "SHORT_TERM_RETAINED" ? "MEDIUM_TERM" : "LONG_TERM";
const transferFor = (checkpoint: RetentionReviewPlan["checkpoint"]): RetentionReviewPlan["requiredTransfer"] => checkpoint === "IMMEDIATE" ? "MODIFIED" : checkpoint === "SHORT_TERM" ? "NOVEL" : checkpoint === "MEDIUM_TERM" ? "EDGE" : "ADVERSARIAL";
const permittedSkillStatus = new Set(["DEMONSTRATED", "VALIDATED", "MASTERED"]);

/** Bridges a retention review to Phase 20/21 without making either the retention engine's private implementation detail. */
export class RetentionReviewIntegrationService {
  constructor(private readonly artifacts: RetentionArtifactStore) {}
  async plan(input: Readonly<{ planId: string; record: RetentionRecord; registryEntry: SkillRegistryEntry | undefined; registryEntries: ReadonlyMap<string, SkillRegistryEntry>; graph: SkillGraphProjection; knowledgeStatus: "ACTIVE" | "SUPERSEDED" | "RETIRED"; createdAt: string }>): Promise<RetentionReviewPlan> {
    const checkpoint = checkpointFor(input.record);
    const prerequisites = input.graph.dependencies.filter((dependency) => dependency.dependent.skillId === input.record.skillId && dependency.relationshipType === "PREREQUISITE" && dependency.lifecycle === "ACTIVE").map((dependency) => dependency.prerequisite.skillId);
    const weakPrerequisite = prerequisites.find((skillId) => { const entry = input.registryEntries.get(skillId); return !entry || entry.status === "DEGRADED" || entry.status === "STALE" || entry.status === "SUSPENDED"; });
    const route: RetentionReviewPlan["route"] = input.knowledgeStatus !== "ACTIVE" ? "KNOWLEDGE_REVALIDATION" : !input.registryEntry || !permittedSkillStatus.has(input.registryEntry.status) ? "BLOCKED" : weakPrerequisite || input.record.remediationRequired ? "PREREQUISITE_REMEDIATION" : "PRACTICE_AND_EVALUATION";
    const reason = route === "KNOWLEDGE_REVALIDATION" ? "Superseded or retired knowledge cannot be reinforced; revalidate through the constitutional knowledge path." : route === "PREREQUISITE_REMEDIATION" ? "A prior failure or degraded prerequisite requires targeted remediation before retention is reassessed." : route === "BLOCKED" ? "A retention review requires an existing demonstrated canonical skill." : "Generate a varied exercise through Practice Engine, then evaluate it through Evaluation Engine.";
    const plan: RetentionReviewPlan = { planId: input.planId, retentionId: input.record.retentionId, skillId: input.record.skillId, checkpoint, route, requiredTransfer: transferFor(checkpoint), prerequisiteSkillIds: prerequisites, reason, executionPermissionGranted: false, durableKnowledgeEffect: "NONE" };
    await this.artifacts.append({ artifactId: `RETENTION_REVIEW_PLAN:${plan.planId}`, artifactType: "REVIEW_PLAN", subjectId: input.record.retentionId, payload: plan, createdAt: input.createdAt });
    return plan;
  }

  evidenceFromEvaluation(input: Readonly<{ evidenceId: string; record: RetentionRecord; plan: RetentionReviewPlan; evaluation: Evaluation; score: EvaluationScore; validity: EvaluationValidity; novelContext: boolean; answerExposed: boolean }>): RetentionEvidence {
    if (input.plan.retentionId !== input.record.retentionId || input.evaluation.skillId !== input.record.skillId || input.score.evaluationId !== input.evaluation.evaluationId || input.validity.evaluationId !== input.evaluation.evaluationId) throw new Error("retention evidence must be derived from the planned canonical-skill evaluation");
    const outcome: RetentionEvidence["outcome"] = input.validity.status !== "VALID" || input.score.outcome === "INVALID" || input.score.outcome === "NEEDS_REVIEW" || input.score.outcome === "PARTIAL" ? "INCONCLUSIVE" : input.score.outcome === "PASS" ? "PASS" : "FAIL";
    const validity: RetentionEvidence["validity"] = input.validity.status === "VALID" ? "VALID" : "INVALID";
    const strength: RetentionEvidence["strength"] = input.evaluation.evaluationType === "ADVERSARIAL" ? "STRONG" : input.novelContext && input.evaluation.evaluator.independent ? "MODERATE" : "WEAK";
    return { evidenceId: input.evidenceId, retentionId: input.record.retentionId, skillId: input.record.skillId, checkpoint: input.plan.checkpoint, outcome, validity, strength, independentExecution: input.evaluation.evaluator.independent, novelContext: input.novelContext, answerExposed: input.answerExposed || input.evaluation.context.providedHints.length > 0 || input.evaluation.context.exposedExampleIds.length > 0, evaluationReferenceId: input.evaluation.evaluationId, sourceKnowledgeStatus: "ACTIVE", occurredAt: input.score.scoredAt, createdBy: input.evaluation.evaluator.actor, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
}
