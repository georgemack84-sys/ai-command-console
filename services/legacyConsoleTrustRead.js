function buildApprovalTrustDashboard(appliedPolicies = [], observations = [], environmentPolicy = {}, trustAlertAcks = []) {
  const regressedCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "regressed").length;
  const improvedCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "improved").length;
  const rolledBackCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "rolled_back").length;
  const observingCount = (Array.isArray(observations) ? observations : []).filter((item) => item.status === "observing").length;
  const cooldownCount = (Array.isArray(observations) ? observations : []).filter((item) => item.status === "cooldown").length;
  const score = Math.max(0, Math.min(100, 70 + improvedCount * 8 - regressedCount * 12 - rolledBackCount * 10 - cooldownCount * 4));
  const observationHours = Math.max(1, Number(environmentPolicy.autoPromoteObservationHours || 24));
  const now = Date.now();
  const alerts = [];
  const acknowledgedById = new Map(
    (Array.isArray(trustAlertAcks) ? trustAlertAcks : []).map((item) => [String(item.alertId), item])
  );

  (Array.isArray(appliedPolicies) ? appliedPolicies : [])
    .filter((item) => item.impact?.status === "regressed")
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-regressed:${item.id}`;
      alerts.push({
        id,
        tone: "critical",
        title: `Policy regressed: ${item.title}`,
        detail: item.impact?.summary || "A promoted policy is trending in the wrong direction.",
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: item.rolledBackAt
          ? [
              {
                label: "Acknowledge",
                action: "collaboration:acknowledge-trust-alert",
                payload: { alertId: id },
              },
            ]
          : [
              {
                label: "Roll back policy",
                action: "collaboration:rollback-approval-policy",
                payload: { promotionId: item.id },
              },
              {
                label: "Acknowledge",
                action: "collaboration:acknowledge-trust-alert",
                payload: { alertId: id },
              },
            ],
      });
    });

  (Array.isArray(observations) ? observations : [])
    .filter((item) => item.status === "observing" && item.eligibleSinceAt)
    .filter((item) => now - new Date(item.eligibleSinceAt).getTime() >= observationHours * 60 * 60 * 1000 * 0.5)
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-maturing:${item.recommendationId}`;
      alerts.push({
        id,
        tone: "warning",
        title: `Recommendation maturing: ${item.title}`,
        detail: "This recommendation has held its signal for a meaningful part of the observation window and is approaching auto-promotion eligibility.",
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: [
          {
            label: "Restart observation",
            action: "collaboration:restart-approval-recommendation-observation",
            payload: { recommendationId: item.recommendationId },
          },
          {
            label: "Acknowledge",
            action: "collaboration:acknowledge-trust-alert",
            payload: { alertId: id },
          },
        ],
      });
    });

  (Array.isArray(observations) ? observations : [])
    .filter((item) => item.status === "cooldown" && item.cooldownUntil)
    .filter((item) => new Date(item.cooldownUntil).getTime() - now <= 24 * 60 * 60 * 1000)
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-cooldown:${item.recommendationId}`;
      alerts.push({
        id,
        tone: "warning",
        title: `Cooldown ending soon: ${item.title}`,
        detail: `This recommendation family leaves cooldown on ${item.cooldownUntil}.`,
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: [
          {
            label: "Extend cooldown",
            action: "collaboration:extend-approval-recommendation-cooldown",
            payload: { recommendationId: item.recommendationId, hours: 24 },
          },
          {
            label: "Acknowledge",
            action: "collaboration:acknowledge-trust-alert",
            payload: { alertId: id },
          },
        ],
      });
    });

  return {
    score,
    regressedCount,
    improvedCount,
    rolledBackCount,
    observingCount,
    cooldownCount,
    alerts,
  };
}

function buildApprovalTrustEnvironmentSummaries(governance = {}) {
  const environmentPolicies = governance.environmentPolicies || {};
  const appliedPolicies = Array.isArray(governance.appliedApprovalPolicies) ? governance.appliedApprovalPolicies : [];
  const observations = Array.isArray(governance.approvalRecommendationObservations) ? governance.approvalRecommendationObservations : [];
  const currentEnvironment = String(governance.currentEnvironment || "development");

  return Object.keys(environmentPolicies)
    .map((environment) => {
      const policy = {
        currentEnvironment: environment,
        ...(environmentPolicies[environment] || {}),
      };
      const dashboard = buildApprovalTrustDashboard(
        appliedPolicies.filter((item) => String(item.environment || currentEnvironment) === environment),
        observations.filter((item) => String(item.environment || currentEnvironment) === environment),
        policy
      );
      return {
        environment,
        current: environment === currentEnvironment,
        autoPromoteEnabled: Boolean(policy.autoPromoteApprovalRecommendations),
        observationHours: Math.max(1, Number(policy.autoPromoteObservationHours || 24)),
        cooldownHours: Math.max(1, Number(policy.autoPromoteCooldownHours || 72)),
        score: dashboard.score,
        regressedCount: dashboard.regressedCount,
        improvedCount: dashboard.improvedCount,
        observingCount: dashboard.observingCount,
        cooldownCount: dashboard.cooldownCount,
        alertCount: dashboard.alerts.length,
      };
    })
    .sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return a.environment.localeCompare(b.environment);
    });
}

function pickTrustWindowSnapshot(history = [], environment, windowMs) {
  const now = Date.now();
  return (Array.isArray(history) ? history : [])
    .filter((item) => String(item.environment) === environment)
    .find((item) => now - new Date(item.takenAt).getTime() >= windowMs);
}

function buildApprovalTrustTrends(governance = {}, environmentSummaries = []) {
  const history = Array.isArray(governance.approvalTrustHistory) ? governance.approvalTrustHistory : [];
  return (Array.isArray(environmentSummaries) ? environmentSummaries : []).map((entry) => {
    const snapshots = history.filter((item) => String(item.environment) === entry.environment);
    const latest = snapshots[0] || null;
    const day = pickTrustWindowSnapshot(history, entry.environment, 24 * 60 * 60 * 1000);
    const week = pickTrustWindowSnapshot(history, entry.environment, 7 * 24 * 60 * 60 * 1000);
    const month = pickTrustWindowSnapshot(history, entry.environment, 30 * 24 * 60 * 60 * 1000);
    return {
      environment: entry.environment,
      current: entry.current,
      latestTakenAt: latest?.takenAt || null,
      sampleCount: snapshots.length,
      score: entry.score,
      deltas: {
        day: day ? entry.score - Number(day.score || 0) : null,
        week: week ? entry.score - Number(week.score || 0) : null,
        month: month ? entry.score - Number(month.score || 0) : null,
      },
      activity: {
        latestRegressedCount: entry.regressedCount,
        latestImprovedCount: entry.improvedCount,
        latestAlertCount: entry.alertCount,
      },
    };
  });
}

function buildApprovalTrustSignals(approvalTrustDashboard = {}, approvalTrustTrends = []) {
  const alerts = [];
  const trendMap = new Map(
    (Array.isArray(approvalTrustTrends) ? approvalTrustTrends : []).map((item) => [String(item.environment), item])
  );

  (Array.isArray(approvalTrustDashboard.alerts) ? approvalTrustDashboard.alerts : []).forEach((item) => {
    alerts.push({
      id: `trust:${item.id}`,
      tone: item.tone || "warning",
      type: "trust",
      title: item.title,
      detail: item.detail,
      command: "trust:status",
      environment: item.environment || null,
    });
  });

  trendMap.forEach((trend, environment) => {
    if (typeof trend.deltas?.day === "number" && trend.deltas.day <= -8) {
      alerts.push({
        id: `trust-drop:${environment}`,
        tone: "critical",
        type: "trust",
        title: `${environment} trust dropped sharply`,
        detail: `${environment} trust moved ${trend.deltas.day} points over the last 24 hours.`,
        command: "trust:status",
        environment,
      });
    }
    if (trend.activity?.latestRegressedCount > 0 && typeof trend.deltas?.day === "number" && trend.deltas.day < 0) {
      alerts.push({
        id: `trust-regression:${environment}`,
        tone: "warning",
        type: "trust",
        title: `${environment} has fresh policy regressions`,
        detail: `${trend.activity.latestRegressedCount} regressed policies are affecting ${environment} trust.`,
        command: "trust:status",
        environment,
      });
    }
  });

  return alerts.slice(0, 8);
}

function buildApprovalRecommendationFamilyHistory(
  recommendations = [],
  appliedPolicies = [],
  observations = [],
  trustSignals = []
) {
  const families = new Map();

  function ensureFamily(key, seed = {}) {
    if (!families.has(key)) {
      families.set(key, {
        family: key,
        label: seed.label || key,
        recommendationKind: seed.recommendationKind || "policy",
        target: seed.target || null,
        workspaceId: seed.workspaceId || null,
        recommendationCount: 0,
        promotedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        trustSignalCount: 0,
        lastRecommendationAt: null,
        lastPromotionAt: null,
        lastSignalTitle: null,
      });
    }
    return families.get(key);
  }

  (Array.isArray(recommendations) ? recommendations : []).forEach((item) => {
    const familyKey = String(item.id || item.action?.payload?.recommendationId || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
      recommendationKind: item.kind || item.action?.payload?.recommendationKind || "policy",
      target: item.target || item.action?.payload?.target || null,
      workspaceId: item.workspaceId || item.action?.payload?.workspaceId || null,
    });
    family.recommendationCount += 1;
    family.lastRecommendationAt = new Date().toISOString();
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  (Array.isArray(appliedPolicies) ? appliedPolicies : []).forEach((item) => {
    const familyKey = String(item.recommendationId || item.id || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
      recommendationKind: item.recommendationKind || "policy",
      target: item.target || null,
      workspaceId: item.workspaceId || null,
    });
    family.promotedCount += 1;
    if (item.rolledBackAt) {
      family.rolledBackCount += 1;
    }
    family.lastPromotionAt = item.appliedAt || family.lastPromotionAt;
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  (Array.isArray(observations) ? observations : []).forEach((item) => {
    const familyKey = String(item.recommendationId || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
    });
    if (item.status === "observing" || item.status === "cooldown") {
      family.observingCount += 1;
    }
  });

  (Array.isArray(trustSignals) ? trustSignals : []).forEach((item) => {
    const baseKey = String(item.id || "");
    const familyKey = baseKey.startsWith("trust:")
      ? baseKey.replace(/^trust:/, "")
      : baseKey.startsWith("trust-drop:") || baseKey.startsWith("trust-regression:")
        ? baseKey
        : baseKey;
    const family = ensureFamily(familyKey, {
      label: item.title,
    });
    family.trustSignalCount += 1;
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  return [...families.values()]
    .sort((a, b) =>
      (b.trustSignalCount - a.trustSignalCount) ||
      (b.rolledBackCount - a.rolledBackCount) ||
      (b.promotedCount - a.promotedCount) ||
      a.label.localeCompare(b.label)
    )
    .slice(0, 10);
}

function buildCompletedTrustIncidents(digestWorkspaceHealth = []) {
  return (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [])
    .map((workspace) => {
      const archivedEvent = Array.isArray(workspace.events)
        ? workspace.events.find((event) => event.type === "trust-incident-archived")
        : null;
      if (!archivedEvent) {
        return null;
      }
      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        environment: workspace.incidentPolicy?.environment || "unknown",
        archivedAt: archivedEvent.timestamp || null,
        summary: workspace.incidentSummary || archivedEvent.note || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime())
    .slice(0, 8);
}

function buildCompletedTrustEnvironmentSummaries(completedTrustIncidents = []) {
  const grouped = new Map();
  (Array.isArray(completedTrustIncidents) ? completedTrustIncidents : []).forEach((item) => {
    const environment = String(item.environment || "unknown");
    if (!grouped.has(environment)) {
      grouped.set(environment, {
        environment,
        archivedCount: 0,
        latestArchivedAt: null,
        recentWorkspaces: [],
      });
    }
    const entry = grouped.get(environment);
    entry.archivedCount += 1;
    if (!entry.latestArchivedAt || new Date(item.archivedAt || 0).getTime() > new Date(entry.latestArchivedAt || 0).getTime()) {
      entry.latestArchivedAt = item.archivedAt || null;
    }
    if (entry.recentWorkspaces.length < 3) {
      entry.recentWorkspaces.push(item.workspaceName);
    }
  });
  return [...grouped.values()].sort((a, b) => b.archivedCount - a.archivedCount || a.environment.localeCompare(b.environment));
}

function buildEnvironmentTrustRecaps(
  approvalTrustEnvironments = [],
  approvalTrustSignals = [],
  completedTrustEnvironments = []
) {
  const completedMap = new Map(
    (Array.isArray(completedTrustEnvironments) ? completedTrustEnvironments : []).map((item) => [String(item.environment), item])
  );
  const signalCounts = new Map();
  (Array.isArray(approvalTrustSignals) ? approvalTrustSignals : []).forEach((item) => {
    const environment = String(item.environment || "global");
    signalCounts.set(environment, (signalCounts.get(environment) || 0) + 1);
  });

  return (Array.isArray(approvalTrustEnvironments) ? approvalTrustEnvironments : [])
    .map((item) => {
      const completed = completedMap.get(String(item.environment));
      return {
        environment: item.environment,
        score: Number(item.score || 0),
        activeSignals: Number(signalCounts.get(String(item.environment)) || 0),
        completedArchived: Number(completed?.archivedCount || 0),
        latestArchivedAt: completed?.latestArchivedAt || null,
      };
    })
    .sort((a, b) => {
      if (a.activeSignals !== b.activeSignals) {
        return b.activeSignals - a.activeSignals;
      }
      if (a.completedArchived !== b.completedArchived) {
        return b.completedArchived - a.completedArchived;
      }
      return a.environment.localeCompare(b.environment);
    });
}

function filterTrustCollaborationScope(collaboration = {}, trustEnvironment = "all") {
  const selected = String(trustEnvironment || "all");
  if (!selected || selected === "all") {
    return collaboration;
  }

  return {
    ...collaboration,
    approvalTrustEnvironments: (Array.isArray(collaboration.approvalTrustEnvironments) ? collaboration.approvalTrustEnvironments : []).filter(
      (item) => String(item.environment) === selected
    ),
    environmentTrustRecaps: (Array.isArray(collaboration.environmentTrustRecaps) ? collaboration.environmentTrustRecaps : []).filter(
      (item) => String(item.environment) === selected
    ),
    approvalTrustTrends: (Array.isArray(collaboration.approvalTrustTrends) ? collaboration.approvalTrustTrends : []).filter(
      (item) => String(item.environment) === selected
    ),
    approvalTrustSignals: (Array.isArray(collaboration.approvalTrustSignals) ? collaboration.approvalTrustSignals : []).filter(
      (item) => !item.environment || String(item.environment) === selected
    ),
    completedTrustEnvironments: (Array.isArray(collaboration.completedTrustEnvironments) ? collaboration.completedTrustEnvironments : []).filter(
      (item) => String(item.environment) === selected
    ),
    completedTrustIncidents: (Array.isArray(collaboration.completedTrustIncidents) ? collaboration.completedTrustIncidents : []).filter(
      (item) => String(item.environment) === selected
    ),
  };
}

module.exports = {
  buildApprovalTrustDashboard,
  buildApprovalTrustEnvironmentSummaries,
  buildApprovalTrustTrends,
  buildApprovalTrustSignals,
  buildApprovalRecommendationFamilyHistory,
  buildCompletedTrustIncidents,
  buildCompletedTrustEnvironmentSummaries,
  buildEnvironmentTrustRecaps,
  filterTrustCollaborationScope,
};
