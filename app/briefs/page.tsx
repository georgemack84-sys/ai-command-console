import { requireSessionUser } from "@/src/lib/auth";
import { BriefsPageClient } from "@/src/components/research-desk/briefs-page-client";

export default async function BriefsPage() {
  await requireSessionUser();

  return <BriefsPageClient />;
}
