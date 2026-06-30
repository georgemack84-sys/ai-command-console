import { describe, expect, it } from "vitest";
import { calculateMovementFrequency } from "@/services/signal-engine";

describe("movementFrequency", () => {
  it("calculates movement frequency deterministically", () => {
    expect(calculateMovementFrequency(3, 300)).toEqual({
      movement_count: 3,
      duration_seconds: 300,
      movements_per_minute: 0.6,
      average_seconds_between_movements: 150,
      acceleration_detected: false,
    });
  });
});
