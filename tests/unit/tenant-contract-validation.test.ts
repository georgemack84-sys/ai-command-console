import { z } from "zod";
import { describe, expect, it } from "vitest";

import { validateContractPayload } from "../../services/contracts/validateContract.ts";
import { validateReplayPayload } from "../../services/contracts/replayValidator.ts";
import { createTenantContext } from "../../services/tenancy/tenantContext.ts";

describe("tenant contract validation", () => {
  it("rejects tenantless runtime validation when tenant scope is required", () => {
    const result = validateContractPayload({
      schema: z.object({ executionId: z.string() }).strict(),
      payload: { executionId: "exec-1" },
      tenantScope: {
        required: true,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_CONTRACT_SCOPE_MISMATCH");
    }
  });

  it("detects foreign tenant leakage in outbound validation", () => {
    const result = validateContractPayload({
      schema: z.object({ tenantId: z.string(), executionId: z.string() }).strict(),
      payload: { tenantId: "tenant-2", executionId: "exec-1" },
      tenantScope: {
        required: true,
        tenantContext: createTenantContext({
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          source: "test",
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_CONTRACT_SCOPE_MISMATCH");
    }
  });

  it("blocks cross-tenant replay", () => {
    const result = validateReplayPayload({
      contractId: "api.v1.test",
      version: "1.0.0",
      schema: z.object({ tenantId: z.string(), executionId: z.string() }).strict(),
      payload: { tenantId: "tenant-2", executionId: "exec-1" },
      tenantScope: {
        required: true,
        tenantContext: createTenantContext({
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          source: "test",
        }),
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_CONTRACT_SCOPE_MISMATCH");
    }
  });
});
