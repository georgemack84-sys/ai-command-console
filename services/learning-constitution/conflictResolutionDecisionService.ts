import type { ConflictResolutionDecision, ConflictResolutionProposal } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

export class ConflictResolutionDecisionService {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CRD-${crypto.randomUUID()}`, private readonly createRelationshipId = (suffix: string) => `conflict-decision:${suffix}:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async decide(input: Readonly<{ conflictId: string; proposalId: string; acceptedOutcome: ConflictResolutionProposal["proposedOutcome"]; decisionMaker: ProvenanceActor; decisionAuthority: string; decisionReason: string; approvalRef?: string }>): Promise<ConflictResolutionDecision | undefined> {
    if (input.decisionMaker.actorType !== "HUMAN" || !input.decisionMaker.actorId.trim() || !input.decisionAuthority.trim() || !input.decisionReason.trim()) return undefined;
    const [conflict, proposal] = await Promise.all([this.ledger.get(input.conflictId), this.ledger.get(input.proposalId)]);
    if (!conflict || conflict.recordType !== "CONFLICT" || !proposal || proposal.recordType !== "CONFLICT_RESOLUTION_PROPOSAL") return undefined;
    if (proposal.conflictId !== conflict.id || proposal.proposedOutcome !== input.acceptedOutcome) return undefined;
    const decidedAt = this.now();
    const decision: ConflictResolutionDecision = { id: this.createId(), recordType: "CONFLICT_RESOLUTION_DECISION", conflictId: conflict.id, proposalId: proposal.id, acceptedOutcome: input.acceptedOutcome, decisionMaker: input.decisionMaker, decisionAuthority: input.decisionAuthority, decisionReason: input.decisionReason, approvalRef: input.approvalRef, decidedAt, immutable: true };
    await this.ledger.append(decision);
    const relationships: readonly ProvenanceRelationship[] = [
      { id: this.createRelationshipId("proposal"), fromId: decision.id, toId: proposal.id, type: "DECIDES_PROPOSAL", actor: input.decisionMaker, createdAt: decidedAt, immutable: true },
      { id: this.createRelationshipId("conflict"), fromId: decision.id, toId: conflict.id, type: "DECIDES_CONFLICT", actor: input.decisionMaker, createdAt: decidedAt, immutable: true },
    ];
    for (const relationship of relationships) await this.ledger.relate(relationship);
    return decision;
  }
}
