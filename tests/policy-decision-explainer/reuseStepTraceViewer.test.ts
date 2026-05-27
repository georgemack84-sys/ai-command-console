import { describe, expect, it } from "vitest";
import { loadPolicyDecisionExplainerSources } from "./helpers";

describe("reuse step trace viewer", () => {
  it("consumes step-trace-viewer projections instead of duplicating truth engines", () => {
    const sources = loadPolicyDecisionExplainerSources();
    const combined = sources.map((source) => source.content).join("\n");

    expect(combined).toContain("@/types/step-trace-viewer");
    expect(combined).not.toContain("validationTimelineBuilder");
    expect(combined).not.toContain("validationCausalityResolver");
    expect(combined).not.toContain("validationStateReconstructor");
    expect(combined).not.toContain("validationReplayTimeline");
    expect(combined).not.toContain("analyzeValidationForensics");
  });
});
