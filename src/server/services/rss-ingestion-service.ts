import Parser from "rss-parser";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { AppError } from "@/src/server/api/errors";
import { logger } from "@/src/server/observability/logger";
import { recordRuntimeDiagnostic } from "@/src/server/observability/runtime-diagnostics";
import { trackEvent } from "@/src/server/observability/analytics";
import { getRssIngestMaxContentBytes, getRssIngestMaxItems, getRssIngestTimeoutMs, getRssUserAgent } from "@/src/config/env";
import { queueBackgroundJob } from "@/src/server/jobs/background-jobs";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { createAlert } from "@/src/server/alerts/alert-service";

const parser = new Parser();

type RssItemInput = {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  creator?: string;
  author?: string;
  categories?: string[];
  "content:encoded"?: string;
};

export type NormalizedRssItem = {
  title: string;
  url: string | null;
  publishedAt: Date;
  summary: string;
  author: string | null;
  categories: string[];
  dedupeKey: string;
};

function toDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clampText(value: string, max = 600) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 3)}...`;
}

function safeText(value?: string | null) {
  return typeof value === "string" ? value : "";
}

export function normalizeRssItem(item: RssItemInput, feedTitle: string | null): NormalizedRssItem | null {
  const title = safeText(item.title || item.summary || item.contentSnippet || item.content).trim();
  const url = safeText(item.link || "").trim() || null;
  const publishedAt =
    toDate(item.isoDate || item.pubDate) ?? new Date();
  const summarySource =
    safeText(item.contentSnippet || item.summary || item.content || item["content:encoded"] || item.title);

  if (!title && !url) {
    return null;
  }

  const author = safeText(item.creator || item.author || "").trim() || null;
  const categories = Array.isArray(item.categories) ? item.categories.map((category) => category.trim()).filter(Boolean) : [];
  const dedupeKey = safeText(item.guid || url || `${title}:${publishedAt.toISOString()}`).trim();

  return {
    title: title || (url ? url : feedTitle || "Untitled feed item"),
    url,
    publishedAt,
    summary: clampText(summarySource || title || "Update captured from RSS feed."),
    author,
    categories,
    dedupeKey,
  };
}

async function fetchRssXml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getRssIngestTimeoutMs());
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRssUserAgent(),
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError(502, "rss_fetch_failed", `RSS fetch failed with status ${response.status}.`);
    }

    const maxBytes = getRssIngestMaxContentBytes();
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength && contentLength > maxBytes) {
      throw new AppError(413, "rss_payload_too_large", "RSS payload exceeds the configured size limit.");
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new AppError(413, "rss_payload_too_large", "RSS payload exceeds the configured size limit.");
    }
    return Buffer.from(buffer).toString("utf-8");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseRssXml(xml: string) {
  try {
    return await parser.parseString(xml);
  } catch {
    throw new AppError(400, "rss_parse_failed", "RSS feed could not be parsed.");
  }
}

async function hasExistingUpdate(sourceId: string, dedupeKey: string) {
  return prisma.monitoredUpdate.findFirst({
    where: {
      sourceId,
      metadata: {
        path: ["dedupeKey"],
        equals: dedupeKey,
      },
    },
    select: { id: true },
  });
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

export async function refreshRssSource(input: {
  sourceId: string;
  workspaceId: string;
  requestedById?: string | null;
  traceId?: string;
}) {
  const source = await prisma.source.findFirst({
    where: {
      id: input.sourceId,
      workspaceId: input.workspaceId,
    },
  });

  if (!source) {
    throw new AppError(404, "source_not_found", "Source not found for this workspace.");
  }
  if (!source.url) {
    throw new AppError(400, "source_missing_url", "Source URL is required for RSS ingestion.");
  }
  if (source.type !== "feed") {
    throw new AppError(400, "source_type_not_supported", "Only feed sources are supported by RSS ingestion.");
  }

  const startedAt = Date.now();
  const fetchedAt = new Date().toISOString();
  let createdCount = 0;
  let skippedCount = 0;

  try {
    const xml = await fetchRssXml(source.url);
    const feed = await parseRssXml(xml);
    const feedTitle = typeof feed.title === "string" ? feed.title : source.name;
    const items = Array.isArray(feed.items) ? feed.items : [];
    const maxItems = getRssIngestMaxItems();

    for (const raw of items.slice(0, maxItems)) {
      const normalized = normalizeRssItem(raw as RssItemInput, feedTitle);
      if (!normalized) {
        skippedCount += 1;
        continue;
      }

      const existing = await hasExistingUpdate(source.id, normalized.dedupeKey);
      if (existing) {
        skippedCount += 1;
        continue;
      }

      await prisma.monitoredUpdate.create({
        data: {
          workspaceId: source.workspaceId,
          sourceId: source.id,
          title: normalized.title,
          summary: normalized.summary,
          status: "new",
          severity: "medium",
          category: normalized.categories[0] || "Feed",
          happenedAt: normalized.publishedAt,
          metadata: asJson({
            dedupeKey: normalized.dedupeKey,
            itemUrl: normalized.url,
            author: normalized.author,
            categories: normalized.categories,
            feedTitle,
            fetchedAt,
          }),
        },
      });

      createdCount += 1;
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { status: "healthy" },
    });

    await prisma.activityEvent.create({
      data: {
        workspaceId: source.workspaceId,
        userId: input.requestedById ?? null,
        type: "source.refresh.completed",
        title: "Source refresh completed",
        description: `Refreshed ${source.name} and captured ${createdCount} new update${createdCount === 1 ? "" : "s"}.`,
        metadata: {
          sourceId: source.id,
          createdCount,
          skippedCount,
          fetchedAt,
        },
      },
    });

    if (createdCount > 0 && (await isFeatureEnabled("alerts_v2", source.workspaceId))) {
      await createAlert({
        workspaceId: source.workspaceId,
        sourceId: source.id,
        type: "source.refresh",
        title: "New updates ingested",
        message: `${createdCount} update${createdCount === 1 ? "" : "s"} ingested from ${source.name}.`,
        severity: "info",
      });
    }

    if (createdCount > 0) {
      let insightQueued = false;
      try {
        queueBackgroundJob(
          "workspace:generate-insights",
          { workspaceId: source.workspaceId },
          { actorId: input.requestedById ?? "system", actorName: "rss-ingestion" },
        );
        insightQueued = true;
      } catch (error) {
        recordRuntimeDiagnostic({
          scope: "ingestion.rss",
          level: "warn",
          message: "Insight generation could not be queued after ingestion.",
          traceId: input.traceId,
          context: {
            sourceId: source.id,
            workspaceId: source.workspaceId,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      trackEvent({
        event: "update_ingested",
        actorId: input.requestedById ?? "system",
        workspaceId: source.workspaceId,
        properties: {
          sourceId: source.id,
          count: createdCount,
        },
      });
      if (insightQueued) {
        trackEvent({
          event: "insight_generation_requested",
          actorId: input.requestedById ?? "system",
          workspaceId: source.workspaceId,
          properties: { sourceId: source.id, count: createdCount },
        });
      }
    }

    trackEvent({
      event: "source_refresh_completed",
      actorId: input.requestedById ?? "system",
      workspaceId: source.workspaceId,
      properties: {
        sourceId: source.id,
        createdCount,
        skippedCount,
        durationMs: Date.now() - startedAt,
      },
    });

    logger.info("RSS ingestion completed.", {
      sourceId: source.id,
      workspaceId: source.workspaceId,
      createdCount,
      skippedCount,
      durationMs: Date.now() - startedAt,
    });

    return {
      sourceId: source.id,
      workspaceId: source.workspaceId,
      createdCount,
      skippedCount,
      durationMs: Date.now() - startedAt,
      traceId: input.traceId ?? null,
    };
  } catch (error) {
    await prisma.source.update({
      where: { id: source.id },
      data: { status: "degraded" },
    });
    recordRuntimeDiagnostic({
      scope: "ingestion.rss",
      level: "error",
      message: error instanceof Error ? error.message : "RSS ingestion failed.",
      traceId: input.traceId,
      context: {
        sourceId: source.id,
        workspaceId: source.workspaceId,
      },
    });
    logger.error("RSS ingestion failed.", {
      sourceId: source.id,
      workspaceId: source.workspaceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
