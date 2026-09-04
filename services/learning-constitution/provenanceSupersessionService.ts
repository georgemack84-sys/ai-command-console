import type { DurableProvenancedKnowledge, ProvenanceLedger, ProvenanceRelationship, ProvenanceSupersessionRequest, ProvenanceSupersessionResult } from "../../types/learning-constitution/provenance";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createRelationshipId?: (type: "SUPERSEDES" | "SUPERSEDED_BY") => string }>;
const result = (values: Omit<ProvenanceSupersessionResult, "authorityEffect" | "executionPermissionGranted">): ProvenanceSupersessionResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const scopeKey = (scope: DurableProvenancedKnowledge["scope"]) => "id" in scope ? `${scope.type}:${scope.id}` : scope.type;

/** Creates a historical successor relationship; neither durable record is rewritten. */
export class ProvenanceSupersessionService {
  private readonly now: () => string;
  private readonly createRelationshipId: (type: "SUPERSEDES" | "SUPERSEDED_BY") => string;
  constructor(private readonly dependencies: Dependencies) { this.now = dependencies.now ?? (() => new Date().toISOString()); this.createRelationshipId = dependencies.createRelationshipId ?? ((type) => `relationship:${type}:${crypto.randomUUID()}`); }

  async supersede(request: ProvenanceSupersessionRequest): Promise<ProvenanceSupersessionResult> {
    if (!request.reason.trim()) return result({ status: "REJECTED", reasonCode: "REASON_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (request.actor.actorType !== "HUMAN" || !request.actor.actorId.trim()) return result({ status: "REJECTED", reasonCode: "ACTOR_NOT_HUMAN", relationships: [], created: false, persistenceEffect: "NONE" });
    const [priorRecord, successorRecord] = await Promise.all([this.dependencies.ledger.get(request.priorKnowledgeId), this.dependencies.ledger.get(request.successorKnowledgeId)]);
    if (!priorRecord || priorRecord.recordType !== "DURABLE_KNOWLEDGE") return result({ status: "REJECTED", reasonCode: "PRIOR_KNOWLEDGE_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!successorRecord || successorRecord.recordType !== "DURABLE_KNOWLEDGE") return result({ status: "REJECTED", reasonCode: "SUCCESSOR_KNOWLEDGE_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    const prior = priorRecord as DurableProvenancedKnowledge;
    const successor = successorRecord as DurableProvenancedKnowledge;
    if (scopeKey(prior.scope) !== scopeKey(successor.scope)) return result({ status: "REJECTED", reasonCode: "SCOPE_INCOMPATIBLE", relationships: [], created: false, persistenceEffect: "NONE" });
    if (await this.reaches(request.successorKnowledgeId, request.priorKnowledgeId)) return result({ status: "REJECTED", reasonCode: "CIRCULAR_SUPERSESSION", relationships: [], created: false, persistenceEffect: "NONE" });
    const occurredAt = request.occurredAt ?? this.now();
    const relationships: readonly ProvenanceRelationship[] = [
      { id: this.createRelationshipId("SUPERSEDES"), fromId: request.successorKnowledgeId, toId: request.priorKnowledgeId, type: "SUPERSEDES", actor: request.actor, createdAt: occurredAt, immutable: true },
      { id: this.createRelationshipId("SUPERSEDED_BY"), fromId: request.priorKnowledgeId, toId: request.successorKnowledgeId, type: "SUPERSEDED_BY", actor: request.actor, createdAt: occurredAt, immutable: true },
    ];
    try { for (const relationship of relationships) await this.dependencies.ledger.relate(relationship); return result({ status: "SUPERSEDED", reasonCode: "KNOWLEDGE_SUPERSEDED", predecessor: prior, successor, relationships, created: true, persistenceEffect: "CREATED" }); }
    catch { return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", relationships: [], created: false, persistenceEffect: "NONE" }); }
  }

  private async reaches(fromId: string, targetId: string, visited = new Set<string>()): Promise<boolean> {
    if (fromId === targetId) return true;
    if (visited.has(fromId)) return false;
    visited.add(fromId);
    const successors = (await this.dependencies.ledger.getRelationships(fromId)).filter((link) => link.fromId === fromId && link.type === "SUPERSEDED_BY");
    for (const successor of successors) if (await this.reaches(successor.toId, targetId, visited)) return true;
    return false;
  }
}
