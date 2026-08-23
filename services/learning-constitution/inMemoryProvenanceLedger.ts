import type { ProvenanceLedger, ProvenanceRecord, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

/** Append-only in-memory implementation; production adapters must preserve the same semantics. */
export class InMemoryProvenanceLedger implements ProvenanceLedger {
  private readonly records = new Map<string, ProvenanceRecord>();
  private readonly relationships: ProvenanceRelationship[] = [];

  async append(record: ProvenanceRecord): Promise<ProvenanceRecord> {
    const existing = this.records.get(record.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(record)) throw new Error("immutable provenance record cannot be rewritten");
      return existing;
    }
    if (!record.immutable) throw new Error("provenance records must be immutable");
    this.records.set(record.id, Object.freeze({ ...record }));
    return record;
  }

  async relate(relationship: ProvenanceRelationship): Promise<ProvenanceRelationship> {
    const existing = this.relationships.find((item) => item.id === relationship.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(relationship)) throw new Error("immutable provenance relationship cannot be rewritten");
      return existing;
    }
    if (!relationship.immutable) throw new Error("provenance relationships must be immutable");
    if (!this.records.has(relationship.fromId) || !this.records.has(relationship.toId)) throw new Error("provenance relationship endpoint is missing");
    this.relationships.push(Object.freeze({ ...relationship }));
    return relationship;
  }

  async get(recordId: string): Promise<ProvenanceRecord | undefined> { return this.records.get(recordId); }
  async getRelationships(recordId: string): Promise<readonly ProvenanceRelationship[]> {
    return this.relationships.filter((item) => item.fromId === recordId || item.toId === recordId);
  }
  async getAll(): Promise<readonly ProvenanceRecord[]> { return [...this.records.values()]; }
}
