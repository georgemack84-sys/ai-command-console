"use client";

import { AlertTriangle, CheckCircle2, FileCheck2, Filter, Lock, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { VisibilityCertificationView, VisibilitySurface } from "@/types/visibility-certification";

function statusClass(value: string) {
  if (["PASS", "PASSED", "READY"].includes(value)) return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (["CONDITIONAL_PASS", "CONDITIONAL_PASSED", "WARN", "PARTIAL"].includes(value)) return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (["FAIL", "FAILED", "BLOCKED", "FAIL_CLOSED"].includes(value)) return "border-rose-300/20 bg-rose-400/10 text-rose-200";
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

export function VisibilityCertificationGateShell({ view }: { view: VisibilityCertificationView }) {
  const [surface, setSurface] = useState<VisibilitySurface | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const result = view.result;
  const surfaceResults = useMemo(() => result.surface_results.filter((item) => {
    const haystack = `${item.surface} ${item.state} ${item.evidence_refs.join(" ")}`.toLowerCase();
    return (surface === "ALL" || item.surface === surface) && (!search || haystack.includes(search.toLowerCase()));
  }), [result.surface_results, search, surface]);

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Phase 6K Completion Gate</p>
            <h1 className="font-display text-3xl font-semibold text-white">Visibility Certification Gate</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Deterministic certification for Truth Dashboard, Replay Viewer, Ledger Explorer, and Integrity Status Viewer across visibility, redaction, tenant isolation, replay, integrity, audit, and read-only authority boundaries.
            </p>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant: <span className="text-white">{view.contract.tenant_id}</span></p>
            <p>Run: <span className="text-white">{view.contract.certification_run_id}</span></p>
            <p>State: <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(result.gate_state))}>{result.gate_state}</span></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metric("Certification", result.certification_state)}
          {metric("Surfaces", result.surface_results.length)}
          {metric("Failures", result.failures.length)}
          {metric("Evidence", result.evidence_refs.length)}
        </div>
      </SectionShell>

      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certification results" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={surface === "ALL" ? "default" : "outline"} size="sm" onClick={() => setSurface("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {view.contract.scope.surfaces.map((item) => (
              <Button key={item} variant={surface === item ? "default" : "outline"} size="sm" onClick={() => setSurface(item)}><Filter className="h-4 w-4" /> {item}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          {surfaceResults.map((item) => (
            <Card key={item.surface}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{item.surface}</CardTitle>
                  <Badge className={statusClass(item.state)}>{item.state}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  {metric("Required", item.required_targets)}
                  {metric("Passed", item.passed_targets)}
                  {metric("Warnings", item.warning_targets)}
                  {metric("Failed", item.failed_targets)}
                </div>
                <div className="grid gap-2">
                  {item.targets.map((target) => (
                    <div key={target.target_id} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_auto]">
                      <span>
                        <span className="block text-sm font-medium text-white">{target.capability}</span>
                        <span className="text-xs text-slate-500">{target.evidence_refs.join(", ")}</span>
                      </span>
                      <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(target.certification_state))}>{target.certification_state}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-200" /><CardTitle>Authority Boundary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" /> Mutation: blocked</p>
              <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" /> Approval: blocked</p>
              <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" /> Execution: blocked</p>
              <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" /> Repair: blocked</p>
              <p><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" /> Governance override: blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><FileCheck2 className="h-5 w-5 text-sky-200" /><CardTitle>Report</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>{result.report.summary}</p>
              <p>Report ref: <span className="text-white">{result.report.report_id}</span></p>
              <p>Ledger entry: <span className="text-white">{result.ledger_entry.ledger_entry_id}</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><Lock className="h-5 w-5 text-sky-200" /><CardTitle>Determinism</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {result.determinism_checks.map((check) => <p key={check.check_id}>{check.surface}: <span className={check.result_match ? "text-emerald-200" : "text-rose-200"}>{check.certification_result}</span></p>)}
            </CardContent>
          </Card>
          {result.failures.length ? (
            <Card>
              <CardHeader className="flex-row items-center gap-3"><ShieldX className="h-5 w-5 text-rose-200" /><CardTitle>Failures</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                {result.failures.map((failure) => <p key={failure.target_id}>{failure.surface}: {failure.capability}</p>)}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex-row items-center gap-3"><AlertTriangle className="h-5 w-5 text-emerald-200" /><CardTitle>Failure Mode</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-300">No critical failures. Fail-closed checks passed.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
