import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runFreezeBypassHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("freeze bypass harness", () => {
  it("contains direct and partial freeze bypass attempts", () => {
    const results = runFreezeBypassHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.contained)).toBe(true);
    expect(results.every((result) => result.errorCode === ENFORCEMENT_HARNESS_ERROR_CODES.FREEZE_BYPASS_ATTEMPT)).toBe(true);
  });
});
