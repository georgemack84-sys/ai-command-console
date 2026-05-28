import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function AutonomousCoordinationPanel({
  coordinationChains,
  supervisedActions,
  deniedActions,
  escalationChains,
  oversightRequirements,
  approvalDependencies,
  coordinationFreezes,
  containmentRouting,
  supervisoryInterventions,
}: {
  coordinationChains: string[];
  supervisedActions: string[];
  deniedActions: string[];
  escalationChains: string[];
  oversightRequirements: string[];
  approvalDependencies: string[];
  coordinationFreezes: string[];
  containmentRouting: string[];
  supervisoryInterventions: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomous Coordination</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Chains: {coordinationChains.length ? coordinationChains.join(", ") : "none"}</p>
        <p>Supervised actions: {supervisedActions.length ? supervisedActions.join(", ") : "none"}</p>
        <p>Denied actions: {deniedActions.length ? deniedActions.join(", ") : "none"}</p>
        <p>Escalation chains: {escalationChains.length ? escalationChains.join(", ") : "none"}</p>
        <p>Oversight: {oversightRequirements.length ? oversightRequirements.join(", ") : "none"}</p>
        <p>Approvals: {approvalDependencies.length ? approvalDependencies.join(", ") : "none"}</p>
        <p>Coordination freezes: {coordinationFreezes.length ? coordinationFreezes.join(", ") : "none"}</p>
        <p>Containment routing: {containmentRouting.length ? containmentRouting.join(", ") : "none"}</p>
        <p>Supervisory interventions: {supervisoryInterventions.length ? supervisoryInterventions.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
