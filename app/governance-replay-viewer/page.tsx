import { GovernanceReplayViewerShell } from "@/components/governance-replay-viewer/GovernanceReplayViewerShell";
import { buildGovernanceReplayViewerView } from "@/services/governance-replay-viewer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function GovernanceReplayViewerPage() {
  const user = await requireSessionUser();
  const view = buildGovernanceReplayViewerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_governance_001",
  });

  return <GovernanceReplayViewerShell view={view} />;
}
