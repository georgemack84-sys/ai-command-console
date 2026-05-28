import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility determinism", () => {
  it("keeps compatibility hashes stable for identical evidence", () => {
    const first = buildRuntimeAdmissibilityFixture();
    const second = buildRuntimeAdmissibilityFixture();

    expect(first.result.compatibility.deterministicHash).toBe(second.result.compatibility.deterministicHash);
    expect(first.result.governanceBinding.deterministicHash).toBe(second.result.governanceBinding.deterministicHash);
  });
});
