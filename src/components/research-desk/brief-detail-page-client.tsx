"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionCard } from "@/src/components/shared/section-card";
import type { ResearchBrief, ResearchReport } from "@/src/lib/types";

type ReviewItem = {
  id: string;
  taskId: string;
  status: string;
  decision?: string | null;
  decisionNote?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

type TaskItem = {
  id: string;
  agentName: string;
  description: string;
  status: string;
  priority: number;
  createdAt: string;
  claimedAt?: string | null;
  completedAt?: string | null;
  result?: string | null;
};

type AuditItem = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  summary?: string | null;
};

type DetailPayload = {
  brief?: ResearchBrief;
  task?: TaskItem | null;
  reports?: ResearchReport[];
  reviews?: ReviewItem[];
  activity?: AuditItem[];
  error?: string;
};

function tone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("published") || normalized.includes("approved")) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  if (normalized.includes("review") || normalized.includes("high") || normalized.includes("ready")) {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }
  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function formatTime(value?: string | null) {
  if (!value) return "Waiting";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function BriefDetailPageClient({ briefId }: { briefId: string }) {
  const [payload, setPayload] = useState<DetailPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reportDraft, setReportDraft] = useState({
    title: "",
    format: "memo" as ResearchReport["format"],
    excerpt: "",
    keyFindings: "",
  });
  const [followup, setFollowup] = useState({
    agentName: "builder",
    description: "",
  });

  async function loadDetail() {
    const response = await fetch(`/api/research/briefs/${briefId}`, { cache: "no-store" });
    const next = (await response.json()) as DetailPayload;
    if (!response.ok) {
      throw new Error(next.error || "Unable to load brief details.");
    }
    setPayload(next);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/research/briefs/${briefId}`, { cache: "no-store" });
        const next = (await response.json()) as DetailPayload;
        if (!response.ok) {
          throw new Error(next.error || "Unable to load brief details.");
        }
        if (!cancelled) {
          setPayload(next);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load brief details.");
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
  }, [briefId]);

  async function runConsoleAction(action: string, actionPayload: Record<string, unknown>, busyKey = action) {
    setBusy(busyKey);
    setError(null);
    try {
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload: actionPayload }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Action failed.");
      }
      await loadDetail();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  const brief = payload.brief;
  const reports = payload.reports || [];
  const reviews = payload.reviews || [];
  const activity = payload.activity || [];

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Brief Detail"
        title={brief ? brief.title : "Research brief"}
        description={brief ? brief.question : "Loading brief context and timeline."}
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/briefs" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
            Back to Briefs
          </Link>
          <Link href="/reports" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
            Open Reports
          </Link>
          {brief ? (
            <Link href={`/console`} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
              Open Command Desk
            </Link>
          ) : null}
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}

        {loading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-300">Loading brief timeline...</div>
        ) : brief ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${tone(brief.status)}`}>{brief.status}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority</p>
                <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${tone(brief.priority)}`}>{brief.priority}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned</p>
                <p className="mt-3 text-sm text-white">{brief.assignedAgent}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Linked Task</p>
                <p className="mt-3 text-sm text-white">{brief.linkedTaskId || "Not queued"}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">Quick Actions</p>
                <span className="text-xs text-slate-500">Operate this brief directly from the timeline.</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy === "brief:route" || Boolean(brief.linkedTaskId)}
                  onClick={() => void runConsoleAction("brief:route", { briefId: brief.id })}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-50"
                >
                  {busy === "brief:route" ? "Routing..." : brief.linkedTaskId ? "Already Queued" : "Route Brief"}
                </button>
                <button
                  type="button"
                  disabled={busy === "review:create" || !brief.linkedTaskId}
                  onClick={() => void runConsoleAction("review:create", { taskId: brief.linkedTaskId })}
                  className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 disabled:opacity-50"
                >
                  {busy === "review:create" ? "Creating Review..." : "Create Review"}
                </button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-medium text-white">Desk Summary</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{brief.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brief.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Created {formatTime(brief.createdAt)}</span>
                    <span>Updated {formatTime(brief.updatedAt)}</span>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-medium text-white">Linked Task</p>
                  {payload.task ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-white">{payload.task.description}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs ${tone(payload.task.status)}`}>{payload.task.status}</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-300">
                        <div className="rounded-2xl bg-slate-950/70 p-4">Agent: {payload.task.agentName}</div>
                        <div className="rounded-2xl bg-slate-950/70 p-4">Priority: {payload.task.priority}</div>
                        <div className="rounded-2xl bg-slate-950/70 p-4">Created: {formatTime(payload.task.createdAt)}</div>
                        <div className="rounded-2xl bg-slate-950/70 p-4">Completed: {formatTime(payload.task.completedAt)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-950/70 p-4 text-sm text-slate-200">
                        {payload.task.result || "No result recorded yet."}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                      This brief is not linked to a task yet.
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-medium text-white">Review Context</p>
                  <div className="mt-4 space-y-3">
                    {reviews.length ? (
                      reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-white">{review.taskId}</p>
                            <span className={`rounded-full border px-3 py-1 text-xs ${tone(review.decision || review.status)}`}>{review.decision || review.status}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">{review.decisionNote || "No review note recorded."}</p>
                          <p className="mt-3 text-xs text-slate-500">Reviewed {formatTime(review.reviewedAt || review.createdAt)}</p>
                          <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                            <input
                              value={followup.agentName}
                              onChange={(event) => setFollowup((current) => ({ ...current, agentName: event.target.value }))}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                              placeholder="Follow-up agent"
                            />
                            <input
                              value={followup.description}
                              onChange={(event) => setFollowup((current) => ({ ...current, description: event.target.value }))}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                              placeholder="Follow-up task description"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={busy === `followup:${review.taskId}`}
                            onClick={() =>
                              void runConsoleAction(
                                "review:followup",
                                {
                                  taskId: review.taskId,
                                  agentName: followup.agentName,
                                  description: followup.description || `Follow up on brief ${brief.title}`,
                                },
                                `followup:${review.taskId}`
                              )
                            }
                            className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                          >
                            {busy === `followup:${review.taskId}` ? "Creating Follow-up..." : "Create Follow-up"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                        No review items are linked to this brief yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Reports</p>
                    <span className="text-xs text-slate-500">{reports.length} linked</span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-sm font-medium text-white">Quick Draft</p>
                    <div className="mt-3 space-y-3">
                      <input
                        value={reportDraft.title}
                        onChange={(event) => setReportDraft((current) => ({ ...current, title: event.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        placeholder="Draft report title"
                      />
                      <select
                        value={reportDraft.format}
                        onChange={(event) => setReportDraft((current) => ({ ...current, format: event.target.value as ResearchReport["format"] }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="memo">Memo</option>
                        <option value="briefing">Briefing</option>
                        <option value="comparison">Comparison</option>
                        <option value="outline">Outline</option>
                      </select>
                      <textarea
                        value={reportDraft.excerpt}
                        onChange={(event) => setReportDraft((current) => ({ ...current, excerpt: event.target.value }))}
                        className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        placeholder="Draft excerpt"
                      />
                      <textarea
                        value={reportDraft.keyFindings}
                        onChange={(event) => setReportDraft((current) => ({ ...current, keyFindings: event.target.value }))}
                        className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        placeholder="One key finding per line"
                      />
                      <button
                        type="button"
                        disabled={busy === "report:create"}
                        onClick={() =>
                          void runConsoleAction(
                            "report:create",
                            {
                              briefId: brief.id,
                              title: reportDraft.title || `${brief.title} memo`,
                              format: reportDraft.format,
                              excerpt: reportDraft.excerpt || `Draft created for ${brief.title}.`,
                              keyFindings: reportDraft.keyFindings
                                .split("\n")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            },
                            "report:create"
                          ).then(() =>
                            setReportDraft({
                              title: "",
                              format: "memo",
                              excerpt: "",
                              keyFindings: "",
                            })
                          )
                        }
                        className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                      >
                        {busy === "report:create" ? "Creating Draft..." : "Create Draft Report"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {reports.length ? (
                      reports.map((report) => (
                        <div key={report.id} className="rounded-2xl bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-white">{report.title}</p>
                            <span className={`rounded-full border px-3 py-1 text-xs ${tone(report.status)}`}>{report.status}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">{report.excerpt}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {report.keyFindings.map((finding) => (
                              <span key={finding} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                                {finding}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={busy === `publish:${report.id}` || report.status === "published"}
                            onClick={() => void runConsoleAction("report:publish", { reportId: report.id }, `publish:${report.id}`)}
                            className="mt-4 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
                          >
                            {busy === `publish:${report.id}` ? "Publishing..." : report.status === "published" ? "Published" : "Publish Report"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                        No reports are linked to this brief yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Activity Timeline</p>
                    <span className="text-xs text-slate-500">{activity.length} events</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activity.length ? (
                      activity.map((event) => (
                        <div key={event.id} className="rounded-2xl bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{event.type}</span>
                            <span className="text-xs text-slate-500">{formatTime(event.timestamp)}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-200">{event.message}</p>
                          {event.summary ? <p className="mt-2 text-xs text-slate-500">{event.summary}</p> : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
                        No audit events are linked to this brief yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-300">Brief not found.</div>
        )}
      </SectionCard>
    </div>
  );
}
