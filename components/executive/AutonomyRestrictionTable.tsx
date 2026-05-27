import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function AutonomyRestrictionTable({
  deniedActions,
  requiredOversight,
}: {
  deniedActions: string[];
  requiredOversight: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomy Restriction Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Denied actions: {deniedActions.length ? deniedActions.join(", ") : "none"}</p>
        <p>Required oversight: {requiredOversight.length ? requiredOversight.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
