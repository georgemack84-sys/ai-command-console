import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function ConstitutionalStatusPanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="constitutional-status">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">State: {view.state}</p>
        <p>Policy snapshot: {view.policy.policySnapshotHash}</p>
        <p>Decision hash: {view.constitutionalDecisionHash}</p>
        <p>Fail closed: {view.policy.failClosed ? "yes" : "no"}</p>
      </div>
    </Card>
  );
}
