import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { SkillArtifactRecord, SkillArtifactStore, SkillCandidate, SkillEvaluation, SkillEvidenceRevocation, SkillHumanReview, SkillRegistryEntry, SkillStatus, SkillValidation, SkillValidator } from "../../types/learning-constitution/skillRegistry";
/** Enforces that procedure knowledge cannot create a demonstrated capability claim. */
export class ConservativeSkillValidator implements SkillValidator { validate(skill: SkillCandidate): SkillValidation { const reasons: string[] = []; if (!skill.name.trim() || !skill.scope.length) reasons.push("SKILL_IDENTITY_OR_SCOPE_REQUIRED"); if (skill.capabilityClaim) reasons.push("CAPABILITY_REQUIRES_EVIDENCE"); if (skill.status !== "UNDEMONSTRATED" && !skill.evidence.length) reasons.push("STATUS_REQUIRES_EVIDENCE"); if (skill.mastery !== null && (!Number.isFinite(skill.mastery) || skill.mastery < 0 || skill.mastery > 100)) reasons.push("MASTERY_INVALID"); const reject = reasons.includes("SKILL_IDENTITY_OR_SCOPE_REQUIRED") || reasons.includes("CAPABILITY_REQUIRES_EVIDENCE") || reasons.includes("STATUS_REQUIRES_EVIDENCE") || reasons.includes("MASTERY_INVALID"); return { skillId: skill.skillId, status: reject ? "REJECT" : reasons.length ? "DEFER" : "VALID", reasonCodes: reasons.length ? reasons : ["SKILL_VALID"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; } }
export class SkillCandidateService {
  constructor(private readonly validator: SkillValidator, private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async submit(skill: SkillCandidate, workspaceId?: string, correlationId = skill.skillId): Promise<SkillValidation> {
    const validation = this.validator.validate(skill);
    await this.artifacts.append({ artifactId: `SKILL_CANDIDATE:${skill.skillId}`, artifactType: "CANDIDATE", subjectId: skill.skillId, payload: skill, createdAt: skill.createdAt });
    for (const evidence of uniqueSkillEvidence(skill.evidence)) await this.artifacts.append({ artifactId: `SKILL_EVIDENCE:${evidence.evidenceId}`, artifactType: "EVIDENCE", subjectId: skill.skillId, payload: evidence, createdAt: evidence.observedAt });
    if (this.audit && workspaceId) {
      await this.audit.append({ eventId: `audit:skill-candidate:${skill.skillId}`, eventType: "SKILL_CANDIDATE_CREATED", workspaceId, occurredAt: skill.createdAt, actor: skill.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: skill.evidence.map((item) => item.provenanceId) }, payload: { skillId: skill.skillId, validationStatus: validation.status, procedureKnowledgeOnly: skill.status === "UNDEMONSTRATED", executionPermissionGranted: false } });
      for (const evidence of uniqueSkillEvidence(skill.evidence)) await this.audit.append({ eventId: `audit:skill-evidence:${evidence.evidenceId}`, eventType: "SKILL_EVIDENCE_ATTACHED", workspaceId, occurredAt: evidence.observedAt, actor: skill.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: [evidence.provenanceId] }, payload: { skillId: skill.skillId, evidenceId: evidence.evidenceId, outcome: evidence.outcome, assistance: evidence.assistance, executionPermissionGranted: false } });
    }
    return validation;
  }
}
export function uniqueSkillEvidence<T extends { evidenceId: string }>(evidence: readonly T[]) { const seen = new Set<string>(); return evidence.filter((item) => !seen.has(item.evidenceId) && Boolean(seen.add(item.evidenceId))); }
export class SkillEvidenceLifecycleService {
  constructor(private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async revoke(record: SkillEvidenceRevocation, workspaceId?: string, correlationId = record.revocationId) {
    if (record.actor.actorType !== "HUMAN" || !record.actor.actorId.trim() || !record.reason.trim()) throw new Error("evidence revocation requires human reason");
    const knownEvidence = (await this.artifacts.listArtifacts(record.skillId)).some((artifact) => artifact.artifactType === "EVIDENCE" && typeof artifact.payload === "object" && artifact.payload !== null && (artifact.payload as { evidenceId?: unknown }).evidenceId === record.evidenceId);
    if (!knownEvidence) throw new Error("cannot revoke evidence that is not attached to the skill");
    await this.artifacts.append({ artifactId: `SKILL_EVIDENCE_REVOCATION:${record.revocationId}`, artifactType: "LIFECYCLE", subjectId: record.skillId, payload: record, createdAt: record.revokedAt });
    if (this.audit && workspaceId) {
      await this.audit.append({ eventId: `audit:skill-evidence-revoked:${record.revocationId}`, eventType: "SKILL_EVIDENCE_REVOKED", workspaceId, occurredAt: record.revokedAt, actor: record.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { skillId: record.skillId, evidenceId: record.evidenceId, reason: record.reason, executionPermissionGranted: false } });
      await this.audit.append({ eventId: `audit:skill-reassessment:${record.revocationId}`, eventType: "SKILL_REASSESSMENT_REQUESTED", workspaceId, occurredAt: record.revokedAt, actor: record.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { skillId: record.skillId, trigger: "EVIDENCE_REVOKED", executionPermissionGranted: false } });
    }
    return { reassessmentRequired: true, executionPermissionGranted: false as const };
  }
}
export class SkillAssessmentService { assess(evaluations: readonly { score: number }[]) { if (!evaluations.length) return { observedScore: null, estimatedMastery: null, confidence: "UNKNOWN", eligibleForProvisional: false, rationale: ["No evaluated performance evidence."], executionPermissionGranted: false } as const; const estimatedMastery = evaluations.length >= 2 ? evaluations.reduce((total, item) => total + item.score, 0) / evaluations.length : null; return { observedScore: evaluations.at(-1)!.score, estimatedMastery, confidence: evaluations.length >= 5 ? "HIGH" : evaluations.length >= 3 ? "MEDIUM" : "LOW", eligibleForProvisional: evaluations.length >= 2, rationale: [evaluations.length >= 2 ? `Average of ${evaluations.length} evaluation scores; assessment remains approximate.` : "One observed evaluation is insufficient for estimated mastery or provisional status."], executionPermissionGranted: false } as const; } }
const isEvaluation = (artifact: SkillArtifactRecord): artifact is SkillArtifactRecord & { payload: SkillEvaluation } => artifact.artifactType === "EVALUATION" && typeof artifact.payload === "object" && artifact.payload !== null && typeof (artifact.payload as { evaluationId?: unknown }).evaluationId === "string";
const isReview = (artifact: SkillArtifactRecord): artifact is SkillArtifactRecord & { payload: SkillHumanReview } => artifact.artifactType === "LIFECYCLE" && typeof artifact.payload === "object" && artifact.payload !== null && typeof (artifact.payload as { reviewId?: unknown }).reviewId === "string";
const isRevocation = (artifact: SkillArtifactRecord): artifact is SkillArtifactRecord & { payload: SkillEvidenceRevocation } => artifact.artifactType === "LIFECYCLE" && typeof artifact.payload === "object" && artifact.payload !== null && typeof (artifact.payload as { revocationId?: unknown }).revocationId === "string";
export class SkillEvaluationService {
  constructor(private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(evaluation: SkillEvaluation, workspaceId?: string, correlationId = evaluation.evaluationId) {
    if (!Number.isFinite(evaluation.score) || evaluation.score < 0 || evaluation.score > 100 || !evaluation.evidenceIds.length) throw new Error("skill evaluation requires score and evidence");
    await this.artifacts.append({ artifactId: `SKILL_EVALUATION:${evaluation.evaluationId}`, artifactType: "EVALUATION", subjectId: evaluation.skillId, payload: evaluation, createdAt: evaluation.createdAt });
    const evaluations = (await this.artifacts.listArtifacts(evaluation.skillId)).filter(isEvaluation).map((item) => item.payload);
    const assessment = new SkillAssessmentService().assess(evaluations);
    if (this.audit && workspaceId) await this.audit.append({ eventId: `audit:skill-evaluation:${evaluation.evaluationId}`, eventType: "SKILL_EVALUATED", workspaceId, occurredAt: evaluation.createdAt, actor: evaluation.evaluator, correlationId, schemaVersion: "10.0", references: {}, payload: { skillId: evaluation.skillId, evaluationId: evaluation.evaluationId, score: evaluation.score, observedScore: assessment.observedScore, estimatedMastery: assessment.estimatedMastery, executionPermissionGranted: false } });
    return assessment;
  }
}
export class SkillCapabilityService { check(skill: Readonly<{ skillId: string; status: SkillStatus; evidence: readonly unknown[] }>): import("../../types/learning-constitution/skillRegistry").CapabilityCheck { const capability = skill.status === "UNDEMONSTRATED" ? "UNDEMONSTRATED" : skill.evidence.length ? "SUPPORTED" : "LIMITED"; return { skillId: skill.skillId, capability, authorized: false, currentlyExecutable: false, reasons: capability === "UNDEMONSTRATED" ? ["Procedure knowledge is not execution evidence."] : ["Capability does not grant authority or environment access."] }; } }
const statusRank: Record<SkillStatus, number> = { UNDEMONSTRATED: 0, CANDIDATE: 1, PROVISIONAL: 2, DEMONSTRATED: 3, VALIDATED: 4, MASTERED: 5, STALE: 1, DEGRADED: 1, SUSPENDED: 0, RETIRED: 0 };
export class SkillHumanReviewService {
  constructor(private readonly artifacts: SkillArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(review: SkillHumanReview, workspaceId?: string, correlationId = review.reviewId) {
    if (review.actor.actorType !== "HUMAN" || !review.actor.actorId.trim() || !review.note.trim()) throw new Error("skill review requires human actor and note");
    const history = await this.artifacts.listArtifacts(review.skillId);
    const evaluationCount = history.filter(isEvaluation).length;
    if (review.proposedStatus === "PROVISIONAL" && evaluationCount < 2) throw new Error("provisional skill requires two evaluations");
    // Ignore this record when a delivery is replayed, so its audit envelope remains identical.
    const prior = history.filter(isReview).filter((artifact) => artifact.artifactId !== `SKILL_REVIEW:${review.reviewId}`).at(-1)?.payload.proposedStatus ?? "UNDEMONSTRATED";
    await this.artifacts.append({ artifactId: `SKILL_REVIEW:${review.reviewId}`, artifactType: "LIFECYCLE", subjectId: review.skillId, payload: review, createdAt: review.reviewedAt });
    if (this.audit && workspaceId) await this.audit.append({ eventId: `audit:skill-review:${review.reviewId}`, eventType: statusRank[review.proposedStatus] > statusRank[prior] ? "SKILL_PROMOTED" : "SKILL_DEMOTED", workspaceId, occurredAt: review.reviewedAt, actor: review.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { skillId: review.skillId, reviewId: review.reviewId, priorStatus: prior, proposedStatus: review.proposedStatus, evaluationCount, executionPermissionGranted: false } });
    return { review, persistenceEffect: "CREATED" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const };
  }
}
/** Read-only projection of immutable candidate, evidence, evaluation, revocation, and review artifacts. */
export class SkillRegistryProjectionService {
  constructor(private readonly artifacts: SkillArtifactStore) {}
  async get(skillId: string): Promise<SkillRegistryEntry | null> {
    const history = await this.artifacts.listArtifacts(skillId);
    const candidate = history.find((item) => item.artifactType === "CANDIDATE")?.payload as SkillCandidate | undefined;
    if (!candidate) return null;
    const revoked = new Set(history.filter(isRevocation).map((item) => item.payload.evidenceId));
    const evidence = history.filter((item) => item.artifactType === "EVIDENCE").filter((item) => typeof item.payload === "object" && item.payload !== null && typeof (item.payload as { evidenceId?: unknown }).evidenceId === "string");
    const reviews = history.filter(isReview);
    return { skill: candidate, status: reviews.at(-1)?.payload.proposedStatus ?? candidate.status, activeEvidenceCount: evidence.filter((item) => !revoked.has((item.payload as { evidenceId: string }).evidenceId)).length, revokedEvidenceCount: revoked.size, evaluationCount: history.filter(isEvaluation).length, assessment: new SkillAssessmentService().assess(history.filter(isEvaluation).map((item) => item.payload)), lastReviewedAt: reviews.at(-1)?.payload.reviewedAt ?? null, executionPermissionGranted: false };
  }
  async list(skillIds: readonly string[]): Promise<readonly SkillRegistryEntry[]> { return (await Promise.all([...new Set(skillIds)].map((skillId) => this.get(skillId)))).filter((entry): entry is SkillRegistryEntry => entry !== null); }
}
