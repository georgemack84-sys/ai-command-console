import { describe, expect, it } from "vitest";
import {
  assertPhaseOneActionAllowed,
  assertRequiredField,
  createEdgeBookConfig,
  createEdgeBookEvent,
  createValidationResult,
  defaultEdgeBookConfig,
  EdgeBookError,
  evaluatePhaseOneAction,
  isDefined,
  isNonEmptyString,
  isValidTimestamp,
  isValidVersion,
} from "@/src/core";
import * as modules from "@/src/modules";

describe("EdgeBook Phase 1.0 core system skeleton", () => {
  it("loads config with safe defaults", () => {
    expect(defaultEdgeBookConfig).toMatchObject({
      appName: "EdgeBook",
      phase: "1.0",
      intelligenceEnabled: false,
      recommendationsEnabled: false,
      gamblingAdviceEnabled: false,
      eventLoggingEnabled: true,
      validationStrictMode: true,
    });
  });

  it("fails closed when unsafe Phase 1.0 config flags are enabled", () => {
    expect(() => createEdgeBookConfig({ intelligenceEnabled: true })).toThrow(EdgeBookError);
    expect(() => createEdgeBookConfig({ recommendationsEnabled: true })).toThrow(EdgeBookError);
    expect(() => createEdgeBookConfig({ gamblingAdviceEnabled: true })).toThrow(EdgeBookError);
  });

  it("validates deterministic primitives", () => {
    expect(isDefined("value")).toBe(true);
    expect(isDefined(null)).toBe(false);
    expect(isNonEmptyString(" EdgeBook ")).toBe(true);
    expect(isNonEmptyString(" ")).toBe(false);
    expect(isValidTimestamp("2026-06-04T12:00:00.000Z")).toBe(true);
    expect(isValidTimestamp("not-a-date")).toBe(false);
    expect(isValidVersion("1.0")).toBe(true);
    expect(isValidVersion("phase-one")).toBe(false);
  });

  it("explains validation failures without mutating input", () => {
    const input = Object.freeze({ field: "" });

    const result = assertRequiredField("field", input.field, "2026-06-04T12:00:00.000Z");

    expect(result).toEqual({
      status: "REJECTED",
      reason: "field is required for EdgeBook Phase 1.0.",
      field: "field",
      timestamp: "2026-06-04T12:00:00.000Z",
    });
    expect(input.field).toBe("");
  });

  it("creates reproducible validation results", () => {
    expect(
      createValidationResult({
        status: "VALID",
        reason: "ok",
        field: "phase",
        timestamp: "2026-06-04T12:00:00.000Z",
      }),
    ).toEqual(
      createValidationResult({
        status: "VALID",
        reason: "ok",
        field: "phase",
        timestamp: "2026-06-04T12:00:00.000Z",
      }),
    );
  });

  it("creates structured informational Phase 1.0 events", () => {
    expect(
      createEdgeBookEvent({
        event_id: "event_1",
        event_type: "SYSTEM_INITIALIZED",
        message: "Phase 1.0 initialized.",
        timestamp: "2026-06-04T12:00:00.000Z",
      }),
    ).toEqual({
      event_id: "event_1",
      event_type: "SYSTEM_INITIALIZED",
      severity: "INFO",
      message: "Phase 1.0 initialized.",
      timestamp: "2026-06-04T12:00:00.000Z",
      phase: "1.0",
    });
  });

  it("rejects blocked event types", () => {
    for (const eventType of [
      "BET_RECOMMENDED",
      "PICK_GENERATED",
      "EDGE_SCORE_CREATED",
      "CONFIDENCE_RANKED",
      "AUTO_WAGER_TRIGGERED",
    ]) {
      expect(() =>
        createEdgeBookEvent({
          event_id: `event_${eventType}`,
          event_type: eventType,
          message: "Blocked by Phase 1.0.",
        }),
      ).toThrow("blocked during EdgeBook Phase 1.0");
    }
  });

  it("blocks recommendation actions", () => {
    expect(evaluatePhaseOneAction("CREATE_RECOMMENDATION")).toMatchObject({
      status: "REJECTED",
      code: "PHASE_BOUNDARY_VIOLATION",
    });
    expect(() => assertPhaseOneActionAllowed("CREATE_RECOMMENDATION")).toThrow(EdgeBookError);
  });

  it("blocks prediction actions", () => {
    expect(evaluatePhaseOneAction("CREATE_PREDICTION")).toMatchObject({
      status: "REJECTED",
      code: "PHASE_BOUNDARY_VIOLATION",
    });
  });

  it("blocks auto-wagering actions", () => {
    expect(evaluatePhaseOneAction("AUTO_WAGER")).toMatchObject({
      status: "REJECTED",
      code: "PHASE_BOUNDARY_VIOLATION",
    });
  });

  it("keeps placeholder modules free of intelligence or recommendation exports", () => {
    const exportedNames = Object.keys(modules);
    const prohibitedActivatingExports = [
      /^generatePick$/i,
      /^createPick$/i,
      /^createPrediction$/i,
      /^createRecommendation$/i,
      /^calculateEdgeScore$/i,
      /^calculateExpectedValue$/i,
      /^placeWager$/i,
      /^createBetSlip$/i,
      /^autoWager$/i,
    ];

    for (const exportedName of exportedNames) {
      expect(prohibitedActivatingExports.some((pattern) => pattern.test(exportedName))).toBe(false);
    }
  });
});
