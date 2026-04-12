import { createRequire } from "node:module";
import type { SessionUser } from "@/src/lib/types";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { prisma } from "@/src/server/db/prisma";
import { readBackgroundJobs } from "@/src/server/jobs/background-jobs";
import { buildDefaultChecklist } from "@/src/server/services/workspace-operations-state-service";
import {
  getPolicyGovernanceSnapshot,
  saveWorkspacePolicyOverride as persistWorkspacePolicyOverride,
  updateGovernanceSettings,
} from "@/src/server/services/policy-governance-service";

const require = createRequire(import.meta.url);
const { getDigestSchedulerStatus } = require("../../../services/digestScheduler");

function currentEnvironment(value: string): "development" | "staging" | "production" {
  if (value === "production" || value === "staging") {
    return value;
  }
  return "development";
}

function workspaceSeverityScore(severities: string[]) {
  return severities.reduce((highest, severity) => {
    if (severity === "critical") return Math.max(highest, 4);
    if (severity === "high") return Math.max(highest, 3);
    if (severity === "medium") return Math.max(highest, 2);
    return Math.max(highest, 1);
  }, 0);
}

function workspaceStatusFromScore(score: number) {
  if (score >= 4) return { incidentStatus: "investigating", status: "error" };
  if (score >= 3) return { incidentStatus: "open", status: "stalled" };
  return { incidentStatus: "resolved", status: "healthy" };
}

function isCompletedIncidentStatus(status: string | null | undefined) {
  return ["resolved", "shared", "archived", "monitoring"].includes(String(status || ""));
}

function buildIncidentApprovalSla(
  createdAt: Date | null | undefined,
  incidentPolicy: {
    incidentApprovalReminderMinutes: number;
    incidentApprovalEscalationMinutes: number;
    incidentApprovalFinalEscalationMinutes: number;
  },
) {
  if (!createdAt) {
    return null;
  }

  const ageMs = Math.max(0, Date.now() - createdAt.getTime());
  const reminderDelayMs = Math.max(1, Number(incidentPolicy.incidentApprovalReminderMinutes || 30)) * 60 * 1000;
  const escalationDelayMs = Math.max(1, Number(incidentPolicy.incidentApprovalEscalationMinutes || 60)) * 60 * 1000;
  const finalEscalationDelayMs = Math.max(1, Number(incidentPolicy.incidentApprovalFinalEscalationMinutes || 180)) * 60 * 1000;

  return {
    ageMs,
    reminderDelayMs,
    escalationDelayMs,
    finalEscalationDelayMs,
    overdue: ageMs >= reminderDelayMs,
    escalated: ageMs >= escalationDelayMs,
    finalEscalated: ageMs >= finalEscalationDelayMs,
  };
}

