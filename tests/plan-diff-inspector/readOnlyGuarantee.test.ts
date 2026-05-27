import { describe, expect, it } from "vitest";
import { detectPlanDiffMutationViolations } from "@/services/plan-diff-inspector";
import { loadPlanDiffInspectorSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no forbidden execution, runtime, worker, scheduler, queue, shell, or mutating modules", () => {
    const result = detectPlanDiffMutationViolations({
      sourceTexts: loadPlanDiffInspectorSources(),
    });

    expect(result.valid).toBe(true);
  });
});
