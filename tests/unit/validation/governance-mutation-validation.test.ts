import { describe, expect, it } from "vitest";

import { validateGovernanceMutation } from "@/services/validation/governanceMutationValidation";

describe("validateGovernanceMutation", () => {
  it("rejects runtime mutation paths and restriction downgrades", () => {
    const result = validateGovernanceMutation({
      runtimeMutationObserved: true,
      postRoutesDetected: true,
      restrictionReduced: true,
      authorityGranted: true,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("runtime_mutation_detected");
    expect(result.blockedReasons).toContain("post_route_detected");
    expect(result.blockedReasons).toContain("restriction_downgrade_detected");
    expect(result.blockedReasons).toContain("autonomous_authority_detected");
  });
});
