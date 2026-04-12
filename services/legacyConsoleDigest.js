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

function buildTrustSignalsForGovernance(collaboration, deps) {
  const governance = collaboration.governance || {};
  return buildApprovalTrustSignals(
    buildApprovalTrustDashboard(
      Array.isArray(governance.appliedApprovalPolicies) ? governance.appliedApprovalPolicies : [],
      Array.isArray(governance.approvalRecommendationObservations) ? governance.approvalRecommendationObservations : [],
      deps.getEnvironmentPolicy(governance),
      Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []
    ),
    buildApprovalTrustTrends(governance, buildApprovalTrustEnvironmentSummaries(governance))
  );
}

function buildDigestRun(actor, collaboration, ownershipSignals, digestPreferences = {}, deps) {
  const digestScheduler = deps.getDigestSchedulerStatus();
  const digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
  const digestEscalations = deps.buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const governance = collaboration.governance || {};
  const trustDashboard = buildApprovalTrustDashboard(
    Array.isArray(governance.appliedApprovalPolicies) ? governance.appliedApprovalPolicies : [],
    Array.isArray(governance.approvalRecommendationObservations) ? governance.approvalRecommendationObservations : [],
    deps.getEnvironmentPolicy(governance),
    Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []
  );
  const trustEnvironments = buildApprovalTrustEnvironmentSummaries(governance);
  const trustTrends = buildApprovalTrustTrends(governance, trustEnvironments);
  const trustSignals = buildApprovalTrustSignals(trustDashboard, trustTrends);
  const inbox = deps.buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = deps.buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const stats = deps.buildNotificationDigest(inbox, history);
  const trustReportRequested = Boolean(digestPreferences.includeTrustReport);
  const trustFamilies = buildApprovalRecommendationFamilyHistory(
    [],
    Array.isArray(governance.appliedApprovalPolicies) ? governance.appliedApprovalPolicies : [],
    Array.isArray(governance.approvalRecommendationObservations) ? governance.approvalRecommendationObservations : [],
    trustSignals
  );
  const completedTrustIncidents = buildCompletedTrustIncidents(digestWorkspaceHealth);
  const completedTrustEnvironments = buildCompletedTrustEnvironmentSummaries(completedTrustIncidents);
  const environmentTrustRecaps = buildEnvironmentTrustRecaps(trustEnvironments, trustSignals, completedTrustEnvironments);
  const trustEnvironment = String(digestPreferences.trustEnvironment || "all");
  const scopedTrustCollaboration = filterTrustCollaborationScope(
    {
      approvalTrustEnvironments: trustEnvironments,
      environmentTrustRecaps,
      approvalTrustTrends: trustTrends,
      approvalRecommendationFamilies: trustFamilies,
      approvalTrustSignals: trustSignals,
      completedTrustEnvironments,
      completedTrustIncidents,
    },
    trustEnvironment
  );
  const highlights = [
    ...inbox.slice(0, 5).map((item) => item.title),
    ...(trustReportRequested
      ? (Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : [])
          .slice(0, 2)
          .map((item) => `Env ${item.environment}: score ${item.score} • active ${item.activeSignals} • archived ${item.completedArchived}`)
      : []),
    ...(trustReportRequested
      ? (Array.isArray(scopedTrustCollaboration.approvalTrustSignals) ? scopedTrustCollaboration.approvalTrustSignals : [])
          .slice(0, 2)
          .map((item) => `Trust: ${item.title}`)
      : []),
    ...(trustReportRequested
      ? (Array.isArray(scopedTrustCollaboration.completedTrustIncidents) ? scopedTrustCollaboration.completedTrustIncidents : [])
          .slice(0, 2)
          .map((item) => `Trust complete: ${item.workspaceName}`)
      : []),
  ].slice(0, 8);
  const summary = [
    trustReportRequested && (Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : []).length
      ? `Environment trust recap${trustEnvironment !== "all" ? ` (${trustEnvironment})` : ""}: ${(Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : [])
          .slice(0, 2)
          .map((item) => `${item.environment} score ${item.score}, active ${item.activeSignals}, archived ${item.completedArchived}`)
          .join(" • ")}`
      : `${stats.open} open notifications • ${stats.unread} unread • ${stats.handoffs} handoffs • ${stats.approvals} approvals • ${stats.ownership} ownership signals • ${stats.trust} trust alerts`,
  ].join("");
  const report = trustReportRequested ? deps.formatTrustReport(scopedTrustCollaboration) : "";

  return {
    summary,
    stats,
    highlights,
    report,
    reportType: trustReportRequested ? "trust" : "notification",
  };
}

