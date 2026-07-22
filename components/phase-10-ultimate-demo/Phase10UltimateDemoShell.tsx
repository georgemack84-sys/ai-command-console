"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, GitBranch, History, LockKeyhole, Play, RotateCcw, ShieldCheck, UserCheck, Zap } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type { DemoPhase, Phase10UltimateDemoResult } from "@/types/phase-10-ultimate-demo";

const phaseLabels: Record<DemoPhase, string> = {
  INITIALIZATION: "Mission",
  EVIDENCE_INJECTION: "Evidence",
  PATTERN_INTELLIGENCE: "Patterns",
  RECOMMENDATION_GENERATION: "Recommendations",
  SIMULATION: "Simulation",
  CHAOS_INJECTION: "Chaos",
  OPERATOR_INTERACTION: "Operator",
  ADAPTIVE_MEMORY: "Memory",
  REPLAY: "Replay",
  CERTIFICATION: "Certification",
};

function statusClass(pass: boolean) {
  return pass ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-rose-300/25 bg-rose-400/10 text-rose-100";
}

function metric(label: string, value: string | number, suffix = "") {
  return (
    <div className="min-h-24 rounded-md border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}<span className="text-base text-slate-400">{suffix}</span></p>
    </div>
  );
}

function PhaseRail({ phases, active }: { phases: readonly DemoPhase[]; active: number }) {
  return (
    <div className="grid gap-2 md:grid-cols-5 xl:grid-cols-10">
      {phases.map((phase, index) => {
        const complete = index <= active;
        return (
          <div key={phase} className={cn("rounded-md border p-3", complete ? "border-sky-300/30 bg-sky-400/10" : "border-white/10 bg-white/5")}>
            <p className="text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</p>
            <p className={cn("mt-1 text-sm font-medium", complete ? "text-white" : "text-slate-400")}>{phaseLabels[phase]}</p>
          </div>
        );
      })}
    </div>
  );
}

