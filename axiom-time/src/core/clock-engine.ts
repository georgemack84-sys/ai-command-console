import type { DayPeriod, TemporalState } from "./temporal-state";

const dayPeriodForHour = (hour: number): DayPeriod => {
  if (hour < 5) return "DEEP_NIGHT";
  if (hour < 7) return "DAWN";
  if (hour < 12) return "MORNING";
  if (hour < 17) return "DAY";
  if (hour < 19) return "GOLDEN_HOUR";
  if (hour < 21) return "DUSK";
  return "NIGHT";
};

const offsetFor = (date: Date, timezone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value ?? "GMT";

const offsetMinutesFor = (date: Date, timezone: string): number => {
  const offset = offsetFor(date, timezone);
  const match = /^GMT(?:(?<sign>[+-])(?<hours>\d{2}):(?<minutes>\d{2}))?$/.exec(
    offset,
  );
  if (!match?.groups?.sign) return 0;

  const minutes =
    Number(match.groups.hours) * 60 + Number(match.groups.minutes);
  return match.groups.sign === "+" ? minutes : -minutes;
};

export const isDaylightSavingTime = (date: Date, timezone: string): boolean => {
  const year = date.getUTCFullYear();
  const januaryOffset = offsetMinutesFor(
    new Date(Date.UTC(year, 0, 1)),
    timezone,
  );
  const julyOffset = offsetMinutesFor(new Date(Date.UTC(year, 6, 1)), timezone);
  const standardOffset = Math.min(januaryOffset, julyOffset);
  return offsetMinutesFor(date, timezone) !== standardOffset;
};

export const getTemporalState = (
  now: Date = new Date(),
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale = "en-US",
): TemporalState => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const period =
    parts.find((part) => part.type === "dayPeriod")?.value === "PM" ? 12 : 0;

  return {
    timestamp: now.toISOString(),
    timezone,
    localTime: new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h12",
    }).format(now),
    date: new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now),
    dayPeriod: dayPeriodForHour((hour % 12) + period),
    isDST: isDaylightSavingTime(now, timezone),
  };
};

export class MonotonicTimer {
  private readonly startedAt = performance.now();

  elapsedMilliseconds(): number {
    return performance.now() - this.startedAt;
  }
}
