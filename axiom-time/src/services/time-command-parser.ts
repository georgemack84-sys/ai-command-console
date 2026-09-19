import type { TimeIntent } from "@/contracts/time-intents";

const parseClockTime = (input: string): string | null => {
  const match = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(input);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (minute > 59 || hour > 23) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (match[3].toLowerCase() === "pm" ? 12 : 0);
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const parseTimeCommand = (command: string): TimeIntent | null => {
  const normalized = command.trim().toLowerCase();
  const alarm = /(?:set\s+)?(?:an?\s+)?alarm\s+(?:for\s+)?(.+)/i.exec(command);
  if (alarm) {
    const time = parseClockTime(alarm[1]);
    return time ? { type: "CREATE_ALARM", time, label: "Alarm" } : null;
  }

  const timer =
    /(?:start\s+)?(?:an?\s+)?(\d+)\s*(minute|minutes|min)\s+timer/i.exec(
      normalized,
    );
  if (timer)
    return { type: "START_TIMER", minutes: Number(timer[1]), label: "Timer" };

  const location =
    /(?:weather\s+(?:in|for)|set\s+(?:weather\s+)?location\s+to)\s+(.+)/i.exec(
      command,
    );
  if (location)
    return { type: "SET_WEATHER_LOCATION", city: location[1].trim() };

  return null;
};
