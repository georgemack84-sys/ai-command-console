export function buildCivilizationContinuity(input: {
  survivabilityConfidence: number;
  continuityProjection: number;
  isolatedSystems: string[];
  protectedDomains: string[];
  createdAt: number;
}) {
  return {
    lineageId: `civilization-continuity:${input.createdAt}`,
    continuityState: input.continuityProjection >= 0.6 ? "CONTINUITY_PRESERVED" : "CONTINUITY_AT_RISK",
    continuityProjection: input.continuityProjection,
    continuityPreserved: input.survivabilityConfidence >= 0.55 && input.continuityProjection >= 0.55,
    isolatedSystems: input.isolatedSystems,
    protectedDomains: input.protectedDomains,
    advisoryOnly: true as const,
  };
}
