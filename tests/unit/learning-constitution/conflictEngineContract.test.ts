import { describe, expect, it } from "vitest";

import { CONFLICT_RESOLUTION_OUTCOMES, CONFLICT_STATUSES, CONFLICT_TYPES } from "@/types/learning-constitution";

describe("Phase 8 conflict engine contract", () => {
  it("defines the complete initial conflict taxonomy and governed outcomes", () => {
    expect(CONFLICT_TYPES).toContain("DIRECT_CONTRADICTION");
    expect(CONFLICT_TYPES).toContain("EXCEPTION_CONFLICT");
    expect(CONFLICT_TYPES).toContain("AMBIGUOUS_CONFLICT");
    expect(CONFLICT_RESOLUTION_OUTCOMES).toEqual([
      "NO_CONFLICT", "MERGE", "SUPERSEDE", "NARROW_SCOPE", "CREATE_EXCEPTION", "REQUEST_CLARIFICATION", "ESCALATE", "REJECT",
    ]);
  });

  it("keeps proposed resolution distinct from the durable conflict lifecycle", () => {
    expect(CONFLICT_STATUSES).toContain("RESOLUTION_PROPOSED");
    expect(CONFLICT_STATUSES).toContain("AWAITING_APPROVAL");
    expect(CONFLICT_STATUSES).toContain("DEFERRED");
    expect(CONFLICT_STATUSES).toContain("RESOLVED");
  });
});
