import { requireSessionUser } from "@/src/lib/auth";
import { BriefDetailPageClient } from "@/src/components/research-desk/brief-detail-page-client";

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionUser();
  const { id } = await params;

  return <BriefDetailPageClient briefId={id} />;
}
