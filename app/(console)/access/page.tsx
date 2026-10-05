import { AccessHistoryClient } from "@/src/components/access/access-history-client";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  await requireSessionUser();

  return <AccessHistoryClient />;
}
