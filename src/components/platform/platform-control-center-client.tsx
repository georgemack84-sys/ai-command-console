"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/src/components/app/app-provider";
import { SectionCard } from "@/src/components/shared/section-card";
import { AccessHistoryClient } from "@/src/components/access/access-history-client";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { EventEntry } from "@/src/components/ui/event-entry";
import { MetricTile } from "@/src/components/ui/metric-tile";
import { SignalEntry } from "@/src/components/ui/signal-entry";
import { SurfacePanel, SurfacePanelHeader } from "@/src/components/ui/surface-panel";
import { postOperationsAction } from "@/src/lib/client/operations-actions";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "viewer" | "operator" | "approver" | "admin";
  status: "active" | "disabled";
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
};

type WorkspaceSummary = {
  id: string;
  name: string;
  memberCount: number;
};

type WorkspaceInvite = {
  id: string;
  token: string;
  email: string | null;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
  createdByEmail: string;
  status: "pending" | "accepted" | "revoked";
};

type AdminAccessPayload = {
  users: AdminUser[];
  workspaces: WorkspaceSummary[];
  invites: WorkspaceInvite[];
  runtime?: {
    environment: string;
    storageDriver: "json" | "sqlite";
    authSecretConfigured: boolean;
    secureCookies: boolean;
    sessionMaxAgeSeconds: number;
    aiSummary?: {
      providerMode: "auto" | "openai" | "mock";
      model: string;
      timeoutMs: number;
      maxAttempts: number;
      allowMockFallback: boolean;
      openAiConfigured: boolean;
      dailyBudgetUsd: number;
      estimatedCostPerRunUsd: number;
      evaluationsEnabled: boolean;
    };
    jobs?: {
      executionMode: "in_process" | "external";
      workerPollIntervalMs: number;
      maxPendingJobs: number;
      maxRunningJobs: number;
      externalWorkerRecommended: boolean;
      health?: {
        running: number;
        activeWorkers: number;
        queued: number;
        scheduledRetries: number;
        staleRunning: number;
        unhealthy: boolean;
        pending: number;
        saturated: boolean;
        maxPendingJobs: number;
        maxRunningJobs: number;
      };
    };
    process?: {
      pid: number;
      uptimeSeconds: number;
      memory: {
        rssMb: number;
        heapUsedMb: number;
        heapTotalMb: number;
        externalMb: number;
      };
    };
    warnings?: Array<{
      code: string;
      severity: "warning" | "critical";
      message: string;
    }>;
  };
  diagnostics?: {
    summary: {
      total: number;
      errors: number;
      warnings: number;
      byScope: Record<string, number>;
      latestAt: string | null;
    };
    recent: Array<{
      id: string;
      timestamp: string;
      level: string;
      scope: string;
      message: string;
      traceId?: string | null;
      context?: Record<string, unknown>;
    }>;
  };
  aiSummaryReliability?: {
    status: "healthy" | "warning" | "critical";
    totals: {
      total: number;
      successes: number;
      fallbacks: number;
      retries: number;
      errors: number;
    };
    latestAt: string | null;
    latestSuccessAt: string | null;
    latestFallbackAt: string | null;
    recentSuccessRate: number;
    recentFailureRate: number;
    recentFallbackRate: number;
    trend: {
      successRateDelta: number;
      failureRateDelta: number;
      fallbackRateDelta: number;
    };
    traceRates: {
      total: number;
      success: number;
      fallback: number;
      error: number;
      successRate: number;
      failureRate: number;
    };
    recent: Array<{
      id: string;
      timestamp: string;
      level: string;
      scope: string;
      message: string;
      traceId?: string | null;
      context?: Record<string, unknown>;
    }>;
  };
  aiSummaryEvaluations?: {
    status: "healthy" | "warning" | "critical";
    totals: {
      total: number;
      healthy: number;
      warning: number;
      critical: number;
    };
    latestAt: string | null;
    averageScore: number;
    latestScore: number | null;
    recent: Array<{
      id: string;
      timestamp: string;
      level: string;
      scope: string;
      message: string;
      traceId?: string | null;
      context?: Record<string, unknown>;
    }>;
  };
  aiSummaryBudget?: {
    day: string;
    usageUsd: number;
    runs: number;
    updatedAt: string | null;
    dailyBudgetUsd: number;
    estimatedCostPerRunUsd: number;
    projectedUsageUsd: number;
    remainingUsd: number;
    budgetExceeded: boolean;
    recent: Array<{
      id: string;
      timestamp: string;
      traceId?: string | null;
      provider?: string | null;
      costUsd: number;
      attempts: number;
    }>;
  };
  legacyCompatibility?: {
    total: number;
    updatedAt: string | null;
    byAction: Record<string, number>;
    bySurface: Record<string, number>;
    recent: Array<{
      id: string;
      timestamp: string;
      surface: string;
      action: string;
      traceId?: string | null;
      context?: Record<string, unknown>;
    }>;
  };
};

type AdminSummaryCheckResult = {
  workspaceId: string;
  workspaceName: string;
  title: string;
  summary: string;
  bullets: string[];
  provider: "openai" | "mock";
  model: string;
  promptVersion: string;
  attempts: number;
  latencyMs: number;
  fallbackReason: string | null;
  traceId: string;
  viewName: string;
  forcedFallback?: boolean;
};

type OperatorCheckJob = {
  id: string;
  traceId?: string | null;
  type: string;
  status: string;
  attempts?: number;
  maxAttempts?: number;
  workerId?: string | null;
  leaseExpiresAt?: string | null;
  createdAt?: string | null;
};

type PlatformPayload = {
  overview: {
    activity: Array<{
      id?: string;
      type?: string;
      message?: string;
      createdAt?: string | null;
      timestamp?: string | null;
    }>;
    telemetry: {
      totals: {
        events: number;
        errors: number;
        avgCommandLatencyMs: number;
        avgWatcherLatencyMs: number;
        avgSchedulerLatencyMs: number;
      };
      byType: Array<{
        type: string;
        count: number;
      }>;
      recent: Array<{
        type: string;
        level?: string | null;
        createdAt?: string | null;
      }>;
    };
    jobs: {
      total: number;
      queued: number;
      running: number;
      failed: number;
      health: {
        activeWorkers: number;
        pending?: number;
        queued?: number;
        scheduledRetries?: number;
        running?: number;
        staleRunning: number;
        unhealthy: boolean;
        saturated?: boolean;
        maxPendingJobs?: number;
        maxRunningJobs?: number;
      };
      metrics: {
        avgQueueWaitMs?: number | null;
        avgRunTimeMs?: number | null;
        completionRate?: number | null;
        retryPressure?: number | null;
        scheduledRetryCount?: number | null;
        timedOut?: number | null;
      };
      items: Array<{
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
      }>;
      latestFailures: Array<{
        id: string;
        traceId?: string | null;
        type: string;
        status: string;
        error?: string | null;
        nextRetryAt?: string | null;
        latestEventAt?: string | null;
      }>;
    };
    collaboration: {
      digestScheduler: {
        enabled: boolean;
        intervalMs: number;
        lastRunAt?: string | null;
        lastError?: string | null;
        lastResult?: {
          workspaceCount?: number;
          queuedJobCount?: number;
          queuedJobIds?: string[];
        } | null;
      };
      digestEscalations: Array<{
        id: string;
        tone: string;
        title: string;
        detail: string;
        workspaceId?: string;
        workspaceName?: string;
      }>;
      globalOperations: {
        totals: {
          workspaceCount: number;
          overriddenWorkspaces: number;
          unhealthyWorkspaces: number;
          openIncidents: number;
          pendingApprovals: number;
          finalEscalations: number;
          activeTrustSignals: number;
          activeDigestEscalations: number;
          completedTrustIncidents: number;
          playbookRollouts: number;
        };
        environments: Array<{
          environment: string;
          workspaceCount: number;
          overrideCount: number;
          unhealthyCount: number;
          openIncidents: number;
          pendingApprovals: number;
          finalEscalations: number;
          activeTrustSignals: number;
          completedTrustIncidents: number;
          playbookRollouts: number;
          averageTrustScore: number;
        }>;
        hotspots: Array<{
          workspaceId: string;
          workspaceName: string;
          status: string;
          incidentStatus: string;
          environment: string;
          hasPolicyOverride?: boolean;
          policyOverrideSummary?: string | null;
          dueUsers: number;
          overdueIntervals: number;
          pendingApprovalTarget: string | null;
          finalEscalated: boolean;
        }>;
        pressureTargets: Array<{
          target: string;
          pendingCount: number;
          overdueCount: number;
          finalEscalatedCount: number;
          workspaceCount: number;
        }>;
        playbookRollouts: Array<{
          id: string;
          playbookName: string;
          environment: string;
          workspaceCount: number;
          workspaceNames: string[];
          appliedAt: string;
          appliedByName?: string | null;
        }>;
      };
      approvalTrustEnvironments: Array<{
        environment: string;
        current: boolean;
        autoPromoteEnabled: boolean;
        observationHours: number;
        cooldownHours: number;
        score: number;
        regressedCount: number;
        improvedCount: number;
        observingCount: number;
        cooldownCount: number;
        alertCount: number;
      }>;
      approvalTrustTrends: Array<{
        environment: string;
        current: boolean;
        latestTakenAt?: string | null;
        sampleCount: number;
        score: number;
        deltas: {
          day?: number | null;
          week?: number | null;
          month?: number | null;
        };
        activity: {
          latestRegressedCount: number;
          latestImprovedCount: number;
          latestAlertCount: number;
        };
      }>;
      approvalTrustSignals: Array<{
        id: string;
        tone: string;
        type: string;
        title: string;
        detail: string;
        environment?: string | null;
      }>;
      appliedApprovalPolicies: Array<{
        id: string;
        title: string;
        environment: string;
        appliedAt: string;
        appliedByName: string;
        appliedAutomatically?: boolean;
        effectSummary: string;
        rolledBackAt?: string | null;
        impact?: {
          status: string;
          summary: string;
        };
      }>;
      policyPlaybookAdoption: {
        totalTracked: number;
        presetCount: number;
        savedCount: number;
        items: Array<{
          playbookId: string | null;
          playbookName: string;
          source: string;
          environment: string;
          rolloutCount: number;
          workspaceCount: number;
          latestAppliedAt: string | null;
          recoveredWorkspaceCount: number;
          activeRiskWorkspaceCount: number;
          completedTrustCount: number;
        }>;
        recommendations: Array<{
          id: string;
          tone: string;
          title: string;
          detail: string;
          environment: string;
          playbookId?: string | null;
          playbookName?: string | null;
          kind: string;
          source: string;
        }>;
      };
      digestWorkspaceHealth: Array<{
        workspaceId: string;
        workspaceName: string;
        memberCount: number;
        dueUsers: number;
        overdueIntervals: number;
        escalationOwner: string | null;
        incidentApproverTarget: string | null;
        backupApproverTarget: string | null;
        incidentStatus: string;
        incidentStatusUpdatedAt: string | null;
        hasPolicyOverride?: boolean;
        policyOverrideSummary?: string | null;
        incidentSummary: string | null;
        snoozedUntil: string | null;
        status: string;
        incidentPolicy: {
          environment: string;
        };
        incidentApproval: {
          state: string;
          requestedStatus: string;
          approverTarget: string | null;
        } | null;
        incidentApprovalSla?: {
          overdue?: boolean;
          escalated?: boolean;
          finalEscalated?: boolean;
        } | null;
      }>;
      incidentApprovalPressure: Array<{
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
      }>;
      automationFollowups: Array<{
        id: string;
        description: string;
        status: string;
        ownerId?: string | null;
        ownerName?: string | null;
        workspaceId?: string | null;
        createdAt: string;
        completedAt?: string | null;
      }>;
      governance?: {
        currentEnvironment?: "development" | "staging" | "production";
        sensitiveActionsRequireApproval?: boolean;
        workspacePolicyOverrides?: Record<
          string,
          {
            environment?: "development" | "staging" | "production";
            incidentApprovalCapacityLimit?: number;
            incidentApprovalReminderMinutes?: number;
            trustDropAction?: string;
            trustDropFollowupOwner?: string;
            requireApprovalForResolved?: boolean;
            requireApprovalForArchived?: boolean;
            promoteTrustDropToIncident?: boolean;
          }
        >;
        environmentPolicies?: Record<
          string,
          {
            minimumRoleForCommands: string;
            minimumRoleForApprovals: string;
            minimumRoleForGovernance: string;
            requireApprovalForResolved: boolean;
            requireApprovalForArchived: boolean;
            incidentApprovalCapacityLimit: number;
            trustDropAction: string;
            promoteTrustDropToIncident: boolean;
          }
        >;
        workspacePolicyPlaybooks?: Array<{
          id: string;
          name: string;
          environment: string;
          incidentApprovalCapacityLimit: number;
          trustDropAction: string;
          requireApprovalForResolved: boolean;
          promoteTrustDropToIncident: boolean;
        }>;
        defaultPolicyPlaybookPresets?: Array<{
          id: string;
          name: string;
          environment: string;
          incidentApprovalCapacityLimit: number;
          trustDropAction: string;
          requireApprovalForResolved: boolean;
          promoteTrustDropToIncident: boolean;
          description?: string;
        }>;
      };
    };
  };
};

async function fetchPlatformPayload() {
  const response = await fetch("/api/control-center/overview", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load platform control center.");
  }
  const payload = (await response.json()) as { ok: boolean; data?: PlatformPayload };
  return payload.data as PlatformPayload;
}

