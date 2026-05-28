import type { MissionConsoleView } from "@/types/mission-intelligence-console";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { MissionConsoleShell } from "./MissionConsoleShell";
import { MissionConsoleNav } from "./MissionConsoleNav";
import { MissionStatusHeader } from "./MissionStatusHeader";
import { TimelinePanel } from "./TimelinePanel";
import { ReplayPanel } from "./ReplayPanel";
import { DriftPanel } from "./DriftPanel";
import { GovernancePanel } from "./GovernancePanel";
import { SnapshotPanel } from "./SnapshotPanel";
import { DependencyPanel } from "./DependencyPanel";
import { SimulationPanel } from "./SimulationPanel";
import { RecoveryPanel } from "./RecoveryPanel";
import { ApprovalPanel } from "./ApprovalPanel";
import { AutonomyReadinessPanel } from "./AutonomyReadinessPanel";
import { ConstitutionalGovernanceSection } from "@/components/mission/governance/ConstitutionalGovernanceSection";

export function MissionIntelligenceConsole({
  view,
  governanceView,
}: {
  view: MissionConsoleView;
  governanceView?: ConstitutionalGovernanceView;
}) {
  return (
    <div className="space-y-6">
      <MissionConsoleShell>
        <div className="space-y-5">
          <MissionStatusHeader view={view} />
          <MissionConsoleNav />
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <AutonomyReadinessPanel view={view} />
            <ApprovalPanel view={view} />
          </div>
        </div>
      </MissionConsoleShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <TimelinePanel entries={view.timeline.data.entries} />
        <ReplayPanel view={view} />
        <DriftPanel view={view} />
        <GovernancePanel view={view} />
        <SnapshotPanel snapshots={view.snapshots.data.snapshots} />
        <DependencyPanel view={view} />
        <SimulationPanel view={view} />
        <RecoveryPanel view={view} />
      </div>

      {governanceView ? <ConstitutionalGovernanceSection view={governanceView} /> : null}
    </div>
  );
}
