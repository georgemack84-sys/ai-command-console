import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement fail closed", () => {
  it("fails closed on replay mismatch", () => {
    const base = buildConstitutionalEnforcementFixture();
    const fixture = buildConstitutionalEnforcementFixture({
      replayResult: Object.freeze({
        ...base.input.replayResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID")).toBe(true);
    expect(fixture.result.status).toBe("FAILED_CLOSED");
  });
});
