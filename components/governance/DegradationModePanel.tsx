import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function DegradationModePanel({
  degradationMode,
  autonomyLevel,
  blockedReasons,
}: {
  degradationMode: string;
  autonomyLevel: string;
  blockedReasons: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Degradation Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{degradationMode}</p>
        <p>Autonomy level: {autonomyLevel}</p>
        <p>Blocked reasons: {blockedReasons.length ? blockedReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
