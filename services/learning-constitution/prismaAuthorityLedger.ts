import { prisma } from "../../src/server/db/prisma";
import type { AuthorityLedger, AuthorityLedgerEvent, AuthorityRecord } from "../../types/learning-constitution";

type StoredAuthorityLedgerEvent = Awaited<ReturnType<typeof prisma.authorityLedgerEventRecord.findMany>>[number];

const toEvent = (record: StoredAuthorityLedgerEvent): AuthorityLedgerEvent => ({
  eventId: record.eventId,
  eventType: record.eventType as AuthorityLedgerEvent["eventType"],
  authorityId: record.authorityId,
  ...(record.relatedAuthorityId ? { relatedAuthorityId: record.relatedAuthorityId } : {}),
  reason: record.reason,
  ...(record.authorityRecord ? { authorityRecord: record.authorityRecord as unknown as AuthorityRecord } : {}),
  ...(record.previousAuthorityType ? { previousAuthorityType: record.previousAuthorityType as AuthorityRecord["authorityType"] } : {}),
  ...(record.newAuthorityType ? { newAuthorityType: record.newAuthorityType as AuthorityRecord["authorityType"] } : {}),
  ...(record.authorizedBy ? { authorizedBy: record.authorizedBy } : {}),
  ...(record.evidenceIds.length ? { evidenceIds: record.evidenceIds } : {}),
  occurredAt: record.occurredAt.toISOString(),
});

/** PostgreSQL-backed append-only authority ledger. Mutation and deletion are intentionally absent. */
export class PrismaAuthorityLedger implements AuthorityLedger {
  async append<T extends AuthorityLedgerEvent>(event: T): Promise<T> {
    await prisma.authorityLedgerEventRecord.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        authorityId: event.authorityId,
        relatedAuthorityId: event.relatedAuthorityId,
        reason: event.reason,
        authorityRecord: event.authorityRecord as object | undefined,
        previousAuthorityType: event.previousAuthorityType,
        newAuthorityType: event.newAuthorityType,
        authorizedBy: event.authorizedBy,
        evidenceIds: [...(event.evidenceIds ?? [])],
        occurredAt: new Date(event.occurredAt),
      },
    });
    return event;
  }

  async findByAuthorityId(authorityId: string): Promise<readonly AuthorityLedgerEvent[]> {
    return (await prisma.authorityLedgerEventRecord.findMany({ where: { OR: [{ authorityId }, { relatedAuthorityId: authorityId }] }, orderBy: [{ occurredAt: "asc" }, { eventId: "asc" }] })).map(toEvent);
  }

  async findAll(): Promise<readonly AuthorityLedgerEvent[]> {
    return (await prisma.authorityLedgerEventRecord.findMany({ orderBy: [{ occurredAt: "asc" }, { eventId: "asc" }] })).map(toEvent);
  }
}
