import nextDynamic from "next/dynamic";
import { requireSessionUser } from "@/src/lib/auth";

const ReportsPageClient = nextDynamic(() => import("@/src/components/research-desk/reports-page-client").then((module) => module.ReportsPageClient));

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireSessionUser();

  return <ReportsPageClient />;
}
