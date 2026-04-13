export type DashboardSnapshot = {
  generatedAt: string;
  summaryCards: Array<{
    label: string;
    value: string;
    detail: string;
    icon: "LayoutGrid" | "Gauge" | "ShieldCheck" | "Sparkles";
  }>;
  criticalSignals: Array<{
    id: string;
    title: string;
    summary: string;
    severity: string;
    category: string;
    happenedAt: string;
    sourceName: string;
    href: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    state: string;
    tone: string;
    updatedAt: string | null;
    href?: string;
    quickAction?: {
      action: "workspace:generate-summary";
      label: string;
    } | null;
    summary: string;
    meta: Array<{ label: string; value: string }>;
  }>;
  activityFeed: Array<{
    title: string;
    time: string;
    tag: string;
    tone?: "default" | "highlight";
    href?: string;
  }>;
  timelineFeed: Array<{
    title: string;
    time: string;
    tag: string;
    tone?: "default" | "highlight";
    href?: string;
  }>;
  topAlert: {
    id: string;
    title: string;
    type: string;
    severity: string;
    owner: string | null;
    href: string;
  } | null;
};

export type WorkspaceApiSnapshot = {
  workspace: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
  };
  sources: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    updateCadence: string;
    description?: string | null;
    url?: string | null;
  }>;
  updates: Array<{
    id: string;
    title: string;
    summary: string;
    severity: string;
    category: string;
    happenedAt: string;
  }>;
  insights: Array<{
    id: string;
    title: string;
    summary: string;
    type: string;
    confidence: number;
    score?: number;
    createdAt: string;
  }>;
  activity: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    createdAt: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    severity: string;
    status: string;
    createdAt: string;
    readAt?: string | null;
  }>;
};
