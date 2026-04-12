import { createRequire } from "node:module";
import { getRuntimePosture } from "@/src/lib/server/runtime";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";

const require = createRequire(import.meta.url);

const { listTasks } = require("../../../services/taskQueue");
const { listReviewItems } = require("../../../services/reviewQueue");
const { listSchedules } = require("../../../services/scheduler");
const { getWatcherStatus } = require("../../../services/watcher");
const { listAlerts, listActiveAlerts, loadAlertsState } = require("../../../services/alerts");
const { listPlugins } = require("../../../services/pluginLoader");
const { buildSystemSummary, buildHealthSummary, buildWorkloadSummary, getAgentDashboard } = require("../../../services/dashboard");
const { listAuditEvents } = require("../../../services/auditTrail");
const { loadAutomationPolicy } = require("../../../services/automationPolicy");
const { buildTelemetrySummary } = require("../../../services/telemetry");
const { listJobs, buildJobMetrics } = require("../../../services/jobQueue");
const { listAgentProfiles } = require("../../../services/agentRuntime");
const { readAgentProfile } = require("../../../services/agentProfiles");
const { loadAgentState } = require("../../../services/agentMemory");
const { loadCollaborationState, getInboxHistory, getDigestPreferences, listDigestRuns } = require("../../../services/collaboration");
const { getDigestSchedulerStatus } = require("../../../services/digestScheduler");
const { canApproveInEnvironment, canManageGovernanceInEnvironment } = require("../../../services/permissions");

async function listResearchRecords(workspaceId: string) {
  const researchService = await import("@/src/server/services/research-service");
  const [briefs, reports] = await Promise.all([
    researchService.listBriefs(workspaceId),
    researchService.listReports(workspaceId),
  ]);
  return { briefs, reports };
}

function buildOwnershipSignalsFromRecords(
  briefs: Array<Record<string, unknown>>,
  reports: Array<Record<string, unknown>>,
) {
  const totalItems = briefs.length + reports.length;
  const orphanedBriefs = briefs.filter((item) => !item.ownerId).length;
  const orphanedReports = reports.filter((item) => !item.ownerId).length;
  const orphanedTotal = orphanedBriefs + orphanedReports;
  const ownerLoad = new Map<string, number>();

  [...briefs, ...reports].forEach((item) => {
    const owner = String(item.ownerName || item.ownerId || "Unowned");
    ownerLoad.set(owner, (ownerLoad.get(owner) || 0) + 1);
  });

  const busiestOwner = [...ownerLoad.entries()].sort((left, right) => right[1] - left[1])[0] || null;
  const signals: Array<Record<string, unknown>> = [];

  if (orphanedTotal > 0) {
    signals.push({
      id: "ownership:orphaned",
      tone: orphanedTotal >= 3 ? "critical" : "warning",
      title: `${orphanedTotal} workspace items are unassigned`,
      detail: `${orphanedBriefs} briefs and ${orphanedReports} reports do not have an owner.`,
      command: "ownership:signals",
    });
  }

  if (totalItems >= 4 && busiestOwner && busiestOwner[0] !== "Unowned" && busiestOwner[1] >= Math.ceil(totalItems * 0.5)) {
    signals.push({
      id: "ownership:imbalance",
      tone: "warning",
      title: `${busiestOwner[0]} is carrying most of the workspace load`,
      detail: `${busiestOwner[0]} currently owns ${busiestOwner[1]} of ${totalItems} tracked briefs and reports.`,
      command: "ownership:signals",
    });
  }

  return signals;
}

export async function buildOwnershipSignalsSnapshot(workspaceId: string) {
  const { briefs, reports } = await listResearchRecords(workspaceId);
  return buildOwnershipSignalsFromRecords(
    briefs as Array<Record<string, unknown>>,
    reports as Array<Record<string, unknown>>,
  );
}

function normalizeTarget(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function extractTargets(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeTarget(item))
    .filter(Boolean);
}

