function buildAutomationResolutionByWorkspace(deps) {
  const resolution = new Map();
  deps.listAutomationFollowups(null).forEach((task) => {
    if (!task.workspaceId || !task.completedAt) {
      return;
    }
    const current = resolution.get(task.workspaceId);
    const completedAt = new Date(task.completedAt).getTime();
    if (!current || completedAt > new Date(current.completedAt).getTime()) {
      resolution.set(task.workspaceId, {
        taskId: task.id,
        completedAt: task.completedAt,
        description: task.description,
        ownerName: task.ownerName || null,
      });
    }
  });
  return resolution;
}

function buildIncidentApprovalsByWorkspace(deps) {
  const collaboration = deps.loadCollaborationState();
  const approvalsByWorkspace = new Map();

  (Array.isArray(collaboration.approvals) ? collaboration.approvals : [])
    .filter((approval) => approval.action === "collaboration:automation-set-status")
    .forEach((approval) => {
      const workspaceId = String(approval.payload?.workspaceId || "");
      if (!workspaceId) {
        return;
      }
      const current = approvalsByWorkspace.get(workspaceId) || [];
      current.push({
        id: approval.id,
        status: approval.status,
        requestedStatus: String(approval.payload?.incidentStatus || "open"),
        archiveRationale: approval.payload?.archiveRationale || null,
        approverTarget: approval.approverTarget || null,
        routingMode: approval.routingMode || null,
        routingReason: approval.routingReason || null,
        routedFromTarget: approval.routedFromTarget || null,
        requestedById: approval.requestedById || null,
        requestedByName: approval.requestedByName || null,
        createdAt: approval.createdAt || null,
        resolvedAt: approval.resolvedAt || null,
        approvedById: approval.approvedById || null,
        approvedByName: approval.approvedByName || null,
        rejectedById: approval.rejectedById || null,
        rejectedByName: approval.rejectedByName || null,
        rejectionNote: approval.rejectionNote || null,
        label: approval.label || approval.action,
      });
      approvalsByWorkspace.set(workspaceId, current);
    });

  return approvalsByWorkspace;
}

function defaultAlertWorkflow() {
  return {
    acknowledged: false,
    acknowledgedAt: null,
    owner: null,
    resolved: false,
    resolvedAt: null,
    resolutionNote: null,
    notes: [],
  };
}

