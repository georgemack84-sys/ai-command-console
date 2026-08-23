import type {
  DurableKnowledgeRecord,
  KnowledgeLifecycleRepository,
  KnowledgeMetricsRepository,
  KnowledgeLifecycleTransition,
  KnowledgeLifecycleTransitionResult,
  KnowledgeReview,
  KnowledgeRetrievalRepository,
  KnowledgeException,
  KnowledgeExceptionRegistration,
  KnowledgeExceptionRegistrationResult,
  KnowledgeSupersession,
  KnowledgeSupersessionTransition,
  KnowledgeSupersessionTransitionResult,
} from "../../types/learning-constitution/durableKnowledge";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

export class InMemoryKnowledgeRepository implements KnowledgeRetrievalRepository, KnowledgeMetricsRepository {
  private readonly recordsById = new Map<string, DurableKnowledgeRecord>();
  private readonly recordsByCandidateId = new Map<string, DurableKnowledgeRecord>();
  private readonly supersessionsByReplacementId = new Map<string, KnowledgeSupersession>();
  private readonly exceptionsByKnowledgeId = new Map<string, KnowledgeException>();
  private readonly exceptionsByBaseKnowledgeId = new Map<string, KnowledgeException[]>();
  private readonly reviewsById = new Map<string, KnowledgeReview>();
  private readonly latestReviewByKnowledgeId = new Map<string, KnowledgeReview>();

  async create(record: DurableKnowledgeRecord): Promise<DurableKnowledgeRecord> {
    const existing = this.recordsByCandidateId.get(record.candidateId);
    if (existing) return existing;

    this.recordsById.set(record.knowledgeId, record);
    this.recordsByCandidateId.set(record.candidateId, record);
    return record;
  }

  async getById(knowledgeId: string): Promise<DurableKnowledgeRecord | undefined> {
    return this.recordsById.get(knowledgeId);
  }

  async findByCandidateId(candidateId: string): Promise<DurableKnowledgeRecord | undefined> {
    return this.recordsByCandidateId.get(candidateId);
  }

  async findAll(): Promise<readonly DurableKnowledgeRecord[]> {
    return [...this.recordsById.values()];
  }

  async supersede(
    transition: KnowledgeSupersessionTransition,
  ): Promise<KnowledgeSupersessionTransitionResult> {
    const existing = this.supersessionsByReplacementId.get(transition.replacementKnowledgeId);
    if (existing) {
      const priorRecord = this.recordsById.get(existing.priorKnowledgeId);
      const replacementRecord = this.recordsById.get(existing.replacementKnowledgeId);
      if (priorRecord && replacementRecord) {
        return { priorRecord, replacementRecord, relationship: existing };
      }
      throw new Error("supersession record is inconsistent");
    }

    const prior = this.recordsById.get(transition.priorKnowledgeId);
    const replacement = this.recordsById.get(transition.replacementKnowledgeId);
    if (!prior || !replacement) throw new Error("supersession knowledge record is missing");
    if (prior.lifecycleState !== "ACTIVE" || replacement.lifecycleState !== "ACTIVE") {
      throw new Error("supersession requires active records");
    }

    const supersededPrior: DurableKnowledgeRecord = { ...prior, lifecycleState: "SUPERSEDED" };
    this.recordsById.set(supersededPrior.knowledgeId, supersededPrior);
    this.recordsByCandidateId.set(supersededPrior.candidateId, supersededPrior);
    this.supersessionsByReplacementId.set(
      transition.replacementKnowledgeId,
      transition.relationship,
    );
    return {
      priorRecord: supersededPrior,
      replacementRecord: replacement,
      relationship: transition.relationship,
    };
  }

  async findSupersessionByReplacementId(
    replacementKnowledgeId: string,
  ): Promise<KnowledgeSupersession | undefined> {
    return this.supersessionsByReplacementId.get(replacementKnowledgeId);
  }

