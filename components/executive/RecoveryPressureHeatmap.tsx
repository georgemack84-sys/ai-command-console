import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { GovernancePressureMatrix } from "@/services/executive/governancePressureAnalysis";

export function RecoveryPressureHeatmap({
  matrix,
}: {
  matrix: GovernancePressureMatrix;
}) {
  const values = [
    matrix.escalationPressure,
    matrix.containmentPressure,
    matrix.survivabilityPressure,
    matrix.autonomyPressure,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Pressure Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-2">
        {values.map((value, index) => (
          <div
            key={index}
            className="h-12 rounded"
            style={{ backgroundColor: `rgba(56,189,248,${Math.max(0.18, value)})` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
