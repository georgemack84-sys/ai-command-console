import { describe, expect, it } from "vitest";
import { buildConstitutionalAutonomyReadinessGate } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("constitutional autonomy readiness adversarial constraints", () => {
  it("fails closed on hidden execution injection", () => {
    const { input } = buildConstitutionalReadinessGateFixture({
      metadata: Object.freeze({
        schedulerId: "sched-1",
        queueId: "queue-1",
        silentRetry: true,
      }),
    });
    const gate = buildConstitutionalAutonomyReadinessGate(input);

    expect(gate.errors.some((error) => error.code === "AUTONOMY_RUNTIME_UNSAFE" || error.code === "AUTONOMY_EXECUTION_LIMIT")).toBe(true);
  });

  it("fails closed on replay mismatch", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const gate = buildConstitutionalAutonomyReadinessGate({
      ...input,
      replay: Object.freeze({
        ...input.replay,
        status: "INVALID" as const,
      }),
    });
    expect(gate.errors.some((error) => error.code === "AUTONOMY_REPLAY_INVALID")).toBe(true);
  });
});
