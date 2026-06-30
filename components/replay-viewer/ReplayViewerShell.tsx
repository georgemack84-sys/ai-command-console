"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AlertTriangle, FileDiff, Filter, GitBranch, History, Lock, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { ReplayState, ReplayViewerDetail, ReplayViewerRecord, ReplayViewerView } from "@/types/replay-viewer";

function statusClass(value: string) {
  if (["REPRODUCED", "MATCH", "RECONSTRUCTED", "DETERMINISTIC", "VALID", "READY", "ALLOWED"].includes(value)) return "text-emerald-200 border-emerald-300/20 bg-emerald-400/10";
  if (["INCOMPLETE", "PARTIAL", "RESTRICTED", "REDACTED", "DEGRADED", "NOT_COMPARABLE"].includes(value)) return "text-amber-200 border-amber-300/20 bg-amber-400/10";
  if (["MISMATCH", "INVALID", "CORRUPTED", "BROKEN", "NONDETERMINISTIC", "FAILED_CLOSED", "DENIED"].includes(value)) return "text-rose-200 border-rose-300/20 bg-rose-400/10";
  return "text-slate-200 border-white/10 bg-white/6";
}

function refList(refs: readonly string[]) {
  if (refs.length === 0) return <p className="text-sm text-slate-500">None visible</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {refs.map((ref) => <span key={ref} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">{ref}</span>)}
    </div>
  );
}

function metric(label: string, value: string | number) {
  return (
    <div className="min-h-20 rounded-md border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ContextCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="text-sky-200">{icon}</span>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ReplayTable({ records, selectedId, onSelect }: { records: readonly ReplayViewerRecord[]; selectedId: string; onSelect: (record: ReplayViewerRecord) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Replay Artifacts</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <button
            key={record.replay_id}
            type="button"
            onClick={() => onSelect(record)}
            className={cn("grid w-full gap-3 rounded-md border p-3 text-left transition sm:grid-cols-[1fr_auto]", selectedId === record.replay_id ? "border-sky-300/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:bg-white/8")}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium text-white">{record.replay_summary.title}</span>
              <span className="block text-xs text-slate-400">{record.replay_id} · {record.replay_target.target_type}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", statusClass(record.replay_state))}>{record.replay_state}</span>
              {record.visibility.redacted ? <Lock className="h-4 w-4 text-amber-200" aria-label="Restricted" /> : null}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function WarningBanner({ detail }: { detail: ReplayViewerDetail }) {
  if (detail.warnings.length === 0) return null;
  return (
    <div className={cn("rounded-md border p-4", detail.record.replay_state === "INVALID" ? "border-rose-300/25 bg-rose-400/10" : "border-amber-300/25 bg-amber-400/10")}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{detail.record.replay_state === "INVALID" ? "Trusted replay interpretation blocked" : "Replay attention required"}</p>
          {detail.warnings.map((warning) => <p key={warning} className="text-sm text-slate-300">{warning}</p>)}
        </div>
      </div>
    </div>
  );
}

function Detail({ detail }: { detail: ReplayViewerDetail }) {
  const record = detail.record;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{record.replay_summary.title}</CardTitle>
              <p className="mt-2 text-sm text-slate-300">{record.replay_summary.summary}</p>
            </div>
            <Badge className={statusClass(record.replay_state)}>{record.replay_state}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WarningBanner detail={detail} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric("Replay", record.replay_id)}
            {metric("Target", record.replay_target.target_type)}
            {metric("Mismatches", detail.summary.mismatch_count)}
            {metric("Missing Deps", detail.summary.missing_dependency_count)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Badge className={statusClass(detail.input_reconstruction.input_state)}>Input {detail.input_reconstruction.input_state}</Badge>
            <Badge className={statusClass(detail.state_reconstruction.state_reconstruction_state)}>State {detail.state_reconstruction.state_reconstruction_state}</Badge>
            <Badge className={statusClass(detail.output_verification.verification_state)}>Output {detail.output_verification.verification_state}</Badge>
            <Badge className={statusClass(detail.determinism.determinism_state)}>Determinism {detail.determinism.determinism_state}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ContextCard title="Input Reconstruction" icon={<History className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            {detail.input_reconstruction.inputs.map((input) => (
              <div key={input.input_id} className="rounded-md border border-white/10 p-3">
                <p className="text-white">{input.input_id} · {input.input_type}</p>
                <p>{input.visibility} · {input.integrity_state}</p>
              </div>
            ))}
            {detail.input_reconstruction.missing_inputs.length ? <p className="text-amber-200">Missing: {detail.input_reconstruction.missing_inputs.join(", ")}</p> : null}
          </div>
        </ContextCard>
        <ContextCard title="State Reconstruction" icon={<ShieldCheck className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {Object.entries(detail.state_reconstruction.reconstructed_state).map(([key, value]) => value ? <p key={key}>{key}: <span className="text-white">{value}</span></p> : null)}
          </div>
        </ContextCard>
        <ContextCard title="Output Verification" icon={<FileDiff className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Expected: <span className="text-white">{detail.output_verification.expected_output.summary}</span></p>
            <p>Replay: <span className="text-white">{detail.output_verification.replay_output.summary ?? "Missing"}</span></p>
            <p>Exact match: {String(detail.output_verification.comparison.exact_match)}</p>
            {detail.output_verification.comparison.field_mismatches.map((item) => <p key={item.field_path} className="text-rose-200">{item.field_path}: {item.mismatch_type}</p>)}
          </div>
        </ContextCard>
        <ContextCard title="Mismatch Analysis" icon={<AlertTriangle className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            <p className={cn("font-medium", statusClass(detail.mismatch_analysis.mismatch_state).split(" ")[0])}>{detail.mismatch_analysis.mismatch_state}</p>
            {detail.mismatch_analysis.first_detected_mismatch ? <p>{detail.mismatch_analysis.first_detected_mismatch.stage}: {detail.mismatch_analysis.first_detected_mismatch.summary}</p> : <p>No mismatch detected.</p>}
            {detail.mismatch_analysis.root_cause_candidates.map((cause) => <p key={cause.cause_type}>{cause.cause_type} · {cause.confidence}</p>)}
          </div>
        </ContextCard>
        <ContextCard title="Incomplete / Invalid" icon={<Lock className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            {detail.incomplete_replay.incomplete_reasons.map((reason) => <p key={`${reason.reason_type}-${reason.reference_id}`}>{reason.reason_type}: {reason.summary}</p>)}
            {detail.invalid_replay.invalid_reasons.map((reason) => <p key={reason} className="text-rose-200">{reason}</p>)}
            <p>Trusted interpretation blocked: {String(detail.invalid_replay.trusted_interpretation_blocked)}</p>
          </div>
        </ContextCard>
        <ContextCard title="Timeline / Context" icon={<GitBranch className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            {detail.timeline.map((event) => <p key={event.event_id}>{event.stage}: <span className="text-white">{event.state}</span></p>)}
            <p>Evidence</p>
            {refList(detail.evidence_refs)}
            <p>Lineage</p>
            {refList(detail.lineage_refs)}
            <p>Governance</p>
            {refList(detail.governance_refs)}
          </div>
        </ContextCard>
      </div>
    </div>
  );
}

export function ReplayViewerShell({ view }: { view: ReplayViewerView }) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<ReplayState | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState(view.selected_replay.record.replay_id);
  const filtered = useMemo(() => view.records.filter((record) => {
    const text = `${record.replay_id} ${record.truth_record_id} ${record.replay_summary.title} ${record.replay_summary.summary} ${record.replay_state}`.toLowerCase();
    return (state === "ALL" || record.replay_state === state) && (!search || text.includes(search.toLowerCase()));
  }), [search, state, view.records]);
  const selected = view.records.find((record) => record.replay_id === selectedId) ?? filtered[0] ?? view.records[0];
  const detail = selected.replay_id === view.selected_replay.record.replay_id ? view.selected_replay : {
    ...view.selected_replay,
    record: selected,
    summary: { ...view.selected_replay.summary, replay_id: selected.replay_id, truth_record_id: selected.truth_record_id, replay_state: selected.replay_state, integrity_state: selected.integrity.integrity_state },
    warnings: selected.replay_state === "REPRODUCED" ? [] : [`Replay is ${selected.replay_state.toLowerCase()}.`],
  };

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Truth Ledger Reconstruction</p>
            <h1 className="font-display text-3xl font-semibold text-white">Replay Viewer</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Governed read-only inspection for replay state, reconstructed inputs, output verification, mismatch analysis, evidence, lineage, and governance context.
            </p>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant: <span className="text-white">{view.contract.tenant_id}</span></p>
            <p>Operator: <span className="text-white">{view.contract.operator_id}</span></p>
            <p>State: <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(view.state))}>{view.state}</span></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metric("Replays", view.records.length)}
          {metric("Audit Events", view.audit_events.length)}
          {metric("Warnings", view.selected_replay.warnings.length)}
          {metric("Query Hash", view.query_hash.slice(0, 18))}
        </div>
      </SectionShell>
      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search replay artifacts" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={state === "ALL" ? "default" : "outline"} size="sm" onClick={() => setState("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {view.available_filters.replay_states.map((replayState) => (
              <Button key={replayState} variant={state === replayState ? "default" : "outline"} size="sm" onClick={() => setState(replayState)}><Filter className="h-4 w-4" /> {replayState}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <ReplayTable records={filtered} selectedId={detail.record.replay_id} onSelect={(record) => setSelectedId(record.replay_id)} />
        <Detail detail={detail} />
      </div>
    </div>
  );
}
