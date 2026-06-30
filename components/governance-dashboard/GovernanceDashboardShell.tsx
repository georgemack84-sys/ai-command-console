"use client";

import { Activity, AlertTriangle, BadgeCheck, Bell, ClipboardList, GitBranch, History, Lock, Radar, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { GovernanceDashboardState, GovernanceDashboardView } from "@/types/governance-dashboard";

function stateClass(state: GovernanceDashboardState | "PASS" | "CONDITIONAL_PASS" | "FAIL" | string) {
  if (["HEALTHY", "PASS", "VERIFIED", "VALID", "COMPLETE", "CERTIFIED"].includes(state)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (["WATCH", "CONDITIONAL_PASS", "AVAILABLE", "PENDING", "MONITORING"].includes(state)) return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (["DEGRADED", "FAILED", "FAIL", "BLOCKED", "CRITICAL"].includes(state)) return "border-rose-300/25 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/6 text-slate-100";
}

function panel(label: string, value: string | number, state: string) {
  return (
    <div className="min-h-24 rounded-md border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <Badge className={cn("mt-3", stateClass(state))}>{state}</Badge>
    </div>
  );
}

function refs(values: readonly string[]) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.slice(0, 4).map((value) => <span key={value} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">{value}</span>)}
    </div>
  );
}

export function GovernanceDashboardShell({ view }: { view: GovernanceDashboardView }) {
  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Governance Intelligence</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Governance Dashboard</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={stateClass(view.certification_status.state)}>{view.certification_status.state}</Badge>
              <Badge className={stateClass(view.replay_status.state)}>{view.replay_status.state}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200"><Lock className="mr-1 h-3.5 w-3.5" />Observational</Badge>
            </div>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant <span className="float-right text-white">{view.tenant_id}</span></p>
            <p>Mission <span className="float-right text-white">{view.mission_id}</span></p>
            <p>Hash <span className="float-right max-w-44 truncate text-white">{view.dashboard_hash}</span></p>
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {panel("Governance Health", view.mission_summary.governance_health_score, view.mission_summary.governance_status)}
        {panel("Compliance", view.tenant_summary.tenant_compliance_score, view.tenant_summary.integrity_status)}
        {panel("Risk", view.tenant_summary.aggregate_governance_risk, view.tenant_summary.aggregate_governance_risk < 25 ? "HEALTHY" : "WATCH")}
        {panel("Certified Missions", `${view.tenant_summary.certified_missions}/${view.tenant_summary.active_missions}`, view.certification_status.state)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Activity className="h-5 w-5 text-sky-200" />
            <CardTitle>Governance Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {view.governance_summary.map((metric) => (
              <div key={metric.label} className="rounded-md border border-white/10 p-3">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{metric.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Bell className="h-5 w-5 text-amber-200" />
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.notifications.map((notification) => (
              <div key={notification.notification_id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{notification.type.replace(/_/g, " ")}</p>
                  <Badge className={stateClass(notification.priority)}>{notification.priority}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ClipboardList className="h-5 w-5 text-emerald-200" />
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.recommendations.map((item) => (
              <div key={item.recommendation_id} className="space-y-3 rounded-md border border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{item.recommendation_type}</p>
                  <Badge className={stateClass(item.priority)}>{item.priority}</Badge>
                </div>
                <p className="text-sm text-slate-300">{Math.round(item.confidence * 100)}% confidence</p>
                {refs(item.supporting_evidence)}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-sky-200" />
            <CardTitle>Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.compliance.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between gap-3 rounded-md border border-white/10 p-3">
                <span className="text-sm text-slate-300">{metric.label}</span>
                <Badge className={stateClass(metric.state)}>{metric.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Radar className="h-5 w-5 text-rose-200" />
            <CardTitle>Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.risks.map((metric) => (
              <div key={metric.label} className="rounded-md border border-white/10 p-3">
                <p className="text-sm text-slate-300">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-200" />
            <CardTitle>Escalations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.escalations.map((item) => (
              <div key={item.escalation_id} className="rounded-md border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{item.trigger_reason}</p>
                  <Badge className={stateClass(item.severity)}>{item.severity}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">{item.routing_destination} · {item.resolution_status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-200" />
            <CardTitle>Historical Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.historical_trends.map((point) => (
              <div key={point.timestamp} className="grid grid-cols-4 gap-2 rounded-md border border-white/10 p-3 text-sm">
                <span className="truncate text-slate-400">{point.timestamp.slice(5, 10)}</span>
                <span className="text-white">Health {point.governance_health}</span>
                <span className="text-white">Risk {point.risk_score}</span>
                <span className={cn("text-right", point.certification_status === "PASS" ? "text-emerald-200" : "text-amber-200")}>{point.certification_status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <History className="h-5 w-5 text-sky-200" />
            <CardTitle>Replay Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {panel("Replay", view.replay_status.state, view.replay_status.state)}
            {panel("Reconstruction", view.replay_status.reconstruction_status, view.replay_status.reconstruction_status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-emerald-200" />
            <CardTitle>Certification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 p-3">
              <span className="text-sm text-slate-300">{view.certification_status.certification_id}</span>
              <Badge className={stateClass(view.certification_status.state)}>{view.certification_status.state}</Badge>
            </div>
            {view.certification_status.outstanding_issues.length === 0 ? (
              <p className="text-sm text-slate-400">No outstanding certification issues.</p>
            ) : refs(view.certification_status.outstanding_issues)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <GitBranch className="h-5 w-5 text-sky-200" />
          <CardTitle>Widget Registry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {view.widgets.map((widget) => (
            <div key={widget.widget_id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-medium text-white">{widget.title}</p>
              <p className="mt-1 text-xs text-slate-500">{widget.widget_id} · {widget.order}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
