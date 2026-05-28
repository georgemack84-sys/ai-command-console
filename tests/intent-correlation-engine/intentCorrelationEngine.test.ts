import { describe, expect, it } from "vitest";

import { correlateIntentProposals } from "@/services/intent-correlation-engine";
import { buildIntentCorrelationFixture } from "./helpers";

describe("intent correlation engine", () => {
  it("produces deterministic correlation output", () => {
    const { input } = buildIntentCorrelationFixture();
    const left = correlateIntentProposals(input);
    const right = correlateIntentProposals(input);
    expect(left.result.resultHash).toBe(right.result.resultHash);
    expect(left.result.boundary.executionAuthority).toBe(false);
  });

  it("rejects missing replay binding", () => {
    const { input } = buildIntentCorrelationFixture();
    const broken = Object.freeze({
      ...input,
      coordinationRecords: Object.freeze([]),
    });
    const result = correlateIntentProposals(broken);
    expect(result.errors.some((error) => error.code === "PHASE_4_6B_CORRELATION_REPLAY_BINDING_MISSING")).toBe(true);
  });

  it("does not mutate inputs", () => {
    const { input } = buildIntentCorrelationFixture();
    const before = JSON.stringify(input);
    correlateIntentProposals(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
