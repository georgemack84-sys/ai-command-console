import { describe, expect, it } from "vitest";

import { intakeIntentRequest } from "@/services/intake/intentIntake";
import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";

describe("intakeIntentRequest", () => {
  it("produces deterministic trusted envelopes and forwards safe input", () => {
    const input = {
      source: "user",
      rawInput: " summarize this text ",
      metadata: { sessionId: "s1", userId: "u1", correlationId: "c1" },
      receivedAt: 10,
    } as const;

    const first = intakeIntentRequest(input);
    const second = intakeIntentRequest(input);

    expect(first).toEqual(second);
    expect(first.forwarded).toBe(true);
    expect(first.envelope.rawInput).toBe(" summarize this text ");
    expect(first.envelope.safety.rejected).toBe(false);
  });

  it("rejects executable-looking payloads without introducing execution authority", () => {
    const result = intakeIntentRequest({
      source: "user",
      rawInput: "bash -c 'echo hi'",
      receivedAt: 20,
    });

    expect(result.forwarded).toBe(false);
    expect(result.failureType).toBe("SAFETY_REJECTION");
    expect(result.envelope.safety.containsExecutableContent).toBe(true);
    expect("executionAllowed" in result).toBe(false);
  });

  it("preserves append-only replay-safe audit output", () => {
    const first = intakeIntentRequest({
      source: "system",
      rawInput: "hello",
      receivedAt: 1,
    });
    const second = intakeIntentRequest({
      source: "system",
      rawInput: "hello",
      receivedAt: 1,
    });

    expect(verifyImmutableLedgerChain([
      { ...first.audit, previousHash: null },
    ])).toBe(true);
    expect(first.audit.payload.auditId).toBe(second.audit.payload.auditId);
  });
});
