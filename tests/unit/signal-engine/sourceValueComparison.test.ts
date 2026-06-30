import { describe, expect, it } from "vitest";
import { parseSourceMarketValueSnapshots } from "@/services/signal-engine";

describe("sourceValueComparison", () => {
  it("parses source market value snapshots deterministically", () => {
    expect(parseSourceMarketValueSnapshots([
      {
        snapshot_id: "b",
        market_id: "market-1",
        source_id: "source-b",
        market_type: "SPREAD",
        value: -4.5,
        timestamp: "2026-06-05T13:00:10.000Z",
        verification_status: "VERIFIED",
        freshness_status: "CURRENT",
        schema_version: "1.2.0",
      },
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
    ])?.map((snapshot) => snapshot.source_id)).toEqual(["source-a", "source-b"]);
  });
});
