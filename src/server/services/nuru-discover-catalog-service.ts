import { randomUUID } from "node:crypto";
import { z } from "zod";
import { provenanceSchema, sourceSchema } from "@/src/nuru/domain";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository, type ArchiveKnowledgeRow, type NuruArchiveModel, type NuruDiscoverCatalogEntryRow } from "@/src/server/repositories/nuru-knowledge-repository";

/**
 * Presentation catalog for Nuru Discover.
 *
 * Canonical knowledge is never discoverable merely because it was approved.
 * Human catalog admission is stored in a separate presentation record.
 */
export type NuruDiscoverCatalogItem = {
  id: string;
  knowledgeItemId: string;
  title: string;
  summary: string;
  contentType: string;
  project: string | null;
  topics: string[];
  confidence: number;
  source: {
    sourceType: string;
    origin: string;
    authority: string;
    uri?: string;
  };
  provenanceAvailable: true;
};

/** A governor-visible decision record, including deliberate withdrawals. */
export type NuruDiscoverCatalogDecision = Pick<NuruDiscoverCatalogEntryRow, "knowledgeItemId" | "status" | "topics" | "reason">;

export async function listNuruDiscoverCatalogDecisions(): Promise<NuruDiscoverCatalogDecision[]> {
  const entries = await nuruKnowledgeRepository.nuruDiscoverCatalogEntry.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return entries.map(({ knowledgeItemId, status, topics, reason }) => ({ knowledgeItemId, status, topics, reason }));
}

export type NuruDiscoverCatalogDetail = {
  item: NuruDiscoverCatalogItem;
  content: string;
  source: NuruDiscoverCatalogItem["source"];
  provenance: { verified: true };
  relationships: Array<{
    relationshipType: string;
    confidence: number;
    direction: "OUTGOING" | "INCOMING";
    target: Pick<NuruDiscoverCatalogItem, "knowledgeItemId" | "title" | "contentType" | "project">;
    decision?: { actor: string; reason: string | null; decidedAt: string };
  }>;
};

export const nuruDiscoverCatalogAdmissionSchema = z.object({
  discoverability: z.enum(["DISCOVERABLE", "NOT_DISCOVERABLE"]),
  topics: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  reason: z.string().trim().min(3).max(2_000),
});
export type NuruDiscoverCatalogAdmission = z.infer<typeof nuruDiscoverCatalogAdmissionSchema>;

function summaryFrom(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length <= 280 ? normalized : `${normalized.slice(0, 277).trimEnd()}…`;
}

/** Returns null when a record has not been explicitly admitted to Discover. */
export function toNuruDiscoverCatalogItem(item: ArchiveKnowledgeRow, entry: NuruDiscoverCatalogEntryRow): NuruDiscoverCatalogItem | null {
  if (item.status !== "APPROVED") return null;
  if (entry.status !== "ACTIVE" || entry.knowledgeItemId !== item.id) return null;

  const source = sourceSchema.safeParse(item.source);
  const provenance = provenanceSchema.safeParse(item.provenance);
  if (!source.success || !provenance.success) return null;

  // Agent judgments can support a record, but they are not independently
  // publishable material for a human discovery experience.
  if (source.data.sourceType === "AGENT_OUTPUT") return null;

  return {
    id: entry.id,
    knowledgeItemId: item.id,
    title: item.title,
    summary: summaryFrom(item.content),
    contentType: item.contentType,
    project: item.project,
    topics: entry.topics,
    confidence: item.confidence,
    source: {
      sourceType: source.data.sourceType,
      origin: source.data.origin,
      authority: source.data.authority,
      ...(source.data.uri ? { uri: source.data.uri } : {}),
    },
    provenanceAvailable: true,
  };
}

/**
 * Lists the explicitly admitted presentation catalog through the repository
 * boundary. It never changes canonical knowledge.
 */
export async function listNuruDiscoverCatalog(limit = 40): Promise<NuruDiscoverCatalogItem[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
  const entries = await nuruKnowledgeRepository.nuruDiscoverCatalogEntry.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  if (!entries.length) return [];
  const approved = await archive.findMany({
    where: { id: { in: entries.map((entry) => entry.knowledgeItemId) }, status: "APPROVED" },
    take: 100,
  });
  const itemsById = new Map(approved.map((item) => [item.id, item]));

  return entries
    .map((entry) => {
      const item = itemsById.get(entry.knowledgeItemId);
      return item ? toNuruDiscoverCatalogItem(item, entry) : null;
    })
    .filter((item): item is NuruDiscoverCatalogItem => item !== null)
    .slice(0, safeLimit);
}

