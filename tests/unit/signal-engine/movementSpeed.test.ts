import { describe, expect, it } from "vitest";
import { measureMovementSpeed } from "@/services/signal-engine";

describe("movementSpeed", () => {
  it("measures movement speed deterministically", () => {
    expect(measureMovementSpeed(1.5, 300, { fast_movement_per_minute: 0.2 })).toEqual({
      total_movement_size: 1.5,
      duration_seconds: 300,
      movement_per_minute: 0.3,
      speed_state: "FAST",
    });
  });

  it("classifies spike movement in highly compressed windows", () => {
    expect(measureMovementSpeed(2.2, 45, { fast_movement_per_minute: 0.2 }).speed_state).toBe("SPIKE");
  });
});
