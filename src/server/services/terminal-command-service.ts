import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";

const require = createRequire(import.meta.url);

const { listAgentProfiles, getAgentStatus, startAgent, tickAgent, stopAgent, routeManagerTask } = require("../../../services/agentRuntime");
const { listTasks, peekNextTask } = require("../../../services/taskQueue");
const { buildSystemSummary, buildHealthSummary, buildWorkloadSummary, getAgentDashboard } = require("../../../services/dashboard");
const { listSchedules, getSchedule, runScheduledTick } = require("../../../services/scheduler");
const { getWatcherStatus } = require("../../../services/watcher");
const { addReviewItemForTask, listReviewItems } = require("../../../services/reviewQueue");
const { enqueueJob } = require("../../../services/jobQueue");
const { listAlerts, listActiveAlerts } = require("../../../services/alerts");
const { getDigestSchedulerStatus } = require("../../../services/digestScheduler");
const { listPlugins } = require("../../../services/pluginLoader");

type CommandActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

const handledCommandPrefixes = [
  "agents:list",
  "agent:status ",
  "agent:start ",
  "agent:tick ",
  "agent:stop ",
  "manager:route ",
  "brief:list",
  "brief:create ",
  "brief:route ",
  "report:list",
  "report:create ",
  "report:publish ",
  "queue:list",
  "queue:next ",
  "dashboard:system",
  "dashboard:health",
  "dashboard:workload",
  "dashboard:agent ",
  "schedule:list",
  "schedule:status ",
  "schedule:run ",
  "watcher:status",
  "watcher:run",
  "review:create ",
  "review:list",
  "ownership:signals",
  "alerts:list",
  "alerts:active",
  "alerts:run",
  "digest:health",
  "plugins",
  "run plugin ",
] as const;

const defaultRuntimeDeps = {
  enqueueJob,
};

const runtimeDeps = { ...defaultRuntimeDeps };

function formatBlock(title: string, value: unknown) {
  return `${title}\n${JSON.stringify(value, null, 2)}`;
}

function formatTasks(tasks: Array<Record<string, unknown>>) {
  if (!tasks.length) {
    return "No tasks found.";
  }

  return [
    "Tasks",
    ...tasks.map(
      (task) =>
        `- ${String(task.id || "task")} • ${String(task.agentName || "agent")} • ${String(task.status || "unknown")} • p${String(task.priority || 3)}\n  ${String(task.description || "")}`,
    ),
  ].join("\n");
}

function formatBriefs(briefs: Array<Record<string, unknown>>) {
  if (!briefs.length) {
    return "No research briefs found.";
  }

  return [
    "Research Briefs",
    ...briefs.map(
      (brief) =>
        `- ${String(brief.id || "brief")} • ${String(brief.status || "draft")} • ${String(brief.title || "Untitled brief")}\n  ${String(brief.question || "")}`,
    ),
  ].join("\n");
}

function formatReports(reports: Array<Record<string, unknown>>) {
  if (!reports.length) {
    return "No reports found.";
  }

  return [
    "Reports",
    ...reports.map(
      (report) =>
        `- ${String(report.id || "report")} • ${String(report.status || "draft")} • ${String(report.title || "Untitled report")}\n  Brief: ${String(report.briefId || "n/a")}`,
    ),
  ].join("\n");
}

function formatSchedule(schedule: Record<string, unknown> | null) {
  if (!schedule) {
    return "Schedule not found.";
  }
  return formatBlock(`Schedule: ${String(schedule.agentName || "unknown")}`, schedule);
}

function formatWatcher(status: Record<string, unknown>) {
  return formatBlock("Watcher", status);
}

function formatAlerts(title: string, alerts: Array<Record<string, unknown>>) {
  if (!alerts.length) {
    return `${title}\nNo alerts found.`;
  }

  return [
    title,
    ...alerts.map(
      (alert) =>
        `- ${String(alert.title || alert.id || "alert")} • ${String(alert.status || "unknown")}\n  ${String(alert.message || alert.detail || "")}`,
    ),
  ].join("\n");
}

function formatPluginsBlock(plugins: Array<Record<string, unknown>>) {
  if (!plugins.length) {
    return "No plugins configured.";
  }

  return plugins
    .map(
      (plugin) =>
        [
          `${String(plugin.name || "plugin")}`,
          `  Loaded: ${plugin.loaded ? "yes" : "no"}`,
          `  Description: ${String(plugin.description || "(none)")}`,
          `  Error: ${String(plugin.error || "(none)")}`,
        ].join("\n"),
    )
    .join("\n\n");
}

