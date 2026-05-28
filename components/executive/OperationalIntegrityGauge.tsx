import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function OperationalIntegrityGauge({
  constitutionalStability,
  governanceIntegrity,
}: {
  constitutionalStability: number;
  governanceIntegrity: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Integrity Gauge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Constitutional stability: {Math.round(constitutionalStability * 100)}%</p>
        <p>Governance integrity: {Math.round(governanceIntegrity * 100)}%</p>
      </CardContent>
    </Card>
  );
}
