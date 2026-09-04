import type { HumanAuthorizedProcedure, ProcedureArtifactStore, ProcedureHumanReview, ProcedureHumanReviewRepository } from "../../types/learning-constitution/procedureLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

export class InMemoryProcedureHumanReviewRepository implements ProcedureHumanReviewRepository {
  private readonly reviews = new Map<string, ProcedureHumanReview[]>(); private readonly authorized = new Map<string, HumanAuthorizedProcedure>();
  async append(review: ProcedureHumanReview): Promise<ProcedureHumanReview> { const existing = this.reviews.get(review.procedureId) ?? []; const replay = existing.find((item) => item.reviewId === review.reviewId); if (replay && canonicalizeAuditValue(replay) !== canonicalizeAuditValue(review)) throw new Error("procedure review id collision"); if (!replay) this.reviews.set(review.procedureId, [...existing, review]); return replay ?? review; }
  async appendAuthorized(authorized: HumanAuthorizedProcedure): Promise<HumanAuthorizedProcedure> { const replay = this.authorized.get(authorized.authorizedProcedureId); if (replay && canonicalizeAuditValue(replay) !== canonicalizeAuditValue(authorized)) throw new Error("authorized procedure id collision"); this.authorized.set(authorized.authorizedProcedureId, replay ?? authorized); return replay ?? authorized; }
  async list(procedureId: string) { return [...(this.reviews.get(procedureId) ?? [])]; }
}

/** Only a human can create the pending-gate interpretation; incomplete procedures are never approvable. */
export class ProcedureHumanReviewService {
  constructor(private readonly repository: ProcedureHumanReviewRepository, private readonly audit?: LearningAuditLedger, private readonly artifacts?: ProcedureArtifactStore) {}
  async record(input: Readonly<{ review: ProcedureHumanReview; candidate: HumanAuthorizedProcedure["procedure"]; authorizedProcedureId?: string }>, workspaceId: string, correlationId: string): Promise<Readonly<{ review: ProcedureHumanReview; authorized?: HumanAuthorizedProcedure; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    if (input.review.actor.actorType !== "HUMAN" || !input.review.actor.actorId.trim()) throw new Error("procedure review requires a human actor");
    if (input.review.procedureId !== input.candidate.procedureId || !input.review.note.trim()) throw new Error("procedure review must identify its candidate and note");
    if (input.review.action === "APPROVE" && input.candidate.status !== "CANDIDATE") throw new Error("incomplete procedure cannot be approved");
    const review = await this.repository.append(input.review); const authorized = input.review.action === "APPROVE" ? await this.repository.appendAuthorized({ authorizedProcedureId: input.authorizedProcedureId ?? `authorized-procedure:${input.candidate.procedureId}:${review.reviewId}`, procedureId: input.candidate.procedureId, reviewId: review.reviewId, procedure: input.candidate, authority: "HUMAN_DIRECTIVE", status: "PENDING_CONFLICT_AND_GATE", authorizedBy: review.actor, authorizedAt: review.reviewedAt, immutable: true, executionPermissionGranted: false }) : undefined;
    await this.artifacts?.append({ artifactId: `PROCEDURE_REVIEW:${review.reviewId}`, artifactType: "PROCEDURE_REVIEW", subjectId: review.procedureId, payload: review, createdAt: review.reviewedAt }); if (authorized) await this.artifacts?.append({ artifactId: `AUTHORIZED_PROCEDURE:${authorized.authorizedProcedureId}`, artifactType: "AUTHORIZED_PROCEDURE", subjectId: authorized.procedureId, payload: authorized, createdAt: authorized.authorizedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:procedure-review:${review.reviewId}`, eventType: review.action === "APPROVE" ? "PROCEDURE_APPROVED" : "PROCEDURE_CANDIDATE_CREATED", workspaceId, occurredAt: review.reviewedAt, actor: review.actor, correlationId, schemaVersion: "10.0", references: { provenanceIds: [input.candidate.teachingEventId] }, payload: { procedureId: review.procedureId, action: review.action, authorizedProcedureId: authorized?.authorizedProcedureId, durableMutationAuthorized: false } });
    return { review, authorized, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
