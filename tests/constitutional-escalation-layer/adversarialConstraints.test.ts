import { describe, expect, it } from "vitest";
import { buildConstitutionalEscalation } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("constitutional escalation adversarial constraints", () => {
  it("rejects runtime and orchestration metadata injection", () => {
    const { input } = buildConstitutionalEscalationFixture({
      metadata: Object.freeze({
        schedulerId: "sched-1",
        executionHandle: "exec-1",
        recursiveDelegation: true,
      }),
    });
    const escalation = buildConstitutionalEscalation(input);

    expect(escalation.errors.some((error) =>
      error.code === "ESCALATION_RUNTIME_METADATA_FORBIDDEN" || error.code === "ESCALATION_EXECUTION_METADATA_FORBIDDEN")).toBe(true);
  });

  it("fails closed on replay mismatch", () => {
    const fixture = buildConstitutionalEscalationFixture();
    const escalation = buildConstitutionalEscalation({
      ...fixture.input,
      replay: Object.freeze({
        ...fixture.input.replay,
        status: "INVALID" as const,
      }),
    });

    expect(escalation.errors.some((error) => error.code === "ESCALATION_REPLAY_MISMATCH")).toBe(true);
  });
});
