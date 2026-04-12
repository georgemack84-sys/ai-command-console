const {
  createWorkflowTask,
  routeWorkflowTask,
  runReviewAction,
  runAlertAction,
} = require("./legacyConsoleCoreWorkflowSupport");
const {
  runJobAction,
  runWatcherAction,
} = require("./legacyConsoleCoreOperationsSupport");
const {
  runPolicyAction,
  updateAgentConfiguration,
  createResearchBrief,
  runCollaborationCoreAction,
} = require("./legacyConsoleCoreProductSupport");

function handleLegacyCoreAction({
  action,
  payload = {},
  options = {},
  workspace,
  actor,
  deps,
}) {
  const {
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
    createBriefRecord,
    formatBriefs,
    upsertSharedSession,
    createHandoff,
    closeHandoff,
    appendAuditEvent,
    buildOverview,
  } = deps;

  if (action === "workflow:create-task") {
    const result = createWorkflowTask(payload, {
      addTask,
      formatTasks,
    });
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: result.ok, output: result.output, overview: buildOverview(options) };
  }

  if (action === "workflow:route-task") {
    const result = routeWorkflowTask(payload, {
      routeManagerTask,
      formatTasks,
    });
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: result.ok, output: result.output, overview: buildOverview(options) };
  }

  if (action.startsWith("review:")) {
    const result = runReviewAction(action, payload, {
      approveReviewItem,
      addReviewItemForTask,
      reviseReviewItem,
      createFollowupTask,
    });
    if (result) {
      appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
      return { ok: result.ok, output: result.output, overview: buildOverview(options) };
    }
  }

  if (action.startsWith("alert:")) {
    const result = runAlertAction(action, payload, {
      acknowledgeAlert,
      resolveAlert,
      addAlertNote,
      runAlertChecks,
    });
    if (result) {
      appendAuditEvent({
        type: action,
        ...result.audit,
        payload: { ...result.audit.payload, actorId: actor.id },
      });
      return { ok: result.ok, output: result.output, result: result.result, overview: buildOverview(options) };
    }
  }

  if (
    action === "plugin:run" ||
    action === "job:cancel" ||
    action === "job:retry" ||
    action === "job:detail" ||
    action === "brief:route" ||
    action === "report:create" ||
    action === "report:publish"
  ) {
    const result = runJobAction(action, payload, workspace, actor, {
      enqueueJob,
      cancelJob,
      retryJob,
      getJob,
    });
    if (result) {
      if (result.audit) {
        appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
      }
      if (!result.ok) {
        return { ok: false, error: result.error, overview: buildOverview(options) };
      }
      return {
        ok: true,
        output: result.output,
        detail: result.detail,
        overview: buildOverview(options),
      };
    }
  }

  if (action.startsWith("watcher:")) {
    const result = runWatcherAction(action, payload, {
      startWatcher,
      stopWatcher,
      getWatcherStatus,
      updateWatcherRule,
      addWatcherRule,
      removeWatcherRule,
    });
    if (result) {
      appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
      return { ok: result.ok, output: result.output, overview: buildOverview(options) };
    }
  }

  if (action.startsWith("policy:")) {
    const result = runPolicyAction(action, payload, {
      updateAlertThresholds,
      updateAutomationPolicy,
      evaluateRules,
      runAlertChecks,
    });
    if (result) {
      appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
      return { ok: result.ok, output: result.output, overview: buildOverview(options) };
    }
  }

  if (action === "agent:update-config") {
    const result = updateAgentConfiguration(payload, { updateAgentProfile });
    appendAuditEvent({
      type: action,
      ...result.audit,
      payload: { ...result.audit.payload, actorId: actor.id },
    });
    return { ok: result.ok, output: result.output, overview: buildOverview(options) };
  }

  if (action === "brief:create") {
    const result = createResearchBrief(workspace, payload, {
      createBriefRecord,
      formatBriefs,
    });
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: result.ok, output: result.output, overview: buildOverview(options) };
  }

  if (action.startsWith("collaboration:")) {
    const result = runCollaborationCoreAction(action, payload, actor, {
      upsertSharedSession,
      createHandoff,
      closeHandoff,
    });
    if (result) {
      if (!result.ok) {
        return { ok: false, error: result.error, overview: buildOverview(options) };
      }
      appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
      return { ok: result.ok, output: result.output, overview: buildOverview(options) };
    }
  }

  return null;
}

module.exports = {
  handleLegacyCoreAction,
};
