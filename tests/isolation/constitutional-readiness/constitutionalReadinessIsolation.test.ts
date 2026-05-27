import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness isolation", () => {
  it("invalidates on execution or runtime bridges", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ executionImport: true, runtimeBridge: true }),
    });

    expect(fixture.result.record.readinessClassification).toBe("INVALID");
    expect(fixture.result.errors.some((item) => item.code.includes("ISOLATION"))).toBe(true);
  });
});
