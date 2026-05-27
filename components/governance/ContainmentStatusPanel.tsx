import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ContainmentStatusPanel({
  containmentState,
  recommendedAction,
  containmentEffectiveness,
  containmentRequired,
  operatorInterventionRequired,
}: {
  containmentState: string;
  recommendedAction: string;
  containmentEffectiveness: number;
  containmentRequired: boolean;
  operatorInterventionRequired: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Containment Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{containmentState}</p>
        <p>Recommended action: {recommendedAction}</p>
        <p>Effectiveness: {Math.round(containmentEffectiveness * 100)}%</p>
        <p>Containment required: {containmentRequired ? "yes" : "no"}</p>
        <p>Operator intervention: {operatorInterventionRequired ? "required" : "not required"}</p>
      </CardContent>
    </Card>
  );
}
