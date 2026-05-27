import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { StrategicForecast } from "@/services/executive/strategicContinuityForecast";

export function StrategicContinuityPanel({
  forecast,
  continuityViability,
  recoveryCapacity,
}: {
  forecast: StrategicForecast;
  continuityViability: number;
  recoveryCapacity: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Continuity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Survivability projection: {Math.round(forecast.survivabilityProjection * 100)}%</p>
        <p>Degradation velocity: {Math.round(forecast.degradationTrend * 100)}%</p>
        <p>Stabilization confidence: {Math.round(forecast.stabilizationProbability * 100)}%</p>
        <p>Escalation saturation: {Math.round(forecast.governanceStressProjection * 100)}%</p>
        <p>Collapse probability: {Math.round(forecast.collapseRisk * 100)}%</p>
        <p>Continuity viability: {Math.round(continuityViability * 100)}%</p>
        <p>Recovery capacity: {Math.round(recoveryCapacity * 100)}%</p>
        <p>Uncertainty: {Math.round(forecast.uncertaintyLevel * 100)}%</p>
      </CardContent>
    </Card>
  );
}
