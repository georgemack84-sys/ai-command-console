import { prisma } from "@/src/server/db/prisma";
import { applyNuruAction, discoveries, emptyPreferences, type NuruAction, type NuruPreferenceState } from "@/src/nuru/dashboard";

const categoryByLabel = {
  "Near certain": "near_certain",
  Adjacent: "adjacent",
  Serendipity: "serendipity",
  Wildcard: "wildcard",
} as const;

const seedDiscoveries = [
  ...discoveries.map((discovery) => ({
    ...discovery,
    category: categoryByLabel[discovery.kind],
    imageKey: discovery.image,
  })),
  {
    id: "billion-dollar-spy",
    title: "The Billion Dollar Spy",
    meta: "Book · David E. Hoffman · 2015",
    score: 86,
    image: "featured",
    category: "featured" as const,
    imageKey: "featured",
  },
] as const;

export async function ensureNuruDiscoveries() {
  await Promise.all(seedDiscoveries.map(({ id, title, meta, score, category, imageKey }) =>
    prisma.nuruDiscovery.upsert({
      where: { id },
      create: { id, title, meta, matchScore: score, category, imageKey, isPublished: true, publishedAt: new Date() },
      update: { title, meta, matchScore: score, category, imageKey },
    }),
  ));
}

export async function getNuruPreferences(userId: string): Promise<NuruPreferenceState> {
  await ensureNuruDiscoveries();
  const [preferences, feedback] = await Promise.all([
    prisma.nuruUserDiscoveryPreference.findMany({
      where: { userId },
      select: { discoveryId: true, savedAt: true, dismissedAt: true, affinity: true },
    }),
    prisma.nuruInsightFeedback.findUnique({ where: { userId }, select: { value: true } }),
  ]);

  return {
    savedDiscoveryIds: preferences.filter((item) => item.savedAt).map((item) => item.discoveryId),
    dismissedDiscoveryIds: preferences.filter((item) => item.dismissedAt).map((item) => item.discoveryId),
    noticeFeedback: feedback?.value === "explore" || feedback?.value === "not-really" ? feedback.value : null,
    affinities: Object.fromEntries(preferences.filter((item) => item.affinity === "more" || item.affinity === "less").map((item) => [item.discoveryId, item.affinity])) as Record<string, "more" | "less">,
  };
}

export async function recordNuruAction(userId: string, action: NuruAction): Promise<NuruPreferenceState> {
  await ensureNuruDiscoveries();
  if (action.type === "notice-feedback") {
    await prisma.nuruInsightFeedback.upsert({
      where: { userId },
      create: { userId, value: action.value },
      update: { value: action.value },
    });
    return getNuruPreferences(userId);
  }

  if (action.type === "set-affinity") {
    await prisma.nuruUserDiscoveryPreference.upsert({
      where: { userId_discoveryId: { userId, discoveryId: action.discoveryId } },
      create: { userId, discoveryId: action.discoveryId, affinity: action.value },
      update: { affinity: action.value },
    });
    return getNuruPreferences(userId);
  }

  const current = await getNuruPreferences(userId);
  const next = applyNuruAction(current, action);
  const isSaved = next.savedDiscoveryIds.includes(action.discoveryId);
  const isDismissed = next.dismissedDiscoveryIds.includes(action.discoveryId);
  await prisma.nuruUserDiscoveryPreference.upsert({
    where: { userId_discoveryId: { userId, discoveryId: action.discoveryId } },
    create: { userId, discoveryId: action.discoveryId, savedAt: isSaved ? new Date() : null, dismissedAt: isDismissed ? new Date() : null },
    update: { savedAt: isSaved ? new Date() : null, dismissedAt: isDismissed ? new Date() : null },
  });
  return getNuruPreferences(userId);
}

export async function getSavedNuruDiscoveries(userId: string) {
  await ensureNuruDiscoveries();
  return prisma.nuruUserDiscoveryPreference.findMany({
    where: { userId, savedAt: { not: null } },
    orderBy: { savedAt: "desc" },
    select: {
      discovery: { select: { id: true, title: true, meta: true, category: true, matchScore: true, imageKey: true } },
    },
  });
}

export const defaultNuruPreferences = emptyPreferences;
