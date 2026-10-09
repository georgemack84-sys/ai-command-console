import { describe, expect, it } from "vitest";
import {
  assertTerminalEnvironmentBoundary,
  getDeclaredTargetEnvironment,
  resolveWorkspaceEnvironment,
} from "@/src/server/services/terminal-environment-boundary-service";

const governance = {
  currentEnvironment: "development",
  workspacePolicyOverrides: {
    workspace_staging: { environment: "staging" },
    workspace_production: { environment: "production" },
  },
};

describe("terminal environment boundaries", () => {
  it("resolves each workspace to one canonical environment", () => {
    expect(resolveWorkspaceEnvironment(governance, "workspace_default")).toBe("development");
    expect(resolveWorkspaceEnvironment(governance, "workspace_staging")).toBe("staging");
    expect(resolveWorkspaceEnvironment(governance, "workspace_production")).toBe("production");
  });

  it("accepts same-environment actions and exposes the bound target", () => {
    expect(
      assertTerminalEnvironmentBoundary({
        action: "watcher:stop",
        payload: { environment: "staging" },
        workspaceId: "workspace_staging",
        governance,
      }),
    ).toEqual({ workspaceEnvironment: "staging", targetEnvironment: "staging" });
  });

  it("blocks cross-environment and conflicting targets", () => {
    expect(() =>
      assertTerminalEnvironmentBoundary({
        action: "watcher:stop",
        payload: { targetEnvironment: "production" },
        workspaceId: "workspace_staging",
        governance,
      }),
    ).toThrowError(expect.objectContaining({ code: "environment_boundary_violation", status: 409 }));

    expect(() => getDeclaredTargetEnvironment({ environment: "staging", overrideEnvironment: "production" })).toThrowError(
      expect.objectContaining({ code: "environment_target_conflict", status: 400 }),
    );
    expect(() => getDeclaredTargetEnvironment({ environment: "qa" })).toThrowError(
      expect.objectContaining({ code: "environment_invalid", status: 400 }),
    );
  });

  it("invalidates approvals when a workspace changes environment", () => {
    expect(() =>
      assertTerminalEnvironmentBoundary({
        action: "watcher:stop",
        payload: {},
        workspaceId: "workspace_production",
        governance,
        approvedEnvironment: "staging",
      }),
    ).toThrowError(expect.objectContaining({ code: "approval_environment_changed", status: 409 }));
  });
});
