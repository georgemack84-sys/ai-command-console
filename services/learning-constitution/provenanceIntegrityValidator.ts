import type { DurableProvenancedKnowledge, ProvenanceIntegrityResult, ProvenanceLedger, ProvenanceTrustState } from "../../types/learning-constitution/provenance";

export const validateProvenance = async (ledger: ProvenanceLedger, knowledgeId: string): Promise<ProvenanceIntegrityResult> => {
  const subject = await ledger.get(knowledgeId);
  if (!subject || subject.recordType !== "DURABLE_KNOWLEDGE") return { valid: false, violations: ["ORPHAN_KNOWLEDGE"] };
  const knowledge = subject as DurableProvenancedKnowledge;
  const violations = new Set<ProvenanceIntegrityResult["violations"][number]>();
  const links = await ledger.getRelationships(knowledgeId);
  const candidate = await ledger.get(knowledge.candidateId);
  const approval = await ledger.get(knowledge.approvalId);
  if (!candidate || candidate.recordType !== "CANDIDATE_KNOWLEDGE") violations.add("MISSING_INTERPRETATION");
  if (!approval || approval.recordType !== "HUMAN_APPROVAL" || approval.candidateId !== knowledge.candidateId || approval.decision !== "APPROVED") violations.add("MISSING_APPROVAL");
  if (!knowledge.authority) violations.add("INVALID_AUTHORITY");
  if ((await Promise.all(knowledge.evidenceRefs.map((id) => ledger.get(id)))).some((evidence) => !evidence)) {
    violations.add("MISSING_REQUIRED_EVIDENCE");
  }
  if (candidate?.recordType === "CANDIDATE_KNOWLEDGE") {
    if (candidate.extractionRefs.length === 0) violations.add("MISSING_INTERPRETATION");
    for (const extractionId of candidate.extractionRefs) {
      const extraction = await ledger.get(extractionId);
      if (!extraction || extraction.recordType !== "EXTRACTION") violations.add("MISSING_INTERPRETATION");
      else {
        if (!extraction.interpretedBy.actorId.trim()) violations.add("UNKNOWN_ACTOR");
        if (extraction.sourceRefs.length === 0 || (await Promise.all(extraction.sourceRefs.map((id) => ledger.get(id)))).some((source) => source?.recordType !== "TEACHING_EVENT")) violations.add("MISSING_SOURCE");
        const sources = await Promise.all(extraction.sourceRefs.map((id) => ledger.get(id)));
        if (sources.some((source) => source?.recordType === "TEACHING_EVENT" && !source.sourceActor.actorId.trim())) violations.add("UNKNOWN_ACTOR");
        if (scopeKey(extraction.scope) !== scopeKey(knowledge.scope)) violations.add("BROKEN_LINEAGE");
      }
    }
    if (scopeKey(candidate.scope) !== scopeKey(knowledge.scope)) violations.add("BROKEN_LINEAGE");
  }
  if (approval?.recordType === "HUMAN_APPROVAL" && !approval.actor.actorId.trim()) violations.add("UNKNOWN_ACTOR");
  const predecessors = links.filter((link) => link.type === "SUPERSEDES" && link.fromId === knowledgeId);
  const successors = links.filter((link) => link.type === "SUPERSEDED_BY" && link.fromId === knowledgeId);
  if (knowledge.status === "SUPERSEDED" && successors.length === 0) violations.add("MISSING_SUCCESSOR");
  for (const predecessor of predecessors) {
    const reciprocal = await ledger.getRelationships(predecessor.toId);
    if (!reciprocal.some((link) => link.type === "SUPERSEDED_BY" && link.fromId === predecessor.toId && link.toId === knowledgeId)) {
      violations.add("INVALID_SUPERSESSION");
    }
  }
  const visited = new Set<string>();
  const visit = async (id: string): Promise<boolean> => {
    if (visited.has(id)) return true;
    visited.add(id);
    const outgoing = (await ledger.getRelationships(id)).filter((link) => link.fromId === id && (link.type === "SUPERSEDES" || link.type === "SUPERSEDED_BY"));
    for (const link of outgoing) if (await visit(link.toId)) return true;
    visited.delete(id);
    return false;
  };
  if (await visit(knowledgeId)) violations.add("CIRCULAR_LINEAGE");
  return { valid: violations.size === 0, violations: [...violations].sort() };
};

const scopeKey = (scope: { type: string; id?: string }) => "id" in scope ? `${scope.type}:${scope.id}` : scope.type;

/** A record with incomplete provenance can never be trusted for durable use. */
export const provenanceTrustState = (integrity: ProvenanceIntegrityResult): ProvenanceTrustState => {
  if (integrity.valid) return "TRUSTED";
  if (integrity.violations.includes("CIRCULAR_LINEAGE") || integrity.violations.includes("INVALID_SUPERSESSION")) return "INVALID";
  if (integrity.violations.includes("MISSING_SOURCE") || integrity.violations.includes("MISSING_APPROVAL") || integrity.violations.includes("MISSING_INTERPRETATION")) return "QUARANTINED";
  return "REQUIRES_REPAIR";
};