function buildDigestWorkspaceHealth(digestScheduler, deps) {
  const collaboration = deps.loadCollaborationState();
  const workspaceOverrides =
    collaboration.governance?.workspacePolicyOverrides && typeof collaboration.governance.workspacePolicyOverrides === "object"
      ? collaboration.governance.workspacePolicyOverrides
      : {};
  const resolutions = buildAutomationResolutionByWorkspace(deps);
  const incidentApprovals = buildIncidentApprovalsByWorkspace(deps);
  return deps
    .listAllWorkspaceIds()
    .map((workspaceId) => {
      const workspaceOverride = workspaceOverrides[workspaceId] || null;
      const incidentPolicy = deps.getIncidentPolicy(collaboration.governance, workspaceId);
      const members = deps.listWorkspaceUsers(workspaceId);
      const enabledUsers = members.filter((user) => deps.getDigestPreferences(user.id).enabled);
      const eligibleUsers = enabledUsers.filter((user) =>
        deps.shouldGenerateDigestForUser(user, collaboration, workspaceId, {}, deps.digestDeps)
      );
      const workspaceState = deps.getDigestWorkspaceState(workspaceId);
      const incidentChecklist = deps.defaultIncidentChecklist(workspaceState.incidentChecklist);
      const workspaceApprovals = (incidentApprovals.get(workspaceId) || [])
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const pendingIncidentApproval = workspaceApprovals.find((approval) => approval.status === "pending") || null;
      const latestResolvedIncidentApproval =
        workspaceApprovals.find((approval) => approval.status === "approved" || approval.status === "rejected") || null;
      const incidentApprovalSla = deps.buildIncidentApprovalSla(pendingIncidentApproval, incidentPolicy);
      const lastSweepRunAt = workspaceState.lastSweepRunAt || null;
      const lastSweepQueuedAt = workspaceState.lastSweepQueuedAt || null;
      const staleAfterMs = Math.max(Number(digestScheduler.intervalMs || 60_000) * 6, 30 * 60 * 1000);
      const lastSweepAgeMs = lastSweepRunAt ? Math.max(0, Date.now() - new Date(lastSweepRunAt).getTime()) : null;
      const hasDigestCoverage = enabledUsers.length > 0;
      const resolution = resolutions.get(workspaceId) || null;
      const issueTimestamp = lastSweepRunAt || lastSweepQueuedAt || null;
      const resolved = Boolean(
        resolution && (!issueTimestamp || new Date(resolution.completedAt).getTime() >= new Date(issueTimestamp).getTime())
      );
      const incidentStatus = workspaceState.incidentStatus || (resolved ? "ready_for_closeout" : "open");
      const stalled = hasDigestCoverage && (!lastSweepRunAt || Boolean(lastSweepAgeMs && lastSweepAgeMs > staleAfterMs));
      const status = !hasDigestCoverage
        ? "idle"
        : resolved
          ? "resolved"
          : workspaceState.lastSweepError
            ? "error"
            : stalled
              ? "stalled"
              : eligibleUsers.length
                ? "active"
                : "healthy";

      const transitionState = deps.getIncidentTransitionState(
        {
          workspaceId,
          incidentStatus,
          incidentChecklist,
        },
        collaboration.governance
      );

      return {
        workspaceId,
        workspaceName: deps.getWorkspaceName(workspaceId),
        memberCount: members.length,
        digestEnabledUsers: enabledUsers.length,
        dueUsers: eligibleUsers.length,
        lastSweepRunAt,
        lastSweepQueuedAt,
        lastGeneratedCount: Number(workspaceState.lastGeneratedCount || 0),
        lastSweepError: workspaceState.lastSweepError || null,
        escalationOwner: workspaceState.escalationOwner || null,
        incidentApproverTarget: workspaceState.incidentApproverTarget || null,
        backupApproverTarget: workspaceState.backupApproverTarget || null,
        snoozedUntil: workspaceState.snoozedUntil || null,
        resolutionTaskId: resolution?.taskId || null,
        resolutionCompletedAt: resolution?.completedAt || null,
        resolutionDescription: resolution?.description || null,
        resolutionOwnerName: resolution?.ownerName || null,
        incidentSummary: workspaceState.incidentSummary || null,
        incidentSummaryUpdatedAt: workspaceState.incidentSummaryUpdatedAt || null,
        incidentHandoffDraft: workspaceState.incidentHandoffDraft || null,
        incidentHandoffDraftUpdatedAt: workspaceState.incidentHandoffDraftUpdatedAt || null,
        incidentArchiveRecommendation: workspaceState.incidentArchiveRecommendation || null,
        incidentStatus,
        incidentStatusUpdatedAt: workspaceState.incidentStatusUpdatedAt || null,
        hasPolicyOverride: Boolean(workspaceOverride && Object.keys(workspaceOverride).length),
        policyOverrideSummary: deps.summarizeWorkspacePolicyOverride(workspaceOverride),
        incidentChecklist,
        incidentApproval: pendingIncidentApproval
          ? { state: "pending", ...pendingIncidentApproval }
          : latestResolvedIncidentApproval
            ? { state: latestResolvedIncidentApproval.status, ...latestResolvedIncidentApproval }
            : null,
        incidentApprovalHistory: workspaceApprovals.slice(0, 6),
        incidentApprovalSla,
        incidentPolicy: transitionState.policy,
        incidentReadiness: {
          canResolve: transitionState.canResolve,
          canArchive: transitionState.canArchive,
          resolveBlockers: transitionState.resolveBlockers,
          archiveBlockers: transitionState.archiveBlockers,
        },
        events: Array.isArray(workspaceState.events) ? workspaceState.events.slice(0, 10) : [],
        overdueIntervals: lastSweepRunAt
          ? Math.max(0, Math.floor((lastSweepAgeMs || 0) / Math.max(Number(digestScheduler.intervalMs || 60_000), 1)))
          : hasDigestCoverage
            ? 999
            : 0,
        status,
      };
    })
    .sort((a, b) => {
      const priority = { error: 0, stalled: 1, active: 2, resolved: 3, healthy: 4, idle: 5 };
      return (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || a.workspaceId.localeCompare(b.workspaceId);
    });
}

function buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth, deps) {
  const alerts = [];
  const staleState = deps.computeDigestSchedulerStaleState(digestScheduler);

  if (digestScheduler.lastError) {
    alerts.push({
      id: "digest_scheduler_error",
      severity: "high",
      status: "active",
      title: "Digest scheduler failed during the last sweep.",
      details: {
        lastRunAt: digestScheduler.lastRunAt,
        error: digestScheduler.lastError,
      },
      workflow: defaultAlertWorkflow(),
      createdAt: digestScheduler.lastRunAt || new Date().toISOString(),
      clearedAt: null,
    });
  } else if (staleState.stale) {
    alerts.push({
      id: "digest_scheduler_stalled",
      severity: "moderate",
      status: "active",
      title: "Digest scheduler appears stalled.",
      details: {
        lastRunAt: digestScheduler.lastRunAt,
        staleAfterMs: staleState.staleAfterMs,
        ageMs: staleState.ageMs,
      },
      workflow: defaultAlertWorkflow(),
      createdAt: digestScheduler.lastRunAt || new Date().toISOString(),
      clearedAt: null,
    });
  }

  (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [])
    .filter((workspace) => workspace.status === "error" || workspace.status === "stalled")
    .slice(0, 4)
    .forEach((workspace) => {
      alerts.push({
        id: `digest_workspace_${workspace.workspaceId}`,
        severity: workspace.status === "error" ? "high" : "moderate",
        status: "active",
        title:
          workspace.status === "error"
            ? `Workspace ${workspace.workspaceId} has digest automation errors.`
            : `Workspace ${workspace.workspaceId} is overdue for a digest sweep.`,
        details: {
          workspaceId: workspace.workspaceId,
          digestEnabledUsers: workspace.digestEnabledUsers,
          dueUsers: workspace.dueUsers,
          lastSweepRunAt: workspace.lastSweepRunAt,
          lastSweepError: workspace.lastSweepError,
        },
        workflow: defaultAlertWorkflow(),
        createdAt: workspace.lastSweepRunAt || workspace.lastSweepQueuedAt || new Date().toISOString(),
        clearedAt: null,
      });
    });

  return alerts;
}

