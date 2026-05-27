import { describe, expect, it } from "vitest";
import { ISOLATION_FAILURE_CODES } from "@/services/isolation-boundary-engine";
import { evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

describe("sovereignty enforcement", () => {
  it("blocks illegal cross-zone execution", () => {
    const result = evaluateZoneFixture({
      sourceZone: "governance",
      crossZoneTarget: "privileged",
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TRUST_ZONE_CROSSING_FORBIDDEN)).toBe(true);
  });

  it("blocks authority inheritance", () => {
    const result = evaluateZoneFixture({ authorityInheritanceAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.AUTHORITY_INHERITANCE_FORBIDDEN)).toBe(true);
  });

  it("blocks cross-tenant contamination", () => {
    const result = evaluateZoneFixture({ targetTenantId: "tenant-b" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.SOVEREIGNTY_BOUNDARY_VIOLATION)).toBe(true);
  });

  it("blocks autonomous peer boundary violations", () => {
    const result = evaluateZoneFixture({
      requestedZone: "autonomy",
      sourceZone: "autonomy",
      autonomousPeerAccess: true,
      peerSharedMemory: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.ZONE_ESCALATION_ATTEMPT || item.code === ISOLATION_FAILURE_CODES.SOVEREIGNTY_BOUNDARY_VIOLATION)).toBe(true);
  });
});

