import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";
import { restoreFiles, snapshotFiles } from "./helpers/state-fixture.mjs";

const require = createRequire(import.meta.url);

const { addTask, loadQueue, saveQueue } = require("../services/taskQueue");
const {
  loadReviewState,
  saveReviewState,
  addReviewItemForTask,
  approveReviewItem,
  createFollowupTask,
} = require("../services/reviewQueue");
const {
  saveAlertsState,
  acknowledgeAlert,
  addAlertNote,
  resolveAlert,
} = require("../services/alerts");
const {
  appendAuditEvent,
  listAuditEvents,
  clearAuditEvents,
} = require("../services/auditTrail");

const FILES = ["console.sqlite", "taskQueue.json", "reviewQueue.json", "alerts.json", "audit-log.jsonl"];

test("review workflow can create, approve, and follow up on work", () => {
  const snapshot = snapshotFiles(FILES);

  try {
    saveQueue({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
    });
    saveReviewState({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    });

    const task = addTask("planner", "Prepare a roadmap draft", { priority: 1 });
    const reviewResult = addReviewItemForTask(task.id);

    assert.equal(reviewResult.ok, true);
    assert.equal(loadReviewState().items.length, 1);

    const approveResult = approveReviewItem(task.id);
    assert.equal(approveResult.ok, true);
    assert.equal(approveResult.item.decision, "approved");
    assert.equal(approveResult.item.status, "reviewed");

    const followupResult = createFollowupTask(
      task.id,
      "builder",
      "Implement the roadmap UI panel"
    );
    assert.equal(followupResult.ok, true);
    assert.ok(followupResult.followupTask.id.startsWith("task_"));

    const queue = loadQueue();
    assert.ok(queue.tasks.some((item) => item.description === "Implement the roadmap UI panel"));
  } finally {
    restoreFiles(snapshot);
  }
});

test("alert workflow supports acknowledgement, notes, and resolution", () => {
  const snapshot = snapshotFiles(FILES);

  try {
    saveAlertsState({
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thresholds: {
        queuedTasksHigh: 6,
        pendingReviewsHigh: 4,
        inactiveAgentsHigh: 2,
      },
      lastRunAt: null,
      lastResult: null,
      alerts: [
        {
          id: "alert_test",
          type: "queue_pressure",
          severity: "moderate",
          status: "active",
          title: "Queue pressure is elevated.",
          details: { queuedTasks: 9 },
          workflow: {
            acknowledged: false,
            acknowledgedAt: null,
            owner: null,
            resolved: false,
            resolvedAt: null,
            resolutionNote: null,
            notes: [],
          },
          createdAt: new Date().toISOString(),
          clearedAt: null,
        },
      ],
    });

    const acknowledged = acknowledgeAlert("alert_test", "manager");
    assert.equal(acknowledged.ok, true);
    assert.equal(acknowledged.alert.workflow.owner, "manager");
    assert.equal(acknowledged.alert.workflow.acknowledged, true);

    const noted = addAlertNote("alert_test", "Investigating queue growth.");
    assert.equal(noted.ok, true);
    assert.equal(noted.alert.workflow.notes.at(-1).note, "Investigating queue growth.");

    const resolved = resolveAlert("alert_test", "Queue cleared after manual triage.");
    assert.equal(resolved.ok, true);
    assert.equal(resolved.alert.status, "resolved");
    assert.equal(resolved.alert.workflow.resolutionNote, "Queue cleared after manual triage.");
  } finally {
    restoreFiles(snapshot);
  }
});

test("audit trail records and returns recent events in reverse chronological order", () => {
  const snapshot = snapshotFiles(FILES);

  try {
    clearAuditEvents();
    appendAuditEvent({ type: "command", message: "Ran dashboard:health" });
    appendAuditEvent({ type: "review:approve", message: "Approved review task_1" });

    const events = listAuditEvents(2);
    assert.equal(events.length, 2);
    assert.equal(events[0].type, "review:approve");
    assert.equal(events[1].type, "command");
  } finally {
    restoreFiles(snapshot);
  }
});