function EvidencePanel({ demo, active }: { demo: Phase10UltimateDemoResult; active: number }) {
  const visibleEvidence = demo.evidence.slice(0, Math.min(demo.evidence.length, active + 1));
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <Database className="h-5 w-5 text-sky-200" />
        <CardTitle>Evidence Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleEvidence.map((item) => (
          <div key={item.evidence_id} className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{item.summary}</p>
              <Badge className={item.integrity === "VALID" ? statusClass(true) : "border-amber-300/25 bg-amber-400/10 text-amber-100"}>{item.integrity}</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400">{item.kind} · confidence {Math.round(item.confidence * 100)}% · {item.replay_ref}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecommendationPanel({ demo }: { demo: Phase10UltimateDemoResult }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-200" />
        <CardTitle>Recommendation Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {demo.recommendations.map((item) => (
          <div key={item.recommendation_id} className="rounded-md border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.reasoning}</p>
              </div>
              <Badge className={item.state === "SUPPRESSED" ? "border-amber-300/25 bg-amber-400/10 text-amber-100" : statusClass(true)}>{item.state}</Badge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {metric("Benefit", Math.round(item.expected_benefit * 100), "%")}
              {metric("Risk", Math.round(item.expected_risk * 100), "%")}
              {metric("Confidence", Math.round(item.confidence * 100), "%")}
              {metric("Governance", item.governance_impact)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChaosPanel({ demo, enabled }: { demo: Phase10UltimateDemoResult; enabled: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-200" />
        <CardTitle>Chaos Detection</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {(enabled ? demo.chaos_results : demo.chaos_results.slice(0, 4)).map((item) => (
          <div key={item.attack} className={cn("rounded-md border p-3", statusClass(item.detected && item.contained && item.fail_closed))}>
            <p className="text-sm font-medium">{item.attack}</p>
            <p className="mt-1 text-xs opacity-80">detected · contained · fail-closed</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComparisonPanel({ demo }: { demo: Phase10UltimateDemoResult }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <Activity className="h-5 w-5 text-sky-200" />
        <CardTitle>Comparative Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {demo.comparisons.map((row) => (
          <div key={row.comparator} className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_2fr]">
            <p className="text-sm font-medium text-white">{row.comparator}</p>
            <div className="grid gap-2 sm:grid-cols-4">
              {metric("Quality", row.decision_quality)}
              {metric("Risk", row.risk_prediction)}
              {metric("Governance", row.governance_compliance)}
              {metric("Replay", row.replay_fidelity)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function Phase10UltimateDemoShell({ demo }: { demo: Phase10UltimateDemoResult }) {
  const [active, setActive] = useState(0);
  const [chaosEnabled, setChaosEnabled] = useState(false);
  const activePhase = demo.phases[active];
  const visibleLedger = useMemo(() => demo.ledger.slice(0, active + 1), [active, demo.ledger]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-md border border-white/10 bg-white/[0.04] p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Phase 10 Ultimate Demonstration Platform</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{demo.mission.objective}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                {demo.mission.mission_id} · {demo.mission.governance_state} governance · {demo.mission.constitutional_state} constitution · {demo.mission.operator_authority}
              </p>
            </div>
            <div className="grid min-w-72 gap-2">
              <Button onClick={() => setActive((value) => Math.min(value + 1, demo.phases.length - 1))}>
                <Play className="h-4 w-4" /> Advance
              </Button>
              <Button variant="outline" onClick={() => setChaosEnabled(true)}>
                <Zap className="h-4 w-4" /> Inject Chaos Suite
              </Button>
              <Button variant="outline" onClick={() => { setActive(0); setChaosEnabled(false); }}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <PhaseRail phases={demo.phases} active={active} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metric("Active Phase", phaseLabels[activePhase])}
          {metric("Determinism", 100, "%")}
          {metric("Replay Divergence", demo.replay.divergence)}
          {metric("Chaos Contained", demo.chaos_results.filter((item) => item.contained).length)}
          {metric("Certification", demo.certification.status)}
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <EvidencePanel demo={demo} active={active} />
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <GitBranch className="h-5 w-5 text-sky-200" />
                <CardTitle>Pattern Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {demo.patterns.map((pattern) => (
                  <div key={pattern.pattern_id} className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">{pattern.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{pattern.reasoning}</p>
                    <p className="mt-3 text-sm text-sky-200">confidence {Math.round(pattern.confidence * 100)}% · impact +{Math.round(pattern.expected_impact * 100)}%</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <ChaosPanel demo={demo} enabled={chaosEnabled || active >= 5} />
          </div>
        </section>

        <RecommendationPanel demo={demo} />

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <Clock className="h-5 w-5 text-sky-200" />
              <CardTitle>Simulation Deltas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {demo.simulations.map((sim) => (
                <div key={sim.simulation_id} className="rounded-md border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{sim.name}</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-200">+{sim.delta}</p>
                  <p className="text-sm text-slate-400">baseline {sim.baseline_score} · mission control {sim.mission_control_score}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <UserCheck className="h-5 w-5 text-emerald-200" />
              <CardTitle>Operator Authority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demo.operator_actions.map((action) => (
                <div key={action.action_id} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-medium text-white">{action.action} · {action.target_ref}</p>
                  <p className="mt-1 text-sm text-slate-300">{action.rationale}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-sky-200" />
              <CardTitle>Adaptive Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demo.adaptive_memory.map((memory) => (
                <div key={memory.memory_id} className="rounded-md border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{memory.mission_ref}</p>
                  <p className="mt-2 text-sm text-slate-300">{memory.why_selected}</p>
                  <p className="mt-2 text-sm text-sky-200">similarity {Math.round(memory.similarity_score * 100)}% · improvement +{Math.round(memory.expected_improvement * 100)}%</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <History className="h-5 w-5 text-emerald-200" />
              <CardTitle>Replay & Ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn("rounded-md border p-4", statusClass(demo.replay.divergence === 0))}>
                <p className="font-medium">Replay divergence {demo.replay.divergence}</p>
                <p className="mt-1 text-xs opacity-80">{demo.replay.replay_hash}</p>
              </div>
              {visibleLedger.map((entry) => (
                <div key={entry.ledger_entry_id} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-medium text-white">{entry.sequence}. {entry.event}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.integrity_hash.slice(0, 28)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <ComparisonPanel demo={demo} />

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            <CardTitle>Certification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries({
              "Deterministic execution": demo.certification.deterministic_execution,
              "Deterministic replay": demo.certification.deterministic_replay,
              "Governance compliance": demo.certification.governance_compliance,
              "Constitutional compliance": demo.certification.constitutional_compliance,
              "Tenant isolation": demo.certification.tenant_isolation,
              "Operator authority": demo.certification.operator_authority,
              "Advisory only": demo.certification.advisory_only,
              "Explainability": demo.certification.explainability_complete,
            }).map(([label, pass]) => (
              <div key={label} className={cn("rounded-md border p-3", statusClass(pass))}>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
