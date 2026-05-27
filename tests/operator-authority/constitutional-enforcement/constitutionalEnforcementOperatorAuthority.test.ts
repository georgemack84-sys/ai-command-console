import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement operator authority", () => {
  it("keeps operator supremacy intact", () => {
    const fixture = buildConstitutionalEnforcementFixture();

    expect(fixture.result.verdict.executionAuthorized).toBe(false);
    expect(fixture.result.verdict.runtimeMutationOccurred).toBe(false);
    expect(fixture.result.verdict.scheduledActionCreated).toBe(false);
    expect(fixture.result.verdict.authorityChanged).toBe(false);
    expect(fixture.result.auditRecords.every((record) => record.executionAuthorized === false)).toBe(true);
  });
});
