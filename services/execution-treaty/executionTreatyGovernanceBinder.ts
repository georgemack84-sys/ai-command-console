import { hashExecutionTreatyValue } from "./executionTreatyHasher";
import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

export function bindGovernanceTreatyEvidence(input: {
  governanceSnapshotHash: string;
  approvalChainHash?: string;
  provenanceHash?: string;
  governanceVerified: boolean;
}): {
  governanceInheritanceHash: string;
  failures: readonly ExecutionTreatyFailure[];
} {
  const failures: ExecutionTreatyFailure[] = [];
  if (!input.governanceSnapshotHash) {
    failures.push({
      code: "HANDOFF_GOVERNANCE_INHERITANCE_INVALID",
      message: "governance snapshot hash is missing",
      path: "governanceSnapshotHash",
    });
  }
  if (!input.approvalChainHash) {
    failures.push({
      code: "HANDOFF_APPROVAL_CHAIN_INVALID",
      message: "approval chain hash is missing",
      path: "approvalChainHash",
    });
  }
  if (!input.governanceVerified) {
    failures.push({
      code: "HANDOFF_GOVERNANCE_INHERITANCE_INVALID",
      message: "upstream governance validation failed",
      path: "governanceVerified",
    });
  }
  return {
    governanceInheritanceHash: hashExecutionTreatyValue("governance-inheritance", {
      governanceSnapshotHash: input.governanceSnapshotHash,
      approvalChainHash: input.approvalChainHash ?? null,
      provenanceHash: input.provenanceHash ?? null,
    }),
    failures,
  };
}
