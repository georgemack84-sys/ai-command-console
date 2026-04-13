import { prisma } from "@/src/server/db/prisma";

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

  const highestSeverity = updates.find((update) => update.severity === "critical" || update.severity === "high") ?? updates[0];
  const insight = await prisma.insight.create({
    data: {
      workspaceId,
      title: `Prioritize ${highestSeverity.category.toLowerCase()} attention in the next operator pass`,
      summary: `The current signal mix suggests focusing on ${highestSeverity.title.toLowerCase()} while ${sources.length} tracked sources remain active in the workspace.`,
      type: "recommendation",
      status: "ready",
      confidence: highestSeverity.severity === "critical" ? 92 : 78,
      sourceIds: updates.map((update) => update.sourceId),
    },
  });

  return [insight];
}
