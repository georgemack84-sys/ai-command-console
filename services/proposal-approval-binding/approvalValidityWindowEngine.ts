import type {
  ApprovalValidityWindow,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";

export function validateApprovalValidityWindow(input: {
  validityWindow: ApprovalValidityWindow;
  evaluatedAt: string;
}): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];

  if (input.validityWindow.ambiguous) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_VALIDITY_WINDOW_AMBIGUOUS",
      message: "Approval validity window cannot be ambiguous.",
      path: "validityWindow.ambiguous",
    });
  }

  if (input.validityWindow.validFrom > input.validityWindow.validUntil) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_VALIDITY_WINDOW_AMBIGUOUS",
      message: "Approval validity window must preserve deterministic temporal ordering.",
      path: "validityWindow",
    });
  }

  if (
    input.evaluatedAt < input.validityWindow.validFrom
    || input.evaluatedAt > input.validityWindow.validUntil
  ) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_VALIDITY_WINDOW_AMBIGUOUS",
      message: "Approval evaluation falls outside the immutable validity window.",
      path: "evaluatedAt",
    });
  }

  return Object.freeze(errors);
}
