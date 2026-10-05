import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { requireSessionUser } from "@/src/lib/auth";

const WorkspaceOperationsClient = nextDynamic(() => import("@/src/components/operations/workspace-operations-client").then((module) => module.WorkspaceOperationsClient));

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireSessionUser();

  return (
    <Suspense fallback={null}>
      <WorkspaceOperationsClient />
    </Suspense>
  );
}
