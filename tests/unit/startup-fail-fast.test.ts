import { describe, expect, it } from "vitest";

import { assertStartupAllowed } from "@/services/startup/failFast";

describe("startup fail fast", () => {
  it("terminates unsafe startup immediately", () => {
    expect(() =>
      assertStartupAllowed({
        ok: false,
        error: {
          code: "STARTUP_CONTINUITY_UNVERIFIED",
          message: "continuity blocked",
        },
      }),
    ).toThrow("STARTUP_CONTINUITY_UNVERIFIED");
  });
});
