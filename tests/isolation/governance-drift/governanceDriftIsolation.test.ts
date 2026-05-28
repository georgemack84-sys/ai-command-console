import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift isolation", () => {
  it("fails closed on execution import markers", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ executionImport: "child_process" }),
    }).result;

    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_ISOLATION_VIOLATION")).toBe(true);
  });
});
