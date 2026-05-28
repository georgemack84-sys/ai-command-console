import type { GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validateGovernanceBindingState(input: GovernanceBindingInput): readonly ProposalGovernanceBindingError[] {
  const errors: ProposalGovernanceBindingError[] = [];
  const haystack = JSON.stringify({
    transitionReason: input.proposalStateEngineInput.transition.reason,
    metadata: input.metadata ?? {},
  }).toLowerCase();

  const checks: Array<[string, ProposalGovernanceBindingError["code"], string]> = [
    ["execute", "PROPOSAL_GOVERNANCE_BINDING_EXECUTION_SEMANTIC", "Governance binding detected hidden execution semantics."],
    ["orchestr", "PROPOSAL_GOVERNANCE_BINDING_ORCHESTRATION_SEMANTIC", "Governance binding detected hidden orchestration semantics."],
    ["schedul", "PROPOSAL_GOVERNANCE_BINDING_SCHEDULER_SEMANTIC", "Governance binding detected hidden scheduler semantics."],
    ["runtime mutation", "PROPOSAL_GOVERNANCE_BINDING_RUNTIME_MUTATION", "Governance binding detected runtime mutation semantics."],
    ["latest governance", "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION", "Governance binding detected an attempt to float to latest governance."],
  ];

  for (const [pattern, code, message] of checks) {
    if (haystack.includes(pattern)) {
      errors.push({
        code,
        message,
        path: "metadata",
      });
    }
  }

  if (input.existingBinding && input.existingBinding.proposalId === input.proposalIntegrityResult.proposal.proposalId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_DUPLICATE",
      message: "Proposal governance binding already exists and may not be silently replaced.",
      path: "existingBinding",
    });
  }

  return Object.freeze(errors);
}
