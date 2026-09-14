import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { ensureNuruDiscoveries } from "@/src/server/services/nuru-service";

export const nuruEditionSchema = z.object({
  discoveryIds: z.array(z.string()).length(7),
  featuredId: z.string().min(1),
})
  .refine((input) => new Set(input.discoveryIds).size === input.discoveryIds.length, {
    message: "An edition must contain seven distinct discoveries.",
    path: ["discoveryIds"],
  })
  .refine((input) => input.discoveryIds.includes(input.featuredId), {
    message: "The featured discovery must be one of the seven selections.",
    path: ["featuredId"],
  });

function editionDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function tomorrowEditionDay() {
  const tomorrow = editionDay();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

export async function prepareTomorrowEdition() {
  await ensureNuruDiscoveries();
  const candidates = await prisma.nuruDiscovery.findMany({
    where: { isPublished: true, archivedAt: null, category: { not: "featured" } },
    orderBy: [{ matchScore: "desc" }, { updatedAt: "desc" }],
    take: 7,
    select: { id: true, matchScore: true },
  });
  const reviewRequired = candidates.length !== 7;
  const editionAt = tomorrowEditionDay();
  const candidate = await prisma.nuruDailyEditionCandidate.upsert({
    where: { editionAt },
    create: { editionAt, discoveryIds: candidates.map((item) => item.id), featuredId: candidates[0]?.id ?? null, status: reviewRequired ? "needs_content" : "prepared" },
    update: { discoveryIds: candidates.map((item) => item.id), featuredId: candidates[0]?.id ?? null, status: reviewRequired ? "needs_content" : "prepared", generatedAt: new Date(), reviewedAt: null },
  });
  return { candidate, reviewRequired, message: reviewRequired ? "Fewer than seven active discoveries are available; editorial review is required." : "Tomorrow’s candidate edition is prepared for editorial review." };
}

export async function getCurrentEdition() {
  const edition = await prisma.nuruDailyEdition.findUnique({
    where: { editionAt: editionDay() },
    include: { items: { orderBy: { position: "asc" }, include: { discovery: true } } },
  });
  if (!edition) return null;
  return { editionAt: edition.editionAt, items: edition.items.map((item) => ({
    id: item.discovery.id, title: item.discovery.title, meta: item.discovery.meta, score: item.discovery.matchScore,
    image: item.discovery.imageUrl || item.discovery.imageKey, kind: item.discovery.category.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()), isFeatured: item.isFeatured,
  })) };
}

export async function publishTodayEdition(input: z.infer<typeof nuruEditionSchema>) {
  const eligible = await prisma.nuruDiscovery.findMany({ where: { id: { in: input.discoveryIds }, isPublished: true, archivedAt: null }, select: { id: true } });
  if (eligible.length !== 7) throw new Error("All seven selected discoveries must be published and active.");
  const day = editionDay();
  const edition = await prisma.nuruDailyEdition.upsert({ where: { editionAt: day }, create: { editionAt: day }, update: {} });
  await prisma.$transaction([
    prisma.nuruDailyEditionItem.deleteMany({ where: { editionId: edition.id } }),
    prisma.nuruDailyEditionItem.createMany({ data: input.discoveryIds.map((discoveryId, index) => ({ editionId: edition.id, discoveryId, position: index + 1, isFeatured: discoveryId === input.featuredId })) }),
  ]);
  return getCurrentEdition();
}
