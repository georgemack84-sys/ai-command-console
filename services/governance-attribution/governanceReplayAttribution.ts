import type {
  GovernanceAttributionInput,
  GovernanceEvidenceBundle,
  GovernanceLineageNode,
  GovernanceProvenanceEvent,
  GovernanceReplayAttributionResult,
} from "./governanceTypes";
import { resolveGovernanceAttribution } from "./governanceAttributionResolver";
import { hashGovernanceEvidenceBundle, hashGovernanceProvenanceEvents } from "./governanceHashing";

export function reconstructGovernanceReplayAttribution(input: {
  attributionInput: GovernanceAttributionInput;
  expectedGovernanceHash: string;
  expectedLineage?: GovernanceLineageNode;
  provenanceEvents?: readonly GovernanceProvenanceEvent[];
  evidenceBundle?: GovernanceEvidenceBundle;
}): GovernanceReplayAttributionResult {
  const reconstructed = resolveGovernanceAttribution(input.attributionInput);
  const failures = [...reconstructed.failures];

  if (reconstructed.governanceHash !== input.expectedGovernanceHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_HASH_MISMATCH",
      message: "reconstructed governance hash does not match expected replay attribution",
    });
  }

  if (input.expectedLineage && reconstructed.lineageNode?.lineageHash !== input.expectedLineage.lineageHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
      message: "governance lineage does not reconstruct identically",
    });
  }

  if (input.provenanceEvents && input.evidenceBundle) {
    const provenanceHash = hashGovernanceProvenanceEvents(input.provenanceEvents);
    if (provenanceHash !== input.evidenceBundle.provenanceHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
        message: "replayed governance provenance does not match evidence bundle",
      });
    }
    if (hashGovernanceEvidenceBundle(input.evidenceBundle) !== input.evidenceBundle.evidenceHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
        message: "replayed governance evidence bundle is unstable",
      });
    }
  }

  return {
    valid: failures.length === 0,
    governanceHash: reconstructed.governanceHash,
    failures,
  };
}
