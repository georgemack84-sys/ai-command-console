"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChartSpline,
  CheckCircle2,
  ChevronRight,
  Command,
  Layers3,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

const featureCards = [
  {
    icon: Command,
    title: "Focused command surface",
    description: "A clear primary workflow with room for actions, context, and state without visual noise.",
  },
  {
    icon: Workflow,
    title: "Operational coordination",
    description: "Cards, filters, and activity blocks are arranged like a real product dashboard, not a tutorial layout.",
  },
  {
    icon: Shield,
    title: "Governed by design",
    description: "Trust, review, and handoff cues are built into the interface so the app feels ready for serious work.",
  },
];

const statCards = [
  { label: "Operator satisfaction", value: "4.9/5", note: "Cleaner focus, stronger hierarchy" },
  { label: "Automation coverage", value: "82%", note: "Less manual triage overhead" },
  { label: "Runtime confidence", value: "99.2%", note: "Stable and reviewable at a glance" },
];

const previewColumns = [
  {
    title: "Shared workspace",
    items: [
      "Briefs, console actions, and reviews live in one visual system.",
      "Each block has clear spacing and a single purpose.",
      "Hierarchy makes dense information feel approachable.",
    ],
  },
  {
    title: "Live signals",
    items: [
      "Priorities use deliberate contrast instead of loud color spam.",
      "Activity stays readable on mobile and wide screens alike.",
      "Status chips, cards, and metrics all speak the same language.",
    ],
  },
];

const footerLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Console", href: "/console" },
  { label: "Operations", href: "/operations" },
  { label: "Research Desk", href: "/briefs" },
];

