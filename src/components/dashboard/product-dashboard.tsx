"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FolderOpenDot,
  Gauge,
  LayoutGrid,
  LucideIcon,
  Orbit,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { ActivityList } from "@/src/components/dashboard/activity-list";
import { DashboardSidebar } from "@/src/components/dashboard/dashboard-sidebar";
import { EmptyState } from "@/src/components/dashboard/empty-state";
import { SearchFilterBar } from "@/src/components/dashboard/search-filter-bar";
import { StatCard } from "@/src/components/dashboard/stat-card";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";

type DashboardCard = {
  label: string;
  value: string;
  detail: string;
  icon: "LayoutGrid" | "Gauge" | "ShieldCheck" | "Sparkles";
};

type DashboardWorkspace = {
  name: string;
  state: string;
  tone: string;
  updatedAt: string | null;
  href?: string;
  summary: string;
  meta: Array<{ label: string; value: string }>;
};

type DashboardFeedItem = {
  title: string;
  time: string;
  tag: string;
  tone?: "default" | "highlight";
  href?: string;
};

type DashboardSnapshot = {
  generatedAt: string;
  summaryCards: DashboardCard[];
  workspaces: DashboardWorkspace[];
  activityFeed: DashboardFeedItem[];
  timelineFeed: DashboardFeedItem[];
  topAlert: {
    id: string;
    title: string;
    type: string;
    severity: string;
    owner: string | null;
    href: string;
  } | null;
};

const summaryCardsFallback: DashboardCard[] = [
  {
    label: "Active Workspaces",
    value: "24",
    detail: "+6 this week",
    icon: "LayoutGrid",
  },
  {
    label: "Agent Throughput",
    value: "91%",
    detail: "Stable across routing",
    icon: "Gauge",
  },
  {
    label: "Guardrail Health",
    value: "99.2%",
    detail: "All approvals passing",
    icon: "ShieldCheck",
  },
  {
    label: "Automation Wins",
    value: "128",
    detail: "Manual steps removed",
    icon: "Sparkles",
  },
];

const workspacesFallback: DashboardWorkspace[] = [
  {
    name: "Product Launch",
    state: "Live review",
    tone: "bg-emerald-400",
    updatedAt: new Date().toISOString(),
    href: "/operations",
    summary: "Release notes, design sign-off, and routing QA are aligned and ready for the next decision.",
    meta: [
      { label: "Health", value: "94" },
      { label: "Owners", value: "Design + Eng" },
    ],
  },
  {
    name: "Ops Escalation",
    state: "Needs approval",
    tone: "bg-amber-300",
    updatedAt: new Date().toISOString(),
    href: "/operations",
    summary: "One follow-up is waiting on an approver target before the sweep can continue.",
    meta: [
      { label: "Health", value: "81" },
      { label: "Owners", value: "Platform" },
    ],
  },
  {
    name: "Research Desk",
    state: "Drafting report",
    tone: "bg-sky-300",
    updatedAt: new Date().toISOString(),
    href: "/briefs",
    summary: "Research synthesis is almost publishable, with strong source coverage and one final edit pass.",
    meta: [
      { label: "Health", value: "89" },
      { label: "Owners", value: "Analysts" },
    ],
  },
];

const activityFeedFallback: DashboardFeedItem[] = [
  { title: "Risk digest sent", time: "2 min ago", tag: "Automation", tone: "highlight", href: "/operations" },
  { title: "Brief approved for publish", time: "18 min ago", tag: "Review", href: "/briefs" },
  { title: "Console run completed", time: "36 min ago", tag: "Runtime", href: "/console" },
  { title: "Ownership handoff accepted", time: "1 hr ago", tag: "Collaboration", href: "/operations" },
];

const timelineFeedFallback: DashboardFeedItem[] = [
  { title: "Launch workspace moved into review", time: "08:42", tag: "Workspace", tone: "highlight", href: "/operations" },
  { title: "Automation sweep queued for policy board", time: "09:15", tag: "Queue", href: "/operations" },
  { title: "Research digest draft delivered to ops", time: "09:28", tag: "Report", href: "/reports" },
];

const filterPills = ["All workspaces", "Highest priority", "Needs review", "Recently updated"];

const laneCards = [
  {
    title: "Review lane",
    count: "08",
    detail: "Items that need an operator or approver decision today.",
  },
  {
    title: "Ready to ship",
    count: "14",
    detail: "Work already aligned enough to move without friction.",
  },
  {
    title: "Quiet backlog",
    count: "03",
    detail: "Low-pressure work that can stay visually secondary.",
  },
];

