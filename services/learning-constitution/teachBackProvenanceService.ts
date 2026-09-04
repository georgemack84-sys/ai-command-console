import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceLedger } from "../../types/learning-constitution/provenance";
import type { TeachBack, TeachBackEvaluationEvidence } from "../../types/learning-constitution/teachBack";

/** Persists teach-back comprehension evidence without ever creating candidate, authority, or durable-knowledge records. */
export class TeachBackProvenanceService {
  constructor(private readonly provenance: ProvenanceLedger, private readonly audit: LearningAuditLedger, private readonly workspaceId: string) {}
  async record(teachBack: TeachBack, evidence: TeachBackEvaluationEvidence): Promise<void> {
    await this.provenance.append({ id: teachBack.teachBackId, recordType: "TEACH_BACK", candidateId: teachBack.candidateKnowledgeId, teachingEventId: teachBack.teachingEventId, generatedBy: teachBack.generatedBy, createdAt: teachBack.generatedAt, immutable: true });
    await this.provenance.relate({ id: `teach-back-for:${teachBack.teachBackId}`, fromId: teachBack.teachBackId, toId: teachBack.candidateKnowledgeId, type: "TEACH_BACK_FOR", actor: teachBack.generatedBy, createdAt: teachBack.generatedAt, immutable: true });
    await this.provenance.append({ id: evidence.evidenceId, recordType: "TEACH_BACK_EVALUATION", teachBackId: teachBack.teachBackId, candidateId: teachBack.candidateKnowledgeId, outcome: evidence.outcome, evaluator: evidence.evaluator, createdAt: evidence.createdAt, immutable: true });
    await this.provenance.relate({ id: `evaluates-teach-back:${evidence.evidenceId}`, fromId: evidence.evidenceId, toId: teachBack.teachBackId, type: "EVALUATES_TEACH_BACK", actor: evidence.evaluator, createdAt: evidence.createdAt, immutable: true });
    const eventType = evidence.outcome === "PASS" || evidence.outcome === "PASS_WITH_UNCERTAINTY" ? "TEACH_BACK_PASSED" : evidence.outcome === "PARTIAL" ? "TEACH_BACK_PARTIAL" : evidence.outcome === "CLARIFICATION_REQUIRED" ? "TEACH_BACK_CLARIFICATION_REQUESTED" : "TEACH_BACK_FAILED";
    await this.audit.append({ eventId: `learning-audit:teach-back:${teachBack.teachBackId}`, eventType, workspaceId: this.workspaceId, occurredAt: evidence.createdAt, actor: evidence.evaluator, correlationId: teachBack.candidateKnowledgeId, causationId: teachBack.teachingEventId, schemaVersion: "10.0", references: { provenanceIds: [teachBack.teachBackId, evidence.evidenceId], pipelineId: teachBack.teachingEventId }, payload: { teachBackId: teachBack.teachBackId, outcome: evidence.outcome } });
  }
}
