import { prisma } from "@/src/server/db/prisma";
import { tasteMapNodes, type TasteMapAction } from "@/src/nuru/dashboard";

async function ensureTasteSignals(userId: string) {
  await prisma.nuruTasteSignal.createMany({
    data: tasteMapNodes.map((node) => ({ userId, nodeId: node.id, label: node.label, cluster: node.cluster, score: node.score })),
    skipDuplicates: true,
  });
}

export async function getTasteMap(userId: string) {
  await ensureTasteSignals(userId);
  return prisma.nuruTasteSignal.findMany({ where: { userId }, orderBy: { score: "desc" }, select: { nodeId: true, label: true, cluster: true, score: true, isActive: true, confirmedAt: true } });
}

export async function recordTasteMapAction(userId: string, action: TasteMapAction) {
  await ensureTasteSignals(userId);
  const node = tasteMapNodes.find((item) => item.id === action.nodeId);
  if (!node) return null;
  await prisma.nuruTasteSignal.update({
    where: { userId_nodeId: { userId, nodeId: action.nodeId } },
    data: action.type === "confirm" ? { isActive: true, confirmedAt: new Date() } : { isActive: false, confirmedAt: null },
  });
  return getTasteMap(userId);
}
