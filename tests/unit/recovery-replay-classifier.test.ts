import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  REPLAY_CLASSIFICATIONS,
  classifyReplayCandidate,
} = require("../../services/recoveryReplayClassifier.js");

function makeStepRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "step_1",
    status: "failed",
    isIdempotent: false,
    idempotencyClass: "unknown",
    idempotencyKey: null,
    sideEffects: [],
    finishedAt: null,
    failedAt: "2026-05-02T00:00:00.000Z",
    ...overrides,
  };
}

function makeLedgerEvents(events: Array<Record<string, unknown>>) {
  return events.map((event, index) => ({
    id: index + 1,
    eventType: "attempt.started",
    attemptNumber: 1,
    createdAt: 1_777_000_000_000 + index,
    ...event,
  }));
}

describe("recovery replay classifier", () => {
  it("fails closed on invalid input", () => {
    const result = classifyReplayCandidate(null);
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "INVALID_RECOVERY_CLASSIFIER_INPUT",
      }),
    );
  });

  it("classifies ledger/snapshot terminal mismatch as corrupted", () => {
    const result = classifyReplayCandidate({
      stepRow: makeStepRow({
        status: "completed",
        finishedAt: "2026-05-02T00:00:00.000Z",
        failedAt: null,
      }),
      ledgerEvents: makeLedgerEvents([
        { eventType: "attempt.started" },
        { eventType: "attempt.failed" },
      ]),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          classification: REPLAY_CLASSIFICATIONS.CORRUPTED,
        }),
      }),
    );
  });

  it("classifies side-effecting non-idempotent replay as unsafe", () => {
    const result = classifyReplayCandidate({
      stepRow: makeStepRow({
        sideEffects: ["filesystem"],
        isIdempotent: false,
        idempotencyKey: null,
      }),
      ledgerEvents: makeLedgerEvents([
        { eventType: "attempt.started" },
        { eventType: "attempt.failed" },
      ]),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          classification: REPLAY_CLASSIFICATIONS.UNSAFE_REPLAY,
        }),
      }),
    );
  });

  it("classifies side-effecting idempotent replay as idempotent replay", () => {
    const result = classifyReplayCandidate({
      stepRow: makeStepRow({
        sideEffects: ["network"],
        isIdempotent: true,
        idempotencyClass: "safe_repeat",
        idempotencyKey: "exec_1:step_1:1",
      }),
      ledgerEvents: makeLedgerEvents([
        { eventType: "attempt.started" },
        { eventType: "attempt.failed" },
      ]),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          classification: REPLAY_CLASSIFICATIONS.IDEMPOTENT_REPLAY,
        }),
      }),
    );
  });

  it("classifies side-effect-free replay as safe replay", () => {
    const result = classifyReplayCandidate({
      stepRow: makeStepRow({
        sideEffects: [],
        isIdempotent: false,
        idempotencyKey: null,
      }),
      ledgerEvents: makeLedgerEvents([
        { eventType: "attempt.started" },
        { eventType: "attempt.failed" },
      ]),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          classification: REPLAY_CLASSIFICATIONS.SAFE_REPLAY,
        }),
      }),
    );
  });

  it("fails closed to requires operator for ambiguous unknown-side-effect replay", () => {
    const result = classifyReplayCandidate({
      stepRow: makeStepRow({
        sideEffects: ["unknown"],
        isIdempotent: false,
        idempotencyKey: null,
      }),
      ledgerEvents: makeLedgerEvents([
        { eventType: "attempt.started" },
      ]),
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          classification: REPLAY_CLASSIFICATIONS.REQUIRES_OPERATOR,
        }),
      }),
    );
  });
});
