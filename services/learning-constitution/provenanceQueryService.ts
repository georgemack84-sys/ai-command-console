import type { KnowledgeProvenanceExplanation, ProvenanceEnvelope, ProvenanceIntegrityResult, ProvenanceKnowledgeState, ProvenanceLedger, ProvenanceRecord } from "../../types/learning-constitution/provenance";
import { validateProvenance } from "./provenanceIntegrityValidator";

export class ProvenanceQueryService {
  constructor(private readonly ledger: ProvenanceLedger) {}

  async getProvenance(recordId: string): Promise<ProvenanceEnvelope | undefined> {
    const subject = await this.ledger.get(recordId);
    if (!subject) return undefined;
    const links = await this.ledger.getRelationships(recordId);
    const targetIds = (type: string, from = true) => links.filter((link) => link.type === type && (from ? link.fromId === recordId : link.toId === recordId)).map((link) => from ? link.toId : link.fromId);
    const lineage = await this.getLineage(recordId);
    const sources = lineage.filter((item) => item.recordType === "TEACHING_EVENT");
    const approvals = await this.getApprovals(recordId);
    return {
      provenanceId: `provenance:${recordId}`, subjectRecordId: recordId, subjectRecordType: subject.recordType,
      sourceRefs: sources.map((item) => item.id), sourceActors: sources.map((item) => item.sourceActor),
      extractionRefs: targetIds("DERIVED_FROM"), interpretationRefs: targetIds("INTERPRETED_AS"),
      classification: "classification" in subject ? subject.classification : undefined, scope: "scope" in subject ? subject.scope : undefined,
      authority: "authority" in subject ? subject.authority : undefined, confidence: "confidence" in subject ? subject.confidence : undefined,
      evidenceRefs: "evidenceRefs" in subject ? subject.evidenceRefs : [], approvalRefs: approvals.map((item) => item.id),
      predecessorRefs: targetIds("SUPERSEDES"), successorRefs: targetIds("SUPERSEDED_BY"), relationships: links,
      createdAt: "createdAt" in subject
        ? subject.createdAt
        : subject.recordType === "TEACHING_EVENT" ? subject.receivedAt
          : subject.recordType === "HUMAN_APPROVAL" ? subject.decidedAt : subject.occurredAt,
      currentStatus: "status" in subject ? subject.status : undefined,
    };
  }

  async getLineage(recordId: string): Promise<readonly ProvenanceRecord[]> {
    const result: ProvenanceRecord[] = []; const visited = new Set<string>();
    const walk = async (id: string): Promise<void> => {
      if (visited.has(id)) return; visited.add(id);
      const record = await this.ledger.get(id); if (!record) return;
      result.push(record);
      const links = await this.ledger.getRelationships(id);
      for (const link of links.filter((item) => item.fromId === id && ["DERIVED_FROM", "EXTRACTED_FROM", "INTERPRETED_AS", "APPROVED_BY", "SUPERSEDES"].includes(item.type))) await walk(link.toId);
    };
    await walk(recordId); return result;
  }
  async getOriginalSource(recordId: string) { return (await this.getLineage(recordId)).filter((record) => record.recordType === "TEACHING_EVENT"); }
  async getInterpretations(recordId: string) { return (await this.getLineage(recordId)).filter((record) => record.recordType === "EXTRACTION"); }
  async getApprovals(recordId: string) {
    const lineageApprovals = (await this.getLineage(recordId)).filter((record) => record.recordType === "HUMAN_APPROVAL");
    const record = await this.ledger.get(recordId);
    const durableApproval = record?.recordType === "DURABLE_KNOWLEDGE" ? await this.ledger.get(record.approvalId) : undefined;
    return [...new Map([...lineageApprovals, ...(durableApproval?.recordType === "HUMAN_APPROVAL" ? [durableApproval] : [])].map((item) => [item.id, item])).values()];
  }
  async getEvidence(recordId: string): Promise<readonly ProvenanceRecord[]> {
    const record = await this.ledger.get(recordId);
    if (!record || !("evidenceRefs" in record)) return [];
    const directEvidence = (await Promise.all(record.evidenceRefs.map((id) => this.ledger.get(id)))).filter((item): item is ProvenanceRecord => Boolean(item));
    const expanded = await Promise.all(directEvidence.filter((item) => item.recordType === "EVIDENCE_SET").flatMap((item) => item.evidenceRefs).map((id) => this.ledger.get(id)));
    return [...new Map([...directEvidence, ...expanded.filter((item): item is ProvenanceRecord => Boolean(item))].map((item) => [item.id, item])).values()];
  }
  async getPredecessors(recordId: string) { return (await this.getProvenance(recordId))?.predecessorRefs ?? []; }
  async getSuccessors(recordId: string) { return (await this.getProvenance(recordId))?.successorRefs ?? []; }
  async getKnowledgeState(recordId: string): Promise<ProvenanceKnowledgeState | undefined> {
    const record = await this.ledger.get(recordId);
    if (!record || record.recordType !== "DURABLE_KNOWLEDGE") return undefined;
    const relationships = await this.ledger.getRelationships(recordId);
    const predecessorIds = relationships.filter((item) => item.fromId === recordId && item.type === "SUPERSEDES").map((item) => item.toId);
    const successorIds = relationships.filter((item) => item.fromId === recordId && item.type === "SUPERSEDED_BY").map((item) => item.toId);
    return { knowledgeId: recordId, current: successorIds.length === 0, historicalStatus: successorIds.length ? "SUPERSEDED" : "ACTIVE", predecessorIds, successorIds };
  }
  async getHistory(recordId: string) {
    const timeOf = (record: ProvenanceRecord) => "createdAt" in record
      ? record.createdAt
      : record.recordType === "TEACHING_EVENT" ? record.receivedAt
        : record.recordType === "HUMAN_APPROVAL" ? record.decidedAt : record.occurredAt;
    return [...await this.getLineage(recordId)].sort((left, right) => timeOf(left).localeCompare(timeOf(right)) || left.id.localeCompare(right.id));
  }
  async explainKnowledge(recordId: string): Promise<{ envelope?: ProvenanceEnvelope; lineage: readonly ProvenanceRecord[]; integrity: ProvenanceIntegrityResult }> {
    return { envelope: await this.getProvenance(recordId), lineage: await this.getLineage(recordId), integrity: await validateProvenance(this.ledger, recordId) };
  }
  async explain(recordId: string): Promise<KnowledgeProvenanceExplanation> {
    const [currentState, originalSources, interpretations, approvals, evidence, predecessors, successors, history, integrity] = await Promise.all([
      this.getKnowledgeState(recordId), this.getOriginalSource(recordId), this.getInterpretations(recordId), this.getApprovals(recordId), this.getEvidence(recordId), this.getPredecessors(recordId), this.getSuccessors(recordId), this.getHistory(recordId), validateProvenance(this.ledger, recordId),
    ]);
    return { knowledgeId: recordId, currentState, originalSources, interpretations, approvals, evidence, predecessors, successors, history, integrity };
  }
}
