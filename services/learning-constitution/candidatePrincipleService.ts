import type { CandidatePrinciple, CandidatePrincipleEligibility, CandidatePrincipleExtractionInput, CandidatePrincipleRepository, PrincipleGeneralizationLevel } from "../../types/learning-constitution/principleLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

const minDiversity: Readonly<Record<PrincipleGeneralizationLevel, number>> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };
const maxLevelForScope = (scope: CandidatePrinciple["scope"]): PrincipleGeneralizationLevel => scope.type === "PROJECT" || scope.type === "COMPONENT" || scope.type === "TASK" ? 2 : scope.type === "WORKSPACE" || scope.type === "DOMAIN" ? 3 : 4;

/** Converts a retained pattern to an immutable proposal; it deliberately exposes no durable or authority transition. */
export class CandidatePrincipleService {
  constructor(private readonly audit?: LearningAuditLedger, private readonly repository?: CandidatePrincipleRepository) {}
  async extract(input: CandidatePrincipleExtractionInput, workspaceId: string, correlationId: string): Promise<CandidatePrinciple> {
    if (input.evaluation.disposition !== "RETAIN") throw new Error("only retained patterns may produce candidate principles");
    if (!input.proposedPrinciple.trim() || !input.rationale.trim()) throw new Error("candidate principle requires a proposed principle and rationale");
    if (Date.parse(input.reviewExpiresAt) <= Date.parse(input.createdAt)) throw new Error("candidate principle review expiry must be after creation");
    if (input.pattern.diversityCount < minDiversity[input.generalizationLevel]) throw new Error("evidence diversity does not support requested generalization level");
    if (input.generalizationLevel > maxLevelForScope(input.scope)) throw new Error("candidate principle scope does not support requested generalization level");
    const candidate: CandidatePrinciple = { candidatePrincipleId: input.candidatePrincipleId, patternId: input.pattern.patternId, proposedPrinciple: input.proposedPrinciple, rationale: input.rationale, evidenceIds: input.pattern.supportingEvidence.map((item) => item.evidenceId), counterevidenceIds: input.pattern.contradictingEvidence.map((item) => item.evidenceId), scope: input.scope, preconditions: [...new Set(input.preconditions)], exceptions: [...new Set(input.exceptions)], confidence: input.pattern.confidence, authority: "AGENT_INFERRED", generalizationLevel: input.generalizationLevel, alternativeInterpretations: input.pattern.alternativeExplanations, disconfirmationCondition: input.pattern.disconfirmationCondition, provenanceIds: [...new Set([...input.pattern.supportingEvidence, ...input.pattern.contradictingEvidence].map((item) => item.provenanceId))], reviewStatus: "AWAITING_HUMAN_REVIEW", createdBy: input.createdBy, createdAt: input.createdAt, reviewExpiresAt: input.reviewExpiresAt, immutable: true };
    const persisted = this.repository ? await this.repository.append(candidate) : candidate;
    if (this.audit) await this.audit.append({ eventId: `audit:candidate-principle:${candidate.candidatePrincipleId}`, eventType: "CANDIDATE_PRINCIPLE_CREATED", workspaceId, occurredAt: candidate.createdAt, actor: candidate.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { candidatePrincipleId: candidate.candidatePrincipleId, patternId: candidate.patternId, authority: candidate.authority, generalizationLevel: candidate.generalizationLevel, reviewStatus: candidate.reviewStatus } });
    return persisted;
  }
  async reviewEligibility(candidate: CandidatePrinciple, now: string, workspaceId?: string, correlationId?: string): Promise<CandidatePrincipleEligibility> {
    const expired = Date.parse(now) >= Date.parse(candidate.reviewExpiresAt); const result: CandidatePrincipleEligibility = { candidatePrincipleId: candidate.candidatePrincipleId, status: expired ? "EXPIRED" : "ELIGIBLE", reason: expired ? "REVIEW_WINDOW_EXPIRED" : "AWAITING_HUMAN_REVIEW", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (expired && this.audit && workspaceId && correlationId) await this.audit.append({ eventId: `audit:candidate-principle-expired:${candidate.candidatePrincipleId}`, eventType: "CANDIDATE_PRINCIPLE_EXPIRED", workspaceId, occurredAt: now, actor: { actorId: "system:noesis", actorType: "SYSTEM" }, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { candidatePrincipleId: candidate.candidatePrincipleId, mutationAuthorized: false } });
    return result;
  }
}
