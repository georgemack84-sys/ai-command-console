import { describe, expect, it } from "vitest";

import { deriveConfidenceTrigger } from "@/services/monitoring-trigger-model";

describe("confidenceEscalator", () => {
  it("never increases authority when confidence rises or falls", () => {
    const calm = deriveConfidenceTrigger({
      confidenceScore: 0.9,
      previousConfidenceScore: 0.7,
      createdAt: "2026-05-16T16:15:00.000Z",
      replayBindings: Object.freeze(["replay"]),
      governanceBindings: Object.freeze(["governance"]),
      overrideBindings: Object.freeze(["override"]),
      evidenceHashes: Object.freeze(["evidence"]),
      lineageHash: "lineage",
    });
    const tense = deriveConfidenceTrigger({
      confidenceScore: 0.19,
      previousConfidenceScore: 0.9,
      createdAt: "2026-05-16T16:15:00.000Z",
      replayBindings: Object.freeze(["replay"]),
      governanceBindings: Object.freeze(["governance"]),
      overrideBindings: Object.freeze(["override"]),
      evidenceHashes: Object.freeze(["evidence"]),
      lineageHash: "lineage",
    });
    expect(calm.trigger.cautionState).toBe("observe");
    expect(tense.trigger.cautionState).toBe("frozen-recommended");
    expect(tense.escalation.uncertaintyAmplified).toBe(true);
  });
});
