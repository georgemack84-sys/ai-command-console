function formatTrustReport(collaboration = {}) {
  const environments = Array.isArray(collaboration.approvalTrustEnvironments) ? collaboration.approvalTrustEnvironments : [];
  const trends = Array.isArray(collaboration.approvalTrustTrends) ? collaboration.approvalTrustTrends : [];
  const families = Array.isArray(collaboration.approvalRecommendationFamilies) ? collaboration.approvalRecommendationFamilies : [];
  const signals = Array.isArray(collaboration.approvalTrustSignals) ? collaboration.approvalTrustSignals : [];
  const completedTrustIncidents = Array.isArray(collaboration.completedTrustIncidents) ? collaboration.completedTrustIncidents : [];
  const completedTrustEnvironments = Array.isArray(collaboration.completedTrustEnvironments) ? collaboration.completedTrustEnvironments : [];
  const environmentTrustRecaps = Array.isArray(collaboration.environmentTrustRecaps) ? collaboration.environmentTrustRecaps : [];

  const environmentLines = environments.length
    ? environments.map((item) =>
        `- ${item.environment}: score ${item.score}, alerts ${item.alertCount}, regressed ${item.regressedCount}, improved ${item.improvedCount}`
      )
    : ["- No environment trust data."];

  const trendLines = trends.length
    ? trends.map((item) =>
        `- ${item.environment}: 24h ${item.deltas?.day ?? "n/a"}, 7d ${item.deltas?.week ?? "n/a"}, 30d ${item.deltas?.month ?? "n/a"}`
      )
    : ["- No trust trends recorded."];

  const familyLines = families.length
    ? families.map((item) =>
        `- ${item.label}: recommendations ${item.recommendationCount}, promoted ${item.promotedCount}, rolled back ${item.rolledBackCount}, trust alerts ${item.trustSignalCount}`
      )
    : ["- No recommendation family history recorded."];

  const signalLines = signals.length
    ? signals.map((item) => `- ${item.title}: ${item.detail}`)
    : ["- No active trust alerts."];

  const completedLines = completedTrustIncidents.length
    ? completedTrustIncidents.map((item) => `- ${item.workspaceName} (${item.environment}) archived ${item.archivedAt}: ${item.summary}`)
    : ["- No completed trust incidents recorded."];
  const completedEnvironmentLines = completedTrustEnvironments.length
    ? completedTrustEnvironments.map(
        (item) =>
          `- ${item.environment}: ${item.archivedCount} archived trust incidents${item.latestArchivedAt ? `, latest ${item.latestArchivedAt}` : ""}${item.recentWorkspaces.length ? ` (${item.recentWorkspaces.join(", ")})` : ""}`
      )
    : ["- No completed trust environment summaries recorded."];
  const environmentRecapLines = environmentTrustRecaps.length
    ? environmentTrustRecaps.map(
        (item) =>
          `- ${item.environment}: score ${item.score}, active trust ${item.activeSignals}, completed archived ${item.completedArchived}${item.latestArchivedAt ? `, latest archive ${item.latestArchivedAt}` : ""}`
      )
    : ["- No environment trust recaps recorded."];

  return [
    "Trust report",
    "",
    "Environment summary",
    ...environmentLines,
    "",
    "Environment recaps",
    ...environmentRecapLines,
    "",
    "Trend summary",
    ...trendLines,
    "",
    "Recommendation families",
    ...familyLines,
    "",
    "Completed trust by environment",
    ...completedEnvironmentLines,
    "",
    "Completed trust incidents",
    ...completedLines,
    "",
    "Active trust alerts",
    ...signalLines,
  ].join("\n");
}

function formatOwnershipSignals(signals = []) {
  if (!signals.length) {
    return "Ownership signals\nNo assignment risks detected in this workspace.";
  }

  return [
    "Ownership signals",
    ...signals.map((signal) => `- ${signal.title}\n  ${signal.detail}\n  Action: ${signal.command}`),
  ].join("\n");
}

function formatInbox(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = [], buildInbox) {
  const items = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  if (!items.length) {
    return "Operator inbox\nNo assignment, handoff, or approval items need attention.";
  }

  return [
    "Operator inbox",
    ...items.map((item) => `- [${item.type}] ${item.title}\n  ${item.detail}\n  Status: ${item.status}${item.read ? " • read" : ""}${item.acknowledged ? " • acknowledged" : ""}`),
  ].join("\n");
}

function formatNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = [], buildNotificationHistory) {
  const items = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  if (!items.length) {
    return "Notification history\nNo notification activity has been recorded for this user yet.";
  }

  return [
    "Notification history",
    ...items.map((item) => `- [${item.type}] ${item.title}\n  ${item.detail}\n  Status: ${item.status}${item.read ? " • read" : ""}${item.acknowledged ? " • acknowledged" : ""}`),
  ].join("\n");
}

function formatNotificationDigest(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = [], buildInbox, buildNotificationHistory, buildNotificationDigest) {
  const inbox = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const digest = buildNotificationDigest(inbox, history);
  return [
    "Notification digest",
    `Open: ${digest.open}`,
    `Unread: ${digest.unread}`,
    `Acknowledged: ${digest.acknowledged}`,
    `Ownership: ${digest.ownership}`,
    `Handoffs: ${digest.handoffs}`,
    `Approvals: ${digest.approvals}`,
    `Trust: ${digest.trust}`,
  ].join("\n");
}

module.exports = {
  formatTrustReport,
  formatOwnershipSignals,
  formatInbox,
  formatNotificationHistory,
  formatNotificationDigest,
};
