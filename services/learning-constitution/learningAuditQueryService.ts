import type { AuditExplanationService, KnowledgeAuditExplanation, KnowledgeAuditHistory, LearningAuditQuery, LearningAuditReadableLedger } from "../../types/learning-constitution/learningAuditExplanation";

export class LearningAuditQueryService implements LearningAuditQuery {
  constructor(private readonly ledger: LearningAuditReadableLedger) {}
  async history(workspaceId: string, knowledgeId: string): Promise<KnowledgeAuditHistory> {
    return { workspaceId, knowledgeId, entries: await this.ledger.findByKnowledgeId(workspaceId, knowledgeId), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}

/** Builds explanations only from canonical audit facts; absent required lineage stays explicit. */
export class CanonicalAuditExplanationService implements AuditExplanationService {
  constructor(private readonly query: LearningAuditQuery) {}
  async explain(workspaceId: string, knowledgeId: string): Promise<KnowledgeAuditExplanation> {
    const history = await this.query.history(workspaceId, knowledgeId);
    if (!history.entries.length) return { status: "NOT_FOUND", knowledgeId, provenanceIds: [], conflictIds: [], authorityIds: [], missing: ["AUDIT_HISTORY"], entries: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const commit = history.entries.find((entry) => entry.event.eventType === "DURABLE_KNOWLEDGE_COMMITTED");
    const references = history.entries.flatMap((entry) => [entry.event.references]);
    const provenanceIds = [...new Set(references.flatMap((item) => item.provenanceIds ?? []))];
    const conflictIds = [...new Set(references.flatMap((item) => item.conflictIds ?? []))];
    const authorityIds = [...new Set(references.flatMap((item) => item.authorityIds ?? []))];
    const gateEvaluationId = commit?.event.references.gateEvaluationId;
    const missing = [!commit && "DURABLE_COMMIT", !gateEvaluationId && "GATE_DECISION", !provenanceIds.length && "PROVENANCE"].filter(Boolean) as string[];
    return { status: missing.length ? "EXPLANATION_INCOMPLETE" : "COMPLETE", knowledgeId, ...(commit ? { learnedAt: commit.event.occurredAt, actorId: commit.event.actor.actorId } : {}), ...(gateEvaluationId ? { gateEvaluationId } : {}), provenanceIds, conflictIds, authorityIds, missing, entries: history.entries, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
