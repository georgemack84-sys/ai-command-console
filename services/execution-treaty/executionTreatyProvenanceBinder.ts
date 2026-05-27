import type { RegistryTrustAdmissionResult } from "@/services/registry-trust";
import { hashExecutionTreatyValue } from "./executionTreatyHasher";
import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

export function bindTreatyProvenance(input: {
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
}): {
  provenanceHash: string;
  signatureHash: string;
  approvalChainHash: string;
  failures: readonly ExecutionTreatyFailure[];
} {
  const failures: ExecutionTreatyFailure[] = [];
  if (!input.trustedSnapshotAdmission.ok) {
    return {
      provenanceHash: "",
      signatureHash: "",
      approvalChainHash: "",
      failures: [{
        code: "HANDOFF_PROVENANCE_MISSING",
        message: "trusted snapshot admission is missing provenance evidence",
        path: "trustedSnapshotAdmission",
      }],
    };
  }

  const approvalChainHash = input.trustedSnapshotAdmission.provenance.approvalChainHash ?? "";
  const governanceSnapshotHash = input.trustedSnapshotAdmission.provenance.governanceSnapshotHash ?? "";
  if (!approvalChainHash) {
    failures.push({
      code: "HANDOFF_APPROVAL_CHAIN_INVALID",
      message: "approval chain hash is missing",
      path: "trustedSnapshotAdmission.provenance.approvalChainHash",
    });
  }
  if (!governanceSnapshotHash) {
    failures.push({
      code: "HANDOFF_PROVENANCE_MISSING",
      message: "governance snapshot hash is missing from provenance",
      path: "trustedSnapshotAdmission.provenance.governanceSnapshotHash",
    });
  }
  return {
    provenanceHash: hashExecutionTreatyValue("treaty-provenance", input.trustedSnapshotAdmission.provenance),
    signatureHash: hashExecutionTreatyValue("treaty-signature", input.trustedSnapshotAdmission.signature),
    approvalChainHash,
    failures,
  };
}
