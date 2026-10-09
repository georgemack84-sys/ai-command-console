import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createPluginRuntime } = require("../../services/pluginLoader.js");
const projectReportPlugin = require("../../plugins/projectReportPlugin.js");

function plugin(name: string, capabilities: string[], run: (context: Record<string, unknown>) => unknown) {
  return {
    name,
    description: `${name} test plugin`,
    manifest: {
      name,
      version: "1.0.0",
      hostApiVersion: 1,
      capabilities: capabilities.map((capability) => ({ name: capability, version: 1 })),
    },
    run,
  };
}

describe("plugin isolation boundaries", () => {
  let workspaceRoot: string;
  let outsideRoot: string;

  beforeEach(() => {
    workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-plugin-"));
    outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-plugin-outside-"));
    fs.mkdirSync(path.join(workspaceRoot, "reports"));
    fs.writeFileSync(path.join(workspaceRoot, "README.md"), "workspace");
    fs.writeFileSync(path.join(workspaceRoot, "reports", "summary.txt"), "summary");
    fs.writeFileSync(path.join(outsideRoot, "secret.txt"), "secret");
  });

  afterEach(() => {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  });

  it("loads only registered plugins with valid, supported capability manifests", () => {
    const runtime = createPluginRuntime({
      registry: {
        valid: plugin("valid", [], async () => "ok"),
        mismatched: plugin("different-name", [], async () => "no"),
        excessive: plugin("excessive", ["process.environment"], async () => "no"),
      },
      enabledPluginNames: () => ["valid", "missing", "mismatched", "excessive"],
      workspaceRoot,
    });

    expect(runtime.listPlugins()).toEqual([
      expect.objectContaining({ name: "valid", loaded: true, isolation: "host-capability", capabilities: [] }),
      expect.objectContaining({ name: "missing", loaded: false, error: expect.stringMatching(/not registered/) }),
      expect.objectContaining({ name: "mismatched", loaded: false, error: expect.stringMatching(/registry key/) }),
      expect.objectContaining({ name: "excessive", loaded: false, error: expect.stringMatching(/unsupported capability/) }),
    ]);
  });

  it("provides a frozen least-privilege context without leaking host runtime state", async () => {
    let observedContext: Record<string, unknown> | undefined;
    const runtime = createPluginRuntime({
      registry: {
        minimal: plugin("minimal", [], async (context) => {
          observedContext = context;
          return "done";
        }),
      },
      enabledPluginNames: () => ["minimal"],
      workspaceRoot,
    });

    await expect(runtime.runPlugin("minimal", {
      input: "run plugin minimal",
      pluginArg: "safe",
      modes: { dangerous: true },
      actor: { token: "secret" },
    })).resolves.toBe("done");

    expect(Object.isFrozen(observedContext)).toBe(true);
    expect(observedContext).toEqual({ input: "run plugin minimal", pluginArg: "safe", capabilities: {} });
    expect(Object.isFrozen(observedContext?.capabilities)).toBe(true);
  });

  it("contains workspace metadata reads and rejects traversal outside the configured root", async () => {
    const directoryPlugin = plugin("directory", ["workspace.list"], async (context) => {
      const capabilities = context.capabilities as {
        listWorkspaceDirectory: (requestedPath: string) => { path: string; directories: string[]; files: string[] };
      };
      const report = capabilities.listWorkspaceDirectory(String(context.pluginArg));
      return JSON.stringify(report);
    });
    const runtime = createPluginRuntime({
      registry: { directory: directoryPlugin },
      enabledPluginNames: () => ["directory"],
      workspaceRoot,
    });

    await expect(runtime.runPlugin("directory", { pluginArg: "." })).resolves.toBe(
      JSON.stringify({ path: ".", directories: ["reports"], files: ["README.md"] }),
    );
    await expect(runtime.runPlugin("directory", { pluginArg: "reports" })).resolves.toBe(
      JSON.stringify({ path: "reports", directories: [], files: ["summary.txt"] }),
    );
    await expect(runtime.runPlugin("directory", { pluginArg: ".." })).rejects.toThrow(/inside the configured workspace root/);

    fs.symlinkSync(outsideRoot, path.join(workspaceRoot, "escape"), "junction");
    await expect(runtime.runPlugin("directory", { pluginArg: "escape" })).rejects.toThrow(
      /inside the configured workspace root/,
    );
  });

  it("runs the production project report through its declared workspace capability", async () => {
    const runtime = createPluginRuntime({
      registry: { projectReportPlugin },
      enabledPluginNames: () => ["projectReportPlugin"],
      workspaceRoot,
    });

    const result = await runtime.runPlugin("projectReportPlugin", { pluginArg: "reports" });
    expect(result).toContain("Target: reports\nDirectories: 0\nFiles: 1");
    expect(result).toContain("Files:\n- summary.txt");
  });

  it("bounds execution time and requires small string results", async () => {
    const runtime = createPluginRuntime({
      registry: {
        hanging: plugin("hanging", [], () => new Promise(() => undefined)),
        structured: plugin("structured", [], async () => ({ unsafe: true })),
        oversized: plugin("oversized", [], async () => "12345"),
      },
      enabledPluginNames: () => ["hanging", "structured", "oversized"],
      workspaceRoot,
      timeoutMs: 20,
      maxOutputLength: 4,
    });

    await expect(runtime.runPlugin("hanging")).rejects.toThrow(/timed out after 20ms/);
    await expect(runtime.runPlugin("structured")).rejects.toThrow(/output must be a string/);
    await expect(runtime.runPlugin("oversized")).rejects.toThrow(/exceeds the 4-character limit/);
  });
});
