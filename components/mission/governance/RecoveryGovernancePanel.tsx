import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function RecoveryGovernancePanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="recovery-governance">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.recoveryAuthorization.decision}</p>
        <p>Approval required: {view.recoveryAuthorization.approvalRequired ? "yes" : "no"}</p>
        <p>Blast radius: {view.recoveryAuthorization.blastRadius}</p>
        <p>Blocked: {view.recoveryAuthorization.blockedReasons.join(", ") || "none"}</p>
      </div>
    </Card>
  );
}
