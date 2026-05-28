import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/continuity/snapshotCoordinator", () => ({
  createBackupSnapshot: vi.fn(),
  getLatestBackupStatus: vi.fn(),
}));

vi.mock("@/services/continuity/backupIntegrity", () => ({
  verifyPersistedBackupIntegrity: vi.fn(),
  getLatestIntegrityReport: vi.fn(),
}));

vi.mock("@/services/continuity/restoreSimulation", () => ({
  restoreSimulationFromLatestSnapshot: vi.fn(),
  getLatestRestoreStatus: vi.fn(),
}));

import { getSessionUser } from "@/src/lib/auth";
import { POST as BackupCreatePOST } from "@/app/api/v1/backup/create/route";
import { GET as BackupStatusGET } from "@/app/api/v1/backup/status/route";
import { POST as BackupValidatePOST } from "@/app/api/v1/backup/validate/route";
import { POST as RestoreDryRunPOST } from "@/app/api/v1/restore/dry-run/route";
import { POST as RestoreExecutePOST } from "@/app/api/v1/restore/execute/route";
import { GET as RestoreStatusGET } from "@/app/api/v1/restore/status/route";
import { POST as IntegrityCheckPOST } from "@/app/api/v1/integrity/check/route";
import { GET as IntegrityReportGET } from "@/app/api/v1/integrity/report/route";
import { createBackupSnapshot, getLatestBackupStatus } from "@/services/continuity/snapshotCoordinator";
import { verifyPersistedBackupIntegrity, getLatestIntegrityReport } from "@/services/continuity/backupIntegrity";
import { restoreSimulationFromLatestSnapshot, getLatestRestoreStatus } from "@/services/continuity/restoreSimulation";

describe("continuity api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      status: "active",
      workspaceId: "workspace_a",
      workspaceName: "Workspace A",
    } as never);

    vi.mocked(createBackupSnapshot).mockResolvedValue({
      ok: true,
      data: {
        manifest: { snapshotId: "snapshot-1", contractVersion: "v1", contractHash: "hash-1" },
      },
    } as never);
    vi.mocked(getLatestBackupStatus).mockReturnValue({
      snapshotId: "snapshot-1",
      status: "ready",
      contractVersion: "v1",
      contractHash: "hash-1",
    } as never);
    vi.mocked(verifyPersistedBackupIntegrity).mockResolvedValue({
      ok: true,
      data: {
        ready: true,
        issues: [],
        contractVersion: "v1",
        contractHash: "hash-1",
      },
    } as never);
    vi.mocked(restoreSimulationFromLatestSnapshot).mockResolvedValue({
      ok: true,
      data: {
        dryRun: true,
        executed: false,
        readiness: "verified",
        contractVersion: "v1",
        contractHash: "hash-1",
      },
    } as never);
    vi.mocked(getLatestRestoreStatus).mockReturnValue({
      status: "verified",
      dryRun: true,
      executed: false,
      contractVersion: "v1",
      contractHash: "hash-1",
    } as never);
    vi.mocked(getLatestIntegrityReport).mockReturnValue({
      ready: true,
      issues: [],
      contractVersion: "v1",
      contractHash: "hash-1",
    } as never);
  });

  it("returns stable backup route responses", async () => {
    const createResponse = await BackupCreatePOST(new Request("http://localhost/api/v1/backup/create", { method: "POST", body: "{}" }));
    const statusResponse = await BackupStatusGET(new Request("http://localhost/api/v1/backup/status"));
    const validateResponse = await BackupValidatePOST(new Request("http://localhost/api/v1/backup/validate", { method: "POST", body: "{}" }));

    expect((await createResponse.json()).ok).toBe(true);
    expect((await statusResponse.json()).ok).toBe(true);
    expect((await validateResponse.json()).ok).toBe(true);
  });

  it("keeps restore execute governed and non-mutating by default", async () => {
    const response = await RestoreExecutePOST(new Request("http://localhost/api/v1/restore/execute", { method: "POST", body: "{}" }));
    const payload = await response.json();

    expect(payload.ok).toBe(true);
    expect(payload.data.executed).toBe(false);
  });

  it("returns stable restore and integrity responses", async () => {
    const dryRunResponse = await RestoreDryRunPOST(new Request("http://localhost/api/v1/restore/dry-run", { method: "POST", body: "{}" }));
    const statusResponse = await RestoreStatusGET(new Request("http://localhost/api/v1/restore/status"));
    const integrityCheckResponse = await IntegrityCheckPOST(new Request("http://localhost/api/v1/integrity/check", { method: "POST", body: "{}" }));
    const integrityReportResponse = await IntegrityReportGET(new Request("http://localhost/api/v1/integrity/report"));

    expect((await dryRunResponse.json()).ok).toBe(true);
    expect((await statusResponse.json()).ok).toBe(true);
    expect((await integrityCheckResponse.json()).ok).toBe(true);
    expect((await integrityReportResponse.json()).ok).toBe(true);
  });
});
