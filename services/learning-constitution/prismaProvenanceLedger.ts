import { prisma } from "../../src/server/db/prisma";
import type { ProvenanceLedger, ProvenanceRecord, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

type StoredRecord = { recordId: string; workspaceId: string; recordType: string; payload: unknown; createdAt: Date };
type StoredRelationship = { relationshipId: string; workspaceId: string; fromRecordId: string; toRecordId: string; relationshipType: string; actor: unknown; createdAt: Date };
type PrismaProvenanceClient = Readonly<{
  noesisProvenanceRecord: { findUnique(args: object): Promise<StoredRecord | null>; create(args: object): Promise<StoredRecord>; findMany(args: object): Promise<StoredRecord[]> };
  noesisProvenanceRelationship: { findUnique(args: object): Promise<StoredRelationship | null>; create(args: object): Promise<StoredRelationship>; findMany(args: object): Promise<StoredRelationship[]> };
}>;

// Prisma generation occurs as part of deployment. Keeping this narrow bridge
// avoids coupling TypeScript compilation to a currently running local client.
const provenanceClient = prisma as unknown as PrismaProvenanceClient;

const toRecord = (record: StoredRecord): ProvenanceRecord => record.payload as unknown as ProvenanceRecord;
const toRelationship = (record: StoredRelationship): ProvenanceRelationship => ({
  id: record.relationshipId,
  fromId: record.fromRecordId,
  toId: record.toRecordId,
  type: record.relationshipType as ProvenanceRelationship["type"],
  actor: record.actor as unknown as ProvenanceRelationship["actor"],
  createdAt: record.createdAt.toISOString(),
  immutable: true,
});

/** PostgreSQL-backed append-only provenance ledger. Updates and deletes are absent by design. */
export class PrismaProvenanceLedger implements ProvenanceLedger {
  constructor(private readonly workspaceId: string) {
    if (!workspaceId.trim()) throw new Error("provenance ledger requires a workspace scope");
  }

  async append(record: ProvenanceRecord): Promise<ProvenanceRecord> {
    const existing = await provenanceClient.noesisProvenanceRecord.findUnique({ where: { recordId: record.id } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId) throw new Error("provenance record belongs to another workspace");
      const existingRecord = toRecord(existing);
      if (JSON.stringify(existingRecord) !== JSON.stringify(record)) throw new Error("immutable provenance record cannot be rewritten");
      return existingRecord;
    }
    await provenanceClient.noesisProvenanceRecord.create({ data: { recordId: record.id, workspaceId: this.workspaceId, recordType: record.recordType, payload: record as unknown as object } });
    return record;
  }

  async relate(relationship: ProvenanceRelationship): Promise<ProvenanceRelationship> {
    const existing = await provenanceClient.noesisProvenanceRelationship.findUnique({ where: { relationshipId: relationship.id } });
    if (existing) {
      if (existing.workspaceId !== this.workspaceId) throw new Error("provenance relationship belongs to another workspace");
      const existingRelationship = toRelationship(existing);
      if (JSON.stringify(existingRelationship) !== JSON.stringify(relationship)) throw new Error("immutable provenance relationship cannot be rewritten");
      return existingRelationship;
    }
    const [from, to] = await Promise.all([this.get(relationship.fromId), this.get(relationship.toId)]);
    if (!from || !to) throw new Error("provenance relationship endpoint is missing");
    await provenanceClient.noesisProvenanceRelationship.create({ data: { relationshipId: relationship.id, workspaceId: this.workspaceId, fromRecordId: relationship.fromId, toRecordId: relationship.toId, relationshipType: relationship.type, actor: relationship.actor as unknown as object, createdAt: new Date(relationship.createdAt) } });
    return relationship;
  }

  async get(recordId: string): Promise<ProvenanceRecord | undefined> {
    const record = await provenanceClient.noesisProvenanceRecord.findUnique({ where: { recordId } });
    return record?.workspaceId === this.workspaceId ? toRecord(record) : undefined;
  }
  async getRelationships(recordId: string): Promise<readonly ProvenanceRelationship[]> {
    return (await provenanceClient.noesisProvenanceRelationship.findMany({ where: { workspaceId: this.workspaceId, OR: [{ fromRecordId: recordId }, { toRecordId: recordId }] }, orderBy: [{ createdAt: "asc" }, { relationshipId: "asc" }] })).map(toRelationship);
  }
  async getAll(): Promise<readonly ProvenanceRecord[]> {
    return (await provenanceClient.noesisProvenanceRecord.findMany({ where: { workspaceId: this.workspaceId }, orderBy: [{ createdAt: "asc" }, { recordId: "asc" }] })).map(toRecord);
  }
}
