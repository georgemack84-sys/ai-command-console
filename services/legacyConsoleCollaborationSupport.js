function buildCurrentInboxItem(actor, workspace, deps) {
  const digestScheduler = deps.getDigestSchedulerStatus();
  const digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
  const digestEscalations = deps.buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const collaboration = deps.loadCollaborationState();
  const trustSignals = deps.buildApprovalTrustSignals(
    deps.buildApprovalTrustDashboard(
      Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
      Array.isArray(collaboration.governance?.approvalRecommendationObservations)
        ? collaboration.governance.approvalRecommendationObservations
        : [],
      deps.getEnvironmentPolicy(collaboration.governance),
      Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
    ),
    deps.buildApprovalTrustTrends(collaboration.governance, deps.buildApprovalTrustEnvironmentSummaries(collaboration.governance))
  );

  return {
    collaboration,
    inbox: deps.buildInbox(actor, collaboration, deps.buildOwnershipSignals(workspace), digestEscalations, trustSignals),
  };
}

function markInboxItemRead(actor, workspace, itemId, deps) {
  const { inbox } = buildCurrentInboxItem(actor, workspace, deps);
  const currentItem = inbox.find((item) => item.id === itemId);
  deps.updateInboxItemState(actor.id, itemId, { readAt: new Date().toISOString() });
  if (currentItem) {
    deps.recordInboxHistoryItem(actor.id, { ...currentItem, read: true, updatedAt: new Date().toISOString() });
  }
  return currentItem || null;
}

function acknowledgeInboxItem(actor, workspace, itemId, deps) {
  const { inbox } = buildCurrentInboxItem(actor, workspace, deps);
  const currentItem = inbox.find((item) => item.id === itemId);
  deps.updateInboxItemState(actor.id, itemId, {
    readAt: new Date().toISOString(),
    acknowledgedAt: new Date().toISOString(),
  });
  if (currentItem) {
    deps.recordInboxHistoryItem(actor.id, {
      ...currentItem,
      read: true,
      acknowledged: true,
      updatedAt: new Date().toISOString(),
    });
  }
  return currentItem || null;
}

function updateDigestPreferenceSet(actor, payload, deps) {
  return deps.updateDigestPreferences(actor.id, {
    enabled: Boolean(payload.enabled),
    cadence: String(payload.cadence || "manual"),
    preferredChannel: String(payload.preferredChannel || "inbox"),
    includeTrustReport: Boolean(payload.includeTrustReport),
    trustAudience: String(payload.trustAudience || "self"),
    trustEnvironment: String(payload.trustEnvironment || "all"),
    immediateOnTrustDrop: Boolean(payload.immediateOnTrustDrop),
  });
}

function generateDigestForActor(actor, workspace, deps) {
  return deps.recordDigestRun(
    actor.id,
    deps.buildDigestRun(actor, deps.loadCollaborationState(), deps.buildOwnershipSignals(workspace), deps.getDigestPreferences(actor.id))
  );
}

function queueDigestSweep(workspace, actor, deps) {
  return deps.enqueueJob("digest:run-due", { workspace }, actor);
}

function updateCollaborationGovernance(payload, deps) {
  return deps.updateGovernance({
    sensitiveActionsRequireApproval: payload.sensitiveActionsRequireApproval,
    currentEnvironment: payload.currentEnvironment,
    environmentPolicies: payload.environmentPolicies,
  });
}

function runApprovalPolicyAction(action, actor, payload, options, deps) {
  if (action === "collaboration:apply-approval-policy-recommendation") {
    return deps.applyApprovalPolicyRecommendationChange(actor, payload, options, { persistPromotion: false });
  }

  if (action === "collaboration:promote-approval-policy-recommendation") {
    return deps.applyApprovalPolicyRecommendationChange(actor, payload, options, { persistPromotion: true });
  }

  if (action === "collaboration:rollback-approval-policy") {
    return deps.rollbackApprovalPolicyPromotion(actor, payload, options);
  }

  return null;
}

function acknowledgeTrustAlert(actor, payload, deps) {
  const result = deps.acknowledgeApprovalTrustAlert(actor, payload);
  return {
    ...result,
    audit: {
      message: result.ok ? `Acknowledged trust alert ${String(payload.alertId || "")}.` : "Failed to acknowledge trust alert.",
      payload,
    },
  };
}

function restartRecommendationObservation(actor, payload, deps) {
  const result = deps.restartApprovalRecommendationObservation(actor, payload);
  return {
    ...result,
    audit: {
      message: result.ok
        ? `Restarted observation for ${String(payload.recommendationId || "")}.`
        : "Failed to restart approval observation.",
      payload,
    },
  };
}

function extendRecommendationCooldown(actor, payload, deps) {
  const result = deps.extendApprovalRecommendationCooldown(actor, payload);
  return {
    ...result,
    audit: {
      message: result.ok
        ? `Extended cooldown for ${String(payload.recommendationId || "")}.`
        : "Failed to extend recommendation cooldown.",
      payload,
    },
  };
}

module.exports = {
  buildCurrentInboxItem,
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
};
