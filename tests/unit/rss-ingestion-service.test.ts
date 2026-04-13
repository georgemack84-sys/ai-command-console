import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    source: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    monitoredUpdate: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    activityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/src/server/observability/runtime-diagnostics", () => ({
  recordRuntimeDiagnostic: vi.fn(),
}));

vi.mock("@/src/server/observability/analytics", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/src/server/jobs/background-jobs", () => ({
  queueBackgroundJob: vi.fn(),
}));

import { prisma } from "@/src/server/db/prisma";
import { normalizeRssItem, refreshRssSource } from "@/src/server/services/rss-ingestion-service";

const FEED_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Ops Feed</title>
    <item>
      <title>Item One</title>
      <link>https://example.com/one</link>
      <guid>item-1</guid>
      <pubDate>Mon, 01 Jan 2025 00:00:00 GMT</pubDate>
      <description>First item description.</description>
    </item>
    <item>
      <title>Item Two</title>
      <link>https://example.com/two</link>
      <guid>item-2</guid>
      <pubDate>Mon, 02 Jan 2025 00:00:00 GMT</pubDate>
      <description>Second item description.</description>
    </item>
  </channel>
</rss>`;

function mockFetchWithBody(body: string) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-length": String(body.length) }),
    arrayBuffer: async () => Buffer.from(body, "utf-8"),
  })) as never);
}

describe("rss ingestion service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithBody(FEED_XML);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes RSS items into a stable shape", () => {
    const normalized = normalizeRssItem(
      {
        title: "Summary item",
        link: "https://example.com/item",
        guid: "guid-1",
        isoDate: "2025-01-01T00:00:00.000Z",
        contentSnippet: "Snippet content",
      },
      "Ops Feed",
    );

    expect(normalized).toEqual(
      expect.objectContaining({
        title: "Summary item",
        url: "https://example.com/item",
        summary: "Snippet content",
        dedupeKey: "guid-1",
      }),
    );
  });

  it("dedupes RSS items that already exist for a source", async () => {
    vi.mocked(prisma.source.findFirst).mockResolvedValue({
      id: "source_1",
      workspaceId: "workspace_1",
      name: "Ops Feed",
      type: "feed",
      url: "https://example.com/feed.xml",
    } as never);

    vi.mocked(prisma.monitoredUpdate.findFirst)
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValueOnce(null as never);

    await refreshRssSource({
      sourceId: "source_1",
      workspaceId: "workspace_1",
      requestedById: "user_1",
    });

    expect(prisma.monitoredUpdate.create).toHaveBeenCalledTimes(1);
    expect(prisma.source.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "source_1" },
        data: { status: "healthy" },
      }),
    );
  });

  it("queues insight generation after new updates are ingested", async () => {
    vi.mocked(prisma.source.findFirst).mockResolvedValue({
      id: "source_2",
      workspaceId: "workspace_1",
      name: "Ops Feed",
      type: "feed",
      url: "https://example.com/feed.xml",
    } as never);

    vi.mocked(prisma.monitoredUpdate.findFirst).mockResolvedValue(null as never);

    await refreshRssSource({
      sourceId: "source_2",
      workspaceId: "workspace_1",
      requestedById: "user_1",
    });

    const { queueBackgroundJob } = await import("@/src/server/jobs/background-jobs");
    expect(queueBackgroundJob).toHaveBeenCalledWith(
      "workspace:generate-insights",
      { workspaceId: "workspace_1" },
      { actorId: "user_1", actorName: "rss-ingestion" },
    );
  });

  it("marks the source degraded when RSS parsing fails", async () => {
    mockFetchWithBody("not xml");
    vi.mocked(prisma.source.findFirst).mockResolvedValue({
      id: "source_3",
      workspaceId: "workspace_1",
      name: "Bad Feed",
      type: "feed",
      url: "https://example.com/bad.xml",
    } as never);

    await expect(
      refreshRssSource({
        sourceId: "source_3",
        workspaceId: "workspace_1",
        requestedById: "user_1",
      }),
    ).rejects.toMatchObject({ code: "rss_parse_failed" });

    expect(prisma.source.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "source_3" },
        data: { status: "degraded" },
      }),
    );
  });
});
