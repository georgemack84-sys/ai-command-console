import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ReplayPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="replay">
      <CardHeader><CardTitle>Replay</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Replay state: {view.replay.data.replayState}</p>
        <p>Replay id: {view.replay.data.replayId}</p>
        <p>Integrity: {view.replay.data.integrityValid ? "valid" : "disputed"}</p>
        <p>Divergence: {view.replay.data.driftTypes.length ? view.replay.data.driftTypes.join(", ") : "none visible"}</p>
        <p>Branches visible: {view.replay.data.branchVisible ? "yes" : "no"}</p>
      </CardContent>
    </Card>
  );
}
