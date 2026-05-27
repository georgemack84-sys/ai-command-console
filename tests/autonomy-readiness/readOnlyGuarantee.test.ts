import { describe, expect, it } from "vitest";
import { detectAutonomyReadinessViolations, loadAutonomyReadinessSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no execution, orchestration, scheduler, worker, queue, shell, or dispatch modules", () => {
    const result = detectAutonomyReadinessViolations({
      sourceTexts: loadAutonomyReadinessSources(),
    });

    expect(result.valid).toBe(true);
  });
});
