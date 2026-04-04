"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, LayoutDashboard, Sparkles } from "lucide-react";
import { useAppSession } from "@/src/components/app/app-provider";
import { buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

const primaryNavItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/console", label: "Console" },
  { href: "/operations", label: "Operations", protected: true },
  { href: "/briefs", label: "Briefs" },
  { href: "/reports", label: "Reports" },
  { href: "/platform", label: "Platform", protected: true },
  { href: "/auth", label: "Account" },
];

const pageMeta: Array<{
  match: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  {
    match: (pathname) => pathname === "/",
    eyebrow: "Product Home",
    title: "A premium frontend for the control plane, dashboard, and research workflow.",
    description:
      "The homepage now leads with a clearer product story, richer composition, and stronger visual hierarchy.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard"),
    eyebrow: "Dashboard",
    title: "A polished operational dashboard with responsive density and card rhythm.",
    description:
      "Filters, activity, metrics, and workspace cards all share the same visual system as the landing experience.",
  },
  {
    match: (pathname) => pathname.startsWith("/console"),
    eyebrow: "Console Runtime",
    title: "Inspect live system state and act on it directly.",
    description:
      "Commands, workflow actions, queue control, review recovery, and observability now sit at the center of the product boundary.",
  },
  {
    match: (pathname) => pathname.startsWith("/operations"),
    eyebrow: "Operations",
    title: "Run recovery and workspace coordination from the browser.",
    description:
      "Use governed actions, ownership tools, and escalation flows to stabilize the system without leaving the app.",
  },
  {
    match: (pathname) => pathname.startsWith("/briefs"),
    eyebrow: "Research Desk",
    title: "Track briefs as structured operational work.",
    description:
      "The research desk is part of the core product, with routing, reporting, and collaboration tied to the same console runtime.",
  },
  {
    match: (pathname) => pathname.startsWith("/reports"),
    eyebrow: "Reports",
    title: "Turn active work into operator-ready outputs.",
    description:
      "Reports, summaries, and digests belong to the main command workflow, not a sidecar demo experience.",
  },
  {
    match: (pathname) => pathname.startsWith("/platform"),
    eyebrow: "Platform",
    title: "View the wider command surface without losing operator context.",
    description:
      "Platform controls, oversight, and runtime visibility are first-class parts of the AI Command Console boundary.",
  },
  {
    match: (pathname) => pathname.startsWith("/auth"),
    eyebrow: "Account",
    title: "Sign in to access protected operator and demo surfaces.",
    description:
      "Authentication now supports a production posture with secure cookies, explicit secrets, and environment-aware persistence.",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, authLoading } = useAppSession();
  const meta = pageMeta.find((item) => item.match(pathname)) ?? pageMeta[0];
  const visiblePrimaryNavItems = primaryNavItems.filter((item) => !item.protected || user);
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(251,191,36,0.08),transparent_18%),linear-gradient(180deg,#020617_0%,#08101d_38%,#0a1322_100%)] pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(2,6,23,0.72)] backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-white shadow-[0_14px_30px_rgba(15,23,42,0.28)]">
                  <Command className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-white">AI Command Console</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Premium frontend system</p>
                </div>
              </Link>

              <nav className="hidden flex-nowrap gap-2 overflow-x-auto pb-1 md:flex">
                {visiblePrimaryNavItems.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition",
                        active
                          ? "border-sky-300/20 bg-white text-slate-950 shadow-[0_14px_32px_rgba(255,255,255,0.16)]"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/14 hover:bg-white/8",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 lg:flex">
                <Sparkles className="h-4 w-4 text-sky-200" />
                Premium SaaS shell
              </div>
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
                <Link href="/auth" className={buttonVariants({ variant: "default" })}>
                  Log in
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="max-w-3xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-sky-200/90">{meta.eyebrow}</p>
              <h1 className={cn("mt-2 font-display font-semibold tracking-tight text-white", isHome ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl")}>
                {meta.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">{meta.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeaderMetric label="Surface" value={isHome ? "Landing" : pathname.replace("/", "") || "Home"} tone="sky" />
              <HeaderMetric label="Workflow" value="Research" tone="emerald" />
              <HeaderMetric label="State" value="Production" tone="amber" />
              <HeaderMetric label="User" value={authLoading ? "..." : user ? user.name : "Guest"} tone="slate" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-5 lg:px-8 lg:py-8">
        {children}
        {!isHome ? (
          <div className="mt-8 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/[0.04] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-display text-lg font-semibold text-white">Need the product-style overview?</p>
              <p className="mt-1 text-sm text-slate-400">Jump back to the redesigned landing page or open the matching dashboard surface.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                Home
              </Link>
              <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>
                Dashboard
                <LayoutDashboard className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      <nav className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-4 gap-2 rounded-[28px] border border-white/10 bg-slate-950/90 p-2 backdrop-blur md:hidden">
        {visiblePrimaryNavItems.slice(0, 4).map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-3 py-3 text-center text-xs font-medium transition",
                active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10",
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
