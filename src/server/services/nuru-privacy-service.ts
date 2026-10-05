import { prisma } from "@/src/server/db/prisma";

export async function getNuruPrivacySettings(userId: string) {
  return prisma.nuruPrivacySettings.upsert({ where: { userId }, create: { userId }, update: {} });
}

export async function setNuruPersonalizationPaused(userId: string, personalizationPaused: boolean) {
  return prisma.nuruPrivacySettings.upsert({ where: { userId }, create: { userId, personalizationPaused }, update: { personalizationPaused } });
}

export type NuruDataClearScope = "signals" | "feedback" | "saved" | "personalization";

/** Clears only user-owned Nuru personalization data; shared discovery sources remain intact. */
export async function clearNuruData(userId: string, scope: NuruDataClearScope) {
  if (scope === "signals") return prisma.nuruTasteSignal.deleteMany({ where: { userId } });
  if (scope === "saved") return prisma.nuruUserDiscoveryPreference.updateMany({ where: { userId }, data: { savedAt: null } });
  if (scope === "feedback") {
    const [legacyPreferences, editionFeedback] = await prisma.$transaction([
      prisma.nuruUserDiscoveryPreference.updateMany({ where: { userId }, data: { affinity: null, dismissedAt: null } }),
      prisma.nuruPersonalEditionFeedback.deleteMany({ where: { userId } }),
    ]);
    return { legacyPreferences, editionFeedback };
  }
  const [tasteSignals, interviewResponses, profileSignals, editionFeedback, editions, discoveryFeedback, topicPreferences, rabbitHoleProgress] = await prisma.$transaction([
    prisma.nuruTasteSignal.deleteMany({ where: { userId } }),
    prisma.nuruTasteInterviewResponse.deleteMany({ where: { userId } }),
    prisma.nuruTasteProfileSignal.deleteMany({ where: { userId } }),
    prisma.nuruPersonalEditionFeedback.deleteMany({ where: { userId } }),
    prisma.nuruPersonalEdition.deleteMany({ where: { userId } }),
    prisma.nuruUserDiscoveryPreference.updateMany({ where: { userId }, data: { affinity: null, dismissedAt: null } }),
    prisma.nuruDiscoverTopicPreference.deleteMany({ where: { userId } }),
    prisma.nuruRabbitHoleProgress.deleteMany({ where: { userId } }),
  ]);
  return { tasteSignals, interviewResponses, profileSignals, editionFeedback, editions, discoveryFeedback, topicPreferences, rabbitHoleProgress };
}

export async function exportNuruData(userId: string) {
  const [settings, signals, interviewResponses, profileSignals, preferences, rabbitHoles, editions, personalEditions, personalEditionFeedback] = await Promise.all([
    getNuruPrivacySettings(userId),
    prisma.nuruTasteSignal.findMany({ where: { userId } }),
    prisma.nuruTasteInterviewResponse.findMany({ where: { userId }, orderBy: { updatedAt: "asc" } }),
    prisma.nuruTasteProfileSignal.findMany({ where: { userId }, include: { evidence: { orderBy: { createdAt: "asc" } } } }),
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
    prisma.nuruPersonalEdition.findMany({
      where: { userId }, orderBy: { editionDate: "desc" }, take: 30,
      include: { items: { orderBy: { position: "asc" }, include: { candidate: { select: { id: true, title: true, source: true } } } } },
    }),
    prisma.nuruPersonalEditionFeedback.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  return { exportedAt: new Date().toISOString(), personalization: settings, tasteSignals: signals, tasteInterviewResponses: interviewResponses, tasteProfileSignals: profileSignals, discoveryFeedback: preferences, rabbitHoleProgress: rabbitHoles, recentEditions: editions, personalEditions, personalEditionFeedback };
}
