import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runRecoveryAttackHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("recovery attack harness", () => {
  it("denies recovery stage skipping, forged manifests, and trust rehydration spoofing", () => {
    const results = runRecoveryAttackHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.denied)).toBe(true);
    expect(results.map((result) => result.errorCode)).toEqual([
      ENFORCEMENT_HARNESS_ERROR_CODES.RECOVERY_ESCALATION_ATTEMPT,
      ENFORCEMENT_HARNESS_ERROR_CODES.FORGED_RECOVERY_MANIFEST,
      ENFORCEMENT_HARNESS_ERROR_CODES.TRUST_REHYDRATION_SPOOF,
    ]);
  });
});
