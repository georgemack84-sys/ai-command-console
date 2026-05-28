import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

export function EscalationGovernancePanel({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <Card id="escalation-governance">
      <div className="space-y-2 text-sm text-white/70">
        <p className="text-white">Decision: {view.escalationAuthority.decision}</p>
        <p>Pause authority: {view.escalationAuthority.pauseAuthority ? "yes" : "no"}</p>
        <p>Override eligible: {view.escalationAuthority.overrideEligible ? "yes" : "no"}</p>
        <p>Routes: {view.escalationAuthority.escalationRoutes.join(", ") || "none"}</p>
      </div>
    </Card>
  );
}
