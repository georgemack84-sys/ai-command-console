import { describe, expect, it } from "vitest";

import { getPermissionsForRole, hasPermission, isKnownPermission } from "../../services/security/rbacPolicy.ts";

describe("rbac policy", () => {
  it("maps operator role to governed runtime permissions", () => {
    const permissions = getPermissionsForRole("operator");

    expect(permissions).toContain("execution:read");
    expect(permissions).toContain("recovery:run");
    expect(permissions).not.toContain("system:admin");
  });

  it("does not grant system admin by default", () => {
    expect(hasPermission(getPermissionsForRole("admin"), "system:admin")).toBe(false);
  });

  it("rejects unknown permissions deterministically", () => {
    expect(isKnownPermission("recovery:run")).toBe(true);
    expect(isKnownPermission("made:up")).toBe(false);
  });
});
