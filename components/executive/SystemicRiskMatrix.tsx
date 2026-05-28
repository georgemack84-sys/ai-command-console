import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function SystemicRiskMatrix({
  systemicRisk,
  collapseProbability,
  containmentLoad,
  governanceStress,
}: {
  systemicRisk: number;
  collapseProbability: number;
  containmentLoad: number;
  governanceStress: number;
}) {
  const values = [systemicRisk, collapseProbability, containmentLoad, governanceStress];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Systemic Risk Matrix</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm text-slate-300">
        {values.map((value, index) => (
          <div key={index} className="rounded border border-white/10 p-3">
            <p>{Math.round(value * 100)}%</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
