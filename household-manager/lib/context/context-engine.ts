import "server-only";
import { selfHostedDb } from "../self-hosted/household-db";
import { getWeatherForecast } from "../weather/weather-server";
import { createServerSupabaseClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/env";
import { evaluateTaskWeather } from "../tasks/weather-context-engine";
import { buildTimeContext } from "./time-context";
import { buildWeatherContext } from "./weather-context";
import { contextRules } from "./rules";
import type { AttentionItem, AttentionLevel, ContextBill, ContextTask, HouseholdContext } from "./types";

const cached = new Map<string, { expiresAt: number; context: HouseholdContext }>();
const scoreFor = (level: AttentionLevel) => ({ BACKGROUND: 10, UPCOMING: 30, RELEVANT: 50, NEEDS_ATTENTION: 70, URGENT: 90 })[level];
const dateOnly = (date: string) => date.slice(0, 10);

export function invalidateHouseholdContext() { cached.clear(); }

export async function buildHouseholdContext(): Promise<HouseholdContext> {
  if (process.env.NEXT_PUBLIC_HOUSEHOLD_STORAGE === "supabase" && isSupabaseConfigured()) return buildSupabaseHouseholdContext();
  return buildSelfHostedHouseholdContext();
}

async function buildSelfHostedHouseholdContext(): Promise<HouseholdContext> {
  const existing = cached.get("self-hosted-household"); if (existing && existing.expiresAt > Date.now()) return existing.context;
  const location = selfHostedDb.getLocation();
  if (!location) throw new Error("Set a household location before viewing household context.");
  const household = { id: "home", householdId: "self-hosted-household", label: location.label, city: location.city, state: location.state, postalCode: location.postal_code, country: location.country, latitude: location.latitude, longitude: location.longitude, timezone: location.timezone, createdAt: location.created_at, updatedAt: location.updated_at };
  const time = buildTimeContext(household.timezone);
  const forecast = await getWeatherForecast({ latitude: household.latitude, longitude: household.longitude, timezone: household.timezone, label: household.label, source: "HOUSEHOLD" });
  const weather = buildWeatherContext(forecast);
  const tasks: ContextTask[] = selfHostedDb.listTasks().map((task) => {
    const base = { id: task.id, title: task.title, environment: "OUTDOOR" as const, weatherSensitive: true, minimumTemperatureF: 45, maximumWindMph: 20, completed: Boolean(task.completed), dueDate: task.due_date, priority: task.priority };
    const recommendation = evaluateTaskWeather(base, forecast);
    const weatherConflict = !base.completed && (recommendation.status === "UNSUITABLE" || (recommendation.status === "GOOD_WINDOW" && weather.precipitationWindows.length > 0));
    const overdue = Boolean(base.dueDate && base.dueDate < time.localDate); const dueToday = base.dueDate === time.localDate;
    const contextPriority: AttentionLevel = overdue && base.priority === "HIGH" ? "URGENT" : overdue || dueToday || weatherConflict ? "NEEDS_ATTENTION" : base.priority === "HIGH" ? "RELEVANT" : "BACKGROUND";
    const reasons = [overdue ? "Overdue" : dueToday ? "Due today" : "", base.priority === "HIGH" ? "High priority" : "", weatherConflict ? "Rain or unsafe conditions are forecast" : ""].filter(Boolean);
    return { ...base, dueLabel: dueToday ? "TODAY" : base.dueDate ? "UPCOMING" : "NONE", contextPriority, weatherConflict, recommendedWindow: recommendation.window, reasons };
  });
  const choreTasks: ContextTask[] = selfHostedDb.listChores().filter((chore) => !chore.completed && (chore.due_day === time.dayOfWeek || chore.due_day === "Any day")).map((chore) => ({ id: `chore:${chore.id}`, title: chore.title, environment: "INDOOR", weatherSensitive: false, minimumTemperatureF: 0, maximumWindMph: 0, completed: false, dueDate: time.localDate, priority: "MEDIUM", dueLabel: "TODAY", contextPriority: "NEEDS_ATTENTION", weatherConflict: false, reasons: ["Recurring chore due today", `Assigned to ${chore.assignee_name}`] }));
  tasks.push(...choreTasks);
  const bills: ContextBill[] = selfHostedDb.listBills().map((bill) => {
    const due = dateOnly(bill.due_date); const overdue = due < time.localDate; const tomorrow = new Date(`${time.localDate}T12:00:00Z`); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const dueTomorrow = due === tomorrow.toISOString().slice(0, 10);
    const attention: AttentionLevel = bill.status === "PAID" ? "BACKGROUND" : overdue ? "URGENT" : due === time.localDate || dueTomorrow ? "NEEDS_ATTENTION" : "UPCOMING";
    const reasons = bill.status === "PAID" ? ["Paid"] : overdue ? ["Unpaid", "Past due date"] : due === time.localDate ? ["Unpaid", "Due today"] : dueTomorrow ? ["Unpaid", "Due within 24 hours"] : ["Upcoming payment"];
    return { id: bill.id, name: bill.name, amount: bill.amount, dueDate: bill.due_date, status: bill.status, attention, reasons };
  });
  const provisional = { householdId: household.householdId, timestamp: time.now, household: { timezone: household.timezone, location: household }, time, weather, bills: { items: bills }, tasks: { items: tasks }, attention: [], insights: [] } satisfies HouseholdContext;
  const generatedInsights = contextRules.flatMap((rule) => rule.evaluate(provisional));
  generatedInsights.forEach((insight) => selfHostedDb.recordInsightGenerated(insight));
  const dismissed = new Set(selfHostedDb.listDismissedInsightIds().map((entry) => entry.insight_id));
  const insights = generatedInsights.filter((insight) => !dismissed.has(insight.id));
  const attention: AttentionItem[] = [...bills.filter((bill) => bill.attention !== "BACKGROUND").map((bill) => ({ id: `bill:${bill.id}`, level: bill.attention, title: bill.name, message: bill.reasons.join(" · "), relatedEntities: [`bill:${bill.id}`], score: scoreFor(bill.attention) })), ...tasks.filter((task) => task.contextPriority !== "BACKGROUND").map((task) => ({ id: `task:${task.id}`, level: task.contextPriority, title: task.title, message: task.reasons.join(" · "), relatedEntities: [`task:${task.id}`], score: scoreFor(task.contextPriority) }))].sort((a, b) => b.score - a.score);
  const context = { ...provisional, attention, insights };
  cached.set("self-hosted-household", { context, expiresAt: Date.now() + 60_000 });
  return context;
}

async function buildSupabaseHouseholdContext(): Promise<HouseholdContext> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to view household context.");
  const { data: membership, error: membershipError } = await supabase.from("household_members").select("household_id").eq("user_id", user.id).maybeSingle();
  if (membershipError || !membership) throw new Error("No household is associated with this account yet.");
  const householdId = membership.household_id as string; const existing = cached.get(householdId); if (existing && existing.expiresAt > Date.now()) return existing.context;
  const [{ data: location }, { data: taskRows }, { data: choreRows }, { data: billRows }, { data: historyRows }] = await Promise.all([
    supabase.from("household_locations").select("*").eq("household_id", householdId).maybeSingle(), supabase.from("tasks").select("*").eq("household_id", householdId), supabase.from("chores").select("*").eq("household_id", householdId), supabase.from("bills").select("*").eq("household_id", householdId), supabase.from("context_insight_history").select("insight_id,event_type").eq("household_id", householdId)
  ]);
  if (!location) throw new Error("Set a household location before viewing household context.");
  const household = { id: location.id as string, householdId, label: location.label as string, city: location.city as string, state: location.state as string, postalCode: (location.postal_code as string | null) ?? "", country: location.country as string, latitude: Number(location.latitude), longitude: Number(location.longitude), timezone: location.timezone as string, createdAt: location.created_at as string, updatedAt: location.updated_at as string };
  const time = buildTimeContext(household.timezone); const forecast = await getWeatherForecast({ latitude: household.latitude, longitude: household.longitude, timezone: household.timezone, label: household.label, source: "HOUSEHOLD" }); const weather = buildWeatherContext(forecast);
  const tasks: ContextTask[] = (taskRows ?? []).map((row) => { const base = { id: row.id as string, title: row.title as string, environment: row.environment as "INDOOR" | "OUTDOOR" | "EITHER", weatherSensitive: Boolean(row.weather_sensitive), minimumTemperatureF: Number(row.minimum_temperature_f ?? 45), maximumWindMph: Number(row.maximum_wind_mph ?? 20), completed: Boolean(row.completed_at), dueDate: row.due_date as string | null, priority: (row.priority as "LOW" | "MEDIUM" | "HIGH") ?? "MEDIUM" }; const recommendation = evaluateTaskWeather(base, forecast); const overdue = Boolean(base.dueDate && base.dueDate < time.localDate); const dueToday = base.dueDate === time.localDate; const weatherConflict = !base.completed && (recommendation.status === "UNSUITABLE" || (recommendation.status === "GOOD_WINDOW" && weather.precipitationWindows.length > 0)); const contextPriority: AttentionLevel = overdue && base.priority === "HIGH" ? "URGENT" : overdue || dueToday || weatherConflict ? "NEEDS_ATTENTION" : base.priority === "HIGH" ? "RELEVANT" : "BACKGROUND"; return { ...base, dueLabel: dueToday ? "TODAY" : base.dueDate ? "UPCOMING" : "NONE", contextPriority, weatherConflict, recommendedWindow: recommendation.window, reasons: [overdue ? "Overdue" : dueToday ? "Due today" : "", base.priority === "HIGH" ? "High priority" : "", weatherConflict ? "Rain or unsafe conditions are forecast" : ""].filter(Boolean) }; });
  tasks.push(...(choreRows ?? []).filter((row) => !row.completed_at && ((row.due_day as string) === time.dayOfWeek || (row.due_day as string) === "Any day")).map((row) => ({ id: `chore:${row.id as string}`, title: row.title as string, environment: "INDOOR" as const, weatherSensitive: false, minimumTemperatureF: 0, maximumWindMph: 0, completed: false, dueDate: time.localDate, priority: "MEDIUM" as const, dueLabel: "TODAY" as const, contextPriority: "NEEDS_ATTENTION" as const, weatherConflict: false, reasons: ["Recurring chore due today", `Assigned to ${row.assignee_name as string}`] })));
  const bills: ContextBill[] = (billRows ?? []).map((row) => { const due = row.due_date as string; const overdue = due < time.localDate; const tomorrow = new Date(`${time.localDate}T12:00:00Z`); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); const dueTomorrow = due === tomorrow.toISOString().slice(0, 10); const status = row.status as "UNPAID" | "PAID"; const attention: AttentionLevel = status === "PAID" ? "BACKGROUND" : overdue ? "URGENT" : due === time.localDate || dueTomorrow ? "NEEDS_ATTENTION" : "UPCOMING"; return { id: row.id as string, name: row.name as string, amount: Number(row.amount), dueDate: due, status, attention, reasons: status === "PAID" ? ["Paid"] : overdue ? ["Unpaid", "Past due date"] : due === time.localDate ? ["Unpaid", "Due today"] : dueTomorrow ? ["Unpaid", "Due within 24 hours"] : ["Upcoming payment"] }; });
  const provisional = { householdId, timestamp: time.now, household: { timezone: household.timezone, location: household }, time, weather, bills: { items: bills }, tasks: { items: tasks }, attention: [], insights: [] } satisfies HouseholdContext; const generatedInsights = contextRules.flatMap((rule) => rule.evaluate(provisional)); const knownGenerated = new Set((historyRows ?? []).filter((row) => row.event_type === "GENERATED").map((row) => row.insight_id as string)); const newInsights = generatedInsights.filter((insight) => !knownGenerated.has(insight.id)); if (newInsights.length) await supabase.from("context_insight_history").insert(newInsights.map((insight) => ({ household_id: householdId, insight_id: insight.id, event_type: "GENERATED", title: insight.title, message: insight.message, related_entities: insight.relatedEntities }))); const dismissed = new Set((historyRows ?? []).filter((row) => row.event_type === "DISMISSED").map((row) => row.insight_id as string)); const insights = generatedInsights.filter((insight) => !dismissed.has(insight.id)); const attention: AttentionItem[] = [...bills.filter((bill) => bill.attention !== "BACKGROUND").map((bill) => ({ id: `bill:${bill.id}`, level: bill.attention, title: bill.name, message: bill.reasons.join(" · "), relatedEntities: [`bill:${bill.id}`], score: scoreFor(bill.attention) })), ...tasks.filter((task) => task.contextPriority !== "BACKGROUND").map((task) => ({ id: `task:${task.id}`, level: task.contextPriority, title: task.title, message: task.reasons.join(" · "), relatedEntities: [`task:${task.id}`], score: scoreFor(task.contextPriority) }))].sort((a, b) => b.score - a.score); const context = { ...provisional, attention, insights }; cached.set(householdId, { context, expiresAt: Date.now() + 60_000 }); return context;
}
