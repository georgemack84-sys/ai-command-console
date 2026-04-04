#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {
  startAgent,
  tickAgent,
  getAgentStatus,
  stopAgent,
  listAgentProfiles,
  routeManagerTask
} = require("./services/agentRuntime");

const {
  addTask,
  listTasks,
  clearQueue,
  peekNextTask
} = require("./services/taskQueue");

const {
  startSchedule,
  stopSchedule,
  listSchedules,
  getSchedule,
  runScheduledTick
} = require("./services/scheduler");

const {
  startWatcher,
  stopWatcher,
  getWatcherStatus,
  evaluateRules
} = require("./services/watcher");

const {
  sendMessage,
  listInbox,
  getUnreadMessages,
  readMessage,
  escalateToManager
} = require("./services/inbox");

const {
  getMessageTaskStatus,
  convertMessageToTask,
  autoConvertMessage,
  listManagerEscalations
} = require("./services/inboxActions");

const {
  getTaskCallbackStatus,
  listTasksWithCallbacks
} = require("./services/callbacks");

const {
  listReviewItems,
  getReviewItemByTaskId,
  approveReviewItem,
  reviseReviewItem,
  createFollowupTask
} = require("./services/reviewQueue");

const {
  getReviewAckStatus,
  acknowledgeReviewReply,
  taskifyReviewReply,
  autoTaskifyReviewReply
} = require("./services/reviewIntake");

const {
  buildSystemSummary,
  buildHealthSummary,
  buildWorkloadSummary,
  buildReviewSummary,
  getAgentDashboard
} = require("./services/dashboard");

const {
  runAlertChecks,
  listAlerts,
  listActiveAlerts,
  listOpenAlerts,
  getAlertById,
  acknowledgeAlert,
  addAlertNote,
  resolveAlert,
  clearAlerts
} = require("./services/alerts");

const STARTUP_PATH = path.join(process.cwd(), "config", "startup.json");

function loadStartupConfig() {
  try {
    if (!fs.existsSync(STARTUP_PATH)) {
      return {
        appName: "AI Command Console",
        version: "36.0",
        safeMode: true,
        debugMode: false,
        pluginsEnabled: true,
        memoryEnabled: true,
        planningEnabled: true,
        agentsEnabled: true,
        multiAgentEnabled: true,
        taskQueueEnabled: true,
        managerEnabled: true,
        autoDelegationEnabled: true,
        schedulerEnabled: true,
        watcherEnabled: true,
        messagingEnabled: true,
        messageTaskWorkflowEnabled: true,
        taskCallbacksEnabled: true,
        managerReviewEnabled: true,
        reviewReplyMessagingEnabled: true,
        reviewIntakeEnabled: true,
        dashboardEnabled: true,
        alertsEnabled: true,
        alertWorkflowEnabled: true
      };
    }

    return JSON.parse(fs.readFileSync(STARTUP_PATH, "utf8"));
  } catch (error) {
    return {
      appName: "AI Command Console",
      version: "36.0",
      safeMode: true,
      debugMode: false,
      pluginsEnabled: true,
      memoryEnabled: true,
      planningEnabled: true,
      agentsEnabled: true,
      multiAgentEnabled: true,
      taskQueueEnabled: true,
      managerEnabled: true,
      autoDelegationEnabled: true,
      schedulerEnabled: true,
      watcherEnabled: true,
      messagingEnabled: true,
      messageTaskWorkflowEnabled: true,
      taskCallbacksEnabled: true,
      managerReviewEnabled: true,
      reviewReplyMessagingEnabled: true,
      reviewIntakeEnabled: true,
      dashboardEnabled: true,
      alertsEnabled: true,
      alertWorkflowEnabled: true,
      configError: error.message
    };
  }
}

const startup = loadStartupConfig();

function printBanner() {
  console.log("====================================");
  console.log(`${startup.appName} v${startup.version}`);
  console.log("====================================");
  console.log(`Safe Mode: ${startup.safeMode ? "ON" : "OFF"}`);
  console.log(`Debug Mode: ${startup.debugMode ? "ON" : "OFF"}`);
  console.log(`Agents: ${startup.agentsEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Multi-Agent: ${startup.multiAgentEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Task Queue: ${startup.taskQueueEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Manager: ${startup.managerEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Auto Delegation: ${startup.autoDelegationEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Scheduler: ${startup.schedulerEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Watcher: ${startup.watcherEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Messaging: ${startup.messagingEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Message Task Workflow: ${startup.messageTaskWorkflowEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Task Callbacks: ${startup.taskCallbacksEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Manager Review: ${startup.managerReviewEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Review Reply Messaging: ${startup.reviewReplyMessagingEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Review Intake: ${startup.reviewIntakeEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Dashboard: ${startup.dashboardEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Alerts: ${startup.alertsEnabled ? "ENABLED" : "DISABLED"}`);
  console.log(`Alert Workflow: ${startup.alertWorkflowEnabled ? "ENABLED" : "DISABLED"}`);

  if (startup.configError) {
    console.log(`Config Warning: ${startup.configError}`);
  }

  console.log("");
  console.log("Commands:");
  console.log("  help");
  console.log("  exit");
  console.log("  agents:list");
  console.log("  manager:start");
  console.log("  manager:route <task>");
  console.log("  manager:status");
  console.log("  agent:start <name> [goal]");
  console.log("  agent:tick <name>");
  console.log("  agent:status <name>");
  console.log("  agent:stop <name>");
  console.log("  agent:assign <name> <task>");
  console.log("  queue:list");
  console.log("  queue:next <agentName>");
  console.log("  queue:clear");
  console.log("  schedule:start <agentName> [intervalSeconds] [maxCycles]");
  console.log("  schedule:list");
  console.log("  schedule:status <agentName>");
  console.log("  schedule:stop <agentName>");
  console.log("  schedule:run <agentName>");
  console.log("  watcher:start [intervalSeconds]");
  console.log("  watcher:stop");
  console.log("  watcher:status");
  console.log("  watcher:list");
  console.log("  watcher:run");
  console.log("  msg:send <fromAgent> <toAgent> <message>");
  console.log("  msg:inbox <agentName>");
  console.log("  msg:unread <agentName>");
  console.log("  msg:read <agentName> <messageId>");
  console.log("  msg:escalate <fromAgent> <message>");
  console.log("  msg:task <agentName> <messageId>");
  console.log("  msg:task:auto <messageId>");
  console.log("  msg:task:status <agentName> <messageId>");
  console.log("  msg:escalations");
  console.log("  callbacks:list");
  console.log("  callbacks:task <taskId>");
  console.log("  review:list");
  console.log("  review:task <taskId>");
  console.log("  review:approve <taskId>");
  console.log("  review:revise <taskId> <note>");
  console.log("  review:followup <taskId> <agentName> <task>");
  console.log("  review:replies");
  console.log("  review:reply <taskId>");
  console.log("  review:ack <agentName> <messageId>");
  console.log("  review:ack:status <agentName> <messageId>");
  console.log("  review:taskify <agentName> <messageId>");
  console.log("  review:taskify:auto <messageId>");
  console.log("  dashboard:system");
  console.log("  dashboard:agent <agentName>");
  console.log("  dashboard:health");
  console.log("  dashboard:workload");
  console.log("  dashboard:reviews");
  console.log("  alerts:run");
  console.log("  alerts:list");
  console.log("  alerts:active");
  console.log("  alerts:clear");
  console.log("  alerts:open");
  console.log("  alerts:status <alertId>");
  console.log("  alerts:ack <alertId> [owner]");
  console.log("  alerts:note <alertId> <note>");
  console.log("  alerts:resolve <alertId> <note>");
  console.log("");
}

