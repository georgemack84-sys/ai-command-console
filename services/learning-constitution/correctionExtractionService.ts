import type { CorrectedKnowledgeCandidate, CorrectionExtractionInput, CorrectionRepository } from "../../types/learning-constitution/correctionLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Extracts a proposed correction with an explicit scope boundary; durability remains exclusively a Phase 9 decision. */
export class CorrectionExtractionService {
  constructor(private readonly repository: CorrectionRepository, private readonly audit?: LearningAuditLedger) {}
  async extract(input: CorrectionExtractionInput, workspaceId: string, correlationId: string): Promise<CorrectedKnowledgeCandidate> {
    const complete = input.targetIds.length > 0 && input.rejectedInterpretation.trim() && input.correctedStatement.trim() && input.rationale.trim() && input.nonApplicabilityBoundary.trim();
    const candidate: CorrectedKnowledgeCandidate = { ...input, targetIds: [...new Set(input.targetIds)], similarKnowledgeCandidateIds: [...new Set(input.similarKnowledgeCandidateIds)], status: complete ? "EXTRACTED" : "REQUIRES_CLARIFICATION", immutable: true };
    const stored = await this.repository.appendCandidate(candidate);
    if (this.audit) await this.audit.append({ eventId: `audit:${candidate.correctionId}:extracted:${candidate.candidateId}`, eventType: "CORRECTED_KNOWLEDGE_EXTRACTED", workspaceId, occurredAt: candidate.extractedAt, actor: candidate.extractedBy, correlationId, schemaVersion: "10.0", references: { correctionIds: [candidate.correctionId], knowledgeIds: candidate.targetIds }, payload: { candidateId: candidate.candidateId, status: candidate.status, scope: candidate.scope, generalizationResult: candidate.generalizationResult } });
    if (this.audit && candidate.generalizationResult === "DISCOVERY_ONLY") await this.audit.append({ eventId: `audit:${candidate.correctionId}:generalization:${candidate.candidateId}`, eventType: "CORRECTION_GENERALIZED", workspaceId, occurredAt: candidate.extractedAt, actor: candidate.extractedBy, correlationId, schemaVersion: "10.0", references: { correctionIds: [candidate.correctionId], knowledgeIds: candidate.similarKnowledgeCandidateIds }, payload: { mode: "DISCOVERY_ONLY", candidateCount: candidate.similarKnowledgeCandidateIds.length, mutationAuthorized: false } });
    return stored;
  }
}
