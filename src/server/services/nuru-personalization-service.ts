import { prisma } from "@/src/server/db/prisma";

type EditionItem = { id: string; title: string; meta: string; score: number; image: string; kind: string; isFeatured: boolean };

const categorySignalWeights: Record<string, string[]> = {
  "Near Certain": ["technology-turning-points", "ingenious-solutions", "hidden-systems"],
  Adjacent: ["technology-turning-points", "competition", "human-ingenuity"],
  Serendipity: ["unusual-perspectives", "human-ingenuity", "true-stories"],
  Wildcard: ["unusual-perspectives", "hidden-systems"],
};
const categoryByKind: Record<string, "near_certain" | "adjacent" | "serendipity" | "wildcard"> = { "Near Certain": "near_certain", "Near certain": "near_certain", Adjacent: "adjacent", Serendipity: "serendipity", Wildcard: "wildcard" };

export async function personalizeEdition(userId: string, items: EditionItem[]) {
  const [settings, signals, preferences, rabbitProgress] = await Promise.all([
    prisma.nuruPrivacySettings.findUnique({ where: { userId }, select: { personalizationPaused: true } }),
    prisma.nuruTasteSignal.findMany({ where: { userId, isActive: true }, select: { nodeId: true, score: true } }),
    prisma.nuruUserDiscoveryPreference.findMany({ where: { userId }, select: { discoveryId: true, savedAt: true, dismissedAt: true, affinity: true, discovery: { select: { category: true } } } }),
    prisma.nuruRabbitHoleProgress.findMany({ where: { userId }, select: { completedSteps: true } }),
  ]);
  if (settings?.personalizationPaused) return items;
  const signalScores = new Map(signals.map((signal) => [signal.nodeId, signal.score]));
  const savedCategories = new Set(preferences.filter((preference) => preference.savedAt).map((preference) => preference.discovery.category));
  const dismissedCategories = new Set(preferences.filter((preference) => preference.dismissedAt).map((preference) => preference.discovery.category));
  const moreCategories = new Set(preferences.filter((preference) => preference.affinity === "more").map((preference) => preference.discovery.category));
  const lessCategories = new Set(preferences.filter((preference) => preference.affinity === "less").map((preference) => preference.discovery.category));
  const rabbitMomentum = Math.min(8, rabbitProgress.reduce((total, progress) => total + progress.completedSteps.length, 0));

  const weighted = items.map((item) => {
    const signalBoost = (categorySignalWeights[item.kind] ?? []).reduce((total, nodeId) => total + (signalScores.get(nodeId) ?? 0) / 30, 0);
    const databaseCategory = categoryByKind[item.kind];
    const saveBoost = databaseCategory && savedCategories.has(databaseCategory) ? 7 : 0;
    const affinityBoost = databaseCategory && moreCategories.has(databaseCategory) ? 12 : 0;
    const dismissalPenalty = databaseCategory && dismissedCategories.has(databaseCategory) ? 15 : 0;
    const affinityPenalty = databaseCategory && lessCategories.has(databaseCategory) ? 20 : 0;
    return { item, ranking: item.score + signalBoost + saveBoost + affinityBoost + rabbitMomentum - dismissalPenalty - affinityPenalty };
  });

  return weighted.sort((left, right) => Number(right.item.isFeatured) - Number(left.item.isFeatured) || right.ranking - left.ranking).map(({ item }) => item);
}
