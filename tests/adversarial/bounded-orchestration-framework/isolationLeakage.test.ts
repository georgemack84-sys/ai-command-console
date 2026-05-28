import { describe, expect, it } from "vitest";

import { validateOrchestrationIsolation } from "@/services/bounded-orchestration-framework";

describe("orchestration isolation leakage", () => {
  it("rejects missing isolation scopes", () => {
    const errors = validateOrchestrationIsolation({
      missionScopeId: "m",
      governanceScopeId: "",
      replayScopeId: "",
      approvalScopeId: "",
      escalationScopeId: undefined,
      containmentScopeId: "",
      coordinationScopeId: "",
      isolated: false,
      isolationHash: "h",
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
