import { describe, expect, it } from "vitest";
import {
  createSignalEngine,
  evaluateConsensusDivergenceSignal,
  type VerifiedMovementEvent,
} from "@/services/signal-engine";

function divergenceEvent(overrides: Partial<VerifiedMovementEvent> = {}): VerifiedMovementEvent {
  return {
    event_id: "divergence-event-1",
    event_type: "spread_movement_event",
    market_id: "market-1",
    source_ids: ["source-a", "source-b"],
    timestamp: "2026-06-05T13:00:00.000Z",
    verification_status: "VERIFIED",
    validation_record_id: "validation-1",
    schema_version: "1.2.0",
    evidence: {
      observations_used: ["obs-1", "obs-2"],
      movement_events_used: ["move-1"],
      evidence_summary: "Verified source value snapshots are present.",
      required_evidence_present: true,
    },
    payload: {
      source_value_snapshots: [
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
    },
    ...overrides,
  };
}

describe("consensusDivergenceSignal", () => {
  it("creates divergence when spreads differ beyond threshold", () => {
    expect(evaluateConsensusDivergenceSignal(divergenceEvent())).toMatchObject({
      status: "SIGNAL",
      evidence: {
        market_type: "SPREAD",
        highest_value: -4.5,
        lowest_value: -5.5,
        divergence_size: 1,
        divergence_state: "MEANINGFUL",
      },
    });
  });

  it("creates divergence when totals differ beyond threshold", () => {
    expect(evaluateConsensusDivergenceSignal(divergenceEvent({
      event_type: "totals_movement_event",
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "TOTAL",
            value: 223,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
          {
            snapshot_id: "b",
            market_id: "market-1",
            source_id: "source-b",
            market_type: "TOTAL",
            value: 221.5,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }))).toMatchObject({
      status: "SIGNAL",
      evidence: {
        market_type: "TOTAL",
      },
    });
  });

  it("creates divergence when moneyline prices separate beyond threshold", () => {
    expect(evaluateConsensusDivergenceSignal(divergenceEvent({
      event_type: "moneyline_movement_event",
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "MONEYLINE",
            value: -150,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
          {
            snapshot_id: "b",
            market_id: "market-1",
            source_id: "source-b",
            market_type: "MONEYLINE",
            value: -125,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "VERIFIED",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
        ],
      },
      source_ids: ["source-a", "source-b"],
    }))).toMatchObject({
      status: "SIGNAL",
      evidence: {
        market_type: "MONEYLINE",
        divergence_size: 25,
      },
    });
  });

  it("returns no signal when divergence is below threshold or source count is too low", () => {
    expect(evaluateConsensusDivergenceSignal(divergenceEvent({
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "SPREAD",
            value: -5,
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
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Consensus divergence did not cross the configured market threshold."],
    });

    expect(evaluateConsensusDivergenceSignal(divergenceEvent({
      source_ids: ["source-a"],
      payload: {
        source_value_snapshots: [
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
        ],
      },
    }))).toEqual({
      status: "NO_SIGNAL",
      reasons: ["Minimum verified source count was not met."],
    });
  });

  it("rejects missing or invalid source values", () => {
    expect(evaluateConsensusDivergenceSignal(divergenceEvent({ payload: {} }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
    expect(evaluateConsensusDivergenceSignal(divergenceEvent({
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "SPREAD",
            value: -5.5,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "INVALID",
            freshness_status: "CURRENT",
            schema_version: "1.2.0",
          },
        ],
      },
    }))).toMatchObject({
      status: "REJECTED",
      rejection_code: "MISSING_EVIDENCE",
    });
  });

  it("exposes stale and limited sources in evidence and lowers confidence for limited data", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(divergenceEvent({
      payload: {
        source_value_snapshots: [
          {
            snapshot_id: "a",
            market_id: "market-1",
            source_id: "source-a",
            market_type: "SPREAD",
            value: -5.5,
            timestamp: "2026-06-05T13:00:00.000Z",
            verification_status: "LIMITED",
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
            freshness_status: "STALE",
            schema_version: "1.2.0",
          },
        ],
      },
    }));
    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "CONSENSUS_DIVERGENCE",
        evidence_chain: {
          freshness_summary: {
            stale_source_count: 1,
            limited_source_count: 1,
          },
        },
      },
    });
    if (result.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(result.signal.confidence_score.tier).not.toBe("HIGH");
  });

  it("captures one-source separation when one book moves and others remain still", () => {
    const result = evaluateConsensusDivergenceSignal(divergenceEvent({
      source_ids: ["source-a", "source-b", "source-c"],
      payload: {
        source_value_snapshots: [
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
        ],
      },
    }));

    expect(result).toMatchObject({
      status: "SIGNAL",
      evidence: {
        source_separation: {
          moving_source_id: "source-a",
          stationary_source_ids: ["source-b", "source-c"],
        },
      },
    });
  });

  it("creates an informational-only divergence signal with replay metadata", () => {
    const engine = createSignalEngine({ now: () => new Date("2026-06-05T13:01:00.000Z") });
    const result = engine.processEvent(divergenceEvent());

    expect(result).toMatchObject({
      status: "SIGNAL_CREATED",
      signal: {
        signal_type: "CONSENSUS_DIVERGENCE",
        risk_status: "INFORMATIONAL_ONLY",
        recommendation_generated: false,
        evidence_chain: {
          source_values: expect.any(Array),
          highest_value: -4.5,
          lowest_value: -5.5,
          divergence_size: 1,
          source_count: 2,
          market_type: "SPREAD",
        },
        replay_reference: {
          replay_input: {
            classifier_version: "consensus-divergence-classifier/v1",
          },
        },
      },
    });
    if (result.status !== "SIGNAL_CREATED") throw new Error("expected signal");
    expect(result.signal.explanation).toContain("Consensus divergence detected.");
    expect(result.signal.explanation).toContain("Market consensus is not aligned.");
    expect(result.signal.explanation).toContain("Observation may indicate uncertainty, stale pricing, or early movement.");
  });

  it("rejects blocked divergence explanation language and remains deterministic", () => {
    const engine = createSignalEngine({
      now: () => new Date("2026-06-05T13:01:00.000Z"),
      explanationBuilder: () => "Take the stale line now.",
    });
    expect(engine.processEvent(divergenceEvent())).toMatchObject({
      status: "REJECTED",
      rejection_code: "RECOMMENDATION_LANGUAGE_BLOCKED",
    });
    expect(evaluateConsensusDivergenceSignal(divergenceEvent())).toEqual(
      evaluateConsensusDivergenceSignal(divergenceEvent()),
    );
  });
});
