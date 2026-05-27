import { describe, expect, it } from "vitest";
import { detectTraceViewerMutationViolations } from "@/services/step-trace-viewer";
import { loadStepTraceViewerSources } from "./helpers";

describe("read-only guarantee", () => {
  it("imports no forbidden execution, runtime, worker, scheduler, queue, shell, or mutating modules", () => {
    const result = detectTraceViewerMutationViolations({
      sourceTexts: loadStepTraceViewerSources(),
    });

    expect(result.valid).toBe(true);
  });
});
