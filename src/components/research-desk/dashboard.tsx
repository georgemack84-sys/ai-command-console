"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ResearchBrief, ResearchReport, SessionUser } from "@/src/lib/types";

const TRIAGE_FILTER_KEY = "research-desk.triage-filter";
const TRIAGE_SORT_KEY = "research-desk.triage-sort";
const TRIAGE_THRESHOLD_KEY = "research-desk.triage-threshold";
const TRIAGE_VIEWS_KEY = "research-desk.triage-views";
const TRIAGE_SCHEDULES_KEY = "research-desk.triage-schedules";
type TriageFilter = "all" | "blocked" | "review" | "publish" | "complete";
type TriageSort = "urgency" | "priority" | "recent";
type SavedTriageView = {
  name: string;
  filter: TriageFilter;
  sort: TriageSort;
  freshnessHours: number;
};
type SummarySchedule = {
  id: string;
  viewName: string;
  cadence: "weekday-morning" | "daily-brief" | "weekly-review";
  destination: "report-draft" | "clipboard-memo";
  lastRunAt?: string | null;
};
type OwnershipFilter = "all" | "mine" | "unowned" | "others";
const DEFAULT_TRIAGE_VIEWS: SavedTriageView[] = [
  { name: "Morning Triage", filter: "blocked", sort: "priority", freshnessHours: 24 },
  { name: "Review Pass", filter: "review", sort: "recent", freshnessHours: 72 },
  { name: "Publishing Pass", filter: "publish", sort: "urgency", freshnessHours: 168 },
];
const DEFAULT_SCHEDULES: SummarySchedule[] = [
  {
    id: "schedule-morning-triage",
    viewName: "Morning Triage",
    cadence: "weekday-morning",
    destination: "report-draft",
    lastRunAt: null,
  },
];

