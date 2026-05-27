import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function AutonomousSupervisionPanel({
  supervisionState,
  boundedAutonomyStatus,
  blockedAutonomyActions,
  disputedAutonomyDecisions,
  operatorInterventions,
  supervisionEscalations,
  governanceOverrides,
  emergencyAutonomyFreeze,
}: {
  supervisionState: string;
  boundedAutonomyStatus: string;
  blockedAutonomyActions: string[];
  disputedAutonomyDecisions: string[];
  operatorInterventions: string[];
  supervisionEscalations: string[];
  governanceOverrides: string[];
  emergencyAutonomyFreeze: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomous Supervision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">{supervisionState}</p>
        <p>Bounded autonomy: {boundedAutonomyStatus}</p>
        <p>Blocked actions: {blockedAutonomyActions.length ? blockedAutonomyActions.join(", ") : "none"}</p>
        <p>Disputed decisions: {disputedAutonomyDecisions.length ? disputedAutonomyDecisions.join(", ") : "none"}</p>
        <p>Operator interventions: {operatorInterventions.length ? operatorInterventions.join(", ") : "none"}</p>
        <p>Supervision escalations: {supervisionEscalations.length ? supervisionEscalations.join(", ") : "none"}</p>
        <p>Governance overrides: {governanceOverrides.length ? governanceOverrides.join(", ") : "none"}</p>
        <p>Emergency autonomy freeze: {emergencyAutonomyFreeze ? "active" : "inactive"}</p>
      </CardContent>
    </Card>
  );
}
