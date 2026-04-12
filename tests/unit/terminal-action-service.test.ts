import { describe, expect, it } from "vitest";
import { canHandleTerminalAction, executeTerminalAction } from "@/src/server/services/terminal-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  email: "operator@example.com",
  name: "Operator",
  role: "operator" as const,
};

describe("terminal action service", () => {
  it("recognizes extracted terminal fallback actions", () => {
    expect(canHandleTerminalAction("workflow:create-task")).toBe(true);
    expect(canHandleTerminalAction("watcher:start")).toBe(true);
    expect(canHandleTerminalAction("job:detail")).toBe(true);
    expect(canHandleTerminalAction("policy:update-automation")).toBe(true);
    expect(canHandleTerminalAction("agent:update-config")).toBe(true);
    expect(canHandleTerminalAction("review:approve")).toBe(true);
    expect(canHandleTerminalAction("alert:resolve")).toBe(true);
    expect(canHandleTerminalAction("plugin:run")).toBe(true);
  });

  it("creates and routes workflow actions without the legacy action handler", async () => {
    const created = await executeTerminalAction(
      { action: "workflow:create-task", payload: { agentName: "researcher", description: "Trace signal drift", priority: 2 } },
      actor,
    );
    expect(created.ok).toBe(true);
    expect(created.output).toMatch(/^Created task .+ for researcher\.$/);

    const routed = await executeTerminalAction(
      { action: "workflow:route-task", payload: { description: "Summarize source changes" } },
      actor,
    );
    expect(routed.ok).toBe(true);
    expect(routed.output).toContain("Routed to");
  });

  it("handles job and watcher actions directly", async () => {
    const canceled = await executeTerminalAction({ action: "job:cancel", payload: { jobId: "job_1" } }, actor);
    expect(canceled.ok).toBe(false);
    expect(canceled.error).toContain("Unable to cancel job");

    const detailed = await executeTerminalAction({ action: "job:detail", payload: { jobId: "job_2" } }, actor);
    expect(detailed.ok).toBe(false);
    expect(detailed.error).toContain("Job not found");

    const watcherStart = await executeTerminalAction({ action: "watcher:start", payload: { intervalSeconds: 7 } }, actor);
    expect(watcherStart.ok).toBe(true);
    expect(watcherStart.output).toBe("Watcher started at 7s interval.");
  });

  it("handles threshold, policy, and agent config actions directly", async () => {
    await expect(
      executeTerminalAction(
        { action: "policy:update-thresholds", payload: { queuedTasksHigh: 8, pendingReviewsHigh: 5, inactiveAgentsHigh: 2 } },
        actor,
      ),
    ).resolves.toEqual(expect.objectContaining({ ok: true, output: "Updated alert thresholds." }));

    await expect(
      executeTerminalAction(
        { action: "policy:update-automation", payload: { escalation: { autoRunWatcherOnPolicySave: true }, remediation: {} } },
        actor,
      ),
    ).resolves.toEqual(expect.objectContaining({ ok: true, output: "Updated automation policy." }));

    const updated = await executeTerminalAction(
      { action: "agent:update-config", payload: { agentName: "researcher", role: "operator" } },
      actor,
    );
    expect(updated.ok).toBe(true);
    expect(updated.output).toBe("Updated profile for researcher.");
  });

  it("handles review, alert, and plugin actions directly", async () => {
    const reviewed = await executeTerminalAction({ action: "review:create", payload: { taskId: "task_1" } }, actor);
    expect(typeof reviewed.ok).toBe("boolean");
    expect(typeof reviewed.output).toBe("string");

    const resolved = await executeTerminalAction(
      { action: "alert:resolve", payload: { alertId: "alert_1", note: "Recovered" } },
      actor,
    );
    expect(typeof resolved.ok).toBe("boolean");
    expect(typeof resolved.output).toBe("string");

    const plugin = await executeTerminalAction(
      { action: "plugin:run", payload: { name: "helloPlugin", pluginArg: "./services" } },
      actor,
    );
    expect(plugin.ok).toBe(true);
    expect(plugin.output).toMatch(/^Queued plugin helloPlugin as /);
  });
});
