import { GovernanceDashboardShell } from "@/components/governance-dashboard/GovernanceDashboardShell";
import { buildGovernanceDashboardView } from "@/services/governance-dashboard";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function GovernanceDashboardPage() {
  const user = await requireSessionUser();
  const view = buildGovernanceDashboardView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_governance_001",
  });

  return <GovernanceDashboardShell view={view} />;
}
