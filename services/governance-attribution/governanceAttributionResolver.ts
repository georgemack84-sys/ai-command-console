import { hashTrustBoundary } from "@/services/execution-enforcement/deterministicSandboxHasher";
import type { GovernanceFailure, GovernanceAttributionInput, GovernanceAttributionResult, GovernanceMetadata } from "./governanceTypes";
import { buildGovernanceCausalityEdges } from "./governanceCausalityEngine";
import { hashGovernanceAttribution } from "./governanceHashing";
import { buildGovernanceLineageChild, buildGovernanceLineageRoot } from "./governanceLineageGraph";

function metadata(entry: GovernanceAttributionInput["entry"]): GovernanceMetadata | null {
  return entry.governanceMetadata ?? null;
}

function validateGovernanceCannotExpandRuntimeAuthority(input: GovernanceAttributionInput): readonly GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  const governance = metadata(input.entry);
  if (!governance) {
    return failures;
  }

  if (
    (input.entry.runtimeCapabilities.includes("privileged")
      || input.entry.runtimeCapabilities.includes("governance")
      || input.entry.runtimeCapabilities.includes("autonomous"))
    && (governance.approvalLevel === "none" || governance.approvalLevel === "operator")
  ) {
    failures.push({
      code: "GOVERNANCE_CANNOT_EXPAND_RUNTIME_AUTHORITY",
      message: "governance approval level is weaker than runtime authority requires",
    });
  }

  if (
    input.authorityEnvelope.trustZone === "privileged"
    && !["human-required", "multi-party", "executive"].includes(governance.approvalLevel)
  ) {
    failures.push({
      code: "GOVERNANCE_CANNOT_EXPAND_RUNTIME_AUTHORITY",
      message: "privileged runtime authority requires stronger governance approval",
    });
  }

  return failures;
}

export function resolveGovernanceAttribution(input: GovernanceAttributionInput): GovernanceAttributionResult {
  const failures: GovernanceFailure[] = [];
  const governance = metadata(input.entry);

  if (!governance) {
    failures.push({
      code: "TOOL_GOVERNANCE_METADATA_MISSING",
      message: "governance metadata is required for executable capability attribution",
    });
    return { valid: false, failures };
  }

  if (!input.authorityEnvelope.capabilityHash || !input.authorityLock.lockHash || !input.replayContainmentHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_ATTRIBUTION_INVALID",
      message: "runtime containment hashes are required for governance attribution",
    });
    return { valid: false, failures };
  }

  failures.push(...validateGovernanceCannotExpandRuntimeAuthority(input));

  const trustZoneHash = hashTrustBoundary(input.authorityEnvelope.trustZone);
  const governanceHash = hashGovernanceAttribution({
    metadata: governance,
    toolId: input.entry.toolId,
    toolVersion: input.entry.version,
    registryHash: input.entry.registryHash,
    capabilityHash: input.authorityEnvelope.capabilityHash,
    sandboxProfileHash: input.authorityEnvelope.sandboxProfileHash,
    trustZoneHash,
    replayContainmentHash: input.replayContainmentHash,
    runtimeAuthorityLockHash: input.authorityLock.lockHash,
    boundaryHash: input.boundaryHash ?? input.authorityEnvelope.derivedBoundaryHash,
  });

  const lineageNode = input.parentLineage
    ? buildGovernanceLineageChild({
        parent: input.parentLineage,
        governanceHash,
        toolId: input.entry.toolId,
        toolVersion: input.entry.version,
      })
    : buildGovernanceLineageRoot({
        governanceHash,
        toolId: input.entry.toolId,
        toolVersion: input.entry.version,
      });

  return {
    valid: failures.length === 0,
    governanceMetadata: governance,
    governanceHash,
    trustZoneHash,
    lineageNode,
    causalityEdges: buildGovernanceCausalityEdges(governance),
    failures,
  };
}
