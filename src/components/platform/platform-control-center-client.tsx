"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/src/components/app/app-provider";
import { SectionCard } from "@/src/components/shared/section-card";
import { AccessHistoryClient } from "@/src/components/access/access-history-client";

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
      context?: Record<string, unknown>;
    }>;
  };
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
      metrics: {
        avgQueueWaitMs?: number | null;
        avgRunTimeMs?: number | null;
        completionRate?: number | null;
        retryPressure?: number | null;
        scheduledRetryCount?: number | null;
      };
      items: Array<{
        id: string;
        type: string;
        status: string;
        attempts?: number;
        maxAttempts?: number;
        nextRetryAt?: string | null;
        error?: string | null;
        createdAt?: string | null;
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
  const response = await fetch("/api/console", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load platform control center.");
  }
  return (await response.json()) as PlatformPayload;
}

async function fetchAdminAccessPayload() {
  const response = await fetch("/api/admin/access", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load admin access data.");
  }
  return (await response.json()) as AdminAccessPayload;
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

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

export function PlatformControlCenterClient() {
  const { user } = useAppSession();
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
    setWorkspaceNameDrafts(Object.fromEntries((adminAccess.workspaces || []).map((workspace) => [workspace.id, workspace.name])));
    setError(null);
  }

  async function runAction(action: string, payloadValue: Record<string, unknown>, success: string) {
    const response = await fetch("/api/console", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: payloadValue }),
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!result.ok) {
      setError(result.error || "Action failed.");
      return;
    }
    setMessage(success);
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

  const collaboration = payload?.overview.collaboration;
  const activity = payload?.overview.activity;
  const telemetry = payload?.overview.telemetry;
  const jobs = payload?.overview.jobs;
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
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={exportPlatformReport}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200"
          >
            Export platform report
          </button>
        </div>
        {message ? <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}

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
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Environment command deck</p>
                    <p className="mt-1 text-sm text-slate-300">Act on unhealthy clusters by environment without dropping into individual workspace views.</p>
                  </div>
                  <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                    Open full operations
                  </Link>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {globalOperations.environments.map((item) => (
                    <div key={item.environment} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
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
                        <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{job.type}</p>
                            <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(job.status)}`}>{job.status}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {job.id} • attempts {job.attempts ?? 0}/{job.maxAttempts ?? 0}
                          </p>
                          {job.nextRetryAt ? <p className="mt-1 text-xs text-slate-400">Next retry {formatTime(job.nextRetryAt)}</p> : null}
                          {job.error ? <p className="mt-1 text-xs text-rose-200">{job.error}</p> : null}
                        </div>
                      ))}
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

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Platform incident board</p>
                  <p className="mt-1 text-sm text-slate-300">Cross-workspace triage lanes with direct actions for the clusters that need intervention first.</p>
                </div>
                <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Deep incident view
                </Link>
              </div>
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
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Deployment posture</p>
                  <p className="mt-1 text-sm text-slate-300">Runtime settings that determine whether auth and workspace persistence are operating in a production-ready mode.</p>
                </div>
              </div>
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
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Runtime diagnostics</p>
                  <p className="mt-1 text-sm text-slate-300">Recent platform-level failures, degraded health checks, and route exceptions captured for operators.</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass((diagnostics?.summary.errors || 0) > 0 ? "critical" : (diagnostics?.summary.warnings || 0) > 0 ? "warning" : "healthy")}`}>
                  {diagnostics?.summary.total || 0} events
                </span>
              </div>
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
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{entry.message}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {entry.scope} • {entry.level} • {formatTime(entry.timestamp)}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(entry.level)}`}>{entry.level}</span>
                      </div>
                      {entry.context ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300">
                          {JSON.stringify(entry.context, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No runtime diagnostics recorded recently.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Recent platform changes</p>
                  <p className="mt-1 text-sm text-slate-300">Recent playbook rollouts and the admin actions shaping platform behavior.</p>
                </div>
                <Link href="/operations" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
                  Full rollout history
                </Link>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {globalOperations.playbookRollouts.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{item.playbookName}</p>
                      <span className="text-xs uppercase text-slate-400">{item.environment}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.workspaceCount} workspaces • {item.appliedByName || "System"} • {formatTime(item.appliedAt)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.workspaceNames.slice(0, 3).join(", ")}
                      {item.workspaceNames.length > 3 ? ` +${item.workspaceNames.length - 3} more` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
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
            <div key={`${title}-${item.workspaceId}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.workspaceName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.incidentPolicy.environment} • {item.incidentStatus} • {item.overdueIntervals} overdue intervals
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.status)}`}>{item.status}</span>
              </div>
              {item.hasPolicyOverride ? (
                <p className="mt-2 text-xs text-amber-100">{item.policyOverrideSummary || "Workspace-specific policy active"}</p>
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
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
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
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                  >
                    Open workspace
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">{empty}</div>
        )}
      </div>
    </div>
  );
}
