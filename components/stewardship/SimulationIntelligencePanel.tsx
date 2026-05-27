import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SimulationForecastSummary } from "@/services/simulation/simulationTypes";

export function SimulationIntelligencePanel({
  forecasting,
}: {
  forecasting: SimulationForecastSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Generated simulations: {forecasting.simulations.length}</p>
        <p>Degradation reasons: {forecasting.confidenceDegradationReasons.length ? forecasting.confidenceDegradationReasons.join(", ") : "none"}</p>
        <p>Projected escalations: {forecasting.simulations.flatMap((simulation) => simulation.projectedEscalations).length}</p>
        <p>Lineage: {forecasting.simulations[0]?.forecastLineage.join(", ") || "none"}</p>
      </CardContent>
    </Card>
  );
}
