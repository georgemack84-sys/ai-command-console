import { describe, expect, it } from "vitest";
import { buildQuarantinedValidationFixture, buildRevalidationValidationFixture } from "./helpers";

describe("quarantine propagation", () => {
  it("propagates quarantined and revalidation-required treaty state safely", () => {
    expect(buildQuarantinedValidationFixture().output.result.status).toBe("quarantined");
    expect(buildRevalidationValidationFixture().output.result.status).toBe("revalidation-required");
  });
});
