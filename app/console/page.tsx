import { requireSessionUser } from "@/src/lib/auth";
import Terminal from "@/src/components/Terminal";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  await requireSessionUser();
  return <Terminal />;
}