const PRIORITY_SCORE: Record<ResearchBrief["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

type Overview = {
  system: {
    agentCount: number;
    queuedTasks: number;
    completedTasks: number;
    activeSchedules: number;
  };
  health: {
    overall: string;
    reviewPressure: string;
    watcherStatus: string;
  };
  queue: Array<{
    id: string;
    agentName: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    agentName: string;
    status: string;
    taskDescription: string;
  }>;
  workload: Array<{
    agentName: string;
    status: string;
    queuedTasks: number;
    claimedTasks: number;
    unreadCount: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    command: string;
    tone: string;
  }>;
  activity: Array<{
    timestamp: string;
    event: string;
    message: string;
  }>;
};

const EMPTY_OVERVIEW: Overview = {
  system: {
    agentCount: 0,
    queuedTasks: 0,
    completedTasks: 0,
    activeSchedules: 0,
  },
  health: {
    overall: "unknown",
    reviewPressure: "unknown",
    watcherStatus: "unknown",
  },
  queue: [],
  reviews: [],
  workload: [],
  recommendations: [],
  activity: [],
};

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toneClass(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("error")) {
    return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  }

  if (normalized.includes("warning") || normalized.includes("pending") || normalized.includes("moderate")) {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  if (normalized.includes("healthy") || normalized.includes("active") || normalized.includes("ok")) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
}

function cadenceIntervalMs(value: SummarySchedule["cadence"]) {
  if (value === "weekly-review") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  return 24 * 60 * 60 * 1000;
}

function isWeekdayMorningDue(lastRunAt?: string | null) {
  const now = new Date();
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isMorningWindow = now.getHours() >= 7;
  if (!isWeekday || !isMorningWindow) {
    return false;
  }

  if (!lastRunAt) {
    return true;
  }

  const lastRun = new Date(lastRunAt);
  return lastRun.toDateString() !== now.toDateString();
}

function isScheduleDue(schedule: SummarySchedule) {
  if (schedule.cadence === "weekday-morning") {
    return isWeekdayMorningDue(schedule.lastRunAt);
  }

  if (!schedule.lastRunAt) {
    return true;
  }

  return Date.now() - new Date(schedule.lastRunAt).getTime() >= cadenceIntervalMs(schedule.cadence);
}

function nextRunText(schedule: SummarySchedule) {
  if (isScheduleDue(schedule)) {
    return "Due now";
  }

  if (!schedule.lastRunAt) {
    return "Waiting for first run";
  }

  const next = new Date(new Date(schedule.lastRunAt).getTime() + cadenceIntervalMs(schedule.cadence));
  return `Next ${next.toLocaleString()}`;
}

export function ResearchDeskDashboard() {
  const [overview, setOverview] = useState<Overview>(EMPTY_OVERVIEW);
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [triageFilter, setTriageFilter] = useState<TriageFilter>("all");
  const [triageSort, setTriageSort] = useState<TriageSort>("urgency");
  const [freshnessHours, setFreshnessHours] = useState(72);
  const [savedViews, setSavedViews] = useState<SavedTriageView[]>(DEFAULT_TRIAGE_VIEWS);
  const [schedules, setSchedules] = useState<SummarySchedule[]>(DEFAULT_SCHEDULES);
  const [viewName, setViewName] = useState("");
  const [scheduleViewName, setScheduleViewName] = useState("");
  const [scheduleCadence, setScheduleCadence] = useState<SummarySchedule["cadence"]>("weekday-morning");
  const [scheduleDestination, setScheduleDestination] = useState<SummarySchedule["destination"]>("report-draft");
  const [summaryViewName, setSummaryViewName] = useState<string | null>(null);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [savingSummary, setSavingSummary] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const autoRunAttempted = useRef(false);
  const runScheduleRef = useRef<(schedule: SummarySchedule) => Promise<void>>(async () => {});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(TRIAGE_FILTER_KEY);
    if (saved === "all" || saved === "blocked" || saved === "review" || saved === "publish" || saved === "complete") {
      setTriageFilter(saved);
    }
    const savedSort = window.localStorage.getItem(TRIAGE_SORT_KEY);
    if (savedSort === "urgency" || savedSort === "priority" || savedSort === "recent") {
      setTriageSort(savedSort);
    }
    const savedThreshold = Number(window.localStorage.getItem(TRIAGE_THRESHOLD_KEY));
    if (Number.isFinite(savedThreshold) && savedThreshold > 0) {
      setFreshnessHours(savedThreshold);
    }

    try {
      const rawViews = window.localStorage.getItem(TRIAGE_VIEWS_KEY);
      if (rawViews) {
        const parsed = JSON.parse(rawViews) as SavedTriageView[];
        const valid = parsed.filter((item) => {
          return (
            item &&
            typeof item.name === "string" &&
            (item.filter === "all" ||
              item.filter === "blocked" ||
              item.filter === "review" ||
              item.filter === "publish" ||
              item.filter === "complete") &&
            (item.sort === "urgency" || item.sort === "priority" || item.sort === "recent") &&
            Number.isFinite(item.freshnessHours)
          );
        });
        if (valid.length) {
          setSavedViews(valid.slice(0, 6));
        }
      }
    } catch {}

    try {
      const rawSchedules = window.localStorage.getItem(TRIAGE_SCHEDULES_KEY);
      if (rawSchedules) {
        const parsed = JSON.parse(rawSchedules) as SummarySchedule[];
        const valid = parsed.filter((item) => {
          return (
            item &&
            typeof item.id === "string" &&
            typeof item.viewName === "string" &&
            (item.cadence === "weekday-morning" || item.cadence === "daily-brief" || item.cadence === "weekly-review") &&
            (item.destination === "report-draft" || item.destination === "clipboard-memo")
          );
        });
        if (valid.length) {
          setSchedules(valid.slice(0, 6));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TRIAGE_FILTER_KEY, triageFilter);
  }, [triageFilter]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TRIAGE_SORT_KEY, triageSort);
  }, [triageSort]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TRIAGE_THRESHOLD_KEY, String(freshnessHours));
  }, [freshnessHours]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TRIAGE_VIEWS_KEY, JSON.stringify(savedViews.slice(0, 6)));
  }, [savedViews]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TRIAGE_SCHEDULES_KEY, JSON.stringify(schedules.slice(0, 6)));
  }, [schedules]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionPayload = (await sessionResponse.json()) as { user?: SessionUser | null };
      if (!cancelled) {
        setCurrentUser(sessionPayload.user || null);
      }
    })();

    async function loadOverview() {
      try {
        const [overviewResponse, briefsResponse, reportsResponse] = await Promise.all([
          fetch("/api/console", { cache: "no-store" }),
          fetch("/api/research/briefs", { cache: "no-store" }),
          fetch("/api/research/reports", { cache: "no-store" }),
        ]);
        const payload = (await overviewResponse.json()) as { overview: Overview };
        const briefPayload = (await briefsResponse.json()) as { briefs?: ResearchBrief[] };
        const reportPayload = (await reportsResponse.json()) as { reports?: ResearchReport[] };
        if (!cancelled) {
          setOverview(payload.overview);
          setBriefs(Array.isArray(briefPayload.briefs) ? briefPayload.briefs : []);
          setReports(Array.isArray(reportPayload.reports) ? reportPayload.reports : []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOverview();
    const interval = window.setInterval(() => {
      void loadOverview();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  function buildActionableBriefs(filter: TriageFilter, sort: TriageSort, freshness: number) {
    return briefs
      .map((brief) => {
      const linkedQueueTask = brief.linkedTaskId ? overview.queue.find((task) => task.id === brief.linkedTaskId) : null;
      const linkedReports = reports.filter((report) => report.briefId === brief.id);
      const readyReport = linkedReports.find((report) => report.status === "ready");
      const draftReport = linkedReports.find((report) => report.status === "draft");
      const pendingReview = brief.linkedTaskId ? overview.reviews.find((review) => review.taskDescription.includes(brief.title) || review.taskDescription.includes(brief.question)) : null;

      let urgency = 0;
      let reason = "Monitor progress";
      let actionLabel = "Open brief";

      if (!brief.linkedTaskId && brief.status !== "complete") {
        urgency = 100;
        reason = "Not queued yet";
        actionLabel = "Route brief";
      } else if (readyReport) {
        urgency = 90;
        reason = `Report "${readyReport.title}" is ready to publish`;
        actionLabel = "Publish report";
      } else if (pendingReview || brief.status === "in_review") {
        urgency = 80;
        reason = "Editorial review is waiting";
        actionLabel = "Review brief";
      } else if (draftReport) {
        urgency = 70;
        reason = `Draft report "${draftReport.title}" needs refinement`;
        actionLabel = "Refine draft";
      } else if (linkedQueueTask?.status === "claimed" || brief.status === "in_progress") {
        urgency = 50;
        reason = "Work is actively in progress";
        actionLabel = "Check progress";
      } else if (brief.status === "complete") {
        urgency = 10;
        reason = "Completed brief";
        actionLabel = "View archive";
      }

      return {
        brief,
        linkedQueueTask,
        linkedReports,
        pendingReview,
        readyReport,
        updatedAtMs: new Date(brief.updatedAt).getTime(),
        priorityScore: PRIORITY_SCORE[brief.priority] || 0,
        urgency,
        reason,
        actionLabel,
      };
    })
    .filter((item) => {
      if (filter === "blocked") {
        return !item.brief.linkedTaskId && item.brief.status !== "complete";
      }
      if (filter === "review") {
        return Boolean(item.pendingReview) || item.brief.status === "in_review";
      }
      if (filter === "publish") {
        return Boolean(item.readyReport);
      }
      if (filter === "complete") {
        return item.brief.status === "complete";
      }
      return true;
    })
    .filter((item) => {
      if (ownershipFilter === "mine" && currentUser) {
        return item.brief.ownerId === currentUser.id;
      }
      if (ownershipFilter === "unowned") {
        return !item.brief.ownerId;
      }
      if (ownershipFilter === "others" && currentUser) {
        return Boolean(item.brief.ownerId) && item.brief.ownerId !== currentUser.id;
      }
      return true;
    })
    .filter((item) => {
      const ageMs = Date.now() - item.updatedAtMs;
      return ageMs <= freshness * 60 * 60 * 1000;
    })
    .sort((a, b) => {
      if (sort === "priority") {
        const priorityDiff = b.priorityScore - a.priorityScore;
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
      }

      if (sort === "recent") {
        const recentDiff = b.updatedAtMs - a.updatedAtMs;
        if (recentDiff !== 0) {
          return recentDiff;
        }
      }

      const urgencyDiff = b.urgency - a.urgency;
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      return b.updatedAtMs - a.updatedAtMs;
    })
    .slice(0, 6);
  }

  const actionableBriefs = buildActionableBriefs(triageFilter, triageSort, freshnessHours);

  function saveCurrentView() {
    const trimmed = viewName.trim();
    if (!trimmed) {
      return;
    }

    setSavedViews((current) =>
      [
        { name: trimmed, filter: triageFilter, sort: triageSort, freshnessHours },
        ...current.filter((item) => item.name !== trimmed),
      ].slice(0, 6)
    );
    setViewName("");
  }

  function deleteView(name: string) {
    setSavedViews((current) => current.filter((item) => item.name !== name));
    setSchedules((current) => current.filter((item) => item.viewName !== name));
  }

  function buildTriageSummary(viewLabel: string) {
    const total = actionableBriefs.length;
    const blocked = actionableBriefs.filter((item) => !item.brief.linkedTaskId && item.brief.status !== "complete").length;
    const inReview = actionableBriefs.filter((item) => item.brief.status === "in_review" || item.pendingReview).length;
    const publishReady = actionableBriefs.filter((item) => item.readyReport).length;
    const topItems = actionableBriefs.slice(0, 3).map((item) => {
      return `${item.brief.title} (${item.reason.toLowerCase()})`;
    });

    return {
      title: `${viewLabel} Summary`,
      lines: [
        `${total} briefs match this operator view.`,
        blocked ? `${blocked} need routing before work can continue.` : "No briefs are currently blocked on routing.",
        inReview ? `${inReview} are waiting on editorial review.` : "No briefs are currently waiting on review.",
        publishReady ? `${publishReady} reports are ready to publish.` : "No reports are currently ready to publish.",
        topItems.length ? `Top items: ${topItems.join("; ")}.` : "No immediate follow-ups were surfaced.",
      ],
    };
  }

  const triageSummary = buildTriageSummary(summaryViewName || "Current View");

  const summaryMemo = [triageSummary.title, ...triageSummary.lines].join("\n");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryMemo);
      setSummaryNotice("Summary copied to clipboard.");
    } catch {
      setSummaryNotice("Unable to copy summary from this browser.");
    }
  }

  async function saveSummaryAsReport() {
    const targetBrief = actionableBriefs.find((item) => item.brief.status !== "complete")?.brief || briefs[0];
    if (!targetBrief) {
      setSummaryNotice("Create a brief before saving a summary report.");
      return;
    }

    try {
      setSavingSummary(true);
      setSummaryNotice(null);
      const response = await fetch("/api/research/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId: targetBrief.id,
          title: triageSummary.title,
          format: "briefing",
          excerpt: triageSummary.lines[0],
          keyFindings: triageSummary.lines.slice(1),
          status: "draft",
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save summary report.");
      }
      setSummaryNotice(`Saved draft report on brief "${targetBrief.title}".`);
    } catch (error) {
      setSummaryNotice(error instanceof Error ? error.message : "Unable to save summary report.");
    } finally {
      setSavingSummary(false);
    }
  }

  async function reloadDeskData() {
    const [overviewResponse, briefsResponse, reportsResponse] = await Promise.all([
      fetch("/api/console", { cache: "no-store" }),
      fetch("/api/research/briefs", { cache: "no-store" }),
      fetch("/api/research/reports", { cache: "no-store" }),
    ]);
    const payload = (await overviewResponse.json()) as { overview: Overview };
    const briefPayload = (await briefsResponse.json()) as { briefs?: ResearchBrief[] };
    const reportPayload = (await reportsResponse.json()) as { reports?: ResearchReport[] };
    setOverview(payload.overview);
    setBriefs(Array.isArray(briefPayload.briefs) ? briefPayload.briefs : []);
    setReports(Array.isArray(reportPayload.reports) ? reportPayload.reports : []);
  }

  runScheduleRef.current = async (schedule: SummarySchedule) => {
    setRunningScheduleId(schedule.id);
    try {
      const response = await fetch("/api/research/summaries/run-due", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          views: savedViews,
          schedules,
          scheduleId: schedule.id,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        schedules?: SummarySchedule[];
        generated?: Array<{ title: string; destination: string }>;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to run scheduled summary.");
      }
      if (Array.isArray(payload.schedules)) {
        setSchedules(payload.schedules);
      }
      await reloadDeskData();
      const generated = payload.generated || [];
      if (generated.length) {
        const latest = generated[0];
        setSummaryNotice(
          latest.destination === "report-draft"
            ? `Generated scheduled report "${latest.title}".`
            : `Schedule "${schedule.viewName}" is due for clipboard export.`
        );
      } else {
        setSummaryNotice(`Checked schedule "${schedule.viewName}".`);
      }
    } catch (error) {
      setSummaryNotice(error instanceof Error ? error.message : "Unable to run scheduled summary.");
    } finally {
      setRunningScheduleId(null);
    }
  };

  function addSchedule() {
    const targetName = scheduleViewName || savedViews[0]?.name || "";
    if (!targetName) {
      setSummaryNotice("Save a triage view before creating a schedule.");
      return;
    }

    setSchedules((current) =>
      [
        {
          id: `schedule_${Date.now()}`,
          viewName: targetName,
          cadence: scheduleCadence,
          destination: scheduleDestination,
          lastRunAt: null,
        },
        ...current.filter((item) => !(item.viewName === targetName && item.cadence === scheduleCadence && item.destination === scheduleDestination)),
      ].slice(0, 6)
    );
    setSummaryNotice(`Scheduled "${targetName}" as ${scheduleCadence}.`);
  }

  function removeSchedule(id: string) {
    setSchedules((current) => current.filter((item) => item.id !== id));
  }

  function cadenceLabel(value: SummarySchedule["cadence"]) {
    if (value === "weekday-morning") return "Weekday morning";
    if (value === "daily-brief") return "Daily brief";
    return "Weekly review";
  }

  function destinationLabel(value: SummarySchedule["destination"]) {
    return value === "report-draft" ? "Report draft" : "Clipboard memo";
  }

  useEffect(() => {
    if (loading || autoRunAttempted.current || !savedViews.length || !schedules.length) {
      return;
    }

    autoRunAttempted.current = true;
    const dueAutoSchedules = schedules.filter((schedule) => schedule.destination === "report-draft" && isScheduleDue(schedule));
    if (!dueAutoSchedules.length) {
      return;
    }

    void (async () => {
      for (const schedule of dueAutoSchedules) {
        await runScheduleRef.current(schedule);
      }
    })();
  }, [loading, savedViews, schedules]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.96))] p-6 shadow-[0_36px_120px_rgba(0,0,0,0.4)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/85">AI Research Desk</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Run scouting, synthesis, review, and publication from one desk.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This workspace turns the existing multi-agent console into a live research operation with tracked briefs,
              editorial review, queue visibility, and command-driven execution.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/briefs"
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Open Briefs
              </Link>
              <Link
                href="/reports"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Review Reports
              </Link>
              <Link
                href="/console"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Open Command Desk
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              label="Research Health"
              value={overview.health.overall}
              detail={`Review pressure ${overview.health.reviewPressure}`}
            />
            <MetricCard
              label="Active Briefs"
              value={String(overview.system.queuedTasks)}
              detail={`${overview.system.agentCount} agents available`}
            />
            <MetricCard
              label="Completed Runs"
              value={String(overview.system.completedTasks)}
              detail={`${overview.system.activeSchedules} schedules active`}
            />
            <MetricCard
              label="Automation Watch"
              value={overview.health.watcherStatus}
              detail={loading ? "Loading live state" : "Updated from console overview"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          eyebrow="Pipeline"
          title="Research lanes"
          description="Each lane has a distinct role so briefs move from intake to critique without losing context."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <LaneCard
              title="Scout"
              agent="researcher"
              description="Collect source context, scan questions, and reduce ambiguity before a synthesis pass."
            />
            <LaneCard
              title="Lead"
              agent="planner"
              description="Shape the brief, sequence the work, and keep the question framed tightly enough to execute."
            />
            <LaneCard
              title="Writer"
              agent="builder"
              description="Turn validated findings into outlines, memos, deliverables, and next-draft artifacts."
            />
          </div>
        </Card>

        <Card
          eyebrow="Starter Kit"
          title="Good first loops"
          description="These are the fastest ways to use the desk as a real research workflow."
        >
          <div className="space-y-3">
            {[
              "Route a new brief to the best agent from the console workflow panel.",
              "Use the queue and live activity feed to watch the brief move across agents.",
              "Process editorial reviews and send follow-up revisions without leaving the browser.",
              "Save a session around a topic so you can re-open the same research cadence later.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          eyebrow="Needs Action"
          title="Briefs that need operator attention"
          description="The desk bubbles up blocked, review-ready, and publish-ready work so you can jump straight to the next decision."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "blocked", label: "Blocked" },
              { key: "review", label: "In Review" },
              { key: "publish", label: "Publish Ready" },
              { key: "complete", label: "Complete" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTriageFilter(item.key as typeof triageFilter)}
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                  triageFilter === item.key
                    ? "border-cyan-300/50 bg-cyan-300 text-slate-950"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
              ))}
          </div>
          <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_180px]">
            <select
              value={triageSort}
              onChange={(event) => setTriageSort(event.target.value as TriageSort)}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="urgency">Sort by urgency</option>
              <option value="priority">Sort by priority</option>
              <option value="recent">Sort by recency</option>
            </select>
            <select
              value={String(freshnessHours)}
              onChange={(event) => setFreshnessHours(Number(event.target.value))}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="24">Last 24h</option>
              <option value="72">Last 72h</option>
              <option value="168">Last 7d</option>
              <option value="720">Last 30d</option>
            </select>
          </div>
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                placeholder="Save current triage view"
              />
              <button
                type="button"
                onClick={saveCurrentView}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Save View
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {savedViews.map((view) => (
                <div key={view.name} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTriageFilter(view.filter);
                      setTriageSort(view.sort);
                      setFreshnessHours(view.freshnessHours);
                    }}
                    className="rounded-full px-3 py-1 text-xs text-white transition hover:bg-white/10"
                  >
                    {view.name}
                  </button>
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${toneClass(view.filter)}`}>{view.filter}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{view.sort}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{view.freshnessHours}h</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTriageFilter(view.filter);
                      setTriageSort(view.sort);
                      setFreshnessHours(view.freshnessHours);
                      setSummaryViewName(view.name);
                    }}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100 transition hover:bg-cyan-300/20"
                  >
                    Summarize
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteView(view.name)}
                    className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-300 transition hover:bg-white/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Scheduled Summaries</p>
                <p className="mt-1 text-xs text-slate-500">Lightweight local schedules for recurring triage outputs.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_180px_180px_auto]">
              <select
                value={scheduleViewName}
                onChange={(event) => setScheduleViewName(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">Select saved view</option>
                {savedViews.map((view) => (
                  <option key={view.name} value={view.name}>
                    {view.name}
                  </option>
                ))}
              </select>
              <select
                value={scheduleCadence}
                onChange={(event) => setScheduleCadence(event.target.value as SummarySchedule["cadence"])}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="weekday-morning">Weekday morning</option>
                <option value="daily-brief">Daily brief</option>
                <option value="weekly-review">Weekly review</option>
              </select>
              <select
                value={scheduleDestination}
                onChange={(event) => setScheduleDestination(event.target.value as SummarySchedule["destination"])}
                className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="report-draft">Report draft</option>
                <option value="clipboard-memo">Clipboard memo</option>
              </select>
              <button
                type="button"
                onClick={addSchedule}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Add Schedule
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {schedules.length ? (
                schedules.map((schedule) => (
                  <div key={schedule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                      <span>{schedule.viewName}</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{cadenceLabel(schedule.cadence)}</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{destinationLabel(schedule.destination)}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] ${isScheduleDue(schedule) ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-white/10 text-slate-300"}`}>
                        {nextRunText(schedule)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={runningScheduleId === schedule.id}
                        onClick={() => void runScheduleRef.current(schedule)}
                        className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50"
                      >
                        {runningScheduleId === schedule.id ? "Running..." : "Run Now"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSchedule(schedule.id)}
                        className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  No scheduled summaries yet.
                </div>
              )}
            </div>
          </div>
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{triageSummary.title}</p>
                <p className="mt-1 text-xs text-slate-500">Generated from the current operator view.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSummaryViewName("Current View")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10"
                >
                  Refresh Summary
                </button>
                <button
                  type="button"
                  onClick={() => void copySummary()}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  Copy Memo
                </button>
                <button
                  type="button"
                  disabled={savingSummary}
                  onClick={() => void saveSummaryAsReport()}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50"
                >
                  {savingSummary ? "Saving..." : "Save as Report"}
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
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
                    {filter === "all" ? "All owners" : filter === "mine" ? "My briefs" : filter === "unowned" ? "Unowned" : "Others"}
                  </button>
                ))}
              </div>
              {triageSummary.lines.map((line) => (
                <div key={line} className="rounded-xl bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
                  {line}
                </div>
              ))}
            </div>
            {summaryNotice ? <p className="mt-4 text-xs text-slate-400">{summaryNotice}</p> : null}
          </div>
          <div className="space-y-3">
            {actionableBriefs.length ? (
              actionableBriefs.map(({ brief, reason, actionLabel, urgency, linkedReports }) => (
                <div key={brief.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{brief.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{reason}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(urgency >= 90 ? "critical" : urgency >= 70 ? "warning" : urgency >= 40 ? "active" : "ok")}`}>
                      {brief.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{brief.assignedAgent}</span>
                    <span>Owner {brief.ownerName || brief.ownerId || "Workspace"}</span>
                    <span>{brief.priority}</span>
                    <span>{linkedReports.length} reports</span>
                    <span>Updated {formatTime(brief.updatedAt)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/briefs/${brief.id}`}
                      className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      {actionLabel}
                    </Link>
                    <Link
                      href="/console"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Open in Desk
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                No briefs match this operator view right now.
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-500">The desk remembers your last triage filter, sort, freshness window, and saved views on this device.</p>
        </Card>

        <Card
          eyebrow="Queue"
          title="Open research briefs"
          description="Queued and in-flight work appears here so you can see what the desk is carrying right now."
        >
          <div className="space-y-3">
            {overview.queue.length ? (
              overview.queue.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{item.description}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{item.agentName}</span>
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                No briefs are queued yet. Start in the command desk and route a topic to the team.
              </div>
            )}
          </div>
        </Card>

        <Card
          eyebrow="Recommendations"
          title="Suggested next actions"
          description="The desk surfaces the most useful next commands based on current pressure in the system."
        >
          <div className="space-y-3">
            {overview.recommendations.length ? (
              overview.recommendations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{item.title}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(item.tone)}`}>{item.tone}</span>
                  </div>
                  <p className="mt-3 rounded-xl bg-slate-950/80 px-3 py-2 font-mono text-xs text-cyan-100">{item.command}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                Recommendations will appear once the desk has more activity to evaluate.
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          eyebrow="Workload"
          title="Agent occupancy"
          description="A quick view of how loaded each lane is before you assign the next brief."
        >
          <div className="space-y-3">
            {overview.workload.length ? (
              overview.workload.map((agent) => (
                <div key={agent.agentName} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{agent.agentName}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(agent.status)}`}>{agent.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <div className="rounded-xl bg-slate-950/80 p-3">Queued {agent.queuedTasks}</div>
                    <div className="rounded-xl bg-slate-950/80 p-3">Claimed {agent.claimedTasks}</div>
                    <div className="rounded-xl bg-slate-950/80 p-3">Unread {agent.unreadCount}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                Agent workload will populate after the first research tasks are routed.
              </div>
            )}
          </div>
        </Card>

        <Card
          eyebrow="Activity"
          title="Recent desk log"
          description="A short feed of the latest routing, review, and workflow actions."
        >
          <div className="space-y-3">
            {overview.activity.length ? (
              overview.activity.map((item, index) => (
                <div key={`${item.timestamp}-${index}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.event}</span>
                    <span className="text-xs text-slate-500">{formatTime(item.timestamp)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                No recent activity yet. Run a command or route a brief to start the feed.
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Card({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function LaneCard({
  title,
  agent,
  description,
}: {
  title: string;
  agent: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-black/25 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">{agent}</p>
      <h4 className="mt-3 text-xl font-semibold text-white">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
