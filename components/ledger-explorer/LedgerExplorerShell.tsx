"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AlertTriangle, Archive, FileText, Filter, GitBranch, History, Network, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { LedgerExplorerDetail, LedgerExplorerRecord, LedgerExplorerView } from "@/types/ledger-explorer";
import type { TruthDashboardRecordType } from "@/types/truth-dashboard";

function statusClass(value: string) {
  if (["VALID", "VERIFIED", "READY", "COMPLETE", "PASSED", "ALLOWED"].includes(value)) return "text-emerald-200 border-emerald-300/20 bg-emerald-400/10";
  if (["DEGRADED", "UNKNOWN", "RESTRICTED", "REDACTED", "PARTIAL", "CREATED", "WARNED", "ESCALATED"].includes(value)) return "text-amber-200 border-amber-300/20 bg-amber-400/10";
  if (["CORRUPTED", "BROKEN", "FAILED_CLOSED", "DENIED", "FAILED", "BLOCKED"].includes(value)) return "text-rose-200 border-rose-300/20 bg-rose-400/10";
  return "text-slate-200 border-white/10 bg-white/6";
}

function refList(refs: readonly string[]) {
  if (refs.length === 0) return <p className="text-sm text-slate-500">None visible</p>;
  return <div className="flex flex-wrap gap-2">{refs.map((ref) => <span key={ref} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">{ref}</span>)}</div>;
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

function RecordIndex({ records, selectedId, onSelect }: { records: readonly LedgerExplorerRecord[]; selectedId: string; onSelect: (record: LedgerExplorerRecord) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Ledger Index</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <button
            key={record.truth_record_id}
            type="button"
            onClick={() => onSelect(record)}
            className={cn("grid w-full gap-3 rounded-md border p-3 text-left transition sm:grid-cols-[1fr_auto]", selectedId === record.truth_record_id ? "border-sky-300/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:bg-white/8")}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium text-white">{record.title}</span>
              <span className="block text-xs text-slate-400">{record.truth_record_id} · {record.ledger_entry_id} · {record.event_type}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", statusClass(record.integrity_state))}>{record.integrity_state}</span>
              <span className="text-xs text-slate-500">#{record.ledger_position.sequence_number}</span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function WarningBanner({ detail }: { detail: LedgerExplorerDetail }) {
  if (detail.warnings.length === 0) return null;
  return (
    <div className={cn("rounded-md border p-4", detail.record.integrity_state === "CORRUPTED" ? "border-rose-300/25 bg-rose-400/10" : "border-amber-300/25 bg-amber-400/10")}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{detail.record.integrity_state === "CORRUPTED" ? "Trusted interpretation blocked" : "Ledger attention required"}</p>
          {detail.warnings.map((warning) => <p key={warning} className="text-sm text-slate-300">{warning}</p>)}
        </div>
      </div>
    </div>
  );
}

function Detail({ detail }: { detail: LedgerExplorerDetail }) {
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
            <Badge className={statusClass(detail.access_result)}>{detail.access_result}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WarningBanner detail={detail} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric("Sequence", record.ledger_position.sequence_number ?? "n/a")}
            {metric("Type", record.event_type)}
            {metric("Lifecycle", record.lifecycle_state)}
            {metric("Integrity", record.integrity_state)}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Evidence</p>{refList(record.references.evidence_refs)}</div>
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Replay</p>{refList(record.references.replay_refs)}</div>
            <div className="rounded-md border border-white/10 p-3"><p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Governance</p>{refList(record.references.governance_refs)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ContextCard title="Ledger Position" icon={<FileText className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Partition: <span className="text-white">{detail.drilldown.ledger_metadata.partition_id}</span></p>
            <p>Previous hash: <span className="text-white">{detail.drilldown.ledger_metadata.previous_hash ?? "genesis"}</span></p>
            <p>Current hash: <span className="text-white">{detail.drilldown.ledger_metadata.current_hash}</span></p>
            <p>Next hash: <span className="text-white">{detail.drilldown.ledger_metadata.next_hash}</span></p>
          </div>
        </ContextCard>
        <ContextCard title="Timeline" icon={<History className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.timeline.slice(0, 6).map((event) => <p key={event.timeline_event_id}>{event.sequence_number}. {event.event_type}: <span className="text-white">{event.title}</span></p>)}
          </div>
        </ContextCard>
        <ContextCard title="Relationship Graph" icon={<Network className="h-5 w-5" />}>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p>Nodes: <span className="text-white">{detail.graph.nodes.length}</span></p>
            <p>Edges: <span className="text-white">{detail.graph.edges.length}</span></p>
            <div className="sm:col-span-2">{refList(detail.graph.edges.slice(0, 5).map((edge) => edge.relationship_type))}</div>
          </div>
        </ContextCard>
        <ContextCard title="Evidence Relationships" icon={<GitBranch className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.evidence.map((item) => <p key={item.evidence_id}>{item.evidence_id}: <span className={statusClass(item.integrity_state).split(" ")[0]}>{item.evidence_state}</span></p>)}
            {detail.evidence.length === 0 ? <p className="text-slate-500">No evidence visible.</p> : null}
          </div>
        </ContextCard>
        <ContextCard title="Recommendations / Decisions" icon={<ShieldCheck className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.recommendation_decision.map((item) => <p key={`${item.record_kind}-${item.title}`}>{item.record_kind}: <span className="text-white">{item.state}</span> · {item.authority_boundary}</p>)}
          </div>
        </ContextCard>
        <ContextCard title="Governance / Runtime" icon={<AlertTriangle className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            {detail.governance.map((item) => <p key={item.title}>{item.title}: <span className="text-white">{item.governance_state}</span></p>)}
            {detail.runtime_events.map((item) => <p key={item.event_id}>{item.event_type}: <span className="text-white">{item.event_state}</span></p>)}
          </div>
        </ContextCard>
        <ContextCard title="Integrity / Archive" icon={<Archive className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Hash chain: <span className={statusClass(detail.integrity.hash_chain_state).split(" ")[0]}>{detail.integrity.hash_chain_state}</span></p>
            <p>Tamper: <span className="text-white">{detail.integrity.tamper_detection_state}</span></p>
            <p>Retention: <span className="text-white">{detail.archive.retention_state}</span></p>
            {refList(detail.integrity.warnings)}
          </div>
        </ContextCard>
        <ContextCard title="History / Cross-Ledger" icon={<Network className="h-5 w-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Historical state: <span className="text-white">{detail.historical_reconstruction.reconstruction_state}</span></p>
            <p>Correlations: <span className="text-white">{detail.cross_ledger_correlations.length}</span></p>
            {refList(detail.cross_ledger_correlations.map((item) => `${item.relationship_type}:${item.correlation_state}`))}
          </div>
        </ContextCard>
      </div>
    </div>
  );
}

export function LedgerExplorerShell({ view }: { view: LedgerExplorerView }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TruthDashboardRecordType | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState(view.selected_record.record.truth_record_id);
  const filtered = useMemo(() => view.records.filter((record) => {
    const haystack = `${record.truth_record_id} ${record.ledger_entry_id} ${record.title} ${record.summary} ${record.event_type}`.toLowerCase();
    return (type === "ALL" || record.event_type === type) && (!search || haystack.includes(search.toLowerCase()));
  }), [search, type, view.records]);
  const selected = view.records.find((record) => record.truth_record_id === selectedId) ?? filtered[0] ?? view.records[0];
  const detail = selected.truth_record_id === view.selected_record.record.truth_record_id ? view.selected_record : {
    ...view.selected_record,
    record: selected,
    warnings: selected.integrity_state === "VALID" ? [] : [`Ledger record is ${selected.integrity_state.toLowerCase()}.`],
  };

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Truth Ledger Navigation</p>
            <h1 className="font-display text-3xl font-semibold text-white">Ledger Explorer</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Governed read-only navigation across records, timelines, graph relationships, evidence, decisions, governance, runtime events, integrity chains, archives, history, and cross-ledger context.
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
          {metric("Graph Edges", view.selected_record.graph.edges.length)}
          {metric("Audit Events", view.audit_events.length)}
          {metric("Query Hash", view.query_hash.slice(0, 18))}
        </div>
      </SectionShell>
      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ledger records" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={type === "ALL" ? "default" : "outline"} size="sm" onClick={() => setType("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {view.available_filters.event_types.map((eventType) => (
              <Button key={eventType} variant={type === eventType ? "default" : "outline"} size="sm" onClick={() => setType(eventType)}><Filter className="h-4 w-4" /> {eventType}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <RecordIndex records={filtered} selectedId={detail.record.truth_record_id} onSelect={(record) => setSelectedId(record.truth_record_id)} />
        <Detail detail={detail} />
      </div>
    </div>
  );
}
