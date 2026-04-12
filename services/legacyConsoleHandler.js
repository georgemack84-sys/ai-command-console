// Legacy terminal handler implementation.
// Product-facing overview, command, and action flows have been extracted into
// typed services under src/server/services. Keep new app features out of this
// file and prefer routing remaining behavior through console-runtime adapters
// or the narrow services/legacyConsoleCompat.js facade.
const { buildSystemSummary, buildHealthSummary, buildWorkloadSummary, getAgentDashboard } = require("./dashboard");
const path = require("path");
const { startAgent, tickAgent, getAgentStatus, stopAgent, listAgentProfiles, routeManagerTask } = require("./agentRuntime");
const { listTasks, peekNextTask, addTask } = require("./taskQueue");
const { listSchedules, getSchedule, runScheduledTick } = require("./scheduler");
const { getWatcherStatus, evaluateRules, startWatcher, stopWatcher, updateWatcherRule, addWatcherRule, removeWatcherRule } = require("./watcher");
const { listReviewItems, addReviewItemForTask, approveReviewItem, reviseReviewItem, createFollowupTask } = require("./reviewQueue");
const { listAlerts, listActiveAlerts, runAlertChecks, acknowledgeAlert, addAlertNote, resolveAlert, updateAlertThresholds, loadAlertsState } = require("./alerts");
const { appendAuditEvent, listAuditEvents } = require("./auditTrail");
const { listPlugins, runPlugin } = require("./pluginLoader");
const { listBriefs, saveBriefs, listReports, saveReports } = require("./researchDesk");
const { loadAgentState } = require("./agentMemory");
const { readAgentProfile, updateAgentProfile } = require("./agentProfiles");
const { loadAutomationPolicy, updateAutomationPolicy } = require("./automationPolicy");
const { buildTelemetrySummary, recordTelemetry } = require("./telemetry");
const { registerJobProcessor, enqueueJob, listJobs, buildJobMetrics, cancelJob, retryJob, getJob } = require("./jobQueue");
const {
  normalizeRole,
  canUseConsoleAction,
  getEnvironmentPolicy,
  requiresIncidentApproval,
  canExecuteCommands,
  canApproveInEnvironment,
  canManageGovernanceInEnvironment,
} = require("./permissions");
const {
  loadCollaborationState,
  upsertSharedSession,
  createHandoff,
  closeHandoff,
  createApprovalRequest,
  getApprovalRequest,
  resolveApprovalRequest,
  updateApprovalRequest,
  updateGovernance,
  updateInboxItemState,
  recordInboxHistoryItem,
  getDigestPreferences,
  updateDigestPreferences,
  listDigestRuns,
  recordDigestRun,
  getDigestWorkspaceState,
  updateDigestWorkspaceState,
  appendDigestWorkspaceEvent,
} = require("./collaboration");
const { getDigestSchedulerStatus } = require("./digestScheduler");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getWorkspaceDataPath } = require("./runtimePaths");
const { handleLegacyCoreAction } = require("./legacyConsoleCoreActions");
const { handleLegacyCollaborationAction } = require("./legacyConsoleCollaborationActions");
const { handleLegacyAutomationAction } = require("./legacyConsoleAutomationActions");
const { handleLegacyApprovalAction } = require("./legacyConsoleApprovalActions");
const { handleLegacyApprovalRequest } = require("./legacyConsoleApprovalRequests");
const { executeLegacyConsoleCommand } = require("./legacyConsoleCommands");
const {
  recordApprovalTrustSnapshot,
  applyTrustEscalationPolicy,
  promoteTrustDropToIncident,
  recoverTrustIncident,
  requestRecoveredTrustIncidentCloseout,
  finalizeRecoveredTrustIncidentCloseout,
  buildTrustArchiveRationale,
  finalizeArchivedTrustIncident,
} = require("./legacyConsoleTrustLifecycle");
const {
  selectBulkAutomationWorkspaces,
  parseAutomationInboxItem,
  listAutomationFollowups,
  buildOwnershipSignals,
  queueDueDigestSweepIfNeeded: queueDueDigestSweepIfNeededImpl,
} = require("./legacyConsoleOperationsSupport");
const {
  buildAutomationResolutionByWorkspace,
  buildIncidentApprovalsByWorkspace,
  buildDigestWorkspaceHealth,
  buildDigestAutomationAlerts,
  buildDigestEscalationSignals,
  buildIncidentApprovalPressure,
  buildApprovalThroughputAnalytics,
} = require("./legacyConsoleOverviewSupport");
const { buildLegacyRecommendations } = require("./legacyConsoleRecommendations");
const { buildLegacyOverview } = require("./legacyConsoleOverviewBuilder");
const { createLegacyConsoleRequestHandlers } = require("./legacyConsoleRequestHandlers");
const {
  generateWorkspaceIncidentSummary,
  defaultIncidentChecklist,
  updateIncidentChecklistItem,
  getIncidentPolicy,
  getIncidentTransitionState,
  validateIncidentStatusChange,
  canActorHandleApproval,
  buildIncidentApprovalSla,
  closeIncidentApprovalReminderHandoffs,
  reroutePendingApproval,
  ensureIncidentApprovalDelegation,
  autoRerouteIncidentApproval,
  selectAdaptiveApprovalTarget,
} = require("./legacyConsoleIncidentSupport");
const {
  buildApprovalTrustDashboard,
  buildApprovalTrustEnvironmentSummaries,
  buildApprovalTrustTrends,
  buildApprovalTrustSignals,
  buildApprovalRecommendationFamilyHistory,
  buildCompletedTrustIncidents,
  buildCompletedTrustEnvironmentSummaries,
  buildEnvironmentTrustRecaps,
  filterTrustCollaborationScope,
} = require("./legacyConsoleTrustRead");
const {
  buildTrustSignalsForGovernance,
  buildDigestRun,
  shouldGenerateDigestForUser,
  runDueDigestsForWorkspace,
} = require("./legacyConsoleDigest");
const {
  buildApprovalPolicyRecommendations,
  summarizeApprovalPolicyRecommendationEffect,
  buildApprovalPolicyMetricsSnapshot,
  evaluateAppliedApprovalPolicyImpact,
  summarizeWorkspacePolicyOverride,
  normalizePolicyPlaybookPayload,
  listDefaultPolicyPlaybookPresets,
  summarizePolicyPlaybookRollouts,
  buildPolicyPlaybookAdoptionSummary,
  buildGlobalOperationsSummary,
} = require("./legacyConsoleAnalytics");
const {
  acknowledgeApprovalTrustAlert,
  restartApprovalRecommendationObservation,
  extendApprovalRecommendationCooldown,
  observeApprovalPolicyRecommendations,
  applyApprovalPolicyRecommendationChange,
  rollbackApprovalPolicyPromotion,
  autoPromoteApprovalRecommendations,
} = require("./legacyConsoleGovernanceActions");
const {
  normalizeTarget,
  extractTargets,
  buildActorTargets,
  matchesTargets,
  buildInbox,
  buildNotificationHistory,
  buildNotificationDigest,
} = require("./legacyConsoleInbox");
const {
  formatTrustReport,
  formatOwnershipSignals,
  formatInbox,
  formatNotificationHistory,
  formatNotificationDigest,
} = require("./legacyConsoleCollaborationFormatting");
const {
  formatBriefs,
  formatReports,
  formatAgentProfiles,
  formatTasks,
  formatSchedule,
  formatWatcher,
  formatAgentStatus,
  formatObjectBlock,
} = require("./legacyConsoleFormatting");
const {
  listWorkspaceRoutes,
  listWorkspaceUsers,
  getWorkspaceName,
  listAllWorkspaceIds,
  computeDigestSchedulerStaleState,
  createBriefRecord,
  createReportRecord,
  queueBriefToTask,
  publishReportRecord,
} = require("./legacyConsoleWorkspaceSupport");
const {
  getResearchWorkspace: resolveResearchWorkspace,
  getActor: resolveActor,
  listWorkspaceRoutesFor: resolveWorkspaceRoutes,
  listWorkspaceUsersFor: resolveWorkspaceUsers,
  getWorkspaceNameFor: resolveWorkspaceName,
  listAllWorkspaceIdsFor: resolveAllWorkspaceIds,
  createBriefRecordFor: createBriefRecordFromSupport,
  createReportRecordFor: createReportRecordFromSupport,
  queueBriefToTaskFor: queueBriefToTaskFromSupport,
  createReportDraft: createReportDraftFromSupport,
  publishReportRecordFor: publishReportRecordFromSupport,
} = require("./legacyConsoleHandlerSupport");
const terminalCommandCatalog = require("../src/data/terminal-command-catalog.json");

