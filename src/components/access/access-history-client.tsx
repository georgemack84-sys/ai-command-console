"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSession } from "@/src/components/app/app-provider";
import { SectionCard } from "@/src/components/shared/section-card";
import type { ResearchBrief, ResearchReport } from "@/src/lib/types";

type ApprovalEntry = {
  id: string;
  action: string;
  label: string;
  requestedByName: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  approvedByName?: string;
  rejectedByName?: string;
  rejectionNote?: string;
};

type AuditEntry = {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  payload?: Record<string, unknown>;
};

type AccessPayload = {
  governance: {
    currentEnvironment: string;
    sensitiveActionsRequireApproval: boolean;
  };
  approvals: ApprovalEntry[];
  audit: AuditEntry[];
};

type OwnershipMetrics = {
  orphanedBriefs: number;
  orphanedReports: number;
  recentReassignments: number;
  busiestOwner: string;
  busiestOwnerCount: number;
  totalOwnedItems: number;
};

type WatchlistItem = {
  id: string;
  tone: "warning" | "notice";
  title: string;
  detail: string;
};

export function AccessHistoryClient({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAppSession();
  const [payload, setPayload] = useState<AccessPayload | null>(null);
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [filter, setFilter] = useState<"all" | "approvals" | "governance" | "roles" | "ownership">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/access", { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load access history.");
        return;
      }

      const [accessPayload, briefsResponse, reportsResponse] = await Promise.all([
        response.json(),
        fetch("/api/research/briefs", { cache: "no-store" }),
        fetch("/api/research/reports", { cache: "no-store" }),
      ]);

      setPayload(accessPayload as AccessPayload);
      if (briefsResponse.ok) {
        const briefPayload = (await briefsResponse.json()) as { briefs?: ResearchBrief[] };
        setBriefs(briefPayload.briefs || []);
      }
      if (reportsResponse.ok) {
        const reportPayload = (await reportsResponse.json()) as { reports?: ResearchReport[] };
        setReports(reportPayload.reports || []);
      }
      setError(null);
    })();
  }, []);

  const combinedEntries = useMemo(() => {
    if (!payload) {
      return [];
    }

    const approvalRows = payload.approvals.map((item) => ({
      id: item.id,
      timestamp: item.resolvedAt || item.createdAt,
      category: "approvals",
      title: item.label,
      detail: `${item.requestedByName} • ${item.status}${item.approvedByName ? ` • approved by ${item.approvedByName}` : ""}${item.rejectedByName ? ` • rejected by ${item.rejectedByName}` : ""}`,
    }));

    const auditRows = payload.audit.map((item) => ({
      id: item.id,
      timestamp: item.timestamp,
      category:
        item.type === "admin:governance-updated"
          ? "governance"
          : item.type.includes("owner-reassigned")
            ? "ownership"
            : "roles",
      title: item.message,
      detail: item.type,
    }));

    return [...approvalRows, ...auditRows]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [payload]);

  const ownershipMetrics = useMemo<OwnershipMetrics>(() => {
    const ownerLoad = new Map<string, number>();
    [...briefs, ...reports].forEach((item) => {
      const owner = item.ownerName || item.ownerId || "Unowned";
      ownerLoad.set(owner, (ownerLoad.get(owner) || 0) + 1);
    });
    const busiest = [...ownerLoad.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      orphanedBriefs: briefs.filter((item) => !item.ownerId).length,
      orphanedReports: reports.filter((item) => !item.ownerId).length,
      recentReassignments: (payload?.audit || []).filter((item) => item.type.includes("owner-reassigned")).length,
      busiestOwner: busiest ? `${busiest[0]} (${busiest[1]})` : "None",
      busiestOwnerCount: busiest?.[1] || 0,
      totalOwnedItems: briefs.length + reports.length,
    };
  }, [briefs, payload?.audit, reports]);

  const watchlist = useMemo<WatchlistItem[]>(() => {
    const items: WatchlistItem[] = [];
    const orphanedTotal = ownershipMetrics.orphanedBriefs + ownershipMetrics.orphanedReports;

    if (orphanedTotal > 0) {
      items.push({
        id: "orphaned-work",
        tone: "warning",
        title: `${orphanedTotal} unassigned workspace items need an owner`,
        detail: `${ownershipMetrics.orphanedBriefs} briefs and ${ownershipMetrics.orphanedReports} reports are currently unowned.`,
      });
    }

    if (ownershipMetrics.recentReassignments >= 3) {
      items.push({
        id: "reassignment-pressure",
        tone: "warning",
        title: "Ownership is shifting frequently",
        detail: `${ownershipMetrics.recentReassignments} ownership changes were recorded recently. This can signal unclear handoffs or workload churn inside the workspace.`,
      });
    }

    if (
      ownershipMetrics.totalOwnedItems >= 4 &&
      ownershipMetrics.busiestOwnerCount >= Math.ceil(ownershipMetrics.totalOwnedItems * 0.5)
    ) {
      items.push({
        id: "owner-imbalance",
        tone: "notice",
        title: `${ownershipMetrics.busiestOwner} is carrying most of the assigned work`,
        detail: `One owner is holding at least half of the ${ownershipMetrics.totalOwnedItems} tracked briefs and reports. Rebalancing could reduce single-operator bottlenecks.`,
      });
    }

    if (!items.length) {
      items.push({
        id: "healthy-ownership",
        tone: "notice",
        title: "Ownership coverage looks healthy",
        detail: "No orphaned work or major reassignment pressure is showing up right now.",
      });
    }

    return items;
  }, [ownershipMetrics]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return combinedEntries.filter((entry) => {
      if (filter !== "all" && entry.category !== filter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return `${entry.title} ${entry.detail}`.toLowerCase().includes(normalizedQuery);
    });
  }, [combinedEntries, filter, query]);

  function exportCsv() {
    const lines = [
      ["timestamp", "category", "title", "detail"].join(","),
      ...filteredEntries.map((entry) =>
        [entry.timestamp, entry.category, entry.title, entry.detail]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "access-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (user?.role !== "admin") {
    if (embedded) {
      return null;
    }
    return (
      <SectionCard
        eyebrow="Access"
        title="Admin access required"
        description="This view is reserved for administrators who manage approvals, roles, and environment governance."
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Your current role does not have access to the approvals and governance history view.
        </div>
      </SectionCard>
    );
  }

  const content = (
    <>
      {payload ? (
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <Metric label="Environment" value={payload.governance.currentEnvironment} />
          <Metric label="Approvals" value={String(payload.approvals.length)} />
          <Metric label="Approval Gate" value={payload.governance.sensitiveActionsRequireApproval ? "On" : "Off"} />
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric label="Orphaned Briefs" value={String(ownershipMetrics.orphanedBriefs)} />
        <Metric label="Orphaned Reports" value={String(ownershipMetrics.orphanedReports)} />
        <Metric label="Recent Reassignments" value={String(ownershipMetrics.recentReassignments)} />
        <Metric label="Busiest Owner" value={ownershipMetrics.busiestOwner} />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        {watchlist.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl border p-4 ${
              item.tone === "warning"
                ? "border-amber-400/30 bg-amber-300/10"
                : "border-sky-300/20 bg-sky-300/10"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                  item.tone === "warning" ? "bg-amber-300 text-slate-950" : "bg-sky-300 text-slate-950"
                }`}
              >
                {item.tone}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "approvals", "governance", "roles", "ownership"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filter === value ? "border-sky-300/50 bg-sky-300 text-slate-950" : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter history"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{error}</div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{entry.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-sky-300/85">{entry.category}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-4 text-sm text-slate-300">
              No access history matches the current filter.
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <SectionCard
      eyebrow="Access"
      title="Approvals and governance history"
      description="Review sensitive-action approvals, role changes, and governance updates in one admin timeline."
    >
      {content}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
