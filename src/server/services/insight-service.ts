import { prisma } from "@/src/server/db/prisma";
import { scoreInsight } from "@/src/server/intelligence/scoring";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { createAlert } from "@/src/server/alerts/alert-service";

export async function generateWorkspaceInsights(workspaceId: string) {
  const [updates, sources, latestInsight] = await Promise.all([
    prisma.monitoredUpdate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.source.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    prisma.insight.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!updates.length) {
    return [];
  }

  const latestUpdate = updates[0];
  if (latestInsight && latestUpdate?.createdAt && latestInsight.createdAt >= latestUpdate.createdAt) {
    return [];
  }

  const scoringEnabled = await isFeatureEnabled("intelligence_scoring", workspaceId);
  const highestSeverity = updates.find((update) => update.severity === "critical" || update.severity === "high") ?? updates[0];
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const scoringSource =
    sourceMap.get(highestSeverity.sourceId) ??
    (scoringEnabled
      ? await prisma.source.findUnique({ where: { id: highestSeverity.sourceId } })
      : null);
  const scoring = scoringEnabled ? scoreInsight(highestSeverity, scoringSource) : null;
  const insight = await prisma.insight.create({
    data: {
      workspaceId,
      title: `Prioritize ${highestSeverity.category.toLowerCase()} attention in the next operator pass`,
      summary: `The current signal mix suggests focusing on ${highestSeverity.title.toLowerCase()} while ${sources.length} tracked sources remain active in the workspace.`,
      type: "recommendation",
      status: "ready",
      confidence: highestSeverity.severity === "critical" ? 92 : 78,
      score: scoring?.totalScore ?? 0,
      sourceIds: updates.map((update) => update.sourceId),
      metadata: scoring
        ? {
            scoring,
            scoredAt: new Date().toISOString(),
          }
        : undefined,
    },
  });

  if (await isFeatureEnabled("alerts_v2", workspaceId)) {
    await createAlert({
      workspaceId,
      insightId: insight.id,
      type: "insight.generated",
      title: "New insight generated",
      message: insight.title,
      severity: insight.type === "recommendation" ? "warning" : "info",
    });
  }

  return [insight];
}
