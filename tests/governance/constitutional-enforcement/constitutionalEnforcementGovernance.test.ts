import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement governance", () => {
  it("fails closed on governance correlation mismatch", () => {
    const base = buildConstitutionalEnforcementFixture();
    const mutatedEvents = Object.freeze(base.input.immutableLedgerResult.events.map((event, index) =>
      index !== 0
        ? event
        : Object.freeze({
            ...event,
            governanceSnapshotId: "governance-snapshot-mismatch",
          })));
    const fixture = buildConstitutionalEnforcementFixture({
      immutableLedgerResult: Object.freeze({
        ...base.input.immutableLedgerResult,
        events: mutatedEvents,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
