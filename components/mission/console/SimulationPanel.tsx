import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function SimulationPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="simulation">
      <CardHeader><CardTitle>Simulation</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p className="text-white">Read only: yes</p>
        {view.simulation.data.branchOutcomes.map((outcome) => (
          <p key={outcome}>{outcome}</p>
        ))}
      </CardContent>
    </Card>
  );
}
