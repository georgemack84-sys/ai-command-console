import { describe, expect, it } from "vitest";

import { hashConstitutionalCoordinationRecord } from "@/services/constitutional-coordination/deterministicCoordinationEngine";
import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";

describe("constitutional coordination hash determinism", () => {
  it("produces stable hashes for identical inputs", () => {
    const fixture = buildConstitutionalCoordinationFixture();
    const rest = { ...fixture.record };
    delete (rest as { deterministicHash?: string }).deterministicHash;
    expect(hashConstitutionalCoordinationRecord(rest)).toBe(hashConstitutionalCoordinationRecord(rest));
  });
});
