import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

type AuthorityLineagePanelProps = Readonly<{
  authorityBoundaries: ConstitutionalGovernanceView["authorityBoundaries"];
}>;

export function AuthorityLineagePanel({ authorityBoundaries }: AuthorityLineagePanelProps) {
  return (
    <Card id="authority-lineage">
      <div className="space-y-2 text-sm text-white/70">
        {authorityBoundaries.map((boundary) => (
          <div key={boundary.authorityId} className="rounded-md border border-white/10 p-3">
            <p className="text-white">{boundary.authorityClass}</p>
            <p>Source: {boundary.sourceAuthority}</p>
            <p>Approval required: {boundary.requiresApproval ? "yes" : "no"}</p>
            <p>Lineage hash: {boundary.lineageHash}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
