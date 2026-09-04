import { createHash } from "node:crypto";

import { prisma } from "../../src/server/db/prisma";
import type { DeferredCandidateRecord, DeferredCandidateRegistry, DeferredCandidateStatus } from "../../types/learning-constitution/deferredCandidateLifecycle";
import type { DeferredCandidateResolutionEvent, DeferredCandidateResolutionLedger } from "../../types/learning-constitution/deferredCandidateResolution";
import type { GateAuditEvent, GateAuditLedger } from "../../types/learning-constitution/durableLearningGate";
import type { GateAuditEventReader } from "../../types/learning-constitution/gateObservability";

type GateRow = Readonly<{ eventId: string; workspaceId: string; sequence: number; previousHash: string | null; eventHash: string; payload: unknown }>;
type DeferredRow = Readonly<{ eventId: string; sequence: number; previousHash: string | null; eventHash: string; payload: unknown }>;
type Client = Readonly<{
  noesisGateAuditEventRecord: Readonly<{ findUnique(args: object): Promise<GateRow | null>; findMany(args: object): Promise<GateRow[]>; create(args: object): Promise<GateRow> }>;
  noesisDeferredCandidateEvent: Readonly<{ findMany(args: object): Promise<DeferredRow[]>; create(args: object): Promise<DeferredRow> }>;
  noesisDeferredResolutionEvent: Readonly<{ findUnique(args: object): Promise<DeferredRow | null>; findMany(args: object): Promise<DeferredRow[]>; create(args: object): Promise<DeferredRow> }>;
}>;
const client = prisma as unknown as Client;

/** PostgreSQL JSONB does not preserve object key insertion order. */
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]));
  }
  return value;
};

const hash = (payload: unknown, sequence: number, previousHash: string | null): string =>
  createHash("sha256").update(JSON.stringify(canonicalize({ payload, sequence, previousHash }))).digest("hex");

/** PostgreSQL-backed append-only gate audit with per-workspace chain verification. */
export class PrismaGateAuditLedger implements GateAuditLedger, GateAuditEventReader {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async append(event: GateAuditEvent): Promise<GateAuditEvent> {
    const existing = await this.db.noesisGateAuditEventRecord.findUnique({ where: { eventId: event.eventId } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId) throw new Error("gate audit event belongs to another workspace");
      const replay = existing.payload as GateAuditEvent;
      if (JSON.stringify(canonicalize({ ...replay, occurredAt: "" })) !== JSON.stringify(canonicalize({ ...event, occurredAt: "" }))) throw new Error("gate audit event id collision");
      return replay;
    }
    const entries = await this.entries();
    const previousHash = entries.at(-1)?.eventHash ?? null;
    const sequence = entries.length + 1;
    await this.db.noesisGateAuditEventRecord.create({ data: { eventId: event.eventId, workspaceId: this.workspaceId, sequence, previousHash, eventHash: hash(event, sequence, previousHash), candidateId: event.decision.candidateId, payload: event as object, occurredAt: new Date(event.occurredAt) } });
    return event;
  }

  async findByCandidateId(candidateId: string): Promise<readonly GateAuditEvent[]> {
    return (await this.entries()).map((row) => row.payload as GateAuditEvent).filter((event) => event.decision.candidateId === candidateId);
  }

  async listEvents(): Promise<readonly GateAuditEvent[]> {
    return (await this.entries()).map((row) => row.payload as GateAuditEvent);
  }

  async verifyIntegrity(): Promise<boolean> {
    try { await this.entries(); return true; } catch { return false; }
  }

  private async entries(): Promise<readonly GateRow[]> {
    if (!this.workspaceId.trim()) throw new Error("gate audit requires a workspace scope");
    const entries = await this.db.noesisGateAuditEventRecord.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { sequence: "asc" } });
    this.verify(entries);
    return entries;
  }

  private verify(entries: readonly GateRow[]): void {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!; const previousHash = index === 0 ? null : entries[index - 1]!.eventHash;
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || entry.eventHash !== hash(entry.payload, entry.sequence, entry.previousHash)) throw new Error("gate audit ledger integrity violation");
    }
  }
}

