import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { CURRENT_RUNTIME_POLICY_VERSION, applyRuntimePolicyMigrations } = require("../../services/runtimePolicyMigrations");

const normalizeStrictModeConfig = (strictMode: Record<string, unknown> = {}) => ({
  primaryReviewSurface: strictMode.primaryReviewSurface || "api",
  secondaryReviewSurfaces: strictMode.secondaryReviewSurfaces || ["ui", "cli"],
});

describe("runtime policy migrations", () => {
  it("upgrades the oldest supported policy fixture to the canonical compatibility version", () => {
    const migrated = applyRuntimePolicyMigrations({
      version: 1,
      actionCategoryMap: { list_plugins: "plugin_action" },
    }, { normalizeStrictModeConfig });

    expect(migrated.version).toBe(CURRENT_RUNTIME_POLICY_VERSION);
    expect(migrated.actionCategoryMap).toEqual(expect.objectContaining({
      list_plugins: "shell_read",
      agent_start: "agent_control",
      "automation-template:run": "workflow_control",
      "sources:refresh": "network_mutation",
      "research:summaries-run-due": "network_mutation",
    }));
    expect(migrated.actionPrefixCategoryMap).toEqual(expect.objectContaining({
      "legacy-console:file_write:": "file_write",
      "agent-tasks:": "process_control",
    }));
  });

  it("preserves custom current-policy mappings without replaying historical upgrades", () => {
    const migrated = applyRuntimePolicyMigrations({
      version: CURRENT_RUNTIME_POLICY_VERSION,
      actionCategoryMap: { "custom:action": "workflow_control" },
      actionPrefixCategoryMap: { "custom:": "workflow_control" },
    }, { normalizeStrictModeConfig });

    expect(migrated).toEqual(expect.objectContaining({
      version: CURRENT_RUNTIME_POLICY_VERSION,
      actionCategoryMap: { "custom:action": "workflow_control" },
      actionPrefixCategoryMap: { "custom:": "workflow_control" },
    }));
  });

  it("normalizes strict-mode settings at the historical compatibility boundary", () => {
    const migrated = applyRuntimePolicyMigrations({
      version: 18,
      strictMode: { primaryReviewSurface: "cli" },
    }, { normalizeStrictModeConfig });

    expect(migrated.strictMode).toEqual({
      primaryReviewSurface: "cli",
      secondaryReviewSurfaces: ["ui", "cli"],
    });
  });
});
