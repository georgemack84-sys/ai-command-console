import { describe, expect, it } from "vitest";
import {
  advanceTimers,
  horizonEvents,
  nextAlarmOccurrence,
} from "./time-tools";

describe("time tools", () => {
  it("moves passed alarms to their next daily occurrence", () => {
    const occurrence = nextAlarmOccurrence(
      {
        id: "alarm",
        label: "Wake",
        hour: 8,
        minute: 0,
        recurrence: "daily",
        enabled: true,
        createdAt: "",
      },
      new Date("2026-09-18T12:00:00"),
    );
    expect(occurrence.getDate()).toBe(19);
    expect(occurrence.getHours()).toBe(8);
  });

  it("completes expired timers and orders upcoming events", () => {
    const now = 1_000_000;
    const timers = advanceTimers(
      [
        {
          id: "complete",
          label: "Tea",
          durationMs: 1_000,
          remainingMs: 100,
          startedAt: now - 200,
          status: "running",
          createdAt: "",
        },
        {
          id: "active",
          label: "Focus",
          durationMs: 1_000,
          remainingMs: 500,
          startedAt: now,
          status: "running",
          createdAt: "",
        },
      ],
      now,
    );
    expect(timers[0].status).toBe("complete");
    expect(horizonEvents([], timers, now).map((event) => event.label)).toEqual([
      "Focus",
    ]);
  });
});
