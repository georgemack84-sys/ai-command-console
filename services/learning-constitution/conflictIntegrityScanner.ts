import type { ConflictIntegrityFinding, ConflictIntegrityReport } from "../../types/learning-constitution/conflictIntegrity";
import type { ConflictStatus } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceLedger } from "../../types/learning-constitution/provenance";

const UNRESOLVED_STATUSES: readonly ConflictStatus[] = ["DETECTED", "UNDER_ANALYSIS", "RESOLUTION_PROPOSED", "AWAITING_CLARIFICATION", "AWAITING_APPROVAL", "ESCALATED", "DEFERRED"];

/**
 * Verifies that immutable conflict artifacts form a complete, historically
 * recoverable resolution trail. This scanner is intentionally read-only.
 */
export class ConflictIntegrityScanner {
  constructor(private readonly ledger: ProvenanceLedger, private readonly now = () => new Date().toISOString()) {}

  async scan(): Promise<ConflictIntegrityReport> {
    const records = await this.ledger.getAll();
    const findings: ConflictIntegrityFinding[] = [];
    const resolutions = records.filter((record) => record.recordType === "CONFLICT_RESOLUTION");
    const decisions = new Map(records.filter((record) => record.recordType === "CONFLICT_RESOLUTION_DECISION").map((record) => [record.id, record]));

    for (const conflict of records.filter((record) => record.recordType === "CONFLICT")) {
      const finalResolution = resolutions.find((resolution) => resolution.conflictId === conflict.id);
      if (UNRESOLVED_STATUSES.includes(conflict.status) && !finalResolution) findings.push({ code: "CONFLICT_MISSING_FINAL_RESOLUTION", conflictId: conflict.id, relatedRecordIds: [conflict.candidateKnowledgeId, conflict.existingKnowledgeId], message: `Conflict ${conflict.id} remains unresolved and has no final resolution artifact.` });
      if (finalResolution && !decisions.has(finalResolution.decisionId)) findings.push({ code: "RESOLUTION_MISSING_DECISION", conflictId: conflict.id, relatedRecordIds: [finalResolution.id, finalResolution.decisionId], message: `Resolution ${finalResolution.id} has no corresponding human decision.` });
      if (finalResolution) {
        for (const knowledgeId of [...finalResolution.affectedKnowledgeIds, ...finalResolution.resultingKnowledgeIds]) if (!await this.ledger.get(knowledgeId)) findings.push({ code: "RESOLUTION_REFERENCES_MISSING_KNOWLEDGE", conflictId: conflict.id, knowledgeId, relatedRecordIds: [finalResolution.id], message: `Resolution ${finalResolution.id} references missing knowledge ${knowledgeId}.` });
      }
    }

    for (const knowledge of records.filter((record) => record.recordType === "DURABLE_KNOWLEDGE")) {
      const links = await this.ledger.getRelationships(knowledge.id);
      const successorIds = links.filter((link) => link.fromId === knowledge.id && link.type === "SUPERSEDED_BY").map((link) => link.toId);
      if (knowledge.status === "SUPERSEDED" && successorIds.length === 0) findings.push({ code: "SUPERSESSION_MISSING_SUCCESSOR_LINK", knowledgeId: knowledge.id, relatedRecordIds: [], message: `Superseded knowledge ${knowledge.id} has no successor relationship.` });
      if (knowledge.status === "ACTIVE" && successorIds.length > 0) findings.push({ code: "SUPERSEDED_KNOWLEDGE_STILL_CURRENT", knowledgeId: knowledge.id, relatedRecordIds: successorIds, message: `Knowledge ${knowledge.id} has a superseding successor but remains marked active.` });
    }
    return { valid: findings.length === 0, scannedAt: this.now(), findings, unresolvedConflictStatuses: UNRESOLVED_STATUSES, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
