import { describe, expect, it } from "vitest";
import { buildFailureOrchestrationFixture, evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";
import { buildForensicTimeline, runCustomHarnessScenario } from "./helpers";

describe("forensic reconstruction", () => {
  it("reconstructs hostile timelines deterministically", () => {
    const scenario = {
      scenarioId: "forensic-freeze-bypass",
      category: "forensic" as const,
      expectedOutcome: "FORENSIC_RECONSTRUCTED" as const,
      description: "freeze bypass forensic reconstruction",
      mutateInput: (input: ReturnType<typeof buildFailureOrchestrationFixture>) => ({
        ...input,
        freezeBypassAttempted: true,
      }),
    };

    const baseInput = scenario.mutateInput(buildFailureOrchestrationFixture());
    const resultA = evaluateFailureFixture({ freezeBypassAttempted: true });
    const resultB = evaluateFailureFixture({ freezeBypassAttempted: true });
    const timelineA = buildForensicTimeline(scenario.scenarioId, baseInput, resultA);
    const timelineB = buildForensicTimeline(scenario.scenarioId, baseInput, resultB);
    const harnessResult = runCustomHarnessScenario(scenario);

    expect(harnessResult.actualOutcome).toBe("FORENSIC_RECONSTRUCTED");
    expect(timelineA.timelineHash).toBe(timelineB.timelineHash);
    expect(timelineA.entries.length).toBeGreaterThan(0);
  });
});
