import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import { appendExecutionTreatyEvent } from "./executionTreatyEvidenceLedger";

export function revokeExecutionTreaty(
  treaty: ExecutionTreatyPackage,
  input: {
    revokedAt: string;
    reasonCode: "HANDOFF_REVOKED" | "HANDOFF_QUARANTINED" | "HANDOFF_REVALIDATION_REQUIRED";
  },
): ExecutionTreatyPackage {
  const handoffStatus = input.reasonCode === "HANDOFF_REVOKED"
    ? "revoked"
    : input.reasonCode === "HANDOFF_QUARANTINED"
      ? "quarantined"
      : "revalidation-required";
  const preExecutionRevocationStatus = input.reasonCode === "HANDOFF_REVOKED"
    ? "revoked"
    : input.reasonCode === "HANDOFF_QUARANTINED"
      ? "quarantined"
      : "must_revalidate";
  const manifest = {
    ...treaty.manifest,
    handoffStatus,
    preExecutionRevocationStatus,
  } as ExecutionTreatyPackage["manifest"];
  return {
    ...treaty,
    manifest,
    ledger: appendExecutionTreatyEvent(treaty.ledger, {
      eventType: handoffStatus === "revoked" ? "treaty.revoked" : handoffStatus === "quarantined" ? "treaty.quarantined" : "treaty.revalidation-required",
      treatyId: treaty.manifest.treatyId,
      result: "success",
      errorCode: input.reasonCode,
      occurredAt: input.revokedAt,
    }),
  };
}
