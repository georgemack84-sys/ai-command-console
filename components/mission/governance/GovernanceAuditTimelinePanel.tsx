import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { Card } from "@/src/components/ui/card";

type GovernanceAuditTimelinePanelProps = Readonly<{
  auditTimeline: ConstitutionalGovernanceView["auditTimeline"];
}>;

export function GovernanceAuditTimelinePanel({ auditTimeline }: GovernanceAuditTimelinePanelProps) {
  return (
    <Card id="governance-audit-timeline">
      <div className="space-y-2 text-sm text-white/70">
        {auditTimeline.map((record) => (
          <div key={record.recordId} className="rounded-md border border-white/10 p-3">
            <p className="text-white">{record.scope} → {record.outcome}</p>
            <p>{record.reason}</p>
            <p>Lineage hashes: {record.lineageHashes.join(", ")}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