  async registerException(
    transition: KnowledgeExceptionRegistration,
  ): Promise<KnowledgeExceptionRegistrationResult> {
    const existing = this.exceptionsByKnowledgeId.get(transition.exceptionKnowledgeId);
    if (existing) {
      const baseRecord = this.recordsById.get(existing.baseKnowledgeId);
      const exceptionRecord = this.recordsById.get(existing.exceptionKnowledgeId);
      if (baseRecord && exceptionRecord) return { baseRecord, exceptionRecord, relationship: existing };
      throw new Error("exception registration is inconsistent");
    }

    const baseRecord = this.recordsById.get(transition.baseKnowledgeId);
    const exceptionRecord = this.recordsById.get(transition.exceptionKnowledgeId);
    if (!baseRecord || !exceptionRecord) throw new Error("exception knowledge record is missing");
    if (baseRecord.lifecycleState !== "ACTIVE" || exceptionRecord.lifecycleState !== "ACTIVE") {
      throw new Error("exception registration requires active records");
    }

    this.exceptionsByKnowledgeId.set(transition.exceptionKnowledgeId, transition.relationship);
    const baseExceptions = this.exceptionsByBaseKnowledgeId.get(transition.baseKnowledgeId) ?? [];
    this.exceptionsByBaseKnowledgeId.set(transition.baseKnowledgeId, [...baseExceptions, transition.relationship]);
    return { baseRecord, exceptionRecord, relationship: transition.relationship };
  }

  async findExceptionByKnowledgeId(exceptionKnowledgeId: string): Promise<KnowledgeException | undefined> {
    return this.exceptionsByKnowledgeId.get(exceptionKnowledgeId);
  }

  async findActiveByScope(scope: KnowledgeScopeReference): Promise<readonly DurableKnowledgeRecord[]> {
    const scopeIdentity = "id" in scope ? `${scope.type}:${scope.id}` : scope.type;
    return [...this.recordsById.values()].filter((record) => {
      const recordScopeIdentity = "id" in record.scope
        ? `${record.scope.type}:${record.scope.id}`
        : record.scope.type;
      return record.lifecycleState === "ACTIVE" && recordScopeIdentity === scopeIdentity;
    });
  }

  async findExceptionsByBaseKnowledgeId(baseKnowledgeId: string): Promise<readonly KnowledgeException[]> {
    return this.exceptionsByBaseKnowledgeId.get(baseKnowledgeId) ?? [];
  }

  async createReview(review: KnowledgeReview): Promise<KnowledgeReview> {
    const existing = this.reviewsById.get(review.reviewId);
    if (existing) return existing;
    this.reviewsById.set(review.reviewId, review);
    this.latestReviewByKnowledgeId.set(review.knowledgeId, review);
    return review;
  }

  async findReviewById(reviewId: string): Promise<KnowledgeReview | undefined> {
    return this.reviewsById.get(reviewId);
  }

  async findLatestReviewByKnowledgeId(knowledgeId: string): Promise<KnowledgeReview | undefined> {
    return this.latestReviewByKnowledgeId.get(knowledgeId);
  }

  async transitionLifecycle(
    transition: KnowledgeLifecycleTransition,
  ): Promise<KnowledgeLifecycleTransitionResult> {
    const priorRecord = this.recordsById.get(transition.knowledgeId);
    if (!priorRecord) throw new Error("knowledge record is missing");
    if (priorRecord.lifecycleState !== "ACTIVE") throw new Error("lifecycle transition requires active knowledge");

    const updatedRecord: DurableKnowledgeRecord = {
      ...priorRecord,
      lifecycleState: transition.newLifecycleState,
    };
    this.recordsById.set(updatedRecord.knowledgeId, updatedRecord);
    this.recordsByCandidateId.set(updatedRecord.candidateId, updatedRecord);
    return { priorRecord, updatedRecord };
  }
}
