"use client";

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

type QueueItem = {
  id: string;
  agentName: string;
  status: string;
  priority?: number;
  description: string;
  createdAt: string;
  result?: string | null;
};

type ReviewItem = {
  id: string;
  taskId: string;
  agentName: string;
  status: string;
  decision?: string | null;
  decisionNote?: string | null;
  taskDescription: string;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

type ScheduleItem = {
  agentName: string;
  enabled: boolean;
  cycleCount: number;
  maxCycles: number;
  intervalSeconds: number;
  lastRunAt?: string | null;
  lastError?: string | null;
  stopReason?: string | null;
};

type AlertItem = {
  id: string;
  severity: string;
  status: string;
  title: string;
  owner?: string | null;
  acknowledged?: boolean;
  resolutionNote?: string | null;
};

type AlertSummary = {
  id: string;
  severity: string;
  status: string;
  title: string;
  owner?: string | null;
  acknowledged: boolean;
  resolved: boolean;
  createdAt?: string | null;
};

type WorkloadItem = {
  agentName: string;
  status: string;
  active: boolean;
  queuedTasks: number;
  claimedTasks: number;
  unreadCount: number;
  updatedAt?: string | null;
};

type AgentDetail = {
  agentName: string;
  profile: {
    role: string;
    description: string;
    defaultGoal: string;
    maxStepsPerRun: number;
    cooldownSeconds: number;
    allowShellExecution: boolean;
    allowFileWrite: boolean;
    allowPlanning: boolean;
    tags: string[];
  };
  runtime: {
    active: boolean;
    status: string;
    goal: string;
    currentTask: { id?: string; description?: string } | null;
    lastRunAt: string | null;
    stepCount: number;
    maxSteps: number;
  };
  schedule: {
    enabled: boolean;
    cycleCount: number;
    maxCycles: number;
    intervalSeconds: number;
    lastRunAt?: string | null;
    lastError?: string | null;
    stopReason?: string | null;
  } | null;
  observability: {
    queuedTasks: number;
    claimedTasks: number;
    completedTasks: number;
    pendingReviews: number;
  };
  recentHistory: Array<Record<string, unknown>>;
  recentNotes: string[];
};

type PluginItem = {
  name: string;
  loaded: boolean;
  description?: string | null;
  error?: string | null;
};

type Recommendation = {
  id: string;
  title: string;
  command: string;
  tone: string;
};

type OwnershipSignal = {
  id: string;
  title: string;
  detail: string;
  tone: string;
  command: string;
};

type ActivityItem = {
  timestamp: string;
  event: string;
  message: string;
};

type Overview = {
  system: {
    agentCount: number;
    totalTasks: number;
    queuedTasks: number;
    claimedTasks: number;
    completedTasks: number;
    activeSchedules: number;
    watcherEnabled: boolean;
  };
  health: {
    overall: string;
    queuePressure: string;
    reviewPressure: string;
    watcherStatus: string;
  };
  queue: QueueItem[];
  reviews: ReviewItem[];
  schedules: ScheduleItem[];
  watcher: {
    enabled: boolean;
    intervalSeconds: number;
    lastRunAt: string | null;
    lastError: string | null;
    ruleCount: number;
    rules: Array<{
      name: string;
      agentName: string;
      minQueuedTasks: number;
      scheduleIntervalSeconds: number;
      scheduleMaxCycles: number;
      enabled: boolean;
    }>;
  };
  alerts: {
    activeCount: number;
    items: AlertItem[];
    all: AlertSummary[];
  };
  plugins: PluginItem[];
  workload: WorkloadItem[];
  agentDetails: AgentDetail[];
  trust: {
    lastWatcherRunAt: string | null;
    lastWatcherError: string | null;
    pendingReviews: number;
    activeAlerts: number;
    schedulesWithErrors: number;
  };
  recommendations: Recommendation[];
  ownershipSignals: OwnershipSignal[];
  activity: ActivityItem[];
  automation: {
    alertThresholds: {
      queuedTasksHigh: number;
      pendingReviewsHigh: number;
      inactiveAgentsHigh: number;
    };
    policy: {
      escalation: {
        autoRunWatcherOnPolicySave: boolean;
        autoRunAlertsOnPolicySave: boolean;
        autoAcknowledgeWatcherStopped: boolean;
        preferredAlertOwner: string;
      };
      remediation: {
        allowScheduleRestartRecommendations: boolean;
        allowAlertResolutionRecommendations: boolean;
        allowReviewFollowupRecommendations: boolean;
      };
    };
  };
  telemetry: {
    totals: {
      events: number;
      errors: number;
      approvals: number;
      avgCommandLatencyMs: number;
      avgWatcherLatencyMs: number;
      avgSchedulerLatencyMs: number;
    };
    recent: Array<{
      id: string;
      timestamp: string;
      type: string;
      status: string;
      durationMs: number;
      actorId?: string | null;
      meta?: Record<string, unknown>;
    }>;
    byType: Array<{
      type: string;
      count: number;
    }>;
  };
  jobs: {
    total: number;
    queued: number;
    running: number;
    failed: number;
    metrics: {
      avgQueueWaitMs: number;
      avgRunTimeMs: number;
      completionRate: number;
      retryPressure: number;
      scheduledRetries: number;
    };
    items: Array<{
      id: string;
      type: string;
      status: string;
      actorId?: string | null;
      actorName?: string | null;
      payload?: Record<string, unknown> | null;
      createdAt: string;
      startedAt?: string | null;
      completedAt?: string | null;
      result?: unknown;
      error?: string | null;
      retryCount?: number;
      attempts?: number;
      maxAttempts?: number;
      retryDelayMs?: number;
      nextRetryAt?: string | null;
      canceledAt?: string | null;
      eventCount?: number;
      latestEvent?: {
        id: string;
        timestamp: string;
        level: string;
        message: string;
        meta?: Record<string, unknown>;
      } | null;
      events?: Array<{
        id: string;
        timestamp: string;
        level: string;
        message: string;
        meta?: Record<string, unknown>;
      }>;
    }>;
  };
  collaboration: {
    governance: {
      sensitiveActionsRequireApproval: boolean;
    };
    sharedSessions: Array<{
      id: string;
      name: string;
      draftCommand: string;
      macros: Macro[];
      ownerId: string;
      ownerName: string;
      sharedWith: string[];
      updatedAt: string;
      createdAt: string;
    }>;
    handoffs: Array<{
      id: string;
      title: string;
      note: string;
      assignedTo: string;
      assignedById: string;
      assignedByName: string;
      kind?: string;
      workspaceId?: string | null;
      relatedApprovalId?: string | null;
      status: string;
      createdAt: string;
      closedAt?: string;
    }>;
    approvals: Array<{
      id: string;
      action: string;
      payload: Record<string, unknown>;
      label: string;
      requestedById: string;
      requestedByName: string;
      status: string;
      createdAt: string;
      resolvedAt?: string;
      approvedByName?: string;
      rejectedByName?: string;
      rejectionNote?: string;
    }>;
    inbox: Array<{
      id: string;
      type: string;
      status: string;
      tone: string;
      title: string;
      detail: string;
      command?: string;
      handoffId?: string;
      approvalId?: string;
      relatedApprovalId?: string;
      kind?: string;
      workspaceId?: string;
      workspaceName?: string;
      owner?: string | null;
      snoozedUntil?: string | null;
      createdAt?: string | null;
      read?: boolean;
      acknowledged?: boolean;
      updatedAt?: string;
      recordedAt?: string;
    }>;
    notificationHistory: Array<{
      id: string;
      type: string;
      status: string;
      tone: string;
      title: string;
      detail: string;
      command?: string;
      handoffId?: string;
      approvalId?: string;
      workspaceId?: string;
      workspaceName?: string;
      owner?: string | null;
      snoozedUntil?: string | null;
      read?: boolean;
      acknowledged?: boolean;
      updatedAt?: string;
      recordedAt?: string;
    }>;
    notificationDigest: {
      open: number;
      unread: number;
      acknowledged: number;
      ownership: number;
      handoffs: number;
      approvals: number;
    };
    digestPreferences: {
      enabled: boolean;
      cadence: string;
      preferredChannel: string;
      includeTrustReport?: boolean;
      trustAudience?: string;
      trustEnvironment?: string;
      immediateOnTrustDrop?: boolean;
      updatedAt?: string;
    };
    digestRuns: Array<{
      id: string;
      createdAt: string;
      summary: string;
      report?: string;
      reportType?: string;
      stats: {
        open?: number;
        unread?: number;
        acknowledged?: number;
        ownership?: number;
        handoffs?: number;
        approvals?: number;
        trust?: number;
      };
      highlights: string[];
    }>;
    digestScheduler: {
      enabled: boolean;
      intervalMs: number;
      lastRunAt: string | null;
      lastResult?: {
        ok?: boolean;
        workspaceCount?: number;
        queuedJobCount?: number;
        queuedJobIds?: string[];
      } | null;
      lastError: string | null;
    };
    digestEscalations: Array<{
      id: string;
      tone: string;
      title: string;
      detail: string;
      command: string;
    }>;
    digestWorkspaceHealth: Array<{
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
      snoozedUntil: string | null;
      resolutionTaskId: string | null;
      resolutionCompletedAt: string | null;
      resolutionDescription: string | null;
      resolutionOwnerName: string | null;
      incidentSummary: string | null;
      incidentSummaryUpdatedAt: string | null;
      incidentApproverTarget?: string | null;
      incidentApprovalSla?: {
        ageMs: number;
        reminderDelayMs: number;
        overdue: boolean;
        targetAt: string;
      } | null;
      overdueIntervals: number;
      status: string;
    }>;
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
    currentUser: {
      id: string;
      name: string;
      role: string;
    };
    permissions: {
      canExecuteCommands: boolean;
      canApprove: boolean;
      canManageGovernance: boolean;
    };
    environmentPolicy: {
      currentEnvironment: string;
      minimumRoleForCommands: string;
      minimumRoleForApprovals: string;
      minimumRoleForGovernance: string;
    };
  };
};

type ApiResponse = {
  ok: boolean;
  output?: string;
  error?: string;
  detail?: {
    job?: Overview["jobs"]["items"][number];
  };
  overview: Overview;
};

type HistoryEntry = {
  id: string;
  command: string;
  output: string;
  ok: boolean;
  createdAt: string;
  kind: "command" | "action";
};

type Macro = {
  name: string;
  command: string;
};

type SessionPreset = {
  name: string;
  draftCommand: string;
  macros: Macro[];
};

type Toast = {
  id: string;
  tone: "success" | "warning" | "error";
  message: string;
};

type TabKey = "dashboard" | "console" | "workflows" | "ops";

const HISTORY_KEY = "ai-console-command-history";
const MACRO_KEY = "ai-console-macros";
const SESSION_KEY = "ai-console-sessions";
const MAX_HISTORY = 14;

const COMMANDS = [
  "help",
  "agents:list",
  "agent:status researcher",
  "agent:start researcher",
  "agent:tick researcher",
  "agent:stop researcher",
  "manager:route Compare top open-source eval frameworks",
  "brief:list",
  "brief:create Market scan | Compare local-first note apps",
  "brief:route brief_123",
  "report:list",
  "report:create brief_123 | Executive memo",
  "report:publish report_123",
  "review:create task_123",
  "queue:list",
  "inbox:list",
  "inbox:digest",
  "inbox:history",
  "ownership:signals",
  "dashboard:health",
  "digest:health",
  "schedule:list",
  "watcher:run",
  "review:list",
  "alerts:active",
  "plugins",
  "run plugin projectReportPlugin .",
];

const DEFAULT_MACROS: Macro[] = [
  { name: "Desk Health", command: "dashboard:health" },
  { name: "Workload", command: "dashboard:workload" },
  { name: "Signals", command: "alerts:active" },
];

const DEFAULT_SESSIONS: SessionPreset[] = [
  { name: "Brief Triage", draftCommand: "dashboard:health", macros: DEFAULT_MACROS },
  {
    name: "Scout Loop",
    draftCommand: "agent:tick researcher",
    macros: [
      { name: "Scout Status", command: "agent:status researcher" },
      { name: "Scout Tick", command: "agent:tick researcher" },
      { name: "Review Queue", command: "review:list" },
    ],
  },
];

const TAB_LABELS: Record<TabKey, string> = {
  dashboard: "Briefing",
  console: "Console",
  workflows: "Pipeline",
  ops: "Operations",
};

const EMPTY_OVERVIEW: Overview = {
  system: {
    agentCount: 0,
    totalTasks: 0,
    queuedTasks: 0,
    claimedTasks: 0,
    completedTasks: 0,
    activeSchedules: 0,
    watcherEnabled: false,
  },
  health: {
    overall: "unknown",
    queuePressure: "unknown",
    reviewPressure: "unknown",
    watcherStatus: "unknown",
  },
  queue: [],
  reviews: [],
  schedules: [],
  watcher: {
    enabled: false,
    intervalSeconds: 0,
    lastRunAt: null,
    lastError: null,
    ruleCount: 0,
    rules: [],
  },
  alerts: {
    activeCount: 0,
    items: [],
    all: [],
  },
  plugins: [],
  workload: [],
  agentDetails: [],
  trust: {
    lastWatcherRunAt: null,
    lastWatcherError: null,
    pendingReviews: 0,
    activeAlerts: 0,
    schedulesWithErrors: 0,
  },
  recommendations: [],
  ownershipSignals: [],
  activity: [],
  automation: {
    alertThresholds: {
      queuedTasksHigh: 6,
      pendingReviewsHigh: 4,
      inactiveAgentsHigh: 2,
    },
    policy: {
      escalation: {
        autoRunWatcherOnPolicySave: false,
        autoRunAlertsOnPolicySave: false,
        autoAcknowledgeWatcherStopped: false,
        preferredAlertOwner: "manager",
      },
      remediation: {
        allowScheduleRestartRecommendations: true,
        allowAlertResolutionRecommendations: true,
        allowReviewFollowupRecommendations: true,
      },
    },
  },
  telemetry: {
    totals: {
      events: 0,
      errors: 0,
      approvals: 0,
      avgCommandLatencyMs: 0,
      avgWatcherLatencyMs: 0,
      avgSchedulerLatencyMs: 0,
    },
    recent: [],
    byType: [],
  },
  jobs: {
    total: 0,
    queued: 0,
    running: 0,
    failed: 0,
    metrics: {
      avgQueueWaitMs: 0,
      avgRunTimeMs: 0,
      completionRate: 0,
      retryPressure: 0,
      scheduledRetries: 0,
    },
    items: [],
  },
  collaboration: {
    governance: {
      sensitiveActionsRequireApproval: true,
    },
    sharedSessions: [],
    handoffs: [],
    approvals: [],
    inbox: [],
    notificationHistory: [],
    notificationDigest: {
      open: 0,
      unread: 0,
      acknowledged: 0,
      ownership: 0,
      handoffs: 0,
      approvals: 0,
    },
    digestPreferences: {
      enabled: false,
      cadence: "manual",
      preferredChannel: "inbox",
      includeTrustReport: false,
    },
    digestRuns: [],
    digestScheduler: {
      enabled: false,
      intervalMs: 60000,
      lastRunAt: null,
      lastResult: null,
      lastError: null,
    },
    digestEscalations: [],
    digestWorkspaceHealth: [],
    automationFollowups: [],
    currentUser: {
      id: "demo",
      name: "Demo User",
      role: "admin",
    },
    permissions: {
      canExecuteCommands: true,
      canApprove: true,
      canManageGovernance: true,
    },
    environmentPolicy: {
      currentEnvironment: "development",
      minimumRoleForCommands: "operator",
      minimumRoleForApprovals: "approver",
      minimumRoleForGovernance: "admin",
    },
  },
};

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value?: string | null) {
  if (!value) {
    return "Waiting";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toneClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("error") || normalized.includes("critical") || normalized.includes("high")) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  }

  if (
    normalized.includes("warning") ||
    normalized.includes("moderate") ||
    normalized.includes("queued") ||
    normalized.includes("pending")
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }

  if (normalized.includes("healthy") || normalized.includes("active") || normalized.includes("ok")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }

  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
}

