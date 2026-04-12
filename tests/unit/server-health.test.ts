import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtimeMocks = vi.hoisted(() => ({
  getRuntimePosture: vi.fn(),
  getRuntimeLogPath: vi.fn(),
  getWorkspaceDataRoot: vi.fn(),
  getAgentsDatabasePath: vi.fn(),
  getWorkspaceDatabasePath: vi.fn(),
  isProductionRuntime: vi.fn(),
}));

const diagnosticsMocks = vi.hoisted(() => ({
  recordDiagnosticEvent: vi.fn(),
}));

const alertsMocks = vi.hoisted(() => ({
  resolveAlertByType: vi.fn(),
  upsertAlert: vi.fn(),
}));

vi.mock("@/src/lib/server/runtime", () => runtimeMocks);
vi.mock("@/services/operationalDiagnostics", () => diagnosticsMocks);
vi.mock("@/services/alerts", () => alertsMocks);

import { buildLivenessReport } from "@/src/lib/server/health";

describe("server health helpers", () => {
  let tempRoot: string;
  let dataRoot: string;
  let logsRoot: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-health-"));
    dataRoot = path.join(tempRoot, "runtime-data");
    logsRoot = path.join(dataRoot, "logs");
    fs.mkdirSync(dataRoot, { recursive: true });
    fs.mkdirSync(logsRoot, { recursive: true });

    runtimeMocks.getRuntimePosture.mockReturnValue({
      environment: "development",
      storageDriver: "sqlite",
    });
    runtimeMocks.getWorkspaceDataRoot.mockReturnValue(dataRoot);
    runtimeMocks.getRuntimeLogPath.mockReturnValue(logsRoot);
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("uses the configured runtime data root for liveness checks", () => {
    const report = buildLivenessReport();

    expect(report.ok).toBe(true);
    expect(report.status).toBe("ok");
    expect(report.checks.dataDir.path).toBe(dataRoot);
    expect(report.checks.logsDir.path).toBe(logsRoot);
    expect(alertsMocks.resolveAlertByType).toHaveBeenCalledWith("runtime_liveness_degraded", "Liveness checks recovered.");
    expect(diagnosticsMocks.recordDiagnosticEvent).not.toHaveBeenCalled();
  });
});
