import type { DayPeriod } from "./temporal-state";

export type TimeMutation =
  "DAWN" | "MORNING" | "DAY" | "GOLDEN_HOUR" | "DUSK" | "NIGHT" | "DEEP_NIGHT";

export const mutationForDayPeriod = (dayPeriod: DayPeriod): TimeMutation =>
  dayPeriod;

export const sceneClassForMutation = (mutation: TimeMutation): string =>
  `scene--${mutation.toLowerCase().replace("_", "-")}`;
