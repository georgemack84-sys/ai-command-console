function buildLegacyRecommendations(workspace, activeAlerts = [], deps) {
  const health = deps.buildHealthSummary();
  const tasks = deps.listTasks();
  const reviews = deps.listReviewItems();
  const schedules = deps.listSchedules();
  const ownershipSignals = deps.buildOwnershipSignals(workspace);
  const digestScheduler = deps.getDigestSchedulerStatus();
  const digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler);
  const digestEscalations = deps.buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const incidentApprovalPressure = deps.buildIncidentApprovalPressure(digestWorkspaceHealth);
  const approvalThroughput = deps.buildApprovalThroughputAnalytics(deps.loadCollaborationState(), digestWorkspaceHealth);
  const approvalPolicyRecommendations = deps.buildApprovalPolicyRecommendations(
    incidentApprovalPressure,
    approvalThroughput,
    deps.getEnvironmentPolicy(deps.loadCollaborationState().governance),
    digestWorkspaceHealth,
    deps.getLegacyAnalyticsDeps()
  );
  const recommendations = [];

  if (tasks.some((task) => task.status === "queued")) {
    recommendations.push({ id: "queue", title: "Inspect queued briefs", command: "queue:list", tone: "warning" });
  }

  if (reviews.some((item) => item.status === "pending")) {
    recommendations.push({ id: "review", title: "Process editorial reviews", command: "review:list", tone: "warning" });
  }

  if (activeAlerts.length) {
    recommendations.push({ id: "alerts", title: "Triage active research signals", command: "alerts:active", tone: "critical" });
  }

  if (String(health.watcherStatus).toLowerCase().includes("stopped")) {
    recommendations.push({ id: "watcher", title: "Run an automation sweep", command: "watcher:run", tone: "warning" });
  }

  if (schedules.some((item) => item.lastError)) {
    recommendations.push({ id: "schedules", title: "Inspect schedule issues", command: "schedule:list", tone: "critical" });
  }

  ownershipSignals.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  digestEscalations.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  approvalPolicyRecommendations.forEach((item) => {
    recommendations.push({
      id: item.id,
      title: item.title,
      command: "digest:health",
      tone: item.kind === "throughput" ? "warning" : "critical",
    });
  });

  return recommendations.slice(0, 5);
}

module.exports = {
  buildLegacyRecommendations,
};