function printHelp() {
  console.log("");
  console.log("Available Commands");
  console.log("------------------");
  console.log("help");
  console.log("  Show this help menu.");
  console.log("");
  console.log("exit");
  console.log("  Exit the console.");
  console.log("");
  console.log("agents:list");
  console.log("  List available local agent profiles.");
  console.log("");
  console.log("manager:start");
  console.log("  Start the manager agent.");
  console.log("");
  console.log("manager:route <task>");
  console.log("  Route a task automatically to the best specialist.");
  console.log("");
  console.log("manager:status");
  console.log("  Show saved state for the manager agent.");
  console.log("");
  console.log("agent:start <name> [goal]");
  console.log("  Start an autonomous agent with an optional goal override.");
  console.log("");
  console.log("agent:tick <name>");
  console.log("  Execute exactly one bounded autonomous step.");
  console.log("");
  console.log("agent:status <name>");
  console.log("  Show saved agent state.");
  console.log("");
  console.log("agent:stop <name>");
  console.log("  Stop the agent safely.");
  console.log("");
  console.log("agent:assign <name> <task>");
  console.log("  Add a task to the queue for a specific agent.");
  console.log("");
  console.log("queue:list");
  console.log("  Show queued, claimed, and completed tasks.");
  console.log("");
  console.log("queue:next <agentName>");
  console.log("  Preview the next queued task for a specific agent.");
  console.log("");
  console.log("queue:clear");
  console.log("  Remove all tasks from the queue.");
  console.log("");
  console.log("schedule:start <agentName> [intervalSeconds] [maxCycles]");
  console.log("  Start a bounded repeating schedule for an agent.");
  console.log("");
  console.log("schedule:list");
  console.log("  Show all scheduler entries.");
  console.log("");
  console.log("schedule:status <agentName>");
  console.log("  Show scheduler state for a specific agent.");
  console.log("");
  console.log("schedule:stop <agentName>");
  console.log("  Stop the schedule for an agent.");
  console.log("");
  console.log("schedule:run <agentName>");
  console.log("  Execute one scheduler-controlled tick immediately.");
  console.log("");
  console.log("watcher:start [intervalSeconds]");
  console.log("  Start the queue watcher loop.");
  console.log("");
  console.log("watcher:stop");
  console.log("  Stop the queue watcher loop.");
  console.log("");
  console.log("watcher:status");
  console.log("  Show watcher state.");
  console.log("");
  console.log("watcher:list");
  console.log("  Show watcher rules.");
  console.log("");
  console.log("watcher:run");
  console.log("  Run one watcher evaluation immediately.");
  console.log("");
  console.log("msg:send <fromAgent> <toAgent> <message>");
  console.log("  Send a structured message from one agent to another.");
  console.log("");
  console.log("msg:inbox <agentName>");
  console.log("  Show all messages for an agent.");
  console.log("");
  console.log("msg:unread <agentName>");
  console.log("  Show unread messages for an agent.");
  console.log("");
  console.log("msg:read <agentName> <messageId>");
  console.log("  Mark a message as read and display it.");
  console.log("");
  console.log("msg:escalate <fromAgent> <message>");
  console.log("  Send an escalation message directly to manager.");
  console.log("");
  console.log("msg:task <agentName> <messageId>");
  console.log("  Convert a specific inbox message into a queue task.");
  console.log("");
  console.log("msg:task:auto <messageId>");
  console.log("  Automatically convert a message into the best queue task target.");
  console.log("");
  console.log("msg:task:status <agentName> <messageId>");
  console.log("  Show task conversion state for a message.");
  console.log("");
  console.log("msg:escalations");
  console.log("  Show manager escalation messages.");
  console.log("");
  console.log("callbacks:list");
  console.log("  Show tasks with callback tracking.");
  console.log("");
  console.log("callbacks:task <taskId>");
  console.log("  Show callback state for a specific task.");
  console.log("");
  console.log("review:list");
  console.log("  Show manager review items.");
  console.log("");
  console.log("review:task <taskId>");
  console.log("  Show manager review state for a completed task.");
  console.log("");
  console.log("review:approve <taskId>");
  console.log("  Approve a completed task.");
  console.log("");
  console.log("review:revise <taskId> <note>");
  console.log("  Request revision for a completed task.");
  console.log("");
  console.log("review:followup <taskId> <agentName> <task>");
  console.log("  Create a follow-up task from a manager review item.");
  console.log("");
  console.log("review:replies");
  console.log("  Show review items that have sent worker replies.");
  console.log("");
  console.log("review:reply <taskId>");
  console.log("  Show review reply state for a specific task.");
  console.log("");
  console.log("review:ack <agentName> <messageId>");
  console.log("  Record worker acknowledgment of a manager review reply.");
  console.log("");
  console.log("review:ack:status <agentName> <messageId>");
  console.log("  Show acknowledgment and intake state for a review reply message.");
  console.log("");
  console.log("review:taskify <agentName> <messageId>");
  console.log("  Convert a manager review reply into a new task for the worker.");
  console.log("");
  console.log("review:taskify:auto <messageId>");
  console.log("  Automatically locate and taskify a manager review reply.");
  console.log("");
  console.log("dashboard:system");
  console.log("  Show a unified system summary.");
  console.log("");
  console.log("dashboard:agent <agentName>");
  console.log("  Show dashboard state for one agent.");
  console.log("");
  console.log("dashboard:health");
  console.log("  Show operational health summary.");
  console.log("");
  console.log("dashboard:workload");
  console.log("  Show workload rollup for all agents.");
  console.log("");
  console.log("dashboard:reviews");
  console.log("  Show review summary snapshot.");
  console.log("");
  console.log("alerts:run");
  console.log("  Run operational alert checks immediately.");
  console.log("");
  console.log("alerts:list");
  console.log("  Show all current alerts in persisted alert state.");
  console.log("");
  console.log("alerts:active");
  console.log("  Show active alerts only.");
  console.log("");
  console.log("alerts:clear");
  console.log("  Mark all current alerts as cleared.");
  console.log("");
  console.log("alerts:open");
  console.log("  Show unresolved and still-open alerts.");
  console.log("");
  console.log("alerts:status <alertId>");
  console.log("  Show detailed workflow state for one alert.");
  console.log("");
  console.log("alerts:ack <alertId> [owner]");
  console.log("  Acknowledge an alert and optionally assign an owner.");
  console.log("");
  console.log("alerts:note <alertId> <note>");
  console.log("  Add an operator note to an alert.");
  console.log("");
  console.log("alerts:resolve <alertId> <note>");
  console.log("  Resolve a specific alert and record a resolution note.");
  console.log("");
}