function buildApprovalPressureSignals(incidentApprovalPressure = []) {
  return (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [])
    .filter((entry) => entry.finalEscalatedCount > 0 || entry.overdueCount >= 2)
    .map((entry) => ({
      id: `approval-pressure:${entry.target}`,
      tone: entry.finalEscalatedCount > 0 ? "critical" : "warning",
      title:
        entry.finalEscalatedCount > 0
          ? `${entry.target} has final-escalated incident approvals`
          : `${entry.target} is building an overdue approval queue`,
      detail:
        entry.finalEscalatedCount > 0
          ? `${entry.finalEscalatedCount} final-escalated and ${entry.escalatedCount} escalated incident approvals are waiting on ${entry.target}.`
          : `${entry.overdueCount} overdue incident approvals are currently assigned to ${entry.target}.`,
      command: "digest:health",
      owner: entry.target,
    }));
}

function buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth, deps) {
  const signals = [];
  const staleState = deps.computeDigestSchedulerStaleState(digestScheduler);
  const approvalPressureSignals = buildApprovalPressureSignals(buildIncidentApprovalPressure(digestWorkspaceHealth));

  if (digestScheduler.lastError) {
    signals.push({
      id: "digest-escalation:scheduler-error",
      tone: "critical",
      title: "Digest scheduler needs operator attention",
      detail: `The last scheduler sweep failed${digestScheduler.lastRunAt ? ` at ${digestScheduler.lastRunAt}` : ""}.`,
      command: "digest:health",
    });
  } else if (staleState.stale && staleState.ageMs > staleState.staleAfterMs * 2) {
    signals.push({
      id: "digest-escalation:scheduler-stalled",
      tone: "warning",
      title: "Digest scheduler has missed multiple sweep windows",
      detail: "Automation health is stale enough that digests may no longer be reaching workspaces on time.",
      command: "digest:health",
    });
  }

  digestWorkspaceHealth
    .filter((workspace) => !workspace.snoozedUntil || new Date(workspace.snoozedUntil).getTime() <= Date.now())
    .filter((workspace) => workspace.status !== "resolved")
    .filter((workspace) => workspace.lastSweepError || (workspace.status === "stalled" && workspace.overdueIntervals >= 2))
    .slice(0, 6)
    .forEach((workspace) => {
      signals.push({
        id: `digest-escalation:${workspace.workspaceId}`,
        tone: workspace.lastSweepError ? "critical" : "warning",
        title: workspace.lastSweepError
          ? `Workspace ${workspace.workspaceId} digest automation is failing`
          : `Workspace ${workspace.workspaceId} has missed multiple digest intervals`,
        detail: workspace.lastSweepError
          ? `${workspace.lastSweepError}${workspace.escalationOwner ? ` • owner: ${workspace.escalationOwner}` : ""}`
          : `${workspace.dueUsers} due users and ${workspace.digestEnabledUsers} digest-enabled members are waiting on a sweep.${workspace.escalationOwner ? ` Owner: ${workspace.escalationOwner}.` : ""}`,
        command: "digest:health",
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        owner: workspace.escalationOwner || null,
        snoozedUntil: workspace.snoozedUntil || null,
      });
    });

  approvalPressureSignals.forEach((signal) => signals.push(signal));
  return signals;
}

