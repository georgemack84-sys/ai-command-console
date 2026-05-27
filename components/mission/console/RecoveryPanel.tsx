import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function RecoveryPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="recovery">
      <CardHeader><CardTitle>Recovery</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Readiness: {view.recovery.data.readiness}</p>
        <p>Containment: {view.recovery.data.containmentState}</p>
        <p>Risk: {view.recovery.data.risk}</p>
        <p>Blocked reasons: {view.recovery.data.blockedReasons.length ? view.recovery.data.blockedReasons.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
