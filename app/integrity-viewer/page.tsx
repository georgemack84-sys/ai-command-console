import { IntegrityStatusViewerShell } from "@/components/integrity-viewer/IntegrityStatusViewerShell";
import { buildIntegrityStatusViewerView } from "@/services/integrity-viewer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function IntegrityViewerPage() {
  const user = await requireSessionUser();
  const view = buildIntegrityStatusViewerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_query_layer",
    access_level: "RESTRICTED_READ",
  });

  return <IntegrityStatusViewerShell view={view} />;
}
