"use client";

import Link from "next/link";

const primarySurfaces = [
  {
    title: "Console Runtime",
    href: "/console",
    description: "Run commands, inspect live state, triage workflows, and manage the multi-agent control surface.",
  },
  {
    title: "Operations",
    href: "/operations",
    description: "Review workspace operations, incidents, assignments, and escalation flows from the browser.",
  },
  {
    title: "Research Desk",
    href: "/briefs",
    description: "Manage briefs, reports, digests, and operator collaboration as a first-class production workflow.",
  },
  {
    title: "Platform View",
    href: "/platform",
    description: "Inspect the broader platform surface and operator controls without dropping into raw commands.",
  },
];

export function ControlCenterHome() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(15,23,42,0.92)_46%,rgba(8,47,73,0.9))] p-6 shadow-2xl shadow-sky-950/30 sm:p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-sky-200/85">AI Command Console</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          A cleaner control plane for agents, research workflows, and operational recovery.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
          The operational core lives in the console, research desk, and workspace tooling. This workspace now presents a single primary
          product instead of splitting attention across multiple competing surfaces.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/console"
            className="rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            Open Console
          </Link>
          <Link
            href="/briefs"
            className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            Open Research Desk
          </Link>
          <Link
            href="/operations"
            className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            Open Operations
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {primarySurfaces.map((surface) => (
          <Link
            key={surface.href}
            href={surface.href}
            className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition hover:border-sky-300/30 hover:bg-white/[0.06]"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200/80">Primary Surface</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-white">{surface.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{surface.description}</p>
            <p className="mt-5 text-sm font-medium text-sky-200 transition group-hover:text-sky-100">Open {surface.title}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Workspace Direction</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white">One product boundary, one operating story.</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          The app is now oriented around command, research, and operations workflows. That gives us a cleaner base for production hardening,
          deployment, governance, and future feature work.
        </p>
      </section>
    </div>
  );
}