/** PostgreSQL-backed append-only deferred lifecycle history with a derived current view. */
export class PrismaDeferredCandidateRegistry implements DeferredCandidateRegistry {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async upsert(record: DeferredCandidateRecord): Promise<DeferredCandidateRecord> {
    const entries = await this.entries();
    const current = this.derive(entries).get(record.deferredCandidateId);
    if (current && JSON.stringify(current) === JSON.stringify(record)) return current;
    const previousHash = entries.at(-1)?.eventHash ?? null;
    const sequence = entries.length + 1;
    await this.db.noesisDeferredCandidateEvent.create({ data: { eventId: `deferred-event:${record.deferredCandidateId}:${record.lastEvaluationId}`, workspaceId: this.workspaceId, sequence, previousHash, eventHash: hash(record, sequence, previousHash), deferredCandidateId: record.deferredCandidateId, candidateId: record.candidateId, payload: record as object, occurredAt: new Date(record.updatedAt) } });
    return current ? { ...record, createdAt: current.createdAt } : record;
  }

  async get(deferredCandidateId: string): Promise<DeferredCandidateRecord | undefined> {
    return this.derive(await this.entries()).get(deferredCandidateId);
  }

  async list(status?: DeferredCandidateStatus): Promise<readonly DeferredCandidateRecord[]> {
    return [...this.derive(await this.entries()).values()].filter((record) => !status || record.status === status).sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.deferredCandidateId.localeCompare(right.deferredCandidateId));
  }

  private async entries(): Promise<readonly DeferredRow[]> {
    if (!this.workspaceId.trim()) throw new Error("deferred candidate registry requires a workspace scope");
    const entries = await this.db.noesisDeferredCandidateEvent.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { sequence: "asc" } });
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!; const previousHash = index === 0 ? null : entries[index - 1]!.eventHash;
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || entry.eventHash !== hash(entry.payload, entry.sequence, entry.previousHash)) throw new Error("deferred candidate ledger integrity violation");
    }
    return entries;
  }

  private derive(entries: readonly DeferredRow[]): Map<string, DeferredCandidateRecord> {
    return new Map(entries.map((entry) => { const record = entry.payload as DeferredCandidateRecord; return [record.deferredCandidateId, record]; }));
  }
}

/** PostgreSQL-backed resolution provenance. It never updates or deletes a submitted resolution. */
export class PrismaDeferredCandidateResolutionLedger implements DeferredCandidateResolutionLedger {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async append(event: DeferredCandidateResolutionEvent): Promise<DeferredCandidateResolutionEvent> {
    if (!this.workspaceId.trim()) throw new Error("deferred candidate resolution requires a workspace scope");
    const existing = await this.db.noesisDeferredResolutionEvent.findUnique({ where: { eventId: event.eventId } });
    if (existing) {
      const replay = existing.payload as DeferredCandidateResolutionEvent;
      if (JSON.stringify(replay) !== JSON.stringify(event)) throw new Error("resolution event id collision");
      return replay;
    }
    const entries = await this.entries();
    const previousHash = entries.at(-1)?.eventHash ?? null;
    const sequence = entries.length + 1;
    await this.db.noesisDeferredResolutionEvent.create({ data: { eventId: event.eventId, workspaceId: this.workspaceId, sequence, previousHash, eventHash: hash(event, sequence, previousHash), candidateId: event.candidateId, payload: event as object, occurredAt: new Date(event.occurredAt) } });
    return event;
  }

  async findByCandidateId(candidateId: string): Promise<readonly DeferredCandidateResolutionEvent[]> {
    return (await this.entries()).map((entry) => entry.payload as DeferredCandidateResolutionEvent).filter((event) => event.candidateId === candidateId);
  }

  async verifyIntegrity(): Promise<boolean> {
    try { await this.entries(); return true; } catch { return false; }
  }

  private async entries(): Promise<readonly DeferredRow[]> {
    const entries = await this.db.noesisDeferredResolutionEvent.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { sequence: "asc" } });
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index]!; const previousHash = index === 0 ? null : entries[index - 1]!.eventHash;
      if (entry.sequence !== index + 1 || entry.previousHash !== previousHash || entry.eventHash !== hash(entry.payload, entry.sequence, entry.previousHash)) throw new Error("deferred candidate resolution ledger integrity violation");
    }
    return entries;
  }
}
