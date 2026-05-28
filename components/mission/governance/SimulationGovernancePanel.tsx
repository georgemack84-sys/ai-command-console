import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function SimulationGovernancePanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="simulation-governance">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.simulationScope.decision}</p>
        <p>Read only: {view.simulationScope.readOnly ? "yes" : "no"}</p>
        <p>Branch visibility: {view.simulationScope.branchSimulationVisible ? "yes" : "no"}</p>
        <p>Denied: {view.simulationScope.deniedOperations.join(", ")}</p>
      </div>
    </Card>
  );
}
