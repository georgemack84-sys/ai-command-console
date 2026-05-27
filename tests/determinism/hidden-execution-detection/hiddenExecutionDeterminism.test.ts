import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture } from "@/tests/integration/hidden-execution-detection/helpers";

describe("hidden execution detection determinism", () => {
  it("produces deterministic vector ordering and hashes", () => {
    const first = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "schedule this later and retry until successful" }),
    });
    const second = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "schedule this later and retry until successful" }),
    });
    expect(first.result.report.detectedVectors).toEqual(second.result.report.detectedVectors);
    expect(first.result.report.reportHash).toBe(second.result.report.reportHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
