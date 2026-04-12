import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const loggerPath = require.resolve("../../services/logger.js");
const diagnosticsPath = require.resolve("../../services/operationalDiagnostics.js");
const historyPath = require.resolve("../../services/history.js");
const memoryPath = require.resolve("../../services/memory.js");
const sessionManagerPath = require.resolve("../../services/sessionManager.js");
const documentStorePath = require.resolve("../../services/documentStore.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-runtime-logs-"));
}

function loadModules(tempRoot: string) {
  process.env = {
    ...originalEnv,
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
  };

  for (const modulePath of [
    loggerPath,
    diagnosticsPath,
    historyPath,
    memoryPath,
    sessionManagerPath,
    documentStorePath,
    stateDatabasePath,
    runtimePathsPath,
  ]) {
    delete require.cache[modulePath];
  }

  return {
    runtimePaths: require("../../services/runtimePaths.js") as {
      getRuntimeLogPath: (...segments: string[]) => string;
      getRuntimeMemoryPath: (...segments: string[]) => string;
    },
    logger: require("../../services/logger.js") as {
      logAction: (entry: Record<string, unknown>) => void;
    },
    diagnostics: require("../../services/operationalDiagnostics.js") as {
      recordDiagnosticEvent: (entry: Record<string, unknown>) => void;
      listRecentDiagnostics: (limit?: number) => Array<Record<string, unknown>>;
    },
    memory: require("../../services/memory.js") as {
      saveMemory: (entry: Record<string, unknown>) => void;
      loadMemory: () => Record<string, unknown>;
    },
    sessionManager: require("../../services/sessionManager.js") as {
      createMission: (title: string) => { id: string; title: string };
      getActiveMission: () => { id: string; title: string } | null;
    },
    stateDatabase: require("../../services/stateDatabase.js") as {
      closeDatabase: () => void;
    },
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("runtime log paths", () => {
  it("writes runtime logs, memory, and session state under the runtime data root", () => {
    const tempRoot = makeTempRoot();
    const { runtimePaths, logger, diagnostics, memory, sessionManager, stateDatabase } = loadModules(tempRoot);

    try {
      logger.logAction({ action: "test:action", payload: "alpha" });
      diagnostics.recordDiagnosticEvent({ scope: "test", message: "diagnostic event" });
      memory.saveMemory({ lastCommand: "help" });
      const mission = sessionManager.createMission("Stabilize runtime paths");

      const logsDir = runtimePaths.getRuntimeLogPath();
      const actionLogPath = runtimePaths.getRuntimeLogPath("actions.log");
      const diagnosticsLogPath = runtimePaths.getRuntimeLogPath("diagnostics.log");
      const memoryDirPath = runtimePaths.getRuntimeMemoryPath();
      const stateDatabaseFilePath = path.join(tempRoot, "agents", "console.sqlite");

      expect(logsDir).toBe(path.join(tempRoot, "logs"));
      expect(memoryDirPath).toBe(path.join(tempRoot, "memory"));
      expect(fs.existsSync(actionLogPath)).toBe(true);
      expect(fs.existsSync(diagnosticsLogPath)).toBe(true);
      expect(fs.existsSync(stateDatabaseFilePath)).toBe(true);
      expect(fs.readFileSync(actionLogPath, "utf8")).toContain('"action":"test:action"');
      expect(fs.readFileSync(diagnosticsLogPath, "utf8")).toContain('"message":"diagnostic event"');
      expect(memory.loadMemory()).toEqual(expect.objectContaining({ lastCommand: "help" }));
      expect(sessionManager.getActiveMission()).toEqual(expect.objectContaining({ id: mission.id, title: mission.title }));
      expect(diagnostics.listRecentDiagnostics(1)[0]).toEqual(
        expect.objectContaining({ message: "diagnostic event" }),
      );
    } finally {
      stateDatabase.closeDatabase();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
