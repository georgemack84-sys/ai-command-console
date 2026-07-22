"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CivitasStatus = {
  generatedAt: string;
  configuration: {
    mode: string;
    providers: Record<string, string>;
    featureFlags: Record<string, boolean>;
    displayProfile: string;
  };
  application: {
    identity: { id: string; name: string };
    certificationStatus: string;
    operationalStatus: string;
    healthStatus: string;
  };
  capabilities: Array<{ id: string; status: string; health: string; version: string }>;
  registries: Array<{ name: string; count: number | string; supportsCrud: boolean; persistence: string }>;
  agents: Array<{ id: string; runtime: string; status: string }>;
  operations: Record<string, unknown>;
  telemetry: Array<{ component: string; operation: string; durationMs: number; success: boolean; timestamp: string }>;
  evidence: Array<{ id: string; workflow: string; replayId: string; timestamp: string }>;
};

export function CivitasDashboard() {
  const [status, setStatus] = useState<CivitasStatus | null>(null);

  useEffect(() => {
    const load = () => void fetch("/api/civitas/status").then((response) => response.json()).then(setStatus);
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  if (!status) {
    return <main className="min-h-screen bg-[#020817] p-6 text-white">Loading Civitas status...</main>;
  }

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-100">Civitas Integration Layer</p>
            <h1 className="mt-2 font-display text-4xl font-black">Headline Flow Operations</h1>
            <p className="mt-2 text-slate-300">Reference application status for Programs 1-6, running in {status.configuration.mode} mode.</p>
          </div>
          <Link href="/" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
            Open slideshow
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Application Health" value={status.application.healthStatus} />
          <Metric label="Operational Status" value={status.application.operationalStatus} />
          <Metric label="Active Agents" value={String(status.agents.length)} />
          <Metric label="Display Profile" value={status.configuration.displayProfile} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <Panel title="Capabilities">
            <div className="grid gap-2 sm:grid-cols-2">
              {status.capabilities.map((capability) => (
                <div key={capability.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{capability.id}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{capability.status} · {capability.health} · v{capability.version}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Feature Flags">
            <div className="grid gap-2">
              {Object.entries(status.configuration.featureFlags).map(([key, value]) => (
                <div key={key} className="flex justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span>{key}</span>
                  <span className={value ? "text-emerald-200" : "text-slate-400"}>{value ? "enabled" : "disabled"}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel title="Registries">
            {status.registries.map((registry) => (
              <div key={registry.name} className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <div className="flex justify-between"><span>{registry.name}</span><span>{registry.count}</span></div>
                <p className="mt-1 text-xs text-slate-400">{registry.persistence}</p>
              </div>
            ))}
          </Panel>
          <Panel title="CAF Agents">
            {status.agents.map((agent) => (
              <div key={agent.id} className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p>{agent.id}</p>
                <p className="mt-1 text-xs text-slate-400">{agent.runtime} · {agent.status}</p>
              </div>
            ))}
          </Panel>
          <Panel title="Queues And Activity">
            {Object.entries(status.operations).map(([key, value]) => (
              <div key={key} className="mb-2 flex justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span>{key}</span>
                <span className="text-sky-100">{Array.isArray(value) ? value.length : String(value)}</span>
              </div>
            ))}
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel title="Recent Evidence">
            {status.evidence.length ? status.evidence.map((item) => (
              <div key={item.id} className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p>{item.workflow}</p>
                <p className="mt-1 text-xs text-slate-400">{item.replayId} · {item.timestamp}</p>
              </div>
            )) : <p className="text-slate-400">Evidence appears after headline requests.</p>}
          </Panel>
          <Panel title="Telemetry">
            {status.telemetry.length ? status.telemetry.map((item) => (
              <div key={`${item.timestamp}-${item.operation}`} className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <p>{item.component} · {item.operation}</p>
                <p className="mt-1 text-xs text-slate-400">{item.durationMs}ms · {item.success ? "success" : "failure"}</p>
              </div>
            )) : <p className="text-slate-400">Telemetry appears after headline requests.</p>}
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
