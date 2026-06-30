import { describe, expect, it } from "vitest";
import {
  createMarketObservationEvent,
  createMockMarketObservation,
  CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION,
  validateMarketObservationSchema,
  type MarketObservation,
} from "@/src/modules/markets";

function withField(field: string, value: unknown) {
  return {
    ...createMockMarketObservation(),
    [field]: value,
  } as Partial<MarketObservation> & Record<string, unknown>;
}

function expectRejected(observation: Partial<MarketObservation> & Record<string, unknown>, reason: string) {
  expect(validateMarketObservationSchema(observation)).toMatchObject({
    status: "REJECTED",
    reasons: expect.arrayContaining([reason]),
  });
}

describe("EdgeBook Phase 1.2 market observation schema", () => {
  it("accepts a valid spread observation", () => {
    expect(validateMarketObservationSchema(createMockMarketObservation())).toEqual({
      status: "VALID",
      reasons: [],
    });
  });

  it("accepts a valid moneyline observation", () => {
    expect(
      validateMarketObservationSchema(
        createMockMarketObservation({
          market_type: "MONEYLINE",
          market_subtype: "FULL_GAME",
          line_value: null,
          odds_value: 125,
        }),
      ),
    ).toMatchObject({ status: "VALID" });
  });

  it("accepts a valid totals observation", () => {
    expect(
      validateMarketObservationSchema(
        createMockMarketObservation({
          market_type: "TOTALS",
          participant: "OVER",
          market_subtype: "FULL_GAME",
          line_value: 221.5,
        }),
      ),
    ).toMatchObject({ status: "VALID" });
  });

  it("accepts a valid player prop observation", () => {
    expect(
      validateMarketObservationSchema(
        createMockMarketObservation({
          market_type: "PLAYER_PROP",
          participant: "player_123",
          market_subtype: "POINTS",
          line_value: 24.5,
        }),
      ),
    ).toMatchObject({ status: "VALID" });
  });

  it("accepts a valid alternate line observation", () => {
    expect(
      validateMarketObservationSchema(
        createMockMarketObservation({
          market_type: "ALTERNATE_LINE",
          participant: "Mock Team",
          market_subtype: "ALT_SPREAD",
          line_value: -7.5,
        }),
      ),
    ).toMatchObject({ status: "VALID" });
  });

  it("rejects missing market_id", () => {
    expectRejected(withField("market_id", ""), "market_id is required");
  });

  it("rejects missing sport", () => {
    expectRejected(withField("sport", ""), "sport is required");
  });

  it("rejects missing league", () => {
    expectRejected(withField("league", ""), "league is required");
  });

  it("rejects missing event_id", () => {
    expectRejected(withField("event_id", ""), "event_id is required");
  });

  it("rejects missing source_id", () => {
    expectRejected(withField("source_id", ""), "source_id is required");
  });

  it("rejects missing ownership_hash", () => {
    expectRejected(withField("ownership_hash", ""), "ownership_hash is required");
  });

  it("rejects missing schema_version", () => {
    const observation = withField("schema_version", "");

    const result = validateMarketObservationSchema(observation);

    expect(result.status).toBe("REJECTED");
    expect(result.reasons).toContain("schema_version is required");
    expect(result.reasons).toContain("schema_version is unsupported");
  });

  it("rejects unsupported schema_version", () => {
    expectRejected(withField("schema_version", "1.1.0"), "schema_version is unsupported");
  });

  it("rejects unknown market_type", () => {
    expectRejected(withField("market_type", "UNKNOWN"), "market_type is invalid");
  });

  it("rejects missing raw_values", () => {
    expectRejected(withField("raw_values", undefined), "raw_values is required");
  });

  it("rejects missing raw_payload", () => {
    const observation = createMockMarketObservation({
      raw_values: {
        raw_line_value: "-4.5",
        raw_odds_value: "-110",
        raw_participant: "Mock Team",
        raw_market_name: "Mock Spread",
        received_at: "2026-06-04T12:00:00.000Z",
      } as MarketObservation["raw_values"],
    });

    expectRejected(observation, "raw_values.raw_payload must be preserved");
  });

  it("rejects invalid timestamp", () => {
    expectRejected(withField("timestamp", "not-a-date"), "timestamp must be valid");
  });

  it("rejects invalid received_at", () => {
    expectRejected(
      createMockMarketObservation({
        raw_values: {
          ...createMockMarketObservation().raw_values,
          received_at: "not-a-date",
        },
      }),
      "raw_values.received_at must be valid",
    );
  });

  it("rejects moneyline with numeric line_value", () => {
    expectRejected(
      createMockMarketObservation({ market_type: "MONEYLINE", line_value: 1 }),
      "MONEYLINE line_value must be null",
    );
  });

  it("rejects totals with invalid participant", () => {
    expectRejected(
      createMockMarketObservation({ market_type: "TOTALS", participant: "Mock Team", line_value: 221.5 }),
      "TOTALS participant must be OVER or UNDER",
    );
  });

  it("rejects spread without numeric line_value", () => {
    expectRejected(withField("line_value", null), "SPREAD line_value must be a number");
  });

  it("rejects player prop without participant", () => {
    expectRejected(
      createMockMarketObservation({ market_type: "PLAYER_PROP", participant: "", market_subtype: "POINTS" }),
      "participant is required",
    );
  });

  it("rejects alternate line without market_subtype", () => {
    expectRejected(
      createMockMarketObservation({ market_type: "ALTERNATE_LINE", market_subtype: "" }),
      "market_subtype is required",
    );
  });

  it("creates informational market observation events", () => {
    expect(
      createMarketObservationEvent({
        market_id: "market_1",
        event_type: "MARKET_OBSERVATION_SCHEMA_VALIDATED",
        reason: "Schema version confirmed.",
      }),
    ).toMatchObject({
      market_id: "market_1",
      event_type: "MARKET_OBSERVATION_SCHEMA_VALIDATED",
      severity: "INFO",
    });
  });

  it("exports the current schema version explicitly", () => {
    expect(CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION).toBe("1.2.0");
  });
});

describe("EdgeBook Phase 1.2 market observation schema boundaries", () => {
  for (const field of [
    "edge_score",
    "confidence_score",
    "recommendation",
    "pick",
    "expected_value",
    "wager_instruction",
    "bet_advice",
    "projected_winner",
  ]) {
    it(`rejects ${field}`, () => {
      expectRejected(withField(field, "blocked"), `${field} is prohibited during EdgeBook Phase 1.2`);
    });
  }

  it("does not expose recommendation, prediction, edge scoring, or wager logic", async () => {
    const moduleExports = await import("@/src/modules/markets");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("edgescore");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
  });
});
