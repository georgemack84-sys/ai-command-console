import { describe, expect, it } from "vitest";

import { validateCorrelationContainment } from "@/services/intent-correlation-engine/correlationContainmentValidator";
import { buildIntentCorrelationFixture } from "./helpers";

describe("correlation containment validator", () => {
  it("rejects execution inference metadata", () => {
    const { computation } = buildIntentCorrelationFixture({
      metadata: Object.freeze({ dispatchId: "bad" }),
    });
    const result = validateCorrelationContainment({
      relationships: computation.result.relationships,
      result: computation.result,
      metadata: Object.freeze({ dispatchId: "bad" }),
    });
    expect(result.some((error) => error.code === "PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED")).toBe(true);
  });
});
