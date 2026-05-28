import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { GovernancePressureMatrix as GovernancePressureMatrixModel } from "@/services/executive/governancePressureAnalysis";

const METRICS: Array<keyof GovernancePressureMatrixModel> = [
  "governanceIntegrity",
  "escalationPressure",
  "approvalBacklog",
  "containmentPressure",
  "survivabilityPressure",
  "autonomyPressure",
  "operationalRisk",
  "constitutionalStability",
];

export function GovernancePressureMatrix({
  matrix,
}: {
  matrix: GovernancePressureMatrixModel;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Pressure Matrix</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 text-sm text-slate-300">
        {METRICS.map((metric) => (
          <div key={metric} className="rounded border border-white/10 p-3">
            <p className="text-white">{metric}</p>
            <p>{Math.round(matrix[metric] * 100)}%</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
