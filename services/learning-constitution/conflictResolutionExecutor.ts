import { ProvenanceSupersessionService } from "./provenanceSupersessionService";
import { HumanApprovalService } from "./humanApprovalService";
import type { ConflictResolution, ConflictResolutionDecision } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

/**
 * A deliberately small executor. It only supports human-decided supersession,
 * delegates to the existing immutable lineage service, and refuses every
 * unsupported outcome rather than approximating a mutation.
 */
export class ConflictResolutionExecutor {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CR-${crypto.randomUUID()}`, private readonly createRelationshipId = () => `conflict-execution:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async execute(decisionId: string): Promise<Readonly<{ status: "EXECUTED" | "REJECTED" | "PERSISTENCE_FAILED"; reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "DURABLE_EXCEPTION_REQUIRED" | "EXCEPTION_CONDITION_REQUIRED" | "NARROWED_SCOPE_REQUIRED" | "SUPERSESSION_REJECTED" | "CANDIDATE_REJECTION_FAILED" | "RESOLUTION_EXECUTED" | "PERSISTENCE_FAILED"; resolution?: ConflictResolution; relationships: readonly ProvenanceRelationship[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const decision = await this.ledger.get(decisionId);
    if (!decision || decision.recordType !== "CONFLICT_RESOLUTION_DECISION") return this.fail("DECISION_MISSING");
    const conflict = await this.ledger.get(decision.conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return this.fail("DECISION_MISSING");
    if (decision.acceptedOutcome === "REJECT") return this.rejectCandidate(decision, conflict);
    const successor = await this.ledger.get(conflict.candidateKnowledgeId);
    if (!successor || successor.recordType !== "DURABLE_KNOWLEDGE") return this.fail("DURABLE_SUCCESSOR_REQUIRED");
    if (decision.acceptedOutcome === "SUPERSEDE") {
      const supersession = await new ProvenanceSupersessionService({ ledger: this.ledger, now: this.now }).supersede({ priorKnowledgeId: conflict.existingKnowledgeId, successorKnowledgeId: successor.id, reason: decision.decisionReason, actor: decision.decisionMaker, occurredAt: decision.decidedAt });
      if (supersession.status !== "SUPERSEDED") return this.fail("SUPERSESSION_REJECTED", supersession.status === "PERSISTENCE_FAILED" ? "PERSISTENCE_FAILED" : "REJECTED");
      return this.finalize(decision, conflict.id, "SUPERSEDE", [conflict.existingKnowledgeId], [successor.id]);
    }
    if (decision.acceptedOutcome === "CREATE_EXCEPTION") {
      if (successor.classification !== "EXCEPTION") return this.fail("DURABLE_EXCEPTION_REQUIRED");
      if (!decision.executionPlan?.exceptionApplicabilityCondition?.trim()) return this.fail("EXCEPTION_CONDITION_REQUIRED");
      return this.finalize(decision, conflict.id, "CREATE_EXCEPTION", [conflict.existingKnowledgeId], [successor.id], { fromId: successor.id, toId: conflict.existingKnowledgeId, type: "EXCEPTION_OF" });
    }
    if (decision.acceptedOutcome === "NARROW_SCOPE") {
      const existing = await this.ledger.get(conflict.existingKnowledgeId);
      if (!existing || existing.recordType !== "DURABLE_KNOWLEDGE" || !decision.executionPlan?.narrowedScope || JSON.stringify(successor.scope) !== JSON.stringify(decision.executionPlan.narrowedScope) || JSON.stringify(successor.scope) === JSON.stringify(existing.scope)) return this.fail("NARROWED_SCOPE_REQUIRED");
      return this.finalize(decision, conflict.id, "NARROW_SCOPE", [conflict.existingKnowledgeId], [successor.id], { fromId: successor.id, toId: conflict.existingKnowledgeId, type: "NARROWS_SCOPE_OF" });
    }
    return this.fail("OUTCOME_UNSUPPORTED");
  }
  private async rejectCandidate(decision: ConflictResolutionDecision, conflict: { id: string; candidateKnowledgeId: string }) {
    const candidate = await this.ledger.get(conflict.candidateKnowledgeId);
    if (!candidate || candidate.recordType !== "CANDIDATE_KNOWLEDGE") return this.fail("CANDIDATE_REJECTION_FAILED");
    const rejected = await new HumanApprovalService({ ledger: this.ledger, now: this.now }).decide({ candidateId: candidate.id, decision: "REJECTED", actor: decision.decisionMaker, approvedStatement: candidate.statement, decidedAt: decision.decidedAt });
    if (rejected.status !== "RECORDED") return this.fail("CANDIDATE_REJECTION_FAILED", rejected.status === "PERSISTENCE_FAILED" ? "PERSISTENCE_FAILED" : "REJECTED");
    return this.finalize(decision, conflict.id, "REJECT", [candidate.id], []);
  }
  private async finalize(decision: ConflictResolutionDecision, conflictId: string, resolutionType: ConflictResolution["resolutionType"], affectedKnowledgeIds: readonly string[], resultingKnowledgeIds: readonly string[], extraRelationship?: Pick<ProvenanceRelationship, "fromId" | "toId" | "type">) {
    const resolution: ConflictResolution = { id: this.createId(), recordType: "CONFLICT_RESOLUTION", conflictId, decisionId: decision.id, resolutionType, affectedKnowledgeIds, resultingKnowledgeIds, executedBy: decision.decisionMaker, executedAt: this.now(), immutable: true };
    const relationships: ProvenanceRelationship[] = [{ id: this.createRelationshipId(), fromId: resolution.id, toId: decision.id, type: "EXECUTES_CONFLICT_DECISION", actor: decision.decisionMaker, createdAt: resolution.executedAt, immutable: true }];
    if (extraRelationship) relationships.push({ id: this.createRelationshipId(), ...extraRelationship, actor: decision.decisionMaker, createdAt: resolution.executedAt, immutable: true });
    try { await this.ledger.append(resolution); for (const relationship of relationships) await this.ledger.relate(relationship); return { status: "EXECUTED" as const, reasonCode: "RESOLUTION_EXECUTED" as const, resolution, relationships, persistenceEffect: "CREATED" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
    catch { return this.fail("PERSISTENCE_FAILED", "PERSISTENCE_FAILED"); }
  }
  private fail(reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "DURABLE_EXCEPTION_REQUIRED" | "EXCEPTION_CONDITION_REQUIRED" | "NARROWED_SCOPE_REQUIRED" | "SUPERSESSION_REJECTED" | "CANDIDATE_REJECTION_FAILED" | "PERSISTENCE_FAILED", status: "REJECTED" | "PERSISTENCE_FAILED" = "REJECTED") { return { status, reasonCode, relationships: [] as readonly ProvenanceRelationship[], persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
}
