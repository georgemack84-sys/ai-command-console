import { z } from "zod";
import { type CanonicalRecord, type VaultCandidate, canonicalRecordSchema, vaultCandidateSchema } from "@/src/nuru/vault-contracts";

export const canonicalProjectionEntrySchema = z.object({
  canonicalRecordId: z.string().min(1),
  candidateId: z.string().min(1),
  version: z.number().int().positive(),
  classification: z.enum(["PUBLIC", "PERSONAL", "PRIVATE", "CONFIDENTIAL", "RESTRICTED", "SYSTEM"]),
  interpretation: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const canonicalProjectionSnapshotSchema = z.object({
  revision: z.string().min(1),
  entries: z.array(canonicalProjectionEntrySchema),
});

export type CanonicalProjectionEntry = z.infer<typeof canonicalProjectionEntrySchema>;
export type CanonicalProjectionSnapshot = z.infer<typeof canonicalProjectionSnapshotSchema>;

export interface VaultCanonicalReadStore {
  readCanonicalState(): Promise<{ revision: string; records: CanonicalRecord[]; candidates: VaultCandidate[] }>;
}

export class VaultCanonicalProjectionError extends Error {
  constructor(public readonly code: "MISSING_CANDIDATE" | "STALE_PROJECTION", message: string) {
    super(message);
    this.name = "VaultCanonicalProjectionError";
  }
}

function project(records: readonly CanonicalRecord[], candidates: readonly VaultCandidate[]): CanonicalProjectionEntry[] {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return records
    .filter((record) => record.status === "CURRENT")
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((record) => {
      const candidate = candidatesById.get(record.candidateId);
      if (!candidate) {
        throw new VaultCanonicalProjectionError("MISSING_CANDIDATE", `Current canonical record ${record.id} references unavailable candidate ${record.candidateId}.`);
      }
      return canonicalProjectionEntrySchema.parse({ canonicalRecordId: record.id, candidateId: candidate.id, version: record.version, classification: record.classification, interpretation: candidate.interpretation, confidence: candidate.confidence });
    });
}

/** Read-only canonical projection. It never reconstructs truth from candidate state alone. */
export const NuruVaultCanonicalProjectionService = {
  async rebuild(store: VaultCanonicalReadStore): Promise<CanonicalProjectionSnapshot> {
    const state = await store.readCanonicalState();
    const records = state.records.map((record) => canonicalRecordSchema.parse(record));
    const candidates = state.candidates.map((candidate) => vaultCandidateSchema.parse(candidate));
    return canonicalProjectionSnapshotSchema.parse({ revision: state.revision, entries: project(records, candidates) });
  },

  async lookup(store: VaultCanonicalReadStore, snapshot: CanonicalProjectionSnapshot, canonicalRecordId: string): Promise<CanonicalProjectionEntry | null> {
    const parsed = canonicalProjectionSnapshotSchema.parse(snapshot);
    const state = await store.readCanonicalState();
    if (state.revision !== parsed.revision) {
      throw new VaultCanonicalProjectionError("STALE_PROJECTION", "The canonical state has changed; rebuild the retrieval projection before serving this query.");
    }
    return parsed.entries.find((entry) => entry.canonicalRecordId === canonicalRecordId) ?? null;
  },

  async listDiscoveryView(store: VaultCanonicalReadStore, snapshot: CanonicalProjectionSnapshot): Promise<CanonicalProjectionEntry[]> {
    const parsed = canonicalProjectionSnapshotSchema.parse(snapshot);
    const state = await store.readCanonicalState();
    if (state.revision !== parsed.revision) {
      throw new VaultCanonicalProjectionError("STALE_PROJECTION", "The canonical state has changed; rebuild the retrieval projection before serving this query.");
    }
    return [...parsed.entries];
  },
};
