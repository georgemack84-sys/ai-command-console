import type { ConflictRecord } from "../../types/learning-constitution/conflictEngine";
import type { ConflictAuditEvent, ConflictKnowledgeSnapshot, ConflictResolutionProposal, ResolutionEvidencePackage } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceActor, ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

export type RecordConflictProposalRequest = Readonly<{
  proposal: ConflictResolutionProposal;
  existingItem: ConflictKnowledgeSnapshot;
  candidateItem: ConflictKnowledgeSnapshot;
  evidenceRefs: readonly string[];
  provenanceRefs: readonly string[];
  actor: ProvenanceActor;
}>;

export type RecordConflictProposalResult = Readonly<{
  status: "RECORDED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: "CONFLICT_MISSING" | "CONFLICT_MISMATCH" | "EVIDENCE_REFERENCE_MISSING" | "CONFLICT_PROPOSAL_RECORDED" | "PERSISTENCE_FAILED";
  evidencePackage?: ResolutionEvidencePackage;
  auditEvent?: ConflictAuditEvent;
  relationships: readonly ProvenanceRelationship[];
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

/** Persists the proposal and exactly the information considered; it cannot decide or execute a resolution. */
export class ConflictResolutionProposalService {
  constructor(
    private readonly ledger: ProvenanceLedger,
    private readonly createEvidencePackageId = () => `REP-${crypto.randomUUID()}`,
    private readonly createEventId = () => `CFE-${crypto.randomUUID()}`,
    private readonly createRelationshipId = (suffix: string) => `conflict-proposal:${suffix}:${crypto.randomUUID()}`,
  ) {}

  async record(request: RecordConflictProposalRequest): Promise<RecordConflictProposalResult> {
    const conflict = await this.ledger.get(request.proposal.conflictId);
    if (!conflict || conflict.recordType !== "CONFLICT") return this.failure("REJECTED", "CONFLICT_MISSING");
    if (!this.matches(conflict, request)) return this.failure("REJECTED", "CONFLICT_MISMATCH");
    if ((await Promise.all(request.evidenceRefs.map((id) => this.ledger.get(id)))).some((item) => !item)) return this.failure("REJECTED", "EVIDENCE_REFERENCE_MISSING");
    const evidencePackage: ResolutionEvidencePackage = {
      id: this.createEvidencePackageId(), recordType: "RESOLUTION_EVIDENCE_PACKAGE", conflictId: conflict.id, proposalId: request.proposal.id,
      existingItem: request.existingItem, candidateItem: request.candidateItem, comparisons: request.proposal.comparisons,
      evidenceRefs: [...request.evidenceRefs], provenanceRefs: [...request.provenanceRefs],
      policyVersions: { conflict: request.proposal.conflictPolicyVersion, authority: "6.0.0", scope: "1.0.0", evidence: "1.0.0", provenance: "7.0.0" },
      createdAt: request.proposal.createdAt, immutable: true,
    };
    const auditEvent: ConflictAuditEvent = { id: this.createEventId(), recordType: "CONFLICT_EVENT", eventType: "CONFLICT_PROPOSAL_RECORDED", conflictId: conflict.id, proposalId: request.proposal.id, evidencePackageId: evidencePackage.id, actor: request.actor, occurredAt: request.proposal.createdAt, immutable: true };
    const relationships: readonly ProvenanceRelationship[] = [
      { id: this.createRelationshipId("proposal"), fromId: request.proposal.id, toId: conflict.id, type: "PROPOSED_FOR_CONFLICT", actor: request.actor, createdAt: request.proposal.createdAt, immutable: true },
      { id: this.createRelationshipId("evidence"), fromId: evidencePackage.id, toId: request.proposal.id, type: "EVIDENCE_SNAPSHOT_FOR", actor: request.actor, createdAt: request.proposal.createdAt, immutable: true },
      { id: this.createRelationshipId("audit"), fromId: auditEvent.id, toId: request.proposal.id, type: "AUDITS_CONFLICT_PROPOSAL", actor: request.actor, createdAt: request.proposal.createdAt, immutable: true },
    ];
    try {
      for (const record of [request.proposal, evidencePackage, auditEvent]) await this.ledger.append(record);
      for (const relationship of relationships) await this.ledger.relate(relationship);
      return { status: "RECORDED", reasonCode: "CONFLICT_PROPOSAL_RECORDED", evidencePackage, auditEvent, relationships, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    } catch { return this.failure("PERSISTENCE_FAILED", "PERSISTENCE_FAILED"); }
  }

  private matches(conflict: ConflictRecord, request: RecordConflictProposalRequest): boolean {
    return conflict.id === request.proposal.conflictId
      && conflict.existingKnowledgeId === request.existingItem.knowledgeId
      && conflict.candidateKnowledgeId === request.candidateItem.knowledgeId;
  }
  private failure(status: "REJECTED" | "PERSISTENCE_FAILED", reasonCode: RecordConflictProposalResult["reasonCode"]): RecordConflictProposalResult {
    return { status, reasonCode, relationships: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
