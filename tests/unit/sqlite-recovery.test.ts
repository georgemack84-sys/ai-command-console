import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

type StateDatabaseModule = {
  loadDocument: (key: string, createDefault: () => unknown, options?: { legacyPath?: string }) => unknown;
  saveDocument: (key: string, value: unknown, options?: { legacyPath?: string }) => unknown;
  closeDatabase: () => void;
};

type JobQueueStoreModule = {
  openJobStore: () => unknown;
  listJobs: (limit?: number) => Array<unknown>;
  closeJobStore: () => void;
};

const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const jobQueueStorePath = require.resolve("../../services/jobQueueStore.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function loadStateDatabase(tempRoot: string): StateDatabaseModule {
  process.env = {
    ...originalEnv,
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
  };
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];
  return require("../../services/stateDatabase.js");
}

function loadJobQueueStore(tempRoot: string): JobQueueStoreModule {
  process.env = {
    ...originalEnv,
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
  };
  delete require.cache[jobQueueStorePath];
  delete require.cache[stateDatabasePath];
  delete require.cache[runtimePathsPath];
  return require("../../services/jobQueueStore.js");
}

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-"));
}

function cleanupTempRoot(tempRoot: string) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("sqlite recovery", () => {
  it("recovers state documents when the sqlite file contains invalid non-database content", () => {
    const tempRoot = makeTempRoot();
    const agentsDir = path.join(tempRoot, "agents");
    const dbPath = path.join(agentsDir, "console.sqlite");
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(dbPath, "this is not sqlite", "utf8");

    const stateDatabase = loadStateDatabase(tempRoot);

    try {
      const document = stateDatabase.loadDocument("watcher", () => ({ enabled: false }));
      expect(document).toEqual({
        enabled: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      const dbBytes = fs.readFileSync(dbPath);
      expect(dbBytes.subarray(0, 16).toString("utf8")).toBe("SQLite format 3\u0000");
    } finally {
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });

  it("recovers the job store when the shared sqlite file contains invalid non-database content", () => {
    const tempRoot = makeTempRoot();
    const agentsDir = path.join(tempRoot, "agents");
    const dbPath = path.join(agentsDir, "console.sqlite");
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.writeFileSync(dbPath, "totally invalid sqlite baseline", "utf8");

    const jobQueueStore = loadJobQueueStore(tempRoot);

    try {
      const database = jobQueueStore.openJobStore();
      expect(database).toBeTruthy();
      expect(jobQueueStore.listJobs()).toEqual([]);

      const dbBytes = fs.readFileSync(dbPath);
      expect(dbBytes.subarray(0, 16).toString("utf8")).toBe("SQLite format 3\u0000");
    } finally {
      jobQueueStore.closeJobStore();
      cleanupTempRoot(tempRoot);
    }
  });

  it("creates the job store directory when the configured sqlite parent path does not exist", () => {
    const tempRoot = makeTempRoot();
    const dbPath = path.join(tempRoot, "nested", "agents", "console.sqlite");

    process.env = {
      ...originalEnv,
      AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
      AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH: dbPath,
    };

    delete require.cache[jobQueueStorePath];
    delete require.cache[stateDatabasePath];
    delete require.cache[runtimePathsPath];

    const jobQueueStore = require("../../services/jobQueueStore.js") as JobQueueStoreModule;
    const stateDatabase = require("../../services/stateDatabase.js") as StateDatabaseModule;

    try {
      const database = jobQueueStore.openJobStore();
      expect(database).toBeTruthy();
      expect(fs.existsSync(path.dirname(dbPath))).toBe(true);
      expect(fs.existsSync(dbPath)).toBe(true);
    } finally {
      jobQueueStore.closeJobStore();
      stateDatabase.closeDatabase();
      cleanupTempRoot(tempRoot);
    }
  });
});
