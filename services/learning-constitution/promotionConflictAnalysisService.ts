import { ConflictCandidateSearchService } from "./conflictCandidateSearchService";
import { ConflictRecordService } from "./conflictRecordService";
import type { KnowledgeComparisonSubject } from "../../types/learning-constitution/conflictDetection";
import type { CandidateKnowledgeRecord, DurableProvenancedKnowledge, ProvenanceActor, ProvenanceLedger } from "../../types/learning-constitution/provenance";

const materialRelationships = new Set(["CONTRADICTS", "CORRECTS", "CREATES_EXCEPTION", "DUPLICATES", "UNCERTAIN"]);
const subject = (record: CandidateKnowledgeRecord | DurableProvenancedKnowledge): KnowledgeComparisonSubject => ({
  knowledgeId: record.id, content: record.statement, classification: record.classification, scope: record.scope,
  provenance: { observationId: `provenance:${record.id}`, sourceId: record.id, sourceType: "AGENT_OUTPUT", originatingActorId: "agent:noesis", observedAt: record.createdAt },
});

/**
 * The promotion-time analysis boundary. It creates conflict facts only; the
 * following admission gate remains responsible for blocking promotion.
 */
export class PromotionConflictAnalysisService {
  constructor(private readonly ledger: ProvenanceLedger) {}

  async analyze(candidateId: string, actor: ProvenanceActor): Promise<Readonly<{ status: "ANALYZED" | "CANDIDATE_UNAVAILABLE" | "PERSISTENCE_FAILED"; conflictIds: readonly string[]; searchedKnowledgeIds: readonly string[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const candidate = await this.ledger.get(candidateId);
    if (!candidate || candidate.recordType !== "CANDIDATE_KNOWLEDGE") return { status: "CANDIDATE_UNAVAILABLE", conflictIds: [], searchedKnowledgeIds: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const search = await new ConflictCandidateSearchService(this.ledger).analyze({ candidate });
    const all = await this.ledger.getAll();
    const conflictIds: string[] = [];
    for (const analysis of search.analyses.filter((item) => materialRelationships.has(item.relationship))) {
      const existingConflict = all.find((record) => record.recordType === "CONFLICT" && record.candidateKnowledgeId === candidate.id && record.existingKnowledgeId === analysis.existingKnowledgeId);
      if (existingConflict) { conflictIds.push(existingConflict.id); continue; }
      const existing = await this.ledger.get(analysis.existingKnowledgeId);
      if (!existing || existing.recordType !== "DURABLE_KNOWLEDGE") continue;
      const recorded = await new ConflictRecordService({ ledger: this.ledger }).record({ candidate: subject(candidate), existingKnowledge: subject(existing) }, actor);
      if (recorded.status === "PERSISTENCE_FAILED") return { status: "PERSISTENCE_FAILED", conflictIds, searchedKnowledgeIds: search.searchedKnowledgeIds, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
      if (recorded.conflict) conflictIds.push(recorded.conflict.id);
    }
    return { status: "ANALYZED", conflictIds, searchedKnowledgeIds: search.searchedKnowledgeIds, persistenceEffect: conflictIds.length ? "CREATED" : "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