export async function buildControlCenterOverview(user: SessionUser) {
  const runtime = getRuntimePosture();
  const governanceState = await getPolicyGovernanceSnapshot();
  const environment = currentEnvironment(governanceState.currentEnvironment || runtime.environment);
  const membershipFilter = user.role === "admin" ? {} : { members: { some: { userId: user.id } } };

  const [workspaces, recentActivity, jobsSnapshot] = await Promise.all([
    prisma.workspace.findMany({
      where: membershipFilter,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        updates: {
          orderBy: { happenedAt: "desc" },
          take: 8,
        },
        insights: {
          orderBy: { updatedAt: "desc" },
          take: 6,
        },
        activity: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: {
          orderBy: { updatedAt: "desc" },
          take: 3,
        },
        operationsState: true,
        operationsFollowups: {
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 8,
        },
        incidentApprovals: {
          orderBy: { createdAt: "desc" },
          take: 12,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.activityEvent.findMany({
      where: user.role === "admin" ? {} : { workspaceId: user.workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    Promise.resolve(readBackgroundJobs(30)),
  ]);

  const visibleWorkspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const visibleJobs = jobsSnapshot.items.filter((job: { payload?: Record<string, unknown> | null }) => {
    const workspaceId = typeof job.payload?.workspaceId === "string" ? job.payload.workspaceId : null;
    return !workspaceId || visibleWorkspaceIds.has(workspaceId);
  });

  const jobs = {
    total: visibleJobs.length,
    queued: visibleJobs.filter((job: { status: string }) => job.status === "queued").length,
    running: visibleJobs.filter((job: { status: string }) => job.status === "running").length,
    failed: visibleJobs.filter((job: { status: string }) => job.status === "failed").length,
    health: {
      activeWorkers: Number(jobsSnapshot.health?.activeWorkers || 0),
      pending: Number(jobsSnapshot.health?.pending || 0),
      saturated: Boolean(jobsSnapshot.health?.saturated),
      maxPendingJobs: Number(jobsSnapshot.health?.maxPendingJobs || 0),
      maxRunningJobs: Number(jobsSnapshot.health?.maxRunningJobs || 0),
      staleRunning: Number(jobsSnapshot.health?.staleRunning || 0),
      unhealthy: Boolean(jobsSnapshot.health?.unhealthy),
    },
    metrics: {
      avgQueueWaitMs: Number(jobsSnapshot.metrics.avgQueueWaitMs || 0),
      avgRunTimeMs: Number(jobsSnapshot.metrics.avgRunTimeMs || 0),
      completionRate: Number(jobsSnapshot.metrics.completionRate || 0),
      retryPressure: Number(jobsSnapshot.metrics.retryPressure || 0),
      scheduledRetryCount: Number(jobsSnapshot.metrics.scheduledRetries || 0),
      timedOut: Number(jobsSnapshot.metrics.timedOut || 0),
    },
    items: visibleJobs.slice(0, 12).map((job: {
      id: string;
      traceId?: string | null;
      type: string;
      status: string;
      attempts?: number;
      maxAttempts?: number;
      workerId?: string | null;
      leaseExpiresAt?: string | null;
      nextRetryAt?: string | null;
      error?: string | null;
      createdAt?: string | null;
    }) => ({
      id: job.id,
      traceId: job.traceId ?? null,
      type: job.type,
      status: job.status,
      attempts: Number(job.attempts || 0),
      maxAttempts: Number(job.maxAttempts || 0),
      workerId: job.workerId ?? null,
      leaseExpiresAt: job.leaseExpiresAt ?? null,
      nextRetryAt: job.nextRetryAt ?? null,
      error: job.error ?? null,
      createdAt: job.createdAt ?? null,
    })),
    latestFailures: (jobsSnapshot.diagnostics?.latestFailures || []).slice(0, 6).map((job: {
      id: string;
      traceId?: string | null;
      type: string;
      status: string;
      error?: string | null;
      nextRetryAt?: string | null;
      latestEventAt?: string | null;
    }) => ({
      id: job.id,
      traceId: job.traceId ?? null,
      type: job.type,
      status: job.status,
      error: job.error ?? null,
      nextRetryAt: job.nextRetryAt ?? null,
      latestEventAt: job.latestEventAt ?? null,
    })),
  };

  const workspaceHealth = workspaces.map((workspace) => {
    const operationsState = workspace.operationsState;
    const owners = workspace.members.filter((member) => member.user.role === "admin" || member.role === "owner");
    const primaryOwner = owners[0]?.user ?? workspace.members[0]?.user;
    const backupOwner = owners[1]?.user ?? null;
    const latestInsight = workspace.insights[0] ?? null;
    const latestReport = workspace.reports[0] ?? null;
    const latestActivity = workspace.activity[0] ?? null;
    const criticalUpdates = workspace.updates.filter((update) => update.severity === "critical" || update.severity === "high");
    const severityScore = workspaceSeverityScore(workspace.updates.map((update) => update.severity));
    const status = workspaceStatusFromScore(severityScore);
    const workspaceJobs = visibleJobs.filter(
      (job: { payload?: Record<string, unknown> | null }) => job.payload?.workspaceId === workspace.id,
    );
    const latestWorkspaceJob = workspaceJobs[0] ?? null;
    const latestFailedJob = workspaceJobs.find((job: { status: string }) => job.status === "failed") ?? null;
    const incidentSummary = operationsState?.incidentSummary ?? latestInsight?.summary ?? latestReport?.excerpt ?? workspace.description;
    const summaryUpdatedAt =
      operationsState?.incidentSummaryUpdatedAt?.toISOString() ??
      latestInsight?.updatedAt?.toISOString?.() ??
      latestReport?.updatedAt?.toISOString?.() ??
      latestActivity?.createdAt.toISOString() ??
      null;
    const checklist = buildDefaultChecklist(operationsState?.incidentChecklist).map((item) => {
      if (item.id === "summary_generated" && !item.completed && (latestInsight || latestReport)) {
        return {
          ...item,
          completed: true,
          completedAt: summaryUpdatedAt,
          completedByName: primaryOwner?.name ?? null,
        };
      }
      if (item.id === "followup_created" && !item.completed && workspace.operationsFollowups.length > 0) {
        return {
          ...item,
          completed: true,
          completedAt: workspace.operationsFollowups[0]?.createdAt.toISOString() ?? null,
          completedByName: workspace.operationsFollowups[0]?.ownerName ?? primaryOwner?.name ?? null,
        };
      }
      return item;
    });
    const resolveBlockers = checklist.filter((item) => !item.completed).map((item) => item.label);
    const canResolve = criticalUpdates.length === 0 && resolveBlockers.length <= 1;
    const incidentStatus = operationsState?.incidentStatus ?? status.incidentStatus;
    const workspaceOverride =
      governanceState.workspacePolicyOverrides && typeof governanceState.workspacePolicyOverrides === "object"
        ? governanceState.workspacePolicyOverrides[workspace.id] || null
        : null;
    const workspaceEnvironment = currentEnvironment(workspaceOverride?.environment || environment);
    const baseEnvironmentPolicy =
      governanceState.environmentPolicies?.[workspaceEnvironment] || governanceState.environmentPolicies?.[environment] || {};
    const incidentPolicy = {
      ...baseEnvironmentPolicy,
      environment: workspaceEnvironment,
      requiredChecklistForResolved:
        Array.isArray(baseEnvironmentPolicy.requiredChecklistForResolved) &&
        baseEnvironmentPolicy.requiredChecklistForResolved.length
          ? baseEnvironmentPolicy.requiredChecklistForResolved
          : checklist.map((item) => item.id),
      requireChecklistForResolved: baseEnvironmentPolicy.requireChecklistForResolved ?? true,
      requireSummaryShareBeforeArchived: baseEnvironmentPolicy.requireSummaryShareBeforeArchived ?? true,
      requireApprovalForResolved:
        workspaceOverride?.requireApprovalForResolved ?? baseEnvironmentPolicy.requireApprovalForResolved ?? true,
      requireApprovalForArchived:
        workspaceOverride?.requireApprovalForArchived ?? baseEnvironmentPolicy.requireApprovalForArchived ?? true,
      incidentApprovalReminderMinutes:
        workspaceOverride?.incidentApprovalReminderMinutes ??
        baseEnvironmentPolicy.incidentApprovalReminderMinutes ??
        30,
      incidentApprovalEscalationMinutes: baseEnvironmentPolicy.incidentApprovalEscalationMinutes ?? 60,
      incidentApprovalEscalationTarget:
        operationsState?.incidentApproverTarget ??
        baseEnvironmentPolicy.incidentApprovalEscalationTarget ??
        primaryOwner?.email ??
        "ops",
      incidentApprovalFinalEscalationMinutes: baseEnvironmentPolicy.incidentApprovalFinalEscalationMinutes ?? 180,
      incidentApprovalFinalEscalationTarget:
        operationsState?.backupApproverTarget ??
        baseEnvironmentPolicy.incidentApprovalFinalEscalationTarget ??
        backupOwner?.email ??
        primaryOwner?.email ??
        "ops",
      incidentApprovalCapacityLimit:
        workspaceOverride?.incidentApprovalCapacityLimit ??
        baseEnvironmentPolicy.incidentApprovalCapacityLimit ??
        3,
      trustDropAction: workspaceOverride?.trustDropAction ?? baseEnvironmentPolicy.trustDropAction ?? "notify",
      trustDropFollowupOwner:
        workspaceOverride?.trustDropFollowupOwner ?? baseEnvironmentPolicy.trustDropFollowupOwner ?? null,
      promoteTrustDropToIncident:
        workspaceOverride?.promoteTrustDropToIncident ?? baseEnvironmentPolicy.promoteTrustDropToIncident ?? false,
    };
    const latestApproval = workspace.incidentApprovals[0] ?? null;
    const pendingApproval = workspace.incidentApprovals.find((approval) => approval.status === "pending") ?? null;
    const incidentApproval = pendingApproval ?? latestApproval;
    const incidentApprovalSla = incidentApproval?.status === "pending" ? buildIncidentApprovalSla(incidentApproval.createdAt, incidentPolicy) : null;

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      memberCount: workspace.members.length,
      digestEnabledUsers: workspace.members.length,
      dueUsers: criticalUpdates.length,
      lastSweepRunAt: operationsState?.lastSweepRunAt?.toISOString() ?? latestWorkspaceJob?.completedAt ?? null,
      lastSweepQueuedAt: operationsState?.lastSweepQueuedAt?.toISOString() ?? latestWorkspaceJob?.createdAt ?? null,
      lastGeneratedCount: operationsState?.lastGeneratedCount ?? workspace.insights.length,
      lastSweepError: operationsState?.lastSweepError ?? latestFailedJob?.error ?? null,
      escalationOwner: operationsState?.escalationOwner ?? primaryOwner?.name ?? primaryOwner?.email ?? null,
      incidentApproverTarget: operationsState?.incidentApproverTarget ?? primaryOwner?.email ?? primaryOwner?.name ?? null,
      backupApproverTarget: operationsState?.backupApproverTarget ?? backupOwner?.email ?? backupOwner?.name ?? null,
      snoozedUntil: operationsState?.snoozedUntil?.toISOString() ?? null,
      resolutionTaskId: operationsState?.resolutionTaskId ?? workspace.operationsFollowups[0]?.id ?? null,
      resolutionCompletedAt: operationsState?.resolutionCompletedAt?.toISOString() ?? workspace.operationsFollowups[0]?.completedAt?.toISOString() ?? null,
      resolutionDescription:
        operationsState?.resolutionDescription ??
        (canResolve ? "Workspace signals are stable enough to close out after a final operator pass." : null),
      resolutionOwnerName: operationsState?.resolutionOwnerName ?? (canResolve ? (primaryOwner?.name ?? null) : null),
      incidentSummary,
      incidentSummaryUpdatedAt: summaryUpdatedAt,
      incidentHandoffDraft: operationsState?.incidentHandoffDraft ?? latestReport?.excerpt ?? null,
      incidentHandoffDraftUpdatedAt: operationsState?.incidentHandoffDraftUpdatedAt?.toISOString() ?? latestReport?.updatedAt.toISOString() ?? null,
      incidentArchiveRecommendation:
        operationsState?.incidentArchiveRecommendation ??
        (canResolve ? "Prepare this workspace for archive after the final summary is shared." : null),
      incidentStatus,
      incidentStatusUpdatedAt: operationsState?.incidentStatusUpdatedAt?.toISOString() ?? workspace.updatedAt.toISOString(),
      hasPolicyOverride: Boolean(workspaceOverride),
      policyOverrideSummary: workspaceOverride
        ? `Override ${workspaceOverride.sourceType === "playbook" || workspaceOverride.sourceType === "preset" ? "from playbook" : "enabled"} for ${workspaceEnvironment}.`
        : null,
      incidentPolicy,
      incidentReadiness: {
        canResolve,
        canArchive: canResolve && Boolean(operationsState?.incidentHandoffDraft || latestReport),
        resolveBlockers,
        archiveBlockers: operationsState?.incidentHandoffDraft || latestReport ? [] : ["Capture a handoff-ready report before archiving."],
      },
      incidentApproval: incidentApproval
        ? {
            state: incidentApproval.status,
            id: incidentApproval.id,
            status: incidentApproval.status,
            requestedStatus: incidentApproval.requestedStatus,
            archiveRationale: incidentApproval.archiveRationale,
            approverTarget: incidentApproval.approverTarget,
            routingMode: incidentApproval.routingMode,
            routingReason: incidentApproval.routingReason,
            routedFromTarget: incidentApproval.routedFromTarget,
            requestedById: incidentApproval.requestedById,
            requestedByName: incidentApproval.requestedByName,
            createdAt: incidentApproval.createdAt.toISOString(),
            resolvedAt: incidentApproval.resolvedAt?.toISOString() ?? null,
            approvedById: incidentApproval.approvedById,
            approvedByName: incidentApproval.approvedByName,
            rejectedById: incidentApproval.rejectedById,
            rejectedByName: incidentApproval.rejectedByName,
            rejectionNote: incidentApproval.rejectionNote,
            label: incidentApproval.label,
          }
        : null,
      incidentApprovalSla,
      incidentApprovalHistory: workspace.incidentApprovals.map((approval) => ({
        id: approval.id,
        status: approval.status,
        requestedStatus: approval.requestedStatus,
        archiveRationale: approval.archiveRationale,
        approverTarget: approval.approverTarget,
        routingMode: approval.routingMode,
        routingReason: approval.routingReason,
        routedFromTarget: approval.routedFromTarget,
        requestedById: approval.requestedById,
        requestedByName: approval.requestedByName,
        createdAt: approval.createdAt.toISOString(),
        resolvedAt: approval.resolvedAt?.toISOString() ?? null,
        approvedById: approval.approvedById,
        approvedByName: approval.approvedByName,
        rejectedById: approval.rejectedById,
        rejectedByName: approval.rejectedByName,
        rejectionNote: approval.rejectionNote,
        label: approval.label,
      })),
      incidentChecklist: checklist,
      events: workspace.activity.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.title,
        actorId: event.userId ?? null,
        actorName: event.user?.name ?? null,
        note: event.description ?? null,
        timestamp: event.createdAt.toISOString(),
      })),
      overdueIntervals: criticalUpdates.length,
      status: status.status,
      environment: workspaceEnvironment,
      operationsFollowups: workspace.operationsFollowups,
    };
  });

  const activity = recentActivity.map((entry) => ({
    id: entry.id,
    type: entry.type,
    message: entry.title,
    createdAt: entry.createdAt.toISOString(),
    timestamp: entry.createdAt.toISOString(),
  }));

  const activityTypeCounts = new Map<string, number>();
  for (const entry of recentActivity) {
    activityTypeCounts.set(entry.type, (activityTypeCounts.get(entry.type) || 0) + 1);
  }

  const digestEscalations = [
    ...workspaceHealth
      .filter((workspace) => workspace.status !== "healthy")
      .slice(0, 6)
      .map((workspace) => ({
        id: `workspace-${workspace.workspaceId}`,
        tone: workspace.status === "error" ? "critical" : "warning",
        title: `${workspace.workspaceName} needs operator attention`,
        detail:
          workspace.incidentSummary ||
          `${workspace.dueUsers} high-severity updates are still open in this workspace.`,
        command: `Open ${workspace.workspaceName}`,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        owner: workspace.escalationOwner,
        snoozedUntil: workspace.snoozedUntil,
      })),
    ...jobs.items
      .filter((job: (typeof jobs.items)[number]) => job.status === "failed")
      .slice(0, 3)
      .map((job: (typeof jobs.items)[number]) => ({
        id: `job-${job.id}`,
        tone: "critical",
        title: `${job.type} failed`,
        detail: job.error || "A background job failed and needs a retry or investigation.",
        command: `Inspect ${job.id}`,
      })),
  ].slice(0, 8);

  const activeTrustSignals = digestEscalations.slice(0, 6).map((signal, index) => ({
    id: `signal-${index}-${signal.id}`,
    tone: signal.tone,
    type: signal.workspaceId ? "workspace-risk" : "job-failure",
    title: signal.title,
    detail: signal.detail,
    environment,
  }));

  const totalWorkspaces = workspaceHealth.length;
  const unhealthyWorkspaces = workspaceHealth.filter((workspace) => workspace.status !== "healthy").length;
  const completedTrustIncidents = workspaceHealth
    .filter((workspace) => isCompletedIncidentStatus(workspace.incidentStatus))
    .slice(0, 6)
    .map((workspace) => ({
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      environment,
      archivedAt: workspace.resolutionCompletedAt ?? null,
      summary: workspace.incidentSummary,
    }));

  const trustScore =
    totalWorkspaces > 0 ? Math.max(0, Math.round(((totalWorkspaces - unhealthyWorkspaces) / totalWorkspaces) * 100)) : 100;

  const incidentApprovalPressure = Array.from(
    workspaceHealth
    .filter((workspace) => workspace.incidentApproval?.state === "pending" && workspace.incidentApprovalSla)
    .reduce((groups, workspace) => {
      const approval = workspace.incidentApproval!;
      const sla = workspace.incidentApprovalSla!;
      const target = approval.approverTarget || "unassigned";
      const current = groups.get(target) || {
        target,
        pendingCount: 0,
        overdueCount: 0,
        escalatedCount: 0,
        finalEscalatedCount: 0,
        oldestAgeMs: 0,
        workspaces: [],
      };
      current.pendingCount += 1;
      current.overdueCount += sla.overdue ? 1 : 0;
      current.escalatedCount += sla.escalated ? 1 : 0;
      current.finalEscalatedCount += sla.finalEscalated ? 1 : 0;
      current.oldestAgeMs = Math.max(current.oldestAgeMs, sla.ageMs);
      current.workspaces.push({
        approvalId: approval.id,
        approverTarget: approval.approverTarget,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        requestedStatus: approval.requestedStatus,
        ageMs: sla.ageMs,
        overdue: sla.overdue,
        escalated: sla.escalated,
        finalEscalated: sla.finalEscalated,
      });
      groups.set(target, current);
      return groups;
    }, new Map<string, {
      target: string;
      pendingCount: number;
      overdueCount: number;
      escalatedCount: number;
      finalEscalatedCount: number;
      oldestAgeMs: number;
      workspaces: Array<{
        approvalId: string | null;
        approverTarget: string | null;
        workspaceId: string;
        workspaceName: string;
        requestedStatus: string;
        ageMs: number;
        overdue: boolean;
        escalated: boolean;
        finalEscalated: boolean;
      }>;
    }>())
    .values(),
  );

  const approvalRecords = workspaceHealth.flatMap((workspace) => workspace.incidentApprovalHistory || []);
  const approvalThroughputTargets = Array.from(
    approvalRecords.reduce((groups, approval) => {
      const target = approval.approverTarget || "unassigned";
      const current = groups.get(target) || {
        target,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        rerouted: 0,
        autoRerouted: 0,
        resolvedDurations: [] as number[],
      };
      current.total += 1;
      current.approved += approval.status === "approved" ? 1 : 0;
      current.rejected += approval.status === "rejected" ? 1 : 0;
      current.pending += approval.status === "pending" ? 1 : 0;
      current.rerouted += approval.routingMode === "manual" ? 1 : 0;
      current.autoRerouted += approval.routingMode === "adaptive" ? 1 : 0;
      if (approval.createdAt && approval.resolvedAt) {
        current.resolvedDurations.push(new Date(approval.resolvedAt).getTime() - new Date(approval.createdAt).getTime());
      }
      groups.set(target, current);
      return groups;
    }, new Map<string, {
      target: string;
      total: number;
      approved: number;
      rejected: number;
      pending: number;
      rerouted: number;
      autoRerouted: number;
      resolvedDurations: number[];
    }>())
  ).map(([, current]) => ({
    target: current.target,
    total: current.total,
    approved: current.approved,
    rejected: current.rejected,
    pending: current.pending,
    rerouted: current.rerouted,
    autoRerouted: current.autoRerouted,
    averageApprovalMs: current.resolvedDurations.length
      ? Math.round(current.resolvedDurations.reduce((sum, duration) => sum + duration, 0) / current.resolvedDurations.length)
      : null,
  }));

  const digestSchedulerStatus = getDigestSchedulerStatus?.() || {
    enabled: false,
    intervalMs: 60_000,
    lastRunAt: null,
    lastError: null,
    lastResult: null,
  };
  const rolloutRecords = (governanceState.workspacePolicyPlaybookRollouts || []) as Array<any>;
  const presetPlaybooks = (governanceState.defaultPolicyPlaybookPresets || []) as Array<any>;
  const savedPlaybooks = (governanceState.workspacePolicyPlaybooks || []) as Array<any>;

  return {
    activity,
    telemetry: {
      totals: {
        events: activity.length,
        errors: jobs.failed,
        avgCommandLatencyMs: 0,
        avgWatcherLatencyMs: 0,
        avgSchedulerLatencyMs: jobs.metrics.avgRunTimeMs,
      },
      byType: Array.from(activityTypeCounts.entries()).map(([type, count]) => ({ type, count })),
      recent: activity.slice(0, 8).map((entry) => ({
        type: entry.type,
        level: entry.type.includes("error") ? "error" : "info",
        createdAt: entry.createdAt,
      })),
    },
    jobs,
    collaboration: {
      digestScheduler: {
        enabled: Boolean(digestSchedulerStatus.enabled),
        intervalMs: Number(digestSchedulerStatus.intervalMs || 60_000),
        lastRunAt: digestSchedulerStatus.lastRunAt ?? null,
        lastError: digestSchedulerStatus.lastError ?? null,
        lastResult: digestSchedulerStatus.lastResult ?? null,
      },
      digestEscalations,
      globalOperations: {
        totals: {
          workspaceCount: totalWorkspaces,
          overriddenWorkspaces: workspaceHealth.filter((workspace) => workspace.hasPolicyOverride).length,
          unhealthyWorkspaces,
          openIncidents: workspaceHealth.filter((workspace) => !isCompletedIncidentStatus(workspace.incidentStatus)).length,
          pendingApprovals: approvalRecords.filter((approval) => approval.status === "pending").length,
          finalEscalations:
            digestEscalations.filter((item) => item.tone === "critical").length +
            incidentApprovalPressure.reduce((sum, item) => sum + item.finalEscalatedCount, 0),
          activeTrustSignals: activeTrustSignals.length,
          activeDigestEscalations: digestEscalations.length,
          completedTrustIncidents: completedTrustIncidents.length,
          playbookRollouts: rolloutRecords.length,
        },
        environments: [
          {
            environment,
            workspaceCount: totalWorkspaces,
            overrideCount: workspaceHealth.filter((workspace) => workspace.hasPolicyOverride).length,
            unhealthyCount: unhealthyWorkspaces,
            openIncidents: workspaceHealth.filter((workspace) => !isCompletedIncidentStatus(workspace.incidentStatus)).length,
            pendingApprovals: approvalRecords.filter((approval) => approval.status === "pending").length,
            finalEscalations:
              digestEscalations.filter((item) => item.tone === "critical").length +
              incidentApprovalPressure.reduce((sum, item) => sum + item.finalEscalatedCount, 0),
            activeTrustSignals: activeTrustSignals.length,
            completedTrustIncidents: completedTrustIncidents.length,
            playbookRollouts: rolloutRecords.length,
            averageTrustScore: trustScore,
          },
        ],
        hotspots: workspaceHealth
          .filter((workspace) => workspace.status !== "healthy")
          .slice(0, 8)
          .map((workspace) => ({
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.workspaceName,
            status: workspace.status,
            incidentStatus: workspace.incidentStatus,
            environment: workspace.environment || environment,
            hasPolicyOverride: workspace.hasPolicyOverride,
            policyOverrideSummary: workspace.policyOverrideSummary,
            dueUsers: workspace.dueUsers,
            overdueIntervals: workspace.overdueIntervals,
            pendingApprovalTarget: workspace.incidentApproval?.approverTarget || workspace.incidentApproverTarget,
            finalEscalated: Boolean(workspace.incidentApprovalSla?.finalEscalated) || workspace.status === "error",
          })),
        pressureTargets: Array.from(
          workspaceHealth.reduce((targets, workspace) => {
            const target = workspace.incidentApproverTarget || "unassigned";
            const current = targets.get(target) || {
              target,
              pendingCount: 0,
              overdueCount: 0,
              finalEscalatedCount: 0,
              workspaceCount: 0,
            };
            current.workspaceCount += 1;
            current.pendingCount += workspace.status === "healthy" ? 0 : 1;
            current.overdueCount += workspace.overdueIntervals;
            current.finalEscalatedCount += workspace.status === "error" ? 1 : 0;
            targets.set(target, current);
            return targets;
          }, new Map<string, { target: string; pendingCount: number; overdueCount: number; finalEscalatedCount: number; workspaceCount: number }>()),
        ).map(([, value]) => value),
        playbookRollouts: rolloutRecords,
      },
      approvalTrustEnvironments: [
        {
          environment,
          current: true,
          autoPromoteEnabled: false,
          observationHours: 24,
          cooldownHours: 6,
          score: trustScore,
          regressedCount: unhealthyWorkspaces,
          improvedCount: completedTrustIncidents.length,
          observingCount: 0,
          cooldownCount: 0,
          alertCount: activeTrustSignals.length,
        },
      ],
      approvalTrustTrends: [
        {
          environment,
          current: true,
          latestTakenAt: activity[0]?.timestamp ?? null,
          sampleCount: activity.length,
          score: trustScore,
          deltas: {
            day: null,
            week: null,
            month: null,
          },
          activity: {
            latestRegressedCount: unhealthyWorkspaces,
            latestImprovedCount: completedTrustIncidents.length,
            latestAlertCount: activeTrustSignals.length,
          },
        },
      ],
      approvalTrustSignals: activeTrustSignals,
      appliedApprovalPolicies: rolloutRecords.map((item: any) => ({
        id: item.id,
        title: item.playbookName,
        recommendationKind: "policy-playbook",
        environment: item.environment,
        target: null,
        workspaceId: item.workspaceIds[0] ?? null,
        appliedAt: item.appliedAt,
        appliedByName: item.appliedByName || "System",
        appliedAutomatically: false,
        effectSummary: `Applied to ${item.workspaceCount} workspace${item.workspaceCount === 1 ? "" : "s"}.`,
        rolledBackAt: item.rolledBackAt ?? null,
      })),
      policyPlaybookAdoption: {
        totalTracked:
          presetPlaybooks.length + savedPlaybooks.length,
        presetCount: presetPlaybooks.length,
        savedCount: savedPlaybooks.length,
        items: [
          ...presetPlaybooks.map((playbook: any) => ({
            playbookId: playbook.id,
            playbookName: playbook.name,
            source: "preset",
            environment: playbook.environment,
            rolloutCount: rolloutRecords.filter((item: any) => item.playbookId === playbook.id).length,
            workspaceCount: rolloutRecords
              .filter((item: any) => item.playbookId === playbook.id)
              .reduce((sum: number, item: any) => sum + item.workspaceCount, 0),
            latestAppliedAt: rolloutRecords.find((item: any) => item.playbookId === playbook.id)?.appliedAt ?? null,
            recoveredWorkspaceCount: 0,
            activeRiskWorkspaceCount: workspaceHealth.filter((workspace) => workspace.status !== "healthy").length,
            completedTrustCount: completedTrustIncidents.length,
          })),
          ...savedPlaybooks.map((playbook: any) => ({
            playbookId: playbook.id,
            playbookName: playbook.name,
            source: "saved",
            environment: playbook.environment,
            rolloutCount: rolloutRecords.filter((item: any) => item.playbookId === playbook.id).length,
            workspaceCount: rolloutRecords
              .filter((item: any) => item.playbookId === playbook.id)
              .reduce((sum: number, item: any) => sum + item.workspaceCount, 0),
            latestAppliedAt: rolloutRecords.find((item: any) => item.playbookId === playbook.id)?.appliedAt ?? null,
            recoveredWorkspaceCount: 0,
            activeRiskWorkspaceCount: workspaceHealth.filter((workspace) => workspace.status !== "healthy").length,
            completedTrustCount: completedTrustIncidents.length,
          })),
        ],
        recommendations: presetPlaybooks.map((playbook: any) => ({
          id: `playbook-${playbook.id}`,
          tone: playbook.environment === "production" ? "critical" : "active",
          title: `Apply ${playbook.name}`,
          detail: `Roll out ${playbook.name} posture to unhealthy ${playbook.environment} workspaces.`,
          environment: playbook.environment,
          playbookId: playbook.id,
          playbookName: playbook.name,
          kind: "playbook-rollout",
          source: "preset",
        })),
      },
      digestWorkspaceHealth: workspaceHealth,
      incidentApprovalPressure,
      approvalThroughput: {
        totals: {
          totalApprovals: approvalRecords.length,
          manualReroutes: approvalRecords.filter((approval) => approval.routingMode === "manual").length,
          autoReroutes: approvalRecords.filter((approval) => approval.routingMode === "adaptive").length,
          resolvedApprovals: approvalRecords.filter((approval) => approval.status === "approved" || approval.status === "rejected").length,
        },
        targets: approvalThroughputTargets,
        workspaces: workspaceHealth.map((workspace) => {
          const durations = workspace.incidentApprovalHistory
            .filter((approval) => approval.createdAt && approval.resolvedAt)
            .map((approval) => new Date(approval.resolvedAt!).getTime() - new Date(approval.createdAt!).getTime());
          return {
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.workspaceName,
            total: workspace.incidentApprovalHistory.length,
            rerouted: workspace.incidentApprovalHistory.filter((approval) => approval.routingMode === "manual").length,
            autoRerouted: workspace.incidentApprovalHistory.filter((approval) => approval.routingMode === "adaptive").length,
            averageApprovalMs: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
          };
        }),
      },
      approvalPolicyRecommendations: workspaceHealth
        .filter((workspace) => workspace.status !== "healthy")
        .slice(0, 5)
        .map((workspace) => ({
          id: `recommendation-${workspace.workspaceId}`,
          title: `Stabilize ${workspace.workspaceName}`,
          detail: `Assign an owner and refresh the summary for ${workspace.workspaceName} to reduce operator ambiguity.`,
          kind: "workspace-hardening",
          confidence: {
            score: workspace.status === "error" ? 0.9 : 0.72,
            label: workspace.status === "error" ? "high" : "medium",
          },
          target: workspace.incidentApproverTarget || undefined,
          workspaceId: workspace.workspaceId,
          action: {
            type: "collaboration:automation-run-sweep",
            payload: { workspaceId: workspace.workspaceId },
          },
        })),
      approvalRecommendationObservations: [],
      approvalTrustDashboard: {
        score: trustScore,
        regressedCount: unhealthyWorkspaces,
        improvedCount: completedTrustIncidents.length,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alerts: activeTrustSignals.map((signal) => ({
          id: signal.id,
          tone: signal.tone,
          title: signal.title,
          detail: signal.detail,
        })),
      },
      approvalRecommendationFamilies: [],
      completedTrustIncidents,
      completedTrustEnvironments: [
        {
          environment,
          archivedCount: completedTrustIncidents.length,
          latestArchivedAt: null,
          recentWorkspaces: completedTrustIncidents.map((item) => item.workspaceName).slice(0, 5),
        },
      ],
      environmentTrustRecaps: [
        {
          environment,
          score: trustScore,
          activeSignals: activeTrustSignals.length,
          completedArchived: completedTrustIncidents.length,
          latestArchivedAt: null,
        },
      ],
      automationFollowups: workspaceHealth.flatMap((workspace) =>
        (workspace.operationsFollowups || []).map((followup) => ({
          id: followup.id,
          agentName: followup.agentName,
          description: followup.description,
          status: followup.status,
          priority: followup.priority,
          ownerId: followup.ownerId ?? null,
          ownerName: followup.ownerName ?? null,
          workspaceId: workspace.workspaceId,
          linkedInboxItemId: followup.linkedInboxItemId ?? null,
          createdAt: followup.createdAt.toISOString(),
          completedAt: followup.completedAt?.toISOString() ?? null,
        })),
      ),
      governance: {
        currentEnvironment: environment,
        sensitiveActionsRequireApproval: Boolean(governanceState.sensitiveActionsRequireApproval),
        workspacePolicyOverrides: governanceState.workspacePolicyOverrides || {},
        environmentPolicies: governanceState.environmentPolicies || {},
        workspacePolicyPlaybooks: governanceState.workspacePolicyPlaybooks || [],
        workspacePolicyPlaybookRollouts: governanceState.workspacePolicyPlaybookRollouts || [],
        defaultPolicyPlaybookPresets: governanceState.defaultPolicyPlaybookPresets || [],
        demoScenario: governanceState.demoScenario || null,
      },
    },
  };
}

export function saveControlCenterGovernance(governance: Record<string, unknown>) {
  return updateGovernanceSettings(governance);
}

export function saveControlCenterWorkspacePolicy(
  workspaceId: string,
  policyOverride?: Record<string, unknown>,
  reset?: boolean,
  actor?: { id?: string | null; name?: string | null; email?: string | null } | null,
) {
  return persistWorkspacePolicyOverride(workspaceId, policyOverride, reset, actor);
}
