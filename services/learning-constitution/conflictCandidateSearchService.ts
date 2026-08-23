import { ConservativeConflictDetector } from "./conservativeConflictDetector";
import type { ConflictDetectionResult, KnowledgeComparisonSubject } from "../../types/learning-constitution/conflictDetection";
import type { CandidateKnowledgeRecord, DurableProvenancedKnowledge, ProvenanceLedger } from "../../types/learning-constitution/provenance";

export type ConflictSearchRequest = Readonly<{
  candidate: CandidateKnowledgeRecord;
  /** Structured terms are optional; absent terms deliberately yield uncertainty instead of semantic guessing. */
  semanticKey?: string;
  value?: string;
  qualifiers?: readonly string[];
  supersedesKnowledgeIds?: readonly string[];
  exceptionToKnowledgeIds?: readonly string[];
}>;

export type ConflictSearchResult = Readonly<{
  candidateId: string;
  searchedKnowledgeIds: readonly string[];
  analyses: readonly ConflictDetectionResult[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

const subject = (
  record: CandidateKnowledgeRecord | DurableProvenancedKnowledge,
  structured: Pick<ConflictSearchRequest, "semanticKey" | "value" | "qualifiers" | "supersedesKnowledgeIds" | "exceptionToKnowledgeIds"> = {},
): KnowledgeComparisonSubject => ({
  knowledgeId: record.id,
  content: "statement" in record ? record.statement : "",
  classification: record.classification,
  scope: record.scope,
  provenance: {
    observationId: `provenance:${record.id}`,
    sourceId: record.id,
    sourceType: "AGENT_OUTPUT",
    originatingActorId: "agent:noesis",
    observedAt: record.createdAt,
  },
  ...structured,
});

/**
 * Read-only, scope-first retrieval. It narrows to active durable items in the
 * exact candidate scope and delegates every semantic conclusion to the
 * conservative detector. It cannot create, promote, or resolve knowledge.
 */
export class ConflictCandidateSearchService {
  constructor(private readonly ledger: ProvenanceLedger, private readonly detector = new ConservativeConflictDetector()) {}

  async analyze(request: ConflictSearchRequest): Promise<ConflictSearchResult> {
    const records = await this.ledger.getAll();
    const matching = records.filter((record): record is DurableProvenancedKnowledge =>
      record.recordType === "DURABLE_KNOWLEDGE"
      && record.classification === request.candidate.classification
      && JSON.stringify(record.scope) === JSON.stringify(request.candidate.scope),
    );
    const active = (await Promise.all(matching.map(async (record) => ({ record, links: await this.ledger.getRelationships(record.id) }))))
      .filter(({ record, links }) => !links.some((link) => link.fromId === record.id && link.type === "SUPERSEDED_BY"))
      .map(({ record }) => record);
    const candidate = subject(request.candidate, request);
    const analyses = await Promise.all(active.map((existingKnowledge) => this.detector.detect({ candidate, existingKnowledge: subject(existingKnowledge) })));
    return {
      candidateId: request.candidate.id,
      searchedKnowledgeIds: active.map((record) => record.id),
      analyses,
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }
}
