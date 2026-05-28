import type { CoordinationFreezeRecord, FreshnessDecision } from "@/types/freshness";

export function blockUnsafeCoordination(input: {
  freeze: CoordinationFreezeRecord;
  freshnessStatus: "fresh" | "revalidation_required" | "stale" | "expired" | "frozen";
}): FreshnessDecision {
  return Object.freeze({
    mayAdvanceLifecycle: false,
    mayAuthorizeExecution: false,
    mayGenerateApproval: false,
    mayRepairReplay: false,
    mayResumeCoordination: false,
  });
}