function buildActorTargets(actor: { id: string; name?: string; role: string }) {
  return new Set([
    normalizeTarget(actor.id),
    normalizeTarget(actor.name),
    normalizeTarget(actor.role),
    `user:${normalizeTarget(actor.id)}`,
    `name:${normalizeTarget(actor.name)}`,
    `role:${normalizeTarget(actor.role)}`,
    "team",
  ]);
}

function matchesTargets(value: unknown, actorTargets: Set<string>) {
  const targets = extractTargets(value);
  if (!targets.length) {
    return false;
  }
  return targets.some((target) => actorTargets.has(target));
}

function buildWatcherOverview() {
  const watcher = getWatcherStatus();
  return {
    enabled: Boolean(watcher?.enabled),
    intervalSeconds: Number(watcher?.intervalSeconds || 0),
    lastRunAt: watcher?.lastRunAt || null,
    lastError: watcher?.lastError || null,
    ruleCount: Array.isArray(watcher?.rules) ? watcher.rules.length : 0,
    rules: Array.isArray(watcher?.rules) ? watcher.rules : [],
  };
}

function buildAlertsOverview() {
  const state = loadAlertsState();
  const activeAlerts = listActiveAlerts();
  const alerts = listAlerts();

  return {
    activeCount: activeAlerts.length,
    items: activeAlerts.map((alert: Record<string, unknown>) => {
      const workflow = (alert.workflow || {}) as Record<string, unknown>;
      return {
      id: alert.id,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      owner: workflow.owner || null,
      acknowledged: Boolean(workflow.acknowledged),
      resolutionNote: workflow.resolutionNote || null,
    };
    }),
    all: alerts.map((alert: Record<string, unknown>) => {
      const workflow = (alert.workflow || {}) as Record<string, unknown>;
      return {
      id: alert.id,
      severity: alert.severity,
      status: alert.status,
      title: alert.title,
      owner: workflow.owner || null,
      acknowledged: Boolean(workflow.acknowledged),
      resolved: Boolean(workflow.resolved),
      createdAt: alert.createdAt || null,
    };
    }),
    thresholds: state?.thresholds || {
      queuedTasksHigh: 6,
      pendingReviewsHigh: 4,
      inactiveAgentsHigh: 2,
    },
  };
}

function buildAgentDetails() {
  return listAgentProfiles().map((agent: Record<string, unknown>) => {
    const agentName = String(agent.name || "");
    const runtime = loadAgentState(agentName);
    let profile = agent;

    try {
      profile = readAgentProfile(agentName);
    } catch {
      profile = agent;
    }

    return {
      agentName,
      profile: {
        role: String(profile.role || "unknown"),
        description: String(profile.description || ""),
        defaultGoal: String(profile.defaultGoal || ""),
        maxStepsPerRun: Number(profile.maxStepsPerRun || 0),
        cooldownSeconds: Number(profile.cooldownSeconds || 0),
        allowShellExecution: Boolean(profile.allowShellExecution),
        allowFileWrite: Boolean(profile.allowFileWrite),
        allowPlanning: Boolean(profile.allowPlanning),
        tags: Array.isArray(profile.tags) ? profile.tags : [],
      },
      runtime: {
        active: Boolean(runtime?.active),
        status: String(runtime?.status || "unknown"),
        goal: String(runtime?.goal || ""),
        currentTask: runtime?.currentTask || null,
        lastRunAt: runtime?.lastRunAt || null,
        stepCount: Number(runtime?.stepCount || 0),
        maxSteps: Number(runtime?.maxSteps || 0),
      },
      schedule: listSchedules().find((item: Record<string, unknown>) => String(item.agentName) === agentName) || null,
      observability: {
        queuedTasks: Number(getAgentDashboard(agentName)?.queuedTasks || 0),
        claimedTasks: Number(getAgentDashboard(agentName)?.claimedTasks || 0),
        completedTasks: Number(getAgentDashboard(agentName)?.completedTasks || 0),
        pendingReviews: Number(getAgentDashboard(agentName)?.pendingReviews || 0),
      },
      recentHistory: Array.isArray(runtime?.history) ? runtime.history.slice(-5).reverse() : [],
      recentNotes: Array.isArray(runtime?.notes) ? runtime.notes.slice(-5).reverse() : [],
    };
  });
}

