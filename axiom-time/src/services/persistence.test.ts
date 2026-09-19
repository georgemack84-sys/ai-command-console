import { beforeEach, describe, expect, it } from "vitest";
import {
  loadPersisted,
  savePersisted,
  validateAlarms,
  validateTimers,
} from "./persistence";

const alarm = {
  id: "alarm-1",
  label: "Wake",
  hour: 7,
  minute: 30,
  recurrence: "daily" as const,
  enabled: true,
  createdAt: "2026-09-18T10:00:00.000Z",
};

describe("persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("envelopes and restores validated state", () => {
    savePersisted("alarms", [alarm]);
    expect(JSON.parse(window.localStorage.getItem("alarms") ?? "{}")).toEqual({
      version: 1,
      value: [alarm],
    });
    expect(loadPersisted("alarms", [], validateAlarms)).toEqual([alarm]);
  });

  it("recovers from malformed or invalid saved data", () => {
    window.localStorage.setItem("alarms", "not-json");
    expect(loadPersisted("alarms", [], validateAlarms)).toEqual([]);
    window.localStorage.setItem(
      "alarms",
      JSON.stringify({ version: 1, value: [{ ...alarm, hour: 42 }] }),
    );
    expect(loadPersisted("alarms", [], validateAlarms)).toEqual([]);
  });

  it("recognizes only internally consistent timers", () => {
    expect(
      validateTimers([
        {
          id: "timer-1",
          label: "Focus",
          durationMs: 60_000,
          remainingMs: 90_000,
          startedAt: null,
          status: "paused",
          createdAt: "2026-09-18T10:00:00.000Z",
        },
      ]),
    ).toBe(false);
  });
});
