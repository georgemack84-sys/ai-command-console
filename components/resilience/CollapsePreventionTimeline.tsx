import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function CollapsePreventionTimeline(props: {
  collapseRisk: number;
  containmentActions: string[];
  escalationActions: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collapse Prevention Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Collapse risk: {Math.round(props.collapseRisk * 100)}%</p>
        <p>Containment actions: {props.containmentActions.length ? props.containmentActions.join(", ") : "none"}</p>
        <p>Escalation actions: {props.escalationActions.length ? props.escalationActions.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
