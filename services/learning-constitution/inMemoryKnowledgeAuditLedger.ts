import type {
  AuditIntegrityEntry,
  KnowledgeAuditEvent,
  KnowledgeAuditLedger,
} from "../../types/learning-constitution/durableKnowledge";
import { hashAuditEvent } from "./auditIntegrityHash";

export class InMemoryKnowledgeAuditLedger implements KnowledgeAuditLedger {
  private readonly eventsByKnowledgeId = new Map<string, KnowledgeAuditEvent[]>();
  private readonly events: KnowledgeAuditEvent[] = [];
  private readonly integrityEntriesByKey = new Map<string, AuditIntegrityEntry[]>();

  async append<T extends KnowledgeAuditEvent>(event: T): Promise<T> {
    let knowledgeIds: readonly string[];
    if (event.eventType === "KNOWLEDGE_SUPERSEDED") {
      knowledgeIds = [event.priorKnowledgeId, event.replacementKnowledgeId];
    } else if (event.eventType === "KNOWLEDGE_EXCEPTION_REGISTERED") {
      knowledgeIds = [event.baseKnowledgeId, event.exceptionKnowledgeId];
    } else if (event.eventType === "GOVERNANCE_REVIEW_PROPOSED" || event.eventType === "GOVERNANCE_REVIEW_DECIDED") {
      knowledgeIds = [`governance:${event.scopeKey}`];
    } else if (event.eventType === "OPERATIONAL_POLICY_ACTIVATED" || event.eventType === "OPERATIONAL_POLICY_ROLLED_BACK") {
      knowledgeIds = [`policy:${event.scopeKey}`];
    } else if ("knowledgeId" in event) {
      knowledgeIds = [event.knowledgeId];
    } else {
      throw new Error("audit event has no knowledge or governance scope key");
    }
    for (const knowledgeId of knowledgeIds) {
      const events = this.eventsByKnowledgeId.get(knowledgeId) ?? [];
      this.eventsByKnowledgeId.set(knowledgeId, [...events, event]);
      const entries = this.integrityEntriesByKey.get(knowledgeId) ?? [];
      const previousHash = entries.at(-1)?.eventHash;
      this.integrityEntriesByKey.set(knowledgeId, [...entries, {
        auditKey: knowledgeId,
        sequence: entries.length + 1,
        eventId: event.eventId,
        eventHash: hashAuditEvent(event, previousHash),
        previousHash,
      }]);
    }
    this.events.push(event);
    return event;
  }

  async findByKnowledgeId(knowledgeId: string): Promise<readonly KnowledgeAuditEvent[]> {
    return this.eventsByKnowledgeId.get(knowledgeId) ?? [];
  }

  async findAll(): Promise<readonly KnowledgeAuditEvent[]> {
    return [...this.events];
  }

  async findIntegrityEntries(auditKey: string): Promise<readonly AuditIntegrityEntry[]> {
    return this.integrityEntriesByKey.get(auditKey) ?? [];
  }
}
