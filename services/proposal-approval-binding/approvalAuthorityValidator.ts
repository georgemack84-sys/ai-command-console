import type {
  AuthorityBoundary,
} from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalApprovalBindingError } from "./types/proposalApprovalBindingTypes";

const BLOCKED_TOKENS = [
  "execute",
  "schedule",
  "orchestrate",
  "orchestration",
  "mutate",
  "runtime",
  "escalate",
] as const;

export function validateApprovalAuthority(
  authorityBoundary: AuthorityBoundary,
): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];

  if (
    authorityBoundary.executionAllowed
    || authorityBoundary.schedulingAllowed
    || authorityBoundary.runtimeMutationAllowed
  ) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_AUTHORITY_MISMATCH",
      message: "Approval binding cannot preserve an authority boundary that allows execution, scheduling, or runtime mutation.",
      path: "proposalGovernanceBindingResult.authorityBoundary",
    });
  }

  const suspiciousScope = authorityBoundary.allowedScopes.find((scope) =>
    BLOCKED_TOKENS.some((token) => scope.toLowerCase().includes(token))
  );

  if (suspiciousScope) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_AUTHORITY_MISMATCH",
      message: "Approval binding detected an allowed scope with hidden execution or escalation semantics.",
      path: "proposalGovernanceBindingResult.authorityBoundary.allowedScopes",
    });
  }

  return Object.freeze(errors);
}
