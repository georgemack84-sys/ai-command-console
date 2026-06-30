"use client";

import { AlertTriangle, CheckCircle2, FileDiff, Fingerprint, GitBranch, History, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { GovernanceReplayArtifact, GovernanceReplayViewerState, GovernanceReplayViewerView } from "@/types/governance-replay-viewer";

function stateClass(state: string) {
  if (["REPRODUCED", "VERIFIED", "RECONSTRUCTED", "VISIBLE", "MATCH", "PASS"].includes(state)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (["INCOMPLETE", "MISSING", "CONDITIONAL_PASS"].includes(state)) return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (["MISMATCH", "INVALID", "FAIL"].includes(state)) return "border-rose-300/25 bg-rose-400/10 text-rose-100";
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

function artifactList(title: string, items: readonly GovernanceReplayArtifact[]) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.artifact_id} className="rounded-md border border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <Badge className={stateClass(item.state)}>{item.state}</Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{item.explanation}</p>
            <p className="mt-2 truncate text-xs text-slate-500">{item.hash}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GovernanceReplayViewerShell({ view }: { view: GovernanceReplayViewerView }) {
  const mismatchState: GovernanceReplayViewerState = view.replay_state;
  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Governance Replay</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">Governance Replay Viewer</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={stateClass(view.replay_state)}>{view.replay_state}</Badge>
              <Badge className={stateClass(view.verification.certification_outcome)}>{view.verification.certification_outcome}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-200"><Lock className="mr-1 h-3.5 w-3.5" />Read-only</Badge>
            </div>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant <span className="float-right text-white">{view.tenant_id}</span></p>
            <p>Mission <span className="float-right text-white">{view.mission_id}</span></p>
            <p>Replay <span className="float-right max-w-44 truncate text-white">{view.replay_id}</span></p>
          </div>
        </div>
      </SectionShell>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metric("Replay", view.replay_id, view.replay_state)}
        {metric("Timeline Events", view.timeline.length, "VERIFIED")}
        {metric("Mismatches", view.comparison.mismatches.length, mismatchState)}
        {metric("Confidence", `${Math.round(view.verification.replay_confidence * 100)}%`, view.verification.verification_state)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <History className="h-5 w-5 text-sky-200" />
            <CardTitle>Replay Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {view.timeline.map((event) => (
              <div key={event.event_id} className="grid gap-3 rounded-md border border-white/10 p-3 md:grid-cols-[10rem_1fr_auto]">
                <span className="text-xs text-slate-500">{event.timestamp.slice(11, 19)}</span>
                <span className="text-sm text-white">{event.stage.replace(/_/g, " ")}</span>
                <Badge className={stateClass(event.state)}>{event.state}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
            <CardTitle>Replay Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metric("Determinism", String(view.verification.determinism_validated), view.verification.determinism_validated ? "VERIFIED" : "INVALID")}
            {metric("Integrity", String(view.verification.integrity_validated), view.verification.integrity_validated ? "VERIFIED" : "INVALID")}
            {metric("Reconstruction", String(view.verification.reconstruction_complete), view.verification.reconstruction_complete ? "RECONSTRUCTED" : "INCOMPLETE")}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <FileDiff className="h-5 w-5 text-amber-200" />
            <CardTitle>Replay Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-white/10 p-3">
              <p className="text-sm text-slate-400">Exact match</p>
              <p className="mt-2 text-xl font-semibold text-white">{String(view.comparison.exact_match)}</p>
            </div>
            {view.comparison.mismatches.length === 0 ? (
              <p className="text-sm text-slate-400">No replay mismatches detected.</p>
            ) : view.comparison.mismatches.map((item) => (
              <div key={item.mismatch_id} className="rounded-md border border-rose-300/20 bg-rose-400/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{item.category}</p>
                  <Badge className={stateClass(item.severity)}>{item.severity}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <Fingerprint className="h-5 w-5 text-sky-200" />
            <CardTitle>Replay Hashes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(view.hashes).map(([key, value]) => (
              <div key={key} className="rounded-md border border-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key.replace(/_/g, " ")}</p>
                <p className="mt-2 truncate text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {artifactList("Inputs", view.inputs)}
        {artifactList("Policies", view.policies)}
        {artifactList("Risks", view.risks)}
        {artifactList("Compliance", view.compliance)}
        {artifactList("Recommendations", view.recommendations)}
        {artifactList("Escalations", view.escalations)}
        {artifactList("Evidence", view.evidence)}
        {artifactList("Outputs", view.outputs)}
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <GitBranch className="h-5 w-5 text-sky-200" />
          <CardTitle>Replay Explanations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {view.verification.validation_rules.map((rule) => (
            <div key={rule} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                {view.replay_state === "REPRODUCED" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />}
                <p className="text-sm text-slate-300">{rule}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
