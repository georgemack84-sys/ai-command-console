import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { StrategicForecast } from "@/services/executive/strategicContinuityForecast";

const SERIES: Array<{ key: keyof StrategicForecast; label: string }> = [
  { key: "survivabilityProjection", label: "Survivability" },
  { key: "degradationTrend", label: "Degradation" },
  { key: "collapseRisk", label: "Collapse" },
  { key: "stabilizationProbability", label: "Stabilization" },
];

export function SurvivabilityForecastChart({
  forecast,
}: {
  forecast: StrategicForecast;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survivability Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {SERIES.map((series) => {
          const value = Number(forecast[series.key]);
          return (
            <div key={series.key} className="space-y-1">
              <div className="flex justify-between text-sm text-slate-300">
                <span>{series.label}</span>
                <span>{Math.round(value * 100)}%</span>
              </div>
              <div className="h-2 rounded bg-white/10">
                <div className="h-2 rounded bg-sky-400" style={{ width: `${Math.max(6, Math.round(value * 100))}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
