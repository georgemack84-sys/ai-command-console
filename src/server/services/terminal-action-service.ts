import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);

const { addTask } = require("../../../services/taskQueue");
const { routeManagerTask } = require("../../../services/agentRuntime");
const { appendAuditEvent } = require("../../../services/auditTrail");
const { cancelJob, retryJob, getJob, enqueueJob } = require("../../../services/jobQueue");
const { startWatcher, stopWatcher, getWatcherStatus, updateWatcherRule, addWatcherRule, removeWatcherRule, evaluateRules } = require("../../../services/watcher");
const { updateAlertThresholds, runAlertChecks, acknowledgeAlert, resolveAlert, addAlertNote } = require("../../../services/alerts");
const { updateAutomationPolicy } = require("../../../services/automationPolicy");
const { updateAgentProfile } = require("../../../services/agentProfiles");
const { approveReviewItem, addReviewItemForTask, reviseReviewItem, createFollowupTask } = require("../../../services/reviewQueue");

type TerminalActionActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

const terminalActionSet = new Set([
  "workflow:create-task",
  "workflow:route-task",
  "job:cancel",
  "job:retry",
  "job:detail",
  "watcher:start",
  "watcher:stop",
  "watcher:rule-upsert",
  "watcher:rule-delete",
  "policy:update-thresholds",
  "policy:update-automation",
  "agent:update-config",
  "review:approve",
  "review:create",
  "review:revise",
  "review:followup",
  "alert:acknowledge",
  "alert:resolve",
  "alert:note",
  "alert:run-checks",
  "plugin:run",
]);

export function canHandleTerminalAction(action: string) {
  return terminalActionSet.has(String(action || ""));
}

