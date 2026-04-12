import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";

const UNIT_TEST_RUNTIME_ROOT =
  process.env.AI_COMMAND_CONSOLE_DATA_ROOT ||
  path.join(
    process.cwd(),
    ".codex-temp",
    `unit-test-runtime-${process.env.VITEST_POOL_ID || process.pid}`,
  );

process.env.AI_COMMAND_CONSOLE_DATA_ROOT = UNIT_TEST_RUNTIME_ROOT;
delete process.env.AI_COMMAND_CONSOLE_DATABASE_PATH;
delete process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH;
process.env.AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS =
  process.env.AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS || "false";

fs.mkdirSync(path.join(UNIT_TEST_RUNTIME_ROOT, "agents"), { recursive: true });
