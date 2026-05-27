import { beforeEach, describe, expect, it } from "vitest";

import {
  createStructuredLogEvent,
  emitStructuredLogEvent,
} from "../../services/observability/structuredLogger.ts";
import {
  getObservabilityTelemetrySnapshot,
  resetObservabilityTelemetry,
} from "../../services/observability/observabilityTelemetry.ts";

describe("observability structured logger", () => {
  beforeEach(() => {
    resetObservabilityTelemetry();
  });

  it("creates deterministic log events with the required shape", () => {
    const event = createStructuredLogEvent(
      {
        level: "INFO",
        category: "api",
        message: "health route evaluated",
        source: "api.v1.observability.health",
        correlationId: "corr-1",
        metadata: {
          nested: {
            b: 2,
            a: 1,
          },
          occurredAt: new Date("2026-05-07T00:00:00.000Z"),
        },
      },
      {
        now: () => "2026-05-07T00:00:00.000Z",
      },
    );

    expect(event).toEqual({
      eventId: expect.any(String),
      timestamp: "2026-05-07T00:00:00.000Z",
      level: "INFO",
      category: "api",
      message: "health route evaluated",
      source: "api.v1.observability.health",
      correlationId: "corr-1",
      metadata: {
        nested: {
          a: 1,
          b: 2,
        },
        occurredAt: "2026-05-07T00:00:00.000Z",
      },
    });
  });

  it("emits serializable log events into telemetry", () => {
    const event = emitStructuredLogEvent(
      {
        level: "WARN",
        category: "contract",
        message: "contract validation failed",
        source: "contracts.validate",
        correlationId: "corr-2",
        metadata: {
          code: "API_VALIDATION_FAILED",
        },
      },
      {
        now: () => "2026-05-07T00:01:00.000Z",
      },
    );

    const snapshot = getObservabilityTelemetrySnapshot();

    expect(snapshot.logs).toEqual([event]);
  });

  it("rejects invalid runtime log categories", () => {
    expect(() =>
      createStructuredLogEvent({
        level: "INFO",
        category: "not-real" as never,
        message: "bad category",
        source: "test",
      }),
    ).toThrow("OBSERVABILITY_LOG_CATEGORY_INVALID");
  });
});
