import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function SurvivabilityRiskPanel(props: {
  collapseProbability: number;
  escalationPressure: number;
  recoverySaturation: number;
  containmentPressure: number;
  instabilityVelocity: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survivability Risk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Collapse probability: {Math.round(props.collapseProbability * 100)}%</p>
        <p>Escalation pressure: {Math.round(props.escalationPressure * 100)}%</p>
        <p>Recovery saturation: {Math.round(props.recoverySaturation * 100)}%</p>
        <p>Containment pressure: {Math.round(props.containmentPressure * 100)}%</p>
        <p>Instability velocity: {Math.round(props.instabilityVelocity * 100)}%</p>
      </CardContent>
    </Card>
  );
}
