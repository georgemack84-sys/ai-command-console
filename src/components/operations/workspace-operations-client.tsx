"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppSession } from "@/src/components/app/app-provider";
import { SectionCard } from "@/src/components/shared/section-card";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { MetricTile } from "@/src/components/ui/metric-tile";
import { SignalEntry } from "@/src/components/ui/signal-entry";
import { SurfacePanel, SurfacePanelHeader } from "@/src/components/ui/surface-panel";

type WorkspaceHealth = {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  digestEnabledUsers: number;
  dueUsers: number;
  lastSweepRunAt: string | null;
  lastSweepQueuedAt: string | null;
  lastGeneratedCount: number;
  lastSweepError: string | null;
  escalationOwner: string | null;
  incidentApproverTarget: string | null;
  backupApproverTarget: string | null;
  snoozedUntil: string | null;
  resolutionTaskId: string | null;
  resolutionCompletedAt: string | null;
  resolutionDescription: string | null;
  resolutionOwnerName: string | null;
  incidentSummary: string | null;
  incidentSummaryUpdatedAt: string | null;
  incidentHandoffDraft: string | null;
  incidentHandoffDraftUpdatedAt: string | null;
  incidentArchiveRecommendation: string | null;
  incidentStatus: string;
  incidentStatusUpdatedAt: string | null;
  hasPolicyOverride?: boolean;
  policyOverrideSummary?: string | null;
  incidentPolicy: {
    environment: string;
    requireChecklistForResolved: boolean;
    requiredChecklistForResolved: string[];
    requireSummaryShareBeforeArchived: boolean;
    requireApprovalForResolved: boolean;
    requireApprovalForArchived: boolean;
    incidentApprovalReminderMinutes: number;
    incidentApprovalEscalationMinutes: number;
    incidentApprovalEscalationTarget: string;
    incidentApprovalFinalEscalationMinutes: number;
    incidentApprovalFinalEscalationTarget: string;
    incidentApprovalCapacityLimit: number;
  };
  incidentReadiness: {
    canResolve: boolean;
    canArchive: boolean;
    resolveBlockers: string[];
    archiveBlockers: string[];
  };
  incidentApproval: {
    state: string;
    id: string;
    status: string;
    requestedStatus: string;
    archiveRationale?: string | null;
    approverTarget: string | null;
    routingMode?: string | null;
    routingReason?: string | null;
    routedFromTarget?: string | null;
    requestedById: string | null;
    requestedByName: string | null;
    createdAt: string | null;
    resolvedAt: string | null;
    approvedById: string | null;
    approvedByName: string | null;
    rejectedById: string | null;
    rejectedByName: string | null;
    rejectionNote: string | null;
    label: string;
  } | null;
  incidentApprovalHistory: Array<{
    id: string;
    status: string;
    requestedStatus: string;
    archiveRationale?: string | null;
    approverTarget: string | null;
    routingMode?: string | null;
    routingReason?: string | null;
    routedFromTarget?: string | null;
    requestedById: string | null;
    requestedByName: string | null;
    createdAt: string | null;
    resolvedAt: string | null;
    approvedById: string | null;
    approvedByName: string | null;
    rejectedById: string | null;
    rejectedByName: string | null;
    rejectionNote: string | null;
    label: string;
  }>;
  incidentChecklist: Array<{
    id: string;
    label: string;
    completed: boolean;
    completedAt: string | null;
    completedByName: string | null;
  }>;
  events: Array<{
    id: string;
    type: string;
    message: string;
    actorId?: string | null;
    actorName?: string | null;
    note?: string | null;
    timestamp: string;
  }>;
  overdueIntervals: number;
  status: string;
};

type DigestEscalation = {
  id: string;
  tone: string;
  title: string;
  detail: string;
  command: string;
  workspaceId?: string;
  workspaceName?: string;
  owner?: string | null;
  snoozedUntil?: string | null;
};

type ActionSummary = {
  title: string;
  detail: string;
  workspaceName?: string | null;
  actionLabel: string;
  nextStep?: string | null;
};

type DemoStep = {
  id: number;
  title: string;
  detail: string;
  workspaceId: string | null;
  actionLabel: string;
  recommendedAction?: {
    action: string;
    payload: Record<string, unknown>;
    success: string;
    label: string;
  };
};

