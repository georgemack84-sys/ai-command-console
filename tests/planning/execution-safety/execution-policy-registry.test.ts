import { describe, expect, it } from "vitest";

import { createStaticExecutionPolicyRegistry, resolvePolicyLocks } from "@/services/planning/execution-safety";

describe("execution policy registry", () => {
  it("requires policy locks", () => {
    expect(createStaticExecutionPolicyRegistry().length).toBeGreaterThan(0);
    expect(resolvePolicyLocks().every((policy) => Boolean(policy.policyHash))).toBe(true);
  });
});