/**
 * Public Discover projection. It deliberately exposes only a currently
 * admitted item and relationships whose other endpoint is also admitted.
 */
export async function getNuruDiscoverCatalogDetail(knowledgeItemId: string): Promise<NuruDiscoverCatalogDetail | null> {
  const catalog = await listNuruDiscoverCatalog(100);
  const item = catalog.find((entry) => entry.knowledgeItemId === knowledgeItemId);
  if (!item) return null;

  const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
  const record = await archive.findUnique({ where: { id: knowledgeItemId } });
  if (!record || record.status !== "APPROVED") return null;

  const catalogById = new Map(catalog.map((entry) => [entry.knowledgeItemId, entry]));
  const edges = await nuruKnowledgeRepository.nuruRelationship.findMany({
    where: {
      status: "APPROVED",
      OR: [{ sourceItemId: knowledgeItemId }, { targetItemId: knowledgeItemId }],
    },
  });
  const relationships = edges.flatMap((edge) => {
    const outgoing = edge.sourceItemId === knowledgeItemId;
    const target = catalogById.get(outgoing ? edge.targetItemId : edge.sourceItemId);
    if (!target) return [];
    return [{
      relationshipType: edge.relationshipType,
      confidence: edge.confidence,
      direction: outgoing ? "OUTGOING" as const : "INCOMING" as const,
      target: {
        knowledgeItemId: target.knowledgeItemId,
        title: target.title,
        contentType: target.contentType,
        project: target.project,
      },
    }];
  });

  const relationshipAudits = edges.length ? await nuruKnowledgeRepository.nuruAuditEvent.findMany({
    where: { eventType: "RELATIONSHIP_APPROVED", OR: edges.map((edge) => ({ resourceId: edge.sourceItemId, inputReference: edge.targetItemId, outputReference: edge.relationshipType })) },
    orderBy: { createdAt: "desc" },
  }) : [];
  const decisions = new Map(relationshipAudits.map((event) => [`${event.resourceId}:${event.inputReference}:${event.outputReference}`, { actor: event.actor, reason: event.reason, decidedAt: event.createdAt.toISOString() }]));
  const relationshipsWithDecisions = relationships.map((relationship) => {
    const sourceId = relationship.direction === "OUTGOING" ? knowledgeItemId : relationship.target.knowledgeItemId;
    const targetId = relationship.direction === "OUTGOING" ? relationship.target.knowledgeItemId : knowledgeItemId;
    const decision = decisions.get(`${sourceId}:${targetId}:${relationship.relationshipType}`);
    return decision ? { ...relationship, decision } : relationship;
  });

  return {
    item,
    content: record.content,
    source: item.source,
    provenance: { verified: true },
    relationships: relationshipsWithDecisions,
  };
}

/**
 * Governor-only callers use this deterministic operation to admit or withdraw
 * a canonical item from Discover. It intentionally does not alter the
 * canonical item's content, metadata, provenance, status, or curation decision.
 */
export async function setNuruDiscoverCatalogAdmission(
  itemId: string,
  rawAdmission: NuruDiscoverCatalogAdmission,
  actor: string,
) {
  const admission = nuruDiscoverCatalogAdmissionSchema.parse(rawAdmission);
  const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
  const item = await archive.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError(404, "not_found", "Nuru knowledge item was not found.");
  if (item.status !== "APPROVED") throw new AppError(409, "catalog_ineligible", "Only approved knowledge can be admitted to Discover.");

  const correlationId = randomUUID();
  const entry = await nuruKnowledgeRepository.$transaction(async (tx) => {
    const catalogEntry = await tx.nuruDiscoverCatalogEntry.upsert({
      where: { knowledgeItemId: itemId },
      create: {
        knowledgeItemId: itemId,
        status: admission.discoverability === "DISCOVERABLE" ? "ACTIVE" : "WITHDRAWN",
        topics: admission.topics ?? [],
        reason: admission.reason,
        admittedBy: actor,
      },
      update: {
        status: admission.discoverability === "DISCOVERABLE" ? "ACTIVE" : "WITHDRAWN",
        ...(admission.topics ? { topics: admission.topics } : {}),
        reason: admission.reason,
        admittedBy: actor,
      },
    });
    await tx.nuruAuditEvent.create({
      data: {
        eventType: admission.discoverability === "DISCOVERABLE" ? "CATALOG_ADMITTED" : "CATALOG_WITHDRAWN",
        actor,
        resourceId: itemId,
        decision: admission.discoverability,
        reason: admission.reason,
        correlationId,
      },
    });
    return catalogEntry;
  });

  return {
    item: toNuruDiscoverCatalogItem(item, entry),
    discoverability: admission.discoverability,
    correlationId,
  };
}