function formatState(state) {
  if (!state) {
    return "No state found.";
  }

  return [
    `Name: ${state.name || "unknown"}`,
    `Active: ${state.active ? "yes" : "no"}`,
    `Status: ${state.status || "unknown"}`,
    `Goal: ${state.goal || "(none)"}`,
    `Step Count: ${state.stepCount || 0}/${state.maxSteps || 0}`,
    `Current Task: ${state.currentTask ? `${state.currentTask.id} -> ${state.currentTask.description}` : "(none)"}`,
    `Created: ${state.createdAt || "(not set)"}`,
    `Updated: ${state.updatedAt || "(not set)"}`,
    `Last Run: ${state.lastRunAt || "(not yet run)"}`,
    `Last Result: ${state.lastResult ? JSON.stringify(state.lastResult) : "(none)"}`,
    `Plan: ${Array.isArray(state.lastPlan) ? state.lastPlan.join(" | ") : "(none)"}`,
    `Recent Notes: ${Array.isArray(state.notes) ? state.notes.slice(-3).join(" || ") : "(none)"}`
  ].join("\n");
}

function formatAgents(agents) {
  if (!Array.isArray(agents) || !agents.length) {
    return "No agent profiles found.";
  }

  return agents.map((agent) => {
    return [
      `- ${agent.name || "unknown"}`,
      `  Role: ${agent.role || "(none)"}`,
      `  Description: ${agent.description || "(none)"}`,
      `  Max Steps: ${agent.maxStepsPerRun || 0}`,
      `  Tags: ${Array.isArray(agent.tags) ? agent.tags.join(", ") : "(none)"}`
    ].join("\n");
  }).join("\n");
}

function formatQueue(tasks) {
  if (!Array.isArray(tasks) || !tasks.length) {
    return "Task queue is empty.";
  }

  return tasks.map((task) => {
    return [
      `ID: ${task.id}`,
      `  Agent: ${task.agentName}`,
      `  Status: ${task.status}`,
      `  Priority: ${task.priority ?? 3}`,
      `  Source Agent: ${task.sourceAgent || "user"}`,
      `  Delegation Reason: ${task.delegationReason || "(none)"}`,
      `  Tags: ${Array.isArray(task.tags) ? task.tags.join(", ") : "(none)"}`,
      `  Source Message ID: ${task.sourceMessageId || "(none)"}`,
      `  Source Inbox Agent: ${task.sourceInboxAgent || "(none)"}`,
      `  Callback Notify Agent: ${task.callback?.notifyAgent || "(none)"}`,
      `  Callback Sent At: ${task.callback?.callbackSentAt || "(not sent)"}`,
      `  Task: ${task.description}`,
      `  Created: ${task.createdAt}`,
      `  Claimed: ${task.claimedAt || "(not claimed)"}`,
      `  Completed: ${task.completedAt || "(not completed)"}`,
      `  Result: ${task.result || "(none)"}`
    ].join("\n");
  }).join("\n\n");
}

function formatSchedules(schedules) {
  if (!Array.isArray(schedules) || !schedules.length) {
    return "No schedules found.";
  }

  return schedules.map((schedule) => {
    return [
      `Agent: ${schedule.agentName}`,
      `  Enabled: ${schedule.enabled ? "yes" : "no"}`,
      `  Interval Seconds: ${schedule.intervalSeconds}`,
      `  Max Cycles: ${schedule.maxCycles}`,
      `  Cycle Count: ${schedule.cycleCount}`,
      `  Last Run: ${schedule.lastRunAt || "(not yet run)"}`,
      `  Last Result: ${schedule.lastResult ? JSON.stringify(schedule.lastResult) : "(none)"}`,
      `  Last Error: ${schedule.lastError || "(none)"}`,
      `  Stop Reason: ${schedule.stopReason || "(none)"}`,
      `  Created: ${schedule.createdAt || "(not set)"}`,
      `  Updated: ${schedule.updatedAt || "(not set)"}`
    ].join("\n");
  }).join("\n\n");
}

