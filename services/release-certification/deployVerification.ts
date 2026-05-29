import { validateIssuedReleaseCertificate } from "./certificate";
import { verifyReleaseReplayBundle } from "./releaseEvidenceBundle";
import type { DeployVerificationResult, ReleaseCertificate, ReleaseEvidenceBundle } from "./types";

export function verifyDeployCertificate({
  certificate,
  expectedCommitSha,
  expectedArtifactHash,
  replayBundle,
}: {
  certificate: ReleaseCertificate;
  expectedCommitSha: string;
  expectedArtifactHash: string;
  replayBundle?: ReleaseEvidenceBundle;
}): DeployVerificationResult {
  const reasons: string[] = [];

  reasons.push(...validateIssuedReleaseCertificate(certificate));

  if (certificate.commitSha !== expectedCommitSha) {
    reasons.push("COMMIT_MISMATCH");
  }
  if (certificate.artifactHash !== expectedArtifactHash) {
    reasons.push("ARTIFACT_HASH_MISMATCH");
  }
  if (certificate.governanceStatus !== "PASSED") {
    reasons.push("GOVERNANCE_NOT_PASSED");
  }
  if (certificate.residueResult !== "CLEAN") {
    reasons.push("RESIDUE_NOT_CLEAN");
  }
  if (certificate.approvalLineage.length === 0) {
    reasons.push("APPROVAL_LINEAGE_MISSING");
  }

  const replay = verifyReleaseReplayBundle(replayBundle);
  if (!replay.ok) {
    reasons.push(
      ...replay.missingEvidence.map((item) => `REPLAY_EVIDENCE_MISSING:${item}`),
      ...replay.hashMismatches.map((item) => `REPLAY_HASH_MISMATCH:${item}`),
    );
  }

  const uniqueReasons = [...new Set(reasons)];
  const blockingReasons = uniqueReasons.filter((reason) => !reason.startsWith("REPLAY_"));
  const ok = uniqueReasons.length === 0;

  return {
    ok,
    status: ok ? "VERIFIED" : blockingReasons.length > 0 ? "BLOCKED" : "DISPUTED",
    reasons: uniqueReasons,
    certificateHash: certificate.certificateHash || "",
    commitSha: certificate.commitSha || "",
  };
}