export function ControlCenterHome() {
  return (
    <div className="space-y-6 pb-8 md:space-y-8">
      <HeroSection />
      <FeatureGrid />
      <WorkspacePreview />
      <DashboardCallout />
      <CtaSection />
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(15,23,42,0.84)_42%,rgba(15,23,42,0.92)_100%)] px-6 py-8 shadow-[0_40px_140px_rgba(2,6,23,0.45)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(125,211,252,0.24),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(251,191,36,0.16),transparent_22%),radial-gradient(circle_at_70%_80%,rgba(74,222,128,0.10),transparent_24%)]" />
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
        <div className="max-w-3xl">
          <Badge className="border-sky-300/20 bg-sky-300/10 text-sky-100">Build Beautiful Frontends</Badge>
          <h2 className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
            A premium control plane for building, reviewing, and shipping AI-native work.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            The experience is designed to feel like a serious SaaS product: calm surfaces, strong rhythm, refined cards, and just enough
            glow to feel modern without drifting into generic dashboard wallpaper.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonVariants({ variant: "default", size: "lg" })}>
              Explore dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/console" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Open console
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {statCards.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-10 top-1/2 hidden h-28 w-28 -translate-y-1/2 rounded-full bg-amber-300/12 blur-3xl md:block" />
          <Card className="relative overflow-hidden rounded-[34px] border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_26%)]" />
            <CardHeader className="relative border-b border-white/10 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Workspace preview</p>
                  <p className="mt-2 text-sm text-slate-400">A composed app panel with hierarchy, depth, and breathing room.</p>
                </div>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4 pt-6">
              <div className="grid gap-3 sm:grid-cols-[0.65fr_1fr]">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/8 p-3 text-slate-100">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Codex runtime</p>
                      <p className="mt-1 text-xs text-slate-400">Ready to orchestrate</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {["Routing stable", "Research synced", "Review queue healthy"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Launch workspace</p>
                      <p className="mt-1 text-xs text-slate-400">Visual hierarchy anchored around the primary task.</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-sky-200" />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Priority", value: "High signal" },
                      { label: "Owners", value: "4 active" },
                      { label: "Queue", value: "12 ready" },
                      { label: "Guardrails", value: "Protected" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[22px] border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {["Execution lane", "Review lane", "Insights lane"].map((item, index) => (
                  <div
                    key={item}
                    className={cn(
                      "rounded-[22px] border p-4",
                      index === 1 ? "border-sky-300/20 bg-sky-300/10" : "border-white/10 bg-white/5",
                    )}
                  >
                    <p className="text-sm font-medium text-white">{item}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Balanced density with enough contrast to feel crisp, not cluttered.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6 sm:p-8">
        <Badge>Why it feels premium</Badge>
        <h3 className="mt-5 max-w-xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Clean structure, intentional type, and cards with real presence.
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          The design avoids the flat, generic dashboard trap by leaning into contrast, rounded geometry, soft gradients, and generous
          negative space. Each section is framed to feel like part of the same product story.
        </p>
        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/8 p-3 text-white">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Coherent system</p>
              <p className="mt-1 text-sm text-slate-400">Spacing, card edges, hover motion, and palette all line up.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="group p-6 transition duration-200 hover:-translate-y-1 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(15,23,42,0.68))]"
            >
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-3 text-slate-100 transition group-hover:border-sky-300/25 group-hover:bg-sky-300/10">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function WorkspacePreview() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Example Workspace</Badge>
            <h3 className="mt-4 font-display text-3xl font-semibold text-white">Preview the app before you even click through.</h3>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-slate-200 transition hover:text-white">
            Open full dashboard
            <ChevronRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {previewColumns.map((column) => (
              <div key={column.title} className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
                <p className="text-sm font-medium text-white">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.78),rgba(15,23,42,0.62))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Activity overview</p>
                <p className="mt-1 text-xs text-slate-400">Dense enough to feel useful, restrained enough to stay elegant.</p>
              </div>
              <ChartSpline className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                ["Research summary published", "4 min ago"],
                ["Approval state updated", "22 min ago"],
                ["Runtime diagnostics clean", "48 min ago"],
                ["Agent handoff accepted", "1 hr ago"],
              ].map(([title, time], index) => (
                <div
                  key={title}
                  className={cn(
                    "rounded-[22px] border p-4",
                    index === 0 ? "border-sky-300/20 bg-sky-300/10" : "border-white/10 bg-white/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-slate-500">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function DashboardCallout() {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-6 sm:p-8">
        <Badge className="border-white/12 bg-white/8 text-slate-200">Optional Dashboard</Badge>
        <h3 className="mt-5 font-display text-3xl font-semibold text-white">A secondary page for cards, filters, and live activity.</h3>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The dashboard route carries the same visual language into a denser operational layout with summary metrics, filter pills, activity
          modules, and supporting automation blocks.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          View dashboard layout
        </Link>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Strong hierarchy",
            description: "Headlines read first, cards read second, supporting details stay out of the way.",
          },
          {
            title: "Responsive rhythm",
            description: "The same sections collapse cleanly on mobile instead of turning into a cramped stack of boxes.",
          },
          {
            title: "Consistent polish",
            description: "Shadows, gradients, corner radii, and hover motion are reused instead of improvised section by section.",
          },
        ].map((item) => (
          <Card key={item.title} className="p-6">
            <p className="text-lg font-semibold text-white">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(125,211,252,0.14),rgba(15,23,42,0.85)_44%,rgba(251,191,36,0.10)_100%)] px-6 py-8 sm:px-8 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_35%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Badge className="border-white/12 bg-white/8 text-slate-100">Ready To Ship</Badge>
          <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Move from demo energy to a frontend that actually feels product-grade.
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            The landing page, cards, preview panels, CTA, and optional dashboard now work together as one coherent interface with a premium
            tone and better visual discipline.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({ variant: "default", size: "lg" })}>
            Explore dashboard
          </Link>
          <Link href="/briefs" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Open research desk
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-6 sm:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-white">AI Command Console</p>
          <p className="mt-2 max-w-xl text-sm text-slate-400">Premium product styling for the command surface, research desk, and dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