const ROUTES_PATH = getWorkspaceDataPath("workspace-user-routes.json");
const USERS_PATH = getWorkspaceDataPath("workspace-users.json");

function getResearchWorkspace(options = {}) {
  return resolveResearchWorkspace(options);
}

function getActor(options = {}) {
  return resolveActor(options, { normalizeRole });
}

function listWorkspaceRoutesFor(workspaceId) {
  return resolveWorkspaceRoutes(workspaceId, {
    listWorkspaceRoutes,
    loadWorkspaceDocument,
    routesPath: ROUTES_PATH,
  });
}

function listWorkspaceUsersFor(workspaceId) {
  return resolveWorkspaceUsers(workspaceId, {
    listWorkspaceUsers,
    loadWorkspaceDocument,
    usersPath: USERS_PATH,
  });
}

function getWorkspaceNameFor(workspaceId) {
  return resolveWorkspaceName(workspaceId, {
    getWorkspaceName,
    loadWorkspaceDocument,
    usersPath: USERS_PATH,
  });
}

function listAllWorkspaceIdsFor() {
  return resolveAllWorkspaceIds({
    listAllWorkspaceIds,
    loadWorkspaceDocument,
    usersPath: USERS_PATH,
    loadCollaborationState,
  });
}

function createBriefRecordFor(workspaceId, payload = {}) {
  return createBriefRecordFromSupport(workspaceId, payload, {
    createBriefRecord,
    listBriefs,
    saveBriefs,
  });
}

