import { LedgerExplorerShell } from "@/components/ledger-explorer/LedgerExplorerShell";
import { buildLedgerExplorerView } from "@/services/ledger-explorer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function LedgerExplorerPage() {
  const user = await requireSessionUser();
  const view = buildLedgerExplorerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_query_layer",
    access_level: "RESTRICTED_READ",
  });

  return <LedgerExplorerShell view={view} />;
}
