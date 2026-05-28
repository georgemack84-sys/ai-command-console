import { describe, expect, it } from "vitest";

import { isAllowedIntakeSource, resolveIntakeFailure, shouldRequireIsolationReview } from "@/services/intake/intakePolicies";

describe("intakePolicies", () => {
  it("allows only known sources", () => {
    expect(isAllowedIntakeSource("user")).toBe(true);
    expect(isAllowedIntakeSource("admin")).toBe(false);
  });

  it("fails closed for shell/script/binary safety flags", () => {
    const failure = resolveIntakeFailure({
      sourceValid: true,
      inspection: {
        containsShellContent: true,
        containsScriptContent: false,
        containsBinaryData: false,
        containsRecursivePayload: false,
        exceedsLimits: false,
        malformedEncoding: false,
      },
    });

    expect(failure).toBe("SAFETY_REJECTION");
    expect(shouldRequireIsolationReview({
      containsShellContent: true,
      containsScriptContent: false,
      containsBinaryData: false,
      containsRecursivePayload: false,
      exceedsLimits: false,
      malformedEncoding: false,
    })).toBe(true);
  });
});
