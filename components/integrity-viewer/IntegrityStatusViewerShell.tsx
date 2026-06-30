"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AlertTriangle, FileWarning, Filter, Hash, History, Lock, Search, ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { IntegrityStatusRecord, IntegrityStatusViewerDetail, IntegrityStatusViewerView, IntegrityViewerIntegrityState } from "@/types/integrity-viewer";

function statusClass(value: string) {
  if (["VALID", "PASS", "CLEAR", "ALLOWED", "READY"].includes(value)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (["DEGRADED", "CONDITIONAL_PASS", "SUSPECTED", "WARN", "PARTIAL", "UNKNOWN", "UNVERIFIED", "REDACTED", "RESTRICTED"].includes(value)) return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (["CORRUPTED", "FAIL", "CONFIRMED", "BROKEN", "BLOCKED", "DENIED", "FAILED_CLOSED"].includes(value)) return "border-rose-300/20 bg-rose-400/10 text-rose-200";
  return "border-white/10 bg-white/6 text-slate-200";
}

function metric(label: string, value: string | number) {
  return (
    <div className="min-h-20 rounded-md border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function refs(refs: readonly string[]) {
  if (!refs.length) return <p className="text-sm text-slate-500">None visible</p>;
  return <div className="flex flex-wrap gap-2">{refs.map((ref) => <span key={ref} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">{ref}</span>)}</div>;
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

function RecordList({ records, selectedId, onSelect }: { records: readonly IntegrityStatusRecord[]; selectedId: string; onSelect: (record: IntegrityStatusRecord) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Integrity Records</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <button
            key={record.integrity_status_id}
            type="button"
            onClick={() => onSelect(record)}
            className={cn("grid w-full gap-3 rounded-md border p-3 text-left transition sm:grid-cols-[1fr_auto]", selectedId === record.integrity_status_id ? "border-sky-300/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:bg-white/8")}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium text-white">{record.title}</span>
              <span className="block text-xs text-slate-400">{record.target.target_type} · {record.target.target_id}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", statusClass(record.integrity_state))}>{record.integrity_state}</span>
              <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", statusClass(record.tamper_detection_state))}>{record.tamper_detection_state}</span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function WarningBanner({ detail }: { detail: IntegrityStatusViewerDetail }) {
  if (!detail.warnings.length) return null;
  return (
    <div className={cn("rounded-md border p-4", detail.record.integrity_state === "CORRUPTED" ? "border-rose-300/25 bg-rose-400/10" : "border-amber-300/25 bg-amber-400/10")}>
      <div className="flex items-start gap-3">
        {detail.record.integrity_state === "CORRUPTED" ? <ShieldX className="mt-0.5 h-5 w-5 text-rose-200" /> : <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />}
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{detail.record.impact.trusted_interpretation_allowed ? "Integrity attention required" : "Trusted interpretation blocked"}</p>
          {detail.warnings.map((warning) => <p key={warning} className="text-sm text-slate-300">{warning}</p>)}
        </div>
      </div>
    </div>
  );
}

function Detail({ detail }: { detail: IntegrityStatusViewerDetail }) {
  const record = detail.record;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{record.title}</CardTitle>
              <p className="mt-2 text-sm text-slate-300">{record.summary}</p>
            </div>
            <Badge className={statusClass(record.integrity_state)}>{record.integrity_state}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WarningBanner detail={detail} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric("Target", record.target.target_type)}
            {metric("Certification", record.certification_state)}
            {metric("Hash Chain", record.hash_chain_state)}
            {metric("Tamper", record.tamper_detection_state)}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Evidence Impact</p>{refs(record.refs.evidence_refs)}</div>
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Replay Impact</p>{refs(record.refs.replay_refs)}</div>
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Governance Impact</p>{refs(record.refs.governance_refs)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ContextCard title="Record Checks" icon={<ShieldCheck className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.record_integrity.checks.map((check) => (
              <p key={check.check_id} className="flex items-center justify-between gap-3">
                <span>{check.check_type}</span>
                <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(check.result))}>{check.result}</span>
              </p>
            ))}
          </div>
        </ContextCard>
        <ContextCard title="Hash Chain" icon={<Hash className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.hash_chain.hash_links.map((link) => <p key={`${link.source_hash}-${link.target_hash}`}>{link.source_hash} to {link.target_hash}: <span className={link.valid ? "text-emerald-200" : "text-rose-200"}>{link.valid ? "valid" : "broken"}</span></p>)}
            {refs(detail.hash_chain.broken_links)}
          </div>
        </ContextCard>
        <ContextCard title="Tamper Detection" icon={<FileWarning className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>State: <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(detail.tamper_detection.tamper_detection_state))}>{detail.tamper_detection.tamper_detection_state}</span></p>
            {detail.tamper_detection.alerts.map((alert) => <p key={alert.tamper_alert_id}>{alert.indicator}: <span className="text-white">{alert.confidence}</span> · {alert.summary}</p>)}
          </div>
        </ContextCard>
        <ContextCard title="Verification / Certification" icon={<Lock className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Verification: <span className="text-white">{detail.verification_result.result}</span></p>
            <p>Verified at: <span className="text-white">{detail.verification_result.verified_at ?? "pending"}</span></p>
            <p>Certification: <span className="text-white">{detail.certification_gate.certification_state}</span></p>
            <p>Trusted interpretation: <span className={detail.certification_gate.trusted_interpretation_allowed ? "text-emerald-200" : "text-rose-200"}>{detail.certification_gate.trusted_interpretation_allowed ? "allowed" : "blocked"}</span></p>
          </div>
        </ContextCard>
        <ContextCard title="Blast Radius" icon={<AlertTriangle className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Severity: <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(detail.blast_radius.severity))}>{detail.blast_radius.severity}</span></p>
            {refs([...detail.blast_radius.affected_truth_records, ...detail.blast_radius.affected_evidence, ...detail.blast_radius.affected_replays])}
          </div>
        </ContextCard>
        <ContextCard title="History" icon={<History className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.history.events.map((event) => <p key={`${event.timestamp}-${event.integrity_state}`}>{event.timestamp}: <span className="text-white">{event.integrity_state}</span> · {event.summary}</p>)}
          </div>
        </ContextCard>
      </div>
    </div>
  );
}

export function IntegrityStatusViewerShell({ view }: { view: IntegrityStatusViewerView }) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<IntegrityViewerIntegrityState | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState(view.selected_record.record.integrity_status_id);
  const filtered = useMemo(() => view.records.filter((record) => {
    const haystack = `${record.integrity_status_id} ${record.target.target_id} ${record.title} ${record.summary} ${record.integrity_state}`.toLowerCase();
    return (state === "ALL" || record.integrity_state === state) && (!search || haystack.includes(search.toLowerCase()));
  }), [search, state, view.records]);
  const selected = view.records.find((record) => record.integrity_status_id === selectedId) ?? filtered[0] ?? view.records[0];
  const detail = selected.integrity_status_id === view.selected_record.record.integrity_status_id ? view.selected_record : {
    ...view.selected_record,
    record: selected,
    warnings: selected.integrity_state === "VALID" ? [] : [`Integrity record is ${selected.integrity_state.toLowerCase()}.`],
  };

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Truth Ledger Integrity</p>
            <h1 className="font-display text-3xl font-semibold text-white">Integrity Status Viewer</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Read-only visibility into record integrity, ledger segments, hash chains, tamper alerts, verification results, certification gates, dependency impact, and historical integrity state.
            </p>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant: <span className="text-white">{view.contract.tenant_id}</span></p>
            <p>Operator: <span className="text-white">{view.contract.operator_id}</span></p>
            <p>State: <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(view.state))}>{view.state}</span></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metric("Records", view.records.length)}
          {metric("Corrupted", view.selected_record.summary.corrupted_count)}
          {metric("Tamper Confirmed", view.selected_record.summary.confirmed_tamper_count)}
          {metric("Query Hash", view.query_hash.slice(0, 18))}
        </div>
      </SectionShell>
      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search integrity records" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={state === "ALL" ? "default" : "outline"} size="sm" onClick={() => setState("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {view.available_filters.integrity_states.map((item) => (
              <Button key={item} variant={state === item ? "default" : "outline"} size="sm" onClick={() => setState(item)}><Filter className="h-4 w-4" /> {item}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <RecordList records={filtered} selectedId={detail.record.integrity_status_id} onSelect={(record) => setSelectedId(record.integrity_status_id)} />
        <Detail detail={detail} />
      </div>
    </div>
  );
}
