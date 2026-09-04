import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { Evaluation, EvaluationEvidence, EvaluationFailure, EvaluationScore, EvaluationValidity } from "../../types/learning-constitution/evaluationEngine";
import type { PracticeRecommendation } from "../../types/learning-constitution/practiceEngine";
import type { SkillArtifactStore, SkillCapabilityEvidence, SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import type { SkillDependency } from "../../types/learning-constitution/skillDependencyGraph";
import { PracticeRecommendationService } from "./practiceRecommendationService";

const outcome = (value: EvaluationScore["outcome"]): SkillCapabilityEvidence["outcome"] => value === "PASS" ? "SUCCESS" : value === "PARTIAL" ? "PARTIAL" : "FAILURE";

/** Admits only independently validated Phase 21 evidence to the existing Skill Registry. */
export class EvaluationSkillRegistryBridgeService {
  constructor(private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async attach(input: Readonly<{ evaluation: Evaluation; score: EvaluationScore; validity: EvaluationValidity; evidence: EvaluationEvidence; workspaceId: string; correlationId: string }>): Promise<SkillCapabilityEvidence> {
    const { evaluation, score, validity, evidence } = input;
    if (validity.status !== "VALID" || evidence.evaluationId !== evaluation.evaluationId || evidence.skillId !== evaluation.skillId || evidence.validityId !== validity.validityId || !["PASS", "PARTIAL", "FAIL"].includes(score.outcome)) throw new Error("only valid, publishable evaluation evidence may enter the Skill Registry");
    if (!evaluation.evaluator.independent || evaluation.evaluator.actor.actorType === "AGENT") throw new Error("self-evaluated evidence cannot enter the Skill Registry");
    if (!(await this.artifacts.listArtifacts(evaluation.skillId)).some((artifact) => artifact.artifactType === "CANDIDATE")) throw new Error("evaluation evidence requires an existing canonical skill candidate");
    const skillEvidence: SkillCapabilityEvidence = { evidenceId: evidence.evidenceId, skillId: evaluation.skillId, outcome: outcome(score.outcome), assistance: "INDEPENDENT", context: `Evaluation ${evaluation.evaluationType} via ${evaluation.evaluator.type} rubric ${evaluation.rubricId}@${evaluation.rubricVersion}`, provenanceId: evidence.evaluationId, observedAt: evidence.createdAt, revoked: false };
    await this.artifacts.append({ artifactId: `SKILL_EVIDENCE:${skillEvidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: skillEvidence.skillId, payload: skillEvidence, createdAt: skillEvidence.observedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:evaluation-evidence-attached:${skillEvidence.evidenceId}`, eventType: "SKILL_EVALUATION_COMPLETED", workspaceId: input.workspaceId, occurredAt: skillEvidence.observedAt, actor: evaluation.evaluator.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: [evidence.evaluationId] }, payload: { evaluationId: evaluation.evaluationId, evidenceId: evidence.evidenceId, skillId: evaluation.skillId, outcome: skillEvidence.outcome, rubricId: evaluation.rubricId, rubricVersion: evaluation.rubricVersion, validityId: validity.validityId, skillRegistryEffect: "EVIDENCE_ONLY", durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return skillEvidence;
  }
}

/** Converts a validated dependency failure into a Phase 20 recommendation; exercise generation stays in the Practice Engine. */
export class EvaluationPracticeReferralService {
  refer(input: Readonly<{ evaluation: Evaluation; validity: EvaluationValidity; failure: EvaluationFailure; dependencies: readonly SkillDependency[]; registryEntries: ReadonlyMap<string, SkillRegistryEntry> }>): PracticeRecommendation | null {
    if (input.validity.status !== "VALID" || input.failure.evaluationId !== input.evaluation.evaluationId || input.failure.category !== "DEPENDENCY_FAILURE") return null;
    const recommendation = new PracticeRecommendationService().recommend({ skillId: input.evaluation.skillId, dependencies: input.dependencies, registryEntries: input.registryEntries, evidence: [] });
    return recommendation.source === "PREREQUISITE_REMEDIATION" ? recommendation : null;
  }
}
