import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);

const { addTask } = require("../../../services/taskQueue");
const { routeManagerTask } = require("../../../services/agentRuntime");
const { appendAuditEvent } = require("../../../services/auditTrail");
const { cancelJob, retryJob, getJob, createAdmittedJobEnqueuer } = require("../../../services/jobQueue");
const enqueueJob = createAdmittedJobEnqueuer("terminal_action_service");
const { startWatcher, stopWatcher, getWatcherStatus, updateWatcherRule, addWatcherRule, removeWatcherRule, evaluateRules, previewRules } = require("../../../services/watcher");
const { updateAlertThresholds, runAlertChecks, acknowledgeAlert, resolveAlert, addAlertNote } = require("../../../services/alerts");
const { updateAutomationPolicy } = require("../../../services/automationPolicy");
const {
  getAutomationTemplate,
  preflightAutomationTemplate,
  saveAutomationTemplate,
  deleteAutomationTemplate,
} = require("../../../services/automationTemplates");
const { updateAgentProfile } = require("../../../services/agentProfiles");
const { approveReviewItem, addReviewItemForTask, reviseReviewItem, createFollowupTask } = require("../../../services/reviewQueue");

type TerminalActionActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;
type TerminalActionResult = {
  ok: boolean;
  output?: string;
  error?: string;
  detail?: Record<string, unknown>;
};

const terminalActionSet = new Set([
  "workflow:create-task",
  "workflow:route-task",
  "job:cancel",
  "job:retry",
  "job:detail",
  "watcher:start",
  "watcher:stop",
  "watcher:preview",
  "watcher:rule-upsert",
  "watcher:rule-delete",
  "policy:update-thresholds",
  "policy:update-automation",
  "automation-template:preflight",
  "automation-template:save",
  "automation-template:delete",
  "automation-template:run",
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
): Promise<TerminalActionResult> {
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

  if (action === "watcher:preview") {
    const preview = previewRules();
    appendAuditEvent({ type: action, message: "Previewed watcher automation.", payload: { actorId: actor.id, summary: preview.summary } });
    return {
      ok: true,
      output: `${preview.summary.schedulesThatWouldStart} schedule${preview.summary.schedulesThatWouldStart === 1 ? "" : "s"} would start across ${preview.summary.matchedRules} matching rule${preview.summary.matchedRules === 1 ? "" : "s"}.`,
      detail: { watcherPreview: preview },
    };
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
      await evaluateRules();
    }
    if (policy.escalation.autoRunAlertsOnPolicySave) {
      runAlertChecks();
    }
    appendAuditEvent({ type: action, message: "Updated automation policy.", payload: { ...policy, actorId: actor.id } });
    return { ok: true, output: "Updated automation policy." };
  }

  if (action === "automation-template:preflight") {
    const template = payload.templateId
      ? getAutomationTemplate(String(payload.templateId))
      : payload.template;
    if (!template || typeof template !== "object") {
      return { ok: false, error: "Automation template not found." };
    }
    const preflight = preflightAutomationTemplate(template);
    appendAuditEvent({
      type: action,
      message: `Preflighted automation template ${preflight.template.name || preflight.template.id}.`,
      payload: { actorId: actor.id, templateId: preflight.template.id, status: preflight.status, summary: preflight.summary },
    });
    return {
      ok: preflight.ok,
      output: preflight.ok
        ? `${preflight.template.name} is ${preflight.status.replace(/_/g, " ")} with ${preflight.summary.stepCount} step${preflight.summary.stepCount === 1 ? "" : "s"}.`
        : preflight.errors.join(" "),
      error: preflight.ok ? undefined : preflight.errors.join(" "),
      detail: { automationTemplatePreflight: preflight },
    };
  }

  if (action === "automation-template:save") {
    try {
      const template = saveAutomationTemplate(payload.template && typeof payload.template === "object" ? payload.template : payload);
      appendAuditEvent({
        type: action,
        message: `Saved automation template ${template.name}.`,
        payload: { actorId: actor.id, templateId: template.id, stepCount: template.steps.length },
      });
      return { ok: true, output: `Saved automation template ${template.name}.`, detail: { automationTemplate: template } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to save automation template." };
    }
  }

  if (action === "automation-template:delete") {
    try {
      const templateId = String(payload.templateId || "");
      const removed = deleteAutomationTemplate(templateId);
      appendAuditEvent({
        type: action,
        message: removed ? `Deleted automation template ${templateId}.` : `Automation template not found: ${templateId}.`,
        payload: { actorId: actor.id, templateId },
      });
      return removed
        ? { ok: true, output: "Deleted automation template." }
        : { ok: false, error: "Automation template not found." };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unable to delete automation template." };
    }
  }

  if (action === "automation-template:run") {
    const template = getAutomationTemplate(String(payload.templateId || ""));
    if (!template) {
      return { ok: false, error: "Automation template not found." };
    }
    const preflight = preflightAutomationTemplate(template);
    if (!preflight.ok) {
      return { ok: false, error: preflight.errors.join(" "), detail: { automationTemplatePreflight: preflight } };
    }

    const results = [];
    for (const step of preflight.template.steps) {
      const result = await executeTerminalAction({ action: step.action, payload: step.payload }, actor);
      results.push({ stepId: step.id, action: step.action, ok: Boolean(result.ok), output: result.output, error: result.error });
      if (!result.ok) {
        appendAuditEvent({
          type: action,
          message: `Automation template ${template.name} stopped at ${step.action}.`,
          payload: { actorId: actor.id, templateId: template.id, failedAction: step.action, results },
        });
        return {
          ok: false,
          error: `Automation template stopped at ${step.action}: ${result.error || result.output || "step failed"}`,
          detail: { automationTemplateRun: { templateId: template.id, status: "failed", results } },
        };
      }
    }

    appendAuditEvent({
      type: action,
      message: `Completed automation template ${template.name}.`,
      payload: { actorId: actor.id, templateId: template.id, results },
    });
    return {
      ok: true,
      output: `Completed ${template.name} (${results.length} step${results.length === 1 ? "" : "s"}).`,
      detail: { automationTemplateRun: { templateId: template.id, status: "completed", results } },
    };
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
