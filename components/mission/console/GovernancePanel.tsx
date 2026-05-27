import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function GovernancePanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="governance">
      <CardHeader><CardTitle>Governance</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Final decision: {view.governance.data.finalDecision}</p>
        <p>Denial reasons: {view.governance.data.denialReasons.length ? view.governance.data.denialReasons.join(", ") : "none"}</p>
        <p>Enforcement chain: {view.governance.data.enforcementChain.length ? view.governance.data.enforcementChain.join(" → ") : "none"}</p>
        <p>Intervention points: {view.governance.data.interventionPoints.join(", ")}</p>
      </CardContent>
    </Card>
  );
}
