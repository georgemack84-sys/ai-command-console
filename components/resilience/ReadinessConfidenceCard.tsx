import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ReadinessConfidenceCard(props: {
  readinessState: string;
  readinessConfidence: number;
  constitutionalSafe: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness Confidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{props.readinessState}</p>
        <p>Readiness confidence: {Math.round(props.readinessConfidence * 100)}%</p>
        <p>Constitutional safe: {props.constitutionalSafe ? "yes" : "no"}</p>
      </CardContent>
    </Card>
  );
}
