import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runIdentityAttackHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("identity attack harness", () => {
  it("denies duplicate IDs, alias conflicts, and version drift", () => {
    const results = runIdentityAttackHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.contained)).toBe(true);
    expect(results.map((result) => result.errorCode)).toEqual([
      ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_IDENTITY_SPOOF_DETECTED,
      ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_ALIAS_COLLISION,
      ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_VERSION_DRIFT,
    ]);
    expect(results.every((result) => result.deterministic)).toBe(true);
  });
});
