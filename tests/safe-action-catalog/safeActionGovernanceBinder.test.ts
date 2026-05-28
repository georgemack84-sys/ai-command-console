import { describe, expect, it } from "vitest";

import { bindSafeActionGovernance } from "@/services/safe-action-catalog";
import { buildSafeActionFixture } from "./helpers";

describe("safeActionGovernanceBinder", () => {
  it("preserves governance lineage from readiness", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const binding = bindSafeActionGovernance(readinessProfile);
    expect(binding.governanceDecisionHash).toBe(readinessProfile.governanceBinding.governanceDecisionHash);
    expect(binding.policySnapshotHash).toBe(readinessProfile.governanceBinding.policySnapshotHash);
    expect(binding.valid).toBe(true);
  });
});
