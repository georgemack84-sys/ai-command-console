import { describe, expect, it } from "vitest";
import { canonicalRecordSchema, vaultRecordSchema } from "@/src/nuru/vault-contracts";
import { conflictedVaultFixture, historicalVaultFixture, poisonedVaultFixture, tinyVaultFixture } from "@/src/nuru/vault-fixtures";

describe("Nuru Vault deterministic fixtures", () => {
  it("keeps tiny, historical, and conflicted fixtures valid at the persisted-record boundary", () => {
    for (const fixture of [tinyVaultFixture, historicalVaultFixture, conflictedVaultFixture]) {
      expect(fixture.every((record) => vaultRecordSchema.safeParse(record).success)).toBe(true);
    }
  });

  it("retains the former version while identifying exactly one current historical record", () => {
    const records = historicalVaultFixture.filter((record) => record.kind === "CANONICAL_RECORD").map((record) => canonicalRecordSchema.parse(record));
    expect(records.filter((record) => record.status === "CURRENT")).toEqual([expect.objectContaining({ id: "history-canonical-v2", version: 2 })]);
    expect(records).toEqual(expect.arrayContaining([expect.objectContaining({ id: "history-canonical-v1", status: "SUPERSEDED", supersededById: "history-canonical-v2" })]));
  });

  it("keeps competing interpretations as candidates until governance selects one", () => {
    expect(conflictedVaultFixture.filter((record) => record.kind === "CANDIDATE")).toHaveLength(2);
    expect(conflictedVaultFixture.some((record) => record.kind === "CANONICAL_RECORD")).toBe(false);
  });

  it("rejects poisoned records before they can enter the Vault", () => {
    expect(poisonedVaultFixture.every((record) => vaultRecordSchema.safeParse(record).success)).toBe(false);
    expect(poisonedVaultFixture.every((record) => !vaultRecordSchema.safeParse(record).success)).toBe(true);
  });
});
