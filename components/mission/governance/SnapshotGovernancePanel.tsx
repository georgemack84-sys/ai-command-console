import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function SnapshotGovernancePanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="snapshot-governance">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.snapshotAccess.decision}</p>
        <p>Branch authority valid: {view.snapshotAccess.branchAuthorityValid ? "yes" : "no"}</p>
        <p>Forensic visibility: {view.snapshotAccess.forensicVisibility}</p>
        <p>Visible snapshots: {view.snapshotAccess.visibleSnapshotIds.join(", ") || "none"}</p>
      </div>
    </Card>
  );
}
