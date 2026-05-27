import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function ReplayGovernancePanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="replay-governance">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.replayAuthority.decision}</p>
        <p>Lineage valid: {view.replayAuthority.lineageValid ? "yes" : "no"}</p>
        <p>Allowed: {view.replayAuthority.allowedOperations.join(", ") || "none"}</p>
        <p>Denied: {view.replayAuthority.deniedOperations.join(", ")}</p>
      </div>
    </Card>
  );
}
