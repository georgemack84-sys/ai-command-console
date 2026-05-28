import { describe, expect, it } from "vitest";

import { buildDegradedApiResponse } from "../../services/contracts/apiHealthMonitor.ts";

describe("degraded contract behavior", () => {
  it("returns stable rejection schema in frozen mode", () => {
    const response = buildDegradedApiResponse({
      mode: "FROZEN",
      reason: "queue pressure",
      contractVersion: "v1",
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("API_VALIDATION_FAILED");
    expect(response.meta.mode).toBe("FROZEN");
  });
});
