import type { Alarm, Stopwatch, Timer } from "@/services/time-tools";

const persistenceVersion = 1;

interface PersistedValue<T> {
  version: number;
  value: T;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isText = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 160;

const isTimestamp = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isIntegerInRange = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= minimum &&
  value <= maximum;

const isAlarm = (value: unknown): value is Alarm =>
  isRecord(value) &&
  isText(value.id) &&
  isText(value.label) &&
  isIntegerInRange(value.hour, 0, 23) &&
  isIntegerInRange(value.minute, 0, 59) &&
  (value.recurrence === "once" || value.recurrence === "daily") &&
  typeof value.enabled === "boolean" &&
  isTimestamp(value.createdAt);

const isTimer = (value: unknown): value is Timer =>
  isRecord(value) &&
  isText(value.id) &&
  isText(value.label) &&
  isFiniteNonNegative(value.durationMs) &&
  value.durationMs > 0 &&
  isFiniteNonNegative(value.remainingMs) &&
  value.remainingMs <= value.durationMs &&
  (value.startedAt === null || isFiniteNonNegative(value.startedAt)) &&
  (value.status === "running" ||
    value.status === "paused" ||
    value.status === "complete") &&
  isTimestamp(value.createdAt);

const isStopwatch = (value: unknown): value is Stopwatch =>
  isRecord(value) &&
  (value.startedAt === null || isFiniteNonNegative(value.startedAt)) &&
  isFiniteNonNegative(value.elapsedMs) &&
  typeof value.running === "boolean";

export const validateAlarms = (value: unknown): value is Alarm[] =>
  Array.isArray(value) && value.every(isAlarm);

export const validateTimers = (value: unknown): value is Timer[] =>
  Array.isArray(value) && value.every(isTimer);

export const validateStopwatch = (value: unknown): value is Stopwatch =>
  isStopwatch(value);

export const loadPersisted = <T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && parsed.version === persistenceVersion) {
      return validate(parsed.value) ? parsed.value : fallback;
    }
    // Accept valid pre-versioned V1 records once; the next save writes the envelope.
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const savePersisted = (key: string, value: unknown) => {
  try {
    const record: PersistedValue<unknown> = {
      version: persistenceVersion,
      value,
    };
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Storage can be unavailable or full; core time tools remain usable in memory.
  }
};
