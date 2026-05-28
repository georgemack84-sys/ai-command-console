import { describe, expect, it } from "vitest";
import { appendValidationTruthEvent, createValidationTruthLedger, emitValidationEvent } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("append-only truth ledger", () => {
  it("appends without mutating prior ledger state", () => {
    const fixture = buildValidationFixture();
    const empty = createValidationTruthLedger();
    const event = emitValidationEvent(fixture.context, {
      eventType: "validation.started",
      timestamp: fixture.request.submittedAt,
      monotonicSequence: 1,
      subsystem: "validation-core",
      severity: "info",
    });
    const ledger = appendValidationTruthEvent(empty, event);

    expect(empty.events).toHaveLength(0);
    expect(ledger.events).toHaveLength(1);
  });
});
