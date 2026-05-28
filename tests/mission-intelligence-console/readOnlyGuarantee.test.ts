import { describe, expect, it } from "vitest";
import { detectMissionConsoleMutationViolations, loadMissionConsoleSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no execution, scheduler, worker, queue, shell, or mutating modules", () => {
    const result = detectMissionConsoleMutationViolations({
      sourceTexts: loadMissionConsoleSources(),
    });

    expect(result.valid).toBe(true);
  });
});
