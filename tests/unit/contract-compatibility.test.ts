import { describe, expect, it } from "vitest";

import { assessContractCompatibility } from "../../services/contracts/contractCompatibility.ts";

describe("contract compatibility", () => {
  it("allows additive optional field changes without major bump", () => {
    const result = assessContractCompatibility({
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
      changes: [{ type: "add_optional_field", field: "meta" }],
    });

    expect(result.compatible).toBe(true);
  });

  it("blocks removed required fields without major bump", () => {
    const result = assessContractCompatibility({
      fromVersion: "1.0.0",
      toVersion: "1.1.0",
      changes: [{ type: "remove_required_field", field: "status" }],
    });

    expect(result.compatible).toBe(false);
    expect(result.code).toBe("API_COMPATIBILITY_FAILURE");
  });
});
