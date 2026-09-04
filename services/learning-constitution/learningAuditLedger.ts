import { createHash } from "node:crypto";

import type { LearningAuditEntry, LearningAuditEvent, LearningAuditLedger as LearningAuditLedgerContract } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

const hash = (event: LearningAuditEvent, sequence: number, previousHash: string | null): string =>
  createHash("sha256").update(canonicalizeAuditValue({ event, sequence, previousHash }), "utf8").digest("hex");

const valid = (event: LearningAuditEvent): void => {
  if (!event.eventId.trim() || !event.workspaceId.trim() || !event.correlationId.trim() || !event.actor.actorId.trim()) throw new Error("audit event identity is required");
  if (Number.isNaN(Date.parse(event.occurredAt))) throw new Error("audit event timestamp must be ISO-8601");
};

/** In-memory reference implementation for Phase 10's global, workspace-scoped immutable event chain. */
export class InMemoryLearningAuditLedger implements LearningAuditLedgerContract {
  private readonly entriesByWorkspace = new Map<string, LearningAuditEntry[]>();

  async append(event: LearningAuditEvent): Promise<LearningAuditEntry> {
    valid(event);
    const entries = this.entriesByWorkspace.get(event.workspaceId) ?? [];
    const replay = entries.find((entry) => entry.event.eventId === event.eventId);
    if (replay) {
      if (canonicalizeAuditValue(replay.event) !== canonicalizeAuditValue(event)) throw new Error("audit event id collision");
      return replay;
    }
    const previousHash = entries.at(-1)?.eventHash ?? null;
    const entry: LearningAuditEntry = { sequence: entries.length + 1, previousHash, eventHash: hash(event, entries.length + 1, previousHash), event };
    this.entriesByWorkspace.set(event.workspaceId, [...entries, entry]);
    return entry;
  }

  async list(workspaceId: string): Promise<readonly LearningAuditEntry[]> { return [...(this.entriesByWorkspace.get(workspaceId) ?? [])]; }
  async findByKnowledgeId(workspaceId: string, knowledgeId: string): Promise<readonly LearningAuditEntry[]> {
    return (await this.list(workspaceId)).filter((entry) => entry.event.references.knowledgeIds?.includes(knowledgeId));
  }
}
