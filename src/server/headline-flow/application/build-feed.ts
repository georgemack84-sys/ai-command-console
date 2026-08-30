import type { HeadlineFlowFeed, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";
import { normalizeArticleCandidates } from "@/src/server/headline-flow/domain/article-normalization";
import { buildStories, buildStoryPackage, dedupeArticles } from "@/src/server/headline-flow/domain/story-builder";
import { ingestHeadlineFlowStoriesIntoEventRegistry } from "@/src/server/headline-flow/event-registry/event-registry-service";
import { summarizePreference, type HeadlineFlowEventPreferenceRepository } from "@/src/server/headline-flow/event-registry/event-preferences";
import type { HeadlineFlowEventRegistryRepository } from "@/src/server/headline-flow/event-registry/types";
import type { NewsProvider } from "@/src/server/headline-flow/providers/types";

const DEFAULT_EVENT_REGISTRY_TIMEOUT_MS = 750;

type PreferenceProfile = {
  topicWeights?: Partial<Record<HeadlineFlowTopic, number>>;
  interactionTopicWeights?: Partial<Record<HeadlineFlowTopic, number>>;
  mutedTopicWeights?: Partial<Record<HeadlineFlowTopic, number>>;
  savedEventIds?: string[];
  interactionEventCount?: number;
};

type PersonalizationDiagnostics = NonNullable<HeadlineFlowFeed["diagnostics"]["personalization"]>;

async function withEventRegistryTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`event_registry_timeout_${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function clampScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function personalizePackages(packages: StoryPackage[], profile?: PreferenceProfile): {
  packages: StoryPackage[];
  diagnostics: PersonalizationDiagnostics;
} {
  const skippedDiagnostics: PersonalizationDiagnostics = {
    status: "skipped",
    savedEventCount: profile?.savedEventIds?.length ?? 0,
    topicWeights: profile?.topicWeights ?? {},
    interactionEventCount: profile?.interactionEventCount ?? 0,
    interactionTopicWeights: profile?.interactionTopicWeights ?? {},
    mutedTopicWeights: profile?.mutedTopicWeights ?? {},
    boostedStories: 0,
    penalizedStories: 0,
    reorderedStories: 0,
  };
  if (!profile) {
    return {
      packages: packages.map((storyPackage, index) => ({
        ...storyPackage,
        displayMetadata: {
          ...storyPackage.displayMetadata,
          rankingAudit: {
            ...storyPackage.displayMetadata.rankingAudit,
            originalRank: index + 1,
            personalizedRank: index + 1,
          },
        },
      })),
      diagnostics: skippedDiagnostics,
    };
  }
  const savedEventIds = new Set(profile.savedEventIds ?? []);
  const rankedPackages = packages
    .map((storyPackage, index) => {
      const savedTopicBoost = Math.max(0, profile.topicWeights?.[storyPackage.topic] ?? 0);
      const interactionBoost = Math.max(0, profile.interactionTopicWeights?.[storyPackage.topic] ?? 0);
      const mutedTopicPenalty = Math.max(0, profile.mutedTopicWeights?.[storyPackage.topic] ?? 0);
      const topicBoost = savedTopicBoost + interactionBoost;
      const eventBoost = savedEventIds.has(storyPackage.eventId) ? 10 : 0;
      const totalBoost = Math.max(-18, Math.min(18, topicBoost + eventBoost - mutedTopicPenalty));
      const finalScore = clampScore(storyPackage.displayMetadata.briefingScore + totalBoost);
      const reasons = [];
      if (savedTopicBoost > 0) {
        reasons.push(`Saved ${storyPackage.topic} events boosted this story`);
      }
      if (interactionBoost > 0) {
        reasons.push(`Recent ${storyPackage.topic} interactions boosted this story`);
      }
      if (eventBoost > 0) {
        reasons.push("You saved this event");
      }
      if (mutedTopicPenalty > 0) {
        reasons.push(`Muted ${storyPackage.topic} interactions reduced this story`);
      }
      return {
        storyPackage: totalBoost !== 0
          ? {
              ...storyPackage,
              displayMetadata: {
                ...storyPackage.displayMetadata,
                briefingScore: finalScore,
                prioritySignals: Array.from(new Set([
                  "Personalized match",
                  ...storyPackage.displayMetadata.prioritySignals,
                ])).slice(0, 4),
                personalizationReason: reasons.join("; ") + ".",
                rankingAudit: {
                  ...storyPackage.displayMetadata.rankingAudit,
                  personalizationBoost: totalBoost,
                  finalScore,
                  originalRank: index + 1,
                },
              },
            }
          : {
              ...storyPackage,
              displayMetadata: {
                ...storyPackage.displayMetadata,
                rankingAudit: {
                  ...storyPackage.displayMetadata.rankingAudit,
                  originalRank: index + 1,
                  finalScore: storyPackage.displayMetadata.briefingScore,
                },
              },
            },
        score: finalScore,
        index,
      };
    })
    .sort((a, b) => {
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return a.index - b.index;
    })
    .map(({ storyPackage }, index) => ({
      ...storyPackage,
      displayMetadata: {
        ...storyPackage.displayMetadata,
        rankingAudit: {
          ...storyPackage.displayMetadata.rankingAudit,
          personalizedRank: index + 1,
        },
      },
    }));

  const boostedStories = rankedPackages.filter((storyPackage) => storyPackage.displayMetadata.rankingAudit.personalizationBoost > 0).length;
  const penalizedStories = rankedPackages.filter((storyPackage) => storyPackage.displayMetadata.rankingAudit.personalizationBoost < 0).length;
  return {
    packages: rankedPackages,
    diagnostics: {
      status: boostedStories > 0 || penalizedStories > 0 ? "applied" : "skipped",
      savedEventCount: profile.savedEventIds?.length ?? 0,
      topicWeights: profile.topicWeights ?? {},
      interactionEventCount: profile.interactionEventCount ?? 0,
      interactionTopicWeights: profile.interactionTopicWeights ?? {},
      mutedTopicWeights: profile.mutedTopicWeights ?? {},
      boostedStories,
      penalizedStories,
      reorderedStories: rankedPackages.filter((storyPackage) =>
        storyPackage.displayMetadata.rankingAudit.originalRank !== storyPackage.displayMetadata.rankingAudit.personalizedRank,
      ).length,
    },
  };
}

export async function buildHeadlineFlowFeed(input: {
  provider: NewsProvider;
  now?: Date;
  limit?: number;
  topic?: string;
  eventRegistry?: {
    workspaceId: string;
    repository: HeadlineFlowEventRegistryRepository;
    required?: boolean;
    timeoutMs?: number;
  };
  eventPreferences?: {
    workspaceId: string;
    userId: string;
    repository: HeadlineFlowEventPreferenceRepository;
  };
  preferenceProfile?: PreferenceProfile;
}): Promise<HeadlineFlowFeed> {
  const now = input.now ?? new Date();
  const candidates = await input.provider.fetchLatest({
    now,
    topic: input.topic,
    limit: input.limit,
  });
  const normalized = normalizeArticleCandidates(candidates, now);
  const deduped = dedupeArticles(normalized.articles);
  const stories = buildStories(deduped.articles, now);
  let packages = stories.map((story) => buildStoryPackage(story, now));
  let eventRegistryDiagnostics: HeadlineFlowFeed["diagnostics"]["eventRegistry"];
  let hiddenEvents = 0;

  if (input.eventRegistry) {
    try {
      const storyInputs = packages.map((storyPackage, index) => ({
        storyPackage,
        canonicalStory: stories[index],
      }));
      const registryResult = await withEventRegistryTimeout(
        ingestHeadlineFlowStoriesIntoEventRegistry({
          workspaceId: input.eventRegistry.workspaceId,
          stories: storyInputs,
          repository: input.eventRegistry.repository,
          now,
        }),
        input.eventRegistry.timeoutMs ?? DEFAULT_EVENT_REGISTRY_TIMEOUT_MS,
      );
      const eventIdsByPackage = new Map(
        registryResult.packageEvents.map((packageEvent) => [packageEvent.storyPackageId, packageEvent]),
      );
      packages = packages.map((storyPackage) => ({
        ...storyPackage,
        eventId: eventIdsByPackage.get(storyPackage.id)?.eventId ?? storyPackage.eventId,
        eventMetadata: eventIdsByPackage.get(storyPackage.id)
          ? {
              status: eventIdsByPackage.get(storyPackage.id)!.eventStatus,
              version: eventIdsByPackage.get(storyPackage.id)!.eventVersion,
              updateReasons: eventIdsByPackage.get(storyPackage.id)!.updateReasons,
              updateSummary: eventIdsByPackage.get(storyPackage.id)!.updateSummary,
            }
          : undefined,
      }));
      if (input.eventPreferences) {
        const eventIds = packages.map((storyPackage) => storyPackage.eventId);
        const preferences = await input.eventPreferences.repository.listPreferences({
          workspaceId: input.eventPreferences.workspaceId,
          userId: input.eventPreferences.userId,
          eventIds,
        });
        const hiddenEventIds = await input.eventPreferences.repository.listHiddenEventIds({
          workspaceId: input.eventPreferences.workspaceId,
          userId: input.eventPreferences.userId,
          eventIds,
        });
        hiddenEvents = hiddenEventIds.size;
        packages = packages
          .filter((storyPackage) => !hiddenEventIds.has(storyPackage.eventId))
          .map((storyPackage) => ({
            ...storyPackage,
            userPreference: summarizePreference(preferences.get(storyPackage.eventId) ?? null),
          }));
      }
      eventRegistryDiagnostics = {
        status: "updated",
        createdEvents: registryResult.created.length,
        updatedEvents: registryResult.updated.length,
        unchangedEvents: registryResult.unchanged.length,
        resolvedEvents: registryResult.resolved.length,
        hiddenEvents,
        mappedStories: registryResult.packageEvents.length,
        error: null,
      };
    } catch (error) {
      if (input.eventRegistry.required) {
        throw error;
      }
      eventRegistryDiagnostics = {
        status: "unavailable",
        createdEvents: 0,
        updatedEvents: 0,
        unchangedEvents: 0,
        resolvedEvents: 0,
        hiddenEvents: 0,
        mappedStories: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const personalizedResult = personalizePackages(packages, input.preferenceProfile);
  packages = personalizedResult.packages.slice(0, input.limit ?? personalizedResult.packages.length);
  const personalizationDiagnostics = personalizedResult.diagnostics;

  return {
    generatedAt: now.toISOString(),
    providerId: input.provider.id,
    stories: packages,
    diagnostics: {
      receivedArticles: candidates.length,
      acceptedArticles: normalized.articles.length,
      rejectedArticles: normalized.rejections.length,
      duplicateArticles: deduped.duplicateCount,
      storyCount: packages.length,
      rejections: normalized.rejections,
      ...(eventRegistryDiagnostics ? { eventRegistry: eventRegistryDiagnostics } : {}),
      personalization: personalizationDiagnostics,
    },
  };
}
