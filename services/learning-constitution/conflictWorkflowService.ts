import type { ConflictClarificationRequest, ConflictEscalation } from "../../types/learning-constitution/conflictResolution";
import type { ConflictResolutionOutcome } from "../../types/learning-constitution/conflictEngine";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

/** Append-only workflow artifacts. They make unresolved work visible without changing a conflict's historical record. */
export class ConflictWorkflowService {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`, private readonly createRelationshipId = (prefix: string) => `${prefix}:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async requestClarification(input: Readonly<{ conflictId: string; question: string; candidateOutcomes: readonly ConflictResolutionOutcome[]; requiredAuthority: string; requestedBy: ProvenanceActor }>): Promise<ConflictClarificationRequest | undefined> {
    if (!(await this.isConflict(input.conflictId)) || !input.question.trim() || !input.candidateOutcomes.length || !input.requiredAuthority.trim()) return undefined;
    const createdAt = this.now();
    const request: ConflictClarificationRequest = { id: this.createId("CQR"), recordType: "CONFLICT_CLARIFICATION_REQUEST", conflictId: input.conflictId, question: input.question, candidateOutcomes: [...input.candidateOutcomes], requiredAuthority: input.requiredAuthority, requestedBy: input.requestedBy, createdAt, immutable: true };
    await this.ledger.append(request);
    await this.ledger.relate({ id: this.createRelationshipId("clarification"), fromId: request.id, toId: input.conflictId, type: "CLARIFICATION_REQUEST_FOR", actor: input.requestedBy, createdAt, immutable: true });
    return request;
  }

  async escalate(input: Readonly<{ conflictId: string; proposalId?: string; reason: string; targetAuthority: string; escalatedBy: ProvenanceActor }>): Promise<ConflictEscalation | undefined> {
    if (!(await this.isConflict(input.conflictId)) || !input.reason.trim() || !input.targetAuthority.trim()) return undefined;
    const createdAt = this.now();
    const escalation: ConflictEscalation = { id: this.createId("CES"), recordType: "CONFLICT_ESCALATION", conflictId: input.conflictId, proposalId: input.proposalId, reason: input.reason, targetAuthority: input.targetAuthority, escalatedBy: input.escalatedBy, createdAt, immutable: true };
    await this.ledger.append(escalation);
    await this.ledger.relate({ id: this.createRelationshipId("escalation"), fromId: escalation.id, toId: input.conflictId, type: "ESCALATED_FROM_CONFLICT", actor: input.escalatedBy, createdAt, immutable: true });
    return escalation;
  }
  private async isConflict(id: string) { return (await this.ledger.get(id))?.recordType === "CONFLICT"; }
}
