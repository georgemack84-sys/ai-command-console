import type { CandidatePrincipleReview, CandidatePrincipleReviewRepository, HumanAuthorizedPrinciple, PrincipleReviewRequest } from "../../types/learning-constitution/principleLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

export class InMemoryCandidatePrincipleReviewRepository implements CandidatePrincipleReviewRepository {
  private readonly reviews = new Map<string, CandidatePrincipleReview[]>(); private readonly interpretations = new Map<string, HumanAuthorizedPrinciple>();
  async append(review: CandidatePrincipleReview): Promise<CandidatePrincipleReview> { const existing = this.reviews.get(review.candidatePrincipleId) ?? []; const replay = existing.find((item) => item.reviewId === review.reviewId); if (replay && canonicalizeAuditValue(replay) !== canonicalizeAuditValue(review)) throw new Error("principle review id collision"); if (!replay) this.reviews.set(review.candidatePrincipleId, [...existing, review]); return replay ?? review; }
  async appendInterpretation(interpretation: HumanAuthorizedPrinciple): Promise<HumanAuthorizedPrinciple> { const replay = this.interpretations.get(interpretation.interpretationId); if (replay && canonicalizeAuditValue(replay) !== canonicalizeAuditValue(interpretation)) throw new Error("human-authorized principle id collision"); this.interpretations.set(interpretation.interpretationId, replay ?? interpretation); return replay ?? interpretation; }
  async list(candidatePrincipleId: string) { return [...(this.reviews.get(candidatePrincipleId) ?? [])]; }
}

const authorizationActions = new Set(["APPROVE", "MODIFY", "NARROW_SCOPE", "EXPAND_SCOPE", "ADD_EXCEPTION"]);
/** Human review is the sole source of a human-authorized interpretation; it grants no durable or execution capability. */
export class PrincipleHumanReviewService {
  constructor(private readonly repository: CandidatePrincipleReviewRepository, private readonly audit?: LearningAuditLedger) {}
  async record(input: PrincipleReviewRequest, workspaceId: string, correlationId: string): Promise<Readonly<{ review: CandidatePrincipleReview; interpretation?: HumanAuthorizedPrinciple; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const { review, candidate } = input;
    if (review.actor.actorType !== "HUMAN" || !review.actor.actorId.trim()) throw new Error("principle review requires a human actor");
    if (review.candidatePrincipleId !== candidate.candidatePrincipleId || !review.note.trim()) throw new Error("principle review must identify its candidate and note");
    const storedReview = await this.repository.append(review); let interpretation: HumanAuthorizedPrinciple | undefined;
    if (authorizationActions.has(review.action)) {
      const proposal = input.interpretation;
      if (!proposal || !proposal.statement.trim() || !proposal.rationale.trim()) throw new Error("authorization review requires a reviewed interpretation");
      interpretation = await this.repository.appendInterpretation({ ...proposal, candidatePrincipleId: candidate.candidatePrincipleId, reviewId: review.reviewId, authority: "HUMAN_DECISION", status: "PENDING_CONFLICT_AND_GATE", authorizedBy: review.actor, authorizedAt: review.reviewedAt, immutable: true, executionPermissionGranted: false });
    }
    if (this.audit) await this.audit.append({ eventId: `audit:principle-review:${review.reviewId}`, eventType: review.action === "APPROVE" ? "PRINCIPLE_APPROVED" : review.action === "REJECT" ? "PRINCIPLE_REJECTED" : "PRINCIPLE_MODIFIED", workspaceId, occurredAt: review.reviewedAt, actor: review.actor, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { reviewId: review.reviewId, candidatePrincipleId: candidate.candidatePrincipleId, action: review.action, interpretationId: interpretation?.interpretationId, durableMutationAuthorized: false } });
    return { review: storedReview, interpretation, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
