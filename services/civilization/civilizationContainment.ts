export function buildCivilizationContainment(input: {
  inheritedContainmentState: string;
  isolatedSystems: string[];
  frozenSystems: string[];
  containmentPressure: number;
  createdAt: number;
}) {
  return {
    containmentId: `civilization-containment:${input.createdAt}`,
    containmentState: input.inheritedContainmentState,
    isolatedSystems: input.isolatedSystems,
    frozenSystems: input.frozenSystems,
    containmentPressure: input.containmentPressure,
    containmentBypassAllowed: false as const,
    advisoryOnly: true as const,
  };
}
