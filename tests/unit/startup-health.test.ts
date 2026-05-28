import { describe, expect, it } from "vitest";

import { evaluateStartupReadiness } from "@/services/startup/startupReadiness";

describe("startup health", () => {
  it("blocks degraded critical dependencies", () => {
    const result = evaluateStartupReadiness({
      environment: { ok: true },
      dependencies: {
        ok: false,
        components: [{ name: "database", critical: true, status: "unavailable", reason: "db down" }],
      },
      continuity: { ok: true },
      migration: { ok: true },
      productionSafety: { ok: true },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_DB_UNREACHABLE");
  });

  it("allows startup only when all critical gates pass", () => {
    const result = evaluateStartupReadiness({
      environment: { ok: true },
      dependencies: { ok: true, components: [] },
      continuity: { ok: true },
      migration: { ok: true },
      productionSafety: { ok: true },
    });

    expect(result.ok).toBe(true);
  });
});
