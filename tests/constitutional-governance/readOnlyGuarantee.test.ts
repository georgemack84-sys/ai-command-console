import { describe, expect, it } from "vitest";
import { detectConstitutionalGovernanceViolations, loadConstitutionalGovernanceSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no execution, orchestration, scheduler, worker, queue, shell, or mutating modules", () => {
    const result = detectConstitutionalGovernanceViolations({
      sourceTexts: loadConstitutionalGovernanceSources(),
    });

    expect(result.valid).toBe(true);
  });
});
