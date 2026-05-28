import { describe, expect, it } from "vitest";

import { restoreSimulation } from "@/services/continuity/restoreSimulation";

const tenantContext = {
  tenantId: "tenant-a",
  workspaceId: "workspace-a",
  source: "test",
  isolationVersion: "3.6G",
} as const;

describe("continuity restore simulation", () => {
  it("stays dry-run and mutates nothing", async () => {
    const result = await restoreSimulation({
      tenantContext,
      backup: {
        manifest: {
          snapshotId: "snapshot-1",
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          snapshotHash: "",
          sectionHashes: {},
          recordCounts: {},
          lineage: { executionIds: ["exec-1"], recoveryRequestIds: [] },
          completeness: "complete",
        },
        snapshot: {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          executionState: {
            executions: [{ id: "exec-1", tenantId: "tenant-a", workspaceId: "workspace-a" }],
            locks: [],
            attempts: [],
            recoveryQueue: [],
            ledger: [],
            auditEvents: [],
          },
          recovery: { requests: [], verificationEvents: [], executionEvents: [] },
          sam: { idempotency: [], auditEvents: [] },
        },
      },
      skipHashValidation: true,
    });

    expect(result.ok).toBe(true);
    expect(result.data.dryRun).toBe(true);
    expect(result.data.executed).toBe(false);
  });

  it("blocks cross-tenant restore simulation", async () => {
    const result = await restoreSimulation({
      tenantContext,
      backup: {
        manifest: {
          snapshotId: "snapshot-1",
          tenantId: "tenant-b",
          workspaceId: "workspace-b",
          generatedAt: "2026-05-07T00:00:00.000Z",
          snapshotHash: "",
          sectionHashes: {},
          recordCounts: {},
          lineage: { executionIds: [], recoveryRequestIds: [] },
          completeness: "complete",
        },
        snapshot: {
          tenantId: "tenant-b",
          workspaceId: "workspace-b",
          generatedAt: "2026-05-07T00:00:00.000Z",
          executionState: { executions: [], locks: [], attempts: [], recoveryQueue: [], ledger: [], auditEvents: [] },
          recovery: { requests: [], verificationEvents: [], executionEvents: [] },
          sam: { idempotency: [], auditEvents: [] },
        },
      },
      skipHashValidation: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("TENANT_SCOPE_MISMATCH");
  });

  it("blocks corrupted restore simulations", async () => {
    const result = await restoreSimulation({
      tenantContext,
      backup: {
        manifest: {
          snapshotId: "snapshot-1",
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          snapshotHash: "",
          sectionHashes: {},
          recordCounts: {},
          lineage: { executionIds: [], recoveryRequestIds: [] },
          completeness: "partial",
        },
        snapshot: {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          executionState: { executions: [], locks: [], attempts: [], recoveryQueue: [], ledger: [], auditEvents: [] },
          recovery: { requests: [], verificationEvents: [], executionEvents: [] },
          sam: { idempotency: [], auditEvents: [] },
        },
      },
      skipHashValidation: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("RESTORE_SIMULATION_FAILED");
  });
});
