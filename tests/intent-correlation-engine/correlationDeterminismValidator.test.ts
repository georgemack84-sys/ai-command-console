import { describe, expect, it } from "vitest";

import { validateCorrelationDeterminism } from "@/services/intent-correlation-engine/correlationDeterminismValidator";
import { buildIntentCorrelationFixture } from "./helpers";

describe("correlation determinism validator", () => {
  it("returns no errors for stable output", () => {
    const { computation } = buildIntentCorrelationFixture();
    expect(validateCorrelationDeterminism(computation.result)).toEqual([]);
  });
});
