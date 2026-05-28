import type { DeploymentCheckpointDecision, DeploymentSnapshot } from "./types";

export function verifyDeploymentCheckpoint(snapshot: DeploymentSnapshot): DeploymentCheckpointDecision {
  if (snapshot.operatorAction !== "RESUME") {
    return Object.freeze({ status: "NOT_REQUESTED" as const, reasons: Object.freeze([]) });
  }

  if (!snapshot.checkpoint) {
    return Object.freeze({ status: "MISSING" as const, reasons: Object.freeze(["CHECKPOINT_MISSING"]) });
  }

  const reasons: string[] = [];
  if (snapshot.checkpoint.commitSHA !== snapshot.commitSHA) reasons.push("CHECKPOINT_COMMIT_CHANGED");
  if (snapshot.checkpoint.lockfileHash !== snapshot.lockfileHash) reasons.push("CHECKPOINT_LOCKFILE_CHANGED");
  if (snapshot.checkpoint.environmentHash !== snapshot.environmentHash) reasons.push("CHECKPOINT_ENVIRONMENT_CHANGED");
  if (snapshot.checkpoint.certificateHash !== snapshot.certificate?.certificateHash) {
    reasons.push("CHECKPOINT_CERTIFICATE_CHANGED");
  }

  return Object.freeze({
    status: reasons.length === 0 ? "VALID" as const : "INVALID" as const,
    reasons: Object.freeze(reasons),
    resumePartition: reasons.length === 0 ? snapshot.checkpoint.lastCompletedPartition : undefined,
  });
}