import { buildOwnershipSignalsSnapshot } from "@/src/server/services/terminal-overview-service";

async function getResearchService() {
  return import("@/src/server/services/research-service");
}

async function getResearchActionService() {
  return import("@/src/server/services/research-action-service");
}

async function formatOwnershipSignalsForWorkspace(workspaceId: string) {
  const signals = await buildOwnershipSignalsSnapshot(workspaceId);

  if (!signals.length) {
    return "Ownership signals\nNo assignment risks detected in this workspace.";
  }

  return [
    "Ownership signals",
    ...signals.map((signal) => `- ${String(signal.title)}\n  ${String(signal.detail)}\n  Action: ${String(signal.command)}`),
  ].join("\n");
}

function formatAgentStatusBlock(agentName: string, state: Record<string, unknown> | null | undefined) {
  return formatBlock(`Agent Status: ${agentName}`, state || {});
}

function formatAgentProfilesBlock(profiles: Array<Record<string, unknown>>) {
  if (!profiles.length) {
    return "No agent profiles found.";
  }

  return [
    "Agent Profiles",
    ...profiles.map(
      (profile) =>
        `- ${String(profile.name || "unknown")} • ${String(profile.role || "unknown")}\n  ${String(profile.description || "")}`,
    ),
  ].join("\n");
}

export function canHandleTerminalCommand(command: string) {
  const trimmed = String(command || "").trim();
  return handledCommandPrefixes.some((prefix) => trimmed === prefix || trimmed.startsWith(prefix));
}

