"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  FolderOpenDot,
  Gauge,
  LayoutGrid,
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

const summaryCards = [
  {
    label: "Active Workspaces",
    value: "24",
    detail: "+6 this week",
    icon: LayoutGrid,
  },
  {
    label: "Agent Throughput",
    value: "91%",
    detail: "Stable across routing",
    icon: Gauge,
  },
  {
    label: "Guardrail Health",
    value: "99.2%",
    detail: "All approvals passing",
    icon: ShieldCheck,
  },
  {
    label: "Automation Wins",
    value: "128",
    detail: "Manual steps removed",
    icon: Sparkles,
  },
];

const workspaces = [
  {
    name: "Product Launch",
    state: "Live review",
    score: "94",
    owners: "Design + Eng",
    tone: "bg-emerald-400",
    updated: "Updated 7 minutes ago",
    summary: "Release notes, design sign-off, and routing QA are aligned and ready for the next decision.",
  },
  {
    name: "Ops Escalation",
    state: "Needs approval",
    score: "81",
    owners: "Platform",
    tone: "bg-amber-300",
    updated: "Updated 21 minutes ago",
    summary: "One follow-up is waiting on an approver target before the sweep can continue.",
  },
  {
    name: "Research Desk",
    state: "Drafting report",
    score: "89",
    owners: "Analysts",
    tone: "bg-sky-300",
    updated: "Updated 43 minutes ago",
    summary: "Research synthesis is almost publishable, with strong source coverage and one final edit pass.",
  },
];

const activityFeed = [
  { title: "Risk digest sent", time: "2 min ago", tag: "Automation", tone: "highlight" as const },
  { title: "Brief approved for publish", time: "18 min ago", tag: "Review" },
  { title: "Console run completed", time: "36 min ago", tag: "Runtime" },
  { title: "Ownership handoff accepted", time: "1 hr ago", tag: "Collaboration" },
];

const timelineFeed = [
  { title: "Launch workspace moved into review", time: "08:42", tag: "Workspace", tone: "highlight" as const },
  { title: "Automation sweep queued for policy board", time: "09:15", tag: "Queue" },
  { title: "Research digest draft delivered to ops", time: "09:28", tag: "Report" },
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

export function ProductDashboard() {
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
              <StatCard key={item.label} {...item} />
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
                <Badge className="border-white/10 bg-white/6 text-slate-200">Updated live</Badge>
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
                  <div
                    key={workspace.name}
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
                        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">{workspace.updated}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:min-w-[250px]">
                        <WorkspaceMeta label="Health" value={workspace.score} />
                        <WorkspaceMeta label="Owners" value={workspace.owners} />
                      </div>
                    </div>
                  </div>
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
