"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { SectionCard } from "@/src/components/shared/section-card";
import type { ResearchBrief, ResearchBriefStatus, ResearchPriority, SessionUser } from "@/src/lib/types";

type BriefResponse = {
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
  title: "",
  question: "",
  assignedAgent: "researcher",
  priority: "medium" as ResearchPriority,
  tags: "",
  summary: "",
  queueBrief: true,
};

function badgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("high") || normalized.includes("review")) {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }
  if (normalized.includes("complete")) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  if (normalized.includes("progress") || normalized.includes("queued")) {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }
  return "border-white/10 bg-white/5 text-slate-200";
}

export function BriefsPageClient() {
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<AdminUser[]>([]);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBriefs() {
    const response = await fetch("/api/research/briefs", { cache: "no-store" });
    const payload = (await response.json()) as BriefResponse;
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load briefs.");
    }
    startTransition(() => {
      setBriefs(payload.briefs);
    });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadBriefs();
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load briefs.");
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
          setWorkspaceUsers(
            (adminPayload.users || []).filter((item) => item.workspaceId === sessionUser.workspaceId)
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function createBrief() {
    if (!form.title.trim() || !form.question.trim()) {
      setError("Title and research question are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/research/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: form.queueBrief ? "queued" : "draft",
          queueBrief: form.queueBrief,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      const payload = (await response.json()) as BriefResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Unable to create brief.");
      }
      setBriefs(payload.briefs);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create brief.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBriefStatus(id: string, status: ResearchBriefStatus) {
    const response = await fetch("/api/research/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = (await response.json()) as BriefResponse;
    if (response.ok) {
      setBriefs(payload.briefs);
    } else {
      setError(payload.error || "Unable to update brief.");
    }
  }

  async function routeBrief(id: string) {
    const response = await fetch("/api/research/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, routeToQueue: true }),
    });
    const payload = (await response.json()) as BriefResponse;
    if (response.ok) {
      setBriefs(payload.briefs);
    } else {
      setError(payload.error || "Unable to route brief.");
    }
  }

  async function deleteBrief(id: string) {
    const response = await fetch("/api/research/briefs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: id }),
    });
    const payload = (await response.json()) as BriefResponse;
    if (response.ok) {
      setBriefs(payload.briefs);
    } else {
      setError(payload.error || "Unable to delete brief.");
    }
  }

  async function reassignBrief(id: string) {
    const ownerId = ownerDrafts[id];
    const targetOwner = workspaceUsers.find((item) => item.id === ownerId);
    if (!targetOwner) {
      setError("Select a workspace member to reassign this brief.");
      return;
    }

    const response = await fetch("/api/research/briefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ownerId: targetOwner.id, ownerName: targetOwner.name }),
    });
    const payload = (await response.json()) as BriefResponse;
    if (response.ok) {
      setBriefs(payload.briefs);
    } else {
      setError(payload.error || "Unable to reassign brief.");
    }
  }

  const visibleBriefs = briefs.filter((brief) => {
    if (ownershipFilter === "all" || !currentUser) {
      return true;
    }

    if (ownershipFilter === "mine") {
      return brief.ownerId === currentUser.id;
    }

    if (ownershipFilter === "unowned") {
      return !brief.ownerId;
    }

    if (ownershipFilter === "others") {
      return Boolean(brief.ownerId) && brief.ownerId !== currentUser.id;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Briefs"
        title="Research intake and tracking"
        description="Capture the question, assign the right lane, and keep each brief visible from draft to completion."
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
            <p className="text-sm font-medium text-white">Create a new brief</p>
            <div className="mt-4 space-y-3">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Brief title" />
              <textarea value={form.question} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Research question" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={form.assignedAgent} onChange={(event) => setForm((current) => ({ ...current, assignedAgent: event.target.value }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Assigned agent" />
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ResearchPriority }))} className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </div>
              <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Tags separated by commas" />
              <textarea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none" placeholder="Short desk summary" />
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={form.queueBrief} onChange={(event) => setForm((current) => ({ ...current, queueBrief: event.target.checked }))} />
                Queue this brief immediately for the assigned agent
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void createBrief()} disabled={saving} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
                  {saving ? "Saving..." : "Create Brief"}
                </button>
                <Link href="/console" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                  Open Command Desk
                </Link>
              </div>
              {error ? <p className="text-sm text-rose-200">{error}</p> : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["all", "mine", "unowned", "others"] as OwnershipFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setOwnershipFilter(filter)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    ownershipFilter === filter
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {filter === "all" ? "All" : filter === "mine" ? "Mine" : filter === "unowned" ? "Unowned" : "Others"}
                </button>
              ))}
            </div>
            {visibleBriefs.length ? (
              visibleBriefs.map((brief) => (
                <article key={brief.id} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,19,31,0.88),rgba(8,19,31,0.72))] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{brief.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{brief.question}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass(brief.status)}`}>{brief.status}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass(brief.priority)}`}>{brief.priority}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{brief.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brief.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Assigned to {brief.assignedAgent}</span>
                    <span>Owner {brief.ownerName || brief.ownerId || "Workspace"}</span>
                    <span>Updated {new Date(brief.updatedAt).toLocaleString()}</span>
                    {brief.linkedTaskId ? <span>Task {brief.linkedTaskId}</span> : null}
                  </div>
                  {currentUser?.role === "admin" && workspaceUsers.length ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <select
                        value={ownerDrafts[brief.id] ?? brief.ownerId ?? ""}
                        onChange={(event) =>
                          setOwnerDrafts((current) => ({ ...current, [brief.id]: event.target.value }))
                        }
                        className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">Select owner</option>
                        {workspaceUsers.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void reassignBrief(brief.id)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
                      >
                        Reassign Owner
                      </button>
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/briefs/${brief.id}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
                      Open Detail
                    </Link>
                    <button type="button" onClick={() => void routeBrief(brief.id)} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                      Route to Queue
                    </button>
                    {(["queued", "in_progress", "in_review", "complete"] as ResearchBriefStatus[]).map((status) => (
                      <button key={status} type="button" onClick={() => void updateBriefStatus(brief.id, status)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10">
                        Mark {status}
                      </button>
                    ))}
                    <button type="button" onClick={() => void deleteBrief(brief.id)} className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                {loading ? "Loading briefs..." : "No briefs match this ownership filter yet."}
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