function formatWatcher(state) {
  if (!state) {
    return "No watcher state found.";
  }

  return [
    `Enabled: ${state.enabled ? "yes" : "no"}`,
    `Interval Seconds: ${state.intervalSeconds}`,
    `Last Run: ${state.lastRunAt || "(not yet run)"}`,
    `Last Error: ${state.lastError || "(none)"}`,
    `Last Result: ${state.lastResult ? JSON.stringify(state.lastResult) : "(none)"}`,
    `Rule Count: ${Array.isArray(state.rules) ? state.rules.length : 0}`,
    `History Count: ${Array.isArray(state.history) ? state.history.length : 0}`,
    `Updated: ${state.updatedAt || "(not set)"}`
  ].join("\n");
}

function formatWatcherRules(rules) {
  if (!Array.isArray(rules) || !rules.length) {
    return "No watcher rules found.";
  }

  return rules.map((rule) => {
    return [
      `Rule: ${rule.name}`,
      `  Enabled: ${rule.enabled ? "yes" : "no"}`,
      `  Agent: ${rule.agentName}`,
      `  Min Queued Tasks: ${rule.minQueuedTasks}`,
      `  Schedule Interval Seconds: ${rule.scheduleIntervalSeconds}`,
      `  Schedule Max Cycles: ${rule.scheduleMaxCycles}`
    ].join("\n");
  }).join("\n\n");
}

function formatMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    return "No messages found.";
  }

  return messages.map((message) => {
    const actionState = message.actionState || {};
    const reviewIntake = message.reviewIntake || {};

    return [
      `ID: ${message.id}`,
      `  From: ${message.fromAgent}`,
      `  To: ${message.toAgent}`,
      `  Status: ${message.status}`,
      `  Created: ${message.createdAt}`,
      `  Read At: ${message.readAt || "(unread)"}`,
      `  Converted To Task: ${actionState.convertedToTask ? "yes" : "no"}`,
      `  Task ID: ${actionState.taskId || "(none)"}`,
      `  Task Agent: ${actionState.taskAgent || "(none)"}`,
      `  Action Type: ${actionState.actionType || "(none)"}`,
      `  Review Acknowledged: ${reviewIntake.acknowledged ? "yes" : "no"}`,
      `  Review Ack At: ${reviewIntake.acknowledgedAt || "(not acknowledged)"}`,
      `  Review Taskified: ${reviewIntake.taskified ? "yes" : "no"}`,
      `  Review Intake Task ID: ${reviewIntake.intakeTaskId || "(none)"}`,
      `  Review Intake Type: ${reviewIntake.intakeType || "(none)"}`,
      `  Message: ${message.body}`
    ].join("\n");
  }).join("\n\n");
}

function formatMessageTaskStatus(result) {
  if (!result || !result.ok) {
    return result?.message || "No status found.";
  }

  const actionState = result.actionState || {};
  return [
    result.message,
    `Converted To Task: ${actionState.convertedToTask ? "yes" : "no"}`,
    `Task ID: ${actionState.taskId || "(none)"}`,
    `Task Agent: ${actionState.taskAgent || "(none)"}`,
    `Action Type: ${actionState.actionType || "(none)"}`,
    `Converted At: ${actionState.convertedAt || "(not converted)"}`,
    `Notes: ${Array.isArray(actionState.notes) && actionState.notes.length ? actionState.notes.map((n) => n.note).join(" | ") : "(none)"}`
  ].join("\n");
}

function formatCallbackStatus(result) {
  if (!result || !result.ok) {
    return result?.message || "No callback state found.";
  }

  const task = result.task || {};
  const callback = task.callback || {};

  return [
    result.message,
    `Task ID: ${task.id || "(none)"}`,
    `Agent: ${task.agentName || "(none)"}`,
    `Status: ${task.status || "(none)"}`,
    `Notify Agent: ${callback.notifyAgent || "(none)"}`,
    `Callback Enabled: ${callback.enabled ? "yes" : "no"}`,
    `Callback Message ID: ${callback.callbackMessageId || "(none)"}`,
    `Callback Sent At: ${callback.callbackSentAt || "(not sent)"}`,
    `Callback Summary: ${callback.callbackSummary || "(none)"}`
  ].join("\n");
}

function formatReviewItems(items) {
  if (!Array.isArray(items) || !items.length) {
    return "No review items found.";
  }

  return items.map((item) => {
    return [
      `Review ID: ${item.id}`,
      `  Task ID: ${item.taskId}`,
      `  Agent: ${item.agentName}`,
      `  Status: ${item.status}`,
      `  Decision: ${item.decision || "(none)"}`,
      `  Decision Note: ${item.decisionNote || "(none)"}`,
      `  Follow-up Task ID: ${item.followupTaskId || "(none)"}`,
      `  Callback Message ID: ${item.callbackMessageId || "(none)"}`,
      `  Review Reply Sent: ${item.reviewReply?.sent ? "yes" : "no"}`,
      `  Review Reply Type: ${item.reviewReply?.replyType || "(none)"}`,
      `  Review Reply Message ID: ${item.reviewReply?.messageId || "(none)"}`,
      `  Review Reply Sent At: ${item.reviewReply?.sentAt || "(not sent)"}`,
      `  Task: ${item.taskDescription || "(none)"}`,
      `  Result: ${item.taskResult || "(none)"}`,
      `  Created: ${item.createdAt || "(not set)"}`,
      `  Reviewed At: ${item.reviewedAt || "(not reviewed)"}`
    ].join("\n");
  }).join("\n\n");
}

function formatReviewAckStatus(result) {
  if (!result || !result.ok) {
    return result?.message || "No review intake state found.";
  }

  const intake = result.reviewIntake || {};
  return [
    result.message,
    `Acknowledged: ${intake.acknowledged ? "yes" : "no"}`,
    `Acknowledged At: ${intake.acknowledgedAt || "(not acknowledged)"}`,
    `Taskified: ${intake.taskified ? "yes" : "no"}`,
    `Taskified At: ${intake.taskifiedAt || "(not taskified)"}`,
    `Intake Task ID: ${intake.intakeTaskId || "(none)"}`,
    `Intake Agent: ${intake.intakeAgent || "(none)"}`,
    `Intake Type: ${intake.intakeType || "(none)"}`,
    `Notes: ${Array.isArray(intake.notes) && intake.notes.length ? intake.notes.map((n) => n.note).join(" | ") : "(none)"}`
  ].join("\n");
}

