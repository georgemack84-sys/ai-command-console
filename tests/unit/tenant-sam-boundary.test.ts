import { beforeEach, describe, expect, it } from "vitest";

import { clearSamIdempotencyStore, getSamIdempotencyByAttemptId, getSamIdempotencyByKey, storeSamIdempotencyResult } from "../../services/sam/samIdempotencyStore.ts";
import { createSamIdempotencyKey } from "../../services/sam/samIdempotencyKey.ts";
import { ensureIdempotentExecution } from "../../services/sam/samEnsureIdempotentExecution.ts";
import { createTenantContext } from "../../services/tenancy/tenantContext.ts";

function createProposal(tenantId = "tenant-1") {
  return {
    proposalId: "proposal-1",
    executionId: "exec-1",
    attemptId: "attempt-1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "test",
    riskLevel: "high",
    confidence: 0.9,
    params: {},
    createdAt: "2026-05-07T00:00:00.000Z",
    tenantContext: createTenantContext({
      tenantId,
      workspaceId: tenantId,
      source: "test",
    }),
  };
}

describe("tenant sam boundary", () => {
  beforeEach(() => {
    clearSamIdempotencyStore();
  });

  it("creates tenant-scoped idempotency keys without cross-tenant collision", () => {
    const first = createSamIdempotencyKey({ proposal: createProposal("tenant-1") as any });
    const second = createSamIdempotencyKey({ proposal: createProposal("tenant-2") as any });

    expect(first.ok && second.ok && first.data.idempotencyKey).not.toBe(second.ok && second.data.idempotencyKey);
  });

  it("stores and reads idempotency state by tenant", () => {
    storeSamIdempotencyResult({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      executionId: "exec-1",
      attemptId: "attempt-1",
      idempotencyKey: "key-1",
      actionType: "recover_execution",
      proposalHash: "hash-1",
      status: "completed",
      replayable: true,
    } as any);

    expect(getSamIdempotencyByKey("key-1", { tenantId: "tenant-1" } as any)?.tenantId).toBe("tenant-1");
    expect(getSamIdempotencyByKey("key-1", { tenantId: "tenant-2" } as any)).toBeUndefined();
    expect(getSamIdempotencyByAttemptId("attempt-1", { tenantId: "tenant-2" } as any)).toBeUndefined();
  });

  it("blocks cross-tenant retry-state reuse", () => {
    const decision = ensureIdempotentExecution({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      executionId: "exec-1",
      attemptId: "attempt-1",
      idempotencyKey: "key-1",
      actionType: "recover_execution",
      proposalHash: "hash-1",
    } as any);
    expect(decision.status).toBe("new_attempt");

    const crossTenantDecision = ensureIdempotentExecution({
      tenantId: "tenant-2",
      workspaceId: "workspace-2",
      executionId: "exec-1",
      attemptId: "attempt-1",
      idempotencyKey: "key-1",
      actionType: "recover_execution",
      proposalHash: "hash-1",
    } as any);

    expect(crossTenantDecision.status).toBe("new_attempt");
  });
});
