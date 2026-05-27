import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement determinism", () => {
  it("produces identical verdicts and hashes for identical inputs", () => {
    const first = buildConstitutionalEnforcementFixture();
    const second = buildConstitutionalEnforcementFixture();

    expect(second.result.verdict).toEqual(first.result.verdict);
    expect(second.result.deterministicHash).toBe(first.result.deterministicHash);
    expect(second.result.auditRecords.map((record) => record.entryHash))
      .toEqual(first.result.auditRecords.map((record) => record.entryHash));
  });
});
