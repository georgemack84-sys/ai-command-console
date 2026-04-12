import { requireSessionUser } from "@/src/lib/auth";
import { ProductDashboard } from "@/src/components/dashboard/product-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireSessionUser();
  return <ProductDashboard />;
}
