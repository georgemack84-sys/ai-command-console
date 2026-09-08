import type { TimeContext } from "./types";

export function buildTimeContext(timezone: string, now = new Date()): TimeContext {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "long", hourCycle: "h23" }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(read("hour"));
  const partOfDay = hour < 6 ? "EARLY_MORNING" : hour < 12 ? "MORNING" : hour < 17 ? "AFTERNOON" : hour < 21 ? "EVENING" : "NIGHT";
  return { now: now.toISOString(), localDate: `${read("year")}-${read("month")}-${read("day")}`, localTime: `${read("hour")}:${read("minute")}`, dayOfWeek: read("weekday"), timezone, partOfDay };
}
