import { describe, expect, it } from "vitest";
import { billDueTomorrowRule, billOverdueRule, outdoorTaskWeatherRule } from "../lib/context/rules";
import { evaluateTaskWeather } from "../lib/tasks/weather-context-engine";
import { publishContextInvalidated, subscribeToContext } from "../lib/context/context-events";
import type { HouseholdContext } from "../lib/context/types";
import type { HouseholdTask } from "../lib/tasks/task-service";
import type { WeatherForecast } from "../lib/weather/weather-service";

const forecast: WeatherForecast = {
  locationLabel: "Home", source: "HOUSEHOLD", observedAt: "2026-09-07T08:00:00", temperature: 72, apparentTemperature: 72, high: 78, low: 58, weatherCode: 2, precipitationProbability: 0,
  hourly: [
    { time: "2026-09-07T09:00:00", temperature: 70, precipitationProbability: 0, windSpeed: 5, weatherCode: 2 },
    { time: "2026-09-07T10:00:00", temperature: 72, precipitationProbability: 0, windSpeed: 6, weatherCode: 2 },
    { time: "2026-09-07T11:00:00", temperature: 70, precipitationProbability: 90, windSpeed: 10, weatherCode: 61 }
  ]
};

function context(): HouseholdContext {
  return {
    householdId: "home", timestamp: "2026-09-07T08:00:00.000Z", household: { timezone: "America/New_York", location: { id: "home", householdId: "home", label: "Home", city: "Charlotte", state: "NC", postalCode: "", country: "US", latitude: 35, longitude: -80, timezone: "America/New_York", createdAt: "", updatedAt: "" } },
    time: { now: "2026-09-07T08:00:00.000Z", localDate: "2026-09-07", localTime: "04:00", dayOfWeek: "Monday", timezone: "America/New_York", partOfDay: "EARLY_MORNING" },
    weather: { current: { temperature: 72, apparentTemperature: 72, weatherCode: 2 }, today: { high: 78, low: 58, precipitationProbability: 0 }, precipitationWindows: [{ start: "2026-09-07T11:00:00", end: "2026-09-07T12:00:00", probability: 90 }], severeConditions: "RAIN", outdoorSuitability: "LIMITED", forecast },
    bills: { items: [] }, tasks: { items: [] }, attention: [], insights: []
  };
}

describe("context rules", () => {
  it("notifies live clients only while they remain subscribed", () => {
    let updates = 0;
    const unsubscribe = subscribeToContext(() => { updates += 1; });
    publishContextInvalidated();
    unsubscribe();
    publishContextInvalidated();
    expect(updates).toBe(1);
  });

  it("flags an unpaid bill due tomorrow as high attention", () => {
    const snapshot = context(); snapshot.bills.items.push({ id: "electric", name: "Electric", amount: 186.42, dueDate: "2026-09-08", status: "UNPAID", attention: "NEEDS_ATTENTION", reasons: ["Unpaid", "Due within 24 hours"] });
    const [insight] = billDueTomorrowRule.evaluate(snapshot);
    expect(insight).toMatchObject({ type: "BILL_DUE_SOON", severity: "HIGH", relatedEntities: ["bill:electric"], triggeredRules: ["CTX-BILL-001"] });
  });

  it("escalates an overdue unpaid bill to urgent", () => {
    const snapshot = context(); snapshot.bills.items.push({ id: "water", name: "Water", amount: 55, dueDate: "2026-09-06", status: "UNPAID", attention: "URGENT", reasons: ["Unpaid", "Past due date"] });
    const [insight] = billOverdueRule.evaluate(snapshot);
    expect(insight).toMatchObject({ type: "BILL_OVERDUE", severity: "URGENT", relatedEntities: ["bill:water"] });
  });

  it("recommends the dry weather window for a weather-conflicted outdoor task", () => {
    const task: HouseholdTask = { id: "mow", title: "Mow lawn", environment: "OUTDOOR", weatherSensitive: true, minimumTemperatureF: 45, maximumWindMph: 20, completed: false, dueDate: "2026-09-07", priority: "HIGH" };
    const recommendation = evaluateTaskWeather(task, forecast);
    expect(recommendation).toMatchObject({ status: "GOOD_WINDOW", window: { start: "2026-09-07T09:00:00", end: "2026-09-07T10:00:00" } });
    const snapshot = context(); snapshot.tasks.items.push({ ...task, dueLabel: "TODAY", contextPriority: "NEEDS_ATTENTION", weatherConflict: true, recommendedWindow: recommendation.window, reasons: ["Due today", "Outdoor task", "Rain expected later"] });
    const [insight] = outdoorTaskWeatherRule.evaluate(snapshot);
    expect(insight).toMatchObject({ type: "WEATHER_TASK_WINDOW", severity: "MEDIUM", relatedEntities: ["task:mow"], triggeredRules: ["CTX-WEATHER-001", "CTX-CROSS-001"] });
  });
});
