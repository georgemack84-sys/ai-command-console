import { describe, expect, it } from "vitest";

import { validateConstitutionalResilience } from "@/services/resilience/constitutionalValidation";

describe("validateConstitutionalResilience", () => {
  it("fails constitutional validation when governance and replay are not trustworthy", () => {
    const result = validateConstitutionalResilience({
      stewardship: { governanceBlocked: true },
      replayVerificationState: "UNVERIFIABLE",
      continuityConvergence: { state: "FAILED" },
      escalationCoordination: { blocked: true },
    } as never);

    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(2);
  });
});
