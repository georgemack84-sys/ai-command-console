import { describe, expect, it } from "vitest";
import { evaluateProductionFixture } from "./helpers";

describe("production readiness gate", () => {
  it("certifies only when all production trust requirements pass", () => {
    const result = evaluateProductionFixture();

    expect(result.certified).toBe(true);
    expect(result.status).toBe("certified");
    expect(result.replayVerified).toBe(true);
    expect(result.governanceVerified).toBe(true);
    expect(result.integrityVerified).toBe(true);
    expect(result.survivabilityVerified).toBe(true);
    expect(result.adversarialValidationPassed).toBe(true);
    expect(result.failClosedVerified).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const first = evaluateProductionFixture();
    const second = evaluateProductionFixture();

    expect(first).toEqual(second);
  });
});
