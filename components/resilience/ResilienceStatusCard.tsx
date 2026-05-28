import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ResilienceStatusCard(props: {
  resilienceState: string;
  constitutionalIntegrity: number;
  survivabilityConfidence: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resilience Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{props.resilienceState}</p>
        <p>Constitutional integrity: {Math.round(props.constitutionalIntegrity * 100)}%</p>
        <p>Survivability confidence: {Math.round(props.survivabilityConfidence * 100)}%</p>
      </CardContent>
    </Card>
  );
}
