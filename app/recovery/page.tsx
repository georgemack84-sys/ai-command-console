import { requireSessionUser } from "@/src/lib/auth";
import { RecoveryDashboard } from "@/components/recovery/RecoveryDashboard";

export const dynamic = "force-dynamic";

type RecoveryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }
  return String(value || "").trim();
}

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  await requireSessionUser();
  const resolvedSearchParams = (await searchParams) || {};
  const initialExecutionId = readSearchParam(resolvedSearchParams, "executionId");

  return <RecoveryDashboard initialExecutionId={initialExecutionId} />;
}