type ConsolePayload = {
  overview: {
    collaboration: {
      digestWorkspaceHealth: WorkspaceHealth[];
      digestEscalations: DigestEscalation[];
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
      approvalThroughput: {
        totals: {
          totalApprovals: number;
          manualReroutes: number;
          autoReroutes: number;
          resolvedApprovals: number;
        };
        targets: Array<{
          target: string;
          total: number;
          approved: number;
          rejected: number;
          pending: number;
          rerouted: number;
          autoRerouted: number;
          averageApprovalMs: number | null;
        }>;
        workspaces: Array<{
          workspaceId: string;
          workspaceName: string;
          total: number;
          rerouted: number;
          autoRerouted: number;
          averageApprovalMs: number | null;
        }>;
      };
      approvalPolicyRecommendations: Array<{
        id: string;
        title: string;
        detail: string;
        kind: string;
        confidence?: {
          score: number;
          label: string;
        };
        target?: string;
        workspaceId?: string;
        action?: {
          type: string;
          payload?: Record<string, unknown>;
        };
        promoteAction?: {
          type: string;
          payload?: Record<string, unknown>;
        };
      }>;
      appliedApprovalPolicies: Array<{
        id: string;
        title: string;
        recommendationKind: string;
        environment: string;
        target?: string | null;
        workspaceId?: string | null;
        appliedAt: string;
        appliedByName: string;
        appliedAutomatically?: boolean;
        effectSummary: string;
        beforeSnapshot?: {
          capacityLimit?: number | null;
          backupApproverTarget?: string | null;
        };
        afterSnapshot?: {
          capacityLimit?: number | null;
          backupApproverTarget?: string | null;
        };
        rolledBackAt?: string | null;
        impact?: {
          status: string;
          summary: string;
          comparison?: {
            overdueDelta?: number;
            pendingDelta?: number;
            averageApprovalMinutesBefore?: number | null;
            averageApprovalMinutesAfter?: number | null;
            autoReroutesBefore?: number;
            autoReroutesAfter?: number;
          };
        };
      }>;
      approvalRecommendationObservations: Array<{
        recommendationId: string;
        title: string;
        environment: string;
        eligibleSinceAt?: string | null;
        cooldownUntil?: string | null;
        lastObservedAt: string;
        lastConfidence: number;
        status: string;
      }>;
      approvalTrustDashboard: {
        score: number;
        regressedCount: number;
        improvedCount: number;
        rolledBackCount: number;
        observingCount: number;
        cooldownCount: number;
        alerts: Array<{
          id: string;
          tone: string;
          title: string;
          detail: string;
          acknowledged?: boolean;
          acknowledgedAt?: string | null;
          acknowledgedByName?: string | null;
          actions?: Array<{
            label: string;
            action: string;
            payload?: Record<string, unknown>;
          }>;
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
        command: string;
        environment?: string | null;
      }>;
      approvalRecommendationFamilies: Array<{
        family: string;
        label: string;
        recommendationKind: string;
        target?: string | null;
        workspaceId?: string | null;
        recommendationCount: number;
        promotedCount: number;
        rolledBackCount: number;
        observingCount: number;
        trustSignalCount: number;
        lastRecommendationAt?: string | null;
        lastPromotionAt?: string | null;
        lastSignalTitle?: string | null;
      }>;
      completedTrustIncidents: Array<{
        workspaceId: string;
        workspaceName: string;
        environment: string;
        archivedAt: string | null;
        summary: string | null;
      }>;
      completedTrustEnvironments: Array<{
        environment: string;
        archivedCount: number;
        latestArchivedAt: string | null;
        recentWorkspaces: string[];
      }>;
      environmentTrustRecaps: Array<{
        environment: string;
        score: number;
        activeSignals: number;
        completedArchived: number;
        latestArchivedAt: string | null;
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
          playbookId: string;
          playbookName: string;
          environment: string;
          workspaceCount: number;
          workspaceIds: string[];
          workspaceNames: string[];
          appliedAt: string;
          appliedById?: string | null;
          appliedByName?: string | null;
        }>;
      };
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
      automationFollowups: Array<{
        id: string;
        agentName: string;
        description: string;
        status: string;
        priority?: number;
        ownerId?: string | null;
        ownerName?: string | null;
        workspaceId?: string | null;
        linkedInboxItemId?: string | null;
        createdAt: string;
        completedAt?: string | null;
      }>;
      governance?: {
        demoScenario?: {
          id: string;
          name: string;
          description: string;
        };
        workspacePolicyPlaybooks?: Array<{
          id: string;
          name: string;
          environment: string;
          incidentApprovalCapacityLimit: number;
          trustDropAction: string;
          requireApprovalForResolved: boolean;
          promoteTrustDropToIncident: boolean;
        }>;
        workspacePolicyPlaybookRollouts?: Array<{
          id: string;
          playbookId: string;
          playbookName: string;
          environment: string;
          workspaceCount: number;
          workspaceIds: string[];
          workspaceNames: string[];
          appliedAt: string;
          appliedByName?: string | null;
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

async function fetchOperationsPayload() {
  const response = await fetch("/api/console", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load workspace operations.");
  }
  return (await response.json()) as ConsolePayload;
}

function formatTime(value?: string | null) {
  if (!value) {
    return "Waiting";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function formatSignedDelta(value?: number | null) {
  const normalized = Number(value || 0);
  return `${normalized >= 0 ? "+" : ""}${normalized}`;
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

function checklistLabel(workspace: WorkspaceHealth, itemId: string) {
  return workspace.incidentChecklist.find((item) => item.id === itemId)?.label || itemId;
}

export function WorkspaceOperationsClient() {
  const { user } = useAppSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedWorkspace = searchParams.get("workspace");
  const demoMode = searchParams.get("demo") === "guided";
  const requestedDemoStep = Number.parseInt(searchParams.get("step") || "1", 10);
  const exceptionFilter = searchParams.get("exceptions") === "overrides" ? "overrides" : "all";
  const [workspaces, setWorkspaces] = useState<WorkspaceHealth[]>([]);
  const [escalations, setEscalations] = useState<DigestEscalation[]>([]);
  const [approvalPressure, setApprovalPressure] = useState<ConsolePayload["overview"]["collaboration"]["incidentApprovalPressure"]>([]);
  const [approvalThroughput, setApprovalThroughput] = useState<ConsolePayload["overview"]["collaboration"]["approvalThroughput"]>({
    totals: { totalApprovals: 0, manualReroutes: 0, autoReroutes: 0, resolvedApprovals: 0 },
    targets: [],
    workspaces: [],
  });
  const [approvalPolicyRecommendations, setApprovalPolicyRecommendations] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalPolicyRecommendations"]
  >([]);
  const [appliedApprovalPolicies, setAppliedApprovalPolicies] = useState<
    ConsolePayload["overview"]["collaboration"]["appliedApprovalPolicies"]
  >([]);
  const [approvalRecommendationObservations, setApprovalRecommendationObservations] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalRecommendationObservations"]
  >([]);
  const [approvalTrustDashboard, setApprovalTrustDashboard] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalTrustDashboard"]
  >({
    score: 0,
    regressedCount: 0,
    improvedCount: 0,
    rolledBackCount: 0,
    observingCount: 0,
    cooldownCount: 0,
    alerts: [],
  });
  const [approvalTrustEnvironments, setApprovalTrustEnvironments] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalTrustEnvironments"]
  >([]);
  const [approvalTrustTrends, setApprovalTrustTrends] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalTrustTrends"]
  >([]);
  const [approvalTrustSignals, setApprovalTrustSignals] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalTrustSignals"]
  >([]);
  const [approvalRecommendationFamilies, setApprovalRecommendationFamilies] = useState<
    ConsolePayload["overview"]["collaboration"]["approvalRecommendationFamilies"]
  >([]);
  const [completedTrustIncidents, setCompletedTrustIncidents] = useState<
    ConsolePayload["overview"]["collaboration"]["completedTrustIncidents"]
  >([]);
  const [completedTrustEnvironments, setCompletedTrustEnvironments] = useState<
    ConsolePayload["overview"]["collaboration"]["completedTrustEnvironments"]
  >([]);
  const [environmentTrustRecaps, setEnvironmentTrustRecaps] = useState<
    ConsolePayload["overview"]["collaboration"]["environmentTrustRecaps"]
  >([]);
  const [globalOperations, setGlobalOperations] = useState<
    ConsolePayload["overview"]["collaboration"]["globalOperations"]
  >({
    totals: {
      workspaceCount: 0,
      overriddenWorkspaces: 0,
      unhealthyWorkspaces: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      activeDigestEscalations: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
    },
    environments: [],
    hotspots: [],
    pressureTargets: [],
    playbookRollouts: [],
  });
  const [followups, setFollowups] = useState<ConsolePayload["overview"]["collaboration"]["automationFollowups"]>([]);
  const [policyPlaybookAdoption, setPolicyPlaybookAdoption] = useState<
    ConsolePayload["overview"]["collaboration"]["policyPlaybookAdoption"]
  >({
    totalTracked: 0,
    presetCount: 0,
    savedCount: 0,
    items: [],
    recommendations: [],
  });
  const [policyPlaybooks, setPolicyPlaybooks] = useState<
    NonNullable<ConsolePayload["overview"]["collaboration"]["governance"]>["workspacePolicyPlaybooks"]
  >([]);
  const [policyPlaybookPresets, setPolicyPlaybookPresets] = useState<
    NonNullable<ConsolePayload["overview"]["collaboration"]["governance"]>["defaultPolicyPlaybookPresets"]
  >([]);
  const [demoScenario, setDemoScenario] = useState<
    NonNullable<ConsolePayload["overview"]["collaboration"]["governance"]>["demoScenario"] | null
  >(null);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [bulkOwnerDrafts, setBulkOwnerDrafts] = useState<Record<string, string>>({});
  const [bulkApproverDrafts, setBulkApproverDrafts] = useState<Record<string, string>>({});
  const [bulkBackupApproverDrafts, setBulkBackupApproverDrafts] = useState<Record<string, string>>({});
  const [bulkFollowupDrafts, setBulkFollowupDrafts] = useState<Record<string, string>>({});
  const [bulkPolicyCapacityDrafts, setBulkPolicyCapacityDrafts] = useState<Record<string, string>>({});
  const [bulkPolicyTrustActionDrafts, setBulkPolicyTrustActionDrafts] = useState<Record<string, string>>({});
  const [bulkPolicyRequireResolvedDrafts, setBulkPolicyRequireResolvedDrafts] = useState<Record<string, boolean>>({});
  const [bulkPolicyPromoteTrustDrafts, setBulkPolicyPromoteTrustDrafts] = useState<Record<string, boolean>>({});
  const [bulkPolicyPlaybookNameDrafts, setBulkPolicyPlaybookNameDrafts] = useState<Record<string, string>>({});
  const [approverDrafts, setApproverDrafts] = useState<Record<string, string>>({});
  const [backupApproverDrafts, setBackupApproverDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [shareDrafts, setShareDrafts] = useState<Record<string, string>>({});
  const [approvalNoteDrafts, setApprovalNoteDrafts] = useState<Record<string, string>>({});
  const [approvalTargetDrafts, setApprovalTargetDrafts] = useState<Record<string, string>>({});
  const [bulkApprovalTargetDrafts, setBulkApprovalTargetDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSummary, setActionSummary] = useState<ActionSummary | null>(null);

  async function load() {
    const payload = await fetchOperationsPayload();
    setWorkspaces(payload.overview.collaboration.digestWorkspaceHealth || []);
    setEscalations(payload.overview.collaboration.digestEscalations || []);
    setApprovalPressure(payload.overview.collaboration.incidentApprovalPressure || []);
    setApprovalThroughput(payload.overview.collaboration.approvalThroughput || {
      totals: { totalApprovals: 0, manualReroutes: 0, autoReroutes: 0, resolvedApprovals: 0 },
      targets: [],
      workspaces: [],
    });
    setApprovalPolicyRecommendations(payload.overview.collaboration.approvalPolicyRecommendations || []);
    setAppliedApprovalPolicies(payload.overview.collaboration.appliedApprovalPolicies || []);
    setApprovalRecommendationObservations(payload.overview.collaboration.approvalRecommendationObservations || []);
    setApprovalTrustDashboard(payload.overview.collaboration.approvalTrustDashboard || {
      score: 0, regressedCount: 0, improvedCount: 0, rolledBackCount: 0, observingCount: 0, cooldownCount: 0, alerts: [],
    });
    setApprovalTrustEnvironments(payload.overview.collaboration.approvalTrustEnvironments || []);
    setApprovalTrustTrends(payload.overview.collaboration.approvalTrustTrends || []);
    setApprovalTrustSignals(payload.overview.collaboration.approvalTrustSignals || []);
    setApprovalRecommendationFamilies(payload.overview.collaboration.approvalRecommendationFamilies || []);
    setCompletedTrustIncidents(payload.overview.collaboration.completedTrustIncidents || []);
    setCompletedTrustEnvironments(payload.overview.collaboration.completedTrustEnvironments || []);
    setEnvironmentTrustRecaps(payload.overview.collaboration.environmentTrustRecaps || []);
      setGlobalOperations(payload.overview.collaboration.globalOperations || {
        totals: {
          workspaceCount: 0,
          overriddenWorkspaces: 0,
          unhealthyWorkspaces: 0,
          openIncidents: 0,
          pendingApprovals: 0,
        finalEscalations: 0,
        activeTrustSignals: 0,
        activeDigestEscalations: 0,
        completedTrustIncidents: 0,
        playbookRollouts: 0,
      },
      environments: [],
      hotspots: [],
      pressureTargets: [],
      playbookRollouts: [],
    });
    setFollowups(payload.overview.collaboration.automationFollowups || []);
    setPolicyPlaybookAdoption(payload.overview.collaboration.policyPlaybookAdoption || {
      totalTracked: 0,
      presetCount: 0,
      savedCount: 0,
      items: [],
      recommendations: [],
    });
    setPolicyPlaybooks(payload.overview.collaboration.governance?.workspacePolicyPlaybooks || []);
    setPolicyPlaybookPresets(payload.overview.collaboration.governance?.defaultPolicyPlaybookPresets || []);
    setDemoScenario(payload.overview.collaboration.governance?.demoScenario || null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const payload = await fetchOperationsPayload();
        if (cancelled) {
          return;
        }
        setWorkspaces(payload.overview.collaboration.digestWorkspaceHealth || []);
        setEscalations(payload.overview.collaboration.digestEscalations || []);
        setApprovalPressure(payload.overview.collaboration.incidentApprovalPressure || []);
        setApprovalThroughput(payload.overview.collaboration.approvalThroughput || {
          totals: { totalApprovals: 0, manualReroutes: 0, autoReroutes: 0, resolvedApprovals: 0 },
          targets: [],
          workspaces: [],
        });
        setApprovalPolicyRecommendations(payload.overview.collaboration.approvalPolicyRecommendations || []);
        setAppliedApprovalPolicies(payload.overview.collaboration.appliedApprovalPolicies || []);
        setApprovalRecommendationObservations(payload.overview.collaboration.approvalRecommendationObservations || []);
        setApprovalTrustDashboard(payload.overview.collaboration.approvalTrustDashboard || {
          score: 0, regressedCount: 0, improvedCount: 0, rolledBackCount: 0, observingCount: 0, cooldownCount: 0, alerts: [],
        });
        setApprovalTrustEnvironments(payload.overview.collaboration.approvalTrustEnvironments || []);
        setApprovalTrustTrends(payload.overview.collaboration.approvalTrustTrends || []);
        setApprovalTrustSignals(payload.overview.collaboration.approvalTrustSignals || []);
        setApprovalRecommendationFamilies(payload.overview.collaboration.approvalRecommendationFamilies || []);
        setCompletedTrustIncidents(payload.overview.collaboration.completedTrustIncidents || []);
        setCompletedTrustEnvironments(payload.overview.collaboration.completedTrustEnvironments || []);
        setEnvironmentTrustRecaps(payload.overview.collaboration.environmentTrustRecaps || []);
        setGlobalOperations(payload.overview.collaboration.globalOperations || {
          totals: {
            workspaceCount: 0,
            overriddenWorkspaces: 0,
            unhealthyWorkspaces: 0,
            openIncidents: 0,
            pendingApprovals: 0,
            finalEscalations: 0,
            activeTrustSignals: 0,
            activeDigestEscalations: 0,
            completedTrustIncidents: 0,
            playbookRollouts: 0,
          },
          environments: [],
          hotspots: [],
          pressureTargets: [],
          playbookRollouts: [],
        });
        setFollowups(payload.overview.collaboration.automationFollowups || []);
        setPolicyPlaybookAdoption(payload.overview.collaboration.policyPlaybookAdoption || {
          totalTracked: 0,
          presetCount: 0,
          savedCount: 0,
          items: [],
          recommendations: [],
        });
        setPolicyPlaybooks(payload.overview.collaboration.governance?.workspacePolicyPlaybooks || []);
        setPolicyPlaybookPresets(payload.overview.collaboration.governance?.defaultPolicyPlaybookPresets || []);
        setDemoScenario(payload.overview.collaboration.governance?.demoScenario || null);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load workspace operations.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateQuery(nextValues: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(nextValues).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  const demoSteps = useMemo<DemoStep[]>(() => {
    const productionWorkspace = workspaces.find((item) => item.workspaceId === "ws-prod-redwood") || workspaces[0] || null;
    const stagingWorkspace =
      workspaces.find((item) => item.workspaceId === "ws-staging-orbit") ||
      workspaces.find((item) => item.status === "healthy") ||
      workspaces[1] ||
      productionWorkspace;
    const labsWorkspace =
      workspaces.find((item) => item.workspaceId === "ws-labs-signal") ||
      workspaces.find((item) => item.status === "error" && item.workspaceId !== productionWorkspace?.workspaceId) ||
      workspaces[2] ||
      productionWorkspace;
    const preferredPlaybook = policyPlaybookAdoption.recommendations.find((item) => item.kind === "prefer");
    const reviewPlaybook = policyPlaybookAdoption.recommendations.find((item) => item.kind === "review");
    const approvalTarget = approvalPressure[0];
    const scenarioId = demoScenario?.id || "control-plane";

    if (scenarioId === "approval-bottleneck") {
      return [
        {
          id: 1,
          title: "Open on the approval pressure story",
          detail: approvalTarget
            ? `${approvalTarget.target} is carrying ${approvalTarget.pendingCount} pending closeout approvals, which sets up the approval bottleneck story immediately.`
            : "Start with the approval pressure cards and explain that closeout work is backing up behind one approver.",
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Focus approval pressure",
        },
        {
          id: 2,
          title: "Inspect the production closeout queue",
          detail: productionWorkspace
            ? `${productionWorkspace.workspaceName} is waiting on approval despite recovery work being ready for closeout.`
            : "Show a production workspace that is blocked on closeout approval.",
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Inspect pending approval",
        },
        {
          id: 3,
          title: "Show the second blocked workspace",
          detail: labsWorkspace
            ? `${labsWorkspace.workspaceName} shares the same approver pressure and reinforces why the queue has become a bottleneck.`
            : "Use a second blocked workspace to show the queue is systemic, not isolated.",
          workspaceId: labsWorkspace?.workspaceId ?? null,
          actionLabel: "Switch to second blocker",
        },
        {
          id: 4,
          title: "Demonstrate intervention controls",
          detail: "Use reassignment, takeover, or backup approver logic to show how the platform resolves approval bottlenecks in place.",
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Show approval actions",
          recommendedAction: productionWorkspace
            ? {
                action: "collaboration:automation-assign-backup-approver",
                payload: { workspaceId: productionWorkspace.workspaceId, backupApproverTarget: "role:admin" },
                success: `Updated the backup approver for ${productionWorkspace.workspaceName}.`,
                label: "Assign admin backup approver",
              }
            : undefined,
        },
      ];
    }

    if (scenarioId === "recovery-success") {
      return [
        {
          id: 1,
          title: "Lead with recovery outcomes",
          detail: `Open on the control plane and emphasize that recovery has already succeeded across most workspaces.`,
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Show healthy rollout",
        },
        {
          id: 2,
          title: "Highlight the production win",
          detail: productionWorkspace
            ? `${productionWorkspace.workspaceName} has moved from high-risk production recovery into a resolved state with a stronger policy posture.`
            : "Highlight the recovered production workspace and its final state.",
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Inspect production recovery",
        },
        {
          id: 3,
          title: "Support it with rollout evidence",
          detail: preferredPlaybook
            ? `${preferredPlaybook.playbookName} and the rollout history show how the system got here and why the platform prefers that approach.`
            : "Use rollout history and playbook adoption to explain why the recovery succeeded.",
          workspaceId: stagingWorkspace?.workspaceId ?? null,
          actionLabel: "Show rollout evidence",
        },
        {
          id: 4,
          title: "Close on trust and archive readiness",
          detail: "Finish on the summary, archive guidance, and trust recap to show that the system captures the full lifecycle after recovery.",
          workspaceId: stagingWorkspace?.workspaceId ?? null,
          actionLabel: "Show closeout package",
          recommendedAction: stagingWorkspace
            ? {
                action: "collaboration:automation-generate-summary",
                payload: { workspaceId: stagingWorkspace.workspaceId },
                success: `Generated an incident summary for ${stagingWorkspace.workspaceName}.`,
                label: "Refresh incident summary",
              }
            : undefined,
        },
      ];
    }

    if (scenarioId === "cross-workspace-overload") {
      return [
        {
          id: 1,
          title: "Open with multi-cluster stress",
          detail: `Start on the control plane and emphasize that multiple workspaces are unhealthy at once, which makes the platform-level controls the hero.`,
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Show global hotspots",
        },
        {
          id: 2,
          title: "Show the production cluster",
          detail: productionWorkspace
            ? `${productionWorkspace.workspaceName} is one of several active incidents and represents the highest-risk cluster.`
            : "Focus the highest-risk production workspace first.",
          workspaceId: productionWorkspace?.workspaceId ?? null,
          actionLabel: "Inspect production cluster",
        },
        {
          id: 3,
          title: "Contrast with a second overloaded cluster",
          detail: stagingWorkspace
            ? `${stagingWorkspace.workspaceName} demonstrates that the issue is platform-wide, not just one team having a bad day.`
            : "Move to another unhealthy workspace to show the overload is cross-workspace.",
          workspaceId: stagingWorkspace?.workspaceId ?? null,
          actionLabel: "Inspect second cluster",
        },
        {
          id: 4,
          title: "Use bulk stabilization",
          detail: "Finish by applying environment-level actions or a stabilization playbook to show that the control plane can remediate many teams at once.",
          workspaceId: labsWorkspace?.workspaceId ?? null,
          actionLabel: "Show bulk remediation",
          recommendedAction: {
            action: "collaboration:automation-bulk-run-sweep",
            payload: { environment: "development", status: "error" },
            success: "Queued digest sweeps across the unhealthy development cluster.",
            label: "Run bulk development sweeps",
          },
        },
      ];
    }

    return [
      {
        id: 1,
        title: "Open with the platform view",
        detail: `Start at the control plane and call out ${globalOperations.totals.unhealthyWorkspaces} unhealthy workspaces across ${globalOperations.totals.workspaceCount} total teams.`,
        workspaceId: productionWorkspace?.workspaceId ?? null,
        actionLabel: "Focus production hotspot",
      },
      {
        id: 2,
        title: "Show the production incident",
        detail: productionWorkspace
          ? `${productionWorkspace.workspaceName} is the crisis workspace: ${productionWorkspace.lastSweepError || "digest automation is failing"}.`
          : "Highlight the most critical production workspace and its current incident state.",
        workspaceId: productionWorkspace?.workspaceId ?? null,
        actionLabel: "Inspect incident controls",
        recommendedAction: productionWorkspace
          ? {
              action: "collaboration:automation-run-sweep",
              payload: { workspaceId: productionWorkspace.workspaceId },
              success: `Queued a digest sweep for ${productionWorkspace.workspaceName}.`,
              label: "Run production sweep",
            }
          : undefined,
      },
      {
        id: 3,
        title: "Contrast with a successful rollout",
        detail: stagingWorkspace
          ? `${stagingWorkspace.workspaceName} is the recovery story, with rollout history, overrides, and a resolved incident.`
          : "Show a workspace that recovered under a preset rollout.",
        workspaceId: stagingWorkspace?.workspaceId ?? null,
        actionLabel: preferredPlaybook ? `Mention ${preferredPlaybook.playbookName}` : "Show the healthy cluster",
      },
      {
        id: 4,
        title: "Use playbook guidance",
        detail: preferredPlaybook
          ? `${preferredPlaybook.title}: ${preferredPlaybook.detail}`
          : "Use the playbook guidance panel to explain which bundle the platform recommends next.",
        workspaceId: labsWorkspace?.workspaceId ?? null,
        actionLabel: reviewPlaybook ? `Review ${reviewPlaybook.playbookName}` : "Highlight guidance",
        recommendedAction:
          preferredPlaybook && preferredPlaybook.playbookId
            ? {
                action: "collaboration:automation-bulk-apply-policy-playbook",
                payload: { environment: preferredPlaybook.environment, playbookId: preferredPlaybook.playbookId, status: "error" },
                success: `Applied ${preferredPlaybook.playbookName} across the ${preferredPlaybook.environment} cluster.`,
                label: `Apply ${preferredPlaybook.playbookName}`,
              }
            : undefined,
      },
      {
        id: 5,
        title: "Close on the labs cluster",
        detail: labsWorkspace
          ? `${labsWorkspace.workspaceName} is still noisy, which makes the stabilization actions and follow-up path easy to demonstrate.`
          : "Finish on the noisy workspace to show stabilization actions and follow-up work.",
        workspaceId: labsWorkspace?.workspaceId ?? null,
        actionLabel: "Show stabilization path",
      },
    ];
  }, [
    approvalPressure,
    demoScenario?.id,
    globalOperations.totals.unhealthyWorkspaces,
    globalOperations.totals.workspaceCount,
    policyPlaybookAdoption.recommendations,
    workspaces,
  ]);

  const normalizedDemoStep = Number.isFinite(requestedDemoStep)
    ? Math.min(Math.max(requestedDemoStep, 1), Math.max(demoSteps.length, 1))
    : 1;
  const activeDemoStep = demoSteps.find((item) => item.id === normalizedDemoStep) || demoSteps[0] || null;
  const filteredWorkspaces = useMemo(
    () => (exceptionFilter === "overrides" ? workspaces.filter((item) => item.hasPolicyOverride) : workspaces),
    [exceptionFilter, workspaces]
  );
  const filteredHotspots = useMemo(
    () =>
      exceptionFilter === "overrides"
        ? globalOperations.hotspots.filter((item) => item.hasPolicyOverride)
        : globalOperations.hotspots,
    [exceptionFilter, globalOperations.hotspots]
  );
  const overrideHotspotCount = useMemo(
    () => globalOperations.hotspots.filter((item) => item.hasPolicyOverride).length,
    [globalOperations.hotspots]
  );

  const workspace = useMemo(() => {
    if (!filteredWorkspaces.length) {
      return null;
    }
    const focusWorkspaceId = selectedWorkspace || (demoMode ? activeDemoStep?.workspaceId : null);
    return filteredWorkspaces.find((item) => item.workspaceId === focusWorkspaceId) || filteredWorkspaces[0];
  }, [activeDemoStep?.workspaceId, demoMode, filteredWorkspaces, selectedWorkspace]);

  const relatedEscalations = useMemo(
    () => escalations.filter((item) => !workspace || item.workspaceId === workspace.workspaceId),
    [escalations, workspace]
  );
  const relatedFollowups = useMemo(
    () => followups.filter((item) => !workspace || item.workspaceId === workspace.workspaceId),
    [followups, workspace]
  );

  function buildActionSummary(action: string, payload: Record<string, unknown>, success: string): ActionSummary {
    const payloadWorkspaceId = typeof payload.workspaceId === "string" ? payload.workspaceId : null;
    const payloadWorkspaceName =
      (payloadWorkspaceId ? workspaces.find((item) => item.workspaceId === payloadWorkspaceId)?.workspaceName : null) ||
      (workspace?.workspaceId === payloadWorkspaceId ? workspace.workspaceName : null) ||
      null;
    const nextStep = demoMode && activeDemoStep ? `Continue with step ${Math.min(normalizedDemoStep + 1, demoSteps.length)} in guided demo.` : null;

    if (action.includes("bulk")) {
      const environment = typeof payload.environment === "string" ? payload.environment : "selected environment";
      return {
        title: "Bulk action completed",
        detail: `${success} This updated the ${environment} cluster from the control plane.`,
        workspaceName: payloadWorkspaceName,
        actionLabel: action,
        nextStep,
      };
    }

    if (payloadWorkspaceName) {
      return {
        title: `${payloadWorkspaceName} updated`,
        detail: success,
        workspaceName: payloadWorkspaceName,
        actionLabel: action,
        nextStep,
      };
    }

    return {
      title: "Operation completed",
      detail: success,
      workspaceName: null,
      actionLabel: action,
      nextStep,
    };
  }

  async function runAction(action: string, payload: Record<string, unknown>, success: string) {
    const response = await fetch("/api/console", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!result.ok) {
      setError(result.error || "Action failed.");
      return;
    }
    setMessage(success);
    setError(null);
    await load();
    setActionSummary(buildActionSummary(action, payload, success));
  }

  async function applyRecommendation(
    recommendation: NonNullable<ConsolePayload["overview"]["collaboration"]["approvalPolicyRecommendations"]>[number]
  ) {
    if (!recommendation.action?.type) {
      setError("This recommendation does not have an available action.");
      return;
    }
    await runAction(
      recommendation.action.type,
      recommendation.action.payload || {},
      `Applied recommendation: ${recommendation.title}.`
    );
  }

  async function promoteRecommendation(
    recommendation: NonNullable<ConsolePayload["overview"]["collaboration"]["approvalPolicyRecommendations"]>[number]
  ) {
    if (!recommendation.promoteAction?.type) {
      setError("This recommendation does not have a promotion action.");
      return;
    }
    await runAction(
      recommendation.promoteAction.type,
      recommendation.promoteAction.payload || {},
      `Promoted recommendation: ${recommendation.title}.`
    );
  }

  async function rollbackPolicy(policyId: string, title: string) {
    await runAction(
      "collaboration:rollback-approval-policy",
      { promotionId: policyId },
      `Rolled back promoted policy: ${title}.`
    );
  }

  async function actOnTrustAlert(
    alert: NonNullable<ConsolePayload["overview"]["collaboration"]["approvalTrustDashboard"]>["alerts"][number],
    action: NonNullable<NonNullable<ConsolePayload["overview"]["collaboration"]["approvalTrustDashboard"]>["alerts"][number]["actions"]>[number]
  ) {
    await runAction(action.action, action.payload || {}, `${action.label} for ${alert.title}.`);
  }

  function loadPlaybookIntoDrafts(playbook: {
    name: string;
    environment: string;
    incidentApprovalCapacityLimit: number;
    trustDropAction: string;
    requireApprovalForResolved: boolean;
    promoteTrustDropToIncident: boolean;
  }) {
    setBulkPolicyCapacityDrafts((current) => ({
      ...current,
      [playbook.environment]: String(playbook.incidentApprovalCapacityLimit),
    }));
    setBulkPolicyTrustActionDrafts((current) => ({
      ...current,
      [playbook.environment]: playbook.trustDropAction,
    }));
    setBulkPolicyRequireResolvedDrafts((current) => ({
      ...current,
      [playbook.environment]: Boolean(playbook.requireApprovalForResolved),
    }));
    setBulkPolicyPromoteTrustDrafts((current) => ({
      ...current,
      [playbook.environment]: Boolean(playbook.promoteTrustDropToIncident),
    }));
    setBulkPolicyPlaybookNameDrafts((current) => ({
      ...current,
      [playbook.environment]: playbook.name,
    }));
    setMessage(`Loaded ${playbook.name} into ${playbook.environment} controls.`);
    setError(null);
  }

  async function applyPlaybookGuidance(item: NonNullable<ConsolePayload["overview"]["collaboration"]["policyPlaybookAdoption"]>["recommendations"][number]) {
    if (item.source === "preset") {
      const preset = (policyPlaybookPresets || []).find((entry) => entry.id === item.playbookId);
      if (!preset) {
        setError("Preset playbook not found.");
        return;
      }
      await runAction(
        "collaboration:automation-bulk-apply-policy-override",
        {
          environment: item.environment,
          statuses: ["error", "stalled"],
          overrideEnvironment: preset.environment,
          incidentApprovalCapacityLimit: preset.incidentApprovalCapacityLimit,
          trustDropAction: preset.trustDropAction,
          requireApprovalForResolved: preset.requireApprovalForResolved,
          promoteTrustDropToIncident: preset.promoteTrustDropToIncident,
        },
        `Applied ${preset.name} across unhealthy ${item.environment} workspaces.`
      );
      return;
    }

    const saved = (policyPlaybooks || []).find((entry) => entry.id === item.playbookId);
    if (!saved) {
      setError("Saved playbook not found.");
      return;
    }
    await runAction(
      "collaboration:automation-bulk-apply-policy-playbook",
      {
        environment: item.environment,
        statuses: ["error", "stalled"],
        playbookId: saved.id,
      },
      `Applied ${saved.name} across unhealthy ${item.environment} workspaces.`
    );
  }

  function exportTrustCsv() {
    const lines = [
      ["section", "environment", "label", "metric_a", "metric_b", "metric_c", "timestamp"].join(","),
      ...approvalTrustEnvironments.map((item) =>
        [
          "environment",
          item.environment,
          item.current ? "current" : "tracked",
          `score:${item.score}`,
          `alerts:${item.alertCount}`,
          `regressed:${item.regressedCount}`,
          "",
        ].map(csvEscape).join(",")
      ),
      ...approvalTrustTrends.map((item) =>
        [
          "trend",
          item.environment,
          "movement",
          `24h:${item.deltas.day ?? "n/a"}`,
          `7d:${item.deltas.week ?? "n/a"}`,
          `30d:${item.deltas.month ?? "n/a"}`,
          item.latestTakenAt || "",
        ].map(csvEscape).join(",")
      ),
      ...approvalRecommendationFamilies.map((item) =>
        [
          "family",
          "",
          item.label,
          `recommendations:${item.recommendationCount}`,
          `promoted:${item.promotedCount}`,
          `rolled_back:${item.rolledBackCount}`,
          item.lastPromotionAt || item.lastRecommendationAt || "",
        ].map(csvEscape).join(",")
      ),
      ...approvalTrustSignals.map((item) =>
        [
          "signal",
          item.environment || "",
          item.title,
          item.type,
          item.tone,
          item.detail,
          "",
        ].map(csvEscape).join(",")
      ),
      ...environmentTrustRecaps.map((item) =>
        [
          "environment_trust_recap",
          item.environment,
          `score:${item.score}`,
          `active_signals:${item.activeSignals}`,
          `completed_archived:${item.completedArchived}`,
          "",
          item.latestArchivedAt || "",
        ].map(csvEscape).join(",")
      ),
      ...completedTrustEnvironments.map((item) =>
        [
          "completed_trust_environment",
          item.environment,
          item.recentWorkspaces.join(" | "),
          `archived:${item.archivedCount}`,
          "",
          "",
          item.latestArchivedAt || "",
        ].map(csvEscape).join(",")
      ),
      ...completedTrustIncidents.map((item) =>
        [
          "completed_trust_incident",
          item.environment,
          item.workspaceName,
          item.workspaceId,
          item.summary || "",
          "",
          item.archivedAt || "",
        ].map(csvEscape).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "trust-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (user?.role !== "admin") {
    return (
      <SectionCard
        eyebrow="Operations"
        title="Admin access required"
        description="Workspace operations is reserved for administrators managing escalations and automation health."
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Your current role does not have access to this page.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Operations"
      title="Workspace operations"
      description="Assign owners, rerun automation, snooze noisy workspaces, and keep escalation handling visible in one place."
    >
      {message ? <div className="mb-4 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="mb-4 rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
      {actionSummary ? (
        <div className="mb-4 rounded-[30px] border border-amber-400/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(251,191,36,0.08))] p-5 shadow-[0_20px_60px_rgba(120,53,15,0.18)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge className="border-amber-300/20 bg-white/10 text-amber-50">Action summary</Badge>
              <p className="text-sm font-semibold text-white">{actionSummary.title}</p>
              <p className="mt-1 text-sm text-amber-50">{actionSummary.detail}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-100/80">
                Action: {actionSummary.actionLabel}
                {actionSummary.workspaceName ? ` • Workspace: ${actionSummary.workspaceName}` : ""}
              </p>
              {actionSummary.nextStep ? (
                <p className="mt-2 text-xs text-amber-100/80">{actionSummary.nextStep}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setActionSummary(null)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="mb-4 rounded-[32px] border border-sky-400/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.55))] p-5 shadow-[0_24px_80px_rgba(14,165,233,0.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge className="border-sky-300/20 bg-white/10 text-sky-50">Guided operations</Badge>
            <p className="text-sm font-semibold text-white">Guided demo mode</p>
            <p className="mt-1 max-w-3xl text-sm text-slate-200">
              {demoMode
                ? "The seeded control-plane story is now being guided in presenter order."
                : "Turn on a presenter-friendly walkthrough that points to the production, staging, and labs story already seeded in the live demo."}
            </p>
            {demoScenario ? (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-200/80">
                Loaded scenario: {demoScenario.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {demoMode ? (
              <>
                <button
                  type="button"
                  onClick={() => updateQuery({ demo: null, step: null })}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Exit guided mode
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateQuery({
                      step: String(Math.min(normalizedDemoStep + 1, demoSteps.length)),
                      workspace: activeDemoStep?.workspaceId ?? workspace?.workspaceId ?? null,
                    })
                  }
                  className={buttonVariants({ variant: "default" })}
                >
                  Next step
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  updateQuery({
                    demo: "guided",
                    step: "1",
                    workspace: demoSteps[0]?.workspaceId ?? workspace?.workspaceId ?? null,
                  })
                }
                className={buttonVariants({ variant: "default" })}
              >
                Start guided demo
              </button>
            )}
          </div>
        </div>
        {demoMode && activeDemoStep ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300/80">
                Step {activeDemoStep.id} of {demoSteps.length}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{activeDemoStep.title}</p>
              <p className="mt-2 text-sm text-slate-300">{activeDemoStep.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ workspace: activeDemoStep.workspaceId ?? workspace?.workspaceId ?? null })}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 text-sm text-amber-100 transition hover:bg-amber-400/15"
                >
                  {activeDemoStep.actionLabel}
                </button>
                {activeDemoStep.recommendedAction ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        activeDemoStep.recommendedAction!.action,
                        activeDemoStep.recommendedAction!.payload,
                        activeDemoStep.recommendedAction!.success
                      )
                    }
                    className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
                  >
                    {activeDemoStep.recommendedAction.label}
                  </button>
                ) : null}
                {normalizedDemoStep > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateQuery({
                        step: String(normalizedDemoStep - 1),
                        workspace: demoSteps[Math.max(normalizedDemoStep - 2, 0)]?.workspaceId ?? workspace?.workspaceId ?? null,
                      })
                    }
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Previous
                  </button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              {demoScenario ? (
                <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scenario summary</p>
                  <p className="mt-1 font-semibold text-white">{demoScenario.name}</p>
                  <p className="mt-1 text-xs text-slate-300">{demoScenario.description}</p>
                </div>
              ) : null}
              {demoSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() =>
                    updateQuery({
                      step: String(step.id),
                      workspace: step.workspaceId ?? workspace?.workspaceId ?? null,
                    })
                  }
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    step.id === normalizedDemoStep
                      ? "border-sky-300/40 bg-sky-300/10 text-sky-50"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">Step {step.id}</p>
                  <p className="mt-1 text-sm font-semibold">{step.title}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <SurfacePanel className="mb-4">
        <SurfacePanelHeader
          badge="Platform snapshot"
          title="Platform control plane"
          description="Cross-workspace rollout of trust, incident, and approval pressure so admins can steer the whole platform before drilling into one team."
          actions={
          <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(globalOperations.totals.unhealthyWorkspaces ? "warning" : "healthy")}`}>
            {globalOperations.totals.workspaceCount} workspaces
          </span>
          }
        />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Metric label="Unhealthy" value={String(globalOperations.totals.unhealthyWorkspaces)} />
          <Metric label="Open Incidents" value={String(globalOperations.totals.openIncidents)} />
          <Metric label="Pending Approvals" value={String(globalOperations.totals.pendingApprovals)} />
          <Metric label="Trust Signals" value={String(globalOperations.totals.activeTrustSignals)} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {globalOperations.totals.overriddenWorkspaces} workspaces are currently running workspace-specific policy overrides, and {globalOperations.totals.playbookRollouts} recent playbook rollouts are on record.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Environments</p>
              <span className="text-xs text-slate-500">{globalOperations.environments.length} tracked</span>
            </div>
            <div className="mt-3 space-y-3">
              {globalOperations.environments.map((item) => {
                const environmentPlaybooks = (policyPlaybooks || []).filter(
                  (playbook) => playbook.environment === item.environment
                );
                const environmentPresets = (policyPlaybookPresets || []).filter(
                  (preset) => preset.environment === item.environment
                );
                return (
                <div key={item.environment} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium capitalize text-white">{item.environment}</span>
                    <span className="text-xs text-slate-400">score {item.averageTrustScore}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.workspaceCount} workspaces • {item.unhealthyCount} unhealthy • {item.openIncidents} incidents
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.pendingApprovals} approvals • {item.finalEscalations} final escalations • {item.activeTrustSignals} trust signals
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.overrideCount} override{item.overrideCount === 1 ? "" : "s"} active • {item.playbookRollouts} rollout{item.playbookRollouts === 1 ? "" : "s"} logged
                  </p>
                  {item.unhealthyCount ? (
                    <div className="mt-3 space-y-2">
                      <input
                        value={bulkOwnerDrafts[item.environment] ?? ""}
                        onChange={(event) =>
                          setBulkOwnerDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        placeholder="Owner for unhealthy workspaces"
                      />
                      <input
                        value={bulkFollowupDrafts[item.environment] ?? ""}
                        onChange={(event) =>
                          setBulkFollowupDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        placeholder="Follow-up template for unhealthy workspaces"
                      />
                      <input
                        value={bulkApproverDrafts[item.environment] ?? ""}
                        onChange={(event) =>
                          setBulkApproverDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        placeholder="Required approver target"
                      />
                      <input
                        value={bulkBackupApproverDrafts[item.environment] ?? ""}
                        onChange={(event) =>
                          setBulkBackupApproverDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        placeholder="Backup approver target"
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={bulkPolicyCapacityDrafts[item.environment] ?? ""}
                          onChange={(event) =>
                            setBulkPolicyCapacityDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                          placeholder="Override capacity limit"
                        />
                        <select
                          value={bulkPolicyTrustActionDrafts[item.environment] ?? "notify"}
                          onChange={(event) =>
                            setBulkPolicyTrustActionDrafts((current) => ({ ...current, [item.environment]: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="notify">Trust: notify</option>
                          <option value="digest">Trust: digest</option>
                          <option value="followup">Trust: follow-up</option>
                        </select>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={Boolean(bulkPolicyRequireResolvedDrafts[item.environment])}
                            onChange={(event) =>
                              setBulkPolicyRequireResolvedDrafts((current) => ({
                                ...current,
                                [item.environment]: event.target.checked,
                              }))
                            }
                          />
                          Resolve approval
                        </label>
                        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={Boolean(bulkPolicyPromoteTrustDrafts[item.environment])}
                            onChange={(event) =>
                              setBulkPolicyPromoteTrustDrafts((current) => ({
                                ...current,
                                [item.environment]: event.target.checked,
                              }))
                            }
                          />
                          Promote trust incidents
                        </label>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Policy playbooks</p>
                          <span className="text-xs text-slate-500">
                            {environmentPlaybooks.length} saved
                          </span>
                        </div>
                        {environmentPresets.length ? (
                          <div className="mt-3 space-y-2">
                            {environmentPresets.map((preset) => (
                              <div
                                key={preset.id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-white">{preset.name}</p>
                                    <p className="mt-1 text-slate-400">{preset.description}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => loadPlaybookIntoDrafts(preset)}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                                    >
                                      Load preset
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void runAction(
                                          "collaboration:automation-bulk-apply-policy-override",
                                          {
                                            environment: item.environment,
                                            statuses: ["error", "stalled"],
                                            overrideEnvironment: preset.environment,
                                            incidentApprovalCapacityLimit: preset.incidentApprovalCapacityLimit,
                                            trustDropAction: preset.trustDropAction,
                                            requireApprovalForResolved: preset.requireApprovalForResolved,
                                            promoteTrustDropToIncident: preset.promoteTrustDropToIncident,
                                          },
                                          `Applied preset ${preset.name} across unhealthy ${item.environment} workspaces.`
                                        )
                                      }
                                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                                    >
                                      Apply preset
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input
                            value={bulkPolicyPlaybookNameDrafts[item.environment] ?? ""}
                            onChange={(event) =>
                              setBulkPolicyPlaybookNameDrafts((current) => ({
                                ...current,
                                [item.environment]: event.target.value,
                              }))
                            }
                            className="min-w-[220px] flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                            placeholder="Save current override bundle as playbook"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "collaboration:save-policy-playbook",
                                {
                                  name:
                                    bulkPolicyPlaybookNameDrafts[item.environment] ||
                                    `${item.environment} override playbook`,
                                  environment: item.environment,
                                  incidentApprovalCapacityLimit:
                                    Number.parseInt(bulkPolicyCapacityDrafts[item.environment] || "1", 10) || 1,
                                  trustDropAction: bulkPolicyTrustActionDrafts[item.environment] || "notify",
                                  requireApprovalForResolved: Boolean(
                                    bulkPolicyRequireResolvedDrafts[item.environment]
                                  ),
                                  promoteTrustDropToIncident: Boolean(
                                    bulkPolicyPromoteTrustDrafts[item.environment]
                                  ),
                                },
                                `Saved a policy playbook for ${item.environment}.`
                              )
                            }
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                          >
                            Save playbook
                          </button>
                        </div>
                        {environmentPlaybooks.length ? (
                          <div className="mt-3 space-y-2">
                            {environmentPlaybooks.map((playbook) => (
                              <div
                                key={playbook.id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-white">{playbook.name}</p>
                                    <p className="mt-1 text-slate-400">
                                      cap {playbook.incidentApprovalCapacityLimit} • trust {playbook.trustDropAction}
                                      {playbook.requireApprovalForResolved ? " • resolve approval" : ""}
                                      {playbook.promoteTrustDropToIncident ? " • promote trust" : ""}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void runAction(
                                          "collaboration:automation-bulk-apply-policy-playbook",
                                          {
                                            environment: item.environment,
                                            statuses: ["error", "stalled"],
                                            playbookId: playbook.id,
                                          },
                                          `Applied ${playbook.name} across unhealthy ${item.environment} workspaces.`
                                        )
                                      }
                                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                                    >
                                      Apply playbook
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void runAction(
                                          "collaboration:delete-policy-playbook",
                                          { playbookId: playbook.id },
                                          `Deleted playbook: ${playbook.name}.`
                                        )
                                      }
                                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">
                            Save a reusable override bundle here to reuse it across unhealthy clusters.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-run-sweep",
                              { environment: item.environment, statuses: ["error", "stalled"] },
                              `Queued bulk sweeps for unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                        >
                          Sweep unhealthy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-assign",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                owner: bulkOwnerDrafts[item.environment] ?? "",
                              },
                              `Assigned an owner across unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100"
                        >
                          Assign owner
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-snooze",
                              { environment: item.environment, statuses: ["error", "stalled"], minutes: 60 },
                              `Snoozed unhealthy ${item.environment} workspaces for 60 minutes.`
                            )
                          }
                          className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100"
                        >
                          Snooze 60m
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-assign-approver",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                approverTarget: bulkApproverDrafts[item.environment] ?? "",
                              },
                              `Assigned a required approver across unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100"
                        >
                          Set approver
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-assign-backup-approver",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                backupApproverTarget: bulkBackupApproverDrafts[item.environment] ?? "",
                              },
                              `Assigned a backup approver across unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-100"
                        >
                          Set backup
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-apply-policy-override",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                overrideEnvironment: item.environment,
                                incidentApprovalCapacityLimit: Number.parseInt(
                                  bulkPolicyCapacityDrafts[item.environment] || "1",
                                  10
                                ) || 1,
                                trustDropAction: bulkPolicyTrustActionDrafts[item.environment] || "notify",
                                requireApprovalForResolved: Boolean(bulkPolicyRequireResolvedDrafts[item.environment]),
                                promoteTrustDropToIncident: Boolean(bulkPolicyPromoteTrustDrafts[item.environment]),
                              },
                              `Applied a policy override across unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1.5 text-xs text-lime-100"
                        >
                          Apply override
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-reset-policy-override",
                              { environment: item.environment, statuses: ["error", "stalled"] },
                              `Cleared policy overrides across unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                        >
                          Clear overrides
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-stabilize",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                owner: bulkOwnerDrafts[item.environment] ?? "",
                                approverTarget: bulkApproverDrafts[item.environment] ?? "",
                                backupApproverTarget: bulkBackupApproverDrafts[item.environment] ?? "",
                                description:
                                  bulkFollowupDrafts[item.environment] ||
                                  "Investigate automation health for {{workspaceName}} and report the next remediation step.",
                                createFollowup: true,
                                queueSweep: true,
                              },
                              `Ran the stabilization playbook for unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-100"
                        >
                          Stabilize cluster
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runAction(
                              "collaboration:automation-bulk-create-followup",
                              {
                                environment: item.environment,
                                statuses: ["error", "stalled"],
                                owner: bulkOwnerDrafts[item.environment] ?? "",
                                description:
                                  bulkFollowupDrafts[item.environment] ||
                                  "Investigate automation health for {{workspaceName}} and report the next remediation step.",
                              },
                              `Created follow-up tasks for unhealthy ${item.environment} workspaces.`
                            )
                          }
                          className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-100"
                        >
                          Create follow-ups
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace hotspots</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ exceptions: null })}
                  className={`rounded-full border px-3 py-1 text-[11px] ${
                    exceptionFilter === "all"
                      ? "border-sky-300/40 bg-sky-300/10 text-sky-100"
                      : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  All hotspots
                </button>
                <button
                  type="button"
                  onClick={() => updateQuery({ exceptions: "overrides" })}
                  className={`rounded-full border px-3 py-1 text-[11px] ${
                    exceptionFilter === "overrides"
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                      : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  Policy exceptions
                </button>
                <span className="text-xs text-slate-500">{filteredHotspots.length} shown</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {overrideHotspotCount} hotspot{overrideHotspotCount === 1 ? "" : "s"} currently run workspace-specific policy overrides.
            </p>
            <div className="mt-3 space-y-3">
              {filteredHotspots.length ? (
                filteredHotspots.map((item) => (
                <a key={`hotspot-${item.workspaceId}`} href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}`} className="block rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{item.workspaceName}</span>
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.finalEscalated ? "critical" : item.status)}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.environment} • incident {item.incidentStatus} • {item.overdueIntervals} overdue intervals
                  </p>
                  {item.hasPolicyOverride ? (
                    <p className="mt-1 text-xs text-amber-200">
                      Override: {item.policyOverrideSummary || "Workspace-specific policy active"}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {item.dueUsers} due users{item.pendingApprovalTarget ? ` • pending ${item.pendingApprovalTarget}` : ""}
                  </p>
                </a>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  {exceptionFilter === "overrides"
                    ? "No policy-exception hotspots match the current view."
                    : "No hotspot workspaces are available right now."}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Approval pressure</p>
              <span className="text-xs text-slate-500">{globalOperations.pressureTargets.length} targets</span>
            </div>
            <div className="mt-3 space-y-3">
              {globalOperations.pressureTargets.map((item) => (
                <div key={`pressure-${item.target}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{item.target}</span>
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.finalEscalatedCount ? "critical" : item.overdueCount ? "warning" : "active")}`}>
                      {item.pendingCount} pending
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.overdueCount} overdue • {item.finalEscalatedCount} final escalated • {item.workspaceCount} workspaces
                  </p>
                  <div className="mt-3 space-y-2">
                    <input
                      value={bulkApprovalTargetDrafts[item.target] ?? item.target}
                      onChange={(event) =>
                        setBulkApprovalTargetDrafts((current) => ({ ...current, [item.target]: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                      placeholder="Bulk reassign target"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "approval:bulk-reassign-target",
                            {
                              currentTarget: item.target,
                              approverTarget: bulkApprovalTargetDrafts[item.target] ?? item.target,
                            },
                            `Reassigned approvals from ${item.target}.`
                          )
                        }
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                      >
                        Bulk reassign
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "approval:bulk-take-over",
                            { currentTarget: item.target },
                            `Took ownership of approvals from ${item.target}.`
                          )
                        }
                        className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100"
                      >
                        Take over all
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Playbook rollouts</p>
              <span className="text-xs text-slate-500">{globalOperations.playbookRollouts.length} recent</span>
            </div>
            <div className="mt-3 space-y-3">
              {globalOperations.playbookRollouts.length ? (
                globalOperations.playbookRollouts.map((item) => (
                  <div
                    key={`playbook-rollout-${item.id}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{item.playbookName}</span>
                      <span className="text-xs text-slate-400 capitalize">{item.environment}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.workspaceCount} workspace{item.workspaceCount === 1 ? "" : "s"} • {item.appliedByName || "System"} • {formatTime(item.appliedAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.workspaceNames.slice(0, 3).join(", ")}
                      {item.workspaceNames.length > 3 ? ` +${item.workspaceNames.length - 3} more` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  Recent playbook rollouts will appear here after admins push a saved bundle to a workspace cluster.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Playbook adoption</p>
              <span className="text-xs text-slate-500">
                {policyPlaybookAdoption.totalTracked} tracked • {policyPlaybookAdoption.presetCount} presets • {policyPlaybookAdoption.savedCount} saved
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {policyPlaybookAdoption.items.length ? (
                policyPlaybookAdoption.items.map((item) => (
                  <div
                    key={`playbook-adoption-${item.source}-${item.playbookId || item.playbookName}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{item.playbookName}</span>
                      <span className="text-xs uppercase text-slate-400">{item.source}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.environment} • {item.rolloutCount} rollout{item.rolloutCount === 1 ? "" : "s"} • {item.workspaceCount} workspace{item.workspaceCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.recoveredWorkspaceCount} recovered • {item.activeRiskWorkspaceCount} still at risk
                      {item.completedTrustCount ? ` • ${item.completedTrustCount} trust closeout${item.completedTrustCount === 1 ? "" : "s"}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Last applied {formatTime(item.latestAppliedAt)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  Adoption metrics appear here once a preset or saved playbook has been rolled out to a workspace cluster.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Playbook guidance</p>
              <span className="text-xs text-slate-500">{policyPlaybookAdoption.recommendations.length} signals</span>
            </div>
            <div className="mt-3 space-y-3">
              {policyPlaybookAdoption.recommendations.length ? (
                policyPlaybookAdoption.recommendations.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3 text-sm ${toneClass(item.tone)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{item.title}</span>
                      <span className="text-xs uppercase text-slate-300">{item.environment}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-200">{item.detail}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Source: {item.source}
                      {item.playbookName ? ` • ${item.playbookName}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void applyPlaybookGuidance(item)}
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                      >
                        Apply to unhealthy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const preset = (policyPlaybookPresets || []).find((entry) => entry.id === item.playbookId);
                          const saved = (policyPlaybooks || []).find((entry) => entry.id === item.playbookId);
                          const target = preset || saved;
                          if (!target) {
                            setError("Playbook guidance target not found.");
                            return;
                          }
                          loadPlaybookIntoDrafts(target);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                      >
                        Load in controls
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  Guidance appears here once rollout outcomes are strong enough to recommend a bundle or flag a weak one.
                </div>
              )}
            </div>
          </div>
        </div>
      </SurfacePanel>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.52))] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace scope</p>
              <span className="text-xs text-slate-500">{filteredWorkspaces.length} shown</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateQuery({ exceptions: null, workspace: null })}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  exceptionFilter === "all"
                    ? "border-sky-300/40 bg-sky-300/10 text-sky-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                }`}
              >
                All workspaces
              </button>
              <button
                type="button"
                onClick={() => updateQuery({ exceptions: "overrides", workspace: null })}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  exceptionFilter === "overrides"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                }`}
              >
                Exceptions only
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {globalOperations.totals.overriddenWorkspaces} workspace{globalOperations.totals.overriddenWorkspaces === 1 ? "" : "s"} currently diverge from platform defaults.
            </p>
          </div>
          {filteredWorkspaces.map((item) => (
            <a
              key={item.workspaceId}
              href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}${exceptionFilter === "overrides" ? "&exceptions=overrides" : ""}`}
              className={`block rounded-[26px] border p-4 transition ${workspace?.workspaceId === item.workspaceId ? "border-sky-300/50 bg-sky-300/10 shadow-[0_18px_40px_rgba(14,165,233,0.12)]" : "border-white/10 bg-white/5 hover:bg-white/7"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.workspaceName}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.workspaceId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.hasPolicyOverride ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-100">
                      override
                    </span>
                  ) : null}
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.status)}`}>{item.status}</span>
                </div>
              </div>
            </a>
          ))}
          {!filteredWorkspaces.length ? (
            <div className="rounded-[26px] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No workspaces match this policy-exception filter.
            </div>
          ) : null}
        </div>

        {workspace ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Trust dashboard</p>
                  <p className="mt-1 text-sm text-slate-300">Environment-level signal for policy health, pending observation candidates, and regressions.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportTrustCsv}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200"
                  >
                    Export CSV
                  </button>
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(approvalTrustDashboard.score >= 80 ? "healthy" : approvalTrustDashboard.score >= 60 ? "warning" : "critical")}`}>
                    score {approvalTrustDashboard.score}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-5">
                <Metric label="Improved" value={String(approvalTrustDashboard.improvedCount)} />
                <Metric label="Regressed" value={String(approvalTrustDashboard.regressedCount)} />
                <Metric label="Rolled Back" value={String(approvalTrustDashboard.rolledBackCount)} />
                <Metric label="Observing" value={String(approvalTrustDashboard.observingCount)} />
                <Metric label="Cooldown" value={String(approvalTrustDashboard.cooldownCount)} />
              </div>
              {approvalTrustEnvironments.length ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {approvalTrustEnvironments.map((item) => (
                    <div key={item.environment} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold capitalize text-white">{item.environment}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.score >= 80 ? "healthy" : item.score >= 60 ? "warning" : "critical")}`}>
                          {item.score}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.autoPromoteEnabled ? "Auto-promote enabled" : "Manual promotion only"}
                        {item.current ? " • current" : ""}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">
                        {item.improvedCount} improved • {item.regressedCount} regressed • {item.alertCount} alerts
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.observingCount} observing • {item.cooldownCount} cooldown • {item.observationHours}h observe / {item.cooldownHours}h cooldown
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              {approvalTrustTrends.length ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Trend view</p>
                    <span className="text-xs text-slate-500">{approvalTrustTrends.length} environments</span>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {approvalTrustTrends.map((item) => (
                      <div key={`trend-${item.environment}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium capitalize text-white">{item.environment}</span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.score >= 80 ? "healthy" : item.score >= 60 ? "warning" : "critical")}`}>
                            {item.score}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          24h {formatSignedDelta(item.deltas.day)} • 7d {formatSignedDelta(item.deltas.week)} • 30d {formatSignedDelta(item.deltas.month)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.activity.latestImprovedCount} improved • {item.activity.latestRegressedCount} regressed • {item.activity.latestAlertCount} alerts
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.sampleCount} snapshots{item.latestTakenAt ? ` • latest ${formatTime(item.latestTakenAt)}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {approvalTrustDashboard.alerts.length ? (
                <div className="mt-4 space-y-3">
                  {approvalTrustDashboard.alerts.map((item) => (
                    <SignalEntry
                      key={item.id}
                      title={item.title}
                      badge={item.tone}
                      badgeClassName={toneClass(item.tone)}
                      body={
                        <>
                          <p>{item.detail}</p>
                          {item.acknowledged ? (
                            <p className="mt-2 text-xs text-slate-400">
                              Acknowledged by {item.acknowledgedByName || "admin"} on {formatTime(item.acknowledgedAt || null)}.
                            </p>
                          ) : null}
                        </>
                      }
                      actions={item.actions?.length ? (
                        <>
                          {item.actions.map((alertAction) => (
                            <button
                              key={`${item.id}-${alertAction.action}-${alertAction.label}`}
                              type="button"
                              onClick={() => void actOnTrustAlert(item, alertAction)}
                              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                            >
                              {alertAction.label}
                            </button>
                          ))}
                        </>
                      ) : undefined}
                    />
                  ))}
                </div>
              ) : null}
              {approvalTrustSignals.length ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Proactive trust alerts</p>
                    <span className="text-xs text-slate-500">{approvalTrustSignals.length} routed</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {approvalTrustSignals.map((item) => (
                      <SignalEntry
                        key={item.id}
                        className="bg-white/5"
                        title={item.title}
                        badge={item.environment || item.type}
                        badgeClassName={toneClass(item.tone)}
                        body={item.detail}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              {approvalRecommendationFamilies.length ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommendation family health</p>
                    <span className="text-xs text-slate-500">{approvalRecommendationFamilies.length} families</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {approvalRecommendationFamilies.map((item) => (
                      <SignalEntry
                        key={item.family}
                        className="bg-white/5"
                        title={item.label}
                        badge={item.recommendationKind}
                        badgeClassName={toneClass(item.rolledBackCount > 0 ? "critical" : item.trustSignalCount > 0 ? "warning" : "healthy")}
                        body={
                          <>
                            <p className="text-xs text-slate-400">
                              {item.recommendationCount} recommendations • {item.promotedCount} promoted • {item.rolledBackCount} rolled back • {item.trustSignalCount} trust alerts
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                              {item.target ? `${item.target}` : item.workspaceId ? item.workspaceId : "global"}{item.observingCount ? ` • ${item.observingCount} observing/cooldown` : ""}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {item.lastPromotionAt ? `last promotion ${formatTime(item.lastPromotionAt)}` : item.lastRecommendationAt ? `last recommendation ${formatTime(item.lastRecommendationAt)}` : "no history yet"}
                            </p>
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {completedTrustIncidents.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Completed trust incidents</p>
                    <p className="mt-1 text-sm text-slate-300">Recent trust incidents that completed recovery, closeout, handoff, and archive approval.</p>
                  </div>
                  <span className="text-xs text-slate-500">{completedTrustIncidents.length} archived</span>
                </div>
                <div className="mt-4 space-y-3">
                  {completedTrustIncidents.map((item) => (
                    <div key={`${item.workspaceId}-${item.archivedAt}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.workspaceName}</p>
                        <span className="text-xs text-slate-400">{formatTime(item.archivedAt)}</span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.environment}</p>
                      <p className="mt-3 text-sm text-slate-200">{item.summary || "No final trust recap recorded."}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {completedTrustEnvironments.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Completed trust by environment</p>
                    <p className="mt-1 text-sm text-slate-300">See where trust incidents are being fully resolved and archived most often.</p>
                  </div>
                  <span className="text-xs text-slate-500">{completedTrustEnvironments.length} environments</span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {completedTrustEnvironments.map((item) => (
                    <div key={item.environment} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.environment}</p>
                        <span className="text-xs text-slate-400">{item.archivedCount} archived</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Latest archive: {formatTime(item.latestArchivedAt)}</p>
                      {item.recentWorkspaces.length ? (
                        <p className="mt-3 text-sm text-slate-200">{item.recentWorkspaces.join(" • ")}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {environmentTrustRecaps.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Environment trust recaps</p>
                    <p className="mt-1 text-sm text-slate-300">Digest-friendly view of score, active trust pressure, and completed trust work by environment.</p>
                  </div>
                  <span className="text-xs text-slate-500">{environmentTrustRecaps.length} environments</span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {environmentTrustRecaps.map((item) => (
                    <div key={item.environment} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.environment}</p>
                        <span className="text-xs text-slate-400">score {item.score}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">
                        Active trust signals: <span className="font-semibold text-white">{item.activeSignals}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        Archived trust incidents: <span className="font-semibold text-white">{item.completedArchived}</span>
                      </p>
                      <p className="mt-2 text-xs text-slate-400">Latest archive: {formatTime(item.latestArchivedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {approvalPolicyRecommendations.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Policy recommendations</p>
                    <p className="mt-1 text-sm text-slate-300">Suggested changes based on recent approval load, reroutes, and throughput.</p>
                  </div>
                  <span className="text-xs text-slate-500">{approvalPolicyRecommendations.length} suggestions</span>
                </div>
                <div className="mt-4 space-y-3">
                  {approvalPolicyRecommendations.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <div className="flex items-center gap-2">
                          {item.confidence ? (
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300">
                              {item.confidence.label} confidence • {Math.round(item.confidence.score * 100)}%
                            </span>
                          ) : null}
                          <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.kind === "throughput" ? "warning" : "critical")}`}>{item.kind}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                      {item.action?.type || item.promoteAction?.type ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void applyRecommendation(item)}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"
                          >
                            Apply recommendation
                          </button>
                          {item.promoteAction?.type ? (
                            <button
                              type="button"
                              onClick={() => void promoteRecommendation(item)}
                              className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
                            >
                              Promote to policy
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {appliedApprovalPolicies.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Promoted policies</p>
                    <p className="mt-1 text-sm text-slate-300">Durable recommendation-driven changes and their captured before/after context.</p>
                  </div>
                  <span className="text-xs text-slate-500">{appliedApprovalPolicies.length} policies</span>
                </div>
                <div className="mt-4 space-y-3">
                  {appliedApprovalPolicies.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300">{item.recommendationKind}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.effectSummary}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.environment} • {item.appliedAutomatically ? "automatic" : "manual"} • applied by {item.appliedByName} on {formatTime(item.appliedAt)}
                      </p>
                      {item.impact ? (
                        <p className="mt-2 text-xs text-slate-300">
                          Impact: <span className="font-semibold text-white">{item.impact.status}</span> • {item.impact.summary}
                        </p>
                      ) : null}
                      {item.impact?.comparison ? (
                        <p className="mt-2 text-xs text-slate-400">
                          Pending delta {formatSignedDelta(item.impact.comparison.pendingDelta)} • overdue delta {formatSignedDelta(item.impact.comparison.overdueDelta)} • avg {item.impact.comparison.averageApprovalMinutesBefore ?? "n/a"}m to {item.impact.comparison.averageApprovalMinutesAfter ?? "n/a"}m
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-400">
                        Before: cap {item.beforeSnapshot?.capacityLimit ?? "n/a"}, backup {item.beforeSnapshot?.backupApproverTarget || "none"}.
                        After: cap {item.afterSnapshot?.capacityLimit ?? "n/a"}, backup {item.afterSnapshot?.backupApproverTarget || "none"}.
                      </p>
                      {!item.rolledBackAt ? (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => void rollbackPolicy(item.id, item.title)}
                            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                          >
                            Roll back policy
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {approvalRecommendationObservations.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Observation window</p>
                    <p className="mt-1 text-sm text-slate-300">Recommendations waiting for stable evidence or cooling down after rollback.</p>
                  </div>
                  <span className="text-xs text-slate-500">{approvalRecommendationObservations.length} candidates</span>
                </div>
                <div className="mt-4 space-y-3">
                  {approvalRecommendationObservations.map((item) => (
                    <div key={item.recommendationId} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.status)}`}>{item.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        confidence {Math.round(item.lastConfidence * 100)}% • observed {formatTime(item.lastObservedAt)}
                      </p>
                      {item.eligibleSinceAt ? <p className="mt-2 text-xs text-slate-300">eligible since {formatTime(item.eligibleSinceAt)}</p> : null}
                      {item.cooldownUntil ? <p className="mt-2 text-xs text-amber-200">cooldown until {formatTime(item.cooldownUntil)}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(approvalThroughput.targets.length || approvalThroughput.workspaces.length) ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Approval throughput</p>
                    <p className="mt-1 text-sm text-slate-300">Track approval speed, reroute rates, and where the system is spending intervention effort.</p>
                  </div>
                  <span className="text-xs text-slate-500">{approvalThroughput.totals.totalApprovals} tracked approvals</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <Metric label="Resolved" value={String(approvalThroughput.totals.resolvedApprovals)} />
                  <Metric label="Manual Reroutes" value={String(approvalThroughput.totals.manualReroutes)} />
                  <Metric label="Auto Reroutes" value={String(approvalThroughput.totals.autoReroutes)} />
                  <Metric label="Targets" value={String(approvalThroughput.targets.length)} />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">By approver target</p>
                    <div className="mt-3 space-y-3">
                      {approvalThroughput.targets.map((entry) => (
                        <div key={entry.target} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{entry.target}</span>
                            <span className="text-xs text-slate-400">
                              {entry.averageApprovalMs === null ? "No completed approvals" : `${Math.round(entry.averageApprovalMs / 60000)}m avg`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {entry.approved} approved • {entry.rejected} rejected • {entry.pending} pending • {entry.rerouted} manual reroutes • {entry.autoRerouted} auto reroutes
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">By workspace</p>
                    <div className="mt-3 space-y-3">
                      {approvalThroughput.workspaces.map((entry) => (
                        <div key={entry.workspaceId} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{entry.workspaceName}</span>
                            <span className="text-xs text-slate-400">
                              {entry.averageApprovalMs === null ? "No completed approvals" : `${Math.round(entry.averageApprovalMs / 60000)}m avg`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {entry.total} approvals • {entry.rerouted} manual reroutes • {entry.autoRerouted} auto reroutes
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {approvalPressure.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Approval queue pressure</p>
                    <p className="mt-1 text-sm text-slate-300">See which approvers or groups are carrying the most overdue closeout work.</p>
                  </div>
                  <span className="text-xs text-slate-500">{approvalPressure.length} targets</span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {approvalPressure.map((entry) => (
                    <div key={entry.target} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.target}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {entry.pendingCount} pending • {entry.overdueCount} overdue • {entry.escalatedCount} escalated • {entry.finalEscalatedCount} final
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${entry.finalEscalatedCount ? toneClass("critical") : entry.escalatedCount ? toneClass("warning") : toneClass("active")}`}>
                          {Math.round(entry.oldestAgeMs / 60000)}m oldest
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {entry.workspaces.map((item) => (
                          <div key={`${entry.target}-${item.workspaceId}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-white">{item.workspaceName}</span>
                              <span className="text-xs text-slate-400">{Math.round(item.ageMs / 60000)}m</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.requestedStatus} • {item.finalEscalated ? "final escalation" : item.escalated ? "escalated" : item.overdue ? "overdue" : "pending"}
                            </p>
                            {item.approvalId ? (
                              <div className="mt-3 space-y-2">
                                <input
                                  value={approvalTargetDrafts[item.approvalId ?? ""] ?? item.approverTarget ?? entry.target}
                                  onChange={(event) =>
                                    setApprovalTargetDrafts((current) => ({ ...current, [item.approvalId as string]: event.target.value }))
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white outline-none"
                                  placeholder="New approver target"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction(
                                        "approval:reassign-target",
                                        {
                                          approvalId: item.approvalId,
                                          approverTarget: approvalTargetDrafts[item.approvalId ?? ""] ?? item.approverTarget ?? entry.target,
                                        },
                                        `Reassigned ${item.workspaceName} approval.`
                                      )
                                    }
                                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100"
                                  >
                                    Reassign
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void runAction(
                                        "approval:take-over",
                                        { approvalId: item.approvalId },
                                        `Took ownership of ${item.workspaceName} approval.`
                                      )
                                    }
                                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100"
                                  >
                                    Take over
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {demoMode && activeDemoStep && activeDemoStep.workspaceId === workspace.workspaceId ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
                <p className="font-semibold text-white">Demo focus workspace</p>
                <p className="mt-1">
                  This workspace is the current stop in guided mode. Use the controls below to narrate the next part of the platform story.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Members" value={String(workspace.memberCount)} />
              <Metric label="Digest Users" value={String(workspace.digestEnabledUsers)} />
              <Metric label="Due Users" value={String(workspace.dueUsers)} />
              <Metric label="Generated" value={String(workspace.lastGeneratedCount)} />
            </div>

            {workspace.events.some((event) => event.type === "trust-incident-promoted") ? (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                <p className="text-sm font-semibold text-amber-100">Trust incident promoted</p>
                <p className="mt-2 text-sm text-amber-50">
                  Sustained trust degradation was promoted into this workspace incident. The trust timeline is now part of the incident record and closeout flow.
                </p>
              </div>
            ) : null}
            {workspace.events.some((event) => event.type === "trust-incident-recovered") ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-100">Trust incident recovered</p>
                <p className="mt-2 text-sm text-emerald-50">
                  Trust conditions improved enough to move this incident into a closeout-ready state. Review the generated summary and complete the normal incident closeout flow.
                </p>
                {workspace.incidentApproval?.state === "pending" && workspace.incidentApproval?.requestedStatus === "resolved" ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                    Closeout approval requested
                  </p>
                ) : null}
              </div>
            ) : null}
            {workspace.events.some((event) => event.type === "trust-incident-closeout-approved") ? (
              <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
                <p className="text-sm font-semibold text-sky-100">Trust closeout approved</p>
                <p className="mt-2 text-sm text-sky-50">
                  The recovered trust incident has been approved through the normal closeout workflow. Review the refreshed summary for archive guidance and complete any remaining handoff requirements.
                </p>
              </div>
            ) : null}
            {workspace.events.some((event) => event.type === "trust-incident-archived") ? (
              <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-5">
                <p className="text-sm font-semibold text-violet-100">Trust incident archived</p>
                <p className="mt-2 text-sm text-violet-50">
                  This trust incident has completed the full lifecycle. The final recap is preserved in the summary, and the temporary archive-prep guidance has been retired.
                </p>
              </div>
            ) : null}

            <SurfacePanel>
              <SurfacePanelHeader
                badge="Workspace detail"
                title={workspace.workspaceName}
                description={`Last sweep: ${formatTime(workspace.lastSweepRunAt)} • Queued: ${formatTime(workspace.lastSweepQueuedAt)}`}
                className="flex-col lg:flex-row lg:items-center"
                actions={<div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void runAction("collaboration:automation-run-sweep", { workspaceId: workspace.workspaceId }, `Queued a digest sweep for ${workspace.workspaceName}.`)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm text-cyan-100 transition hover:bg-cyan-400/15"
                  >
                    Run Sweep
                  </button>
                  <button
                    type="button"
                    onClick={() => void runAction("collaboration:automation-snooze", { workspaceId: workspace.workspaceId, minutes: 60 }, `Snoozed ${workspace.workspaceName} for 60 minutes.`)}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 text-sm text-amber-100 transition hover:bg-amber-500/15"
                  >
                    Snooze 1h
                  </button>
                </div>}
              />

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Health detail</p>
                  <p className="mt-3 text-sm text-slate-200">Status: <span className="font-semibold text-white">{workspace.status}</span></p>
                  <p className="mt-2 text-sm text-slate-200">Incident status: <span className="font-semibold text-white">{workspace.incidentStatus}</span></p>
                  <p className="mt-2 text-sm text-slate-200">Environment: <span className="font-semibold text-white">{workspace.incidentPolicy.environment}</span></p>
                  <p className="mt-2 text-sm text-slate-200">
                    Policy source: <span className="font-semibold text-white">{workspace.hasPolicyOverride ? "Workspace override" : "Platform default"}</span>
                  </p>
                  {workspace.hasPolicyOverride ? (
                    <p className="mt-2 text-sm text-amber-200">Override summary: {workspace.policyOverrideSummary || "Workspace-specific policy active."}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-200">Missed intervals: <span className="font-semibold text-white">{workspace.overdueIntervals}</span></p>
                  <p className="mt-2 text-sm text-slate-200">Owner: <span className="font-semibold text-white">{workspace.escalationOwner || "Unassigned"}</span></p>
                  <p className="mt-2 text-sm text-slate-200">Required approver: <span className="font-semibold text-white">{workspace.incidentApproverTarget || "Any eligible approver"}</span></p>
                  <p className="mt-2 text-sm text-slate-200">Backup approver: <span className="font-semibold text-white">{workspace.backupApproverTarget || "None"}</span></p>
                  <p className="mt-2 text-sm text-slate-200">
                    Approval reminder SLA: <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalReminderMinutes}m</span>
                    {" "}• Escalates after <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalEscalationMinutes}m</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Escalation target: <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalEscalationTarget || "team"}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Final escalation: <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalFinalEscalationMinutes}m</span>
                    {" "}to <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalFinalEscalationTarget || "team"}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Capacity limit: <span className="font-semibold text-white">{workspace.incidentPolicy.incidentApprovalCapacityLimit}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">Snoozed until: <span className="font-semibold text-white">{formatTime(workspace.snoozedUntil)}</span></p>
                  {workspace.status === "resolved" ? (
                    <p className="mt-3 text-sm text-emerald-200">
                      Resolved by follow-up {workspace.resolutionTaskId} at {formatTime(workspace.resolutionCompletedAt)}.
                    </p>
                  ) : null}
                  {workspace.lastSweepError ? <p className="mt-3 text-sm text-rose-200">Last error: {workspace.lastSweepError}</p> : null}
                </div>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assign owner</p>
                  <input
                    value={ownerDrafts[workspace.workspaceId] ?? workspace.escalationOwner ?? ""}
                    onChange={(event) => setOwnerDrafts((current) => ({ ...current, [workspace.workspaceId]: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Operator name"
                  />
                  <button
                    type="button"
                    onClick={() => void runAction("collaboration:automation-assign", { workspaceId: workspace.workspaceId, owner: ownerDrafts[workspace.workspaceId] ?? workspace.escalationOwner ?? "" }, `Assigned an owner to ${workspace.workspaceName}.`)}
                    className="mt-3 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Save owner
                  </button>
                  <input
                    value={approverDrafts[workspace.workspaceId] ?? workspace.incidentApproverTarget ?? ""}
                    onChange={(event) => setApproverDrafts((current) => ({ ...current, [workspace.workspaceId]: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Approver target (user:pat, name:Pat, role:approver)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-assign-approver",
                        { workspaceId: workspace.workspaceId, approverTarget: approverDrafts[workspace.workspaceId] ?? workspace.incidentApproverTarget ?? "" },
                        `Updated the required approver for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Save approver
                  </button>
                  <input
                    value={backupApproverDrafts[workspace.workspaceId] ?? workspace.backupApproverTarget ?? ""}
                    onChange={(event) => setBackupApproverDrafts((current) => ({ ...current, [workspace.workspaceId]: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Backup approver target"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-assign-backup-approver",
                        { workspaceId: workspace.workspaceId, backupApproverTarget: backupApproverDrafts[workspace.workspaceId] ?? workspace.backupApproverTarget ?? "" },
                        `Updated the backup approver for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Save backup approver
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-create-followup",
                        {
                          workspaceId: workspace.workspaceId,
                          owner: ownerDrafts[workspace.workspaceId] ?? workspace.escalationOwner ?? user?.name ?? "Admin",
                          agentName: "planner",
                        },
                        `Created a follow-up task for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                  >
                    Create follow-up
                  </button>
                  <textarea
                    value={noteDrafts[workspace.workspaceId] ?? ""}
                    onChange={(event) => setNoteDrafts((current) => ({ ...current, [workspace.workspaceId]: event.target.value }))}
                    className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Postmortem note or workspace context"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-add-note",
                        { workspaceId: workspace.workspaceId, note: noteDrafts[workspace.workspaceId] ?? "" },
                        `Added a note for ${workspace.workspaceName}.`
                      ).then(() => setNoteDrafts((current) => ({ ...current, [workspace.workspaceId]: "" })))
                    }
                    className="mt-3 w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Save note
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-generate-summary",
                        { workspaceId: workspace.workspaceId },
                        `Generated an incident summary for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"
                  >
                    Generate summary
                  </button>
                  <select
                    value={workspace.incidentStatus}
                    onChange={(event) =>
                      void runAction(
                        "collaboration:automation-set-status",
                        { workspaceId: workspace.workspaceId, incidentStatus: event.target.value },
                        `Updated incident status for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                  >
                    {["open", "investigating", "ready_for_closeout", "resolved", "shared", "archived"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <input
                    value={shareDrafts[workspace.workspaceId] ?? "team"}
                    onChange={(event) => setShareDrafts((current) => ({ ...current, [workspace.workspaceId]: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Share with target"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-share-summary",
                        { workspaceId: workspace.workspaceId, assignedTo: shareDrafts[workspace.workspaceId] ?? "team" },
                        `Shared the incident summary for ${workspace.workspaceName}.`
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                  >
                    Share summary
                  </button>
                </div>
              </div>
            </SurfacePanel>

            <SurfacePanel>
              <SurfacePanelHeader title="Policy-driven closeout" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Resolve requirements</p>
                  <p className="mt-3 text-sm text-slate-200">
                    Approval: <span className="font-semibold text-white">{workspace.incidentPolicy.requireApprovalForResolved ? "Required" : "Not required"}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Checklist gate: <span className="font-semibold text-white">{workspace.incidentPolicy.requireChecklistForResolved ? "Required" : "Optional"}</span>
                  </p>
                  {workspace.incidentPolicy.requireChecklistForResolved ? (
                    <p className="mt-2 text-sm text-slate-300">
                      Required items: {workspace.incidentPolicy.requiredChecklistForResolved.map((item) => checklistLabel(workspace, item)).join(", ")}
                    </p>
                  ) : null}
                  {workspace.incidentReadiness.resolveBlockers.length ? (
                    <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                      {workspace.incidentReadiness.resolveBlockers[0]}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      This workspace can move to resolved when you are ready.
                    </div>
                  )}
                </div>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Archive requirements</p>
                  <p className="mt-3 text-sm text-slate-200">
                    Approval: <span className="font-semibold text-white">{workspace.incidentPolicy.requireApprovalForArchived ? "Required" : "Not required"}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Summary share: <span className="font-semibold text-white">{workspace.incidentPolicy.requireSummaryShareBeforeArchived ? "Required" : "Optional"}</span>
                  </p>
                  {workspace.incidentReadiness.archiveBlockers.length ? (
                    <div className="mt-3 space-y-2">
                      {workspace.incidentReadiness.archiveBlockers.map((blocker) => (
                        <div key={blocker} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                          {blocker}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                      This workspace can be archived under the current environment policy.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Approval state</p>
                {workspace.incidentApproval ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-200">
                    <p>
                      Current approval: <span className="font-semibold text-white">{workspace.incidentApproval.label}</span>
                    </p>
                    <p>
                      Required approver: <span className="font-semibold text-white">{workspace.incidentApproval.approverTarget || workspace.incidentApproverTarget || "Any eligible approver"}</span>
                    </p>
                    <p>
                      State: <span className="font-semibold text-white">{workspace.incidentApproval.state}</span>
                    </p>
                    <p>
                      Requested by <span className="font-semibold text-white">{workspace.incidentApproval.requestedByName || "Unknown requester"}</span> on {formatTime(workspace.incidentApproval.createdAt)}
                    </p>
                    {workspace.incidentApproval.routingMode ? (
                      <p>
                        Routing: <span className="font-semibold text-white">{workspace.incidentApproval.routingMode}</span>
                        {workspace.incidentApproval.routedFromTarget ? ` from ${workspace.incidentApproval.routedFromTarget}` : ""}
                      </p>
                    ) : null}
                    {workspace.incidentApproval.routingReason ? (
                      <p className="text-slate-300">{workspace.incidentApproval.routingReason}</p>
                    ) : null}
                    {workspace.incidentApproval.requestedStatus === "archived" && workspace.incidentApproval.archiveRationale ? (
                      <SignalEntry
                        title="Archive rationale"
                        className="bg-sky-500/10 border-sky-500/20"
                        body={<span className="text-sky-100">{workspace.incidentApproval.archiveRationale}</span>}
                      />
                    ) : null}
                    {workspace.incidentApproval.approvedByName ? (
                      <p>
                        Approved by <span className="font-semibold text-white">{workspace.incidentApproval.approvedByName}</span> on {formatTime(workspace.incidentApproval.resolvedAt)}
                      </p>
                    ) : null}
                    {workspace.incidentApproval.rejectedByName ? (
                      <p>
                        Rejected by <span className="font-semibold text-white">{workspace.incidentApproval.rejectedByName}</span> on {formatTime(workspace.incidentApproval.resolvedAt)}
                      </p>
                    ) : null}
                    {workspace.incidentApproval.rejectionNote ? (
                      <p className="text-rose-200">Rejection note: {workspace.incidentApproval.rejectionNote}</p>
                    ) : null}
                    {workspace.incidentApproval.state === "pending" ? (
                      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <input
                          value={approvalTargetDrafts[workspace.incidentApproval.id] ?? workspace.incidentApproval.approverTarget ?? workspace.incidentApproverTarget ?? ""}
                          onChange={(event) =>
                            setApprovalTargetDrafts((current) => ({ ...current, [workspace.incidentApproval!.id]: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Reassign approver target"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "approval:reassign-target",
                                {
                                  approvalId: workspace.incidentApproval?.id,
                                  approverTarget:
                                    approvalTargetDrafts[workspace.incidentApproval!.id] ??
                                    workspace.incidentApproval?.approverTarget ??
                                    workspace.incidentApproverTarget ??
                                    "",
                                },
                                `Reassigned the ${workspace.incidentApproval?.requestedStatus || "incident"} approval for ${workspace.workspaceName}.`
                              )
                            }
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"
                          >
                            Reassign approver
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "approval:take-over",
                                { approvalId: workspace.incidentApproval?.id },
                                `Took ownership of the ${workspace.incidentApproval?.requestedStatus || "incident"} approval for ${workspace.workspaceName}.`
                              )
                            }
                            className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
                          >
                            Take ownership
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "approval:approve",
                                { approvalId: workspace.incidentApproval?.id },
                                `Approved the ${workspace.incidentApproval?.requestedStatus || "incident"} transition for ${workspace.workspaceName}.`
                              )
                            }
                            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100"
                          >
                            Approve closeout
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction(
                                "approval:reject",
                                {
                                  approvalId: workspace.incidentApproval?.id,
                                  note: approvalNoteDrafts[workspace.workspaceId] ?? "",
                                },
                                `Rejected the ${workspace.incidentApproval?.requestedStatus || "incident"} transition for ${workspace.workspaceName}.`
                              ).then(() =>
                                setApprovalNoteDrafts((current) => ({ ...current, [workspace.workspaceId]: "" }))
                              )
                            }
                            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                          >
                            Reject closeout
                          </button>
                        </div>
                        <textarea
                          value={approvalNoteDrafts[workspace.workspaceId] ?? ""}
                          onChange={(event) =>
                            setApprovalNoteDrafts((current) => ({
                              ...current,
                              [workspace.workspaceId]: event.target.value,
                            }))
                          }
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                          placeholder="Optional rejection note"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">
                    No closeout approval is currently open for this workspace.
                  </p>
                )}
              </div>
            </SurfacePanel>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Incident summary</p>
                <span className="text-xs text-slate-400">{formatTime(workspace.incidentSummaryUpdatedAt)}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-300/80">Status: {workspace.incidentStatus}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                {workspace.incidentSummary || "No generated summary yet. Use Generate summary to create a concise recap from the workspace timeline."}
              </div>
            </div>

            {workspace.incidentHandoffDraft || workspace.incidentArchiveRecommendation ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Archive prep</p>
                  <span className="text-xs text-slate-400">{formatTime(workspace.incidentHandoffDraftUpdatedAt)}</span>
                </div>
                {workspace.incidentArchiveRecommendation ? (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                    {workspace.incidentArchiveRecommendation}
                  </div>
                ) : null}
                {workspace.incidentHandoffDraft ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                    {workspace.incidentHandoffDraft}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-share-summary",
                        {
                          workspaceId: workspace.workspaceId,
                          assignedTo: shareDrafts[workspace.workspaceId] ?? "team",
                          useHandoffDraft: true,
                        },
                        `Shared the trust recovery handoff for ${workspace.workspaceName}.`
                      )
                    }
                    className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                  >
                    Share trust handoff
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:automation-set-status",
                        { workspaceId: workspace.workspaceId, incidentStatus: "archived" },
                        `Started archive flow for ${workspace.workspaceName}.`
                      )
                    }
                    className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
                  >
                    Archive when ready
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Closeout checklist</p>
              <div className="mt-4 space-y-3">
                {workspace.incidentChecklist.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(event) =>
                        void runAction(
                          "collaboration:automation-checklist-toggle",
                          { workspaceId: workspace.workspaceId, itemId: item.id, completed: event.target.checked },
                          `${event.target.checked ? "Completed" : "Reopened"} ${item.label.toLowerCase()} for ${workspace.workspaceName}.`
                        )
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.completed
                          ? `Completed ${formatTime(item.completedAt)}${item.completedByName ? ` by ${item.completedByName}` : ""}`
                          : "Not completed yet"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Active escalations</p>
              <div className="mt-4 space-y-3">
                {relatedEscalations.length ? (
                  relatedEscalations.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(item.tone)}`}>{item.tone}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                    No active escalations for this workspace right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Follow-up ownership</p>
              <div className="mt-4 space-y-3">
                {relatedFollowups.length ? (
                  relatedFollowups.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{task.description}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {task.agentName} • owner: {task.ownerName || "Unassigned"} • created {formatTime(task.createdAt)}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(task.status)}`}>{task.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                    No follow-up tasks have been created for this workspace yet.
                  </div>
                )}
              </div>
              {workspace.status === "resolved" ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  Resolution trail: {workspace.resolutionDescription || "Completed follow-up"} by {workspace.resolutionOwnerName || "the assigned owner"}.
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Workspace timeline</p>
              <div className="mt-4 space-y-3">
                {workspace.events.length ? (
                  workspace.events.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{event.message}</p>
                        <span className="text-xs text-slate-400">{formatTime(event.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sky-300/80">{event.type}</p>
                      {event.note ? <p className="mt-2 text-sm text-slate-300">{event.note}</p> : null}
                      {event.actorName ? <p className="mt-2 text-xs text-slate-500">by {event.actorName}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                    No workspace events recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Approval history</p>
              <div className="mt-4 space-y-3">
                {workspace.incidentApprovalHistory.length ? (
                  workspace.incidentApprovalHistory.map((approval) => (
                    <div key={approval.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{approval.label}</p>
                        <span className={`rounded-full border px-3 py-1 text-[11px] ${toneClass(approval.status)}`}>{approval.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        Requested by {approval.requestedByName || "Unknown requester"} on {formatTime(approval.createdAt)}
                      </p>
                      {approval.routingMode ? (
                        <p className="mt-2 text-sm text-slate-300">
                          Routed via <span className="font-semibold text-white">{approval.routingMode}</span>
                          {approval.routedFromTarget ? ` from ${approval.routedFromTarget}` : ""}
                        </p>
                      ) : null}
                      {approval.routingReason ? <p className="mt-2 text-sm text-slate-300">{approval.routingReason}</p> : null}
                      {approval.approvedByName ? (
                        <p className="mt-2 text-sm text-emerald-200">
                          Approved by {approval.approvedByName} on {formatTime(approval.resolvedAt)}
                        </p>
                      ) : null}
                      {approval.rejectedByName ? (
                        <p className="mt-2 text-sm text-rose-200">
                          Rejected by {approval.rejectedByName} on {formatTime(approval.resolvedAt)}
                        </p>
                      ) : null}
                      {approval.rejectionNote ? <p className="mt-2 text-sm text-slate-300">{approval.rejectionNote}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                    No incident approvals have been recorded for this workspace yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-slate-300">
            No workspace automation data is available yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <MetricTile label={label} value={value} />;
}
