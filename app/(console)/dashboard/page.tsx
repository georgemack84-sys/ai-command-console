import nextDynamic from "next/dynamic";
import { requireSessionUser } from "@/src/lib/auth";

const ProductDashboard = nextDynamic(() => import("@/src/components/dashboard/product-dashboard").then((module) => module.ProductDashboard));

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireSessionUser();
  return <ProductDashboard />;
}
