import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runGovernanceAttackHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("governance attack harness", () => {
  it("contains bypass, policy mutation, and audit suppression attempts", () => {
    const results = runGovernanceAttackHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.contained)).toBe(true);
    expect(results[0]?.errorCode).toBe(ENFORCEMENT_HARNESS_ERROR_CODES.GOVERNANCE_BYPASS_ATTEMPT);
    expect(results[1]?.errorCode).toBe(ENFORCEMENT_HARNESS_ERROR_CODES.POLICY_MUTATION_DETECTED);
    expect(results[2]?.errorCode).toBe(ENFORCEMENT_HARNESS_ERROR_CODES.AUDIT_SUPPRESSION_ATTEMPT);
  });
});
