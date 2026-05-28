import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function EmergencyStabilizationPanel({
  required,
  stabilizationState,
  bypassAllowed,
  blockedReasons,
}: {
  required: boolean;
  stabilizationState: string;
  bypassAllowed: boolean;
  blockedReasons: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Stabilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{stabilizationState}</p>
        <p>Required: {required ? "yes" : "no"}</p>
        <p>Bypass allowed: {bypassAllowed ? "yes" : "no"}</p>
        <p>Blocked reasons: {blockedReasons.length ? blockedReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
