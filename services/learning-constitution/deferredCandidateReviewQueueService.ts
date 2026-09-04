import type { DeferredCandidateRecord, DeferredCandidateRegistry } from "../../types/learning-constitution/deferredCandidateLifecycle";

export type DeferredCandidateQueueItem = Readonly<{
  deferredCandidateId: string;
  candidateId: string;
  blockingReasons: readonly string[];
  lastEvaluationId: string;
  queuedAt: string;
}>;

/** Read-only operator view. It cannot approve, mutate, or promote candidates. */
export class DeferredCandidateReviewQueueService {
  constructor(private readonly registry: DeferredCandidateRegistry) {}

  async listPending(): Promise<readonly DeferredCandidateQueueItem[]> {
    const pending = await this.registry.list("PENDING");
    return pending.map((record) => this.toQueueItem(record));
  }

  private toQueueItem(record: DeferredCandidateRecord): DeferredCandidateQueueItem {
    return {
      deferredCandidateId: record.deferredCandidateId,
      candidateId: record.candidateId,
      blockingReasons: record.reasonCodes,
      lastEvaluationId: record.lastEvaluationId,
      queuedAt: record.createdAt,
    };
  }
}