function shouldGenerateDigestForUser(user, collaboration, workspaceId, options = {}, deps) {
  const preferences = deps.getDigestPreferences(user.id);
  if (!preferences.enabled || preferences.cadence === "manual") {
    return false;
  }

  const actor = {
    id: String(user.id),
    name: String(user.name || user.email || user.id),
    role: deps.normalizeRole(user.role, "operator"),
  };
  const selectedTrustEnvironment = String(preferences.trustEnvironment || "all");
  const currentTrustEnvironment = String(collaboration.governance?.currentEnvironment || "development");
  const trustSignals = buildTrustSignalsForGovernance(collaboration, deps);
  const scopedTrustSignals =
    selectedTrustEnvironment === "all"
      ? trustSignals
      : trustSignals.filter((item) => !item.environment || String(item.environment) === selectedTrustEnvironment);
  const inbox = deps.buildInbox(actor, collaboration, deps.buildOwnershipSignals(workspaceId), [], scopedTrustSignals);
  if (!inbox.length) {
    return false;
  }

  if (options.trustDropOnly) {
    if (!preferences.includeTrustReport || !preferences.immediateOnTrustDrop) {
      return false;
    }
    if (preferences.trustAudience === "admins" && !["admin", "approver"].includes(deps.normalizeRole(user.role, "operator"))) {
      return false;
    }
    if (selectedTrustEnvironment !== "all" && selectedTrustEnvironment !== currentTrustEnvironment) {
      return false;
    }
    return scopedTrustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  }

  if (preferences.cadence === "handoff") {
    return inbox.some((item) => item.type === "handoff" && !item.read);
  }

  const lastDigestAt = preferences.lastDigestAt ? new Date(preferences.lastDigestAt).getTime() : 0;
  return !lastDigestAt || Date.now() - lastDigestAt >= 12 * 60 * 60 * 1000;
}

function runDueDigestsForWorkspace(workspaceId, deps) {
  let collaboration = deps.loadCollaborationState();
  const users = deps.listWorkspaceUsers(workspaceId);
  const created = [];
  const trustSignals = buildTrustSignalsForGovernance(collaboration, deps);
  const immediateTrustDrop = trustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  const promotedTrustIncident = deps.promoteTrustDropToIncident(workspaceId, collaboration, trustSignals);
  const recoveredTrustIncident = deps.recoverTrustIncident(workspaceId, collaboration, trustSignals);
  const requestedRecoveredTrustCloseout = deps.requestRecoveredTrustIncidentCloseout(workspaceId, collaboration);
  if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
    collaboration = deps.loadCollaborationState();
  }
  const trustEscalation = deps.applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals);
  const digestAllowed = !immediateTrustDrop || trustEscalation.mode === "digest";
  const eligibleUsers = users.filter((user) =>
    shouldGenerateDigestForUser(user, collaboration, workspaceId, { trustDropOnly: immediateTrustDrop && digestAllowed }, deps)
  );

  eligibleUsers.forEach((user) => {
    const actor = {
      id: String(user.id),
      name: String(user.name || user.email || user.id),
      role: deps.normalizeRole(user.role, "operator"),
    };
    const digest = deps.recordDigestRun(
      user.id,
      buildDigestRun(actor, collaboration, deps.buildOwnershipSignals(workspaceId), deps.getDigestPreferences(user.id), deps)
    );
    created.push({
      userId: actor.id,
      userName: actor.name,
      digestId: digest.id,
      summary: digest.summary,
    });
  });

  deps.updateDigestWorkspaceState(workspaceId, {
    lastSweepRunAt: new Date().toISOString(),
    lastGeneratedCount: created.length,
    lastEligibleUserCount: eligibleUsers.length,
    lastSweepError: null,
  });

  return {
    ok: true,
    workspaceId,
    generatedCount: created.length,
    digests: created,
  };
}

module.exports = {
  buildTrustSignalsForGovernance,
  buildDigestRun,
  shouldGenerateDigestForUser,
  runDueDigestsForWorkspace,
};
