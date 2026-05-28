import { describe, expect, it } from "vitest";

import { validateGovernanceIntegrity } from "../../services/recoveryVerification/governanceIntegrityValidator";

describe("governance integrity validator", () => {
  it("fails when approval is required but audit proof is missing", () => {
    const result = validateGovernanceIntegrity({
      bundle: {
        readModel: {
          recoveryControl: {
            requiresApproval: true,
            latestRequestId: "request-1",
            status: "approved",
          },
        },
      },
      auditEvents: [],
    });

    expect(result.valid).toBe(false);
    expect(result.evidence).toContain("approval:audit_missing");
  });
});
