import { Suspense } from "react";
import { WorkspaceOperationsClient } from "@/src/components/operations/workspace-operations-client";
import { requireSessionUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  await requireSessionUser();

  return (
    <Suspense fallback={null}>
      <WorkspaceOperationsClient />
    </Suspense>
  );
}
