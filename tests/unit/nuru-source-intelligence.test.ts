import { describe, expect, it } from "vitest";
import { SourceIntelligencePolicyError, assertSourceMayBeAcquired, sourceRegistrySchema } from "@/src/nuru/source-intelligence";

const approved = sourceRegistrySchema.parse({
  id: "NSI-1",
  workspaceId: "workspace-1",
  name: "NASA",
  domain: "www.nasa.gov",
  baseUrl: "https://www.nasa.gov/",
  category: "GOVERNMENT",
  authorityClass: "PRIMARY",
  ingestionMethods: ["MANUAL", "RSS"],
  admissionState: "APPROVED",
  operationalState: "HEALTHY",
  enabled: true,
  requiresReview: false,
});

describe("Nuru Source Intelligence constitution", () => {
  it("allows only an approved acquisition method", () => {
    expect(() => assertSourceMayBeAcquired(approved, "RSS")).not.toThrow();
    expect(() => assertSourceMayBeAcquired(approved, "WEB")).toThrow(SourceIntelligencePolicyError);
  });

  it("requires human approval for unknown sources", () => {
    const unknown = { ...approved, admissionState: "UNKNOWN" as const, requiresReview: true };
    expect(() => assertSourceMayBeAcquired(unknown, "RSS")).toThrow(/requires human approval/i);
  });

  it("does not confuse admission policy with operational health", () => {
    const degraded = { ...approved, operationalState: "DEGRADED" as const };
    expect(() => assertSourceMayBeAcquired(degraded, "RSS")).not.toThrow();
    const paused = { ...approved, operationalState: "PAUSED" as const };
    expect(() => assertSourceMayBeAcquired(paused, "RSS")).toThrow(/paused/i);
  });

  it("rejects a mismatched declared domain", () => {
    expect(sourceRegistrySchema.safeParse({ ...approved, domain: "example.com" }).success).toBe(false);
  });
});
