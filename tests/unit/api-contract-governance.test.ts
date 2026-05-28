import { describe, expect, it } from "vitest";

import { evaluateContractGovernance } from "../../services/contracts/contractGovernance.ts";

describe("api contract governance", () => {
  it("requires approval for publish readiness", () => {
    const result = evaluateContractGovernance({
      approved: false,
      owner: "mission-control",
      replayVerified: true,
      compatibilityVerified: true,
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("API_SCHEMA_INVALID");
  });
});
