import { describe, expect, it } from "vitest";

import { evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import { buildEnforcementFixture } from "./helpers";

describe("runtime containment", () => {
  it("blocks undeclared filesystem write through runtimeCapabilityGuard integration", () => {
    const input = buildEnforcementFixture({
      toolId: "read_file",
      toolVersion: "1.0.0",
      registryHash: getRegistry("read_file").registryHash,
      capabilityHash: getRegistry("read_file").capabilityHash,
      requestedCapability: "write",
      requestedScope: "filesystem",
      replayBinding: undefined,
      governanceMetadata: {
        approvalsSatisfied: true,
        replayAvailable: true,
        rollbackPrepared: true,
      },
    });
    const result = evaluateUnifiedExecutionEnforcement(input);
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "TOOL_CAPABILITY_VIOLATION")).toBe(true);
  });

  it("blocks undeclared network access", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      requestedCapability: "network",
      requestedScope: "localhost",
    }));
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "TOOL_CAPABILITY_VIOLATION")).toBe(true);
  });

  it("blocks undeclared subprocess execution", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      requestedCapability: "execute",
      requestedScope: "restart-service",
    }));
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "TOOL_CAPABILITY_VIOLATION")).toBe(true);
  });

  it("blocks undeclared privileged action", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      requestedCapability: "privileged",
    }));
    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "TOOL_CAPABILITY_VIOLATION")).toBe(true);
  });
});

function getRegistry(toolId: string) {
  const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === toolId);
  if (!entry) throw new Error(`${toolId} fixture missing`);
  return entry;
}
