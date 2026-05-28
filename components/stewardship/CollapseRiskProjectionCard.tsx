import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SimulationForecastSummary } from "@/services/simulation/simulationTypes";

export function CollapseRiskProjectionCard({
  forecasting,
}: {
  forecasting: SimulationForecastSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collapse Risk Projection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{Math.round(forecasting.collapseRisk * 100)}%</p>
        <p>Containment pressure: {Math.round(forecasting.containmentPressure * 100)}%</p>
        <p>Governance instability: {Math.round(forecasting.governanceInstabilityRisk * 100)}%</p>
        <p>Advisory only: {forecasting.advisoryOnly ? "yes" : "no"}</p>
      </CardContent>
    </Card>
  );
}
