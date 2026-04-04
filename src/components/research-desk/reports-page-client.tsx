"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { FileText, Send, Sparkles, Users2 } from "lucide-react";
import { EmptyState } from "@/src/components/dashboard/empty-state";
import { SearchFilterBar } from "@/src/components/dashboard/search-filter-bar";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/src/components/ui/card";
import { SectionCard } from "@/src/components/shared/section-card";
import { cn } from "@/src/lib/utils";
import type { ResearchBrief, ResearchReport, SessionUser } from "@/src/lib/types";

type ReportsResponse = {
  reports: ResearchReport[];
  error?: string;
};

type BriefsResponse = {
  briefs: ResearchBrief[];
  error?: string;
};

type AdminUser = {
  id: string;
  name: string;
  workspaceId: string;
};

type OwnershipFilter = "all" | "mine" | "unowned" | "others";

const EMPTY_FORM = {
  briefId: "",
  title: "",
  format: "memo" as ResearchReport["format"],
  excerpt: "",
  keyFindings: "",
};

function reportBadge(value: string) {
  if (value === "published") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  if (value === "ready") {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }
  return "border-amber-300/30 bg-amber-300/10 text-amber-100";
}

export function ReportsPageClient() {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<AdminUser[]>([]);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const [reportsResponse, briefsResponse] = await Promise.all([
      fetch("/api/research/reports", { cache: "no-store" }),
      fetch("/api/research/briefs", { cache: "no-store" }),
    ]);
    const reportsPayload = (await reportsResponse.json()) as ReportsResponse;
    const briefsPayload = (await briefsResponse.json()) as BriefsResponse;

    if (!reportsResponse.ok) {
      throw new Error(reportsPayload.error || "Unable to load reports.");
    }
    if (!briefsResponse.ok) {
      throw new Error(briefsPayload.error || "Unable to load briefs.");
    }

    startTransition(() => {
      setReports(reportsPayload.reports);
      setBriefs(briefsPayload.briefs);
      setForm((current) => ({
        ...current,
        briefId: current.briefId || briefsPayload.briefs[0]?.id || "",
      }));
    });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadData();
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load reports.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionPayload = (await sessionResponse.json()) as { user?: SessionUser | null };
      if (cancelled) {
        return;
      }
      const sessionUser = sessionPayload.user || null;
      setCurrentUser(sessionUser);
      if (sessionUser?.role === "admin") {
        const adminResponse = await fetch("/api/admin/access", { cache: "no-store" });
        const adminPayload = (await adminResponse.json()) as { users?: AdminUser[] };
        if (!cancelled && adminResponse.ok) {
          setWorkspaceUsers((adminPayload.users || []).filter((item) => item.workspaceId === sessionUser.workspaceId));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const briefMap = useMemo(() => Object.fromEntries(briefs.map((brief) => [brief.id, brief])), [briefs]);

  async function createReport() {
    if (!form.briefId || !form.title.trim()) {
      setError("Brief and report title are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/research/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "draft",
          keyFindings: form.keyFindings.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const payload = (await response.json()) as ReportsResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create report.");
      }
      setReports(payload.reports);
      setForm((current) => ({ ...EMPTY_FORM, briefId: current.briefId }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create report.");
    } finally {
      setSaving(false);
    }
  }

  async function updateReportStatus(id: string, status: ResearchReport["status"]) {
    const response = await fetch("/api/research/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = (await response.json()) as ReportsResponse;
    if (response.ok) {
      setReports(payload.reports);
    } else {
      setError(payload.error || "Unable to update report.");
    }
  }

  async function deleteReport(id: string) {
    const response = await fetch("/api/research/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id }),
    });
    const payload = (await response.json()) as ReportsResponse;
    if (response.ok) {
      setReports(payload.reports);
    } else {
      setError(payload.error || "Unable to delete report.");
    }
  }

  async function reassignReport(id: string) {
    const ownerId = ownerDrafts[id];
    const targetOwner = workspaceUsers.find((item) => item.id === ownerId);
    if (!targetOwner) {
      setError("Select a workspace member to reassign this report.");
      return;
    }

    const response = await fetch("/api/research/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ownerId: targetOwner.id, ownerName: targetOwner.name }),
    });
    const payload = (await response.json()) as ReportsResponse;
    if (response.ok) {
      setReports(payload.reports);
    } else {
      setError(payload.error || "Unable to reassign report.");
    }
  }

  const visibleReports = reports.filter((report) => {
    if (ownershipFilter === "all" || !currentUser) {
      return true;
    }
    if (ownershipFilter === "mine") {
      return report.ownerId === currentUser.id;
    }
    if (ownershipFilter === "unowned") {
      return !report.ownerId;
    }
    if (ownershipFilter === "others") {
      return Boolean(report.ownerId) && report.ownerId !== currentUser.id;
    }
    return true;
  });

  const stats = useMemo(
    () => [
      { label: "Tracked reports", value: String(reports.length), icon: FileText },
      { label: "Ready to publish", value: String(reports.filter((report) => report.status === "ready").length), icon: Sparkles },
      { label: "My reports", value: String(reports.filter((report) => report.ownerId && report.ownerId === currentUser?.id).length), icon: Users2 },
    ],
    [reports, currentUser],
  );

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Reports"
        title="Synthesis and publication with a cleaner editorial workflow"
        description="Turn active briefs into memos and briefings in a surface that feels like part of the same premium product, not a separate tool."
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Create a report</CardTitle>
                <CardDescription className="mt-2">A compact editorial panel with enough structure to feel serious and production-ready.</CardDescription>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/6 p-3 text-slate-100">
                <Send className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <select value={form.briefId} onChange={(event) => setForm((current) => ({ ...current, briefId: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                <option value="">Select a brief</option>
                {briefs.map((brief) => (
                  <option key={brief.id} value={brief.id}>
                    {brief.title}
                  </option>
                ))}
              </select>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Report title" />
              <select value={form.format} onChange={(event) => setForm((current) => ({ ...current, format: event.target.value as ResearchReport["format"] }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                <option value="memo">Memo</option>
                <option value="briefing">Briefing</option>
                <option value="comparison">Comparison</option>
                <option value="outline">Outline</option>
              </select>
              <textarea value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} className="min-h-28 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="Short summary or excerpt" />
              <textarea value={form.keyFindings} onChange={(event) => setForm((current) => ({ ...current, keyFindings: event.target.value }))} className="min-h-32 w-full rounded-[20px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" placeholder="One key finding per line" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => void createReport()} disabled={saving} className={cn(buttonVariants({ variant: "default" }), "disabled:opacity-60")}>
                {saving ? "Saving..." : "Create Report"}
              </button>
              <Link href="/briefs" className={buttonVariants({ variant: "outline" })}>
                Review Briefs
              </Link>
            </div>

            {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
          </Card>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-3 font-display text-3xl font-semibold text-white">{item.value}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-white/6 p-3 text-slate-100">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6">
              <SearchFilterBar pills={["All reports", "Ready", "Published", "Recently updated"]} />

              <div className="mt-4 flex flex-wrap gap-2">
                {(["all", "mine", "unowned", "others"] as OwnershipFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setOwnershipFilter(filter)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs transition",
                      ownershipFilter === filter
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                    )}
                  >
                    {filter === "all" ? "All" : filter === "mine" ? "Mine" : filter === "unowned" ? "Unowned" : "Others"}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {visibleReports.length ? (
                  visibleReports.map((report) => (
                    <article key={report.id} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,19,31,0.88),rgba(8,19,31,0.72))] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-2xl">
                          <h3 className="text-xl font-semibold text-white">{report.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{report.excerpt}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs ${reportBadge(report.status)}`}>{report.status}</span>
                          <Badge className="border-white/10 bg-white/5 text-slate-200">{report.format}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Linked brief</p>
                        <p className="mt-2 text-sm text-white">{briefMap[report.briefId]?.title || report.briefId}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {report.keyFindings.map((item) => (
                          <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>Owner {report.ownerName || report.ownerId || "Workspace"}</span>
                        <span>Updated {new Date(report.updatedAt).toLocaleString()}</span>
                        <span>Created {new Date(report.createdAt).toLocaleString()}</span>
                      </div>

                      {currentUser?.role === "admin" && workspaceUsers.length ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <select
                            value={ownerDrafts[report.id] ?? report.ownerId ?? ""}
                            onChange={(event) => setOwnerDrafts((current) => ({ ...current, [report.id]: event.target.value }))}
                            className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none"
                          >
                            <option value="">Select owner</option>
                            {workspaceUsers.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={() => void reassignReport(report.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            Reassign Owner
                          </button>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(["draft", "ready", "published"] as ResearchReport["status"][]).map((status) => (
                          <button key={status} type="button" onClick={() => void updateReportStatus(report.id, status)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                            Mark {status}
                          </button>
                        ))}
                        <button type="button" onClick={() => void deleteReport(report.id)} className="inline-flex h-9 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10 px-3.5 text-xs text-rose-100 transition hover:bg-rose-400/15">
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title={loading ? "Loading reports..." : "No reports match this view"}
                    description="Reports now inherit the same product-grade empty state treatment so the page still feels intentionally designed."
                    href="/briefs"
                    cta="Open briefs"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
