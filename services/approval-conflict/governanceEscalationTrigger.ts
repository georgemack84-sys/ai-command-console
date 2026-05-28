import type { ApprovalConflictEscalationRecord, ApprovalConflictError } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function triggerApprovalConflictGovernanceEscalation(input: {
  errors: readonly ApprovalConflictError[];
}): ApprovalConflictEscalationRecord {
  const escalationRequired = input.errors.length > 0;
  const escalationAmplified = escalationRequired;
  const governanceReviewRequired = escalationRequired;
  const freezeRequired = escalationRequired;
  return Object.freeze({
    escalationRequired,
    escalationAmplified,
    governanceReviewRequired,
    freezeRequired,
    escalationHash: hashApprovalConflictValue("governance-escalation-trigger", input.errors.map((item) => item.code)),
  });
}

export const buildApprovalConflictEscalationRecord = triggerApprovalConflictGovernanceEscalation;
