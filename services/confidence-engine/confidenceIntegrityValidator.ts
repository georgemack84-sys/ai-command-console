import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type {
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function validateConfidenceIntegrity(
  input: DeterministicConfidenceInput,
): readonly DeterministicConfidenceError[] {
  const errors: DeterministicConfidenceError[] = [];
  const approvalIds = input.proposalApprovalBindingResult.approvals.map((approval) => approval.approvalId);
  const dependencyIds = input.proposalApprovalBindingResult.approvals.map((approval) => approval.dependencySnapshotId);
  const binding = input.proposalApprovalBindingResult.binding;
  const lineage = input.proposalApprovalBindingResult.lineage;
  const replayResult = input.proposalApprovalBindingResult.replayResult;

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_FAIL_CLOSED",
      message: "Existing confidence audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  if (input.proposalIntegrityResult.status === "replay_failed") {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED",
      message: "Proposal integrity replay failure blocks deterministic confidence scoring.",
      path: "proposalIntegrityResult.status",
    });
  }

  if (
    !arraysEqual(binding.approvalIds, approvalIds)
    || !arraysEqual(lineage.approvalIds, approvalIds)
    || !arraysEqual(replayResult.reconstructedApprovalIds, approvalIds)
  ) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED",
      message: "Confidence scoring detected fabricated or divergent approval lineage.",
      path: "proposalApprovalBindingResult.binding.approvalIds",
    });
  }

  if (
    !arraysEqual(binding.dependencyIds, dependencyIds)
    || !arraysEqual(lineage.dependencyIds, dependencyIds)
    || !arraysEqual(replayResult.reconstructedDependencyIds, dependencyIds)
  ) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED",
      message: "Confidence scoring detected fabricated or divergent approval dependency lineage.",
      path: "proposalApprovalBindingResult.binding.dependencyIds",
    });
  }

  return Object.freeze(errors);
}