function outputParts(output: string) {
  const trimmed = output.trim();
  const lines = trimmed.split("\n");
  if (lines.length > 1 && (lines[1].startsWith("{") || lines[1].startsWith("["))) {
    try {
      return { title: lines[0], json: JSON.parse(lines.slice(1).join("\n")) };
    } catch {}
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { title: null, json: JSON.parse(trimmed) };
    } catch {}
  }

  return { title: null, text: output };
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) {
    return "Waiting";
  }

  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff < 0) {
    return "Waiting";
  }

  return `${diff}ms`;
}

function renderObject(value: unknown) {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pushToast(setter: Dispatch<SetStateAction<Toast[]>>, toast: Toast) {
  setter((items) => [toast, ...items].slice(0, 4));
}

function pushHistory(
  setter: Dispatch<SetStateAction<HistoryEntry[]>>,
  entry: HistoryEntry
) {
  setter((items) => [entry, ...items].slice(0, MAX_HISTORY));
}

async function getOverview() {
  const response = await fetch("/api/console", { cache: "no-store" });
  return (await response.json()) as ApiResponse;
}

async function postConsole(body: Record<string, unknown>) {
  const response = await fetch("/api/console", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return (await response.json()) as ApiResponse;
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.82),rgba(9,9,11,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="mb-4 min-w-0">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 break-words text-sm text-zinc-400">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 break-words text-sm text-zinc-400">{detail}</p>
    </div>
  );
}

export default function Terminal() {
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW);
  const [previousOverview, setPreviousOverview] = useState<Overview | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [macros, setMacros] = useState<Macro[]>(DEFAULT_MACROS);
  const [sessions, setSessions] = useState<SessionPreset[]>(DEFAULT_SESSIONS);
  const [sessionName, setSessionName] = useState("");
  const [command, setCommand] = useState("");
  const [macroName, setMacroName] = useState("");
  const [pluginArgs, setPluginArgs] = useState<Record<string, string>>({});
  const [shareTargets, setShareTargets] = useState("team");
  const [handoffDraft, setHandoffDraft] = useState({ title: "", note: "", assignedTo: "team" });
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<Overview["jobs"]["items"][number] | null>(null);
  const [agentProfileDrafts, setAgentProfileDrafts] = useState<Record<string, Partial<AgentDetail["profile"]>>>({});
  const [watcherRuleDrafts, setWatcherRuleDrafts] = useState<Record<string, Overview["watcher"]["rules"][number]>>({});
  const [newWatcherRule, setNewWatcherRule] = useState({
    name: "",
    agentName: "researcher",
    minQueuedTasks: "1",
    scheduleIntervalSeconds: "4",
    scheduleMaxCycles: "3",
    enabled: true,
  });
  const [alertThresholdDraft, setAlertThresholdDraft] = useState({
    queuedTasksHigh: "6",
    pendingReviewsHigh: "4",
    inactiveAgentsHigh: "2",
  });
  const [automationPolicyDraft, setAutomationPolicyDraft] = useState({
    autoRunWatcherOnPolicySave: false,
    autoRunAlertsOnPolicySave: false,
    autoAcknowledgeWatcherStopped: false,
    preferredAlertOwner: "manager",
    allowScheduleRestartRecommendations: true,
    allowAlertResolutionRecommendations: true,
    allowReviewFollowupRecommendations: true,
  });
  const [createTask, setCreateTask] = useState({ agentName: "researcher", description: "", priority: "3" });
  const [routeTask, setRouteTask] = useState("Compare the top local-first knowledge base tools for small teams.");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [followups, setFollowups] = useState<Record<string, { agentName: string; description: string }>>({});
  const [alertNotes, setAlertNotes] = useState<Record<string, string>>({});
  const [automationOwnerDrafts, setAutomationOwnerDrafts] = useState<Record<string, string>>({});
  const [queueFilter, setQueueFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("");
  const [historyFilter, setHistoryFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [jobLogFilter, setJobLogFilter] = useState("");
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "acknowledged">("all");
  const [notificationQuery, setNotificationQuery] = useState("");
  const [digestDraft, setDigestDraft] = useState({
    enabled: false,
    cadence: "manual",
    preferredChannel: "inbox",
    includeTrustReport: false,
    trustAudience: "self",
    trustEnvironment: "all",
    immediateOnTrustDrop: false,
  });
  const [layoutMode, setLayoutMode] = useState<"comfort" | "dense">("comfort");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState("connecting");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const deferredCommand = useDeferredValue(command);
  const handleShortcutExecute = useEffectEvent(() => {
    void executeCommand(command);
  });

  useEffect(() => {
    setHistory(readStore(HISTORY_KEY, [] as HistoryEntry[]));
    setMacros(readStore(MACRO_KEY, DEFAULT_MACROS));
    setSessions(readStore(SESSION_KEY, DEFAULT_SESSIONS));
  }, []);

  useEffect(() => {
    setAlertThresholdDraft({
      queuedTasksHigh: String(overview.automation.alertThresholds.queuedTasksHigh),
      pendingReviewsHigh: String(overview.automation.alertThresholds.pendingReviewsHigh),
      inactiveAgentsHigh: String(overview.automation.alertThresholds.inactiveAgentsHigh),
    });
    setAutomationPolicyDraft({
      autoRunWatcherOnPolicySave: overview.automation.policy.escalation.autoRunWatcherOnPolicySave,
      autoRunAlertsOnPolicySave: overview.automation.policy.escalation.autoRunAlertsOnPolicySave,
      autoAcknowledgeWatcherStopped: overview.automation.policy.escalation.autoAcknowledgeWatcherStopped,
      preferredAlertOwner: overview.automation.policy.escalation.preferredAlertOwner,
      allowScheduleRestartRecommendations: overview.automation.policy.remediation.allowScheduleRestartRecommendations,
      allowAlertResolutionRecommendations: overview.automation.policy.remediation.allowAlertResolutionRecommendations,
      allowReviewFollowupRecommendations: overview.automation.policy.remediation.allowReviewFollowupRecommendations,
    });
    setWatcherRuleDrafts(
      Object.fromEntries(
        overview.watcher.rules.map((rule) => [rule.name, rule])
      )
    );
    setDigestDraft({
      enabled: overview.collaboration.digestPreferences.enabled,
      cadence: overview.collaboration.digestPreferences.cadence,
      preferredChannel: overview.collaboration.digestPreferences.preferredChannel,
      includeTrustReport: Boolean(overview.collaboration.digestPreferences.includeTrustReport),
      trustAudience: overview.collaboration.digestPreferences.trustAudience || "self",
      trustEnvironment: overview.collaboration.digestPreferences.trustEnvironment || "all",
      immediateOnTrustDrop: Boolean(overview.collaboration.digestPreferences.immediateOnTrustDrop),
    });
  }, [overview.automation, overview.watcher.rules, overview.collaboration.digestPreferences]);

  useEffect(() => {
    writeStore(HISTORY_KEY, history.slice(0, MAX_HISTORY));
  }, [history]);

  useEffect(() => {
    writeStore(MACRO_KEY, macros);
  }, [macros]);

  useEffect(() => {
    writeStore(SESSION_KEY, sessions);
  }, [sessions]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const payload = await getOverview();
        if (cancelled) {
          return;
        }

        setOverview(payload.overview);
        setPreviousOverview(payload.overview);
        setLastSyncAt(new Date().toISOString());
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load console.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/console/stream");
    setStreamStatus("connecting");

    source.addEventListener("overview", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { overview: Overview; sentAt: string };
      startTransition(() => {
        setPreviousOverview((current) => current ?? payload.overview);
        setOverview((current) => {
          const next = payload.overview;
          if (current.alerts.activeCount < next.alerts.activeCount) {
            pushToast(setToasts, { id: id(), tone: "warning", message: "New research signal detected." });
          }
          if (current.ownershipSignals.length < next.ownershipSignals.length) {
            pushToast(setToasts, { id: id(), tone: "warning", message: "Workspace ownership risk needs attention." });
          }
          if (current.collaboration.inbox.length < next.collaboration.inbox.length) {
            pushToast(setToasts, { id: id(), tone: "warning", message: "New inbox item is waiting for the team." });
          }
          if (current.reviews.length < next.reviews.length) {
            pushToast(setToasts, { id: id(), tone: "warning", message: "New editorial review entered the inbox." });
          }
          return next;
        });
        setLastSyncAt(payload.sentAt);
        setStreamStatus("live");
        setError(null);
      });
    });

    source.onerror = () => {
      setStreamStatus("reconnecting");
    };

    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((items) => items.slice(0, -1));
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((current) => !current);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleShortcutExecute();
        return;
      }

      if (event.altKey && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        setActiveTab((["dashboard", "console", "workflows", "ops"] as TabKey[])[Number(event.key) - 1]);
        return;
      }

      if (event.key === "/" && event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !event.target.isContentEditable) {
          event.preventDefault();
          commandInputRef.current?.focus();
        }
      }

      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setSelectedAgentName(null);
        setSelectedJobId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const suggestions = useMemo(() => {
    const query = deferredCommand.trim().toLowerCase();
    if (!query) {
      return COMMANDS;
    }

    return COMMANDS.filter((item) => item.toLowerCase().includes(query)).slice(0, 6);
  }, [deferredCommand]);

  const filteredHistory = useMemo(() => {
    const query = historyFilter.trim().toLowerCase();
    if (!query) {
      return history;
    }

    return history.filter((entry) => {
      return entry.command.toLowerCase().includes(query) || entry.output.toLowerCase().includes(query);
    });
  }, [history, historyFilter]);

  const filteredQueue = useMemo(() => {
    if (queueFilter === "all") {
      return overview.queue;
    }

    return overview.queue.filter((item) => item.status.toLowerCase() === queueFilter);
  }, [overview.queue, queueFilter]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") {
      return overview.reviews;
    }

    return overview.reviews.filter((item) => {
      if (reviewFilter === "pending") {
        return item.status.toLowerCase() === "pending";
      }

      if (reviewFilter === "reviewed") {
        return item.status.toLowerCase() === "reviewed";
      }

      return (item.decision || "").toLowerCase() === reviewFilter;
    });
  }, [overview.reviews, reviewFilter]);

  const filteredActivity = useMemo(() => {
    const query = activityFilter.trim().toLowerCase();
    if (!query) {
      return overview.activity;
    }

    return overview.activity.filter((item) => {
      return item.event.toLowerCase().includes(query) || item.message.toLowerCase().includes(query);
    });
  }, [overview.activity, activityFilter]);

  const filteredNotificationHistory = useMemo(() => {
    const query = notificationQuery.trim().toLowerCase();
    return overview.collaboration.notificationHistory.filter((item) => {
      if (notificationFilter === "unread" && item.read) {
        return false;
      }
      if (notificationFilter === "acknowledged" && !item.acknowledged) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${item.title} ${item.detail} ${item.type} ${item.status}`.toLowerCase().includes(query);
    });
  }, [notificationFilter, notificationQuery, overview.collaboration.notificationHistory]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentName) {
      return null;
    }

    return overview.agentDetails.find((item) => item.agentName === selectedAgentName) || null;
  }, [overview.agentDetails, selectedAgentName]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) {
      return null;
    }

    return selectedJobDetail || overview.jobs.items.find((item) => item.id === selectedJobId) || null;
  }, [overview.jobs.items, selectedJobDetail, selectedJobId]);

  const filteredJobs = useMemo(() => {
    const query = jobFilter.trim().toLowerCase();
    if (!query) {
      return overview.jobs.items;
    }

    return overview.jobs.items.filter((job) => {
      return (
        job.id.toLowerCase().includes(query) ||
        job.type.toLowerCase().includes(query) ||
        job.status.toLowerCase().includes(query) ||
        String(job.actorName || job.actorId || "").toLowerCase().includes(query) ||
        String(job.latestEvent?.message || "").toLowerCase().includes(query)
      );
    });
  }, [jobFilter, overview.jobs.items]);

  const filteredJobEvents = useMemo(() => {
    const events = selectedJob?.events || [];
    const query = jobLogFilter.trim().toLowerCase();
    const ordered = events.slice().reverse();
    if (!query) {
      return ordered;
    }

    return ordered.filter((event) => {
      return (
        event.level.toLowerCase().includes(query) ||
        event.message.toLowerCase().includes(query) ||
        renderObject(event.meta).toLowerCase().includes(query)
      );
    });
  }, [jobLogFilter, selectedJob]);

  const paletteItems = useMemo(() => {
    const groups = [
      ...overview.recommendations.map((item) => ({
        key: `recommendation:${item.id}`,
        label: item.title,
        value: item.command,
        meta: "recommendation",
      })),
      ...macros.map((macro) => ({
        key: `macro:${macro.name}`,
        label: macro.name,
        value: macro.command,
        meta: "macro",
      })),
      ...sessions.map((session) => ({
        key: `session:${session.name}`,
        label: session.name,
        value: session.draftCommand,
        meta: "session",
      })),
      ...COMMANDS.map((commandItem) => ({
        key: `command:${commandItem}`,
        label: commandItem,
        value: commandItem,
        meta: "command",
      })),
    ];

    const query = paletteQuery.trim().toLowerCase();
    if (!query) {
      return groups.slice(0, 16);
    }

    return groups
      .filter((item) => item.label.toLowerCase().includes(query) || item.value.toLowerCase().includes(query))
      .slice(0, 16);
  }, [macros, overview.recommendations, paletteQuery, sessions]);

  async function refresh() {
    try {
      const payload = await getOverview();
      setPreviousOverview(overview);
      setOverview(payload.overview);
      setLastSyncAt(new Date().toISOString());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Refresh failed.");
    }
  }

  async function executeCommand(commandText: string, kind: HistoryEntry["kind"] = "command") {
    const trimmed = commandText.trim();
    if (!trimmed) {
      return;
    }

    try {
      setRunning(true);
      const payload = await postConsole({ command: trimmed });
      setPreviousOverview(overview);
      setOverview(payload.overview);
      setLastSyncAt(new Date().toISOString());
      const output = payload.ok ? payload.output || "(no output)" : payload.error || "Command failed.";
      pushHistory(setHistory, { id: id(), command: trimmed, output, ok: payload.ok, createdAt: new Date().toISOString(), kind });
      setCommand("");
      pushToast(setToasts, { id: id(), tone: payload.ok ? "success" : "error", message: output });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Command failed.";
      setError(message);
    } finally {
      setRunning(false);
    }
  }

  async function runAction(action: string, payload: Record<string, unknown>, label: string) {
    try {
      setRunning(true);
      const response = await postConsole({ action, payload });
      setPreviousOverview(overview);
      setOverview(response.overview);
      setLastSyncAt(new Date().toISOString());
      const output = response.ok ? response.output || label : response.error || "Action failed.";
      pushHistory(setHistory, { id: id(), command: label, output, ok: response.ok, createdAt: new Date().toISOString(), kind: "action" });
      pushToast(setToasts, { id: id(), tone: response.ok ? "success" : "error", message: output });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setRunning(false);
    }
  }

  async function loadJobDetail(jobId: string) {
    try {
      const response = await postConsole({ action: "job:detail", payload: { jobId } });
      if (response.ok && response.detail?.job) {
        setSelectedJobDetail(response.detail.job);
      } else if (!response.ok) {
        setError(response.error || `Unable to load job ${jobId}.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load job detail.");
    }
  }

  async function runProtectedAction(
    prompt: string,
    action: string,
    payload: Record<string, unknown>,
    label: string
  ) {
    if (typeof window !== "undefined" && !window.confirm(prompt)) {
      return;
    }

    await runAction(action, payload, label);
  }

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobDetail(null);
      setJobLogFilter("");
      return;
    }

    void loadJobDetail(selectedJobId);
  }, [selectedJobId, lastSyncAt]);

  function updateAgentDraft(agentName: string, patch: Partial<AgentDetail["profile"]>) {
    setAgentProfileDrafts((current) => ({
      ...current,
      [agentName]: {
        ...(current[agentName] || {}),
        ...patch,
      },
    }));
  }

  function saveMacro() {
    const nextName = macroName.trim();
    const nextCommand = command.trim();
    if (!nextName || !nextCommand) {
      return;
    }

    setMacros((items) => [{ name: nextName, command: nextCommand }, ...items.filter((item) => item.name !== nextName)].slice(0, 8));
    setMacroName("");
  }

  function saveSession() {
    const name = sessionName.trim();
    if (!name) {
      return;
    }

    setSessions((items) => [
      { name, draftCommand: command || "dashboard:health", macros },
      ...items.filter((item) => item.name !== name),
    ].slice(0, 6));
    setSessionName("");
  }

  async function shareCurrentSession() {
    const trimmedName = sessionName.trim() || "Live Console Session";
    await runAction(
      "collaboration:share-session",
      {
        name: trimmedName,
        draftCommand: command || "dashboard:health",
        macros,
        sharedWith: shareTargets
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      `share-session ${trimmedName}`
    );
  }

  const queueChange = previousOverview ? overview.system.queuedTasks - previousOverview.system.queuedTasks : 0;
  const completedChange = previousOverview ? overview.system.completedTasks - previousOverview.system.completedTasks : 0;

  return (
    <div className={`min-w-0 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(3,7,18,0.98))] text-zinc-100 shadow-[0_36px_120px_rgba(0,0,0,0.55)] ${layoutMode === "dense" ? "p-3 sm:p-4" : "p-4 sm:p-6"}`}>
      <div className={`min-w-0 grid xl:grid-cols-[minmax(0,1.65fr)_minmax(0,0.95fr)] ${layoutMode === "dense" ? "gap-4" : "gap-5"}`}>
        <div className="min-w-0 space-y-5">
          <div className="min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="break-words text-xs uppercase tracking-[0.28em] text-cyan-300/80">Operations Console</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Run your research desk like a live editorial room</h2>
                <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-zinc-400">
                  Streaming briefs, guided routing, review inbox actions, signal recovery, and saved sessions in one browser surface.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${toneClass(streamStatus)}`}>
                  Stream {streamStatus}
                </span>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  Command Palette
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode((current) => (current === "comfort" ? "dense" : "comfort"))}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  {layoutMode === "comfort" ? "Dense Mode" : "Comfort Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Stat label="Briefs" value={overview.system.queuedTasks} detail={`Delta ${queueChange >= 0 ? "+" : ""}${queueChange}`} />
              <Stat label="Completed" value={overview.system.completedTasks} detail={`Delta ${completedChange >= 0 ? "+" : ""}${completedChange}`} />
              <Stat label="Reviews" value={overview.trust.pendingReviews} detail={`Pressure ${overview.health.reviewPressure}`} />
              <Stat label="Signals" value={overview.trust.activeAlerts} detail={`Watcher ${overview.health.watcherStatus}`} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["dashboard", "console", "workflows", "ops"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                    activeTab === tab ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
            <p className="mt-3 break-words text-xs text-zinc-500">
              Shortcuts: <span className="text-zinc-300">Ctrl/Cmd+K</span> command palette, <span className="text-zinc-300">Ctrl/Cmd+Enter</span> run command, <span className="text-zinc-300">Alt+1..4</span> switch tabs, <span className="text-zinc-300">/</span> focus input.
            </p>
          </div>

          <Panel title="Command Desk" note="Power-user commands stay available, but the interface treats them like first-class research tools.">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void executeCommand(command);
              }}
            >
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="flex-1 rounded-2xl border border-cyan-400/20 bg-zinc-950/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300">$</span>
                      <input
                        ref={commandInputRef}
                        value={command}
                        onChange={(event) => setCommand(event.target.value)}
                        placeholder="Try: manager:route Compare open-source agent runtimes"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={running}
                    className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-cyan-200 disabled:opacity-60"
                  >
                    {running ? "Running..." : "Execute"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-zinc-500">Shortcuts: press `/` to focus the command bar and `Ctrl+Enter` or `Cmd+Enter` to run.</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Suggestions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCommand(item)}
                        className="max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-2 text-left text-sm text-zinc-300 transition whitespace-normal break-words hover:border-cyan-400/40 hover:text-white"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Macros</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={macroName}
                      onChange={(event) => setMacroName(event.target.value)}
                      placeholder="Macro name"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button type="button" onClick={saveMacro} className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm">
                      Save
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {macros.map((macro) => (
                      <button
                        key={`${macro.name}:${macro.command}`}
                        type="button"
                        onClick={() => void executeCommand(macro.command)}
                        className="max-w-full rounded-full border border-white/10 bg-black/25 px-3 py-2 text-left text-sm text-zinc-200 transition whitespace-normal break-words hover:bg-black/40"
                      >
                        {macro.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </Panel>

          {activeTab === "dashboard" ? (
            <Panel title="Live Briefing" note="Health signals, recommended next steps, and desk activity update through the stream.">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Health</p>
                  <div className="mt-4 space-y-3">
                    {Object.entries(overview.health).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
                        <span className="text-sm capitalize text-zinc-300">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(String(value))}`}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recommended Next Actions</p>
                  <div className="mt-4 space-y-3">
                    {overview.recommendations.length ? (
                      overview.recommendations.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void executeCommand(item.command, "action")}
                          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition hover:bg-black/40"
                        >
                          <span className="text-sm text-zinc-100">{item.title}</span>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(item.tone)}`}>{item.command}</span>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                        No urgent follow-up detected right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Assignment Watchlist</p>
                  <span className="text-xs text-zinc-500">{overview.ownershipSignals.length} active</span>
                </div>
                <div className="mt-4 space-y-3">
                  {overview.ownershipSignals.length ? (
                    overview.ownershipSignals.map((signal) => (
                      <button
                        key={signal.id}
                        type="button"
                        onClick={() => void executeCommand(signal.command, "action")}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:bg-black/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{signal.title}</p>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(signal.tone)}`}>{signal.tone}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{signal.detail}</p>
                        <p className="mt-3 text-xs text-cyan-200">{signal.command}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                      Workspace assignments look balanced right now.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {overview.workload.map((agent) => (
                  <div
                    key={agent.agentName}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAgentName(agent.agentName)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedAgentName(agent.agentName);
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium text-white">{agent.agentName}</h3>
                      <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(agent.active ? "active" : agent.status)}`}>
                        {agent.active ? "active" : agent.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-black/30 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queued</p>
                        <p className="mt-2 text-lg font-semibold text-white">{agent.queuedTasks}</p>
                      </div>
                      <div className="rounded-xl bg-black/30 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Claimed</p>
                        <p className="mt-2 text-lg font-semibold text-white">{agent.claimedTasks}</p>
                      </div>
                      <div className="rounded-xl bg-black/30 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Unread</p>
                        <p className="mt-2 text-lg font-semibold text-white">{agent.unreadCount}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={(event) => {
                        event.stopPropagation();
                        void executeCommand(`agent:status ${agent.agentName}`);
                      }} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300">
                        Inspect
                      </button>
                      <button type="button" onClick={(event) => {
                        event.stopPropagation();
                        void executeCommand(`agent:tick ${agent.agentName}`);
                      }} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                        Tick
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {activeTab === "console" ? (
            <Panel title="Structured Output" note="Command history renders payloads in a readable format instead of a flat terminal dump.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    value={historyFilter}
                    onChange={(event) => setHistoryFilter(event.target.value)}
                    placeholder="Filter command history"
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                {filteredHistory.length ? (
                  filteredHistory.map((entry) => {
                    const parts = outputParts(entry.output);
                    return (
                      <article key={entry.id} className="rounded-2xl border border-white/10 bg-zinc-950/75 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(entry.ok ? "ok" : "error")}`}>
                              {entry.kind}
                            </span>
                            <code className="text-sm text-cyan-200">{entry.command}</code>
                          </div>
                          <span className="text-xs text-zinc-500">{formatTime(entry.createdAt)}</span>
                        </div>
                        {parts.title ? <p className="mt-4 text-sm text-zinc-200">{parts.title}</p> : null}
                        {"json" in parts ? (
                          <details className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3" open>
                            <summary className="cursor-pointer text-sm text-zinc-300">Structured payload</summary>
                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-zinc-200">
                              {JSON.stringify(parts.json, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-zinc-200">{parts.text}</pre>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
                    {loading ? "Loading console state..." : "Run a command or workflow action to build a visible research trail."}
                  </div>
                )}
              </div>
            </Panel>
          ) : null}

          {activeTab === "workflows" ? (
            <Panel title="Research Pipeline" note="Common desk actions have forms and buttons, so you do not need to remember command syntax to move a brief forward.">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Create Brief</p>
                  <div className="mt-4 space-y-3">
                    <input value={createTask.agentName} onChange={(event) => setCreateTask((current) => ({ ...current, agentName: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none" placeholder="Assigned lane or agent" />
                    <textarea value={createTask.description} onChange={(event) => setCreateTask((current) => ({ ...current, description: event.target.value }))} className="min-h-28 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none" placeholder="Describe the research brief" />
                    <input value={createTask.priority} onChange={(event) => setCreateTask((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none" placeholder="Priority" />
                    <button type="button" onClick={() => void runAction("workflow:create-task", { ...createTask, priority: Number(createTask.priority || 3) }, `create-task ${createTask.agentName}`)} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-medium text-zinc-950">
                      Create Brief
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Route Brief</p>
                  <div className="mt-4 space-y-3">
                    <textarea value={routeTask} onChange={(event) => setRouteTask(event.target.value)} className="min-h-28 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none" />
                    <button type="button" onClick={() => void runAction("workflow:route-task", { description: routeTask }, "route-task")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-100">
                      Route Through Desk Editor
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Editorial Review Inbox</p>
                    <span className="text-xs text-zinc-500">{filteredReviews.length} visible</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["all", "pending", "reviewed", "approved", "revise"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setReviewFilter(status)}
                        className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                          reviewFilter === status ? "border-cyan-300/50 bg-cyan-300 text-slate-950" : "border-white/10 bg-black/25 text-zinc-400"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredReviews.length ? (
                      filteredReviews.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-black/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white">{item.taskDescription}</p>
                            <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(item.status)}`}>{item.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">{item.agentName} • {item.taskId}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => void runProtectedAction(`Approve review for ${item.taskId}?`, "review:approve", { taskId: item.taskId }, `approve ${item.taskId}`)} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                              Approve
                            </button>
                            <button type="button" onClick={() => void runProtectedAction(`Request revision for ${item.taskId}?`, "review:revise", { taskId: item.taskId, note: reviewNotes[item.taskId] || "Please revise the brief and resubmit." }, `revise ${item.taskId}`)} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                              Request Revision
                            </button>
                          </div>
                          <textarea value={reviewNotes[item.taskId] || ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [item.taskId]: event.target.value }))} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Revision note or editorial guidance" />
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <input value={followups[item.taskId]?.agentName || item.agentName} onChange={(event) => setFollowups((current) => ({ ...current, [item.taskId]: { agentName: event.target.value, description: current[item.taskId]?.description || "" } }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Follow-up agent" />
                            <input value={followups[item.taskId]?.description || ""} onChange={(event) => setFollowups((current) => ({ ...current, [item.taskId]: { agentName: current[item.taskId]?.agentName || item.agentName, description: event.target.value } }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Follow-up brief description" />
                          </div>
                          <button type="button" onClick={() => void runProtectedAction(`Create a follow-up task for ${item.taskId}?`, "review:followup", { taskId: item.taskId, agentName: followups[item.taskId]?.agentName || item.agentName, description: followups[item.taskId]?.description || `Follow up on ${item.taskDescription}` }, `followup ${item.taskId}`)} className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100">
                            Create Follow-up
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No editorial review work waiting.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Research Signal Recovery</p>
                    <span className="text-xs text-zinc-500">{overview.alerts.activeCount} active</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {overview.alerts.items.length ? (
                      overview.alerts.items.map((alert) => (
                        <div key={alert.id} className="rounded-2xl bg-black/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white">{alert.title}</p>
                            <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(alert.severity)}`}>{alert.severity}</span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">{alert.owner || "unassigned"} • {alert.acknowledged ? "acknowledged" : "unacknowledged"}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => void runProtectedAction(`Acknowledge alert ${alert.id}?`, "alert:acknowledge", { alertId: alert.id, owner: "manager" }, `acknowledge ${alert.id}`)} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100">
                              Acknowledge
                            </button>
                            <button type="button" onClick={() => void runProtectedAction(`Resolve alert ${alert.id}?`, "alert:resolve", { alertId: alert.id, note: alertNotes[alert.id] || "Resolved from the research desk." }, `resolve ${alert.id}`)} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                              Resolve
                            </button>
                          </div>
                          <textarea value={alertNotes[alert.id] || ""} onChange={(event) => setAlertNotes((current) => ({ ...current, [alert.id]: event.target.value }))} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Signal note or resolution details" />
                          <button type="button" onClick={() => void runAction("alert:note", { alertId: alert.id, note: alertNotes[alert.id] || "Investigating from the research desk." }, `note ${alert.id}`)} className="mt-3 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-200">
                            Add Note
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No active research signals to recover.</div>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "ops" ? (
            <Panel title="Operations Surfaces" note="Queue, schedules, alerts, and plugins are all visible without dropping back to raw command output.">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Brief Queue</p>
                    <span className="text-xs text-zinc-500">{filteredQueue.length} items</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["all", "queued", "claimed", "completed"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setQueueFilter(status)}
                        className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                          queueFilter === status ? "border-cyan-300/50 bg-cyan-300 text-slate-950" : "border-white/10 bg-black/25 text-zinc-400"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredQueue.length ? (
                      filteredQueue.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-black/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white">{item.description}</p>
                            <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(item.status)}`}>{item.status}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                            <span>{item.agentName}</span>
                            <span>Priority {item.priority ?? 3}</span>
                            <span>{formatTime(item.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No briefs match this filter.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Agent Schedules</p>
                    <span className="text-xs text-zinc-500">{overview.schedules.length} agents</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {overview.schedules.map((schedule) => (
                      <div key={schedule.agentName} className="rounded-2xl bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-white">{schedule.agentName}</p>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(schedule.enabled ? "active" : "paused")}`}>
                            {schedule.enabled ? "enabled" : "disabled"}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                          <div className="rounded-xl bg-zinc-950/70 p-3">Cycles {schedule.cycleCount}</div>
                          <div className="rounded-xl bg-zinc-950/70 p-3">Max {schedule.maxCycles}</div>
                          <div className="rounded-xl bg-zinc-950/70 p-3">{schedule.intervalSeconds}s</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => void executeCommand(`schedule:run ${schedule.agentName}`, "action")} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100">
                            Run Tick
                          </button>
                          <button type="button" onClick={() => void executeCommand(`schedule:status ${schedule.agentName}`, "action")} className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300">
                            Inspect
                          </button>
                        </div>
                        {schedule.lastError ? <p className="mt-3 text-xs text-rose-200">{schedule.lastError}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">Research Plugins</p>
                  <button
                    type="button"
                    onClick={() => void executeCommand("plugins", "action")}
                    className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300"
                  >
                    Inspect All
                  </button>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {overview.plugins.length ? (
                    overview.plugins.map((plugin) => (
                      <div key={plugin.name} className="rounded-2xl bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-white">{plugin.name}</p>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(plugin.loaded ? "active" : "error")}`}>
                            {plugin.loaded ? "loaded" : "error"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{plugin.description || "No description provided."}</p>
                        {plugin.error ? <p className="mt-3 text-xs text-rose-200">{plugin.error}</p> : null}
                        <input
                          value={pluginArgs[plugin.name] || ""}
                          onChange={(event) => setPluginArgs((current) => ({ ...current, [plugin.name]: event.target.value }))}
                          className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                          placeholder="Optional plugin argument"
                        />
                        <button
                          type="button"
                          disabled={!plugin.loaded || running}
                          onClick={() => void runAction("plugin:run", { name: plugin.name, pluginArg: pluginArgs[plugin.name] || "" }, `run plugin ${plugin.name}`)}
                          className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 disabled:opacity-50"
                        >
                          Run Plugin
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No research plugins are enabled right now.</div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Watcher Policy</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void runAction("watcher:start", { intervalSeconds: overview.watcher.intervalSeconds || 4 }, "watcher:start")}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        onClick={() => void runProtectedAction("Stop watcher automation?", "watcher:stop", { reason: "stopped_by_user" }, "watcher:stop")}
                        className="rounded-full border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-300"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {overview.watcher.rules.map((rule) => {
                      const draft = watcherRuleDrafts[rule.name] || rule;
                      return (
                        <div key={rule.name} className="rounded-2xl bg-black/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white">{rule.name}</p>
                            <label className="flex items-center gap-2 text-xs text-zinc-400">
                              <input
                                type="checkbox"
                                checked={draft.enabled}
                                onChange={(event) =>
                                  setWatcherRuleDrafts((current) => ({
                                    ...current,
                                    [rule.name]: { ...draft, enabled: event.target.checked },
                                  }))
                                }
                              />
                              enabled
                            </label>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <input
                              value={draft.agentName}
                              onChange={(event) =>
                                setWatcherRuleDrafts((current) => ({
                                  ...current,
                                  [rule.name]: { ...draft, agentName: event.target.value },
                                }))
                              }
                              className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                            />
                            <input
                              value={String(draft.minQueuedTasks)}
                              onChange={(event) =>
                                setWatcherRuleDrafts((current) => ({
                                  ...current,
                                  [rule.name]: { ...draft, minQueuedTasks: Number(event.target.value || 1) },
                                }))
                              }
                              className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                            />
                            <input
                              value={String(draft.scheduleIntervalSeconds)}
                              onChange={(event) =>
                                setWatcherRuleDrafts((current) => ({
                                  ...current,
                                  [rule.name]: { ...draft, scheduleIntervalSeconds: Number(event.target.value || 1) },
                                }))
                              }
                              className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                            />
                            <input
                              value={String(draft.scheduleMaxCycles)}
                              onChange={(event) =>
                                setWatcherRuleDrafts((current) => ({
                                  ...current,
                                  [rule.name]: { ...draft, scheduleMaxCycles: Number(event.target.value || 1) },
                                }))
                              }
                              className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void runAction("watcher:rule-upsert", draft, `save-rule ${rule.name}`)}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                            >
                              Save Rule
                            </button>
                            <button
                              type="button"
                              onClick={() => void runProtectedAction(`Delete watcher rule ${rule.name}?`, "watcher:rule-delete", { name: rule.name }, `delete-rule ${rule.name}`)}
                              className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="rounded-2xl border border-dashed border-white/10 p-4">
                      <p className="text-sm text-zinc-300">Add watcher rule</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <input value={newWatcherRule.name} onChange={(event) => setNewWatcherRule((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="rule name" />
                        <input value={newWatcherRule.agentName} onChange={(event) => setNewWatcherRule((current) => ({ ...current, agentName: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="agent" />
                        <input value={newWatcherRule.minQueuedTasks} onChange={(event) => setNewWatcherRule((current) => ({ ...current, minQueuedTasks: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="min queued" />
                        <input value={newWatcherRule.scheduleIntervalSeconds} onChange={(event) => setNewWatcherRule((current) => ({ ...current, scheduleIntervalSeconds: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="interval seconds" />
                        <input value={newWatcherRule.scheduleMaxCycles} onChange={(event) => setNewWatcherRule((current) => ({ ...current, scheduleMaxCycles: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="max cycles" />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "watcher:rule-upsert",
                            {
                              name: newWatcherRule.name,
                              agentName: newWatcherRule.agentName,
                              minQueuedTasks: Number(newWatcherRule.minQueuedTasks || 1),
                              scheduleIntervalSeconds: Number(newWatcherRule.scheduleIntervalSeconds || 1),
                              scheduleMaxCycles: Number(newWatcherRule.scheduleMaxCycles || 1),
                              enabled: newWatcherRule.enabled,
                            },
                            `add-rule ${newWatcherRule.name || "new"}`
                          )
                        }
                        className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Escalation Policy</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Alert Thresholds</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <input value={alertThresholdDraft.queuedTasksHigh} onChange={(event) => setAlertThresholdDraft((current) => ({ ...current, queuedTasksHigh: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Queued" />
                        <input value={alertThresholdDraft.pendingReviewsHigh} onChange={(event) => setAlertThresholdDraft((current) => ({ ...current, pendingReviewsHigh: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Reviews" />
                        <input value={alertThresholdDraft.inactiveAgentsHigh} onChange={(event) => setAlertThresholdDraft((current) => ({ ...current, inactiveAgentsHigh: event.target.value }))} className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Inactive" />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "policy:update-thresholds",
                            {
                              queuedTasksHigh: Number(alertThresholdDraft.queuedTasksHigh || 0),
                              pendingReviewsHigh: Number(alertThresholdDraft.pendingReviewsHigh || 0),
                              inactiveAgentsHigh: Number(alertThresholdDraft.inactiveAgentsHigh || 0),
                            },
                            "update-thresholds"
                          )
                        }
                        className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                      >
                        Save Thresholds
                      </button>
                    </div>

                    <div className="rounded-2xl bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Automation Policy</p>
                      <div className="mt-3 space-y-3 text-sm text-zinc-300">
                        {([
                          ["autoRunWatcherOnPolicySave", "Run watcher after policy save"],
                          ["autoRunAlertsOnPolicySave", "Run alerts after policy save"],
                          ["autoAcknowledgeWatcherStopped", "Auto-ack watcher stopped"],
                          ["allowScheduleRestartRecommendations", "Recommend schedule restarts"],
                          ["allowAlertResolutionRecommendations", "Recommend alert resolution"],
                          ["allowReviewFollowupRecommendations", "Recommend review follow-up"],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={Boolean(automationPolicyDraft[key])}
                              onChange={(event) => setAutomationPolicyDraft((current) => ({ ...current, [key]: event.target.checked }))}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                        <input
                          value={automationPolicyDraft.preferredAlertOwner}
                          onChange={(event) => setAutomationPolicyDraft((current) => ({ ...current, preferredAlertOwner: event.target.value }))}
                          className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                          placeholder="Preferred alert owner"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            "policy:update-automation",
                            {
                              escalation: {
                                autoRunWatcherOnPolicySave: automationPolicyDraft.autoRunWatcherOnPolicySave,
                                autoRunAlertsOnPolicySave: automationPolicyDraft.autoRunAlertsOnPolicySave,
                                autoAcknowledgeWatcherStopped: automationPolicyDraft.autoAcknowledgeWatcherStopped,
                                preferredAlertOwner: automationPolicyDraft.preferredAlertOwner,
                              },
                              remediation: {
                                allowScheduleRestartRecommendations: automationPolicyDraft.allowScheduleRestartRecommendations,
                                allowAlertResolutionRecommendations: automationPolicyDraft.allowAlertResolutionRecommendations,
                                allowReviewFollowupRecommendations: automationPolicyDraft.allowReviewFollowupRecommendations,
                              },
                            },
                            "update-automation-policy"
                          )
                        }
                        className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                      >
                        Save Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-5">
          <Panel title="Trust & Recovery" note="The desk shows whether the workflow is safe, stale, or needs intervention.">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Operator Inbox</p>
                  <span className="text-xs text-zinc-500">{overview.collaboration.inbox.length} open</span>
                </div>
                <div className="mt-3 space-y-2">
                  {overview.collaboration.inbox.length ? (
                    overview.collaboration.inbox.slice(0, 6).map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-100">{item.title}</span>
                          <div className="flex items-center gap-2">
                            {!item.read ? (
                              <span className="rounded-full border border-amber-400/30 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100">
                                unread
                              </span>
                            ) : null}
                            {item.acknowledged ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                                acknowledged
                              </span>
                            ) : null}
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.tone)}`}>{item.type}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
                        {item.workspaceId ? (
                          <p className="mt-2 text-xs text-zinc-500">
                            Workspace: {item.workspaceName || item.workspaceId}
                            {item.owner ? ` • owner: ${item.owner}` : ""}
                            {item.snoozedUntil ? ` • snoozed until ${formatTime(item.snoozedUntil)}` : ""}
                          </p>
                        ) : null}
                        {item.kind === "incident-approval-reminder" && item.createdAt ? (
                          <p className="mt-2 text-xs text-amber-200">Reminder opened {formatTime(item.createdAt)}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.command ? (
                            <button
                              type="button"
                              onClick={() => void executeCommand(item.command || "", "action")}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                            >
                              Open
                            </button>
                          ) : null}
                          {!item.read ? (
                            <button
                              type="button"
                              onClick={() => void runAction("collaboration:inbox-mark-read", { itemId: item.id }, `mark-read ${item.id}`)}
                              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                            >
                              Mark Read
                            </button>
                          ) : null}
                          {!item.acknowledged ? (
                            <button
                              type="button"
                              onClick={() => void runAction("collaboration:inbox-acknowledge", { itemId: item.id }, `acknowledge-inbox ${item.id}`)}
                              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                            >
                              Acknowledge
                            </button>
                          ) : null}
                          {item.handoffId ? (
                            <button
                              type="button"
                              onClick={() => void runAction("collaboration:close-handoff", { handoffId: item.handoffId }, `close-handoff ${item.handoffId}`)}
                              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                            >
                              Mark Closed
                            </button>
                          ) : null}
                          {item.relatedApprovalId && item.kind === "incident-approval-reminder" ? (
                            <>
                              <button
                                type="button"
                                disabled={!overview.collaboration.permissions.canApprove}
                                onClick={() => void runAction("approval:approve", { approvalId: item.relatedApprovalId }, `approve-request ${item.relatedApprovalId}`)}
                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
                              >
                                Approve from reminder
                              </button>
                              <button
                                type="button"
                                disabled={!overview.collaboration.permissions.canApprove}
                                onClick={() =>
                                  void runAction(
                                    "approval:reject",
                                    { approvalId: item.relatedApprovalId, note: approvalNotes[item.relatedApprovalId!] || "" },
                                    `reject-request ${item.relatedApprovalId}`
                                  )
                                }
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 disabled:opacity-50"
                              >
                                Reject from reminder
                              </button>
                              <textarea
                                value={approvalNotes[item.relatedApprovalId!] || ""}
                                onChange={(event) => setApprovalNotes((current) => ({ ...current, [item.relatedApprovalId!]: event.target.value }))}
                                className="min-h-16 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                                placeholder="Optional rejection note"
                              />
                            </>
                          ) : null}
                          {item.approvalId && item.status === "pending" ? (
                            <button
                              type="button"
                              disabled={!overview.collaboration.permissions.canApprove}
                              onClick={() => void runAction("approval:approve", { approvalId: item.approvalId }, `approve-request ${item.approvalId}`)}
                              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          ) : null}
                          {item.type === "automation" && item.workspaceId ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void runAction("collaboration:automation-run-sweep", { itemId: item.id, workspaceId: item.workspaceId }, `run-sweep ${item.workspaceId}`)}
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                              >
                                Run Sweep
                              </button>
                              <button
                                type="button"
                                onClick={() => void runAction("collaboration:automation-snooze", { itemId: item.id, workspaceId: item.workspaceId, minutes: 60 }, `snooze ${item.workspaceId}`)}
                                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                              >
                                Snooze 1h
                              </button>
                              <a
                                href={`/operations?workspace=${encodeURIComponent(item.workspaceId)}`}
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                              >
                                Workspace Ops
                              </a>
                              <input
                                value={automationOwnerDrafts[item.id] ?? item.owner ?? ""}
                                onChange={(event) => setAutomationOwnerDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                                className="min-w-36 rounded-full border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                                placeholder="Owner"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(
                                    "collaboration:automation-create-followup",
                                    {
                                      itemId: item.id,
                                      workspaceId: item.workspaceId,
                                      owner: automationOwnerDrafts[item.id] ?? item.owner ?? overview.collaboration.currentUser.name,
                                      agentName: "planner",
                                    },
                                    `create-followup ${item.workspaceId}`
                                  )
                                }
                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                              >
                                Create Follow-up
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void runAction(
                                    "collaboration:automation-assign",
                                    { itemId: item.id, workspaceId: item.workspaceId, owner: automationOwnerDrafts[item.id] ?? item.owner ?? "" },
                                    `assign-owner ${item.workspaceId}`
                                  )
                                }
                                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                              >
                                Assign
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      Inbox is clear. No handoffs, approvals, or assignment escalations need attention.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notification Center</p>
                  <button
                    type="button"
                    onClick={() => void executeCommand("inbox:history", "action")}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                  >
                    Export View
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Open</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.open}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Unread</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.unread}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Handled</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.acknowledged}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Ownership</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.ownership}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Handoffs</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.handoffs}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Approvals</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.notificationDigest.approvals}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["all", "unread", "acknowledged"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNotificationFilter(value)}
                      className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                        notificationFilter === value ? "border-cyan-300/50 bg-cyan-300 text-slate-950" : "border-white/10 bg-black/25 text-zinc-400"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <input
                  value={notificationQuery}
                  onChange={(event) => setNotificationQuery(event.target.value)}
                  placeholder="Search notifications"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                />
                <div className="mt-3 space-y-2">
                  {filteredNotificationHistory.length ? (
                    filteredNotificationHistory.slice(0, 8).map((item) => (
                      <div key={`${item.id}-${item.recordedAt || item.updatedAt || item.status}`} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-100">{item.title}</span>
                          <div className="flex items-center gap-2">
                            {item.read ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300">read</span>
                            ) : null}
                            {item.acknowledged ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">acknowledged</span>
                            ) : null}
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.tone)}`}>{item.type}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
                        <p className="mt-2 text-xs text-zinc-500">{formatTime(item.recordedAt || item.updatedAt || null)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      No notifications match the current filter.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Digest Delivery</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void runAction("collaboration:digest-run-due", {}, "run-due-digests")}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                    >
                      Run Due
                    </button>
                    <button
                      type="button"
                      onClick={() => void runAction("collaboration:digest-generate", {}, "generate-digest")}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                    >
                      Generate Digest
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={digestDraft.enabled}
                      onChange={(event) => setDigestDraft((current) => ({ ...current, enabled: event.target.checked }))}
                    />
                    <span>Enable saved digest snapshots</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={digestDraft.includeTrustReport}
                      onChange={(event) => setDigestDraft((current) => ({ ...current, includeTrustReport: event.target.checked }))}
                    />
                    <span>Include trust report for admin digests</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={digestDraft.immediateOnTrustDrop}
                      onChange={(event) => setDigestDraft((current) => ({ ...current, immediateOnTrustDrop: event.target.checked }))}
                    />
                    <span>Send immediately when trust drops sharply</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={digestDraft.cadence}
                      onChange={(event) => setDigestDraft((current) => ({ ...current, cadence: event.target.value }))}
                      className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="manual">Manual</option>
                      <option value="daily">Daily</option>
                      <option value="handoff">On handoff</option>
                    </select>
                    <select
                      value={digestDraft.preferredChannel}
                      onChange={(event) => setDigestDraft((current) => ({ ...current, preferredChannel: event.target.value }))}
                      className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="inbox">Inbox</option>
                      <option value="history">History</option>
                    </select>
                  </div>
                  <select
                    value={digestDraft.trustAudience}
                    onChange={(event) => setDigestDraft((current) => ({ ...current, trustAudience: event.target.value }))}
                    className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="self">Trust report audience: me</option>
                    <option value="admins">Trust report audience: admins/approvers</option>
                  </select>
                  <select
                    value={digestDraft.trustEnvironment}
                    onChange={(event) => setDigestDraft((current) => ({ ...current, trustEnvironment: event.target.value }))}
                    className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Trust recap environment: all</option>
                    <option value="production">Trust recap environment: production</option>
                    <option value="staging">Trust recap environment: staging</option>
                    <option value="development">Trust recap environment: development</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "collaboration:digest-preferences",
                        digestDraft,
                        "save-digest-preferences"
                      )
                    }
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                  >
                    Save Preferences
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {overview.collaboration.digestRuns.length ? (
                    overview.collaboration.digestRuns.map((digest) => (
                      <div key={digest.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-100">{digest.summary}</span>
                          <div className="flex items-center gap-2">
                            {digest.reportType === "trust" ? (
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-100">
                                trust report
                              </span>
                            ) : null}
                            <span className="text-xs text-zinc-500">{formatTime(digest.createdAt)}</span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Open {digest.stats.open ?? 0}</div>
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Unread {digest.stats.unread ?? 0}</div>
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Handled {digest.stats.acknowledged ?? 0}</div>
                        </div>
                        {digest.report ? (
                          <div className="mt-2 rounded-lg bg-black/25 p-2 text-xs text-zinc-400">
                            {digest.report.split("\n").slice(0, 4).join(" • ")}
                          </div>
                        ) : null}
                        {digest.highlights.length ? (
                          <div className="mt-2 text-xs text-zinc-400">{digest.highlights.join(" • ")}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      No digest snapshots generated yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Digest Scheduler</p>
                  <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(overview.collaboration.digestScheduler.enabled ? "active" : "paused")}`}>
                    {overview.collaboration.digestScheduler.enabled ? "running" : "idle"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Interval</p>
                    <p className="mt-2 text-lg font-semibold text-white">{Math.round((overview.collaboration.digestScheduler.intervalMs || 0) / 1000)}s</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Workspaces</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.digestScheduler.lastResult?.workspaceCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queued</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.collaboration.digestScheduler.lastResult?.queuedJobCount ?? 0}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  <p>Last sweep: {formatTime(overview.collaboration.digestScheduler.lastRunAt)}</p>
                  {overview.collaboration.digestScheduler.lastError ? (
                    <p className="mt-1 text-rose-200">Last error: {overview.collaboration.digestScheduler.lastError}</p>
                  ) : null}
                  {overview.collaboration.digestScheduler.lastResult?.queuedJobIds?.length ? (
                    <p className="mt-1">Queued jobs: {overview.collaboration.digestScheduler.lastResult.queuedJobIds.join(", ")}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Workspace Automation Health</p>
                  <span className="text-xs text-zinc-500">{overview.collaboration.digestWorkspaceHealth.length} tracked</span>
                </div>
                {overview.collaboration.digestEscalations.length ? (
                  <div className="mt-3 space-y-2">
                    {overview.collaboration.digestEscalations.map((signal) => (
                      <div key={signal.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-zinc-100">{signal.title}</p>
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(signal.tone)}`}>{signal.tone}</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">{signal.detail}</p>
                        <button
                          type="button"
                          onClick={() => void executeCommand(signal.command, "action")}
                          className="mt-3 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-zinc-100"
                        >
                          Open {signal.command}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 space-y-2">
                  {overview.collaboration.digestWorkspaceHealth.length ? (
                    overview.collaboration.digestWorkspaceHealth.map((workspace) => (
                      <div key={workspace.workspaceId} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-zinc-100">{workspace.workspaceId}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {workspace.memberCount} members • {workspace.digestEnabledUsers} digest users • {workspace.dueUsers} due
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(workspace.status)}`}>{workspace.status}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Generated {workspace.lastGeneratedCount}</div>
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Queued {formatTime(workspace.lastSweepQueuedAt)}</div>
                          <div className="rounded-lg bg-black/25 p-2 text-xs text-zinc-300">Swept {formatTime(workspace.lastSweepRunAt)}</div>
                        </div>
                        {workspace.status === "stalled" ? (
                          <p className="mt-2 text-xs text-amber-200">Missed intervals: {workspace.overdueIntervals}</p>
                        ) : null}
                        {workspace.incidentApprovalSla ? (
                          <p className={`mt-2 text-xs ${workspace.incidentApprovalSla.overdue ? "text-amber-200" : "text-zinc-400"}`}>
                            Approval SLA: {Math.round(workspace.incidentApprovalSla.ageMs / 60000)}m elapsed / {Math.round(workspace.incidentApprovalSla.reminderDelayMs / 60000)}m target
                            {workspace.incidentApproverTarget ? ` • approver ${workspace.incidentApproverTarget}` : ""}
                          </p>
                        ) : null}
                        {workspace.status === "resolved" ? (
                          <p className="mt-2 text-xs text-emerald-200">
                            Resolved by {workspace.resolutionOwnerName || "follow-up"} at {formatTime(workspace.resolutionCompletedAt)}
                          </p>
                        ) : null}
                        {workspace.lastSweepError ? (
                          <p className="mt-2 text-xs text-rose-200">Last error: {workspace.lastSweepError}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      No workspace digest activity recorded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Overall health</span>
                  <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(overview.health.overall)}`}>{overview.health.overall}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Last automation sweep</span>
                  <span className="text-sm text-white">{formatTime(overview.trust.lastWatcherRunAt)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Schedules with errors</span>
                  <span className="text-sm text-white">{overview.trust.schedulesWithErrors}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Last sync</span>
                  <span className="text-sm text-white">{formatTime(lastSyncAt)}</span>
                </div>
                {overview.trust.lastWatcherError ? (
                  <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                    {overview.trust.lastWatcherError}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Saved Research Sessions</p>
                <div className="mt-3 flex gap-2">
                  <input value={sessionName} onChange={(event) => setSessionName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none" placeholder="Session name" />
                  <button type="button" onClick={saveSession} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-100">
                    Save
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.name}
                      type="button"
                      onClick={() => {
                        setCommand(session.draftCommand);
                        setMacros(session.macros);
                        pushToast(setToasts, { id: id(), tone: "success", message: `Loaded session ${session.name}.` });
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-3 py-3 text-left transition hover:bg-zinc-950"
                    >
                      <span className="text-sm text-zinc-100">{session.name}</span>
                      <span className="text-xs text-zinc-500">{session.macros.length} macros</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Collaboration</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {overview.collaboration.currentUser.name} • {overview.collaboration.currentUser.role}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={overview.collaboration.governance.sensitiveActionsRequireApproval}
                      disabled={!overview.collaboration.permissions.canManageGovernance}
                      onChange={(event) =>
                        void runAction(
                          "collaboration:update-governance",
                          { sensitiveActionsRequireApproval: event.target.checked },
                          "update-governance"
                        )
                      }
                    />
                    approvals
                  </label>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Approvals: {overview.collaboration.permissions.canApprove ? "allowed" : "restricted"} • Governance:{" "}
                  {overview.collaboration.permissions.canManageGovernance ? "admin" : "restricted"}
                </p>

                <div className="mt-4 rounded-2xl bg-zinc-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Share Current Session</p>
                  <input
                    value={shareTargets}
                    onChange={(event) => setShareTargets(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                    placeholder="team, ops-lead"
                  />
                  <button
                    type="button"
                    onClick={() => void shareCurrentSession()}
                    className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                  >
                    Share Session
                  </button>
                  <div className="mt-3 space-y-2">
                    {overview.collaboration.sharedSessions.slice(0, 3).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setCommand(session.draftCommand);
                          setMacros(session.macros);
                          pushToast(setToasts, { id: id(), tone: "success", message: `Loaded shared session ${session.name}.` });
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-left"
                      >
                        <span className="text-sm text-zinc-100">{session.name}</span>
                        <span className="text-xs text-zinc-500">{session.ownerName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operator Handoff</p>
                  <div className="mt-3 space-y-2">
                    <input
                      value={handoffDraft.title}
                      onChange={(event) => setHandoffDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Handoff title"
                    />
                    <input
                      value={handoffDraft.assignedTo}
                      onChange={(event) => setHandoffDraft((current) => ({ ...current, assignedTo: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Assigned to"
                    />
                    <textarea
                      value={handoffDraft.note}
                      onChange={(event) => setHandoffDraft((current) => ({ ...current, note: event.target.value }))}
                      className="min-h-20 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                      placeholder="What should the next operator know?"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void runAction(
                          "collaboration:create-handoff",
                          handoffDraft,
                          `create-handoff ${handoffDraft.title || "draft"}`
                        ).then(() => setHandoffDraft({ title: "", note: "", assignedTo: "team" }))
                      }
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                    >
                      Create Handoff
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {overview.collaboration.handoffs.slice(0, 4).map((handoff) => (
                      <div key={handoff.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-100">{handoff.title}</span>
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(handoff.status)}`}>{handoff.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">
                          {handoff.assignedByName} to {handoff.assignedTo}
                          {handoff.kind ? ` • ${handoff.kind}` : ""}
                          {handoff.workspaceId ? ` • ${handoff.workspaceId}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-zinc-300">{handoff.note}</p>
                        {handoff.status === "open" ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void runAction("collaboration:close-handoff", { handoffId: handoff.id }, `close-handoff ${handoff.title}`)}
                              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                            >
                              Mark Closed
                            </button>
                            {handoff.relatedApprovalId ? (
                              <>
                                <button
                                  type="button"
                                  disabled={!overview.collaboration.permissions.canApprove}
                                  onClick={() => void runAction("approval:approve", { approvalId: handoff.relatedApprovalId }, `approve-request ${handoff.relatedApprovalId}`)}
                                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={!overview.collaboration.permissions.canApprove}
                                  onClick={() =>
                                    void runAction(
                                      "approval:reject",
                                      { approvalId: handoff.relatedApprovalId, note: approvalNotes[handoff.relatedApprovalId!] || "" },
                                      `reject-request ${handoff.relatedApprovalId}`
                                    )
                                  }
                                  className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        {handoff.relatedApprovalId ? (
                          <textarea
                            value={approvalNotes[handoff.relatedApprovalId!] || ""}
                            onChange={(event) => setApprovalNotes((current) => ({ ...current, [handoff.relatedApprovalId!]: event.target.value }))}
                            className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                            placeholder="Optional rejection note"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-950/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Pending Approvals</p>
                    <span className="text-xs text-zinc-500">
                      {overview.collaboration.approvals.filter((item) => item.status === "pending").length} open
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {overview.collaboration.approvals.slice(0, 4).map((approval) => (
                      <div key={approval.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-zinc-100">{approval.label}</span>
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(approval.status)}`}>{approval.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400">{approval.requestedByName} requested {approval.action}</p>
                        {approval.status === "pending" ? (
                          <>
                            <textarea
                              value={approvalNotes[approval.id] || ""}
                              onChange={(event) => setApprovalNotes((current) => ({ ...current, [approval.id]: event.target.value }))}
                              className="mt-3 min-h-16 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                              placeholder="Optional rejection note"
                            />
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                disabled={!overview.collaboration.permissions.canApprove}
                                onClick={() => void runAction("approval:approve", { approvalId: approval.id }, `approve-request ${approval.id}`)}
                                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={!overview.collaboration.permissions.canApprove}
                                onClick={() =>
                                  void runAction(
                                    "approval:reject",
                                    { approvalId: approval.id, note: approvalNotes[approval.id] || "" },
                                    `reject-request ${approval.id}`
                                  )
                                }
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-xs text-zinc-500">
                            {approval.approvedByName || approval.rejectedByName || "Resolved"} at {formatTime(approval.resolvedAt || null)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live Activity</p>
                  <input
                    value={activityFilter}
                    onChange={(event) => setActivityFilter(event.target.value)}
                    placeholder="Filter"
                    className="w-28 rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="mt-3 space-y-3">
                  {filteredActivity.length ? (
                    filteredActivity.map((item, index) => (
                      <div key={`${item.timestamp}-${index}`} className="rounded-2xl bg-zinc-950/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.event}</span>
                          <span className="text-xs text-zinc-500">{formatTime(item.timestamp)}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-200">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No recent activity matches this filter.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Operational Telemetry</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Events</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.telemetry.totals.events}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Errors</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.telemetry.totals.errors}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cmd Avg</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.telemetry.totals.avgCommandLatencyMs}ms</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Sched Avg</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.telemetry.totals.avgSchedulerLatencyMs}ms</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {overview.telemetry.byType.slice(0, 4).map((item) => (
                    <div key={item.type} className="flex items-center justify-between rounded-xl bg-zinc-950/70 px-3 py-2">
                      <span className="text-sm text-zinc-300">{item.type}</span>
                      <span className="text-xs text-zinc-500">{item.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {overview.telemetry.recent.slice(0, 3).map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-100">{event.type}</span>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(event.status)}`}>{event.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">{event.durationMs}ms • {formatTime(event.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Background Jobs</p>
                  <input
                    value={jobFilter}
                    onChange={(event) => setJobFilter(event.target.value)}
                    placeholder="Filter jobs"
                    className="w-28 rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queued</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.queued}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Running</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.running}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Failed</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.failed}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queue Wait</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.metrics.avgQueueWaitMs}ms</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Run Time</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.metrics.avgRunTimeMs}ms</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Completion</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.metrics.completionRate}%</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Retry Pressure</p>
                    <p className="mt-2 text-lg font-semibold text-white">{overview.jobs.metrics.retryPressure}%</p>
                  </div>
                </div>
                {overview.jobs.metrics.scheduledRetries ? (
                  <p className="mt-3 text-xs text-amber-200">
                    {overview.jobs.metrics.scheduledRetries} job{overview.jobs.metrics.scheduledRetries === 1 ? "" : "s"} waiting for automatic retry.
                  </p>
                ) : null}
                <div className="mt-3 space-y-2">
                  {filteredJobs.slice(0, 6).map((job) => (
                    <div key={job.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-100">{job.type}</span>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(job.status)}`}>{job.status}</span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">{job.id} • {formatTime(job.createdAt)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Attempts {job.attempts ?? 0} • Retries {job.retryCount ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Events {job.eventCount ?? job.events?.length ?? 0}
                        {job.latestEvent?.message ? ` • ${job.latestEvent.message}` : ""}
                      </p>
                      {job.nextRetryAt ? (
                        <p className="mt-1 text-xs text-amber-200">Next retry {formatTime(job.nextRetryAt)}</p>
                      ) : null}
                      {job.error ? <p className="mt-2 text-xs text-rose-200">{job.error}</p> : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100"
                        >
                          Inspect
                        </button>
                        {job.status === "queued" ? (
                          <button
                            type="button"
                            onClick={() => void runAction("job:cancel", { jobId: job.id }, `cancel-job ${job.id}`)}
                            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                          >
                            Cancel
                          </button>
                        ) : null}
                        {job.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() => void runAction("job:retry", { jobId: job.id }, `retry-job ${job.id}`)}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                          >
                            Retry
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {!overview.jobs.items.length ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      No background jobs yet.
                    </div>
                  ) : null}
                  {overview.jobs.items.length && !filteredJobs.length ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      No jobs match this filter.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Panel>
        </aside>
      </div>

      {commandPaletteOpen ? (
        <div className="fixed inset-0 z-30 flex items-start justify-center bg-slate-950/70 px-4 py-16 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Command Palette</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Search commands, sessions, and recommendations</h3>
              </div>
              <button type="button" onClick={() => setCommandPaletteOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                Close
              </button>
            </div>
            <input
              autoFocus
              value={paletteQuery}
              onChange={(event) => setPaletteQuery(event.target.value)}
              placeholder="Type a command, session, or macro"
              className="mt-4 w-full rounded-2xl border border-cyan-400/20 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
              {paletteItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setCommand(item.value);
                    setCommandPaletteOpen(false);
                    commandInputRef.current?.focus();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-black/40"
                >
                  <span className="text-sm text-zinc-100">{item.label}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                    {item.meta}
                  </span>
                </button>
              ))}
              {!paletteItems.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                  No commands or sessions match this search.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedAgent ? (
        <div className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md">
          <div className="w-full border-l border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[-24px_0_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Agent Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedAgent.agentName}</h3>
              </div>
              <button type="button" onClick={() => setSelectedAgentName(null)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300">Status</span>
                  <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(selectedAgent.runtime.active ? "active" : selectedAgent.runtime.status)}`}>
                    {selectedAgent.runtime.active ? "active" : selectedAgent.runtime.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queued</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.observability.queuedTasks}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Claimed</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.observability.claimedTasks}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Completed</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.observability.completedTasks}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <p>Goal: {selectedAgent.runtime.goal || selectedAgent.profile.defaultGoal}</p>
                  <p>Last run: {formatTime(selectedAgent.runtime.lastRunAt)}</p>
                  <p>Pending reviews: {selectedAgent.observability.pendingReviews}</p>
                  {selectedAgent.runtime.currentTask ? (
                    <p>Current task: {selectedAgent.runtime.currentTask.id || "task"} • {selectedAgent.runtime.currentTask.description || "(no description)"}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick Actions</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void executeCommand(`agent:status ${selectedAgent.agentName}`, "action")} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100">
                    Inspect
                  </button>
                  <button type="button" onClick={() => void executeCommand(`agent:start ${selectedAgent.agentName}`, "action")} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100">
                    Start
                  </button>
                  <button type="button" onClick={() => void executeCommand(`agent:tick ${selectedAgent.agentName}`, "action")} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                    Tick
                  </button>
                  <button type="button" onClick={() => void executeCommand(`agent:stop ${selectedAgent.agentName}`, "action")} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    Stop
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Runtime Config</p>
                <div className="mt-4 space-y-3">
                  <input
                    value={agentProfileDrafts[selectedAgent.agentName]?.role ?? selectedAgent.profile.role}
                    onChange={(event) => updateAgentDraft(selectedAgent.agentName, { role: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Role"
                  />
                  <textarea
                    value={agentProfileDrafts[selectedAgent.agentName]?.defaultGoal ?? selectedAgent.profile.defaultGoal}
                    onChange={(event) => updateAgentDraft(selectedAgent.agentName, { defaultGoal: event.target.value })}
                    className="min-h-20 w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Default goal"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={String(agentProfileDrafts[selectedAgent.agentName]?.maxStepsPerRun ?? selectedAgent.profile.maxStepsPerRun)}
                      onChange={(event) => updateAgentDraft(selectedAgent.agentName, { maxStepsPerRun: Number(event.target.value || 0) })}
                      className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Max steps"
                    />
                    <input
                      value={String(agentProfileDrafts[selectedAgent.agentName]?.cooldownSeconds ?? selectedAgent.profile.cooldownSeconds)}
                      onChange={(event) => updateAgentDraft(selectedAgent.agentName, { cooldownSeconds: Number(event.target.value || 0) })}
                      className="rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Cooldown"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-zinc-300">
                    {([
                      ["allowShellExecution", "Shell"],
                      ["allowFileWrite", "Write"],
                      ["allowPlanning", "Planning"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={Boolean(agentProfileDrafts[selectedAgent.agentName]?.[key] ?? selectedAgent.profile[key])}
                          onChange={(event) => updateAgentDraft(selectedAgent.agentName, { [key]: event.target.checked } as Partial<AgentDetail["profile"]>)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void runAction(
                        "agent:update-config",
                        {
                          agentName: selectedAgent.agentName,
                          ...selectedAgent.profile,
                          ...(agentProfileDrafts[selectedAgent.agentName] || {}),
                        },
                        `update-config ${selectedAgent.agentName}`
                      )
                    }
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                  >
                    Save Config
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recent History</p>
                <div className="mt-3 space-y-2">
                  {selectedAgent.recentHistory.length ? (
                    selectedAgent.recentHistory.map((entry, index) => (
                      <div key={`${selectedAgent.agentName}-history-${index}`} className="rounded-xl bg-zinc-950/70 p-3 text-xs text-zinc-300">
                        <p className="text-zinc-500">{formatTime(typeof entry.timestamp === "string" ? entry.timestamp : null)}</p>
                        <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(entry, null, 2)}</pre>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">No recent agent history.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recent Notes</p>
                <div className="mt-3 space-y-2">
                  {selectedAgent.recentNotes.length ? (
                    selectedAgent.recentNotes.map((note, index) => (
                      <div key={`${selectedAgent.agentName}-note-${index}`} className="rounded-xl bg-zinc-950/70 p-3 text-sm text-zinc-300">
                        {note}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">No recent agent notes.</div>
                  )}
                </div>
              </div>

              {selectedAgent.schedule ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Schedule Observability</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-zinc-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Enabled</p>
                      <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.schedule.enabled ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cycles</p>
                      <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.schedule.cycleCount}/{selectedAgent.schedule.maxCycles}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Interval</p>
                      <p className="mt-2 text-lg font-semibold text-white">{selectedAgent.schedule.intervalSeconds}s</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">
                    <p>Last run: {formatTime(selectedAgent.schedule.lastRunAt)}</p>
                    {selectedAgent.schedule.lastError ? <p className="mt-1 text-rose-200">Last error: {selectedAgent.schedule.lastError}</p> : null}
                    {selectedAgent.schedule.stopReason ? <p className="mt-1">Stop reason: {selectedAgent.schedule.stopReason}</p> : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Suggested Prompt</p>
                <button
                  type="button"
                  onClick={() => {
                    setCommand(`agent:status ${selectedAgent.agentName}`);
                    commandInputRef.current?.focus();
                    setSelectedAgentName(null);
                  }}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-left text-sm text-cyan-200"
                >
                  agent:status {selectedAgent.agentName}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedJob ? (
        <div className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md">
          <div className="w-full border-l border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[-24px_0_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Job Detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedJob.type}</h3>
              </div>
              <button type="button" onClick={() => setSelectedJobId(null)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 overflow-y-auto pb-10 pr-1">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Runtime</p>
                  <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(selectedJob.status)}`}>{selectedJob.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Attempts</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {selectedJob.attempts ?? 0}/{selectedJob.maxAttempts ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Retries</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedJob.retryCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Queue Wait</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDuration(selectedJob.createdAt, selectedJob.startedAt)}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-950/70 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Run Time</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatDuration(selectedJob.startedAt, selectedJob.completedAt)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-xs text-zinc-500">
                  <p>Job ID: {selectedJob.id}</p>
                  <p>Created: {formatTime(selectedJob.createdAt)}</p>
                  <p>Started: {formatTime(selectedJob.startedAt)}</p>
                  <p>Completed: {formatTime(selectedJob.completedAt)}</p>
                  {selectedJob.nextRetryAt ? <p className="text-amber-200">Next retry: {formatTime(selectedJob.nextRetryAt)}</p> : null}
                  {selectedJob.canceledAt ? <p>Canceled: {formatTime(selectedJob.canceledAt)}</p> : null}
                  <p>Retry delay: {selectedJob.retryDelayMs ?? 0}ms</p>
                  <p>Actor: {selectedJob.actorName || selectedJob.actorId || "System"}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  {selectedJob.status === "queued" ? (
                    <button
                      type="button"
                      onClick={() => void runAction("job:cancel", { jobId: selectedJob.id }, `cancel-job ${selectedJob.id}`)}
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                    >
                      Cancel
                    </button>
                  ) : null}
                  {selectedJob.status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => void runAction("job:retry", { jobId: selectedJob.id }, `retry-job ${selectedJob.id}`)}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Payload</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950/70 p-3 text-xs text-zinc-300 whitespace-pre-wrap break-words">
                  {renderObject(selectedJob.payload)}
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Result</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950/70 p-3 text-xs text-zinc-300 whitespace-pre-wrap break-words">
                  {renderObject(selectedJob.result)}
                </pre>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Error</p>
                <div className={`mt-3 rounded-xl border p-3 text-sm ${selectedJob.error ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-white/10 bg-zinc-950/70 text-zinc-500"}`}>
                  {selectedJob.error || "No error recorded."}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Timeline</p>
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Queued", value: selectedJob.createdAt, tone: "queued" },
                    { label: "Started", value: selectedJob.startedAt, tone: "active" },
                    { label: "Completed", value: selectedJob.completedAt, tone: selectedJob.status },
                    { label: "Canceled", value: selectedJob.canceledAt, tone: "warning" },
                    { label: "Retry scheduled", value: selectedJob.nextRetryAt, tone: "pending" },
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div key={`${selectedJob.id}-${item.label}`} className="flex items-center justify-between rounded-xl bg-zinc-950/70 px-3 py-3">
                        <div>
                          <p className="text-sm text-zinc-100">{item.label}</p>
                          <p className="mt-1 text-xs text-zinc-500">{formatTime(item.value)}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(item.tone)}`}>{item.label}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Execution Log</p>
                  <input
                    value={jobLogFilter}
                    onChange={(event) => setJobLogFilter(event.target.value)}
                    placeholder="Filter logs"
                    className="w-28 rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {filteredJobEvents.length ? (
                    filteredJobEvents.map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(event.level)}`}>{event.level}</span>
                            <span className="text-xs text-zinc-500">{formatTime(event.timestamp)}</span>
                          </div>
                          <p className="mt-2 text-sm text-zinc-100">{event.message}</p>
                          {event.meta && Object.keys(event.meta).length ? (
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-black/25 p-3 text-xs text-zinc-400">
                              {renderObject(event.meta)}
                            </pre>
                          ) : null}
                        </div>
                      ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500">
                      {selectedJob.events?.length ? "No execution events match this filter." : "No execution events recorded yet."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-6 left-4 right-4 z-20 flex w-auto max-w-[320px] flex-col gap-3 md:left-auto md:right-6 md:w-[320px]">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-2xl border p-4 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${toneClass(toast.tone)}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
