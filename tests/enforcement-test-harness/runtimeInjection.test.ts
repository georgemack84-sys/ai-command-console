import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runRuntimeInjectionHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("runtime injection harness", () => {
  it("contains runtime injection, plugin spoofing, and dynamic execution", () => {
    const results = runRuntimeInjectionHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.contained)).toBe(true);
    expect(results.map((result) => result.errorCode)).toEqual([
      ENFORCEMENT_HARNESS_ERROR_CODES.RUNTIME_INJECTION_DETECTED,
      ENFORCEMENT_HARNESS_ERROR_CODES.PLUGIN_IMPERSONATION_DETECTED,
      ENFORCEMENT_HARNESS_ERROR_CODES.UNAUTHORIZED_DYNAMIC_EXECUTION,
    ]);
  });
});
