import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

export function ConstitutionalConflictPanel({
  decision,
}: {
  decision: RecoveryDecisionIntelligenceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Conflict</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Blocked reasons: {decision.blockedReasons.length ? decision.blockedReasons.join(", ") : "none"}</p>
        <p>Forecast lineage: {decision.forecastLineageIds.length ? decision.forecastLineageIds.join(", ") : "none"}</p>
        <p>Reasons: {decision.reasons.length ? decision.reasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
