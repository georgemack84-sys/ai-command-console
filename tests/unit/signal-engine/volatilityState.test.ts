import { describe, expect, it } from "vitest";
import { classifyVolatilityState } from "@/services/signal-engine";

describe("volatilityState", () => {
  it("classifies volatility state correctly", () => {
    expect(classifyVolatilityState(4, 1.5, 2, 0.8, true, {
      minimum_movement_count: 3,
      minimum_largest_change: 1,
      maximum_time_window_seconds: 600,
      minimum_direction_changes: 1,
      minimum_movements_per_minute: 0.3,
      severe_spike_multiplier: 2,
    })).toBe("SEVERE_SPIKE");
  });
});
