"use client";

import { CheckCircle2, FileCheck2, Filter, KeyRound, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { TruthLedgerCompletionGateView, TruthLedgerSubsystem } from "@/types/truth-ledger-completion";

function statusClass(value: string) {
  if (["PASS", "VERIFIED"].includes(value)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (["CONDITIONAL_PASS", "WARNING"].includes(value)) return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (["FAIL", "FAILED"].includes(value)) return "border-rose-300/20 bg-rose-400/10 text-rose-200";
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

export function TruthLedgerCompletionGateShell({ view }: { view: TruthLedgerCompletionGateView }) {
  const [subsystem, setSubsystem] = useState<TruthLedgerSubsystem | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const result = view.result;
  const readiness = useMemo(() => result.readiness_assessment.filter((item) => {
    const haystack = `${item.subsystem} ${item.name} ${item.state}`.toLowerCase();
    return (subsystem === "ALL" || item.subsystem === subsystem) && (!search || haystack.includes(search.toLowerCase()));
  }), [result.readiness_assessment, search, subsystem]);
  const subsystems = Array.from(new Set(result.readiness_assessment.map((item) => item.subsystem)));

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Phase 6 Final Gate</p>
            <h1 className="font-display text-3xl font-semibold text-white">Truth Ledger Completion Gate</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Final readiness decision for the Truth Ledger as Mission Control&apos;s permanent, replayable, immutable historical memory foundation.
            </p>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant: <span className="text-white">{result.tenant_id}</span></p>
            <p>Mission: <span className="text-white">{result.mission_id}</span></p>
            <p>Decision: <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(result.decision.decision_state))}>{result.decision.decision_state}</span></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metric("Readiness", result.readiness_assessment.length)}
          {metric("Requirements", result.requirement_verifications.length)}
          {metric("Dependencies", result.ecosystem_dependencies.length)}
          {metric("Critical Findings", result.decision.critical_findings.length)}
        </div>
      </SectionShell>

      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search readiness checks" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={subsystem === "ALL" ? "default" : "outline"} size="sm" onClick={() => setSubsystem("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {subsystems.map((item) => (
              <Button key={item} variant={subsystem === item ? "default" : "outline"} size="sm" onClick={() => setSubsystem(item)}><Filter className="h-4 w-4" /> {item}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader><CardTitle>Readiness Validator</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {readiness.map((item) => (
              <div key={item.check_id} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_auto]">
                <span>
                  <span className="block text-sm font-medium text-white">{item.name}</span>
                  <span className="text-xs text-slate-500">{item.subsystem}</span>
                </span>
                <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(item.state))}>{item.state}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-200" /><CardTitle>Completion Decision</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>{result.decision.outcome}</p>
              <p>Report: <span className="text-white">{result.report.report_id}</span></p>
              <p>Record: <span className="text-white">{result.certification_record.record_id}</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><FileCheck2 className="h-5 w-5 text-sky-200" /><CardTitle>Mandatory Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {result.requirement_verifications.map((item) => <p key={item.requirement_id}><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" />{item.requirement}</p>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><KeyRound className="h-5 w-5 text-sky-200" /><CardTitle>Phase 7 Authorization</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>Authorized: <span className="text-white">{String(result.phase_7_authorization.authorized)}</span></p>
              <p>{result.phase_7_authorization.rationale}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