function formatAlerts(alerts) {
  if (!Array.isArray(alerts) || !alerts.length) {
    return "No alerts found.";
  }

  return alerts.map((alert) => {
    const workflow = alert.workflow || {};
    return [
      `Alert ID: ${alert.id}`,
      `  Type: ${alert.type}`,
      `  Severity: ${alert.severity}`,
      `  Status: ${alert.status}`,
      `  Title: ${alert.title}`,
      `  Details: ${JSON.stringify(alert.details || {})}`,
      `  Acknowledged: ${workflow.acknowledged ? "yes" : "no"}`,
      `  Acknowledged At: ${workflow.acknowledgedAt || "(not acknowledged)"}`,
      `  Owner: ${workflow.owner || "(unassigned)"}`,
      `  Resolved: ${workflow.resolved ? "yes" : "no"}`,
      `  Resolved At: ${workflow.resolvedAt || "(not resolved)"}`,
      `  Resolution Note: ${workflow.resolutionNote || "(none)"}`,
      `  Notes: ${Array.isArray(workflow.notes) && workflow.notes.length ? workflow.notes.map((n) => n.note).join(" | ") : "(none)"}`,
      `  Created: ${alert.createdAt || "(not set)"}`,
      `  Cleared At: ${alert.clearedAt || "(active)"}`
    ].join("\n");
  }).join("\n\n");
}

function formatSimpleObject(obj) {
  return JSON.stringify(obj, null, 2);
}

