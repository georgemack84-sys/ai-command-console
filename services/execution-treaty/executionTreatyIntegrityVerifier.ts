import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import { buildExecutorConstraints } from "./executionTreatyConstraintEngine";
import { hashExecutionTreatyArchive, hashExecutionTreatyEvidence, hashExecutionTreatyManifest, hashExecutionTreatyValue } from "./executionTreatyHasher";
import { validateZeroTrustExecutorReadiness } from "./zeroTrustExecutorReadiness";
import type { ExecutionTreatyFailure, ExecutionTreatyValidationResult } from "./executionTreatyReplayValidator";

export function verifyExecutionTreatyIntegrity(
  treaty: ExecutionTreatyPackage,
): ExecutionTreatyValidationResult {
  const failures: ExecutionTreatyFailure[] = [];
  const expectedManifestHash = hashExecutionTreatyManifest(treaty.manifest);
  const expectedEvidenceHash = hashExecutionTreatyEvidence(treaty.evidence);
  const expectedTreatyHash = hashExecutionTreatyValue("execution-treaty-package", {
    manifestHash: expectedManifestHash,
    evidenceHash: expectedEvidenceHash,
    ledgerHashes: treaty.ledger.map((entry) => entry.eventHash),
  });
  const expectedArchiveHash = hashExecutionTreatyArchive({
    treatyId: treaty.manifest.treatyId,
    treatyHash: expectedTreatyHash,
  });

  if (treaty.hashes.manifestHash !== expectedManifestHash) {
    failures.push({
      code: "HANDOFF_HASH_MISMATCH",
      message: "manifest hash mismatch",
      path: "hashes.manifestHash",
      expected: expectedManifestHash,
      actual: treaty.hashes.manifestHash,
    });
  }
  if (treaty.hashes.evidenceHash !== expectedEvidenceHash) {
    failures.push({
      code: "HANDOFF_HASH_MISMATCH",
      message: "evidence hash mismatch",
      path: "hashes.evidenceHash",
      expected: expectedEvidenceHash,
      actual: treaty.hashes.evidenceHash,
    });
  }
  if (treaty.hashes.treatyHash !== expectedTreatyHash) {
    failures.push({
      code: "HANDOFF_HASH_MISMATCH",
      message: "treaty hash mismatch",
      path: "hashes.treatyHash",
      expected: expectedTreatyHash,
      actual: treaty.hashes.treatyHash,
    });
  }
  if (treaty.hashes.archiveHash !== expectedArchiveHash) {
    failures.push({
      code: "HANDOFF_ARCHIVE_FAILED",
      message: "archive hash mismatch",
      path: "hashes.archiveHash",
      expected: expectedArchiveHash,
      actual: treaty.hashes.archiveHash,
    });
  }
  if (!treaty.manifest.registrySnapshotHash) {
    failures.push({
      code: "HANDOFF_REGISTRY_BINDING_MISSING",
      message: "registry snapshot hash missing from manifest",
      path: "manifest.registrySnapshotHash",
    });
  }
  if (!treaty.manifest.approvalChainHash) {
    failures.push({
      code: "HANDOFF_APPROVAL_CHAIN_INVALID",
      message: "approval chain hash missing from manifest",
      path: "manifest.approvalChainHash",
    });
  }
  if (!treaty.manifest.provenanceHash) {
    failures.push({
      code: "HANDOFF_PROVENANCE_MISSING",
      message: "provenance hash missing from manifest",
      path: "manifest.provenanceHash",
    });
  }
  const zeroTrust = validateZeroTrustExecutorReadiness({
    constraints: treaty.manifest.executorConstraints ?? buildExecutorConstraints(),
    executionStarted: treaty.manifest.executionStarted,
    dispatchPerformed: treaty.manifest.dispatchPerformed,
  });
  failures.push(...zeroTrust.failures);

  return { valid: failures.length === 0, failures };
}
