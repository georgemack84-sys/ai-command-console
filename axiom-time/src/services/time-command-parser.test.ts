import { describe, expect, it } from "vitest";
import { parseTimeCommand } from "./time-command-parser";

describe("parseTimeCommand", () => {
  it("creates typed intents without executing them", () => {
    expect(parseTimeCommand("Set an alarm for 7:30 PM")).toEqual({
      type: "CREATE_ALARM",
      time: "19:30",
      label: "Alarm",
    });
    expect(parseTimeCommand("start a 25 minute timer")).toEqual({
      type: "START_TIMER",
      minutes: 25,
      label: "Timer",
    });
    expect(parseTimeCommand("weather in Brooklyn")).toEqual({
      type: "SET_WEATHER_LOCATION",
      city: "Brooklyn",
    });
  });
});
