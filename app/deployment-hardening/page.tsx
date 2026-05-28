import { requireSessionUser } from "@/src/lib/auth";
import { DeploymentHardeningDashboard } from "@/components/deployment-hardening/DeploymentHardeningDashboard";
import { buildDeploymentHardeningReadModel } from "@/services/deployment-hardening/deploymentHardeningReadModel";

export const dynamic = "force-dynamic";

export default async function DeploymentHardeningPage() {
  await requireSessionUser();
  const model = buildDeploymentHardeningReadModel();

  return <DeploymentHardeningDashboard model={model} />;
}
