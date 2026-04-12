async function executeLegacyConsoleCommand(rawCommand, options = {}, deps) {
  const {
    ensureJobProcessorsRegistered,
    getResearchWorkspace,
    formatLegacyConsoleHelp,
    formatAgentProfiles,
    listAgentProfiles,
    formatAgentStatus,
    getAgentStatus,
    startAgent,
    tickAgent,
    stopAgent,
    routeManagerTask,
    formatTasks,
    formatBriefs,
    listBriefs,
    createBriefRecord,
    enqueueJob,
    getActor,
    formatReports,
    listReports,
    listTasks,
    peekNextTask,
    formatObjectBlock,
    buildSystemSummary,
    buildHealthSummary,
    buildWorkloadSummary,
    getAgentDashboard,
    listSchedules,
    formatSchedule,
    getSchedule,
    runScheduledTick,
    formatWatcher,
    getWatcherStatus,
    addReviewItemForTask,
    listReviewItems,
    loadCollaborationState,
    buildApprovalTrustSignals,
    buildApprovalTrustDashboard,
    getEnvironmentPolicy,
    buildApprovalTrustTrends,
    buildApprovalTrustEnvironmentSummaries,
    buildInbox,
    buildNotificationHistory,
    buildNotificationDigest,
    formatInbox,
    buildOwnershipSignals,
    formatNotificationDigest,
    formatNotificationHistory,
    buildOverview,
    formatTrustReport,
    formatOwnershipSignals,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth,
    buildDigestAutomationAlerts,
    listAlerts,
    listActiveAlerts,
    formatPlugins,
    listPlugins,
  } = deps;

  ensureJobProcessorsRegistered();
  const trimmed = String(rawCommand || "").trim();
  const workspace = getResearchWorkspace(options);

  if (!trimmed || trimmed === "help") {
    return formatLegacyConsoleHelp();
  }

  if (trimmed === "agents:list") return formatAgentProfiles(listAgentProfiles());
  if (trimmed.startsWith("agent:status ")) return formatAgentStatus(getAgentStatus(trimmed.replace("agent:status ", "").trim()).state);

  if (trimmed.startsWith("agent:start ")) {
    const remainder = trimmed.replace("agent:start ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const agentName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const goal = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const result = await startAgent(agentName, goal);
    return [result.message, formatAgentStatus(result.state)].join("\n\n");
  }

  if (trimmed.startsWith("agent:tick ")) {
    const result = await tickAgent(trimmed.replace("agent:tick ", "").trim());
    return [result.message, result.step ? `Step: ${result.step}` : null, result.result?.summary || null].filter(Boolean).join("\n");
  }

  if (trimmed.startsWith("agent:stop ")) {
    const result = stopAgent(trimmed.replace("agent:stop ", "").trim());
    return [result.message, formatAgentStatus(result.state)].join("\n\n");
  }

  if (trimmed.startsWith("manager:route ")) {
    const taskText = trimmed.replace("manager:route ", "").trim();
    const result = routeManagerTask(taskText);
    return [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, formatTasks([result.task])].join("\n\n");
  }

  if (trimmed === "brief:list") {
    return formatBriefs(listBriefs(workspace));
  }

  if (trimmed.startsWith("brief:create ")) {
    const remainder = trimmed.replace("brief:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use brief:create <title> | <question>");
    }
    const brief = createBriefRecord(workspace, {
      title: parts[0],
      question: parts[1],
      status: "draft",
    });
    return formatBriefs([brief]);
  }

  if (trimmed.startsWith("brief:route ")) {
    const briefId = trimmed.replace("brief:route ", "").trim();
    const job = enqueueJob("brief:route", { workspace, briefId }, getActor(options));
    return `Queued brief routing as ${job.id}.`;
  }

  if (trimmed === "report:list") {
    return formatReports(listReports(workspace));
  }

  if (trimmed.startsWith("report:create ")) {
    const remainder = trimmed.replace("report:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use report:create <briefId> | <title>");
    }
    const job = enqueueJob("report:create", { workspace, briefId: parts[0], title: parts[1], status: "draft" }, getActor(options));
    return `Queued report draft creation as ${job.id}.`;
  }

  if (trimmed.startsWith("report:publish ")) {
    const reportId = trimmed.replace("report:publish ", "").trim();
    const job = enqueueJob("report:publish", { workspace, reportId }, getActor(options));
    return `Queued report publish as ${job.id}.`;
  }

  if (trimmed === "queue:list") return formatTasks(listTasks());
  if (trimmed.startsWith("queue:next ")) return formatTasks([peekNextTask(trimmed.replace("queue:next ", "").trim())].filter(Boolean));
  if (trimmed === "dashboard:system") return formatObjectBlock("System Summary", buildSystemSummary());
  if (trimmed === "dashboard:health") return formatObjectBlock("Health Summary", buildHealthSummary());
  if (trimmed === "dashboard:workload") return formatObjectBlock("Workload Summary", { agents: buildWorkloadSummary() });
  if (trimmed.startsWith("dashboard:agent ")) return formatObjectBlock(`Agent Dashboard: ${trimmed.replace("dashboard:agent ", "").trim()}`, getAgentDashboard(trimmed.replace("dashboard:agent ", "").trim()));

  if (trimmed === "schedule:list") {
    const schedules = listSchedules();
    return schedules.length ? schedules.map((schedule) => formatSchedule(schedule)).join("\n\n") : "No schedules found.";
  }

  if (trimmed.startsWith("schedule:status ")) return formatSchedule(getSchedule(trimmed.replace("schedule:status ", "").trim()));

  if (trimmed.startsWith("schedule:run ")) {
    const result = await runScheduledTick(trimmed.replace("schedule:run ", "").trim());
    return [result.message, result.schedule ? formatSchedule(result.schedule) : null].filter(Boolean).join("\n\n");
  }

  if (trimmed === "watcher:status") return formatWatcher(getWatcherStatus());
  if (trimmed === "watcher:run") {
    const job = enqueueJob("watcher:run", {}, getActor(options));
    return `Queued watcher run as ${job.id}.`;
  }
  if (trimmed.startsWith("review:create ")) {
    const result = addReviewItemForTask(trimmed.replace("review:create ", "").trim());
    return result.message;
  }
  if (trimmed === "review:list") {
    const reviews = listReviewItems();
    return reviews.length ? formatObjectBlock("Review Queue", { items: reviews }) : "No review items found.";
  }
  if (trimmed === "inbox:list") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatInbox(getActor(options), collaboration, buildOwnershipSignals(workspace), [], trustSignals, buildInbox);
  }
  if (trimmed === "inbox:digest") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatNotificationDigest(
      getActor(options),
      collaboration,
      buildOwnershipSignals(workspace),
      [],
      trustSignals,
      buildInbox,
      buildNotificationHistory,
      buildNotificationDigest,
    );
  }
  if (trimmed === "inbox:history") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatNotificationHistory(
      getActor(options),
      collaboration,
      buildOwnershipSignals(workspace),
      [],
      trustSignals,
      buildNotificationHistory,
    );
  }
  if (trimmed === "trust:report") {
    const overview = buildOverview(options);
    return formatTrustReport(overview.collaboration);
  }
  if (trimmed === "ownership:signals") return formatOwnershipSignals(buildOwnershipSignals(workspace));
  if (trimmed === "alerts:list" || trimmed === "alerts:active" || trimmed === "digest:health") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const digestAutomationAlerts = buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth);

    if (trimmed === "alerts:list") {
      return formatObjectBlock("Alerts", { alerts: [...digestAutomationAlerts, ...listAlerts()] });
    }

    if (trimmed === "alerts:active") {
      return formatObjectBlock("Active Alerts", { alerts: [...digestAutomationAlerts, ...listActiveAlerts()] });
    }

    return formatObjectBlock("Digest Automation Health", {
      scheduler: digestScheduler,
      workspaces: digestWorkspaceHealth,
      alerts: digestAutomationAlerts,
    });
  }
  if (trimmed === "alerts:run") {
    const job = enqueueJob("alerts:run", {}, getActor(options));
    return `Queued alert sweep as ${job.id}.`;
  }
  if (trimmed === "plugins") return formatPlugins(listPlugins());
  if (trimmed.startsWith("run plugin ")) {
    const remainder = trimmed.replace("run plugin ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const pluginName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const pluginArg = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const job = enqueueJob("plugin:run", { name: pluginName, pluginArg }, getActor(options));
    return `Queued plugin ${pluginName} as ${job.id}.`;
  }

  throw new Error(`Unknown command: ${trimmed}`);
}

module.exports = {
  executeLegacyConsoleCommand,
};
