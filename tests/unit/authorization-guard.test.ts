import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEvents, listAuditEvents } from "../../services/auditTrail.js";
import { authorizeSecurityAction } from "../../services/security/authorizationGuard.ts";
import { createSecurityContext } from "../../services/security/securityContext.ts";

function createContext(role: "viewer" | "operator" | "approver" | "admin", permissions: string[]) {
  return createSecurityContext({
    actorId: "user-1",
    actorRole: role,
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    permissions: permissions as any,
    source: "session",
  });
}

describe("authorization guard", () => {
  beforeEach(() => {
    clearAuditEvents();
  });

  it("blocks unauthorized execution mutation", async () => {
    const result = await authorizeSecurityAction({
      securityContext: createContext("viewer", ["execution:read"]),
      permission: "execution:mutate",
      action: "execution.cancel",
      resource: { executionId: "exec-1" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SECURITY_PERMISSION_DENIED");
    }
  });

  it("requires recovery:run for recovery previews", async () => {
    const denied = await authorizeSecurityAction({
      securityContext: createContext("viewer", ["recovery:read"]),
      permission: "recovery:run",
      action: "recovery.preview",
      resource: { executionId: "exec-1" },
    });
    expect(denied.ok).toBe(false);

    const allowed = await authorizeSecurityAction({
      securityContext: createContext("operator", ["recovery:read", "recovery:run"]),
      permission: "recovery:run",
      action: "recovery.preview",
      resource: { executionId: "exec-1" },
    });
    expect(allowed.ok).toBe(true);
  });

  it("requires evidence:export for exports and system:admin for admin actions", async () => {
    const exportDenied = await authorizeSecurityAction({
      securityContext: createContext("operator", ["recovery:run"]),
      permission: "evidence:export",
      action: "evidence.export",
      resource: { executionId: "exec-1" },
    });
    expect(exportDenied.ok).toBe(false);

    const adminDenied = await authorizeSecurityAction({
      securityContext: createContext("admin", ["tenant:admin", "backup:run", "backup:restore"]),
      permission: "system:admin",
      action: "admin.restore",
      resource: { executionId: "exec-1" },
    });
    expect(adminDenied.ok).toBe(false);
  });

  it("writes denial audit evidence with tenant ownership", async () => {
    await authorizeSecurityAction({
      securityContext: createContext("viewer", ["execution:read"]),
      permission: "execution:mutate",
      action: "execution.cancel",
      resource: { executionId: "exec-1" },
    });

    const [event] = listAuditEvents(10);
    expect(event.type).toBe("permission.denied");
    expect(event.tenantId).toBe("tenant-1");
    expect(event.workspaceId).toBe("workspace-1");
    expect(event.requiredPermission).toBe("execution:mutate");
  });

  it("fails closed when the security context is invalid", async () => {
    const result = await authorizeSecurityAction({
      securityContext: {
        actorId: "user-1",
        actorRole: "viewer",
        tenantId: "",
        workspaceId: "workspace-1",
        permissions: ["execution:read"],
        source: "session",
      } as any,
      permission: "execution:read",
      action: "execution.status",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SECURITY_CONTEXT_INVALID");
    }

    const [event] = listAuditEvents(10);
    expect(event.type).toBe("auth.denied");
  });
});
