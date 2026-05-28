import type { ContinuityArchitecture } from "./continuityArchitecture";

export function buildProtectedOperationsView(input: {
  continuity: ContinuityArchitecture;
  protocols: {
    protocols: string[];
  };
  degradedDomains: string[];
  quarantinedDomains: string[];
}) {
  return {
    protectedDomains: input.continuity.protectedDomains,
    frozenSystems: input.continuity.frozenDomains,
    isolatedSystems: input.continuity.isolatedDomains,
    governanceProtectedSystems: input.continuity.mode === "GOVERNANCE_PROTECTED" ? input.continuity.protectedDomains : [],
    continuityPreservedSystems: input.continuity.continuityPreserved ? input.continuity.protectedDomains : [],
    degradedDomains: input.degradedDomains,
    quarantinedDomains: input.quarantinedDomains,
    protocols: input.protocols.protocols,
  };
}
