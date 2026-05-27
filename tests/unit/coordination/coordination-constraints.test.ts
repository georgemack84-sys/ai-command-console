import { describe, expect, it } from "vitest";

import { validateCoordinationConstraints } from "@/services/coordination/coordinationConstraints";

describe("validateCoordinationConstraints", () => {
  it("preserves approval and enforcement requirements", () => {
    const result = validateCoordinationConstraints({
      enforcementExecutable: false,
      approvalRequired: true,
      approvalVerified: false,
      lineagePresent: false,
      disputedTruthPresent: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("runtime_enforcement_precedence");
    expect(result.blockedReasons).toContain("approval_requirement_preserved");
  });
});
