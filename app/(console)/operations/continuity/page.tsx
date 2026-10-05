import { requireSessionUser } from "@/src/lib/auth";
import { ContinuityDashboardClient } from "@/components/continuity/ContinuityDashboardClient";

export const dynamic = "force-dynamic";

export default async function ContinuityOperationsPage() {
  await requireSessionUser();

  return <ContinuityDashboardClient />;
}
