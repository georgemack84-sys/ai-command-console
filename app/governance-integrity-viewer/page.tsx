import { GovernanceIntegrityViewerShell } from "@/components/governance-integrity-viewer/GovernanceIntegrityViewerShell";
import { buildGovernanceIntegrityViewerView } from "@/services/governance-integrity-viewer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function GovernanceIntegrityViewerPage() {
  const user = await requireSessionUser();
  const view = buildGovernanceIntegrityViewerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_governance_001",
  });

  return <GovernanceIntegrityViewerShell view={view} />;
}
