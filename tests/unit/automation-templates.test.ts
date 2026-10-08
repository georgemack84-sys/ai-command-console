import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };
const templatesPath = require.resolve("../../services/automationTemplates.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

describe("automation templates", () => {
  let tempRoot: string;
  let templates: any;
  let stateDatabase: any;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-automation-templates-"));
    process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
    delete require.cache[templatesPath];
    delete require.cache[stateDatabasePath];
    delete require.cache[runtimePathsPath];
    templates = require("../../services/automationTemplates.js");
    stateDatabase = require("../../services/stateDatabase.js");
  });

  afterEach(() => {
    stateDatabase.closeDatabase();
    delete require.cache[templatesPath];
    delete require.cache[stateDatabasePath];
    delete require.cache[runtimePathsPath];
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("ships an immutable operational readiness preset", () => {
    const preset = templates.getAutomationTemplate("preset_operational_readiness");

    expect(preset).toEqual(
      expect.objectContaining({
        builtIn: true,
        name: "Operational readiness sweep",
        steps: [
          expect.objectContaining({ action: "watcher:preview" }),
          expect.objectContaining({ action: "alert:run-checks" }),
        ],
      }),
    );
    expect(() => templates.deleteAutomationTemplate(preset.id)).toThrow("Built-in automation templates cannot be deleted");
  });

  it("preflights allowlisted steps and reports confirmation requirements", () => {
    const result = templates.preflightAutomationTemplate({
      name: "Readiness check",
      steps: [
        { action: "watcher:preview", payload: {} },
        { action: "watcher:start", payload: { intervalSeconds: 9 } },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        status: "ready_for_confirmation",
        requiresConfirmation: true,
        summary: {
          stepCount: 2,
          readOnlySteps: 1,
          controlledWriteSteps: 1,
          blockedSteps: 0,
        },
      }),
    );
    expect(result.template.steps[1].payload).toEqual({ intervalSeconds: 9 });
  });

  it("fails closed for unsupported and duplicate actions", () => {
    const result = templates.preflightAutomationTemplate({
      name: "Unsafe template",
      steps: [
        { action: "shell:run", payload: { command: "whoami" } },
        { action: "watcher:preview", payload: {} },
        { action: "watcher:preview", payload: {} },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.summary.blockedSteps).toBe(1);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("unsupported action shell:run"),
        expect.stringContaining("watcher:preview may only appear once"),
      ]),
    );
  });

  it("persists reusable custom templates and removes them", () => {
    const saved = templates.saveAutomationTemplate({
      name: "Alert refresh",
      description: "Refresh alert state after a watcher preview.",
      steps: [
        { action: "watcher:preview", payload: {} },
        { action: "alert:run-checks", payload: {} },
      ],
    });

    expect(templates.getAutomationTemplate(saved.id)).toEqual(expect.objectContaining({ name: "Alert refresh", builtIn: false }));
    expect(templates.deleteAutomationTemplate(saved.id)).toBe(true);
    expect(templates.getAutomationTemplate(saved.id)).toBeNull();
  });
});
