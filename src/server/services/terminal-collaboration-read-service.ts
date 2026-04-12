type TerminalInboxItem = {
  type?: string;
  title?: string;
  detail?: string;
  status?: string;
  read?: boolean;
  acknowledged?: boolean;
};

type TerminalNotificationDigest = {
  open?: number;
  unread?: number;
  acknowledged?: number;
  ownership?: number;
  handoffs?: number;
  approvals?: number;
  trust?: number;
};

type TerminalOverviewLike = {
  collaboration?: {
    [key: string]: unknown;
    inbox?: TerminalInboxItem[];
    notificationHistory?: TerminalInboxItem[];
    notificationDigest?: TerminalNotificationDigest;
    approvals?: Array<Record<string, unknown>>;
    handoffs?: Array<Record<string, unknown>>;
  };
};

function collaborationFromOverview(overview: TerminalOverviewLike) {
  return overview?.collaboration || {};
}

function fallbackInboxItems(overview: TerminalOverviewLike): TerminalInboxItem[] {
  const collaboration = collaborationFromOverview(overview);
  const approvals = Array.isArray(collaboration.approvals) ? collaboration.approvals : [];
  const handoffs = Array.isArray(collaboration.handoffs) ? collaboration.handoffs : [];

  const approvalItems = approvals.slice(0, 8).map((approval) => ({
    type: "approval",
    title: String(approval.label || "Approval"),
    detail:
      approval.status === "pending"
        ? `${String(approval.requestedByName || "Someone")} requested ${String(approval.requestedStatus || "approval")}.`
        : `${String(approval.requestedByName || "Someone")} request is ${String(approval.status || "resolved")}.`,
    status: String(approval.status || "open"),
    read: false,
    acknowledged: false,
  }));

  const handoffItems = handoffs
    .filter((handoff) => String(handoff.status || "open") === "open")
    .slice(0, 8)
    .map((handoff) => ({
      type: "handoff",
      title: String(handoff.title || "Handoff"),
      detail: `${String(handoff.assignedByName || "Someone")} assigned this handoff to ${String(handoff.assignedTo || "team")}. ${String(handoff.note || "")}`.trim(),
      status: String(handoff.status || "open"),
      read: false,
      acknowledged: false,
    }));

  return [...approvalItems, ...handoffItems].slice(0, 12);
}

function formatItems(title: string, items: TerminalInboxItem[], emptyMessage: string) {
  if (!items.length) {
    return `${title}\n${emptyMessage}`;
  }

  return [
    title,
    ...items.map(
      (item) =>
        `- [${item.type || "item"}] ${item.title || "Untitled"}\n  ${item.detail || ""}\n  Status: ${item.status || "open"}${item.read ? " • read" : ""}${item.acknowledged ? " • acknowledged" : ""}`,
    ),
  ].join("\n");
}

export function formatTerminalInboxList(overview: TerminalOverviewLike) {
  const inboxItems = Array.isArray(collaborationFromOverview(overview).inbox)
    ? collaborationFromOverview(overview).inbox!
    : [];
  const items = inboxItems.length ? inboxItems : fallbackInboxItems(overview);
  return formatItems("Operator inbox", items, "No assignment, handoff, or approval items need attention.");
}

export function formatTerminalInboxHistory(overview: TerminalOverviewLike) {
  const items = Array.isArray(collaborationFromOverview(overview).notificationHistory)
    ? collaborationFromOverview(overview).notificationHistory!
    : [];
  return formatItems("Notification history", items, "No notification activity has been recorded for this user yet.");
}

export function formatTerminalInboxDigest(overview: TerminalOverviewLike) {
  const digest = collaborationFromOverview(overview).notificationDigest || {};
  return [
    "Notification digest",
    `Open: ${Number(digest.open || 0)}`,
    `Unread: ${Number(digest.unread || 0)}`,
    `Acknowledged: ${Number(digest.acknowledged || 0)}`,
    `Ownership: ${Number(digest.ownership || 0)}`,
    `Handoffs: ${Number(digest.handoffs || 0)}`,
    `Approvals: ${Number(digest.approvals || 0)}`,
    `Trust: ${Number(digest.trust || 0)}`,
  ].join("\n");
}

