import { requireSessionUser } from "@/src/lib/auth";
import { ReportsPageClient } from "@/src/components/research-desk/reports-page-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireSessionUser();

  return <ReportsPageClient />;
}
