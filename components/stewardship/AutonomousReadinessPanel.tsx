import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { AutonomousRecoveryReadinessAssessment } from "@/services/readiness/readinessTypes";

export function AutonomousReadinessPanel({
  readiness,
}: {
  readiness: AutonomousRecoveryReadinessAssessment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomous Recovery Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{readiness.readinessState}</p>
        <p>Readiness score: {readiness.readinessScore}</p>
        <p>Operator approval: {readiness.requiresOperatorApproval ? "required" : "not required"}</p>
        <p>Advisory only: {readiness.advisoryOnly ? "yes" : "no"}</p>
        <p>Live autonomy: {readiness.liveAutonomyEnabled ? "enabled" : "disabled"}</p>
        <p>Blocked reasons: {readiness.autonomyBlockedReasons.length ? readiness.autonomyBlockedReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
