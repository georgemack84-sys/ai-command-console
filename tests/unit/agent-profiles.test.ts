import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };

const agentProfilesPath = require.resolve("../../services/agentProfiles.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-agent-profiles-"));
}

function loadAgentProfiles(tempRoot: string) {
  process.env = {
    ...originalEnv,
    AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot,
  };
  delete require.cache[agentProfilesPath];
  delete require.cache[runtimePathsPath];
  return require("../../services/agentProfiles.js") as {
    getProfilePath: (agentName: string) => string;
    readAgentProfile: (agentName: string) => Record<string, unknown>;
    updateAgentProfile: (agentName: string, updates?: Record<string, unknown>) => Record<string, unknown>;
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("agent profiles", () => {
  it("writes runtime overrides without mutating tracked seed profiles", () => {
    const tempRoot = makeTempRoot();
    const seedPath = path.join(process.cwd(), "agents", "researcher.json");
    const seedBefore = fs.readFileSync(seedPath, "utf8");
    const agentProfiles = loadAgentProfiles(tempRoot);

    try {
      const original = agentProfiles.readAgentProfile("researcher");
      const updated = agentProfiles.updateAgentProfile("researcher", {
        role: "runtime-operator",
        description: "Runtime override description",
      });

      const runtimeProfilePath = agentProfiles.getProfilePath("researcher");
      expect(updated.role).toBe("runtime-operator");
      expect(updated.description).toBe("Runtime override description");
      expect(fs.existsSync(runtimeProfilePath)).toBe(true);
      expect(agentProfiles.readAgentProfile("researcher")).toEqual(updated);
      expect(fs.readFileSync(seedPath, "utf8")).toBe(seedBefore);
      expect(original.role).not.toBe("runtime-operator");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
