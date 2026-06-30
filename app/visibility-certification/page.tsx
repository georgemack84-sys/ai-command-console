import { VisibilityCertificationGateShell } from "@/components/visibility-certification/VisibilityCertificationGateShell";
import { buildVisibilityCertificationView } from "@/services/visibility-certification";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function VisibilityCertificationPage() {
  const user = await requireSessionUser();
  const view = buildVisibilityCertificationView({
    tenant_id: "tenant_alpha",
    operator_id: user.id || "operator_console",
    certification_run_id: "visibility_cert_run_6k5_000001",
    mission_ids: ["mission_query_layer"],
  });

  return <VisibilityCertificationGateShell view={view} />;
}
