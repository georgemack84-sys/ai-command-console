import { describe, expect, it } from "vitest";
import { getConsensusAgeSeconds, parsePublicConsensusSnapshot } from "@/services/signal-engine";

describe("publicConsensus", () => {
  it("parses a valid public consensus snapshot", () => {
    expect(parsePublicConsensusSnapshot({
      consensus_id: "consensus-1",
      market_id: "market-1",
      public_side: "Team A",
      public_percentage: 68,
      opposing_side: "Team B",
      opposing_percentage: 32,
      consensus_type: "BET_PERCENTAGE",
      source_id: "consensus-source",
      captured_at: "2026-06-05T12:55:00.000Z",
      verification_status: "VERIFIED",
      schema_version: "1.2.0",
    })).toMatchObject({
      public_side: "Team A",
      public_percentage: 68,
    });
  });

  it("calculates consensus age deterministically", () => {
    const snapshot = parsePublicConsensusSnapshot({
      consensus_id: "consensus-1",
      market_id: "market-1",
      public_side: "Team A",
      public_percentage: 68,
      opposing_side: "Team B",
      opposing_percentage: 32,
      consensus_type: "BET_PERCENTAGE",
      source_id: "consensus-source",
      captured_at: "2026-06-05T12:55:00.000Z",
      verification_status: "VERIFIED",
      schema_version: "1.2.0",
    });
    if (!snapshot) throw new Error("expected snapshot");
    expect(getConsensusAgeSeconds(snapshot, "2026-06-05T13:00:00.000Z")).toBe(300);
  });
});
