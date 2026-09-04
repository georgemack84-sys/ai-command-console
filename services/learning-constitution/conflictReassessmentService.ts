import type { ConflictReassessmentTrigger, ConflictReassessmentTriggerType } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

/** Appends an auditable reason to reconsider a conflict; reconsideration remains a separate analysis step. */
export class ConflictReassessmentService {
  constructor(private readonly ledger: ProvenanceLedger, private readonly createId = () => `CRT-${crypto.randomUUID()}`, private readonly createRelationshipId = (suffix: string) => `conflict-reassessment:${suffix}:${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  async trigger(input: Readonly<{ conflictId: string; triggerType: ConflictReassessmentTriggerType; evidenceRef?: string; rationale: string; triggeredBy: ProvenanceActor }>): Promise<Readonly<{ status: "RECORDED" | "REJECTED" | "PERSISTENCE_FAILED"; reasonCode: "REASSESSMENT_TRIGGER_RECORDED" | "CONFLICT_MISSING" | "EVIDENCE_MISSING" | "RATIONALE_MISSING" | "ACTOR_UNKNOWN" | "PERSISTENCE_FAILED"; trigger?: ConflictReassessmentTrigger; relationships: readonly ProvenanceRelationship[]; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const conflict = await this.ledger.get(input.conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return this.reject("CONFLICT_MISSING");
    if (!input.rationale.trim()) return this.reject("RATIONALE_MISSING");
    if (!input.triggeredBy.actorId.trim()) return this.reject("ACTOR_UNKNOWN");
    if (input.evidenceRef && !await this.ledger.get(input.evidenceRef)) return this.reject("EVIDENCE_MISSING");
    const createdAt = this.now();
    const trigger: ConflictReassessmentTrigger = { id: this.createId(), recordType: "CONFLICT_REASSESSMENT_TRIGGER", conflictId: conflict.id, triggerType: input.triggerType, evidenceRef: input.evidenceRef, rationale: input.rationale, triggeredBy: input.triggeredBy, createdAt, immutable: true };
    const relationships: ProvenanceRelationship[] = [{ id: this.createRelationshipId("conflict"), fromId: trigger.id, toId: conflict.id, type: "REASSESSMENT_TRIGGER_FOR", actor: input.triggeredBy, createdAt, immutable: true }];
    if (input.evidenceRef) relationships.push({ id: this.createRelationshipId("evidence"), fromId: trigger.id, toId: input.evidenceRef, type: "REASSESSMENT_EVIDENCE", actor: input.triggeredBy, createdAt, immutable: true });
    try { await this.ledger.append(trigger); for (const relationship of relationships) await this.ledger.relate(relationship); return { status: "RECORDED", reasonCode: "REASSESSMENT_TRIGGER_RECORDED", trigger, relationships, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
    catch { return { status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", relationships: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
  }
  private reject(reasonCode: "CONFLICT_MISSING" | "EVIDENCE_MISSING" | "RATIONALE_MISSING" | "ACTOR_UNKNOWN") { return { status: "REJECTED" as const, reasonCode, relationships: [] as readonly ProvenanceRelationship[], persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }; }
}
