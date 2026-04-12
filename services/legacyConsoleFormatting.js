function formatBriefs(briefs) {
  if (!briefs.length) {
    return "No research briefs found.";
  }

  return briefs
    .map((brief) =>
      [
        `ID: ${brief.id}`,
        `  Title: ${brief.title}`,
        `  Question: ${brief.question}`,
        `  Status: ${brief.status}`,
        `  Priority: ${brief.priority}`,
        `  Agent: ${brief.assignedAgent}`,
        `  Task: ${brief.linkedTaskId || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatReports(reports) {
  if (!reports.length) {
    return "No research reports found.";
  }

  return reports
    .map((report) =>
      [
        `ID: ${report.id}`,
        `  Title: ${report.title}`,
        `  Brief: ${report.briefId}`,
        `  Status: ${report.status}`,
        `  Format: ${report.format}`,
        `  Excerpt: ${report.excerpt || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatAgentProfiles(agents) {
  if (!agents.length) {
    return "No agent profiles found.";
  }

  return agents
    .map((agent) =>
      [
        `${agent.name}`,
        `  Role: ${agent.role}`,
        `  Goal: ${agent.defaultGoal}`,
        `  Capabilities: shell=${agent.allowShellExecution ? "yes" : "no"}, files=${agent.allowFileWrite ? "yes" : "no"}, planning=${agent.allowPlanning ? "yes" : "no"}`,
        `  Limits: maxSteps=${agent.maxStepsPerRun}, cooldown=${agent.cooldownSeconds}s`,
        `  Tags: ${(agent.tags || []).join(", ") || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatTasks(tasks) {
  if (!tasks.length) {
    return "No tasks found.";
  }

  return tasks
    .map((task) =>
      [
        `ID: ${task.id}`,
        `  Agent: ${task.agentName}`,
        `  Status: ${task.status}`,
        `  Priority: ${task.priority}`,
        `  Task: ${task.description}`,
        `  Created: ${task.createdAt}`,
        `  Result: ${task.result || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatSchedule(schedule) {
  if (!schedule) {
    return "Schedule not found.";
  }

  return [
    `Schedule: ${schedule.agentName}`,
    `  Enabled: ${schedule.enabled ? "yes" : "no"}`,
    `  Interval: ${schedule.intervalSeconds}s`,
    `  Cycles: ${schedule.cycleCount}/${schedule.maxCycles}`,
    `  Last Run: ${schedule.lastRunAt || "(never)"}`,
    `  Last Error: ${schedule.lastError || "(none)"}`,
    `  Stop Reason: ${schedule.stopReason || "(none)"}`,
  ].join("\n");
}

function formatWatcher(state) {
  return [
    "Watcher",
    `  Enabled: ${state.enabled ? "yes" : "no"}`,
    `  Interval: ${state.intervalSeconds}s`,
    `  Last Run: ${state.lastRunAt || "(never)"}`,
    `  Last Error: ${state.lastError || "(none)"}`,
    `  Rules: ${Array.isArray(state.rules) ? state.rules.length : 0}`,
  ].join("\n");
}

function formatAgentStatus(state) {
  if (!state) {
    return "Agent status unavailable.";
  }

  return [
    `Agent: ${state.agentName}`,
    `  Active: ${state.active ? "yes" : "no"}`,
    `  Status: ${state.status}`,
    `  Goal: ${state.goal || "(none)"}`,
    `  Current Task: ${state.currentTask?.description || "(none)"}`,
    `  Step Count: ${state.stepCount || 0}/${state.maxSteps || 0}`,
    `  Last Run: ${state.lastRunAt || "(never)"}`,
  ].join("\n");
}

function formatObjectBlock(title, value) {
  return [title, JSON.stringify(value, null, 2)].join("\n");
}

module.exports = {
  formatBriefs,
  formatReports,
  formatAgentProfiles,
  formatTasks,
  formatSchedule,
  formatWatcher,
  formatAgentStatus,
  formatObjectBlock,
};
