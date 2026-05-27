import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import {
  deriveExecutionTrustZone,
  deriveCapabilitySandbox,
  deriveCapabilityBoundaries,
  hashContainmentBoundary,
  hashSandboxProfile,
  evaluateUnifiedExecutionEnforcement,
  type UnifiedEnforcementInput,
  type RuntimeAuthorityLock,
} from "@/services/execution-enforcement";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildEnforcementFixture(
  overrides: Partial<UnifiedEnforcementInput> = {},
): UnifiedEnforcementInput {
  const entry = clone(
    getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write"),
  );
  if (!entry) {
    throw new Error("filesystem.write fixture missing");
  }

  const trust = deriveExecutionTrustZone(entry);
  const sandbox = deriveCapabilitySandbox(entry);
  const boundaries = deriveCapabilityBoundaries(entry, "tenant-a");
  if (!trust.trustZone || !sandbox.sandboxProfile || !boundaries.boundaries) {
    throw new Error("failed to derive enforcement fixture");
  }

  return {
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    requestedCapability: "write",
    requestedScope: "filesystem",
    trustZoneHint: "STANDARD",
    tenantContext: {
      tenantId: "tenant-a",
      expectedTenantId: "tenant-a",
    },
    replayBinding: {
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: entry.capabilityHash,
      sandboxProfileHash: hashSandboxProfile(sandbox.sandboxProfile),
      trustBoundaryHash: hashContainmentBoundary(trust.trustZone, boundaries.boundaries),
      environmentHash: "env-a",
    },
    runtimeMetadata: {
      environmentHash: "env-a",
      currentTrustZone: "STANDARD",
      sandboxProfileHash: hashSandboxProfile(sandbox.sandboxProfile),
      derivedBoundaryHash: hashContainmentBoundary(trust.trustZone, boundaries.boundaries),
      mutationAttempted: false,
      filesystemIsolationReady: true,
      networkIsolationReady: true,
      processIsolationReady: true,
      privilegedMonitoringReady: true,
    },
    governanceMetadata: {
      approvalsSatisfied: true,
      constitutionalApproval: true,
      governanceApproved: true,
      simulationOnly: false,
      internalRuntime: false,
      replayAvailable: true,
      rollbackPrepared: true,
    },
    lockTimestamp: "2026-05-15T00:00:00.000Z",
    ...overrides,
  };
}

export function buildAuthorityLockForFixture(
  overrides: Partial<UnifiedEnforcementInput> = {},
): RuntimeAuthorityLock {
  const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture(overrides));
  if (!result.authorityLock) {
    throw new Error("authority lock not created");
  }
  return result.authorityLock;
}