async function handleCommand(input) {
  const trimmed = String(input || "").trim();

  if (!trimmed) {
    return;
  }

  if (trimmed === "help") {
    printHelp();
    return;
  }

  if (trimmed === "exit") {
    console.log("Exiting AI Command Console.");
    process.exit(0);
  }

  if (trimmed === "agents:list") {
    try {
      console.log(formatAgents(listAgentProfiles()));
    } catch (error) {
      console.log(`Failed to list agents: ${error.message}`);
    }
    return;
  }

  if (trimmed === "manager:start") {
    if (!startup.managerEnabled) {
      console.log("Manager system is disabled in config/startup.json");
      return;
    }

    try {
      const result = await startAgent("manager");
      console.log(result.message);
      console.log(formatState(result.state));
    } catch (error) {
      console.log(`Manager start failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("manager:route ")) {
    if (!startup.autoDelegationEnabled) {
      console.log("Auto delegation is disabled in config/startup.json");
      return;
    }

    const taskText = trimmed.replace("manager:route ", "").trim();

    if (!taskText) {
      console.log("Task cannot be empty.");
      return;
    }

    try {
      const result = routeManagerTask(taskText);
      console.log(`Manager routed task to "${result.routing.agentName}".`);
      console.log(`Priority: ${result.routing.priority}`);
      console.log(`Reason: ${result.routing.delegationReason}`);
      console.log(`Task ID: ${result.task.id}`);
    } catch (error) {
      console.log(`Manager routing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "manager:status") {
    try {
      console.log(formatState(getAgentStatus("manager").state));
    } catch (error) {
      console.log(`Manager status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("agent:start ")) {
    if (!startup.agentsEnabled) {
      console.log("Agent system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("agent:start ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    let agentName = remainder;
    let goal = "";

    if (firstSpace !== -1) {
      agentName = remainder.slice(0, firstSpace).trim();
      goal = remainder.slice(firstSpace + 1).trim();
    }

    try {
      const result = await startAgent(agentName, goal);
      console.log(result.message);
      console.log(formatState(result.state));
    } catch (error) {
      console.log(`Agent start failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("agent:tick ")) {
    if (!startup.agentsEnabled) {
      console.log("Agent system is disabled in config/startup.json");
      return;
    }

    const agentName = trimmed.replace("agent:tick ", "").trim();

    try {
      const result = await tickAgent(agentName);
      console.log(result.message);

      if (result.step) {
        console.log(`Step: ${result.step}`);
      }
      if (result.result) {
        console.log(`Result: ${JSON.stringify(result.result)}`);
      }
      if (result.completedTask) {
        console.log(`Completed Task: ${result.completedTask.id} -> ${result.completedTask.description}`);
      }
      if (result.callbackResult) {
        console.log(result.callbackResult.message);
      }
      if (result.state) {
        console.log(formatState(result.state));
      }
    } catch (error) {
      console.log(`Agent tick failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("agent:status ")) {
    if (!startup.agentsEnabled) {
      console.log("Agent system is disabled in config/startup.json");
      return;
    }

    try {
      const agentName = trimmed.replace("agent:status ", "").trim();
      console.log(formatState(getAgentStatus(agentName).state));
    } catch (error) {
      console.log(`Agent status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("agent:stop ")) {
    if (!startup.agentsEnabled) {
      console.log("Agent system is disabled in config/startup.json");
      return;
    }

    try {
      const agentName = trimmed.replace("agent:stop ", "").trim();
      const result = stopAgent(agentName);
      console.log(result.message);
      console.log(formatState(result.state));
    } catch (error) {
      console.log(`Agent stop failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("agent:assign ")) {
    if (!startup.taskQueueEnabled) {
      console.log("Task queue system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("agent:assign ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: agent:assign <name> <task>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const taskText = remainder.slice(firstSpace + 1).trim();

    if (!taskText) {
      console.log("Task cannot be empty.");
      return;
    }

    try {
      const task = addTask(agentName, taskText, {
        sourceAgent: "user",
        priority: 3,
        delegationReason: "Direct manual assignment by user.",
        tags: ["manual"],
        notifyAgent: "manager"
      });
      console.log(`Task added for agent "${agentName}".`);
      console.log(`Task ID: ${task.id}`);
      console.log(`Task: ${task.description}`);
    } catch (error) {
      console.log(`Task assignment failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "queue:list") {
    try {
      console.log(formatQueue(listTasks()));
    } catch (error) {
      console.log(`Queue listing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("queue:next ")) {
    const agentName = trimmed.replace("queue:next ", "").trim();

    try {
      const task = peekNextTask(agentName);
      if (!task) {
        console.log(`No queued task found for agent "${agentName}".`);
        return;
      }
      console.log(formatQueue([task]));
    } catch (error) {
      console.log(`Queue preview failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "queue:clear") {
    try {
      clearQueue();
      console.log("Task queue cleared.");
    } catch (error) {
      console.log(`Queue clear failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("schedule:start ")) {
    if (!startup.schedulerEnabled) {
      console.log("Scheduler system is disabled in config/startup.json");
      return;
    }

    const parts = trimmed.replace("schedule:start ", "").trim().split(/\s+/);
    const agentName = parts[0];
    const intervalSeconds = parts[1] ? Number(parts[1]) : 5;
    const maxCycles = parts[2] ? Number(parts[2]) : 5;

    if (!agentName) {
      console.log("Usage: schedule:start <agentName> [intervalSeconds] [maxCycles]");
      return;
    }

    try {
      console.log(`Schedule started for "${agentName}".`);
      console.log(formatSchedules([startSchedule(agentName, intervalSeconds, maxCycles)]));
    } catch (error) {
      console.log(`Schedule start failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "schedule:list") {
    try {
      console.log(formatSchedules(listSchedules()));
    } catch (error) {
      console.log(`Schedule list failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("schedule:status ")) {
    const agentName = trimmed.replace("schedule:status ", "").trim();

    try {
      const schedule = getSchedule(agentName);
      if (!schedule) {
        console.log(`No schedule found for agent "${agentName}".`);
        return;
      }
      console.log(formatSchedules([schedule]));
    } catch (error) {
      console.log(`Schedule status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("schedule:stop ")) {
    const agentName = trimmed.replace("schedule:stop ", "").trim();

    try {
      const schedule = stopSchedule(agentName, "stopped_by_user");
      if (!schedule) {
        console.log(`No schedule found for agent "${agentName}".`);
        return;
      }
      console.log(`Schedule stopped for "${agentName}".`);
      console.log(formatSchedules([schedule]));
    } catch (error) {
      console.log(`Schedule stop failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("schedule:run ")) {
    const agentName = trimmed.replace("schedule:run ", "").trim();

    try {
      const result = await runScheduledTick(agentName);
      console.log(result.message);

      if (result.result && result.result.result) {
        console.log(`Result: ${JSON.stringify(result.result.result)}`);
      }
      if (result.schedule) {
        console.log(formatSchedules([result.schedule]));
      }
    } catch (error) {
      console.log(`Schedule run failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("watcher:start")) {
    if (!startup.watcherEnabled) {
      console.log("Watcher system is disabled in config/startup.json");
      return;
    }

    const parts = trimmed.split(/\s+/);
    const intervalSeconds = parts[1] ? Number(parts[1]) : 5;

    try {
      console.log("Watcher started.");
      console.log(formatWatcher(startWatcher(intervalSeconds)));
    } catch (error) {
      console.log(`Watcher start failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "watcher:stop") {
    try {
      console.log("Watcher stopped.");
      console.log(formatWatcher(stopWatcher("stopped_by_user")));
    } catch (error) {
      console.log(`Watcher stop failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "watcher:status") {
    try {
      console.log(formatWatcher(getWatcherStatus()));
    } catch (error) {
      console.log(`Watcher status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "watcher:list") {
    try {
      console.log(formatWatcherRules(getWatcherStatus().rules));
    } catch (error) {
      console.log(`Watcher list failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "watcher:run") {
    try {
      const result = evaluateRules();
      console.log("Watcher evaluation complete.");
      console.log(JSON.stringify(result.decisions, null, 2));
      console.log(formatWatcher(result.state));
    } catch (error) {
      console.log(`Watcher run failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:send ")) {
    if (!startup.messagingEnabled) {
      console.log("Messaging system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("msg:send ", "").trim();
    const parts = remainder.split(/\s+/);

    if (parts.length < 3) {
      console.log("Usage: msg:send <fromAgent> <toAgent> <message>");
      return;
    }

    const fromAgent = parts[0];
    const toAgent = parts[1];
    const message = remainder.split(/\s+/).slice(2).join(" ").trim();

    try {
      console.log("Message sent.");
      console.log(formatMessages([sendMessage(fromAgent, toAgent, message)]));
    } catch (error) {
      console.log(`Message send failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:inbox ")) {
    try {
      console.log(formatMessages(listInbox(trimmed.replace("msg:inbox ", "").trim())));
    } catch (error) {
      console.log(`Inbox read failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:unread ")) {
    try {
      console.log(formatMessages(getUnreadMessages(trimmed.replace("msg:unread ", "").trim())));
    } catch (error) {
      console.log(`Unread message read failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:read ")) {
    const remainder = trimmed.replace("msg:read ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: msg:read <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      const message = readMessage(agentName, messageId);
      if (!message) {
        console.log(`Message not found: ${messageId}`);
        return;
      }
      console.log("Message marked as read.");
      console.log(formatMessages([message]));
    } catch (error) {
      console.log(`Message read failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:escalate ")) {
    const remainder = trimmed.replace("msg:escalate ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: msg:escalate <fromAgent> <message>");
      return;
    }

    const fromAgent = remainder.slice(0, firstSpace).trim();
    const message = remainder.slice(firstSpace + 1).trim();

    try {
      console.log("Escalation sent to manager.");
      console.log(formatMessages([escalateToManager(fromAgent, message)]));
    } catch (error) {
      console.log(`Escalation failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:task:auto ")) {
    if (!startup.messageTaskWorkflowEnabled) {
      console.log("Message task workflow is disabled in config/startup.json");
      return;
    }

    const messageId = trimmed.replace("msg:task:auto ", "").trim();

    try {
      const result = autoConvertMessage(messageId);
      console.log(result.message);

      if (result.task) {
        console.log(formatQueue([result.task]));
      }
      if (result.updatedMessage) {
        console.log(formatMessages([result.updatedMessage]));
      }
    } catch (error) {
      console.log(`Automatic message task conversion failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:task:status ")) {
    if (!startup.messageTaskWorkflowEnabled) {
      console.log("Message task workflow is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("msg:task:status ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: msg:task:status <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      console.log(formatMessageTaskStatus(getMessageTaskStatus(agentName, messageId)));
    } catch (error) {
      console.log(`Message task status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("msg:task ")) {
    if (!startup.messageTaskWorkflowEnabled) {
      console.log("Message task workflow is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("msg:task ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: msg:task <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      const result = convertMessageToTask(agentName, messageId);
      console.log(result.message);

      if (result.task) {
        console.log(formatQueue([result.task]));
      }
      if (result.updatedMessage) {
        console.log(formatMessages([result.updatedMessage]));
      }
    } catch (error) {
      console.log(`Message task conversion failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "msg:escalations") {
    if (!startup.messageTaskWorkflowEnabled) {
      console.log("Message task workflow is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatMessages(listManagerEscalations()));
    } catch (error) {
      console.log(`Escalation listing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "callbacks:list") {
    if (!startup.taskCallbacksEnabled) {
      console.log("Task callback system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatQueue(listTasksWithCallbacks()));
    } catch (error) {
      console.log(`Callback list failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("callbacks:task ")) {
    if (!startup.taskCallbacksEnabled) {
      console.log("Task callback system is disabled in config/startup.json");
      return;
    }

    const taskId = trimmed.replace("callbacks:task ", "").trim();

    try {
      console.log(formatCallbackStatus(getTaskCallbackStatus(taskId)));
    } catch (error) {
      console.log(`Callback status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "review:list") {
    if (!startup.managerReviewEnabled) {
      console.log("Manager review system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatReviewItems(listReviewItems()));
    } catch (error) {
      console.log(`Review list failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:task ")) {
    if (!startup.managerReviewEnabled) {
      console.log("Manager review system is disabled in config/startup.json");
      return;
    }

    const taskId = trimmed.replace("review:task ", "").trim();

    try {
      const item = getReviewItemByTaskId(taskId);
      if (!item) {
        console.log(`Review item not found for task "${taskId}".`);
        return;
      }
      console.log(formatReviewItems([item]));
    } catch (error) {
      console.log(`Review task lookup failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:approve ")) {
    if (!startup.managerReviewEnabled) {
      console.log("Manager review system is disabled in config/startup.json");
      return;
    }

    const taskId = trimmed.replace("review:approve ", "").trim();

    try {
      const result = approveReviewItem(taskId);
      console.log(result.message);

      if (result.replyResult) {
        console.log(result.replyResult.message);
      }
      if (result.item) {
        console.log(formatReviewItems([result.item]));
      }
    } catch (error) {
      console.log(`Review approval failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:revise ")) {
    if (!startup.managerReviewEnabled) {
      console.log("Manager review system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("review:revise ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: review:revise <taskId> <note>");
      return;
    }

    const taskId = remainder.slice(0, firstSpace).trim();
    const note = remainder.slice(firstSpace + 1).trim();

    try {
      const result = reviseReviewItem(taskId, note);
      console.log(result.message);

      if (result.replyResult) {
        console.log(result.replyResult.message);
      }
      if (result.item) {
        console.log(formatReviewItems([result.item]));
      }
    } catch (error) {
      console.log(`Review revision failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:followup ")) {
    if (!startup.managerReviewEnabled) {
      console.log("Manager review system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("review:followup ", "").trim();
    const parts = remainder.split(/\s+/);

    if (parts.length < 3) {
      console.log("Usage: review:followup <taskId> <agentName> <task>");
      return;
    }

    const taskId = parts[0];
    const agentName = parts[1];
    const taskText = parts.slice(2).join(" ").trim();

    try {
      const result = createFollowupTask(taskId, agentName, taskText);
      console.log(result.message);

      if (result.replyResult) {
        console.log(result.replyResult.message);
      }
      if (result.followupTask) {
        console.log(formatQueue([result.followupTask]));
      }
      if (result.item) {
        console.log(formatReviewItems([result.item]));
      }
    } catch (error) {
      console.log(`Review follow-up failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "review:replies") {
    if (!startup.reviewReplyMessagingEnabled) {
      console.log("Review reply messaging is disabled in config/startup.json");
      return;
    }

    try {
      const items = listReviewItems().filter((item) => item.reviewReply && item.reviewReply.sent);
      console.log(formatReviewItems(items));
    } catch (error) {
      console.log(`Review reply listing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:reply ")) {
    if (!startup.reviewReplyMessagingEnabled) {
      console.log("Review reply messaging is disabled in config/startup.json");
      return;
    }

    const taskId = trimmed.replace("review:reply ", "").trim();

    try {
      const item = getReviewItemByTaskId(taskId);
      if (!item) {
        console.log(`Review item not found for task "${taskId}".`);
        return;
      }
      console.log(formatReviewItems([item]));
    } catch (error) {
      console.log(`Review reply lookup failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:ack:status ")) {
    if (!startup.reviewIntakeEnabled) {
      console.log("Review intake system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("review:ack:status ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: review:ack:status <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      console.log(formatReviewAckStatus(getReviewAckStatus(agentName, messageId)));
    } catch (error) {
      console.log(`Review ack status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:ack ")) {
    if (!startup.reviewIntakeEnabled) {
      console.log("Review intake system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("review:ack ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: review:ack <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      const result = acknowledgeReviewReply(agentName, messageId);
      console.log(result.message);

      if (result.updatedMessage) {
        console.log(formatMessages([result.updatedMessage]));
      }
    } catch (error) {
      console.log(`Review acknowledgment failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:taskify:auto ")) {
    if (!startup.reviewIntakeEnabled) {
      console.log("Review intake system is disabled in config/startup.json");
      return;
    }

    const messageId = trimmed.replace("review:taskify:auto ", "").trim();

    try {
      const result = autoTaskifyReviewReply(messageId);
      console.log(result.message);

      if (result.task) {
        console.log(formatQueue([result.task]));
      }
      if (result.updatedMessage) {
        console.log(formatMessages([result.updatedMessage]));
      }
    } catch (error) {
      console.log(`Automatic review taskify failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("review:taskify ")) {
    if (!startup.reviewIntakeEnabled) {
      console.log("Review intake system is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("review:taskify ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: review:taskify <agentName> <messageId>");
      return;
    }

    const agentName = remainder.slice(0, firstSpace).trim();
    const messageId = remainder.slice(firstSpace + 1).trim();

    try {
      const result = taskifyReviewReply(agentName, messageId);
      console.log(result.message);

      if (result.task) {
        console.log(formatQueue([result.task]));
      }
      if (result.updatedMessage) {
        console.log(formatMessages([result.updatedMessage]));
      }
    } catch (error) {
      console.log(`Review taskify failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "dashboard:system") {
    if (!startup.dashboardEnabled) {
      console.log("Dashboard system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatSimpleObject(buildSystemSummary()));
    } catch (error) {
      console.log(`Dashboard system summary failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("dashboard:agent ")) {
    if (!startup.dashboardEnabled) {
      console.log("Dashboard system is disabled in config/startup.json");
      return;
    }

    const agentName = trimmed.replace("dashboard:agent ", "").trim();

    try {
      console.log(formatSimpleObject(getAgentDashboard(agentName)));
    } catch (error) {
      console.log(`Agent dashboard failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "dashboard:health") {
    if (!startup.dashboardEnabled) {
      console.log("Dashboard system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatSimpleObject(buildHealthSummary()));
    } catch (error) {
      console.log(`Dashboard health failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "dashboard:workload") {
    if (!startup.dashboardEnabled) {
      console.log("Dashboard system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatSimpleObject(buildWorkloadSummary()));
    } catch (error) {
      console.log(`Dashboard workload failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "dashboard:reviews") {
    if (!startup.dashboardEnabled) {
      console.log("Dashboard system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatSimpleObject(buildReviewSummary()));
    } catch (error) {
      console.log(`Dashboard reviews failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "alerts:run") {
    if (!startup.alertsEnabled) {
      console.log("Alerts system is disabled in config/startup.json");
      return;
    }

    try {
      const result = runAlertChecks();
      console.log(result.message);
      console.log(formatAlerts(result.state.alerts));
    } catch (error) {
      console.log(`Alert run failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "alerts:list") {
    if (!startup.alertsEnabled) {
      console.log("Alerts system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatAlerts(listAlerts()));
    } catch (error) {
      console.log(`Alert list failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "alerts:active") {
    if (!startup.alertsEnabled) {
      console.log("Alerts system is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatAlerts(listActiveAlerts()));
    } catch (error) {
      console.log(`Active alert listing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "alerts:clear") {
    if (!startup.alertsEnabled) {
      console.log("Alerts system is disabled in config/startup.json");
      return;
    }

    try {
      const state = clearAlerts();
      console.log("Alerts cleared.");
      console.log(formatAlerts(state.alerts));
    } catch (error) {
      console.log(`Alert clear failed: ${error.message}`);
    }
    return;
  }

  if (trimmed === "alerts:open") {
    if (!startup.alertWorkflowEnabled) {
      console.log("Alert workflow is disabled in config/startup.json");
      return;
    }

    try {
      console.log(formatAlerts(listOpenAlerts()));
    } catch (error) {
      console.log(`Open alert listing failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("alerts:status ")) {
    if (!startup.alertWorkflowEnabled) {
      console.log("Alert workflow is disabled in config/startup.json");
      return;
    }

    const alertId = trimmed.replace("alerts:status ", "").trim();

    try {
      const alert = getAlertById(alertId);
      if (!alert) {
        console.log(`Alert not found: ${alertId}`);
        return;
      }
      console.log(formatAlerts([alert]));
    } catch (error) {
      console.log(`Alert status failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("alerts:ack ")) {
    if (!startup.alertWorkflowEnabled) {
      console.log("Alert workflow is disabled in config/startup.json");
      return;
    }

    const parts = trimmed.replace("alerts:ack ", "").trim().split(/\s+/);
    const alertId = parts[0];
    const owner = parts[1] || null;

    if (!alertId) {
      console.log("Usage: alerts:ack <alertId> [owner]");
      return;
    }

    try {
      const result = acknowledgeAlert(alertId, owner);
      console.log(result.message);

      if (result.alert) {
        console.log(formatAlerts([result.alert]));
      }
    } catch (error) {
      console.log(`Alert acknowledgment failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("alerts:note ")) {
    if (!startup.alertWorkflowEnabled) {
      console.log("Alert workflow is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("alerts:note ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: alerts:note <alertId> <note>");
      return;
    }

    const alertId = remainder.slice(0, firstSpace).trim();
    const note = remainder.slice(firstSpace + 1).trim();

    try {
      const result = addAlertNote(alertId, note);
      console.log(result.message);

      if (result.alert) {
        console.log(formatAlerts([result.alert]));
      }
    } catch (error) {
      console.log(`Alert note failed: ${error.message}`);
    }
    return;
  }

  if (trimmed.startsWith("alerts:resolve ")) {
    if (!startup.alertWorkflowEnabled) {
      console.log("Alert workflow is disabled in config/startup.json");
      return;
    }

    const remainder = trimmed.replace("alerts:resolve ", "").trim();
    const firstSpace = remainder.indexOf(" ");

    if (firstSpace === -1) {
      console.log("Usage: alerts:resolve <alertId> <note>");
      return;
    }

    const alertId = remainder.slice(0, firstSpace).trim();
    const note = remainder.slice(firstSpace + 1).trim();

    try {
      const result = resolveAlert(alertId, note);
      console.log(result.message);

      if (result.alert) {
        console.log(formatAlerts([result.alert]));
      }
    } catch (error) {
      console.log(`Alert resolution failed: ${error.message}`);
    }
    return;
  }

  console.log(`Unknown command: ${trimmed}`);
  console.log(`Type "help" to see available commands.`);
}

async function main() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "AI> "
  });

  rl.prompt();

  rl.on("line", async (line) => {
    try {
      await handleCommand(line);
    } catch (error) {
      console.log(`Unhandled error: ${error.message}`);
    }
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Console closed.");
    process.exit(0);
  });
}

main();