async function fetchAdminAccessPayload() {
  const response = await fetch("/api/admin/access", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load admin access data.");
  }
  const payload = (await response.json()) as { ok: boolean; data?: AdminAccessPayload };
  return payload.data as AdminAccessPayload;
}

function formatTime(value?: string | null) {
  if (!value) {
    return "Waiting";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSignedDelta(value?: number | null) {
  const normalized = Number(value || 0);
  return `${normalized >= 0 ? "+" : ""}${normalized}`;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toneClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("error") || normalized.includes("critical") || normalized.includes("high")) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  }
  if (normalized.includes("warning") || normalized.includes("stalled")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }
  if (normalized.includes("healthy") || normalized.includes("active") || normalized.includes("ok")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
}

function describeRuntimeWarning(warning: { code: string; message: string }) {
  if (warning.code === "jobs_external_worker_missing") {
    return {
      title: "External worker missing",
      detail:
        "Queued jobs are waiting with no active worker. Start `npm run worker:jobs` and confirm `JOB_QUEUE_EXECUTION_MODE=external` for this runtime.",
    };
  }

  return {
    title: null,
    detail: warning.message,
  };
}

function compactTraceId(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function getWorkerStatus(runtimePosture: AdminAccessPayload["runtime"] | null) {
  const jobs = runtimePosture?.jobs;
  const health = jobs?.health;
  if (!jobs || !health) {
    return {
      label: "Unknown",
      tone: "warning",
      detail: "Worker state has not loaded yet.",
      recovery:
        "Refresh the platform control center. If this persists, inspect the app runtime and jobs worker logs.",
    };
  }
  if (jobs.executionMode !== "external") {
    return {
      label: "In-process",
      tone: "warning",
      detail: "Jobs are still running inside the web app process.",
      recovery: "Start `npm run worker:jobs` and set `JOB_QUEUE_EXECUTION_MODE=external` for sustained load.",
    };
  }
  if ((health.pending || 0) > 0 && (health.activeWorkers || 0) === 0) {
    return {
      label: "Worker missing",
      tone: "critical",
      detail: "Queued jobs are waiting with no active external worker.",
      recovery: "Start `npm run worker:jobs`, confirm the worker stays alive, then verify active workers rise above zero.",
    };
  }
  if (health.unhealthy || (health.staleRunning || 0) > 0) {
    return {
      label: "Recovery needed",
      tone: "warning",
      detail: "The queue has stale leases or degraded worker health.",
      recovery: "Inspect stale jobs, restart the worker if needed, and reduce pressure before queueing more work.",
    };
  }
  return {
    label: "Healthy",
    tone: "healthy",
    detail: `${health.activeWorkers || 0} active workers and ${health.pending || 0} pending jobs.`,
    recovery: "No action needed. Keep the external worker running for sustained load.",
  };
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <MetricTile label={label} value={value} detail={detail} className="rounded-[26px]" />;
}

export function PlatformControlCenterClient() {
  const { user, authLoading } = useAppSession();
  const [payload, setPayload] = useState<PlatformPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [approverDrafts, setApproverDrafts] = useState<Record<string, string>>({});
  const [backupDrafts, setBackupDrafts] = useState<Record<string, string>>({});
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, string>>({});
  const [playbookNameDrafts, setPlaybookNameDrafts] = useState<Record<string, string>>({});
  const [workspacePolicyDrafts, setWorkspacePolicyDrafts] = useState<
    Record<
      string,
      {
        environment?: "development" | "staging" | "production";
        incidentApprovalCapacityLimit?: number;
        incidentApprovalReminderMinutes?: number;
        trustDropAction?: string;
        trustDropFollowupOwner?: string;
        requireApprovalForResolved?: boolean;
        requireApprovalForArchived?: boolean;
        promoteTrustDropToIncident?: boolean;
      }
    >
  >({});
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminWorkspaces, setAdminWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [adminInvites, setAdminInvites] = useState<WorkspaceInvite[]>([]);
  const [runtimePosture, setRuntimePosture] = useState<AdminAccessPayload["runtime"] | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdminAccessPayload["diagnostics"] | null>(null);
  const [aiSummaryReliability, setAiSummaryReliability] = useState<AdminAccessPayload["aiSummaryReliability"] | null>(null);
  const [aiSummaryEvaluations, setAiSummaryEvaluations] = useState<AdminAccessPayload["aiSummaryEvaluations"] | null>(null);
  const [aiSummaryBudget, setAiSummaryBudget] = useState<AdminAccessPayload["aiSummaryBudget"] | null>(null);
  const [legacyCompatibility, setLegacyCompatibility] = useState<AdminAccessPayload["legacyCompatibility"] | null>(null);
  const [summaryCheck, setSummaryCheck] = useState<AdminSummaryCheckResult | null>(null);
  const [summaryCheckRunning, setSummaryCheckRunning] = useState(false);
  const [operatorCheckJob, setOperatorCheckJob] = useState<OperatorCheckJob | null>(null);
  const [operatorCheckRunning, setOperatorCheckRunning] = useState<"insights" | "summary" | "failure" | null>(null);
  const [workspaceNameDrafts, setWorkspaceNameDrafts] = useState<Record<string, string>>({});
  const [inviteDrafts, setInviteDrafts] = useState<Record<string, string>>({});
  const [platformMetaDraft, setPlatformMetaDraft] = useState<{
    currentEnvironment: "development" | "staging" | "production";
    sensitiveActionsRequireApproval: boolean;
  }>({
    currentEnvironment: "development",
    sensitiveActionsRequireApproval: false,
  });
  const [platformPolicyDrafts, setPlatformPolicyDrafts] = useState<
    Record<
      string,
      {
        incidentApprovalCapacityLimit: number;
        requireApprovalForResolved: boolean;
        trustDropAction: string;
        promoteTrustDropToIncident: boolean;
      }
    >
  >({});

  function syncGovernanceDrafts(nextPayload: PlatformPayload) {
    const nextGovernance = nextPayload.overview.collaboration.governance;
    const nextPolicies = nextGovernance?.environmentPolicies || {};
    setPlatformMetaDraft({
      currentEnvironment: nextGovernance?.currentEnvironment || "development",
      sensitiveActionsRequireApproval: Boolean(nextGovernance?.sensitiveActionsRequireApproval),
    });
    setPlatformPolicyDrafts({
      development: {
        incidentApprovalCapacityLimit: Number(nextPolicies.development?.incidentApprovalCapacityLimit || 1),
        requireApprovalForResolved: Boolean(nextPolicies.development?.requireApprovalForResolved),
        trustDropAction: String(nextPolicies.development?.trustDropAction || "notify"),
        promoteTrustDropToIncident: Boolean(nextPolicies.development?.promoteTrustDropToIncident),
      },
      staging: {
        incidentApprovalCapacityLimit: Number(nextPolicies.staging?.incidentApprovalCapacityLimit || 1),
        requireApprovalForResolved: Boolean(nextPolicies.staging?.requireApprovalForResolved),
        trustDropAction: String(nextPolicies.staging?.trustDropAction || "notify"),
        promoteTrustDropToIncident: Boolean(nextPolicies.staging?.promoteTrustDropToIncident),
      },
      production: {
        incidentApprovalCapacityLimit: Number(nextPolicies.production?.incidentApprovalCapacityLimit || 1),
        requireApprovalForResolved: Boolean(nextPolicies.production?.requireApprovalForResolved),
        trustDropAction: String(nextPolicies.production?.trustDropAction || "notify"),
        promoteTrustDropToIncident: Boolean(nextPolicies.production?.promoteTrustDropToIncident),
      },
    });
    setWorkspacePolicyDrafts(nextGovernance?.workspacePolicyOverrides || {});
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const [next, adminAccess] = await Promise.all([fetchPlatformPayload(), fetchAdminAccessPayload()]);
        if (cancelled) {
          return;
        }
        setPayload(next);
        syncGovernanceDrafts(next);
        setAdminUsers(adminAccess.users || []);
        setAdminWorkspaces(adminAccess.workspaces || []);
        setAdminInvites(adminAccess.invites || []);
        setRuntimePosture(adminAccess.runtime || null);
        setDiagnostics(adminAccess.diagnostics || null);
        setAiSummaryReliability(adminAccess.aiSummaryReliability || null);
        setAiSummaryEvaluations(adminAccess.aiSummaryEvaluations || null);
        setAiSummaryBudget(adminAccess.aiSummaryBudget || null);
        setLegacyCompatibility(adminAccess.legacyCompatibility || null);
        setWorkspaceNameDrafts(Object.fromEntries((adminAccess.workspaces || []).map((workspace) => [workspace.id, workspace.name])));
        setError(null);
      } catch (loadError: unknown) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load platform control center.");
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    const [next, adminAccess] = await Promise.all([fetchPlatformPayload(), fetchAdminAccessPayload()]);
    setPayload(next);
    syncGovernanceDrafts(next);
    setAdminUsers(adminAccess.users || []);
    setAdminWorkspaces(adminAccess.workspaces || []);
    setAdminInvites(adminAccess.invites || []);
    setRuntimePosture(adminAccess.runtime || null);
    setDiagnostics(adminAccess.diagnostics || null);
    setAiSummaryReliability(adminAccess.aiSummaryReliability || null);
    setAiSummaryEvaluations(adminAccess.aiSummaryEvaluations || null);
    setAiSummaryBudget(adminAccess.aiSummaryBudget || null);
    setLegacyCompatibility(adminAccess.legacyCompatibility || null);
    setWorkspaceNameDrafts(Object.fromEntries((adminAccess.workspaces || []).map((workspace) => [workspace.id, workspace.name])));
    setError(null);
  }

  async function runAction(action: string, payloadValue: Record<string, unknown>, success: string) {
    try {
      await postOperationsAction(action, payloadValue);
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
      return;
    }
    setMessage(success);
    setError(null);
    await load();
  }

  async function applyGuidance(recommendation: NonNullable<PlatformPayload["overview"]["collaboration"]["policyPlaybookAdoption"]>["recommendations"][number]) {
    const governance = payload?.overview.collaboration.governance;
    const target =
      (governance?.defaultPolicyPlaybookPresets || []).find((item) => item.id === recommendation.playbookId) ||
      (governance?.workspacePolicyPlaybooks || []).find((item) => item.id === recommendation.playbookId);

    if (!target) {
      setError("Recommended playbook is no longer available.");
      return;
    }

    const action =
      recommendation.source === "preset"
        ? "collaboration:automation-bulk-apply-policy-override"
        : "collaboration:automation-bulk-apply-policy-playbook";
    const actionPayload =
      recommendation.source === "preset"
        ? {
            environment: target.environment,
            statuses: ["error", "stalled"],
            overrideEnvironment: target.environment,
            incidentApprovalCapacityLimit: target.incidentApprovalCapacityLimit,
            trustDropAction: target.trustDropAction,
            requireApprovalForResolved: target.requireApprovalForResolved,
            promoteTrustDropToIncident: target.promoteTrustDropToIncident,
          }
        : {
            environment: target.environment,
            statuses: ["error", "stalled"],
            playbookId: target.id,
          };

    await runAction(action, actionPayload, `Applied ${target.name} across unhealthy ${target.environment} workspaces.`);
  }

  async function savePlatformDefaults(environment: "development" | "staging" | "production") {
    if (!governance?.environmentPolicies) {
      setError("Platform governance is not loaded yet.");
      return;
    }

    const nextGovernance = {
      ...governance,
      currentEnvironment: platformMetaDraft.currentEnvironment,
      sensitiveActionsRequireApproval: platformMetaDraft.sensitiveActionsRequireApproval,
      environmentPolicies: {
        ...governance.environmentPolicies,
        [environment]: {
          ...governance.environmentPolicies[environment],
          ...(platformPolicyDrafts[environment] || {}),
        },
      },
    };

    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "governance", governance: nextGovernance }),
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setError(result.error || `Unable to save ${environment} defaults.`);
      return;
    }
    setMessage(`Updated ${environment} platform defaults.`);
    await load();
  }

  function loadPlaybookIntoDrafts(playbook: {
    environment: string;
    incidentApprovalCapacityLimit: number;
    trustDropAction: string;
    requireApprovalForResolved: boolean;
    promoteTrustDropToIncident: boolean;
  }) {
    setPlatformPolicyDrafts((current) => ({
      ...current,
      [playbook.environment]: {
        incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
        trustDropAction: playbook.trustDropAction,
        requireApprovalForResolved: playbook.requireApprovalForResolved,
        promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
      },
    }));
  }

  async function savePlaybookFromDraft(environment: "development" | "staging" | "production") {
    const name = (playbookNameDrafts[environment] || "").trim();
    const draft = platformPolicyDrafts[environment];
    if (!name || !draft) {
      setError(`Add a name and draft values before saving a ${environment} playbook.`);
      return;
    }
    await runAction(
      "collaboration:save-policy-playbook",
      {
        playbook: {
          name,
          environment,
          incidentApprovalCapacityLimit: draft.incidentApprovalCapacityLimit,
          trustDropAction: draft.trustDropAction,
          requireApprovalForResolved: draft.requireApprovalForResolved,
          promoteTrustDropToIncident: draft.promoteTrustDropToIncident,
        },
      },
      `Saved policy playbook ${name}.`
    );
  }

  async function applySavedPlaybook(playbookId: string, playbookName: string, environment: string) {
    await runAction(
      "collaboration:automation-bulk-apply-policy-playbook",
      {
        playbookId,
        environment,
        statuses: ["error", "stalled"],
      },
      `Applied policy playbook ${playbookName} across unhealthy ${environment} workspaces.`
    );
  }

  async function deletePlaybook(playbookId: string, playbookName: string) {
    await runAction(
      "collaboration:delete-policy-playbook",
      { playbookId },
      `Deleted policy playbook ${playbookName}.`
    );
  }

  function updateWorkspacePolicyDraft(
    workspaceId: string,
    updates: {
      environment?: "development" | "staging" | "production";
      incidentApprovalCapacityLimit?: number;
      incidentApprovalReminderMinutes?: number;
      trustDropAction?: string;
      trustDropFollowupOwner?: string;
      requireApprovalForResolved?: boolean;
      requireApprovalForArchived?: boolean;
      promoteTrustDropToIncident?: boolean;
    }
  ) {
    setWorkspacePolicyDrafts((current) => ({
      ...current,
      [workspaceId]: {
        ...(current[workspaceId] || {}),
        ...updates,
      },
    }));
  }

  async function saveWorkspacePolicyOverride(workspaceId: string) {
    const override = workspacePolicyDrafts[workspaceId] || {};
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "workspace-policy", workspaceId, policyOverride: override }),
    });
    const result = (await response.json()) as { error?: string; governance?: PlatformPayload["overview"]["collaboration"]["governance"] };
    if (!response.ok || !result.governance) {
      setError(result.error || "Unable to save workspace override.");
      return;
    }
    setMessage(`Saved workspace override for ${workspaceId}.`);
    await load();
  }

  async function resetWorkspacePolicyOverride(workspaceId: string) {
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "workspace-policy", workspaceId, reset: true }),
    });
    const result = (await response.json()) as { error?: string; governance?: PlatformPayload["overview"]["collaboration"]["governance"] };
    if (!response.ok || !result.governance) {
      setError(result.error || "Unable to reset workspace override.");
      return;
    }
    setMessage(`Reset workspace override for ${workspaceId}.`);
    await load();
  }

  async function updateAdminUserRole(userId: string, role: AdminUser["role"]) {
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user-role", userId, role }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to update user role.");
      return;
    }
    setMessage("Updated user role.");
    await load();
  }

  async function updateAdminUserStatus(userId: string, status: AdminUser["status"]) {
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user-status", userId, status }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to update user status.");
      return;
    }
    setMessage("Updated user status.");
    await load();
  }

  async function updateAdminUserWorkspace(userId: string, workspaceId: string) {
    const workspace = adminWorkspaces.find((item) => item.id === workspaceId);
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user-workspace", userId, workspaceId, workspaceName: workspace?.name || workspaceId }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to move user workspace.");
      return;
    }
    setMessage("Moved user workspace.");
    await load();
  }

  async function renameAdminWorkspace(workspaceId: string) {
    const name = (workspaceNameDrafts[workspaceId] || "").trim();
    if (!name) {
      setError("Workspace name cannot be empty.");
      return;
    }
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "workspace-rename", workspaceId, workspaceName: name }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to rename workspace.");
      return;
    }
    setMessage(`Renamed workspace to ${name}.`);
    await load();
  }

  async function createAdminInvite(workspaceId: string) {
    const workspace = adminWorkspaces.find((item) => item.id === workspaceId);
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "workspace-invite",
        workspaceId,
        workspaceName: workspace?.name || workspaceId,
        email: (inviteDrafts[workspaceId] || "").trim() || null,
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to create workspace invite.");
      return;
    }
    setMessage(`Created invite for ${workspace?.name || workspaceId}.`);
    setInviteDrafts((current) => ({ ...current, [workspaceId]: "" }));
    await load();
  }

  async function revokeAdminInvite(token: string) {
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "workspace-invite-revoke", token }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Unable to revoke invite.");
      return;
    }
    setMessage("Revoked workspace invite.");
    await load();
  }

  async function runAdminSummaryCheck() {
    setSummaryCheckRunning(true);
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ai-summary-check" }),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      data?: { summaryCheck?: AdminSummaryCheckResult };
      error?: { message?: string };
    };
    setSummaryCheckRunning(false);

    if (!response.ok || !result.data?.summaryCheck) {
      setError(result.error?.message || "Unable to run AI summary check.");
      return;
    }

    setSummaryCheck(result.data.summaryCheck);
    setMessage(`Completed AI summary check for ${result.data.summaryCheck.workspaceName}.`);
    await load();
  }

  async function runAdminFallbackDrill() {
    setSummaryCheckRunning(true);
    const response = await fetch("/api/admin/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ai-summary-check", forceFallback: true }),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      data?: { summaryCheck?: AdminSummaryCheckResult };
      error?: { message?: string };
    };
    setSummaryCheckRunning(false);

    if (!response.ok || !result.data?.summaryCheck) {
      setError(result.error?.message || "Unable to run AI fallback drill.");
      return;
    }

    setSummaryCheck(result.data.summaryCheck);
    setMessage(`Completed AI fallback drill for ${result.data.summaryCheck.workspaceName}.`);
    await load();
  }

  async function queueOperatorCheck(kind: "insights" | "summary" | "failure") {
    if (Boolean(payload?.overview.jobs?.health?.saturated)) {
      setError("The job queue is saturated. Let the current workload drain before queueing another operator check.");
      return;
    }

    setOperatorCheckRunning(kind);
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        kind === "summary"
          ? {
              type: "workspace:generate-summary",
              view: {
                name: "Platform operator summary check",
                filter: "all",
                sort: "recent",
                freshnessHours: 72,
              },
            }
          : kind === "failure"
            ? {
                type: "workspace:failure-drill",
              }
            : {
                type: "workspace:generate-insights",
              },
      ),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      data?: { job?: OperatorCheckJob };
      error?: { message?: string };
    };
    setOperatorCheckRunning(null);

    if (!response.ok || !result.data?.job) {
      setError(result.error?.message || "Unable to queue operator check.");
      return;
    }

    setOperatorCheckJob(result.data.job);
    setMessage(
      kind === "summary"
        ? "Queued platform operator summary job."
        : kind === "failure"
          ? "Queued platform failure drill."
          : "Queued platform operator insight refresh.",
    );
    await load();
  }

  async function managePlatformJob(type: "job:cancel" | "job:retry", jobId: string, success: string) {
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, jobId }),
    });
    const result = (await response.json()) as { error?: { message?: string } };

    if (!response.ok) {
      setError(result.error?.message || "Unable to update job.");
      return;
    }

    setMessage(success);
    await load();
  }

  const collaboration = payload?.overview.collaboration;
  const activity = payload?.overview.activity;
  const telemetry = payload?.overview.telemetry;
  const jobs = payload?.overview.jobs;
  const queuePending = Number(jobs?.health?.pending ?? ((jobs?.health?.queued ?? 0) + (jobs?.health?.scheduledRetries ?? 0)));
  const queuePendingLimit = Math.max(1, Number(jobs?.health?.maxPendingJobs ?? 1));
  const queueRunning = Number(jobs?.health?.running ?? 0);
  const queueRunningLimit = Math.max(1, Number(jobs?.health?.maxRunningJobs ?? 1));
  const queuePendingRatio = queuePending / queuePendingLimit;
  const queueRunningRatio = queueRunning / queueRunningLimit;
  const queueSaturated = Boolean(jobs?.health?.saturated);
  const queueHot = !queueSaturated && (queuePendingRatio >= 0.7 || queueRunningRatio >= 0.7);
  const operatorChecksDisabled = Boolean(operatorCheckRunning) || queueSaturated;
  const workerStatus = getWorkerStatus(runtimePosture);
  const globalOperations = collaboration?.globalOperations;
  const trustEnvironments = collaboration?.approvalTrustEnvironments;
  const trustTrends = collaboration?.approvalTrustTrends;
  const trustSignals = collaboration?.approvalTrustSignals;
  const appliedPolicies = collaboration?.appliedApprovalPolicies;
  const playbookAdoption = collaboration?.policyPlaybookAdoption;
  const governance = collaboration?.governance;
  const workspaceHealth = collaboration?.digestWorkspaceHealth;
  const approvalPressure = collaboration?.incidentApprovalPressure;
  const followups = collaboration?.automationFollowups;
  const platformExceptions = useMemo(
    () => (globalOperations?.hotspots || []).filter((item) => item.hasPolicyOverride),
    [globalOperations?.hotspots]
  );
  const incidentBoard = useMemo(() => {
    const items = Array.isArray(workspaceHealth) ? workspaceHealth : [];
    const critical = items
      .filter((item) => item.status === "error" || item.status === "stalled")
      .sort((a, b) => Number(b.overdueIntervals || 0) - Number(a.overdueIntervals || 0))
      .slice(0, 6);
    const approvalBlocked = items
      .filter((item) => item.incidentApproval?.state === "pending")
      .sort((a, b) => {
        const aFinal = Boolean(a.incidentApprovalSla?.finalEscalated);
        const bFinal = Boolean(b.incidentApprovalSla?.finalEscalated);
        if (aFinal !== bFinal) {
          return aFinal ? -1 : 1;
        }
        return Number(b.overdueIntervals || 0) - Number(a.overdueIntervals || 0);
      })
      .slice(0, 6);
    const drifted = items
      .filter((item) => item.hasPolicyOverride)
      .sort((a, b) => Number(b.overdueIntervals || 0) - Number(a.overdueIntervals || 0))
      .slice(0, 6);
    return { critical, approvalBlocked, drifted };
  }, [workspaceHealth]);
  const teamsBoard = useMemo(() => {
    const items = Array.isArray(workspaceHealth) ? workspaceHealth : [];
    const pressureItems = Array.isArray(approvalPressure) ? approvalPressure : [];
    const followupItems = Array.isArray(followups) ? followups : [];
    const ownerCoverage = items.map((item) => ({
      workspaceId: item.workspaceId,
      workspaceName: item.workspaceName,
      owner: item.escalationOwner,
      approver: item.incidentApproverTarget,
      backup: item.backupApproverTarget,
      status: item.status,
      missingOwner: !item.escalationOwner,
      missingApprover: !item.incidentApproverTarget,
      missingBackup: !item.backupApproverTarget,
    }));
    const unassigned = ownerCoverage.filter((item) => item.missingOwner || item.missingApprover || item.missingBackup).slice(0, 8);
    const covered = ownerCoverage.filter((item) => !item.missingOwner && !item.missingApprover && !item.missingBackup).length;
    const ownerLoad = Object.entries(
      items.reduce<Record<string, { count: number; workspaces: string[] }>>((acc, item) => {
        const key = item.escalationOwner || "Unassigned";
        if (!acc[key]) {
          acc[key] = { count: 0, workspaces: [] };
        }
        acc[key].count += 1;
        acc[key].workspaces.push(item.workspaceName);
        return acc;
      }, {})
    )
      .map(([name, value]) => ({ name, count: value.count, workspaces: value.workspaces }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const followupLoad = Object.entries(
      followupItems.reduce<Record<string, { total: number; open: number; completed: number }>>((acc, item) => {
        const key = item.ownerName || "Unassigned";
        if (!acc[key]) {
          acc[key] = { total: 0, open: 0, completed: 0 };
        }
        acc[key].total += 1;
        if (item.status === "completed") {
          acc[key].completed += 1;
        } else {
          acc[key].open += 1;
        }
        return acc;
      }, {})
    )
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.open - a.open || b.total - a.total)
      .slice(0, 6);
    const approverLoad = pressureItems
      .map((item) => ({
        target: item.target,
        pendingCount: item.pendingCount,
        overdueCount: item.overdueCount,
        finalEscalatedCount: item.finalEscalatedCount,
        workspaceNames: item.workspaces.map((entry) => entry.workspaceName).slice(0, 4),
      }))
      .slice(0, 6);
    return {
      totals: {
        workspaceCount: items.length,
        covered,
        unassignedCount: unassigned.length,
        followupsOpen: followupItems.filter((item) => item.status !== "completed").length,
      },
      unassigned,
      ownerLoad,
      approverLoad,
      followupLoad,
    };
  }, [approvalPressure, followups, workspaceHealth]);
  const policies = governance?.environmentPolicies || {};
  const trustItems = Array.isArray(trustEnvironments) ? trustEnvironments : [];
  const environmentPolicies = ["development", "staging", "production"]
    .map((environment) => {
      const policy = policies[environment];
      const trust = trustItems.find((item) => item.environment === environment);
      const ops = globalOperations?.environments.find((item) => item.environment === environment);
      const recommended = playbookAdoption?.recommendations.find((item) => item.environment === environment);
      return {
        environment,
        policy,
        trust,
        ops,
        recommended,
      };
    })
    .filter((item) => item.policy);
  const platformChanges = useMemo(() => {
    const activityItemsRaw = Array.isArray(activity) ? activity : [];
    const trustSignalItems = Array.isArray(trustSignals) ? trustSignals : [];
    const appliedPolicyItems = Array.isArray(appliedPolicies) ? appliedPolicies : [];
    const rolloutItems = (globalOperations?.playbookRollouts || []).slice(0, 6).map((item) => ({
      id: `rollout-${item.id}`,
      category: "Playbook rollout",
      title: item.playbookName,
      detail: `${item.workspaceCount} workspace${item.workspaceCount === 1 ? "" : "s"} in ${item.environment}.`,
      actor: item.appliedByName || "System",
      timestamp: item.appliedAt,
      tone: "active",
    }));
    const policyItems = appliedPolicyItems.slice(0, 6).map((item) => ({
      id: `policy-${item.id}`,
      category: item.rolledBackAt ? "Policy rollback" : item.appliedAutomatically ? "Auto policy" : "Policy change",
      title: item.title,
      detail: `${item.effectSummary}${item.impact?.summary ? ` ${item.impact.summary}` : ""}`,
      actor: item.appliedByName,
      timestamp: item.rolledBackAt || item.appliedAt,
      tone: item.rolledBackAt ? "warning" : item.impact?.status === "regressed" ? "critical" : "active",
    }));
    const trustItems = trustSignalItems.slice(0, 6).map((item) => ({
      id: `trust-${item.id}`,
      category: "Trust signal",
      title: item.title,
      detail: `${item.environment ? `${item.environment} • ` : ""}${item.detail}`,
      actor: "Platform monitor",
      timestamp: null,
      tone: item.tone,
    }));
    const activityItems = activityItemsRaw.slice(0, 8).map((item, index) => ({
      id: item.id || `activity-${index}`,
      category: item.type || "Manager activity",
      title: item.message || "Platform event",
      detail: "Recorded by the manager activity stream.",
      actor: "Manager",
      timestamp: item.createdAt || item.timestamp || null,
      tone: "active",
    }));
    return [...rolloutItems, ...policyItems, ...trustItems, ...activityItems]
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 12);
  }, [activity, appliedPolicies, globalOperations?.playbookRollouts, trustSignals]);

  function exportPlatformReport() {
    if (!globalOperations) {
      setError("Platform report is not ready yet.");
      return;
    }

    const lines = [
      ["section", "name", "environment", "metric_a", "metric_b", "metric_c", "metric_d", "detail"].map(csvEscape).join(","),
      [
        "totals",
        "platform",
        "all",
        globalOperations.totals.workspaceCount,
        globalOperations.totals.unhealthyWorkspaces,
        globalOperations.totals.pendingApprovals,
        globalOperations.totals.activeTrustSignals,
        "workspace_count, unhealthy, pending approvals, trust signals",
      ].map(csvEscape).join(","),
      ...globalOperations.environments.map((item) =>
        [
          "environment",
          item.environment,
          item.environment,
          item.workspaceCount,
          item.unhealthyCount,
          item.overrideCount,
          Math.round(item.averageTrustScore),
          "workspace_count, unhealthy, overrides, avg trust score",
        ].map(csvEscape).join(",")
      ),
      ...teamsBoard.ownerLoad.map((item) =>
        [
          "owner_load",
          item.name,
          "all",
          item.count,
          item.workspaces.length,
          "",
          "",
          item.workspaces.join(" | "),
        ].map(csvEscape).join(",")
      ),
      ...teamsBoard.approverLoad.map((item) =>
        [
          "approver_load",
          item.target,
          "all",
          item.pendingCount,
          item.overdueCount,
          item.finalEscalatedCount,
          item.workspaceNames.length,
          item.workspaceNames.join(" | "),
        ].map(csvEscape).join(",")
      ),
      ...platformChanges.map((item) =>
        [
          "timeline",
          item.title,
          "",
          item.category,
          item.actor,
          item.timestamp || "",
          item.tone,
          item.detail,
        ].map(csvEscape).join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Exported the platform control report.");
  }

  if (authLoading) {
    return (
      <SectionCard
        eyebrow="Platform"
        title="Loading platform control center"
        description="Checking administrator access before loading cross-workspace controls."
      >
        <p className="text-sm text-slate-300">Restoring your administrator session and platform posture.</p>
      </SectionCard>
    );
  }

  if (user?.role !== "admin") {
    return (
      <SectionCard
        eyebrow="Platform"
        title="Admin access required"
        description="The platform control center is reserved for administrators."
      >
        <p className="text-sm text-slate-300">Switch to an admin account to manage cross-workspace remediation and policy posture.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Platform"
        title="Platform Control Center"
        description="A cross-workspace command layer for platform posture, remediation, trust movement, and governance drift."
      >
        <div className="mb-4 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(15,23,42,0.5))] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="border-white/10 bg-white/6 text-slate-200">Executive layer</Badge>
            <p className="mt-3 text-sm text-slate-300">High-signal overview first, then environment controls and incident lanes underneath.</p>
          </div>
          <button
            type="button"
            onClick={exportPlatformReport}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Export platform report
          </button>
        </div>
        {message ? <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

        {globalOperations ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Workspaces" value={String(globalOperations.totals.workspaceCount)} detail="Active workspace clusters in the platform." />
              <MetricCard label="Unhealthy" value={String(globalOperations.totals.unhealthyWorkspaces)} detail="Clusters currently stalled or in error." />
              <MetricCard label="Approvals" value={String(globalOperations.totals.pendingApprovals)} detail="Pending closeout approvals across teams." />
              <MetricCard label="Exceptions" value={String(globalOperations.totals.overriddenWorkspaces)} detail="Workspaces diverging from platform defaults." />
              <MetricCard label="Trust Signals" value={String(globalOperations.totals.activeTrustSignals)} detail="Active policy trust issues across environments." />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr,0.95fr]">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.5))] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Badge className="border-white/10 bg-white/6 text-slate-200">Environment deck</Badge>
                    <p className="text-sm font-semibold text-white">Environment command deck</p>
                    <p className="mt-1 text-sm text-slate-300">Act on unhealthy clusters by environment without dropping into individual workspace views.</p>
                  </div>
                  <Link href="/operations" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Open full operations
                  </Link>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {globalOperations.environments.map((item) => (
                    <div key={item.environment} className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold capitalize text-white">{item.environment}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.unhealthyCount ? "warning" : "healthy")}`}>
                          trust {Math.round(item.averageTrustScore)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.workspaceCount} workspaces • {item.overrideCount} overrides • {item.playbookRollouts} rollouts
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        {item.unhealthyCount} unhealthy • {item.pendingApprovals} pending approvals • {item.activeTrustSignals} trust signals
                      </p>
                      <div className="mt-3 space-y-2">
                        <input
                          value={ownerDrafts[item.environment] ?? ""}
                          onChange={(event) => setOwnerDrafts((current) => ({ ...current, [item.environment]: event.target.value }))}
                          placeholder="Owner for unhealthy cluster"
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        />
                        <input
                          value={approverDrafts[item.environment] ?? ""}
                          onChange={(event) => setApproverDrafts((current) => ({ ...current, [item.environment]: event.target.value }))}
                          placeholder="Required approver target"
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        />
                        <input
                          value={backupDrafts[item.environment] ?? ""}
                          onChange={(event) => setBackupDrafts((current) => ({ ...current, [item.environment]: event.target.value }))}
                          placeholder="Backup approver target"
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        />
                        <input
                          value={followupDrafts[item.environment] ?? ""}
                          onChange={(event) => setFollowupDrafts((current) => ({ ...current, [item.environment]: event.target.value }))}
                          placeholder="Follow-up template"
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-run-sweep",
                              { environment: item.environment, statuses: ["error", "stalled"] },
                              `Queued digest sweeps for unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                        >
                          Sweep cluster
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-stabilize",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                owner: ownerDrafts[item.environment] ?? "",
                                approverTarget: approverDrafts[item.environment] ?? "",
                                backupApproverTarget: backupDrafts[item.environment] ?? "",
                                description:
                                  followupDrafts[item.environment] ||
                                  "Investigate platform instability for {{workspaceName}} and capture the next remediation step.",
                                createFollowup: true,
                                queueSweep: true,
                              },
                              `Ran the stabilization playbook for unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-100"
                        >
                          Stabilize
                        </button>
                        <Link
                          href={`/operations?exceptions=overrides`}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                        >
                          Review exceptions
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Trust movement</p>
                      <p className="mt-1 text-sm text-slate-300">Environment-level trust posture and recent drift over time.</p>
                    </div>
                    <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                      Trust detail
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(Array.isArray(trustEnvironments) ? trustEnvironments : []).map((item) => {
                      const trend = (Array.isArray(trustTrends) ? trustTrends : []).find((entry) => entry.environment === item.environment);
                      return (
                        <div key={item.environment} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold capitalize text-white">{item.environment}</p>
                            <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.score >= 80 ? "healthy" : item.score >= 60 ? "warning" : "critical")}`}>
                              {item.score}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.improvedCount} improved • {item.regressedCount} regressed • {item.alertCount} alerts
                          </p>
                          <p className="mt-2 text-xs text-slate-300">
                            24h {formatSignedDelta(trend?.deltas.day)} • 7d {formatSignedDelta(trend?.deltas.week)} • 30d {formatSignedDelta(trend?.deltas.month)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Policy exceptions</p>
                      <p className="mt-1 text-sm text-slate-300">The highest-risk workspaces currently deviating from platform defaults.</p>
                    </div>
                    <Link href="/settings" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                      Edit defaults
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {platformExceptions.length ? (
                      platformExceptions.slice(0, 5).map((item) => (
                        <Link
                          key={item.workspaceId}
                          href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}&exceptions=overrides`}
                          className="block rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{item.workspaceName}</p>
                            <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.finalEscalated ? "critical" : item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.environment} • incident {item.incidentStatus} • {item.overdueIntervals} overdue intervals
                          </p>
                          <p className="mt-2 text-xs text-amber-100">
                            {item.policyOverrideSummary || "Workspace-specific policy active"}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                        No active policy exceptions are creating hotspots right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr,1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Approval load board</p>
                    <p className="mt-1 text-sm text-slate-300">The most overloaded approval targets across the platform.</p>
                  </div>
                  <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Open approval queues
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {globalOperations.pressureTargets.map((item) => (
                    <div key={item.target} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.target}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.finalEscalatedCount ? "critical" : item.overdueCount ? "warning" : "active")}`}>
                          {item.pendingCount} pending
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.overdueCount} overdue • {item.finalEscalatedCount} final escalated • {item.workspaceCount} workspaces
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Playbook recommendations</p>
                    <p className="mt-1 text-sm text-slate-300">Outcome-based guidance for which stabilization bundles to trust and where to apply them.</p>
                  </div>
                  <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Playbook detail
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {playbookAdoption?.recommendations.length ? (
                    playbookAdoption.recommendations.slice(0, 4).map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${toneClass(item.tone)}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <span className="text-xs uppercase text-slate-200">{item.environment}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-100">{item.detail}</p>
                        <p className="mt-2 text-xs text-slate-300">
                          {item.source}
                          {item.playbookName ? ` • ${item.playbookName}` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void applyGuidance(item)}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                          >
                            Apply recommendation
                          </button>
                          <Link
                            href="/operations"
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                          >
                            Inspect in Ops
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                      Guidance will appear here once rollout outcomes establish stronger winners and weak bundles.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform automation board</p>
                  <p className="mt-1 text-sm text-slate-300">Runtime posture for jobs, scheduler health, queue pressure, and automation throughput across the platform.</p>
                </div>
                <Link href="/console" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Open console runtime
                </Link>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard
                      label="Queued jobs"
                      value={String(jobs?.queued ?? 0)}
                      detail={`${jobs?.running ?? 0} running • ${jobs?.failed ?? 0} failed`}
                    />
                    <MetricCard
                      label="Queue wait"
                      value={`${Math.round((jobs?.metrics?.avgQueueWaitMs ?? 0) / 1000)}s`}
                      detail={`Avg run ${Math.round((jobs?.metrics?.avgRunTimeMs ?? 0) / 1000)}s`}
                    />
                    <MetricCard
                      label="Completion"
                      value={`${Math.round((jobs?.metrics?.completionRate ?? 0) * 100)}%`}
                      detail={`Retry pressure ${Math.round((jobs?.metrics?.retryPressure ?? 0) * 100)}%`}
                    />
                    <MetricCard
                      label="Scheduler"
                      value={collaboration?.digestScheduler?.enabled ? "Running" : "Idle"}
                      detail={`Last sweep ${formatTime(collaboration?.digestScheduler?.lastRunAt)}`}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard
                      label="Workers"
                      value={String(jobs?.health?.activeWorkers ?? 0)}
                      detail={`${jobs?.running ?? 0} running jobs currently leased`}
                    />
                    <MetricCard
                      label="Stale jobs"
                      value={String(jobs?.health?.staleRunning ?? 0)}
                      detail={jobs?.health?.unhealthy ? "Queue attention needed" : "No stale worker leases detected"}
                    />
                    <MetricCard
                      label="Timed out"
                      value={String(jobs?.metrics?.timedOut ?? 0)}
                      detail={`${jobs?.metrics?.scheduledRetryCount ?? 0} scheduled retries pending`}
                    />
                  </div>
                  {queueSaturated ? (
                    <div data-testid="platform-queue-saturated" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                      The queue is saturated at {queuePending}/{queuePendingLimit} pending jobs. New operator checks are temporarily paused until current work drains.
                    </div>
                  ) : null}
                  {queueHot ? (
                    <div data-testid="platform-queue-hot" className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      Queue pressure is elevated at {queuePending}/{queuePendingLimit} pending and {queueRunning}/{queueRunningLimit} running jobs. Expect slower leases and prefer retries over new drill traffic.
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Scheduler and digest pressure</p>
                      <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(collaboration?.digestScheduler?.lastError ? "critical" : collaboration?.digestScheduler?.enabled ? "healthy" : "warning")}`}>
                        {collaboration?.digestScheduler?.lastError ? "attention" : collaboration?.digestScheduler?.enabled ? "stable" : "paused"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      Interval {Math.round((collaboration?.digestScheduler?.intervalMs ?? 0) / 1000)}s • scanned{" "}
                      {collaboration?.digestScheduler?.lastResult?.workspaceCount ?? 0} workspaces • queued{" "}
                      {collaboration?.digestScheduler?.lastResult?.queuedJobCount ?? 0} digest jobs
                    </p>
                    {collaboration?.digestScheduler?.lastError ? (
                      <p className="mt-2 text-sm text-rose-200">Last scheduler error: {collaboration.digestScheduler.lastError}</p>
                    ) : null}
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {(collaboration?.digestEscalations || []).slice(0, 3).map((item) => (
                        <div key={item.id} className={`rounded-2xl border p-3 ${toneClass(item.tone)}`}>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-100">{item.detail}</p>
                          {item.workspaceName ? <p className="mt-1 text-xs text-slate-200">{item.workspaceName}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Live job queue</p>
                      <span className="text-xs text-slate-400">{jobs?.items?.length ?? 0} jobs</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(jobs?.items || []).slice(0, 6).map((job) => (
                        <div key={job.id} data-testid={`platform-live-job-${job.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{job.type}</p>
                            <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(job.status)}`}>{job.status}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {job.id} • attempts {job.attempts ?? 0}/{job.maxAttempts ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {job.workerId ? `worker ${job.workerId}` : "worker unassigned"} • {job.leaseExpiresAt ? `lease ${formatTime(job.leaseExpiresAt)}` : "not leased"}
                          </p>
                          {job.traceId ? <p className="mt-1 font-mono text-[11px] text-cyan-200">Trace {compactTraceId(job.traceId)}</p> : null}
                          {job.nextRetryAt ? <p className="mt-1 text-xs text-slate-400">Next retry {formatTime(job.nextRetryAt)}</p> : null}
                          {job.error ? <p className="mt-1 text-xs text-rose-200">{job.error}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {job.status === "queued" ? (
                              <button
                                type="button"
                                onClick={() => void managePlatformJob("job:cancel", job.id, `Canceled ${job.id}.`)}
                                data-testid={`platform-job-cancel-${job.id}`}
                                className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                              >
                                Cancel
                              </button>
                            ) : null}
                            {job.status === "failed" ? (
                              <button
                                type="button"
                                onClick={() => void managePlatformJob("job:retry", job.id, `Retried ${job.id}.`)}
                                data-testid={`platform-job-retry-${job.id}`}
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                              >
                                Retry
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Latest failed jobs</p>
                      <span className="text-xs text-slate-400">{jobs?.latestFailures?.length ?? 0} failures</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(jobs?.latestFailures || []).length ? (
                        jobs?.latestFailures.map((job) => (
                          <div key={`failed-${job.id}`} data-testid={`platform-failed-job-${job.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">{job.type}</p>
                              <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(job.status)}`}>{job.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{job.id} • {formatTime(job.latestEventAt)}</p>
                            {job.traceId ? <p className="mt-1 font-mono text-[11px] text-cyan-200">Trace {compactTraceId(job.traceId)}</p> : null}
                            {job.error ? <p className="mt-1 text-xs text-rose-200">{job.error}</p> : null}
                            {job.nextRetryAt ? <p className="mt-1 text-xs text-amber-200">Next retry {formatTime(job.nextRetryAt)}</p> : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void managePlatformJob("job:retry", job.id, `Retried ${job.id}.`)}
                                data-testid={`platform-failed-job-retry-${job.id}`}
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                              >
                                Retry failed job
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                          No recent failed jobs to triage.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Telemetry pulse</p>
                      <span className="text-xs text-slate-400">{telemetry?.totals?.events ?? 0} events</span>
                    </div>
                    <div className="mt-4 grid gap-3 grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Errors</p>
                        <p className="mt-2 text-lg font-semibold text-white">{telemetry?.totals?.errors ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Scheduler latency</p>
                        <p className="mt-2 text-lg font-semibold text-white">{telemetry?.totals?.avgSchedulerLatencyMs ?? 0}ms</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(telemetry?.byType || []).slice(0, 4).map((item) => (
                        <div key={item.type} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          <span>{item.type}</span>
                          <span className="text-xs text-slate-400">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform teams board</p>
                  <p className="mt-1 text-sm text-slate-300">Cross-workspace accountability for owners, approvers, backups, and follow-up responsibility.</p>
                </div>
                <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Open workspace actions
                </Link>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <MetricCard
                  label="Covered workspaces"
                  value={String(teamsBoard.totals.covered)}
                  detail={`${teamsBoard.totals.workspaceCount} total workspaces`}
                />
                <MetricCard
                  label="Coverage gaps"
                  value={String(teamsBoard.totals.unassignedCount)}
                  detail="Workspaces missing owner, approver, or backup coverage."
                />
                <MetricCard
                  label="Open follow-ups"
                  value={String(teamsBoard.totals.followupsOpen)}
                  detail="Outstanding remediation work assigned to teammates."
                />
                <MetricCard
                  label="Approval targets"
                  value={String(teamsBoard.approverLoad.length)}
                  detail="Active approver queues currently tracked."
                />
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Coverage gaps</p>
                    <span className="text-xs text-slate-400">{teamsBoard.unassigned.length} shown</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {teamsBoard.unassigned.length ? (
                      teamsBoard.unassigned.map((item) => (
                        <div key={`coverage-${item.workspaceId}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.workspaceName}</p>
                            <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.status)}`}>{item.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            {item.missingOwner ? "missing owner" : "owner set"}
                            {" • "}
                            {item.missingApprover ? "missing approver" : "approver set"}
                            {" • "}
                            {item.missingBackup ? "missing backup" : "backup set"}
                          </p>
                          <div className="mt-3">
                            <Link
                              href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}${item.missingBackup || item.missingApprover || item.missingOwner ? "&exceptions=overrides" : ""}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                            >
                              Fix coverage
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        Every tracked workspace currently has owner and approval coverage.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Owner load</p>
                    <span className="text-xs text-slate-400">{teamsBoard.ownerLoad.length} teammates</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {teamsBoard.ownerLoad.map((item) => (
                      <div key={`owner-load-${item.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <span className="text-xs text-slate-400">{item.count} workspace{item.count === 1 ? "" : "s"}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.workspaces.slice(0, 3).join(", ")}
                          {item.workspaces.length > 3 ? ` +${item.workspaces.length - 3} more` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Approver and follow-up load</p>
                    <span className="text-xs text-slate-400">
                      {teamsBoard.approverLoad.length} approver queues • {teamsBoard.followupLoad.length} follow-up owners
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {teamsBoard.approverLoad.map((item) => (
                      <div key={`approver-load-${item.target}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{item.target}</p>
                          <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.finalEscalatedCount ? "critical" : item.overdueCount ? "warning" : "active")}`}>
                            {item.pendingCount} pending
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.overdueCount} overdue • {item.finalEscalatedCount} final escalated
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.workspaceNames.join(", ")}
                        </p>
                      </div>
                    ))}
                    {teamsBoard.followupLoad.slice(0, 3).map((item) => (
                      <div key={`followup-load-${item.name}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <span className="text-xs text-slate-400">{item.open} open</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.total} total • {item.completed} completed
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform changes board</p>
                  <p className="mt-1 text-sm text-slate-300">A unified stream for rollouts, policy changes, trust movement, and manager activity across the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Workspace timeline
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-sm font-semibold text-white">Change summary</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recent rollouts</p>
                      <p className="mt-2 text-lg font-semibold text-white">{globalOperations?.playbookRollouts.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Policy moves</p>
                      <p className="mt-2 text-lg font-semibold text-white">{Array.isArray(appliedPolicies) ? appliedPolicies.length : 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Trust signals</p>
                      <p className="mt-2 text-lg font-semibold text-white">{Array.isArray(trustSignals) ? trustSignals.length : 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Manager events</p>
                      <p className="mt-2 text-lg font-semibold text-white">{Array.isArray(activity) ? activity.length : 0}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Recent platform timeline</p>
                    <span className="text-xs text-slate-400">{platformChanges.length} entries</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {platformChanges.length ? (
                      platformChanges.map((item) => (
                        <div key={item.id} className={`rounded-2xl border p-3 ${toneClass(item.tone)}`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <span className="text-[11px] uppercase text-slate-200">{item.category}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-100">{item.detail}</p>
                          <p className="mt-2 text-xs text-slate-300">
                            {item.actor}
                            {item.timestamp ? ` • ${formatTime(item.timestamp)}` : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        Platform changes will appear here as rollouts, policy actions, and trust movement accumulate.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Access and governance audit</p>
                  <p className="mt-1 text-sm text-slate-300">Approvals, role changes, ownership churn, and governance history are now part of the platform control center.</p>
                </div>
              </div>
              <AccessHistoryClient embedded />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform policy board</p>
                  <p className="mt-1 text-sm text-slate-300">Compare environment defaults, exception pressure, and trust posture before you push the next policy move.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={platformMetaDraft.currentEnvironment}
                    onChange={(event) =>
                      setPlatformMetaDraft((current) => ({
                        ...current,
                        currentEnvironment: event.target.value as "development" | "staging" | "production",
                      }))
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="development">development</option>
                    <option value="staging">staging</option>
                    <option value="production">production</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setPlatformMetaDraft((current) => ({
                        ...current,
                        sensitiveActionsRequireApproval: !current.sensitiveActionsRequireApproval,
                      }))
                    }
                    className={`rounded-full border px-4 py-2 text-xs ${
                      platformMetaDraft.sensitiveActionsRequireApproval
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    Sensitive approvals {platformMetaDraft.sensitiveActionsRequireApproval ? "on" : "off"}
                  </button>
                  <Link href="/settings" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Edit defaults
                  </Link>
                  <Link href="/operations?exceptions=overrides" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Review exceptions
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {environmentPolicies.map((item) => (
                  <div key={`platform-policy-${item.environment}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-white">{item.environment}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Commands {item.policy?.minimumRoleForCommands} • Approvals {item.policy?.minimumRoleForApprovals}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass((item.trust?.score || 0) >= 80 ? "healthy" : (item.trust?.score || 0) >= 60 ? "warning" : "critical")}`}>
                        trust {item.trust?.score ?? 0}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Approvals</p>
                        <p className="mt-2 text-sm text-slate-200">
                          Resolve {item.policy?.requireApprovalForResolved ? "required" : "open"}
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          Archive {item.policy?.requireApprovalForArchived ? "required" : "open"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Capacity {item.policy?.incidentApprovalCapacityLimit}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Trust</p>
                        <p className="mt-2 text-sm text-slate-200">Action {item.policy?.trustDropAction}</p>
                        <p className="mt-1 text-sm text-slate-200">
                          Incident promotion {item.policy?.promoteTrustDropToIncident ? "on" : "off"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.trust?.alertCount ?? 0} alerts • {item.trust?.regressedCount ?? 0} regressed
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Environment pressure</p>
                      <p className="mt-2 text-sm text-slate-200">
                        {item.ops?.workspaceCount ?? 0} workspaces • {item.ops?.overrideCount ?? 0} overrides • {item.ops?.unhealthyCount ?? 0} unhealthy
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.ops?.pendingApprovals ?? 0} pending approvals • {item.ops?.activeTrustSignals ?? 0} trust signals • {item.ops?.playbookRollouts ?? 0} rollouts
                      </p>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recommended move</p>
                      {item.recommended ? (
                        <>
                          <p className="mt-2 text-sm font-medium text-white">{item.recommended.title}</p>
                          <p className="mt-1 text-xs text-slate-300">{item.recommended.detail}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void applyGuidance(item.recommended!)}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                            >
                              Apply recommendation
                            </button>
                            <Link
                              href={`/operations?exceptions=overrides`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                            >
                              Inspect impact
                            </Link>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          No recommendation right now. This environment is currently running on its existing defaults.
                        </p>
                      )}
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Quick edit defaults</p>
                      <div className="mt-3 space-y-3">
                        <label className="block text-xs text-slate-400">
                          Capacity limit
                          <input
                            type="number"
                            min="1"
                            value={String(platformPolicyDrafts[item.environment]?.incidentApprovalCapacityLimit ?? item.policy?.incidentApprovalCapacityLimit ?? 1)}
                            onChange={(event) =>
                              setPlatformPolicyDrafts((current) => ({
                                ...current,
                                [item.environment]: {
                                  ...(current[item.environment] || {
                                    incidentApprovalCapacityLimit: item.policy?.incidentApprovalCapacityLimit || 1,
                                    requireApprovalForResolved: Boolean(item.policy?.requireApprovalForResolved),
                                    trustDropAction: item.policy?.trustDropAction || "notify",
                                    promoteTrustDropToIncident: Boolean(item.policy?.promoteTrustDropToIncident),
                                  }),
                                  incidentApprovalCapacityLimit: Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1),
                                },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                          />
                        </label>
                        <label className="block text-xs text-slate-400">
                          Trust drop action
                          <select
                            value={platformPolicyDrafts[item.environment]?.trustDropAction ?? item.policy?.trustDropAction ?? "notify"}
                            onChange={(event) =>
                              setPlatformPolicyDrafts((current) => ({
                                ...current,
                                [item.environment]: {
                                  ...(current[item.environment] || {
                                    incidentApprovalCapacityLimit: item.policy?.incidentApprovalCapacityLimit || 1,
                                    requireApprovalForResolved: Boolean(item.policy?.requireApprovalForResolved),
                                    trustDropAction: item.policy?.trustDropAction || "notify",
                                    promoteTrustDropToIncident: Boolean(item.policy?.promoteTrustDropToIncident),
                                  }),
                                  trustDropAction: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                          >
                            <option value="notify">notify</option>
                            <option value="digest">digest</option>
                            <option value="followup">followup</option>
                          </select>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPlatformPolicyDrafts((current) => ({
                                ...current,
                                [item.environment]: {
                                  ...(current[item.environment] || {
                                    incidentApprovalCapacityLimit: item.policy?.incidentApprovalCapacityLimit || 1,
                                    requireApprovalForResolved: Boolean(item.policy?.requireApprovalForResolved),
                                    trustDropAction: item.policy?.trustDropAction || "notify",
                                    promoteTrustDropToIncident: Boolean(item.policy?.promoteTrustDropToIncident),
                                  }),
                                  requireApprovalForResolved: !(current[item.environment]?.requireApprovalForResolved ?? item.policy?.requireApprovalForResolved),
                                },
                              }))
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              (platformPolicyDrafts[item.environment]?.requireApprovalForResolved ?? item.policy?.requireApprovalForResolved)
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            Resolve approval {(platformPolicyDrafts[item.environment]?.requireApprovalForResolved ?? item.policy?.requireApprovalForResolved) ? "on" : "off"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPlatformPolicyDrafts((current) => ({
                                ...current,
                                [item.environment]: {
                                  ...(current[item.environment] || {
                                    incidentApprovalCapacityLimit: item.policy?.incidentApprovalCapacityLimit || 1,
                                    requireApprovalForResolved: Boolean(item.policy?.requireApprovalForResolved),
                                    trustDropAction: item.policy?.trustDropAction || "notify",
                                    promoteTrustDropToIncident: Boolean(item.policy?.promoteTrustDropToIncident),
                                  }),
                                  promoteTrustDropToIncident: !(current[item.environment]?.promoteTrustDropToIncident ?? item.policy?.promoteTrustDropToIncident),
                                },
                              }))
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              (platformPolicyDrafts[item.environment]?.promoteTrustDropToIncident ?? item.policy?.promoteTrustDropToIncident)
                                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            Trust incident {(platformPolicyDrafts[item.environment]?.promoteTrustDropToIncident ?? item.policy?.promoteTrustDropToIncident) ? "on" : "off"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => void savePlatformDefaults(item.environment as "development" | "staging" | "production")}
                          className="w-full rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"
                        >
                          Save {item.environment} defaults
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform playbook studio</p>
                  <p className="mt-1 text-sm text-slate-300">Create, load, apply, and retire platform policy bundles directly from the control center.</p>
                </div>
                <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Operations playbooks
                </Link>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr,1fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-sm font-semibold text-white">Save from current defaults</p>
                  <div className="mt-4 space-y-4">
                    {(["development", "staging", "production"] as const).map((environment) => (
                      <div key={`playbook-draft-${environment}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium capitalize text-white">{environment}</p>
                          <span className="text-xs text-slate-400">
                            cap {platformPolicyDrafts[environment]?.incidentApprovalCapacityLimit ?? "-"} • {platformPolicyDrafts[environment]?.trustDropAction ?? "-"}
                          </span>
                        </div>
                        <input
                          value={playbookNameDrafts[environment] ?? ""}
                          onChange={(event) =>
                            setPlaybookNameDrafts((current) => ({ ...current, [environment]: event.target.value }))
                          }
                          placeholder={`Save ${environment} defaults as playbook`}
                          className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void savePlaybookFromDraft(environment)}
                          className="mt-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
                        >
                          Save {environment} playbook
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Saved playbooks</p>
                      <span className="text-xs text-slate-400">{governance?.workspacePolicyPlaybooks?.length ?? 0} saved</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(governance?.workspacePolicyPlaybooks || []).length ? (
                        (governance?.workspacePolicyPlaybooks || []).map((playbook) => (
                          <div key={playbook.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">{playbook.name}</p>
                              <span className="text-xs uppercase text-slate-400">{playbook.environment}</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                              cap {playbook.incidentApprovalCapacityLimit} • {playbook.trustDropAction} • resolve approval {playbook.requireApprovalForResolved ? "on" : "off"}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => loadPlaybookIntoDrafts(playbook)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                              >
                                Load into defaults
                              </button>
                              <button
                                type="button"
                                onClick={() => void applySavedPlaybook(playbook.id, playbook.name, playbook.environment)}
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                              >
                                Apply to unhealthy
                              </button>
                              <button
                                type="button"
                                onClick={() => void deletePlaybook(playbook.id, playbook.name)}
                                className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                          No saved playbooks yet. Save one from the current platform defaults to reuse it from the control center.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Built-in presets</p>
                      <span className="text-xs text-slate-400">{governance?.defaultPolicyPlaybookPresets?.length ?? 0} presets</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(governance?.defaultPolicyPlaybookPresets || []).map((preset) => (
                        <div key={preset.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{preset.name}</p>
                            <span className="text-xs uppercase text-slate-400">{preset.environment}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{preset.description || "Built-in platform preset."}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => loadPlaybookIntoDrafts(preset)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                            >
                              Load into defaults
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void runAction(
                                  "collaboration:automation-bulk-apply-policy-override",
                                  {
                                    environment: preset.environment,
                                    statuses: ["error", "stalled"],
                                    overrideEnvironment: preset.environment,
                                    incidentApprovalCapacityLimit: preset.incidentApprovalCapacityLimit,
                                    trustDropAction: preset.trustDropAction,
                                    requireApprovalForResolved: preset.requireApprovalForResolved,
                                    promoteTrustDropToIncident: preset.promoteTrustDropToIncident,
                                  },
                                  `Applied preset ${preset.name} across unhealthy ${preset.environment} workspaces.`
                                )
                              }
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                            >
                              Apply to unhealthy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Workspace override manager</p>
                  <p className="mt-1 text-sm text-slate-300">Review and change workspace-specific exception policy from the control center without jumping back to Settings.</p>
                </div>
                <Link href="/operations?exceptions=overrides" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Exceptions in ops
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {(Array.isArray(workspaceHealth) ? workspaceHealth : [])
                  .filter((item) => item.hasPolicyOverride)
                  .slice(0, 6)
                  .map((workspace) => {
                    const draft = workspacePolicyDrafts[workspace.workspaceId] || {};
                    return (
                      <div key={`platform-workspace-override-${workspace.workspaceId}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{workspace.workspaceName}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {workspace.incidentPolicy.environment} • {workspace.memberCount} members • {workspace.status}
                            </p>
                            <p className="mt-1 text-xs text-amber-100">
                              {workspace.policyOverrideSummary || "Workspace-specific policy active"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveWorkspacePolicyOverride(workspace.workspaceId)}
                              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
                            >
                              Save override
                            </button>
                            <button
                              type="button"
                              onClick={() => void resetWorkspacePolicyOverride(workspace.workspaceId)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 lg:grid-cols-4">
                          <label className="block text-xs text-slate-400">
                            Policy environment
                            <select
                              value={draft.environment || ""}
                              onChange={(event) =>
                                updateWorkspacePolicyDraft(workspace.workspaceId, {
                                  environment: event.target.value
                                    ? (event.target.value as "development" | "staging" | "production")
                                    : undefined,
                                })
                              }
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            >
                              <option value="">inherit</option>
                              <option value="development">development</option>
                              <option value="staging">staging</option>
                              <option value="production">production</option>
                            </select>
                          </label>
                          <label className="block text-xs text-slate-400">
                            Capacity limit
                            <input
                              type="number"
                              min="1"
                              value={String(draft.incidentApprovalCapacityLimit ?? 1)}
                              onChange={(event) =>
                                updateWorkspacePolicyDraft(workspace.workspaceId, {
                                  incidentApprovalCapacityLimit: Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1),
                                })
                              }
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            />
                          </label>
                          <label className="block text-xs text-slate-400">
                            Reminder minutes
                            <input
                              type="number"
                              min="1"
                              value={String(draft.incidentApprovalReminderMinutes ?? 30)}
                              onChange={(event) =>
                                updateWorkspacePolicyDraft(workspace.workspaceId, {
                                  incidentApprovalReminderMinutes: Math.max(1, Number.parseInt(event.target.value || "30", 10) || 30),
                                })
                              }
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            />
                          </label>
                          <label className="block text-xs text-slate-400">
                            Trust drop action
                            <select
                              value={draft.trustDropAction || "notify"}
                              onChange={(event) => updateWorkspacePolicyDraft(workspace.workspaceId, { trustDropAction: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            >
                              <option value="notify">notify</option>
                              <option value="digest">digest</option>
                              <option value="followup">followup</option>
                            </select>
                          </label>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateWorkspacePolicyDraft(workspace.workspaceId, {
                                requireApprovalForResolved: !(draft.requireApprovalForResolved ?? false),
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              draft.requireApprovalForResolved
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            Resolve approval {draft.requireApprovalForResolved ? "on" : "off"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateWorkspacePolicyDraft(workspace.workspaceId, {
                                requireApprovalForArchived: !(draft.requireApprovalForArchived ?? false),
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              draft.requireApprovalForArchived
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            Archive approval {draft.requireApprovalForArchived ? "on" : "off"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateWorkspacePolicyDraft(workspace.workspaceId, {
                                promoteTrustDropToIncident: !(draft.promoteTrustDropToIncident ?? false),
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              draft.promoteTrustDropToIncident
                                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            Trust incident {draft.promoteTrustDropToIncident ? "on" : "off"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {!((Array.isArray(workspaceHealth) ? workspaceHealth : []).some((item) => item.hasPolicyOverride)) ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No workspace-specific overrides are active right now.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Workspace and user administration</p>
                  <p className="mt-1 text-sm text-slate-300">Core admin controls now live inside the platform control center instead of depending on Settings as the admin home.</p>
                </div>
                <Link href="/settings" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Personal preferences
                </Link>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Workspace administration</p>
                    <span className="text-xs text-slate-400">{adminWorkspaces.length} workspaces</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {adminWorkspaces.map((workspace) => (
                      <div key={`admin-workspace-${workspace.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{workspace.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{workspace.id} • {workspace.memberCount} members</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void renameAdminWorkspace(workspace.id)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                          >
                            Rename
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr,1fr,auto]">
                          <input
                            value={workspaceNameDrafts[workspace.id] ?? workspace.name}
                            onChange={(event) => setWorkspaceNameDrafts((current) => ({ ...current, [workspace.id]: event.target.value }))}
                            className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            placeholder="Workspace name"
                          />
                          <input
                            value={inviteDrafts[workspace.id] ?? ""}
                            onChange={(event) => setInviteDrafts((current) => ({ ...current, [workspace.id]: event.target.value }))}
                            className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            placeholder="Invite email (optional)"
                          />
                          <button
                            type="button"
                            onClick={() => void createAdminInvite(workspace.id)}
                            className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-xs text-sky-100"
                          >
                            Create invite
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">User administration</p>
                      <span className="text-xs text-slate-400">{adminUsers.length} users</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {adminUsers.slice(0, 10).map((account) => (
                        <div key={`admin-user-${account.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{account.name}</p>
                              <p className="mt-1 text-xs text-slate-400">{account.email}</p>
                            </div>
                            <span className="text-xs text-slate-400">{account.workspaceName}</span>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-3">
                            <select
                              value={account.role}
                              onChange={(event) => void updateAdminUserRole(account.id, event.target.value as AdminUser["role"])}
                              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            >
                              <option value="viewer">viewer</option>
                              <option value="operator">operator</option>
                              <option value="approver">approver</option>
                              <option value="admin">admin</option>
                            </select>
                            <select
                              value={account.status}
                              onChange={(event) => void updateAdminUserStatus(account.id, event.target.value as AdminUser["status"])}
                              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            >
                              <option value="active">active</option>
                              <option value="disabled">disabled</option>
                            </select>
                            <select
                              value={account.workspaceId}
                              onChange={(event) => void updateAdminUserWorkspace(account.id, event.target.value)}
                              className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none"
                            >
                              {adminWorkspaces.map((workspace) => (
                                <option key={`workspace-option-${workspace.id}`} value={workspace.id}>
                                  {workspace.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Recent invites</p>
                      <span className="text-xs text-slate-400">{adminInvites.length} invites</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {adminInvites.slice(0, 8).map((invite) => (
                        <div key={`invite-${invite.token}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{invite.workspaceName}</p>
                              <p className="mt-1 text-xs text-slate-400">{invite.email || "Open invite"} • {invite.status}</p>
                            </div>
                            {invite.status === "pending" ? (
                              <button
                                type="button"
                                onClick={() => void revokeAdminInvite(invite.token)}
                                className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                              >
                                Revoke
                              </button>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            {invite.createdByEmail} • {new Date(invite.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="Incident board"
                title="Platform incident board"
                description="Cross-workspace triage lanes with direct actions for the clusters that need intervention first."
                actions={<Link href="/operations" className={buttonVariants({ variant: "outline", size: "sm" })}>Deep incident view</Link>}
              />
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <IncidentLane
                  title="Critical clusters"
                  tone="critical"
                  description="Stalled or error workspaces that need remediation."
                  items={incidentBoard.critical}
                  empty="No critical workspaces right now."
                  onSweep={(workspaceId, workspaceName) =>
                    void runAction(
                      "collaboration:automation-run-sweep",
                      { workspaceId },
                      `Queued a sweep for ${workspaceName}.`
                    )
                  }
                  onAssignOwner={(workspaceId, workspaceName, owner) =>
                    void runAction(
                      "collaboration:automation-assign",
                      { workspaceId, owner },
                      `Assigned ${workspaceName} to ${owner || "the selected owner"}.`
                    )
                  }
                  ownerDrafts={ownerDrafts}
                  setOwnerDrafts={setOwnerDrafts}
                />
                <IncidentLane
                  title="Approval blocked"
                  tone="warning"
                  description="Incidents waiting on closeout approval or escalation handling."
                  items={incidentBoard.approvalBlocked}
                  empty="No approval-blocked incidents right now."
                  onSweep={(workspaceId, workspaceName) =>
                    void runAction(
                      "collaboration:automation-run-sweep",
                      { workspaceId },
                      `Queued a sweep for ${workspaceName}.`
                    )
                  }
                  onAssignOwner={(workspaceId, workspaceName, owner) =>
                    void runAction(
                      "collaboration:automation-assign-approver",
                      { workspaceId, approverTarget: owner },
                      `Updated the required approver for ${workspaceName}.`
                    )
                  }
                  ownerDrafts={approverDrafts}
                  setOwnerDrafts={setApproverDrafts}
                  assignmentLabel="Approver target"
                />
                <IncidentLane
                  title="Exception drift"
                  tone="active"
                  description="Workspaces running exception policy that deserve review."
                  items={incidentBoard.drifted}
                  empty="No drifted workspaces are currently active."
                  onSweep={(workspaceId, workspaceName) =>
                    void runAction(
                      "collaboration:automation-snooze",
                      { workspaceId, minutes: 60 },
                      `Snoozed ${workspaceName} for 60 minutes.`
                    )
                  }
                  onAssignOwner={(workspaceId, workspaceName, owner) =>
                    void runAction(
                      "collaboration:automation-assign-backup-approver",
                      { workspaceId, backupApproverTarget: owner },
                      `Updated the backup approver for ${workspaceName}.`
                    )
                  }
                  ownerDrafts={backupDrafts}
                  setOwnerDrafts={setBackupDrafts}
                  actionLabel="Snooze 1h"
                  assignmentLabel="Backup target"
                />
              </div>
            </SurfacePanel>

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="Deployment posture"
                title="Deployment posture"
                description="Runtime settings that determine whether auth and workspace persistence are operating in a production-ready mode."
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Environment"
                  value={String(runtimePosture?.environment || "unknown")}
                  detail="Production should run with explicit environment settings."
                />
                <MetricCard
                  label="Storage"
                  value={runtimePosture?.storageDriver === "sqlite" ? "SQLite" : "JSON"}
                  detail="Production defaults to SQLite-backed workspace documents."
                />
                <MetricCard
                  label="Cookies"
                  value={runtimePosture?.secureCookies ? "Secure" : "Relaxed"}
                  detail="Secure cookies should remain enabled outside local development."
                />
                <MetricCard
                  label="Secret"
                  value={runtimePosture?.authSecretConfigured ? "Configured" : "Missing"}
                  detail="Production now fails closed if the auth secret is missing."
                />
                <MetricCard
                  label="Job mode"
                  value={runtimePosture?.jobs?.executionMode === "external" ? "External worker" : "In-process"}
                  detail={`Worker poll ${runtimePosture?.jobs?.workerPollIntervalMs ?? 0}ms • queue ${runtimePosture?.jobs?.maxPendingJobs ?? 0}/${runtimePosture?.jobs?.maxRunningJobs ?? 0}`}
                />
                <MetricCard
                  label="Runtime RSS"
                  value={`${runtimePosture?.process?.memory?.rssMb ?? 0}MB`}
                  detail={`Heap ${runtimePosture?.process?.memory?.heapUsedMb ?? 0}/${runtimePosture?.process?.memory?.heapTotalMb ?? 0}MB • uptime ${runtimePosture?.process?.uptimeSeconds ?? 0}s`}
                />
              </div>
              {runtimePosture?.jobs?.externalWorkerRecommended ? (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                  This runtime is still using in-process jobs. For sustained load, run <code className="rounded bg-slate-950/60 px-1 py-0.5 text-xs">npm run worker:jobs</code> and set <code className="rounded bg-slate-950/60 px-1 py-0.5 text-xs">JOB_QUEUE_EXECUTION_MODE=external</code>.
                </div>
              ) : null}
              {runtimePosture?.warnings?.length ? (
                <div className="mt-4 space-y-2">
                  {runtimePosture.warnings.map((warning) => (
                    <div
                      key={warning.code}
                      className={`rounded-2xl border p-3 text-sm ${
                        warning.severity === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-100"
                      }`}
                    >
                      {describeRuntimeWarning(warning).title ? (
                        <p className="font-semibold">{describeRuntimeWarning(warning).title}</p>
                      ) : null}
                      <p className={describeRuntimeWarning(warning).title ? "mt-1" : ""}>
                        {describeRuntimeWarning(warning).detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </SurfacePanel>

            <SurfacePanel className="mt-6" data-testid="platform-worker-recovery">
              <SurfacePanelHeader
                badge="Worker plane"
                title="Worker status and recovery"
                description="Keep the jobs plane healthy so the web app can stay responsive while background work runs elsewhere."
                actions={
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(workerStatus.tone)}`}>
                    {workerStatus.label}
                  </span>
                }
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Execution mode"
                  value={runtimePosture?.jobs?.executionMode === "external" ? "External" : "In-process"}
                  detail={`Poll ${runtimePosture?.jobs?.workerPollIntervalMs ?? 0}ms`}
                />
                <MetricCard
                  label="Active workers"
                  value={String(runtimePosture?.jobs?.health?.activeWorkers ?? 0)}
                  detail={`${runtimePosture?.jobs?.health?.pending ?? 0} pending • ${runtimePosture?.jobs?.health?.running ?? 0} running`}
                />
                <MetricCard
                  label="Stale leases"
                  value={String(runtimePosture?.jobs?.health?.staleRunning ?? 0)}
                  detail={runtimePosture?.jobs?.health?.unhealthy ? "Queue requires recovery attention" : "No stale worker leases detected"}
                />
                <MetricCard
                  label="Queue limits"
                  value={`${runtimePosture?.jobs?.maxPendingJobs ?? 0}/${runtimePosture?.jobs?.maxRunningJobs ?? 0}`}
                  detail="Pending / running capacity before saturation."
                />
              </div>
              <div className={`mt-4 rounded-[24px] border p-4 ${toneClass(workerStatus.tone)}`}>
                <p className="text-sm font-semibold">{workerStatus.label}</p>
                <p className="mt-2 text-sm">{workerStatus.detail}</p>
                <p className="mt-3 text-xs opacity-90">{workerStatus.recovery}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 font-mono text-slate-100">
                    npm run worker:jobs
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 font-mono text-slate-100">
                    JOB_QUEUE_EXECUTION_MODE=external
                  </span>
                </div>
              </div>
            </SurfacePanel>

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="AI posture"
                title="AI summary posture"
                description="Current provider policy and fallback behavior for generated workspace summaries."
                actions={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void runAdminSummaryCheck()}
                      disabled={summaryCheckRunning}
                      data-testid="platform-run-summary-check"
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {summaryCheckRunning ? "Running check…" : "Run summary check"}
                    </button>
                    {runtimePosture?.environment !== "production" ? (
                      <button
                        type="button"
                        onClick={() => void runAdminFallbackDrill()}
                        disabled={summaryCheckRunning}
                        data-testid="platform-run-fallback-drill"
                        className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {summaryCheckRunning ? "Running drill…" : "Run fallback drill"}
                      </button>
                    ) : null}
                  </div>
                }
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Provider mode"
                  value={String(runtimePosture?.aiSummary?.providerMode || "unknown")}
                  detail="Auto prefers OpenAI, mock forces deterministic summaries, and openai requires the provider."
                />
                <MetricCard
                  label="Model"
                  value={String(runtimePosture?.aiSummary?.model || "unknown")}
                  detail="Current model target for structured workspace summaries."
                />
                <MetricCard
                  label="Fallback"
                  value={runtimePosture?.aiSummary?.allowMockFallback ? "Allowed" : "Disabled"}
                  detail="Controls whether summary generation can degrade gracefully to mock output."
                />
                <MetricCard
                  label="Provider key"
                  value={runtimePosture?.aiSummary?.openAiConfigured ? "Configured" : "Missing"}
                  detail="Whether an OpenAI API key is present for summary generation."
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Timeout"
                  value={`${runtimePosture?.aiSummary?.timeoutMs ?? 0}ms`}
                  detail="Maximum time a single provider attempt gets before timing out."
                />
                <MetricCard
                  label="Attempts"
                  value={String(runtimePosture?.aiSummary?.maxAttempts ?? 0)}
                  detail="Maximum provider attempts before fallback or terminal failure."
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Daily budget"
                  value={`$${Number(aiSummaryBudget?.dailyBudgetUsd ?? runtimePosture?.aiSummary?.dailyBudgetUsd ?? 0).toFixed(2)}`}
                  detail={`Spent $${Number(aiSummaryBudget?.usageUsd ?? 0).toFixed(2)} today`}
                />
                <MetricCard
                  label="Per-run cost"
                  value={`$${Number(aiSummaryBudget?.estimatedCostPerRunUsd ?? runtimePosture?.aiSummary?.estimatedCostPerRunUsd ?? 0).toFixed(2)}`}
                  detail={`${aiSummaryBudget?.runs ?? 0} provider-backed runs recorded`}
                />
                <MetricCard
                  label="Evaluations"
                  value={runtimePosture?.aiSummary?.evaluationsEnabled ? "Enabled" : "Disabled"}
                  detail={
                    aiSummaryBudget?.budgetExceeded
                      ? "Budget guard is currently active."
                      : `Remaining $${Number(aiSummaryBudget?.remainingUsd ?? 0).toFixed(2)} today`
                  }
                />
              </div>
              {summaryCheck ? (
                <div data-testid="platform-summary-check-result" className="mt-4 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cyan-50">{summaryCheck.title}</p>
                      <p className="mt-1 text-xs text-cyan-100/80">
                        {summaryCheck.workspaceName} • {summaryCheck.provider} • {summaryCheck.model} • {summaryCheck.latencyMs}ms
                        {summaryCheck.fallbackReason ? ` • fallback ${summaryCheck.fallbackReason}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-slate-950/40 px-3 py-1 text-[11px] font-mono text-cyan-100">
                      Trace {compactTraceId(summaryCheck.traceId)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-100">{summaryCheck.summary}</p>
                  {summaryCheck.forcedFallback ? (
                    <div className="mt-3 inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[11px] text-rose-100">
                      Development fallback drill
                    </div>
                  ) : null}
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    {summaryCheck.bullets.map((bullet, index) => (
                      <li key={`${summaryCheck.traceId}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </SurfacePanel>

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="AI reliability"
                title="AI summary reliability"
                description="Recent summary generation behavior, including retries and fallback pressure."
                actions={
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(aiSummaryReliability?.status || "healthy")}`}>
                    {aiSummaryReliability?.status || "healthy"}
                  </span>
                }
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                  label="Events"
                  value={String(aiSummaryReliability?.totals.total || 0)}
                  detail="Recent AI summary diagnostics captured in memory."
                />
                <MetricCard
                  label="Successes"
                  value={String(aiSummaryReliability?.totals.successes || 0)}
                  detail="Summaries completed without needing a fallback."
                />
                <MetricCard
                  label="Fallbacks"
                  value={String(aiSummaryReliability?.totals.fallbacks || 0)}
                  detail="Times the system degraded to deterministic summary output."
                />
                <MetricCard
                  label="Retries"
                  value={String(aiSummaryReliability?.totals.retries || 0)}
                  detail="Transient provider failures that required another attempt."
                />
                <MetricCard
                  label="Errors"
                  value={String(aiSummaryReliability?.totals.errors || 0)}
                  detail="Hard AI summary failures recorded at error severity."
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Latest event"
                  value={formatTime(aiSummaryReliability?.latestAt)}
                  detail="Most recent AI summary runtime event."
                />
                <MetricCard
                  label="Latest success"
                  value={formatTime(aiSummaryReliability?.latestSuccessAt)}
                  detail="Last successful generated summary."
                />
                <MetricCard
                  label="Latest fallback"
                  value={formatTime(aiSummaryReliability?.latestFallbackAt)}
                  detail="Last time the service fell back from provider output."
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Recent success rate"
                  value={`${aiSummaryReliability?.recentSuccessRate ?? 0}%`}
                  detail={`Delta ${formatSignedDelta(aiSummaryReliability?.trend.successRateDelta ?? 0)} pts`}
                />
                <MetricCard
                  label="Recent failure rate"
                  value={`${aiSummaryReliability?.recentFailureRate ?? 0}%`}
                  detail={`Delta ${formatSignedDelta(aiSummaryReliability?.trend.failureRateDelta ?? 0)} pts`}
                />
                <MetricCard
                  label="Recent fallback rate"
                  value={`${aiSummaryReliability?.recentFallbackRate ?? 0}%`}
                  detail={`Delta ${formatSignedDelta(aiSummaryReliability?.trend.fallbackRateDelta ?? 0)} pts`}
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Trace success rate"
                  value={`${aiSummaryReliability?.traceRates.successRate ?? 0}%`}
                  detail={`${aiSummaryReliability?.traceRates.success ?? 0} of ${aiSummaryReliability?.traceRates.total ?? 0} traces`}
                />
                <MetricCard
                  label="Trace failure rate"
                  value={`${aiSummaryReliability?.traceRates.failureRate ?? 0}%`}
                  detail={`${aiSummaryReliability?.traceRates.error ?? 0} trace-linked failures`}
                />
                <MetricCard
                  label="Trace fallbacks"
                  value={String(aiSummaryReliability?.traceRates.fallback ?? 0)}
                  detail="Recent unique traces that degraded to fallback output."
                />
              </div>
              {aiSummaryBudget ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Budget and evaluation posture</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Daily spend guard and recent provider-cost samples for summary generation.
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(aiSummaryBudget.budgetExceeded ? "warning" : "healthy")}`}>
                      {aiSummaryBudget.budgetExceeded ? "Guard active" : "Within budget"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <MetricCard
                      label="Budget day"
                      value={aiSummaryBudget.day}
                      detail={`Projected $${Number(aiSummaryBudget.projectedUsageUsd).toFixed(2)} after next run`}
                    />
                    <MetricCard
                      label="Remaining"
                      value={`$${Number(aiSummaryBudget.remainingUsd).toFixed(2)}`}
                      detail={`${aiSummaryBudget.runs} provider-backed runs recorded`}
                    />
                    <MetricCard
                      label="Last update"
                      value={formatTime(aiSummaryBudget.updatedAt)}
                      detail="Updated each time a provider-backed summary run finishes."
                    />
                  </div>
                </div>
              ) : null}
              {aiSummaryEvaluations ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/50 p-4" data-testid="platform-ai-evaluations">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Evaluation quality</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Lightweight quality scoring for generated summaries so operators can see whether outputs are healthy, marginal, or failing.
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(aiSummaryEvaluations.status)}`}>
                      {aiSummaryEvaluations.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                      label="Evaluations"
                      value={String(aiSummaryEvaluations.totals.total)}
                      detail="Recent evaluation events captured after summary generation."
                    />
                    <MetricCard
                      label="Healthy"
                      value={String(aiSummaryEvaluations.totals.healthy)}
                      detail="Outputs that passed the evaluation bar cleanly."
                    />
                    <MetricCard
                      label="Warnings"
                      value={String(aiSummaryEvaluations.totals.warning)}
                      detail="Outputs that need closer operator scrutiny."
                    />
                    <MetricCard
                      label="Critical"
                      value={String(aiSummaryEvaluations.totals.critical)}
                      detail="Outputs that failed the quality bar."
                    />
                    <MetricCard
                      label="Average score"
                      value={`${aiSummaryEvaluations.averageScore}%`}
                      detail={`Latest ${aiSummaryEvaluations.latestScore ?? 0}% • ${formatTime(aiSummaryEvaluations.latestAt)}`}
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                {(aiSummaryReliability?.recent || []).length ? (
                  aiSummaryReliability?.recent.map((entry) => (
                    <EventEntry
                      key={entry.id}
                      title={entry.message}
                      subtitle={`${entry.level} • ${formatTime(entry.timestamp)}${entry.traceId ? ` • ${compactTraceId(entry.traceId)}` : ""}`}
                      badge={entry.level}
                      badgeClassName={toneClass(entry.level)}
                    >
                      {entry.traceId ? (
                        <div className="mt-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-mono text-cyan-100">
                          Trace {entry.traceId}
                        </div>
                      ) : null}
                      {entry.context ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300">
                          {JSON.stringify(entry.context, null, 2)}
                        </pre>
                      ) : null}
                    </EventEntry>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No recent AI summary events recorded.
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Operator runtime checks</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Queue a real insight or summary job from the control center to validate runtime behavior without using the terminal.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void queueOperatorCheck("insights")}
                      disabled={operatorChecksDisabled}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {queueSaturated ? "Queue saturated" : operatorCheckRunning === "insights" ? "Queueing insight check…" : "Run insight check"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void queueOperatorCheck("summary")}
                      disabled={operatorChecksDisabled}
                      data-testid="platform-run-summary-job"
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {queueSaturated ? "Queue saturated" : operatorCheckRunning === "summary" ? "Queueing summary check…" : "Run summary job"}
                    </button>
                    {runtimePosture?.environment !== "production" ? (
                      <button
                        type="button"
                        onClick={() => void queueOperatorCheck("failure")}
                        disabled={operatorChecksDisabled}
                        data-testid="platform-run-failure-drill"
                        className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {queueSaturated ? "Queue saturated" : operatorCheckRunning === "failure" ? "Queueing failure drill…" : "Run failure drill"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {operatorCheckJob ? (
                  <div data-testid="platform-operator-check-job" data-job-id={operatorCheckJob.id} className="mt-4 rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-cyan-50">{operatorCheckJob.type}</p>
                        <p className="mt-1 text-xs text-cyan-100/80">
                          {operatorCheckJob.status} • queued {formatTime(operatorCheckJob.createdAt || null)}
                          {operatorCheckJob.workerId ? ` • worker ${operatorCheckJob.workerId}` : ""}
                        </p>
                      </div>
                      {operatorCheckJob.traceId ? (
                        <span className="rounded-full border border-cyan-300/20 bg-slate-950/40 px-3 py-1 text-[11px] font-mono text-cyan-100">
                          Trace {compactTraceId(operatorCheckJob.traceId)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                        Job ID
                        <div className="mt-1 font-mono text-[11px] text-slate-100">{operatorCheckJob.id}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                        Attempts
                        <div className="mt-1 text-slate-100">
                          {operatorCheckJob.attempts ?? 0} / {operatorCheckJob.maxAttempts ?? "?"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                        Lease
                        <div className="mt-1 text-slate-100">
                          {operatorCheckJob.leaseExpiresAt ? `expires ${formatTime(operatorCheckJob.leaseExpiresAt)}` : "Not leased yet"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {operatorCheckJob.status === "queued" ? (
                        <button
                          type="button"
                          data-testid={`platform-operator-check-cancel-${operatorCheckJob.id}`}
                          onClick={() => void managePlatformJob("job:cancel", operatorCheckJob.id, `Canceled ${operatorCheckJob.id}.`)}
                          className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                        >
                          Cancel queued check
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </SurfacePanel>

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="Diagnostics"
                title="Runtime diagnostics"
                description="Recent platform-level failures, degraded health checks, and route exceptions captured for operators."
                actions={
                <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass((diagnostics?.summary.errors || 0) > 0 ? "critical" : (diagnostics?.summary.warnings || 0) > 0 ? "warning" : "healthy")}`}>
                  {diagnostics?.summary.total || 0} events
                </span>
                }
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Errors"
                  value={String(diagnostics?.summary.errors || 0)}
                  detail="Unhandled or explicitly captured route/runtime failures."
                />
                <MetricCard
                  label="Warnings"
                  value={String(diagnostics?.summary.warnings || 0)}
                  detail="Degraded health signals and lower-severity diagnostics."
                />
                <MetricCard
                  label="Scopes"
                  value={String(Object.keys(diagnostics?.summary.byScope || {}).length)}
                  detail="Distinct subsystems that have emitted diagnostics recently."
                />
                <MetricCard
                  label="Latest"
                  value={formatTime(diagnostics?.summary.latestAt)}
                  detail="Most recent recorded diagnostics event."
                />
              </div>
              <div className="mt-4 space-y-3">
                {(diagnostics?.recent || []).length ? (
                  diagnostics?.recent.map((entry) => (
                    <EventEntry
                      key={entry.id}
                      title={entry.message}
                      subtitle={`${entry.scope} • ${entry.level} • ${formatTime(entry.timestamp)}${entry.traceId ? ` • ${compactTraceId(entry.traceId)}` : ""}`}
                      badge={entry.level}
                      badgeClassName={toneClass(entry.level)}
                    >
                      {entry.traceId ? (
                        <div className="mt-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-mono text-cyan-100">
                          Trace {entry.traceId}
                        </div>
                      ) : null}
                      {entry.context ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300">
                          {JSON.stringify(entry.context, null, 2)}
                        </pre>
                      ) : null}
                    </EventEntry>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No runtime diagnostics recorded recently.
                  </div>
                )}
              </div>
            </SurfacePanel>

            {legacyCompatibility ? (
              <SurfacePanel className="mt-6">
                <SurfacePanelHeader
                  badge="Legacy boundary"
                  title="Legacy compatibility residue"
                  description="Explicit tracking for the small remaining legacy console helpers still exercised by the live runtime."
                  actions={
                    <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(legacyCompatibility.total > 0 ? "warning" : "healthy")}`}>
                      {legacyCompatibility.total} recent hits
                    </span>
                  }
                />
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Latest usage"
                    value={formatTime(legacyCompatibility.updatedAt)}
                    detail="Most recent call into the fenced legacy compatibility layer."
                  />
                  <MetricCard
                    label="Actions"
                    value={String(Object.keys(legacyCompatibility.byAction || {}).length)}
                    detail={Object.entries(legacyCompatibility.byAction || {}).map(([action, count]) => `${action} ${count}`).slice(0, 2).join(" • ") || "No recent legacy actions."}
                  />
                  <MetricCard
                    label="Surfaces"
                    value={String(Object.keys(legacyCompatibility.bySurface || {}).length)}
                    detail={Object.entries(legacyCompatibility.bySurface || {}).map(([surface, count]) => `${surface} ${count}`).slice(0, 2).join(" • ") || "No recent legacy surfaces."}
                  />
                </div>
              </SurfacePanel>
            ) : null}

            <SurfacePanel className="mt-6">
              <SurfacePanelHeader
                badge="Recent changes"
                title="Recent platform changes"
                description="Recent playbook rollouts and the admin actions shaping platform behavior."
                actions={<Link href="/operations" className={buttonVariants({ variant: "outline", size: "sm" })}>Full rollout history</Link>}
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {globalOperations.playbookRollouts.slice(0, 6).map((item) => (
                  <EventEntry
                    key={item.id}
                    title={item.playbookName}
                    subtitle={`${item.workspaceCount} workspaces • ${item.appliedByName || "System"} • ${formatTime(item.appliedAt)}`}
                    badge={item.environment}
                    badgeClassName="border-white/10 text-slate-300"
                  >
                    <p className="text-xs text-slate-500">
                      {item.workspaceCount} workspaces • {item.appliedByName || "System"} • {formatTime(item.appliedAt)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.workspaceNames.slice(0, 3).join(", ")}
                      {item.workspaceNames.length > 3 ? ` +${item.workspaceNames.length - 3} more` : ""}
                    </p>
                  </EventEntry>
                ))}
              </div>
            </SurfacePanel>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading platform control center…
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function IncidentLane({
  title,
  tone,
  description,
  items,
  empty,
  onSweep,
  onAssignOwner,
  ownerDrafts,
  setOwnerDrafts,
  actionLabel = "Run sweep",
  assignmentLabel = "Owner",
}: {
  title: string;
  tone: string;
  description: string;
  items: PlatformPayload["overview"]["collaboration"]["digestWorkspaceHealth"];
  empty: string;
  onSweep: (workspaceId: string, workspaceName: string) => void;
  onAssignOwner: (workspaceId: string, workspaceName: string, owner: string) => void;
  ownerDrafts: Record<string, string>;
  setOwnerDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  actionLabel?: string;
  assignmentLabel?: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(tone)}`}>{items.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <SignalEntry
              key={`${title}-${item.workspaceId}`}
              className="bg-white/5 transition hover:bg-white/7"
              title={item.workspaceName}
              meta={`${item.incidentPolicy.environment} • ${item.incidentStatus} • ${item.overdueIntervals} overdue intervals`}
              badge={item.status}
              badgeClassName={toneClass(item.status)}
              body={
                <>
                  {item.hasPolicyOverride ? (
                    <p className="text-xs text-amber-100">{item.policyOverrideSummary || "Workspace-specific policy active"}</p>
                  ) : null}
                  {item.incidentApproval?.state === "pending" ? (
                    <p className="mt-2 text-xs text-slate-300">
                      Pending {item.incidentApproval.requestedStatus} approval
                      {item.incidentApproval.approverTarget ? ` • ${item.incidentApproval.approverTarget}` : ""}
                      {item.incidentApprovalSla?.finalEscalated ? " • final escalated" : item.incidentApprovalSla?.escalated ? " • escalated" : ""}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">
                    Due users {item.dueUsers}
                    {item.snoozedUntil ? ` • snoozed until ${formatTime(item.snoozedUntil)}` : ""}
                  </p>
                </>
              }
            >
              <div className="mt-3 space-y-2">
                <input
                  value={ownerDrafts[item.workspaceId] ?? ""}
                  onChange={(event) =>
                    setOwnerDrafts((current) => ({ ...current, [item.workspaceId]: event.target.value }))
                  }
                  placeholder={assignmentLabel}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onAssignOwner(item.workspaceId, item.workspaceName, ownerDrafts[item.workspaceId] ?? "")}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Save {assignmentLabel.toLowerCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSweep(item.workspaceId, item.workspaceName)}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                  >
                    {actionLabel}
                  </button>
                  <Link
                    href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}${item.hasPolicyOverride ? "&exceptions=overrides" : ""}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Open workspace
                  </Link>
                </div>
              </div>
            </SignalEntry>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">{empty}</div>
        )}
      </div>
    </div>
  );
}