export async function executeTerminalCommand(command: string, actor: CommandActor) {
  const trimmed = String(command || "").trim();

  if (trimmed === "agents:list") {
    return formatAgentProfilesBlock(listAgentProfiles());
  }

  if (trimmed.startsWith("agent:status ")) {
    const agentName = trimmed.replace("agent:status ", "").trim();
    return formatAgentStatusBlock(agentName, getAgentStatus(agentName).state);
  }

  if (trimmed.startsWith("agent:start ")) {
    const remainder = trimmed.replace("agent:start ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const agentName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const goal = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const result = await startAgent(agentName, goal);
    return [result.message, formatAgentStatusBlock(agentName, result.state)].join("\n\n");
  }

  if (trimmed.startsWith("agent:tick ")) {
    const agentName = trimmed.replace("agent:tick ", "").trim();
    const result = await tickAgent(agentName);
    return [result.message, result.step ? `Step: ${result.step}` : null, result.result?.summary || null]
      .filter(Boolean)
      .join("\n");
  }

  if (trimmed.startsWith("agent:stop ")) {
    const agentName = trimmed.replace("agent:stop ", "").trim();
    const result = stopAgent(agentName);
    return [result.message, formatAgentStatusBlock(agentName, result.state)].join("\n\n");
  }

  if (trimmed.startsWith("manager:route ")) {
    const taskText = trimmed.replace("manager:route ", "").trim();
    const result = routeManagerTask(taskText);
    return [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, formatTasks([result.task])].join("\n\n");
  }

  if (trimmed === "brief:list") {
    const researchService = await getResearchService();
    return formatBriefs((await researchService.listBriefs(actor.workspaceId)) as Array<Record<string, unknown>>);
  }

  if (trimmed.startsWith("brief:create ")) {
    const remainder = trimmed.replace("brief:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use brief:create <title> | <question>");
    }

    const researchService = await getResearchService();
    const brief = await researchService.createBrief({
      workspaceId: actor.workspaceId,
      ownerId: actor.id,
      title: parts[0],
      question: parts[1],
      status: "draft",
      priority: "medium",
      assignedAgent: "researcher",
      tags: [],
      summary: "Created from the terminal command desk.",
      linkedTaskId: null,
    });
    return formatBriefs([brief as unknown as Record<string, unknown>]);
  }

  if (trimmed.startsWith("brief:route ")) {
    const { executeResearchAction } = await getResearchActionService();
    const result = await executeResearchAction(
      {
        action: "brief:route",
        payload: { briefId: trimmed.replace("brief:route ", "").trim() },
      },
      actor,
    );
    return result.output;
  }

  if (trimmed === "report:list") {
    const researchService = await getResearchService();
    return formatReports((await researchService.listReports(actor.workspaceId)) as Array<Record<string, unknown>>);
  }

  if (trimmed.startsWith("report:create ")) {
    const remainder = trimmed.replace("report:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use report:create <briefId> | <title>");
    }

    const { executeResearchAction } = await getResearchActionService();
    const result = await executeResearchAction(
      {
        action: "report:create",
        payload: {
          briefId: parts[0],
          title: parts[1],
          format: "memo",
          excerpt: "Created from the terminal command desk.",
          keyFindings: [],
        },
      },
      actor,
    );
    return result.output;
  }

  if (trimmed.startsWith("report:publish ")) {
    const { executeResearchAction } = await getResearchActionService();
    const result = await executeResearchAction(
      {
        action: "report:publish",
        payload: { reportId: trimmed.replace("report:publish ", "").trim() },
      },
      actor,
    );
    return result.output;
  }

  if (trimmed === "queue:list") {
    return formatTasks(listTasks());
  }

  if (trimmed.startsWith("queue:next ")) {
    return formatTasks([peekNextTask(trimmed.replace("queue:next ", "").trim())].filter(Boolean));
  }

  if (trimmed === "dashboard:system") {
    return formatBlock("System Summary", buildSystemSummary());
  }

  if (trimmed === "dashboard:health") {
    return formatBlock("Health Summary", buildHealthSummary());
  }

  if (trimmed === "dashboard:workload") {
    return formatBlock("Workload Summary", { agents: buildWorkloadSummary() });
  }

  if (trimmed.startsWith("dashboard:agent ")) {
    const agentName = trimmed.replace("dashboard:agent ", "").trim();
    return formatBlock(`Agent Dashboard: ${agentName}`, getAgentDashboard(agentName));
  }

  if (trimmed === "schedule:list") {
    const schedules = listSchedules();
    return schedules.length ? schedules.map((schedule: Record<string, unknown>) => formatSchedule(schedule)).join("\n\n") : "No schedules found.";
  }

  if (trimmed.startsWith("schedule:status ")) {
    return formatSchedule(getSchedule(trimmed.replace("schedule:status ", "").trim()));
  }

  if (trimmed.startsWith("schedule:run ")) {
    const result = await runScheduledTick(trimmed.replace("schedule:run ", "").trim());
    return [result.message, result.schedule ? formatSchedule(result.schedule) : null].filter(Boolean).join("\n\n");
  }

  if (trimmed === "watcher:status") {
    return formatWatcher(getWatcherStatus());
  }

  if (trimmed === "watcher:run") {
    const job = runtimeDeps.enqueueJob("watcher:run", {}, {
      userId: actor.id,
      workspaceId: actor.workspaceId,
      userName: actor.name || actor.email,
      userRole: actor.role,
    });
    return `Queued watcher run as ${job.id}.`;
  }

  if (trimmed.startsWith("review:create ")) {
    return addReviewItemForTask(trimmed.replace("review:create ", "").trim()).message;
  }

  if (trimmed === "review:list") {
    const reviews = listReviewItems();
    return reviews.length ? formatBlock("Review Queue", { items: reviews }) : "No review items found.";
  }

  if (trimmed === "ownership:signals") {
    return formatOwnershipSignalsForWorkspace(actor.workspaceId);
  }

  if (trimmed === "alerts:list") {
    return formatAlerts("Alerts", listAlerts());
  }

  if (trimmed === "alerts:active") {
    return formatAlerts("Active Alerts", listActiveAlerts());
  }

  if (trimmed === "digest:health") {
    const scheduler = getDigestSchedulerStatus();
    const activeAlerts = listActiveAlerts();
    return formatBlock("Digest Automation Health", {
      scheduler,
      alerts: activeAlerts,
      activeAlertCount: activeAlerts.length,
    });
  }

  if (trimmed === "alerts:run") {
    const job = runtimeDeps.enqueueJob("alerts:run", {}, {
      userId: actor.id,
      workspaceId: actor.workspaceId,
      userName: actor.name || actor.email,
      userRole: actor.role,
    });
    return `Queued alert sweep as ${job.id}.`;
  }

  if (trimmed === "plugins") {
    return formatPluginsBlock(listPlugins());
  }

  if (trimmed.startsWith("run plugin ")) {
    const remainder = trimmed.replace("run plugin ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const pluginName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const pluginArg = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const job = runtimeDeps.enqueueJob(
      "plugin:run",
      { name: pluginName, pluginArg },
      {
        userId: actor.id,
        workspaceId: actor.workspaceId,
        userName: actor.name || actor.email,
        userRole: actor.role,
      },
    );
    return `Queued plugin ${pluginName} as ${job.id}.`;
  }

  throw new Error(`Unsupported terminal command: ${trimmed}`);
}

export function __setTerminalCommandDepsForTest(overrides: Partial<typeof defaultRuntimeDeps>) {
  Object.assign(runtimeDeps, overrides);
}

export function __resetTerminalCommandDepsForTest() {
  Object.assign(runtimeDeps, defaultRuntimeDeps);
}
