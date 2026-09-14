import { notFound } from "next/navigation";
import { getNuruDiscoveryDetail } from "@/src/nuru/dashboard";
import { getPublishedStudioDiscovery } from "@/src/server/services/nuru-studio-service";
import { DiscoveryDetail } from "./discovery-detail";

export default async function DiscoveryPage({ params }: PageProps<"/nuru/discoveries/[id]">) {
  const { id } = await params;
  const discovery = getNuruDiscoveryDetail(id) ?? await getPublishedStudioDiscovery(id);
  if (!discovery) notFound();
  return <DiscoveryDetail discovery={discovery} />;
}
