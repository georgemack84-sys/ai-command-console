import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import type { PlanAuditArtifact } from "./replay-audit-types";

export function hashAuditArtifact(artifact: Omit<PlanAuditArtifact, "artifactHash">): string {
  return hashPayloadDeterministically(artifact);
}
