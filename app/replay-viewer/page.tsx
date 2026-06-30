import { ReplayViewerShell } from "@/components/replay-viewer/ReplayViewerShell";
import { buildReplayViewerView } from "@/services/replay-viewer";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReplayViewerPage() {
  const user = await requireSessionUser();
  const view = buildReplayViewerView({
    operator_id: user.id || "operator_console",
    tenant_id: "tenant_alpha",
    mission_id: "mission_query_layer",
    access_level: "RESTRICTED_READ",
  });

  return <ReplayViewerShell view={view} />;
}
