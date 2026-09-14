import { prisma } from "@/src/server/db/prisma";

export async function getNuruPrivacySettings(userId: string) {
  return prisma.nuruPrivacySettings.upsert({ where: { userId }, create: { userId }, update: {} });
}

export async function setNuruPersonalizationPaused(userId: string, personalizationPaused: boolean) {
  return prisma.nuruPrivacySettings.upsert({ where: { userId }, create: { userId, personalizationPaused }, update: { personalizationPaused } });
}

export async function clearNuruData(userId: string, scope: "signals" | "feedback" | "saved") {
  if (scope === "signals") return prisma.nuruTasteSignal.deleteMany({ where: { userId } });
  if (scope === "saved") return prisma.nuruUserDiscoveryPreference.updateMany({ where: { userId }, data: { savedAt: null } });
  return prisma.nuruUserDiscoveryPreference.updateMany({ where: { userId }, data: { affinity: null, dismissedAt: null } });
}

export async function exportNuruData(userId: string) {
  const [settings, signals, preferences, rabbitHoles, editions] = await Promise.all([
    getNuruPrivacySettings(userId),
    prisma.nuruTasteSignal.findMany({ where: { userId } }),
    prisma.nuruUserDiscoveryPreference.findMany({
      where: { userId },
      include: { discovery: { select: { id: true, title: true } } },
    }),
    prisma.nuruRabbitHoleProgress.findMany({
      where: { userId },
      include: { rabbitHole: { select: { id: true, title: true } } },
    }),
    prisma.nuruDailyEdition.findMany({
      orderBy: { editionAt: "desc" },
      take: 14,
      include: { items: { orderBy: { position: "asc" }, include: { discovery: { select: { id: true, title: true } } } } },
    }),
  ]);
  return { exportedAt: new Date().toISOString(), personalization: settings, tasteSignals: signals, discoveryFeedback: preferences, rabbitHoleProgress: rabbitHoles, recentEditions: editions };
}
