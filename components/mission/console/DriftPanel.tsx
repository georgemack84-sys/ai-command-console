import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function DriftPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="drift">
      <CardHeader><CardTitle>Drift</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Inspection result: {view.drift.data.result}</p>
        <p>Drift class: {view.drift.data.driftClass}</p>
        <p>Replay valid: {view.drift.data.replayValid ? "yes" : "no"}</p>
        <p>Hash mismatch: {view.drift.data.hashMismatch ? "yes" : "no"}</p>
        <p>Changed paths: {view.drift.data.changedPaths.length ? view.drift.data.changedPaths.join(", ") : "none"}</p>
      </CardContent>
    </Card>
  );
}
