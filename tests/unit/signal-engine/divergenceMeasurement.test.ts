import { describe, expect, it } from "vitest";
import { measureDivergence } from "@/services/signal-engine";

describe("divergenceMeasurement", () => {
  it("calculates highest, lowest, divergence size, and state correctly", () => {
    const result = measureDivergence(
      [
        {
          snapshot_id: "a",
          market_id: "market-1",
          source_id: "source-a",
          market_type: "SPREAD",
          value: -5.5,
          timestamp: "2026-06-05T13:00:00.000Z",
          verification_status: "VERIFIED",
          freshness_status: "CURRENT",
          schema_version: "1.2.0",
        },
        {
          snapshot_id: "b",
          market_id: "market-1",
          source_id: "source-b",
          market_type: "SPREAD",
          value: -4.5,
          timestamp: "2026-06-05T13:00:00.000Z",
          verification_status: "VERIFIED",
          freshness_status: "CURRENT",
          schema_version: "1.2.0",
        },
      ],
      {
        minimum_source_count: 2,
        spread_divergence_threshold: 1,
        total_divergence_threshold: 1,
        moneyline_divergence_threshold: 20,
        maximum_snapshot_age_seconds: 600,
        severe_divergence_multiplier: 2,
      },
    );

    expect(result).toEqual({
      highestValue: -4.5,
      lowestValue: -5.5,
      divergenceSize: 1,
      divergenceState: "MEANINGFUL",
    });
  });
});
