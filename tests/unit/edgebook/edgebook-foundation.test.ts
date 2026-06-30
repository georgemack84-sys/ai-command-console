import { describe, expect, it } from "vitest";
import {
  bindOwnership,
  classifyOddsShift,
  createRawObservationStore,
  createSignalFromEvents,
  createSourceRegistry,
  detectMarketChange,
  EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER,
  evaluateResponsibleGamblingText,
  ingestMockObservation,
  rejectUnsupportedRecommendation,
  validateMarketObservation,
  validateSource,
  verifyAndRecordObservation,
  type MarketObservation,
  type SourceRegistryEntry,
} from "@/src/edgebook";

const enabledSource: SourceRegistryEntry = {
  source_id: "src_enabled",
  source_name: "Mock Odds Feed",
  source_type: "api",
  trust_level: "VERIFIED",
  owner_id: "owner_1",
  tenant_id: "tenant_1",
  status: "enabled",
  version: "1",
  created_at: "2026-06-04T10:00:00.000Z",
  updated_at: "2026-06-04T10:00:00.000Z",
};

const disabledSource: SourceRegistryEntry = {
  ...enabledSource,
  source_id: "src_disabled",
  source_name: "Disabled Feed",
  status: "disabled",
};

function observation(overrides: Partial<MarketObservation> = {}): MarketObservation {
  const base = {
    observation_id: "obs_1",
    market_id: "market_1",
    sport: "basketball",
    league: "NBA",
    event_id: "event_1",
    event_name: "Mock Knicks at Celtics",
    market_type: "spread" as const,
    market_subtype: "full_game",
    participant: "Mock Celtics",
    line_value: -4.5,
    odds_value: -110,
    implied_probability: 0.524,
    source_id: enabledSource.source_id,
    timestamp: "2026-06-04T12:00:00.000Z",
    collection_sequence: 1,
    schema_version: "1",
  };

  const merged = { ...base, ...overrides };
  const ownership = bindOwnership({
    owner_id: enabledSource.owner_id,
    tenant_id: enabledSource.tenant_id,
    source_id: merged.source_id,
    market_id: merged.market_id,
    timestamp: merged.timestamp,
    version: merged.schema_version,
  });

  if (ownership.status === "REJECTED") {
    throw new Error("test observation ownership failed");
  }

  return {
    ...merged,
    ownership_hash: overrides.ownership_hash ?? ownership.ownership.ownership_hash,
  };
}

function withoutOwnershipHash(input: MarketObservation): Omit<MarketObservation, "ownership_hash"> {
  const copy: Partial<MarketObservation> = { ...input };
  delete copy.ownership_hash;
  return copy as Omit<MarketObservation, "ownership_hash">;
}

describe("EdgeBook foundation", () => {
  it("rejects unknown sources", () => {
    const registry = createSourceRegistry([enabledSource]);

    expect(validateSource(registry, "missing_source")).toMatchObject({
      status: "REJECTED",
      code: "SOURCE_UNKNOWN",
    });
  });

  it("rejects disabled sources", () => {
    const registry = createSourceRegistry([enabledSource, disabledSource]);

    expect(validateSource(registry, disabledSource.source_id)).toMatchObject({
      status: "REJECTED",
      code: "SOURCE_DISABLED",
    });
  });

  it("rejects missing ownership", () => {
    const result = bindOwnership({
      owner_id: "",
      tenant_id: "tenant_1",
      source_id: "src_enabled",
      market_id: "market_1",
      timestamp: "2026-06-04T12:00:00.000Z",
      version: "1",
    });

    expect(result.status).toBe("REJECTED");
  });

  it("rejects invalid observation schemas", () => {
    expect(validateMarketObservation({ ...observation(), sport: "", implied_probability: 2 })).toMatchObject({
      status: "REJECTED",
    });
  });

  it("records valid observations in an append-only raw store", () => {
    const registry = createSourceRegistry([enabledSource]);
    const store = createRawObservationStore();

    const result = verifyAndRecordObservation(registry, store, observation());

    expect(result.status).toBe("RECORDED");
    expect(store.list()).toHaveLength(1);

    const listed = store.list();
    listed[0].raw_market_observation.market_id = "mutated";

    expect(store.list()[0].raw_market_observation.market_id).toBe("market_1");
  });

  it("ingests clearly marked mock observations", () => {
    const registry = createSourceRegistry([enabledSource]);
    const store = createRawObservationStore();

    const result = ingestMockObservation(registry, store, withoutOwnershipHash(observation()), {
      owner_id: enabledSource.owner_id,
      tenant_id: enabledSource.tenant_id,
    });

    expect(result.status).toBe("RECORDED");
  });

  it("detects spread movement", () => {
    const result = detectMarketChange(observation(), observation({ observation_id: "obs_2", line_value: -5.5 }));

    expect(result.status).toBe("RECORDED");
    if (result.status === "RECORDED") {
      expect(result.event.movement_size).toBe(1);
      expect(result.event.movement_direction).toBe("DOWN");
    }
  });

  it("detects total movement", () => {
    const result = detectMarketChange(
      observation({ market_type: "totals", line_value: 221.5 }),
      observation({ observation_id: "obs_2", market_type: "totals", line_value: 224.5 }),
    );

    expect(result.status).toBe("RECORDED");
    if (result.status === "RECORDED") {
      expect(result.event.movement_direction).toBe("UP");
    }
  });

  it("detects moneyline movement", () => {
    const result = detectMarketChange(
      observation({ market_type: "moneyline", line_value: null, odds_value: -120 }),
      observation({ observation_id: "obs_2", market_type: "moneyline", line_value: null, odds_value: -135 }),
    );

    expect(result.status).toBe("RECORDED");
    if (result.status === "RECORDED") {
      expect(result.event.price_delta).toBe(-15);
    }
  });

  it("detects odds compression and expansion", () => {
    expect(classifyOddsShift(observation({ odds_value: -130 }), observation({ odds_value: -110 }))).toBe(
      "odds_compression",
    );
    expect(classifyOddsShift(observation({ odds_value: -110 }), observation({ odds_value: -130 }))).toBe(
      "odds_expansion",
    );
  });

  it("creates evidence-backed signals", () => {
    const movement = detectMarketChange(observation(), observation({ observation_id: "obs_2", line_value: -5.5 }));

    expect(movement.status).toBe("RECORDED");
    if (movement.status !== "RECORDED") {
      throw new Error("expected movement event");
    }

    const signal = createSignalFromEvents("steam_movement", [movement.event]);

    expect(signal.status).toBe("RECORDED");
    if (signal.status === "RECORDED") {
      expect(signal.signal.evidence_chain.events).toHaveLength(1);
      expect(signal.signal.source_ids).toEqual([enabledSource.source_id]);
    }
  });

  it("blocks unsupported recommendations", () => {
    expect(rejectUnsupportedRecommendation("This is a lock and risk-free bet.")).toMatchObject({
      status: "REJECTED",
    });
  });

  it("shows responsible gambling disclaimer and rejects prohibited claims", () => {
    const guardrail = evaluateResponsibleGamblingText("No guaranteed win language belongs here.");

    expect(guardrail.status).toBe("REJECTED");
    expect(guardrail.disclaimer).toBe(EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER);
  });
});
