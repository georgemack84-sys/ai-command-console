import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SimulationForecastSummary } from "@/services/simulation/simulationTypes";

export function SimulationConfidenceCard({
  forecasting,
}: {
  forecasting: SimulationForecastSummary;
}) {
  const averageConfidence = forecasting.simulations.length
    ? forecasting.simulations.reduce((total, simulation) => total + simulation.confidenceScore, 0) / forecasting.simulations.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Confidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{Math.round(averageConfidence * 100)}%</p>
        <p>Uncertainty: {forecasting.simulations[0]?.uncertaintyLevel || "SEVERE"}</p>
        <p>Confidence degradation: {forecasting.confidenceDegradationReasons.length ? forecasting.confidenceDegradationReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
