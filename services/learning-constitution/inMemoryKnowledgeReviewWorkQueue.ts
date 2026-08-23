import type { KnowledgeReview } from "../../types/learning-constitution/durableKnowledge";
import type {
  KnowledgeReviewWorkItem,
  KnowledgeReviewWorkQueueRepository,
} from "../../types/learning-constitution/knowledgeReviewQueue";

export class InMemoryKnowledgeReviewWorkQueue implements KnowledgeReviewWorkQueueRepository {
  private readonly itemsById = new Map<string, KnowledgeReviewWorkItem>();

  async create(item: KnowledgeReviewWorkItem): Promise<KnowledgeReviewWorkItem> {
    const existing = this.itemsById.get(item.workItemId);
    if (existing) return existing;
    this.itemsById.set(item.workItemId, item);
    return item;
  }

  async getById(workItemId: string): Promise<KnowledgeReviewWorkItem | undefined> {
    return this.itemsById.get(workItemId);
  }

  async findOpenByKnowledgeId(knowledgeId: string): Promise<KnowledgeReviewWorkItem | undefined> {
    return [...this.itemsById.values()].find((item) =>
      item.knowledgeId === knowledgeId && (item.state === "QUEUED" || item.state === "IN_REVIEW"),
    );
  }

  async findAll(): Promise<readonly KnowledgeReviewWorkItem[]> {
    return [...this.itemsById.values()];
  }

  async complete(
    workItemId: string,
    review: KnowledgeReview,
    completedAt: string,
  ): Promise<KnowledgeReviewWorkItem> {
    const existing = this.itemsById.get(workItemId);
    if (!existing) throw new Error("review work item is missing");
    if (existing.state === "COMPLETED") return existing;
    if (existing.state !== "QUEUED" && existing.state !== "IN_REVIEW") {
      throw new Error("review work item is not open");
    }
    const completed: KnowledgeReviewWorkItem = {
      ...existing,
      state: "COMPLETED",
      completedAt,
      completedReviewId: review.reviewId,
    };
    this.itemsById.set(workItemId, completed);
    return completed;
  }
}