const operatorActions = [
  {
    title: "Run the console",
    description: "Jump straight into the live command desk when you need to route work or inspect runtime output.",
    href: "/console",
    cta: "Open console",
    icon: PlayCircle,
  },
  {
    title: "Check operations",
    description: "Review approvals, automation health, and workspace pressure from the broader control plane.",
    href: "/operations",
    cta: "Open operations",
    icon: Orbit,
  },
  {
    title: "Review briefs",
    description: "Move from status scanning into actual editorial work when the dashboard flags research flow risk.",
    href: "/briefs",
    cta: "Open briefs",
    icon: CheckCircle2,
  },
] as const;

const iconMap = {
  LayoutGrid,
  Gauge,
  ShieldCheck,
  Sparkles,
} as const;

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return "Updated recently";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const deltaMs = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(deltaMs / 60_000));
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

export function ProductDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [actionState, setActionState] = useState<{ status: "idle" | "running" | "done" | "error"; message: string }>({
    status: "idle",
    message: "",
  });
  const [alertActionState, setAlertActionState] = useState<{ status: "idle" | "running" | "done" | "error"; message: string }>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as DashboardSnapshot;
        if (active) {
          setSnapshot(payload);
        }
      } catch {
        // Keep the fallback dashboard visible when live state is unavailable.
      }
    }

    void loadSnapshot();

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = useMemo(() => snapshot?.summaryCards ?? summaryCardsFallback, [snapshot]);
  const workspaces = useMemo(() => snapshot?.workspaces ?? workspacesFallback, [snapshot]);
  const activityFeed = useMemo(() => snapshot?.activityFeed ?? activityFeedFallback, [snapshot]);
  const timelineFeed = useMemo(() => snapshot?.timelineFeed ?? timelineFeedFallback, [snapshot]);

  async function runAlertChecks() {
    setActionState({ status: "running", message: "Running alert checks..." });
    try {
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "alert:run-checks", payload: {} }),
      });
      const payload = (await response.json()) as { ok?: boolean; output?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to run alert checks.");
      }
      setActionState({ status: "done", message: payload.output || "Alert checks completed." });
      const refresh = await fetch("/api/dashboard", { cache: "no-store" });
      if (refresh.ok) {
        setSnapshot((await refresh.json()) as DashboardSnapshot);
      }
    } catch (error) {
      setActionState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to run alert checks.",
      });
    }
  }

  async function acknowledgeTopAlert() {
    if (!snapshot?.topAlert?.id) {
      return;
    }

    setAlertActionState({ status: "running", message: "Acknowledging alert..." });
    try {
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "alert:acknowledge",
          payload: { alertId: snapshot.topAlert.id, owner: "dashboard" },
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; output?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to acknowledge alert.");
      }
      setAlertActionState({ status: "done", message: payload.output || "Alert acknowledged." });
      const refresh = await fetch("/api/dashboard", { cache: "no-store" });
      if (refresh.ok) {
        setSnapshot((await refresh.json()) as DashboardSnapshot);
      }
    } catch (error) {
      setAlertActionState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to acknowledge alert.",
      });
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionShell className="p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_24%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Badge className="border-sky-300/20 bg-sky-300/10 text-sky-100">Workspace Dashboard</Badge>
            <h2 className="mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              A calmer, more believable app surface with stronger operational hierarchy.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This page is intentionally less like a template and more like a real workspace: left rail, top summary, scan-friendly cards,
              search and filter controls, activity modules, and room for empty states without feeling unfinished.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Back home
            </Link>
            <Button variant="default">
              Launch workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
        <DashboardSidebar />

        <div className="space-y-4 xl:space-y-5">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} icon={iconMap[item.icon]} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle>Today&apos;s workspace focus</CardTitle>
                  <CardDescription className="mt-2 max-w-xl">
                    The page leads with active decisions, then fans out into supporting content. That keeps the hierarchy strong and believable.
                  </CardDescription>
                </div>
                <Badge className="border-white/10 bg-white/6 text-slate-200">
                  {snapshot?.generatedAt ? `Live at ${new Date(snapshot.generatedAt).toLocaleTimeString()}` : "Preview"}
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {laneCards.map((lane, index) => (
                  <div
                    key={lane.title}
                    className={cn(
                      "rounded-[24px] border p-4",
                      index === 1 ? "border-sky-300/18 bg-sky-300/10" : "border-white/10 bg-white/[0.045]",
                    )}
                  >
                    <p className="text-sm font-medium text-white">{lane.title}</p>
                    <p className="mt-3 font-display text-3xl font-semibold text-white">{lane.count}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{lane.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent activity</CardTitle>
                    <CardDescription className="mt-2">A dense but still breathable signal feed.</CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent>
                <ActivityList items={activityFeed} compact />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <Card className="p-6">
              <SearchFilterBar pills={filterPills} />

              <div className="mt-6 space-y-4">
                {workspaces.map((workspace, index) => (
                  <Link
                    key={workspace.name}
                    href={workspace.href || "/operations"}
                    className="group rounded-[28px] border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.07]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-xl">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={cn("h-2.5 w-2.5 rounded-full", workspace.tone)} />
                          <p className="text-lg font-semibold text-white">{workspace.name}</p>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs",
                              index === 1 ? "bg-amber-300/14 text-amber-100" : "bg-white/8 text-slate-300",
                            )}
                          >
                            {workspace.state}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{workspace.summary}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">{formatRelativeTime(workspace.updatedAt)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:min-w-[250px]">
                        {workspace.meta.map((item) => (
                          <WorkspaceMeta key={`${workspace.name}-${item.label}`} label={item.label} value={item.value} />
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Automation lane</CardTitle>
                      <CardDescription className="mt-2">Supporting blocks that keep the page feeling active.</CardDescription>
                    </div>
                    <Bot className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-[22px] border border-sky-300/15 bg-sky-300/10 p-4">
                    <p className="text-sm font-medium text-sky-50">Policy review ready</p>
                    <p className="mt-2 text-sm text-sky-100/80">Two workspaces are waiting on governance decisions before rollout.</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <TimerReset className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-200">Digest sweep in 14 minutes</p>
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <FolderOpenDot className="h-4 w-4 text-slate-400" />
                      <p className="text-sm text-slate-200">Research handoff queued for operations</p>
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">Quick operator action</p>
                        <Badge className="border-white/10 bg-white/8 text-slate-200">Inline</Badge>
                      </div>
                      <p className="text-sm text-slate-300">Run the live alert evaluator without leaving the dashboard.</p>
                      <Button
                        variant="outline"
                        onClick={() => void runAlertChecks()}
                        disabled={actionState.status === "running"}
                        className="w-full justify-between"
                      >
                        {actionState.status === "running" ? "Running checks..." : "Run alert checks"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      {actionState.message ? (
                        <p
                          className={cn(
                            "text-xs",
                            actionState.status === "error" ? "text-rose-200" : "text-slate-400",
                          )}
                        >
                          {actionState.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {snapshot?.topAlert ? (
                    <div className="rounded-[22px] border border-amber-300/20 bg-amber-300/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-amber-50">Top active alert</p>
                          <p className="mt-2 text-sm text-amber-100/85">{snapshot.topAlert.title}</p>
                        </div>
                        <Badge className="border-amber-200/20 bg-white/10 text-amber-50">{snapshot.topAlert.severity}</Badge>
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-amber-100/75">{snapshot.topAlert.type}</p>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => void acknowledgeTopAlert()}
                          disabled={alertActionState.status === "running"}
                          className="w-full justify-between border-amber-200/20 bg-white/10 text-amber-50 hover:bg-white/15"
                        >
                          {alertActionState.status === "running" ? "Acknowledging..." : "Acknowledge alert"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Link href={snapshot.topAlert.href} className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-between")}>
                          Open alert context
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        {alertActionState.message ? (
                          <p
                            className={cn(
                              "text-xs",
                              alertActionState.status === "error" ? "text-rose-100" : "text-amber-100/80",
                            )}
                          >
                            {alertActionState.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Timeline</CardTitle>
                      <CardDescription className="mt-2">A compact module that adds rhythm and narrative.</CardDescription>
                    </div>
                    <Sparkles className="h-5 w-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ActivityList items={timelineFeed} />
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Waiting lane</CardTitle>
                <CardDescription className="mt-2">An empty state that still feels intentional and on-brand.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="No blocked handoffs right now"
                  description="When there is nothing urgent to resolve, the interface should still feel composed rather than unfinished or padded."
                  href="/operations"
                  cta="Open operations"
                />
              </CardContent>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle>Product notes</CardTitle>
                  <CardDescription className="mt-2 max-w-xl">
                    This section mirrors how a premium product often balances metrics with narrative and supporting operational context.
                  </CardDescription>
                </div>
                <Link href="/briefs" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open briefs
                </Link>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  "Spacing is kept deliberately roomy on desktop, then tightened in smaller steps for tablet and mobile.",
                  "Cards reuse the same shadow depth and radius family so the system stays unified.",
                  "Accent color is used as hierarchy support, not as decoration everywhere.",
                  "The left rail gives the page structure without overpowering the main content area.",
                ].map((note) => (
                  <div key={note} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-slate-300">
                    {note}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {operatorActions.map((action) => (
              <OperatorActionCard key={action.title} {...action} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkspaceMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/70 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function OperatorActionCard({
  title,
  description,
  href,
  cta,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-[18px] border border-white/10 bg-white/6 p-3 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <Badge className="border-white/10 bg-white/6 text-slate-200">Operator action</Badge>
      </div>
      <div className="mt-5">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-3 leading-6">{description}</CardDescription>
      </div>
      <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full justify-between")}>
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
