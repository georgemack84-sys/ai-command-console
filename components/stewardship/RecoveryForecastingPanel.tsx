import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SimulationForecastSummary } from "@/services/simulation/simulationTypes";

export function RecoveryForecastingPanel({
  forecasting,
}: {
  forecasting: SimulationForecastSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Forecasting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">Simulations: {forecasting.simulations.length}</p>
        <p>Collapse risk: {Math.round(forecasting.collapseRisk * 100)}%</p>
        <p>Operational trust: {Math.round(forecasting.operationalTrustProjection * 100)}%</p>
        <p>Containment pressure: {Math.round(forecasting.containmentPressure * 100)}%</p>
        <p>Evidence sufficient: {forecasting.evidenceSufficient ? "yes" : "no"}</p>
      </CardContent>
    </Card>
  );
}
