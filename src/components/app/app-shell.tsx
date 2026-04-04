"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSession } from "@/src/components/app/app-provider";

const primaryNavItems = [
  { href: "/", label: "Home" },
  { href: "/console", label: "Console" },
  { href: "/operations", label: "Operations", protected: true },
  { href: "/briefs", label: "Briefs" },
  { href: "/reports", label: "Reports" },
  { href: "/platform", label: "Platform", protected: true },
  { href: "/auth", label: "Account" },
];

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const pageMeta: Array<{
  match: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  description: string;
  mode: "primary" | "demo";
}> = [
  {
    match: (pathname) => pathname === "/",
    eyebrow: "AI Command Console",
    title: "A dedicated home for the control plane, research desk, and operational workflows.",
    description:
      "Use the console and research surfaces as the primary product with a cleaner boundary and less demo-era coupling.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/console"),
    eyebrow: "Console Runtime",
    title: "Inspect live system state and act on it directly.",
    description:
      "Commands, workflow actions, queue control, review recovery, and observability now sit at the center of the product boundary.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/operations"),
    eyebrow: "Operations",
    title: "Run recovery and workspace coordination from the browser.",
    description:
      "Use governed actions, ownership tools, and escalation flows to stabilize the system without leaving the app.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/briefs"),
    eyebrow: "Research Desk",
    title: "Track briefs as structured operational work.",
    description:
      "The research desk is part of the core product, with routing, reporting, and collaboration tied to the same console runtime.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/reports"),
    eyebrow: "Reports",
    title: "Turn active work into operator-ready outputs.",
    description:
      "Reports, summaries, and digests belong to the main command workflow, not a sidecar demo experience.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/platform"),
    eyebrow: "Platform",
    title: "View the wider command surface without losing operator context.",
    description:
      "Platform controls, oversight, and runtime visibility are first-class parts of the AI Command Console boundary.",
    mode: "primary",
  },
  {
    match: (pathname) => pathname.startsWith("/auth"),
    eyebrow: "Account",
    title: "Sign in to access protected operator and demo surfaces.",
    description:
      "Authentication now supports a production posture with secure cookies, explicit secrets, and environment-aware persistence.",
    mode: "primary",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, authLoading } = useAppSession();
  const meta = pageMeta.find((item) => item.match(pathname)) ?? pageMeta[0];
  const visiblePrimaryNavItems = primaryNavItems.filter((item) => !item.protected || user);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#020817_0%,#07131f_48%,#081522_100%)] pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-sky-300/90">{meta.eyebrow}</p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-4xl">{meta.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">{meta.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeaderMetric label="Surface" value="Console" tone="sky" />
              <HeaderMetric label="Workflow" value="Research" tone="emerald" />
              <HeaderMetric label="Runtime" value="Env-aware" tone="amber" />
              <HeaderMetric label="User" value={authLoading ? "..." : user ? user.name : "Guest"} tone="slate" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">Primary Product</p>
              <nav className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {visiblePrimaryNavItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "rounded-full border px-4 py-2 text-sm transition",
                        active
                          ? "border-sky-300/50 bg-sky-300 text-slate-950"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    Log out
                  </button>
                </>
              ) : pathname === "/auth" ? null : (
                <Link
                  href="/auth"
                  className="rounded-full bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-5 lg:px-8 lg:py-8">{children}</main>

      <nav className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-slate-950/90 p-2 backdrop-blur md:hidden">
        {visiblePrimaryNavItems.slice(0, 4).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-2xl px-3 py-3 text-center text-xs font-medium transition",
                active ? "bg-sky-300 text-slate-950" : "text-slate-300 hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "emerald" | "amber" | "slate";
}) {
  const tones = {
    sky: "border-sky-300/20 bg-sky-300/10 text-sky-50",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-50",
    slate: "border-white/10 bg-white/5 text-white",
  } as const;

  return (
    <div className={`rounded-3xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.22em] opacity-75">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
