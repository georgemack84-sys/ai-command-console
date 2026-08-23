import type { ConflictRecord } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceLedger, ProvenanceRecord, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

export class ConflictQueryService {
  constructor(private readonly ledger: ProvenanceLedger) {}
  async list(status?: ConflictRecord["status"]): Promise<readonly ConflictRecord[]> {
    return (await this.ledger.getAll()).filter((record): record is ConflictRecord => record.recordType === "CONFLICT" && (!status || record.status === status));
  }
  async get(conflictId: string): Promise<Readonly<{ conflict: ConflictRecord; records: readonly ProvenanceRecord[]; relationships: readonly ProvenanceRelationship[] }> | undefined> {
    const conflict = await this.ledger.get(conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return undefined;
    const relationships = await this.ledger.getRelationships(conflictId);
    const relatedIds = [...new Set([conflict.id, conflict.existingKnowledgeId, conflict.candidateKnowledgeId, ...relationships.flatMap((relationship) => [relationship.fromId, relationship.toId])])];
    const records = (await Promise.all(relatedIds.map((id) => this.ledger.get(id)))).filter((record): record is ProvenanceRecord => Boolean(record));
    return { conflict, records, relationships };
  }
}
