"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AlertTriangle, BookOpenCheck, Filter, GitBranch, History, Lock, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { TruthDashboardRecord, TruthDashboardRecordDetail, TruthDashboardRecordType, TruthDashboardView } from "@/types/truth-dashboard";

function statusClass(value: string) {
  if (["VALID", "READY", "COMPLETE", "REPRODUCED", "ALLOWED"].includes(value)) return "text-emerald-200 border-emerald-300/20 bg-emerald-400/10";
  if (["DEGRADED", "PARTIAL", "INCOMPLETE", "REDACTED", "RESTRICTED"].includes(value)) return "text-amber-200 border-amber-300/20 bg-amber-400/10";
  if (["CORRUPTED", "BROKEN", "INVALID", "DENIED", "FAILED_CLOSED"].includes(value)) return "text-rose-200 border-rose-300/20 bg-rose-400/10";
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

function metric(label: string, value: string | number, className?: string) {
  return (
    <div className="min-h-20 rounded-md border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold text-white", className)}>{value}</p>
    </div>
  );
}

function RecordTable({
  records,
  selectedId,
  onSelect,
}: {
  records: readonly TruthDashboardRecord[];
  selectedId: string;
  onSelect: (record: TruthDashboardRecord) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Truth Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {records.map((record) => (
          <button
            key={record.truth_record_id}
            type="button"
            onClick={() => onSelect(record)}
            className={cn(
              "grid w-full gap-3 rounded-md border p-3 text-left transition sm:grid-cols-[1fr_auto]",
              selectedId === record.truth_record_id ? "border-sky-300/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:bg-white/8",
            )}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium text-white">{record.title}</span>
              <span className="block text-xs text-slate-400">{record.truth_record_id} · {record.event_type}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", statusClass(record.integrity_state))}>{record.integrity_state}</span>
              {record.governance_state.redacted ? <Lock className="h-4 w-4 text-amber-200" aria-label="Restricted" /> : null}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function GovernanceBanner({ detail }: { detail: TruthDashboardRecordDetail }) {
  if (!detail.record.governance_state.restricted && detail.record.integrity_state === "VALID") return null;
  return (
    <div className={cn("rounded-md border p-4", detail.record.integrity_state === "CORRUPTED" ? "border-rose-300/25 bg-rose-400/10" : "border-amber-300/25 bg-amber-400/10")}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-200" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{detail.record.integrity_state === "CORRUPTED" ? "Trusted interpretation blocked" : "Governed visibility"}</p>
          {detail.warnings.map((warning) => <p key={warning} className="text-sm text-slate-300">{warning}</p>)}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ detail }: { detail: TruthDashboardRecordDetail }) {
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
          <GovernanceBanner detail={detail} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metric("Record", record.truth_record_id)}
            {metric("Type", record.event_type)}
            {metric("Integrity", record.integrity_state, statusClass(record.integrity_state).split(" ")[0])}
            {metric("Lifecycle", record.lifecycle_state)}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-md border border-white/10 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Evidence</p>
              {refList(record.evidence_refs)}
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Lineage</p>
              {refList(record.lineage_refs)}
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Replay</p>
              {refList(record.replay_refs)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ContextCard title="Recommendation Context" icon={<BookOpenCheck className="h-5 w-5" />}>
          {detail.recommendation ? (
            <div className="space-y-3 text-sm text-slate-300">
              <p className="text-white">{detail.recommendation.recommendation_state} · {detail.recommendation.authority_boundary}</p>
              <p>{detail.recommendation.rationale}</p>
              {refList(detail.recommendation.supporting_evidence_refs)}
            </div>
          ) : <p className="text-sm text-slate-500">No recommendation context visible for this record.</p>}
        </ContextCard>

        <ContextCard title="Decision Context" icon={<ShieldCheck className="h-5 w-5" />}>
          {detail.decision ? (
            <div className="space-y-3 text-sm text-slate-300">
              <p className="text-white">{detail.decision.decision_state} · {detail.decision.decision_timestamp}</p>
              <p>{detail.decision.decision_summary}</p>
              <p>Policy checked: {String(detail.decision.governance_result.policy_checked)}</p>
            </div>
          ) : <p className="text-sm text-slate-500">No decision context visible for this record.</p>}
        </ContextCard>

        <ContextCard title="Evidence Context" icon={<Filter className="h-5 w-5" />}>
          {detail.evidence ? (
            <div className="space-y-3 text-sm text-slate-300">
              <p className={cn("font-medium", statusClass(detail.evidence.integrity_state).split(" ")[0])}>{detail.evidence.evidence_state} · {detail.evidence.integrity_state}</p>
              <p>{detail.evidence.evidence_summary}</p>
              {refList(detail.evidence.supports)}
            </div>
          ) : <p className="text-sm text-slate-500">No evidence context visible for this record.</p>}
        </ContextCard>

        <ContextCard title="Lineage Context" icon={<GitBranch className="h-5 w-5" />}>
          <div className="space-y-3 text-sm text-slate-300">
            <p className={cn("font-medium", statusClass(detail.lineage.lineage_state).split(" ")[0])}>{detail.lineage.lineage_state}</p>
            <p>Parents</p>
            {refList(detail.lineage.parent_refs)}
            <p>Children</p>
            {refList(detail.lineage.child_refs)}
          </div>
        </ContextCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ContextCard title="Integrity Indicators" icon={<AlertTriangle className="h-5 w-5" />}>
          {refList(detail.integrity_indicators)}
        </ContextCard>
        <ContextCard title="Replay References" icon={<History className="h-5 w-5" />}>
          <div className="space-y-2">
            {detail.replay_links.map((link) => (
              <div key={link.replay_ref} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 p-3 text-sm">
                <span className="text-white">{link.replay_ref}</span>
                <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(link.replay_state))}>{link.replay_state}</span>
              </div>
            ))}
          </div>
        </ContextCard>
      </div>
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

export function TruthDashboardShell({ view }: { view: TruthDashboardView }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TruthDashboardRecordType | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState(view.selected_record.record.truth_record_id);

  const filtered = useMemo(() => view.records.filter((record) => {
    const searchText = `${record.truth_record_id} ${record.title} ${record.summary} ${record.event_type}`.toLowerCase();
    return (type === "ALL" || record.event_type === type) && (!search || searchText.includes(search.toLowerCase()));
  }), [search, type, view.records]);

  const selectedRecord = view.records.find((record) => record.truth_record_id === selectedId) ?? filtered[0] ?? view.records[0];
  const selectedDetail = selectedRecord?.truth_record_id === view.selected_record.record.truth_record_id
    ? view.selected_record
    : {
        ...view.selected_record,
        record: selectedRecord,
        recommendation: undefined,
        decision: undefined,
        evidence: undefined,
        lineage: {
          ...view.selected_record.lineage,
          truth_record_id: selectedRecord.truth_record_id,
          parent_refs: selectedRecord.evidence_refs,
          child_refs: [...selectedRecord.recommendation_refs, ...selectedRecord.decision_refs],
          lineage_state: selectedRecord.governance_state.restricted ? "RESTRICTED" as const : selectedRecord.lineage_refs.length > 0 ? "COMPLETE" as const : "PARTIAL" as const,
        },
        replay_links: selectedRecord.replay_refs.map((replay_ref) => ({
          replay_ref,
          truth_record_id: selectedRecord.truth_record_id,
          replay_state: selectedRecord.integrity_state === "CORRUPTED" ? "INVALID" as const : selectedRecord.integrity_state === "DEGRADED" ? "INCOMPLETE" as const : "REPRODUCED" as const,
          reconstruction_available: selectedRecord.integrity_state !== "CORRUPTED",
          replay_timestamp: selectedRecord.created_at,
          governance_restricted: selectedRecord.governance_state.restricted,
        })),
        integrity_indicators: [`integrity:${selectedRecord.integrity_state}`, `replay:${selectedRecord.replay_refs.length > 0 ? "LINKED" : "MISSING"}`],
        warnings: selectedRecord.integrity_state === "VALID" ? [] : [`Integrity is ${selectedRecord.integrity_state.toLowerCase()}.`],
        access_result: selectedRecord.governance_state.redacted ? "REDACTED" as const : "ALLOWED" as const,
      };

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Truth Ledger Visibility</p>
            <h1 className="font-display text-3xl font-semibold text-white">Truth Dashboard</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Governed inspection for recommendations, decisions, evidence, lineage, replay, and integrity.
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
          {metric("Warnings", view.selected_record.warnings.length)}
          {metric("Audit Events", view.audit_events.length)}
          {metric("Query Hash", view.query_hash.slice(0, 18))}
        </div>
      </SectionShell>

      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={type === "ALL" ? "default" : "outline"} size="sm" onClick={() => setType("ALL")}>
              <Filter className="h-4 w-4" /> All
            </Button>
            {view.available_filters.record_types.map((recordType) => (
              <Button key={recordType} variant={type === recordType ? "default" : "outline"} size="sm" onClick={() => setType(recordType)}>
                <Filter className="h-4 w-4" /> {recordType}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <RecordTable
          records={filtered}
          selectedId={selectedDetail.record.truth_record_id}
          onSelect={(record) => setSelectedId(record.truth_record_id)}
        />
        <DetailPanel detail={selectedDetail} />
      </div>
    </div>
  );
}
