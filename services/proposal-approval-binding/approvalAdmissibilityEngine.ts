import type {
  ApprovalBindingStatus,
  ApprovalAdmissibilityResult,
  OperatorOverrideBinding,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";
import { hashApprovalValue } from "./approvalHashEngine";

export function resolveApprovalAdmissibility(input: {
  status: ApprovalBindingStatus;
  errors: readonly ProposalApprovalBindingError[];
  overrideBinding?: OperatorOverrideBinding;
}): ApprovalAdmissibilityResult {
  const reasons = [
    ...input.errors.map((error) => error.code),
    ...(input.overrideBinding ? [`OVERRIDE:${input.overrideBinding.disposition}`] : []),
  ];

  let status: ApprovalAdmissibilityResult["status"] = "ADMISSIBLE";
  let admissible = true;

  if (input.errors.length > 0) {
    admissible = false;
    status = input.status === "FAILED_CLOSED" ? "FAILED_CLOSED" : "DENIED";
  }

  if (input.status === "FROZEN") {
    admissible = false;
    status = "FROZEN";
  } else if (input.status === "REVOKED") {
    admissible = false;
    status = "REVOKED";
  }

  if (input.overrideBinding && input.overrideBinding.disposition !== "REVIEW_ONLY") {
    admissible = false;
    status = input.overrideBinding.disposition === "FREEZE"
      ? "FROZEN"
      : input.overrideBinding.disposition === "REVOKE"
        ? "REVOKED"
        : "DENIED";
  }

  return Object.freeze({
    admissible,
    status,
    reasons: Object.freeze(reasons),
    operatorReviewRequired: true as const,
    deterministicHash: hashApprovalValue("approval-admissibility", {
      status,
      admissible,
      reasons,
    }),
  });
}
