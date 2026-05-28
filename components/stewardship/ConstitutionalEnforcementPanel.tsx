import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

export function ConstitutionalEnforcementPanel({
  decision,
}: {
  decision: RecoveryDecisionIntelligenceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constitutional Enforcement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="text-white">{decision.constitutionalAction}</p>
        <p>Allowed: {decision.constitutionallyAllowed ? "yes" : "no"}</p>
        <p>Violations: {decision.constitutionalViolations.length ? decision.constitutionalViolations.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
