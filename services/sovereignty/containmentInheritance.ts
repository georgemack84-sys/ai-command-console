export function inheritContainmentSignals(input: {
  containmentState: string;
  containmentEffectiveness: number;
  containmentRequired: boolean;
  isolatedDomains: string[];
  frozenSystems?: string[];
}) {
  return {
    containmentPressure: Number(Math.max(1 - input.containmentEffectiveness, input.containmentRequired ? 0.78 : 0.25).toFixed(4)),
    frozenSystems: Array.from(new Set([...(input.frozenSystems ?? []), ...(input.containmentState === "CONTAINED" ? input.isolatedDomains : [])])),
    unstableSystems: input.isolatedDomains,
  };
}
