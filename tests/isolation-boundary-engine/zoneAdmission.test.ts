import { describe, expect, it } from "vitest";
import { evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

describe("zone admission", () => {
  it("admits a valid trusted snapshot into its immutable zone boundary", () => {
    const result = evaluateZoneFixture();

    expect(result.allowed).toBe(true);
    expect(result.profile?.trustZone).toBe("tenant");
    expect(result.profile?.isolationLevel).toBe("sandboxed");
  });

  it("is deterministic across repeated identical admissions", () => {
    const first = evaluateZoneFixture();
    const second = evaluateZoneFixture();

    expect(first.decisionHash).toBe(second.decisionHash);
    expect(first.profile?.zoneAuthorityHash).toBe(second.profile?.zoneAuthorityHash);
    expect(first.sandbox?.sandboxHash).toBe(second.sandbox?.sandboxHash);
  });
});

