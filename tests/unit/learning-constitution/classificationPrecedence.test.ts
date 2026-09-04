import { describe, expect, it } from "vitest";

import { resolveClassificationPrecedence, validateOneClassificationPerSemanticUnit } from "@/services/learning-constitution";

describe("classification precedence and cardinality", () => {
  it("gives current explicit decisions precedence over inherited context", () => {
    expect(resolveClassificationPrecedence(["INHERITED_CONTEXT", "CURRENT_EXPLICIT_DECISION"])).toBe("CURRENT_EXPLICIT_DECISION");
    expect(resolveClassificationPrecedence(["CURRENT_EXPLICIT_DECISION", "HYPOTHETICAL_CONTAINMENT"])).toBe("HYPOTHETICAL_CONTAINMENT");
  });

  it("requires exactly one classification result for every semantic unit", () => {
    expect(validateOneClassificationPerSemanticUnit(["unit-1", "unit-2"], ["unit-1", "unit-2"])).toEqual({ status: "VALID" });
    expect(validateOneClassificationPerSemanticUnit(["unit-1"], ["unit-1", "unit-1"])).toEqual({ status: "INVALID", reasonCode: "DUPLICATE_SEMANTIC_UNIT_ID" });
    expect(validateOneClassificationPerSemanticUnit(["unit-1", "unit-2"], ["unit-1"])).toEqual({ status: "INVALID", reasonCode: "MISSING_SEMANTIC_UNIT_ID" });
  });
});
