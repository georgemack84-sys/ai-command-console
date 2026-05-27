import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function DependencyPanel({ view }: { view: MissionConsoleView }) {
  return (
    <Card id="dependencies">
      <CardHeader><CardTitle>Dependencies</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-300">
        <p>Cycle detected: {view.dependencies.data.cycleDetected ? "yes" : "no"}</p>
        <p>Unresolved: {view.dependencies.data.unresolvedDependencies.length ? view.dependencies.data.unresolvedDependencies.join(", ") : "none"}</p>
        <p>Nodes: {view.dependencies.data.nodes.length}</p>
        <p>Edges: {view.dependencies.data.edges.length}</p>
      </CardContent>
    </Card>
  );
}
