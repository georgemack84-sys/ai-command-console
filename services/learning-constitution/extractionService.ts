import type {
  ExtractionRecord,
  ExtractionRequest,
  ExtractionResult,
  ProvenanceLedger,
  ProvenanceRelationship,
} from "../../types/learning-constitution/provenance";

export const EXTRACTION_SERVICE_ID = "noesis-extraction-service:v1";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createId?: () => string; createRelationshipId?: (sourceId: string) => string }>;

const result = (values: Omit<ExtractionResult, "authorityEffect" | "executionPermissionGranted">): ExtractionResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Records Noesis's interpretation as a new immutable record; sources remain untouched. */
export class ExtractionService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createRelationshipId: (sourceId: string) => string;

  constructor(private readonly dependencies: Dependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createId = dependencies.createId ?? (() => `EX-${crypto.randomUUID()}`);
    this.createRelationshipId = dependencies.createRelationshipId ?? ((sourceId) => `relationship:extracted-from:${sourceId}`);
  }

  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    if (!request.sourceRefs.length) return result({ status: "REJECTED", reasonCode: "SOURCE_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!request.interpretedBy.actorId.trim()) return result({ status: "REJECTED", reasonCode: "INTERPRETER_UNKNOWN", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!request.interpretation.trim()) return result({ status: "REJECTED", reasonCode: "INTERPRETATION_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (!Number.isFinite(request.confidence) || request.confidence < 0 || request.confidence > 1) return result({ status: "REJECTED", reasonCode: "CONFIDENCE_INVALID", relationships: [], created: false, persistenceEffect: "NONE" });
    const sources = await Promise.all(request.sourceRefs.map((id) => this.dependencies.ledger.get(id)));
    if (sources.some((source) => !source)) return result({ status: "REJECTED", reasonCode: "SOURCE_MISSING", relationships: [], created: false, persistenceEffect: "NONE" });
    if (sources.some((source) => source?.recordType !== "TEACHING_EVENT")) return result({ status: "REJECTED", reasonCode: "SOURCE_NOT_TEACHING_EVENT", relationships: [], created: false, persistenceEffect: "NONE" });

    const extraction: ExtractionRecord = { id: this.createId(), recordType: "EXTRACTION", sourceRefs: [...request.sourceRefs], interpretedBy: request.interpretedBy, classification: request.classification, scope: request.scope, interpretation: request.interpretation, confidence: request.confidence, createdAt: request.createdAt ?? this.now(), immutable: true };
    const relationships: ProvenanceRelationship[] = request.sourceRefs.map((sourceId) => ({ id: this.createRelationshipId(sourceId), fromId: extraction.id, toId: sourceId, type: "EXTRACTED_FROM", createdAt: extraction.createdAt, actor: request.interpretedBy, immutable: true }));
    try {
      await this.dependencies.ledger.append(extraction);
      for (const relationship of relationships) await this.dependencies.ledger.relate(relationship);
      return result({ status: "EXTRACTED", reasonCode: "EXTRACTION_RECORDED", extraction, relationships, created: true, persistenceEffect: "CREATED" });
    } catch {
      return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", relationships: [], created: false, persistenceEffect: "NONE" });
    }
  }
}
