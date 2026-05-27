import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement integration", () => {
  it("consumes replay and immutable ledger outputs without mutating them", () => {
    const fixture = buildConstitutionalEnforcementFixture();
    const replayHash = fixture.input.replayResult.deterministicHash;
    const ledgerHash = fixture.input.immutableLedgerResult.deterministicHash;

    expect(fixture.result.replay.replayId).toBe(fixture.input.replayResult.episodes[0]?.replayId);
    expect(fixture.input.replayResult.deterministicHash).toBe(replayHash);
    expect(fixture.input.immutableLedgerResult.deterministicHash).toBe(ledgerHash);
  });

  it("keeps audit records append-only", () => {
    const first = buildConstitutionalEnforcementFixture();
    const second = buildConstitutionalEnforcementFixture({
      existingAuditLedger: first.result.auditLedger,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[first.result.auditLedger.length]?.previousHash)
      .toBe(first.result.auditLedger.at(-1)?.entryHash);
  });

  it("fails closed when immutable ledger is frozen upstream", () => {
    const base = buildConstitutionalEnforcementFixture();
    const fixture = buildConstitutionalEnforcementFixture({
      immutableLedgerResult: Object.freeze({
        ...base.input.immutableLedgerResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_LEDGER_INVALID")).toBe(true);
  });
});
