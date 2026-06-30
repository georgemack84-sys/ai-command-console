import { describe, expect, it } from "vitest";
import { countDirectionChanges } from "@/services/signal-engine";

describe("directionChange", () => {
  it("counts direction changes correctly", () => {
    expect(countDirectionChanges(["UP", "DOWN", "UP"])).toEqual({
      direction_changes: 2,
      direction_sequence: ["UP", "DOWN", "UP"],
      back_and_forth_detected: true,
    });
  });
});
