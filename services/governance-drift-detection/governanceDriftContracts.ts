import type { GovernanceDriftAuthorityContract } from "@/types/governance-drift";

export function buildGovernanceDriftAuthorityContract(): GovernanceDriftAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}
