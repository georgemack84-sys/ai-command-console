import { describe, expect, it } from "vitest";
import type { RuntimeAdmissibilityInput } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildRuntimeAdmissibilityFixture();
    const second = buildRuntimeAdmissibilityFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
    expect(first.result.readinessScore.scoreHash).toBe(second.result.readinessScore.scoreHash);
  });

  it("tightens restriction when observability gaps appear", () => {
    const fixture = buildRuntimeAdmissibilityFixture({
      observabilitySnapshot: Object.freeze({
        runtimeId: "runtime-1",
        coverageDomains: Object.freeze(["runtime", "governance"] as const),
        lineageRefs: Object.freeze([]),
        observabilityHash: "observability-gap-hash",
      }) as RuntimeAdmissibilityInput["observabilitySnapshot"],
    });

    expect(["frozen", "disputed", "invalid", "revoked"]).toContain(fixture.result.record.classification);
  });
});
