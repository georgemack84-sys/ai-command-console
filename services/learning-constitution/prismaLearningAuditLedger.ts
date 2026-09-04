import { createHash } from "node:crypto";

import { prisma } from "../../src/server/db/prisma";
import type { LearningAuditEntry, LearningAuditEvent, LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type Row = Readonly<{ eventId: string; sequence: number; previousHash: string | null; eventHash: string; payload: unknown }>;
type Client = Readonly<{ noesisLearningAuditEvent: Readonly<{ findUnique(args: object): Promise<Row | null>; findMany(args: object): Promise<Row[]>; create(args: object): Promise<Row> }> }>;
const client = prisma as unknown as Client;
const hash = (event: LearningAuditEvent, sequence: number, previousHash: string | null) => createHash("sha256").update(canonicalizeAuditValue({ event, sequence, previousHash }), "utf8").digest("hex");

/** PostgreSQL append-only Phase 10 ledger; its trigger forbids post-commit mutation. */
export class PrismaLearningAuditLedger implements LearningAuditLedger {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async append(event: LearningAuditEvent): Promise<LearningAuditEntry> {
    if (!this.workspaceId.trim() || event.workspaceId !== this.workspaceId) throw new Error("audit workspace scope mismatch");
    const existing = await this.db.noesisLearningAuditEvent.findUnique({ where: { eventId: event.eventId } });
    if (existing) {
      const entry = existing.payload as LearningAuditEntry;
      if (canonicalizeAuditValue(entry.event) !== canonicalizeAuditValue(event)) throw new Error("audit event id collision");
      return entry;
    }
    const entries = await this.list(this.workspaceId);
    const previousHash = entries.at(-1)?.eventHash ?? null;
    const entry: LearningAuditEntry = { sequence: entries.length + 1, previousHash, eventHash: hash(event, entries.length + 1, previousHash), event };
    await this.db.noesisLearningAuditEvent.create({ data: { eventId: event.eventId, workspaceId: this.workspaceId, sequence: entry.sequence, previousHash, eventHash: entry.eventHash, eventType: event.eventType, correlationId: event.correlationId, knowledgeIds: event.references.knowledgeIds ?? [], payload: entry as object, occurredAt: new Date(event.occurredAt) } });
    return entry;
  }

  async list(workspaceId: string): Promise<readonly LearningAuditEntry[]> {
    if (workspaceId !== this.workspaceId) throw new Error("audit workspace scope mismatch");
    return (await this.db.noesisLearningAuditEvent.findMany({ where: { workspaceId }, orderBy: { sequence: "asc" } })).map((row) => row.payload as LearningAuditEntry);
  }
  async findByKnowledgeId(workspaceId: string, knowledgeId: string): Promise<readonly LearningAuditEntry[]> {
    return (await this.list(workspaceId)).filter((entry) => entry.event.references.knowledgeIds?.includes(knowledgeId));
  }
}
