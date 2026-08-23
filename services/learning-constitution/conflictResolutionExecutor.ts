import { ProvenanceSupersessionService } from "./provenanceSupersessionService";
import type { ConflictResolution, ConflictResolutionDecision } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

/**
 * A deliberately small executor. It only supports human-decided supersession,
 * delegates to the existing immutable lineage service, and refuses every
 * unsupported outcome rather than approximating a mutation.
 */
export class ConflictResolutionExecutor {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CR-${crypto.randomUUID()}`, private readonly createRelationshipId = () => `conflict-execution:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async execute(decisionId: string): Promise<Readonly<{ status: "EXECUTED" | "REJECTED" | "PERSISTENCE_FAILED"; reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "SUPERSESSION_REJECTED" | "RESOLUTION_EXECUTED" | "PERSISTENCE_FAILED"; resolution?: ConflictResolution; relationships: readonly ProvenanceRelationship[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const decision = await this.ledger.get(decisionId);
    if (!decision || decision.recordType !== "CONFLICT_RESOLUTION_DECISION") return this.fail("DECISION_MISSING");
    if (decision.acceptedOutcome !== "SUPERSEDE") return this.fail("OUTCOME_UNSUPPORTED");
    const conflict = await this.ledger.get(decision.conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return this.fail("DECISION_MISSING");
    const successor = await this.ledger.get(conflict.candidateKnowledgeId);
    if (!successor || successor.recordType !== "DURABLE_KNOWLEDGE") return this.fail("DURABLE_SUCCESSOR_REQUIRED");
    const supersession = await new ProvenanceSupersessionService({ ledger: this.ledger, now: this.now }).supersede({ priorKnowledgeId: conflict.existingKnowledgeId, successorKnowledgeId: successor.id, reason: decision.decisionReason, actor: decision.decisionMaker, occurredAt: decision.decidedAt });
    if (supersession.status !== "SUPERSEDED") return this.fail("SUPERSESSION_REJECTED", supersession.status === "PERSISTENCE_FAILED" ? "PERSISTENCE_FAILED" : "REJECTED");
    const resolution: ConflictResolution = { id: this.createId(), recordType: "CONFLICT_RESOLUTION", conflictId: conflict.id, decisionId: decision.id, resolutionType: "SUPERSEDE", affectedKnowledgeIds: [conflict.existingKnowledgeId], resultingKnowledgeIds: [successor.id], executedBy: decision.decisionMaker, executedAt: this.now(), immutable: true };
    const relationship: ProvenanceRelationship = { id: this.createRelationshipId(), fromId: resolution.id, toId: decision.id, type: "EXECUTES_CONFLICT_DECISION", actor: decision.decisionMaker, createdAt: resolution.executedAt, immutable: true };
    try { await this.ledger.append(resolution); await this.ledger.relate(relationship); return { status: "EXECUTED", reasonCode: "RESOLUTION_EXECUTED", resolution, relationships: [relationship], persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
    catch { return this.fail("PERSISTENCE_FAILED", "PERSISTENCE_FAILED"); }
  }
  private fail(reasonCode: "DECISION_MISSING" | "OUTCOME_UNSUPPORTED" | "DURABLE_SUCCESSOR_REQUIRED" | "SUPERSESSION_REJECTED" | "PERSISTENCE_FAILED", status: "REJECTED" | "PERSISTENCE_FAILED" = "REJECTED") { return { status, reasonCode, relationships: [] as readonly ProvenanceRelationship[], persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
}
