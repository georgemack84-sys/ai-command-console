import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { SupervisoryControlView } from "@/services/stewardship/supervisoryControlView";

export function EscalationGovernancePanel({
  escalationGovernance,
  frozen,
}: {
  escalationGovernance: SupervisoryControlView["escalationGovernance"];
  frozen: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation Governance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Lineage: {escalationGovernance.escalationLineage.length ? escalationGovernance.escalationLineage.join(", ") : "none"}</p>
        <p>Emergency escalations: {escalationGovernance.emergencyEscalations.length}</p>
        <p>Governance escalations: {escalationGovernance.governanceEscalations.length}</p>
        <p>Constitutional disputes: {escalationGovernance.constitutionalDisputes.length}</p>
        <p>Containment: {escalationGovernance.containmentStatus}</p>
        <p>Frozen: {frozen ? "yes" : "no"}</p>
      </CardContent>
    </Card>
  );
}