function buildTrustOverview() {
  const watcher = getWatcherStatus();
  const reviews = listReviewItems();
  const activeAlerts = listActiveAlerts();
  const schedules = listSchedules();

  return {
    lastWatcherRunAt: watcher?.lastRunAt || null,
    lastWatcherError: watcher?.lastError || null,
    pendingReviews: reviews.filter((item: Record<string, unknown>) => item.status === "pending").length,
    activeAlerts: activeAlerts.length,
    schedulesWithErrors: schedules.filter(
      (schedule: Record<string, unknown>) => schedule.lastError || (schedule.enabled && Number(schedule.cycleCount || 0) >= Number(schedule.maxCycles || 0)),
    ).length,
  };
}

function buildActivityOverview() {
  return listAuditEvents(10).map((entry: Record<string, unknown>) => ({
    timestamp: String(entry.timestamp || ""),
    event: String(entry.type || "activity"),
    message: String(entry.message || entry.summary || "Activity recorded."),
  }));
}

function buildRecommendationSnapshot(input: {
  health: Record<string, unknown>;
  queue: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  schedules: Array<Record<string, unknown>>;
  alerts: { activeCount: number };
  ownershipSignals: Array<Record<string, unknown>>;
  digestEscalations: Array<Record<string, unknown>>;
  approvalPolicyRecommendations: Array<Record<string, unknown>>;
}) {
  const recommendations: Array<Record<string, unknown>> = [];

  if (input.queue.some((task) => task.status === "queued")) {
    recommendations.push({ id: "queue", title: "Inspect queued briefs", command: "queue:list", tone: "warning" });
  }

  if (input.reviews.some((item) => item.status === "pending")) {
    recommendations.push({ id: "review", title: "Process editorial reviews", command: "review:list", tone: "warning" });
  }

  if (input.alerts.activeCount > 0) {
    recommendations.push({ id: "alerts", title: "Triage active research signals", command: "alerts:active", tone: "critical" });
  }

  if (String(input.health.watcherStatus || "").toLowerCase().includes("stopped")) {
    recommendations.push({ id: "watcher", title: "Run an automation sweep", command: "watcher:run", tone: "warning" });
  }

  if (input.schedules.some((item) => item.lastError)) {
    recommendations.push({ id: "schedules", title: "Inspect schedule issues", command: "schedule:list", tone: "critical" });
  }

  input.ownershipSignals.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  input.digestEscalations.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  input.approvalPolicyRecommendations.forEach((item) => {
    recommendations.push({
      id: item.id,
      title: item.title,
      command: "digest:health",
      tone: item.kind === "throughput" ? "warning" : "critical",
    });
  });

  return recommendations.slice(0, 5);
}

