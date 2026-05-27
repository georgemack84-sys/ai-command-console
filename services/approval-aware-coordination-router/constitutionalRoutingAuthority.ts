import type { ConstitutionalRoutingAuthority } from "@/types/approval-aware-coordination-router";

export function buildRoutingAuthorityContract(): ConstitutionalRoutingAuthority {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    governanceMutationAuthority: false,
    runtimeMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
  });
}