export async function executeTerminalAction(
  input: { action: string; payload?: Record<string, unknown> },
  actor: TerminalActionActor,
) {
  const action = String(input.action || "");
  const payload = input.payload || {};

  if (action === "workflow:create-task") {
    const task = addTask(String(payload.agentName || ""), String(payload.description || ""), {
      priority: Number(payload.priority || 3),
      sourceAgent: "manager",
      delegationReason: "Created from the browser console workflow.",
      tags: ["browser-workflow"],
      notifyAgent: "manager",
      callbackEnabled: true,
    });
    appendAuditEvent({
      type: action,
      message: `Created task ${task.id} for ${task.agentName}.`,
      summary: task.description,
      payload: { taskId: task.id, agentName: task.agentName, actorId: actor.id },
    });
    return { ok: true, output: `Created task ${task.id} for ${task.agentName}.`, detail: { task } };
  }

  if (action === "workflow:route-task") {
    const result = routeManagerTask(String(payload.description || ""));
    appendAuditEvent({
      type: action,
      message: `Routed task ${result.task.id} to ${result.routing.agentName}.`,
      summary: String(payload.description || ""),
      payload: { taskId: result.task.id, agentName: result.routing.agentName, actorId: actor.id },
    });
    return {
      ok: true,
      output: [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, `Task ${result.task.id}`].join("\n\n"),
      detail: result,
    };
  }

  if (action === "job:cancel") {
    const job = cancelJob(String(payload.jobId || ""));
    if (!job || job.status !== "canceled") {
      return { ok: false, error: `Unable to cancel job ${payload.jobId}.` };
    }
    appendAuditEvent({ type: action, message: `Canceled job ${job.id}.`, payload: { actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Canceled job ${job.id}.` };
  }

  if (action === "job:retry") {
    const job = retryJob(String(payload.jobId || ""));
    if (!job || job.status !== "queued") {
      return { ok: false, error: `Unable to retry job ${payload.jobId}.` };
    }
    appendAuditEvent({ type: action, message: `Retried job ${job.id}.`, payload: { actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Retried job ${job.id}.` };
  }

  if (action === "job:detail") {
    const job = getJob(String(payload.jobId || ""), { full: true });
    if (!job) {
      return { ok: false, error: `Job not found: ${payload.jobId}.` };
    }
    return { ok: true, output: `Loaded job ${job.id}.`, detail: { job } };
  }

  if (action === "watcher:start") {
    const state = startWatcher(Number(payload.intervalSeconds || 5));
    appendAuditEvent({
      type: action,
      message: `Started watcher at ${state.intervalSeconds}s.`,
      payload: { intervalSeconds: state.intervalSeconds, actorId: actor.id },
    });
    return { ok: true, output: `Watcher started at ${state.intervalSeconds}s interval.` };
  }

  if (action === "watcher:stop") {
    stopWatcher(String(payload.reason || "stopped_by_user"));
    appendAuditEvent({
      type: action,
      message: "Stopped watcher.",
      payload: { reason: payload.reason || "stopped_by_user", actorId: actor.id },
    });
    return { ok: true, output: "Watcher stopped." };
  }

  if (action === "watcher:rule-upsert") {
    const ruleName = String(payload.name || "");
    const existing = getWatcherStatus().rules.find((rule: Record<string, unknown>) => rule.name === ruleName);
    const rule = existing ? updateWatcherRule(ruleName, payload) : addWatcherRule(payload);
    appendAuditEvent({ type: action, message: `Saved watcher rule ${rule.name}.`, payload: { ...rule, actorId: actor.id } });
    return { ok: true, output: `Saved watcher rule ${rule.name}.` };
  }

  if (action === "watcher:rule-delete") {
    const removed = removeWatcherRule(String(payload.name || ""));
    appendAuditEvent({
      type: action,
      message: removed ? `Removed watcher rule ${payload.name}.` : `Watcher rule not found: ${payload.name}.`,
      payload: { ...payload, actorId: actor.id },
    });
    return {
      ok: removed,
      output: removed ? `Removed watcher rule ${payload.name}.` : `Watcher rule not found: ${payload.name}.`,
    };
  }

  if (action === "policy:update-thresholds") {
    const thresholds = updateAlertThresholds(payload);
    appendAuditEvent({ type: action, message: "Updated alert thresholds.", payload: { ...thresholds, actorId: actor.id } });
    return { ok: true, output: "Updated alert thresholds." };
  }

  if (action === "review:approve") {
    const result = approveReviewItem(String(payload.taskId || ""));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "review:create") {
    const result = addReviewItemForTask(String(payload.taskId || ""));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "review:revise") {
    const result = reviseReviewItem(String(payload.taskId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "review:followup") {
    const result = createFollowupTask(String(payload.taskId || ""), String(payload.agentName || ""), String(payload.description || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.description || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "alert:acknowledge") {
    const result = acknowledgeAlert(String(payload.alertId || ""), String(payload.owner || "manager"));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "alert:resolve") {
    const result = resolveAlert(String(payload.alertId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "alert:note") {
    const result = addAlertNote(String(payload.alertId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message };
  }

  if (action === "alert:run-checks") {
    const result = runAlertChecks();
    appendAuditEvent({
      type: action,
      message: "Ran operational alert checks from the dashboard.",
      payload: { actorId: actor.id },
    });
    return { ok: true, output: "Alert checks completed.", detail: { result } };
  }

  if (action === "policy:update-automation") {
    const policy = updateAutomationPolicy({
      escalation: payload.escalation || {},
      remediation: payload.remediation || {},
    });
    if (policy.escalation.autoRunWatcherOnPolicySave) {
      evaluateRules();
    }
    if (policy.escalation.autoRunAlertsOnPolicySave) {
      runAlertChecks();
    }
    appendAuditEvent({ type: action, message: "Updated automation policy.", payload: { ...policy, actorId: actor.id } });
    return { ok: true, output: "Updated automation policy." };
  }

  if (action === "agent:update-config") {
    const agentName = String(payload.agentName || "");
    const profile = updateAgentProfile(agentName, {
      role: payload.role,
      description: payload.description,
      defaultGoal: payload.defaultGoal,
      systemPrompt: payload.systemPrompt,
      maxStepsPerRun: payload.maxStepsPerRun,
      cooldownSeconds: payload.cooldownSeconds,
      allowShellExecution: payload.allowShellExecution,
      allowFileWrite: payload.allowFileWrite,
      allowPlanning: payload.allowPlanning,
      tags: payload.tags,
    });
    appendAuditEvent({
      type: action,
      message: `Updated agent profile ${agentName}.`,
      payload: { agentName, profile, actorId: actor.id },
    });
    return { ok: true, output: `Updated profile for ${agentName}.` };
  }

  if (action === "plugin:run") {
    const pluginName = String(payload.name || "");
    const pluginArg = String(payload.pluginArg || "");
    const job = enqueueJob(
      "plugin:run",
      { name: pluginName, pluginArg },
      {
        userId: actor.id,
        workspaceId: actor.workspaceId,
        userName: actor.name || actor.email,
        userRole: actor.role,
      },
    );
    appendAuditEvent({
      type: action,
      message: `Queued plugin ${pluginName} as ${job.id}.`,
      summary: pluginArg || null,
      payload: { ...payload, actorId: actor.id, jobId: job.id },
    });
    return { ok: true, output: `Queued plugin ${pluginName} as ${job.id}.` };
  }

  return { ok: false, error: `Unsupported terminal action: ${action}` };
}
