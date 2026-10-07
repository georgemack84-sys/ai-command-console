import { z } from "zod";
import { type CanonicalRecord, type VaultCandidate, type VaultEvidence, type VaultSource } from "@/src/nuru/vault-contracts";
import { NuruVaultCanonicalPromotionService, type VaultCanonicalStore } from "@/src/server/services/nuru-vault-canonical-promotion-service";
import { type VaultCanonicalReadStore } from "@/src/server/services/nuru-vault-canonical-projection-service";

export const vaultApprovalSchema = z.object({ candidateId: z.string().trim().min(1), rationale: z.string().trim().min(3).max(2_000), supersedesRecordId: z.string().trim().min(1).max(160).optional() });
export interface VaultReviewStore extends VaultCanonicalReadStore, VaultCanonicalStore { readVaultRecords(): Promise<import("@/src/nuru/vault-contracts").VaultRecord[]>; }
export class VaultReviewError extends Error { constructor(public readonly code: "CANDIDATE_NOT_FOUND" | "ALREADY_PROMOTED" | "CURRENT_RECORD_NOT_FOUND", message: string) { super(message); this.name = "VaultReviewError"; } }

function pendingCandidates(candidates: VaultCandidate[], canonicalCandidateIds: Set<string>) {
  return candidates.filter((candidate) => candidate.status === "PROPOSED" && !canonicalCandidateIds.has(candidate.id));
}

function approvedDecision(candidate: VaultCandidate, rationale: string, input: { actor: string; correlationId: string }) {
  const decidedAt = new Date().toISOString();
  return { schemaVersion: candidate.schemaVersion, id: `decision:${crypto.randomUUID()}`, kind: "GOVERNANCE_DECISION" as const, classification: candidate.classification, createdAt: decidedAt, correlationId: input.correlationId, candidateId: candidate.id, outcome: "APPROVED" as const, decidedBy: "nuru.governance.v1", decidedAt, rationale, requiredHumanReview: true, humanApprovalId: `approval:${input.actor}:${crypto.randomUUID()}` };
}

/** Human approval facade: candidates are listed and promoted only through the canonical gate. */
export const NuruVaultReviewService = {
  async list(store: Pick<VaultReviewStore, "readCanonicalState" | "readVaultRecords">) {
    const state = await store.readCanonicalState();
    const records = await store.readVaultRecords();
    const evidenceById = new Map(records.filter((record): record is VaultEvidence => record.kind === "EVIDENCE").map((record) => [record.id, record]));
    const sourceById = new Map(records.filter((record): record is VaultSource => record.kind === "SOURCE").map((record) => [record.id, record]));
    return pendingCandidates(state.candidates, new Set(state.records.map((record) => record.candidateId))).map((candidate) => ({
      ...candidate,
      evidence: candidate.evidenceIds.map((evidenceId) => {
        const evidence = evidenceById.get(evidenceId);
        return evidence && { id: evidence.id, locator: evidence.locator, contentHash: evidence.contentHash, classification: evidence.classification, source: sourceById.get(evidence.sourceId) && { id: evidence.sourceId, origin: sourceById.get(evidence.sourceId)?.origin, authority: sourceById.get(evidence.sourceId)?.authority, contentHash: sourceById.get(evidence.sourceId)?.contentHash, classification: sourceById.get(evidence.sourceId)?.classification } };
      }).filter((evidence): evidence is NonNullable<typeof evidence> => Boolean(evidence)),
    }));
  },

  async listCurrentRecords(store: VaultCanonicalReadStore): Promise<CanonicalRecord[]> {
    const state = await store.readCanonicalState();
    return state.records.filter((record) => record.status === "CURRENT");
  },

  async approve(rawApproval: z.input<typeof vaultApprovalSchema>, input: { actor: string; correlationId: string }, store: VaultReviewStore) {
    const approval = vaultApprovalSchema.parse(rawApproval);
    const state = await store.readCanonicalState();
    const candidate = state.candidates.find((item) => item.id === approval.candidateId);
    if (!candidate) throw new VaultReviewError("CANDIDATE_NOT_FOUND", "The Vault candidate was not found.");
    if (state.records.some((record) => record.candidateId === candidate.id)) throw new VaultReviewError("ALREADY_PROMOTED", "The Vault candidate already has a canonical record.");
    const decision = approvedDecision(candidate, approval.rationale, input);
    if (approval.supersedesRecordId) {
      const currentRecord = state.records.find((record) => record.id === approval.supersedesRecordId && record.status === "CURRENT");
      if (!currentRecord) throw new VaultReviewError("CURRENT_RECORD_NOT_FOUND", "The selected current canonical record was not found.");
      return NuruVaultCanonicalPromotionService.supersede({ candidate, decision, currentRecord, canonicalRecordId: `canonical:${crypto.randomUUID()}` }, store);
    }
    return NuruVaultCanonicalPromotionService.promote({ candidate, decision, canonicalRecordId: `canonical:${crypto.randomUUID()}` }, store);
  },
};