function createReportRecordFor(workspaceId, payload = {}) {
  return createReportRecordFromSupport(workspaceId, payload, {
    createReportRecord,
    listReports,
    saveReports,
  });
}

function queueBriefToTaskFor(workspaceId, briefId) {
  return queueBriefToTaskFromSupport(workspaceId, briefId, {
    queueBriefToTask,
    listBriefs,
    saveBriefs,
    addTask,
  });
}

function createReportDraft(workspaceId, payload = {}) {
  return createReportDraftFromSupport(workspaceId, payload, {
    createReportRecord: createReportRecord,
    listReports,
    saveReports,
    listBriefs,
    saveBriefs,
  });
}

function publishReportRecordFor(workspaceId, reportId) {
  return publishReportRecordFromSupport(workspaceId, reportId, {
    publishReportRecord,
    listReports,
    saveReports,
    listBriefs,
    saveBriefs,
  });
}

function getLegacyOperationsSupportDeps() {
  return {
    listTasks,
    listBriefs,
    listReports,
    listWorkspaceRoutes: listWorkspaceRoutesFor,
    listWorkspaceUsers: listWorkspaceUsersFor,
    loadCollaborationState,
    buildTrustSignalsForGovernance,
    shouldGenerateDigestForUser,
    getDigestWorkspaceState,
    listJobs,
    enqueueJob,
    updateDigestWorkspaceState,
    digestDeps: getLegacyDigestDeps(),
    promoteTrustDropToIncident: (workspaceId, collaboration, trustSignals = []) =>
      promoteTrustDropToIncident(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
    recoverTrustIncident: (workspaceId, collaboration, trustSignals = []) =>
      recoverTrustIncident(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
    requestRecoveredTrustIncidentCloseout: (workspaceId, collaboration) =>
      requestRecoveredTrustIncidentCloseout(workspaceId, collaboration, getLegacyTrustLifecycleDeps()),
    applyTrustEscalationPolicy: (workspaceId, collaboration, trustSignals = []) =>
      applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
  };
}

function getLegacyTrustLifecycleDeps() {
  return {
    updateGovernance,
    getEnvironmentPolicy,
    listAutomationFollowups: (workspaceId = null) => listAutomationFollowups(workspaceId, getLegacyOperationsSupportDeps()),
    addTask,
    appendDigestWorkspaceEvent,
    getDigestWorkspaceState,
    updateDigestWorkspaceState,
    updateIncidentChecklistItem: (workspaceId, itemId, updates = {}) =>
      updateIncidentChecklistItem(workspaceId, itemId, updates, getLegacyIncidentSupportDeps()),
    requiresIncidentApproval,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    getDigestSchedulerStatus,
    selectAdaptiveApprovalTarget: (workspaceId, requestedTarget, backupTarget, governance) =>
      selectAdaptiveApprovalTarget(
        workspaceId,
        requestedTarget,
        backupTarget,
        governance,
        getLegacyIncidentSupportDeps()
      ),
    createApprovalRequest,
    appendAuditEvent,
  };
}

function getLegacyIncidentSupportDeps() {
  return {
    getDigestWorkspaceState,
    defaultIncidentChecklist,
    updateDigestWorkspaceState,
    getEnvironmentPolicy,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    canApproveInEnvironment,
    matchesTargets,
    buildActorTargets,
    loadCollaborationState,
    closeHandoff,
    updateApprovalRequest,
    appendDigestWorkspaceEvent,
    appendAuditEvent,
    createHandoff,
    normalizeTarget,
    buildIncidentApprovalPressure,
    buildApprovalThroughputAnalytics: (collaboration, digestWorkspaceHealth = []) =>
      buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    getWorkspaceName: getWorkspaceNameFor,
  };
}

function getLegacyDigestDeps() {
  return {
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    buildDigestEscalationSignals: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    getEnvironmentPolicy,
    buildInbox,
    buildNotificationHistory,
    buildNotificationDigest,
    formatTrustReport,
    normalizeRole,
    getDigestPreferences,
    buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
    loadCollaborationState,
    listWorkspaceUsers: listWorkspaceUsersFor,
    promoteTrustDropToIncident: (workspaceId, collaboration, trustSignals = []) =>
      promoteTrustDropToIncident(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
    recoverTrustIncident: (workspaceId, collaboration, trustSignals = []) =>
      recoverTrustIncident(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
    requestRecoveredTrustIncidentCloseout: (workspaceId, collaboration) =>
      requestRecoveredTrustIncidentCloseout(workspaceId, collaboration, getLegacyTrustLifecycleDeps()),
    applyTrustEscalationPolicy: (workspaceId, collaboration, trustSignals = []) =>
      applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals, getLegacyTrustLifecycleDeps()),
    recordDigestRun,
    updateDigestWorkspaceState,
  };
}

function getLegacyGovernanceDeps() {
  return {
    loadCollaborationState,
    updateGovernance,
    summarizeApprovalPolicyRecommendationEffect,
    buildApprovalPolicyMetricsSnapshot: (payload) =>
      buildApprovalPolicyMetricsSnapshot(payload, getLegacyAnalyticsDeps()),
    getEnvironmentPolicy,
    getDigestWorkspaceState,
    updateDigestWorkspaceState,
    appendDigestWorkspaceEvent,
    appendAuditEvent,
    buildOverview,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    normalizeTarget,
  };
}

function getLegacyAnalyticsDeps() {
  return {
    listWorkspaceUsers: listWorkspaceUsersFor,
    normalizeRole,
    normalizeTarget,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    loadCollaborationState,
    buildIncidentApprovalPressure,
    buildApprovalThroughputAnalytics: (collaboration, digestWorkspaceHealth = []) =>
      buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
  };
}

function getLegacyOverviewSupportDeps() {
  return {
    listAutomationFollowups: (workspaceId = null) => listAutomationFollowups(workspaceId, getLegacyOperationsSupportDeps()),
    loadCollaborationState,
    listAllWorkspaceIds: listAllWorkspaceIdsFor,
    getIncidentPolicy: (governance = {}, workspaceId = null) =>
      getIncidentPolicy(governance, workspaceId, getLegacyIncidentSupportDeps()),
    listWorkspaceUsers: listWorkspaceUsersFor,
    getDigestPreferences,
    shouldGenerateDigestForUser,
    digestDeps: getLegacyDigestDeps(),
    getDigestWorkspaceState,
    defaultIncidentChecklist,
    getWorkspaceName: getWorkspaceNameFor,
    summarizeWorkspacePolicyOverride,
    getIncidentTransitionState: (workspaceHealth, governance = {}) =>
      getIncidentTransitionState(workspaceHealth, governance, getLegacyIncidentSupportDeps()),
    buildIncidentApprovalSla,
    computeDigestSchedulerStaleState,
  };
}

function queueDueDigestSweepIfNeeded(workspaceId, actor = { actorId: "system", actorName: "System" }) {
  return queueDueDigestSweepIfNeededImpl(workspaceId, actor, getLegacyOperationsSupportDeps());
}

function formatPlugins(plugins) {
  if (!plugins.length) {
    return "No plugins configured.";
  }

  return plugins
    .map((plugin) =>
      [
        `${plugin.name}`,
        `  Loaded: ${plugin.loaded ? "yes" : "no"}`,
        `  Description: ${plugin.description || "(none)"}`,
        `  Error: ${plugin.error || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function ensureJobProcessorsRegistered() {
  if (ensureJobProcessorsRegistered.ready) {
    return;
  }

  registerJobProcessor("watcher:run", async () => evaluateRules());
  registerJobProcessor("alerts:run", async () => runAlertChecks());
  registerJobProcessor("plugin:run", async (job) =>
    runPlugin(String(job.payload?.name || ""), {
      input: `run plugin ${String(job.payload?.name || "")}`.trim(),
      pluginArg: String(job.payload?.pluginArg || ""),
    })
  );
  registerJobProcessor("brief:route", async (job) => {
    const result = queueBriefToTaskFor(String(job.payload?.workspace || "demo"), String(job.payload?.briefId || ""));
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  });
  registerJobProcessor("report:create", async (job) =>
    createReportDraft(String(job.payload?.workspace || "demo"), job.payload || {})
  );
  registerJobProcessor("report:publish", async (job) => {
    const result = publishReportRecordFor(String(job.payload?.workspace || "demo"), String(job.payload?.reportId || ""));
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  });
  registerJobProcessor("digest:run-due", async (job) => {
    const workspace = String(job.payload?.workspace || "demo");
    try {
      return runDueDigestsForWorkspace(workspace, getLegacyDigestDeps());
    } catch (error) {
      updateDigestWorkspaceState(workspace, {
        lastSweepRunAt: new Date().toISOString(),
        lastSweepError: error instanceof Error ? error.message : "Digest sweep failed.",
      });
      throw error;
    }
  });
  ensureJobProcessorsRegistered.ready = true;
}

ensureJobProcessorsRegistered.ready = false;

function readRecentManagerEvents(limit = 10) {
  return listAuditEvents(limit).map((entry) => ({
    timestamp: String(entry.timestamp || ""),
    event: String(entry.type || "system_activity"),
    message: String(entry.message || entry.summary || "Activity recorded."),
  }));
}

function buildRecommendations(workspace, activeAlerts) {
  return buildLegacyRecommendations(workspace, activeAlerts, {
    buildHealthSummary,
    listTasks,
    listReviewItems,
    listSchedules,
    buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    buildDigestEscalationSignals: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    buildIncidentApprovalPressure,
    buildApprovalThroughputAnalytics: (collaboration, digestWorkspaceHealth = []) =>
      buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    loadCollaborationState,
    buildApprovalPolicyRecommendations,
    getEnvironmentPolicy,
    getLegacyAnalyticsDeps,
  });
}

function buildOverview(options = {}) {
  return buildLegacyOverview(options, {
    ensureJobProcessorsRegistered,
    buildSystemSummary,
    buildHealthSummary,
    listTasks,
    listReviewItems,
    listSchedules,
    getWatcherStatus,
    loadAlertsState,
    loadAutomationPolicy,
    listAlerts,
    listActiveAlerts,
    listPlugins,
    loadCollaborationState,
    getActor,
    getResearchWorkspace,
    getEnvironmentPolicy,
    buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
    getDigestPreferences,
    listDigestRuns,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    autoRerouteIncidentApproval: (workspaceHealth) =>
      autoRerouteIncidentApproval(workspaceHealth, getLegacyIncidentSupportDeps()),
    ensureIncidentApprovalDelegation: (workspaceHealth, collaboration) =>
      ensureIncidentApprovalDelegation(workspaceHealth, collaboration, getLegacyIncidentSupportDeps()),
    buildDigestAutomationAlerts: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    buildDigestEscalationSignals: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    buildIncidentApprovalPressure,
    buildApprovalThroughputAnalytics: (collaboration, digestWorkspaceHealth = []) =>
      buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    buildApprovalPolicyRecommendations,
    getLegacyAnalyticsDeps,
    observeApprovalPolicyRecommendations,
    getLegacyGovernanceDeps,
    autoPromoteApprovalRecommendations,
    evaluateAppliedApprovalPolicyImpact,
    buildApprovalTrustDashboard,
    recordApprovalTrustSnapshot,
    getLegacyTrustLifecycleDeps,
    buildApprovalTrustEnvironmentSummaries,
    buildApprovalTrustTrends,
    buildApprovalTrustSignals,
    promoteTrustDropToIncident,
    recoverTrustIncident,
    requestRecoveredTrustIncidentCloseout,
    buildApprovalRecommendationFamilyHistory,
    buildCompletedTrustIncidents,
    buildCompletedTrustEnvironmentSummaries,
    buildEnvironmentTrustRecaps,
    listDefaultPolicyPlaybookPresets,
    buildPolicyPlaybookAdoptionSummary,
    buildGlobalOperationsSummary,
    listAutomationFollowups: (workspaceId = null) => listAutomationFollowups(workspaceId, getLegacyOperationsSupportDeps()),
    buildInbox,
    buildNotificationHistory,
    buildNotificationDigest,
    listJobs,
    buildJobMetrics,
    buildWorkloadSummary,
    loadAgentState,
    readAgentProfile,
    buildRecommendations,
    readRecentManagerEvents,
    buildTelemetrySummary,
    canExecuteCommands,
    canApproveInEnvironment,
    canManageGovernanceInEnvironment,
  });
}

function formatLegacyConsoleHelp() {
  return [
    "Available Commands",
    "------------------",
    ...terminalCommandCatalog.helpCommands,
  ].join("\n");
}

const governanceCompatActions = new Set([
  "collaboration:update-governance",
  "collaboration:apply-approval-policy-recommendation",
  "collaboration:promote-approval-policy-recommendation",
  "collaboration:rollback-approval-policy",
  "collaboration:acknowledge-trust-alert",
  "collaboration:restart-approval-recommendation-observation",
  "collaboration:extend-approval-recommendation-cooldown",
]);

const { executeCommand, executeAction, handleConsoleRequest } = createLegacyConsoleRequestHandlers({
  ensureJobProcessorsRegistered,
  executeLegacyConsoleCommand,
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
  createBriefRecord: createBriefRecordFor,
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
  buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
  formatNotificationDigest,
  formatNotificationHistory,
  buildOverview,
  formatTrustReport,
  formatOwnershipSignals,
  getDigestSchedulerStatus,
  buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
  buildDigestAutomationAlerts: (digestScheduler, digestWorkspaceHealth) =>
    buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
  listAlerts,
  listActiveAlerts,
  formatPlugins,
  listPlugins,
  handleLegacyCoreAction,
  handleLegacyCollaborationAction,
  handleLegacyAutomationAction,
  handleLegacyApprovalAction,
  handleLegacyApprovalRequest,
  canUseConsoleAction,
  canApproveInEnvironment,
  canManageGovernanceInEnvironment,
  canExecuteCommands,
  requiresIncidentApproval,
  recordTelemetry,
  appendAuditEvent,
  isGovernanceAction: (action) => governanceCompatActions.has(action),
  getCommandDeps: () => ({
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
    createBriefRecord: createBriefRecordFor,
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
    buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
    formatNotificationDigest,
    formatNotificationHistory,
    buildOverview,
    formatTrustReport,
    formatOwnershipSignals,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    buildDigestAutomationAlerts: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    listAlerts,
    listActiveAlerts,
    formatPlugins,
    listPlugins,
  }),
  getCoreActionDeps: () => ({
    addTask,
    formatTasks,
    routeManagerTask,
    approveReviewItem,
    addReviewItemForTask,
    reviseReviewItem,
    createFollowupTask,
    acknowledgeAlert,
    resolveAlert,
    addAlertNote,
    runAlertChecks,
    enqueueJob,
    cancelJob,
    retryJob,
    getJob,
    startWatcher,
    stopWatcher,
    getWatcherStatus,
    updateWatcherRule,
    addWatcherRule,
    removeWatcherRule,
    updateAlertThresholds,
    updateAutomationPolicy,
    evaluateRules,
    updateAgentProfile,
    createBriefRecord: createBriefRecordFor,
    formatBriefs,
    upsertSharedSession,
    createHandoff,
    closeHandoff,
    appendAuditEvent,
    buildOverview,
  }),
  getCollaborationActionDeps: () => ({
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    buildDigestEscalationSignals: (digestScheduler, digestWorkspaceHealth) =>
      buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth, getLegacyOverviewSupportDeps()),
    loadCollaborationState,
    buildApprovalTrustSignals,
    buildApprovalTrustDashboard,
    getEnvironmentPolicy,
    buildApprovalTrustTrends,
    buildApprovalTrustEnvironmentSummaries,
    buildInbox,
    buildOwnershipSignals: (workspaceId) => buildOwnershipSignals(workspaceId, getLegacyOperationsSupportDeps()),
    updateInboxItemState,
    recordInboxHistoryItem,
    updateDigestPreferences,
    recordDigestRun,
    buildDigestRun: (actorValue, collaborationValue, ownershipSignals, digestPreferences) =>
      buildDigestRun(actorValue, collaborationValue, ownershipSignals, digestPreferences, getLegacyDigestDeps()),
    getDigestPreferences,
    enqueueJob,
    updateGovernance,
    applyApprovalPolicyRecommendationChange: (actorValue, payloadValue, optionsValue, settings) =>
      applyApprovalPolicyRecommendationChange(actorValue, payloadValue, optionsValue, getLegacyGovernanceDeps(), settings),
    rollbackApprovalPolicyPromotion: (actorValue, payloadValue, optionsValue) =>
      rollbackApprovalPolicyPromotion(actorValue, payloadValue, optionsValue, getLegacyGovernanceDeps()),
    acknowledgeApprovalTrustAlert: (actorValue, payloadValue) =>
      acknowledgeApprovalTrustAlert(actorValue, payloadValue, getLegacyGovernanceDeps()),
    restartApprovalRecommendationObservation: (actorValue, payloadValue) =>
      restartApprovalRecommendationObservation(actorValue, payloadValue, getLegacyGovernanceDeps()),
    extendApprovalRecommendationCooldown: (actorValue, payloadValue) =>
      extendApprovalRecommendationCooldown(actorValue, payloadValue, getLegacyGovernanceDeps()),
    appendAuditEvent,
    buildOverview,
  }),
  getAutomationActionDeps: (executeActionImpl) => ({
    parseAutomationInboxItem,
    updateDigestWorkspaceState,
    updateIncidentChecklistItem: (workspaceId, itemId, updates = {}) =>
      updateIncidentChecklistItem(workspaceId, itemId, updates, getLegacyIncidentSupportDeps()),
    appendDigestWorkspaceEvent,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth: (digestScheduler) => buildDigestWorkspaceHealth(digestScheduler, getLegacyOverviewSupportDeps()),
    selectBulkAutomationWorkspaces,
    loadCollaborationState,
    updateGovernance,
    normalizePolicyPlaybookPayload,
    summarizeWorkspacePolicyOverride,
    executeAction: executeActionImpl,
    listJobs,
    enqueueJob,
    addTask,
    listAutomationFollowups: (workspaceId = null) => listAutomationFollowups(workspaceId, getLegacyOperationsSupportDeps()),
    generateWorkspaceIncidentSummary,
    createHandoff,
    validateIncidentStatusChange: (workspaceId, incidentStatus, governanceValue = {}) =>
      validateIncidentStatusChange(workspaceId, incidentStatus, governanceValue, getLegacyIncidentSupportDeps()),
    appendAuditEvent,
    buildOverview,
  }),
  getApprovalActionDeps: (executeActionImpl) => ({
    getApprovalRequest,
    recordTelemetry,
    canActorHandleApproval: (actorValue, request, governanceValue) =>
      canActorHandleApproval(actorValue, request, governanceValue, getLegacyIncidentSupportDeps()),
    resolveApprovalRequest,
    closeIncidentApprovalReminderHandoffs: (approvalId) =>
      closeIncidentApprovalReminderHandoffs(approvalId, getLegacyIncidentSupportDeps()),
    appendDigestWorkspaceEvent,
    appendAuditEvent,
    executeAction: executeActionImpl,
    finalizeRecoveredTrustIncidentCloseout: (workspaceId, actorName = "System") =>
      finalizeRecoveredTrustIncidentCloseout(workspaceId, actorName, getLegacyTrustLifecycleDeps()),
    finalizeArchivedTrustIncident: (workspaceId, actorName = "System") =>
      finalizeArchivedTrustIncident(workspaceId, actorName, getLegacyTrustLifecycleDeps()),
    reroutePendingApproval: (request, nextTarget, actorValue, actionValue) =>
      reroutePendingApproval(request, nextTarget, actorValue, actionValue, getLegacyIncidentSupportDeps()),
    loadCollaborationState,
    buildOverview,
  }),
  getApprovalRequestDeps: (requiresApprovalImpl) => ({
    validateIncidentStatusChange: (workspaceId, incidentStatus, governanceValue = {}) =>
      validateIncidentStatusChange(workspaceId, incidentStatus, governanceValue, getLegacyIncidentSupportDeps()),
    recordTelemetry,
    buildOverview,
    requiresApproval: requiresApprovalImpl,
    getDigestWorkspaceState,
    selectAdaptiveApprovalTarget: (workspaceId, requestedTarget, backupTarget, governanceValue) =>
      selectAdaptiveApprovalTarget(workspaceId, requestedTarget, backupTarget, governanceValue, getLegacyIncidentSupportDeps()),
    buildTrustArchiveRationale: (workspaceId) => buildTrustArchiveRationale(workspaceId, getLegacyTrustLifecycleDeps()),
    getWorkspaceName: getWorkspaceNameFor,
    createApprovalRequest,
    appendDigestWorkspaceEvent,
    appendAuditEvent,
  }),
});

module.exports = {
  buildOverview,
  handleConsoleRequest,
  queueDueDigestSweepIfNeeded,
  formatLegacyConsoleHelp,
};
