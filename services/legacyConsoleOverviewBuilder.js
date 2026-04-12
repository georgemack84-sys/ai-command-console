function extractAlertWorkflowField(alert, key, fallback = null) {
  if (alert.workflow && typeof alert.workflow === "object" && key in alert.workflow) {
    return alert.workflow[key];
  }

  return fallback;
}

function buildLegacyOverview(options = {}, deps) {
  deps.ensureJobProcessorsRegistered();
  const system = deps.buildSystemSummary();
  const health = deps.buildHealthSummary();
  const tasks = deps.listTasks();
  const reviews = deps.listReviewItems();
  const schedules = deps.listSchedules();
  const watcher = deps.getWatcherStatus();
  const alertState = deps.loadAlertsState();
  const automationPolicy = deps.loadAutomationPolicy();
  const alerts = deps.listAlerts();
  const activeAlerts = deps.listActiveAlerts();
  const plugins = deps.listPlugins();
  let collaboration = deps.loadCollaborationState();
  const actor = deps.getActor(options);
  const workspace = deps.getResearchWorkspace(options);
  const environmentPolicy = deps.getEnvironmentPolicy(collaboration.governance);
  const ownershipSignals = deps.buildOwnershipSignals(workspace);
  const digestPreferences = deps.getDigestPreferences(actor.id);
  const digestRuns = deps.listDigestRuns(actor.id).slice(0, 8);
  const digestScheduler = deps.getDigestSchedulerStatus();
  let digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
  let delegatedApprovalReminder = false;
  let autoReroutedApproval = false;
  digestWorkspaceHealth.forEach((workspaceHealth) => {
    const rerouted = deps.autoRerouteIncidentApproval(workspaceHealth);
    if (rerouted) {
      autoReroutedApproval = true;
      return;
    }
    const created = deps.ensureIncidentApprovalDelegation(workspaceHealth, collaboration);
    if (created) {
      delegatedApprovalReminder = true;
    }
  });
  if (delegatedApprovalReminder || autoReroutedApproval) {
    collaboration = deps.loadCollaborationState();
    digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
    if (autoReroutedApproval) {
      let delegatedAfterReroute = false;
      digestWorkspaceHealth.forEach((workspaceHealth) => {
        const created = deps.ensureIncidentApprovalDelegation(workspaceHealth, collaboration);
        if (created) {
          delegatedAfterReroute = true;
        }
      });
      if (delegatedAfterReroute) {
        collaboration = deps.loadCollaborationState();
        digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
      }
    }
  }
  const digestAutomationAlerts = deps.buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth);
  const digestEscalations = deps.buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const incidentApprovalPressure = deps.buildIncidentApprovalPressure(digestWorkspaceHealth);
  const approvalThroughput = deps.buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth);
  const approvalPolicyRecommendations = deps.buildApprovalPolicyRecommendations(
    incidentApprovalPressure,
    approvalThroughput,
    environmentPolicy,
    digestWorkspaceHealth,
    deps.getLegacyAnalyticsDeps()
  );
  const recommendationObservations = deps.observeApprovalPolicyRecommendations(
    approvalPolicyRecommendations,
    environmentPolicy,
    deps.getLegacyGovernanceDeps()
  );
  if (recommendationObservations.length) {
    collaboration = deps.loadCollaborationState();
  }
  const autoPromoted = deps.autoPromoteApprovalRecommendations(
    { id: "system", name: "System", role: "admin" },
    approvalPolicyRecommendations,
    environmentPolicy,
    options,
    deps.getLegacyGovernanceDeps()
  );
  if (autoPromoted) {
    collaboration = deps.loadCollaborationState();
  }
  const finalApprovalPolicyRecommendations = autoPromoted
    ? deps.buildApprovalPolicyRecommendations(
        deps.buildIncidentApprovalPressure(digestWorkspaceHealth),
        deps.buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth),
        environmentPolicy,
        digestWorkspaceHealth,
        deps.getLegacyAnalyticsDeps()
      )
    : approvalPolicyRecommendations;
  const appliedApprovalPolicies = (Array.isArray(collaboration.governance?.appliedApprovalPolicies)
    ? collaboration.governance.appliedApprovalPolicies
    : []
  ).map((item) => ({
    ...item,
    impact: deps.evaluateAppliedApprovalPolicyImpact(item, incidentApprovalPressure, approvalThroughput),
  }));
  const trustAlertAcks = Array.isArray(collaboration.governance?.approvalTrustAlertAcks)
    ? collaboration.governance.approvalTrustAlertAcks
    : [];
  const approvalTrustDashboard = deps.buildApprovalTrustDashboard(
    appliedApprovalPolicies,
    Array.isArray(collaboration.governance?.approvalRecommendationObservations)
      ? collaboration.governance.approvalRecommendationObservations
      : [],
    environmentPolicy,
    trustAlertAcks
  );
  const approvalTrustHistory = deps.recordApprovalTrustSnapshot(
    collaboration.governance,
    approvalTrustDashboard,
    environmentPolicy,
    deps.getLegacyTrustLifecycleDeps()
  );
  if (approvalTrustHistory.length) {
    collaboration = deps.loadCollaborationState();
  }
  const approvalTrustEnvironments = deps.buildApprovalTrustEnvironmentSummaries({
    ...collaboration.governance,
    appliedApprovalPolicies,
  });
  const approvalTrustTrends = deps.buildApprovalTrustTrends(
    {
      ...collaboration.governance,
      approvalTrustHistory,
    },
    approvalTrustEnvironments
  );
  const approvalTrustSignals = deps.buildApprovalTrustSignals(approvalTrustDashboard, approvalTrustTrends);
  digestWorkspaceHealth.forEach((workspaceHealth) => {
    const promotedTrustIncident = deps.promoteTrustDropToIncident(
      workspaceHealth.workspaceId,
      collaboration,
      approvalTrustSignals,
      deps.getLegacyTrustLifecycleDeps()
    );
    const recoveredTrustIncident = deps.recoverTrustIncident(
      workspaceHealth.workspaceId,
      collaboration,
      approvalTrustSignals,
      deps.getLegacyTrustLifecycleDeps()
    );
    const requestedRecoveredTrustCloseout = deps.requestRecoveredTrustIncidentCloseout(
      workspaceHealth.workspaceId,
      collaboration,
      deps.getLegacyTrustLifecycleDeps()
    );
    if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
      collaboration = deps.loadCollaborationState();
    }
  });
  if (Array.isArray(collaboration.governance?.appliedApprovalPolicies)) {
    digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
  }
  const approvalRecommendationFamilies = deps.buildApprovalRecommendationFamilyHistory(
    finalApprovalPolicyRecommendations,
    appliedApprovalPolicies,
    Array.isArray(collaboration.governance?.approvalRecommendationObservations)
      ? collaboration.governance.approvalRecommendationObservations
      : [],
    approvalTrustSignals
  );
  const completedTrustIncidents = deps.buildCompletedTrustIncidents(digestWorkspaceHealth);
  const completedTrustEnvironments = deps.buildCompletedTrustEnvironmentSummaries(completedTrustIncidents);
  const environmentTrustRecaps = deps.buildEnvironmentTrustRecaps(
    approvalTrustEnvironments,
    approvalTrustSignals,
    completedTrustEnvironments
  );
  const defaultPolicyPlaybookPresets = deps.listDefaultPolicyPlaybookPresets();
  const policyPlaybookRollouts = Array.isArray(collaboration.governance?.workspacePolicyPlaybookRollouts)
    ? collaboration.governance.workspacePolicyPlaybookRollouts
    : [];
  const policyPlaybookAdoption = deps.buildPolicyPlaybookAdoptionSummary(
    policyPlaybookRollouts,
    Array.isArray(collaboration.governance?.workspacePolicyPlaybooks)
      ? collaboration.governance.workspacePolicyPlaybooks
      : [],
    defaultPolicyPlaybookPresets,
    digestWorkspaceHealth,
    completedTrustIncidents
  );
  const globalOperations = deps.buildGlobalOperationsSummary(
    digestWorkspaceHealth,
    digestEscalations,
    incidentApprovalPressure,
    approvalTrustEnvironments,
    approvalTrustSignals,
    completedTrustIncidents,
    policyPlaybookRollouts
  );
  const automationFollowups = deps.listAutomationFollowups(workspace);
  const inbox = deps.buildInbox(actor, collaboration, ownershipSignals, digestEscalations, approvalTrustSignals);
  const notificationHistory = deps.buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, approvalTrustSignals);
  const notificationDigest = deps.buildNotificationDigest(inbox, notificationHistory);
  const jobs = deps.listJobs(12);
  const jobMetrics = deps.buildJobMetrics(60);
  const workload = deps.buildWorkloadSummary().map((agent) => ({
    agentName: agent.agentName,
    status: agent.status,
    active: agent.active,
    queuedTasks: agent.queuedTasks,
    claimedTasks: agent.claimedTasks,
    unreadCount: agent.unreadCount,
    updatedAt: agent.updatedAt,
  }));
  const agentDetails = workload.map((agent) => {
    const state = deps.loadAgentState(agent.agentName);
    const profile = deps.readAgentProfile(agent.agentName);
    const schedule = schedules.find((item) => item.agentName === agent.agentName) || null;
    const relatedTasks = tasks.filter((item) => item.agentName === agent.agentName);

    return {
      agentName: agent.agentName,
      profile: {
        role: profile.role,
        description: profile.description,
        defaultGoal: profile.defaultGoal,
        maxStepsPerRun: profile.maxStepsPerRun,
        cooldownSeconds: profile.cooldownSeconds,
        allowShellExecution: Boolean(profile.allowShellExecution),
        allowFileWrite: Boolean(profile.allowFileWrite),
        allowPlanning: Boolean(profile.allowPlanning),
        tags: Array.isArray(profile.tags) ? profile.tags : [],
      },
      runtime: {
        active: Boolean(state.active),
        status: state.status || "unknown",
        goal: state.goal || "",
        currentTask: state.currentTask || null,
        lastRunAt: state.lastRunAt || null,
        stepCount: state.stepCount || 0,
        maxSteps: state.maxSteps || profile.maxStepsPerRun || 0,
      },
      schedule: schedule
        ? {
            enabled: schedule.enabled,
            cycleCount: schedule.cycleCount,
            maxCycles: schedule.maxCycles,
            intervalSeconds: schedule.intervalSeconds,
            lastRunAt: schedule.lastRunAt,
            lastError: schedule.lastError,
            stopReason: schedule.stopReason,
          }
        : null,
      observability: {
        queuedTasks: relatedTasks.filter((item) => item.status === "queued").length,
        claimedTasks: relatedTasks.filter((item) => item.status === "claimed").length,
        completedTasks: relatedTasks.filter((item) => item.status === "completed").length,
        pendingReviews: reviews.filter((item) => item.agentName === agent.agentName && item.status === "pending").length,
      },
      recentHistory: Array.isArray(state.history) ? state.history.slice(-8).reverse() : [],
      recentNotes: Array.isArray(state.notes) ? state.notes.slice(-6).reverse() : [],
    };
  });

  return {
    system: {
      agentCount: system.agentCount,
      totalTasks: system.totalTasks,
      queuedTasks: system.queuedTasks,
      claimedTasks: system.claimedTasks,
      completedTasks: system.completedTasks,
      activeSchedules: system.activeSchedules,
      watcherEnabled: system.watcherEnabled,
    },
    health: {
      overall: health.overall,
      queuePressure: health.queuePressure,
      reviewPressure: health.reviewPressure,
      watcherStatus: health.watcherStatus,
    },
    queue: tasks.slice(0, 12).map((task) => ({
      id: task.id,
      agentName: task.agentName,
      status: task.status,
      priority: task.priority,
      description: task.description,
      createdAt: task.createdAt,
      result: task.result,
    })),
    reviews: reviews.slice(0, 12).map((item) => ({
      id: item.id,
      taskId: item.taskId,
      agentName: item.agentName,
      status: item.status,
      decision: item.decision,
      decisionNote: item.decisionNote,
      taskDescription: item.taskDescription,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
    })),
    schedules: schedules.map((schedule) => ({
      agentName: schedule.agentName,
      enabled: schedule.enabled,
      cycleCount: schedule.cycleCount,
      maxCycles: schedule.maxCycles,
      intervalSeconds: schedule.intervalSeconds,
      lastRunAt: schedule.lastRunAt,
      lastError: schedule.lastError,
      stopReason: schedule.stopReason,
    })),
    watcher: {
      enabled: watcher.enabled,
      intervalSeconds: watcher.intervalSeconds,
      lastRunAt: watcher.lastRunAt,
      lastError: watcher.lastError,
      ruleCount: Array.isArray(watcher.rules) ? watcher.rules.length : 0,
      rules: Array.isArray(watcher.rules)
        ? watcher.rules.map((rule) => ({
            name: rule.name,
            agentName: rule.agentName,
            minQueuedTasks: rule.minQueuedTasks,
            scheduleIntervalSeconds: rule.scheduleIntervalSeconds,
            scheduleMaxCycles: rule.scheduleMaxCycles,
            enabled: rule.enabled,
          }))
        : [],
    },
    alerts: {
      activeCount: activeAlerts.length + digestAutomationAlerts.length,
      items: [...digestAutomationAlerts, ...activeAlerts].slice(0, 8).map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        owner: extractAlertWorkflowField(alert, "owner", null),
        acknowledged: Boolean(extractAlertWorkflowField(alert, "acknowledged", false)),
        resolutionNote: extractAlertWorkflowField(alert, "resolutionNote", null),
      })),
      all: [...digestAutomationAlerts, ...alerts].slice(0, 12).map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        owner: extractAlertWorkflowField(alert, "owner", null),
        acknowledged: Boolean(extractAlertWorkflowField(alert, "acknowledged", false)),
        resolved: Boolean(extractAlertWorkflowField(alert, "resolved", false)),
        createdAt: alert.createdAt,
      })),
    },
    plugins: plugins.map((plugin) => ({
      name: plugin.name,
      loaded: plugin.loaded,
      description: plugin.description,
      error: plugin.error,
    })),
    workload,
    agentDetails,
    trust: {
      lastWatcherRunAt: watcher.lastRunAt,
      lastWatcherError: watcher.lastError,
      pendingReviews: reviews.filter((item) => item.status === "pending").length,
      activeAlerts: activeAlerts.length + digestAutomationAlerts.length,
      schedulesWithErrors: schedules.filter((item) => item.lastError).length,
    },
    recommendations: deps.buildRecommendations(workspace, [...digestAutomationAlerts, ...activeAlerts]),
    ownershipSignals,
    activity: deps.readRecentManagerEvents(12),
    automation: {
      alertThresholds: alertState.thresholds,
      policy: automationPolicy,
    },
    telemetry: deps.buildTelemetrySummary(),
    jobs: {
      total: jobs.length,
      queued: jobs.filter((job) => job.status === "queued").length,
      running: jobs.filter((job) => job.status === "running").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      metrics: jobMetrics,
      items: jobs,
    },
    collaboration: {
      governance: {
        ...collaboration.governance,
        defaultPolicyPlaybookPresets,
      },
      sharedSessions: collaboration.sharedSessions.slice(0, 12),
      handoffs: collaboration.handoffs.slice(0, 12),
      approvals: collaboration.approvals.slice(0, 12),
      inbox,
      notificationHistory,
      notificationDigest,
      digestPreferences,
      digestRuns,
      digestScheduler,
      digestEscalations: digestEscalations.slice(0, 8),
      digestWorkspaceHealth: digestWorkspaceHealth.slice(0, 8),
      incidentApprovalPressure,
      approvalThroughput,
      approvalPolicyRecommendations: finalApprovalPolicyRecommendations,
      appliedApprovalPolicies: appliedApprovalPolicies.slice(0, 8),
      approvalRecommendationObservations: Array.isArray(collaboration.governance?.approvalRecommendationObservations)
        ? collaboration.governance.approvalRecommendationObservations.slice(0, 8)
        : [],
      approvalTrustDashboard,
      approvalTrustEnvironments,
      approvalTrustTrends,
      approvalTrustSignals,
      approvalRecommendationFamilies,
      completedTrustIncidents,
      completedTrustEnvironments,
      environmentTrustRecaps,
      globalOperations,
      policyPlaybookAdoption,
      automationFollowups,
      currentUser: actor,
      permissions: {
        canExecuteCommands: deps.canExecuteCommands(actor.role, collaboration.governance),
        canApprove: deps.canApproveInEnvironment(actor.role, collaboration.governance),
        canManageGovernance: deps.canManageGovernanceInEnvironment(actor.role, collaboration.governance),
      },
      environmentPolicy,
    },
  };
}

module.exports = {
  buildLegacyOverview,
};
