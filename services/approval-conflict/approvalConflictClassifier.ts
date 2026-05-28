import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function classifyApprovalConflictWeaknesses(input: {
  conflictInput: ApprovalConflictStressInput;
  errors: readonly ApprovalConflictError[];
  inheritedWeaknesses: readonly ApprovalConflictWeakness[];
}): readonly ApprovalConflictWeakness[] {
  const generated: ApprovalConflictWeakness[] = [];
  for (const item of input.errors) {
    if (item.code.includes("DEPENDENCY")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("dependency-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_DEPENDENCY_REVOCATION_RISK",
        severity: "CRITICAL",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("dependency-risk", item),
      }));
      continue;
    }
    if (item.code.includes("STALE") || item.code.includes("REPLAY")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("replay-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_REPLAY_BREAK_RISK",
        severity: "CRITICAL",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("replay-risk", item),
      }));
      continue;
    }
    if (item.code.includes("GOVERNANCE")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("governance-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_GOVERNANCE_LINKAGE_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("governance-risk", item),
      }));
      continue;
    }
    if (item.code.includes("INHERITANCE")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("inheritance-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_INHERITANCE_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("inheritance-risk", item),
      }));
      continue;
    }
    if (item.code.includes("CIRCULAR")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("circular-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_CIRCULAR_CHAIN_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("circular-risk", item),
      }));
      continue;
    }
    if (item.code.includes("ISOLATION") || item.code.includes("RUNTIME") || item.code.includes("HIDDEN")) {
      generated.push(Object.freeze({
        weaknessId: hashApprovalConflictValue("isolation-risk-id", item),
        conflictId: input.conflictInput.conflictId,
        classification: "APPROVAL_ISOLATION_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: item.message,
        advisoryOnly: true,
        deterministicHash: hashApprovalConflictValue("isolation-risk", item),
      }));
    }
  }
  return Object.freeze(
    [...input.inheritedWeaknesses, ...generated].sort((left, right) =>
      left.deterministicHash.localeCompare(right.deterministicHash),
    ),
  );
}
