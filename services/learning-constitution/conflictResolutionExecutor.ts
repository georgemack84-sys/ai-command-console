import { ProvenanceSupersessionService } from "./provenanceSupersessionService";
import { HumanApprovalService } from "./humanApprovalService";
import { ConflictImpactAnalyzer } from "./conflictImpactAnalyzer";
import type { ConflictResolution, ConflictResolutionDecision } from "../../types/learning-constitution/conflictResolution";
import { supportsProvenanceTransactions } from "../../types/learning-constitution/provenance";
import type { ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

type ConflictExecutionResult = Readonly<{ status: "EXECUTED" | "REJECTED" | "PERSISTENCE_FAILED"; reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "MERGED_KNOWLEDGE_REQUIRED" | "DURABLE_EXCEPTION_REQUIRED" | "EXCEPTION_CONDITION_REQUIRED" | "NARROWED_SCOPE_REQUIRED" | "IMPACT_ANALYSIS_FAILED" | "RELATED_CONFLICT_UNRESOLVED" | "SUPERSESSION_REJECTED" | "CANDIDATE_REJECTION_FAILED" | "RESOLUTION_EXECUTED" | "PERSISTENCE_FAILED"; resolution?: ConflictResolution; relationships: readonly ProvenanceRelationship[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;

/**
 * A deliberately small executor. It only supports human-decided supersession,
 * delegates to the existing immutable lineage service, and refuses every
 * unsupported outcome rather than approximating a mutation.
 */
export class ConflictResolutionExecutor {
  private relationshipSequence = 0;
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CR-${crypto.randomUUID()}`, private readonly createRelationshipId = () => `conflict-execution:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async execute(decisionId: string): Promise<ConflictExecutionResult> {
    try {
      const run = (ledger: ProvenanceLedger) => new ConflictResolutionExecutor(ledger, this.createId, this.createRelationshipId, this.now).executeWithinTransaction(decisionId);
      return supportsProvenanceTransactions(this.ledger) ? await this.ledger.withTransaction(run) : await run(this.ledger);
    } catch { return this.fail("PERSISTENCE_FAILED", "PERSISTENCE_FAILED"); }
  }

  private async executeWithinTransaction(decisionId: string): Promise<ConflictExecutionResult> {
    const decision = await this.ledger.get(decisionId);
    if (!decision || decision.recordType !== "CONFLICT_RESOLUTION_DECISION") return this.fail("DECISION_MISSING");
    const conflict = await this.ledger.get(decision.conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return this.fail("DECISION_MISSING");
    const impact = await new ConflictImpactAnalyzer(this.ledger).analyze(conflict.id, decision.acceptedOutcome);
    if (!impact) return this.fail("IMPACT_ANALYSIS_FAILED");
    if (impact.blockingConflictIds.length) return this.fail("RELATED_CONFLICT_UNRESOLVED");
    if (decision.acceptedOutcome === "REJECT") return this.rejectCandidate(decision, conflict);
    if (decision.acceptedOutcome === "MERGE") {
      const merged = decision.executionPlan?.mergedKnowledgeId ? await this.ledger.get(decision.executionPlan.mergedKnowledgeId) : undefined;
      if (!merged || merged.recordType !== "DURABLE_KNOWLEDGE" || merged.id === conflict.existingKnowledgeId || merged.id === conflict.candidateKnowledgeId || JSON.stringify(merged.scope) !== JSON.stringify(conflict.scope)) return this.fail("MERGED_KNOWLEDGE_REQUIRED");
      return this.finalize(decision, conflict.id, "MERGE", [conflict.existingKnowledgeId, conflict.candidateKnowledgeId], [merged.id], [
        { fromId: merged.id, toId: conflict.existingKnowledgeId, type: "MERGED_FROM" },
        { fromId: merged.id, toId: conflict.candidateKnowledgeId, type: "MERGED_FROM" },
      ]);
    }
    const successor = await this.ledger.get(conflict.candidateKnowledgeId);
    if (!successor || successor.recordType !== "DURABLE_KNOWLEDGE") return this.fail("DURABLE_SUCCESSOR_REQUIRED");
    if (decision.acceptedOutcome === "SUPERSEDE") {
      const supersession = await new ProvenanceSupersessionService({ ledger: this.ledger, now: this.now }).supersede({ priorKnowledgeId: conflict.existingKnowledgeId, successorKnowledgeId: successor.id, reason: decision.decisionReason, actor: decision.decisionMaker, occurredAt: decision.decidedAt });
      if (supersession.status !== "SUPERSEDED") { if (supersession.status === "PERSISTENCE_FAILED") throw new Error("supersession persistence failed"); return this.fail("SUPERSESSION_REJECTED"); }
      return this.finalize(decision, conflict.id, "SUPERSEDE", [conflict.existingKnowledgeId], [successor.id]);
    }
    if (decision.acceptedOutcome === "CREATE_EXCEPTION") {
      if (successor.classification !== "EXCEPTION") return this.fail("DURABLE_EXCEPTION_REQUIRED");
      if (!decision.executionPlan?.exceptionApplicabilityCondition?.trim()) return this.fail("EXCEPTION_CONDITION_REQUIRED");
      return this.finalize(decision, conflict.id, "CREATE_EXCEPTION", [conflict.existingKnowledgeId], [successor.id], [{ fromId: successor.id, toId: conflict.existingKnowledgeId, type: "EXCEPTION_OF" }]);
    }
    if (decision.acceptedOutcome === "NARROW_SCOPE") {
      const existing = await this.ledger.get(conflict.existingKnowledgeId);
      if (!existing || existing.recordType !== "DURABLE_KNOWLEDGE" || !decision.executionPlan?.narrowedScope || JSON.stringify(successor.scope) !== JSON.stringify(decision.executionPlan.narrowedScope) || JSON.stringify(successor.scope) === JSON.stringify(existing.scope)) return this.fail("NARROWED_SCOPE_REQUIRED");
      return this.finalize(decision, conflict.id, "NARROW_SCOPE", [conflict.existingKnowledgeId], [successor.id], [{ fromId: successor.id, toId: conflict.existingKnowledgeId, type: "NARROWS_SCOPE_OF" }]);
    }
    return this.fail("OUTCOME_UNSUPPORTED");
  }
  private async rejectCandidate(decision: ConflictResolutionDecision, conflict: { id: string; candidateKnowledgeId: string }) {
    const candidate = await this.ledger.get(conflict.candidateKnowledgeId);
    if (!candidate || candidate.recordType !== "CANDIDATE_KNOWLEDGE") return this.fail("CANDIDATE_REJECTION_FAILED");
    const rejected = await new HumanApprovalService({ ledger: this.ledger, now: this.now }).decide({ candidateId: candidate.id, decision: "REJECTED", actor: decision.decisionMaker, approvedStatement: candidate.statement, decidedAt: decision.decidedAt });
    if (rejected.status !== "RECORDED") { if (rejected.status === "PERSISTENCE_FAILED") throw new Error("candidate rejection persistence failed"); return this.fail("CANDIDATE_REJECTION_FAILED"); }
    return this.finalize(decision, conflict.id, "REJECT", [candidate.id], []);
  }
  private async finalize(decision: ConflictResolutionDecision, conflictId: string, resolutionType: ConflictResolution["resolutionType"], affectedKnowledgeIds: readonly string[], resultingKnowledgeIds: readonly string[], extraRelationships: readonly Pick<ProvenanceRelationship, "fromId" | "toId" | "type">[] = []) {
    const resolution: ConflictResolution = { id: this.createId(), recordType: "CONFLICT_RESOLUTION", conflictId, decisionId: decision.id, resolutionType, affectedKnowledgeIds, resultingKnowledgeIds, executedBy: decision.decisionMaker, executedAt: this.now(), immutable: true };
    const relationships: ProvenanceRelationship[] = [{ id: this.nextRelationshipId(), fromId: resolution.id, toId: decision.id, type: "EXECUTES_CONFLICT_DECISION", actor: decision.decisionMaker, createdAt: resolution.executedAt, immutable: true }];
    for (const relationship of extraRelationships) relationships.push({ id: this.nextRelationshipId(), ...relationship, actor: decision.decisionMaker, createdAt: resolution.executedAt, immutable: true });
    await this.ledger.append(resolution); for (const relationship of relationships) await this.ledger.relate(relationship);
    return { status: "EXECUTED" as const, reasonCode: "RESOLUTION_EXECUTED" as const, resolution, relationships, persistenceEffect: "CREATED" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const };
  }
  private nextRelationshipId() { return `${this.createRelationshipId()}:${this.relationshipSequence++}`; }
  private fail(reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "MERGED_KNOWLEDGE_REQUIRED" | "DURABLE_EXCEPTION_REQUIRED" | "EXCEPTION_CONDITION_REQUIRED" | "NARROWED_SCOPE_REQUIRED" | "IMPACT_ANALYSIS_FAILED" | "RELATED_CONFLICT_UNRESOLVED" | "SUPERSESSION_REJECTED" | "CANDIDATE_REJECTION_FAILED" | "PERSISTENCE_FAILED", status: "REJECTED" | "PERSISTENCE_FAILED" = "REJECTED") { return { status, reasonCode, relationships: [] as readonly ProvenanceRelationship[], persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
}
