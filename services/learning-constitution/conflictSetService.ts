import type { ConflictSetRecord } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

export class ConflictSetService {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CS-${crypto.randomUUID()}`, private readonly createRelationshipId = (conflictId: string) => `conflict-set:${conflictId}:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async create(input: Readonly<{ conflictIds: readonly string[]; rationale: string; actor: ProvenanceActor }>): Promise<Readonly<{ status: "CREATED" | "REJECTED" | "PERSISTENCE_FAILED"; reasonCode: "CONFLICT_SET_CREATED" | "CONFLICT_SET_REQUIRES_MULTIPLE_CONFLICTS" | "CONFLICT_MISSING" | "RATIONALE_MISSING" | "PERSISTENCE_FAILED"; conflictSet?: ConflictSetRecord; relationships: readonly ProvenanceRelationship[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const conflictIds = [...new Set(input.conflictIds)];
    if (conflictIds.length < 2) return this.fail("REJECTED", "CONFLICT_SET_REQUIRES_MULTIPLE_CONFLICTS");
    if (!input.rationale.trim()) return this.fail("REJECTED", "RATIONALE_MISSING");
    if ((await Promise.all(conflictIds.map((id) => this.ledger.get(id)))).some((record) => record?.recordType !== "CONFLICT")) return this.fail("REJECTED", "CONFLICT_MISSING");
    const createdAt = this.now();
    const conflictSet: ConflictSetRecord = { id: this.createId(), recordType: "CONFLICT_SET", conflictIds, rationale: input.rationale, status: "OPEN", createdAt, immutable: true };
    const relationships: ProvenanceRelationship[] = conflictIds.map((conflictId) => ({ id: this.createRelationshipId(conflictId), fromId: conflictSet.id, toId: conflictId, type: "CONFLICT_SET_MEMBER", actor: input.actor, createdAt, immutable: true }));
    try { await this.ledger.append(conflictSet); for (const relationship of relationships) await this.ledger.relate(relationship); return { status: "CREATED", reasonCode: "CONFLICT_SET_CREATED", conflictSet, relationships, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
    catch { return this.fail("PERSISTENCE_FAILED", "PERSISTENCE_FAILED"); }
  }
  private fail(status: "REJECTED" | "PERSISTENCE_FAILED", reasonCode: "CONFLICT_SET_REQUIRES_MULTIPLE_CONFLICTS" | "CONFLICT_MISSING" | "RATIONALE_MISSING" | "PERSISTENCE_FAILED") { return { status, reasonCode, relationships: [] as readonly ProvenanceRelationship[], persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
}
