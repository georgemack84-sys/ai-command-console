import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture } from "@/tests/integration/hidden-execution-detection/helpers";

describe("hidden execution detection fail closed", () => {
  it("fails closed when artifact is missing", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: null,
    });
    expect(fixture.result.report.scanStatus).toBe("failed_closed");
  });

  it("fails closed on circular artifacts", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const fixture = buildHiddenExecutionFixture({
      artifact: circular,
    });
    expect(fixture.result.report.scanStatus).toBe("failed_closed");
  });

  it("fails closed on executable metadata", () => {
    const fixture = buildHiddenExecutionFixture({
      metadata: Object.freeze({ executionAuthorized: true }),
    });
    expect(fixture.result.report.scanStatus).toBe("failed_closed");
  });

  it("fails closed on hash failure", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "safe", payload: BigInt(1) }),
    });
    expect(fixture.result.report.scanStatus).toBe("failed_closed");
  });
});
