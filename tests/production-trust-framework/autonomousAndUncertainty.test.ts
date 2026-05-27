import { describe, expect, it } from "vitest";
import { evaluateProductionFixture } from "./helpers";

describe("autonomous deployment and uncertainty", () => {
  it("denies autonomous deployment self-authorization and fails closed on uncertainty", () => {
    const result = evaluateProductionFixture({
      autonomousDeploymentRequested: true,
      authorityStatus: "unknown",
    });

    expect(result.certified).toBe(false);
    expect(result.errors.some((error) => error.code === "AUTONOMOUS_DEPLOYMENT_DENIED")).toBe(true);
    expect(result.errors.some((error) => error.code === "CERTIFICATION_AUTHORITY_UNKNOWN")).toBe(true);
  });
});
