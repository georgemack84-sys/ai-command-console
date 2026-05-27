import type { ExecutionTreatyManifest } from "@/types/execution-treaty";

export function isTreatyQuarantined(manifest: ExecutionTreatyManifest): boolean {
  return manifest.handoffStatus === "quarantined" || manifest.preExecutionRevocationStatus === "quarantined";
}

export function requiresTreatyRevalidation(manifest: ExecutionTreatyManifest): boolean {
  return manifest.handoffStatus === "revalidation-required" || manifest.preExecutionRevocationStatus === "must_revalidate";
}
