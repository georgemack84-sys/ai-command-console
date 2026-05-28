import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SimulationForecastSummary } from "@/services/simulation/simulationTypes";

export function ForecastComparisonPanel({
  forecasting,
}: {
  forecasting: SimulationForecastSummary;
}) {
  const top = forecasting.simulations.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {top.map((simulation) => (
          <div key={simulation.simulationId} className="space-y-1">
            <p className="text-white">{simulation.simulationType}</p>
            <p>Outcome: {simulation.projectedOutcome}</p>
            <p>Confidence: {Math.round(simulation.confidenceScore * 100)}%</p>
            <p>Uncertainty: {simulation.uncertaintyLevel}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
