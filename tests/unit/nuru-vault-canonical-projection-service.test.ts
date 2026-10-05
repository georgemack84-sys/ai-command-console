import { describe, expect, it } from "vitest";
import { type CanonicalRecord, type VaultCandidate, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultCanonicalProjectionService, VaultCanonicalProjectionError, type VaultCanonicalReadStore } from "@/src/server/services/nuru-vault-canonical-projection-service";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };
const candidateOne: VaultCandidate = { ...envelope, id: "candidate-1", kind: "CANDIDATE", evidenceIds: ["evidence-1"], interpretation: "The first canonical discovery.", confidence: 0.8, producedBy: "nuru.discovery.v1", status: "PROPOSED" };
const candidateTwo: VaultCandidate = { ...envelope, id: "candidate-2", kind: "CANDIDATE", evidenceIds: ["evidence-2"], interpretation: "The corrected canonical discovery.", confidence: 0.9, producedBy: "nuru.discovery.v1", status: "PROPOSED" };

function readStore(initial: { revision: string; records: CanonicalRecord[]; candidates: VaultCandidate[] }) {
  let state = initial;
  const store: VaultCanonicalReadStore = { readCanonicalState: async () => state };
  return { store, replace: (next: typeof initial) => { state = next; } };
}

describe("Nuru Vault canonical projection", () => {
  it("builds a read-only discovery view from current canonical records only", async () => {
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: candidateOne.id, governanceDecisionId: "decision-1", version: 1, status: "CURRENT" };
    const historical: CanonicalRecord = { ...current, id: "canonical-0", status: "SUPERSEDED", supersededById: current.id };
    const memory = readStore({ revision: "revision-1", records: [current, historical], candidates: [candidateOne] });
    const snapshot = await NuruVaultCanonicalProjectionService.rebuild(memory.store);

    expect(await NuruVaultCanonicalProjectionService.listDiscoveryView(memory.store, snapshot)).toEqual([expect.objectContaining({ canonicalRecordId: current.id, interpretation: candidateOne.interpretation })]);
  });

  it("rejects a stale projection so a supersession cannot remain hidden", async () => {
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: candidateOne.id, governanceDecisionId: "decision-1", version: 1, status: "CURRENT" };
    const memory = readStore({ revision: "revision-1", records: [current], candidates: [candidateOne] });
    const snapshot = await NuruVaultCanonicalProjectionService.rebuild(memory.store);
    const successor: CanonicalRecord = { ...envelope, id: "canonical-2", kind: "CANONICAL_RECORD", candidateId: candidateTwo.id, governanceDecisionId: "decision-2", version: 2, status: "CURRENT" };
    memory.replace({ revision: "revision-2", records: [{ ...current, status: "SUPERSEDED", supersededById: successor.id }, successor], candidates: [candidateOne, candidateTwo] });

    await expect(NuruVaultCanonicalProjectionService.lookup(memory.store, snapshot, current.id)).rejects.toBeInstanceOf(VaultCanonicalProjectionError);
    const rebuilt = await NuruVaultCanonicalProjectionService.rebuild(memory.store);
    await expect(NuruVaultCanonicalProjectionService.lookup(memory.store, rebuilt, successor.id)).resolves.toMatchObject({ interpretation: candidateTwo.interpretation, version: 2 });
  });

  it("refuses to project a current record whose candidate history is unavailable", async () => {
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: "missing-candidate", governanceDecisionId: "decision-1", version: 1, status: "CURRENT" };
    const memory = readStore({ revision: "revision-1", records: [current], candidates: [] });
    await expect(NuruVaultCanonicalProjectionService.rebuild(memory.store)).rejects.toMatchObject({ code: "MISSING_CANDIDATE" });
  });
});
