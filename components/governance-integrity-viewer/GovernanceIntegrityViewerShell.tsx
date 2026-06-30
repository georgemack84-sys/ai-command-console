"use client";

import { AlertTriangle, CheckCircle2, Fingerprint, History, Link2, Lock, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { GovernanceIntegrityViewerView } from "@/types/governance-integrity-viewer";

function stateClass(state: string) {
  if (["VALID", "PASS", "VERIFIED", "TRUSTED", "CLEAR", "true"].includes(state)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (["DEGRADED", "CONDITIONAL_PASS", "WATCH", "PENDING", "OPEN"].includes(state)) return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (["CORRUPTED", "FAIL", "BLOCKED", "CRITICAL", "REQUIRES_RECOVERY", "false"].includes(state)) return "border-rose-300/25 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/6 text-slate-100";
}

function metric(label: string, value: string | number, state: string) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <Badge className={cn("mt-3", stateClass(state))}>{state}</Badge>
    </div>
  );
}

export function GovernanceIntegrityViewerShell({ view }: { view: GovernanceIntegrityViewerView }) {
  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">Governance Integrity</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Governance Integrity Viewer</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={stateClass(view.integrity_state)}>{view.integrity_state}</Badge>
              <Badge className={stateClass(view.certification_state)}>{view.certification_state}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200"><Lock className="mr-1 h-3.5 w-3.5" />Read-only</Badge>
            </div>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant <span className="float-right text-white">{view.tenant_id}</span></p>
            <p>Mission <span className="float-right text-white">{view.mission_id}</span></p>
            <p>Chain <span className="float-right max-w-44 truncate text-white">{view.chain_id}</span></p>
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metric("Trust Score", `${Math.round(view.trust_indicators.overall_trust_score * 100)}%`, view.trust_indicators.governance_trust_level)}
        {metric("Protected Records", view.protected_record_count, view.integrity_state)}
        {metric("Tamper Alerts", view.tamper_alerts.length, view.tamper_alerts.some((alert) => alert.severity === "CRITICAL") ? "CRITICAL" : "CLEAR")}
        {metric("Corruption Indicators", view.corruption_indicators.length, view.corruption_indicators.length === 0 ? "VALID" : view.integrity_state)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
            <CardTitle>Integrity Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metric("Chain Continuity", String(view.chain_continuity), String(view.chain_continuity))}
            {metric("Chain Completeness", String(view.chain_completeness), String(view.chain_completeness))}
            {metric("Hash Repair", String(view.hash_repair_allowed), String(view.hash_repair_allowed))}
            {metric("Verification Mutation", String(view.verification_mutation_allowed), String(view.verification_mutation_allowed))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Fingerprint className="h-5 w-5 text-cyan-200" />
            <CardTitle>Hash Chain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {view.hashes.map((hash) => (
              <div key={hash.hash_id} className="grid gap-3 rounded-md border border-white/10 p-3 md:grid-cols-[4rem_1fr_auto]">
                <span className="text-xs text-slate-500">#{hash.chain_position}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{hash.governance_object_id}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{hash.current_hash}</p>
                </div>
                <Badge className={stateClass(hash.verification_status)}>{hash.verification_status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-200" />
            <CardTitle>Verification Viewer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.verification_results.map((result) => (
              <div key={`${result.verification_id}:${result.module}`} className="rounded-md border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{result.module}</p>
                  <Badge className={stateClass(result.state)}>{result.state}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{result.message}</p>
                {result.failure ? <p className="mt-2 text-xs text-rose-200">{result.failure}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-200" />
            <CardTitle>Tamper Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.tamper_alerts.map((alert) => (
              <div key={alert.alert_id} className="rounded-md border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{alert.reason}</p>
                  <Badge className={stateClass(alert.severity)}>{alert.severity}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{alert.detection_timestamp}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className={stateClass(alert.investigation_status)}>{alert.investigation_status}</Badge>
                  <Badge className={stateClass(alert.resolution_status)}>{alert.resolution_status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <History className="h-5 w-5 text-cyan-200" />
            <CardTitle>Integrity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {view.timeline.map((event) => (
              <div key={event.event_id} className="grid gap-3 rounded-md border border-white/10 p-3 md:grid-cols-[10rem_1fr_auto]">
                <span className="text-xs text-slate-500">{event.timestamp.slice(11, 19)}</span>
                <span className="text-sm text-white">{event.summary}</span>
                <Badge className={stateClass(event.integrity_state)}>{event.event_type.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-200" />
            <CardTitle>Trust And Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metric("Verification", `${Math.round(view.trust_indicators.verification_confidence * 100)}%`, view.integrity_state)}
            {metric("Hash", `${Math.round(view.trust_indicators.hash_confidence * 100)}%`, view.integrity_state)}
            {metric("Replay", `${Math.round(view.trust_indicators.replay_confidence * 100)}%`, view.integrity_state)}
            {metric("Certification Stability", `${Math.round(view.trends.certification_stability * 100)}%`, view.certification_state)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Certification History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {view.certification_history.map((item) => (
              <div key={item.certification_id} className="rounded-md border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">{item.certification_id}</p>
                  <Badge className={stateClass(item.certification_state)}>{item.certification_state}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.validation_scope}</p>
                <p className="mt-2 truncate text-xs text-slate-500">{item.report_hash}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Audit References</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Link2 className="h-4 w-4" />Evidence</div>
              {view.evidence_refs.slice(0, 8).map((ref) => <p key={ref} className="mt-2 truncate text-xs text-slate-400">{ref}</p>)}
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><CheckCircle2 className="h-4 w-4" />Replay And Lineage</div>
              {[...view.replay_refs, ...view.lineage_refs].slice(0, 8).map((ref) => <p key={ref} className="mt-2 truncate text-xs text-slate-400">{ref}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
