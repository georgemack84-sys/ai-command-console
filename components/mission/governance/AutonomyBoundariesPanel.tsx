import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function AutonomyBoundariesPanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="autonomy-boundaries">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.autonomyBoundary.decision}</p>
        <p>Current level: {view.autonomyBoundary.currentLevel}</p>
        <p>Ceiling level: {view.autonomyBoundary.ceilingLevel}</p>
        <p>Denied operations: {view.autonomyBoundary.deniedOperations.join(", ")}</p>
      </div>
    </Card>
  );
}
