export function collectRecoveryDecisionEvidence(input: {
  dashboard: Record<string, any>;
  forecasting: Record<string, any>;
}): {
  dashboard: Record<string, any>;
  forecasting: Record<string, any>;
  forecastLineageIds: string[];
  evidenceSources: string[];
  immutableEvidenceValid: boolean;
} {
  const simulations = input.forecasting?.summary?.simulations || [];
  const forecastLineageIds: string[] = Array.from(new Set(
    simulations.flatMap((simulation: { forecastLineage?: string[] }) => simulation.forecastLineage || []),
  ));
  const evidenceSources: string[] = Array.from(new Set([
    ...(input.dashboard?.continuityConvergence?.evidence || []),
    ...(input.dashboard?.auditHistory || []).map((entry: Record<string, unknown>) => String(entry.id || "")).filter(Boolean).slice(0, 6),
    ...simulations.flatMap((simulation: { evidenceSources?: string[] }) => simulation.evidenceSources || []),
  ]));

  return {
    dashboard: input.dashboard,
    forecasting: input.forecasting,
    forecastLineageIds,
    evidenceSources,
    immutableEvidenceValid: !(input.dashboard?.auditHistory || []).some((entry: Record<string, unknown>) => String(entry.type || "") === "parse_error"),
  };
}
