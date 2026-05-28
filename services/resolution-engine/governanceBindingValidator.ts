import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { GovernanceSnapshot, ResolutionFailure } from "./resolutionTypes";

export function validateGovernanceBinding(
  entry: CanonicalToolRegistryEntry,
  governance: GovernanceSnapshot,
): readonly ResolutionFailure[] {
  const failures: ResolutionFailure[] = [];

  if (!governance.attribution.governanceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_COMPATIBILITY_INVALID",
      message: "governance hash is required",
    });
  }
  if (!governance.lineageNode.lineageHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
      message: "governance lineage hash is required",
    });
  }
  if (!governance.provenanceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
      message: "governance provenance hash is required",
    });
  }
  if (!governance.evidenceBundle.evidenceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_EVIDENCE_INVALID",
      message: "governance evidence hash is required",
    });
  }

  if (governance.attribution.governanceHash && governance.evidenceBundle.governanceHash !== governance.attribution.governanceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_EVIDENCE_INVALID",
      message: "evidence bundle governance hash does not match governance attribution",
    });
  }

  if (governance.evidenceBundle.lineageHash !== governance.lineageNode.lineageHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
      message: "evidence bundle lineage hash does not match governance lineage node",
    });
  }

  if (governance.evidenceBundle.provenanceHash !== governance.provenanceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
      message: "evidence bundle provenance hash does not match governance provenance snapshot",
    });
  }

  if (governance.evidenceBundle.toolId !== entry.toolId || governance.evidenceBundle.toolVersion !== entry.version) {
    failures.push({
      code: "TOOL_GOVERNANCE_COMPATIBILITY_INVALID",
      message: "governance evidence does not bind to the resolved registry identity",
    });
  }

  if (governance.evidenceBundle.registryHash !== entry.registryHash || governance.evidenceBundle.capabilityHash !== entry.capabilityHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_COMPATIBILITY_INVALID",
      message: "governance evidence does not bind to the resolved registry authority hashes",
    });
  }

  return failures;
}
