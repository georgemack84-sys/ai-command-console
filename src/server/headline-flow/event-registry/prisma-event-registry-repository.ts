import { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import type { HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";
import type {
  HeadlineFlowEventEvidence,
  HeadlineFlowEventRecord,
  HeadlineFlowEventRegistryRepository,
  HeadlineFlowEventStatus,
} from "@/src/server/headline-flow/event-registry/types";

type HeadlineFlowPrismaClient = Prisma.TransactionClient & {
  headlineFlowEvent: {
    findFirst(input: unknown): Promise<HeadlineFlowEventRow | null>;
    findMany(input: unknown): Promise<HeadlineFlowEventRow[]>;
    update(input: unknown): Promise<HeadlineFlowEventRow>;
    upsert(input: unknown): Promise<HeadlineFlowEventRow>;
  };
};

type HeadlineFlowEventEvidenceRow = {
  id: string;
  eventId: string;
  workspaceId: string;
  storyPackageId: string;
  articleId: string | null;
  providerId: string | null;
  providerArticleId: string | null;
  sourceId: string;
  sourceName: string;
  articleUrl: string | null;
  articleFingerprint: string | null;
  author: string | null;
  imageUrl: string | null;
  headline: string;
  summary: string;
  topic: string;
  publishedAt: Date;
  retrievedAt: Date | null;
  observedAt: Date;
  updateReason: string;
};

type HeadlineFlowEventRow = {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  topic: string;
  status: string;
  importance: string;
  confidence: string;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
  lastMeaningfulUpdateAt: Date;
  version: number;
  matchKey: string;
  updateSummary: string;
  updateReasons: string[];
  sourceCount: number;
  articleCount: number;
  evidence?: HeadlineFlowEventEvidenceRow[];
};

function toDate(value: string) {
  return new Date(value);
}

function mapEvidence(row: HeadlineFlowEventEvidenceRow): HeadlineFlowEventEvidence {
  return {
    id: row.id,
    storyPackageId: row.storyPackageId,
    articleId: row.articleId,
    providerId: row.providerId,
    providerArticleId: row.providerArticleId,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    articleUrl: row.articleUrl,
    articleFingerprint: row.articleFingerprint,
    author: row.author,
    imageUrl: row.imageUrl,
    headline: row.headline,
    summary: row.summary,
    topic: row.topic as HeadlineFlowTopic,
    publishedAt: row.publishedAt.toISOString(),
    retrievedAt: row.retrievedAt?.toISOString() ?? null,
    observedAt: row.observedAt.toISOString(),
    updateReason: row.updateReason as HeadlineFlowEventEvidence["updateReason"],
  };
}

function mapEvent(row: HeadlineFlowEventRow): HeadlineFlowEventRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    summary: row.summary,
    topic: row.topic as HeadlineFlowTopic,
    status: row.status as HeadlineFlowEventStatus,
    importance: row.importance as HeadlineFlowEventRecord["importance"],
    confidence: row.confidence as HeadlineFlowEventRecord["confidence"],
    firstDetectedAt: row.firstDetectedAt.toISOString(),
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
    lastMeaningfulUpdateAt: row.lastMeaningfulUpdateAt.toISOString(),
    version: row.version,
    matchKey: row.matchKey,
    updateSummary: row.updateSummary,
    updateReasons: row.updateReasons as HeadlineFlowEventRecord["updateReasons"],
    sourceCount: row.sourceCount,
    articleCount: row.articleCount,
    evidence: (row.evidence ?? []).map(mapEvidence),
  };
}

function eventData(event: HeadlineFlowEventRecord) {
  return {
    id: event.id,
    workspaceId: event.workspaceId,
    title: event.title,
    summary: event.summary,
    topic: event.topic,
    status: event.status,
    importance: event.importance,
    confidence: event.confidence,
    firstDetectedAt: toDate(event.firstDetectedAt),
    lastUpdatedAt: toDate(event.lastUpdatedAt),
    lastMeaningfulUpdateAt: toDate(event.lastMeaningfulUpdateAt),
    version: event.version,
    matchKey: event.matchKey,
    updateSummary: event.updateSummary,
    updateReasons: event.updateReasons,
    sourceCount: event.sourceCount,
    articleCount: event.articleCount,
  };
}

function eventUpdateData(event: HeadlineFlowEventRecord) {
  const { id: _id, workspaceId: _workspaceId, ...data } = eventData(event);
  return data;
}

function evidenceData(event: HeadlineFlowEventRecord) {
  return event.evidence.map((evidence) => ({
    id: evidence.id,
    workspaceId: event.workspaceId,
    storyPackageId: evidence.storyPackageId,
    articleId: evidence.articleId,
    providerId: evidence.providerId,
    providerArticleId: evidence.providerArticleId,
    sourceId: evidence.sourceId,
    sourceName: evidence.sourceName,
    articleUrl: evidence.articleUrl,
    articleFingerprint: evidence.articleFingerprint,
    author: evidence.author,
    imageUrl: evidence.imageUrl,
    headline: evidence.headline,
    summary: evidence.summary,
    topic: evidence.topic,
    publishedAt: toDate(evidence.publishedAt),
    retrievedAt: evidence.retrievedAt ? toDate(evidence.retrievedAt) : null,
    observedAt: toDate(evidence.observedAt),
    updateReason: evidence.updateReason,
  }));
}

export class PrismaHeadlineFlowEventRegistryRepository implements HeadlineFlowEventRegistryRepository {
  constructor(private readonly client: HeadlineFlowPrismaClient = prisma as unknown as HeadlineFlowPrismaClient) {}

  async findByIdForWorkspace(eventId: string, workspaceId: string) {
    const row = await this.client.headlineFlowEvent.findFirst({
      where: {
        id: eventId,
        workspaceId,
      },
      include: {
        evidence: {
          orderBy: { observedAt: "asc" },
        },
      },
    });
    return row ? mapEvent(row) : null;
  }

  async listByWorkspace(workspaceId: string) {
    const rows = await this.client.headlineFlowEvent.findMany({
      where: { workspaceId },
      include: {
        evidence: {
          orderBy: { observedAt: "asc" },
        },
      },
      orderBy: { lastUpdatedAt: "desc" },
    });
    return rows.map(mapEvent);
  }

  async upsert(event: HeadlineFlowEventRecord) {
    try {
      const row = await this.client.headlineFlowEvent.upsert({
        where: { id: event.id },
        create: {
          ...eventData(event),
          evidence: {
            create: evidenceData(event),
          },
        },
        update: {
          ...eventUpdateData(event),
          evidence: {
            deleteMany: {},
            create: evidenceData(event),
          },
        },
        include: {
          evidence: {
            orderBy: { observedAt: "asc" },
          },
        },
      });
      return mapEvent(row);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      const row = await this.client.headlineFlowEvent.update({
        where: { id: event.id },
        data: {
          ...eventUpdateData(event),
          evidence: {
            deleteMany: {},
            create: evidenceData(event),
          },
        },
        include: {
          evidence: {
            orderBy: { observedAt: "asc" },
          },
        },
      });
      return mapEvent(row);
    }
  }
}

export const headlineFlowEventRegistryRepository = new PrismaHeadlineFlowEventRegistryRepository();
