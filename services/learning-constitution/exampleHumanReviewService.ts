import type { ApprovedLearningExample, ExampleArtifactStore, ExampleHumanReview, ExampleValidator, LearningExample } from "../../types/learning-constitution/exampleLibrary";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Human decisions are append-only evidence. Approval makes an example usable for instruction, never authoritative. */
export class ExampleHumanReviewService {
  constructor(private readonly validator: ExampleValidator, private readonly artifacts: ExampleArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(input: Readonly<{ review: ExampleHumanReview; candidate: LearningExample; approvedExampleId?: string }>, workspaceId: string, correlationId: string): Promise<Readonly<{ review: ExampleHumanReview; approved?: ApprovedLearningExample; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const { review, candidate } = input;
    if (review.actor.actorType !== "HUMAN" || !review.actor.actorId.trim()) throw new Error("example review requires a human actor");
    if (review.exampleId !== candidate.exampleId || !review.note.trim()) throw new Error("example review must identify its candidate and note");
    if (review.action === "APPROVE" && this.validator.validate(candidate).status !== "VALID") throw new Error("only a valid example candidate can be approved");
    await this.artifacts.append({ artifactId: `EXAMPLE_REVIEW:${review.reviewId}`, artifactType: "REVIEW", subjectId: candidate.exampleId, payload: review, createdAt: review.reviewedAt });
    const approved = review.action === "APPROVE" ? { approvedExampleId: input.approvedExampleId ?? `approved-example:${candidate.exampleId}:${review.reviewId}`, reviewId: review.reviewId, example: candidate, authority: "APPROVED_EXAMPLE" as const, status: "APPROVED" as const, approvedBy: review.actor, approvedAt: review.reviewedAt, immutable: true as const, parentMutationAuthorized: false as const, executionPermissionGranted: false as const } : undefined;
    if (approved) await this.artifacts.append({ artifactId: `EXAMPLE_APPROVAL:${approved.approvedExampleId}`, artifactType: "APPROVAL", subjectId: candidate.exampleId, payload: approved, createdAt: approved.approvedAt });
    else await this.artifacts.append({ artifactId: `EXAMPLE_REJECTION:${review.reviewId}`, artifactType: "REJECTION", subjectId: candidate.exampleId, payload: review, createdAt: review.reviewedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:example-review:${review.reviewId}`, eventType: review.action === "APPROVE" ? "EXAMPLE_APPROVED" : "EXAMPLE_REJECTED", workspaceId, occurredAt: review.reviewedAt, actor: review.actor, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { reviewId: review.reviewId, exampleId: candidate.exampleId, parentId: candidate.parent.parentId, action: review.action, approvedExampleId: approved?.approvedExampleId, parentMutationAuthorized: false, executionPermissionGranted: false } });
    return { review, approved, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
