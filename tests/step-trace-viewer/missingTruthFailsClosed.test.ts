import { describe, expect, it } from "vitest";
import { buildStepTraceView } from "@/services/step-trace-viewer";

describe("missing truth fails closed", () => {
  it("returns fail-closed viewer errors instead of guessing", () => {
    const view = buildStepTraceView({} as never);

    expect(view.errors[0]?.code).toBe("TRACE_SOURCE_TRUTH_MISSING");
    expect(view.validationView.status).toBe("invalid");
  });
});
