import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEvents, listAuditEvents } from "../../services/auditTrail.js";
import { appendSecurityAuditEvent } from "../../services/security/securityAudit.ts";

describe("security audit", () => {
  beforeEach(() => {
    clearAuditEvents();
  });

  it("preserves tenant ownership, permission context, and denial reason", () => {
    const event = appendSecurityAuditEvent({
      type: "auth.denied",
      actorId: "user-1",
      actorRole: "viewer",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      requiredPermission: "recovery:run",
      action: "recovery.preview",
      decision: "denied",
      reason: "SECURITY_PERMISSION_DENIED",
      resource: { executionId: "exec-1" },
    });

    expect(event.type).toBe("auth.denied");

    const [persisted] = listAuditEvents(10);
    expect(persisted.tenantId).toBe("tenant-1");
    expect(persisted.workspaceId).toBe("workspace-1");
    expect(persisted.requiredPermission).toBe("recovery:run");
    expect(persisted.reason).toBe("SECURITY_PERMISSION_DENIED");
  });
});
