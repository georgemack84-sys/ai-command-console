import { requireSessionUser } from "@/src/lib/auth";
import { AdvisoryDashboard } from "@/components/advisory/AdvisoryDashboard";
import { buildAdvisoryReadModel } from "@/services/advisory/advisoryReadModel";

export const dynamic = "force-dynamic";

export default async function AdvisoryPage() {
  await requireSessionUser();
  const model = buildAdvisoryReadModel();

  return <AdvisoryDashboard model={model} />;
}
