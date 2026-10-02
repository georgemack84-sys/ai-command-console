import { type CanonicalRecord, type VaultRecord } from "@/src/nuru/vault-contracts";

export interface VaultTimelineStore { readVaultRecords(): Promise<VaultRecord[]>; }

export class VaultTimelineError extends Error {
  constructor(message: string) { super(message); this.name = "VaultTimelineError"; }
}

function latestById(records: VaultRecord[]) {
  return new Map(records.map((record) => [record.id, record]));
}

/** Reconstructs a read-only canonical record trail from the append-only ledger. */
export const NuruVaultTimelineService = {
  async listSources(store: VaultTimelineStore) {
    return (await store.readVaultRecords()).filter((record): record is Extract<VaultRecord, { kind: "SOURCE" }> => record.kind === "SOURCE").map((record) => ({ id: record.id, origin: record.origin, authority: record.authority, classification: record.classification })).sort((left, right) => left.origin.localeCompare(right.origin));
  },

  async search(filters: { correlationId?: string; classification?: string; eventType?: string; sourceId?: string }, store: VaultTimelineStore) {
    const ledger = await store.readVaultRecords();
    const sourceByEvidence = new Map(ledger.filter((record): record is Extract<VaultRecord, { kind: "EVIDENCE" }> => record.kind === "EVIDENCE").map((record) => [record.id, record.sourceId]));
    const sourceOriginById = new Map(ledger.filter((record): record is Extract<VaultRecord, { kind: "SOURCE" }> => record.kind === "SOURCE").map((record) => [record.id, record.origin]));
    const sourceByCandidate = new Map(ledger.filter((record): record is Extract<VaultRecord, { kind: "CANDIDATE" }> => record.kind === "CANDIDATE").map((record) => [record.id, record.evidenceIds.map((id) => sourceByEvidence.get(id)).filter((sourceId): sourceId is string => Boolean(sourceId))]));
    const events = ledger.flatMap((record) => {
      const event = record.kind === "SOURCE" ? { id: record.id, type: "SOURCE_CAPTURED", at: record.createdAt, label: record.origin, classification: record.classification, correlationId: record.correlationId }
        : record.kind === "EVIDENCE" ? { id: record.id, type: "EVIDENCE_CAPTURED", at: record.capturedAt, label: record.locator, classification: record.classification, correlationId: record.correlationId }
          : record.kind === "CANDIDATE" ? { id: record.id, type: "CANDIDATE_PROPOSED", at: record.createdAt, label: record.interpretation, classification: record.classification, correlationId: record.correlationId }
            : record.kind === "GOVERNANCE_DECISION" ? { id: record.id, type: "DECISION_RECORDED", at: record.decidedAt, label: record.rationale, classification: record.classification, correlationId: record.correlationId }
              : record.kind === "CANONICAL_RECORD" ? { id: record.id, type: record.status === "SUPERSEDED" ? "RECORD_SUPERSEDED" : "CANONICAL_PROMOTED", at: record.createdAt, label: `Version ${record.version} · ${record.status}`, classification: record.classification, correlationId: record.correlationId }
                : record.kind === "PROJECT_DECISION" ? { id: record.id, type: record.status === "SUPERSEDED" ? "PROJECT_DECISION_SUPERSEDED" : "PROJECT_DECISION_RECORDED", at: record.decidedAt, label: `${record.project}: ${record.question}`, classification: record.classification, correlationId: record.correlationId }
                  : record.kind === "PROJECT_REQUIREMENT" ? { id: record.id, type: record.status === "SUPERSEDED" ? "PROJECT_REQUIREMENT_SUPERSEDED" : "PROJECT_REQUIREMENT_RECORDED", at: record.createdAt, label: `${record.project}: ${record.title}`, classification: record.classification, correlationId: record.correlationId }
                    : record.kind === "CODEX_BUILD_PACKAGE" ? { id: record.id, type: "CODEX_BUILD_PACKAGE_RECORDED", at: record.createdAt, label: `${record.project}: ${record.objective}`, classification: record.classification, correlationId: record.correlationId }
                      : record.kind === "CODEX_IMPLEMENTATION_LEDGER" ? { id: record.id, type: "CODEX_IMPLEMENTATION_RECORDED", at: record.createdAt, label: `${record.qualificationStatus}: ${record.buildPackageId}`, classification: record.classification, correlationId: record.correlationId }
                        : record.kind === "CODEX_EXECUTION_EVENT" ? { id: record.id, type: "CODEX_EXECUTION_STARTED", at: record.startedAt, label: `${record.buildPackageId}: ${record.branch}`, classification: record.classification, correlationId: record.correlationId }
                          : { id: record.id, type: record.eventType, at: record.occurredAt, label: record.reason, classification: record.classification, correlationId: record.correlationId };
      const sourceIds = record.kind === "SOURCE" ? [record.id] : record.kind === "EVIDENCE" ? [record.sourceId] : record.kind === "CANDIDATE" ? sourceByCandidate.get(record.id) ?? [] : ledger.filter((item): item is Extract<VaultRecord, { kind: "CANDIDATE" }> => item.kind === "CANDIDATE" && item.correlationId === record.correlationId).flatMap((item) => sourceByCandidate.get(item.id) ?? []);
      const sourceOrigins = [...new Set(sourceIds.map((id) => sourceOriginById.get(id)).filter((origin): origin is string => Boolean(origin)))];
      return (!filters.correlationId || event.correlationId === filters.correlationId) && (!filters.classification || event.classification === filters.classification) && (!filters.eventType || event.type === filters.eventType) && (!filters.sourceId || sourceIds.includes(filters.sourceId)) ? [{ ...event, sourceOrigins }] : [];
    });
    return events.sort((left, right) => right.at.localeCompare(left.at) || right.id.localeCompare(left.id)).slice(0, 200);
  },

  async forCanonicalRecord(canonicalRecordId: string, store: VaultTimelineStore) {
    const ledger = await store.readVaultRecords();
    const latest = latestById(ledger);
    const canonical = latest.get(canonicalRecordId);
    if (!canonical || canonical.kind !== "CANONICAL_RECORD") throw new VaultTimelineError("The requested canonical Vault record was not found.");
    const candidate = latest.get(canonical.candidateId);
    const decision = latest.get(canonical.governanceDecisionId);
    if (!candidate || candidate.kind !== "CANDIDATE" || !decision || decision.kind !== "GOVERNANCE_DECISION") {
      throw new VaultTimelineError("The canonical Vault record has an incomplete provenance chain.");
    }
    const evidence = candidate.evidenceIds.map((id) => latest.get(id)).filter((record): record is Extract<VaultRecord, { kind: "EVIDENCE" }> => record?.kind === "EVIDENCE");
    const sources = evidence.map((record) => latest.get(record.sourceId)).filter((record): record is Extract<VaultRecord, { kind: "SOURCE" }> => record?.kind === "SOURCE");
    const relatedIds = new Set([canonical.id, candidate.id, decision.id, ...evidence.map((record) => record.id), ...sources.map((record) => record.id)]);
    const audit = ledger.filter((record): record is Extract<VaultRecord, { kind: "AUDIT_EVENT" }> => record.kind === "AUDIT_EVENT" && (relatedIds.has(record.resourceId) || record.correlationId === canonical.correlationId));
    const events = [
      ...sources.map((record) => ({ id: record.id, type: "SOURCE_CAPTURED", at: record.createdAt, label: record.origin, classification: record.classification })),
      ...evidence.map((record) => ({ id: record.id, type: "EVIDENCE_CAPTURED", at: record.capturedAt, label: record.locator, classification: record.classification })),
      { id: candidate.id, type: "CANDIDATE_PROPOSED", at: candidate.createdAt, label: candidate.interpretation, classification: candidate.classification },
      { id: decision.id, type: "DECISION_RECORDED", at: decision.decidedAt, label: decision.rationale, classification: decision.classification },
      { id: canonical.id, type: canonical.status === "SUPERSEDED" ? "RECORD_SUPERSEDED" : "CANONICAL_PROMOTED", at: canonical.createdAt, label: `Version ${canonical.version} · ${canonical.status}`, classification: canonical.classification },
      ...audit.map((record) => ({ id: record.id, type: record.eventType, at: record.occurredAt, label: record.reason, classification: record.classification })),
    ].sort((left, right) => left.at.localeCompare(right.at) || left.id.localeCompare(right.id));
    return { canonicalRecord: canonical as CanonicalRecord, correlationId: canonical.correlationId, events };
  },
};
