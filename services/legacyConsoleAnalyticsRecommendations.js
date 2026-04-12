function buildWorkspaceBackupApproverSuggestion(workspaceId, digestWorkspaceHealth = [], approvalThroughput = { targets: [] }, deps) {
  const workspaceHealth = (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : []).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth) {
    return null;
  }

  const currentTargets = new Set(
    [workspaceHealth.incidentApproverTarget, workspaceHealth.backupApproverTarget]
      .map((item) => deps.normalizeTarget(item))
      .filter(Boolean)
  );
  const throughputByTarget = new Map(
    (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : []).map((entry) => [entry.target, entry])
  );

  const eligibleUsers = deps.listWorkspaceUsers(workspaceId)
    .filter((user) => ["approver", "admin"].includes(deps.normalizeRole(user.role)))
    .map((user) => {
      const target = `user:${user.id}`;
      const throughput = throughputByTarget.get(target);
      return {
        target,
        name: user.name || user.id,
        pending: Number(throughput?.pending || 0),
        averageApprovalMs: throughput?.averageApprovalMs ?? 0,
      };
    })
    .filter((entry) => !currentTargets.has(deps.normalizeTarget(entry.target)))
    .sort((a, b) => (a.pending - b.pending) || (a.averageApprovalMs - b.averageApprovalMs) || a.name.localeCompare(b.name));

  return eligibleUsers[0]?.target || null;
}

function buildRecommendationConfidence(kind, { pressureEntry = null, throughputTargetEntry = null, workspaceEntry = null } = {}) {
  let score = 0.5;
  if (kind === "capacity" && pressureEntry) {
    score = Math.min(
      0.98,
      0.55 + Number(pressureEntry.finalEscalatedCount || 0) * 0.18 + Number(pressureEntry.overdueCount || 0) * 0.06
    );
  } else if (kind === "throughput" && throughputTargetEntry) {
    const avgMinutes = Math.round(Number(throughputTargetEntry.averageApprovalMs || 0) / 60000);
    score = Math.min(
      0.95,
      0.5 + Math.min(avgMinutes / 120, 0.25) + Math.min(Number(throughputTargetEntry.pending || 0) * 0.04, 0.16)
    );
  } else if (kind === "workspace" && workspaceEntry) {
    score = Math.min(
      0.94,
      0.52 + Math.min(Number(workspaceEntry.autoRerouted || 0) * 0.16, 0.24) + Math.min(Number(workspaceEntry.rerouted || 0) * 0.08, 0.18)
    );
  }

  let label = "medium";
  if (score >= 0.8) {
    label = "high";
  } else if (score < 0.6) {
    label = "low";
  }
  return { score: Math.round(score * 100) / 100, label };
}

