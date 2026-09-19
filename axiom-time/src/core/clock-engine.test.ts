import { describe, expect, it } from "vitest";
import { getTemporalState, isDaylightSavingTime } from "./clock-engine";

describe("getTemporalState", () => {
  it("creates a deterministic, timezone-aware snapshot", () => {
    const state = getTemporalState(
      new Date("2026-09-18T00:55:00.000Z"),
      "America/New_York",
    );

    expect(state.localTime).toBe("8:55 PM");
    expect(state.date).toBe("Thursday, September 17");
    expect(state.dayPeriod).toBe("DUSK");
    expect(state.isDST).toBe(true);
  });

  it("recognizes a standard-time instant", () => {
    expect(
      isDaylightSavingTime(
        new Date("2026-01-15T12:00:00.000Z"),
        "America/New_York",
      ),
    ).toBe(false);
  });
});
