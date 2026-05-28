import { prisma } from "@/src/server/db/prisma";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import type { DashboardSnapshot } from "@/src/types/platform";

function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

function toneFromSeverity(severity?: string) {
  if (severity === "critical") return "bg-rose-300";
  if (severity === "high") return "bg-amber-300";
  if (severity === "medium") return "bg-sky-300";
  return "bg-emerald-400";
}

export async function buildDashboardSnapshot(workspaceId: string): Promise<DashboardSnapshot> {
  const alertsEnabled = await isFeatureEnabled("alerts_v2", workspaceId);
  const [workspace, updates, insights, activity, sources, activeTopAlert, latestAlert] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: { members: true },
    }),
    prisma.monitoredUpdate.findMany({
      where: { workspaceId },
      include: { source: true },
      orderBy: { happenedAt: "desc" },
      take: 8,
    }),
    prisma.insight.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.activityEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.source.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.monitoredUpdate.findFirst({
      where: {
        workspaceId,
        severity: { in: ["high", "critical"] },
        status: { not: "acknowledged" },
      },
      orderBy: { happenedAt: "desc" },
    }),
    alertsEnabled
      ? prisma.alert.findFirst({
          where: { workspaceId, status: "unread" },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const highSeverityCount = updates.filter(
    (update) => (update.severity === "high" || update.severity === "critical") && update.status !== "acknowledged",
  ).length;
  const healthySources = sources.filter((source) => source.status === "healthy").length;
  const criticalSignals = updates
    .filter((update) => (update.severity === "high" || update.severity === "critical") && update.status !== "acknowledged")
    .slice(0, 5)
    .map((update) => ({
      id: update.id,
      title: update.title,
      summary: update.summary,
      severity: update.severity,
      category: update.category,
      happenedAt: update.happenedAt.toISOString(),
      sourceName: update.source.name,
      href: "/reports",
    }));

  return {
    generatedAt: new Date().toISOString(),
    summaryCards: [
      {
        label: "Tracked Sources",
        value: String(sources.length),
        detail: `${healthySources} healthy right now`,
        icon: "LayoutGrid",
      },
      {
        label: "Critical Signals",
        value: String(highSeverityCount),
        detail: "Items needing fast operator review",
        icon: "Gauge",
      },
      {
        label: "Insight Confidence",
        value: insights.length ? `${Math.round(insights.reduce((total, item) => total + item.confidence, 0) / insights.length)}%` : "0%",
        detail: "Average confidence across recent insights",
        icon: "ShieldCheck",
      },
      {
        label: "Workspace Activity",
        value: String(activity.length),
        detail: "Recent events across the control plane",
        icon: "Sparkles",
      },
    ],
    criticalSignals,
    workspaces: [
      {
        id: workspace.id,
        name: workspace.name,
        state: highSeverityCount > 0 ? "Needs review" : "Healthy",
        tone: toneFromSeverity(updates[0]?.severity),
        updatedAt: updates[0]?.happenedAt.toISOString() ?? null,
        href: "/briefs",
        quickAction: {
          action: "workspace:generate-summary",
          label: "Generate summary",
        },
        summary: workspace.description,
        meta: [
          { label: "Members", value: String(workspace.members.length) },
          { label: "Plan", value: workspace.plan },
        ],
      },
      ...sources.slice(0, 2).map((source) => ({
        id: source.id,
        name: source.name,
        state: source.status === "healthy" ? "Monitoring" : source.status === "degraded" ? "Watch closely" : "Paused",
        tone: source.status === "healthy" ? "bg-emerald-400" : source.status === "degraded" ? "bg-amber-300" : "bg-slate-400",
        updatedAt: source.updatedAt.toISOString(),
        href: "/reports",
        quickAction: null,
        summary: source.description,
        meta: [
          { label: "Type", value: source.type },
          { label: "Cadence", value: source.updateCadence },
        ],
      })),
    ],
    activityFeed: activity.slice(0, 4).map((entry, index) => ({
      title: entry.title,
      time: relativeTime(entry.createdAt),
      tag: entry.type.split(".").pop() || "Activity",
      tone: index === 0 ? "highlight" : "default",
      href: "/operations",
    })),
    timelineFeed: updates.slice(0, 3).map((entry, index) => ({
      title: entry.title,
      time: entry.happenedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tag: entry.category,
      tone: index === 0 ? "highlight" : "default",
      href: "/reports",
    })),
    topAlert: latestAlert
      ? {
          id: latestAlert.id,
          title: latestAlert.title,
          type: latestAlert.type,
          severity: latestAlert.severity,
          owner: null,
          href: "/reports",
        }
      : activeTopAlert
        ? {
            id: activeTopAlert.id,
            title: activeTopAlert.title,
            type: activeTopAlert.category,
            severity: activeTopAlert.severity,
            owner: null,
            href: "/reports",
          }
        : null,
  };
}
