import { TruthDashboardShell } from "@/components/truth-dashboard/TruthDashboardShell";
import { buildTruthDashboardView } from "@/services/truth-dashboard";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function TruthDashboardPage() {
  const user = await requireSessionUser();
  const view = buildTruthDashboardView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_query_layer",
    access_level: "RESTRICTED_READ",
  });

  return <TruthDashboardShell view={view} />;
}
