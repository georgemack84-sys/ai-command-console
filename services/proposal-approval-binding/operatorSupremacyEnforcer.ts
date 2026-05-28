import type {
  OperatorOverrideBinding,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";

const ALLOWED_DISPOSITIONS = new Set([
  "REVIEW_ONLY",
  "FREEZE",
  "REVOKE",
  "DENY_ADMISSIBILITY",
]);

export function enforceOperatorSupremacy(
  overrideBinding?: OperatorOverrideBinding,
): readonly ProposalApprovalBindingError[] {
  if (!overrideBinding) {
    return Object.freeze([]);
  }

  if (!ALLOWED_DISPOSITIONS.has(overrideBinding.disposition)) {
    return Object.freeze([{
      code: "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED",
      message: "Operator override requested an unsupported disposition.",
      path: "operatorOverrideRequest.disposition",
    } satisfies ProposalApprovalBindingError]);
  }

  return Object.freeze([]);
}
