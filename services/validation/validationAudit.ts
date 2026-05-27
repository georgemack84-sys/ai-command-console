import type { ValidationAuditRecord, ValidationEventType } from "./types";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import { VALIDATION_POLICY_VERSION } from "./validationPolicies";
import type { ExecutionEligibilityResult, PlanValidationResult, ValidationReplayResult, ValidationSnapshot } from "./validationContracts";

export function buildValidationAuditRecord(input: {
  eventType: ValidationEventType;
  details: string[];
  evidenceRefs?: string[];
  timestamp: string;
}): ValidationAuditRecord {
  return {
    eventType: input.eventType,
    details: [...input.details],
    evidenceRefs: [...(input.evidenceRefs || [])],
    timestamp: input.timestamp,
  };
}

export function appendPlanValidationAudit(input: {
  result: Omit<PlanValidationResult, "immutableAuditId">;
}) {
  const payload = {
    auditId: `plan-validation-audit:${hashEvidence({
      planId: input.result.planId,
      validatedAt: input.result.validatedAt,
      state: input.result.validationState,
    }).slice(0, 16)}`,
    policyVersion: VALIDATION_POLICY_VERSION,
    result: input.result,
  };

  return appendImmutableLedgerEntry({
    payload,
    scope: "plan-validation",
  });
}

export function appendValidationSnapshotAudit(input: {
  snapshot: ValidationSnapshot;
}) {
  return appendImmutableLedgerEntry({
    payload: {
      auditId: `validation-snapshot-audit:${hashEvidence({
        snapshotId: input.snapshot.snapshotId,
        validationId: input.snapshot.validationId,
      }).slice(0, 16)}`,
      policyVersion: VALIDATION_POLICY_VERSION,
      eventType: "validation.snapshot_created" as const,
      snapshot: input.snapshot,
    },
    scope: "plan-validation",
  });
}

export function appendExecutionEligibilityAudit(input: {
  eligibility: ExecutionEligibilityResult;
}) {
  return appendImmutableLedgerEntry({
    payload: {
      auditId: `validation-eligibility-audit:${hashEvidence({
        validationId: input.eligibility.validationId,
        snapshotId: input.eligibility.snapshotId ?? null,
        checkedAt: input.eligibility.checkedAt,
      }).slice(0, 16)}`,
      policyVersion: VALIDATION_POLICY_VERSION,
      eventType: "validation.execution_eligibility_checked" as const,
      eligibility: input.eligibility,
    },
    scope: "plan-validation",
  });
}

export function appendValidationReplayAudit(input: {
  replay: ValidationReplayResult;
}) {
  return appendImmutableLedgerEntry({
    payload: {
      auditId: `validation-replay-audit:${hashEvidence({
        replayId: input.replay.replayId,
        validationId: input.replay.originalValidationId,
      }).slice(0, 16)}`,
      policyVersion: VALIDATION_POLICY_VERSION,
      eventType: "validation.replay_completed" as const,
      replay: input.replay,
    },
    scope: "plan-validation",
  });
}
