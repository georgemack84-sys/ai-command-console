import type {
  CandidateKnowledgeCreationResult,
  CandidateKnowledgeRecord,
  CandidateKnowledgeRequest,
  ProvenanceLedger,
  ProvenanceRelationship,
} from "../../types/learning-constitution/provenance";

export const CANDIDATE_KNOWLEDGE_SERVICE_ID = "noesis-candidate-knowledge-service:v1";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createId?: () => string; createRelationshipId?: (extractionId: string) => string }>;
const result = (values: Omit<CandidateKnowledgeCreationResult, "authorityEffect" | "executionPermissionGranted">): CandidateKnowledgeCreationResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Forms a non-durable candidate from interpretable extraction records. */
export class CandidateKnowledgeService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createRelationshipId: (extractionId: string) => string;

  constructor(private readonly dependencies: Dependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createId = dependencies.createId ?? (() => `CK-${crypto.randomUUID()}`);
    this.createRelationshipId = dependencies.createRelationshipId ?? ((extractionId) => `relationship:derived-from:${extractionId}`);
  }

  async propose(request: CandidateKnowledgeRequest): Promise<CandidateKnowledgeCreationResult> {
    if (!request.statement.trim()) return result({ status: "REJECTED", reasonCode: "STATEMENT_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!request.authority.trim()) return result({ status: "REJECTED", reasonCode: "AUTHORITY_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!request.extractionRefs.length) return result({ status: "REJECTED", reasonCode: "EXTRACTION_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    const extractions = await Promise.all(request.extractionRefs.map((id) => this.dependencies.ledger.get(id)));
    if (extractions.some((record) => !record || record.recordType !== "EXTRACTION")) return result({ status: "REJECTED", reasonCode: "EXTRACTION_INVALID", relationships: [], created: false, persistenceEffect: "NONE" });
    const evidenceRefs = request.evidenceRefs ?? [];
    if ((await Promise.all(evidenceRefs.map((id) => this.dependencies.ledger.get(id)))).some((record) => !record)) return result({ status: "REJECTED", reasonCode: "EVIDENCE_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    const candidate: CandidateKnowledgeRecord = { id: this.createId(), recordType: "CANDIDATE_KNOWLEDGE", statement: request.statement, classification: request.classification, scope: request.scope, authority: request.authority, extractionRefs: [...request.extractionRefs], evidenceRefs: [...evidenceRefs], status: request.status ?? "AWAITING_APPROVAL", createdAt: request.createdAt ?? this.now(), immutable: true };
    const relationships: ProvenanceRelationship[] = request.extractionRefs.map((extractionId) => ({ id: this.createRelationshipId(extractionId), fromId: candidate.id, toId: extractionId, type: "DERIVED_FROM", createdAt: candidate.createdAt, actor: { actorId: "agent:noesis", actorType: "AGENT" }, immutable: true }));
    try {
      await this.dependencies.ledger.append(candidate);
      for (const relationship of relationships) await this.dependencies.ledger.relate(relationship);
      return result({ status: "CREATED", reasonCode: "CANDIDATE_KNOWLEDGE_CREATED", candidate, relationships, created: true, persistenceEffect: "CREATED" });
    } catch {
      return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", relationships: [], created: false, persistenceEffect: "NONE" });
    }
  }
}
