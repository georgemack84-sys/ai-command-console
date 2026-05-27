import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness boundary", () => {
  it("invalidates hidden orchestration markers", () => {
    const fixture = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ hiddenOrchestration: true }),
    });

    expect(fixture.result.record.readinessClassification).toBe("INVALID");
  });
});
