import { NextResponse } from "next/server";
import { getHeadlineFlowConfiguration } from "@/lib/civitas/configuration";
import { recordEvidence, withTelemetry } from "@/lib/civitas/evidence";
import { emitCivitasEvent } from "@/lib/civitas/eventBus";
import { explainStory } from "@/lib/civitas/explainability";
import { evaluateStoryTrust } from "@/lib/civitas/trust";
import { aggregateHeadlines } from "@/lib/news/aggregateHeadlines";
import { deduplicateHeadlines } from "@/lib/news/deduplicateHeadlines";
import { normalizeHeadlines } from "@/lib/news/normalizeHeadline";
import { rankHeadlines } from "@/lib/news/rankHeadlines";
import { headlineQuerySchema } from "@/lib/news/schemas";
import { synchronizeStoryVisuals } from "@/lib/news/visual/VisualSynchronizationAgent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = headlineQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid headline query.",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 },
    );
  }

  const { category, limit, mock, query, location } = parsed.data;
  const config = getHeadlineFlowConfiguration();

  try {
    const discovered = emitCivitasEvent("HeadlineDiscovered", { category, limit, query, location, providers: process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || "mock" });
    const aggregated = await withTelemetry(
      "HeadlineApi",
      "aggregateHeadlines",
      discovered.correlationId,
      discovered.replayId,
      "qual_headline_ingestion",
      () => aggregateHeadlines({ category, limit, query, location, forceMock: mock }),
    );
    recordEvidence("Headline ingestion", discovered, { rawCount: aggregated.stories.length, providers: aggregated.providers });

    const normalized = normalizeHeadlines(aggregated.stories);
    const normalizedEvent = emitCivitasEvent("HeadlineNormalized", { count: normalized.length }, discovered.correlationId);
    recordEvidence("Headline normalization", normalizedEvent, { count: normalized.length });

    const deduped = deduplicateHeadlines(normalized);
    const dedupedEvent = emitCivitasEvent("HeadlineDeduplicated", { before: normalized.length, after: deduped.length }, discovered.correlationId);
    recordEvidence("Duplicate detection", dedupedEvent, { removed: normalized.length - deduped.length });

    const rankedBase = rankHeadlines(deduped, category).slice(0, limit);
    const rankedEvent = emitCivitasEvent("HeadlineRanked", { count: rankedBase.length, category }, discovered.correlationId);
    recordEvidence("Ranking", rankedEvent, { category, count: rankedBase.length });

    for (const story of rankedBase) {
      emitCivitasEvent(story.image ? "ImageResolved" : "ImageResolutionFailed", { storyId: story.id, category: story.category }, discovered.correlationId);
    }

    const synchronized = await synchronizeStoryVisuals(rankedBase);
    const visualEvent = emitCivitasEvent("ImageResolved", { count: synchronized.length }, discovered.correlationId);
    recordEvidence("Image selection", visualEvent, { count: synchronized.length });

    const trusted = await evaluateStoryTrust(synchronized, config.featureFlags.trustEvaluation);
    if (config.featureFlags.trustEvaluation) {
      const trustEvent = emitCivitasEvent("TrustEvaluated", { count: trusted.length }, discovered.correlationId);
      recordEvidence("Trust evaluation", trustEvent, { count: trusted.length });
    }
    const ranked = trusted.map((story) => ({ ...story, explanation: explainStory(story) }));

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        category,
        count: ranked.length,
        provider: aggregated.providers.map((item) => item.name).join(","),
        providers: aggregated.providers,
        sourceStats: aggregated.sourceStats,
        civitas: {
          mode: config.mode,
          featureFlags: config.featureFlags,
          correlationId: discovered.correlationId,
          replayId: discovered.replayId,
        },
        stories: ranked,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=90, stale-while-revalidate=240",
        },
      },
    );
  } catch (error) {
    const fallbackEvent = emitCivitasEvent("HeadlineDiscovered", { category, limit, provider: "mock", fallback: true });
    const fallbackAggregated = await aggregateHeadlines({ category, limit, query, location, forceMock: true });
    const fallbackStories = rankHeadlines(
      deduplicateHeadlines(normalizeHeadlines(fallbackAggregated.stories)),
      category,
    ).slice(0, limit);
    recordEvidence("Headline ingestion", fallbackEvent, { fallback: true, count: fallbackStories.length });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        category,
        count: fallbackStories.length,
        provider: "mock",
        providers: fallbackAggregated.providers,
        sourceStats: fallbackAggregated.sourceStats,
        civitas: {
          mode: config.mode,
          featureFlags: config.featureFlags,
          correlationId: fallbackEvent.correlationId,
          replayId: fallbackEvent.replayId,
        },
        warning: error instanceof Error ? error.message : "News provider failed. Mock headlines loaded.",
        stories: (await evaluateStoryTrust(await synchronizeStoryVisuals(fallbackStories), config.featureFlags.trustEvaluation)).map((story) => ({
          ...story,
          explanation: explainStory(story),
        })),
      },
      { status: 200 },
    );
  }
}
