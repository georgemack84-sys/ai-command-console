import { describe, expect, it } from "vitest";

import { enforceRecoveryConstitution } from "@/services/constitutional/recoveryEnforcement";

describe("enforceRecoveryConstitution", () => {
  it("preserves deterministic precedence ordering", () => {
    const result = enforceRecoveryConstitution({
      violations: ["lease_authority_violation"],
      requiredAction: "DENY",
      reasons: ["lease_authority_violation"],
      evidence: ["audit_1"],
    });

    expect(result.constitutionalAction).toBe("DENY");
    expect(result.constitutionallyAllowed).toBe(false);
  });
});
