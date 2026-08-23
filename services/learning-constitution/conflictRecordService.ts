import { ConservativeConflictDetector } from "./conservativeConflictDetector";
import type { ConflictDetectionRequest } from "../../types/learning-constitution/conflictDetection";
import type { ConflictRecord, ConflictResolutionOutcome, ConflictType } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

type ConflictRecordDependencies = Readonly<{
  ledger: ProvenanceLedger;
  detector?: ConservativeConflictDetector;
  createConflictId?: () => string;
  createRelationshipId?: (suffix: "existing" | "candidate") => string;
  now?: () => string;
}>;

export type ConflictRecordResult = Readonly<{
  status: "NO_CONFLICT" | "RECORDED" | "PERSISTENCE_FAILED";
  reasonCode: "KNOWLEDGE_COMPATIBLE" | "CONFLICT_RECORDED" | "PERSISTENCE_FAILED";
  conflict?: ConflictRecord;
  relationships: readonly ProvenanceRelationship[];
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

const conflictTypeFor = (relationship: string): ConflictType | undefined => ({
  CONTRADICTS: "DIRECT_CONTRADICTION",
  CORRECTS: "CORRECTION_CONFLICT",
  CREATES_EXCEPTION: "EXCEPTION_CONFLICT",
  DUPLICATES: "DUPLICATE_OR_OVERLAP",
  UNCERTAIN: "AMBIGUOUS_CONFLICT",
}[relationship] as ConflictType | undefined);

const outcomeFor = (relationship: string): ConflictResolutionOutcome => ({
  CORRECTS: "SUPERSEDE",
  CREATES_EXCEPTION: "CREATE_EXCEPTION",
  DUPLICATES: "MERGE",
  UNCERTAIN: "REQUEST_CLARIFICATION",
  CONTRADICTS: "ESCALATE",
}[relationship] as ConflictResolutionOutcome);

/**
 * Persists detected conflict facts only. This service cannot approve, execute,
 * reject, supersede, or otherwise alter knowledge.
 */
export class ConflictRecordService {
  private readonly detector: ConservativeConflictDetector;
  private readonly createConflictId: () => string;
  private readonly createRelationshipId: (suffix: "existing" | "candidate") => string;
  private readonly now: () => string;

  constructor(private readonly dependencies: ConflictRecordDependencies) {
    this.detector = dependencies.detector ?? new ConservativeConflictDetector();
    this.createConflictId = dependencies.createConflictId ?? (() => `CF-${crypto.randomUUID()}`);
    this.createRelationshipId = dependencies.createRelationshipId ?? ((suffix) => `conflict-relationship:${suffix}:${crypto.randomUUID()}`);
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  async record(request: ConflictDetectionRequest, actor: ProvenanceActor): Promise<ConflictRecordResult> {
    const detection = await this.detector.detect(request);
    const type = conflictTypeFor(detection.relationship);
    if (!type) return { status: "NO_CONFLICT", reasonCode: "KNOWLEDGE_COMPATIBLE", relationships: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };

    const createdAt = this.now();
    const proposedOutcome = outcomeFor(detection.relationship);
    const conflict: ConflictRecord = {
      id: this.createConflictId(), recordType: "CONFLICT", existingKnowledgeId: request.existingKnowledge.knowledgeId,
      candidateKnowledgeId: request.candidate.knowledgeId, type, scope: request.candidate.scope,
      authorityComparison: { existing: "UNKNOWN", candidate: "UNKNOWN", outcome: "UNKNOWN", rationaleCode: "AUTHORITY_COMPARISON_PENDING" },
      evidenceComparison: { existing: "UNKNOWN", candidate: "UNKNOWN", outcome: "UNKNOWN", rationaleCode: "EVIDENCE_COMPARISON_PENDING" },
      confidenceComparison: { existing: "UNKNOWN", candidate: String(detection.confidence), outcome: "UNKNOWN", rationaleCode: "CONFIDENCE_COMPARISON_PENDING" },
      provenanceRefs: [detection.provenance.candidate.sourceId, detection.provenance.existingKnowledge.sourceId],
      proposedOutcome, resolutionReasoning: detection.reasoningMetadata.rationaleCode,
      status: proposedOutcome === "REQUEST_CLARIFICATION" ? "AWAITING_CLARIFICATION" : "RESOLUTION_PROPOSED",
      createdAt, immutable: true,
    };
    const relationships: readonly ProvenanceRelationship[] = [
      { id: this.createRelationshipId("existing"), fromId: conflict.id, toId: conflict.existingKnowledgeId, type: "CONFLICTS_EXISTING", actor, createdAt, immutable: true },
      { id: this.createRelationshipId("candidate"), fromId: conflict.id, toId: conflict.candidateKnowledgeId, type: "CONFLICTS_CANDIDATE", actor, createdAt, immutable: true },
    ];
    try {
      await this.dependencies.ledger.append(conflict);
      for (const relationship of relationships) await this.dependencies.ledger.relate(relationship);
      return { status: "RECORDED", reasonCode: "CONFLICT_RECORDED", conflict, relationships, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    } catch {
      return { status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", relationships: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    }
  }
}
