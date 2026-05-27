import { describe, expect, it } from "vitest";

import { createTenantContext } from "../../services/tenancy/tenantContext.ts";
import { createSecurityContext, createSecurityContextFromSessionUser } from "../../services/security/securityContext.ts";

describe("security context", () => {
  it("builds a permissioned security context from a session user", () => {
    const tenantContext = createTenantContext({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      operatorId: "user-1",
      source: "session",
    });

    const context = createSecurityContextFromSessionUser({
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "operator",
        status: "active",
        workspaceId: "workspace-1",
        workspaceName: "Workspace 1",
      },
      tenantContext,
    });

    expect(context.tenantId).toBe("tenant-1");
    expect(context.workspaceId).toBe("workspace-1");
    expect(context.permissions).toContain("recovery:run");
  });

  it("fails closed when tenant scope is missing", () => {
    expect(() =>
      createSecurityContext({
        actorId: "user-1",
        actorRole: "operator",
        tenantId: "",
        workspaceId: "workspace-1",
        permissions: ["recovery:run"],
        source: "session",
      }),
    ).toThrow("SECURITY_CONTEXT_INVALID");
  });

  it("fails closed when permissions are missing", () => {
    expect(() =>
      createSecurityContext({
        actorId: "user-1",
        actorRole: "operator",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        permissions: [],
        source: "session",
      }),
    ).toThrow("SECURITY_CONTEXT_INVALID");
  });
});
