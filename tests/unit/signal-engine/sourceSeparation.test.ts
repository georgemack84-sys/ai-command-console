import { describe, expect, it } from "vitest";
import { detectSourceSeparation } from "@/services/signal-engine";

describe("sourceSeparation", () => {
  it("detects one-source separation when one source moves and others remain still", () => {
    const result = detectSourceSeparation([
      {
        snapshot_id: "a1",
        market_id: "market-1",
        source_id: "source-a",
        market_type: "SPREAD",
        value: -4.5,
        timestamp: "2026-06-05T12:58:00.000Z",
        verification_status: "VERIFIED",
        freshness_status: "CURRENT",
        schema_version: "1.2.0",
      },
      {
        snapshot_id: "a2",
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
        snapshot_id: "b1",
        market_id: "market-1",
        source_id: "source-b",
        market_type: "SPREAD",
        value: -4.5,
        timestamp: "2026-06-05T13:00:00.000Z",
        verification_status: "VERIFIED",
        freshness_status: "CURRENT",
        schema_version: "1.2.0",
      },
      {
        snapshot_id: "c1",
        market_id: "market-1",
        source_id: "source-c",
        market_type: "SPREAD",
        value: -4.5,
        timestamp: "2026-06-05T13:00:00.000Z",
        verification_status: "VERIFIED",
        freshness_status: "CURRENT",
        schema_version: "1.2.0",
      },
    ]);

    expect(result).toMatchObject({
      moving_source_id: "source-a",
      stationary_source_ids: ["source-b", "source-c"],
      separation_size: 1,
    });
  });
});
