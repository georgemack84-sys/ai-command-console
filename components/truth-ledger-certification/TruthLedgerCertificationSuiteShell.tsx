"use client";

import { CheckCircle2, Database, FileCheck2, Filter, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { SectionShell } from "@/src/components/ui/section-shell";
import { cn } from "@/src/lib/utils";
import type { TruthLedgerCertificationCategory, TruthLedgerCertificationView } from "@/types/truth-ledger-certification";

function statusClass(value: string) {
  if (value === "PASS") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (value === "CONDITIONAL_PASS" || value === "WARN") return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (value === "FAIL") return "border-rose-300/20 bg-rose-400/10 text-rose-200";
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

export function TruthLedgerCertificationSuiteShell({ view }: { view: TruthLedgerCertificationView }) {
  const [category, setCategory] = useState<TruthLedgerCertificationCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => [
    view.result.persistence,
    view.result.evidence,
    view.result.lineage,
    view.result.replay,
    view.result.integrity,
    view.result.visibility,
    view.result.isolation,
    view.result.fail_closed,
  ], [view.result.evidence, view.result.fail_closed, view.result.integrity, view.result.isolation, view.result.lineage, view.result.persistence, view.result.replay, view.result.visibility]);
  const filtered = useMemo(() => categories.filter((item) => {
    const haystack = `${item.category} ${item.state} ${item.tests.map((test) => test.name).join(" ")}`.toLowerCase();
    return (category === "ALL" || item.category === category) && (!search || haystack.includes(search.toLowerCase()));
  }), [categories, category, search]);

  return (
    <div className="space-y-6">
      <SectionShell className="p-6 sm:p-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Phase 6L Reliability Gate</p>
            <h1 className="font-display text-3xl font-semibold text-white">Truth Ledger Certification Suite</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Deterministic certification for persistence, evidence reconstruction, lineage, replay, integrity, visibility, tenant isolation, and fail-closed behavior.
            </p>
          </div>
          <div className="grid min-w-72 gap-2 text-sm text-slate-300">
            <p>Tenant: <span className="text-white">{view.contract.tenant_scope}</span></p>
            <p>Mission: <span className="text-white">{view.contract.mission_scope}</span></p>
            <p>State: <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(view.result.certification_state))}>{view.result.certification_state}</span></p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metric("Total Tests", view.result.total_tests)}
          {metric("Passed", view.result.passed_tests)}
          {metric("Failures", view.result.failed_tests)}
          {metric("Artifacts", view.result.artifacts.length)}
        </div>
      </SectionShell>

      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certification tests" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant={category === "ALL" ? "default" : "outline"} size="sm" onClick={() => setCategory("ALL")}><Filter className="h-4 w-4" /> All</Button>
            {view.contract.test_categories.map((item) => (
              <Button key={item} variant={category === item ? "default" : "outline"} size="sm" onClick={() => setCategory(item)}><Filter className="h-4 w-4" /> {item}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.category}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{item.category}</CardTitle>
                  <Badge className={statusClass(item.state)}>{item.state}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  {metric("Tests", item.total_tests)}
                  {metric("Passed", item.passed_tests)}
                  {metric("Warnings", item.warning_tests)}
                  {metric("Failed", item.failed_tests)}
                </div>
                <div className="grid gap-2">
                  {item.tests.map((test) => (
                    <div key={test.test_id} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_auto]">
                      <span>
                        <span className="block text-sm font-medium text-white">{test.name}</span>
                        <span className="text-xs text-slate-500">{test.evidence_refs.join(", ")}</span>
                      </span>
                      <span className={cn("rounded-full border px-2 py-1 text-[11px]", statusClass(test.state))}>{test.state}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-3"><Database className="h-5 w-5 text-sky-200" /><CardTitle>Ledger Contract</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>Ledger: <span className="text-white">{view.result.ledger_version}</span></p>
              <p>Schema: <span className="text-white">{view.result.schema_version}</span></p>
              <p>Result hash: <span className="text-white">{view.result.deterministic_result_hash.slice(0, 24)}</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-200" /><CardTitle>Certified Guarantees</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {view.guardrails.map((guardrail) => <p key={guardrail}><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-200" />{guardrail}</p>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3"><FileCheck2 className="h-5 w-5 text-sky-200" /><CardTitle>Artifacts</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              {view.result.artifacts.slice(0, 10).map((artifact) => <p key={artifact.artifact_id}>{artifact.artifact_type}</p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