function buildIncidentApprovalPressure(digestWorkspaceHealth = []) {
  const summary = new Map();

  (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [])
    .filter((workspace) => workspace.incidentApproval?.state === "pending")
    .forEach((workspace) => {
      const target = String(workspace.incidentApproval?.approverTarget || workspace.incidentApproverTarget || "unassigned");
      const current = summary.get(target) || {
        target,
        pendingCount: 0,
        overdueCount: 0,
        escalatedCount: 0,
        finalEscalatedCount: 0,
        oldestAgeMs: 0,
        workspaces: [],
      };
      current.pendingCount += 1;
      if (workspace.incidentApprovalSla?.overdue) current.overdueCount += 1;
      if (workspace.incidentApprovalSla?.escalated) current.escalatedCount += 1;
      if (workspace.incidentApprovalSla?.finalEscalated) current.finalEscalatedCount += 1;
      current.oldestAgeMs = Math.max(current.oldestAgeMs, Number(workspace.incidentApprovalSla?.ageMs || 0));
      current.workspaces.push({
        approvalId: workspace.incidentApproval?.id || null,
        approverTarget: workspace.incidentApproval?.approverTarget || workspace.incidentApproverTarget || null,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        requestedStatus: workspace.incidentApproval?.requestedStatus || "resolved",
        ageMs: Number(workspace.incidentApprovalSla?.ageMs || 0),
        overdue: Boolean(workspace.incidentApprovalSla?.overdue),
        escalated: Boolean(workspace.incidentApprovalSla?.escalated),
        finalEscalated: Boolean(workspace.incidentApprovalSla?.finalEscalated),
      });
      summary.set(target, current);
    });

  return [...summary.values()]
    .map((entry) => ({
      ...entry,
      workspaces: entry.workspaces
        .sort((a, b) => b.ageMs - a.ageMs || a.workspaceId.localeCompare(b.workspaceId))
        .slice(0, 6),
    }))
    .sort(
      (a, b) =>
        b.finalEscalatedCount - a.finalEscalatedCount ||
        b.escalatedCount - a.escalatedCount ||
        b.oldestAgeMs - a.oldestAgeMs ||
        a.target.localeCompare(b.target)
    )
    .slice(0, 8);
}

function buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth = [], deps) {
  const approvals = Array.isArray(collaboration?.approvals) ? collaboration.approvals : [];
  const approvalWorkspaces = new Map();
  (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : []).forEach((workspace) => {
    const items = [];
    if (workspace.incidentApproval?.id) items.push(workspace.incidentApproval);
    (Array.isArray(workspace.incidentApprovalHistory) ? workspace.incidentApprovalHistory : []).forEach((approval) => items.push(approval));
    items.forEach((approval) => {
      if (approval?.id) {
        approvalWorkspaces.set(String(approval.id), {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
        });
      }
    });
  });

  const targetStats = new Map();
  const workspaceStats = new Map();
  let manualReroutes = 0;
  let autoReroutes = 0;

  approvals
    .filter((approval) => approval.action === "collaboration:automation-set-status")
    .forEach((approval) => {
      const target = String(approval.approverTarget || "unassigned");
      const workspaceMeta = approvalWorkspaces.get(String(approval.id)) || {
        workspaceId: String(approval.payload?.workspaceId || "unknown"),
        workspaceName: deps.getWorkspaceName(String(approval.payload?.workspaceId || "unknown")),
      };
      const resolvedAt = approval.resolvedAt ? new Date(approval.resolvedAt).getTime() : null;
      const createdAt = approval.createdAt ? new Date(approval.createdAt).getTime() : null;
      const durationMs = createdAt && resolvedAt ? Math.max(0, resolvedAt - createdAt) : null;

      const targetEntry = targetStats.get(target) || {
        target,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        rerouted: 0,
        autoRerouted: 0,
        totalDurationMs: 0,
        resolvedCount: 0,
      };
      targetEntry.total += 1;
      if (approval.status === "approved") targetEntry.approved += 1;
      else if (approval.status === "rejected") targetEntry.rejected += 1;
      else targetEntry.pending += 1;
      if (approval.reassignedAt) {
        targetEntry.rerouted += 1;
        manualReroutes += 1;
      }
      if (approval.autoReroutedAt) {
        targetEntry.autoRerouted += 1;
        autoReroutes += 1;
      }
      if (durationMs !== null) {
        targetEntry.totalDurationMs += durationMs;
        targetEntry.resolvedCount += 1;
      }
      targetStats.set(target, targetEntry);

      const workspaceEntry = workspaceStats.get(workspaceMeta.workspaceId) || {
        workspaceId: workspaceMeta.workspaceId,
        workspaceName: workspaceMeta.workspaceName,
        total: 0,
        rerouted: 0,
        autoRerouted: 0,
        totalDurationMs: 0,
        resolvedCount: 0,
      };
      workspaceEntry.total += 1;
      if (approval.reassignedAt) workspaceEntry.rerouted += 1;
      if (approval.autoReroutedAt) workspaceEntry.autoRerouted += 1;
      if (durationMs !== null) {
        workspaceEntry.totalDurationMs += durationMs;
        workspaceEntry.resolvedCount += 1;
      }
      workspaceStats.set(workspaceMeta.workspaceId, workspaceEntry);
    });

  const targets = [...targetStats.values()]
    .map((entry) => ({
      target: entry.target,
      total: entry.total,
      approved: entry.approved,
      rejected: entry.rejected,
      pending: entry.pending,
      rerouted: entry.rerouted,
      autoRerouted: entry.autoRerouted,
      averageApprovalMs: entry.resolvedCount ? Math.round(entry.totalDurationMs / entry.resolvedCount) : null,
    }))
    .sort((a, b) => b.pending - a.pending || b.autoRerouted - a.autoRerouted || b.rerouted - a.rerouted || a.target.localeCompare(b.target))
    .slice(0, 8);

  const workspaces = [...workspaceStats.values()]
    .map((entry) => ({
      workspaceId: entry.workspaceId,
      workspaceName: entry.workspaceName,
      total: entry.total,
      rerouted: entry.rerouted,
      autoRerouted: entry.autoRerouted,
      averageApprovalMs: entry.resolvedCount ? Math.round(entry.totalDurationMs / entry.resolvedCount) : null,
    }))
    .sort((a, b) => b.autoRerouted - a.autoRerouted || b.rerouted - a.rerouted || b.total - a.total || a.workspaceId.localeCompare(b.workspaceId))
    .slice(0, 8);

  return {
    totals: {
      totalApprovals: approvals.filter((approval) => approval.action === "collaboration:automation-set-status").length,
      manualReroutes,
      autoReroutes,
      resolvedApprovals: targets.reduce((sum, entry) => sum + entry.approved + entry.rejected, 0),
    },
    targets,
    workspaces,
  };
}

module.exports = {
  buildAutomationResolutionByWorkspace,
  buildIncidentApprovalsByWorkspace,
  buildDigestWorkspaceHealth,
  buildDigestAutomationAlerts,
  buildDigestEscalationSignals,
  buildIncidentApprovalPressure,
  buildApprovalThroughputAnalytics,
};