export function formatTerminalTrustReport(overview: TerminalOverviewLike) {
  const collaboration = collaborationFromOverview(overview);
  const environments = Array.isArray(collaboration.approvalTrustEnvironments)
    ? (collaboration.approvalTrustEnvironments as Array<Record<string, unknown>>)
    : [];
  const trends = Array.isArray(collaboration.approvalTrustTrends)
    ? (collaboration.approvalTrustTrends as Array<Record<string, unknown>>)
    : [];
  const families = Array.isArray(collaboration.approvalRecommendationFamilies)
    ? (collaboration.approvalRecommendationFamilies as Array<Record<string, unknown>>)
    : [];
  const signals = Array.isArray(collaboration.approvalTrustSignals)
    ? (collaboration.approvalTrustSignals as Array<Record<string, unknown>>)
    : [];
  const completedTrustIncidents = Array.isArray(collaboration.completedTrustIncidents)
    ? (collaboration.completedTrustIncidents as Array<Record<string, unknown>>)
    : [];
  const completedTrustEnvironments = Array.isArray(collaboration.completedTrustEnvironments)
    ? (collaboration.completedTrustEnvironments as Array<Record<string, unknown>>)
    : [];
  const environmentTrustRecaps = Array.isArray(collaboration.environmentTrustRecaps)
    ? (collaboration.environmentTrustRecaps as Array<Record<string, unknown>>)
    : [];

  const environmentLines = environments.length
    ? environments.map(
        (item) =>
          `- ${String(item.environment || "unknown")}: score ${String(item.score ?? 0)}, alerts ${String(item.alertCount ?? 0)}, regressed ${String(item.regressedCount ?? 0)}, improved ${String(item.improvedCount ?? 0)}`,
      )
    : ["- No environment trust data."];

  const trendLines = trends.length
    ? trends.map(
        (item) =>
          `- ${String(item.environment || "unknown")}: 24h ${String((item.deltas as Record<string, unknown> | undefined)?.day ?? "n/a")}, 7d ${String((item.deltas as Record<string, unknown> | undefined)?.week ?? "n/a")}, 30d ${String((item.deltas as Record<string, unknown> | undefined)?.month ?? "n/a")}`,
      )
    : ["- No trust trends recorded."];

  const familyLines = families.length
    ? families.map(
        (item) =>
          `- ${String(item.label || "unknown")}: recommendations ${String(item.recommendationCount ?? 0)}, promoted ${String(item.promotedCount ?? 0)}, rolled back ${String(item.rolledBackCount ?? 0)}, trust alerts ${String(item.trustSignalCount ?? 0)}`,
      )
    : ["- No recommendation family history recorded."];

  const signalLines = signals.length
    ? signals.map((item) => `- ${String(item.title || "Untitled")}: ${String(item.detail || "")}`)
    : ["- No active trust alerts."];

  const completedLines = completedTrustIncidents.length
    ? completedTrustIncidents.map(
        (item) =>
          `- ${String(item.workspaceName || "Unknown workspace")} (${String(item.environment || "unknown")}) archived ${String(item.archivedAt || "n/a")}: ${String(item.summary || "")}`,
      )
    : ["- No completed trust incidents recorded."];

  const completedEnvironmentLines = completedTrustEnvironments.length
    ? completedTrustEnvironments.map(
        (item) =>
          `- ${String(item.environment || "unknown")}: ${String(item.archivedCount ?? 0)} archived trust incidents${item.latestArchivedAt ? `, latest ${String(item.latestArchivedAt)}` : ""}${Array.isArray(item.recentWorkspaces) && item.recentWorkspaces.length ? ` (${item.recentWorkspaces.join(", ")})` : ""}`,
      )
    : ["- No completed trust environment summaries recorded."];

  const environmentRecapLines = environmentTrustRecaps.length
    ? environmentTrustRecaps.map(
        (item) =>
          `- ${String(item.environment || "unknown")}: score ${String(item.score ?? 0)}, active trust ${String(item.activeSignals ?? 0)}, completed archived ${String(item.completedArchived ?? 0)}${item.latestArchivedAt ? `, latest archive ${String(item.latestArchivedAt)}` : ""}`,
      )
    : ["- No environment trust recaps recorded."];

  return [
    "Trust report",
    "",
    "Environment summary",
    ...environmentLines,
    "",
    "Environment recaps",
    ...environmentRecapLines,
    "",
    "Trend summary",
    ...trendLines,
    "",
    "Recommendation families",
    ...familyLines,
    "",
    "Completed trust by environment",
    ...completedEnvironmentLines,
    "",
    "Completed trust incidents",
    ...completedLines,
    "",
    "Active trust alerts",
    ...signalLines,
  ].join("\n");
}
