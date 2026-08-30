import { z } from "zod";
import { getHeadlineFlowAutoFallbackTimeoutMs, getHeadlineFlowFeedCacheTtlMs, getHeadlineFlowStaleCacheMaxAgeMs, headlineFlowFixtureProviderEnabled } from "@/src/config/env";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import type { HeadlineFlowFeed, HeadlineFlowTopic } from "@/src/server/headline-flow/domain/types";
import { buildHeadlineFlowFeed } from "@/src/server/headline-flow/application/build-feed";
import { headlineFlowInteractionRepository, type HeadlineFlowInteractionSummary } from "@/src/server/headline-flow/analytics/interaction-events";
import { recordHeadlineFlowFeedFailure, recordHeadlineFlowFeedSuccess, resetHeadlineFlowFeedHealthForTests } from "@/src/server/headline-flow/application/feed-health";
import { headlineFlowEventPreferenceRepository } from "@/src/server/headline-flow/event-registry/event-preferences";
import { headlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/prisma-event-registry-repository";
import { FixtureNewsProvider } from "@/src/server/headline-flow/providers/fixture-news-provider";
import { OpenAIWebSearchNewsProvider } from "@/src/server/headline-flow/providers/openai-web-search-news-provider";
import { resolveHeadlineFlowProviderMode, selectHeadlineFlowProvider } from "@/src/server/headline-flow/providers/provider-factory";
import type { NewsProviderRuntimeDiagnostics } from "@/src/server/headline-flow/providers/types";
import { logger } from "@/src/server/observability/logger";
import { enforceRateLimit, getClientIp, getDefaultWindowMs, getSourceRateLimit } from "@/src/server/security/rate-limit";

const querySchema = z.object({
  topic: z.string().trim().min(1).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(25).optional(),
  provider: z.enum(["auto", "fixture", "rss", "web_search"]).optional(),
});

type FeedRouteData = {
  mode: string;
  diagnostics: {
    requestedProvider: string;
    configuredProvider: string;
    selectedProvider: string;
    fallbackReason: string | null;
    providerError: string | null;
    webSearchConfigured: boolean;
    provider: NewsProviderRuntimeDiagnostics | null;
    cache: {
      status: "hit" | "miss" | "stale" | "disabled";
      ageMs: number;
      ttlMs: number;
      staleMaxAgeMs: number;
    };
  };
  requestedProvider: string;
  workspaceId: string;
  feed: HeadlineFlowFeed;
};

type FeedCacheEntry = {
  createdAt: number;
  data: FeedRouteData;
};

const feedCache = new Map<string, FeedCacheEntry>();

function cacheKey(input: {
  workspaceId: string;
  userId: string;
  preferenceRevision: string;
  providerMode: string;
  topic?: string;
  limit?: number;
}) {
  return [
    input.workspaceId,
    input.userId,
    input.preferenceRevision,
    input.providerMode,
    input.topic ?? "all",
    input.limit ?? "default",
  ].join("|");
}

function interactionRevision(summary: HeadlineFlowInteractionSummary) {
  const actionKeys = Object.entries(summary.actionCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([action, count]) => `${action}:${count}`)
    .join(",");
  const topicKeys = Object.entries(summary.topicCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([topic, count]) => `${topic}:${count}`)
    .join(",");
  return `${summary.totalEvents}|${actionKeys}|${topicKeys}`;
}

function preferenceRevision(preferences: Array<{ updatedAt: string }>) {
  if (!preferences.length) {
    return "none";
  }
  const latestUpdatedAt = preferences.reduce((latest, preference) => preference.updatedAt > latest ? preference.updatedAt : latest, "");
  return `${preferences.length}:${latestUpdatedAt}`;
}

function preferenceIsResolved(preference: { resolvedAt: string | null; restoredAt: string | null }) {
  if (!preference.resolvedAt) {
    return false;
  }
  return !preference.restoredAt || preference.restoredAt <= preference.resolvedAt;
}

async function buildPreferenceProfile(input: {
  workspaceId: string;
  preferences: Array<{
    eventId: string;
    savedAt: string | null;
    mutedAt: string | null;
    resolvedAt: string | null;
    restoredAt: string | null;
  }>;
  interactions?: HeadlineFlowInteractionSummary;
}) {
  if (!input.preferences.length && !input.interactions?.totalEvents) {
    return undefined;
  }
  const events = await headlineFlowEventRegistryRepository.listByWorkspace(input.workspaceId);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const topicWeights: Partial<Record<HeadlineFlowTopic, number>> = {};
  const interactionTopicWeights: Partial<Record<HeadlineFlowTopic, number>> = {};
  const mutedTopicWeights: Partial<Record<HeadlineFlowTopic, number>> = {};
  const savedEventIds: string[] = [];

  for (const preference of input.preferences) {
    const event = eventsById.get(preference.eventId);
    if (!event || preference.mutedAt || preferenceIsResolved(preference)) {
      continue;
    }
    if (preference.savedAt) {
      savedEventIds.push(preference.eventId);
      topicWeights[event.topic] = Math.min(8, (topicWeights[event.topic] ?? 0) + 4);
    }
  }

  for (const [topic, count] of Object.entries(input.interactions?.topicCounts ?? {})) {
    interactionTopicWeights[topic as HeadlineFlowTopic] = Math.min(6, Math.max(0, count));
  }
  for (const [topic, count] of Object.entries(input.interactions?.savedTopicCounts ?? {})) {
    interactionTopicWeights[topic as HeadlineFlowTopic] = Math.min(8, (interactionTopicWeights[topic as HeadlineFlowTopic] ?? 0) + count * 2);
  }
  for (const [topic, count] of Object.entries(input.interactions?.mutedTopicCounts ?? {})) {
    mutedTopicWeights[topic as HeadlineFlowTopic] = Math.min(18, count * 6);
  }

  if (
    !savedEventIds.length &&
    !Object.keys(topicWeights).length &&
    !Object.keys(interactionTopicWeights).length &&
    !Object.keys(mutedTopicWeights).length
  ) {
    return undefined;
  }
  return {
    topicWeights,
    interactionTopicWeights,
    mutedTopicWeights,
    savedEventIds,
    interactionEventCount: input.interactions?.totalEvents ?? 0,
  };
}

function cloneFeedRouteData(data: FeedRouteData): FeedRouteData {
  return structuredClone(data);
}

export function clearHeadlineFlowFeedCacheForTests() {
  feedCache.clear();
  resetHeadlineFlowFeedHealthForTests();
}

async function withAutoFallbackTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`provider_timeout_${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function buildStaleCacheResponse(input: {
  cached: FeedCacheEntry;
  cacheAgeMs: number;
  ttlMs: number;
  staleMaxAgeMs: number;
  fallbackReason: string;
  providerError: string | null;
}) {
  const staleData = cloneFeedRouteData(input.cached.data);
  staleData.diagnostics.cache = {
    status: "stale",
    ageMs: input.cacheAgeMs,
    ttlMs: input.ttlMs,
    staleMaxAgeMs: input.staleMaxAgeMs,
  };
  staleData.diagnostics.fallbackReason = input.fallbackReason;
  staleData.diagnostics.providerError = input.providerError;
  return staleData;
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    const url = new URL(request.url);
    const query = querySchema.parse({
      topic: url.searchParams.get("topic") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      provider: url.searchParams.get("provider") || undefined,
    });
    const providerMode = resolveHeadlineFlowProviderMode(query.provider);
    if (providerMode === "fixture" && !headlineFlowFixtureProviderEnabled()) {
      throw new AppError(403, "fixture_provider_disabled", "Fixture Headline Flow data is disabled in this environment.");
    }
    const ttlMs = getHeadlineFlowFeedCacheTtlMs();
    const staleMaxAgeMs = getHeadlineFlowStaleCacheMaxAgeMs();
    const now = new Date();
    const interactionSummary = await headlineFlowInteractionRepository.summarize({
      workspaceId: user.workspaceId,
      userId: user.id,
      since: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    });
    const userPreferences = await headlineFlowEventPreferenceRepository.listUserPreferences({
      workspaceId: user.workspaceId,
      userId: user.id,
    });
    const preferenceProfile = await buildPreferenceProfile({
      workspaceId: user.workspaceId,
      preferences: userPreferences,
      interactions: interactionSummary,
    });
    const key = cacheKey({
      workspaceId: user.workspaceId,
      userId: user.id,
      preferenceRevision: `${preferenceRevision(userPreferences)}:${interactionRevision(interactionSummary)}`,
      providerMode,
      topic: query.topic,
      limit: query.limit,
    });
    const cached = feedCache.get(key);
    const cacheAgeMs = cached ? Date.now() - cached.createdAt : 0;
    if (ttlMs > 0 && cached && cacheAgeMs < ttlMs) {
      const cachedData = cloneFeedRouteData(cached.data);
      cachedData.diagnostics.cache = {
        status: "hit",
        ageMs: cacheAgeMs,
        ttlMs,
        staleMaxAgeMs,
      };
      return apiSuccess(cachedData);
    }

    enforceRateLimit(`headline-flow:feed:${user.workspaceId}:${getClientIp(request)}`, {
      limit: getSourceRateLimit(),
      windowMs: getDefaultWindowMs(),
    });

    const selection = selectHeadlineFlowProvider(providerMode);
    let provider = selection.provider;
    let fallbackReason = selection.fallbackReason;
    let providerError: string | null = null;
    let feed;
    const buildFeedForProvider = (selectedProvider: typeof provider) =>
      buildHeadlineFlowFeed({
        provider: selectedProvider,
        topic: query.topic,
        limit: query.limit,
        eventRegistry: {
          workspaceId: user.workspaceId,
          repository: headlineFlowEventRegistryRepository,
        },
        eventPreferences: {
          workspaceId: user.workspaceId,
          userId: user.id,
          repository: headlineFlowEventPreferenceRepository,
        },
        preferenceProfile,
      });

    try {
      const buildPromise = buildFeedForProvider(provider);
      feed = providerMode === "auto" && provider.id !== "fixture"
        ? await withAutoFallbackTimeout(buildPromise, getHeadlineFlowAutoFallbackTimeoutMs())
        : await buildPromise;

      if (providerMode === "auto" && provider.id !== "fixture" && feed.diagnostics.storyCount === 0) {
        if (selection.webSearchConfigured && provider.id !== "web_search") {
          try {
            const webSearchProvider = new OpenAIWebSearchNewsProvider();
            const webSearchFeed = await withAutoFallbackTimeout(
              buildFeedForProvider(webSearchProvider),
              getHeadlineFlowAutoFallbackTimeoutMs(),
            );
            provider = webSearchProvider;
            feed = webSearchFeed;
            fallbackReason = webSearchFeed.diagnostics.storyCount > 0 ? "rss_empty_web_search_fill" : "provider_empty";
          } catch (error) {
            providerError = error instanceof Error ? error.message : String(error);
            fallbackReason = "rss_empty_web_search_error";
          }
        }
      }

      if (providerMode === "auto" && provider.id !== "fixture" && feed.diagnostics.storyCount === 0) {
        if (cached && staleMaxAgeMs > 0 && cacheAgeMs <= staleMaxAgeMs) {
          logger.warn("Headline Flow served stale cached feed after empty provider response", {
            workspaceId: user.workspaceId,
            providerMode,
            selectedProvider: selection.selectedProvider,
            cacheAgeMs,
          });
          return apiSuccess(buildStaleCacheResponse({
            cached,
            cacheAgeMs,
            ttlMs,
            staleMaxAgeMs,
            fallbackReason: "provider_empty_stale_cache",
            providerError: null,
          }));
        }
        fallbackReason = "provider_empty";
        if (!headlineFlowFixtureProviderEnabled()) {
          throw new AppError(503, "headline_flow_provider_empty", "Headline Flow provider returned no stories and fixture fallback is disabled.");
        }
        provider = new FixtureNewsProvider();
        feed = await buildFeedForProvider(provider);
      }
    } catch (error) {
      providerError = error instanceof Error ? error.message : String(error);
      recordHeadlineFlowFeedFailure(error);
      if (providerMode === "auto" && selection.webSearchConfigured && provider.id !== "web_search") {
        try {
          const webSearchProvider = new OpenAIWebSearchNewsProvider();
          provider = webSearchProvider;
          feed = await withAutoFallbackTimeout(
            buildFeedForProvider(webSearchProvider),
            getHeadlineFlowAutoFallbackTimeoutMs(),
          );
          fallbackReason = feed.diagnostics.storyCount > 0 ? "rss_error_web_search_fill" : "provider_empty";
          providerError = feed.diagnostics.storyCount > 0 ? null : providerError;
        } catch (webSearchError) {
          providerError = webSearchError instanceof Error ? webSearchError.message : String(webSearchError);
          fallbackReason = "rss_error_web_search_error";
        }
      }
      if (feed && feed.diagnostics.storyCount > 0) {
        recordHeadlineFlowFeedSuccess(feed, { fixtureBacked: provider.id === "fixture" });
      } else if (cached && staleMaxAgeMs > 0 && cacheAgeMs <= staleMaxAgeMs) {
        logger.warn("Headline Flow served stale cached feed after provider failure", {
          workspaceId: user.workspaceId,
          providerMode,
          selectedProvider: selection.selectedProvider,
          cacheAgeMs,
          error: providerError,
        });
        return apiSuccess(buildStaleCacheResponse({
          cached,
          cacheAgeMs,
          ttlMs,
          staleMaxAgeMs,
          fallbackReason: "provider_error_stale_cache",
          providerError,
        }));
      }
      if (!feed && cached && staleMaxAgeMs > 0 && cacheAgeMs <= staleMaxAgeMs) {
        logger.warn("Headline Flow served stale cached feed after provider failure", {
          workspaceId: user.workspaceId,
          providerMode,
          selectedProvider: selection.selectedProvider,
          cacheAgeMs,
          error: providerError,
        });
        return apiSuccess(buildStaleCacheResponse({
          cached,
          cacheAgeMs,
          ttlMs,
          staleMaxAgeMs,
          fallbackReason: "provider_error_stale_cache",
          providerError,
        }));
      }
      if (!feed && providerMode !== "auto") {
        throw error;
      }

      if (!feed) {
        fallbackReason = fallbackReason ?? "provider_error";
      }
      if (!feed && !headlineFlowFixtureProviderEnabled()) {
        throw new AppError(503, "headline_flow_provider_unavailable", "Headline Flow provider is unavailable and fixture fallback is disabled.", {
          providerError,
        });
      }
      if (!feed) {
        provider = new FixtureNewsProvider();
        feed = await buildFeedForProvider(provider);
      }
    }

    const data: FeedRouteData = {
      mode: provider.id,
      diagnostics: {
        requestedProvider: selection.requestedProvider,
        configuredProvider: selection.configuredProvider,
        selectedProvider: provider.id,
        fallbackReason,
        providerError,
        webSearchConfigured: selection.webSearchConfigured,
        provider: provider.getRuntimeDiagnostics?.() ?? null,
        cache: {
          status: ttlMs > 0 ? "miss" : "disabled",
          ageMs: 0,
          ttlMs,
          staleMaxAgeMs,
        },
      },
      requestedProvider: selection.requestedProvider,
      workspaceId: user.workspaceId,
      feed,
    };

    if (ttlMs > 0) {
      feedCache.set(key, {
        createdAt: Date.now(),
        data: cloneFeedRouteData(data),
      });
    }
    recordHeadlineFlowFeedSuccess(feed, { fixtureBacked: provider.id === "fixture" });
    logger.info("Headline Flow feed built", {
      workspaceId: user.workspaceId,
      providerId: provider.id,
      requestedProvider: selection.requestedProvider,
      storyCount: feed.diagnostics.storyCount,
      acceptedArticles: feed.diagnostics.acceptedArticles,
      rejectedArticles: feed.diagnostics.rejectedArticles,
      duplicateArticles: feed.diagnostics.duplicateArticles,
      fallbackReason,
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Unable to build Headline Flow feed.");
  }
}
