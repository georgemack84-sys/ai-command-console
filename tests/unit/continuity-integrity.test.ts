import { describe, expect, it } from "vitest";

import { verifyBackupIntegrity } from "@/services/continuity/backupIntegrity";

const tenantContext = {
  tenantId: "tenant-a",
  workspaceId: "workspace-a",
  source: "test",
  isolationVersion: "3.6G",
} as const;

describe("continuity integrity", () => {
  it("detects a corrupted snapshot hash", async () => {
    const result = await verifyBackupIntegrity({
      tenantContext,
      backup: {
        manifest: {
          snapshotId: "snapshot-1",
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          snapshotHash: "not-real",
          sectionHashes: {},
          recordCounts: {},
          lineage: { executionIds: [], recoveryRequestIds: [] },
          completeness: "complete",
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
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("BACKUP_INTEGRITY_FAILED");
  });

  it("detects orphan execution attempts", async () => {
    const result = await verifyBackupIntegrity({
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
          completeness: "complete",
        },
        snapshot: {
          tenantId: "tenant-a",
          workspaceId: "workspace-a",
          generatedAt: "2026-05-07T00:00:00.000Z",
          executionState: {
            executions: [],
            locks: [],
            attempts: [{ executionId: "exec-1", tenantId: "tenant-a", workspaceId: "workspace-a" }],
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

    expect(result.ok).toBe(false);
    expect(result.error.details?.issues).toContain("orphan_execution_attempts");
  });

  it("detects incomplete snapshots", async () => {
    const result = await verifyBackupIntegrity({
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
    expect(result.error.details?.issues).toContain("snapshot_incomplete");
  });
});
