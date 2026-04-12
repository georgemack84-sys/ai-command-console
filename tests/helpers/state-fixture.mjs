import fs from "fs";
import path from "path";
import { createRequire } from "module";

export const TEST_RUNTIME_ROOT =
  process.env.AI_COMMAND_CONSOLE_DATA_ROOT || path.join(process.cwd(), ".codex-temp", "legacy-test-runtime");

process.env.AI_COMMAND_CONSOLE_DATA_ROOT = TEST_RUNTIME_ROOT;

const require = createRequire(import.meta.url);
const { closeDatabase } = require("../../services/stateDatabase");
const { closeJobStore } = require("../../services/jobQueueStore");
const { getAgentsDataPath } = require("../../services/runtimePaths");

export const DATA_DIR = getAgentsDataPath();

function snapshotBinaryFile(fullPath) {
  if (!fs.existsSync(fullPath)) {
    return { kind: "missing" };
  }

  const content = fs.readFileSync(fullPath);
  const sqliteHeader = Buffer.from("SQLite format 3\u0000", "utf8");
  if (content.length < sqliteHeader.length || !content.subarray(0, sqliteHeader.length).equals(sqliteHeader)) {
    return { kind: "missing" };
  }

  return { kind: "binary", content };
}

export function snapshotFiles(files) {
  const snapshot = {};

  for (const file of files) {
    const fullPath = path.join(DATA_DIR, file);
    if (path.extname(fullPath) === ".sqlite") {
      snapshot[file] = snapshotBinaryFile(fullPath);
      continue;
    }

    if (!fs.existsSync(fullPath)) {
      snapshot[file] = { kind: "missing" };
      continue;
    }

    snapshot[file] = { kind: "text", content: fs.readFileSync(fullPath, "utf8") };
  }

  return snapshot;
}

export function restoreFiles(snapshot) {
  closeJobStore();
  closeDatabase();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of Object.keys(snapshot)) {
    if (file.endsWith(".sqlite")) {
      for (const suffix of ["-wal", "-shm"]) {
        const sidecarPath = path.join(DATA_DIR, `${file}${suffix}`);
        try {
          if (fs.existsSync(sidecarPath)) {
            fs.unlinkSync(sidecarPath);
          }
        } catch {}
      }
    }
  }
  for (const [file, entry] of Object.entries(snapshot)) {
    const fullPath = path.join(DATA_DIR, file);
    if (!entry || entry.kind === "missing") {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      continue;
    }

    if (entry.kind === "binary") {
      fs.writeFileSync(fullPath, entry.content);
      continue;
    }

    fs.writeFileSync(fullPath, entry.content, "utf8");
  }
}
