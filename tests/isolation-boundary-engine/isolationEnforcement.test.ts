import { describe, expect, it } from "vitest";
import { ISOLATION_FAILURE_CODES } from "@/services/isolation-boundary-engine";
import { evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

describe("isolation enforcement", () => {
  it("blocks filesystem traversal outside the sandbox", () => {
    const result = evaluateZoneFixture({ requestedFilesystemPath: "../secrets.txt" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION)).toBe(true);
  });

  it("blocks network access outside the declared allowlist", () => {
    const result = evaluateZoneFixture({ requestedDomain: "example.com" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_NETWORK_POLICY_VIOLATION)).toBe(true);
  });

  it("blocks unscoped credentials", () => {
    const result = evaluateZoneFixture({ requestedCredential: "root-token" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_CREDENTIAL_SCOPE_VIOLATION)).toBe(true);
  });

  it("blocks hidden subprocess spawning", () => {
    const result = evaluateZoneFixture({ hiddenSubprocess: true, requestedCommand: "powershell" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_PROCESS_BOUNDARY_VIOLATION)).toBe(true);
  });

  it("blocks registry mutation and self-registration", () => {
    const result = evaluateZoneFixture({
      selfRegistrationAttempted: true,
      registryMutationAttempted: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_SELF_REGISTRATION_FORBIDDEN)).toBe(true);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_REGISTRY_MUTATION_FORBIDDEN)).toBe(true);
  });

  it("blocks governance bypass attempts", () => {
    const result = evaluateZoneFixture({ governanceBypassAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_GOVERNANCE_BYPASS_ATTEMPT)).toBe(true);
  });
});

