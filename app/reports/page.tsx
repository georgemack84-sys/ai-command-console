import { requireSessionUser } from "@/src/lib/auth";
import { ReportsPageClient } from "@/src/components/research-desk/reports-page-client";

export default async function ReportsPage() {
  await requireSessionUser();

  return <ReportsPageClient />;
}
