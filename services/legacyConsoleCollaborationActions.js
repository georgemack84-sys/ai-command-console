const {
  markInboxItemRead,
  acknowledgeInboxItem,
  updateDigestPreferenceSet,
  generateDigestForActor,
  queueDigestSweep,
  updateCollaborationGovernance,
  runApprovalPolicyAction,
  acknowledgeTrustAlert,
  restartRecommendationObservation,
  extendRecommendationCooldown,
} = require("./legacyConsoleCollaborationSupport");

function handleLegacyCollaborationAction({
  action,
  payload = {},
  options = {},
  workspace,
  actor,
  deps,
}) {
  const {
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth,
    buildDigestEscalationSignals,
    loadCollaborationState,
    buildApprovalTrustSignals,
    buildApprovalTrustDashboard,
    getEnvironmentPolicy,
    buildApprovalTrustTrends,
    buildApprovalTrustEnvironmentSummaries,
    buildInbox,
    buildOwnershipSignals,
    updateInboxItemState,
    recordInboxHistoryItem,
    updateDigestPreferences,
    recordDigestRun,
    buildDigestRun,
    getDigestPreferences,
    enqueueJob,
    updateGovernance,
    applyApprovalPolicyRecommendationChange,
    rollbackApprovalPolicyPromotion,
    acknowledgeApprovalTrustAlert,
    restartApprovalRecommendationObservation,
    extendApprovalRecommendationCooldown,
    appendAuditEvent,
    buildOverview,
  } = deps;

  if (action === "collaboration:inbox-mark-read") {
    const itemId = String(payload.itemId || "");
    if (!itemId) {
      return { ok: false, error: "Inbox item id is required.", overview: buildOverview(options) };
    }
    markInboxItemRead(actor, workspace, itemId, {
      getDigestSchedulerStatus,
      buildDigestWorkspaceHealth,
      buildDigestEscalationSignals,
      loadCollaborationState,
      buildApprovalTrustSignals,
      buildApprovalTrustDashboard,
      getEnvironmentPolicy,
      buildApprovalTrustTrends,
      buildApprovalTrustEnvironmentSummaries,
      buildInbox,
      buildOwnershipSignals,
      updateInboxItemState,
      recordInboxHistoryItem,
    });
    appendAuditEvent({ type: action, message: `Marked inbox item ${itemId} as read.`, payload: { itemId, actorId: actor.id } });
    return { ok: true, output: `Marked ${itemId} as read.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:inbox-acknowledge") {
    const itemId = String(payload.itemId || "");
    if (!itemId) {
      return { ok: false, error: "Inbox item id is required.", overview: buildOverview(options) };
    }
    acknowledgeInboxItem(actor, workspace, itemId, {
      getDigestSchedulerStatus,
      buildDigestWorkspaceHealth,
      buildDigestEscalationSignals,
      loadCollaborationState,
      buildApprovalTrustSignals,
      buildApprovalTrustDashboard,
      getEnvironmentPolicy,
      buildApprovalTrustTrends,
      buildApprovalTrustEnvironmentSummaries,
      buildInbox,
      buildOwnershipSignals,
      updateInboxItemState,
      recordInboxHistoryItem,
    });
    appendAuditEvent({ type: action, message: `Acknowledged inbox item ${itemId}.`, payload: { itemId, actorId: actor.id } });
    return { ok: true, output: `Acknowledged ${itemId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:digest-preferences") {
    const preferences = updateDigestPreferenceSet(actor, payload, {
      updateDigestPreferences,
    });
    appendAuditEvent({ type: action, message: `Updated digest preferences for ${actor.name}.`, payload: { actorId: actor.id, preferences } });
    return { ok: true, output: "Updated digest preferences.", overview: buildOverview(options) };
  }

  if (action === "collaboration:digest-generate") {
    const digest = generateDigestForActor(actor, workspace, {
      recordDigestRun,
      buildDigestRun,
      loadCollaborationState,
      buildOwnershipSignals,
      getDigestPreferences,
    });
    appendAuditEvent({ type: action, message: `Generated notification digest ${digest.id}.`, payload: { actorId: actor.id, digestId: digest.id } });
    return { ok: true, output: `Generated digest ${digest.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:digest-run-due") {
    const job = queueDigestSweep(workspace, actor, { enqueueJob });
    appendAuditEvent({ type: action, message: `Queued digest sweep as ${job.id}.`, payload: { actorId: actor.id, jobId: job.id, workspace } });
    return { ok: true, output: `Queued digest sweep as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:update-governance") {
    const governance = updateCollaborationGovernance(payload, {
      updateGovernance,
    });
    appendAuditEvent({ type: action, message: "Updated collaboration governance.", payload: { ...governance, actorId: actor.id } });
    return { ok: true, output: "Updated collaboration governance.", overview: buildOverview(options) };
  }

  if (action === "collaboration:apply-approval-policy-recommendation") {
    return runApprovalPolicyAction(action, actor, payload, options, {
      applyApprovalPolicyRecommendationChange,
      rollbackApprovalPolicyPromotion,
    });
  }

  if (action === "collaboration:promote-approval-policy-recommendation") {
    return runApprovalPolicyAction(action, actor, payload, options, {
      applyApprovalPolicyRecommendationChange,
      rollbackApprovalPolicyPromotion,
    });
  }

  if (action === "collaboration:rollback-approval-policy") {
    return runApprovalPolicyAction(action, actor, payload, options, {
      applyApprovalPolicyRecommendationChange,
      rollbackApprovalPolicyPromotion,
    });
  }

  if (action === "collaboration:acknowledge-trust-alert") {
    const result = acknowledgeTrustAlert(actor, payload, {
      acknowledgeApprovalTrustAlert,
    });
    appendAuditEvent({
      type: action,
      message: result.audit.message,
      payload: { ...result.audit.payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  if (action === "collaboration:restart-approval-recommendation-observation") {
    const result = restartRecommendationObservation(actor, payload, {
      restartApprovalRecommendationObservation,
    });
    appendAuditEvent({
      type: action,
      message: result.audit.message,
      payload: { ...result.audit.payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  if (action === "collaboration:extend-approval-recommendation-cooldown") {
    const result = extendRecommendationCooldown(actor, payload, {
      extendApprovalRecommendationCooldown,
    });
    appendAuditEvent({
      type: action,
      message: result.audit.message,
      payload: { ...result.audit.payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  return null;
}

module.exports = {
  handleLegacyCollaborationAction,
};
