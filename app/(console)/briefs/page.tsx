import nextDynamic from "next/dynamic";
import { requireSessionUser } from "@/src/lib/auth";

const BriefsPageClient = nextDynamic(() => import("@/src/components/research-desk/briefs-page-client").then((module) => module.BriefsPageClient));

export const dynamic = "force-dynamic";

export default async function BriefsPage() {
  await requireSessionUser();

  return <BriefsPageClient />;
}
