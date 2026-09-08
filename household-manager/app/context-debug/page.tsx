"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HouseholdContext } from "../../lib/context/types";

type HistoryEntry = { id: string; eventType: string; title: string; message: string; createdAt: string };

export default function ContextDebugPage() {
  const [context, setContext] = useState<HouseholdContext | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => { void Promise.all([fetch("/api/context/today"), fetch("/api/context/history")]).then(async ([contextResponse, historyResponse]) => { const data = await contextResponse.json() as HouseholdContext & { error?: string }; if (!contextResponse.ok) throw new Error(data.error); setContext(data); if (historyResponse.ok) setHistory(await historyResponse.json() as HistoryEntry[]); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load context.")); }, []);
  return <main><nav className="top-nav"><Link className="brand" href="/">Household Manager</Link><Link href="/today">Today</Link></nav><section className="settings-hero"><p className="eyebrow">Developer tools</p><h1>Context debugger</h1><p className="lede">A read-only explanation of the facts and deterministic rules behind today’s recommendations.</p></section>{error && <p className="notice">{error}</p>}{context && <section className="brief-grid"><article className="brief-card"><p className="eyebrow">Snapshot</p><h2>{context.household.location.label}</h2><p className="meta">{context.time.dayOfWeek} · {context.time.localTime} · {context.time.timezone}<br />Weather: {Math.round(context.weather.current.temperature)}° · {context.weather.severeConditions === "NONE" ? "No severe conditions" : context.weather.severeConditions}</p></article><article className="brief-card"><p className="eyebrow">Rules triggered</p><h2>{context.insights.length || "None"}</h2><div className="brief-list">{context.insights.map((insight) => <div key={insight.id}><strong>{insight.triggeredRules.join(", ")}</strong><span>{insight.reasons.join(" · ")}</span></div>)}</div></article><article className="brief-card"><p className="eyebrow">Result</p><h2>Recommendations</h2><div className="brief-list">{context.insights.map((insight) => <div key={insight.id}><strong>{insight.title}</strong><span>{insight.recommendedAction ?? insight.message}</span></div>)}</div></article><article className="brief-card"><p className="eyebrow">History</p><h2>Recent insight events</h2>{history.length ? <div className="brief-list">{history.slice(0, 5).map((entry) => <div key={entry.id}><strong>{entry.title}</strong><span>{entry.eventType.toLowerCase()} · {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</span></div>)}</div> : <p className="meta">No insights have been recorded yet.</p>}</article></section>}</main>;
}
