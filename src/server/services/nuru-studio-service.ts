import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { ensureNuruDiscoveries } from "@/src/server/services/nuru-service";

export const nuruStudioDiscoverySchema = z.object({
  title: z.string().trim().min(3).max(140),
  meta: z.string().trim().min(3).max(160),
  category: z.enum(["near_certain", "adjacent", "serendipity", "wildcard", "featured"]),
  matchScore: z.coerce.number().int().min(0).max(100),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  eyebrow: z.string().trim().max(180),
  summary: z.string().trim().min(20).max(2000),
  rationale: z.string().trim().min(20).max(1200),
  connection: z.string().trim().min(20).max(1200),
  paths: z.string().trim().max(800),
  isPublished: z.boolean(),
});

export type NuruStudioDiscoveryInput = z.infer<typeof nuruStudioDiscoverySchema>;

function createDiscoveryId(title: string) {
  return `studio-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function listStudioDiscoveries() {
  return prisma.nuruDiscovery.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, meta: true, category: true, matchScore: true, isPublished: true, publishedAt: true, archivedAt: true, updatedAt: true } });
}

export async function listPublishedNuruDiscoveries() {
  await ensureNuruDiscoveries();
  const discoveries = await prisma.nuruDiscovery.findMany({ where: { isPublished: true, archivedAt: null }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, meta: true, category: true, matchScore: true, imageKey: true, imageUrl: true } });
  return discoveries.filter((discovery) => discovery.category !== "featured").map((discovery) => ({
    id: discovery.id,
    title: discovery.title,
    meta: discovery.meta,
    score: discovery.matchScore,
    image: discovery.imageUrl || discovery.imageKey,
    kind: discovery.category.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()),
  }));
}

export async function createStudioDiscovery(input: NuruStudioDiscoveryInput) {
  return prisma.nuruDiscovery.create({
    data: {
      id: createDiscoveryId(input.title),
      title: input.title,
      meta: input.meta,
      category: input.category,
      matchScore: input.matchScore,
      imageKey: "studio",
      imageUrl: input.imageUrl || null,
      sourceUrl: input.sourceUrl || null,
      eyebrow: input.eyebrow,
      summary: input.summary,
      rationale: input.rationale,
      connection: input.connection,
      paths: input.paths.split("\n").map((path) => path.trim()).filter(Boolean),
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? new Date() : null,
    },
  });
}

export async function getStudioDiscovery(id: string) {
  return prisma.nuruDiscovery.findUnique({ where: { id } });
}

export async function updateStudioDiscovery(id: string, input: NuruStudioDiscoveryInput) {
  const existing = await getStudioDiscovery(id);
  if (!existing) return null;
  const publishingNow = input.isPublished && !existing.isPublished;
  return prisma.nuruDiscovery.update({
    where: { id },
    data: {
      title: input.title, meta: input.meta, category: input.category, matchScore: input.matchScore,
      imageUrl: input.imageUrl || null, sourceUrl: input.sourceUrl || null, eyebrow: input.eyebrow,
      summary: input.summary, rationale: input.rationale, connection: input.connection,
      paths: input.paths.split("\n").map((path) => path.trim()).filter(Boolean), isPublished: input.isPublished,
      publishedAt: input.isPublished ? (publishingNow ? new Date() : existing.publishedAt) : null,
      archivedAt: null,
    },
  });
}

export async function setStudioDiscoveryLifecycle(id: string, action: "publish" | "unpublish" | "archive") {
  const existing = await getStudioDiscovery(id);
  if (!existing) return null;
  const now = new Date();
  return prisma.nuruDiscovery.update({
    where: { id },
    data: action === "publish" ? { isPublished: true, publishedAt: now, archivedAt: null } : action === "unpublish" ? { isPublished: false, publishedAt: null } : { isPublished: false, archivedAt: now },
  });
}

export async function getPublishedStudioDiscovery(id: string) {
  const discovery = await prisma.nuruDiscovery.findFirst({ where: { id, isPublished: true, archivedAt: null } });
  if (!discovery) return null;
  const kind = discovery.category.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
  return {
    id: discovery.id,
    kind,
    title: discovery.title,
    meta: discovery.meta,
    score: discovery.matchScore,
    image: discovery.imageUrl || discovery.imageKey,
    eyebrow: discovery.eyebrow || "A new Nuru discovery",
    summary: discovery.summary,
    reason: discovery.rationale,
    connection: discovery.connection,
    paths: discovery.paths,
  };
}
