import { categoryLabels } from "@/lib/news/categories";
import { headlineCategories } from "@/types/headline";

export type RegistrySnapshot = {
  name: string;
  count: number;
  supportsCrud: true;
  persistence: "memory-now-persistent-later";
  sampleKeys: string[];
};

export function getRegistrySnapshots(): RegistrySnapshot[] {
  return [
    { name: "Headline Registry", count: 0, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["headline.id", "headline.articleUrl"] },
    { name: "Source Registry", count: 4, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["source.name", "source.reputation"] },
    { name: "Category Registry", count: headlineCategories.length, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: Object.values(categoryLabels).slice(0, 3) },
    { name: "Image Registry", count: 0, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["image.url", "visualFallback.symbol"] },
    { name: "Trust Registry", count: 0, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["storyTrust.trustStanding"] },
    { name: "Capability Registry", count: 15, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["capability.id"] },
    { name: "Presentation Registry", count: 8, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["displayProfile.id"] },
    { name: "Settings Registry", count: 1, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["settings.version"] },
    { name: "Evidence Registry", count: 0, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["evidence.replayId"] },
    { name: "Replay Registry", count: 0, supportsCrud: true, persistence: "memory-now-persistent-later", sampleKeys: ["replay.id"] },
  ];
}
