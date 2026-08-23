import type { HumanApproval, HumanApprovalRequest, HumanApprovalResult, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createId?: () => string; createRelationshipId?: () => string }>;
const result = (values: Omit<HumanApprovalResult, "authorityEffect" | "executionPermissionGranted">): HumanApprovalResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Approval is an immutable human decision—not a mutation of the candidate. */
export class HumanApprovalService {
  private readonly now: () => string;
  private readonly createId: () => string;
  private readonly createRelationshipId: () => string;
  constructor(private readonly dependencies: Dependencies) { this.now = dependencies.now ?? (() => new Date().toISOString()); this.createId = dependencies.createId ?? (() => `HA-${crypto.randomUUID()}`); this.createRelationshipId = dependencies.createRelationshipId ?? (() => `relationship:approval:${crypto.randomUUID()}`); }

  async decide(request: HumanApprovalRequest): Promise<HumanApprovalResult> {
    const candidate = await this.dependencies.ledger.get(request.candidateId);
    if (!candidate || candidate.recordType !== "CANDIDATE_KNOWLEDGE") return result({ status: "REJECTED", reasonCode: "CANDIDATE_MISSING", created: false, persistenceEffect: "NONE" });
    if (request.actor.actorType !== "HUMAN" || !request.actor.actorId.trim()) return result({ status: "REJECTED", reasonCode: "ACTOR_NOT_HUMAN", created: false, persistenceEffect: "NONE" });
    if (!request.approvedStatement.trim()) return result({ status: "REJECTED", reasonCode: "APPROVED_STATEMENT_MISSING", created: false, persistenceEffect: "NONE" });
    const approval: HumanApproval = { id: this.createId(), recordType: "HUMAN_APPROVAL", candidateId: request.candidateId, decision: request.decision, actor: request.actor, approvedStatement: request.approvedStatement, decidedAt: request.decidedAt ?? this.now(), immutable: true };
    const relationship: ProvenanceRelationship = { id: this.createRelationshipId(), fromId: request.candidateId, toId: approval.id, type: request.decision === "APPROVED" ? "APPROVED_BY" : "REJECTED_BY", createdAt: approval.decidedAt, actor: request.actor, immutable: true };
    try { await this.dependencies.ledger.append(approval); await this.dependencies.ledger.relate(relationship); return result({ status: "RECORDED", reasonCode: "HUMAN_APPROVAL_RECORDED", approval, relationship, created: true, persistenceEffect: "CREATED" }); }
    catch { return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", created: false, persistenceEffect: "NONE" }); }
  }
}
