import { describe, expect, it } from "vitest";
import { detectReplayMutationViolations } from "@/services/replay-reconstruction-engine";
import { loadReplayReconstructionSources } from "./helpers";

describe("read-only replay", () => {
  it("imports no forbidden execution, runtime, worker, scheduler, queue, shell, or mutating modules", () => {
    const result = detectReplayMutationViolations({
      sourceTexts: loadReplayReconstructionSources(),
    });

    expect(result.valid).toBe(true);
  });
});
