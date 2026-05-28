import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedStore = vi.hoisted(() => ({
  getExecution: vi.fn(),
  getLock: vi.fn(),
  getLedgerEvents: vi.fn(),
  getRecoveryAttempts: vi.fn(),
  getRecoveryControlRequests: vi.fn(),
  getRecoveryAdvisories: vi.fn(),
  getAutomationState: vi.fn(),
  getAutonomyState: vi.fn(),
  getVerificationResults: vi.fn(),
  getLearningReports: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModelStore.ts", () => mockedStore);

import { buildRecoveryReadModel } from "../../services/recovery/recoveryReadModel.ts";
import { createTenantContext } from "../../services/tenancy/tenantContext.ts";
import { registerTenantOwnedExecution, resetTenantResourceScope } from "../../services/tenancy/tenantResourceScope.ts";

function createExecution() {
  return {
    execution: {
      id: "exec-1",
      planId: "plan-1",
      status: "running",
      startedAt: "2026-05-03T00:00:00.000Z",
      finishedAt: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      lastUpdatedAt: "2026-05-03T00:10:00.000Z",
    },
  };
}

describe("tenant recovery isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTenantResourceScope();
    mockedStore.getExecution.mockReturnValue(createExecution());
    mockedStore.getLock.mockReturnValue(null);
    mockedStore.getLedgerEvents.mockReturnValue([{ id: 1, eventType: "execution.started", createdAt: 1700000000000 }]);
    mockedStore.getRecoveryAttempts.mockReturnValue([]);
    mockedStore.getRecoveryControlRequests.mockReturnValue([]);
    mockedStore.getRecoveryAdvisories.mockReturnValue([]);
    mockedStore.getAutomationState.mockReturnValue([]);
    mockedStore.getAutonomyState.mockReturnValue([]);
    mockedStore.getVerificationResults.mockReturnValue([]);
    mockedStore.getLearningReports.mockReturnValue([]);
  });

  it("requires tenant scope for registered executions", async () => {
    registerTenantOwnedExecution({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      executionId: "exec-1",
    });

    const result = await buildRecoveryReadModel({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-2",
        workspaceId: "workspace-2",
        source: "test",
      }),
    } as any);

    expect(result.ok).toBe(false);
  });

  it("allows tenant-scoped recovery reads for the owner tenant", async () => {
    registerTenantOwnedExecution({
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      executionId: "exec-1",
    });

    const result = await buildRecoveryReadModel({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
    } as any);

    expect(result.ok).toBe(true);
  });
});
