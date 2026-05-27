import { describe, expect, it } from "vitest";

import { evaluateProductionSafety } from "@/services/startup/productionSafety";

describe("startup production safety", () => {
  it("rejects default admin secret", () => {
    const result = evaluateProductionSafety({
      NODE_ENV: "production",
      SECURITY_MODE: "enforced",
      OBSERVABILITY_MODE: "full",
      CONTINUITY_VERIFICATION_ENABLED: true,
      INTEGRITY_VALIDATION_ENABLED: true,
      RESTORE_SIMULATION_ENABLED: true,
      FAIL_FAST_ENABLED: true,
      DEBUG_MODE: false,
      ADMIN_SECRET: "changeme",
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("ENV_ADMIN_SECRET_UNSAFE");
  });
});
