export type DayPeriod =
  "DEEP_NIGHT" | "DAWN" | "MORNING" | "DAY" | "GOLDEN_HOUR" | "DUSK" | "NIGHT";

export interface TemporalState {
  timestamp: string;
  timezone: string;
  localTime: string;
  date: string;
  dayPeriod: DayPeriod;
  isDST: boolean;
}
