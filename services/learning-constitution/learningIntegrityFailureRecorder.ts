import type { LearningFailureLedger, LearningIntegrityFailure, LearningIntegrityFailureRecorder as RecorderContract } from "../../types/learning-constitution/learningAuditFailure";

/** Records only learning-integrity/security failures, not ordinary application errors. */
export class CanonicalLearningIntegrityFailureRecorder implements RecorderContract {
  constructor(private readonly ledger: LearningFailureLedger) {}
  async record(failure: LearningIntegrityFailure): Promise<void> {
    await this.ledger.append({ eventId: failure.eventId, eventType: failure.eventType, workspaceId: failure.workspaceId, occurredAt: failure.occurredAt, actor: failure.actor, correlationId: failure.correlationId, ...(failure.causationId ? { causationId: failure.causationId } : {}), schemaVersion: "10.0", references: failure.references ?? {}, payload: { reason: failure.reason } });
  }
}
