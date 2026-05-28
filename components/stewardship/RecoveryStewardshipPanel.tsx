import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SupervisoryControlView } from "@/services/stewardship/supervisoryControlView";

export function RecoveryStewardshipPanel({
  recoveryStewardship,
  resilience,
}: {
  recoveryStewardship: SupervisoryControlView["recoveryStewardship"];
  resilience: SupervisoryControlView["resilience"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Stewardship</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Supervised: {recoveryStewardship.supervisedRecoveries.length}</p>
        <p>Blocked: {recoveryStewardship.blockedRecoveries.length}</p>
        <p>Frozen chains: {recoveryStewardship.frozenRecoveryChains.length}</p>
        <p>Disputed: {recoveryStewardship.disputedOperations.length}</p>
        <p>Stabilization ops: {recoveryStewardship.activeStabilizationOperations.length}</p>
        <p>Priority order: {recoveryStewardship.recoveryPriorityOrder.length ? recoveryStewardship.recoveryPriorityOrder.join(", ") : "none"}</p>
        <p>Containment required: {resilience.requiresContainment ? "yes" : "no"}</p>
        <p>Operator intervention: {resilience.requiresOperatorIntervention ? "required" : "not required"}</p>
      </CardContent>
    </Card>
  );
}
