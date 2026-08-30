import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaHeadlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";
import type { HeadlineFlowEventRecord } from "@/src/server/headline-flow/event-registry/types";

const EVENT: HeadlineFlowEventRecord = {
  id: "hfe_demo",
  workspaceId: "workspace_demo",
  title: "Senate advances bipartisan infrastructure bill",
  summary: "Lawmakers moved the infrastructure bill forward.",
  topic: "politics",
  status: "updated",
  importance: "important",
  confidence: "multi_source",
  firstDetectedAt: "2026-08-29T12:00:00.000Z",
  lastUpdatedAt: "2026-08-29T13:00:00.000Z",
  lastMeaningfulUpdateAt: "2026-08-29T13:00:00.000Z",
  version: 2,
  matchKey: "politics:senate-advances-bipartisan-infrastructure-bill",
  updateSummary: "1 new source corroborated this story.",
  updateReasons: ["source_corroboration"],
  sourceCount: 1,
  articleCount: 1,
  evidence: [
    {
      id: "evidence_demo",
      storyPackageId: "package_story_1",
      articleId: "article_demo",
      providerId: "fixture",
      providerArticleId: "provider_article_demo",
      sourceId: "source_npr",
      sourceName: "NPR",
      articleUrl: "https://npr.example.com/senate-advances-bipartisan-infrastructure-bill",
      articleFingerprint: "fingerprint_demo",
      author: "Reporter One",
      imageUrl: "https://npr.example.com/image.jpg",
      headline: "Senate advances bipartisan infrastructure bill",
      summary: "Lawmakers moved the infrastructure bill forward.",
      topic: "politics",
      publishedAt: "2026-08-29T11:30:00.000Z",
      retrievedAt: "2026-08-29T11:35:00.000Z",
      observedAt: "2026-08-29T13:00:00.000Z",
      updateReason: "new_evidence",
    },
  ],
};

function rowFromEvent(event: HeadlineFlowEventRecord) {
  return {
    ...event,
    firstDetectedAt: new Date(event.firstDetectedAt),
    lastUpdatedAt: new Date(event.lastUpdatedAt),
    lastMeaningfulUpdateAt: new Date(event.lastMeaningfulUpdateAt),
    evidence: event.evidence.map((evidence) => ({
      ...evidence,
      eventId: event.id,
      workspaceId: event.workspaceId,
      articleId: evidence.articleId,
      providerId: evidence.providerId,
      providerArticleId: evidence.providerArticleId,
      articleFingerprint: evidence.articleFingerprint,
      author: evidence.author,
      imageUrl: evidence.imageUrl,
      publishedAt: new Date(evidence.publishedAt),
      retrievedAt: evidence.retrievedAt ? new Date(evidence.retrievedAt) : null,
      observedAt: new Date(evidence.observedAt),
      updateReason: evidence.updateReason,
    })),
  };
}

describe("PrismaHeadlineFlowEventRegistryRepository", () => {
  it("lists workspace events with mapped evidence", async () => {
    const client = {
      headlineFlowEvent: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([rowFromEvent(EVENT)]),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };
    const repository = new PrismaHeadlineFlowEventRegistryRepository(client as never);

    const events = await repository.listByWorkspace("workspace_demo");

    expect(client.headlineFlowEvent.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace_demo" },
      include: {
        evidence: {
          orderBy: { observedAt: "asc" },
        },
      },
      orderBy: { lastUpdatedAt: "desc" },
    });
    expect(events).toEqual([EVENT]);
  });

  it("upserts event rows and replaces evidence in one write", async () => {
    const client = {
      headlineFlowEvent: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn().mockResolvedValue(rowFromEvent(EVENT)),
      },
    };
    const repository = new PrismaHeadlineFlowEventRegistryRepository(client as never);

    const event = await repository.upsert(EVENT);

    expect(client.headlineFlowEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "hfe_demo" },
        update: expect.objectContaining({
          evidence: {
            deleteMany: {},
            create: [
              expect.objectContaining({
                id: "evidence_demo",
                workspaceId: "workspace_demo",
                providerId: "fixture",
                providerArticleId: "provider_article_demo",
                articleFingerprint: "fingerprint_demo",
                publishedAt: new Date("2026-08-29T11:30:00.000Z"),
                retrievedAt: new Date("2026-08-29T11:35:00.000Z"),
                updateReason: "new_evidence",
              }),
            ],
          },
        }),
        include: {
          evidence: {
            orderBy: { observedAt: "asc" },
          },
        },
      }),
    );
    expect(event).toEqual(EVENT);
  });

  it("finds one event by id inside the workspace boundary", async () => {
    const client = {
      headlineFlowEvent: {
        findFirst: vi.fn().mockResolvedValue(rowFromEvent(EVENT)),
        findMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };
    const repository = new PrismaHeadlineFlowEventRegistryRepository(client as never);

    const event = await repository.findByIdForWorkspace("hfe_demo", "workspace_demo");

    expect(client.headlineFlowEvent.findFirst).toHaveBeenCalledWith({
      where: {
        id: "hfe_demo",
        workspaceId: "workspace_demo",
      },
      include: {
        evidence: {
          orderBy: { observedAt: "asc" },
        },
      },
    });
    expect(event).toEqual(EVENT);
  });

  it("retries deterministic event id races as an update", async () => {
    const client = {
      headlineFlowEvent: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn().mockResolvedValue(rowFromEvent(EVENT)),
        upsert: vi.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
            code: "P2002",
            clientVersion: "test",
            meta: { target: ["id"] },
          }),
        ),
      },
    };
    const repository = new PrismaHeadlineFlowEventRegistryRepository(client as never);

    const event = await repository.upsert(EVENT);

    expect(client.headlineFlowEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "hfe_demo" },
        data: expect.objectContaining({
          updateSummary: "1 new source corroborated this story.",
          evidence: expect.objectContaining({
            deleteMany: {},
          }),
        }),
      }),
    );
    expect(event).toEqual(EVENT);
  });
});
