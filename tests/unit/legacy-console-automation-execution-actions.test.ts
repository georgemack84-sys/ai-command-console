import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  snoozeWorkspace,
  queueWorkspaceSweep,
  createWorkspaceFollowup,
  createBulkWorkspaceFollowups,
  runStabilizationPlaybook,
} = require("../../services/legacyConsoleAutomationExecutionActions.js");

describe("legacy console automation execution actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T01:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("snoozes a workspace and records the event", () => {
    const updateDigestWorkspaceState = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const actor = { id: "user_1", name: "Alex" };

    const snoozedUntil = snoozeWorkspace(
      "alpha",
      30,
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      "Snoozed workspace automation escalation for 30 minutes."
    );

    expect(snoozedUntil).toBe("2026-04-10T02:00:00.000Z");
    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        snoozedUntil: "2026-04-10T02:00:00.000Z",
        snoozedBy: "user_1",
      })
    );
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        type: "escalation-snoozed",
        note: "2026-04-10T02:00:00.000Z",
      })
    );
  });

  it("queues sweeps unless an active job already exists", () => {
    const enqueueJob = vi.fn(() => ({ id: "job_1" }));
    const updateDigestWorkspaceState = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const actor = { id: "user_1", name: "Alex" };

    const queued = queueWorkspaceSweep(
      "alpha",
      actor,
      { enqueueJob, updateDigestWorkspaceState, appendDigestWorkspaceEvent, listJobs: () => [] },
      "Queued a manual digest sweep."
    );
    expect(queued).toEqual({ id: "job_1" });

    const skipped = queueWorkspaceSweep(
      "alpha",
      actor,
      {
        enqueueJob,
        updateDigestWorkspaceState,
        appendDigestWorkspaceEvent,
        listJobs: () => [{ type: "digest:run-due", status: "queued", payload: { workspace: "alpha" } }],
      },
      "Queued a manual digest sweep."
    );
    expect(skipped).toBeNull();
  });

  it("creates follow-up tasks for one or many workspaces", () => {
    const addTask = vi.fn(() => ({ id: "task_1" }));
    const appendDigestWorkspaceEvent = vi.fn();
    const updateIncidentChecklistItem = vi.fn();
    const actor = { id: "user_1", name: "Alex" };

    const single = createWorkspaceFollowup(
      "alpha",
      "Alpha",
      { description: "Check {{workspaceName}}", owner: "Jamie" },
      actor,
      { addTask, appendDigestWorkspaceEvent, updateIncidentChecklistItem }
    );

    expect(single.task).toEqual({ id: "task_1" });
    expect(single.description).toBe("Check Alpha");
    expect(updateIncidentChecklistItem).toHaveBeenCalledWith(
      "alpha",
      "followup_created",
      expect.objectContaining({ completed: true })
    );

    addTask.mockImplementationOnce(() => ({ id: "task_2" })).mockImplementationOnce(() => ({ id: "task_3" }));
    const bulk = createBulkWorkspaceFollowups(
      [
        { workspaceId: "alpha", workspaceName: "Alpha" },
        { workspaceId: "beta", workspaceName: "Beta" },
      ],
      { description: "Inspect {{workspaceId}}" },
      actor,
      { addTask, appendDigestWorkspaceEvent, updateIncidentChecklistItem },
      { owner: "Jamie" }
    );

    expect(bulk.map((item: { task: { id: string } }) => item.task.id)).toEqual(["task_2", "task_3"]);
  });

  it("runs the stabilization playbook through the extracted helpers", () => {
    const updateDigestWorkspaceState = vi.fn();
    const updateIncidentChecklistItem = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();
    const addTask = vi.fn(() => ({ id: "task_1" }));
    const enqueueJob = vi.fn(() => ({ id: "job_1" }));
    const listJobs = vi.fn(() => []);
    const actor = { id: "user_1", name: "Alex" };

    const result = runStabilizationPlaybook(
      [{ workspaceId: "alpha", workspaceName: "Alpha" }],
      {
        owner: "Jamie",
        approverTarget: "user:approver",
        backupApproverTarget: "user:backup",
        createFollowup: true,
        queueSweep: true,
        description: "Investigate {{workspaceName}}",
      },
      actor,
      {
        updateDigestWorkspaceState,
        updateIncidentChecklistItem,
        appendDigestWorkspaceEvent,
        addTask,
        enqueueJob,
        listJobs,
      }
    );

    expect(result).toEqual(
      expect.objectContaining({
        owner: "Jamie",
        approverTarget: "user:approver",
        backupApproverTarget: "user:backup",
        queueSweep: true,
        createFollowup: true,
        jobs: [{ id: "job_1" }],
        tasks: [{ id: "task_1" }],
      })
    );
    expect(updateDigestWorkspaceState).toHaveBeenCalled();
    expect(appendDigestWorkspaceEvent).toHaveBeenCalled();
  });
});
