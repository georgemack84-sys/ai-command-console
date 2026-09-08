import type { HouseholdLocation } from "../location/types";
import type { HouseholdTask } from "../tasks/task-service";
import type { WeatherForecast } from "../weather/weather-service";

export type AttentionLevel = "BACKGROUND" | "UPCOMING" | "RELEVANT" | "NEEDS_ATTENTION" | "URGENT";
export type InsightSeverity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TimeContext = { now: string; localDate: string; localTime: string; dayOfWeek: string; timezone: string; partOfDay: "EARLY_MORNING" | "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" };
export type WeatherContext = { current: Pick<WeatherForecast, "temperature" | "apparentTemperature" | "weatherCode">; today: Pick<WeatherForecast, "high" | "low" | "precipitationProbability">; precipitationWindows: { start: string; end: string; probability: number }[]; severeConditions: "NONE" | "RAIN" | "STORM"; outdoorSuitability: "GOOD" | "LIMITED" | "POOR"; forecast: WeatherForecast };
export type ContextTask = HouseholdTask & { dueLabel: "TODAY" | "UPCOMING" | "NONE"; contextPriority: AttentionLevel; weatherConflict: boolean; recommendedWindow?: { start: string; end: string }; reasons: string[] };
export type ContextBill = { id: string; name: string; amount: number; dueDate: string; status: "UNPAID" | "PAID"; attention: AttentionLevel; reasons: string[] };
export type AttentionItem = { id: string; level: AttentionLevel; title: string; message: string; relatedEntities: string[]; score: number };
export type ContextInsight = { id: string; type: string; severity: InsightSeverity; title: string; message: string; reasons: string[]; relatedEntities: string[]; recommendedAction?: string; expiresAt: string; triggeredRules: string[] };

export type HouseholdContext = {
  householdId: string; timestamp: string; household: { timezone: string; location: HouseholdLocation };
  time: TimeContext; weather: WeatherContext; bills: { items: ContextBill[] }; tasks: { items: ContextTask[] };
  attention: AttentionItem[]; insights: ContextInsight[];
};
