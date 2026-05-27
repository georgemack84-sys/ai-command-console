import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function AutonomyReadinessPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autonomy Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Autonomy level visibility: {view.autonomy.autonomyLevel}</p>
        <p>Confidence visibility: {view.autonomy.confidenceLabel}</p>
        <p>Escalation visibility: {view.autonomy.escalationVisible ? "visible" : "hidden"}</p>
        <p>Simulation visibility: {view.autonomy.simulationVisible ? "visible" : "hidden"}</p>
        <p>Governance intervention visibility: {view.autonomy.governanceInterventionVisible ? "visible" : "hidden"}</p>
        <p className="text-amber-200">{view.autonomy.constitutionalRule}</p>
      </CardContent>
    </Card>
  );
}
