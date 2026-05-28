import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ExecutiveEscalationTimeline({
  escalationTimeline,
  escalationSaturation,
}: {
  escalationTimeline: string[];
  escalationSaturation: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Escalation Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Escalation saturation: {Math.round(escalationSaturation * 100)}%</p>
        <p>Timeline: {escalationTimeline.length ? escalationTimeline.join(" -> ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
