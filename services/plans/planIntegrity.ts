import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlanHistory } from "./planPersistence";
import { readPlanAuditEntries } from "./planStore";
import { rebuildPlanLineage } from "./planLineage";
import { verifyReplayIntegrity } from "./planReplayInspector";

export function verifyPlanIntegrity(planId: string) {
  const history = getPlanHistory(planId);
  const auditEntries = readPlanAuditEntries(planId);
  const lineage = rebuildPlanLineage(planId);
  const replay = verifyReplayIntegrity(planId);

  const timestampCorruption = history.lifecycleEvents.some((event, index, events) => {
    if (index === 0) {
      return event.timestamp < history.plan.metadata.createdAt;
    }
    return event.timestamp < (events[index - 1]?.timestamp ?? 0);
  });

  const duplicateTransitions = new Set<string>();
  const hasDuplicateTransition = history.lifecycleEvents.some((event) => {
    const key = `${event.previousState ?? "NONE"}:${event.nextState}:${event.timestamp}`;
    if (duplicateTransitions.has(key)) {
      return true;
    }
    duplicateTransitions.add(key);
    return false;
  });

  const reasons = [
    ...(history.lifecycleEvents.length === 0 ? [PLAN_ERROR_CODES.PLAN_AUDIT_CORRUPTED] : []),
    ...(verifyImmutableLedgerChain(auditEntries) ? [] : [PLAN_ERROR_CODES.PLAN_AUDIT_CORRUPTED]),
    ...(lineage.valid ? [] : lineage.issues),
    ...(replay.driftDetected ? replay.reasons : []),
    ...(timestampCorruption ? [PLAN_ERROR_CODES.PLAN_INTEGRITY_FAILURE] : []),
    ...(hasDuplicateTransition ? [PLAN_ERROR_CODES.PLAN_INTEGRITY_FAILURE] : []),
    ...(history.plan.integrity.immutableHash ? [] : [PLAN_ERROR_CODES.PLAN_IMMUTABLE_MUTATION]),
  ];

  return {
    planId,
    valid: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    orphaned: history.plan.steps.length > 0 && history.lifecycleEvents.length === 0,
    duplicateTransitions: hasDuplicateTransition,
    timestampCorruption,
  };
}
