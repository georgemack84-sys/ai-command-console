import type { ProvenanceLedger, ProvenanceRelationship, ProvenanceRelationshipRequest, ProvenanceRelationshipResult } from "../../types/learning-constitution/provenance";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createId?: (request: ProvenanceRelationshipRequest) => string; phase10Audit?: Readonly<{ ledger: LearningAuditLedger; workspaceId: string }> }>;
const result = (values: Omit<ProvenanceRelationshipResult, "authorityEffect" | "executionPermissionGranted">): ProvenanceRelationshipResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** The sole generic graph-write boundary; it does not infer relationships. */
export class ProvenanceRelationshipService {
  private readonly now: () => string;
  private readonly createId: (request: ProvenanceRelationshipRequest) => string;
  constructor(private readonly dependencies: Dependencies) { this.now = dependencies.now ?? (() => new Date().toISOString()); this.createId = dependencies.createId ?? ((request) => `relationship:${request.type}:${request.fromId}:${request.toId}`); }

  async relate(request: ProvenanceRelationshipRequest): Promise<ProvenanceRelationshipResult> {
    if (!request.actor.actorId.trim()) return result({ status: "REJECTED", reasonCode: "ACTOR_UNKNOWN", created: false, persistenceEffect: "NONE" });
    if (request.fromId === request.toId) return result({ status: "REJECTED", reasonCode: "SELF_RELATIONSHIP", created: false, persistenceEffect: "NONE" });
    const [from, to] = await Promise.all([this.dependencies.ledger.get(request.fromId), this.dependencies.ledger.get(request.toId)]);
    if (!from || !to) return result({ status: "REJECTED", reasonCode: "ENDPOINT_MISSING", created: false, persistenceEffect: "NONE" });
    const existing = (await this.dependencies.ledger.getRelationships(request.fromId)).find((item) => item.fromId === request.fromId && item.toId === request.toId && item.type === request.type);
    if (existing) return result({ status: "EXISTS", reasonCode: "IDEMPOTENT_REPLAY", relationship: existing, created: false, persistenceEffect: "NONE" });
    const relationship: ProvenanceRelationship = { id: this.createId(request), fromId: request.fromId, toId: request.toId, type: request.type, actor: request.actor, createdAt: request.createdAt ?? this.now(), immutable: true };
    try { await this.dependencies.phase10Audit?.ledger.append({ eventId: `learning-audit:provenance:${relationship.id}`, eventType: "PROVENANCE_LINKED", workspaceId: this.dependencies.phase10Audit.workspaceId, occurredAt: relationship.createdAt, actor: relationship.actor, correlationId: relationship.id, schemaVersion: "10.0", references: { provenanceIds: [relationship.fromId, relationship.toId] }, payload: { relationshipType: relationship.type } }); await this.dependencies.ledger.relate(relationship); return result({ status: "CREATED", reasonCode: "RELATIONSHIP_CREATED", relationship, created: true, persistenceEffect: "CREATED" }); }
    catch { return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", created: false, persistenceEffect: "NONE" }); }
  }
}
