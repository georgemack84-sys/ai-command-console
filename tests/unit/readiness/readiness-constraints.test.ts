import { describe, expect, it } from "vitest";

import { READINESS_CONSTRAINTS } from "@/services/readiness/readinessConstraints";

describe("READINESS_CONSTRAINTS", () => {
  it("proves readiness cannot become authority", () => {
    expect(READINESS_CONSTRAINTS.READINESS_IS_ADVISORY_ONLY).toBe(true);
    expect(READINESS_CONSTRAINTS.READINESS_CANNOT_AUTHORIZE_RECOVERY).toBe(true);
    expect(READINESS_CONSTRAINTS.READINESS_CANNOT_MUTATE_RUNTIME).toBe(true);
    expect(READINESS_CONSTRAINTS.READINESS_REQUIRES_OPERATOR_APPROVAL).toBe(true);
  });
});