function buildApprovalPolicyRecommendations(
  incidentApprovalPressure = [],
  approvalThroughput = { targets: [], workspaces: [], totals: {} },
  environmentPolicy = {},
  digestWorkspaceHealth = [],
  deps
) {
  const recommendations = [];
  const currentCapacityLimit = Math.max(1, Number(environmentPolicy.incidentApprovalCapacityLimit || 1));

  (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [])
    .filter((entry) => entry.finalEscalatedCount > 0 || entry.overdueCount >= Math.max(2, currentCapacityLimit))
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedCapacityLimit = Math.max(1, currentCapacityLimit - 1);
      const confidence = buildRecommendationConfidence("capacity", { pressureEntry: entry });
      recommendations.push({
        id: `approval-policy-pressure:${entry.target}`,
        title: `Reduce load on ${entry.target}`,
        detail:
          entry.finalEscalatedCount > 0
            ? `${entry.target} has ${entry.finalEscalatedCount} final-escalated approvals. Consider lowering capacity or routing more work to a backup approver.`
            : `${entry.target} has ${entry.overdueCount} overdue approvals. Consider lowering capacity or assigning a backup approver.`,
        kind: "capacity",
        confidence,
        target: entry.target,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-pressure:${entry.target}`,
            recommendationTitle: `Reduce load on ${entry.target}`,
            recommendationKind: "capacity",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-pressure:${entry.target}`,
            recommendationTitle: `Reduce load on ${entry.target}`,
            recommendationKind: "capacity",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
      });
    });

  (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : [])
    .filter((entry) => entry.averageApprovalMs !== null && entry.averageApprovalMs > 30 * 60 * 1000)
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedCapacityLimit = Math.max(1, currentCapacityLimit - 1);
      const confidence = buildRecommendationConfidence("throughput", { throughputTargetEntry: entry });
      recommendations.push({
        id: `approval-policy-throughput:${entry.target}`,
        title: `Reroute slower approvals away from ${entry.target}`,
        detail: `${entry.target} is averaging ${Math.round((entry.averageApprovalMs || 0) / 60000)} minutes per approval. Consider assigning a stronger backup or lowering their capacity limit.`,
        kind: "throughput",
        confidence,
        target: entry.target,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-throughput:${entry.target}`,
            recommendationTitle: `Reroute slower approvals away from ${entry.target}`,
            recommendationKind: "throughput",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-throughput:${entry.target}`,
            recommendationTitle: `Reroute slower approvals away from ${entry.target}`,
            recommendationKind: "throughput",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
      });
    });

  (Array.isArray(approvalThroughput.workspaces) ? approvalThroughput.workspaces : [])
    .filter((entry) => entry.autoRerouted > 0 || entry.rerouted >= 2)
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedBackupApproverTarget = buildWorkspaceBackupApproverSuggestion(
        entry.workspaceId,
        digestWorkspaceHealth,
        approvalThroughput,
        deps
      );
      const confidence = buildRecommendationConfidence("workspace", { workspaceEntry: entry });
      const workspaceActionPayload = suggestedBackupApproverTarget
        ? {
            recommendationId: `approval-policy-workspace:${entry.workspaceId}`,
            recommendationTitle: `Tune approval policy for ${entry.workspaceName}`,
            recommendationKind: "workspace",
            workspaceId: entry.workspaceId,
            suggestedBackupApproverTarget,
          }
        : {
            recommendationId: `approval-policy-workspace:${entry.workspaceId}`,
            recommendationTitle: `Tune approval policy for ${entry.workspaceName}`,
            recommendationKind: "workspace",
            workspaceId: entry.workspaceId,
            environment: environmentPolicy.currentEnvironment || "development",
            suggestedCapacityLimit: Math.max(1, currentCapacityLimit - 1),
          };
      recommendations.push({
        id: `approval-policy-workspace:${entry.workspaceId}`,
        title: `Tune approval policy for ${entry.workspaceName}`,
        detail:
          entry.autoRerouted > 0
            ? `${entry.workspaceName} has already needed ${entry.autoRerouted} automatic reroutes. ${
                suggestedBackupApproverTarget
                  ? `Set ${suggestedBackupApproverTarget} as the backup approver to absorb overflow earlier.`
                  : "Consider a dedicated backup approver or tighter capacity settings."
              }`
            : `${entry.workspaceName} has needed repeated manual reroutes. ${
                suggestedBackupApproverTarget
                  ? `Pre-assign ${suggestedBackupApproverTarget} as the backup approver.`
                  : "Consider pre-assigning a backup approver or lowering the primary approver capacity."
              }`,
        kind: "workspace",
        confidence,
        workspaceId: entry.workspaceId,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: workspaceActionPayload,
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: workspaceActionPayload,
        },
      });
    });

  const deduped = new Map();
  recommendations.forEach((item) => {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  });
  return [...deduped.values()].slice(0, 6);
}

function summarizeApprovalPolicyRecommendationEffect(payload, outcome) {
  if (outcome?.backupApproverTarget && payload.workspaceId) {
    return `Assigned ${outcome.backupApproverTarget} as the backup approver for ${payload.workspaceId}.`;
  }
  return `Set the ${outcome?.environment || payload.environment || "active"} approval capacity limit to ${outcome?.capacityLimit || payload.suggestedCapacityLimit || 1}.`;
}

