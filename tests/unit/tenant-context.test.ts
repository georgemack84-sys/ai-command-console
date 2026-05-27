import { describe, expect, it } from "vitest";

import { createTenantContext } from "../../services/tenancy/tenantContext.ts";
import { TENANT_ERROR_CODES } from "../../services/tenancy/tenantErrors.ts";
import { resolveTenantContextFromSessionUser } from "../../services/tenancy/tenantContextResolver.ts";

describe("tenant context", () => {
  it("accepts a valid tenant context", () => {
    const result = createTenantContext({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      operatorId: "user-1",
      source: "test",
    });

    expect(result).toEqual({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      operatorId: "user-1",
      source: "test",
      isolationVersion: "3.6G",
    });
  });

  it("rejects missing tenantId", () => {
    expect(() =>
      createTenantContext({
        tenantId: "",
        workspaceId: "workspace-1",
        source: "test",
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_ID_MISSING);
  });

  it("rejects missing workspaceId when workspace scope is required", () => {
    expect(() =>
      createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "",
        source: "test",
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_WORKSPACE_MISSING);
  });

  it("resolves tenant context from a session user", () => {
    const context = resolveTenantContextFromSessionUser({
      user: {
        id: "user-1",
        workspaceId: "workspace-1",
        workspaceName: "Workspace 1",
      } as any,
      request: new Request("http://localhost/api/v1/mission/state"),
    });

    expect(context.tenantId).toBe("workspace-1");
    expect(context.workspaceId).toBe("workspace-1");
    expect(context.operatorId).toBe("user-1");
  });

  it("rejects spoofed tenant headers", () => {
    expect(() =>
      resolveTenantContextFromSessionUser({
        user: {
          id: "user-1",
          workspaceId: "workspace-1",
          workspaceName: "Workspace 1",
        } as any,
        request: new Request("http://localhost/api/v1/mission/state", {
          headers: {
            "x-tenant-id": "tenant-2",
          },
        }),
      }),
    ).toThrow(TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH);
  });
});
