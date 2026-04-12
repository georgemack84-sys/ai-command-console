function summarizeWorkspacePolicyOverride(override = {}) {
  if (!override || typeof override !== "object" || !Object.keys(override).length) {
    return null;
  }
  const parts = [];
  if (override.environment) {
    parts.push(`env ${override.environment}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "requireApprovalForResolved")) {
    parts.push(`resolve approval ${override.requireApprovalForResolved ? "on" : "off"}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "requireApprovalForArchived")) {
    parts.push(`archive approval ${override.requireApprovalForArchived ? "on" : "off"}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "incidentApprovalCapacityLimit")) {
    parts.push(`capacity ${override.incidentApprovalCapacityLimit}`);
  }
  if (override.trustDropAction) {
    parts.push(`trust ${override.trustDropAction}`);
  }
  return parts.slice(0, 4).join(" • ");
}

function normalizePolicyPlaybookPayload(payload = {}, actor = { id: "system", name: "System" }) {
  const name = String(payload.name || "").trim();
  if (!name) {
    return { ok: false, error: "Playbook name is required." };
  }
  return {
    ok: true,
    playbook: {
      id: String(payload.id || `policy_playbook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      name,
      environment: String(payload.environment || "development"),
      incidentApprovalCapacityLimit: Math.max(1, Number(payload.incidentApprovalCapacityLimit || 1)),
      trustDropAction: String(payload.trustDropAction || "notify"),
      requireApprovalForResolved: Boolean(payload.requireApprovalForResolved),
      promoteTrustDropToIncident: Boolean(payload.promoteTrustDropToIncident),
      updatedAt: new Date().toISOString(),
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  };
}

function listDefaultPolicyPlaybookPresets() {
  return [
    {
      id: "preset_development_watch",
      name: "Development Watch",
      environment: "development",
      incidentApprovalCapacityLimit: 3,
      trustDropAction: "notify",
      requireApprovalForResolved: false,
      promoteTrustDropToIncident: false,
      description: "Lightweight monitoring for lower-risk clusters with fast visibility and no extra closeout approval.",
    },
    {
      id: "preset_staging_watch",
      name: "Staging Watch",
      environment: "staging",
      incidentApprovalCapacityLimit: 2,
      trustDropAction: "digest",
      requireApprovalForResolved: true,
      promoteTrustDropToIncident: false,
      description: "Digest-heavy review mode for pre-production clusters that still keeps human approval in the loop.",
    },
    {
      id: "preset_production_recovery",
      name: "Production Recovery",
      environment: "production",
      incidentApprovalCapacityLimit: 1,
      trustDropAction: "followup",
      requireApprovalForResolved: true,
      promoteTrustDropToIncident: true,
      description: "Strict recovery posture for high-risk clusters with follow-up creation and trust-incident promotion enabled.",
    },
  ];
}

function summarizePolicyPlaybookRollouts(rollouts = []) {
  const normalized = Array.isArray(rollouts) ? rollouts : [];
  const environmentCounts = new Map();

  normalized.forEach((item) => {
    const environment = String(item.environment || "development");
    environmentCounts.set(environment, (environmentCounts.get(environment) || 0) + 1);
  });

  return {
    recent: normalized
      .slice()
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .slice(0, 8),
    byEnvironment: [...environmentCounts.entries()].map(([environment, rolloutCount]) => ({
      environment,
      rolloutCount,
    })),
  };
}

function buildPolicyPlaybookAdoptionSummary(
  rollouts = [],
  savedPlaybooks = [],
  presets = [],
  digestWorkspaceHealth = [],
  completedTrustIncidents = []
) {
  const normalizedRollouts = Array.isArray(rollouts) ? rollouts : [];
  const workspaces = Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [];
  const completedTrust = Array.isArray(completedTrustIncidents) ? completedTrustIncidents : [];
  const savedMap = new Map((Array.isArray(savedPlaybooks) ? savedPlaybooks : []).map((item) => [String(item.id), item]));
  const presetMap = new Map((Array.isArray(presets) ? presets : []).map((item) => [String(item.id), item]));
  const workspaceMap = new Map(workspaces.map((item) => [String(item.workspaceId), item]));
  const completedTrustIds = new Set(completedTrust.map((item) => String(item.workspaceId)));
  const entries = new Map();

  normalizedRollouts.forEach((rollout) => {
    const playbookId = String(rollout.playbookId || "");
    const source = presetMap.has(playbookId) ? "preset" : savedMap.has(playbookId) ? "saved" : "custom";
    const key = `${source}:${playbookId || rollout.playbookName || "unknown"}`;
    if (!entries.has(key)) {
      entries.set(key, {
        playbookId: playbookId || null,
        playbookName: String(rollout.playbookName || "Unknown playbook"),
        source,
        environment: String(
          rollout.environment ||
            savedMap.get(playbookId)?.environment ||
            presetMap.get(playbookId)?.environment ||
            "development"
        ),
        rolloutCount: 0,
        workspaceCount: 0,
        latestAppliedAt: null,
        recoveredWorkspaceCount: 0,
        activeRiskWorkspaceCount: 0,
        completedTrustCount: 0,
      });
    }

    const current = entries.get(key);
    current.rolloutCount += 1;
    current.workspaceCount += Number(rollout.workspaceCount || 0);
    const touchedWorkspaceIds = Array.isArray(rollout.workspaceIds) ? rollout.workspaceIds.map((item) => String(item)) : [];
    touchedWorkspaceIds.forEach((workspaceId) => {
      const workspace = workspaceMap.get(workspaceId);
      if (workspace) {
        const stableStatus = !["error", "stalled"].includes(String(workspace.status || ""));
        const settledIncident = ["ready_for_closeout", "resolved", "shared", "archived"].includes(
          String(workspace.incidentStatus || "")
        );
        if (stableStatus && settledIncident) {
          current.recoveredWorkspaceCount += 1;
        } else {
          current.activeRiskWorkspaceCount += 1;
        }
      }
      if (completedTrustIds.has(workspaceId)) {
        current.completedTrustCount += 1;
      }
    });
    if (!current.latestAppliedAt || new Date(rollout.appliedAt || 0).getTime() > new Date(current.latestAppliedAt || 0).getTime()) {
      current.latestAppliedAt = rollout.appliedAt || null;
    }
  });

  const items = [...entries.values()].sort((a, b) => {
    if (a.rolloutCount !== b.rolloutCount) {
      return b.rolloutCount - a.rolloutCount;
    }
    if (a.workspaceCount !== b.workspaceCount) {
      return b.workspaceCount - a.workspaceCount;
    }
    return a.playbookName.localeCompare(b.playbookName);
  });

  const recommendations = items
    .map((item) => {
      if (item.rolloutCount < 1) {
        return null;
      }
      if (item.recoveredWorkspaceCount >= item.activeRiskWorkspaceCount && item.recoveredWorkspaceCount > 0) {
        return {
          id: `playbook_recommendation_prefer_${item.playbookId || item.playbookName}`,
          tone: "healthy",
          title: `Prefer ${item.playbookName}`,
          detail: `${item.playbookName} has stabilized ${item.recoveredWorkspaceCount} workspace${item.recoveredWorkspaceCount === 1 ? "" : "s"} with ${item.activeRiskWorkspaceCount} still at risk.`,
          environment: item.environment,
          playbookId: item.playbookId,
          playbookName: item.playbookName,
          kind: "prefer",
          source: item.source,
        };
      }
      if (item.activeRiskWorkspaceCount > item.recoveredWorkspaceCount) {
        return {
          id: `playbook_recommendation_review_${item.playbookId || item.playbookName}`,
          tone: "warning",
          title: `Review ${item.playbookName}`,
          detail: `${item.playbookName} still leaves ${item.activeRiskWorkspaceCount} workspace${item.activeRiskWorkspaceCount === 1 ? "" : "s"} at risk versus ${item.recoveredWorkspaceCount} recovered.`,
          environment: item.environment,
          playbookId: item.playbookId,
          playbookName: item.playbookName,
          kind: "review",
          source: item.source,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6);

  return {
    totalTracked: items.length,
    presetCount: items.filter((item) => item.source === "preset").length,
    savedCount: items.filter((item) => item.source === "saved").length,
    items: items.slice(0, 8),
    recommendations,
  };
}

function buildGlobalOperationsSummary(
  digestWorkspaceHealth = [],
  digestEscalations = [],
  incidentApprovalPressure = [],
  approvalTrustEnvironments = [],
  approvalTrustSignals = [],
  completedTrustIncidents = [],
  policyPlaybookRollouts = []
) {
  const workspaces = Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [];
  const trustEnvironments = Array.isArray(approvalTrustEnvironments) ? approvalTrustEnvironments : [];
  const trustSignals = Array.isArray(approvalTrustSignals) ? approvalTrustSignals : [];
  const completedTrust = Array.isArray(completedTrustIncidents) ? completedTrustIncidents : [];
  const pressure = Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [];
  const rolloutSummary = summarizePolicyPlaybookRollouts(policyPlaybookRollouts);
  const rolloutCounts = new Map(
    rolloutSummary.byEnvironment.map((item) => [String(item.environment), Number(item.rolloutCount || 0)])
  );

  const environmentMetrics = new Map();
  trustEnvironments.forEach((item) => {
    environmentMetrics.set(String(item.environment), {
      environment: String(item.environment),
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: Number(item.score || 0),
    });
  });

  workspaces.forEach((workspace) => {
    const environment = String(workspace.incidentPolicy?.environment || "development");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.workspaceCount += 1;
    if (workspace.hasPolicyOverride) {
      current.overrideCount += 1;
    }
    if (["error", "stalled"].includes(String(workspace.status || ""))) {
      current.unhealthyCount += 1;
    }
    if (!["ready_for_closeout", "resolved", "shared", "archived"].includes(String(workspace.incidentStatus || ""))) {
      current.openIncidents += 1;
    }
    if (workspace.incidentApproval?.state === "pending") {
      current.pendingApprovals += 1;
      if (workspace.incidentApprovalSla?.finalEscalated) {
        current.finalEscalations += 1;
      }
    }
    environmentMetrics.set(environment, current);
  });

  trustSignals.forEach((signal) => {
    const environment = String(signal.environment || "global");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.activeTrustSignals += 1;
    environmentMetrics.set(environment, current);
  });

  completedTrust.forEach((item) => {
    const environment = String(item.environment || "development");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.completedTrustIncidents += 1;
    environmentMetrics.set(environment, current);
  });

  const hotspots = workspaces
    .map((workspace) => ({
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      status: workspace.status,
      incidentStatus: workspace.incidentStatus,
      environment: String(workspace.incidentPolicy?.environment || "development"),
      hasPolicyOverride: Boolean(workspace.hasPolicyOverride),
      policyOverrideSummary: workspace.policyOverrideSummary || null,
      dueUsers: Number(workspace.dueUsers || 0),
      overdueIntervals: Number(workspace.overdueIntervals || 0),
      pendingApprovalTarget: workspace.incidentApproval?.state === "pending" ? workspace.incidentApproval.approverTarget || null : null,
      finalEscalated: Boolean(workspace.incidentApprovalSla?.finalEscalated),
    }))
    .sort((a, b) => {
      const priority = { error: 0, stalled: 1, active: 2, resolved: 3, healthy: 4, idle: 5 };
      if (Boolean(a.finalEscalated) !== Boolean(b.finalEscalated)) {
        return a.finalEscalated ? -1 : 1;
      }
      return (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || b.overdueIntervals - a.overdueIntervals;
    })
    .slice(0, 6);

  const pressureTargets = pressure
    .map((entry) => ({
      target: entry.target,
      pendingCount: Number(entry.pendingCount || 0),
      overdueCount: Number(entry.overdueCount || 0),
      finalEscalatedCount: Number(entry.finalEscalatedCount || 0),
      workspaceCount: Array.isArray(entry.workspaces) ? entry.workspaces.length : 0,
    }))
    .slice(0, 6);

  return {
    totals: {
      workspaceCount: workspaces.length,
      overriddenWorkspaces: workspaces.filter((item) => Boolean(item.hasPolicyOverride)).length,
      unhealthyWorkspaces: workspaces.filter((item) => ["error", "stalled"].includes(String(item.status || ""))).length,
      openIncidents: workspaces.filter((item) => !["ready_for_closeout", "resolved", "shared", "archived"].includes(String(item.incidentStatus || ""))).length,
      pendingApprovals: workspaces.filter((item) => item.incidentApproval?.state === "pending").length,
      finalEscalations: workspaces.filter((item) => Boolean(item.incidentApprovalSla?.finalEscalated)).length,
      activeTrustSignals: trustSignals.length,
      activeDigestEscalations: Array.isArray(digestEscalations) ? digestEscalations.length : 0,
      completedTrustIncidents: completedTrust.length,
      playbookRollouts: rolloutSummary.recent.length,
    },
    environments: [...environmentMetrics.values()]
      .map((item) => ({
        ...item,
        playbookRollouts: Number(rolloutCounts.get(String(item.environment)) || 0),
      }))
      .sort((a, b) => {
        if (a.unhealthyCount !== b.unhealthyCount) {
          return b.unhealthyCount - a.unhealthyCount;
        }
        if (a.activeTrustSignals !== b.activeTrustSignals) {
          return b.activeTrustSignals - a.activeTrustSignals;
        }
        return a.environment.localeCompare(b.environment);
      }),
    hotspots,
    pressureTargets,
    playbookRollouts: rolloutSummary.recent,
  };
}

module.exports = {
  summarizeWorkspacePolicyOverride,
  normalizePolicyPlaybookPayload,
  listDefaultPolicyPlaybookPresets,
  summarizePolicyPlaybookRollouts,
  buildPolicyPlaybookAdoptionSummary,
  buildGlobalOperationsSummary,
};
