import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function StrategicThreatMonitor({
  threatLevel,
  unstableDomains,
  uncertaintyLevel,
}: {
  threatLevel: number;
  unstableDomains: string[];
  uncertaintyLevel: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Threat Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Threat level: {Math.round(threatLevel * 100)}%</p>
        <p>Unstable domains: {unstableDomains.length ? unstableDomains.join(", ") : "none"}</p>
        <p>Forecast uncertainty: {Math.round(uncertaintyLevel * 100)}%</p>
      </CardContent>
    </Card>
  );
}
