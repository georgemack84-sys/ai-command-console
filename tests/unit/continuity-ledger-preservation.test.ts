import { describe, expect, it } from "vitest";

import { verifyBackupIntegrity } from "@/services/continuity/backupIntegrity";

describe("continuity ledger preservation", () => {
  it("preserves append-only ledger ordering", async () => {
    const result = await verifyBackupIntegrity({
      tenantContext: {
        tenantId: "tenant-a",
        workspaceId: "workspace-a",
        source: "test",
        isolationVersion: "3.6G",
      },
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
            ledger: [
              { id: 1, executionId: "exec-1", createdAt: 1, tenantId: "tenant-a", workspaceId: "workspace-a" },
              { id: 2, executionId: "exec-1", createdAt: 2, tenantId: "tenant-a", workspaceId: "workspace-a" },
            ],
            auditEvents: [],
          },
          recovery: { requests: [], verificationEvents: [], executionEvents: [] },
          sam: { idempotency: [], auditEvents: [] },
        },
      },
      skipHashValidation: true,
    });

    expect(result.ok).toBe(true);
    expect(result.data.continuity.ledgerOrdered).toBe(true);
  });
});
