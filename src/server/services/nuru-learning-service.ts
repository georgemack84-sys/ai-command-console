import { prisma } from "@/src/server/db/prisma";

export async function getNuruLearningActivity(userId: string) {
  const [preferences, signals, rabbitHoles] = await Promise.all([
    prisma.nuruUserDiscoveryPreference.findMany({ orderBy: { updatedAt: "desc" }, take: 12, where: { userId }, include: { discovery: { select: { title: true } } } }),
    prisma.nuruTasteSignal.findMany({ orderBy: { updatedAt: "desc" }, take: 8, where: { userId }, select: { label: true, score: true, isActive: true, confirmedAt: true, updatedAt: true } }),
    prisma.nuruRabbitHoleProgress.findMany({ orderBy: { updatedAt: "desc" }, take: 4, where: { userId }, include: { rabbitHole: { select: { title: true } } } }),
  ]);

  const activity = [
    ...preferences.flatMap((preference) => {
      const events: Array<{ type: string; title: string; detail: string; happenedAt: Date }> = [];
      if (preference.affinity === "more") events.push({ type: "signal", title: `More like “${preference.discovery.title}”`, detail: "Nuru will give similar themes more weight in your future editions.", happenedAt: preference.updatedAt });
      if (preference.affinity === "less") events.push({ type: "signal", title: `Less like “${preference.discovery.title}”`, detail: "Nuru will hold related discoveries more lightly.", happenedAt: preference.updatedAt });
      if (preference.savedAt) events.push({ type: "saved", title: `Saved “${preference.discovery.title}”`, detail: "This supports Nuru’s understanding of what is worth returning to.", happenedAt: preference.savedAt });
      if (preference.dismissedAt) events.push({ type: "dismissed", title: `Passed on “${preference.discovery.title}”`, detail: "Nuru will avoid treating this as a strong match.", happenedAt: preference.dismissedAt });
      return events;
    }),
    ...signals.map((signal) => ({ type: "taste", title: `${signal.isActive ? "Active" : "Quieted"} taste signal: ${signal.label}`, detail: signal.confirmedAt ? `You confirmed this pattern at ${signal.score}% strength.` : `Nuru currently sees this at ${signal.score}% strength.`, happenedAt: signal.updatedAt })),
    ...rabbitHoles.map((progress) => ({ type: "journey", title: `Continued ${progress.rabbitHole.title}`, detail: `${progress.completedSteps.length} stops explored; that momentum informs related recommendations.`, happenedAt: progress.updatedAt })),
  ].sort((left, right) => right.happenedAt.getTime() - left.happenedAt.getTime()).slice(0, 12);

  return activity.map((event) => ({ ...event, happenedAt: event.happenedAt.toISOString() }));
}
