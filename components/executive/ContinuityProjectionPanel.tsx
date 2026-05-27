import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { StrategicForecast } from "@/services/executive/strategicContinuityForecast";

export function ContinuityProjectionPanel({
  forecast,
}: {
  forecast: StrategicForecast;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continuity Projection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Projected containment load: {Math.round(forecast.projectedContainmentLoad * 100)}%</p>
        <p>Governance stress: {Math.round(forecast.governanceStressProjection * 100)}%</p>
        <p>Generated at: {new Date(forecast.generatedAt).toISOString()}</p>
      </CardContent>
    </Card>
  );
}
