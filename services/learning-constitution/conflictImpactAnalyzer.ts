import type { ConflictImpactAnalysis, ConflictRecord, ConflictResolutionOutcome } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceLedger } from "../../types/learning-constitution/provenance";

const unresolved = new Set(["DETECTED", "UNDER_ANALYSIS", "RESOLUTION_PROPOSED", "AWAITING_CLARIFICATION", "AWAITING_APPROVAL", "ESCALATED", "DEFERRED"]);

/** Read-only impact simulation. It identifies linked conflicts before any resolution can mutate knowledge. */
export class ConflictImpactAnalyzer {
  constructor(private readonly ledger: ProvenanceLedger) {}

  async analyze(conflictId: string, proposedOutcome: ConflictResolutionOutcome): Promise<ConflictImpactAnalysis | undefined> {
    const subject = await this.ledger.get(conflictId);
    if (!subject || subject.recordType !== "CONFLICT") return undefined;
    const affectedKnowledgeIds = [subject.existingKnowledgeId, subject.candidateKnowledgeId];
    const conflicts = (await this.ledger.getAll()).filter((record): record is ConflictRecord => record.recordType === "CONFLICT" && record.id !== subject.id);
    const related = conflicts.filter((record) => affectedKnowledgeIds.includes(record.existingKnowledgeId) || affectedKnowledgeIds.includes(record.candidateKnowledgeId));
    const blockingConflictIds = related.filter((record) => unresolved.has(record.status)).map((record) => record.id);
    return { conflictId, proposedOutcome, affectedKnowledgeIds, relatedConflictIds: related.map((record) => record.id), blockingConflictIds, requiresHumanReview: proposedOutcome !== "NO_CONFLICT" || blockingConflictIds.length > 0, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
