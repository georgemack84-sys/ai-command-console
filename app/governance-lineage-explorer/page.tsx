import { GovernanceLineageExplorerShell } from "@/components/governance-lineage-explorer/GovernanceLineageExplorerShell";
import { buildGovernanceLineageExplorerView } from "@/services/governance-lineage-explorer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function GovernanceLineageExplorerPage() {
  const user = await requireSessionUser();
  const view = buildGovernanceLineageExplorerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_governance_001",
  });

  return <GovernanceLineageExplorerShell view={view} />;
}
