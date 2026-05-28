export function determineIsolationBoundaries(input: {
  unstableDomains: string[];
  failingDomains: string[];
  dependencyCollapseRisk: number;
  tenantSurvivabilityRisk: number;
}) {
  const isolatedDomains = Array.from(new Set([...input.unstableDomains, ...input.failingDomains])).sort();
  const quarantinedDomains = input.tenantSurvivabilityRisk >= 0.72
    ? Array.from(new Set(input.failingDomains)).sort()
    : [];
  const degradedDomains = input.dependencyCollapseRisk >= 0.55
    ? Array.from(new Set(input.unstableDomains)).sort()
    : [];

  return {
    isolatedDomains,
    quarantinedDomains,
    degradedDomains,
  };
}
