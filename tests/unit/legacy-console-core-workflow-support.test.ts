import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  createWorkflowTask,
  routeWorkflowTask,
  runReviewAction,
  runAlertAction,
} = require("../../services/legacyConsoleCoreWorkflowSupport.js");

describe("legacy console core workflow support", () => {
  it("creates workflow tasks with the browser workflow defaults", () => {
    const addTask = vi.fn(() => ({
      id: "task_1",
      agentName: "planner",
      description: "Investigate drift",
    }));
    const formatTasks = vi.fn(() => "formatted tasks");

    const result = createWorkflowTask(
      {
        agentName: "planner",
        description: "Investigate drift",
        priority: 2,
      },
      { addTask, formatTasks },
    );

    expect(addTask).toHaveBeenCalledWith("planner", "Investigate drift", {
      priority: 2,
      sourceAgent: "manager",
      delegationReason: "Created from the browser console workflow.",
      tags: ["browser-workflow"],
      notifyAgent: "manager",
      callbackEnabled: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        output: "formatted tasks",
      }),
    );
  });

  it("routes workflow tasks and formats the result", () => {
    const routeManagerTask = vi.fn(() => ({
      task: { id: "task_2", agentName: "operator" },
      routing: { agentName: "operator", delegationReason: "Handles incidents" },
    }));
    const formatTasks = vi.fn(() => "task summary");

    const result = routeWorkflowTask({ description: "Handle incident" }, { routeManagerTask, formatTasks });

    expect(routeManagerTask).toHaveBeenCalledWith("Handle incident");
    expect(result.output).toContain("Routed to operator.");
    expect(result.output).toContain("Reason: Handles incidents");
    expect(result.output).toContain("task summary");
  });

  it("handles review actions through the extracted helper", () => {
    const approveReviewItem = vi.fn(() => ({ ok: true, message: "Approved review." }));
    const reviseReviewItem = vi.fn(() => ({ ok: true, message: "Revision requested." }));

    const approved = runReviewAction("review:approve", { taskId: "task_1" }, {
      approveReviewItem,
      addReviewItemForTask: vi.fn(),
      reviseReviewItem,
      createFollowupTask: vi.fn(),
    });
    expect(approved).toEqual(
      expect.objectContaining({
        ok: true,
        output: "Approved review.",
      }),
    );

    const revised = runReviewAction("review:revise", { taskId: "task_1", note: "Needs more detail" }, {
      approveReviewItem,
      addReviewItemForTask: vi.fn(),
      reviseReviewItem,
      createFollowupTask: vi.fn(),
    });
    expect(revised?.audit.summary).toBe("Needs more detail");
    expect(reviseReviewItem).toHaveBeenCalledWith("task_1", "Needs more detail");
  });

  it("handles alert actions and preserves notes", () => {
    const resolveAlert = vi.fn(() => ({ ok: true, message: "Resolved alert." }));
    const runAlertChecks = vi.fn(() => ({ unhealthy: [] }));

    const resolved = runAlertAction("alert:resolve", { alertId: "alert_1", note: "Investigated" }, {
      acknowledgeAlert: vi.fn(),
      resolveAlert,
      addAlertNote: vi.fn(),
      runAlertChecks,
    });
    expect(resolved?.audit.summary).toBe("Investigated");
    expect(resolveAlert).toHaveBeenCalledWith("alert_1", "Investigated");

    const checks = runAlertAction("alert:run-checks", {}, {
      acknowledgeAlert: vi.fn(),
      resolveAlert,
      addAlertNote: vi.fn(),
      runAlertChecks,
    });
    expect(checks).toEqual(
      expect.objectContaining({
        ok: true,
        output: "Alert checks completed.",
        result: { unhealthy: [] },
      }),
    );
  });
});
