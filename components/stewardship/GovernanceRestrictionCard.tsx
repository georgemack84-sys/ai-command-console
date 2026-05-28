import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

export function GovernanceRestrictionCard({
  decision,
}: {
  decision: RecoveryDecisionIntelligenceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Governance Restrictions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Approval: {decision.requiresApproval ? "required" : "not required"}</p>
        <p>Escalation: {decision.requiresEscalation ? "required" : "not required"}</p>
        <p>Containment: {decision.requiresContainment ? "required" : "not required"}</p>
        <p>Risk: {Math.round(decision.riskScore * 100)}%</p>
      </CardContent>
    </Card>
  );
}