function buildApprovalPolicyMetricsSnapshot(payload = {}, deps) {
  const digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus());
  const collaboration = deps.loadCollaborationState();
  const pressure = deps.buildIncidentApprovalPressure(digestWorkspaceHealth);
  const throughput = deps.buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth);
  const workspaceId = String(payload.workspaceId || "");
  const target = String(payload.target || "");
  return {
    targetPressure: target ? pressure.find((item) => item.target === target) || null : null,
    targetThroughput: target ? throughput.targets.find((item) => item.target === target) || null : null,
    workspaceThroughput: workspaceId ? throughput.workspaces.find((item) => item.workspaceId === workspaceId) || null : null,
  };
}

function evaluateAppliedApprovalPolicyImpact(entry, incidentApprovalPressure = [], approvalThroughput = { targets: [], workspaces: [] }) {
  const targetPressure = entry.target
    ? (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : []).find((item) => item.target === entry.target) || null
    : null;
  const targetThroughput = entry.target
    ? (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : []).find((item) => item.target === entry.target) || null
    : null;
  const workspaceThroughput = entry.workspaceId
    ? (Array.isArray(approvalThroughput.workspaces) ? approvalThroughput.workspaces : []).find((item) => item.workspaceId === entry.workspaceId) || null
    : null;
  const baselinePressure = entry.metricsSnapshot?.targetPressure || null;
  const baselineTargetThroughput = entry.metricsSnapshot?.targetThroughput || null;
  const baselineWorkspaceThroughput = entry.metricsSnapshot?.workspaceThroughput || null;
  const beforeOverdue = Number(baselinePressure?.overdueCount || 0);
  const afterOverdue = Number(targetPressure?.overdueCount || 0);
  const beforeAvg = Number(baselineTargetThroughput?.averageApprovalMs || baselineWorkspaceThroughput?.averageApprovalMs || 0);
  const afterAvg = Number(targetThroughput?.averageApprovalMs || workspaceThroughput?.averageApprovalMs || 0);
  const beforePending = Number(baselinePressure?.pendingCount || baselineTargetThroughput?.pending || 0);
  const afterPending = Number(targetPressure?.pendingCount || targetThroughput?.pending || 0);
  const beforeAutoReroutes = Number(baselineWorkspaceThroughput?.autoRerouted || 0);
  const afterAutoReroutes = Number(workspaceThroughput?.autoRerouted || 0);

  let status = "neutral";
  let summary = "No measurable impact yet.";
  if (entry.rolledBackAt) {
    status = "rolled_back";
    summary = `Rolled back on ${entry.rolledBackAt}.`;
  } else if (beforeOverdue || afterOverdue) {
    if (afterOverdue < beforeOverdue) {
      status = "improved";
      summary = `Overdue approvals dropped from ${beforeOverdue} to ${afterOverdue}.`;
    } else if (afterOverdue > beforeOverdue) {
      status = "regressed";
      summary = `Overdue approvals rose from ${beforeOverdue} to ${afterOverdue}.`;
    }
  } else if (beforeAvg || afterAvg) {
    if (beforeAvg && afterAvg && afterAvg < beforeAvg) {
      status = "improved";
      summary = `Average approval time improved from ${Math.round(beforeAvg / 60000)}m to ${Math.round(afterAvg / 60000)}m.`;
    } else if (beforeAvg && afterAvg && afterAvg > beforeAvg) {
      status = "regressed";
      summary = `Average approval time worsened from ${Math.round(beforeAvg / 60000)}m to ${Math.round(afterAvg / 60000)}m.`;
    }
  }

  return {
    status,
    summary,
    comparison: {
      overdueDelta: afterOverdue - beforeOverdue,
      pendingDelta: afterPending - beforePending,
      averageApprovalMinutesBefore: beforeAvg ? Math.round(beforeAvg / 60000) : null,
      averageApprovalMinutesAfter: afterAvg ? Math.round(afterAvg / 60000) : null,
      autoReroutesBefore: beforeAutoReroutes,
      autoReroutesAfter: afterAutoReroutes,
    },
    currentMetrics: {
      targetPressure,
      targetThroughput,
      workspaceThroughput,
    },
  };
}

module.exports = {
  buildWorkspaceBackupApproverSuggestion,
  buildRecommendationConfidence,
  buildApprovalPolicyRecommendations,
  summarizeApprovalPolicyRecommendationEffect,
  buildApprovalPolicyMetricsSnapshot,
  evaluateAppliedApprovalPolicyImpact,
};
