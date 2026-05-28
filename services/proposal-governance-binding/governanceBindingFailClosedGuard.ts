import type { ProposalGovernanceBinding, ProposalGovernanceBindingError, GovernanceBindingResult } from "./governanceBindingTypes";

export function resolveGovernanceBindingStatus(input: {
  errors: readonly ProposalGovernanceBindingError[];
  freezeStatus: string;
  revocationStatus: string;
}): GovernanceBindingResult["status"] {
  if (input.errors.length > 0) {
    return "FAILED_CLOSED";
  }
  if (input.revocationStatus === "CASCADE_COMPLETED") {
    return "REVOKED";
  }
  if (input.freezeStatus === "FROZEN" || input.freezeStatus === "PERMANENTLY_FROZEN") {
    return "FROZEN";
  }
  return "BOUND";
}

export function resolveBindingStateForArtifact(status: GovernanceBindingResult["status"]): ProposalGovernanceBinding["bindingStatus"] {
  switch (status) {
    case "FAILED_CLOSED":
      return "INVALID";
    case "BOUND":
    case "FROZEN":
    case "REVOKED":
      return status;
    case "DISPUTED":
    case "INVALID":
      return status;
    default:
      return "DISPUTED";
  }
}
