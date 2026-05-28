import type { ConstitutionalReadinessAuthorityContract } from "@/types/constitutional-readiness";

export function buildReadinessAuthorityContract(): ConstitutionalReadinessAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    authorityInheritance: false,
    privilegeEscalationAuthority: false,
    adaptiveAutonomyAuthority: false,
    workflowContinuation: false,
    readinessAuthorization: false,
  });
}

export function normalizeReadinessMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}
