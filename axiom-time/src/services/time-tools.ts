export type AlarmRecurrence = "once" | "daily";

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  recurrence: AlarmRecurrence;
  enabled: boolean;
  createdAt: string;
}

export interface Timer {
  id: string;
  label: string;
  durationMs: number;
  startedAt: number | null;
  remainingMs: number;
  status: "running" | "paused" | "complete";
  createdAt: string;
}

export interface Stopwatch {
  startedAt: number | null;
  elapsedMs: number;
  running: boolean;
}

export interface HorizonEvent {
  id: string;
  label: string;
  occursAt: number;
  kind: "alarm" | "timer";
}

export const nextAlarmOccurrence = (alarm: Alarm, now = new Date()): Date => {
  const occurrence = new Date(now);
  occurrence.setHours(alarm.hour, alarm.minute, 0, 0);
  if (occurrence.getTime() <= now.getTime())
    occurrence.setDate(occurrence.getDate() + 1);
  return occurrence;
};

export const remainingTimerMs = (timer: Timer, now = Date.now()): number =>
  timer.status === "running" && timer.startedAt !== null
    ? Math.max(0, timer.remainingMs - (now - timer.startedAt))
    : timer.remainingMs;

export const advanceTimers = (timers: Timer[], now = Date.now()): Timer[] =>
  timers.map((timer) => {
    const remainingMs = remainingTimerMs(timer, now);
    return remainingMs === 0 && timer.status === "running"
      ? { ...timer, remainingMs: 0, startedAt: null, status: "complete" }
      : timer;
  });

export const horizonEvents = (
  alarms: Alarm[],
  timers: Timer[],
  now = Date.now(),
): HorizonEvent[] =>
  [
    ...alarms
      .filter((alarm) => alarm.enabled)
      .map((alarm) => ({
        id: alarm.id,
        label: alarm.label || "Alarm",
        occursAt: nextAlarmOccurrence(alarm, new Date(now)).getTime(),
        kind: "alarm" as const,
      })),
    ...timers
      .filter(
        (timer) => timer.status === "running" || timer.status === "paused",
      )
      .map((timer) => ({
        id: timer.id,
        label: timer.label || "Timer",
        occursAt: now + remainingTimerMs(timer, now),
        kind: "timer" as const,
      })),
  ].sort((left, right) => left.occursAt - right.occursAt);

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
};
