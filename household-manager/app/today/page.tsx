"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createLocationService } from "../../lib/location/location-service";
import { createTaskService, type HouseholdTask } from "../../lib/tasks/task-service";
import { evaluateTaskWeather } from "../../lib/tasks/weather-context-engine";
import { WeatherService, weatherPresentation, type WeatherForecast } from "../../lib/weather/weather-service";
import { createHouseholdService, type Chore, type ShoppingItem } from "../../lib/household/household-service";
import type { HouseholdContext } from "../../lib/context/types";

const locationService = createLocationService();
const taskService = createTaskService();
const weatherService = new WeatherService();
const householdService = createHouseholdService();

export default function TodayPage() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [context, setContext] = useState<HouseholdContext | null>(null);
  const [showInsightWhy, setShowInsightWhy] = useState(false);
  const [message, setMessage] = useState("Loading your household context…");
  const refresh = useCallback(async () => {
    try {
      const [location, savedTasks, savedChores, savedShopping] = await Promise.all([locationService.getEffectiveLocation("HOUSEHOLD"), taskService.list(), householdService.listChores(), householdService.listShopping()]);
      const [updatedForecast, response] = await Promise.all([weatherService.getForecast(location), fetch("/api/context/today")]);
      setForecast(updatedForecast); setTasks(savedTasks); setChores(savedChores); setShopping(savedShopping);
      if (response.ok) setContext(await response.json() as HouseholdContext);
      else { const result = await response.json() as { error?: string }; setMessage(result.error ?? "Unable to load household context."); }
      setMessage(`Updated at ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date())}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load today’s household context."); }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 900_000); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { const events = new EventSource("/api/context/events"); events.addEventListener("context-updated", () => void refresh()); return () => events.close(); }, [refresh]);
  const guidance = useMemo(() => tasks.filter((task) => !task.completed).map((task) => ({ task, recommendation: forecast ? evaluateTaskWeather(task, forecast) : null })), [tasks, forecast]);
  const condition = forecast ? weatherPresentation(forecast.weatherCode) : null;
  const choresByPerson = useMemo(() => Object.entries(chores.filter((chore) => !chore.completed).reduce<Record<string, Chore[]>>((groups, chore) => { (groups[chore.assignee] ??= []).push(chore); return groups; }, {})), [chores]);
  const todayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  const dueChores = useMemo(() => chores.filter((chore) => !chore.completed && (chore.dueDay === todayName || chore.dueDay === "Any day")), [chores, todayName]);
  const shoppingToBuy = useMemo(() => shopping.filter((item) => !item.purchased), [shopping]);
  async function completeToday() { for (const chore of dueChores) await householdService.toggleChore(chore.id); setChores(await householdService.listChores()); setMessage(`${dueChores.length} chore${dueChores.length === 1 ? "" : "s"} completed for today.`); }
  async function dismissInsight(id: string) { const response = await fetch("/api/context/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dismiss", insightId: id }) }); if (!response.ok) { setMessage("Unable to dismiss this insight."); return; } await refresh(); setShowInsightWhy(false); }
  return <main><nav className="top-nav"><Link className="brand" href="/">Household Manager</Link><span><Link href="/">Location settings</Link><Link href="/household">Chores &amp; shopping</Link></span></nav><section className="today-hero"><p className="eyebrow">Today</p><h1>Good morning.</h1><p className="lede">A quick read on the household and the best time to get outside.</p></section>
    {forecast && condition ? <section className="today-weather"><div><p className="eyebrow">{forecast.locationLabel}</p><span className="today-temperature">{Math.round(forecast.temperature)}°</span><span className="today-condition">{condition.icon} {condition.label}</span></div><p>Feels like {Math.round(forecast.apparentTemperature)}°<br />High {Math.round(forecast.high)}° · Low {Math.round(forecast.low)}°</p></section> : <section className="today-empty"><strong>Weather needs a household location.</strong><Link href="/">Set household location</Link></section>}
    <section className="daily-grid"><article className="daily-card"><p className="eyebrow">Due today · {todayName}</p><h2>{dueChores.length ? `${dueChores.length} things to keep moving` : "The routine is clear."}</h2>{dueChores.length ? <><div className="brief-list">{dueChores.map((chore) => <div key={chore.id}><strong>{chore.title}</strong><span>{chore.assignee} · {chore.cadence}</span></div>)}</div><button onClick={() => void completeToday()}>Complete today’s chores</button></> : <p className="meta">No open chores are due today.</p>}</article><article className="daily-card"><p className="eyebrow">Shopping list</p><h2>{shoppingToBuy.length ? `${shoppingToBuy.length} item${shoppingToBuy.length === 1 ? "" : "s"} to pick up` : "Nothing needed right now."}</h2>{shoppingToBuy.length ? <div className="brief-list">{shoppingToBuy.slice(0, 5).map((item) => <div key={item.id}><strong>{item.title}</strong><span>{item.category}</span></div>)}</div> : <p className="meta">Add items from Chores &amp; shopping.</p>}<Link className="text-link" href="/household">Open household lists</Link></article><ReminderControl dueCount={dueChores.length} /></section>
    <section className="brief-grid"><article className="brief-card"><p className="eyebrow">Weather &amp; tasks</p><h2>Best windows</h2>{context?.tasks.items.length ? <div className="brief-list">{context.tasks.items.filter((task) => !task.completed).map((task) => <div key={task.id}><strong>{task.title}</strong><span>{task.recommendedWindow ? `Recommended ${formatHour(task.recommendedWindow.start)}–${formatHour(task.recommendedWindow.end)}` : task.reasons[0] ?? "No weather guidance needed"}</span></div>)}</div> : guidance.length ? <div className="brief-list">{guidance.map(({ task, recommendation }) => <div key={task.id}><strong>{task.title}</strong><span>{recommendation?.summary ?? "Loading weather guidance…"}</span></div>)}</div> : <p className="meta">No open tasks yet. Add one from Location settings.</p>}</article><article className="brief-card"><p className="eyebrow">Needs attention</p><h2>What matters now</h2>{context?.attention.length ? <div className="brief-list">{context.attention.slice(0, 4).map((item) => <div key={item.id}><strong>{item.title}</strong><span>{item.message}</span></div>)}</div> : <p className="meta">Nothing urgent right now.</p>}</article><article className="brief-card"><p className="eyebrow">Household insight</p><h2>{context?.insights[0]?.title ?? "The household is on track."}</h2><p className="meta">{context?.insights[0]?.message ?? "Weather and household records are being monitored for useful connections."}</p>{context?.insights[0]?.recommendedAction && <p className="good-window">{context.insights[0].recommendedAction}</p>}{context?.insights[0] && <><button type="button" className="text-button" aria-expanded={showInsightWhy} onClick={() => setShowInsightWhy((shown) => !shown)}>{showInsightWhy ? "Hide why" : "Why am I seeing this?"}</button><button type="button" className="text-button" onClick={() => void dismissInsight(context.insights[0].id)}>Dismiss</button>{showInsightWhy && <div className="insight-why"><strong>Why?</strong><ul>{context.insights[0].reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><small>Rules: {context.insights[0].triggeredRules.join(", ")}</small></div>}</>}</article><article className="brief-card"><p className="eyebrow">Chores by person</p><h2>Who owns what</h2>{choresByPerson.length ? <div className="brief-list">{choresByPerson.map(([person, openChores]) => <div key={person}><strong>{person}</strong><span>{openChores.map((chore) => `${chore.title}${chore.dueDay && chore.dueDay !== "Any day" ? ` · ${chore.dueDay}` : ""}`).join(", ")}</span></div>)}</div> : <p className="meta">No open recurring chores.</p>}</article></section><p className="notice" role="status">{message}</p></main>;
}
function formatHour(time: string): string { return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(new Date(time)); }

function ReminderControl({ dueCount }: { dueCount: number }) {
  const [time, setTime] = useState("09:00"); const [enabled, setEnabled] = useState(false); const [status, setStatus] = useState("A reminder works while this app is open.");
  useEffect(() => { const saved = window.localStorage.getItem("household-manager:reminder-time"); if (saved) { setTime(saved); setEnabled(true); setStatus(`Daily reminder set for ${saved}.`); } }, []);
  useEffect(() => { if (!enabled || typeof Notification === "undefined") return; const timer = window.setInterval(() => { const now = new Date(); const today = now.toDateString(); if (now.toTimeString().slice(0, 5) === time && window.localStorage.getItem("household-manager:reminder-last") !== today) { new Notification("Household Manager", { body: dueCount ? `${dueCount} chore${dueCount === 1 ? "" : "s"} due today.` : "Your household routine is clear for today." }); window.localStorage.setItem("household-manager:reminder-last", today); } }, 30_000); return () => window.clearInterval(timer); }, [enabled, time, dueCount]);
  async function enable() { if (typeof Notification === "undefined") { setStatus("Notifications are not supported in this browser."); return; } const permission = await Notification.requestPermission(); if (permission !== "granted") { setStatus("Notification permission was not granted."); return; } window.localStorage.setItem("household-manager:reminder-time", time); setEnabled(true); setStatus(`Daily reminder set for ${time}.`); }
  return <article className="daily-card reminder-card"><p className="eyebrow">Daily reminder</p><h2>A gentle nudge.</h2><label>Reminder time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><button type="button" className="secondary" onClick={() => void enable()}>{enabled ? "Update reminder" : "Enable reminder"}</button><p className="meta">{status}</p></article>;
}
