import type { AuthorityLedger, AuthorityLedgerEvent } from "../../types/learning-constitution";

/** Append-only in-memory authority ledger for governed authority events. */
export class InMemoryAuthorityLedger implements AuthorityLedger {
  private readonly events: AuthorityLedgerEvent[] = [];
  async append<T extends AuthorityLedgerEvent>(event: T): Promise<T> {
    if (this.events.some((existing) => existing.eventId === event.eventId)) throw new Error("authority ledger event id already exists");
    const snapshot: AuthorityLedgerEvent = Object.freeze({
      ...event,
      evidenceIds: event.evidenceIds ? Object.freeze([...event.evidenceIds]) : undefined,
      authorityRecord: event.authorityRecord ? Object.freeze({
        ...event.authorityRecord,
        scope: Object.freeze({ ...event.authorityRecord.scope }),
        supersedes: Object.freeze([...event.authorityRecord.supersedes]),
        constraints: Object.freeze([...event.authorityRecord.constraints]),
        provenance: Object.freeze({ ...event.authorityRecord.provenance }),
      }) : undefined,
    });
    this.events.push(snapshot);
    return snapshot as T;
  }
  async findByAuthorityId(authorityId: string): Promise<readonly AuthorityLedgerEvent[]> {
    return this.events.filter((event) => event.authorityId === authorityId || event.relatedAuthorityId === authorityId);
  }
  async findAll(): Promise<readonly AuthorityLedgerEvent[]> { return [...this.events]; }
}
