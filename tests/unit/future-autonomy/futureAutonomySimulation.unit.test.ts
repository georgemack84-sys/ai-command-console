import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy simulation unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildFutureAutonomyFixture();
    const second = buildFutureAutonomyFixture();

    expect(first.result.hashes.finalResultHash).toBe(second.result.hashes.finalResultHash);
    expect(first.result.hashes.evidenceHash).toBe(second.result.hashes.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("remains advisory-only with no authority granted", () => {
    const fixture = buildFutureAutonomyFixture();

    expect(fixture.result.result.advisoryOnly).toBe(true);
    expect(fixture.result.result.authorityGranted).toBe(false);
    expect(fixture.result.result.runtimeMutationAllowed).toBe(false);
    expect(fixture.result.result.orchestrationAllowed).toBe(false);
  });
});