export async function buildTerminalOverviewSnapshot(
  workspaceId: string,
  controlCenterOverview?: { collaboration?: Record<string, unknown> },
) {
  const watcher = buildWatcherOverview();
  const alerts = buildAlertsOverview();
  const automationPolicy = loadAutomationPolicy();
  const queue = listTasks();
  const reviews = listReviewItems();
  const schedules = listSchedules();
  const ownershipSignals = await buildOwnershipSignalsSnapshot(workspaceId);
  const collaboration = controlCenterOverview?.collaboration || {};
  const digestEscalations = Array.isArray(collaboration.digestEscalations)
    ? (collaboration.digestEscalations as Array<Record<string, unknown>>)
    : [];
  const approvalPolicyRecommendations = Array.isArray(collaboration.approvalPolicyRecommendations)
    ? (collaboration.approvalPolicyRecommendations as Array<Record<string, unknown>>)
    : [];
  const health = buildHealthSummary();
  const { readBackgroundJobs } = await import("@/src/server/jobs/background-jobs");
  const backgroundJobs = readBackgroundJobs(60);
  const runtime = getRuntimePosture();
  const warnings = buildRuntimeWarnings(runtime, backgroundJobs.health);

  return {
    system: buildSystemSummary(),
    health,
    queue,
    reviews,
    schedules,
    watcher,
    alerts: {
      activeCount: alerts.activeCount,
      items: alerts.items,
      all: alerts.all,
    },
    plugins: listPlugins(),
    workload: buildWorkloadSummary(),
    agentDetails: buildAgentDetails(),
    trust: buildTrustOverview(),
    recommendations: buildRecommendationSnapshot({
      health,
      queue,
      reviews,
      schedules,
      alerts,
      ownershipSignals,
      digestEscalations,
      approvalPolicyRecommendations,
    }),
    ownershipSignals,
    activity: buildActivityOverview(),
    automation: {
      alertThresholds: alerts.thresholds,
      policy: automationPolicy,
    },
    telemetry: buildTelemetrySummary(40),
    jobs: {
      total: listJobs(200).length,
      queued: listJobs(200).filter((job: Record<string, unknown>) => job.status === "queued").length,
      running: listJobs(200).filter((job: Record<string, unknown>) => job.status === "running").length,
      failed: listJobs(200).filter((job: Record<string, unknown>) => job.status === "failed").length,
      metrics: buildJobMetrics(60),
      items: listJobs(12),
      diagnostics: backgroundJobs.diagnostics,
      warnings,
    },
  };
}

