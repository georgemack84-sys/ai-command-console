import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { ConstitutionalStatusPanel } from "./ConstitutionalStatusPanel";
import { AuthorityLineagePanel } from "./AuthorityLineagePanel";
import { ReplayGovernancePanel } from "./ReplayGovernancePanel";
import { SnapshotGovernancePanel } from "./SnapshotGovernancePanel";
import { SimulationGovernancePanel } from "./SimulationGovernancePanel";
import { RecoveryGovernancePanel } from "./RecoveryGovernancePanel";
import { EscalationGovernancePanel } from "./EscalationGovernancePanel";
import { AutonomyBoundariesPanel } from "./AutonomyBoundariesPanel";
import { ConstitutionalViolationsPanel } from "./ConstitutionalViolationsPanel";
import { GovernanceAuditTimelinePanel } from "./GovernanceAuditTimelinePanel";

export function ConstitutionalGovernanceSection({ view }: { view: ConstitutionalGovernanceView }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">Constitutional Governance</h2>
        <p className="text-sm text-white/60">Read-only constitutional authority checks for replay, snapshots, simulation, recovery, escalation, and autonomy boundaries.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ConstitutionalStatusPanel view={view} />
        <AuthorityLineagePanel authorityBoundaries={view.authorityBoundaries} />
        <ReplayGovernancePanel view={view} />
        <SnapshotGovernancePanel view={view} />
        <SimulationGovernancePanel view={view} />
        <RecoveryGovernancePanel view={view} />
        <EscalationGovernancePanel view={view} />
        <AutonomyBoundariesPanel view={view} />
        <ConstitutionalViolationsPanel view={view} />
        <GovernanceAuditTimelinePanel auditTimeline={view.auditTimeline} />
      </div>
    </section>
  );
}