export function buildTerminalCollaborationSnapshot(input: {
  user: { id: string; workspaceId: string; name?: string; email: string; role: string };
  governance: Record<string, unknown>;
  ownershipSignals: Array<Record<string, unknown>>;
  digestEscalations: Array<Record<string, unknown>>;
  trustSignals: Array<Record<string, unknown>>;
  approvals: Array<Record<string, unknown>>;
}) {
  const collaborationState = loadCollaborationState();
  const actorTargets = buildActorTargets(input.user);
  const inboxState =
    collaborationState.inboxState && typeof collaborationState.inboxState === "object"
      ? ((collaborationState.inboxState[input.user.id] || {}) as Record<string, Record<string, unknown>>)
      : {};

  const inbox: Array<Record<string, unknown>> = [];

  if (input.user.role === "admin" || canManageGovernanceInEnvironment(input.user.role, input.governance)) {
    input.ownershipSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${String(signal.id)}`,
        type: "ownership",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        read: Boolean(inboxState[`inbox:${String(signal.id)}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${String(signal.id)}`]?.acknowledgedAt),
      });
    });

    input.digestEscalations.forEach((signal) => {
      inbox.push({
        id: `inbox:${String(signal.id)}`,
        type: "automation",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        workspaceId: signal.workspaceId || null,
        workspaceName: signal.workspaceName || null,
        owner: signal.owner || null,
        snoozedUntil: signal.snoozedUntil || null,
        read: Boolean(inboxState[`inbox:${String(signal.id)}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${String(signal.id)}`]?.acknowledgedAt),
      });
    });

    input.trustSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${String(signal.id)}`,
        type: "trust",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        environment: signal.environment || null,
        read: Boolean(inboxState[`inbox:${String(signal.id)}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${String(signal.id)}`]?.acknowledgedAt),
      });
    });
  }

  const visibleHandoffs = (Array.isArray(collaborationState.handoffs) ? collaborationState.handoffs : [])
    .filter(
      (handoff: Record<string, unknown>) =>
        String(handoff.status || "open") === "open" && matchesTargets(handoff.assignedTo, actorTargets),
    )
    .slice(0, 8);

  visibleHandoffs.forEach((handoff: Record<string, unknown>) => {
    inbox.push({
      id: `inbox:${String(handoff.id)}`,
      type: "handoff",
      status: handoff.status || "open",
      tone: "warning",
      title: handoff.title,
      detail: `${String(handoff.assignedByName || "Someone")} assigned this handoff to ${String(handoff.assignedTo || "team")}. ${String(handoff.note || "")}`.trim(),
      handoffId: handoff.id,
      kind: handoff.kind || "general",
      workspaceId: handoff.workspaceId || null,
      relatedApprovalId: handoff.relatedApprovalId || null,
      createdAt: handoff.createdAt || null,
      read: Boolean(inboxState[`inbox:${String(handoff.id)}`]?.readAt),
      acknowledged: Boolean(inboxState[`inbox:${String(handoff.id)}`]?.acknowledgedAt),
    });
  });

  input.approvals
    .filter((approval) => {
      if (
        approval.status === "pending" &&
        canApproveInEnvironment(input.user.role, input.governance, input.user.workspaceId) &&
        (!approval.approverTarget || matchesTargets(approval.approverTarget, actorTargets))
      ) {
        return true;
      }
      return approval.requestedById === input.user.id;
    })
    .slice(0, 8)
    .forEach((approval) => {
      inbox.push({
        id: `inbox:${String(approval.id)}`,
        type: "approval",
        status: approval.status,
        tone: approval.status === "pending" ? "warning" : approval.status === "approved" ? "active" : "error",
        title: approval.label,
        detail:
          approval.status === "pending"
            ? `${String(approval.requestedByName || "Someone")} is waiting on approval for ${String(approval.action || "action")}.${approval.approverTarget ? ` Target: ${String(approval.approverTarget)}.` : ""}`
            : `${String(approval.requestedByName || "Someone")} request is ${String(approval.status || "resolved")}.`,
        approvalId: approval.id,
        approverTarget: approval.approverTarget || null,
        read: Boolean(inboxState[`inbox:${String(approval.id)}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${String(approval.id)}`]?.acknowledgedAt),
      });
    });

  const normalizedInbox = inbox.slice(0, 12);
  const notificationHistory = [...normalizedInbox, ...getInboxHistory(input.user.id)]
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => {
      const leftTime = new Date(String(left.recordedAt || left.updatedAt || left.createdAt || 0)).getTime();
      const rightTime = new Date(String(right.recordedAt || right.updatedAt || right.createdAt || 0)).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 40);

  const notificationDigest = {
    open: normalizedInbox.length,
    unread: normalizedInbox.filter((item) => !item.read).length,
    acknowledged: notificationHistory.filter((item) => item.acknowledged).length,
    ownership: normalizedInbox.filter((item) => item.type === "ownership").length,
    handoffs: normalizedInbox.filter((item) => item.type === "handoff").length,
    approvals: normalizedInbox.filter((item) => item.type === "approval").length,
    trust: normalizedInbox.filter((item) => item.type === "trust").length,
  };

  const sharedSessions = (Array.isArray(collaborationState.sharedSessions) ? collaborationState.sharedSessions : []).filter(
    (session: Record<string, unknown>) =>
      session.ownerId === input.user.id ||
      matchesTargets(Array.isArray(session.sharedWith) ? session.sharedWith.join(",") : session.sharedWith, actorTargets),
  );

  return {
    currentUser: {
      id: input.user.id,
      name: input.user.name || input.user.email,
      email: input.user.email,
      role: input.user.role,
      workspaceId: input.user.workspaceId,
    },
    sharedSessions,
    handoffs: visibleHandoffs,
    digestPreferences: getDigestPreferences(input.user.id),
    digestRuns: listDigestRuns(input.user.id).slice(0, 8),
    digestScheduler: getDigestSchedulerStatus(),
    inbox: normalizedInbox,
    notificationHistory,
    notificationDigest,
  };
}
